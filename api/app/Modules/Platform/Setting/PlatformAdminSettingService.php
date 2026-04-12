<?php

namespace App\Modules\Platform\Setting;

use App\Modules\Platform\Audit\AuditService;
use App\Modules\Platform\Billing\TripayAdminSettingService;

class PlatformAdminSettingService
{
    private const GROUP_COMPANY = 'company';

    private const COMPANY_KEYS = [
        'company_name',
        'company_email',
        'company_phone',
        'company_address',
        'company_city',
        'company_province',
        'company_postal_code',
        'company_country',
        'company_website',
        'support_whatsapp',
        'support_email',
        'platform_tagline',
        'platform_summary',
        'social_instagram',
        'social_facebook',
        'social_tiktok',
        'social_youtube',
        'social_linkedin',
    ];

    public function __construct(
        private TripayAdminSettingService $tripayAdminSettingService,
    ) {}

    public function getPayload(): array
    {
        $company = [];

        foreach (self::COMPANY_KEYS as $key) {
            $company[$key] = (string) PlatformSettingService::get($key, '');
        }

        return [
            'company' => $company,
            ...$this->tripayAdminSettingService->getPayload(),
        ];
    }

    public function updateCompany(array $payload): array
    {
        $changes = [];

        foreach (self::COMPANY_KEYS as $key) {
            if (! array_key_exists($key, $payload)) {
                continue;
            }

            $value = trim((string) ($payload[$key] ?? ''));
            PlatformSettingService::put($key, $value, self::GROUP_COMPANY);
            $changes[$key] = $value;
        }

        AuditService::platform('platform.settings.company_updated', [
            'keys' => array_keys($changes),
        ]);

        return $this->getPayload();
    }
}
