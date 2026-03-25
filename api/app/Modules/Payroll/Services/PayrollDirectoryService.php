<?php

namespace App\Modules\Payroll\Services;

use App\Modules\Platform\Identity\User;
use App\Modules\Platform\Membership\CompanyMembership;
use Illuminate\Support\Collection;

class PayrollDirectoryService
{
    /**
     * List eligible company members for payroll setup.
     */
    public static function listEligibleMembers(int $companyId): Collection
    {
        return CompanyMembership::query()
            ->with('user')
            ->where('company_id', $companyId)
            ->active()
            ->whereIn('role', ['company_admin', 'employee'])
            ->get()
            ->filter(fn (CompanyMembership $membership) => $membership->user?->isActive())
            ->map(fn (CompanyMembership $membership) => [
                'membership_id' => $membership->id,
                'platform_user_id' => $membership->user_id,
                'name' => $membership->user?->name,
                'email' => $membership->user?->email,
                'role' => $membership->role,
                'status' => $membership->status,
            ])
            ->values();
    }

    /**
     * Ensure the given platform user belongs to the company and is active.
     */
    public static function requireEligibleMember(int $companyId, int $platformUserId): array
    {
        $membership = CompanyMembership::query()
            ->with('user')
            ->where('company_id', $companyId)
            ->where('user_id', $platformUserId)
            ->active()
            ->whereIn('role', ['company_admin', 'employee'])
            ->first();

        if (! $membership || ! $membership->user?->isActive()) {
            throw new \RuntimeException('Karyawan payroll harus berasal dari membership company yang aktif.');
        }

        return [
            'platform_user_id' => $membership->user_id,
            'name' => $membership->user?->name,
            'email' => $membership->user?->email,
            'role' => $membership->role,
        ];
    }

    /**
     * Resolve lightweight user data for multiple platform user ids.
     *
     * @return array<int, array{name:string,email:string}>
     */
    public static function mapUsers(array $userIds): array
    {
        if ($userIds === []) {
            return [];
        }

        return User::query()
            ->whereIn('id', array_values(array_unique($userIds)))
            ->get(['id', 'name', 'email'])
            ->mapWithKeys(fn (User $user) => [
                $user->id => [
                    'name' => $user->name,
                    'email' => $user->email,
                ],
            ])
            ->all();
    }
}
