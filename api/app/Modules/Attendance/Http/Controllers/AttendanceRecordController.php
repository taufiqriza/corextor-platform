<?php

namespace App\Modules\Attendance\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Attendance\Services\AttendanceRecordService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AttendanceRecordController extends Controller
{
    /**
     * GET /attendance/v1/attendance/context
     */
    public function context(Request $request): JsonResponse
    {
        $userId = $request->attributes->get('auth_user_id');
        $companyId = $request->attributes->get('auth_company_id');

        $context = AttendanceRecordService::context($userId, $companyId);

        return ApiResponse::success($context);
    }

    /**
     * POST /attendance/v1/attendance/check-in
     */
    public function checkIn(Request $request): JsonResponse
    {
        $request->validate([
            'attendance_mode' => 'required|string|in:office,field',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'accuracy' => 'nullable|numeric|min:0|max:10000',
            'selfie' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        $userId = $request->attributes->get('auth_user_id');
        $companyId = $request->attributes->get('auth_company_id');

        try {
            $record = AttendanceRecordService::checkIn(
                platformUserId: $userId,
                companyId: $companyId,
                attendanceMode: $request->string('attendance_mode')->toString(),
                latitude: $request->input('latitude'),
                longitude: $request->input('longitude'),
                accuracyMeters: $request->input('accuracy'),
                selfie: $request->file('selfie'),
            );

            return ApiResponse::created(AttendanceRecordService::transformRecord($record));
        } catch (\RuntimeException $e) {
            return ApiResponse::conflict($e->getMessage());
        }
    }

    /**
     * POST /attendance/v1/attendance/check-out
     */
    public function checkOut(Request $request): JsonResponse
    {
        $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'accuracy' => 'nullable|numeric|min:0|max:10000',
            'selfie' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        $userId = $request->attributes->get('auth_user_id');
        $companyId = $request->attributes->get('auth_company_id');

        try {
            $record = AttendanceRecordService::checkOut(
                platformUserId: $userId,
                companyId: $companyId,
                latitude: $request->input('latitude'),
                longitude: $request->input('longitude'),
                accuracyMeters: $request->input('accuracy'),
                selfie: $request->file('selfie'),
            );

            return ApiResponse::success(AttendanceRecordService::transformRecord($record), 'Checked out successfully');
        } catch (\RuntimeException $e) {
            return ApiResponse::conflict($e->getMessage());
        }
    }

    /**
     * GET /attendance/v1/attendance/history
     */
    public function history(Request $request): JsonResponse
    {
        $request->validate([
            'from' => 'nullable|date',
            'to' => 'nullable|date',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $userId = $request->attributes->get('auth_user_id');
        $companyId = $request->attributes->get('auth_company_id');

        $records = AttendanceRecordService::history(
            platformUserId: $userId,
            companyId: $companyId,
            from: $request->query('from'),
            to: $request->query('to'),
            perPage: (int) ($request->query('per_page', 15)),
        );

        return ApiResponse::success([
            'current_page' => $records->currentPage(),
            'data' => $records->getCollection()->map(
                fn ($record) => AttendanceRecordService::transformRecord($record)
            )->values(),
            'per_page' => $records->perPage(),
            'total' => $records->total(),
            'last_page' => $records->lastPage(),
        ]);
    }

    /**
     * GET /attendance/v1/attendance/report (admin only)
     */
    public function report(Request $request): JsonResponse
    {
        $request->validate([
            'from' => 'nullable|date',
            'to' => 'nullable|date',
            'branch_id' => 'nullable|integer',
            'attendance_mode' => 'nullable|string|in:office,field',
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
        ]);

        $companyId = $request->attributes->get('auth_company_id');

        $records = AttendanceRecordService::companyReport(
            companyId: $companyId,
            from: $request->query('from'),
            to: $request->query('to'),
            branchId: $request->query('branch_id'),
            attendanceMode: $request->query('attendance_mode'),
            perPage: (int) $request->query('per_page', 15),
        );

        $stats = AttendanceRecordService::companyReportStats(
            companyId: $companyId,
            from: $request->query('from'),
            to: $request->query('to'),
            branchId: $request->query('branch_id'),
            attendanceMode: $request->query('attendance_mode'),
        );

        return ApiResponse::success([
            'stats' => $stats,
            'pagination' => [
                'current_page' => $records->currentPage(),
                'data' => $records->getCollection()->map(
                    fn ($record) => AttendanceRecordService::transformRecord($record)
                )->values(),
                'per_page' => $records->perPage(),
                'total' => $records->total(),
                'last_page' => $records->lastPage(),
            ],
        ]);
    }

    public function selfie(Request $request, int $id, string $moment): StreamedResponse|JsonResponse
    {
        $platformUserId = (int) $request->attributes->get('auth_user_id');
        $companyId = (int) $request->attributes->get('auth_company_id');
        $role = (string) $request->attributes->get('auth_role');
        $companyWideAccess = in_array($role, ['company_admin', 'super_admin', 'platform_staff'], true);

        try {
            $record = AttendanceRecordService::resolveAccessibleRecord(
                recordId: $id,
                companyId: $companyId,
                platformUserId: $platformUserId,
                companyWideAccess: $companyWideAccess,
            );
            $path = AttendanceRecordService::resolveSelfiePath($record, $moment);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return ApiResponse::notFound('Record absensi tidak ditemukan.');
        } catch (\RuntimeException $e) {
            return ApiResponse::notFound($e->getMessage());
        }

        return Storage::disk(AttendanceRecordService::selfieDisk())->response($path);
    }

    /**
     * PUT /attendance/v1/attendance/{id}/correct (admin only)
     */
    public function correct(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'time_in' => 'sometimes|date_format:H:i:s',
            'time_out' => 'sometimes|date_format:H:i:s',
            'note' => 'sometimes|nullable|string|max:500',
        ]);

        $companyId = $request->attributes->get('auth_company_id');
        $correctedBy = $request->attributes->get('auth_user_id');

        $record = AttendanceRecordService::correct(
            recordId: $id,
            companyId: $companyId,
            data: $request->only('time_in', 'time_out', 'note'),
            correctedByUserId: $correctedBy,
        );

        return ApiResponse::success($record, 'Attendance corrected');
    }

    /**
     * DELETE /attendance/v1/attendance/{id} (admin only)
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $companyId = (int) $request->attributes->get('auth_company_id');
        $deletedBy = (int) $request->attributes->get('auth_user_id');

        try {
            AttendanceRecordService::deleteRecord(
                recordId: $id,
                companyId: $companyId,
                deletedByUserId: $deletedBy,
            );
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return ApiResponse::notFound('Record absensi tidak ditemukan.');
        }

        return ApiResponse::success(message: 'Data absensi berhasil dihapus.');
    }

    /**
     * GET /attendance/v1/attendance/logs (admin only)
     */
    public function logs(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('auth_company_id');
        $logs = AttendanceRecordService::getAuditLogs($companyId);
        return ApiResponse::success($logs);
    }
}
