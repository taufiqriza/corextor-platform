<?php

namespace App\Modules\Payroll\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PayrollComponent extends Model
{
    protected $connection = 'payroll';

    protected $fillable = [
        'company_id',
        'code',
        'name',
        'type',
        'amount_type',
        'default_amount',
        'is_recurring',
        'taxable',
        'sort_order',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'default_amount' => 'decimal:2',
            'is_recurring' => 'boolean',
            'taxable' => 'boolean',
        ];
    }

    public function profileComponents(): HasMany
    {
        return $this->hasMany(PayrollProfileComponent::class, 'payroll_component_id');
    }

    public function scopeForCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
