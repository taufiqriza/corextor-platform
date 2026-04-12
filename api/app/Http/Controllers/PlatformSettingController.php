<?php

namespace App\Http\Controllers;

use App\Modules\Platform\Billing\TripayAdminSettingService;
use App\Modules\Platform\Setting\PlatformAdminSettingService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlatformSettingController extends Controller
{
    public function __construct(
        private PlatformAdminSettingService $platformAdminSettingService,
        private TripayAdminSettingService $tripayAdminSettingService,
    ) {}

    public function show(): JsonResponse
    {
        return ApiResponse::success($this->platformAdminSettingService->getPayload());
    }

    public function updateCompany(Request $request): JsonResponse
    {
        $request->validate([
            'company_name' => 'nullable|string|max:255',
            'company_email' => 'nullable|email|max:255',
            'company_phone' => 'nullable|string|max:50',
            'company_address' => 'nullable|string|max:500',
            'company_city' => 'nullable|string|max:120',
            'company_province' => 'nullable|string|max:120',
            'company_postal_code' => 'nullable|string|max:30',
            'company_country' => 'nullable|string|max:120',
            'company_website' => 'nullable|string|max:255',
            'support_whatsapp' => 'nullable|string|max:50',
            'support_email' => 'nullable|email|max:255',
            'platform_tagline' => 'nullable|string|max:255',
            'platform_summary' => 'nullable|string|max:500',
            'social_instagram' => 'nullable|string|max:255',
            'social_facebook' => 'nullable|string|max:255',
            'social_tiktok' => 'nullable|string|max:255',
            'social_youtube' => 'nullable|string|max:255',
            'social_linkedin' => 'nullable|string|max:255',
        ]);

        return ApiResponse::success(
            $this->platformAdminSettingService->updateCompany($request->all()),
            'Platform settings updated',
        );
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

        $this->tripayAdminSettingService->update($request->all());

        return ApiResponse::success(
            $this->platformAdminSettingService->getPayload(),
            'Tripay settings updated',
        );
    }

    public function testTripayConnection(): JsonResponse
    {
        return ApiResponse::success($this->tripayAdminSettingService->testConnection());
    }
}
