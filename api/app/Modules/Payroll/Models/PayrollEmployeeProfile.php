<?php

namespace App\Modules\Payroll\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PayrollEmployeeProfile extends Model
{
    protected $connection = 'payroll';

    protected $fillable = [
        'company_id',
        'platform_user_id',
        'pay_schedule_id',
        'employment_type',
        'base_salary',
        'bank_name',
        'bank_account_name',
        'bank_account_number',
        'notes',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'base_salary' => 'decimal:2',
        ];
    }

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(PayrollSchedule::class, 'pay_schedule_id');
    }

    public function components(): HasMany
    {
        return $this->hasMany(PayrollProfileComponent::class, 'payroll_employee_profile_id');
    }

    public function runItems(): HasMany
    {
        return $this->hasMany(PayrollRunItem::class, 'payroll_employee_profile_id');
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
