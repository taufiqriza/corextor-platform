<?php

namespace App\Modules\Platform\Company;

use App\Modules\Platform\Audit\AuditService;
use App\Modules\Platform\Membership\CompanyMembership;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

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

        $allowedFields = ['name', 'status', 'address', 'phone', 'email', 'industry'];
        $updates = array_intersect_key($data, array_flip($allowedFields));

        if (! empty($updates)) {
            $company->update($updates);
        }

        AuditService::platform('company.updated', [
            'company_id' => $company->id,
            'changes' => $updates,
        ]);

        return $company->fresh();
    }

    /**
     * Upload and replace company logo.
     */
    public static function updateLogo(int $id, UploadedFile $file): Company
    {
        $company = Company::findOrFail($id);

        self::deleteStoredLogoIfManaged($company->getRawOriginal('logo_url'));

        $extension = $file->getClientOriginalExtension() ?: $file->extension() ?: 'png';
        $path = $file->storeAs(
            "logos/companies/{$id}",
            'logo-'.time().'.'.$extension,
            'public',
        );

        $company->update([
            'logo_url' => $path,
        ]);

        AuditService::platform('company.logo_updated', [
            'company_id' => $company->id,
            'logo_url' => $path,
        ], $company->id);

        return $company->fresh();
    }

    /**
     * Remove managed company logo.
     */
    public static function removeLogo(int $id): Company
    {
        $company = Company::findOrFail($id);

        self::deleteStoredLogoIfManaged($company->getRawOriginal('logo_url'));

        $company->update([
            'logo_url' => null,
        ]);

        AuditService::platform('company.logo_removed', [
            'company_id' => $company->id,
        ], $company->id);

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

    /**
     * Get all members for a specific company.
     */
    public static function getMembers(int $companyId): \Illuminate\Database\Eloquent\Collection
    {
        return CompanyMembership::where('company_id', $companyId)
            ->with('user')
            ->orderByRaw("FIELD(role, 'company_admin', 'employee')")
            ->get();
    }

    private static function deleteStoredLogoIfManaged(?string $logoUrl): void
    {
        $relativePath = Company::extractManagedLogoPath($logoUrl);

        if ($relativePath) {
            Storage::disk('public')->delete($relativePath);
        }
    }
}
