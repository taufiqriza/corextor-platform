<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'payroll';

    public function up(): void
    {
        if (! Schema::connection('payroll')->hasTable('payroll_schedules')) {
            Schema::connection('payroll')->create('payroll_schedules', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('company_id');
                $table->string('code', 60);
                $table->string('name');
                $table->enum('pay_frequency', ['monthly'])->default('monthly');
                $table->unsignedTinyInteger('cutoff_day')->nullable();
                $table->unsignedTinyInteger('payout_day')->nullable();
                $table->enum('status', ['active', 'inactive'])->default('active');
                $table->timestamps();

                $table->unique(['company_id', 'code']);
                $table->index(['company_id', 'status']);
            });
        }

        if (! Schema::connection('payroll')->hasTable('payroll_components')) {
            Schema::connection('payroll')->create('payroll_components', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('company_id');
                $table->string('code', 80);
                $table->string('name');
                $table->enum('type', ['earning', 'deduction']);
                $table->enum('amount_type', ['fixed', 'manual'])->default('fixed');
                $table->decimal('default_amount', 14, 2)->default(0);
                $table->boolean('is_recurring')->default(true);
                $table->boolean('taxable')->default(false);
                $table->integer('sort_order')->default(0);
                $table->enum('status', ['active', 'inactive'])->default('active');
                $table->timestamps();

                $table->unique(['company_id', 'code']);
                $table->index(['company_id', 'type', 'status']);
            });
        }

        if (! Schema::connection('payroll')->hasTable('payroll_employee_profiles')) {
            Schema::connection('payroll')->create('payroll_employee_profiles', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('company_id');
                $table->unsignedBigInteger('platform_user_id');
                $table->unsignedBigInteger('pay_schedule_id')->nullable();
                $table->enum('employment_type', ['monthly', 'daily', 'contract'])->default('monthly');
                $table->decimal('base_salary', 14, 2)->default(0);
                $table->string('bank_name')->nullable();
                $table->string('bank_account_name')->nullable();
                $table->string('bank_account_number', 50)->nullable();
                $table->text('notes')->nullable();
                $table->enum('status', ['active', 'inactive'])->default('active');
                $table->timestamps();

                $table->unique(['company_id', 'platform_user_id']);
                $table->index(['company_id', 'status']);
                $table->index(['pay_schedule_id']);
            });
        }

        if (! Schema::connection('payroll')->hasTable('payroll_profile_components')) {
            Schema::connection('payroll')->create('payroll_profile_components', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('payroll_employee_profile_id');
                $table->unsignedBigInteger('payroll_component_id');
                $table->decimal('amount', 14, 2)->default(0);
                $table->enum('status', ['active', 'inactive'])->default('active');
                $table->timestamps();

                $table->unique(['payroll_employee_profile_id', 'payroll_component_id'], 'payroll_profile_component_unique');
                $table->index(['payroll_component_id']);
            });
        }

        if (! Schema::connection('payroll')->hasTable('payroll_runs')) {
            Schema::connection('payroll')->create('payroll_runs', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('company_id');
                $table->unsignedBigInteger('pay_schedule_id')->nullable();
                $table->string('reference_code', 80)->unique();
                $table->date('period_start');
                $table->date('period_end');
                $table->date('payout_date')->nullable();
                $table->enum('status', ['draft', 'finalized', 'paid', 'cancelled'])->default('draft');
                $table->unsignedInteger('employees_count')->default(0);
                $table->decimal('earnings_total', 14, 2)->default(0);
                $table->decimal('deductions_total', 14, 2)->default(0);
                $table->decimal('net_total', 14, 2)->default(0);
                $table->unsignedBigInteger('generated_by_user_id')->nullable();
                $table->unsignedBigInteger('finalized_by_user_id')->nullable();
                $table->timestamp('finalized_at')->nullable();
                $table->json('metadata_json')->nullable();
                $table->timestamps();

                $table->unique(['company_id', 'pay_schedule_id', 'period_start', 'period_end'], 'payroll_runs_company_schedule_period_unique');
                $table->index(['company_id', 'status']);
            });
        }

        if (! Schema::connection('payroll')->hasTable('payroll_run_items')) {
            Schema::connection('payroll')->create('payroll_run_items', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('payroll_run_id');
                $table->unsignedBigInteger('company_id');
                $table->unsignedBigInteger('platform_user_id');
                $table->unsignedBigInteger('payroll_employee_profile_id')->nullable();
                $table->string('employee_name_snapshot');
                $table->json('attendance_summary_json')->nullable();
                $table->json('component_lines_json')->nullable();
                $table->decimal('earnings_total', 14, 2)->default(0);
                $table->decimal('deductions_total', 14, 2)->default(0);
                $table->decimal('net_total', 14, 2)->default(0);
                $table->enum('status', ['draft', 'finalized', 'paid'])->default('draft');
                $table->timestamps();

                $table->unique(['payroll_run_id', 'platform_user_id'], 'payroll_run_user_unique');
                $table->index(['company_id', 'status']);
            });
        }
    }

    public function down(): void
    {
        Schema::connection('payroll')->dropIfExists('payroll_run_items');
        Schema::connection('payroll')->dropIfExists('payroll_runs');
        Schema::connection('payroll')->dropIfExists('payroll_profile_components');
        Schema::connection('payroll')->dropIfExists('payroll_employee_profiles');
        Schema::connection('payroll')->dropIfExists('payroll_components');
        Schema::connection('payroll')->dropIfExists('payroll_schedules');
    }
};
