<?php

namespace App\Http\Controllers;

use App\Modules\Platform\Subscription\SubscriptionService;
use App\Modules\Platform\ProductCatalog\Product;
use App\Modules\Platform\ProductCatalog\Plan;
use App\Modules\Platform\ProductCatalog\Bundle;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    /**
     * GET /platform/v1/companies/{id}/subscriptions
     */
    public function index(int $id): JsonResponse
    {
        $subscriptions = SubscriptionService::listByCompany($id);
        return ApiResponse::success($subscriptions);
    }

    /**
     * POST /platform/v1/companies/{id}/subscriptions
     */
    public function store(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'product_code' => 'required|string|exists:platform.products,code',
            'plan_code' => 'required|string|exists:platform.plans,code',
            'starts_at' => 'required|date',
        ]);

        try {
            $subscription = SubscriptionService::addProductSubscription(
                companyId: $id,
                productCode: $request->input('product_code'),
                planCode: $request->input('plan_code'),
                startsAt: $request->input('starts_at'),
            );

            return ApiResponse::created($subscription);
        } catch (\RuntimeException $e) {
            return ApiResponse::conflict($e->getMessage());
        }
    }

    /**
     * GET /platform/v1/company/subscriptions (company admin self-service)
     */
    public function mySubscriptions(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('auth_company_id');
        $subscriptions = SubscriptionService::listByCompany($companyId);
        return ApiResponse::success($subscriptions);
    }

    // ── Product Catalog ──

    /**
     * GET /platform/v1/products
     */
    public function products(): JsonResponse
    {
        return ApiResponse::success(Product::active()->with('plans')->get());
    }

    /**
     * GET /platform/v1/plans
     */
    public function plans(): JsonResponse
    {
        return ApiResponse::success(Plan::active()->with('product')->get());
    }

    /**
     * GET /platform/v1/bundles
     */
    public function bundles(): JsonResponse
    {
        return ApiResponse::success(Bundle::active()->with('items')->get());
    }
}
