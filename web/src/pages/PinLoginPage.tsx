import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Delete, Fingerprint, Loader2, LockKeyhole, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/authStore';
import { getHomeDestination, getLoginDestination, navigateToResolvedUrl } from '@/lib/appSurface';

const PIN_LENGTH = 6;
const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

export function PinLoginPage() {
    const { T, isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const { loginWithPin, isLoading } = useAuthStore();

    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [shake, setShake] = useState(false);
    const [success, setSuccess] = useState(false);

    const vibrate = useCallback((ms = 20) => {
        try { navigator?.vibrate?.(ms); } catch { /* noop */ }
    }, []);

    const submitPin = useCallback(async (pinValue: string) => {
        try {
            await loginWithPin(pinValue);
            setSuccess(true);
            vibrate(50);
            setTimeout(() => {
                const nextUser = useAuthStore.getState().user;
                navigateToResolvedUrl(getHomeDestination(nextUser?.role), navigate);
            }, 600);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'PIN tidak valid';
            setError(msg);
            setShake(true);
            vibrate(100);
            setTimeout(() => {
                setShake(false);
                setPin('');
            }, 600);
        }
    }, [loginWithPin, navigate, vibrate]);

    const handleKey = useCallback((key: string) => {
        if (isLoading || success) return;
        setError('');

        if (key === 'del') {
            setPin(p => p.slice(0, -1));
            vibrate(10);
            return;
        }

        if (key === '' || pin.length >= PIN_LENGTH) return;

        vibrate();
        const next = pin + key;
        setPin(next);

        if (next.length === PIN_LENGTH) {
            submitPin(next);
        }
    }, [isLoading, pin, submitPin, success, vibrate]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key >= '0' && e.key <= '9') handleKey(e.key);
            if (e.key === 'Backspace') handleKey('del');
        };

        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleKey]);

    return (
        <div
            style={{
                minHeight: '100dvh',
                display: 'flex',
                flexDirection: 'column',
                background: isDark
                    ? 'linear-gradient(180deg, #07111E 0%, #0A1322 100%)'
                    : 'linear-gradient(180deg, #F4F8FF 0%, #ECF3FF 100%)',
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            }}
        >
            <div className="cx-pin-intro" style={{ padding: '34px 20px 0', textAlign: 'center', flexShrink: 0 }}>
                <div
                    className="cx-pin-mark"
                    style={{
                        width: 68,
                        height: 68,
                        borderRadius: 22,
                        margin: '0 auto 18px',
                        background: 'linear-gradient(135deg, #1E3A5F, #0F2341)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 16px 40px rgba(30,58,95,.35)',
                    }}
                >
                    <Fingerprint size={32} color="#fff" strokeWidth={1.4} />
                </div>
                <h1
                    className="cx-pin-title"
                    style={{
                        fontSize: 26,
                        fontWeight: 900,
                        color: T.text,
                        fontFamily: "'Sora', sans-serif",
                        margin: 0,
                    }}
                >
                    Login PIN Karyawan
                </h1>
                <p className="cx-pin-subtitle" style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.6, margin: '8px auto 0', maxWidth: 280 }}>
                    Masukkan PIN 6 digit untuk membuka absensi dan portal employee.
                </p>
            </div>

            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '28px 24px 0',
                    maxWidth: 360,
                    width: '100%',
                    margin: '0 auto',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 16,
                        marginBottom: 16,
                        animation: shake ? 'shakeX .4s ease' : undefined,
                    }}
                >
                    {Array.from({ length: PIN_LENGTH }).map((_, i) => {
                        const filled = i < pin.length;
                        const isNext = i === pin.length;
                        return (
                            <div
                                key={i}
                                style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: '50%',
                                    background: success ? T.success : filled ? T.primary : 'transparent',
                                    border: filled || success ? 'none' : `2.5px solid ${isNext ? T.primary : T.border}`,
                                    transition: 'all .12s ease',
                                    transform: filled ? 'scale(1.15)' : 'scale(1)',
                                    boxShadow: filled && !success ? `0 0 14px ${T.primaryGlow}` : 'none',
                                }}
                            />
                        );
                    })}
                </div>

                <div style={{ minHeight: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                    {error && (
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.danger, animation: 'fadeIn .3s ease' }}>
                            {error}
                        </div>
                    )}
                    {success && (
                        <div style={{ fontSize: 14, fontWeight: 800, color: T.success, animation: 'fadeIn .3s ease' }}>
                            Berhasil masuk
                        </div>
                    )}
                    {isLoading && !success && <Loader2 size={20} color={T.primary} style={{ animation: 'spin 1s linear infinite' }} />}
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 12,
                        width: '100%',
                        maxWidth: 280,
                    }}
                >
                    {KEYPAD.map((key, i) => {
                        if (key === '') return <div key={i} />;

                        const isDel = key === 'del';

                        return (
                            <button
                                key={i}
                                onClick={() => handleKey(key)}
                                disabled={isLoading || success}
                                style={{
                                    height: 68,
                                    borderRadius: 18,
                                    background: isDel ? 'transparent' : isDark ? T.card : '#FFFFFF',
                                    border: isDel ? 'none' : `1px solid ${T.border}`,
                                    fontSize: isDel ? 0 : 26,
                                    fontWeight: 700,
                                    color: isDel ? T.textMuted : T.text,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'transform .08s ease, background .08s',
                                    cursor: isLoading || success ? 'not-allowed' : 'pointer',
                                    boxShadow: isDel ? 'none' : isDark ? 'none' : '0 8px 18px rgba(15,23,42,.06)',
                                    opacity: isLoading || success ? 0.45 : 1,
                                    WebkitTapHighlightColor: 'transparent',
                                    userSelect: 'none',
                                }}
                                onTouchStart={e => { if (!isDel) e.currentTarget.style.transform = 'scale(0.92)'; }}
                                onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                                onMouseDown={e => { if (!isDel) e.currentTarget.style.transform = 'scale(0.92)'; }}
                                onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                            >
                                {isDel ? <Delete size={24} color={T.textMuted} /> : key}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div style={{ padding: '20px 20px 28px', textAlign: 'center', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
                    <button
                        onClick={toggleTheme}
                        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                        title={isDark ? 'Light mode' : 'Dark mode'}
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 14,
                            border: `1px solid ${T.border}`,
                            background: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                            color: T.text,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: isDark ? 'none' : '0 12px 24px rgba(15,23,42,0.08)',
                        }}
                    >
                        {isDark ? <Sun size={17} color={T.gold} /> : <Moon size={17} color="#0A4E87" />}
                    </button>
                    <button
                        onClick={() => navigateToResolvedUrl(getLoginDestination('company_admin'), navigate, false)}
                        aria-label="Admin login"
                        title="Admin login"
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 14,
                            border: `1px solid ${T.border}`,
                            background: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                            color: T.textMuted,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: isDark ? 'none' : '0 12px 24px rgba(15,23,42,0.08)',
                        }}
                    >
                        <LockKeyhole size={17} />
                    </button>
                </div>
                <div style={{ fontSize: 10, color: `${T.textMuted}90` }}>Corextor Platform v1.0.0</div>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes shakeX {
                    0%, 100% { transform: translateX(0); }
                    20% { transform: translateX(-10px); }
                    40% { transform: translateX(10px); }
                    60% { transform: translateX(-6px); }
                    80% { transform: translateX(6px); }
                }
                @media (max-width: 640px) {
                    .cx-pin-intro {
                        padding-top: 20px !important;
                    }
                    .cx-pin-mark {
                        width: 56px !important;
                        height: 56px !important;
                        border-radius: 18px !important;
                        margin-bottom: 12px !important;
                    }
                    .cx-pin-title {
                        font-size: 22px !important;
                    }
                    .cx-pin-subtitle {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
