<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'platform';

    public function up(): void
    {
        Schema::connection('platform')->table('companies', function (Blueprint $table) {
            $table->string('logo_url')->nullable()->after('code');
            $table->string('address')->nullable()->after('logo_url');
            $table->string('phone', 30)->nullable()->after('address');
            $table->string('email')->nullable()->after('phone');
            $table->string('industry', 100)->nullable()->after('email');
        });
    }

    public function down(): void
    {
        Schema::connection('platform')->table('companies', function (Blueprint $table) {
            $table->dropColumn(['logo_url', 'address', 'phone', 'email', 'industry']);
        });
    }
};
