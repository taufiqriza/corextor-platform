<?php

namespace App\Modules\Platform\Team;

use App\Modules\Platform\Audit\AuditService;
use App\Modules\Platform\Identity\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Hash;

/**
 * Service layer for managing internal Corextor team members.
 *
 * Team = users with platform_role IN ('super_admin', 'platform_staff', 'platform_finance').
 * These are NOT tenant users — they are Corextor's own employees/staff.
 */
class TeamService
{
    /**
     * Platform roles that qualify as "internal team."
     */
    public const INTERNAL_ROLES = ['super_admin', 'platform_staff', 'platform_finance'];

    /**
     * Roles assignable via the Team panel (super_admin is system-only).
     */
    public const ASSIGNABLE_ROLES = ['platform_staff', 'platform_finance'];

    // ── Queries ──

    /**
     * List all internal team members.
     */
    public static function list(): Collection
    {
        return User::whereIn('platform_role', self::INTERNAL_ROLES)
            ->orderByRaw("FIELD(platform_role, 'super_admin', 'platform_staff', 'platform_finance')")
            ->get();
    }

    /**
     * Get stats for the team panel.
     */
    public static function stats(): array
    {
        $team = self::list();

        return [
            'total'    => $team->count(),
            'admins'   => $team->where('platform_role', 'super_admin')->count(),
            'staff'    => $team->where('platform_role', 'platform_staff')->count(),
            'finance'  => $team->where('platform_role', 'platform_finance')->count(),
            'active'   => $team->where('status', 'active')->count(),
            'suspended' => $team->where('status', 'suspended')->count(),
        ];
    }

    // ── Commands ──

    /**
     * Invite a new team member.
     *
     * Creates a user with a platform role and generates a temporary password.
     */
    public static function invite(array $data): User
    {
        $role = $data['platform_role'] ?? 'platform_staff';

        if (! in_array($role, self::ASSIGNABLE_ROLES)) {
            throw new \InvalidArgumentException("Cannot assign role: {$role}. Only " . implode(', ', self::ASSIGNABLE_ROLES) . ' are assignable.');
        }

        // Check for duplicate email
        $existing = User::where('email', $data['email'])->first();
        if ($existing) {
            throw new \RuntimeException("Email {$data['email']} sudah terdaftar.");
        }

        $temporaryPassword = $data['password'] ?? 'Corextor2026!';

        $user = User::create([
            'name'          => $data['name'],
            'email'         => $data['email'],
            'password'      => Hash::make($temporaryPassword),
            'platform_role' => $role,
            'status'        => 'active',
        ]);

        AuditService::platform('team.invited', [
            'invited_user_id' => $user->id,
            'email'           => $user->email,
            'role'            => $role,
        ]);

        return $user;
    }

    /**
     * Update a team member's role or status.
     */
    public static function update(int $userId, array $data): User
    {
        $user = User::whereIn('platform_role', self::INTERNAL_ROLES)
            ->findOrFail($userId);

        // Cannot modify super_admin via this service
        if ($user->isSuperAdmin()) {
            throw new \RuntimeException('Cannot modify Super Admin via Team management.');
        }

        $updates = [];

        if (isset($data['platform_role'])) {
            if (! in_array($data['platform_role'], self::ASSIGNABLE_ROLES)) {
                throw new \InvalidArgumentException("Invalid role: {$data['platform_role']}");
            }
            $updates['platform_role'] = $data['platform_role'];
        }

        if (isset($data['status'])) {
            if (! in_array($data['status'], ['active', 'suspended'])) {
                throw new \InvalidArgumentException("Invalid status: {$data['status']}");
            }
            $updates['status'] = $data['status'];
        }

        if (isset($data['name'])) {
            $updates['name'] = $data['name'];
        }

        if (! empty($updates)) {
            $user->update($updates);

            AuditService::platform('team.updated', [
                'user_id' => $user->id,
                'changes' => $updates,
            ]);
        }

        return $user->fresh();
    }

    /**
     * Remove a team member (downgrade to 'standard').
     *
     * Does NOT delete the user — just removes their platform role.
     */
    public static function remove(int $userId): void
    {
        $user = User::whereIn('platform_role', self::INTERNAL_ROLES)
            ->findOrFail($userId);

        if ($user->isSuperAdmin()) {
            throw new \RuntimeException('Cannot remove Super Admin.');
        }

        $user->update(['platform_role' => 'standard']);

        AuditService::platform('team.removed', [
            'user_id' => $user->id,
            'email'   => $user->email,
        ]);
    }

    // ── Helpers ──

    /**
     * Check if a platform_role qualifies as internal team.
     */
    public static function isInternalRole(string $role): bool
    {
        return in_array($role, self::INTERNAL_ROLES);
    }
}
