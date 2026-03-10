<?php

namespace App\Modules\Platform\Company;

use App\Modules\Platform\Audit\AuditService;
use App\Modules\Platform\Membership\CompanyMembership;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CompanyService
{
    /**
     * List all companies with pagination.
     */
    public static function list(int $perPage = 15): LengthAwarePaginator
    {
        return Company::orderBy('name')->paginate($perPage);
    }

    /**
     * Get company detail by ID.
     */
    public static function findOrFail(int $id): Company
    {
        return Company::findOrFail($id);
    }

    /**
     * Create a new company.
     */
    public static function create(array $data): Company
    {
        $company = Company::create([
            'name' => $data['name'],
            'code' => strtoupper($data['code']),
            'status' => $data['status'] ?? 'active',
        ]);

        AuditService::platform('company.created', [
            'company_id' => $company->id,
            'code' => $company->code,
        ]);

        return $company;
    }

    /**
     * Update an existing company.
     */
    public static function update(int $id, array $data): Company
    {
        $company = Company::findOrFail($id);

        $company->update(array_filter([
            'name' => $data['name'] ?? null,
            'status' => $data['status'] ?? null,
        ]));

        AuditService::platform('company.updated', [
            'company_id' => $company->id,
            'changes' => $data,
        ]);

        return $company->fresh();
    }

    /**
     * Get company admins for a specific company.
     */
    public static function getAdmins(int $companyId): \Illuminate\Database\Eloquent\Collection
    {
        return CompanyMembership::where('company_id', $companyId)
            ->where('role', 'company_admin')
            ->active()
            ->with('user')
            ->get();
    }
}
