<?php

namespace App\Modules\Attendance\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceRecord extends Model
{
    protected $connection = 'attendance';

    protected $fillable = [
        'attendance_user_id', 'platform_user_id', 'company_id',
        'branch_id', 'date', 'attendance_mode_in',
        'time_in', 'time_out',
        'check_in_latitude', 'check_in_longitude', 'check_in_accuracy_meters',
        'check_in_distance_meters', 'check_in_within_branch_radius', 'check_in_selfie_path',
        'check_out_latitude', 'check_out_longitude', 'check_out_accuracy_meters',
        'check_out_distance_meters', 'check_out_within_branch_radius', 'check_out_selfie_path',
        'status', 'note',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
            'check_in_latitude' => 'float',
            'check_in_longitude' => 'float',
            'check_in_accuracy_meters' => 'float',
            'check_in_distance_meters' => 'float',
            'check_in_within_branch_radius' => 'boolean',
            'check_out_latitude' => 'float',
            'check_out_longitude' => 'float',
            'check_out_accuracy_meters' => 'float',
            'check_out_distance_meters' => 'float',
            'check_out_within_branch_radius' => 'boolean',
        ];
    }

    // ── Relationships ──

    public function attendanceUser()
    {
        return $this->belongsTo(AttendanceUser::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Cross-database relation to platform user (for name/email).
     */
    public function platformUser()
    {
        return $this->belongsTo(\App\Modules\Platform\Identity\User::class, 'platform_user_id');
    }

    // ── Scopes ──

    public function scopeForCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    public function scopeForDate($query, string $date)
    {
        return $query->where('date', $date);
    }

    public function scopeDateRange($query, string $from, string $to)
    {
        return $query->whereBetween('date', [$from, $to]);
    }

    // ── Helpers ──

    public function hasCheckedIn(): bool
    {
        return $this->time_in !== null;
    }

    public function hasCheckedOut(): bool
    {
        return $this->time_out !== null;
    }
}
