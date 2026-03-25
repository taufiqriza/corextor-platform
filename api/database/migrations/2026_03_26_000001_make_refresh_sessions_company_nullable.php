<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'platform';

    public function up(): void
    {
        if (! Schema::connection('platform')->hasTable('refresh_sessions')) {
            return;
        }

        DB::connection('platform')->statement(
            'ALTER TABLE refresh_sessions DROP FOREIGN KEY refresh_sessions_company_id_foreign'
        );

        DB::connection('platform')->statement(
            'ALTER TABLE refresh_sessions MODIFY company_id BIGINT UNSIGNED NULL'
        );

        DB::connection('platform')->statement(
            'ALTER TABLE refresh_sessions
                ADD CONSTRAINT refresh_sessions_company_id_foreign
                FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT'
        );
    }

    public function down(): void
    {
        if (! Schema::connection('platform')->hasTable('refresh_sessions')) {
            return;
        }

        DB::connection('platform')->statement(
            'ALTER TABLE refresh_sessions DROP FOREIGN KEY refresh_sessions_company_id_foreign'
        );

        DB::connection('platform')->statement(
            'ALTER TABLE refresh_sessions MODIFY company_id BIGINT UNSIGNED NOT NULL'
        );

        DB::connection('platform')->statement(
            'ALTER TABLE refresh_sessions
                ADD CONSTRAINT refresh_sessions_company_id_foreign
                FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT'
        );
    }
};
