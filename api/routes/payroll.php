<?php

use App\Modules\Payroll\Http\Controllers\PayrollRunController;
use App\Modules\Payroll\Http\Controllers\PayrollSetupController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Payroll Product API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('payroll/v1')->group(function () {
    Route::middleware(['jwt.auth', 'product.entitled:payroll', 'throttle:api-general'])->group(function () {
        Route::middleware('role:company_admin,super_admin,platform_staff')->group(function () {
            Route::get('/dashboard', [PayrollSetupController::class, 'dashboard']);

            Route::get('/directory', [PayrollSetupController::class, 'directory']);

            Route::get('/schedules', [PayrollSetupController::class, 'schedules']);
            Route::post('/schedules', [PayrollSetupController::class, 'storeSchedule']);
            Route::put('/schedules/{id}', [PayrollSetupController::class, 'updateSchedule']);

            Route::get('/components', [PayrollSetupController::class, 'components']);
            Route::post('/components', [PayrollSetupController::class, 'storeComponent']);
            Route::put('/components/{id}', [PayrollSetupController::class, 'updateComponent']);

            Route::get('/profiles', [PayrollSetupController::class, 'profiles']);
            Route::post('/profiles', [PayrollSetupController::class, 'storeProfile']);
            Route::put('/profiles/{id}', [PayrollSetupController::class, 'updateProfile']);

            Route::get('/runs', [PayrollRunController::class, 'index']);
            Route::post('/runs', [PayrollRunController::class, 'store']);
            Route::get('/runs/{id}', [PayrollRunController::class, 'show']);
            Route::post('/runs/{id}/finalize', [PayrollRunController::class, 'finalize']);
        });
    });
});
