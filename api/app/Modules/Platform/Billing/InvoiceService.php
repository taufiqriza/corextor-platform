<?php

namespace App\Modules\Platform\Billing;

use App\Modules\Platform\Audit\AuditService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class InvoiceService
{
    /**
     * List invoices with optional filters.
     */
    public static function list(
        ?int $companyId = null,
        ?string $status = null,
        int $perPage = 15,
    ): LengthAwarePaginator {
        return Invoice::query()
            ->when($companyId, fn ($q) => $q->where('company_id', $companyId))
            ->when($status, fn ($q) => $q->where('status', $status))
            ->with('items')
            ->orderByDesc('issued_at')
            ->paginate($perPage);
    }

    /**
     * List invoices for a specific company (company admin self-service).
     */
    public static function listByCompany(int $companyId, int $perPage = 15): LengthAwarePaginator
    {
        return self::list(companyId: $companyId, perPage: $perPage);
    }

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
