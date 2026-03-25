export function normalizePublicAssetUrl(value?: string | null): string | null {
    if (!value) return null;

    const trimmed = value.trim();
    if (!trimmed) return null;

    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }

    const apiOrigin = resolveApiOrigin();
    const normalizedPath = toPublicStoragePath(trimmed);

    if (!normalizedPath) {
        return trimmed;
    }

    return `${apiOrigin}${normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`}`;
}

function resolveApiOrigin(): string {
    const configuredApiUrl = import.meta.env.VITE_API_URL as string | undefined;

    if (configuredApiUrl) {
        try {
            return new URL(configuredApiUrl).origin;
        } catch {
            // Fall through to browser origin.
        }
    }

    if (typeof window !== 'undefined' && window.location?.origin) {
        return window.location.origin;
    }

    return '';
}

function toPublicStoragePath(value: string): string | null {
    if (value.startsWith('/storage/')) {
        return value;
    }

    if (value.startsWith('storage/')) {
        return `/${value}`;
    }

    if (value.startsWith('logos/') || value.startsWith('avatars/')) {
        return `/storage/${value}`;
    }

    return null;
}
