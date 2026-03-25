<?php

namespace App\Modules\Platform\Subscription;

use App\Modules\Platform\Audit\AuditService;
use App\Modules\Platform\ProductCatalog\Product;
use App\Modules\Platform\ProductCatalog\Plan;
use App\Modules\Platform\Company\Company;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
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
     * Update a plan in the product catalog.
     */
    public static function updatePlan(int $planId, array $data): Plan
    {
        /** @var Plan $plan */
        $plan = Plan::with('product')->findOrFail($planId);
        $familyCode = $plan->family_code ?: $plan->code;

        return DB::connection('platform')->transaction(function () use ($data, $familyCode, $plan) {
            $latestVersionNumber = (int) Plan::where('family_code', $familyCode)->max('version_number');
            $newVersionNumber = max($latestVersionNumber, (int) $plan->version_number) + 1;
            $newCode = self::generateVersionedPlanCode($familyCode, $newVersionNumber);

            Plan::where('family_code', $familyCode)
                ->where('is_latest', true)
                ->update([
                    'is_latest' => false,
                    'retired_at' => now()->toDateString(),
                ]);

            $newPlan = Plan::create([
                'product_id' => $plan->product_id,
                'code' => $newCode,
                'family_code' => $familyCode,
                'name' => $data['name'] ?? $plan->name,
                'billing_cycle' => $data['billing_cycle'] ?? $plan->billing_cycle,
                'price' => $data['price'] ?? $plan->price,
                'currency' => $plan->currency,
                'status' => $data['status'] ?? $plan->status,
                'features_json' => $data['features_json'] ?? $plan->features_json,
                'version_number' => $newVersionNumber,
                'is_latest' => true,
                'supersedes_plan_id' => $plan->id,
                'effective_from' => $data['effective_from'] ?? now()->toDateString(),
                'version_notes' => $data['version_notes'] ?? null,
            ]);

            AuditService::platform('plan.version_created', [
                'source_plan_id' => $plan->id,
                'source_plan_code' => $plan->code,
                'new_plan_id' => $newPlan->id,
                'new_plan_code' => $newPlan->code,
                'family_code' => $familyCode,
                'version_number' => $newPlan->version_number,
                'product_code' => $plan->product?->code,
                'billing_cycle' => $newPlan->billing_cycle,
                'price' => $newPlan->price,
                'status' => $newPlan->status,
            ]);

            return $newPlan->fresh(['product']);
        });
    }

    /**
     * Update an existing company subscription.
     *
     * This keeps the subscription record stable while allowing platform admins
     * to move the company to another plan or billing cycle in real time.
     */
    public static function updateCompanySubscription(
        int $companyId,
        int $subscriptionId,
        array $data,
    ): CompanySubscription {
        /** @var CompanySubscription $subscription */
        $subscription = CompanySubscription::with(['items', 'product', 'plan'])
            ->where('company_id', $companyId)
            ->findOrFail($subscriptionId);

        $targetPlan = Plan::with('product')->where('code', $data['plan_code'])->active()->firstOrFail();

        $duplicateActiveSubscription = CompanySubscription::where('company_id', $companyId)
            ->where('product_id', $targetPlan->product_id)
            ->where('id', '!=', $subscription->id)
            ->active()
            ->exists();

        if ($duplicateActiveSubscription) {
            throw new \RuntimeException("Company already has an active subscription for product: {$targetPlan->product->code}");
        }

        $subscription->fill([
            'product_id' => $targetPlan->product_id,
            'plan_id' => $targetPlan->id,
            'billing_cycle' => $targetPlan->billing_cycle,
            'starts_at' => $data['starts_at'] ?? $subscription->starts_at,
            'status' => $data['status'] ?? $subscription->status,
        ]);
        $subscription->save();

        $activeItem = $subscription->items()->first();

        if ($activeItem) {
            $activeItem->update([
                'product_id' => $targetPlan->product_id,
                'plan_id' => $targetPlan->id,
                'status' => in_array($subscription->status, ['active', 'trial'], true) ? 'active' : 'inactive',
            ]);
        } else {
            SubscriptionItem::create([
                'subscription_id' => $subscription->id,
                'product_id' => $targetPlan->product_id,
                'plan_id' => $targetPlan->id,
                'status' => in_array($subscription->status, ['active', 'trial'], true) ? 'active' : 'inactive',
            ]);
        }

        AuditService::platform('subscription.updated', [
            'subscription_id' => $subscription->id,
            'company_id' => $companyId,
            'product_code' => $targetPlan->product?->code,
            'plan_code' => $targetPlan->code,
            'billing_cycle' => $subscription->billing_cycle,
            'status' => $subscription->status,
            'starts_at' => optional($subscription->starts_at)->toDateString(),
        ], $companyId);

        return $subscription->fresh(['items', 'product', 'plan']);
    }

    /**
     * List plans for selectors and catalog views.
     */
    public static function listPlans(
        bool $includeVersions = false,
        bool $latestOnly = true,
        ?string $productCode = null,
    ): Collection {
        return Plan::query()
            ->with('product')
            ->when($productCode, function ($query) use ($productCode) {
                $query->whereHas('product', fn ($productQuery) => $productQuery->where('code', $productCode));
            })
            ->when(! $includeVersions && $latestOnly, fn ($query) => $query->latestVersion())
            ->orderBy('product_id')
            ->orderBy('family_code')
            ->orderByDesc('version_number')
            ->get();
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

    private static function generateVersionedPlanCode(string $familyCode, int $versionNumber): string
    {
        $suffix = "-v{$versionNumber}";
        $maxBaseLength = max(1, 50 - strlen($suffix));

        return Str::limit($familyCode, $maxBaseLength, '') . $suffix;
    }
}
