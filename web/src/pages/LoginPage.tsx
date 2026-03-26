import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    Eye,
    EyeOff,
    Fingerprint,
    LayoutDashboard,
    Loader2,
    Lock,
    Mail,
    Moon,
    ShieldCheck,
    Sun,
    Users,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/authStore';
import { getHomeDestination, getLoginDestination, navigateToResolvedUrl } from '@/lib/appSurface';

const INPUT_RESET = {
    flex: 1,
    height: 48,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: 14,
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
} as const;

const HERO_FEATURES = [
    { icon: Users, label: 'Multi-company' },
    { icon: LayoutDashboard, label: 'Portal control' },
    { icon: ShieldCheck, label: 'Secure access' },
] as const;

export function LoginPage() {
    const { T, isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const { login, isLoading } = useAuthStore();
    const headerHeight = 76;

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            await login(email, password);
            const user = useAuthStore.getState().user;
            navigateToResolvedUrl(getHomeDestination(user?.role), navigate);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
            setError(msg);
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                background: isDark
                    ? 'linear-gradient(180deg, #07111E 0%, #0A1322 100%)'
                    : 'linear-gradient(180deg, #F5F9FF 0%, #ECF3FF 100%)',
            }}
        >
            <header
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 30,
                    height: headerHeight,
                    background: isDark ? 'rgba(5,10,20,0.82)' : 'rgba(255,255,255,0.78)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)'}`,
                }}
            >
                <div
                    style={{
                        maxWidth: 1240,
                        height: '100%',
                        margin: '0 auto',
                        padding: '0 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16,
                    }}
                >
                    <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 0 24px rgba(37,99,235,0.35)',
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.9" />
                                <rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.6" />
                                <rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.6" />
                                <rect x="10" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.35" />
                            </svg>
                        </div>
                        <span
                            style={{
                                fontFamily: "'Sora', sans-serif",
                                fontWeight: 700,
                                fontSize: 18,
                                letterSpacing: '-0.02em',
                                color: isDark ? '#FFFFFF' : '#0F172A',
                            }}
                        >
                            Corextor
                        </span>
                    </Link>

                    <div className="cx-login-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button
                            onClick={toggleTheme}
                            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 12,
                                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.08)'}`,
                                background: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isDark ? '#F8FAFC' : '#0F172A',
                                boxShadow: isDark ? 'none' : '0 10px 24px rgba(15,23,42,0.08)',
                            }}
                        >
                            {isDark ? <Sun size={17} color={T.gold} /> : <Moon size={17} color="#0A4E87" />}
                        </button>
                        <Link
                            className="cx-login-header-link"
                            to="/"
                            style={{
                                color: isDark ? 'rgba(255,255,255,0.72)' : '#334155',
                                textDecoration: 'none',
                                fontSize: 13,
                                fontWeight: 700,
                                padding: '9px 14px',
                                borderRadius: 10,
                                border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.08)'}`,
                                background: isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF',
                            }}
                        >
                            Landing Page
                        </Link>
                        <a
                            className="cx-login-header-link"
                            href={getLoginDestination('employee')}
                            style={{
                                color: '#FFFFFF',
                                textDecoration: 'none',
                                fontSize: 13,
                                fontWeight: 800,
                                padding: '9px 14px',
                                borderRadius: 10,
                                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                                boxShadow: '0 10px 24px rgba(37,99,235,0.28)',
                            }}
                        >
                            PIN Karyawan
                        </a>
                    </div>
                </div>
            </header>

            <div className="cx-login-stage-wrap" style={{ minHeight: '100vh', paddingTop: headerHeight }}>
                <section
                    className="cx-login-stage"
                    style={{
                        position: 'relative',
                        width: '100%',
                        minHeight: `calc(100vh - ${headerHeight}px)`,
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1fr) minmax(380px, 430px)',
                        overflow: 'hidden',
                    }}
                >
                    <img
                        src="/img-login.jpg"
                        alt="Corextor system apps illustration"
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                    />

                    <div
                        className="cx-login-hero-column"
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: isDark
                                ? 'linear-gradient(90deg, rgba(7,17,30,.88) 0%, rgba(8,16,28,.68) 42%, rgba(7,17,30,.22) 100%)'
                                : 'linear-gradient(90deg, rgba(255,255,255,.82) 0%, rgba(241,246,255,.56) 42%, rgba(255,255,255,.18) 100%)',
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'radial-gradient(circle at 18% 16%, rgba(59,130,246,.22), transparent 28%)',
                        }}
                    />

                    <div
                        className="cx-login-copy-column"
                        style={{
                            position: 'relative',
                            zIndex: 1,
                            padding: '54px 44px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: 24,
                        }}
                    >
                        <div className="cx-login-hero-copy" style={{ maxWidth: 500 }}>
                            <div
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    height: 34,
                                    padding: '0 14px',
                                    borderRadius: 999,
                                    background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(37,99,235,0.09)',
                                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(37,99,235,0.16)',
                                    color: isDark ? '#BFDBFE' : '#1D4ED8',
                                    fontSize: 12,
                                    fontWeight: 800,
                                    marginBottom: 18,
                                }}
                            >
                                Portal Login
                            </div>
                            <h1
                                style={{
                                    margin: 0,
                                    fontFamily: "'Sora', sans-serif",
                                    fontSize: 44,
                                    lineHeight: 1.04,
                                    letterSpacing: '-0.05em',
                                    fontWeight: 800,
                                    color: isDark ? '#FFFFFF' : '#0F172A',
                                }}
                            >
                                Login ke portal Corextor.
                            </h1>
                            <p
                                style={{
                                    margin: '16px 0 0',
                                    maxWidth: 430,
                                    color: isDark ? 'rgba(255,255,255,0.74)' : '#334155',
                                    fontSize: 15,
                                    lineHeight: 1.75,
                                }}
                            >
                                Masuk ke workspace admin untuk mengelola company, attendance, payroll, dan layanan SaaS dengan alur yang rapi dan konsisten.
                            </p>
                        </div>

                        <div className="cx-login-feature-row" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            {HERO_FEATURES.map(({ icon: Icon, label }) => (
                                <div
                                    key={label}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        padding: '12px 14px',
                                        borderRadius: 16,
                                        background: isDark ? 'rgba(8,15,28,0.55)' : 'rgba(255,255,255,0.62)',
                                        backdropFilter: 'blur(16px)',
                                        border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.5)',
                                        color: isDark ? '#E2E8F0' : '#0F172A',
                                        fontSize: 12,
                                        fontWeight: 700,
                                        boxShadow: isDark ? 'none' : '0 16px 30px rgba(15,23,42,0.08)',
                                    }}
                                >
                                    <Icon size={15} color={isDark ? '#93C5FD' : '#2563EB'} />
                                    <span>{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div
                        className="cx-login-form-column"
                        style={{
                            position: 'relative',
                            zIndex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            padding: '28px',
                        }}
                    >
                        <div
                            className="cx-login-form-shell"
                            style={{
                                width: '100%',
                                maxWidth: 420,
                                borderRadius: 30,
                                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.72)',
                                background: isDark ? 'rgba(11,15,26,0.8)' : 'rgba(255,255,255,0.88)',
                                backdropFilter: 'blur(24px)',
                                WebkitBackdropFilter: 'blur(24px)',
                                boxShadow: isDark ? '0 28px 70px rgba(2,6,23,0.44)' : '0 30px 70px rgba(15,23,42,0.12)',
                                padding: 30,
                            }}
                        >
                            <div
                                style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 18,
                                    background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 18px 34px rgba(37,99,235,0.28)',
                                    marginBottom: 18,
                                }}
                            >
                                <Lock size={24} color="#FFFFFF" />
                            </div>

                            <h2
                                style={{
                                    fontSize: 28,
                                    lineHeight: 1.1,
                                    fontWeight: 800,
                                    color: T.text,
                                    fontFamily: "'Sora', sans-serif",
                                    margin: 0,
                                }}
                            >
                                Login ke portal admin
                            </h2>
                            <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.7, margin: '10px 0 24px' }}>
                                Gunakan akun admin untuk masuk ke workspace superadmin atau company admin.
                            </p>

                            {error && (
                                <div
                                    style={{
                                        padding: '12px 14px',
                                        borderRadius: 14,
                                        marginBottom: 18,
                                        background: `${T.danger}12`,
                                        border: `1px solid ${T.danger}25`,
                                        color: T.danger,
                                        fontSize: 12,
                                        fontWeight: 700,
                                    }}
                                >
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <label style={{ fontSize: 11, fontWeight: 800, color: T.textSub, display: 'block', marginBottom: 7 }}>Email</label>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        background: isDark ? 'rgba(15,23,42,0.42)' : '#F8FBFF',
                                        border: `1px solid ${T.border}`,
                                        borderRadius: 14,
                                        padding: '0 14px',
                                        marginBottom: 18,
                                    }}
                                >
                                    <Mail size={16} color={T.textMuted} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="admin@company.com"
                                        required
                                        autoFocus
                                        style={{
                                            ...INPUT_RESET,
                                            color: T.text,
                                            WebkitTextFillColor: T.text,
                                            caretColor: T.text,
                                        }}
                                    />
                                </div>

                                <label style={{ fontSize: 11, fontWeight: 800, color: T.textSub, display: 'block', marginBottom: 7 }}>Password</label>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        background: isDark ? 'rgba(15,23,42,0.42)' : '#F8FBFF',
                                        border: `1px solid ${T.border}`,
                                        borderRadius: 14,
                                        padding: '0 14px',
                                        marginBottom: 16,
                                    }}
                                >
                                    <Lock size={16} color={T.textMuted} />
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Masukkan password"
                                        required
                                        style={{
                                            ...INPUT_RESET,
                                            color: T.text,
                                            WebkitTextFillColor: T.text,
                                            caretColor: T.text,
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(p => !p)}
                                        style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: 999,
                                            border: 'none',
                                            background: 'transparent',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: T.textMuted,
                                        }}
                                    >
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    style={{
                                        width: '100%',
                                        height: 50,
                                        borderRadius: 14,
                                        background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                                        color: '#FFFFFF',
                                        fontSize: 14,
                                        fontWeight: 800,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 8,
                                        boxShadow: '0 16px 34px rgba(37,99,235,0.3)',
                                        opacity: isLoading ? 0.72 : 1,
                                    }}
                                >
                                    {isLoading ? (
                                        <Loader2 size={16} className="cx-spin" />
                                    ) : (
                                        <>
                                            Masuk
                                            <ArrowRight size={15} />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div
                                style={{
                                    marginTop: 18,
                                    padding: 16,
                                    borderRadius: 18,
                                    background: isDark ? 'rgba(15,23,42,0.42)' : '#F8FBFF',
                                    border: `1px solid ${T.border}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                }}
                            >
                                <div
                                    style={{
                                        width: 42,
                                        height: 42,
                                        borderRadius: 14,
                                        background: 'linear-gradient(135deg, #0EA5E9, #2563EB)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <Fingerprint size={18} color="#FFFFFF" strokeWidth={1.5} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 12, fontWeight: 800, color: T.text }}>Login Karyawan</div>
                                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Masuk absensi melalui PIN di app.corextor.com</div>
                                </div>
                                <button
                                    onClick={() => navigateToResolvedUrl(getLoginDestination('employee'), navigate, false)}
                                    style={{
                                        height: 34,
                                        padding: '0 14px',
                                        borderRadius: 10,
                                        background: `${T.primary}14`,
                                        border: `1px solid ${T.primary}32`,
                                        color: T.primary,
                                        fontSize: 11,
                                        fontWeight: 800,
                                    }}
                                >
                                    Buka PIN
                                </button>
                            </div>

                            <p style={{ fontSize: 11, color: T.textMuted, textAlign: 'center', margin: '20px 0 0' }}>
                                Corextor Platform v1.0.0
                            </p>
                        </div>
                    </div>
                </section>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .cx-spin { animation: spin 1s linear infinite; }

                @media (max-width: 1024px) {
                    .cx-login-stage-wrap {
                        padding: 88px 18px 24px !important;
                    }
                    .cx-login-stage {
                        grid-template-columns: 1fr !important;
                        min-height: auto !important;
                        border-radius: 28px !important;
                    }
                    .cx-login-hero-column {
                        display: none !important;
                    }
                    .cx-login-copy-column {
                        display: none !important;
                    }
                    .cx-login-form-column {
                        min-height: auto !important;
                        align-items: stretch !important;
                        justify-content: flex-start !important;
                        padding: 18px 0 0 !important;
                    }
                }

                @media (max-width: 640px) {
                    .cx-login-stage-wrap {
                        padding: 84px 14px 22px !important;
                    }
                    .cx-login-header-actions {
                        gap: 6px !important;
                    }
                    .cx-login-header-link {
                        display: none !important;
                    }
                    .cx-login-stage {
                        min-height: auto !important;
                        border-radius: 24px !important;
                    }
                    .cx-login-form-column {
                        padding-top: 12px !important;
                    }
                    .cx-login-form-shell {
                        max-width: 100% !important;
                        border-radius: 24px !important;
                        padding: 22px !important;
                    }
                }
            `}</style>
        </div>
    );
}
