<?php

namespace App\Modules\Attendance\Services;

use App\Modules\Attendance\Models\AttendanceUser;
use App\Modules\Platform\Audit\AuditService;
use Illuminate\Database\Eloquent\Collection;

class AttendanceUserService
{
    /**
     * List attendance users for a company.
     */
    public static function listByCompany(int $companyId): Collection
    {
        return AttendanceUser::forCompany($companyId)
            ->with(['branch', 'platformUser'])
            ->orderBy('platform_user_id')
            ->get();
    }

    /**
     * Get a single attendance user (scoped to company).
     */
    public static function findForCompany(int $id, int $companyId): AttendanceUser
    {
        return AttendanceUser::forCompany($companyId)
            ->with('branch')
            ->findOrFail($id);
    }

    /**
     * Create an attendance user profile.
     *
     * Flow per database.md section 5:
     * Platform user + membership must already exist.
     * This creates the attendance-specific profile.
     */
    public static function create(int $companyId, array $data): AttendanceUser
    {
        // Validate platform user exists and has membership
        $platformUser = \App\Modules\Platform\Identity\User::findOrFail($data['platform_user_id']);
        $membership = \App\Modules\Platform\Membership\MembershipService::getActiveMembership(
            $data['platform_user_id'],
            $companyId,
        );

        if (! $membership) {
            throw new \RuntimeException('User does not have an active membership in this company');
        }

        // Validate branch belongs to company
        BranchService::findForCompany($data['branch_id'], $companyId);

        // Generate PIN if provided
        $pinHash = null;
        $pinLookup = null;
        if (! empty($data['pin'])) {
            $pinHash = PinService::hashPin($data['pin']);
            $pinLookup = PinService::generatePinLookup($companyId, $data['pin']);
        }

        $attendanceUser = AttendanceUser::create([
            'platform_user_id' => $data['platform_user_id'],
            'company_id' => $companyId,
            'branch_id' => $data['branch_id'],
            'pin_hash' => $pinHash,
            'pin_lookup' => $pinLookup,
            'status' => 'active',
        ]);

        AuditService::attendance('attendance_user.created', [
            'attendance_user_id' => $attendanceUser->id,
            'platform_user_id' => $data['platform_user_id'],
            'branch_id' => $data['branch_id'],
        ], $companyId);

        return $attendanceUser->load('branch');
    }

    /**
     * Update an attendance user profile.
     */
    public static function update(int $id, int $companyId, array $data): AttendanceUser
    {
        $attendanceUser = AttendanceUser::forCompany($companyId)->findOrFail($id);

        $updateData = [];

        if (isset($data['branch_id'])) {
            BranchService::findForCompany($data['branch_id'], $companyId);
            $updateData['branch_id'] = $data['branch_id'];
        }

        if (isset($data['status'])) {
            $updateData['status'] = $data['status'];
        }

        if (! empty($updateData)) {
            $attendanceUser->update($updateData);
        }

        AuditService::attendance('attendance_user.updated', [
            'attendance_user_id' => $attendanceUser->id,
            'changes' => $data,
        ], $companyId);

        return $attendanceUser->fresh()->load('branch');
    }

    /**
     * Deactivate an attendance user (no hard delete).
     */
    public static function deactivate(int $id, int $companyId): AttendanceUser
    {
        return self::update($id, $companyId, ['status' => 'deactivated']);
    }

    /**
     * Find attendance user by platform user ID (for auth flows).
     */
    public static function findByPlatformUser(int $platformUserId, int $companyId): ?AttendanceUser
    {
        return AttendanceUser::forCompany($companyId)
            ->where('platform_user_id', $platformUserId)
            ->active()
            ->first();
    }
}
