<?php

namespace App\Modules\Platform\Billing;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Modules\Platform\Company\Company;

class Invoice extends Model
{
    protected $connection = 'platform';

    protected $fillable = [
        'company_id', 'subscription_id', 'invoice_number',
        'status', 'currency', 'amount_total',
        'payment_provider', 'payment_reference', 'payment_channel_code',
        'payment_checkout_url', 'payment_gateway_payload',
        'payment_requested_at', 'payment_expired_at',
        'issued_at', 'due_at', 'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'amount_total' => 'decimal:2',
            'payment_gateway_payload' => 'array',
            'payment_requested_at' => 'datetime',
            'payment_expired_at' => 'datetime',
            'issued_at' => 'datetime',
            'due_at' => 'datetime',
            'paid_at' => 'datetime',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }
}
