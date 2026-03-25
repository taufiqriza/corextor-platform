import { create } from 'zustand';
import type { AuthUser, MePayload } from '@/types/auth.types';
import { platformApi } from '@/api/platform.api';

interface AuthState {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    setAuth: (user: AuthUser, token: string) => void;
    clearAuth: () => void;
    login: (email: string, password: string) => Promise<void>;
    loginWithPin: (pin: string) => Promise<void>;
    logout: () => Promise<void>;
    fetchMe: () => Promise<void>;
    initialize: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,

    setAuth: (user, token) => {
        const normalizedUser = normalizeAuthUser(user);
        localStorage.setItem('corextor_token', token);
        localStorage.setItem('corextor_user', JSON.stringify(normalizedUser));
        set({ user: normalizedUser, token, isAuthenticated: true });
    },

    clearAuth: () => {
        localStorage.removeItem('corextor_token');
        localStorage.removeItem('corextor_user');
        set({ user: null, token: null, isAuthenticated: false });
    },

    login: async (email, password) => {
        set({ isLoading: true });
        try {
            const res = await platformApi.login(email, password);
            get().setAuth(res.data.data.user, res.data.data.token);
        } finally {
            set({ isLoading: false });
        }
    },

    loginWithPin: async (pin: string) => {
        set({ isLoading: true });
        try {
            const res = await platformApi.loginWithPin(pin);
            get().setAuth(res.data.data.user, res.data.data.token);
        } finally {
            set({ isLoading: false });
        }
    },

    logout: async () => {
        try {
            await platformApi.logout();
        } catch { /* ignore */ }
        finally {
            get().clearAuth();
        }
    },

    fetchMe: async () => {
        try {
            const res = await platformApi.me();
            const token = localStorage.getItem('corextor_token');
            if (token) {
                const normalizedUser = normalizeAuthUser(res.data.data);
                localStorage.setItem('corextor_user', JSON.stringify(normalizedUser));
                set({ user: normalizedUser, token, isAuthenticated: true });
            }
        } catch {
            get().clearAuth();
        }
    },

    initialize: () => {
        const token = localStorage.getItem('corextor_token');
        const userStr = localStorage.getItem('corextor_user');
        if (token && userStr) {
            try {
                const user = JSON.parse(userStr) as AuthUser;
                set({ user, token, isAuthenticated: true });
            } catch {
                get().clearAuth();
            }
        }
    },
}));

function normalizeAuthUser(payload: AuthUser | MePayload): AuthUser {
    if ('user' in payload) {
        return {
            ...payload.user,
            company: payload.company ?? payload.user.company ?? undefined,
        };
    }

    return {
        ...payload,
        company: payload.company ?? undefined,
    };
}
