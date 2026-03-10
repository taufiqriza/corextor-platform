<?php

namespace App\Modules\Attendance\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Attendance\Services\AttendanceUserService;
use App\Modules\Attendance\Services\PinService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceUserController extends Controller
{
    /**
     * GET /attendance/v1/users
     */
    public function index(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('auth_company_id');
        $users = AttendanceUserService::listByCompany($companyId);
        return ApiResponse::success($users);
    }

    /**
     * POST /attendance/v1/users
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'platform_user_id' => 'required|integer',
            'branch_id' => 'required|integer',
            'pin' => 'nullable|string|min:4|max:8',
        ]);

        $companyId = $request->attributes->get('auth_company_id');

        try {
            $user = AttendanceUserService::create($companyId, $request->only(
                'platform_user_id', 'branch_id', 'pin',
            ));
            return ApiResponse::created($user);
        } catch (\RuntimeException $e) {
            return ApiResponse::conflict($e->getMessage());
        }
    }

    /**
     * GET /attendance/v1/users/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $companyId = $request->attributes->get('auth_company_id');
        $user = AttendanceUserService::findForCompany($id, $companyId);
        return ApiResponse::success($user);
    }

    /**
     * PUT /attendance/v1/users/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'branch_id' => 'sometimes|integer',
            'status' => 'sometimes|in:active,suspended,deactivated',
        ]);

        $companyId = $request->attributes->get('auth_company_id');
        $user = AttendanceUserService::update($id, $companyId, $request->only('branch_id', 'status'));
        return ApiResponse::success($user);
    }

    /**
     * DELETE /attendance/v1/users/{id} (deactivate)
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $companyId = $request->attributes->get('auth_company_id');
        AttendanceUserService::deactivate($id, $companyId);
        return ApiResponse::success(message: 'Attendance user deactivated');
    }

    /**
     * POST /attendance/v1/users/{id}/reset-pin
     */
    public function resetPin(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'pin' => 'required|string|min:4|max:8',
        ]);

        $companyId = $request->attributes->get('auth_company_id');
        PinService::resetPin($id, $companyId, $request->input('pin'));
        return ApiResponse::success(message: 'PIN reset successful');
    }
}
