<?php

namespace App\Modules\Attendance\Services;

use App\Modules\Attendance\Models\AttendanceUser;
use App\Modules\Platform\Audit\AuditService;
use App\Modules\Platform\Identity\TokenService;
use App\Modules\Platform\Identity\User;
use App\Modules\Platform\Membership\MembershipService;
use App\Modules\Platform\Session\SessionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class PinService
{
    /**
     * Hash a PIN for storage.
     */
    public static function hashPin(string $pin): string
    {
        return Hash::make($pin);
    }

    /**
     * Generate a lookup hash for PIN login.
     * Combines company_id + pin to create a unique lookup key.
     */
    public static function generatePinLookup(int $companyId, string $pin): string
    {
        return hash('sha256', $companyId . ':' . $pin);
    }

    /**
     * Generate a global lookup hash for PIN-only login (no company context).
     * Uses just the PIN — requires PINs to be unique across all companies.
     */
    public static function generateGlobalPinLookup(string $pin): string
    {
        return hash('sha256', 'global:' . $pin);
    }

    /**
     * Reset PIN for an attendance user.
     */
    public static function resetPin(int $attendanceUserId, int $companyId, string $newPin): AttendanceUser
    {
        $attendanceUser = AttendanceUser::forCompany($companyId)->findOrFail($attendanceUserId);

        // Check if PIN is already in use by another user (global uniqueness)
        $globalLookup = self::generateGlobalPinLookup($newPin);
        $existing = AttendanceUser::where('global_pin_lookup', $globalLookup)
            ->where('id', '!=', $attendanceUser->id)
            ->first();

        if ($existing) {
            throw new \RuntimeException('PIN ini sudah digunakan oleh karyawan lain. Silakan gunakan PIN yang berbeda.');
        }

        $attendanceUser->update([
            'pin_hash' => self::hashPin($newPin),
            'pin_lookup' => self::generatePinLookup($companyId, $newPin),
            'global_pin_lookup' => $globalLookup,
        ]);

        AuditService::attendance('attendance_user.pin_reset', [
            'attendance_user_id' => $attendanceUser->id,
        ], $companyId);

        return $attendanceUser;
    }

    /**
     * Authenticate via PIN login (with company context).
     *
     * Flow from login_flow.md:
     * 1. Lookup attendance_user by company_id + pin_lookup
     * 2. Verify pin_hash
     * 3. Cross-check platform user + membership + subscription
     * 4. Issue access token + refresh session
     */
    public static function loginWithPin(
        int $companyId,
        string $pin,
        Request $request,
    ): ?array {
        // 1. Find attendance user via pin_lookup
        $pinLookup = self::generatePinLookup($companyId, $pin);
        $attendanceUser = AttendanceUser::forCompany($companyId)
            ->where('pin_lookup', $pinLookup)
            ->first();

        if (! $attendanceUser) {
            AuditService::attendance('auth.pin_login_failed', [
                'reason' => 'invalid_pin',
            ], $companyId);
            return null;
        }

        return self::completePinLogin($attendanceUser, $companyId, $pin, $request);
    }

    /**
     * Authenticate via PIN only (auto-detect company).
     *
     * Uses global_pin_lookup (sha256 of just the PIN) to find the
     * attendance user without needing a company code.
     * Like mbanking — just enter PIN, system finds you.
     */
    public static function loginWithPinOnly(
        string $pin,
        Request $request,
    ): ?array {
        // 1. Find attendance user via global_pin_lookup
        $globalLookup = self::generateGlobalPinLookup($pin);
        $attendanceUser = AttendanceUser::where('global_pin_lookup', $globalLookup)
            ->where('status', 'active')
            ->first();

        if (! $attendanceUser) {
            return null;
        }

        return self::completePinLogin(
            $attendanceUser,
            $attendanceUser->company_id,
            $pin,
            $request,
        );
    }

    /**
     * Complete PIN login after attendance user is resolved.
     */
    private static function completePinLogin(
        AttendanceUser $attendanceUser,
        int $companyId,
        string $pin,
        Request $request,
    ): ?array {
        // 2. Verify PIN hash
        if (! Hash::check($pin, $attendanceUser->pin_hash)) {
            AuditService::attendance('auth.pin_login_failed', [
                'reason' => 'pin_hash_mismatch',
            ], $companyId);
            return null;
        }

        // 3. Check attendance profile status
        if (! $attendanceUser->isActive()) {
            AuditService::attendance('auth.pin_login_failed', [
                'reason' => 'profile_inactive',
                'attendance_user_id' => $attendanceUser->id,
            ], $companyId);
            return null;
        }

        // 4. Cross-DB validation — platform user must exist and be active
        $platformUser = User::find($attendanceUser->platform_user_id);
        if (! $platformUser || ! $platformUser->isActive()) {
            AuditService::consistencyFailure(
                'PIN login: platform user missing or inactive for attendance_user',
                ['attendance_user_id' => $attendanceUser->id],
                $companyId,
            );
            return null;
        }

        // 5. Cross-DB validation — company membership must be active
        $membership = MembershipService::getActiveMembership(
            $attendanceUser->platform_user_id,
            $companyId,
        );
        if (! $membership) {
            AuditService::consistencyFailure(
                'PIN login: no active membership for attendance_user',
                ['attendance_user_id' => $attendanceUser->id],
                $companyId,
            );
            return null;
        }

        // 6. Validate attendance subscription
        $hasAttendance = \App\Modules\Platform\Subscription\SubscriptionService::hasActiveProduct(
            $companyId,
            'attendance',
        );
        if (! $hasAttendance) {
            AuditService::attendance('auth.pin_login_failed', [
                'reason' => 'no_attendance_subscription',
            ], $companyId);
            return null;
        }

        // 7. Build response — issue access token + refresh session
        $company = \App\Modules\Platform\Company\Company::findOrFail($companyId);
        $role = MembershipService::resolveEffectiveRole($platformUser, $companyId);
        $activeProducts = MembershipService::resolveActiveProducts($platformUser, $company);

        $sessionData = SessionService::createSession(
            userId: $platformUser->id,
            companyId: $companyId,
            request: $request,
        );

        $tokenData = TokenService::issueAccessToken(
            userId: $platformUser->id,
            companyId: $companyId,
            role: $role,
            activeProducts: $activeProducts,
            sessionId: $sessionData['session']->id,
        );

        AuditService::attendance('auth.pin_login', [
            'attendance_user_id' => $attendanceUser->id,
            'method' => 'pin',
        ], $companyId);

        return [
            'token_data' => $tokenData,
            'refresh_token' => $sessionData['raw_token'],
            'user' => [
                'id' => $platformUser->id,
                'name' => $platformUser->name,
                'email' => $platformUser->email ?? '',
                'role' => $role,
                'current_company_id' => $companyId,
                'active_products' => $activeProducts,
                'attendance_user_id' => $attendanceUser->id,
                'branch_id' => $attendanceUser->branch_id,
            ],
        ];
    }
}
