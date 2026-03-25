<?php

namespace App\Modules\Platform\Session;

use App\Modules\Platform\Identity\TokenService;
use Illuminate\Http\Request;

class SessionService
{
    /**
     * Create a new refresh session and return the raw token.
     */
    public static function createSession(
        int $userId,
        ?int $companyId,
        Request $request,
    ): array {
        $rawToken = TokenService::generateRefreshToken();
        $ttl = (int) config('app.jwt_refresh_ttl', 604800); // 7 days

        $session = RefreshSession::create([
            'user_id' => $userId,
            'company_id' => $companyId,
            'session_token_hash' => TokenService::hashRefreshToken($rawToken),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'expires_at' => now()->addSeconds($ttl),
            'created_at' => now(),
        ]);

        return [
            'session' => $session,
            'raw_token' => $rawToken,
        ];
    }

    /**
     * Validate a refresh token and return the session if valid.
     */
    public static function validateRefreshToken(string $rawToken): ?RefreshSession
    {
        $hash = TokenService::hashRefreshToken($rawToken);

        $session = RefreshSession::where('session_token_hash', $hash)
            ->whereNull('revoked_at')
            ->where('expires_at', '>', now())
            ->first();

        if (! $session) {
            return null;
        }

        // Validate that the user and company are still active
        if (! $session->user || ! $session->user->isActive()) {
            return null;
        }

        if ($session->company_id !== null) {
            if (! $session->company || ! $session->company->isActive()) {
                return null;
            }
        } elseif (! $session->user->isInternalTeam()) {
            return null;
        }

        return $session;
    }

    /**
     * Revoke a specific refresh session.
     */
    public static function revokeSession(int $sessionId): void
    {
        RefreshSession::where('id', $sessionId)->update([
            'revoked_at' => now(),
        ]);
    }

    /**
     * Revoke ALL refresh sessions for a user (global logout).
     */
    public static function revokeAllUserSessions(int $userId): int
    {
        return RefreshSession::where('user_id', $userId)
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);
    }

    /**
     * Build and set the refresh cookie.
     */
    public static function makeRefreshCookie(string $rawToken): \Symfony\Component\HttpFoundation\Cookie
    {
        $ttl = (int) config('app.jwt_refresh_ttl', 604800);

        return cookie(
            name: 'corextor_refresh',
            value: $rawToken,
            minutes: (int) ($ttl / 60),
            path: '/',
            domain: self::getCookieDomain(),
            secure: app()->environment('production'),
            httpOnly: true,
            sameSite: 'Lax',
        );
    }

    /**
     * Make an expired cookie to clear the refresh token.
     */
    public static function forgetRefreshCookie(): \Symfony\Component\HttpFoundation\Cookie
    {
        return cookie(
            name: 'corextor_refresh',
            value: '',
            minutes: -1,
            path: '/',
            domain: self::getCookieDomain(),
            secure: app()->environment('production'),
            httpOnly: true,
            sameSite: 'Lax',
        );
    }

    /**
     * Get cookie domain for SSO across subdomains.
     */
    private static function getCookieDomain(): ?string
    {
        $configuredDomain = config('app.refresh_cookie_domain');
        if ($configuredDomain) {
            return (string) $configuredDomain;
        }

        // In production: .corextor.com (shared across all subdomains)
        // In local: null (localhost only)
        if (app()->environment('production')) {
            return '.corextor.com';
        }

        return null;
    }
}
