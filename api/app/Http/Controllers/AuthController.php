<?php

namespace App\Http\Controllers;

use App\Modules\Platform\Identity\AuthService;
use App\Modules\Platform\Session\SessionService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    /**
     * POST /platform/v1/auth/login/email
     *
     * Controller is thin: validate → call service → return response.
     */
    public function loginEmail(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        $result = AuthService::loginWithEmail(
            email: $request->input('email'),
            password: $request->input('password'),
            request: $request,
        );

        if (! $result) {
            return ApiResponse::unauthenticated('Invalid email or password');
        }

        // Set refresh cookie + return access token
        $cookie = SessionService::makeRefreshCookie($result['refresh_token']);

        return ApiResponse::success(
            data: [
                'token' => $result['token_data']['token'],
                'token_type' => $result['token_data']['token_type'],
                'expires_in' => $result['token_data']['expires_in'],
                'user' => $result['user'],
            ],
            message: 'Login successful',
        )->cookie($cookie);
    }

    /**
     * POST /platform/v1/auth/refresh
     *
     * Uses refresh cookie only — no body needed.
     */
    public function refresh(Request $request): JsonResponse
    {
        $rawToken = $request->cookie('corextor_refresh');

        if (! $rawToken) {
            return ApiResponse::unauthenticated('Refresh token not found');
        }

        $result = AuthService::refreshSession($rawToken, $request);

        if (! $result) {
            // Clear invalid cookie
            return ApiResponse::unauthenticated('Session expired or revoked')
                ->cookie(SessionService::forgetRefreshCookie());
        }

        return ApiResponse::success(
            data: $result,
            message: 'Token refreshed',
        );
    }

    /**
     * POST /platform/v1/auth/logout
     *
     * Global logout — revokes ALL sessions.
     */
    public function logout(Request $request): JsonResponse
    {
        $userId = $request->attributes->get('auth_user_id');

        AuthService::logout($userId);

        return ApiResponse::success(
            message: 'Logged out successfully',
        )->cookie(SessionService::forgetRefreshCookie());
    }

    /**
     * GET /platform/v1/me
     *
     * Returns current user profile + company context.
     */
    public function me(Request $request): JsonResponse
    {
        $userId = $request->attributes->get('auth_user_id');
        $companyId = $request->attributes->get('auth_company_id');

        $profile = AuthService::getCurrentUserProfile($userId, $companyId);

        if (! $profile) {
            return ApiResponse::notFound('User not found');
        }

        return ApiResponse::success(data: $profile);
    }
}
