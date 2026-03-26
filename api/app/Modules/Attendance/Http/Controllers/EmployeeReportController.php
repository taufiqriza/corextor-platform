<?php

namespace App\Modules\Attendance\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Attendance\Services\EmployeeReportService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EmployeeReportController extends Controller
{
    /**
     * POST /attendance/v1/reports
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|max:160',
            'description' => 'required|string|max:5000',
            'report_date' => 'nullable|date',
            'attachments' => 'sometimes|array|max:5',
            'attachments.*' => 'file|max:5120|mimes:jpg,jpeg,png,webp,pdf,doc,docx,xls,xlsx',
        ]);

        $platformUserId = (int) $request->attributes->get('auth_user_id');
        $companyId = (int) $request->attributes->get('auth_company_id');

        try {
            $report = EmployeeReportService::submit(
                platformUserId: $platformUserId,
                companyId: $companyId,
                title: $request->input('title'),
                description: $request->input('description'),
                reportDate: $request->input('report_date'),
                attachments: $request->file('attachments', []),
            );

            return ApiResponse::created(
                data: $this->transformReport($report),
                message: 'Laporan berhasil dikirim',
            );
        } catch (\RuntimeException $e) {
            return ApiResponse::conflict($e->getMessage());
        }
    }

    /**
     * GET /attendance/v1/reports
     */
    public function myReports(Request $request): JsonResponse
    {
        $request->validate([
            'from' => 'nullable|date',
            'to' => 'nullable|date',
            'per_page' => 'nullable|integer|min:1|max:50',
            'page' => 'nullable|integer|min:1',
        ]);

        $platformUserId = (int) $request->attributes->get('auth_user_id');
        $companyId = (int) $request->attributes->get('auth_company_id');

        $reports = EmployeeReportService::myReports(
            platformUserId: $platformUserId,
            companyId: $companyId,
            from: $request->query('from'),
            to: $request->query('to'),
            perPage: (int) $request->query('per_page', EmployeeReportService::DEFAULT_PER_PAGE),
        );

        return ApiResponse::success([
            'stats' => EmployeeReportService::myStats(
                platformUserId: $platformUserId,
                companyId: $companyId,
                from: $request->query('from'),
                to: $request->query('to'),
            ),
            'pagination' => $this->transformPaginator($reports),
        ]);
    }

    /**
     * GET /attendance/v1/reports/company
     */
    public function companyReports(Request $request): JsonResponse
    {
        $request->validate([
            'from' => 'nullable|date',
            'to' => 'nullable|date',
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
        ]);

        $companyId = (int) $request->attributes->get('auth_company_id');

        $reports = EmployeeReportService::companyReports(
            companyId: $companyId,
            from: $request->query('from'),
            to: $request->query('to'),
            perPage: (int) $request->query('per_page', EmployeeReportService::DEFAULT_PER_PAGE),
        );

        return ApiResponse::success([
            'stats' => EmployeeReportService::companyStats(
                companyId: $companyId,
                from: $request->query('from'),
                to: $request->query('to'),
            ),
            'pagination' => $this->transformPaginator($reports),
        ]);
    }

    public function downloadAttachment(Request $request, int $reportId, int $attachmentIndex): StreamedResponse|JsonResponse
    {
        $platformUserId = (int) $request->attributes->get('auth_user_id');
        $companyId = (int) $request->attributes->get('auth_company_id');
        $role = (string) $request->attributes->get('auth_role');

        $companyWideAccess = in_array($role, ['company_admin', 'super_admin'], true);

        try {
            $report = EmployeeReportService::resolveAccessibleReport(
                reportId: $reportId,
                companyId: $companyId,
                platformUserId: $platformUserId,
                companyWideAccess: $companyWideAccess,
            );
            $attachment = EmployeeReportService::resolveAttachment($report, $attachmentIndex);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return ApiResponse::notFound('Laporan tidak ditemukan.');
        } catch (\RuntimeException $e) {
            return ApiResponse::notFound($e->getMessage());
        }

        $headers = [];
        if (! empty($attachment['mime_type'])) {
            $headers['Content-Type'] = $attachment['mime_type'];
        }

        return Storage::disk(EmployeeReportService::attachmentDisk())->download(
            $attachment['path'],
            $attachment['name'] ?? basename($attachment['path']),
            $headers,
        );
    }

    /**
     * DELETE /attendance/v1/reports/company/{reportId} (admin only)
     */
    public function destroy(Request $request, int $reportId): JsonResponse
    {
        $companyId = (int) $request->attributes->get('auth_company_id');
        $deletedBy = (int) $request->attributes->get('auth_user_id');

        try {
            EmployeeReportService::deleteForCompany(
                reportId: $reportId,
                companyId: $companyId,
                deletedByUserId: $deletedBy,
            );
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return ApiResponse::notFound('Laporan tidak ditemukan.');
        }

        return ApiResponse::success(message: 'Laporan berhasil dihapus.');
    }

    private function transformPaginator($paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'data' => $paginator->getCollection()->map(fn ($report) => $this->transformReport($report))->values(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'last_page' => $paginator->lastPage(),
        ];
    }

    private function transformReport($report): array
    {
        $attachments = collect($report->attachments_json ?? [])
            ->values()
            ->map(fn ($attachment, $index) => [
                'download_index' => $index,
                'name' => $attachment['name'] ?? 'attachment',
                'mime_type' => $attachment['mime_type'] ?? null,
                'size_bytes' => $attachment['size_bytes'] ?? null,
            ])
            ->all();

        return [
            'id' => $report->id,
            'attendance_user_id' => $report->attendance_user_id,
            'platform_user_id' => $report->platform_user_id,
            'company_id' => $report->company_id,
            'branch_id' => $report->branch_id,
            'report_date' => $report->report_date?->format('Y-m-d'),
            'title' => $report->title,
            'description' => $report->description,
            'status' => $report->status,
            'created_at' => $report->created_at?->toISOString(),
            'attachments' => $attachments,
            'employee_name' => $report->platformUser?->name,
            'employee_email' => $report->platformUser?->email,
            'branch_name' => $report->branch?->name,
        ];
    }
}
