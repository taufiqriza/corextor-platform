<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'attendance';

    public function up(): void
    {
        if (Schema::connection('attendance')->hasTable('attendance_records')) {
            return;
        }

        Schema::connection('attendance')->create('attendance_records', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('attendance_user_id');
            $table->unsignedBigInteger('platform_user_id');
            $table->unsignedBigInteger('company_id');
            $table->unsignedBigInteger('branch_id');
            $table->date('date');
            $table->time('time_in')->nullable();
            $table->time('time_out')->nullable();
            $table->enum('status', ['present', 'corrected', 'absent'])->default('present');
            $table->text('note')->nullable();
            $table->timestamps();

            $table->unique(['attendance_user_id', 'date']);
            $table->index(['company_id', 'branch_id', 'date']);
            $table->index(['platform_user_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::connection('attendance')->dropIfExists('attendance_records');
    }
};
