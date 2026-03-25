<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class AuthFlowTest extends TestCase
{
    use DatabaseTransactions;

    protected $connectionsToTransact = ['platform', 'attendance'];

    private int $companyId;
    private int $secondCompanyId;
    private int $superAdminUserId;
    private int $adminUserId;
    private string $companyCode;
    private string $secondPlanCode;
    private string $superAdminEmail;
    private string $adminEmail;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedMinimalData();
    }

    #[Test]
    public function email_login_returns_token_and_user(): void
    {
        $response = $this->postJson('/api/platform/v1/auth/login/email', [
            'email' => $this->adminEmail,
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.token_type', 'Bearer')
            ->assertJsonPath('data.user.role', 'company_admin')
            ->assertJsonStructure(['data' => ['token', 'expires_in', 'user']]);
    }

    #[Test]
    public function email_login_fails_with_wrong_password(): void
    {
        $response = $this->postJson('/api/platform/v1/auth/login/email', [
            'email' => $this->adminEmail,
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401);
    }

    #[Test]
    public function me_endpoint_requires_auth(): void
    {
        $response = $this->getJson('/api/platform/v1/me');
        $response->assertStatus(401);
    }

    #[Test]
    public function me_returns_user_profile_with_valid_token(): void
    {
        $token = $this->loginAndGetToken($this->adminEmail);

        $response = $this->getJson('/api/platform/v1/me', [
            'Authorization' => "Bearer {$token}",
        ]);

        $response->assertOk()
            ->assertJsonPath('data.user.email', $this->adminEmail)
            ->assertJsonPath('data.company.code', $this->companyCode);
    }

    #[Test]
    public function logout_revokes_sessions(): void
    {
        $token = $this->loginAndGetToken($this->adminEmail);

        $response = $this->postJson('/api/platform/v1/auth/logout', [], [
            'Authorization' => "Bearer {$token}",
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Logged out successfully');

        $activeSessions = DB::connection('platform')
            ->table('refresh_sessions')
            ->whereNull('revoked_at')
            ->where('user_id', $this->adminUserId)
            ->count();

        $this->assertSame(0, $activeSessions);
    }

    #[Test]
    public function company_admin_cannot_access_super_admin_routes(): void
    {
        $token = $this->loginAndGetToken($this->adminEmail);

        $response = $this->getJson('/api/platform/v1/companies', [
            'Authorization' => "Bearer {$token}",
        ]);

        $response->assertStatus(403);
    }

    #[Test]
    public function super_admin_can_access_companies(): void
    {
        $token = $this->loginAndGetToken($this->superAdminEmail);

        $response = $this->getJson('/api/platform/v1/companies', [
            'Authorization' => "Bearer {$token}",
        ]);

        $response->assertOk()
            ->assertJsonPath('status', 'success');
    }

    #[Test]
    public function super_admin_can_scope_attendance_routes_to_a_company_context(): void
    {
        $token = $this->loginAndGetToken($this->superAdminEmail);

        $response = $this->getJson('/api/attendance/v1/branches', [
            'Authorization' => "Bearer {$token}",
            'X-Company-Context' => (string) $this->secondCompanyId,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.0.company_id', $this->secondCompanyId)
            ->assertJsonPath('data.0.name', 'Remote Site');
    }

    #[Test]
    public function super_admin_can_update_plan_catalog(): void
    {
        $token = $this->loginAndGetToken($this->superAdminEmail);
        $planId = (int) DB::connection('platform')->table('plans')->where('code', 'attendance-basic-monthly')->value('id');
        $initialPlanCount = (int) DB::connection('platform')->table('plans')->count();

        $response = $this->putJson("/api/platform/v1/plans/{$planId}", [
            'name' => 'Attendance Basic Updated',
            'price' => 149000,
            'billing_cycle' => 'monthly',
            'status' => 'active',
        ], [
            'Authorization' => "Bearer {$token}",
        ]);

        $response->assertOk()
            ->assertJsonPath('data.name', 'Attendance Basic Updated')
            ->assertJsonPath('data.price', '149000.00')
            ->assertJsonPath('data.version_number', 2)
            ->assertJsonPath('data.family_code', 'attendance-basic-monthly')
            ->assertJsonPath('data.supersedes_plan_id', $planId);

        $this->assertDatabaseHas('plans', [
            'code' => 'attendance-basic-monthly-v2',
            'family_code' => 'attendance-basic-monthly',
            'name' => 'Attendance Basic Updated',
            'price' => 149000,
            'is_latest' => 1,
        ], 'platform');

        $this->assertDatabaseHas('plans', [
            'id' => $planId,
            'code' => 'attendance-basic-monthly',
            'is_latest' => 0,
        ], 'platform');

        $this->assertSame($initialPlanCount + 1, (int) DB::connection('platform')->table('plans')->count());
    }

    #[Test]
    public function super_admin_can_update_company_subscription_plan_and_status(): void
    {
        $token = $this->loginAndGetToken($this->superAdminEmail);
        $subscriptionId = (int) DB::connection('platform')->table('company_subscriptions')
            ->where('company_id', $this->companyId)
            ->value('id');

        $response = $this->putJson("/api/platform/v1/companies/{$this->companyId}/subscriptions/{$subscriptionId}", [
            'plan_code' => $this->secondPlanCode,
            'starts_at' => now()->addDay()->toDateString(),
            'status' => 'suspended',
        ], [
            'Authorization' => "Bearer {$token}",
        ]);

        $response->assertOk()
            ->assertJsonPath('data.plan.code', $this->secondPlanCode)
            ->assertJsonPath('data.billing_cycle', 'lifetime')
            ->assertJsonPath('data.status', 'suspended');

        $this->assertDatabaseHas('company_subscriptions', [
            'id' => $subscriptionId,
            'company_id' => $this->companyId,
            'billing_cycle' => 'lifetime',
            'status' => 'suspended',
        ], 'platform');
    }

    #[Test]
    public function plans_endpoint_returns_latest_versions_by_default(): void
    {
        $token = $this->loginAndGetToken($this->superAdminEmail);
        $planId = (int) DB::connection('platform')->table('plans')->where('code', 'attendance-basic-monthly')->value('id');

        $this->putJson("/api/platform/v1/plans/{$planId}", [
            'name' => 'Attendance Basic Updated',
            'price' => 149000,
            'billing_cycle' => 'monthly',
            'status' => 'active',
        ], [
            'Authorization' => "Bearer {$token}",
        ])->assertOk();

        $response = $this->getJson('/api/platform/v1/plans', [
            'Authorization' => "Bearer {$token}",
        ]);

        $response->assertOk();

        $codes = collect($response->json('data'))->pluck('code')->all();

        $this->assertContains('attendance-basic-monthly-v2', $codes);
        $this->assertNotContains('attendance-basic-monthly', $codes);
    }

    private function loginAndGetToken(string $email): string
    {
        $response = $this->postJson('/api/platform/v1/auth/login/email', [
            'email' => $email,
            'password' => 'password',
        ]);

        return (string) $response->json('data.token');
    }

    private function seedMinimalData(): void
    {
        $suffix = strtolower(Str::random(6));
        $this->companyCode = 'DM' . strtoupper(substr($suffix, 0, 4));
        $this->superAdminEmail = "superadmin.{$suffix}@corextor.test";
        $this->adminEmail = "admin.{$suffix}@demo.test";

        $this->companyId = (int) DB::connection('platform')->table('companies')->insertGetId([
            'name' => 'Demo Company ' . strtoupper($suffix),
            'code' => $this->companyCode,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->superAdminUserId = (int) DB::connection('platform')->table('users')->insertGetId([
            'name' => 'Super Admin',
            'email' => $this->superAdminEmail,
            'password' => Hash::make('password'),
            'platform_role' => 'super_admin',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->adminUserId = (int) DB::connection('platform')->table('users')->insertGetId([
            'name' => 'Admin Demo',
            'email' => $this->adminEmail,
            'password' => Hash::make('password'),
            'platform_role' => 'standard',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::connection('platform')->table('company_memberships')->insert([
            'company_id' => $this->companyId,
            'user_id' => $this->adminUserId,
            'role' => 'company_admin',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $productId = (int) (
            DB::connection('platform')->table('products')->where('code', 'attendance')->value('id')
            ?? DB::connection('platform')->table('products')->insertGetId([
                'code' => 'attendance',
                'workspace_key' => 'attendance',
                'name' => 'Attendance',
                'description' => 'Attendance workspace',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ])
        );

        $planId = (int) (
            DB::connection('platform')->table('plans')->where('code', 'attendance-basic-monthly')->value('id')
            ?? DB::connection('platform')->table('plans')->insertGetId([
                'product_id' => $productId,
                'code' => 'attendance-basic-monthly',
                'family_code' => 'attendance-basic-monthly',
                'name' => 'Basic',
                'billing_cycle' => 'monthly',
                'price' => 99000,
                'currency' => 'IDR',
                'status' => 'active',
                'version_number' => 1,
                'is_latest' => true,
                'effective_from' => now()->toDateString(),
                'created_at' => now(),
                'updated_at' => now(),
            ])
        );

        $this->secondPlanCode = 'attendance-pro-lifetime-' . strtolower(Str::random(4));

        DB::connection('platform')->table('plans')->insert([
            'product_id' => $productId,
            'code' => $this->secondPlanCode,
            'family_code' => 'attendance-pro-lifetime',
            'name' => 'Attendance Pro Lifetime',
            'billing_cycle' => 'lifetime',
            'price' => 999000,
            'currency' => 'IDR',
            'status' => 'active',
            'version_number' => 1,
            'is_latest' => true,
            'effective_from' => now()->toDateString(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $subscriptionId = (int) DB::connection('platform')->table('company_subscriptions')->insertGetId([
            'company_id' => $this->companyId,
            'product_id' => $productId,
            'plan_id' => $planId,
            'status' => 'active',
            'starts_at' => now()->toDateString(),
            'billing_cycle' => 'monthly',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::connection('platform')->table('subscription_items')->insert([
            'subscription_id' => $subscriptionId,
            'product_id' => $productId,
            'plan_id' => $planId,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->secondCompanyId = (int) DB::connection('platform')->table('companies')->insertGetId([
            'name' => 'Remote Company ' . strtoupper(Str::random(4)),
            'code' => 'RM' . strtoupper(Str::random(4)),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $secondSubscriptionId = (int) DB::connection('platform')->table('company_subscriptions')->insertGetId([
            'company_id' => $this->secondCompanyId,
            'product_id' => $productId,
            'plan_id' => $planId,
            'status' => 'active',
            'starts_at' => now()->toDateString(),
            'billing_cycle' => 'monthly',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::connection('platform')->table('subscription_items')->insert([
            'subscription_id' => $secondSubscriptionId,
            'product_id' => $productId,
            'plan_id' => $planId,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::connection('attendance')->table('branches')->insert([
            'company_id' => $this->secondCompanyId,
            'name' => 'Remote Site',
            'location' => 'Project Alpha',
            'latitude' => -6.2,
            'longitude' => 106.8,
            'radius_meters' => 150,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
