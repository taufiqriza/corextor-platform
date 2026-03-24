import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/authStore';
import { Lock, Mail, Eye, EyeOff, ArrowRight, Loader2, Fingerprint } from 'lucide-react';

export function LoginPage() {
    const { T, isDark } = useTheme();
    const navigate = useNavigate();
    const { login, isLoading } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password);
            // Role-based redirect
            const user = useAuthStore.getState().user;
            const role = user?.role ?? '';
            if (['super_admin', 'platform_staff', 'platform_finance'].includes(role)) {
                navigate('/admin', { replace: true });
            } else if (role === 'company_admin') {
                navigate('/company', { replace: true });
            } else {
                navigate('/employee', { replace: true });
            }
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
            setError(msg);
        }
    };

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
                        Admin Login
                    </h2>
                    <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 28 }}>
                        Masuk ke dashboard untuk mengelola platform.
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
                        <button onClick={() => navigate('/pin')} style={{
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
            `}</style>
        </div>
    );
}
