<?php

namespace App\Modules\Payroll\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PayrollRun extends Model
{
    protected $connection = 'payroll';

    protected $fillable = [
        'company_id',
        'pay_schedule_id',
        'reference_code',
        'period_start',
        'period_end',
        'payout_date',
        'status',
        'employees_count',
        'earnings_total',
        'deductions_total',
        'net_total',
        'generated_by_user_id',
        'finalized_by_user_id',
        'finalized_at',
        'metadata_json',
    ];

    protected function casts(): array
    {
        return [
            'period_start' => 'date',
            'period_end' => 'date',
            'payout_date' => 'date',
            'finalized_at' => 'datetime',
            'earnings_total' => 'decimal:2',
            'deductions_total' => 'decimal:2',
            'net_total' => 'decimal:2',
            'metadata_json' => 'array',
        ];
    }

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(PayrollSchedule::class, 'pay_schedule_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(PayrollRunItem::class, 'payroll_run_id');
    }

    public function scopeForCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }
}
