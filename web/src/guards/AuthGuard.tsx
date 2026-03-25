import { useEffect, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
    PLATFORM_ROLES,
    getHomeDestination,
    getHomeRoute,
    getLoginDestination,
    inferLoginRoleFromPath,
    isExternalUrl,
} from '@/lib/appSurface';

/* ═══════════════════════════════════════════════════════════════
 * AuthGuard — Protects authenticated routes.
 * Also enforces role isolation: /admin only for platform team,
 * /company only for company_admin, /employee for employees.
 * ═══════════════════════════════════════════════════════════════ */
export function AuthGuard({ children, allowedRoles }: { children: ReactNode; allowedRoles?: string[] }) {
    const isAuthenticated = useAuthStore(s => s.isAuthenticated);
    const user = useAuthStore(s => s.user);
    const isInitializing = useAuthStore(s => s.isInitializing);
    const hasInitialized = useAuthStore(s => s.hasInitialized);
    const location = useLocation();

    if (!hasInitialized || isInitializing) {
        return <RouteBootSplash />;
    }

    if (!isAuthenticated) {
        const roleHint = allowedRoles?.includes('employee')
            ? 'employee'
            : inferLoginRoleFromPath(location.pathname);

        return renderRedirect(getLoginDestination(roleHint));
    }

    const homeRoute = getHomeRoute(user?.role);
    const homeDestination = getHomeDestination(user?.role);

    // If allowedRoles specified, enforce role-based access
    if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
        return renderRedirect(homeDestination);
    }

    // If no allowedRoles specified (fallback route), redirect to correct portal
    if (!allowedRoles && location.pathname !== homeRoute) {
        return renderRedirect(homeDestination);
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
    const isInitializing = useAuthStore(s => s.isInitializing);
    const hasInitialized = useAuthStore(s => s.hasInitialized);

    if (!hasInitialized || isInitializing) {
        return <RouteBootSplash />;
    }

    if (isAuthenticated) return renderRedirect(getHomeDestination(user?.role));
    return <>{children}</>;
}

/* Export for use in LoginPage */
export { getHomeRoute, PLATFORM_ROLES };

function renderRedirect(target: string) {
    if (isExternalUrl(target)) {
        return <CrossSurfaceRedirect to={target} />;
    }

    return <Navigate to={target} replace />;
}

function CrossSurfaceRedirect({ to }: { to: string }) {
    useEffect(() => {
        window.location.replace(to);
    }, [to]);

    return <RouteBootSplash />;
}

function RouteBootSplash() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(180deg, #F5F9FF 0%, #EEF4FF 100%)',
            color: '#0F172A',
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}>
            <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px 18px',
                borderRadius: 18,
                background: '#FFFFFF',
                border: '1px solid rgba(15,23,42,.08)',
                boxShadow: '0 16px 36px rgba(15,23,42,.08)',
                fontSize: 13,
                fontWeight: 800,
            }}>
                <span style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: '#2563EB',
                    boxShadow: '0 0 0 6px rgba(37,99,235,.12)',
                }} />
                Menyiapkan sesi...
            </div>
        </div>
    );
}
