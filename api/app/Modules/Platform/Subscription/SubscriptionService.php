<?php

namespace App\Modules\Platform\Subscription;

use App\Modules\Platform\Audit\AuditService;
use App\Modules\Platform\ProductCatalog\Product;
use App\Modules\Platform\ProductCatalog\Plan;
use App\Modules\Platform\Company\Company;
use Illuminate\Database\Eloquent\Collection;

class SubscriptionService
{
    /**
     * List subscriptions for a company.
     */
    public static function listByCompany(int $companyId): Collection
    {
        return CompanySubscription::where('company_id', $companyId)
            ->with(['items', 'product', 'plan'])
            ->orderByDesc('created_at')
            ->get();
    }

    /**
     * Add a product subscription to a company.
     *
     * Flow per database.md section 5:
     * 1. Validate product and plan exist
     * 2. Create company_subscription
     * 3. Materialize subscription_items
     */
    public static function addProductSubscription(
        int $companyId,
        string $productCode,
        string $planCode,
        string $startsAt,
    ): CompanySubscription {
        $product = Product::where('code', $productCode)->active()->firstOrFail();
        $plan = Plan::where('code', $planCode)
            ->where('product_id', $product->id)
            ->active()
            ->firstOrFail();

        // Check no duplicate active subscription for same product
        $existing = CompanySubscription::where('company_id', $companyId)
            ->where('product_id', $product->id)
            ->active()
            ->first();

        if ($existing) {
            throw new \RuntimeException("Company already has an active subscription for product: {$productCode}");
        }

        // Create subscription
        $subscription = CompanySubscription::create([
            'company_id' => $companyId,
            'product_id' => $product->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'starts_at' => $startsAt,
            'billing_cycle' => $plan->billing_cycle,
        ]);

        // Materialize subscription item
        SubscriptionItem::create([
            'subscription_id' => $subscription->id,
            'product_id' => $product->id,
            'plan_id' => $plan->id,
            'status' => 'active',
        ]);

        AuditService::platform('subscription.created', [
            'subscription_id' => $subscription->id,
            'product_code' => $productCode,
            'plan_code' => $planCode,
        ], $companyId);

        return $subscription->load('items');
    }

    /**
     * Resolve effective active product codes for a company.
     *
     * This replaces the hardcoded MVP logic in MembershipService.
     */
    public static function resolveActiveProductCodes(int $companyId): array
    {
        return SubscriptionItem::whereHas('subscription', function ($q) use ($companyId) {
            $q->where('company_id', $companyId)->active();
        })
            ->active()
            ->pluck('product_id')
            ->unique()
            ->map(fn ($productId) => Product::find($productId)?->code)
            ->filter()
            ->values()
            ->toArray();
    }

    /**
     * Check if a company has an active subscription for a specific product.
     */
    public static function hasActiveProduct(int $companyId, string $productCode): bool
    {
        $product = Product::where('code', $productCode)->first();
        if (! $product) return false;

        return SubscriptionItem::whereHas('subscription', function ($q) use ($companyId) {
            $q->where('company_id', $companyId)->active();
        })
            ->where('product_id', $product->id)
            ->active()
            ->exists();
    }
}
