import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { DARK, LIGHT, type Theme, type ThemeMode } from '@/theme/tokens';

const STORAGE_KEY = 'corextor-theme-mode';

interface ThemeContextValue {
    T: Theme;
    mode: ThemeMode;
    isDark: boolean;
    toggleTheme: () => void;
}

const ThemeCtx = createContext<ThemeContextValue | null>(null);

function getStoredMode(): ThemeMode {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') return stored;
    } catch { /* noop */ }
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) {
        return 'light';
    }
    return 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [mode, setMode] = useState<ThemeMode>(getStoredMode);
    const isDark = mode === 'dark';
    const T = isDark ? DARK : LIGHT;

    const toggleTheme = () =>
        setMode((m) => {
            const next = m === 'dark' ? 'light' : 'dark';
            try { localStorage.setItem(STORAGE_KEY, next); } catch { /* noop */ }
            return next;
        });

    useEffect(() => {
        const handler = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY && (e.newValue === 'dark' || e.newValue === 'light')) {
                setMode(e.newValue);
            }
        };
        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
    }, []);

    return (
        <ThemeCtx.Provider value={{ T, mode, isDark, toggleTheme }}>
            {children}
        </ThemeCtx.Provider>
    );
}

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeCtx);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
}
