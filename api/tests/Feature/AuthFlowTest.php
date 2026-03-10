<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthFlowTest extends TestCase
{
    use DatabaseTransactions;

    protected $connectionsToTransact = ['platform', 'attendance'];

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedMinimalData();
    }

    /** @test */
    public function email_login_returns_token_and_user()
    {
        $response = $this->postJson('/api/platform/v1/auth/login/email', [
            'email' => 'admin@demo.com',
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.token_type', 'Bearer')
            ->assertJsonPath('data.user.role', 'company_admin')
            ->assertJsonStructure(['data' => ['token', 'expires_in', 'user']]);
    }

    /** @test */
    public function email_login_fails_with_wrong_password()
    {
        $response = $this->postJson('/api/platform/v1/auth/login/email', [
            'email' => 'admin@demo.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401);
    }

    /** @test */
    public function me_endpoint_requires_auth()
    {
        $response = $this->getJson('/api/platform/v1/me');
        $response->assertStatus(401);
    }

    /** @test */
    public function me_returns_user_profile_with_valid_token()
    {
        $token = $this->loginAndGetToken('admin@demo.com');

        $response = $this->getJson('/api/platform/v1/me', [
            'Authorization' => "Bearer $token",
        ]);

        $response->assertOk()
            ->assertJsonPath('data.user.email', 'admin@demo.com')
            ->assertJsonPath('data.company.code', 'DEMO');
    }

    /** @test */
    public function logout_revokes_sessions()
    {
        $token = $this->loginAndGetToken('admin@demo.com');

        $response = $this->postJson('/api/platform/v1/auth/logout', [], [
            'Authorization' => "Bearer $token",
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Logged out successfully');

        // Verify sessions revoked in DB
        $activeSessions = DB::connection('platform')
            ->table('refresh_sessions')
            ->whereNull('revoked_at')
            ->where('user_id', 2)
            ->count();

        $this->assertEquals(0, $activeSessions);
    }

    /** @test */
    public function company_admin_cannot_access_super_admin_routes()
    {
        $token = $this->loginAndGetToken('admin@demo.com');

        $response = $this->getJson('/api/platform/v1/companies', [
            'Authorization' => "Bearer $token",
        ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function super_admin_can_access_companies()
    {
        $token = $this->loginAndGetToken('superadmin@corextor.com');

        $response = $this->getJson('/api/platform/v1/companies', [
            'Authorization' => "Bearer $token",
        ]);

        $response->assertOk()
            ->assertJsonPath('status', 'success');
    }

    // ── Helpers ──

    private function loginAndGetToken(string $email): string
    {
        $response = $this->postJson('/api/platform/v1/auth/login/email', [
            'email' => $email,
            'password' => 'password',
        ]);

        return $response->json('data.token');
    }

    private function seedMinimalData(): void
    {
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
        ]);

        DB::connection('platform')->table('company_memberships')->insert([
            'company_id' => 1, 'user_id' => 2, 'role' => 'company_admin',
            'status' => 'active', 'created_at' => now(), 'updated_at' => now(),
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
    }
}
