<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Modules\Platform\Identity\TokenService;
use App\Support\ApiResponse;

class JwtAuth
{
    /**
     * Validate JWT access token from Authorization header.
     *
     * Sets request attributes for downstream use:
     * - auth_user_id
     * - auth_company_id
     * - auth_role
     * - auth_active_products
     * - auth_session_id
     */
    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();

        if (! $token) {
            return ApiResponse::unauthenticated('Access token required');
        }

        try {
            $claims = TokenService::decodeAccessToken($token);
        } catch (\Firebase\JWT\ExpiredException $e) {
            return ApiResponse::unauthenticated('Token expired');
        } catch (\Throwable $e) {
            return ApiResponse::unauthenticated('Invalid token');
        }

        // Set claims on request for controllers/services
        $request->attributes->set('auth_user_id', $claims->sub);
        $request->attributes->set('auth_company_id', $claims->current_company_id);
        $request->attributes->set('auth_role', $claims->role);
        $request->attributes->set('auth_active_products', $claims->active_products ?? []);
        $request->attributes->set('auth_session_id', $claims->session_id);

        return $next($request);
    }
}
