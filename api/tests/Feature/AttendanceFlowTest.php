<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AttendanceFlowTest extends TestCase
{
    use DatabaseTransactions;

    protected $connectionsToTransact = ['platform', 'attendance'];

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedFullData();
    }

    /** @test */
    public function pin_login_returns_token_with_attendance_data()
    {
        $response = $this->postJson('/api/attendance/v1/auth/login/pin', [
            'company_id' => 1,
            'pin' => '5678',
        ]);

        $response->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.user.role', 'employee')
            ->assertJsonPath('data.user.attendance_user_id', 2)
            ->assertJsonPath('data.user.branch_id', 1);
    }

    /** @test */
    public function pin_login_fails_with_wrong_pin()
    {
        $response = $this->postJson('/api/attendance/v1/auth/login/pin', [
            'company_id' => 1,
            'pin' => '9999',
        ]);

        $response->assertStatus(401);
    }

    /** @test */
    public function check_in_creates_record()
    {
        $token = $this->pinLoginAndGetToken();

        $response = $this->postJson('/api/attendance/v1/attendance/check-in', [], [
            'Authorization' => "Bearer $token",
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.status', 'present')
            ->assertJsonPath('data.date', now()->toDateString());
    }

    /** @test */
    public function duplicate_check_in_blocked()
    {
        $token = $this->pinLoginAndGetToken();

        $this->postJson('/api/attendance/v1/attendance/check-in', [], [
            'Authorization' => "Bearer $token",
        ]);

        $response = $this->postJson('/api/attendance/v1/attendance/check-in', [], [
            'Authorization' => "Bearer $token",
        ]);

        $response->assertStatus(409)
            ->assertJsonPath('message', 'Already checked in today');
    }

    /** @test */
    public function check_out_without_check_in_blocked()
    {
        $token = $this->pinLoginAndGetToken();

        $response = $this->postJson('/api/attendance/v1/attendance/check-out', [], [
            'Authorization' => "Bearer $token",
        ]);

        $response->assertStatus(409);
    }

    /** @test */
    public function full_check_in_out_flow()
    {
        $token = $this->pinLoginAndGetToken();

        $this->postJson('/api/attendance/v1/attendance/check-in', [], [
            'Authorization' => "Bearer $token",
        ])->assertStatus(201);

        $response = $this->postJson('/api/attendance/v1/attendance/check-out', [], [
            'Authorization' => "Bearer $token",
        ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'present');

        $this->assertNotNull($response->json('data.time_in'));
        $this->assertNotNull($response->json('data.time_out'));
    }

    /** @test */
    public function employee_cannot_access_admin_branches()
    {
        $token = $this->pinLoginAndGetToken();

        $response = $this->getJson('/api/attendance/v1/branches', [
            'Authorization' => "Bearer $token",
        ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function admin_can_view_attendance_report()
    {
        $token = $this->emailLoginAndGetToken('admin@demo.com');

        $response = $this->getJson('/api/attendance/v1/attendance/report', [
            'Authorization' => "Bearer $token",
        ]);

        $response->assertOk()
            ->assertJsonPath('status', 'success');
    }

    // ── Helpers ──

    private function pinLoginAndGetToken(): string
    {
        $response = $this->postJson('/api/attendance/v1/auth/login/pin', [
            'company_id' => 1,
            'pin' => '5678',
        ]);

        return $response->json('data.token');
    }

    private function emailLoginAndGetToken(string $email): string
    {
        $response = $this->postJson('/api/platform/v1/auth/login/email', [
            'email' => $email,
            'password' => 'password',
        ]);

        return $response->json('data.token');
    }

    private function seedFullData(): void
    {
        // Platform DB
        DB::connection('platform')->table('companies')->insert([
            'id' => 1, 'name' => 'Demo Company', 'code' => 'DEMO',
            'status' => 'active', 'created_at' => now(), 'updated_at' => now(),
        ]);

        DB::connection('platform')->table('users')->insert([
            ['id' => 1, 'name' => 'Super Admin', 'email' => 'superadmin@corextor.com',
             'password' => Hash::make('password'), 'platform_role' => 'super_admin',
             'status' => 'active', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'name' => 'Admin Demo', 'email' => 'admin@demo.com',
             'password' => Hash::make('password'), 'platform_role' => 'standard',
             'status' => 'active', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 3, 'name' => 'Employee One', 'email' => 'employee1@demo.com',
             'password' => Hash::make('password'), 'platform_role' => 'standard',
             'status' => 'active', 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::connection('platform')->table('company_memberships')->insert([
            ['company_id' => 1, 'user_id' => 2, 'role' => 'company_admin',
             'status' => 'active', 'created_at' => now(), 'updated_at' => now()],
            ['company_id' => 1, 'user_id' => 3, 'role' => 'employee',
             'status' => 'active', 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::connection('platform')->table('products')->insert([
            'id' => 1, 'code' => 'attendance', 'name' => 'Attendance',
            'status' => 'active', 'created_at' => now(), 'updated_at' => now(),
        ]);

        DB::connection('platform')->table('plans')->insert([
            'id' => 1, 'product_id' => 1, 'code' => 'attendance-basic-monthly',
            'name' => 'Basic', 'billing_cycle' => 'monthly', 'price' => 99000,
            'currency' => 'IDR', 'status' => 'active', 'created_at' => now(), 'updated_at' => now(),
        ]);

        $subId = DB::connection('platform')->table('company_subscriptions')->insertGetId([
            'company_id' => 1, 'product_id' => 1, 'plan_id' => 1,
            'status' => 'active', 'starts_at' => now()->toDateString(),
            'billing_cycle' => 'monthly', 'created_at' => now(), 'updated_at' => now(),
        ]);

        DB::connection('platform')->table('subscription_items')->insert([
            'subscription_id' => $subId, 'product_id' => 1, 'plan_id' => 1,
            'status' => 'active', 'created_at' => now(), 'updated_at' => now(),
        ]);

        // Attendance DB
        DB::connection('attendance')->table('branches')->insert([
            'id' => 1, 'company_id' => 1, 'name' => 'Kantor Pusat',
            'location' => 'Jakarta', 'status' => 'active',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $pin = '5678';
        DB::connection('attendance')->table('attendance_users')->insert([
            ['id' => 1, 'platform_user_id' => 2, 'company_id' => 1, 'branch_id' => 1,
             'pin_hash' => Hash::make('1234'), 'pin_lookup' => hash('sha256', '1:1234'),
             'status' => 'active', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'platform_user_id' => 3, 'company_id' => 1, 'branch_id' => 1,
             'pin_hash' => Hash::make($pin), 'pin_lookup' => hash('sha256', "1:$pin"),
             'status' => 'active', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
