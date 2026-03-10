<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;

class ApiResponse
{
    /**
     * Return a success response.
     */
    public static function success(
        mixed $data = null,
        string $message = 'OK',
        int $code = 200,
    ): JsonResponse {
        $payload = [
            'status' => 'success',
            'message' => $message,
        ];

        if ($data !== null) {
            $payload['data'] = $data;
        }

        $payload['meta'] = [
            'timestamp' => now()->toIso8601String(),
        ];

        return response()->json($payload, $code);
    }

    /**
     * Return a created response.
     */
    public static function created(
        mixed $data = null,
        string $message = 'Created',
    ): JsonResponse {
        return static::success($data, $message, 201);
    }

    /**
     * Return an error response.
     */
    public static function error(
        string $message = 'Error',
        int $code = 400,
        array $errors = [],
    ): JsonResponse {
        $payload = [
            'status' => 'error',
            'message' => $message,
        ];

        if (! empty($errors)) {
            $payload['errors'] = $errors;
        }

        $payload['meta'] = [
            'timestamp' => now()->toIso8601String(),
        ];

        return response()->json($payload, $code);
    }

    /**
     * Return a 404 not found response.
     */
    public static function notFound(string $message = 'Not Found'): JsonResponse
    {
        return static::error($message, 404);
    }

    /**
     * Return a 401 unauthenticated response.
     */
    public static function unauthenticated(string $message = 'Unauthenticated'): JsonResponse
    {
        return static::error($message, 401);
    }

    /**
     * Return a 403 forbidden response.
     */
    public static function forbidden(string $message = 'Forbidden'): JsonResponse
    {
        return static::error($message, 403);
    }

    /**
     * Return a 422 validation error response.
     */
    public static function validationError(array $errors, string $message = 'Validation failed'): JsonResponse
    {
        return static::error($message, 422, $errors);
    }

    /**
     * Return a 429 rate limited response.
     */
    public static function rateLimited(string $message = 'Too many requests'): JsonResponse
    {
        return static::error($message, 429);
    }

    /**
     * Return a 400 bad request response.
     */
    public static function badRequest(string $message = 'Bad Request'): JsonResponse
    {
        return static::error($message, 400);
    }

    /**
     * Return a 409 conflict response.
     */
    public static function conflict(string $message = 'Conflict'): JsonResponse
    {
        return static::error($message, 409);
    }
}
