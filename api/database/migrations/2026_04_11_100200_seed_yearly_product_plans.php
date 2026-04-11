<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    protected $connection = 'platform';

    public function up(): void
    {
        $now = now();

        $products = [
            'attendance' => [
                [
                    'code' => 'attendance-basic-yearly',
                    'family_code' => 'attendance-basic-yearly',
                    'name' => 'Attendance Basic (Yearly)',
                    'price' => 891000,
                    'features_json' => [
                        'max_users' => 25,
                        'max_branches' => 3,
                        'geofence' => false,
                        'selfie' => false,
                        'annual_billing' => true,
                    ],
                ],
                [
                    'code' => 'attendance-pro-yearly',
                    'family_code' => 'attendance-pro-yearly',
                    'name' => 'Attendance Pro (Yearly)',
                    'price' => 2241000,
                    'features_json' => [
                        'max_users' => 100,
                        'max_branches' => 10,
                        'geofence' => true,
                        'selfie' => true,
                        'priority_support' => true,
                        'annual_billing' => true,
                    ],
                ],
            ],
            'payroll' => [
                [
                    'code' => 'payroll-starter-yearly',
                    'family_code' => 'payroll-starter-yearly',
                    'name' => 'Payroll Starter (Yearly)',
                    'price' => 1341000,
                    'features_json' => [
                        'max_profiles' => 30,
                        'payroll_runs' => true,
                        'attendance_snapshot' => true,
                        'exports' => false,
                        'annual_billing' => true,
                    ],
                ],
                [
                    'code' => 'payroll-pro-yearly',
                    'family_code' => 'payroll-pro-yearly',
                    'name' => 'Payroll Pro (Yearly)',
                    'price' => 3141000,
                    'features_json' => [
                        'max_profiles' => 200,
                        'payroll_runs' => true,
                        'attendance_snapshot' => true,
                        'exports' => true,
                        'priority_support' => true,
                        'annual_billing' => true,
                    ],
                ],
            ],
        ];

        foreach ($products as $productCode => $plans) {
            $productId = DB::connection('platform')->table('products')
                ->where('code', $productCode)
                ->value('id');

            if (! $productId) {
                continue;
            }

            foreach ($plans as $plan) {
                $exists = DB::connection('platform')->table('plans')
                    ->where('code', $plan['code'])
                    ->exists();

                if ($exists) {
                    continue;
                }

                DB::connection('platform')->table('plans')->insert([
                    'product_id' => $productId,
                    'code' => $plan['code'],
                    'family_code' => $plan['family_code'],
                    'name' => $plan['name'],
                    'billing_cycle' => 'yearly',
                    'price' => $plan['price'],
                    'currency' => 'IDR',
                    'status' => 'active',
                    'features_json' => json_encode($plan['features_json']),
                    'version_number' => 1,
                    'is_latest' => true,
                    'effective_from' => $now->toDateString(),
                    'version_notes' => 'Initial yearly catalog release',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }

    public function down(): void
    {
        DB::connection('platform')->table('plans')
            ->whereIn('code', [
                'attendance-basic-yearly',
                'attendance-pro-yearly',
                'payroll-starter-yearly',
                'payroll-pro-yearly',
            ])
            ->delete();
    }
};
