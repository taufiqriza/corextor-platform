<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class AttendanceFlowTest extends TestCase
{
    use DatabaseTransactions;

    protected $connectionsToTransact = ['platform', 'attendance'];

    private int $companyId = 0;
    private int $adminUserId = 0;
    private int $employeeUserId = 0;
    private int $branchId = 0;
    private int $employeeAttendanceUserId = 0;
    private string $adminEmail = '';
    private string $employeeEmail = '';
    private string $adminPin = '';
    private string $employeePin = '';

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        $this->seedFullData();
    }

    #[Test]
    public function pin_login_returns_token_with_attendance_data(): void
    {
        $response = $this->postJson('/api/attendance/v1/auth/login/pin', [
            'pin' => $this->employeePin,
        ]);

        $response->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.user.role', 'employee')
            ->assertJsonPath('data.user.attendance_user_id', $this->employeeAttendanceUserId)
            ->assertJsonPath('data.user.branch_id', $this->branchId);
    }

    #[Test]
    public function pin_login_fails_with_wrong_pin(): void
    {
        $response = $this->postJson('/api/attendance/v1/auth/login/pin', [
            'pin' => '999999',
        ]);

        $response->assertStatus(401);
    }

    #[Test]
    public function check_in_creates_record(): void
    {
        $token = $this->pinLoginAndGetToken();

        $response = $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->post('/api/attendance/v1/attendance/check-in', $this->attendancePayload('office'));

        $response->assertStatus(201)
            ->assertJsonPath('data.status', 'present')
            ->assertJsonPath('data.date', now()->toDateString())
            ->assertJsonPath('data.attendance_mode_in', 'office')
            ->assertJsonPath('data.check_in_location.latitude', -6.2001);
    }

    #[Test]
    public function duplicate_check_in_blocked(): void
    {
        $token = $this->pinLoginAndGetToken();

        $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->post('/api/attendance/v1/attendance/check-in', $this->attendancePayload('office'));

        $response = $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->post('/api/attendance/v1/attendance/check-in', $this->attendancePayload('office'));

        $response->assertStatus(409)
            ->assertJsonPath('message', 'Already checked in today');
    }

    #[Test]
    public function check_out_without_check_in_blocked(): void
    {
        $token = $this->pinLoginAndGetToken();

        $response = $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->post('/api/attendance/v1/attendance/check-out', $this->attendancePayload());

        $response->assertStatus(409);
    }

    #[Test]
    public function full_check_in_out_flow(): void
    {
        $token = $this->pinLoginAndGetToken();

        $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->post('/api/attendance/v1/attendance/check-in', $this->attendancePayload('field'))
            ->assertStatus(201);

        $response = $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->post('/api/attendance/v1/attendance/check-out', $this->attendancePayload(null, -6.2451, 106.8551, 18.5, 'checkout.jpg'));

        $response->assertOk()
            ->assertJsonPath('data.status', 'present')
            ->assertJsonPath('data.attendance_mode_in', 'field')
            ->assertJsonPath('data.check_out_location.latitude', -6.2451);

        $this->assertNotNull($response->json('data.time_in'));
        $this->assertNotNull($response->json('data.time_out'));
    }

    #[Test]
    public function employee_can_access_own_attendance_selfie_and_admin_report_contains_location_evidence(): void
    {
        $employeeToken = $this->pinLoginAndGetToken();

        $checkInResponse = $this
            ->withHeader('Authorization', "Bearer {$employeeToken}")
            ->post('/api/attendance/v1/attendance/check-in', $this->attendancePayload('office'));

        $checkInResponse->assertCreated();

        $recordId = (int) $checkInResponse->json('data.id');

        $selfieResponse = $this->get("/api/attendance/v1/attendance/{$recordId}/selfie/check_in", [
            'Authorization' => "Bearer {$employeeToken}",
        ]);

        $selfieResponse->assertOk();

        $adminToken = $this->emailLoginAndGetToken($this->adminEmail);

        $reportResponse = $this->getJson('/api/attendance/v1/attendance/report', [
            'Authorization' => "Bearer {$adminToken}",
        ]);

        $reportResponse->assertOk()
            ->assertJsonPath('data.pagination.data.0.attendance_mode_in', 'office')
            ->assertJsonPath('data.pagination.data.0.check_in_location.selfie_available', true)
            ->assertJsonPath('data.pagination.data.0.check_in_location.latitude', -6.2001);
    }

    #[Test]
    public function employee_cannot_access_admin_branches(): void
    {
        $token = $this->pinLoginAndGetToken();

        $response = $this->getJson('/api/attendance/v1/branches', [
            'Authorization' => "Bearer {$token}",
        ]);

        $response->assertStatus(403);
    }

    #[Test]
    public function admin_can_view_attendance_report_with_default_pagination_15(): void
    {
        $token = $this->emailLoginAndGetToken($this->adminEmail);

        $response = $this->getJson('/api/attendance/v1/attendance/report', [
            'Authorization' => "Bearer {$token}",
        ]);

        $response->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.pagination.per_page', 15);
    }

    #[Test]
    public function admin_can_filter_attendance_report_by_field_mode(): void
    {
        $employeeToken = $this->pinLoginAndGetToken();

        $this
            ->withHeader('Authorization', "Bearer {$employeeToken}")
            ->post('/api/attendance/v1/attendance/check-in', $this->attendancePayload('field'))
            ->assertCreated();

        $adminToken = $this->emailLoginAndGetToken($this->adminEmail);

        $response = $this->getJson('/api/attendance/v1/attendance/report?attendance_mode=field', [
            'Authorization' => "Bearer {$adminToken}",
        ]);

        $response->assertOk()
            ->assertJsonPath('data.stats.field', 1)
            ->assertJsonPath('data.stats.office', 0)
            ->assertJsonPath('data.pagination.data.0.attendance_mode_in', 'field');
    }

    #[Test]
    public function company_admin_can_create_attendance_user_by_email_and_receive_credentials(): void
    {
        $token = $this->emailLoginAndGetToken($this->adminEmail);
        $newEmployeeEmail = 'new.employee.' . strtolower(Str::random(6)) . '@demo.test';
        $newEmployeePin = $this->generateAvailablePin();

        $response = $this->postJson('/api/attendance/v1/users', [
            'email' => $newEmployeeEmail,
            'name' => 'New Employee',
            'role' => 'employee',
            'branch_id' => $this->branchId,
            'pin' => $newEmployeePin,
        ], [
            'Authorization' => "Bearer {$token}",
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.credentials.email', $newEmployeeEmail)
            ->assertJsonStructure([
                'data' => [
                    'attendance_user' => ['id', 'platform_user_id', 'company_id', 'branch_id', 'status'],
                    'credentials' => ['email', 'temporary_password'],
                ],
            ]);

        $temporaryPassword = (string) $response->json('data.credentials.temporary_password');
        $newPlatformUserId = (int) $response->json('data.attendance_user.platform_user_id');
        $newAttendanceUserId = (int) $response->json('data.attendance_user.id');

        $this->assertNotSame('', $temporaryPassword);
        $this->assertDatabaseHas('users', [
            'id' => $newPlatformUserId,
            'email' => $newEmployeeEmail,
            'status' => 'active',
        ], 'platform');
        $this->assertDatabaseHas('company_memberships', [
            'company_id' => $this->companyId,
            'user_id' => $newPlatformUserId,
            'role' => 'employee',
            'status' => 'active',
        ], 'platform');
        $this->assertDatabaseHas('attendance_users', [
            'id' => $newAttendanceUserId,
            'platform_user_id' => $newPlatformUserId,
            'company_id' => $this->companyId,
            'branch_id' => $this->branchId,
            'status' => 'active',
        ], 'attendance');

        $loginResponse = $this->postJson('/api/platform/v1/auth/login/email', [
            'email' => $newEmployeeEmail,
            'password' => $temporaryPassword,
        ]);

        $loginResponse->assertOk()
            ->assertJsonPath('data.user.email', $newEmployeeEmail);
    }

    #[Test]
    public function employee_can_submit_list_and_download_own_report_attachments(): void
    {
        Storage::fake('local');
        $token = $this->pinLoginAndGetToken();

        $createResponse = $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->post('/api/attendance/v1/reports', [
                'title' => 'Laporan Harian',
                'description' => 'Menyelesaikan validasi report dan pagination.',
                'attachments' => [
                    UploadedFile::fake()->image('daily.png'),
                ],
            ]);

        $createResponse->assertCreated()
            ->assertJsonPath('data.title', 'Laporan Harian')
            ->assertJsonPath('data.attachments.0.name', 'daily.png');

        $reportId = (int) $createResponse->json('data.id');
        $attachmentIndex = (int) $createResponse->json('data.attachments.0.download_index');

        $listResponse = $this->getJson('/api/attendance/v1/reports', [
            'Authorization' => "Bearer {$token}",
        ]);

        $listResponse->assertOk()
            ->assertJsonPath('data.pagination.per_page', 15)
            ->assertJsonPath('data.pagination.data.0.id', $reportId);

        $downloadResponse = $this->get("/api/attendance/v1/reports/{$reportId}/attachments/{$attachmentIndex}", [
            'Authorization' => "Bearer {$token}",
        ]);

        $downloadResponse->assertOk();
        $downloadResponse->assertDownload('daily.png');
    }

    private function pinLoginAndGetToken(): string
    {
        $response = $this->postJson('/api/attendance/v1/auth/login/pin', [
            'pin' => $this->employeePin,
        ]);

        return (string) $response->json('data.token');
    }

    private function emailLoginAndGetToken(string $email): string
    {
        $response = $this->postJson('/api/platform/v1/auth/login/email', [
            'email' => $email,
            'password' => 'password',
        ]);

        return (string) $response->json('data.token');
    }

    private function seedFullData(): void
    {
        $suffix = strtolower(Str::random(6));
        $companyCode = 'AT' . strtoupper(substr($suffix, 0, 4));
        $this->adminEmail = "admin.{$suffix}@demo.test";
        $this->employeeEmail = "employee.{$suffix}@demo.test";
        $this->adminPin = $this->generateAvailablePin();
        $this->employeePin = $this->generateAvailablePin();

        $this->companyId = (int) DB::connection('platform')->table('companies')->insertGetId([
            'name' => 'Attendance Demo ' . strtoupper($suffix),
            'code' => $companyCode,
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

        $this->employeeUserId = (int) DB::connection('platform')->table('users')->insertGetId([
            'name' => 'Employee One',
            'email' => $this->employeeEmail,
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

        $this->branchId = (int) DB::connection('attendance')->table('branches')->insertGetId([
            'company_id' => $this->companyId,
            'name' => 'Kantor Pusat',
            'location' => 'Jakarta',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $adminAttendanceUser = [
            'platform_user_id' => $this->adminUserId,
            'company_id' => $this->companyId,
            'branch_id' => $this->branchId,
            'pin_hash' => Hash::make($this->adminPin),
            'pin_lookup' => hash('sha256', "{$this->companyId}:{$this->adminPin}"),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ];

        $employeeAttendanceUser = [
            'platform_user_id' => $this->employeeUserId,
            'company_id' => $this->companyId,
            'branch_id' => $this->branchId,
            'pin_hash' => Hash::make($this->employeePin),
            'pin_lookup' => hash('sha256', "{$this->companyId}:{$this->employeePin}"),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ];

        if (Schema::connection('attendance')->hasColumn('attendance_users', 'global_pin_lookup')) {
            $adminAttendanceUser['global_pin_lookup'] = hash('sha256', 'global:' . $this->adminPin);
            $employeeAttendanceUser['global_pin_lookup'] = hash('sha256', 'global:' . $this->employeePin);
        }

        DB::connection('attendance')->table('attendance_users')->insert($adminAttendanceUser);
        $this->employeeAttendanceUserId = (int) DB::connection('attendance')->table('attendance_users')->insertGetId($employeeAttendanceUser);
    }

    private function attendancePayload(
        ?string $attendanceMode = null,
        float $latitude = -6.2001,
        float $longitude = 106.8167,
        float $accuracy = 12.4,
        string $filename = 'selfie.jpg',
    ): array {
        $payload = [
            'latitude' => $latitude,
            'longitude' => $longitude,
            'accuracy' => $accuracy,
            'selfie' => UploadedFile::fake()->image($filename),
        ];

        if ($attendanceMode !== null) {
            $payload['attendance_mode'] = $attendanceMode;
        }

        return $payload;
    }

    private function generateAvailablePin(): string
    {
        $companyId = $this->companyId ?: 0;

        do {
            $pin = (string) random_int(100000, 999999);
            $exists = Schema::connection('attendance')->hasColumn('attendance_users', 'global_pin_lookup')
                ? DB::connection('attendance')->table('attendance_users')->where('global_pin_lookup', hash('sha256', 'global:' . $pin))->exists()
                : DB::connection('attendance')->table('attendance_users')->where('pin_lookup', hash('sha256', "{$companyId}:{$pin}"))->exists();
        } while ($exists);

        return $pin;
    }
}
