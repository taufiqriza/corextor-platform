<?php

namespace App\Modules\Payroll\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Payroll\Services\PayrollComponentService;
use App\Modules\Payroll\Services\PayrollDashboardService;
use App\Modules\Payroll\Services\PayrollDirectoryService;
use App\Modules\Payroll\Services\PayrollProfileService;
use App\Modules\Payroll\Services\PayrollScheduleService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PayrollSetupController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $companyId = (int) $request->attributes->get('auth_company_id');

        return ApiResponse::success(PayrollDashboardService::summary($companyId));
    }

    public function directory(Request $request): JsonResponse
    {
        $companyId = (int) $request->attributes->get('auth_company_id');
        $profiles = PayrollProfileService::listByCompany($companyId);
        $profileIds = collect($profiles)->pluck('platform_user_id')->all();

        $directory = PayrollDirectoryService::listEligibleMembers($companyId)
            ->map(fn ($item) => [
                ...$item,
                'has_payroll_profile' => in_array($item['platform_user_id'], $profileIds, true),
            ])
            ->values();

        return ApiResponse::success($directory);
    }

    public function schedules(Request $request): JsonResponse
    {
        $companyId = (int) $request->attributes->get('auth_company_id');
        return ApiResponse::success(PayrollScheduleService::listByCompany($companyId));
    }

    public function storeSchedule(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'cutoff_day' => 'nullable|integer|between:1,31',
            'payout_day' => 'nullable|integer|between:1,31',
            'status' => 'nullable|in:active,inactive',
        ]);

        $companyId = (int) $request->attributes->get('auth_company_id');
        $schedule = PayrollScheduleService::create($companyId, $request->only('name', 'cutoff_day', 'payout_day', 'status'));

        return ApiResponse::created($schedule);
    }

    public function updateSchedule(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'cutoff_day' => 'nullable|integer|between:1,31',
            'payout_day' => 'nullable|integer|between:1,31',
            'status' => 'nullable|in:active,inactive',
        ]);

        $companyId = (int) $request->attributes->get('auth_company_id');
        $schedule = PayrollScheduleService::update($companyId, $id, $request->only('name', 'cutoff_day', 'payout_day', 'status'));

        return ApiResponse::success($schedule);
    }

    public function components(Request $request): JsonResponse
    {
        $companyId = (int) $request->attributes->get('auth_company_id');
        return ApiResponse::success(PayrollComponentService::listByCompany($companyId));
    }

    public function storeComponent(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:earning,deduction',
            'amount_type' => 'nullable|in:fixed,manual',
            'default_amount' => 'nullable|numeric|min:0',
            'is_recurring' => 'nullable|boolean',
            'taxable' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0',
            'status' => 'nullable|in:active,inactive',
        ]);

        $companyId = (int) $request->attributes->get('auth_company_id');
        $component = PayrollComponentService::create($companyId, $request->only(
            'name',
            'type',
            'amount_type',
            'default_amount',
            'is_recurring',
            'taxable',
            'sort_order',
            'status',
        ));

        return ApiResponse::created($component);
    }

    public function updateComponent(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'amount_type' => 'nullable|in:fixed,manual',
            'default_amount' => 'nullable|numeric|min:0',
            'is_recurring' => 'nullable|boolean',
            'taxable' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0',
            'status' => 'nullable|in:active,inactive',
        ]);

        $companyId = (int) $request->attributes->get('auth_company_id');
        $component = PayrollComponentService::update($companyId, $id, $request->only(
            'name',
            'amount_type',
            'default_amount',
            'is_recurring',
            'taxable',
            'sort_order',
            'status',
        ));

        return ApiResponse::success($component);
    }

    public function profiles(Request $request): JsonResponse
    {
        $companyId = (int) $request->attributes->get('auth_company_id');
        return ApiResponse::success(PayrollProfileService::listByCompany($companyId));
    }

    public function storeProfile(Request $request): JsonResponse
    {
        $request->validate([
            'platform_user_id' => 'required|integer',
            'pay_schedule_id' => 'nullable|integer',
            'employment_type' => 'nullable|in:monthly,daily,contract',
            'base_salary' => 'required|numeric|min:0',
            'bank_name' => 'nullable|string|max:255',
            'bank_account_name' => 'nullable|string|max:255',
            'bank_account_number' => 'nullable|string|max:50',
            'notes' => 'nullable|string|max:1000',
            'status' => 'nullable|in:active,inactive',
            'components' => 'nullable|array',
            'components.*.payroll_component_id' => 'required|integer',
            'components.*.amount' => 'nullable|numeric|min:0',
            'components.*.status' => 'nullable|in:active,inactive',
        ]);

        $companyId = (int) $request->attributes->get('auth_company_id');

        try {
            $profile = PayrollProfileService::create($companyId, $request->all());
            return ApiResponse::created($profile);
        } catch (\RuntimeException $e) {
            return ApiResponse::conflict($e->getMessage());
        }
    }

    public function updateProfile(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'platform_user_id' => 'sometimes|integer',
            'pay_schedule_id' => 'nullable|integer',
            'employment_type' => 'nullable|in:monthly,daily,contract',
            'base_salary' => 'nullable|numeric|min:0',
            'bank_name' => 'nullable|string|max:255',
            'bank_account_name' => 'nullable|string|max:255',
            'bank_account_number' => 'nullable|string|max:50',
            'notes' => 'nullable|string|max:1000',
            'status' => 'nullable|in:active,inactive',
            'components' => 'nullable|array',
            'components.*.payroll_component_id' => 'required|integer',
            'components.*.amount' => 'nullable|numeric|min:0',
            'components.*.status' => 'nullable|in:active,inactive',
        ]);

        $companyId = (int) $request->attributes->get('auth_company_id');

        try {
            $profile = PayrollProfileService::update($companyId, $id, $request->all());
            return ApiResponse::success($profile);
        } catch (\RuntimeException $e) {
            return ApiResponse::conflict($e->getMessage());
        }
    }
}
