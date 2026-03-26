<?php

namespace App\Modules\Attendance\Services;

use App\Modules\Attendance\Models\EmployeeReport;
use App\Modules\Platform\Audit\AuditService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class EmployeeReportService
{
    public const DEFAULT_PER_PAGE = 15;
    private const ATTACHMENT_DISK = 'local';

    /**
     * Submit a new employee report.
     *
     * @param  UploadedFile[]  $attachments
     */
    public static function submit(
        int $platformUserId,
        int $companyId,
        string $title,
        string $description,
        ?string $reportDate = null,
        array $attachments = [],
    ): EmployeeReport {
        $attendanceUser = AttendanceUserService::findByPlatformUser($platformUserId, $companyId);

        if (! $attendanceUser) {
            throw new \RuntimeException('Profil attendance aktif tidak ditemukan.');
        }

        $report = EmployeeReport::create([
            'attendance_user_id' => $attendanceUser->id,
            'platform_user_id' => $platformUserId,
            'company_id' => $companyId,
            'branch_id' => $attendanceUser->branch_id,
            'report_date' => $reportDate ?: now()->toDateString(),
            'title' => trim($title),
            'description' => trim($description),
            'attachments_json' => self::storeAttachments($attachments, $companyId),
            'status' => 'submitted',
        ]);

        AuditService::attendance('employee_report.submitted', [
            'employee_report_id' => $report->id,
            'attendance_user_id' => $attendanceUser->id,
            'attachments_count' => count($attachments),
        ], $companyId);

        return $report->load(['branch', 'platformUser']);
    }

    public static function myReports(
        int $platformUserId,
        int $companyId,
        ?string $from = null,
        ?string $to = null,
        int $perPage = self::DEFAULT_PER_PAGE,
    ): LengthAwarePaginator {
        $from = $from ?? now()->startOfMonth()->toDateString();
        $to = $to ?? now()->toDateString();
        $perPage = min(max($perPage, 1), 50);

        return EmployeeReport::forCompany($companyId)
            ->forPlatformUser($platformUserId)
            ->whereBetween('report_date', [$from, $to])
            ->with(['branch', 'platformUser'])
            ->orderByDesc('report_date')
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    public static function companyReports(
        int $companyId,
        ?string $from = null,
        ?string $to = null,
        int $perPage = self::DEFAULT_PER_PAGE,
    ): LengthAwarePaginator {
        $from = $from ?? now()->startOfMonth()->toDateString();
        $to = $to ?? now()->toDateString();
        $perPage = min(max($perPage, 1), 100);

        return EmployeeReport::forCompany($companyId)
            ->whereBetween('report_date', [$from, $to])
            ->with(['branch', 'platformUser'])
            ->orderByDesc('report_date')
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    public static function companyStats(
        int $companyId,
        ?string $from = null,
        ?string $to = null,
    ): array {
        $from = $from ?? now()->startOfMonth()->toDateString();
        $to = $to ?? now()->toDateString();

        $reports = EmployeeReport::forCompany($companyId)
            ->whereBetween('report_date', [$from, $to])
            ->get();

        return [
            'total' => $reports->count(),
            'today' => $reports->filter(fn ($report) => $report->report_date?->format('Y-m-d') === now()->toDateString())->count(),
            'with_attachments' => $reports->filter(fn ($report) => ! empty($report->attachments_json))->count(),
            'employees' => $reports->pluck('platform_user_id')->unique()->count(),
        ];
    }

    public static function myStats(
        int $platformUserId,
        int $companyId,
        ?string $from = null,
        ?string $to = null,
    ): array {
        $from = $from ?? now()->startOfMonth()->toDateString();
        $to = $to ?? now()->toDateString();

        $reports = EmployeeReport::forCompany($companyId)
            ->forPlatformUser($platformUserId)
            ->whereBetween('report_date', [$from, $to])
            ->get();

        return [
            'total' => $reports->count(),
            'today' => $reports->filter(fn ($report) => $report->report_date?->format('Y-m-d') === now()->toDateString())->count(),
            'with_attachments' => $reports->filter(fn ($report) => ! empty($report->attachments_json))->count(),
        ];
    }

    /**
     * @param  UploadedFile[]  $attachments
     * @return array<int, array<string, mixed>>
     */
    private static function storeAttachments(array $attachments, int $companyId): array
    {
        $items = [];

        foreach ($attachments as $file) {
            if (! $file instanceof UploadedFile) {
                continue;
            }

            $storedPath = $file->store(
                sprintf('employee-reports/%d/%s', $companyId, now()->format('Y/m')),
                self::ATTACHMENT_DISK,
            );

            $items[] = [
                'name' => $file->getClientOriginalName(),
                'mime_type' => $file->getClientMimeType(),
                'size_bytes' => $file->getSize(),
                'path' => $storedPath,
            ];
        }

        return $items;
    }

    public static function attachmentDisk(): string
    {
        return self::ATTACHMENT_DISK;
    }

    public static function resolveAccessibleReport(
        int $reportId,
        int $companyId,
        int $platformUserId,
        bool $companyWideAccess = false,
    ): EmployeeReport {
        $query = EmployeeReport::forCompany($companyId)->whereKey($reportId);

        if (! $companyWideAccess) {
            $query->forPlatformUser($platformUserId);
        }

        return $query->firstOrFail();
    }

    public static function resolveAttachment(EmployeeReport $report, int $attachmentIndex): array
    {
        $attachments = array_values($report->attachments_json ?? []);
        $attachment = $attachments[$attachmentIndex] ?? null;

        if (! is_array($attachment) || empty($attachment['path'])) {
            throw new \RuntimeException('Lampiran tidak ditemukan.');
        }

        return $attachment;
    }

    public static function deleteForCompany(
        int $reportId,
        int $companyId,
        int $deletedByUserId,
    ): void {
        $report = EmployeeReport::forCompany($companyId)
            ->with(['branch', 'platformUser'])
            ->findOrFail($reportId);

        $attachments = collect($report->attachments_json ?? [])
            ->filter(fn ($attachment) => is_array($attachment) && ! empty($attachment['path']))
            ->values();

        $managedPaths = $attachments
            ->pluck('path')
            ->filter(fn ($path) => is_string($path) && str_starts_with($path, 'employee-reports/'))
            ->values()
            ->all();

        if ($managedPaths !== []) {
            Storage::disk(self::ATTACHMENT_DISK)->delete($managedPaths);
        }

        $snapshot = [
            'employee_report_id' => $report->id,
            'platform_user_id' => $report->platform_user_id,
            'employee_name' => $report->platformUser?->name,
            'branch_name' => $report->branch?->name,
            'report_date' => $report->report_date?->format('Y-m-d'),
            'title' => $report->title,
            'attachments_count' => $attachments->count(),
        ];

        $report->delete();

        AuditService::attendance('employee_report.deleted', [
            'deleted_by' => $deletedByUserId,
            'report' => $snapshot,
        ], $companyId);
    }
}
