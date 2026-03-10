<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'platform';

    public function up(): void
    {
        Schema::connection('platform')->create('products', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->string('app_url')->nullable();
            $table->timestamps();
        });

        Schema::connection('platform')->create('plans', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id');
            $table->string('code', 50)->unique();
            $table->string('name');
            $table->enum('billing_cycle', ['monthly', 'yearly'])->default('monthly');
            $table->decimal('price', 12, 2)->default(0);
            $table->string('currency', 3)->default('IDR');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->json('features_json')->nullable();
            $table->timestamps();

            $table->index(['product_id', 'status']);
            $table->foreign('product_id')->references('id')->on('products')->onDelete('restrict');
        });

        Schema::connection('platform')->create('bundles', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name');
            $table->enum('billing_cycle', ['monthly', 'yearly'])->default('monthly');
            $table->decimal('price', 12, 2)->default(0);
            $table->string('currency', 3)->default('IDR');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });

        Schema::connection('platform')->create('bundle_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('bundle_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('plan_id')->nullable();
            $table->timestamps();

            $table->unique(['bundle_id', 'product_id']);
            $table->foreign('bundle_id')->references('id')->on('bundles')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::connection('platform')->dropIfExists('bundle_items');
        Schema::connection('platform')->dropIfExists('bundles');
        Schema::connection('platform')->dropIfExists('plans');
        Schema::connection('platform')->dropIfExists('products');
    }
};
