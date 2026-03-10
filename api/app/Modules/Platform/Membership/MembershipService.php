<?php

namespace App\Modules\Platform\Membership;

use App\Modules\Platform\Identity\User;
use App\Modules\Platform\Company\Company;

class MembershipService
{
    /**
     * Resolve effective role for a user.
     *
     * Rule:
     * - If users.platform_role is internal (super_admin, platform_staff, platform_finance) → use it directly
     * - Otherwise → effective role from company_memberships.role
     */
    public static function resolveEffectiveRole(User $user, ?int $companyId = null): ?string
    {
        // Internal team members always use their platform_role
        if ($user->isInternalTeam()) {
            return $user->platform_role;
        }

        if (! $companyId) {
            return null;
        }

        $membership = CompanyMembership::where('user_id', $user->id)
            ->where('company_id', $companyId)
            ->active()
            ->first();

        return $membership?->role;
    }

    /**
     * Resolve the user's current company.
     *
     * For super_admin: the first active company (or specified one).
     * For standard user: the company where they have active membership.
     */
    public static function resolveCurrentCompany(User $user, ?int $preferredCompanyId = null): ?Company
    {
        // Internal team members can access any company
        if ($user->isInternalTeam()) {
            if ($preferredCompanyId) {
                return Company::active()->find($preferredCompanyId);
            }
            return Company::active()->first();
        }

        // Standard user: find their active membership
        $membership = $user->memberships()
            ->active()
            ->when($preferredCompanyId, fn ($q) => $q->where('company_id', $preferredCompanyId))
            ->with('company')
            ->first();

        if (! $membership || ! $membership->company?->isActive()) {
            return null;
        }

        return $membership->company;
    }

    /**
     * Get active membership for a user in a specific company.
     */
    public static function getActiveMembership(int $userId, int $companyId): ?CompanyMembership
    {
        return CompanyMembership::where('user_id', $userId)
            ->where('company_id', $companyId)
            ->active()
            ->first();
    }

    /**
     * Get list of effective active products for user in company.
     *
     * Uses real subscription data from Sprint 3.
     */
    public static function resolveActiveProducts(User $user, Company $company): array
    {
        return \App\Modules\Platform\Subscription\SubscriptionService::resolveActiveProductCodes($company->id);
    }
}
