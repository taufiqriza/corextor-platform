<?php

namespace App\Modules\Platform\Membership;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Modules\Platform\Identity\User;
use App\Modules\Platform\Company\Company;

class CompanyMembership extends Model
{
    protected $connection = 'platform';

    protected $fillable = [
        'company_id',
        'user_id',
        'role',
        'status',
    ];

    // ── Relationships ──

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    // ── Scopes ──

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    // ── Helpers ──

    public function isCompanyAdmin(): bool
    {
        return $this->role === 'company_admin';
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
