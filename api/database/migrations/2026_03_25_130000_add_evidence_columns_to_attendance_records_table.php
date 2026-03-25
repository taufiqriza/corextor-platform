<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'attendance';

    public function up(): void
    {
        if (! Schema::connection('attendance')->hasTable('attendance_records')) {
            return;
        }

        Schema::connection('attendance')->table('attendance_records', function (Blueprint $table) {
            if (! Schema::connection('attendance')->hasColumn('attendance_records', 'attendance_mode_in')) {
                $table->enum('attendance_mode_in', ['office', 'field'])->default('office')->after('date');
            }
            if (! Schema::connection('attendance')->hasColumn('attendance_records', 'check_in_latitude')) {
                $table->decimal('check_in_latitude', 10, 7)->nullable()->after('time_in');
            }
            if (! Schema::connection('attendance')->hasColumn('attendance_records', 'check_in_longitude')) {
                $table->decimal('check_in_longitude', 10, 7)->nullable()->after('check_in_latitude');
            }
            if (! Schema::connection('attendance')->hasColumn('attendance_records', 'check_in_accuracy_meters')) {
                $table->decimal('check_in_accuracy_meters', 8, 2)->nullable()->after('check_in_longitude');
            }
            if (! Schema::connection('attendance')->hasColumn('attendance_records', 'check_in_distance_meters')) {
                $table->decimal('check_in_distance_meters', 10, 2)->nullable()->after('check_in_accuracy_meters');
            }
            if (! Schema::connection('attendance')->hasColumn('attendance_records', 'check_in_within_branch_radius')) {
                $table->boolean('check_in_within_branch_radius')->nullable()->after('check_in_distance_meters');
            }
            if (! Schema::connection('attendance')->hasColumn('attendance_records', 'check_in_selfie_path')) {
                $table->string('check_in_selfie_path')->nullable()->after('check_in_within_branch_radius');
            }
            if (! Schema::connection('attendance')->hasColumn('attendance_records', 'check_out_latitude')) {
                $table->decimal('check_out_latitude', 10, 7)->nullable()->after('time_out');
            }
            if (! Schema::connection('attendance')->hasColumn('attendance_records', 'check_out_longitude')) {
                $table->decimal('check_out_longitude', 10, 7)->nullable()->after('check_out_latitude');
            }
            if (! Schema::connection('attendance')->hasColumn('attendance_records', 'check_out_accuracy_meters')) {
                $table->decimal('check_out_accuracy_meters', 8, 2)->nullable()->after('check_out_longitude');
            }
            if (! Schema::connection('attendance')->hasColumn('attendance_records', 'check_out_distance_meters')) {
                $table->decimal('check_out_distance_meters', 10, 2)->nullable()->after('check_out_accuracy_meters');
            }
            if (! Schema::connection('attendance')->hasColumn('attendance_records', 'check_out_within_branch_radius')) {
                $table->boolean('check_out_within_branch_radius')->nullable()->after('check_out_distance_meters');
            }
            if (! Schema::connection('attendance')->hasColumn('attendance_records', 'check_out_selfie_path')) {
                $table->string('check_out_selfie_path')->nullable()->after('check_out_within_branch_radius');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::connection('attendance')->hasTable('attendance_records')) {
            return;
        }

        Schema::connection('attendance')->table('attendance_records', function (Blueprint $table) {
            $columns = array_values(array_filter([
                Schema::connection('attendance')->hasColumn('attendance_records', 'attendance_mode_in') ? 'attendance_mode_in' : null,
                Schema::connection('attendance')->hasColumn('attendance_records', 'check_in_latitude') ? 'check_in_latitude' : null,
                Schema::connection('attendance')->hasColumn('attendance_records', 'check_in_longitude') ? 'check_in_longitude' : null,
                Schema::connection('attendance')->hasColumn('attendance_records', 'check_in_accuracy_meters') ? 'check_in_accuracy_meters' : null,
                Schema::connection('attendance')->hasColumn('attendance_records', 'check_in_distance_meters') ? 'check_in_distance_meters' : null,
                Schema::connection('attendance')->hasColumn('attendance_records', 'check_in_within_branch_radius') ? 'check_in_within_branch_radius' : null,
                Schema::connection('attendance')->hasColumn('attendance_records', 'check_in_selfie_path') ? 'check_in_selfie_path' : null,
                Schema::connection('attendance')->hasColumn('attendance_records', 'check_out_latitude') ? 'check_out_latitude' : null,
                Schema::connection('attendance')->hasColumn('attendance_records', 'check_out_longitude') ? 'check_out_longitude' : null,
                Schema::connection('attendance')->hasColumn('attendance_records', 'check_out_accuracy_meters') ? 'check_out_accuracy_meters' : null,
                Schema::connection('attendance')->hasColumn('attendance_records', 'check_out_distance_meters') ? 'check_out_distance_meters' : null,
                Schema::connection('attendance')->hasColumn('attendance_records', 'check_out_within_branch_radius') ? 'check_out_within_branch_radius' : null,
                Schema::connection('attendance')->hasColumn('attendance_records', 'check_out_selfie_path') ? 'check_out_selfie_path' : null,
            ]));

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
