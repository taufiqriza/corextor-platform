<?php

namespace App\Modules\Platform\Subscription;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubscriptionItem extends Model
{
    protected $connection = 'platform';

    protected $fillable = ['subscription_id', 'product_id', 'plan_id', 'status'];

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(CompanySubscription::class, 'subscription_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
