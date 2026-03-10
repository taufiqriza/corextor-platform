<?php

namespace App\Modules\Platform\ProductCatalog;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Bundle extends Model
{
    protected $connection = 'platform';

    protected $fillable = [
        'code', 'name', 'billing_cycle', 'price', 'currency', 'status',
    ];

    protected function casts(): array
    {
        return ['price' => 'decimal:2'];
    }

    public function items(): HasMany
    {
        return $this->hasMany(BundleItem::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
