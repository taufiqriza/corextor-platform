<?php

namespace App\Modules\Attendance\Services;

use App\Modules\Attendance\Models\AttendanceUser;
use App\Modules\Platform\Audit\AuditService;
use App\Modules\Platform\Identity\User;
use App\Modules\Platform\Membership\MemberService;
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
    public static function create(int $companyId, array $data): array
    {
        $platformUserId = $data['platform_user_id'] ?? null;
        $membership = null;
        $temporaryPassword = null;
        $userCreated = false;

        if ($platformUserId) {
            $platformUser = User::find($platformUserId);

            if (! $platformUser) {
                throw new \RuntimeException('Platform user tidak ditemukan. Gunakan user yang valid atau tambahkan via email.');
            }

            $membership = \App\Modules\Platform\Membership\MembershipService::getActiveMembership(
                $platformUserId,
                $companyId,
            );
        } else {
            $email = strtolower(trim((string) ($data['email'] ?? '')));

            if ($email === '') {
                throw new \RuntimeException('Email karyawan wajib diisi.');
            }

            $memberMeta = MemberService::ensureMemberWithMeta($companyId, [
                'email' => $email,
                'name' => $data['name'] ?? null,
                'role' => $data['role'] ?? 'employee',
            ]);
            $membership = $memberMeta['membership'];
            $temporaryPassword = $memberMeta['temporary_password'];
            $userCreated = $memberMeta['user_created'];

            $platformUserId = $membership->user_id;
            $platformUser = $membership->user;
        }

        if (! $membership) {
            throw new \RuntimeException('User belum menjadi member aktif perusahaan ini.');
        }

        // Validate branch belongs to company
        BranchService::findForCompany($data['branch_id'], $companyId);

        $existingAttendanceUser = AttendanceUser::forCompany($companyId)
            ->where('platform_user_id', $platformUserId)
            ->first();

        // Generate PIN if provided
        $pinHash = null;
        $pinLookup = null;
        $globalPinLookup = null;
        if (! empty($data['pin'])) {
            PinService::assertSixDigitPin($data['pin']);
            $globalPinLookup = PinService::generateGlobalPinLookup($data['pin']);
            $pinHash = PinService::hashPin($data['pin']);
            $pinLookup = PinService::generatePinLookup($companyId, $data['pin']);

            $pinInUse = AttendanceUser::where('global_pin_lookup', $globalPinLookup)
                ->when($existingAttendanceUser, fn ($query) => $query->where('id', '!=', $existingAttendanceUser->id))
                ->exists();

            if ($pinInUse) {
                throw new \RuntimeException('PIN ini sudah digunakan oleh karyawan lain. Silakan gunakan PIN yang berbeda.');
            }
        }

        if ($existingAttendanceUser) {
            $existingAttendanceUser->update([
                'branch_id' => $data['branch_id'],
                'pin_hash' => $pinHash ?: $existingAttendanceUser->pin_hash,
                'pin_lookup' => $pinLookup ?: $existingAttendanceUser->pin_lookup,
                'global_pin_lookup' => $globalPinLookup ?: $existingAttendanceUser->global_pin_lookup,
                'status' => 'active',
            ]);

            AuditService::attendance('attendance_user.reactivated', [
                'attendance_user_id' => $existingAttendanceUser->id,
                'platform_user_id' => $platformUserId,
                'branch_id' => $data['branch_id'],
            ], $companyId);

            return [
                'attendance_user' => $existingAttendanceUser->fresh()->load(['branch', 'platformUser']),
                'credentials' => $userCreated
                    ? [
                        'email' => $platformUser?->email,
                        'temporary_password' => $temporaryPassword,
                    ]
                    : null,
            ];
        }

        $attendanceUser = AttendanceUser::create([
            'platform_user_id' => $platformUserId,
            'company_id' => $companyId,
            'branch_id' => $data['branch_id'],
            'pin_hash' => $pinHash,
            'pin_lookup' => $pinLookup,
            'global_pin_lookup' => $globalPinLookup,
            'status' => 'active',
        ]);

        AuditService::attendance('attendance_user.created', [
            'attendance_user_id' => $attendanceUser->id,
            'platform_user_id' => $platformUserId,
            'branch_id' => $data['branch_id'],
        ], $companyId);

        return [
            'attendance_user' => $attendanceUser->load(['branch', 'platformUser']),
            'credentials' => $userCreated
                ? [
                    'email' => $platformUser?->email,
                    'temporary_password' => $temporaryPassword,
                ]
                : null,
        ];
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
