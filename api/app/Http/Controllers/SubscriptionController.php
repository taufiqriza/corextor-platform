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
     * PUT /platform/v1/plans/{planId}
     */
    public function updatePlan(Request $request, int $planId): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'price' => 'sometimes|numeric|min:0',
            'billing_cycle' => 'sometimes|string|in:monthly,yearly,lifetime',
            'status' => 'sometimes|string|in:active,inactive',
            'effective_from' => 'nullable|date',
            'version_notes' => 'nullable|string|max:255',
        ]);

        $plan = SubscriptionService::updatePlan($planId, $request->only(
            'name',
            'price',
            'billing_cycle',
            'status',
            'effective_from',
            'version_notes',
        ));

        return ApiResponse::success($plan, 'Plan version created successfully');
    }

    /**
     * PUT /platform/v1/companies/{id}/subscriptions/{subscriptionId}
     */
    public function update(Request $request, int $id, int $subscriptionId): JsonResponse
    {
        $request->validate([
            'plan_code' => 'required|string|exists:platform.plans,code',
            'starts_at' => 'nullable|date',
            'status' => 'nullable|string|in:active,trial,suspended,expired,cancelled',
        ]);

        try {
            $subscription = SubscriptionService::updateCompanySubscription(
                companyId: $id,
                subscriptionId: $subscriptionId,
                data: $request->only('plan_code', 'starts_at', 'status'),
            );

            return ApiResponse::success($subscription, 'Subscription updated successfully');
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
        return ApiResponse::success(
            Product::active()
                ->with(['latestPlans' => fn ($query) => $query->active()])
                ->get()
        );
    }

    /**
     * GET /platform/v1/plans
     */
    public function plans(Request $request): JsonResponse
    {
        $includeVersions = $request->boolean('include_versions', false);
        $latestOnly = $request->boolean('latest_only', true);
        $productCode = $request->query('product_code');

        return ApiResponse::success(
            SubscriptionService::listPlans(
                includeVersions: $includeVersions,
                latestOnly: $latestOnly,
                productCode: $productCode,
            )
        );
    }

    /**
     * GET /platform/v1/bundles
     */
    public function bundles(): JsonResponse
    {
        return ApiResponse::success(Bundle::active()->with('items')->get());
    }

    /**
     * GET /platform/v1/products/overview
     * Returns products with subscriber stats for quick dashboard view.
     */
    public function productOverview(): JsonResponse
    {
        $products = Product::active()->with('plans')->get();

        $overview = $products->map(function ($product) {
            $latestPlans = $product->plans
                ->filter(fn ($plan) => $plan->is_latest && $plan->status === 'active')
                ->sortBy('name')
                ->values();
            $subs = \App\Modules\Platform\Subscription\CompanySubscription::where('product_id', $product->id)->get();
            $activeSubs = $subs->filter(fn ($s) => in_array($s->status, ['active', 'trial']));

            return [
                'id' => $product->id,
                'name' => $product->name,
                'code' => $product->code,
                'description' => $product->description,
                'workspace_key' => $product->workspace_key,
                'app_url' => $product->app_url,
                'metadata_json' => $product->metadata_json,
                'status' => $product->status,
                'plans' => $latestPlans->map(fn ($plan) => [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'code' => $plan->code,
                    'family_code' => $plan->family_code,
                    'version_number' => $plan->version_number,
                    'price' => $plan->price,
                    'billing_cycle' => $plan->billing_cycle,
                    'status' => $plan->status,
                    'effective_from' => optional($plan->effective_from)->toDateString(),
                    'version_notes' => $plan->version_notes,
                ]),
                'stats' => [
                    'total_subscribers' => $subs->count(),
                    'active_subscribers' => $activeSubs->count(),
                    'total_revenue' => $activeSubs->sum(function ($s) {
                        return $s->plan?->price ?? 0;
                    }),
                    'plan_families' => $product->plans->pluck('family_code')->filter()->unique()->count(),
                    'plan_versions' => $product->plans->count(),
                ],
            ];
        });

        return ApiResponse::success($overview);
    }
}
