import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

/**
 * Role-aware redirect for authenticated users.
 * super_admin / company_admin → /admin
 * employee → /employee
 */
function getHomeRoute(role: string | undefined): string {
    if (role === 'super_admin' || role === 'company_admin') return '/admin';
    return '/employee';
}

/**
 * Protects routes that require authentication.
 * Redirects to /login if not authenticated.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
    const isAuthenticated = useAuthStore(s => s.isAuthenticated);
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return <>{children}</>;
}

/**
 * Protects guest-only pages (login, pin).
 * Redirects to the correct home route based on user role.
 */
export function GuestGuard({ children }: { children: ReactNode }) {
    const isAuthenticated = useAuthStore(s => s.isAuthenticated);
    const user = useAuthStore(s => s.user);
    if (isAuthenticated) return <Navigate to={getHomeRoute(user?.role)} replace />;
    return <>{children}</>;
}
