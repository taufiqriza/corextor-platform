<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    protected $connection = 'platform';

    public function up(): void
    {
        $now = now();

        $payrollProductId = DB::connection('platform')->table('products')
            ->where('code', 'payroll')
            ->value('id');

        if (! $payrollProductId) {
            $payrollProductId = DB::connection('platform')->table('products')->insertGetId([
                'code' => 'payroll',
                'workspace_key' => 'payroll',
                'name' => 'Payroll',
                'description' => 'Payroll management with compensation profiles, payroll runs, and attendance insight snapshots.',
                'status' => 'active',
                'app_url' => 'https://payroll.corextor.com',
                'metadata_json' => json_encode([
                    'admin_surface' => 'company',
                    'employee_surface' => 'planned',
                    'requires_setup' => true,
                ]),
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $plans = [
            [
                'code' => 'payroll-starter-monthly',
                'family_code' => 'payroll-starter-monthly',
                'name' => 'Payroll Starter (Monthly)',
                'billing_cycle' => 'monthly',
                'price' => 149000,
                'features_json' => [
                    'max_profiles' => 30,
                    'payroll_runs' => true,
                    'attendance_snapshot' => true,
                    'exports' => false,
                ],
            ],
            [
                'code' => 'payroll-pro-monthly',
                'family_code' => 'payroll-pro-monthly',
                'name' => 'Payroll Pro (Monthly)',
                'billing_cycle' => 'monthly',
                'price' => 349000,
                'features_json' => [
                    'max_profiles' => 200,
                    'payroll_runs' => true,
                    'attendance_snapshot' => true,
                    'exports' => true,
                ],
            ],
        ];

        foreach ($plans as $plan) {
            $exists = DB::connection('platform')->table('plans')
                ->where('code', $plan['code'])
                ->exists();

            if ($exists) {
                continue;
            }

            DB::connection('platform')->table('plans')->insert([
                'product_id' => $payrollProductId,
                'code' => $plan['code'],
                'family_code' => $plan['family_code'],
                'name' => $plan['name'],
                'billing_cycle' => $plan['billing_cycle'],
                'price' => $plan['price'],
                'currency' => 'IDR',
                'status' => 'active',
                'features_json' => json_encode($plan['features_json']),
                'version_number' => 1,
                'is_latest' => true,
                'effective_from' => $now->toDateString(),
                'version_notes' => 'Initial payroll catalog release',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        DB::connection('platform')->table('plans')
            ->whereIn('code', ['payroll-starter-monthly', 'payroll-pro-monthly'])
            ->delete();

        DB::connection('platform')->table('products')
            ->where('code', 'payroll')
            ->delete();
    }
};
