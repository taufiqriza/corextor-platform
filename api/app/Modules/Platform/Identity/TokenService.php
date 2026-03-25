<?php

namespace App\Modules\Platform\Identity;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;

class TokenService
{
    /**
     * Issue a JWT access token.
     *
     * Claims follow the spec in login_flow.md:
     * sub, current_company_id, role, active_products, session_id
     */
    public static function issueAccessToken(
        int $userId,
        ?int $companyId,
        string $role,
        array $activeProducts,
        int $sessionId,
    ): array {
        $ttl = (int) env('JWT_TTL', 900);
        $now = time();

        $payload = [
            'iss' => 'corextor-platform',
            'sub' => $userId,
            'current_company_id' => $companyId,
            'role' => $role,
            'active_products' => $activeProducts,
            'session_id' => $sessionId,
            'iat' => $now,
            'exp' => $now + $ttl,
        ];

        $token = JWT::encode($payload, env('JWT_SECRET'), 'HS256');

        return [
            'token' => $token,
            'token_type' => 'Bearer',
            'expires_in' => $ttl,
        ];
    }

    /**
     * Decode and validate a JWT access token.
     *
     * @throws \Exception if token is invalid or expired
     */
    public static function decodeAccessToken(string $token): object
    {
        return JWT::decode($token, new Key(env('JWT_SECRET'), 'HS256'));
    }

    /**
     * Generate a cryptographically random refresh token.
     */
    public static function generateRefreshToken(): string
    {
        return bin2hex(random_bytes(32));
    }

    /**
     * Hash a refresh token for storage.
     */
    public static function hashRefreshToken(string $token): string
    {
        return hash('sha256', $token);
    }
}
