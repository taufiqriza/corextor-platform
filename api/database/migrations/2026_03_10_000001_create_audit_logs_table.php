<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The database connection that should be used by the migration.
     */
    protected $connection = 'platform';

    public function up(): void
    {
        Schema::connection('platform')->create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->string('product_code', 50)->nullable()->comment('null for platform events');
            $table->unsignedBigInteger('company_id')->nullable()->comment('null for global events');
            $table->unsignedBigInteger('user_id')->nullable()->comment('acting user');
            $table->string('action', 100)->comment('e.g. user.login, attendance.check_in');
            $table->json('details_json')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['product_code', 'company_id', 'created_at']);
            $table->index(['company_id', 'created_at']);
            $table->index('action');
        });
    }

    public function down(): void
    {
        Schema::connection('platform')->dropIfExists('audit_logs');
    }
};
