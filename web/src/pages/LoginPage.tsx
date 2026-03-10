import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/authStore';
import { Lock, Mail, Eye, EyeOff, ArrowRight, Loader2, Hash, Building } from 'lucide-react';

type LoginTab = 'email' | 'pin';

export function LoginPage() {
    const { T, isDark } = useTheme();
    const navigate = useNavigate();
    const { login, isLoading } = useAuthStore();

    const [tab, setTab] = useState<LoginTab>('email');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [companyCode, setCompanyCode] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const handleEmailLogin = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password);
            navigate('/admin', { replace: true });
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
            setError(msg);
        }
    };

    const handlePinLogin = async (e: FormEvent) => {
        e.preventDefault();
        setError('PIN login will be connected to attendance kiosk flow.');
    };

    const tabStyle = (active: boolean) => ({
        flex: 1, height: 42, borderRadius: 10,
        background: active ? (isDark ? T.card : '#fff') : 'transparent',
        border: active ? `1px solid ${T.border}` : '1px solid transparent',
        color: active ? T.text : T.textMuted,
        fontSize: 12, fontWeight: active ? 800 : 600 as const,
        display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 6,
        boxShadow: active ? T.shadowSm : 'none',
        transition: 'all .2s ease',
    });

    return (
        <div className="cx-login-grid" style={{ minHeight: '100vh' }}>
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
                        Selamat Datang
                    </h2>
                    <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 24 }}>
                        Masuk ke dashboard untuk mengelola platform.
                    </p>

                    {/* Tab switcher */}
                    <div style={{
                        display: 'flex', gap: 4, padding: 4, borderRadius: 12,
                        background: isDark ? T.surface : '#F1F5F9', marginBottom: 24,
                    }}>
                        <button onClick={() => { setTab('email'); setError(''); }} style={tabStyle(tab === 'email')}>
                            <Mail size={13} /> Email
                        </button>
                        <button onClick={() => { setTab('pin'); setError(''); }} style={tabStyle(tab === 'pin')}>
                            <Hash size={13} /> PIN Karyawan
                        </button>
                    </div>

                    {error && (
                        <div style={{
                            padding: '10px 14px', borderRadius: 12, marginBottom: 20,
                            background: `${T.danger}12`, border: `1px solid ${T.danger}30`,
                            color: T.danger, fontSize: 12, fontWeight: 600,
                        }}>
                            {error}
                        </div>
                    )}

                    {tab === 'email' ? (
                        <form onSubmit={handleEmailLogin}>
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
                    ) : (
                        <form onSubmit={handlePinLogin}>
                            <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub, display: 'block', marginBottom: 6 }}>Kode Perusahaan</label>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                background: isDark ? T.card : '#fff', border: `1px solid ${T.border}`,
                                borderRadius: 12, padding: '0 14px', marginBottom: 18,
                            }}>
                                <Building size={15} color={T.textMuted} />
                                <input type="text" value={companyCode} onChange={e => setCompanyCode(e.target.value.toUpperCase())}
                                    placeholder="DEMO" required autoFocus
                                    style={{ flex: 1, height: 46, fontSize: 13, color: T.text, textTransform: 'uppercase', letterSpacing: 2 }} />
                            </div>

                            <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub, display: 'block', marginBottom: 6 }}>PIN</label>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                background: isDark ? T.card : '#fff', border: `1px solid ${T.border}`,
                                borderRadius: 12, padding: '0 14px', marginBottom: 28,
                            }}>
                                <Hash size={15} color={T.textMuted} />
                                <input type="password" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="••••" required inputMode="numeric" maxLength={6}
                                    style={{ flex: 1, height: 46, fontSize: 18, color: T.text, letterSpacing: 8, fontWeight: 700 }} />
                            </div>

                            <button type="submit" style={{
                                width: '100%', height: 48, borderRadius: 12,
                                background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                                color: '#fff', fontSize: 14, fontWeight: 800,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                boxShadow: '0 6px 24px rgba(34,197,94,.35)',
                            }}>
                                Masuk dengan PIN <ArrowRight size={15} />
                            </button>
                        </form>
                    )}

                    <p style={{ fontSize: 11, color: T.textMuted, textAlign: 'center', marginTop: 24 }}>
                        Corextor Platform v1.0.0
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .cx-spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
}
