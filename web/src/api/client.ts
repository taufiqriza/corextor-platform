import axios from 'axios';
import { getLoginDestination, inferLoginRoleFromPath } from '@/lib/appSurface';
import { getAccessToken, getCurrentRole, invalidateSession } from '@/lib/authSession';

declare module 'axios' {
    export interface AxiosRequestConfig {
        skipAuthRedirect?: boolean;
    }
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
    baseURL: API_BASE,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

// Attach token to every request
api.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const shouldSkipRedirect = Boolean(error.config?.skipAuthRedirect);

        if (error.response?.status === 401 && !shouldSkipRedirect) {
            const role = getCurrentRole() ?? inferLoginRoleFromPath(window.location.pathname);
            invalidateSession();
            window.location.replace(getLoginDestination(role));
        }
        return Promise.reject(error);
    },
);
