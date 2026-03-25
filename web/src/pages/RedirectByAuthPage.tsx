import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { getHomeDestination, getLoginDestination, isEmployeeSurface, isExternalUrl } from '@/lib/appSurface';

export function RedirectByAuthPage() {
    const isAuthenticated = useAuthStore(s => s.isAuthenticated);
    const user = useAuthStore(s => s.user);
    const isInitializing = useAuthStore(s => s.isInitializing);
    const hasInitialized = useAuthStore(s => s.hasInitialized);

    if (!hasInitialized || isInitializing) {
        return null;
    }

    if (isAuthenticated) {
        return redirectTo(getHomeDestination(user?.role));
    }

    return redirectTo(isEmployeeSurface() ? getLoginDestination('employee') : '/');
}

function redirectTo(target: string) {
    if (isExternalUrl(target)) {
        return <ExternalRedirect to={target} />;
    }

    return <Navigate to={target} replace />;
}

function ExternalRedirect({ to }: { to: string }) {
    useEffect(() => {
        window.location.replace(to);
    }, [to]);

    return null;
}
