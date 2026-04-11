<?php

namespace App\Modules\Platform\Billing;

use App\Modules\Platform\Setting\PlatformSettingService;

class TripayAdminSettingService
{
    private const GROUP_PAYMENT = 'payment';

    public function __construct(
        private TripayConfigurationService $tripayConfigurationService,
    ) {}

    public function getPayload(): array
    {
        $apiKey = PlatformSettingService::getEncrypted(TripayConfigurationService::KEY_API_KEY);
        $privateKey = PlatformSettingService::getEncrypted(TripayConfigurationService::KEY_PRIVATE_KEY);

        return [
            'tripay' => [
                'mode' => $this->tripayConfigurationService->getMode(),
                'base_url' => $this->tripayConfigurationService->getBaseUrl(),
                'configured_base_url' => $this->tripayConfigurationService->getConfiguredBaseUrl(),
                'expected_base_url' => $this->tripayConfigurationService->getExpectedBaseUrl(),
                'is_base_url_aligned' => $this->tripayConfigurationService->isConfiguredBaseUrlAlignedWithMode(),
                'merchant_code' => $this->tripayConfigurationService->getMerchantCode(),
                'bank_transfer_channel' => $this->tripayConfigurationService->getBankTransferChannel(),
                'ewallet_channel' => $this->tripayConfigurationService->getEwalletChannel(),
                'webhook_url' => $this->tripayConfigurationService->getWebhookUrl(),
                'recommended_webhook_url' => $this->tripayConfigurationService->getRecommendedWebhookUrl(),
                'has_api_key' => ! empty($apiKey),
                'has_private_key' => ! empty($privateKey),
                'api_key_masked' => $this->maskSecret($apiKey),
                'private_key_masked' => $this->maskSecret($privateKey),
            ],
        ];
    }

    public function update(array $payload): array
    {
        if (array_key_exists('mode', $payload)) {
            PlatformSettingService::put(
                TripayConfigurationService::KEY_MODE,
                trim((string) $payload['mode']),
                self::GROUP_PAYMENT,
            );
        }

        if (array_key_exists('base_url', $payload)) {
            PlatformSettingService::put(
                TripayConfigurationService::KEY_BASE_URL,
                rtrim(trim((string) $payload['base_url']), '/'),
                self::GROUP_PAYMENT,
            );
        }

        if (array_key_exists('merchant_code', $payload)) {
            PlatformSettingService::put(
                TripayConfigurationService::KEY_MERCHANT_CODE,
                trim((string) $payload['merchant_code']),
                self::GROUP_PAYMENT,
            );
        }

        if (array_key_exists('webhook_url', $payload)) {
            PlatformSettingService::put(
                TripayConfigurationService::KEY_WEBHOOK_URL,
                trim((string) $payload['webhook_url']),
                self::GROUP_PAYMENT,
            );
        }

        if (array_key_exists('bank_transfer_channel', $payload)) {
            PlatformSettingService::put(
                TripayConfigurationService::KEY_BANK_TRANSFER_CHANNEL,
                strtoupper(trim((string) $payload['bank_transfer_channel'])),
                self::GROUP_PAYMENT,
            );
        }

        if (array_key_exists('ewallet_channel', $payload)) {
            PlatformSettingService::put(
                TripayConfigurationService::KEY_EWALLET_CHANNEL,
                strtoupper(trim((string) $payload['ewallet_channel'])),
                self::GROUP_PAYMENT,
            );
        }

        if (($payload['clear_api_key'] ?? false) === true) {
            PlatformSettingService::forget(TripayConfigurationService::KEY_API_KEY);
        } elseif (array_key_exists('api_key', $payload) && trim((string) $payload['api_key']) !== '') {
            PlatformSettingService::putEncrypted(
                TripayConfigurationService::KEY_API_KEY,
                (string) $payload['api_key'],
                self::GROUP_PAYMENT,
            );
        }

        if (($payload['clear_private_key'] ?? false) === true) {
            PlatformSettingService::forget(TripayConfigurationService::KEY_PRIVATE_KEY);
        } elseif (array_key_exists('private_key', $payload) && trim((string) $payload['private_key']) !== '') {
            PlatformSettingService::putEncrypted(
                TripayConfigurationService::KEY_PRIVATE_KEY,
                (string) $payload['private_key'],
                self::GROUP_PAYMENT,
            );
        }

        return $this->getPayload();
    }

    public function testConnection(): array
    {
        $baseUrl = $this->tripayConfigurationService->getBaseUrl();
        $apiKey = $this->tripayConfigurationService->getApiKey();

        if (! $this->tripayConfigurationService->isConfiguredBaseUrlAlignedWithMode()) {
            return [
                'ok' => false,
                'message' => 'Mode Tripay tidak selaras dengan base URL.',
                'configured_base_url' => $this->tripayConfigurationService->getConfiguredBaseUrl(),
                'expected_base_url' => $this->tripayConfigurationService->getExpectedBaseUrl(),
            ];
        }

        if (! $apiKey) {
            return [
                'ok' => false,
                'message' => 'API key Tripay belum terkonfigurasi.',
            ];
        }

        try {
            $response = $this->tripayConfigurationService
                ->newAuthorizedRequest()
                ->timeout(12)
                ->get($baseUrl . '/merchant/payment-channel');

            $channels = is_array($response->json('data')) ? $response->json('data') : [];
            $channelCodes = array_values(array_filter(array_map(
                static fn ($channel) => is_array($channel) ? strtoupper(trim((string) ($channel['code'] ?? ''))) : '',
                $channels,
            )));

            if ($response->successful() && $channels !== []) {
                $bankTransferChannel = $this->tripayConfigurationService->getBankTransferChannel();
                $ewalletChannel = $this->tripayConfigurationService->getEwalletChannel();

                if ($bankTransferChannel !== '' && ! in_array($bankTransferChannel, $channelCodes, true)) {
                    return [
                        'ok' => false,
                        'message' => 'Channel default bank transfer (' . $bankTransferChannel . ') belum aktif di merchant Tripay.',
                        'channels_count' => count($channels),
                        'status_code' => $response->status(),
                    ];
                }

                if ($ewalletChannel !== '' && ! in_array($ewalletChannel, $channelCodes, true)) {
                    return [
                        'ok' => false,
                        'message' => 'Channel default e-wallet (' . $ewalletChannel . ') belum aktif di merchant Tripay.',
                        'channels_count' => count($channels),
                        'status_code' => $response->status(),
                    ];
                }

                return [
                    'ok' => true,
                    'message' => 'Koneksi Tripay berhasil.',
                    'channels_count' => count($channels),
                    'status_code' => $response->status(),
                ];
            }

            return [
                'ok' => false,
                'message' => trim((string) ($response->json('message') ?: 'Koneksi ke Tripay belum berhasil.')),
                'channels_count' => count($channels),
                'status_code' => $response->status(),
            ];
        } catch (\Throwable $e) {
            return [
                'ok' => false,
                'message' => 'Gagal menghubungi API Tripay: ' . $e->getMessage(),
            ];
        }
    }

    private function maskSecret(?string $value): ?string
    {
        if (! $value) {
            return null;
        }

        $trimmed = trim($value);
        $length = strlen($trimmed);

        if ($length <= 8) {
            return str_repeat('*', $length);
        }

        return substr($trimmed, 0, 4)
            . str_repeat('*', max($length - 8, 4))
            . substr($trimmed, -4);
    }
}
