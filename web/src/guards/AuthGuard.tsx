import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

/* ═══════════════════════════════════════════════════════════════
 * Role → Home Route mapping (single source of truth)
 * ═══════════════════════════════════════════════════════════════ */
const PLATFORM_ROLES = ['super_admin', 'platform_staff', 'platform_finance'];

function getHomeRoute(role: string | undefined): string {
    if (!role) return '/login';
    if (PLATFORM_ROLES.includes(role)) return '/admin';
    if (role === 'company_admin') return '/company';
    return '/employee';
}

/* ═══════════════════════════════════════════════════════════════
 * AuthGuard — Protects authenticated routes.
 * Also enforces role isolation: /admin only for platform team,
 * /company only for company_admin, /employee for employees.
 * ═══════════════════════════════════════════════════════════════ */
export function AuthGuard({ children, allowedRoles }: { children: ReactNode; allowedRoles?: string[] }) {
    const isAuthenticated = useAuthStore(s => s.isAuthenticated);
    const user = useAuthStore(s => s.user);
    const location = useLocation();

    if (!isAuthenticated) return <Navigate to="/login" replace />;

    const homeRoute = getHomeRoute(user?.role);

    // If allowedRoles specified, enforce role-based access
    if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
        return <Navigate to={homeRoute} replace />;
    }

    // If no allowedRoles specified (fallback route), redirect to correct portal
    if (!allowedRoles && location.pathname !== homeRoute) {
        return <Navigate to={homeRoute} replace />;
    }

    return <>{children}</>;
}

/* ═══════════════════════════════════════════════════════════════
 * GuestGuard — Protects guest-only pages (login, pin).
 * If already logged in, redirect to correct portal.
 * ═══════════════════════════════════════════════════════════════ */
export function GuestGuard({ children }: { children: ReactNode }) {
    const isAuthenticated = useAuthStore(s => s.isAuthenticated);
    const user = useAuthStore(s => s.user);
    if (isAuthenticated) return <Navigate to={getHomeRoute(user?.role)} replace />;
    return <>{children}</>;
}

/* Export for use in LoginPage */
export { getHomeRoute, PLATFORM_ROLES };
