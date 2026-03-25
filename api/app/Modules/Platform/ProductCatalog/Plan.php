<?php

namespace App\Modules\Platform\ProductCatalog;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    protected $connection = 'platform';

    protected $fillable = [
        'product_id', 'code', 'family_code', 'name', 'billing_cycle',
        'price', 'currency', 'status', 'features_json', 'version_number',
        'is_latest', 'supersedes_plan_id', 'effective_from', 'retired_at',
        'version_notes',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'features_json' => 'array',
            'is_latest' => 'boolean',
            'effective_from' => 'date',
            'retired_at' => 'date',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function supersedes(): BelongsTo
    {
        return $this->belongsTo(self::class, 'supersedes_plan_id');
    }

    public function versions(): HasMany
    {
        return $this->hasMany(self::class, 'family_code', 'family_code');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeLatestVersion($query)
    {
        return $query->where('is_latest', true);
    }
}
