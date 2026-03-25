import { create } from 'zustand';
import type { AuthUser, MePayload } from '@/types/auth.types';
import { platformApi } from '@/api/platform.api';
import {
    clearSessionState,
    onSessionInvalidated,
    setSessionRole,
    setSessionToken,
} from '@/lib/authSession';

interface AuthState {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitializing: boolean;
    hasInitialized: boolean;

    setAuth: (user: AuthUser, token: string) => void;
    clearAuth: () => void;
    login: (email: string, password: string) => Promise<void>;
    loginWithPin: (pin: string) => Promise<void>;
    logout: () => Promise<void>;
    fetchMe: () => Promise<void>;
    initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    isInitializing: false,
    hasInitialized: false,

    setAuth: (user, token) => {
        const normalizedUser = normalizeAuthUser(user);
        setSessionToken(token);
        setSessionRole(normalizedUser.role);
        set({ user: normalizedUser, token, isAuthenticated: true });
    },

    clearAuth: () => {
        clearSessionState();
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
        const token = get().token;
        if (!token) {
            get().clearAuth();
            return;
        }

        try {
            const res = await platformApi.me();
            const normalizedUser = normalizeAuthUser(res.data.data);
            setSessionRole(normalizedUser.role);
            set({ user: normalizedUser, token, isAuthenticated: true });
        } catch {
            get().clearAuth();
        }
    },

    initialize: async () => {
        if (get().isInitializing || get().hasInitialized) return;

        set({ isInitializing: true });

        try {
            const refresh = await platformApi.refresh();
            const token = refresh.data.data.token;
            setSessionToken(token);
            set({ token, isAuthenticated: true });
            await get().fetchMe();
        } catch {
            get().clearAuth();
        } finally {
            set({ isInitializing: false, hasInitialized: true });
        }
    },
}));

onSessionInvalidated(() => {
    useAuthStore.setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        isInitializing: false,
        hasInitialized: true,
    });
});

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
