<?php

namespace App\Modules\Platform\Billing;

use App\Modules\Platform\Setting\PlatformSettingService;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class TripayConfigurationService
{
    public const MODE_TEST = 'test';
    public const MODE_LIVE = 'live';
    public const BASE_URL_TEST = 'https://tripay.co.id/api-sandbox';
    public const BASE_URL_LIVE = 'https://tripay.co.id/api';

    public const KEY_MODE = 'tripay.mode';
    public const KEY_BASE_URL = 'tripay.base_url';
    public const KEY_API_KEY = 'tripay.api_key';
    public const KEY_PRIVATE_KEY = 'tripay.private_key';
    public const KEY_MERCHANT_CODE = 'tripay.merchant_code';
    public const KEY_WEBHOOK_URL = 'tripay.webhook_url';
    public const KEY_BANK_TRANSFER_CHANNEL = 'tripay.bank_transfer_channel';
    public const KEY_EWALLET_CHANNEL = 'tripay.ewallet_channel';

    public const DEFAULT_BANK_TRANSFER_CHANNEL = 'BCAVA';
    public const DEFAULT_EWALLET_CHANNEL = 'QRIS';

    public function getMode(): string
    {
        $mode = strtolower((string) PlatformSettingService::get(self::KEY_MODE, self::MODE_TEST));

        return in_array($mode, [self::MODE_TEST, self::MODE_LIVE], true)
            ? $mode
            : self::MODE_TEST;
    }

    public function getBaseUrl(): string
    {
        $configured = $this->getConfiguredBaseUrl();

        if (! $configured || ! $this->isConfiguredBaseUrlAlignedWithMode()) {
            return $this->getExpectedBaseUrl();
        }

        return $configured;
    }

    public function getConfiguredBaseUrl(): ?string
    {
        $baseUrl = trim((string) PlatformSettingService::get(self::KEY_BASE_URL, ''));

        return $baseUrl !== '' ? rtrim($baseUrl, '/') : null;
    }

    public function getExpectedBaseUrl(?string $mode = null): string
    {
        return ($mode ?? $this->getMode()) === self::MODE_TEST
            ? self::BASE_URL_TEST
            : self::BASE_URL_LIVE;
    }

    public function isConfiguredBaseUrlAlignedWithMode(): bool
    {
        $configured = $this->getConfiguredBaseUrl();

        return $configured === null || $configured === $this->getExpectedBaseUrl();
    }

    public function getApiKey(): ?string
    {
        return PlatformSettingService::getEncrypted(self::KEY_API_KEY);
    }

    public function getPrivateKey(): ?string
    {
        return PlatformSettingService::getEncrypted(self::KEY_PRIVATE_KEY);
    }

    public function getMerchantCode(): ?string
    {
        $value = trim((string) PlatformSettingService::get(self::KEY_MERCHANT_CODE, ''));

        return $value !== '' ? $value : null;
    }

    public function hasCredential(): bool
    {
        return ! empty($this->getApiKey())
            && ! empty($this->getPrivateKey())
            && ! empty($this->getMerchantCode());
    }

    public function getWebhookUrl(): string
    {
        $configured = trim((string) PlatformSettingService::get(self::KEY_WEBHOOK_URL, ''));

        return $configured !== '' ? $configured : $this->getRecommendedWebhookUrl();
    }

    public function getRecommendedWebhookUrl(): string
    {
        $appUrl = rtrim((string) config('app.url', ''), '/');

        return $appUrl !== ''
            ? $appUrl . '/api/platform/v1/payments/webhooks/tripay'
            : '/api/platform/v1/payments/webhooks/tripay';
    }

    public function getBankTransferChannel(): string
    {
        return strtoupper(trim((string) PlatformSettingService::get(
            self::KEY_BANK_TRANSFER_CHANNEL,
            self::DEFAULT_BANK_TRANSFER_CHANNEL,
        )));
    }

    public function getEwalletChannel(): string
    {
        return strtoupper(trim((string) PlatformSettingService::get(
            self::KEY_EWALLET_CHANNEL,
            self::DEFAULT_EWALLET_CHANNEL,
        )));
    }

    public function getPreferredInvoiceChannel(): string
    {
        return $this->getBankTransferChannel() ?: $this->getEwalletChannel();
    }

    public function generateSignature(string $merchantRef, int|float|string $amount): ?string
    {
        $privateKey = $this->getPrivateKey();
        $merchantCode = $this->getMerchantCode();

        if (! $privateKey || ! $merchantCode) {
            return null;
        }

        $amountValue = is_numeric($amount)
            ? (string) ((int) round((float) $amount))
            : trim((string) $amount);

        return hash_hmac('sha256', $merchantCode . trim($merchantRef) . $amountValue, $privateKey);
    }

    public function isValidCallbackSignature(?string $incomingSignature, string $rawBody): bool
    {
        $privateKey = $this->getPrivateKey();

        if (! $privateKey || ! $incomingSignature) {
            return false;
        }

        $expected = hash_hmac('sha256', $rawBody, $privateKey);

        return hash_equals($expected, trim($incomingSignature));
    }

    public function extractCallbackData(Request $request): array
    {
        return [
            'signature' => trim((string) $request->header('X-Callback-Signature', '')) ?: null,
            'event' => trim((string) $request->header('X-Callback-Event', '')) ?: null,
        ];
    }

    public function getCompanyInvoiceReturnUrl(int $invoiceId): string
    {
        $mainOrigin = rtrim((string) config('app.frontend_url', ''), '/');
        $requestOrigin = trim((string) request()?->headers->get('origin', ''));

        if ($requestOrigin !== '' && ! str_contains($requestOrigin, 'app.')) {
            $mainOrigin = rtrim($requestOrigin, '/');
        }

        if ($mainOrigin === '') {
            return '/company';
        }

        return $mainOrigin . '/company?panel=invoices&invoice=' . $invoiceId;
    }

    public function newAuthorizedRequest(): PendingRequest
    {
        return Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->getApiKey(),
            'Accept' => 'application/json',
        ])->withOptions([
            'force_ip_resolve' => 'v4',
        ]);
    }
}
