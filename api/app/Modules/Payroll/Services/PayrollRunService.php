<?php

namespace App\Modules\Payroll\Services;

use App\Modules\Payroll\Models\PayrollEmployeeProfile;
use App\Modules\Payroll\Models\PayrollProfileComponent;
use App\Modules\Payroll\Models\PayrollRun;
use App\Modules\Payroll\Models\PayrollRunItem;
use App\Modules\Platform\Audit\AuditService;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class PayrollRunService
{
    public static function listByCompany(int $companyId, array $filters = []): array
    {
        $perPage = min(max((int) ($filters['per_page'] ?? 15), 1), 50);
        $status = $filters['status'] ?? null;

        $pagination = PayrollRun::forCompany($companyId)
            ->with('schedule')
            ->withCount('items')
            ->when($status, fn ($query) => $query->where('status', $status))
            ->orderByDesc('period_end')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return [
            'stats' => [
                'total' => PayrollRun::forCompany($companyId)->count(),
                'draft' => PayrollRun::forCompany($companyId)->where('status', 'draft')->count(),
                'finalized' => PayrollRun::forCompany($companyId)->where('status', 'finalized')->count(),
                'paid' => PayrollRun::forCompany($companyId)->where('status', 'paid')->count(),
            ],
            'pagination' => self::formatRunPaginator($pagination),
        ];
    }

    public static function show(int $companyId, int $runId): array
    {
        $run = PayrollRun::forCompany($companyId)
            ->with(['schedule', 'items'])
            ->findOrFail($runId);

        $userMap = PayrollDirectoryService::mapUsers($run->items->pluck('platform_user_id')->all());

        return self::formatRun($run, $userMap, true);
    }

    public static function createDraft(int $companyId, array $data, int $actorUserId): array
    {
        $schedule = PayrollScheduleService::requireForCompany($companyId, isset($data['pay_schedule_id']) ? (int) $data['pay_schedule_id'] : null);
        $periodStart = $data['period_start'];
        $periodEnd = $data['period_end'];

        $duplicate = PayrollRun::forCompany($companyId)
            ->where('period_start', $periodStart)
            ->where('period_end', $periodEnd)
            ->when($schedule?->id, fn ($query) => $query->where('pay_schedule_id', $schedule->id), fn ($query) => $query->whereNull('pay_schedule_id'))
            ->whereIn('status', ['draft', 'finalized', 'paid'])
            ->exists();

        if ($duplicate) {
            throw new \RuntimeException('Payroll run untuk periode ini sudah ada.');
        }

        $profiles = PayrollEmployeeProfile::forCompany($companyId)
            ->active()
            ->with(['components.component', 'schedule'])
            ->when($schedule?->id, fn ($query) => $query->where('pay_schedule_id', $schedule->id))
            ->orderBy('platform_user_id')
            ->get();

        if ($profiles->isEmpty()) {
            throw new \RuntimeException('Belum ada payroll profile aktif untuk digenerate.');
        }

        $directory = PayrollDirectoryService::mapUsers($profiles->pluck('platform_user_id')->all());
        $referenceCode = self::generateReferenceCode($companyId, $periodStart);

        $run = DB::connection('payroll')->transaction(function () use ($actorUserId, $companyId, $data, $directory, $periodEnd, $periodStart, $profiles, $referenceCode, $schedule) {
            $run = PayrollRun::create([
                'company_id' => $companyId,
                'pay_schedule_id' => $schedule?->id,
                'reference_code' => $referenceCode,
                'period_start' => $periodStart,
                'period_end' => $periodEnd,
                'payout_date' => $data['payout_date'] ?? null,
                'status' => 'draft',
                'generated_by_user_id' => $actorUserId,
                'metadata_json' => [
                    'attendance_snapshot_enabled' => true,
                    'generated_from' => 'payroll_service',
                ],
            ]);

            $earningsTotal = 0.0;
            $deductionsTotal = 0.0;
            $netTotal = 0.0;

            foreach ($profiles as $profile) {
                $user = $directory[$profile->platform_user_id] ?? [
                    'name' => "User #{$profile->platform_user_id}",
                    'email' => null,
                ];

                $lines = [[
                    'code' => 'base_salary',
                    'name' => 'Gaji Pokok',
                    'type' => 'earning',
                    'amount' => (float) $profile->base_salary,
                ]];

                foreach ($profile->components as $assignment) {
                    if ($assignment->status !== 'active' || ! $assignment->component || $assignment->component->status !== 'active') {
                        continue;
                    }

                    $lines[] = [
                        'code' => $assignment->component->code,
                        'name' => $assignment->component->name,
                        'type' => $assignment->component->type,
                        'amount' => (float) $assignment->amount,
                    ];
                }

                $attendanceSummary = PayrollAttendanceBridgeService::summarize(
                    companyId: $companyId,
                    platformUserId: $profile->platform_user_id,
                    periodStart: $periodStart,
                    periodEnd: $periodEnd,
                );

                $itemTotals = self::calculateTotals($lines);
                $earningsTotal += $itemTotals['earnings_total'];
                $deductionsTotal += $itemTotals['deductions_total'];
                $netTotal += $itemTotals['net_total'];

                PayrollRunItem::create([
                    'payroll_run_id' => $run->id,
                    'company_id' => $companyId,
                    'platform_user_id' => $profile->platform_user_id,
                    'payroll_employee_profile_id' => $profile->id,
                    'employee_name_snapshot' => $user['name'],
                    'attendance_summary_json' => $attendanceSummary,
                    'component_lines_json' => $lines,
                    'earnings_total' => $itemTotals['earnings_total'],
                    'deductions_total' => $itemTotals['deductions_total'],
                    'net_total' => $itemTotals['net_total'],
                    'status' => 'draft',
                ]);
            }

            $run->update([
                'employees_count' => $profiles->count(),
                'earnings_total' => $earningsTotal,
                'deductions_total' => $deductionsTotal,
                'net_total' => $netTotal,
            ]);

            return $run;
        });

        AuditService::product('payroll', 'payroll.run_created', [
            'run_id' => $run->id,
            'reference_code' => $run->reference_code,
            'period_start' => $periodStart,
            'period_end' => $periodEnd,
            'employees_count' => $run->employees_count,
        ], $companyId);

        return self::show($companyId, $run->id);
    }

    public static function finalize(int $companyId, int $runId, int $actorUserId): array
    {
        $run = PayrollRun::forCompany($companyId)->with('items')->findOrFail($runId);

        if ($run->status !== 'draft') {
            throw new \RuntimeException('Hanya payroll run draft yang bisa difinalisasi.');
        }

        DB::connection('payroll')->transaction(function () use ($actorUserId, $run) {
            $run->update([
                'status' => 'finalized',
                'finalized_by_user_id' => $actorUserId,
                'finalized_at' => now(),
            ]);

            PayrollRunItem::query()
                ->where('payroll_run_id', $run->id)
                ->update(['status' => 'finalized']);
        });

        AuditService::product('payroll', 'payroll.run_finalized', [
            'run_id' => $run->id,
            'reference_code' => $run->reference_code,
        ], $companyId);

        return self::show($companyId, $run->id);
    }

    private static function calculateTotals(array $lines): array
    {
        $earnings = collect($lines)
            ->filter(fn ($line) => ($line['type'] ?? null) === 'earning')
            ->sum(fn ($line) => (float) ($line['amount'] ?? 0));

        $deductions = collect($lines)
            ->filter(fn ($line) => ($line['type'] ?? null) === 'deduction')
            ->sum(fn ($line) => (float) ($line['amount'] ?? 0));

        return [
            'earnings_total' => $earnings,
            'deductions_total' => $deductions,
            'net_total' => $earnings - $deductions,
        ];
    }

    private static function generateReferenceCode(int $companyId, string $periodStart): string
    {
        $datePart = str_replace('-', '', substr($periodStart, 0, 7)) . date('d');
        $sequence = PayrollRun::forCompany($companyId)->count() + 1;

        return sprintf('PAY-%s-%04d', $datePart, $sequence);
    }

    private static function formatRunPaginator(LengthAwarePaginator $pagination): array
    {
        $userMap = PayrollDirectoryService::mapUsers(
            PayrollRunItem::query()
                ->whereIn('payroll_run_id', $pagination->getCollection()->pluck('id')->all())
                ->pluck('platform_user_id')
                ->all()
        );

        return [
            'current_page' => $pagination->currentPage(),
            'per_page' => $pagination->perPage(),
            'last_page' => $pagination->lastPage(),
            'total' => $pagination->total(),
            'data' => $pagination->getCollection()
                ->map(fn (PayrollRun $run) => self::formatRun($run, $userMap))
                ->values(),
        ];
    }

    private static function formatRun(PayrollRun $run, array $userMap, bool $withItems = false): array
    {
        $base = [
            'id' => $run->id,
            'reference_code' => $run->reference_code,
            'status' => $run->status,
            'period_start' => optional($run->period_start)->toDateString(),
            'period_end' => optional($run->period_end)->toDateString(),
            'payout_date' => optional($run->payout_date)->toDateString(),
            'employees_count' => $run->employees_count,
            'earnings_total' => (float) $run->earnings_total,
            'deductions_total' => (float) $run->deductions_total,
            'net_total' => (float) $run->net_total,
            'created_at' => $run->created_at,
            'updated_at' => $run->updated_at,
            'finalized_at' => $run->finalized_at,
            'schedule' => $run->schedule ? [
                'id' => $run->schedule->id,
                'name' => $run->schedule->name,
                'cutoff_day' => $run->schedule->cutoff_day,
                'payout_day' => $run->schedule->payout_day,
            ] : null,
        ];

        if (! $withItems) {
            $base['items_count'] = $run->items_count ?? $run->items()->count();
            return $base;
        }

        $base['items'] = $run->items->map(function (PayrollRunItem $item) use ($userMap) {
            $user = $userMap[$item->platform_user_id] ?? [
                'name' => $item->employee_name_snapshot,
                'email' => null,
            ];

            return [
                'id' => $item->id,
                'platform_user_id' => $item->platform_user_id,
                'payroll_employee_profile_id' => $item->payroll_employee_profile_id,
                'employee_name' => $item->employee_name_snapshot,
                'user' => [
                    'name' => $user['name'],
                    'email' => $user['email'],
                ],
                'attendance_summary' => $item->attendance_summary_json ?? [],
                'component_lines' => $item->component_lines_json ?? [],
                'earnings_total' => (float) $item->earnings_total,
                'deductions_total' => (float) $item->deductions_total,
                'net_total' => (float) $item->net_total,
                'status' => $item->status,
            ];
        })->values();

        return $base;
    }
}
