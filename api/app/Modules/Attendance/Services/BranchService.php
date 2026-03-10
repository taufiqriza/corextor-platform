<?php

namespace App\Modules\Attendance\Services;

use App\Modules\Attendance\Models\Branch;
use App\Modules\Platform\Audit\AuditService;
use Illuminate\Database\Eloquent\Collection;

class BranchService
{
    /**
     * List branches for a company.
     */
    public static function listByCompany(int $companyId): Collection
    {
        return Branch::forCompany($companyId)
            ->orderBy('name')
            ->get();
    }

    /**
     * Get a single branch (scoped to company).
     */
    public static function findForCompany(int $id, int $companyId): Branch
    {
        return Branch::forCompany($companyId)->findOrFail($id);
    }

    /**
     * Create a branch.
     */
    public static function create(int $companyId, array $data): Branch
    {
        $branch = Branch::create([
            'company_id' => $companyId,
            'name' => $data['name'],
            'location' => $data['location'] ?? null,
            'status' => $data['status'] ?? 'active',
        ]);

        AuditService::attendance('branch.created', [
            'branch_id' => $branch->id,
            'name' => $branch->name,
        ], $companyId);

        return $branch;
    }

    /**
     * Update a branch (scoped to company).
     */
    public static function update(int $id, int $companyId, array $data): Branch
    {
        $branch = Branch::forCompany($companyId)->findOrFail($id);

        $branch->update(array_filter([
            'name' => $data['name'] ?? null,
            'location' => $data['location'] ?? null,
            'status' => $data['status'] ?? null,
        ], fn ($v) => $v !== null));

        AuditService::attendance('branch.updated', [
            'branch_id' => $branch->id,
            'changes' => $data,
        ], $companyId);

        return $branch->fresh();
    }

    /**
     * Deactivate a branch (no hard delete per MVP rule).
     */
    public static function deactivate(int $id, int $companyId): Branch
    {
        return self::update($id, $companyId, ['status' => 'inactive']);
    }
}
