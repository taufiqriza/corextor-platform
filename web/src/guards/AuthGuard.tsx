import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export function AuthGuard({ children }: { children: ReactNode }) {
    const isAuthenticated = useAuthStore(s => s.isAuthenticated);
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return <>{children}</>;
}

export function GuestGuard({ children }: { children: ReactNode }) {
    const isAuthenticated = useAuthStore(s => s.isAuthenticated);
    if (isAuthenticated) return <Navigate to="/admin" replace />;
    return <>{children}</>;
}
