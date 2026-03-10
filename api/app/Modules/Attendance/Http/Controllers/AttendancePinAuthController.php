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
     */
    public function loginPin(Request $request): JsonResponse
    {
        $request->validate([
            'company_id' => 'required|integer',
            'pin' => 'required|string|min:4|max:8',
        ]);

        $result = PinService::loginWithPin(
            companyId: $request->input('company_id'),
            pin: $request->input('pin'),
            request: $request,
        );

        if (! $result) {
            return ApiResponse::unauthenticated('Invalid PIN or access denied');
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
