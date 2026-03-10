<?php

namespace App\Modules\Attendance\Models;

use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    protected $connection = 'attendance';

    protected $fillable = ['company_id', 'name', 'location', 'status'];

    public function attendanceUsers()
    {
        return $this->hasMany(AttendanceUser::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeForCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }
}
