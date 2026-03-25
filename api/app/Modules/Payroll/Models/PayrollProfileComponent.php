<?php

namespace App\Modules\Payroll\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayrollProfileComponent extends Model
{
    protected $connection = 'payroll';

    protected $fillable = [
        'payroll_employee_profile_id',
        'payroll_component_id',
        'amount',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(PayrollEmployeeProfile::class, 'payroll_employee_profile_id');
    }

    public function component(): BelongsTo
    {
        return $this->belongsTo(PayrollComponent::class, 'payroll_component_id');
    }
}
