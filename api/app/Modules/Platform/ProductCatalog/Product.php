<?php

namespace App\Modules\Platform\ProductCatalog;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $connection = 'platform';

    protected $fillable = ['code', 'name', 'status', 'app_url'];

    public function plans(): HasMany
    {
        return $this->hasMany(Plan::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
