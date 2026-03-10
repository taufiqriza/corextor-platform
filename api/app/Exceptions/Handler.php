<?php

namespace App\Exceptions;

use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\ThrottleRequestsException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use App\Support\ApiResponse;
use Throwable;

class Handler
{
    /**
     * Register exception handling callbacks.
     */
    public static function register(Exceptions $exceptions): void
    {
        $exceptions->render(function (AuthenticationException $e) {
            return ApiResponse::unauthenticated($e->getMessage() ?: 'Unauthenticated');
        });

        $exceptions->render(function (ValidationException $e) {
            return ApiResponse::validationError(
                $e->errors(),
                $e->getMessage(),
            );
        });

        $exceptions->render(function (ModelNotFoundException $e) {
            $model = class_basename($e->getModel());
            return ApiResponse::notFound("{$model} not found");
        });

        $exceptions->render(function (NotFoundHttpException $e) {
            return ApiResponse::notFound($e->getMessage() ?: 'Route not found');
        });

        $exceptions->render(function (ThrottleRequestsException $e) {
            return ApiResponse::rateLimited();
        });

        $exceptions->render(function (AccessDeniedHttpException $e) {
            return ApiResponse::forbidden($e->getMessage() ?: 'Forbidden');
        });

        // Catch-all for unexpected errors in production
        $exceptions->render(function (Throwable $e) {
            if (app()->environment('production')) {
                return ApiResponse::error('Internal server error', 500);
            }
            // In non-production, let Laravel's default handler show debug info
            return null;
        });
    }
}
