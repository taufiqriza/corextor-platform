<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'platform';

    public function up(): void
    {
        Schema::connection('platform')->create('company_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->unsignedBigInteger('product_id')->nullable();
            $table->unsignedBigInteger('bundle_id')->nullable();
            $table->unsignedBigInteger('plan_id')->nullable();
            $table->enum('status', ['active', 'trial', 'suspended', 'expired', 'cancelled'])->default('active');
            $table->date('starts_at');
            $table->date('ends_at')->nullable();
            $table->date('trial_ends_at')->nullable();
            $table->enum('billing_cycle', ['monthly', 'yearly'])->default('monthly');
            $table->timestamps();

            $table->index(['company_id', 'status']);
            $table->index(['company_id', 'product_id', 'status']);
            $table->foreign('company_id')->references('id')->on('companies')->onDelete('restrict');
        });

        Schema::connection('platform')->create('subscription_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('subscription_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('plan_id')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();

            $table->unique(['subscription_id', 'product_id']);
            $table->foreign('subscription_id')->references('id')->on('company_subscriptions')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::connection('platform')->dropIfExists('subscription_items');
        Schema::connection('platform')->dropIfExists('company_subscriptions');
    }
};
