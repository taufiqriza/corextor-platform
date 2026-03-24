<?php

namespace App\Http\Controllers;

use App\Modules\Platform\Company\CompanyService;
use App\Modules\Platform\Membership\MemberService;
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

    // ── Company Members (Full CRUD via MemberService) ──

    /**
     * GET /platform/v1/companies/{id}/members
     */
    public function members(int $id): JsonResponse
    {
        $members = MemberService::listByCompany($id);
        $stats = MemberService::statsForCompany($id);

        $result = $members->map(fn ($m) => [
            'id' => $m->id,
            'user_id' => $m->user_id,
            'role' => $m->role,
            'status' => $m->status,
            'created_at' => $m->created_at?->toISOString(),
            'user' => $m->user ? [
                'id' => $m->user->id,
                'name' => $m->user->name,
                'email' => $m->user->email,
            ] : null,
        ]);

        return ApiResponse::success([
            'stats' => $stats,
            'members' => $result,
        ]);
    }

    /**
     * POST /platform/v1/companies/{id}/members
     */
    public function addMember(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|max:255',
            'name'  => 'sometimes|string|max:255',
            'role'  => 'required|string|in:company_admin,employee',
        ]);

        try {
            $membership = MemberService::addMember($id, $request->only(['email', 'name', 'role']));

            return ApiResponse::created([
                'id' => $membership->id,
                'user_id' => $membership->user_id,
                'role' => $membership->role,
                'status' => $membership->status,
                'user' => $membership->user ? [
                    'id' => $membership->user->id,
                    'name' => $membership->user->name,
                    'email' => $membership->user->email,
                ] : null,
            ]);
        } catch (\RuntimeException $e) {
            return ApiResponse::conflict($e->getMessage());
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::badRequest($e->getMessage());
        }
    }

    /**
     * PUT /platform/v1/companies/{id}/members/{membershipId}
     */
    public function updateMember(Request $request, int $id, int $membershipId): JsonResponse
    {
        $request->validate([
            'role'   => 'sometimes|string|in:company_admin,employee',
            'status' => 'sometimes|string|in:active,suspended',
        ]);

        try {
            $membership = MemberService::updateMember($id, $membershipId, $request->only(['role', 'status']));

            return ApiResponse::success([
                'id' => $membership->id,
                'user_id' => $membership->user_id,
                'role' => $membership->role,
                'status' => $membership->status,
                'user' => $membership->user ? [
                    'id' => $membership->user->id,
                    'name' => $membership->user->name,
                    'email' => $membership->user->email,
                ] : null,
            ]);
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::badRequest($e->getMessage());
        }
    }

    /**
     * DELETE /platform/v1/companies/{id}/members/{membershipId}
     */
    public function removeMember(int $id, int $membershipId): JsonResponse
    {
        MemberService::removeMember($id, $membershipId);
        return ApiResponse::success(null, 'Member removed.');
    }

    // ── Company Admin Self-Service ──

    /**
     * GET /platform/v1/company/profile
     */
    public function myProfile(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('auth_company_id');
        $company = CompanyService::findOrFail($companyId);
        $stats = MemberService::statsForCompany($companyId);

        return ApiResponse::success([
            'company' => $company,
            'stats' => $stats,
        ]);
    }

    /**
     * PUT /platform/v1/company/profile
     */
    public function updateMyProfile(Request $request): JsonResponse
    {
        $request->validate([
            'name'     => 'sometimes|string|max:255',
            'address'  => 'sometimes|nullable|string|max:500',
            'phone'    => 'sometimes|nullable|string|max:30',
            'email'    => 'sometimes|nullable|email|max:255',
            'industry' => 'sometimes|nullable|string|max:100',
        ]);

        $companyId = $request->attributes->get('auth_company_id');
        $company = CompanyService::update($companyId, $request->only([
            'name', 'address', 'phone', 'email', 'industry',
        ]));

        return ApiResponse::success($company);
    }

    /**
     * GET /platform/v1/company/members
     */
    public function myMembers(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('auth_company_id');
        $members = MemberService::listByCompany($companyId);
        $stats = MemberService::statsForCompany($companyId);

        $result = $members->map(fn ($m) => [
            'id' => $m->id,
            'user_id' => $m->user_id,
            'role' => $m->role,
            'status' => $m->status,
            'created_at' => $m->created_at?->toISOString(),
            'user' => $m->user ? [
                'id' => $m->user->id,
                'name' => $m->user->name,
                'email' => $m->user->email,
            ] : null,
        ]);

        return ApiResponse::success([
            'stats' => $stats,
            'members' => $result,
        ]);
    }

    /**
     * PUT /platform/v1/company/members/{membershipId}
     */
    public function updateMyMember(Request $request, int $membershipId): JsonResponse
    {
        $request->validate([
            'role' => 'sometimes|string|in:company_admin,employee',
        ]);

        $companyId = $request->attributes->get('auth_company_id');

        try {
            $membership = MemberService::updateMember($companyId, $membershipId, $request->only(['role']));

            return ApiResponse::success([
                'id' => $membership->id,
                'role' => $membership->role,
                'status' => $membership->status,
                'user' => $membership->user ? [
                    'id' => $membership->user->id,
                    'name' => $membership->user->name,
                    'email' => $membership->user->email,
                ] : null,
            ]);
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::badRequest($e->getMessage());
        }
    }
}
