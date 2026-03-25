<?php

namespace App\Modules\Payroll\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Payroll\Services\PayrollRunService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PayrollRunController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'status' => 'nullable|in:draft,finalized,paid,cancelled',
            'per_page' => 'nullable|integer|min:1|max:50',
        ]);

        $companyId = (int) $request->attributes->get('auth_company_id');

        return ApiResponse::success(PayrollRunService::listByCompany($companyId, $request->only('status', 'per_page')));
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'pay_schedule_id' => 'nullable|integer',
            'period_start' => 'required|date',
            'period_end' => 'required|date|after_or_equal:period_start',
            'payout_date' => 'nullable|date|after_or_equal:period_end',
        ]);

        $companyId = (int) $request->attributes->get('auth_company_id');
        $actorUserId = (int) $request->attributes->get('auth_user_id');

        try {
            $run = PayrollRunService::createDraft($companyId, $request->only('pay_schedule_id', 'period_start', 'period_end', 'payout_date'), $actorUserId);
            return ApiResponse::created($run);
        } catch (\RuntimeException $e) {
            return ApiResponse::conflict($e->getMessage());
        }
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $companyId = (int) $request->attributes->get('auth_company_id');

        return ApiResponse::success(PayrollRunService::show($companyId, $id));
    }

    public function finalize(Request $request, int $id): JsonResponse
    {
        $companyId = (int) $request->attributes->get('auth_company_id');
        $actorUserId = (int) $request->attributes->get('auth_user_id');

        try {
            $run = PayrollRunService::finalize($companyId, $id, $actorUserId);
            return ApiResponse::success($run, 'Payroll run finalized');
        } catch (\RuntimeException $e) {
            return ApiResponse::conflict($e->getMessage());
        }
    }
}
