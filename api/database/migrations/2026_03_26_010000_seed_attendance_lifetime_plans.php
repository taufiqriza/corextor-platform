<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    protected $connection = 'platform';

    public function up(): void
    {
        $now = now();

        $attendanceProductId = DB::connection('platform')->table('products')
            ->where('code', 'attendance')
            ->value('id');

        if (! $attendanceProductId) {
            return;
        }

        $plans = [
            [
                'code' => 'attendance-basic-lifetime',
                'family_code' => 'attendance-basic-lifetime',
                'name' => 'Attendance Basic Lifetime',
                'billing_cycle' => 'lifetime',
                'price' => 990000,
                'features_json' => [
                    'max_users' => 25,
                    'max_branches' => 3,
                    'geofence' => false,
                    'selfie' => false,
                    'lifetime' => true,
                ],
            ],
            [
                'code' => 'attendance-pro-lifetime',
                'family_code' => 'attendance-pro-lifetime',
                'name' => 'Attendance Pro Lifetime',
                'billing_cycle' => 'lifetime',
                'price' => 2490000,
                'features_json' => [
                    'max_users' => 100,
                    'max_branches' => 10,
                    'geofence' => true,
                    'selfie' => true,
                    'priority_support' => true,
                    'lifetime' => true,
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
                'product_id' => $attendanceProductId,
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
                'version_notes' => 'Initial attendance lifetime catalog release',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        DB::connection('platform')->table('plans')
            ->whereIn('code', ['attendance-basic-lifetime', 'attendance-pro-lifetime'])
            ->delete();
    }
};
