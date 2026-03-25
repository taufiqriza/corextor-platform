<?php

namespace App\Modules\Payroll\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayrollRunItem extends Model
{
    protected $connection = 'payroll';

    protected $fillable = [
        'payroll_run_id',
        'company_id',
        'platform_user_id',
        'payroll_employee_profile_id',
        'employee_name_snapshot',
        'attendance_summary_json',
        'component_lines_json',
        'earnings_total',
        'deductions_total',
        'net_total',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'attendance_summary_json' => 'array',
            'component_lines_json' => 'array',
            'earnings_total' => 'decimal:2',
            'deductions_total' => 'decimal:2',
            'net_total' => 'decimal:2',
        ];
    }

    public function run(): BelongsTo
    {
        return $this->belongsTo(PayrollRun::class, 'payroll_run_id');
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(PayrollEmployeeProfile::class, 'payroll_employee_profile_id');
    }
}
