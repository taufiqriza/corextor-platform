<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'attendance';

    public function up(): void
    {
        if (Schema::connection('attendance')->hasTable('attendance_users')) {
            return;
        }

        Schema::connection('attendance')->create('attendance_users', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('platform_user_id');
            $table->unsignedBigInteger('company_id');
            $table->unsignedBigInteger('branch_id');
            $table->string('pin_hash')->nullable();
            $table->string('pin_lookup', 128)->nullable()->comment('hashed PIN for login lookup');
            $table->enum('status', ['active', 'suspended', 'deactivated'])->default('active');
            $table->timestamps();

            $table->unique(['company_id', 'platform_user_id']);
            $table->unique(['company_id', 'pin_lookup']);
            $table->index(['company_id', 'branch_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::connection('attendance')->dropIfExists('attendance_users');
    }
};
