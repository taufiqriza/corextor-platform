<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Attendance\Http\Controllers\AttendancePinAuthController;
use App\Modules\Attendance\Http\Controllers\BranchController;
use App\Modules\Attendance\Http\Controllers\AttendanceUserController;
use App\Modules\Attendance\Http\Controllers\AttendanceRecordController;

/*
|--------------------------------------------------------------------------
| Attendance Product API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('attendance/v1')->group(function () {

    // ── PIN Login (public) ──
    Route::post('/auth/login/pin', [AttendancePinAuthController::class, 'loginPin']);

    // ── Authenticated + Entitled routes ──
    Route::middleware(['jwt.auth', 'attendance.entitled'])->group(function () {

        // ── Branches (admin only) ──
        Route::middleware('role:company_admin,super_admin')->group(function () {
            Route::get('/branches', [BranchController::class, 'index']);
            Route::post('/branches', [BranchController::class, 'store']);
            Route::get('/branches/{id}', [BranchController::class, 'show']);
            Route::put('/branches/{id}', [BranchController::class, 'update']);
            Route::delete('/branches/{id}', [BranchController::class, 'destroy']);
        });

        // ── Attendance Users (admin only) ──
        Route::middleware('role:company_admin,super_admin')->group(function () {
            Route::get('/users', [AttendanceUserController::class, 'index']);
            Route::post('/users', [AttendanceUserController::class, 'store']);
            Route::get('/users/{id}', [AttendanceUserController::class, 'show']);
            Route::put('/users/{id}', [AttendanceUserController::class, 'update']);
            Route::delete('/users/{id}', [AttendanceUserController::class, 'destroy']);
            Route::post('/users/{id}/reset-pin', [AttendanceUserController::class, 'resetPin']);
        });

        // ── Attendance Records (all authenticated users) ──
        Route::post('/attendance/check-in', [AttendanceRecordController::class, 'checkIn']);
        Route::post('/attendance/check-out', [AttendanceRecordController::class, 'checkOut']);
        Route::get('/attendance/history', [AttendanceRecordController::class, 'history']);

        // ── Admin Reports & Corrections ──
        Route::middleware('role:company_admin,super_admin')->group(function () {
            Route::get('/attendance/report', [AttendanceRecordController::class, 'report']);
            Route::put('/attendance/{id}/correct', [AttendanceRecordController::class, 'correct']);
            Route::get('/attendance/logs', [AttendanceRecordController::class, 'logs']);
        });
    });
});
