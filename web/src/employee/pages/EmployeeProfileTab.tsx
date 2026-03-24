import {
    Moon, Sun, Shield, LogOut, ChevronRight, User, KeyRound, Bell,
    Globe, Smartphone, Info, type LucideIcon,
} from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { platformApi } from '@/api/platform.api';

interface Props { T: Theme; isDesktop: boolean; isDark: boolean; toggleTheme: () => void; }

export function EmployeeProfileTab({ T, isDesktop, isDark, toggleTheme }: Props) {
    const user = useAuthStore(s => s.user);
    const logout = useAuthStore(s => s.logout);
    const navigate = useNavigate();
    const [showLogout, setShowLogout] = useState(false);
    const [companyName, setCompanyName] = useState('');

    const fetchCompany = useCallback(async () => {
        try {
            const res = await platformApi.getMyProfile();
            setCompanyName(res.data?.data?.name ?? '');
        } catch { /* */ }
    }, []);
    useEffect(() => { fetchCompany(); }, [fetchCompany]);

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    const initials = (user?.name ?? 'E').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
    const firstName = (user?.name ?? 'Karyawan').split(' ')[0];

    const sections: { title: string; items: {
        icon: LucideIcon; label: string; desc: string; color: string;
        action?: () => void; toggle?: boolean; toggleState?: boolean;
    }[] }[] = [
        {
            title: 'Akun',
            items: [
                { icon: User, label: user?.name ?? 'Karyawan', desc: user?.email ?? 'Belum ada email', color: T.primary },
                { icon: Shield, label: 'Role', desc: user?.role ?? '-', color: T.info },
                { icon: KeyRound, label: 'Ubah PIN', desc: 'Ganti PIN absensi Anda', color: '#A855F7' },
            ],
        },
        {
            title: 'Preferensi',
            items: [
                {
                    icon: isDark ? Moon : Sun, label: 'Mode Gelap',
                    desc: isDark ? 'Dark Mode aktif' : 'Light Mode aktif',
                    color: isDark ? '#A855F7' : T.gold,
                    action: toggleTheme, toggle: true, toggleState: isDark,
                },
                { icon: Globe, label: 'Bahasa', desc: 'Indonesia', color: T.success },
                { icon: Bell, label: 'Notifikasi', desc: 'Aktif', color: T.danger },
            ],
        },
        {
            title: 'Tentang',
            items: [
                { icon: Smartphone, label: 'Versi Aplikasi', desc: 'v1.0.0', color: T.textMuted },
                { icon: Info, label: 'Bantuan', desc: 'Hubungi admin perusahaan', color: T.info },
            ],
        },
    ];

    const card = (extra?: React.CSSProperties): React.CSSProperties => ({
        background: T.card, borderRadius: 20, border: `1px solid ${T.border}`, ...extra,
    });

    return (
        <div>
            {/* ═══ Profile Hero ═══ */}
            <div style={{
                ...card({
                    padding: isDesktop ? 28 : 24, textAlign: 'center', marginBottom: 20,
                    position: 'relative', overflow: 'hidden',
                    background: `linear-gradient(160deg, ${T.primary}08, ${T.card})`,
                    borderColor: `${T.primary}20`,
                }),
            }}>
                {/* Decorative */}
                <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: `${T.primary}06` }} />
                <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: `${T.primary}04` }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    {/* Avatar */}
                    <div style={{
                        width: 80, height: 80, borderRadius: 24, margin: '0 auto 16px',
                        background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark ?? T.primary})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 900, fontSize: 28, fontFamily: "'Sora', sans-serif",
                        boxShadow: `0 8px 28px ${T.primary}30`,
                        border: '3px solid #fff',
                    }}>
                        {initials}
                    </div>

                    <div style={{ fontSize: 20, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>
                        {user?.name ?? 'Karyawan'}
                    </div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>
                        {companyName || 'Corextor'} • {user?.role ?? 'employee'}
                    </div>

                    {/* Product badges */}
                    {user?.active_products && user.active_products.length > 0 && (
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
                            {user.active_products.map(p => (
                                <span key={p} style={{
                                    fontSize: 9, fontWeight: 800, padding: '4px 12px', borderRadius: 8,
                                    background: `${T.success}10`, color: T.success,
                                    border: `1px solid ${T.success}25`, textTransform: 'capitalize',
                                }}>{p}</span>
                            ))}
                        </div>
                    )}

                    {/* Mini Stats */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0,
                        marginTop: 18, borderRadius: 16, overflow: 'hidden',
                        background: T.surface, border: `1px solid ${T.border}`,
                    }}>
                        {[
                            { label: 'Hari Ini', value: '—' },
                            { label: 'Bulan Ini', value: '—' },
                            { label: 'Status', value: '✓ Active' },
                        ].map((s, i) => (
                            <div key={s.label} style={{
                                textAlign: 'center', padding: '14px 8px',
                                borderRight: i < 2 ? `1px solid ${T.border}` : 'none',
                            }}>
                                <div style={{ fontSize: 16, fontWeight: 900, color: T.text }}>{s.value}</div>
                                <div style={{ fontSize: 9, color: T.textMuted, marginTop: 2, fontWeight: 600 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ═══ Settings Sections ═══ */}
            {sections.map(section => (
                <div key={section.title} style={{ marginBottom: 18 }}>
                    <div style={{
                        fontSize: 10, fontWeight: 700, color: T.textMuted,
                        textTransform: 'uppercase', letterSpacing: .8, marginBottom: 8, paddingLeft: 4,
                    }}>
                        {section.title}
                    </div>
                    <div style={card({ overflow: 'hidden' })}>
                        {section.items.map((item, idx) => {
                            const Icon = item.icon;
                            return (
                                <button key={item.label + idx} onClick={item.action} style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '14px 16px', textAlign: 'left',
                                    borderBottom: idx < section.items.length - 1 ? `1px solid ${T.border}40` : 'none',
                                    transition: 'background .12s',
                                }}>
                                    <div style={{
                                        width: 38, height: 38, borderRadius: 12,
                                        background: `${item.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        <Icon size={16} color={item.color} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{item.label}</div>
                                        <div style={{ fontSize: 11, color: T.textMuted }}>{item.desc}</div>
                                    </div>
                                    {item.toggle ? (
                                        <div style={{
                                            width: 46, height: 26, borderRadius: 13,
                                            background: item.toggleState ? T.primary : T.border,
                                            display: 'flex', alignItems: 'center', padding: '0 3px',
                                            transition: 'background .2s', flexShrink: 0,
                                        }}>
                                            <div style={{
                                                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                                                transition: 'transform .2s ease',
                                                transform: item.toggleState ? 'translateX(20px)' : 'translateX(0)',
                                                boxShadow: '0 1px 3px rgba(0,0,0,.2)',
                                            }} />
                                        </div>
                                    ) : (
                                        <ChevronRight size={15} color={T.textMuted} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* ═══ Logout Button ═══ */}
            <button onClick={() => setShowLogout(true)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px', borderRadius: 20, border: `1px solid ${T.danger}20`,
                background: `${T.danger}06`, textAlign: 'left', marginBottom: 20,
            }}>
                <div style={{
                    width: 38, height: 38, borderRadius: 12,
                    background: `${T.danger}12`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <LogOut size={16} color={T.danger} />
                </div>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.danger }}>Keluar</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>Logout dari akun ini</div>
                </div>
            </button>

            <div style={{ textAlign: 'center', paddingBottom: 16 }}>
                <div style={{ fontSize: 10, color: `${T.textMuted}80` }}>Corextor Platform v1.0.0</div>
            </div>

            {/* ═══ Logout Modal ═══ */}
            {showLogout && (
                <>
                    <div onClick={() => setShowLogout(false)} style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
                        backdropFilter: 'blur(4px)', zIndex: 10000,
                    }} />
                    <div style={{
                        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 10001,
                        width: 'min(340px, calc(100vw - 32px))', borderRadius: 24,
                        background: T.card, border: `1px solid ${T.border}`, padding: 28,
                        boxShadow: '0 24px 60px rgba(0,0,0,.4)', animation: 'scaleIn .2s ease',
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
                                background: `${T.danger}12`, border: `1px solid ${T.danger}25`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <LogOut size={24} color={T.danger} />
                            </div>
                            <h3 style={{ fontSize: 17, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>
                                Keluar, {firstName}?
                            </h3>
                            <p style={{ fontSize: 13, color: T.textMuted, marginTop: 6 }}>
                                Anda perlu login ulang untuk mengakses absensi.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                            <button onClick={() => setShowLogout(false)} style={{
                                flex: 1, height: 46, borderRadius: 14, border: `1px solid ${T.border}`,
                                background: T.surface, color: T.text, fontWeight: 700, fontSize: 14,
                            }}>Batal</button>
                            <button onClick={handleLogout} style={{
                                flex: 1, height: 46, borderRadius: 14, background: T.danger,
                                color: '#fff', fontWeight: 800, fontSize: 14,
                            }}>Ya, Keluar</button>
                        </div>
                    </div>
                </>
            )}

            <style>{`@keyframes scaleIn { from { opacity: 0; transform: translate(-50%, -50%) scale(.92); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }`}</style>
        </div>
    );
}
