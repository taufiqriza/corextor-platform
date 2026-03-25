<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'platform';

    public function up(): void
    {
        if (Schema::connection('platform')->hasTable('products')) {
            Schema::connection('platform')->table('products', function (Blueprint $table) {
                if (! Schema::connection('platform')->hasColumn('products', 'description')) {
                    $table->text('description')->nullable()->after('name');
                }

                if (! Schema::connection('platform')->hasColumn('products', 'workspace_key')) {
                    $table->string('workspace_key', 80)->nullable()->after('code');
                }

                if (! Schema::connection('platform')->hasColumn('products', 'metadata_json')) {
                    $table->json('metadata_json')->nullable()->after('app_url');
                }
            });

            DB::connection('platform')->table('products')
                ->whereNull('workspace_key')
                ->update(['workspace_key' => DB::raw('code')]);
        }

        if (Schema::connection('platform')->hasTable('plans')) {
            Schema::connection('platform')->table('plans', function (Blueprint $table) {
                if (! Schema::connection('platform')->hasColumn('plans', 'family_code')) {
                    $table->string('family_code', 80)->nullable()->after('code');
                }

                if (! Schema::connection('platform')->hasColumn('plans', 'version_number')) {
                    $table->unsignedInteger('version_number')->default(1)->after('family_code');
                }

                if (! Schema::connection('platform')->hasColumn('plans', 'is_latest')) {
                    $table->boolean('is_latest')->default(true)->after('version_number');
                }

                if (! Schema::connection('platform')->hasColumn('plans', 'supersedes_plan_id')) {
                    $table->unsignedBigInteger('supersedes_plan_id')->nullable()->after('is_latest');
                }

                if (! Schema::connection('platform')->hasColumn('plans', 'effective_from')) {
                    $table->date('effective_from')->nullable()->after('supersedes_plan_id');
                }

                if (! Schema::connection('platform')->hasColumn('plans', 'retired_at')) {
                    $table->date('retired_at')->nullable()->after('effective_from');
                }

                if (! Schema::connection('platform')->hasColumn('plans', 'version_notes')) {
                    $table->string('version_notes')->nullable()->after('retired_at');
                }
            });

            $plans = DB::connection('platform')->table('plans')->select('id', 'code', 'created_at')->get();

            foreach ($plans as $plan) {
                DB::connection('platform')->table('plans')
                    ->where('id', $plan->id)
                    ->update([
                        'family_code' => $plan->code,
                        'version_number' => DB::raw('COALESCE(version_number, 1)'),
                        'is_latest' => DB::raw('COALESCE(is_latest, 1)'),
                        'effective_from' => DB::raw("COALESCE(effective_from, DATE('" . substr((string) $plan->created_at, 0, 10) . "'))"),
                    ]);
            }

            Schema::connection('platform')->table('plans', function (Blueprint $table) {
                $table->index(['product_id', 'family_code']);
                $table->index(['product_id', 'is_latest', 'status']);
                $table->unique(['family_code', 'version_number'], 'plans_family_version_unique');
            });
        }
    }

    public function down(): void
    {
        if (Schema::connection('platform')->hasTable('plans')) {
            Schema::connection('platform')->table('plans', function (Blueprint $table) {
                if (Schema::connection('platform')->hasColumn('plans', 'family_code')) {
                    $table->dropUnique('plans_family_version_unique');
                    $table->dropIndex(['product_id', 'family_code']);
                    $table->dropIndex(['product_id', 'is_latest', 'status']);
                    $table->dropColumn([
                        'family_code',
                        'version_number',
                        'is_latest',
                        'supersedes_plan_id',
                        'effective_from',
                        'retired_at',
                        'version_notes',
                    ]);
                }
            });
        }

        if (Schema::connection('platform')->hasTable('products')) {
            Schema::connection('platform')->table('products', function (Blueprint $table) {
                if (Schema::connection('platform')->hasColumn('products', 'description')) {
                    $table->dropColumn(['description', 'workspace_key', 'metadata_json']);
                }
            });
        }
    }
};
