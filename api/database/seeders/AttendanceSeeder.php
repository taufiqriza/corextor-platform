<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Modules\Attendance\Services\PinService;

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
        // PIN: 123456 (6 digit)
        $pin1 = '123456';
        DB::connection('attendance')->table('attendance_users')->insert([
            'platform_user_id' => 2,
            'company_id' => $companyId,
            'branch_id' => $branchId,
            'pin_hash' => Hash::make($pin1),
            'pin_lookup' => PinService::generatePinLookup($companyId, $pin1),
            'global_pin_lookup' => PinService::generateGlobalPinLookup($pin1),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // ── Attendance User for Employee (platform_user_id=3) ──
        // PIN: 567890 (6 digit)
        $pin2 = '567890';
        DB::connection('attendance')->table('attendance_users')->insert([
            'platform_user_id' => 3,
            'company_id' => $companyId,
            'branch_id' => $branchId,
            'pin_hash' => Hash::make($pin2),
            'pin_lookup' => PinService::generatePinLookup($companyId, $pin2),
            'global_pin_lookup' => PinService::generateGlobalPinLookup($pin2),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->command->info('');
        $this->command->info('╔══════════════════════════════════════════════╗');
        $this->command->info('║  Attendance Demo Accounts (PIN Login: /pin)  ║');
        $this->command->info('╠══════════════════════════════════════════════╣');
        $this->command->info('║  Admin Demo    → PIN: 123456                ║');
        $this->command->info('║  Employee One  → PIN: 567890                ║');
        $this->command->info('╚══════════════════════════════════════════════╝');
        $this->command->info('');
    }
}
