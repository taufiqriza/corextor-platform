<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AttendanceSeeder extends Seeder
{
    public function run(): void
    {
        // Uses company_id=1 (Demo Company) and user IDs from PlatformSeeder
        $companyId = 1;

        // ── Demo Branch ──
        $branchId = DB::connection('attendance')->table('branches')->insertGetId([
            'company_id' => $companyId,
            'name' => 'Kantor Pusat',
            'location' => 'Jakarta, Indonesia',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::connection('attendance')->table('branches')->insert([
            'company_id' => $companyId,
            'name' => 'Cabang Bandung',
            'location' => 'Bandung, Indonesia',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // ── Attendance User for Admin (platform_user_id=2) ──
        $pin = '1234';
        DB::connection('attendance')->table('attendance_users')->insert([
            'platform_user_id' => 2,
            'company_id' => $companyId,
            'branch_id' => $branchId,
            'pin_hash' => Hash::make($pin),
            'pin_lookup' => hash('sha256', $companyId . ':' . $pin),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // ── Attendance User for Employee (platform_user_id=3) ──
        $pin2 = '5678';
        DB::connection('attendance')->table('attendance_users')->insert([
            'platform_user_id' => 3,
            'company_id' => $companyId,
            'branch_id' => $branchId,
            'pin_hash' => Hash::make($pin2),
            'pin_lookup' => hash('sha256', $companyId . ':' . $pin2),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->command->info('Attendance seeded: 2 branches, 2 attendance users (PIN: admin=1234, employee=5678)');
    }
}
