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
            'platform_user_id' => 'nullable|integer',
            'email' => 'required_without:platform_user_id|email|max:255',
            'name' => 'nullable|string|max:255',
            'role' => 'nullable|string|in:employee',
            'branch_id' => 'required|integer',
            'pin' => ['required', 'string', 'regex:/^[0-9]{6}$/'],
        ]);

        $companyId = $request->attributes->get('auth_company_id');

        try {
            $result = AttendanceUserService::create($companyId, $request->only(
                'platform_user_id', 'email', 'name', 'role', 'branch_id', 'pin',
            ));
            return ApiResponse::created($result);
        } catch (\RuntimeException $e) {
            return ApiResponse::conflict($e->getMessage());
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::badRequest($e->getMessage());
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
            'pin' => ['required', 'string', 'regex:/^[0-9]{6}$/'],
        ]);

        $companyId = $request->attributes->get('auth_company_id');

        try {
            PinService::resetPin($id, $companyId, $request->input('pin'));
            return ApiResponse::success(message: 'PIN reset successful');
        } catch (\RuntimeException $e) {
            return ApiResponse::conflict($e->getMessage());
        }
    }

    /**
     * POST /attendance/v1/attendance/profile/change-pin
     */
    public function changeMyPin(Request $request): JsonResponse
    {
        $request->validate([
            'current_pin' => ['required', 'string', 'regex:/^[0-9]{6}$/'],
            'new_pin' => ['required', 'string', 'regex:/^[0-9]{6}$/', 'different:current_pin', 'confirmed'],
        ]);

        $platformUserId = (int) $request->attributes->get('auth_user_id');
        $companyId = (int) $request->attributes->get('auth_company_id');

        try {
            PinService::changeOwnPin(
                platformUserId: $platformUserId,
                companyId: $companyId,
                currentPin: $request->input('current_pin'),
                newPin: $request->input('new_pin'),
            );

            return ApiResponse::success(message: 'PIN absensi berhasil diperbarui');
        } catch (\RuntimeException $e) {
            return ApiResponse::conflict($e->getMessage());
        }
    }
}
