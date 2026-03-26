<?php

namespace App\Modules\Attendance\Services;

use App\Modules\Attendance\Models\AttendanceRecord;
use App\Modules\Attendance\Models\AttendanceUser;
use App\Modules\Attendance\Models\Branch;
use App\Modules\Platform\Audit\AuditService;
use App\Modules\Platform\Company\Company;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class AttendanceRecordService
{
    private const SELFIE_DISK = 'local';

    /**
     * Get employee attendance context for the current company.
     */
    public static function context(
        int $platformUserId,
        int $companyId,
    ): array {
        $attendanceUser = self::resolveAttendanceUser($platformUserId, $companyId)->loadMissing('branch');
        $branch = $attendanceUser->branch;
        $company = Company::find($companyId);

        $todayRecord = AttendanceRecord::where('attendance_user_id', $attendanceUser->id)
            ->forDate(now()->toDateString())
            ->first();

        $hasGeofence = $branch instanceof Branch
            && $branch->latitude !== null
            && $branch->longitude !== null;
        $radiusMeters = $branch?->radius_meters ?: 100;

        return [
            'company' => $company ? [
                'id' => $company->id,
                'name' => $company->name,
                'code' => $company->code,
                'status' => $company->status,
                'logo_url' => $company->logo_url,
            ] : null,
            'attendance_user' => [
                'id' => $attendanceUser->id,
                'status' => $attendanceUser->status,
                'branch_id' => $attendanceUser->branch_id,
            ],
            'branch' => $branch ? [
                'id' => $branch->id,
                'name' => $branch->name,
                'location' => $branch->location,
                'latitude' => $branch->latitude,
                'longitude' => $branch->longitude,
                'radius_meters' => $radiusMeters,
                'status' => $branch->status,
                'has_geofence' => $hasGeofence,
            ] : null,
            'today_record' => $todayRecord ? self::transformRecord($todayRecord) : null,
            'rules' => [
                'requires_location_capture' => true,
                'requires_location_validation' => $hasGeofence,
                'requires_selfie_capture' => true,
                'radius_meters' => $hasGeofence ? $radiusMeters : null,
                'available_check_in_modes' => ['office', 'field'],
            ],
            'server_time' => now()->toIso8601String(),
        ];
    }

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
        string $attendanceMode,
        ?float $latitude = null,
        ?float $longitude = null,
        ?float $accuracyMeters = null,
        ?UploadedFile $selfie = null,
    ): AttendanceRecord {
        $attendanceUser = self::resolveAttendanceUser($platformUserId, $companyId)->loadMissing('branch');
        self::assertCapturedLocation($latitude, $longitude);
        $locationValidation = self::captureLocationEvidence(
            attendanceUser: $attendanceUser,
            companyId: $companyId,
            latitude: (float) $latitude,
            longitude: (float) $longitude,
            accuracyMeters: $accuracyMeters,
            action: 'check_in',
            enforceBranchRadius: $attendanceMode === 'office',
        );
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
            'attendance_mode_in' => $attendanceMode,
            'time_in' => now()->format('H:i:s'),
            'check_in_latitude' => $locationValidation['latitude'],
            'check_in_longitude' => $locationValidation['longitude'],
            'check_in_accuracy_meters' => $locationValidation['accuracy_meters'],
            'check_in_distance_meters' => $locationValidation['distance_meters'],
            'check_in_within_branch_radius' => $locationValidation['within_branch_radius'],
            'check_in_selfie_path' => self::storeSelfie($selfie, $companyId, $platformUserId, 'check_in'),
            'status' => 'present',
        ]);

        AuditService::attendance('attendance.check_in', [
            'record_id' => $record->id,
            'attendance_user_id' => $attendanceUser->id,
            'time_in' => $record->time_in,
            'attendance_mode_in' => $attendanceMode,
            'location_validation' => $locationValidation,
        ], $companyId);

        return $record->load(['branch', 'platformUser', 'attendanceUser']);
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
        ?float $latitude = null,
        ?float $longitude = null,
        ?float $accuracyMeters = null,
        ?UploadedFile $selfie = null,
    ): AttendanceRecord {
        $attendanceUser = self::resolveAttendanceUser($platformUserId, $companyId)->loadMissing('branch');
        self::assertCapturedLocation($latitude, $longitude);
        $locationValidation = self::captureLocationEvidence(
            attendanceUser: $attendanceUser,
            companyId: $companyId,
            latitude: (float) $latitude,
            longitude: (float) $longitude,
            accuracyMeters: $accuracyMeters,
            action: 'check_out',
            enforceBranchRadius: false,
        );
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
            'check_out_latitude' => $locationValidation['latitude'],
            'check_out_longitude' => $locationValidation['longitude'],
            'check_out_accuracy_meters' => $locationValidation['accuracy_meters'],
            'check_out_distance_meters' => $locationValidation['distance_meters'],
            'check_out_within_branch_radius' => $locationValidation['within_branch_radius'],
            'check_out_selfie_path' => self::storeSelfie($selfie, $companyId, $platformUserId, 'check_out'),
        ]);

        AuditService::attendance('attendance.check_out', [
            'record_id' => $record->id,
            'time_out' => $record->time_out,
            'location_validation' => $locationValidation,
        ], $companyId);

        return $record->fresh()->load(['branch', 'platformUser', 'attendanceUser']);
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
        $perPage = min(max($perPage, 1), 100);

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
        ?string $attendanceMode = null,
        int $perPage = 15,
    ): LengthAwarePaginator {
        $perPage = min(max($perPage, 1), 100);

        return self::companyReportQuery($companyId, $from, $to, $branchId, $attendanceMode)
            ->with(['branch', 'platformUser', 'attendanceUser'])
            ->orderByDesc('date')
            ->orderBy('time_in')
            ->paginate($perPage);
    }

    /**
     * Stats for attendance report.
     */
    public static function companyReportStats(
        int $companyId,
        ?string $from = null,
        ?string $to = null,
        ?int $branchId = null,
        ?string $attendanceMode = null,
    ): array {
        $baseQuery = self::companyReportQuery($companyId, $from, $to, $branchId, $attendanceMode);

        return [
            'total' => (clone $baseQuery)->count(),
            'present' => (clone $baseQuery)->where('status', 'present')->count(),
            'corrected' => (clone $baseQuery)->where('status', 'corrected')->count(),
            'complete' => (clone $baseQuery)->whereNotNull('time_out')->count(),
            'ongoing' => (clone $baseQuery)->whereNull('time_out')->whereNotNull('time_in')->count(),
            'office' => (clone $baseQuery)->where('attendance_mode_in', 'office')->count(),
            'field' => (clone $baseQuery)->where('attendance_mode_in', 'field')->count(),
        ];
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
     * Delete an attendance record and managed selfie evidence.
     */
    public static function deleteRecord(
        int $recordId,
        int $companyId,
        int $deletedByUserId,
    ): void {
        $record = AttendanceRecord::forCompany($companyId)
            ->with(['branch', 'platformUser'])
            ->findOrFail($recordId);

        $snapshot = [
            'record_id' => $record->id,
            'platform_user_id' => $record->platform_user_id,
            'employee_name' => $record->platformUser?->name,
            'branch_name' => $record->branch?->name,
            'date' => $record->date?->format('Y-m-d'),
            'time_in' => $record->time_in,
            'time_out' => $record->time_out,
            'status' => $record->status,
            'attendance_mode_in' => $record->attendance_mode_in,
        ];

        self::deleteManagedSelfies([
            $record->check_in_selfie_path,
            $record->check_out_selfie_path,
        ]);

        $record->delete();

        AuditService::attendance('attendance.deleted', [
            'deleted_by' => $deletedByUserId,
            'record' => $snapshot,
        ], $companyId);
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

    public static function transformRecord(AttendanceRecord $record): array
    {
        $record->loadMissing(['branch', 'platformUser', 'attendanceUser']);

        return [
            'id' => $record->id,
            'attendance_user_id' => $record->attendance_user_id,
            'platform_user_id' => $record->platform_user_id,
            'company_id' => $record->company_id,
            'branch_id' => $record->branch_id,
            'date' => $record->date?->format('Y-m-d'),
            'attendance_mode_in' => $record->attendance_mode_in,
            'time_in' => $record->time_in,
            'time_out' => $record->time_out,
            'status' => $record->status,
            'note' => $record->note,
            'employee_name' => $record->platformUser?->name ?? 'Unknown',
            'employee_email' => $record->platformUser?->email,
            'branch_name' => $record->branch?->name,
            'branch' => $record->branch ? [
                'id' => $record->branch->id,
                'name' => $record->branch->name,
                'location' => $record->branch->location,
            ] : null,
            'check_in_location' => self::buildLocationPayload(
                latitude: $record->check_in_latitude,
                longitude: $record->check_in_longitude,
                accuracyMeters: $record->check_in_accuracy_meters,
                distanceMeters: $record->check_in_distance_meters,
                withinBranchRadius: $record->check_in_within_branch_radius,
                selfiePath: $record->check_in_selfie_path,
            ),
            'check_out_location' => self::buildLocationPayload(
                latitude: $record->check_out_latitude,
                longitude: $record->check_out_longitude,
                accuracyMeters: $record->check_out_accuracy_meters,
                distanceMeters: $record->check_out_distance_meters,
                withinBranchRadius: $record->check_out_within_branch_radius,
                selfiePath: $record->check_out_selfie_path,
            ),
        ];
    }

    public static function selfieDisk(): string
    {
        return self::SELFIE_DISK;
    }

    public static function resolveAccessibleRecord(
        int $recordId,
        int $companyId,
        int $platformUserId,
        bool $companyWideAccess = false,
    ): AttendanceRecord {
        $query = AttendanceRecord::forCompany($companyId)->whereKey($recordId);

        if (! $companyWideAccess) {
            $query->where('platform_user_id', $platformUserId);
        }

        return $query->firstOrFail();
    }

    public static function resolveSelfiePath(AttendanceRecord $record, string $moment): string
    {
        $path = $moment === 'check_out'
            ? $record->check_out_selfie_path
            : $record->check_in_selfie_path;

        if (! $path) {
            throw new \RuntimeException('Selfie tidak ditemukan.');
        }

        return $path;
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

        $attendanceUser->loadMissing('branch');

        if (! $attendanceUser->branch || $attendanceUser->branch->status !== 'active') {
            AuditService::consistencyFailure(
                'Attendance profile has no active branch',
                ['attendance_user_id' => $attendanceUser->id],
                $companyId,
            );
            throw new \RuntimeException('Attendance branch is inactive or missing');
        }

        return $attendanceUser;
    }

    /**
     * Validate geofence location if the branch has coordinates configured.
     */
    private static function captureLocationEvidence(
        AttendanceUser $attendanceUser,
        int $companyId,
        float $latitude,
        float $longitude,
        ?float $accuracyMeters,
        string $action,
        bool $enforceBranchRadius,
    ): array {
        $branch = $attendanceUser->branch;

        if (! $branch || $branch->latitude === null || $branch->longitude === null) {
            return [
                'required' => true,
                'validated' => false,
                'distance_meters' => null,
                'within_branch_radius' => null,
                'radius_meters' => null,
                'latitude' => $latitude,
                'longitude' => $longitude,
                'accuracy_meters' => $accuracyMeters,
            ];
        }

        $radiusMeters = $branch->radius_meters ?: 100;

        $distanceMeters = self::calculateDistanceMeters(
            $branch->latitude,
            $branch->longitude,
            $latitude,
            $longitude,
        );
        $withinRadius = $distanceMeters <= $radiusMeters;

        if ($enforceBranchRadius && ! $withinRadius) {
            AuditService::attendance('attendance.location_rejected', [
                'attendance_user_id' => $attendanceUser->id,
                'branch_id' => $branch->id,
                'action' => $action,
                'distance_meters' => round($distanceMeters, 2),
                'radius_meters' => $radiusMeters,
                'submitted_latitude' => $latitude,
                'submitted_longitude' => $longitude,
            ], $companyId);

            throw new \RuntimeException(
                sprintf(
                    'Anda berada di luar radius absensi %s (%.0f m dari titik absensi)',
                    $branch->name,
                    $distanceMeters,
                )
            );
        }

        return [
            'required' => true,
            'validated' => true,
            'distance_meters' => round($distanceMeters, 2),
            'within_branch_radius' => $withinRadius,
            'radius_meters' => $radiusMeters,
            'latitude' => $latitude,
            'longitude' => $longitude,
            'accuracy_meters' => $accuracyMeters,
        ];
    }

    private static function assertCapturedLocation(?float $latitude, ?float $longitude): void
    {
        if ($latitude === null || $longitude === null) {
            throw new \RuntimeException('Lokasi wajib tersedia untuk melakukan absensi.');
        }
    }

    private static function storeSelfie(
        ?UploadedFile $selfie,
        int $companyId,
        int $platformUserId,
        string $action,
    ): ?string {
        if (! $selfie instanceof UploadedFile) {
            return null;
        }

        return $selfie->store(
            sprintf('attendance-selfies/%d/%d/%s/%s', $companyId, $platformUserId, now()->format('Y/m'), $action),
            self::SELFIE_DISK,
        );
    }

    /**
     * @param  array<int, string|null>  $paths
     */
    private static function deleteManagedSelfies(array $paths): void
    {
        $managedPaths = collect($paths)
            ->filter(fn ($path) => is_string($path) && str_starts_with($path, 'attendance-selfies/'))
            ->values()
            ->all();

        if ($managedPaths === []) {
            return;
        }

        Storage::disk(self::SELFIE_DISK)->delete($managedPaths);
    }

    private static function buildLocationPayload(
        ?float $latitude,
        ?float $longitude,
        ?float $accuracyMeters,
        ?float $distanceMeters,
        ?bool $withinBranchRadius,
        ?string $selfiePath,
    ): ?array {
        if ($latitude === null || $longitude === null) {
            return null;
        }

        return [
            'latitude' => $latitude,
            'longitude' => $longitude,
            'accuracy_meters' => $accuracyMeters,
            'distance_meters' => $distanceMeters,
            'within_branch_radius' => $withinBranchRadius,
            'map_url' => self::buildMapUrl($latitude, $longitude),
            'selfie_available' => $selfiePath !== null,
        ];
    }

    private static function buildMapUrl(float $latitude, float $longitude): string
    {
        return sprintf('https://www.google.com/maps?q=%s,%s', $latitude, $longitude);
    }

    private static function calculateDistanceMeters(
        float $lat1,
        float $lng1,
        float $lat2,
        float $lng2,
    ): float {
        $earthRadius = 6371000;

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return 2 * $earthRadius * atan2(sqrt($a), sqrt(1 - $a));
    }

    private static function companyReportQuery(
        int $companyId,
        ?string $from = null,
        ?string $to = null,
        ?int $branchId = null,
        ?string $attendanceMode = null,
    ) {
        $from = $from ?? now()->startOfMonth()->toDateString();
        $to = $to ?? now()->toDateString();

        return AttendanceRecord::forCompany($companyId)
            ->dateRange($from, $to)
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->when($attendanceMode, fn ($query) => $query->where('attendance_mode_in', $attendanceMode));
    }
}
