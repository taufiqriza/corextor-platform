<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Modules\Platform\Company\Company;
use App\Modules\Platform\Subscription\SubscriptionService;
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

        $role = $claims->role;
        $companyId = $claims->current_company_id;
        $activeProducts = $claims->active_products ?? [];
        $contextCompanyHeader = $request->header('X-Company-Context');
        $isInternalTeam = in_array($role, ['super_admin', 'platform_staff', 'platform_finance'], true);

        if ($contextCompanyHeader !== null && $contextCompanyHeader !== '') {
            if (! $isInternalTeam) {
                return ApiResponse::forbidden('Company context override is not allowed for this account');
            }

            if (! ctype_digit((string) $contextCompanyHeader)) {
                return ApiResponse::badRequest('Invalid company context');
            }

            $scopedCompany = Company::active()->find((int) $contextCompanyHeader);

            if (! $scopedCompany) {
                return ApiResponse::notFound('Company context not found');
            }

            $companyId = $scopedCompany->id;
            $activeProducts = SubscriptionService::resolveActiveProductCodes($companyId);
            $request->attributes->set('auth_company_context_override', true);
        }

        // Set claims on request for controllers/services
        $request->attributes->set('auth_user_id', $claims->sub);
        $request->attributes->set('auth_company_id', $companyId);
        $request->attributes->set('auth_role', $role);
        $request->attributes->set('auth_active_products', $activeProducts);
        $request->attributes->set('auth_session_id', $claims->session_id);

        return $next($request);
    }
}
