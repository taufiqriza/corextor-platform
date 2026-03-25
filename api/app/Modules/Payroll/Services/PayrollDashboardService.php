<?php

namespace App\Modules\Payroll\Services;

use App\Modules\Payroll\Models\PayrollComponent;
use App\Modules\Payroll\Models\PayrollEmployeeProfile;
use App\Modules\Payroll\Models\PayrollRun;
use App\Modules\Payroll\Models\PayrollSchedule;
use App\Modules\Platform\Subscription\SubscriptionService;

class PayrollDashboardService
{
    public static function summary(int $companyId): array
    {
        $latestRun = PayrollRun::forCompany($companyId)
            ->with('schedule')
            ->latest('created_at')
            ->first();

        return [
            'stats' => [
                'schedules' => PayrollSchedule::forCompany($companyId)->count(),
                'active_schedules' => PayrollSchedule::forCompany($companyId)->active()->count(),
                'components' => PayrollComponent::forCompany($companyId)->count(),
                'profiles' => PayrollEmployeeProfile::forCompany($companyId)->count(),
                'active_profiles' => PayrollEmployeeProfile::forCompany($companyId)->active()->count(),
                'runs' => PayrollRun::forCompany($companyId)->count(),
                'draft_runs' => PayrollRun::forCompany($companyId)->where('status', 'draft')->count(),
            ],
            'integrations' => [
                'attendance' => SubscriptionService::hasActiveProduct($companyId, 'attendance'),
            ],
            'latest_run' => $latestRun ? [
                'id' => $latestRun->id,
                'reference_code' => $latestRun->reference_code,
                'status' => $latestRun->status,
                'period_start' => optional($latestRun->period_start)->toDateString(),
                'period_end' => optional($latestRun->period_end)->toDateString(),
                'payout_date' => optional($latestRun->payout_date)->toDateString(),
                'employees_count' => $latestRun->employees_count,
                'net_total' => (float) $latestRun->net_total,
                'schedule' => $latestRun->schedule ? [
                    'id' => $latestRun->schedule->id,
                    'name' => $latestRun->schedule->name,
                ] : null,
            ] : null,
        ];
    }
}
