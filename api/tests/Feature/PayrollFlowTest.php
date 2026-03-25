<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PayrollFlowTest extends TestCase
{
    use DatabaseTransactions;

    protected $connectionsToTransact = ['platform', 'attendance', 'payroll'];

    private int $companyId = 0;
    private int $adminUserId = 0;
    private int $employeeUserId = 0;
    private int $superAdminUserId = 0;
    private int $attendanceProductId = 0;
    private int $payrollProductId = 0;
    private string $adminEmail = '';
    private string $superAdminEmail = '';

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedPayrollData();
    }

    #[Test]
    public function company_admin_can_setup_payroll_and_generate_then_finalize_run(): void
    {
        $token = $this->loginAndGetToken($this->adminEmail);

        $scheduleResponse = $this->postJson('/api/payroll/v1/schedules', [
            'name' => 'Payroll Bulanan',
            'cutoff_day' => 25,
            'payout_day' => 28,
        ], [
            'Authorization' => "Bearer {$token}",
        ]);

        $scheduleResponse->assertCreated();
        $scheduleId = (int) $scheduleResponse->json('data.id');

        $componentResponse = $this->postJson('/api/payroll/v1/components', [
            'name' => 'Tunjangan Transport',
            'type' => 'earning',
            'amount_type' => 'fixed',
            'default_amount' => 250000,
            'is_recurring' => true,
            'taxable' => false,
        ], [
            'Authorization' => "Bearer {$token}",
        ]);

        $componentResponse->assertCreated();
        $componentId = (int) $componentResponse->json('data.id');

        $profileResponse = $this->postJson('/api/payroll/v1/profiles', [
            'platform_user_id' => $this->employeeUserId,
            'pay_schedule_id' => $scheduleId,
            'employment_type' => 'monthly',
            'base_salary' => 4500000,
            'status' => 'active',
            'components' => [
                [
                    'payroll_component_id' => $componentId,
                    'amount' => 250000,
                    'status' => 'active',
                ],
            ],
        ], [
            'Authorization' => "Bearer {$token}",
        ]);

        $profileResponse->assertCreated()
            ->assertJsonPath('data.user.id', $this->employeeUserId);

        $this->assertSame(4500000.0, (float) $profileResponse->json('data.base_salary'));

        $runResponse = $this->postJson('/api/payroll/v1/runs', [
            'pay_schedule_id' => $scheduleId,
            'period_start' => '2026-03-01',
            'period_end' => '2026-03-31',
            'payout_date' => '2026-04-01',
        ], [
            'Authorization' => "Bearer {$token}",
        ]);

        $runResponse->assertCreated()
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.items.0.employee_name', 'Payroll Employee')
            ->assertJsonPath('data.items.0.attendance_summary.integrated', true)
            ->assertJsonPath('data.items.0.attendance_summary.present_days', 1);

        $this->assertSame(4750000.0, (float) $runResponse->json('data.items.0.net_total'));

        $runId = (int) $runResponse->json('data.id');

        $finalizeResponse = $this->postJson("/api/payroll/v1/runs/{$runId}/finalize", [], [
            'Authorization' => "Bearer {$token}",
        ]);

        $finalizeResponse->assertOk()
            ->assertJsonPath('data.status', 'finalized')
            ->assertJsonPath('data.items.0.status', 'finalized');
    }

    #[Test]
    public function payroll_run_list_uses_default_pagination_15(): void
    {
        $scheduleId = $this->insertPayrollSchedule();

        for ($i = 1; $i <= 16; $i++) {
            DB::connection('payroll')->table('payroll_runs')->insert([
                'company_id' => $this->companyId,
                'pay_schedule_id' => $scheduleId,
                'reference_code' => sprintf('PAY-202603-%04d', $i),
                'period_start' => "2026-03-" . str_pad((string) min($i, 28), 2, '0', STR_PAD_LEFT),
                'period_end' => "2026-03-" . str_pad((string) min($i + 1, 28), 2, '0', STR_PAD_LEFT),
                'status' => 'draft',
                'employees_count' => 1,
                'earnings_total' => 1000000,
                'deductions_total' => 0,
                'net_total' => 1000000,
                'generated_by_user_id' => $this->adminUserId,
                'created_at' => now()->subDays($i),
                'updated_at' => now()->subDays($i),
            ]);
        }

        $token = $this->loginAndGetToken($this->adminEmail);

        $response = $this->getJson('/api/payroll/v1/runs', [
            'Authorization' => "Bearer {$token}",
        ]);

        $response->assertOk()
            ->assertJsonPath('data.pagination.per_page', 15)
            ->assertJsonPath('data.pagination.total', 16);
    }

    #[Test]
    public function super_admin_can_open_payroll_dashboard_with_company_context_override(): void
    {
        $token = $this->loginAndGetToken($this->superAdminEmail);

        $response = $this->getJson('/api/payroll/v1/dashboard', [
            'Authorization' => "Bearer {$token}",
            'X-Company-Context' => (string) $this->companyId,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.integrations.attendance', true)
            ->assertJsonPath('data.stats.profiles', 0);
    }

    private function loginAndGetToken(string $email): string
    {
        $response = $this->postJson('/api/platform/v1/auth/login/email', [
            'email' => $email,
            'password' => 'password',
        ]);

        return (string) $response->json('data.token');
    }

    private function seedPayrollData(): void
    {
        $suffix = strtolower(Str::random(6));
        $this->adminEmail = "payroll.admin.{$suffix}@demo.test";
        $this->superAdminEmail = "payroll.super.{$suffix}@corextor.test";

        $this->companyId = (int) DB::connection('platform')->table('companies')->insertGetId([
            'name' => 'Payroll Demo ' . strtoupper($suffix),
            'code' => 'PY' . strtoupper(substr($suffix, 0, 4)),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->superAdminUserId = (int) DB::connection('platform')->table('users')->insertGetId([
            'name' => 'Super Payroll',
            'email' => $this->superAdminEmail,
            'password' => Hash::make('password'),
            'platform_role' => 'super_admin',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->adminUserId = (int) DB::connection('platform')->table('users')->insertGetId([
            'name' => 'Payroll Admin',
            'email' => $this->adminEmail,
            'password' => Hash::make('password'),
            'platform_role' => 'standard',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->employeeUserId = (int) DB::connection('platform')->table('users')->insertGetId([
            'name' => 'Payroll Employee',
            'email' => "payroll.employee.{$suffix}@demo.test",
            'password' => Hash::make('password'),
            'platform_role' => 'standard',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::connection('platform')->table('company_memberships')->insert([
            [
                'company_id' => $this->companyId,
                'user_id' => $this->adminUserId,
                'role' => 'company_admin',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'company_id' => $this->companyId,
                'user_id' => $this->employeeUserId,
                'role' => 'employee',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $this->attendanceProductId = $this->ensureProductWithPlan('attendance', 'attendance', 'Attendance', 'attendance-basic-monthly', 99000);
        $this->payrollProductId = $this->ensureProductWithPlan('payroll', 'payroll', 'Payroll', 'payroll-starter-monthly', 149000);

        $this->attachProductToCompany($this->attendanceProductId, 'attendance-basic-monthly');
        $this->attachProductToCompany($this->payrollProductId, 'payroll-starter-monthly');

        DB::connection('attendance')->table('attendance_records')->insert([
            'attendance_user_id' => 1,
            'platform_user_id' => $this->employeeUserId,
            'company_id' => $this->companyId,
            'branch_id' => 1,
            'date' => '2026-03-10',
            'time_in' => '08:01:00',
            'time_out' => '17:03:00',
            'status' => 'present',
            'attendance_mode_in' => 'office',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function ensureProductWithPlan(string $productCode, string $workspaceKey, string $productName, string $planCode, int $price): int
    {
        $productId = (int) (
            DB::connection('platform')->table('products')->where('code', $productCode)->value('id')
            ?? DB::connection('platform')->table('products')->insertGetId([
                'code' => $productCode,
                'workspace_key' => $workspaceKey,
                'name' => $productName,
                'description' => "{$productName} workspace",
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ])
        );

        if (! DB::connection('platform')->table('plans')->where('code', $planCode)->exists()) {
            DB::connection('platform')->table('plans')->insert([
                'product_id' => $productId,
                'code' => $planCode,
                'family_code' => $planCode,
                'name' => $productName . ' Basic',
                'billing_cycle' => 'monthly',
                'price' => $price,
                'currency' => 'IDR',
                'status' => 'active',
                'version_number' => 1,
                'is_latest' => true,
                'effective_from' => now()->toDateString(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return $productId;
    }

    private function attachProductToCompany(int $productId, string $planCode): void
    {
        $planId = (int) DB::connection('platform')->table('plans')->where('code', $planCode)->value('id');

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
    }

    private function insertPayrollSchedule(): int
    {
        return (int) DB::connection('payroll')->table('payroll_schedules')->insertGetId([
            'company_id' => $this->companyId,
            'code' => 'monthly-default',
            'name' => 'Monthly Default',
            'pay_frequency' => 'monthly',
            'cutoff_day' => 25,
            'payout_day' => 28,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
