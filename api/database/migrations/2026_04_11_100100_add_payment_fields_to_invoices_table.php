<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'platform';

    public function up(): void
    {
        Schema::connection('platform')->table('invoices', function (Blueprint $table) {
            $table->string('payment_provider', 50)->nullable()->after('amount_total');
            $table->string('payment_reference', 100)->nullable()->after('payment_provider');
            $table->string('payment_channel_code', 50)->nullable()->after('payment_reference');
            $table->text('payment_checkout_url')->nullable()->after('payment_channel_code');
            $table->json('payment_gateway_payload')->nullable()->after('payment_checkout_url');
            $table->timestamp('payment_requested_at')->nullable()->after('payment_gateway_payload');
            $table->timestamp('payment_expired_at')->nullable()->after('payment_requested_at');

            $table->index(['payment_provider', 'payment_reference'], 'invoices_payment_provider_reference_index');
        });
    }

    public function down(): void
    {
        Schema::connection('platform')->table('invoices', function (Blueprint $table) {
            $table->dropIndex('invoices_payment_provider_reference_index');
            $table->dropColumn([
                'payment_provider',
                'payment_reference',
                'payment_channel_code',
                'payment_checkout_url',
                'payment_gateway_payload',
                'payment_requested_at',
                'payment_expired_at',
            ]);
        });
    }
};
