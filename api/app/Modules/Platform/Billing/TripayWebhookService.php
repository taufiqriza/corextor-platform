<?php

namespace App\Modules\Platform\Billing;

use Illuminate\Http\Request;

class TripayWebhookService
{
    public function __construct(
        private TripayConfigurationService $tripayConfigurationService,
        private TripayInvoicePaymentService $tripayInvoicePaymentService,
    ) {}

    public function handle(Request $request): array
    {
        $rawBody = (string) $request->getContent();
        $decoded = json_decode($rawBody, true);
        $payload = is_array($decoded) ? $decoded : [];
        $callbackData = $this->tripayConfigurationService->extractCallbackData($request);
        $signatureValid = $this->tripayConfigurationService->isValidCallbackSignature(
            $callbackData['signature'] ?? null,
            $rawBody,
        );

        if (! $this->tripayConfigurationService->getPrivateKey()) {
            return [
                'success' => false,
                'status' => 503,
                'message' => 'Private key Tripay belum dikonfigurasi.',
            ];
        }

        if (! $signatureValid) {
            return [
                'success' => false,
                'status' => 401,
                'message' => 'Invalid callback signature.',
            ];
        }

        $event = $callbackData['event'] ?? null;

        if ($event && $event !== 'payment_status') {
            return [
                'success' => true,
                'status' => 200,
                'message' => 'Event callback diabaikan.',
            ];
        }

        $this->tripayInvoicePaymentService->syncWebhookPayload($payload);

        return [
            'success' => true,
            'status' => 200,
            'message' => 'Callback Tripay diterima.',
        ];
    }
}
