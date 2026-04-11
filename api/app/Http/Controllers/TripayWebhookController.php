<?php

namespace App\Http\Controllers;

use App\Modules\Platform\Billing\TripayWebhookService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TripayWebhookController extends Controller
{
    public function __construct(
        private TripayWebhookService $tripayWebhookService,
    ) {}

    public function paymentStatus(Request $request): JsonResponse
    {
        $result = $this->tripayWebhookService->handle($request);

        if (($result['success'] ?? false) === true) {
            return response()->json(['success' => true], $result['status'] ?? 200);
        }

        return response()->json([
            'success' => false,
            'message' => $result['message'] ?? 'Tripay callback failed.',
        ], $result['status'] ?? 500);
    }
}
