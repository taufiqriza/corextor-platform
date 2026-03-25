<?php

namespace App\Modules\Platform\ProductCatalog;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $connection = 'platform';

    protected $fillable = [
        'code',
        'workspace_key',
        'name',
        'description',
        'status',
        'app_url',
        'metadata_json',
    ];

    protected function casts(): array
    {
        return [
            'metadata_json' => 'array',
        ];
    }

    public function plans(): HasMany
    {
        return $this->hasMany(Plan::class);
    }

    public function latestPlans(): HasMany
    {
        return $this->hasMany(Plan::class)->latestVersion();
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
