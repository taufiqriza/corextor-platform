<?php

namespace App\Modules\Platform\Company;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Modules\Platform\Membership\CompanyMembership;
use Illuminate\Support\Str;

class Company extends Model
{
    protected $connection = 'platform';

    protected $fillable = [
        'name',
        'code',
        'logo_url',
        'address',
        'phone',
        'email',
        'industry',
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

    protected function logoUrl(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => self::publicLogoUrl($value),
        );
    }

    public static function publicLogoUrl(?string $storedValue): ?string
    {
        if (! $storedValue) {
            return null;
        }

        if (Str::startsWith($storedValue, ['http://', 'https://']) && ! str_contains($storedValue, '/storage/logos/companies/')) {
            return $storedValue;
        }

        $publicPath = self::extractManagedLogoPath($storedValue);

        if (! $publicPath) {
            return $storedValue;
        }

        $request = request();
        $baseUrl = $request?->getSchemeAndHttpHost();

        if (! $baseUrl) {
            return '/storage/'.$publicPath;
        }

        return rtrim($baseUrl, '/').'/storage/'.$publicPath;
    }

    public static function extractManagedLogoPath(?string $storedValue): ?string
    {
        if (! $storedValue) {
            return null;
        }

        if (Str::startsWith($storedValue, 'logos/companies/')) {
            return $storedValue;
        }

        if (preg_match('#/storage/(logos/companies/.+)$#', $storedValue, $matches) === 1) {
            return $matches[1];
        }

        return null;
    }
}
