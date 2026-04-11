<?php

namespace App\Http\Controllers;

use App\Modules\Platform\Billing\TripayAdminSettingService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlatformSettingController extends Controller
{
    public function __construct(
        private TripayAdminSettingService $tripayAdminSettingService,
    ) {}

    public function show(): JsonResponse
    {
        return ApiResponse::success($this->tripayAdminSettingService->getPayload());
    }

    public function updateTripay(Request $request): JsonResponse
    {
        $request->validate([
            'mode' => 'sometimes|string|in:test,live',
            'base_url' => 'nullable|string|max:255',
            'merchant_code' => 'nullable|string|max:100',
            'api_key' => 'nullable|string|max:255',
            'private_key' => 'nullable|string|max:255',
            'clear_api_key' => 'sometimes|boolean',
            'clear_private_key' => 'sometimes|boolean',
            'webhook_url' => 'nullable|string|max:255',
            'bank_transfer_channel' => 'nullable|string|max:50',
            'ewallet_channel' => 'nullable|string|max:50',
        ]);

        return ApiResponse::success(
            $this->tripayAdminSettingService->update($request->all()),
            'Tripay settings updated',
        );
    }

    public function testTripayConnection(): JsonResponse
    {
        return ApiResponse::success($this->tripayAdminSettingService->testConnection());
    }
}
