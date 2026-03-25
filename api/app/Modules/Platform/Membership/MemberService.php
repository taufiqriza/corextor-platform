<?php

namespace App\Modules\Platform\Membership;

use App\Modules\Platform\Audit\AuditService;
use App\Modules\Platform\Identity\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Service layer for managing company members (tenant users).
 *
 * Members = users linked to a company via company_memberships table.
 * Roles: company_admin, employee.
 */
class MemberService
{
    public const COMPANY_ROLES = ['company_admin', 'employee'];

    // ── Queries ──

    /**
     * List all members of a company with user info.
     */
    public static function listByCompany(int $companyId): Collection
    {
        return CompanyMembership::where('company_id', $companyId)
            ->with('user')
            ->orderByRaw("FIELD(role, 'company_admin', 'employee')")
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get membership stats for a company.
     */
    public static function statsForCompany(int $companyId): array
    {
        $members = CompanyMembership::where('company_id', $companyId)->get();

        return [
            'total'    => $members->count(),
            'admins'   => $members->where('role', 'company_admin')->count(),
            'employees' => $members->where('role', 'employee')->count(),
            'active'   => $members->where('status', 'active')->count(),
            'suspended' => $members->where('status', 'suspended')->count(),
        ];
    }

    // ── Commands ──

    /**
     * Add a member to a company.
     *
     * Supports two flows:
     * 1. Existing user (by email) → create membership
     * 2. New user → create user + membership
     */
    public static function addMember(int $companyId, array $data): CompanyMembership
    {
        return self::addMemberWithMeta($companyId, $data)['membership'];
    }

    public static function addMemberWithMeta(int $companyId, array $data): array
    {
        $role = $data['role'] ?? 'employee';

        if (! in_array($role, self::COMPANY_ROLES)) {
            throw new \InvalidArgumentException("Invalid company role: {$role}");
        }

        $resolvedUser = self::resolveUserByEmail($data);
        $user = $resolvedUser['user'];

        // Check for existing membership
        $existing = CompanyMembership::where('company_id', $companyId)
            ->where('user_id', $user->id)
            ->first();

        if ($existing) {
            if ($existing->isActive()) {
                throw new \RuntimeException("User {$data['email']} sudah menjadi member perusahaan ini.");
            }
            // Reactivate suspended membership
            $existing->update([
                'role'   => $role,
                'status' => 'active',
            ]);

            AuditService::platform('member.reactivated', [
                'membership_id' => $existing->id,
                'user_id'       => $user->id,
                'company_id'    => $companyId,
                'role'          => $role,
            ], $companyId);

            return [
                'membership' => $existing->fresh()->load('user'),
                'user_created' => $resolvedUser['user_created'],
                'temporary_password' => $resolvedUser['temporary_password'],
            ];
        }

        // Create new membership
        return self::createMembership(
            companyId: $companyId,
            user: $user,
            role: $role,
            userCreated: $resolvedUser['user_created'],
            temporaryPassword: $resolvedUser['temporary_password'],
        );
    }

    /**
     * Ensure a company has an active membership for the given email.
     *
     * Used by product onboarding flows that should not fail when the user
     * is already an active member of the company.
     */
    public static function ensureMember(int $companyId, array $data): CompanyMembership
    {
        return self::ensureMemberWithMeta($companyId, $data)['membership'];
    }

    public static function ensureMemberWithMeta(int $companyId, array $data): array
    {
        $role = $data['role'] ?? 'employee';

        if (! in_array($role, self::COMPANY_ROLES, true)) {
            throw new \InvalidArgumentException("Invalid company role: {$role}");
        }

        $email = strtolower(trim((string) ($data['email'] ?? '')));

        if ($email === '') {
            throw new \InvalidArgumentException('Email wajib diisi.');
        }

        $resolvedUser = self::resolveUserByEmail([
            ...$data,
            'email' => $email,
        ]);
        $user = $resolvedUser['user'];

        $membership = CompanyMembership::where('company_id', $companyId)
            ->where('user_id', $user->id)
            ->first();

        if (! $membership) {
            return self::createMembership(
                companyId: $companyId,
                user: $user,
                role: $role,
                userCreated: $resolvedUser['user_created'],
                temporaryPassword: $resolvedUser['temporary_password'],
            );
        }

        $updates = [];

        if (! $membership->isActive()) {
            $updates['status'] = 'active';
        }

        if ($membership->role !== $role) {
            $updates['role'] = $role;
        }

        if (! empty($updates)) {
            $membership->update($updates);

            AuditService::platform('member.ensured', [
                'membership_id' => $membership->id,
                'user_id' => $membership->user_id,
                'company_id' => $companyId,
                'changes' => $updates,
            ], $companyId);
        }

        return [
            'membership' => $membership->fresh()->load('user'),
            'user_created' => $resolvedUser['user_created'],
            'temporary_password' => $resolvedUser['temporary_password'],
        ];
    }

    private static function createMembership(
        int $companyId,
        User $user,
        string $role,
        bool $userCreated,
        ?string $temporaryPassword,
    ): array {
        $membership = CompanyMembership::create([
            'company_id' => $companyId,
            'user_id' => $user->id,
            'role' => $role,
            'status' => 'active',
        ]);

        AuditService::platform('member.added', [
            'membership_id' => $membership->id,
            'user_id' => $user->id,
            'company_id' => $companyId,
            'role' => $role,
        ], $companyId);

        return [
            'membership' => $membership->load('user'),
            'user_created' => $userCreated,
            'temporary_password' => $temporaryPassword,
        ];
    }

    /**
     * Update a member's role or status.
     */
    public static function updateMember(int $companyId, int $membershipId, array $data): CompanyMembership
    {
        $membership = CompanyMembership::where('company_id', $companyId)
            ->findOrFail($membershipId);

        $updates = [];

        if (isset($data['role'])) {
            if (! in_array($data['role'], self::COMPANY_ROLES)) {
                throw new \InvalidArgumentException("Invalid role: {$data['role']}");
            }
            $updates['role'] = $data['role'];
        }

        if (isset($data['status'])) {
            if (! in_array($data['status'], ['active', 'suspended'])) {
                throw new \InvalidArgumentException("Invalid status: {$data['status']}");
            }
            $updates['status'] = $data['status'];
        }

        if (! empty($updates)) {
            $membership->update($updates);

            AuditService::platform('member.updated', [
                'membership_id' => $membership->id,
                'changes'       => $updates,
            ], $companyId);
        }

        return $membership->fresh()->load('user');
    }

    /**
     * Remove a member from a company (soft: set status=removed).
     */
    public static function removeMember(int $companyId, int $membershipId): void
    {
        $membership = CompanyMembership::where('company_id', $companyId)
            ->findOrFail($membershipId);

        $membership->update(['status' => 'suspended']);

        AuditService::platform('member.removed', [
            'membership_id' => $membership->id,
            'user_id'       => $membership->user_id,
        ], $companyId);
    }

    private static function resolveUserByEmail(array $data): array
    {
        $email = strtolower(trim((string) ($data['email'] ?? '')));

        if ($email === '') {
            throw new \InvalidArgumentException('Email wajib diisi.');
        }

        $user = User::where('email', $email)->first();

        if ($user) {
            return [
                'user' => $user,
                'user_created' => false,
                'temporary_password' => null,
            ];
        }

        $temporaryPassword = (string) ($data['password'] ?? Str::upper(Str::random(12)));

        $user = User::create([
            'name' => trim((string) ($data['name'] ?? explode('@', $email)[0])),
            'email' => $email,
            'password' => Hash::make($temporaryPassword),
            'platform_role' => 'standard',
            'status' => 'active',
        ]);

        return [
            'user' => $user,
            'user_created' => true,
            'temporary_password' => $temporaryPassword,
        ];
    }
}
