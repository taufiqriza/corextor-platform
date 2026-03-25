<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class PlatformSeeder extends Seeder
{
    public function run(): void
    {
        // ── Super Admin ──
        $superAdminId = DB::connection('platform')->table('users')->insertGetId([
            'name' => 'Super Admin',
            'email' => 'superadmin@corextor.com',
            'password' => Hash::make('password'),
            'platform_role' => 'super_admin',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // ── Demo Company ──
        $companyId = DB::connection('platform')->table('companies')->insertGetId([
            'name' => 'Demo Company',
            'code' => 'DEMO',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // ── Company Admin ──
        $adminId = DB::connection('platform')->table('users')->insertGetId([
            'name' => 'Admin Demo',
            'email' => 'admin@demo.com',
            'password' => Hash::make('password'),
            'platform_role' => 'standard',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::connection('platform')->table('company_memberships')->insert([
            'company_id' => $companyId,
            'user_id' => $adminId,
            'role' => 'company_admin',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // ── Demo Employee ──
        $employeeId = DB::connection('platform')->table('users')->insertGetId([
            'name' => 'Employee One',
            'email' => 'employee1@demo.com',
            'password' => Hash::make('password'),
            'platform_role' => 'standard',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::connection('platform')->table('company_memberships')->insert([
            'company_id' => $companyId,
            'user_id' => $employeeId,
            'role' => 'employee',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // ── Product Catalog ──
        $attendanceProductId = DB::connection('platform')->table('products')->insertGetId([
            'code' => 'attendance',
            'workspace_key' => 'attendance',
            'name' => 'Attendance',
            'description' => 'Attendance management for office and field teams.',
            'status' => 'active',
            'app_url' => 'https://attendance.corextor.com',
            'metadata_json' => json_encode([
                'admin_surface' => 'internal',
                'employee_surface' => 'mobile',
            ]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $basicPlanId = DB::connection('platform')->table('plans')->insertGetId([
            'product_id' => $attendanceProductId,
            'code' => 'attendance-basic-monthly',
            'family_code' => 'attendance-basic-monthly',
            'name' => 'Attendance Basic (Monthly)',
            'billing_cycle' => 'monthly',
            'price' => 99000,
            'currency' => 'IDR',
            'status' => 'active',
            'version_number' => 1,
            'is_latest' => true,
            'effective_from' => now()->toDateString(),
            'features_json' => json_encode([
                'max_users' => 25,
                'max_branches' => 3,
                'geofence' => false,
                'selfie' => false,
            ]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::connection('platform')->table('plans')->insert([
            'product_id' => $attendanceProductId,
            'code' => 'attendance-pro-monthly',
            'family_code' => 'attendance-pro-monthly',
            'name' => 'Attendance Pro (Monthly)',
            'billing_cycle' => 'monthly',
            'price' => 249000,
            'currency' => 'IDR',
            'status' => 'active',
            'version_number' => 1,
            'is_latest' => true,
            'effective_from' => now()->toDateString(),
            'features_json' => json_encode([
                'max_users' => 100,
                'max_branches' => 10,
                'geofence' => true,
                'selfie' => true,
            ]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // ── Demo Subscription ──
        $subscriptionId = DB::connection('platform')->table('company_subscriptions')->insertGetId([
            'company_id' => $companyId,
            'product_id' => $attendanceProductId,
            'plan_id' => $basicPlanId,
            'status' => 'active',
            'starts_at' => now()->toDateString(),
            'billing_cycle' => 'monthly',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::connection('platform')->table('subscription_items')->insert([
            'subscription_id' => $subscriptionId,
            'product_id' => $attendanceProductId,
            'plan_id' => $basicPlanId,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // ── Demo Invoice ──
        $invoiceId = DB::connection('platform')->table('invoices')->insertGetId([
            'company_id' => $companyId,
            'subscription_id' => $subscriptionId,
            'invoice_number' => 'INV-202603-0001',
            'status' => 'paid',
            'currency' => 'IDR',
            'amount_total' => 99000,
            'issued_at' => now(),
            'due_at' => now()->addDays(30),
            'paid_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::connection('platform')->table('invoice_items')->insert([
            'invoice_id' => $invoiceId,
            'product_id' => $attendanceProductId,
            'description' => 'Attendance Basic (Monthly) - March 2026',
            'quantity' => 1,
            'unit_price' => 99000,
            'line_total' => 99000,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->command->info('Platform seeded: super admin, demo company, product catalog, subscription, invoice');
    }
}
