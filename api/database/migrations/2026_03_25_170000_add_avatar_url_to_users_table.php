<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('platform')->table('users', function (Blueprint $table) {
            if (! Schema::connection('platform')->hasColumn('users', 'avatar_url')) {
                $table->string('avatar_url')->nullable()->after('email');
            }
        });
    }

    public function down(): void
    {
        Schema::connection('platform')->table('users', function (Blueprint $table) {
            if (Schema::connection('platform')->hasColumn('users', 'avatar_url')) {
                $table->dropColumn('avatar_url');
            }
        });
    }
};
