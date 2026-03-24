<?php

namespace App\Modules\Attendance\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceUser extends Model
{
    protected $connection = 'attendance';

    protected $fillable = [
        'platform_user_id', 'company_id', 'branch_id',
        'pin_hash', 'pin_lookup', 'global_pin_lookup', 'status',
    ];

    protected $hidden = ['pin_hash', 'pin_lookup', 'global_pin_lookup'];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function platformUser()
    {
        return $this->belongsTo(\App\Modules\Platform\Identity\User::class, 'platform_user_id');
    }

    // ── Scopes ──

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeForCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    // ── Helpers ──

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
