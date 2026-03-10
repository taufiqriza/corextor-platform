<?php

namespace App\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Support\Facades\DB;

class HealthController extends Controller
{
    /**
     * Platform health check.
     *
     * Verifies that both database connections are reachable.
     */
    public function index()
    {
        $checks = [];

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

        $allHealthy = ! in_array('unreachable', $checks);

        return ApiResponse::success(
            data: [
                'service' => 'corextor-api',
                'version' => '1.0.0',
                'status' => $allHealthy ? 'healthy' : 'degraded',
                'checks' => $checks,
            ],
            message: $allHealthy ? 'All systems operational' : 'Some systems are degraded',
            code: $allHealthy ? 200 : 503,
        );
    }
}
