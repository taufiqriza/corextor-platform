<?php

namespace App\Modules\Platform\Billing;

use App\Modules\Platform\Audit\AuditService;
use Carbon\Carbon;

class TripayInvoicePaymentService
{
    public function __construct(
        private TripayConfigurationService $tripayConfigurationService,
    ) {}

    public function createOrReuseCheckout(Invoice $invoice): array
    {
        $invoice->loadMissing(['company', 'items']);

        if (! $this->tripayConfigurationService->hasCredential()) {
            throw new \RuntimeException('Credential Tripay belum lengkap.');
        }

        if ($invoice->status === 'paid') {
            throw new \RuntimeException('Invoice sudah lunas.');
        }

        if ($invoice->status === 'cancelled') {
            throw new \RuntimeException('Invoice yang dibatalkan tidak dapat dibayar.');
        }

        if ($this->canReuseCheckout($invoice)) {
            return $this->buildPaymentSessionPayload($invoice->fresh());
        }

        $amount = (int) round((float) $invoice->amount_total);
        $channel = $this->tripayConfigurationService->getPreferredInvoiceChannel();
        $signature = $this->tripayConfigurationService->generateSignature($invoice->invoice_number, $amount);

        if (! $signature) {
            throw new \RuntimeException('Signature Tripay tidak dapat dibuat. Periksa merchant code dan private key.');
        }

        $company = $invoice->company;

        $payload = [
            'method' => $channel,
            'merchant_ref' => $invoice->invoice_number,
            'amount' => $amount,
            'customer_name' => trim((string) ($company?->name ?? 'Customer Corextor')),
            'customer_email' => trim((string) ($company?->email ?? 'billing@corextor.com')),
            'customer_phone' => $this->resolvePhone((string) ($company?->phone ?? '')),
            'order_items' => $this->buildOrderItems($invoice),
            'callback_url' => $this->tripayConfigurationService->getWebhookUrl(),
            'return_url' => $this->tripayConfigurationService->getCompanyInvoiceReturnUrl($invoice->id),
            'expired_time' => now()->addDay()->timestamp,
            'signature' => $signature,
        ];

        $response = $this->tripayConfigurationService
            ->newAuthorizedRequest()
            ->asForm()
            ->timeout(20)
            ->post($this->tripayConfigurationService->getBaseUrl() . '/transaction/create', $payload);

        if (! $response->successful()) {
            throw new \RuntimeException(
                trim((string) ($response->json('message') ?: 'Tripay menolak pembuatan transaksi.'))
            );
        }

        $body = $response->json();
        $data = is_array($body['data'] ?? null) ? $body['data'] : null;

        if (($body['success'] ?? false) !== true || ! $data) {
            throw new \RuntimeException((string) ($body['message'] ?? 'Respons Tripay tidak valid.'));
        }

        $invoice = $this->syncInvoiceFromGatewayData($invoice, $data);

        AuditService::platform('invoice.payment_session_created', [
            'invoice_id' => $invoice->id,
            'invoice_number' => $invoice->invoice_number,
            'provider' => 'tripay',
            'reference' => $invoice->payment_reference,
            'channel' => $invoice->payment_channel_code,
        ], $invoice->company_id);

        return $this->buildPaymentSessionPayload($invoice->fresh());
    }

    public function syncWebhookPayload(array $payload): ?Invoice
    {
        $merchantRef = trim((string) ($payload['merchant_ref'] ?? ''));

        if ($merchantRef === '') {
            return null;
        }

        $invoice = Invoice::with(['company', 'items'])
            ->where('invoice_number', $merchantRef)
            ->first();

        if (! $invoice) {
            return null;
        }

        $synced = $this->syncInvoiceFromGatewayData($invoice, $payload);

        AuditService::platform('invoice.payment_webhook_processed', [
            'invoice_id' => $synced->id,
            'invoice_number' => $synced->invoice_number,
            'provider' => 'tripay',
            'reference' => $synced->payment_reference,
            'gateway_status' => strtoupper((string) ($payload['status'] ?? '')),
        ], $synced->company_id);

        return $synced;
    }

