<?php

namespace App\Modules\Attendance\Models;

use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    protected $connection = 'attendance';

    protected $fillable = ['company_id', 'name', 'location', 'latitude', 'longitude', 'radius_meters', 'status'];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'radius_meters' => 'integer',
    ];

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
