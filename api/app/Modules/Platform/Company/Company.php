<?php

namespace App\Modules\Platform\Company;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Modules\Platform\Membership\CompanyMembership;

class Company extends Model
{
    protected $connection = 'platform';

    protected $fillable = [
        'name',
        'code',
        'status',
    ];

    // ── Relationships ──

    public function memberships(): HasMany
    {
        return $this->hasMany(CompanyMembership::class);
    }

    // ── Scopes ──

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    // ── Helpers ──

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
