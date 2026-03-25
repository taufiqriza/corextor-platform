<?php

namespace App\Modules\Payroll\Services;

use App\Modules\Payroll\Models\PayrollComponent;
use App\Modules\Payroll\Models\PayrollEmployeeProfile;
use App\Modules\Payroll\Models\PayrollProfileComponent;
use App\Modules\Platform\Audit\AuditService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class PayrollProfileService
{
    public static function listByCompany(int $companyId): Collection
    {
        $profiles = PayrollEmployeeProfile::forCompany($companyId)
            ->with(['schedule', 'components.component'])
            ->orderByDesc('status')
            ->orderByDesc('updated_at')
            ->get();

        $userMap = PayrollDirectoryService::mapUsers($profiles->pluck('platform_user_id')->all());

        return $profiles->map(function (PayrollEmployeeProfile $profile) use ($userMap) {
            return self::formatProfile($profile, $userMap);
        })->values();
    }

    public static function create(int $companyId, array $data): array
    {
        $member = PayrollDirectoryService::requireEligibleMember($companyId, (int) $data['platform_user_id']);

        if (PayrollEmployeeProfile::forCompany($companyId)->where('platform_user_id', $member['platform_user_id'])->exists()) {
            throw new \RuntimeException('Karyawan ini sudah memiliki payroll profile.');
        }

        $schedule = PayrollScheduleService::requireForCompany($companyId, isset($data['pay_schedule_id']) ? (int) $data['pay_schedule_id'] : null);

        $profile = DB::connection('payroll')->transaction(function () use ($companyId, $data, $member, $schedule) {
            $profile = PayrollEmployeeProfile::create([
                'company_id' => $companyId,
                'platform_user_id' => $member['platform_user_id'],
                'pay_schedule_id' => $schedule?->id,
                'employment_type' => $data['employment_type'] ?? 'monthly',
                'base_salary' => $data['base_salary'] ?? 0,
                'bank_name' => $data['bank_name'] ?? null,
                'bank_account_name' => $data['bank_account_name'] ?? null,
                'bank_account_number' => $data['bank_account_number'] ?? null,
                'notes' => $data['notes'] ?? null,
                'status' => $data['status'] ?? 'active',
            ]);

            self::syncComponents($profile, $companyId, $data['components'] ?? []);

            return $profile;
        });

        AuditService::product('payroll', 'payroll.profile_created', [
            'profile_id' => $profile->id,
            'platform_user_id' => $profile->platform_user_id,
            'base_salary' => $profile->base_salary,
        ], $companyId);

        return self::show($companyId, $profile->id);
    }

    public static function update(int $companyId, int $profileId, array $data): array
    {
        $profile = PayrollEmployeeProfile::forCompany($companyId)->with(['schedule', 'components'])->findOrFail($profileId);

        if (isset($data['platform_user_id']) && (int) $data['platform_user_id'] !== (int) $profile->platform_user_id) {
            PayrollDirectoryService::requireEligibleMember($companyId, (int) $data['platform_user_id']);
            $profile->platform_user_id = (int) $data['platform_user_id'];
        }

        $schedule = PayrollScheduleService::requireForCompany($companyId, isset($data['pay_schedule_id']) ? (int) $data['pay_schedule_id'] : $profile->pay_schedule_id);

        DB::connection('payroll')->transaction(function () use ($companyId, $data, $profile, $schedule) {
            $profile->fill([
                'pay_schedule_id' => $schedule?->id,
                'employment_type' => $data['employment_type'] ?? $profile->employment_type,
                'base_salary' => $data['base_salary'] ?? $profile->base_salary,
                'bank_name' => array_key_exists('bank_name', $data) ? $data['bank_name'] : $profile->bank_name,
                'bank_account_name' => array_key_exists('bank_account_name', $data) ? $data['bank_account_name'] : $profile->bank_account_name,
                'bank_account_number' => array_key_exists('bank_account_number', $data) ? $data['bank_account_number'] : $profile->bank_account_number,
                'notes' => array_key_exists('notes', $data) ? $data['notes'] : $profile->notes,
                'status' => $data['status'] ?? $profile->status,
            ]);
            $profile->save();

            if (array_key_exists('components', $data)) {
                self::syncComponents($profile, $companyId, $data['components'] ?? []);
            }
        });

        AuditService::product('payroll', 'payroll.profile_updated', [
            'profile_id' => $profile->id,
            'changes' => $data,
        ], $companyId);

        return self::show($companyId, $profile->id);
    }

    public static function show(int $companyId, int $profileId): array
    {
        $profile = PayrollEmployeeProfile::forCompany($companyId)
            ->with(['schedule', 'components.component'])
            ->findOrFail($profileId);

        $userMap = PayrollDirectoryService::mapUsers([$profile->platform_user_id]);

        return self::formatProfile($profile, $userMap);
    }

    private static function syncComponents(PayrollEmployeeProfile $profile, int $companyId, array $components): void
    {
        $normalized = collect($components)
            ->filter(fn ($item) => isset($item['payroll_component_id']))
            ->map(function ($item) use ($companyId) {
                $component = PayrollComponent::forCompany($companyId)->findOrFail((int) $item['payroll_component_id']);

                return [
                    'component' => $component,
                    'amount' => (float) ($item['amount'] ?? $component->default_amount),
                    'status' => $item['status'] ?? 'active',
                ];
            })
            ->values();

        PayrollProfileComponent::query()
            ->where('payroll_employee_profile_id', $profile->id)
            ->delete();

        foreach ($normalized as $item) {
            PayrollProfileComponent::create([
                'payroll_employee_profile_id' => $profile->id,
                'payroll_component_id' => $item['component']->id,
                'amount' => $item['amount'],
                'status' => $item['status'],
            ]);
        }
    }

    private static function formatProfile(PayrollEmployeeProfile $profile, array $userMap): array
    {
        $user = $userMap[$profile->platform_user_id] ?? [
            'name' => "User #{$profile->platform_user_id}",
            'email' => null,
        ];

        return [
            'id' => $profile->id,
            'company_id' => $profile->company_id,
            'platform_user_id' => $profile->platform_user_id,
            'employment_type' => $profile->employment_type,
            'base_salary' => (float) $profile->base_salary,
            'status' => $profile->status,
            'notes' => $profile->notes,
            'bank_name' => $profile->bank_name,
            'bank_account_name' => $profile->bank_account_name,
            'bank_account_number' => $profile->bank_account_number,
            'created_at' => $profile->created_at,
            'updated_at' => $profile->updated_at,
            'user' => [
                'id' => $profile->platform_user_id,
                'name' => $user['name'],
                'email' => $user['email'],
            ],
            'schedule' => $profile->schedule ? [
                'id' => $profile->schedule->id,
                'name' => $profile->schedule->name,
                'cutoff_day' => $profile->schedule->cutoff_day,
                'payout_day' => $profile->schedule->payout_day,
                'status' => $profile->schedule->status,
            ] : null,
            'components' => $profile->components
                ->sortBy(fn (PayrollProfileComponent $component) => $component->component?->sort_order ?? 0)
                ->values()
                ->map(fn (PayrollProfileComponent $component) => [
                    'id' => $component->id,
                    'amount' => (float) $component->amount,
                    'status' => $component->status,
                    'component' => $component->component ? [
                        'id' => $component->component->id,
                        'code' => $component->component->code,
                        'name' => $component->component->name,
                        'type' => $component->component->type,
                        'amount_type' => $component->component->amount_type,
                        'default_amount' => (float) $component->component->default_amount,
                    ] : null,
                ]),
        ];
    }
}
