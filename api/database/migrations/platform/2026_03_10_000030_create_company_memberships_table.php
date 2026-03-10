<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'platform';

    public function up(): void
    {
        Schema::connection('platform')->create('company_memberships', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id');
            $table->unsignedBigInteger('user_id');
            $table->enum('role', ['company_admin', 'employee'])->default('employee');
            $table->enum('status', ['active', 'suspended', 'deactivated'])->default('active');
            $table->timestamps();

            $table->unique(['company_id', 'user_id']);
            $table->index(['company_id', 'role', 'status']);

            $table->foreign('company_id')->references('id')->on('companies')->onDelete('restrict');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::connection('platform')->dropIfExists('company_memberships');
    }
};
