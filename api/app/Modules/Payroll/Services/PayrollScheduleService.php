<?php

namespace App\Modules\Payroll\Services;

use App\Modules\Payroll\Models\PayrollSchedule;
use App\Modules\Platform\Audit\AuditService;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class PayrollScheduleService
{
    public static function listByCompany(int $companyId): Collection
    {
        return PayrollSchedule::forCompany($companyId)
            ->orderByDesc('status')
            ->orderBy('name')
            ->get();
    }

    public static function create(int $companyId, array $data): PayrollSchedule
    {
        $schedule = PayrollSchedule::create([
            'company_id' => $companyId,
            'code' => self::generateCode($companyId, $data['name']),
            'name' => trim((string) $data['name']),
            'pay_frequency' => 'monthly',
            'cutoff_day' => $data['cutoff_day'] ?? null,
            'payout_day' => $data['payout_day'] ?? null,
            'status' => $data['status'] ?? 'active',
        ]);

        AuditService::product('payroll', 'payroll.schedule_created', [
            'schedule_id' => $schedule->id,
            'name' => $schedule->name,
        ], $companyId);

        return $schedule;
    }

    public static function update(int $companyId, int $scheduleId, array $data): PayrollSchedule
    {
        $schedule = PayrollSchedule::forCompany($companyId)->findOrFail($scheduleId);

        $schedule->fill(array_filter([
            'name' => isset($data['name']) ? trim((string) $data['name']) : null,
            'cutoff_day' => $data['cutoff_day'] ?? $schedule->cutoff_day,
            'payout_day' => $data['payout_day'] ?? $schedule->payout_day,
            'status' => $data['status'] ?? $schedule->status,
        ], fn ($value) => $value !== null));

        $schedule->save();

        AuditService::product('payroll', 'payroll.schedule_updated', [
            'schedule_id' => $schedule->id,
            'changes' => $data,
        ], $companyId);

        return $schedule->fresh();
    }

    public static function requireForCompany(int $companyId, ?int $scheduleId): ?PayrollSchedule
    {
        if (! $scheduleId) {
            return null;
        }

        return PayrollSchedule::forCompany($companyId)->findOrFail($scheduleId);
    }

    private static function generateCode(int $companyId, string $name): string
    {
        $base = Str::limit(Str::slug($name), 40, '');
        $code = $base !== '' ? $base : "payroll-schedule-{$companyId}";
        $suffix = 1;

        while (PayrollSchedule::forCompany($companyId)->where('code', $code)->exists()) {
            $suffix++;
            $code = Str::limit($base, max(1, 40 - strlen("-{$suffix}")), '') . "-{$suffix}";
        }

        return $code;
    }
}
