<?php

namespace App\Modules\Attendance\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Attendance\Services\PinService;
use App\Modules\Platform\Session\SessionService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendancePinAuthController extends Controller
{
    /**
     * POST /attendance/v1/auth/login/pin
     *
     * PIN login for attendance employees.
     * Supports two modes:
     * 1. PIN-only (auto-detect company) — just send { pin }
     * 2. PIN + company_id — send { company_id, pin }
     */
    public function loginPin(Request $request): JsonResponse
    {
        $request->validate([
            'company_id' => 'nullable|integer',
            'pin' => 'required|string|min:4|max:8',
        ]);

        $companyId = $request->input('company_id');
        $pin = $request->input('pin');

        // If company_id provided, use scoped lookup; otherwise auto-detect
        if ($companyId) {
            $result = PinService::loginWithPin(
                companyId: (int) $companyId,
                pin: $pin,
                request: $request,
            );
        } else {
            $result = PinService::loginWithPinOnly(
                pin: $pin,
                request: $request,
            );
        }

        if (! $result) {
            return ApiResponse::unauthenticated('PIN tidak valid atau akses ditolak');
        }

        $cookie = SessionService::makeRefreshCookie($result['refresh_token']);

        return ApiResponse::success(
            data: [
                'token' => $result['token_data']['token'],
                'token_type' => $result['token_data']['token_type'],
                'expires_in' => $result['token_data']['expires_in'],
                'user' => $result['user'],
            ],
            message: 'PIN login successful',
        )->cookie($cookie);
    }
}
