<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\TeamController;

/*
|--------------------------------------------------------------------------
| Platform API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('platform/v1')->group(function () {

    // ── Health ──
    Route::get('/health', [HealthController::class, 'index']);

    // ── Auth (public + rate limited) ──
    Route::middleware('throttle:login')->group(function () {
        Route::post('/auth/login/email', [AuthController::class, 'loginEmail']);
        Route::post('/auth/refresh', [AuthController::class, 'refresh']);
    });

    // ── Authenticated routes (rate limited) ──
    Route::middleware(['jwt.auth', 'throttle:api-general'])->group(function () {

        // Auth
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/me', [AuthController::class, 'updateMe']);
        Route::put('/me/password', [AuthController::class, 'changePassword']);

        // ── Super Admin only ──
        Route::middleware('role:super_admin')->group(function () {

            // Team Management (internal Corextor staff)
            Route::get('/team', [TeamController::class, 'index']);
            Route::post('/team/invite', [TeamController::class, 'invite']);
            Route::put('/team/{userId}', [TeamController::class, 'update']);
            Route::delete('/team/{userId}', [TeamController::class, 'destroy']);
        });

        // ── Platform Team (super_admin + platform_staff) ──
        Route::middleware('role:super_admin,platform_staff')->group(function () {

            // Companies
            Route::get('/companies', [CompanyController::class, 'index']);
            Route::post('/companies', [CompanyController::class, 'store']);
            Route::get('/companies/{id}', [CompanyController::class, 'show']);
            Route::put('/companies/{id}', [CompanyController::class, 'update']);
            Route::get('/companies/{id}/admins', [CompanyController::class, 'admins']);

            // Company Members (full CRUD)
            Route::get('/companies/{id}/members', [CompanyController::class, 'members']);
            Route::post('/companies/{id}/members', [CompanyController::class, 'addMember']);
            Route::put('/companies/{id}/members/{membershipId}', [CompanyController::class, 'updateMember']);
            Route::delete('/companies/{id}/members/{membershipId}', [CompanyController::class, 'removeMember']);

            // Company Subscriptions
            Route::get('/companies/{id}/subscriptions', [SubscriptionController::class, 'index']);
            Route::post('/companies/{id}/subscriptions', [SubscriptionController::class, 'store']);
            Route::put('/companies/{id}/subscriptions/{subscriptionId}', [SubscriptionController::class, 'update']);

            // Product Catalog
            Route::get('/products', [SubscriptionController::class, 'products']);
            Route::get('/products/overview', [SubscriptionController::class, 'productOverview']);
            Route::get('/plans', [SubscriptionController::class, 'plans']);
            Route::put('/plans/{planId}', [SubscriptionController::class, 'updatePlan']);
            Route::get('/bundles', [SubscriptionController::class, 'bundles']);
        });

        // ── Platform Team + Finance ──
        Route::middleware('role:super_admin,platform_staff,platform_finance')->group(function () {

            // Invoices (full CRUD)
            Route::get('/invoices', [InvoiceController::class, 'index']);
            Route::get('/invoices/{id}', [InvoiceController::class, 'show']);
            Route::post('/invoices', [InvoiceController::class, 'store']);
            Route::put('/invoices/{id}/pay', [InvoiceController::class, 'markAsPaid']);
            Route::put('/invoices/{id}/cancel', [InvoiceController::class, 'cancel']);
        });

        // ── Company Admin self-service ──
        Route::middleware('role:company_admin,super_admin,platform_staff')->group(function () {
            Route::get('/company/subscriptions', [SubscriptionController::class, 'mySubscriptions']);
            Route::get('/company/invoices', [InvoiceController::class, 'myInvoices']);

            // Company profile management
            Route::get('/company/profile', [CompanyController::class, 'myProfile']);
            Route::put('/company/profile', [CompanyController::class, 'updateMyProfile']);

            // Company members (self-service)
            Route::get('/company/members', [CompanyController::class, 'myMembers']);
            Route::put('/company/members/{membershipId}', [CompanyController::class, 'updateMyMember']);
        });
    });
});
