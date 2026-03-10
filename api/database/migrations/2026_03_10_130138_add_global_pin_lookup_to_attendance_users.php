<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'attendance';

    public function up(): void
    {
        Schema::connection('attendance')->table('attendance_users', function (Blueprint $table) {
            $table->string('global_pin_lookup', 64)->nullable()->unique()->after('pin_lookup');
        });
    }

    public function down(): void
    {
        Schema::connection('attendance')->table('attendance_users', function (Blueprint $table) {
            $table->dropColumn('global_pin_lookup');
        });
    }
};