    public function buildPaymentSessionPayload(Invoice $invoice): array
    {
        $gateway = is_array($invoice->payment_gateway_payload) ? $invoice->payment_gateway_payload : [];
        $checkoutUrl = trim((string) ($invoice->payment_checkout_url ?: ($gateway['checkout_url'] ?? $gateway['pay_url'] ?? '')));
        $expiredAt = $invoice->payment_expired_at;

        return [
            'provider' => $invoice->payment_provider ?: 'tripay',
            'reference' => $invoice->payment_reference,
            'channel_code' => $invoice->payment_channel_code,
            'checkout_url' => $checkoutUrl !== '' ? $checkoutUrl : null,
            'pay_code' => $gateway['pay_code'] ?? null,
            'pay_url' => $gateway['pay_url'] ?? null,
            'qr_url' => $gateway['qr_url'] ?? null,
            'amount' => (float) $invoice->amount_total,
            'expired_at' => $expiredAt?->toISOString(),
            'is_expired' => $expiredAt ? $expiredAt->isPast() : false,
            'instructions' => is_array($gateway['instructions'] ?? null) ? $gateway['instructions'] : [],
        ];
    }

    public function syncInvoiceFromGatewayData(Invoice $invoice, array $gatewayData): Invoice
    {
        $status = strtoupper((string) ($gatewayData['status'] ?? ''));
        $reference = trim((string) ($gatewayData['reference'] ?? $invoice->payment_reference ?? ''));
        $channelCode = trim((string) ($gatewayData['payment_method_code'] ?? $gatewayData['payment_method'] ?? $invoice->payment_channel_code ?? ''));
        $checkoutUrl = trim((string) ($gatewayData['checkout_url'] ?? $gatewayData['pay_url'] ?? $invoice->payment_checkout_url ?? ''));
        $expiredAt = $this->resolveExpiredAt($gatewayData, $invoice);
        $paidAt = $this->resolvePaidAt($gatewayData, $invoice);

        $invoice->fill([
            'payment_provider' => 'tripay',
            'payment_reference' => $reference !== '' ? $reference : $invoice->payment_reference,
            'payment_channel_code' => $channelCode !== '' ? $channelCode : $invoice->payment_channel_code,
            'payment_checkout_url' => $checkoutUrl !== '' ? $checkoutUrl : $invoice->payment_checkout_url,
            'payment_gateway_payload' => $gatewayData,
            'payment_requested_at' => $invoice->payment_requested_at ?? now(),
            'payment_expired_at' => $expiredAt,
        ]);

        if ($status === 'PAID') {
            $invoice->status = 'paid';
            $invoice->paid_at = $paidAt ?? $invoice->paid_at ?? now();
        } elseif (in_array($status, ['EXPIRED', 'FAILED', 'REFUND'], true)) {
            $invoice->status = 'overdue';
        } elseif ($invoice->status !== 'cancelled') {
            $invoice->status = 'issued';
        }

        $invoice->save();

        return $invoice->fresh(['company', 'items']);
    }

    private function canReuseCheckout(Invoice $invoice): bool
    {
        if (! $invoice->payment_checkout_url || ! $invoice->payment_reference) {
            return false;
        }

        if ($invoice->status === 'paid' || $invoice->status === 'cancelled') {
            return false;
        }

        return ! ($invoice->payment_expired_at instanceof Carbon && $invoice->payment_expired_at->isPast());
    }

    private function resolvePhone(string $phone): string
    {
        $clean = preg_replace('/[^0-9+]/', '', $phone);

        return $clean ?: '081234567890';
    }

    private function buildOrderItems(Invoice $invoice): array
    {
        $items = $invoice->items->map(fn ($item) => [
            'sku' => 'INV-' . $item->id,
            'name' => $item->description,
            'price' => (int) round((float) $item->unit_price),
            'quantity' => max(1, (int) $item->quantity),
        ])->values()->all();

        if ($items !== []) {
            return $items;
        }

        return [[
            'sku' => 'INV-' . $invoice->id,
            'name' => 'Invoice ' . $invoice->invoice_number,
            'price' => (int) round((float) $invoice->amount_total),
            'quantity' => 1,
        ]];
    }

    private function resolveExpiredAt(array $gatewayData, Invoice $invoice): ?Carbon
    {
        $expiredTime = $gatewayData['expired_time'] ?? null;

        if (is_numeric($expiredTime)) {
            return Carbon::createFromTimestamp((int) $expiredTime);
        }

        if (is_string($expiredTime) && trim($expiredTime) !== '') {
            return Carbon::parse($expiredTime);
        }

        return $invoice->payment_expired_at;
    }

    private function resolvePaidAt(array $gatewayData, Invoice $invoice): ?Carbon
    {
        $paidAt = $gatewayData['paid_at'] ?? null;

        if (is_numeric($paidAt)) {
            return Carbon::createFromTimestamp((int) $paidAt);
        }

        if (is_string($paidAt) && trim($paidAt) !== '') {
            return Carbon::parse($paidAt);
        }

        return $invoice->paid_at;
    }
}
