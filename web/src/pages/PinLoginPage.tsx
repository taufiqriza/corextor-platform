import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/authStore';
import { Delete, Fingerprint, Loader2 } from 'lucide-react';
import { getHomeDestination, getLoginDestination, navigateToResolvedUrl } from '@/lib/appSurface';

const PIN_LENGTH = 6;
const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

export function PinLoginPage() {
    const { T, isDark } = useTheme();
    const navigate = useNavigate();
    const { loginWithPin, isLoading } = useAuthStore();

    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [shake, setShake] = useState(false);
    const [success, setSuccess] = useState(false);

    // Haptic feedback
    const vibrate = useCallback((ms = 20) => {
        try { navigator?.vibrate?.(ms); } catch { /* unsupported */ }
    }, []);

    // Submit PIN
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
            setTimeout(() => { setShake(false); setPin(''); }, 600);
        }
    }, [loginWithPin, navigate, vibrate]);

    // Handle keypad press
    const handleKey = useCallback((key: string) => {
        if (isLoading || success) return;
        setError('');

        if (key === 'del') {
            setPin(p => p.slice(0, -1));
            vibrate(10);
            return;
        }
        if (key === '') return;
        if (pin.length >= PIN_LENGTH) return;

        vibrate();
        const next = pin + key;
        setPin(next);

        // Auto-submit when PIN is complete
        if (next.length === PIN_LENGTH) {
            submitPin(next);
        }
    }, [pin, isLoading, success, vibrate, submitPin]);

    // Physical keyboard support
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key >= '0' && e.key <= '9') handleKey(e.key);
            if (e.key === 'Backspace') handleKey('del');
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleKey]);

    return (
        <div style={{
            minHeight: '100dvh', display: 'flex', flexDirection: 'column',
            background: isDark ? T.bg : '#F0F4FF',
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}>
            {/* ── Header ── */}
            <div style={{ padding: '32px 20px 0', textAlign: 'center', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
                    <Link
                        to="/"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            height: 34,
                            padding: '0 14px',
                            borderRadius: 999,
                            border: `1px solid ${T.border}`,
                            background: isDark ? T.card : '#fff',
                            color: T.primary,
                            fontSize: 12,
                            fontWeight: 800,
                        }}
                    >
                        ← Landing Page
                    </Link>
                </div>
                <div style={{
                    width: 64, height: 64, borderRadius: 20, margin: '0 auto 18px',
                    background: 'linear-gradient(135deg, #1E3A5F, #0F2341)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 12px 36px rgba(30,58,95,.35)',
                }}>
                    <Fingerprint size={30} color="#fff" strokeWidth={1.4} />
                </div>
                <h1 style={{
                    fontSize: 24, fontWeight: 900, color: T.text,
                    fontFamily: "'Sora', sans-serif", marginBottom: 6,
                }}>
                    Masuk dengan PIN
                </h1>
                <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.5 }}>
                    Masukkan PIN 6 digit Anda
                </p>
            </div>

            {/* ── Center content ── */}
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '24px 24px 0', maxWidth: 360, width: '100%', margin: '0 auto',
            }}>
                {/* PIN dots */}
                <div style={{
                    display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 16,
                    animation: shake ? 'shakeX .4s ease' : undefined,
                }}>
                    {Array.from({ length: PIN_LENGTH }).map((_, i) => {
                        const filled = i < pin.length;
                        const isNext = i === pin.length;
                        return (
                            <div key={i} style={{
                                width: 20, height: 20, borderRadius: '50%',
                                background: success ? T.success
                                    : filled ? T.primary
                                        : 'transparent',
                                border: filled || success ? 'none'
                                    : `2.5px solid ${isNext ? T.primary : T.border}`,
                                transition: 'all .12s ease',
                                transform: filled ? 'scale(1.15)' : 'scale(1)',
                                boxShadow: filled && !success ? `0 0 14px ${T.primaryGlow}` : 'none',
                            }} />
                        );
                    })}
                </div>

                {/* Status messages */}
                <div style={{ minHeight: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    {error && (
                        <div style={{
                            fontSize: 13, fontWeight: 700, color: T.danger,
                            animation: 'fadeIn .3s ease',
                        }}>
                            {error}
                        </div>
                    )}
                    {success && (
                        <div style={{
                            fontSize: 14, fontWeight: 800, color: T.success,
                            animation: 'fadeIn .3s ease',
                        }}>
                            ✓ Berhasil!
                        </div>
                    )}
                    {isLoading && !success && (
                        <Loader2 size={20} color={T.primary} style={{ animation: 'spin 1s linear infinite' }} />
                    )}
                </div>

                {/* Numeric keypad */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 12, width: '100%', maxWidth: 280,
                }}>
                    {KEYPAD.map((key, i) => {
                        if (key === '') return <div key={i} />;
                        const isDel = key === 'del';
                        return (
                            <button key={i}
                                onClick={() => handleKey(key)}
                                disabled={isLoading || success}
                                style={{
                                    height: 68, borderRadius: 18,
                                    background: isDel ? 'transparent'
                                        : isDark ? T.card : '#fff',
                                    border: isDel ? 'none' : `1px solid ${T.border}`,
                                    fontSize: isDel ? 0 : 26,
                                    fontWeight: 700,
                                    color: isDel ? T.textMuted : T.text,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'transform .08s ease, background .08s',
                                    cursor: isLoading || success ? 'not-allowed' : 'pointer',
                                    boxShadow: isDel ? 'none'
                                        : isDark ? 'none' : '0 2px 8px rgba(0,0,0,.04)',
                                    opacity: isLoading || success ? .45 : 1,
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

            {/* ── Footer ── */}
            <div style={{ padding: '20px 20px 28px', textAlign: 'center', flexShrink: 0 }}>
                <button onClick={() => navigateToResolvedUrl(getLoginDestination('company_admin'), navigate, false)} style={{
                    padding: '10px 20px', borderRadius: 12,
                    background: 'transparent',
                    border: `1px solid ${T.border}`,
                    color: T.textMuted, fontSize: 12, fontWeight: 700,
                    marginBottom: 12,
                }}>
                    Login sebagai Admin →
                </button>
                <div style={{ fontSize: 10, color: `${T.textMuted}60` }}>
                    Corextor Platform v1.0.0
                </div>
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
            `}</style>
        </div>
    );
}
