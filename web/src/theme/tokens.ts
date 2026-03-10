/* ══════════════ COREXTOR PLATFORM DESIGN TOKENS ══════════════ */

export type Theme = {
    bg: string;
    bgAlt: string;
    surface: string;
    card: string;
    border: string;
    primary: string;
    primaryDark: string;
    primaryGlow: string;
    gold: string;
    goldGlow: string;
    text: string;
    textSub: string;
    textMuted: string;
    danger: string;
    info: string;
    success: string;
    white: string;
    navBg: string;
    shadow: string;
    shadowSm: string;
};

export const DARK: Theme = {
    bg: '#0B0F1A',
    bgAlt: '#111827',
    surface: '#1F2937',
    card: '#1F2937',
    border: '#374151',
    primary: '#3B82F6',
    primaryDark: '#2563EB',
    primaryGlow: '#3B82F633',
    gold: '#F59E0B',
    goldGlow: '#F59E0B22',
    text: '#F1F5F9',
    textSub: '#94A3B8',
    textMuted: '#64748B',
    danger: '#EF4444',
    info: '#06B6D4',
    success: '#22C55E',
    white: '#FFFFFF',
    navBg: 'rgba(17,24,39,0.95)',
    shadow: '0 8px 32px rgba(0,0,0,0.5)',
    shadowSm: '0 2px 12px rgba(0,0,0,0.3)',
};

export const LIGHT: Theme = {
    bg: '#F0F4FF',
    bgAlt: '#FFFFFF',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    border: '#E2E8F0',
    primary: '#2563EB',
    primaryDark: '#1D4ED8',
    primaryGlow: '#2563EB22',
    gold: '#D97706',
    goldGlow: '#D9770618',
    text: '#0F172A',
    textSub: '#475569',
    textMuted: '#94A3B8',
    danger: '#DC2626',
    info: '#0891B2',
    success: '#16A34A',
    white: '#FFFFFF',
    navBg: 'rgba(255,255,255,0.95)',
    shadow: '0 8px 32px rgba(15,23,42,0.12)',
    shadowSm: '0 2px 12px rgba(15,23,42,0.07)',
};

export type ThemeMode = 'dark' | 'light';
