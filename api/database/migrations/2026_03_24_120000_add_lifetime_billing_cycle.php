<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    protected $connection = 'platform';

    public function up(): void
    {
        // Add 'lifetime' to billing_cycle enum in plans table
        DB::connection('platform')->statement(
            "ALTER TABLE `plans` MODIFY COLUMN `billing_cycle` ENUM('monthly','yearly','lifetime') NOT NULL DEFAULT 'monthly'"
        );

        // Add 'lifetime' to billing_cycle enum in company_subscriptions table
        DB::connection('platform')->statement(
            "ALTER TABLE `company_subscriptions` MODIFY COLUMN `billing_cycle` ENUM('monthly','yearly','lifetime') NOT NULL DEFAULT 'monthly'"
        );
    }

    public function down(): void
    {
        DB::connection('platform')->statement(
            "ALTER TABLE `plans` MODIFY COLUMN `billing_cycle` ENUM('monthly','yearly') NOT NULL DEFAULT 'monthly'"
        );
        DB::connection('platform')->statement(
            "ALTER TABLE `company_subscriptions` MODIFY COLUMN `billing_cycle` ENUM('monthly','yearly') NOT NULL DEFAULT 'monthly'"
        );
    }
};
