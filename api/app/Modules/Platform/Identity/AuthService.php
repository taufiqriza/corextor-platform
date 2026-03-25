<?php

namespace App\Modules\Platform\Identity;

use App\Modules\Platform\Company\Company;
use App\Modules\Platform\Membership\MembershipService;
use App\Modules\Platform\Session\SessionService;
use App\Modules\Platform\Audit\AuditService;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AuthService
{
    /**
     * Authenticate user via email + password.
     *
     * Returns token data + sets refresh session,
     * or null if authentication fails.
     */
    public static function loginWithEmail(
        string $email,
        string $password,
        Request $request,
    ): ?array {
        // 1. Find user
        $user = User::where('email', $email)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            AuditService::platform('auth.login_failed', [
                'email' => $email,
                'reason' => 'invalid_credentials',
            ]);
            return null;
        }

        // 2. Check user status
        if (! $user->isActive()) {
            AuditService::platform('auth.login_failed', [
                'email' => $email,
                'reason' => 'user_inactive',
            ]);
            return null;
        }

        // 3. Resolve company
        $company = MembershipService::resolveCurrentCompany($user);

        if (! $company && ! $user->isSuperAdmin()) {
            AuditService::platform('auth.login_failed', [
                'email' => $email,
                'reason' => 'no_active_company',
            ]);
            return null;
        }

        // Super admin without any company can still login
        // but they need a company context for the token
        if (! $company && $user->isSuperAdmin()) {
            // Create a minimal context for super admin
            return self::buildLoginResponse($user, null, $request);
        }

        return self::buildLoginResponse($user, $company, $request);
    }

    /**
     * Refresh an existing session using the refresh token.
     */
    public static function refreshSession(string $rawRefreshToken, Request $request): ?array
    {
        // 1. Validate refresh token
        $session = SessionService::validateRefreshToken($rawRefreshToken);

        if (! $session) {
            return null;
        }

        $user = $session->user;
        $company = $session->company;

        // 2. Re-validate user and company status
        if (! $user->isActive()) {
            SessionService::revokeSession($session->id);
            return null;
        }

        if (! $company->isActive()) {
            SessionService::revokeSession($session->id);
            return null;
        }

        // 3. Resolve role and products (may have changed since last login)
        $role = MembershipService::resolveEffectiveRole($user, $company->id);
        $activeProducts = MembershipService::resolveActiveProducts($user, $company);

        // 4. Issue new access token (keep same refresh session)
        $tokenData = TokenService::issueAccessToken(
            userId: $user->id,
            companyId: $company->id,
            role: $role,
            activeProducts: $activeProducts,
            sessionId: $session->id,
        );

        return [
            'token' => $tokenData['token'],
            'expires_in' => $tokenData['expires_in'],
            'active_products' => $activeProducts,
        ];
    }

    /**
     * Global logout — revoke ALL refresh sessions for the user.
     */
    public static function logout(int $userId): void
    {
        $revokedCount = SessionService::revokeAllUserSessions($userId);

        AuditService::platform('auth.logout', [
            'revoked_sessions' => $revokedCount,
        ]);
    }

    /**
     * Get user profile with company context.
     */
    public static function getCurrentUserProfile(int $userId, int $companyId): ?array
    {
        $user = User::find($userId);

        if (! $user || ! $user->isActive()) {
            return null;
        }

        $company = Company::active()->find($companyId);
        $role = MembershipService::resolveEffectiveRole($user, $companyId);
        $activeProducts = $company
            ? MembershipService::resolveActiveProducts($user, $company)
            : [];

        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar_url' => self::publicAvatarUrl($user->avatar_url),
                'role' => $role,
                'current_company_id' => $company?->id,
                'active_products' => $activeProducts,
            ],
            'company' => $company ? [
                'id' => $company->id,
                'code' => $company->code,
                'name' => $company->name,
                'status' => $company->status,
                'logo_url' => $company->logo_url,
            ] : null,
        ];
    }

    /**
     * Update current user profile.
     */
    public static function updateCurrentUserProfile(
        int $userId,
        array $data,
        ?int $companyId = null,
    ): array {
        $user = User::active()->find($userId);

        if (! $user) {
            throw new \RuntimeException('User tidak ditemukan atau tidak aktif.');
        }

        $nextEmail = strtolower(trim($data['email'] ?? ''));

        if ($nextEmail === '') {
            throw new \RuntimeException('Email wajib diisi.');
        }

        $emailExists = User::query()
            ->where('email', $nextEmail)
            ->where('id', '!=', $userId)
            ->exists();

        if ($emailExists) {
            throw new \RuntimeException('Email tersebut sudah digunakan akun lain.');
        }

        $user->update([
            'name' => trim((string) ($data['name'] ?? $user->name)),
            'email' => $nextEmail,
        ]);

        AuditService::platform('auth.profile_updated', [
            'updated_fields' => ['name', 'email'],
        ], $companyId);

        return self::getCurrentUserProfile($userId, $companyId ?? 0) ?? [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar_url' => self::publicAvatarUrl($user->avatar_url),
                'role' => $user->platform_role,
                'current_company_id' => $companyId,
                'active_products' => [],
            ],
            'company' => null,
        ];
    }

    /**
     * Change current user password.
     */
    public static function changeCurrentUserPassword(
        int $userId,
        string $currentPassword,
        string $newPassword,
        ?int $companyId = null,
    ): void {
        $user = User::active()->find($userId);

        if (! $user) {
            throw new \RuntimeException('User tidak ditemukan atau tidak aktif.');
        }

        if (! Hash::check($currentPassword, $user->password)) {
            throw new \RuntimeException('Password saat ini tidak sesuai.');
        }

        if (Hash::check($newPassword, $user->password)) {
            throw new \RuntimeException('Password baru harus berbeda dari password saat ini.');
        }

        $user->update([
            'password' => $newPassword,
        ]);

        AuditService::platform('auth.password_updated', [
            'updated_fields' => ['password'],
        ], $companyId);
    }

    /**
     * Upload and replace current user avatar.
     */
    public static function updateCurrentUserAvatar(
        int $userId,
        UploadedFile $file,
        ?int $companyId = null,
    ): array {
        $user = User::active()->find($userId);

        if (! $user) {
            throw new \RuntimeException('User tidak ditemukan atau tidak aktif.');
        }

        self::deleteStoredAvatarIfManaged($user->avatar_url);

        $extension = $file->getClientOriginalExtension() ?: $file->extension() ?: 'jpg';
        $path = $file->storeAs(
            "avatars/users/{$userId}",
            'avatar-'.time().'.'.$extension,
            'public',
        );

        $user->update([
            'avatar_url' => $path,
        ]);

        AuditService::platform('auth.avatar_updated', [
            'updated_fields' => ['avatar_url'],
        ], $companyId);

        return self::getCurrentUserProfile($userId, $companyId ?? 0) ?? [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar_url' => self::publicAvatarUrl($user->avatar_url),
                'role' => $user->platform_role,
                'current_company_id' => $companyId,
                'active_products' => [],
            ],
            'company' => null,
        ];
    }

    /**
     * Remove current user avatar.
     */
    public static function removeCurrentUserAvatar(
        int $userId,
        ?int $companyId = null,
    ): array {
        $user = User::active()->find($userId);

        if (! $user) {
            throw new \RuntimeException('User tidak ditemukan atau tidak aktif.');
        }

        self::deleteStoredAvatarIfManaged($user->avatar_url);

        $user->update([
            'avatar_url' => null,
        ]);

        AuditService::platform('auth.avatar_removed', [
            'updated_fields' => ['avatar_url'],
        ], $companyId);

        return self::getCurrentUserProfile($userId, $companyId ?? 0) ?? [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar_url' => null,
                'role' => $user->platform_role,
                'current_company_id' => $companyId,
                'active_products' => [],
            ],
            'company' => null,
        ];
    }

    // ── Private Helpers ──

    private static function buildLoginResponse(
        User $user,
        ?Company $company,
        Request $request,
    ): array {
        $companyId = $company?->id ?? 0;
        $role = MembershipService::resolveEffectiveRole($user, $companyId ?: null);
        $activeProducts = $company
            ? MembershipService::resolveActiveProducts($user, $company)
            : [];

        // Create refresh session
        $sessionData = SessionService::createSession(
            userId: $user->id,
            companyId: $companyId,
            request: $request,
        );

        // Issue access token
        $tokenData = TokenService::issueAccessToken(
            userId: $user->id,
            companyId: $companyId,
            role: $role ?? 'super_admin',
            activeProducts: $activeProducts,
            sessionId: $sessionData['session']->id,
        );

        // Audit log
        AuditService::platform('auth.login', [
            'method' => 'email',
        ], $companyId ?: null);

        return [
            'token_data' => $tokenData,
            'refresh_token' => $sessionData['raw_token'],
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar_url' => self::publicAvatarUrl($user->avatar_url),
                'role' => $role ?? 'super_admin',
                'current_company_id' => $companyId ?: null,
                'active_products' => $activeProducts,
                'company' => $company ? [
                    'id' => $company->id,
                    'code' => $company->code,
                    'name' => $company->name,
                    'status' => $company->status,
                    'logo_url' => $company->logo_url,
                ] : null,
            ],
        ];
    }

    public static function publicAvatarUrl(?string $storedValue): ?string
    {
        if (! $storedValue) {
            return null;
        }

        if (Str::startsWith($storedValue, ['http://', 'https://']) && ! str_contains($storedValue, '/storage/avatars/users/')) {
            return $storedValue;
        }

        $publicPath = self::extractManagedAvatarPath($storedValue);

        if (! $publicPath) {
            return $storedValue;
        }

        $request = request();
        $baseUrl = $request?->getSchemeAndHttpHost();

        if (! $baseUrl) {
            return '/storage/'.$publicPath;
        }

        return rtrim($baseUrl, '/').'/storage/'.$publicPath;
    }

    private static function deleteStoredAvatarIfManaged(?string $avatarUrl): void
    {
        $relativePath = self::extractManagedAvatarPath($avatarUrl);

        if ($relativePath) {
            Storage::disk('public')->delete($relativePath);
        }
    }

    private static function extractManagedAvatarPath(?string $value): ?string
    {
        if (! $value) {
            return null;
        }

        if (Str::startsWith($value, 'avatars/users/')) {
            return $value;
        }

        $path = parse_url($value, PHP_URL_PATH);

        if (! is_string($path) || ! str_contains($path, '/storage/avatars/users/')) {
            return null;
        }

        return ltrim(substr($path, strpos($path, '/storage/') + 9), '/');
    }
}
