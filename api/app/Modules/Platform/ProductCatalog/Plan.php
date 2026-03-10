<?php

namespace App\Modules\Platform\ProductCatalog;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Plan extends Model
{
    protected $connection = 'platform';

    protected $fillable = [
        'product_id', 'code', 'name', 'billing_cycle',
        'price', 'currency', 'status', 'features_json',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'features_json' => 'array',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
