<?php

namespace App\Modules\Payroll\Services;

use App\Modules\Platform\Audit\AuditService;
use App\Modules\Platform\Subscription\SubscriptionService;
use Illuminate\Support\Facades\DB;

class PayrollAttendanceBridgeService
{
    public static function summarize(int $companyId, int $platformUserId, string $periodStart, string $periodEnd): array
    {
        if (! SubscriptionService::hasActiveProduct($companyId, 'attendance')) {
            return [
                'integrated' => false,
                'source' => 'attendance_not_subscribed',
                'present_days' => 0,
                'office_days' => 0,
                'field_days' => 0,
                'complete_days' => 0,
            ];
        }

        try {
            $row = DB::connection('attendance')
                ->table('attendance_records')
                ->where('company_id', $companyId)
                ->where('platform_user_id', $platformUserId)
                ->whereBetween('date', [$periodStart, $periodEnd])
                ->selectRaw('COUNT(*) as present_days')
                ->selectRaw("SUM(CASE WHEN attendance_mode_in = 'office' THEN 1 ELSE 0 END) as office_days")
                ->selectRaw("SUM(CASE WHEN attendance_mode_in = 'field' THEN 1 ELSE 0 END) as field_days")
                ->selectRaw('SUM(CASE WHEN time_out IS NOT NULL THEN 1 ELSE 0 END) as complete_days')
                ->first();

            return [
                'integrated' => true,
                'source' => 'attendance',
                'present_days' => (int) ($row->present_days ?? 0),
                'office_days' => (int) ($row->office_days ?? 0),
                'field_days' => (int) ($row->field_days ?? 0),
                'complete_days' => (int) ($row->complete_days ?? 0),
            ];
        } catch (\Throwable $e) {
            AuditService::consistencyFailure('Payroll failed to read attendance snapshot', [
                'product' => 'payroll',
                'platform_user_id' => $platformUserId,
                'period_start' => $periodStart,
                'period_end' => $periodEnd,
                'reason' => $e->getMessage(),
            ], $companyId);

            return [
                'integrated' => false,
                'source' => 'attendance_unavailable',
                'present_days' => 0,
                'office_days' => 0,
                'field_days' => 0,
                'complete_days' => 0,
            ];
        }
    }
}
