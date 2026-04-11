<?php

namespace App\Http\Controllers;

use App\Modules\Platform\Billing\InvoiceService;
use App\Modules\Platform\Billing\TripayInvoicePaymentService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function __construct(
        private TripayInvoicePaymentService $tripayInvoicePaymentService,
    ) {}

    /**
     * GET /platform/v1/invoices (platform team — all invoices with stats)
     */
    public function index(Request $request): JsonResponse
    {
        // Auto-mark overdue invoices on load
        InvoiceService::markOverdue();

        $invoices = InvoiceService::list(
            companyId: $request->query('company_id') ? (int) $request->query('company_id') : null,
            status: $request->query('status'),
        );

        $stats = InvoiceService::stats(
            companyId: $request->query('company_id') ? (int) $request->query('company_id') : null,
        );

        // Transform for frontend
        $data = $invoices->map(fn ($inv) => self::transform($inv));

        return ApiResponse::success([
            'stats'    => $stats,
            'invoices' => $data,
        ]);
    }

    /**
     * GET /platform/v1/invoices/{id} (invoice detail)
     */
    public function show(int $id): JsonResponse
    {
        $invoice = InvoiceService::findOrFail($id);
        return ApiResponse::success(self::transform($invoice));
    }

    /**
     * POST /platform/v1/invoices (create invoice)
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'company_id'          => 'required|integer|exists:platform.companies,id',
            'subscription_id'     => 'sometimes|integer',
            'due_at'              => 'sometimes|date',
            'items'               => 'required|array|min:1',
            'items.*.description' => 'required|string|max:255',
            'items.*.quantity'    => 'sometimes|integer|min:1',
            'items.*.unit_price'  => 'required|numeric|min:0',
            'items.*.product_id'  => 'sometimes|integer',
        ]);

        $invoice = InvoiceService::create($request->all());
        return ApiResponse::created(self::transform($invoice));
    }

    /**
     * PUT /platform/v1/invoices/{id}/pay (mark as paid)
     */
    public function markAsPaid(int $id): JsonResponse
    {
        try {
            $invoice = InvoiceService::markAsPaid($id);
            return ApiResponse::success(self::transform($invoice));
        } catch (\RuntimeException $e) {
            return ApiResponse::conflict($e->getMessage());
        }
    }

    /**
     * PUT /platform/v1/invoices/{id}/cancel
     */
    public function cancel(int $id): JsonResponse
    {
        try {
            $invoice = InvoiceService::cancel($id);
            return ApiResponse::success(self::transform($invoice));
        } catch (\RuntimeException $e) {
            return ApiResponse::conflict($e->getMessage());
        }
    }

    /**
     * GET /platform/v1/company/invoices (company admin self-service)
     */
    public function myInvoices(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('auth_company_id');
        $invoices = InvoiceService::listByCompany($companyId);
        $stats = InvoiceService::stats($companyId);

        $data = $invoices->map(fn ($inv) => self::transform($inv));

        return ApiResponse::success([
            'stats'    => $stats,
            'invoices' => $data,
        ]);
    }

    /**
     * POST /platform/v1/company/invoices/{id}/payments/tripay
     */
    public function createMyTripayPaymentSession(Request $request, int $id): JsonResponse
    {
        $companyId = (int) $request->attributes->get('auth_company_id');
        $invoice = InvoiceService::findOrFail($id);

        if ((int) $invoice->company_id !== $companyId) {
            return ApiResponse::forbidden('Invoice ini tidak termasuk company Anda.');
        }

        try {
            $session = $this->tripayInvoicePaymentService->createOrReuseCheckout($invoice);

            return ApiResponse::success(
                data: [
                    'invoice' => self::transform($invoice->fresh(['company', 'items'])),
                    'payment_session' => $session,
                ],
                message: 'Tripay checkout ready',
            );
        } catch (\RuntimeException $e) {
            return ApiResponse::badRequest($e->getMessage());
        }
    }

    // ── Transform ──

    private static function transform($invoice): array
    {
        return [
            'id'              => $invoice->id,
            'invoice_number'  => $invoice->invoice_number,
            'company_id'      => $invoice->company_id,
            'subscription_id' => $invoice->subscription_id,
            'status'          => $invoice->status,
            'currency'        => $invoice->currency,
            'amount_total'    => (float) $invoice->amount_total,
            'payment_provider' => $invoice->payment_provider,
            'payment_reference' => $invoice->payment_reference,
            'payment_channel_code' => $invoice->payment_channel_code,
            'payment_checkout_url' => $invoice->payment_checkout_url,
            'payment_requested_at' => $invoice->payment_requested_at?->toISOString(),
            'payment_expired_at' => $invoice->payment_expired_at?->toISOString(),
            'issued_at'       => $invoice->issued_at?->toISOString(),
            'due_at'          => $invoice->due_at?->toISOString(),
            'paid_at'         => $invoice->paid_at?->toISOString(),
            'company'         => $invoice->company ? [
                'id'   => $invoice->company->id,
                'name' => $invoice->company->name,
                'code' => $invoice->company->code,
            ] : null,
            'items' => $invoice->items->map(fn ($item) => [
                'id'          => $item->id,
                'description' => $item->description,
                'quantity'    => $item->quantity,
                'unit_price'  => (float) $item->unit_price,
                'line_total'  => (float) $item->line_total,
            ]),
        ];
    }
}
