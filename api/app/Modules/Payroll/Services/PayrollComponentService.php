<?php

namespace App\Modules\Payroll\Services;

use App\Modules\Payroll\Models\PayrollComponent;
use App\Modules\Platform\Audit\AuditService;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class PayrollComponentService
{
    public static function listByCompany(int $companyId): Collection
    {
        return PayrollComponent::forCompany($companyId)
            ->orderBy('type')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();
    }

    public static function create(int $companyId, array $data): PayrollComponent
    {
        $component = PayrollComponent::create([
            'company_id' => $companyId,
            'code' => self::generateCode($companyId, $data['name'], $data['type']),
            'name' => trim((string) $data['name']),
            'type' => $data['type'],
            'amount_type' => $data['amount_type'] ?? 'fixed',
            'default_amount' => $data['default_amount'] ?? 0,
            'is_recurring' => $data['is_recurring'] ?? true,
            'taxable' => $data['taxable'] ?? false,
            'sort_order' => $data['sort_order'] ?? 0,
            'status' => $data['status'] ?? 'active',
        ]);

        AuditService::product('payroll', 'payroll.component_created', [
            'component_id' => $component->id,
            'name' => $component->name,
            'type' => $component->type,
        ], $companyId);

        return $component;
    }

    public static function update(int $companyId, int $componentId, array $data): PayrollComponent
    {
        $component = PayrollComponent::forCompany($companyId)->findOrFail($componentId);
        $component->fill(array_filter([
            'name' => isset($data['name']) ? trim((string) $data['name']) : null,
            'amount_type' => $data['amount_type'] ?? null,
            'default_amount' => $data['default_amount'] ?? null,
            'is_recurring' => $data['is_recurring'] ?? null,
            'taxable' => $data['taxable'] ?? null,
            'sort_order' => $data['sort_order'] ?? null,
            'status' => $data['status'] ?? null,
        ], fn ($value) => $value !== null));
        $component->save();

        AuditService::product('payroll', 'payroll.component_updated', [
            'component_id' => $component->id,
            'changes' => $data,
        ], $companyId);

        return $component->fresh();
    }

    public static function requireForCompany(int $companyId, int $componentId): PayrollComponent
    {
        return PayrollComponent::forCompany($companyId)->findOrFail($componentId);
    }

    private static function generateCode(int $companyId, string $name, string $type): string
    {
        $base = Str::limit(Str::slug($type . '-' . $name), 60, '');
        $code = $base !== '' ? $base : "component-{$type}-{$companyId}";
        $suffix = 1;

        while (PayrollComponent::forCompany($companyId)->where('code', $code)->exists()) {
            $suffix++;
            $code = Str::limit($base, max(1, 60 - strlen("-{$suffix}")), '') . "-{$suffix}";
        }

        return $code;
    }
}
