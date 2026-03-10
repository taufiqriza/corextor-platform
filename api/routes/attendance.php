<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Attendance\Http\Controllers\AttendancePinAuthController;
use App\Modules\Attendance\Http\Controllers\BranchController;
use App\Modules\Attendance\Http\Controllers\AttendanceUserController;

/*
|--------------------------------------------------------------------------
| Attendance Product API Routes
|--------------------------------------------------------------------------
|
| Routes under /attendance/v1 namespace.
| All authenticated routes require:
| 1. JWT auth (jwt.auth)
| 2. Active attendance subscription (attendance.entitled)
|
*/

Route::prefix('attendance/v1')->group(function () {

    // ── PIN Login (public — no JWT needed) ──
    Route::post('/auth/login/pin', [AttendancePinAuthController::class, 'loginPin']);

    // ── Authenticated + Entitled routes ──
    Route::middleware(['jwt.auth', 'attendance.entitled'])->group(function () {

        // ── Branches (company_admin) ──
        Route::middleware('role:company_admin,super_admin')->group(function () {
            Route::get('/branches', [BranchController::class, 'index']);
            Route::post('/branches', [BranchController::class, 'store']);
            Route::get('/branches/{id}', [BranchController::class, 'show']);
            Route::put('/branches/{id}', [BranchController::class, 'update']);
            Route::delete('/branches/{id}', [BranchController::class, 'destroy']);
        });

        // ── Attendance Users (company_admin) ──
        Route::middleware('role:company_admin,super_admin')->group(function () {
            Route::get('/users', [AttendanceUserController::class, 'index']);
            Route::post('/users', [AttendanceUserController::class, 'store']);
            Route::get('/users/{id}', [AttendanceUserController::class, 'show']);
            Route::put('/users/{id}', [AttendanceUserController::class, 'update']);
            Route::delete('/users/{id}', [AttendanceUserController::class, 'destroy']);
            Route::post('/users/{id}/reset-pin', [AttendanceUserController::class, 'resetPin']);
        });

        // ── Attendance Records (Sprint 5) ──
        // Route::post('/attendance/check-in', ...);
        // Route::post('/attendance/check-out', ...);
        // Route::get('/attendance/history', ...);
        // Route::get('/attendance/report', ...);
        // Route::put('/attendance/{id}/correct', ...);
    });
});
