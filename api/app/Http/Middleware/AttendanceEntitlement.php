<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Modules\Platform\Subscription\SubscriptionService;
use App\Support\ApiResponse;

class AttendanceEntitlement
{
    /**
     * Verify that the user's company has an active attendance subscription.
     *
     * This is the product entitlement guard per architecture.md:
     * valid membership + active subscription + active product profile
     */
    public function handle(Request $request, Closure $next)
    {
        $companyId = $request->attributes->get('auth_company_id');
        $activeProducts = $request->attributes->get('auth_active_products', []);

        // Quick check from JWT claims first
        if (! in_array('attendance', $activeProducts)) {
            return ApiResponse::forbidden('Company does not have an active Attendance subscription');
        }

        // Double-check against DB for security (JWT could be stale)
        if (! SubscriptionService::hasActiveProduct($companyId, 'attendance')) {
            return ApiResponse::forbidden('Attendance subscription is no longer active');
        }

        return $next($request);
    }
}
