<?php

namespace App\Modules\Attendance\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeReport extends Model
{
    protected $connection = 'attendance';

    protected $fillable = [
        'attendance_user_id',
        'platform_user_id',
        'company_id',
        'branch_id',
        'report_date',
        'title',
        'description',
        'attachments_json',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'report_date' => 'date:Y-m-d',
            'attachments_json' => 'array',
        ];
    }

    public function attendanceUser()
    {
        return $this->belongsTo(AttendanceUser::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function platformUser()
    {
        return $this->belongsTo(\App\Modules\Platform\Identity\User::class, 'platform_user_id');
    }

    public function scopeForCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    public function scopeForPlatformUser($query, int $platformUserId)
    {
        return $query->where('platform_user_id', $platformUserId);
    }
}
