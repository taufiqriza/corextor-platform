<?php

namespace App\Modules\Attendance\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceRecord extends Model
{
    protected $connection = 'attendance';

    protected $fillable = [
        'attendance_user_id', 'platform_user_id', 'company_id',
        'branch_id', 'date', 'time_in', 'time_out',
        'status', 'note',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
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
