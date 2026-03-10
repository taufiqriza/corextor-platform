<?php

namespace App\Modules\Platform\Subscription;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Modules\Platform\Company\Company;

class CompanySubscription extends Model
{
    protected $connection = 'platform';

    protected $fillable = [
        'company_id', 'product_id', 'bundle_id', 'plan_id',
        'status', 'starts_at', 'ends_at', 'trial_ends_at', 'billing_cycle',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'date',
            'ends_at' => 'date',
            'trial_ends_at' => 'date',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(SubscriptionItem::class, 'subscription_id');
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', ['active', 'trial']);
    }

    public function isActive(): bool
    {
        return in_array($this->status, ['active', 'trial']);
    }
}
