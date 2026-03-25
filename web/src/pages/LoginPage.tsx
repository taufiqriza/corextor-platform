import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/authStore';
import { getHomeDestination, getLoginDestination, navigateToResolvedUrl } from '@/lib/appSurface';
import { Lock, Mail, Eye, EyeOff, ArrowRight, Loader2, Fingerprint } from 'lucide-react';

export function LoginPage() {
    const { T, isDark } = useTheme();
    const navigate = useNavigate();
    const { login, isLoading } = useAuthStore();
    const headerHeight = 72;

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
        <div style={{
            minHeight: '100vh',
            background: isDark
                ? 'linear-gradient(180deg, #07111E 0%, #0B0F1A 100%)'
                : 'linear-gradient(180deg, #F5F9FF 0%, #EEF4FF 100%)',
        }}>
            <header style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 30,
                height: headerHeight,
                background: 'rgba(5,10,20,0.92)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
                <div style={{
                    maxWidth: 1200,
                    height: '100%',
                    margin: '0 auto',
                    padding: '0 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                }}>
                    <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 34,
                            height: 34,
                            borderRadius: 9,
                            background: 'linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 20px rgba(37,99,235,0.5)',
                        }}>
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.9" />
                                <rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.6" />
                                <rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.6" />
                                <rect x="10" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.35" />
                            </svg>
                        </div>
                        <span style={{
                            fontFamily: "'Sora', sans-serif",
                            fontWeight: 700,
                            fontSize: 18,
                            color: '#fff',
                            letterSpacing: '-0.02em',
                        }}>
                            Corextor
                        </span>
                    </Link>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Link
                            to="/"
                            style={{
                                color: 'rgba(255,255,255,0.72)',
                                textDecoration: 'none',
                                fontSize: 13,
                                fontWeight: 600,
                                padding: '8px 14px',
                                borderRadius: 9,
                                border: '1px solid rgba(255,255,255,0.12)',
                            }}
                        >
                            Landing Page
                        </Link>
                        <a
                            href={getLoginDestination('employee')}
                            style={{
                                color: '#fff',
                                textDecoration: 'none',
                                fontSize: 13,
                                fontWeight: 700,
                                padding: '8px 14px',
                                borderRadius: 9,
                                background: 'linear-gradient(135deg, #2563EB, #1d4ed8)',
                                boxShadow: '0 4px 16px rgba(37,99,235,0.35)',
                            }}
                        >
                            PIN Karyawan
                        </a>
                    </div>
                </div>
            </header>

            <div className="cx-login-grid" style={{ minHeight: '100vh', paddingTop: headerHeight }}>
            {/* Left — Hero */}
            <div style={{
                background: `linear-gradient(135deg, #1E3A5F 0%, #0F2341 50%, #0B1929 100%)`,
                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                padding: 48, position: 'relative', overflow: 'hidden',
            }}>
                {/* Decorative shapes */}
                <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(59,130,246,.08)' }} />
                <div style={{ position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(59,130,246,.05)' }} />
                <div style={{ position: 'absolute', top: '40%', left: '10%', width: 120, height: 120, borderRadius: '50%', background: 'rgba(96,165,250,.04)' }} />

                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 400 }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: 20,
                        background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 28px', boxShadow: '0 12px 40px rgba(59,130,246,.35)',
                    }}>
                        <span style={{ fontSize: 28, fontWeight: 900, color: '#fff', fontFamily: "'Sora', sans-serif" }}>C</span>
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', fontFamily: "'Sora', sans-serif", marginBottom: 12 }}>
                        Corextor Platform
                    </h1>
                    <p style={{ fontSize: 14, color: '#93C5FD', lineHeight: 1.7, marginBottom: 32 }}>
                        Multi-tenant SaaS platform untuk mengelola produk digital perusahaan Anda. Satu dashboard, semua kontrol.
                    </p>

                    {/* Features */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
                        {[
                            { emoji: '🏢', text: 'Multi-company management' },
                            { emoji: '📊', text: 'Real-time attendance monitoring' },
                            { emoji: '🔐', text: 'Role-based access control' },
                            { emoji: '📱', text: 'Responsive & mobile-first' },
                        ].map((f, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '10px 14px', borderRadius: 12,
                                background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)',
                            }}>
                                <span style={{ fontSize: 18 }}>{f.emoji}</span>
                                <span style={{ fontSize: 13, color: '#CBD5E1', fontWeight: 600 }}>{f.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right — Form */}
            <div style={{
                background: isDark ? T.bg : '#FAFBFF',
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                padding: '48px 40px',
            }}>
                <div style={{ maxWidth: 380, width: '100%', margin: '0 auto' }}>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif", marginBottom: 6 }}>
                        Admin Login
                    </h2>
                    <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 28 }}>
                        Masuk ke workspace admin untuk mengelola Corextor dan company customer.
                    </p>

                    {error && (
                        <div style={{
                            padding: '10px 14px', borderRadius: 12, marginBottom: 20,
                            background: `${T.danger}12`, border: `1px solid ${T.danger}30`,
                            color: T.danger, fontSize: 12, fontWeight: 600,
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub, display: 'block', marginBottom: 6 }}>Email</label>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            background: isDark ? T.card : '#fff', border: `1px solid ${T.border}`,
                            borderRadius: 12, padding: '0 14px', marginBottom: 18,
                        }}>
                            <Mail size={15} color={T.textMuted} />
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                placeholder="admin@example.com" required autoFocus
                                style={{ flex: 1, height: 46, fontSize: 13, color: T.text }} />
                        </div>

                        <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub, display: 'block', marginBottom: 6 }}>Password</label>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            background: isDark ? T.card : '#fff', border: `1px solid ${T.border}`,
                            borderRadius: 12, padding: '0 14px', marginBottom: 28,
                        }}>
                            <Lock size={15} color={T.textMuted} />
                            <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••" required
                                style={{ flex: 1, height: 46, fontSize: 13, color: T.text }} />
                            <button type="button" onClick={() => setShowPass(p => !p)} style={{ color: T.textMuted }}>
                                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>

                        <button type="submit" disabled={isLoading} style={{
                            width: '100%', height: 48, borderRadius: 12,
                            background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                            color: '#fff', fontSize: 14, fontWeight: 800,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            boxShadow: '0 6px 24px rgba(59,130,246,.35)',
                            transition: 'all .2s ease', opacity: isLoading ? .7 : 1,
                        }}>
                            {isLoading ? <Loader2 size={16} className="cx-spin" /> : <>Masuk <ArrowRight size={15} /></>}
                        </button>
                    </form>

                    {/* Employee PIN login link */}
                    <div style={{
                        marginTop: 24, padding: '14px 16px', borderRadius: 14,
                        background: isDark ? T.surface : '#F1F5F9',
                        border: `1px solid ${T.border}`,
                        display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                        <div style={{
                            width: 38, height: 38, borderRadius: 11,
                            background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            <Fingerprint size={18} color="#fff" strokeWidth={1.5} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: T.text }}>Karyawan?</div>
                            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 1 }}>Masuk dengan PIN untuk absensi</div>
                        </div>
                        <button onClick={() => navigateToResolvedUrl(getLoginDestination('employee'), navigate, false)} style={{
                            height: 32, padding: '0 14px', borderRadius: 9,
                            background: `${T.primary}12`, border: `1px solid ${T.primary}35`,
                            color: T.primary, fontSize: 11, fontWeight: 800,
                        }}>
                            PIN Login
                        </button>
                    </div>

                    <p style={{ fontSize: 11, color: T.textMuted, textAlign: 'center', marginTop: 24 }}>
                        Corextor Platform v1.0.0
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .cx-spin { animation: spin 1s linear infinite; }
                @media (max-width: 900px) {
                    .cx-login-grid {
                        display: block !important;
                    }
                }
            `}</style>
            </div>
        </div>
    );
}
