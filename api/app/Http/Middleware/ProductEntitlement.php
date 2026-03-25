<?php

namespace App\Http\Middleware;

use App\Modules\Platform\Subscription\SubscriptionService;
use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;

class ProductEntitlement
{
    /**
     * Ensure the current company has an active subscription for the target product.
     */
    public function handle(Request $request, Closure $next, string $productCode)
    {
        $companyId = (int) $request->attributes->get('auth_company_id');
        $activeProducts = $request->attributes->get('auth_active_products', []);

        if (! in_array($productCode, $activeProducts, true)) {
            return ApiResponse::forbidden("Company does not have an active {$productCode} subscription");
        }

        if (! SubscriptionService::hasActiveProduct($companyId, $productCode)) {
            return ApiResponse::forbidden(ucfirst($productCode) . ' subscription is no longer active');
        }

        return $next($request);
    }
}
