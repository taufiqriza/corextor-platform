<?php

namespace App\Http\Controllers;

use App\Modules\Platform\Team\TeamService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeamController extends Controller
{
    /**
     * GET /platform/v1/team
     * List all internal team members + stats.
     */
    public function index(): JsonResponse
    {
        $team = TeamService::list();
        $stats = TeamService::stats();

        return ApiResponse::success([
            'stats'   => $stats,
            'members' => $team->map(fn ($user) => [
                'id'            => $user->id,
                'name'          => $user->name,
                'email'         => $user->email,
                'platform_role' => $user->platform_role,
                'status'        => $user->status,
                'created_at'    => $user->created_at?->toISOString(),
            ]),
        ]);
    }

    /**
     * POST /platform/v1/team/invite
     * Invite a new internal team member.
     */
    public function invite(Request $request): JsonResponse
    {
        $request->validate([
            'name'          => 'required|string|max:255',
            'email'         => 'required|email|max:255',
            'platform_role' => 'required|string|in:platform_staff,platform_finance',
        ]);

        try {
            $result = TeamService::inviteWithMeta($request->only(['name', 'email', 'platform_role']));
            $user = $result['user'];

            return ApiResponse::created([
                'id'            => $user->id,
                'name'          => $user->name,
                'email'         => $user->email,
                'platform_role' => $user->platform_role,
                'status'        => $user->status,
                'credentials'   => [
                    'email' => $user->email,
                    'temporary_password' => $result['temporary_password'],
                ],
            ]);
        } catch (\RuntimeException $e) {
            return ApiResponse::conflict($e->getMessage());
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::badRequest($e->getMessage());
        }
    }

    /**
     * PUT /platform/v1/team/{userId}
     * Update team member role or status.
     */
    public function update(Request $request, int $userId): JsonResponse
    {
        $request->validate([
            'platform_role' => 'sometimes|string|in:platform_staff,platform_finance',
            'status'        => 'sometimes|string|in:active,suspended',
            'name'          => 'sometimes|string|max:255',
        ]);

        try {
            $user = TeamService::update($userId, $request->only(['platform_role', 'status', 'name']));

            return ApiResponse::success([
                'id'            => $user->id,
                'name'          => $user->name,
                'email'         => $user->email,
                'platform_role' => $user->platform_role,
                'status'        => $user->status,
            ]);
        } catch (\RuntimeException $e) {
            return ApiResponse::forbidden($e->getMessage());
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::badRequest($e->getMessage());
        }
    }

    /**
     * DELETE /platform/v1/team/{userId}
     * Remove a team member (downgrade to standard).
     */
    public function destroy(int $userId): JsonResponse
    {
        try {
            TeamService::remove($userId);
            return ApiResponse::success(null, 'Team member removed.');
        } catch (\RuntimeException $e) {
            return ApiResponse::forbidden($e->getMessage());
        }
    }
}
