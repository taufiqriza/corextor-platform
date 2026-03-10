<?php

namespace App\Modules\Attendance\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Attendance\Services\BranchService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BranchController extends Controller
{
    /**
     * GET /attendance/v1/branches
     */
    public function index(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('auth_company_id');
        $branches = BranchService::listByCompany($companyId);
        return ApiResponse::success($branches);
    }

    /**
     * POST /attendance/v1/branches
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'nullable|string|max:500',
        ]);

        $companyId = $request->attributes->get('auth_company_id');
        $branch = BranchService::create($companyId, $request->only('name', 'location'));
        return ApiResponse::created($branch);
    }

    /**
     * GET /attendance/v1/branches/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $companyId = $request->attributes->get('auth_company_id');
        $branch = BranchService::findForCompany($id, $companyId);
        return ApiResponse::success($branch);
    }

    /**
     * PUT /attendance/v1/branches/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'location' => 'sometimes|nullable|string|max:500',
            'status' => 'sometimes|in:active,inactive',
        ]);

        $companyId = $request->attributes->get('auth_company_id');
        $branch = BranchService::update($id, $companyId, $request->only('name', 'location', 'status'));
        return ApiResponse::success($branch);
    }

    /**
     * DELETE /attendance/v1/branches/{id} (deactivate)
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $companyId = $request->attributes->get('auth_company_id');
        BranchService::deactivate($id, $companyId);
        return ApiResponse::success(message: 'Branch deactivated');
    }
}
