<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Http\Request;
use App\Exceptions\Handler as AppExceptionHandler;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            Route::prefix('api')
                ->middleware('api')
                ->group(base_path('routes/platform.php'));

            Route::prefix('api')
                ->middleware('api')
                ->group(base_path('routes/attendance.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'jwt.auth' => \App\Http\Middleware\JwtAuth::class,
            'role' => \App\Http\Middleware\CheckRole::class,
            'attendance.entitled' => \App\Http\Middleware\AttendanceEntitlement::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        AppExceptionHandler::register($exceptions);
    })
    ->booted(function () {
        // Rate limiters for auth endpoints
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        RateLimiter::for('pin-login', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip() . ':' . $request->input('company_id'));
        });

        RateLimiter::for('api-general', function (Request $request) {
            return Limit::perMinute(60)->by($request->bearerToken() ?: $request->ip());
        });
    })
    ->create();

