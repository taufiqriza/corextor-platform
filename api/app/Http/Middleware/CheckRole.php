<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Support\ApiResponse;

class CheckRole
{
    /**
     * Check that the authenticated user has the required role.
     *
     * Usage in routes: ->middleware('role:super_admin')
     *                  ->middleware('role:company_admin,super_admin')
     */
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        $userRole = $request->attributes->get('auth_role');

        if (! in_array($userRole, $roles)) {
            return ApiResponse::forbidden('Insufficient permissions');
        }

        return $next($request);
    }
}
