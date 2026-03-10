<?php

namespace App\Modules\Platform\Audit;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

class AuditService
{
    /**
     * Record an audit event to the central audit_logs table.
     *
     * @param  string       $action        Short action name, e.g. "user.login", "attendance.check_in"
     * @param  array        $details       Arbitrary JSON-serializable details
     * @param  string|null  $productCode   Product code, e.g. "attendance", null for platform events
     * @param  int|null     $companyId     Company context, null for global events
     * @param  int|null     $userId        Acting user, defaults to authenticated user
     */
    public static function log(
        string $action,
        array $details = [],
        ?string $productCode = null,
        ?int $companyId = null,
        ?int $userId = null,
    ): void {
        $request = app(Request::class);

        DB::connection('platform')->table('audit_logs')->insert([
            'product_code' => $productCode,
            'company_id' => $companyId,
            'user_id' => $userId ?? Auth::id(),
            'action' => $action,
            'details_json' => json_encode($details),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);
    }

    /**
     * Log a platform-level event (no product context).
     */
    public static function platform(
        string $action,
        array $details = [],
        ?int $companyId = null,
    ): void {
        static::log($action, $details, null, $companyId);
    }

    /**
     * Log an attendance-level event.
     */
    public static function attendance(
        string $action,
        array $details = [],
        ?int $companyId = null,
    ): void {
        static::log($action, $details, 'attendance', $companyId);
    }

    /**
     * Log a cross-DB consistency failure event.
     */
    public static function consistencyFailure(
        string $description,
        array $details = [],
        ?int $companyId = null,
    ): void {
        static::log('system.consistency_failure', array_merge([
            'description' => $description,
        ], $details), null, $companyId);
    }
}
