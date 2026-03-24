<?php

namespace App\Modules\Attendance\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Attendance\Services\AttendanceRecordService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceRecordController extends Controller
{
    /**
     * POST /attendance/v1/attendance/check-in
     */
    public function checkIn(Request $request): JsonResponse
    {
        $userId = $request->attributes->get('auth_user_id');
        $companyId = $request->attributes->get('auth_company_id');

        try {
            $record = AttendanceRecordService::checkIn($userId, $companyId);
            return ApiResponse::created($record);
        } catch (\RuntimeException $e) {
            return ApiResponse::conflict($e->getMessage());
        }
    }

    /**
     * POST /attendance/v1/attendance/check-out
     */
    public function checkOut(Request $request): JsonResponse
    {
        $userId = $request->attributes->get('auth_user_id');
        $companyId = $request->attributes->get('auth_company_id');

        try {
            $record = AttendanceRecordService::checkOut($userId, $companyId);
            return ApiResponse::success($record, 'Checked out successfully');
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
        ]);

        $userId = $request->attributes->get('auth_user_id');
        $companyId = $request->attributes->get('auth_company_id');

        $records = AttendanceRecordService::history(
            platformUserId: $userId,
            companyId: $companyId,
            from: $request->query('from'),
            to: $request->query('to'),
        );

        return ApiResponse::success($records);
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
        ]);

        $companyId = $request->attributes->get('auth_company_id');

        $records = AttendanceRecordService::companyReport(
            companyId: $companyId,
            from: $request->query('from'),
            to: $request->query('to'),
            branchId: $request->query('branch_id'),
        );

        $stats = AttendanceRecordService::companyReportStats(
            companyId: $companyId,
            from: $request->query('from'),
            to: $request->query('to'),
        );

        $data = $records->map(fn ($r) => [
            'id'                 => $r->id,
            'attendance_user_id' => $r->attendance_user_id,
            'platform_user_id'   => $r->platform_user_id,
            'company_id'         => $r->company_id,
            'branch_id'          => $r->branch_id,
            'date'               => $r->date?->format('Y-m-d'),
            'time_in'            => $r->time_in,
            'time_out'           => $r->time_out,
            'status'             => $r->status,
            'note'               => $r->note,
            'employee_name'      => $r->platformUser?->name ?? 'Unknown',
            'employee_email'     => $r->platformUser?->email,
            'branch_name'        => $r->branch?->name,
        ]);

        return ApiResponse::success([
            'stats'   => $stats,
            'records' => $data,
        ]);
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
     * GET /attendance/v1/attendance/logs (admin only)
     */
    public function logs(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('auth_company_id');
        $logs = AttendanceRecordService::getAuditLogs($companyId);
        return ApiResponse::success($logs);
    }
}
