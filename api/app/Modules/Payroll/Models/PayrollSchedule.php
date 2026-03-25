<?php

namespace App\Modules\Payroll\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PayrollSchedule extends Model
{
    protected $connection = 'payroll';

    protected $fillable = [
        'company_id',
        'code',
        'name',
        'pay_frequency',
        'cutoff_day',
        'payout_day',
        'status',
    ];

    public function profiles(): HasMany
    {
        return $this->hasMany(PayrollEmployeeProfile::class, 'pay_schedule_id');
    }

    public function runs(): HasMany
    {
        return $this->hasMany(PayrollRun::class, 'pay_schedule_id');
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
