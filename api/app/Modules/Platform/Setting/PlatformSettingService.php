<?php

namespace App\Modules\Platform\Setting;

use Illuminate\Support\Facades\Crypt;

class PlatformSettingService
{
    public static function get(string $key, mixed $default = null): mixed
    {
        return PlatformSetting::getValue($key, $default);
    }

    public static function put(string $key, mixed $value, string $group = 'general', string $type = 'string'): void
    {
        PlatformSetting::setValue($key, $value, $group, $type);
    }

    public static function putEncrypted(string $key, string $value, string $group = 'general'): void
    {
        self::put($key, Crypt::encryptString(trim($value)), $group, 'secret');
    }

    public static function getEncrypted(string $key): ?string
    {
        $value = self::get($key);

        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        try {
            return trim(Crypt::decryptString($value));
        } catch (\Throwable) {
            return trim($value);
        }
    }

    public static function forget(string $key): void
    {
        PlatformSetting::query()->where('key', $key)->delete();
    }
}
