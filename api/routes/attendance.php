<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Attendance\Http\Controllers\AttendancePinAuthController;
use App\Modules\Attendance\Http\Controllers\BranchController;
use App\Modules\Attendance\Http\Controllers\AttendanceUserController;
use App\Modules\Attendance\Http\Controllers\AttendanceRecordController;
use App\Modules\Attendance\Http\Controllers\EmployeeReportController;

/*
|--------------------------------------------------------------------------
| Attendance Product API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('attendance/v1')->group(function () {

    // ── PIN Login (public + rate limited) ──
    Route::middleware('throttle:pin-login')->group(function () {
        Route::post('/auth/login/pin', [AttendancePinAuthController::class, 'loginPin']);
    });

    // ── Authenticated + Entitled routes (rate limited) ──
    Route::middleware(['jwt.auth', 'product.entitled:attendance', 'throttle:api-general'])->group(function () {

        // ── Branches (admin only) ──
        Route::middleware('role:company_admin,super_admin,platform_staff')->group(function () {
            Route::get('/branches', [BranchController::class, 'index']);
            Route::post('/branches', [BranchController::class, 'store']);
            Route::get('/branches/{id}', [BranchController::class, 'show']);
            Route::put('/branches/{id}', [BranchController::class, 'update']);
            Route::delete('/branches/{id}', [BranchController::class, 'destroy']);
        });

        // ── Attendance Users (admin only) ──
        Route::middleware('role:company_admin,super_admin,platform_staff')->group(function () {
            Route::get('/users', [AttendanceUserController::class, 'index']);
            Route::post('/users', [AttendanceUserController::class, 'store']);
            Route::get('/users/{id}', [AttendanceUserController::class, 'show']);
            Route::put('/users/{id}', [AttendanceUserController::class, 'update']);
            Route::delete('/users/{id}', [AttendanceUserController::class, 'destroy']);
            Route::post('/users/{id}/reset-pin', [AttendanceUserController::class, 'resetPin']);
        });

        // ── Attendance Records (all authenticated users) ──
        Route::get('/attendance/context', [AttendanceRecordController::class, 'context']);
        Route::post('/attendance/check-in', [AttendanceRecordController::class, 'checkIn']);
        Route::post('/attendance/check-out', [AttendanceRecordController::class, 'checkOut']);
        Route::get('/attendance/{id}/selfie/{moment}', [AttendanceRecordController::class, 'selfie'])
            ->whereNumber('id')
            ->whereIn('moment', ['check_in', 'check_out']);
        Route::get('/attendance/history', [AttendanceRecordController::class, 'history']);
        Route::post('/attendance/profile/change-pin', [AttendanceUserController::class, 'changeMyPin']);
        Route::get('/reports', [EmployeeReportController::class, 'myReports']);
        Route::post('/reports', [EmployeeReportController::class, 'store']);
        Route::get('/reports/{reportId}/attachments/{attachmentIndex}', [EmployeeReportController::class, 'downloadAttachment'])
            ->whereNumber('reportId')
            ->whereNumber('attachmentIndex');

        // ── Admin Reports & Corrections ──
        Route::middleware('role:company_admin,super_admin,platform_staff')->group(function () {
            Route::get('/attendance/report', [AttendanceRecordController::class, 'report']);
            Route::put('/attendance/{id}/correct', [AttendanceRecordController::class, 'correct']);
            Route::get('/attendance/logs', [AttendanceRecordController::class, 'logs']);
            Route::get('/reports/company', [EmployeeReportController::class, 'companyReports']);
        });
    });
});
