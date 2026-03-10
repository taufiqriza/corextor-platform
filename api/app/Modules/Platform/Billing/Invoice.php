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
        'issued_at', 'due_at', 'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'amount_total' => 'decimal:2',
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
