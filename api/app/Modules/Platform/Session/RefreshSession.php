<?php

namespace App\Modules\Platform\Session;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Modules\Platform\Identity\User;
use App\Modules\Platform\Company\Company;

class RefreshSession extends Model
{
    protected $connection = 'platform';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'company_id',
        'session_token_hash',
        'ip_address',
        'user_agent',
        'expires_at',
        'revoked_at',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'revoked_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    // ── Relationships ──

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    // ── Helpers ──

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isRevoked(): bool
    {
        return $this->revoked_at !== null;
    }

    public function isValid(): bool
    {
        return ! $this->isExpired() && ! $this->isRevoked();
    }
}
