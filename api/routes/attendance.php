<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Attendance Product API Routes
|--------------------------------------------------------------------------
|
| Routes under /attendance/v1 namespace.
| These handle attendance-specific business logic: branches, attendance
| users, PIN login, check-in/out, reports.
|
| All routes in this file will require:
| 1. Access token auth
| 2. Company membership validation
| 3. Active subscription check for product "attendance"
| 4. Attendance profile validation (when applicable)
|
*/

Route::prefix('attendance/v1')->group(function () {

    // ── Auth — PIN login (Sprint 4) ──
    // Route::post('/auth/login/pin', ...);

    // ── Branches (Sprint 4) ──
    // Route::apiResource('branches', ...);

    // ── Attendance Users (Sprint 4) ──
    // Route::apiResource('users', ...);
    // Route::post('/users/{id}/reset-pin', ...);

    // ── Attendance Records (Sprint 5) ──
    // Route::post('/attendance/check-in', ...);
    // Route::post('/attendance/check-out', ...);
    // Route::get('/attendance/history', ...);
    // Route::get('/attendance/report', ...);
    // Route::put('/attendance/{id}/correct', ...);

    // ── Logs (Sprint 5) ──
    // Route::get('/logs', ...);
});
