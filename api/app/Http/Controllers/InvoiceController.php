<?php

namespace App\Http\Controllers;

use App\Modules\Platform\Billing\InvoiceService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    /**
     * GET /platform/v1/invoices (super admin — with filters)
     */
    public function index(Request $request): JsonResponse
    {
        $invoices = InvoiceService::list(
            companyId: $request->query('company_id'),
            status: $request->query('status'),
        );

        return ApiResponse::success($invoices);
    }

    /**
     * GET /platform/v1/company/invoices (company admin self-service)
     */
    public function myInvoices(Request $request): JsonResponse
    {
        $companyId = $request->attributes->get('auth_company_id');
        $invoices = InvoiceService::listByCompany($companyId);
        return ApiResponse::success($invoices);
    }
}
