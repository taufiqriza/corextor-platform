<?php

namespace App\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Support\Facades\DB;

class HealthController extends Controller
{
    /**
     * Platform health check.
     *
     * Verifies that core database connections are reachable.
     */
    public function index()
    {
        $checks = [];
        $criticalChecks = ['platform_db'];

        // Check platform DB
        try {
            DB::connection('platform')->getPdo();
            $checks['platform_db'] = 'ok';
        } catch (\Throwable $e) {
            $checks['platform_db'] = 'unreachable';
        }

        // Check attendance DB
        try {
            DB::connection('attendance')->getPdo();
            $checks['attendance_db'] = 'ok';
        } catch (\Throwable $e) {
            $checks['attendance_db'] = 'unreachable';
        }

        // Check payroll DB
        try {
            DB::connection('payroll')->getPdo();
            $checks['payroll_db'] = 'ok';
        } catch (\Throwable $e) {
            $checks['payroll_db'] = 'unreachable';
        }

        $criticalHealthy = collect($criticalChecks)->every(
            fn (string $checkName) => ($checks[$checkName] ?? 'unreachable') === 'ok',
        );
        $allHealthy = ! in_array('unreachable', $checks, true);
        $status = ! $criticalHealthy
            ? 'unhealthy'
            : ($allHealthy ? 'healthy' : 'degraded');

        return ApiResponse::success(
            data: [
                'service' => 'corextor-api',
                'version' => '1.0.0',
                'status' => $status,
                'critical' => [
                    'status' => $criticalHealthy ? 'ok' : 'failed',
                    'checks' => $criticalChecks,
                ],
                'checks' => $checks,
            ],
            message: $status === 'healthy'
                ? 'All systems operational'
                : ($status === 'degraded' ? 'Core service healthy, optional modules degraded' : 'Critical services unavailable'),
            code: $criticalHealthy ? 200 : 503,
        );
    }
}
