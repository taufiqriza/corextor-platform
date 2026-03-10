<?php

namespace App\Http\Controllers;

use App\Modules\Platform\Company\CompanyService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    /**
     * GET /platform/v1/companies
     */
    public function index(): JsonResponse
    {
        $companies = CompanyService::list();
        return ApiResponse::success($companies);
    }

    /**
     * POST /platform/v1/companies
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:platform.companies,code',
        ]);

        $company = CompanyService::create($request->only('name', 'code'));
        return ApiResponse::created($company);
    }

    /**
     * GET /platform/v1/companies/{id}
     */
    public function show(int $id): JsonResponse
    {
        $company = CompanyService::findOrFail($id);
        return ApiResponse::success($company);
    }

    /**
     * PUT /platform/v1/companies/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'status' => 'sometimes|in:active,suspended,deactivated',
        ]);

        $company = CompanyService::update($id, $request->only('name', 'status'));
        return ApiResponse::success($company);
    }

    /**
     * GET /platform/v1/companies/{id}/admins
     */
    public function admins(int $id): JsonResponse
    {
        $admins = CompanyService::getAdmins($id);

        $result = $admins->map(fn ($m) => [
            'id' => $m->user->id,
            'name' => $m->user->name,
            'email' => $m->user->email,
            'role' => $m->role,
            'status' => $m->status,
        ]);

        return ApiResponse::success($result);
    }
}
