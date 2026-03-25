<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'platform';

    public function up(): void
    {
        Schema::connection('platform')->create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code', 50)->unique();
            $table->enum('status', ['active', 'suspended', 'deactivated'])->default('active');
            $table->timestamps();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::connection('platform')->dropIfExists('companies');
    }
};
