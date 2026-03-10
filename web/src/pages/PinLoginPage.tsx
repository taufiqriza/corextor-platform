import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/authStore';
import { Delete, Fingerprint, Loader2, ArrowRight } from 'lucide-react';

const PIN_LENGTH = 6;
const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

export function PinLoginPage() {
    const { T, isDark } = useTheme();
    const navigate = useNavigate();
    const { loginWithPin, isLoading } = useAuthStore();

    const [companyCode, setCompanyCode] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [shake, setShake] = useState(false);
    const [success, setSuccess] = useState(false);
    const [step, setStep] = useState<'company' | 'pin'>('company');
    const companyInputRef = useRef<HTMLInputElement>(null);

    // Auto-focus company input
    useEffect(() => {
        if (step === 'company') companyInputRef.current?.focus();
    }, [step]);

    // Haptic feedback helper
    const vibrate = useCallback((ms = 20) => {
        try { navigator?.vibrate?.(ms); } catch { /* unsupported */ }
    }, []);

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
    }, [pin, isLoading, success, vibrate]);

    // Submit PIN
    const submitPin = async (pinValue: string) => {
        try {
            await loginWithPin(companyCode, pinValue);
            setSuccess(true);
            vibrate(50);
            setTimeout(() => navigate('/employee', { replace: true }), 600);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'PIN salah atau tidak ditemukan';
            setError(msg);
            setShake(true);
            vibrate(100);
            setTimeout(() => { setShake(false); setPin(''); }, 600);
        }
    };

    // Handle company code submit
    const handleCompanySubmit = () => {
        if (!companyCode.trim()) return;
        setStep('pin');
        setError('');
    };

    // Keyboard support for PIN
    useEffect(() => {
        if (step !== 'pin') return;
        const handler = (e: KeyboardEvent) => {
            if (e.key >= '0' && e.key <= '9') handleKey(e.key);
            if (e.key === 'Backspace') handleKey('del');
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [step, handleKey]);

    const brandGradient = 'linear-gradient(135deg, #1E3A5F, #0F2341)';

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            background: isDark ? T.bg : '#F0F4FF',
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}>
            {/* Header */}
            <div style={{
                padding: '24px 20px 0', textAlign: 'center',
            }}>
                <div style={{
                    width: 56, height: 56, borderRadius: 18, margin: '0 auto 14px',
                    background: brandGradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 10px 30px rgba(30,58,95,.35)',
                }}>
                    <Fingerprint size={26} color="#fff" strokeWidth={1.5} />
                </div>
                <h1 style={{
                    fontSize: 22, fontWeight: 900, color: T.text,
                    fontFamily: "'Sora', sans-serif", marginBottom: 4,
                }}>
                    Absensi Karyawan
                </h1>
                <p style={{ fontSize: 12, color: T.textMuted }}>
                    {step === 'company' ? 'Masukkan kode perusahaan Anda' : 'Masukkan PIN 6 digit Anda'}
                </p>
            </div>

            {/* Content area */}
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '20px 24px', maxWidth: 400, width: '100%', margin: '0 auto',
            }}>
                {step === 'company' ? (
                    /* ── Company Code Step ── */
                    <div style={{ width: '100%', animation: 'fadeSlideUp .3s ease' }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: .8, marginBottom: 8, display: 'block' }}>
                            Kode Perusahaan
                        </label>
                        <input
                            ref={companyInputRef}
                            type="text"
                            value={companyCode}
                            onChange={e => setCompanyCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                            onKeyDown={e => { if (e.key === 'Enter') handleCompanySubmit(); }}
                            placeholder="contoh: DEMO"
                            maxLength={20}
                            style={{
                                width: '100%', height: 56, borderRadius: 16,
                                background: isDark ? T.card : '#fff',
                                border: `2px solid ${companyCode ? T.primary : T.border}`,
                                fontSize: 22, fontWeight: 900, color: T.text,
                                textAlign: 'center', letterSpacing: 6,
                                textTransform: 'uppercase',
                                transition: 'border-color .2s',
                                boxSizing: 'border-box',
                                padding: '0 16px',
                            }}
                        />
                        <button
                            onClick={handleCompanySubmit}
                            disabled={!companyCode.trim()}
                            style={{
                                width: '100%', height: 52, borderRadius: 14, marginTop: 20,
                                background: companyCode.trim() ? brandGradient : T.border,
                                color: companyCode.trim() ? '#fff' : T.textMuted,
                                fontSize: 14, fontWeight: 800,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                boxShadow: companyCode.trim() ? '0 8px 28px rgba(30,58,95,.3)' : 'none',
                                transition: 'all .2s',
                                opacity: companyCode.trim() ? 1 : .5,
                            }}>
                            Lanjut <ArrowRight size={16} />
                        </button>
                    </div>
                ) : (
                    /* ── PIN Entry Step ── */
                    <div style={{ width: '100%', animation: 'fadeSlideUp .3s ease' }}>
                        {/* Company badge */}
                        <button onClick={() => { setStep('company'); setPin(''); setError(''); }}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                margin: '0 auto 24px', padding: '6px 14px', borderRadius: 10,
                                background: `${T.primary}12`, border: `1px solid ${T.primary}30`,
                                color: T.primary, fontSize: 11, fontWeight: 700,
                            }}>
                            🏢 {companyCode}
                        </button>

                        {/* PIN dots */}
                        <div style={{
                            display: 'flex', justifyContent: 'center', gap: 14,
                            marginBottom: 12,
                            animation: shake ? 'shakeX .4s ease' : undefined,
                        }}>
                            {Array.from({ length: PIN_LENGTH }).map((_, i) => {
                                const filled = i < pin.length;
                                const isNext = i === pin.length;
                                return (
                                    <div key={i} style={{
                                        width: 18, height: 18, borderRadius: '50%',
                                        background: success
                                            ? T.success
                                            : filled
                                                ? T.primary
                                                : 'transparent',
                                        border: filled || success
                                            ? 'none'
                                            : `2px solid ${isNext ? T.primary : T.border}`,
                                        transition: 'all .15s ease',
                                        transform: filled ? 'scale(1.1)' : 'scale(1)',
                                        boxShadow: filled && !success ? `0 0 12px ${T.primaryGlow}` : 'none',
                                    }} />
                                );
                            })}
                        </div>

                        {/* Error */}
                        {error && (
                            <div style={{
                                textAlign: 'center', fontSize: 12, fontWeight: 700,
                                color: T.danger, marginBottom: 12,
                                animation: 'fadeIn .3s ease',
                            }}>
                                {error}
                            </div>
                        )}

                        {/* Success */}
                        {success && (
                            <div style={{
                                textAlign: 'center', fontSize: 13, fontWeight: 800,
                                color: T.success, marginBottom: 12,
                                animation: 'fadeIn .3s ease',
                            }}>
                                ✓ Berhasil! Mengalihkan...
                            </div>
                        )}

                        {/* Loading */}
                        {isLoading && (
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                                <Loader2 size={20} color={T.primary} style={{ animation: 'spin 1s linear infinite' }} />
                            </div>
                        )}

                        {/* Keypad */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: 10, maxWidth: 300, margin: '8px auto 0',
                        }}>
                            {KEYPAD.map((key, i) => {
                                if (key === '') return <div key={i} />;

                                const isDel = key === 'del';
                                return (
                                    <button
                                        key={i}
                                        onClick={() => handleKey(key)}
                                        disabled={isLoading || success}
                                        onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.93)'; }}
                                        onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                                        onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.93)'; }}
                                        onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                                        style={{
                                            height: 64, borderRadius: 16,
                                            background: isDel
                                                ? 'transparent'
                                                : isDark ? T.card : '#fff',
                                            border: isDel
                                                ? 'none'
                                                : `1px solid ${T.border}`,
                                            fontSize: isDel ? 0 : 24,
                                            fontWeight: 800,
                                            color: isDel ? T.textMuted : T.text,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'transform .1s ease, background .1s',
                                            cursor: isLoading || success ? 'not-allowed' : 'pointer',
                                            boxShadow: isDel ? 'none' : (isDark ? 'none' : '0 2px 8px rgba(0,0,0,.04)'),
                                            opacity: isLoading || success ? .5 : 1,
                                        }}
                                    >
                                        {isDel ? <Delete size={22} color={T.textMuted} /> : key}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 20px 24px', textAlign: 'center' }}>
                <button onClick={() => navigate('/login')} style={{
                    padding: '8px 16px', borderRadius: 10,
                    background: 'transparent',
                    border: `1px solid ${T.border}`,
                    color: T.textMuted, fontSize: 11, fontWeight: 700,
                    marginBottom: 10,
                }}>
                    Login sebagai Admin →
                </button>
                <div style={{ fontSize: 10, color: `${T.textMuted}80` }}>
                    Corextor Platform v1.0.0
                </div>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
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
