export const PLATFORM_ROLES = ['super_admin', 'platform_staff', 'platform_finance'] as const;

const EMPLOYEE_APP_ORIGIN = (import.meta.env.VITE_EMPLOYEE_APP_ORIGIN as string | undefined)?.replace(/\/+$/, '') ?? '';
const MAIN_APP_ORIGIN = (import.meta.env.VITE_MAIN_APP_ORIGIN as string | undefined)?.replace(/\/+$/, '') ?? '';

type Surface = 'main' | 'employee';

export function getHomeRoute(role: string | undefined): string {
    if (!role) return '/login';
    if (PLATFORM_ROLES.includes(role as (typeof PLATFORM_ROLES)[number])) return '/admin';
    if (role === 'company_admin') return '/company';
    return '/employee';
}

export function getLoginDestination(role?: string): string {
    if (role === 'employee') {
        return buildSurfaceUrl('employee', '/pin');
    }

    return buildSurfaceUrl('main', '/login');
}

export function getHomeDestination(role?: string): string {
    const path = getHomeRoute(role);

    if (role === 'employee') {
        return buildSurfaceUrl('employee', path);
    }

    return buildSurfaceUrl('main', path);
}

export function inferLoginRoleFromPath(pathname: string): string | undefined {
    if (pathname.startsWith('/employee') || pathname.startsWith('/pin')) {
        return 'employee';
    }

    return undefined;
}

export function isEmployeeSurface(): boolean {
    if (typeof window === 'undefined') return false;

    const employeeOrigin = getEmployeeAppOrigin();
    if (!employeeOrigin) return false;

    return window.location.origin === employeeOrigin || window.location.hostname.startsWith('app.');
}

export function hasDedicatedEmployeeSurface(): boolean {
    if (typeof window === 'undefined') return false;

    const employeeOrigin = getEmployeeAppOrigin();
    return Boolean(employeeOrigin && employeeOrigin !== window.location.origin);
}

export function isExternalUrl(url: string): boolean {
    return /^https?:\/\//i.test(url);
}

export function navigateToResolvedUrl(
    url: string,
    navigate?: (to: string, options?: { replace?: boolean }) => void,
    replace = true,
) {
    if (typeof window !== 'undefined' && isExternalUrl(url)) {
        if (replace) {
            window.location.replace(url);
        } else {
            window.location.assign(url);
        }
        return;
    }

    navigate?.(url, { replace });
}

function buildSurfaceUrl(surface: Surface, path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const origin = surface === 'employee' ? getEmployeeAppOrigin() : getMainAppOrigin();

    if (!origin) {
        return normalizedPath;
    }

    return `${origin}${normalizedPath}`;
}

function getEmployeeAppOrigin(): string | null {
    if (EMPLOYEE_APP_ORIGIN) return EMPLOYEE_APP_ORIGIN;
    if (typeof window === 'undefined') return null;

    const { origin, protocol, hostname } = window.location;
    if (isLocalHostname(hostname)) return null;
    if (hostname.startsWith('app.')) return origin;

    const baseHost = getBaseHost(hostname);
    return `${protocol}//app.${baseHost}`;
}

function getMainAppOrigin(): string | null {
    if (MAIN_APP_ORIGIN) return MAIN_APP_ORIGIN;
    if (typeof window === 'undefined') return null;

    const { origin, protocol, hostname } = window.location;
    if (isLocalHostname(hostname)) return null;
    if (!hostname.startsWith('app.')) return origin;

    return `${protocol}//${getBaseHost(hostname)}`;
}

function isLocalHostname(hostname: string): boolean {
    return hostname === 'localhost'
        || hostname === '127.0.0.1'
        || hostname === '[::1]'
        || hostname.endsWith('.localhost');
}

function getBaseHost(hostname: string): string {
    const cleanHostname = hostname.replace(/^www\./, '').replace(/^app\./, '');
    const parts = cleanHostname.split('.');

    if (parts.length <= 2) {
        return cleanHostname;
    }

    return parts.slice(-2).join('.');
}
