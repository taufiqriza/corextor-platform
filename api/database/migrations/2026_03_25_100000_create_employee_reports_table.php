<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'attendance';

    public function up(): void
    {
        Schema::connection('attendance')->create('employee_reports', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('attendance_user_id');
            $table->unsignedBigInteger('platform_user_id');
            $table->unsignedBigInteger('company_id');
            $table->unsignedBigInteger('branch_id')->nullable();
            $table->date('report_date');
            $table->string('title', 160);
            $table->text('description');
            $table->json('attachments_json')->nullable();
            $table->enum('status', ['submitted'])->default('submitted');
            $table->timestamps();

            $table->index(['company_id', 'report_date']);
            $table->index(['platform_user_id', 'report_date']);
            $table->index(['attendance_user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::connection('attendance')->dropIfExists('employee_reports');
    }
};
