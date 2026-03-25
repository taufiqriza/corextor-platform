<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'platform';

    public function up(): void
    {
        Schema::connection('platform')->create('invoices', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->unsignedBigInteger('subscription_id')->nullable();
            $table->string('invoice_number', 50)->unique();
            $table->enum('status', ['draft', 'issued', 'paid', 'overdue', 'cancelled'])->default('draft');
            $table->string('currency', 3)->default('IDR');
            $table->decimal('amount_total', 12, 2)->default(0);
            $table->timestamp('issued_at')->nullable();
            $table->timestamp('due_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'status', 'issued_at']);
            $table->foreign('company_id')->references('id')->on('companies')->onDelete('restrict');
        });

        Schema::connection('platform')->create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('invoice_id');
            $table->unsignedBigInteger('product_id')->nullable();
            $table->unsignedBigInteger('bundle_id')->nullable();
            $table->string('description');
            $table->integer('quantity')->default(1);
            $table->decimal('unit_price', 12, 2)->default(0);
            $table->decimal('line_total', 12, 2)->default(0);
            $table->timestamps();

            $table->foreign('invoice_id')->references('id')->on('invoices')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::connection('platform')->dropIfExists('invoice_items');
        Schema::connection('platform')->dropIfExists('invoices');
    }
};
