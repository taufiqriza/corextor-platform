<?php

namespace App\Modules\Platform\Identity;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Modules\Platform\Membership\CompanyMembership;
use App\Modules\Platform\Session\RefreshSession;

class User extends Authenticatable
{
    protected $connection = 'platform';

    protected $fillable = [
        'name',
        'email',
        'password',
        'platform_role',
        'status',
    ];

    protected $hidden = [
        'password',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    // ── Relationships ──

    public function memberships(): HasMany
    {
        return $this->hasMany(CompanyMembership::class);
    }

    public function refreshSessions(): HasMany
    {
        return $this->hasMany(RefreshSession::class);
    }

    // ── Scopes ──

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    // ── Helpers ──

    public function isSuperAdmin(): bool
    {
        return $this->platform_role === 'super_admin';
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
