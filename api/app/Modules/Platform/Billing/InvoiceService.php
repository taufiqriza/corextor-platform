<?php

namespace App\Modules\Platform\Billing;

use App\Modules\Platform\Audit\AuditService;
use Illuminate\Database\Eloquent\Collection;

/**
 * Service layer for invoice management.
 *
 * Handles listing, creation, status updates, and statistics for invoices.
 */
class InvoiceService
{
    // ── Queries ──

    /**
     * List invoices with optional filters. Returns all (no pagination) for admin panel.
     */
    public static function list(
        ?int $companyId = null,
        ?string $status = null,
    ): Collection {
        return Invoice::query()
            ->when($companyId, fn ($q) => $q->where('company_id', $companyId))
            ->when($status, fn ($q) => $q->where('status', $status))
            ->with(['company', 'items'])
            ->orderByDesc('issued_at')
            ->get();
    }

    /**
     * List invoices for a specific company (company admin self-service).
     */
    public static function listByCompany(int $companyId): Collection
    {
        return self::list(companyId: $companyId);
    }

    /**
     * Get a single invoice with details.
     */
    public static function findOrFail(int $id): Invoice
    {
        return Invoice::with(['company', 'items'])->findOrFail($id);
    }

    /**
     * Get aggregate stats for the invoice panel.
     */
    public static function stats(?int $companyId = null): array
    {
        $query = Invoice::query()
            ->when($companyId, fn ($q) => $q->where('company_id', $companyId));

        $invoices = $query->get();

        return [
            'total'         => $invoices->count(),
            'paid'          => $invoices->where('status', 'paid')->count(),
            'pending'       => $invoices->where('status', 'pending')->count(),
            'overdue'       => $invoices->where('status', 'overdue')->count(),
            'total_amount'  => (float) $invoices->sum('amount_total'),
            'paid_amount'   => (float) $invoices->where('status', 'paid')->sum('amount_total'),
            'unpaid_amount' => (float) $invoices->whereIn('status', ['pending', 'overdue'])->sum('amount_total'),
        ];
    }

    // ── Commands ──

    /**
     * Create a new invoice for a company.
     */
    public static function create(array $data): Invoice
    {
        $invoice = Invoice::create([
            'company_id'      => $data['company_id'],
            'subscription_id' => $data['subscription_id'] ?? null,
            'invoice_number'  => self::generateInvoiceNumber(),
            'status'          => 'pending',
            'currency'        => $data['currency'] ?? 'IDR',
            'amount_total'    => $data['amount_total'] ?? 0,
            'issued_at'       => now(),
            'due_at'          => $data['due_at'] ?? now()->addDays(30),
            'paid_at'         => null,
        ]);

        // Create items if provided
        if (! empty($data['items'])) {
            foreach ($data['items'] as $item) {
                $invoice->items()->create([
                    'product_id'  => $item['product_id'] ?? null,
                    'bundle_id'   => $item['bundle_id'] ?? null,
                    'description' => $item['description'],
                    'quantity'    => $item['quantity'] ?? 1,
                    'unit_price'  => $item['unit_price'],
                    'line_total'  => ($item['quantity'] ?? 1) * $item['unit_price'],
                ]);
            }

            // Recalculate total from items
            $invoice->update([
                'amount_total' => $invoice->items()->sum('line_total'),
            ]);
        }

        AuditService::platform('invoice.created', [
            'invoice_id'     => $invoice->id,
            'invoice_number' => $invoice->invoice_number,
            'company_id'     => $invoice->company_id,
            'amount_total'   => $invoice->amount_total,
        ], $invoice->company_id);

        return $invoice->fresh(['company', 'items']);
    }

    /**
     * Mark invoice as paid.
     */
    public static function markAsPaid(int $invoiceId): Invoice
    {
        $invoice = Invoice::findOrFail($invoiceId);

        if ($invoice->status === 'paid') {
            throw new \RuntimeException('Invoice sudah dibayar.');
        }

        $invoice->update([
            'status'  => 'paid',
            'paid_at' => now(),
        ]);

        AuditService::platform('invoice.paid', [
            'invoice_id'     => $invoice->id,
            'invoice_number' => $invoice->invoice_number,
            'amount_total'   => $invoice->amount_total,
        ], $invoice->company_id);

        return $invoice->fresh(['company', 'items']);
    }

    /**
     * Mark overdue invoices (called periodically or on-demand).
     */
    public static function markOverdue(): int
    {
        return Invoice::where('status', 'pending')
            ->where('due_at', '<', now())
            ->update(['status' => 'overdue']);
    }

    /**
     * Cancel an invoice (only if pending/overdue).
     */
    public static function cancel(int $invoiceId): Invoice
    {
        $invoice = Invoice::findOrFail($invoiceId);

        if ($invoice->status === 'paid') {
            throw new \RuntimeException('Tidak bisa membatalkan invoice yang sudah dibayar.');
        }

        $invoice->update(['status' => 'cancelled']);

        AuditService::platform('invoice.cancelled', [
            'invoice_id'     => $invoice->id,
            'invoice_number' => $invoice->invoice_number,
        ], $invoice->company_id);

        return $invoice->fresh(['company', 'items']);
    }

    // ── Helpers ──

    /**
     * Generate an invoice number.
     */
    public static function generateInvoiceNumber(): string
    {
        $prefix = 'INV-' . date('Ym');
        $lastInvoice = Invoice::where('invoice_number', 'like', $prefix . '%')
            ->orderByDesc('invoice_number')
            ->first();

        if ($lastInvoice) {
            $lastSeq = (int) substr($lastInvoice->invoice_number, -4);
            $nextSeq = str_pad($lastSeq + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $nextSeq = '0001';
        }

        return $prefix . '-' . $nextSeq;
    }
}
