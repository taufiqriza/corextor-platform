<?php

namespace App\Modules\Attendance\Services;

use App\Modules\Attendance\Models\AttendanceRecord;
use App\Modules\Attendance\Models\AttendanceUser;
use App\Modules\Platform\Audit\AuditService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class AttendanceRecordService
{
    /**
     * Check-in: create today's attendance record with time_in.
     *
     * Rules:
     * - One record per user per day (unique constraint)
     * - Must have active attendance profile
     * - Cannot check-in twice on same day
     */
    public static function checkIn(
        int $platformUserId,
        int $companyId,
    ): AttendanceRecord {
        $attendanceUser = self::resolveAttendanceUser($platformUserId, $companyId);
        $today = now()->toDateString();

        // Check for existing record today
        $existing = AttendanceRecord::where('attendance_user_id', $attendanceUser->id)
            ->forDate($today)
            ->first();

        if ($existing) {
            if ($existing->hasCheckedIn()) {
                throw new \RuntimeException('Already checked in today');
            }
        }

        $record = AttendanceRecord::create([
            'attendance_user_id' => $attendanceUser->id,
            'platform_user_id' => $platformUserId,
            'company_id' => $companyId,
            'branch_id' => $attendanceUser->branch_id,
            'date' => $today,
            'time_in' => now()->format('H:i:s'),
            'status' => 'present',
        ]);

        AuditService::attendance('attendance.check_in', [
            'record_id' => $record->id,
            'attendance_user_id' => $attendanceUser->id,
            'time_in' => $record->time_in,
        ], $companyId);

        return $record->load('branch');
    }

    /**
     * Check-out: update today's record with time_out.
     *
     * Rules:
     * - Must have checked in first
     * - Cannot check-out twice
     */
    public static function checkOut(
        int $platformUserId,
        int $companyId,
    ): AttendanceRecord {
        $attendanceUser = self::resolveAttendanceUser($platformUserId, $companyId);
        $today = now()->toDateString();

        $record = AttendanceRecord::where('attendance_user_id', $attendanceUser->id)
            ->forDate($today)
            ->first();

        if (! $record || ! $record->hasCheckedIn()) {
            throw new \RuntimeException('No check-in record found for today');
        }

        if ($record->hasCheckedOut()) {
            throw new \RuntimeException('Already checked out today');
        }

        $record->update([
            'time_out' => now()->format('H:i:s'),
        ]);

        AuditService::attendance('attendance.check_out', [
            'record_id' => $record->id,
            'time_out' => $record->time_out,
        ], $companyId);

        return $record->fresh()->load('branch');
    }

    /**
     * Get attendance history for the authenticated user.
     */
    public static function history(
        int $platformUserId,
        int $companyId,
        ?string $from = null,
        ?string $to = null,
        int $perPage = 15,
    ): LengthAwarePaginator {
        $from = $from ?? now()->startOfMonth()->toDateString();
        $to = $to ?? now()->toDateString();

        return AttendanceRecord::where('platform_user_id', $platformUserId)
            ->forCompany($companyId)
            ->dateRange($from, $to)
            ->with('branch')
            ->orderByDesc('date')
            ->paginate($perPage);
    }

    /**
     * Company attendance report (admin view).
     *
     * Returns all attendance records for a company within a date range,
     * optionally filtered by branch.
     */
    public static function companyReport(
        int $companyId,
        ?string $from = null,
        ?string $to = null,
        ?int $branchId = null,
        int $perPage = 30,
    ): LengthAwarePaginator {
        $from = $from ?? now()->startOfMonth()->toDateString();
        $to = $to ?? now()->toDateString();

        return AttendanceRecord::forCompany($companyId)
            ->dateRange($from, $to)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->with('branch')
            ->orderByDesc('date')
            ->orderBy('time_in')
            ->paginate($perPage);
    }

    /**
     * Correct an attendance record (admin action).
     *
     * Only company_admin or super_admin can correct.
     * Original values are preserved in audit log.
     */
    public static function correct(
        int $recordId,
        int $companyId,
        array $data,
        int $correctedByUserId,
    ): AttendanceRecord {
        $record = AttendanceRecord::forCompany($companyId)->findOrFail($recordId);

        $originalValues = [
            'time_in' => $record->time_in,
            'time_out' => $record->time_out,
            'status' => $record->status,
            'note' => $record->note,
        ];

        $updateData = [];

        if (isset($data['time_in'])) {
            $updateData['time_in'] = $data['time_in'];
        }
        if (isset($data['time_out'])) {
            $updateData['time_out'] = $data['time_out'];
        }
        if (isset($data['note'])) {
            $updateData['note'] = $data['note'];
        }

        $updateData['status'] = 'corrected';

        $record->update($updateData);

        AuditService::attendance('attendance.corrected', [
            'record_id' => $record->id,
            'corrected_by' => $correctedByUserId,
            'original' => $originalValues,
            'new_values' => $updateData,
        ], $companyId);

        return $record->fresh()->load('branch');
    }

    /**
     * Get attendance audit logs for a company.
     */
    public static function getAuditLogs(
        int $companyId,
        int $perPage = 20,
    ): LengthAwarePaginator {
        return \Illuminate\Support\Facades\DB::connection('platform')
            ->table('audit_logs')
            ->where('product_code', 'attendance')
            ->where('company_id', $companyId)
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    // ── Private Helpers ──

    /**
     * Resolve and validate attendance user for the current user + company.
     */
    private static function resolveAttendanceUser(int $platformUserId, int $companyId): AttendanceUser
    {
        $attendanceUser = AttendanceUserService::findByPlatformUser($platformUserId, $companyId);

        if (! $attendanceUser) {
            throw new \RuntimeException('No active attendance profile found');
        }

        return $attendanceUser;
    }
}
