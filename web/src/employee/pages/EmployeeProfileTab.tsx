import { Moon, Sun, Shield, LogOut, ChevronRight, User, KeyRound, Bell, Globe, type LucideIcon } from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface SettingsItem {
    icon: LucideIcon;
    label: string;
    desc: string;
    color: string;
    action?: () => void;
    toggle?: boolean;
    toggleState?: boolean;
}

interface Props { T: Theme; isDesktop: boolean; isDark: boolean; toggleTheme: () => void; }

export function EmployeeProfileTab({ T, isDesktop, isDark, toggleTheme }: Props) {
    const user = useAuthStore(s => s.user);
    const logout = useAuthStore(s => s.logout);
    const navigate = useNavigate();
    const [showLogout, setShowLogout] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    const initials = (user?.name ?? 'E').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

    const sections: { title: string; items: SettingsItem[] }[] = [
        {
            title: 'Akun',
            items: [
                { icon: User, label: user?.name ?? 'Employee', desc: user?.email ?? 'ID: -', color: T.primary },
                { icon: Shield, label: 'Role', desc: user?.role ?? '-', color: T.info },
                { icon: KeyRound, label: 'Ubah PIN', desc: 'Ganti PIN absensi Anda', color: '#A855F7' },
            ],
        },
        {
            title: 'Preferensi',
            items: [
                {
                    icon: isDark ? Moon : Sun, label: 'Tema',
                    desc: isDark ? 'Dark Mode' : 'Light Mode',
                    color: isDark ? '#A855F7' : T.gold,
                    action: toggleTheme, toggle: true, toggleState: isDark,
                },
                { icon: Globe, label: 'Bahasa', desc: 'Bahasa Indonesia', color: T.success },
                { icon: Bell, label: 'Notifikasi', desc: 'Aktif', color: T.danger },
            ],
        },
    ];

    return (
        <div style={{ maxWidth: 480 }}>
            {/* Profile hero */}
            <div style={{
                background: `linear-gradient(145deg, ${T.primary}15, ${T.card})`,
                borderRadius: 22, padding: isDesktop ? 28 : 22,
                border: `1px solid ${T.primary}25`, textAlign: 'center',
                marginBottom: 20,
            }}>
                <div style={{
                    width: 72, height: 72, borderRadius: 22, margin: '0 auto 14px',
                    background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 900, fontSize: 24, fontFamily: "'Sora', sans-serif",
                    boxShadow: `0 8px 24px ${T.primaryGlow ?? 'rgba(59,130,246,.25)'}`,
                }}>
                    {initials}
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>
                    {user?.name ?? 'Employee'}
                </div>
                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4, textTransform: 'capitalize' }}>
                    {user?.role ?? '-'}
                </div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 10, flexWrap: 'wrap' }}>
                    {user?.active_products?.map(p => (
                        <span key={p} style={{
                            fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 8,
                            background: `${T.success}15`, color: T.success,
                            border: `1px solid ${T.success}30`, textTransform: 'capitalize',
                        }}>{p}</span>
                    ))}
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, marginTop: 18, background: T.surface, borderRadius: 14, padding: '14px 0', border: `1px solid ${T.border}` }}>
                    {[
                        { label: 'Hari Ini', value: '-' },
                        { label: 'Bulan Ini', value: '-' },
                        { label: 'Status', value: 'Active' },
                    ].map((s, i) => (
                        <div key={s.label} style={{ textAlign: 'center', borderRight: i < 2 ? `1px solid ${T.border}` : 'none', padding: '0 8px' }}>
                            <div style={{ fontSize: 16, fontWeight: 900, color: T.text }}>{s.value}</div>
                            <div style={{ fontSize: 9, color: T.textMuted, marginTop: 2 }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Settings rows */}
            {sections.map(section => (
                <div key={section.title} style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: .8, marginBottom: 8, paddingLeft: 2 }}>
                        {section.title}
                    </div>
                    <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                        {section.items.map((item, idx) => {
                            const Icon = item.icon;
                            return (
                                <button key={item.label} onClick={item.action} style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '14px 16px', textAlign: 'left',
                                    borderBottom: idx < section.items.length - 1 ? `1px solid ${T.border}30` : 'none',
                                    transition: 'background .12s',
                                }} onMouseEnter={e => e.currentTarget.style.background = `${T.primary}08`} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <div style={{ width: 36, height: 36, borderRadius: 11, background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Icon size={15} color={item.color} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{item.label}</div>
                                        <div style={{ fontSize: 11, color: T.textMuted }}>{item.desc}</div>
                                    </div>
                                    {item.toggle ? (
                                        <div style={{
                                            width: 42, height: 24, borderRadius: 12,
                                            background: item.toggleState ? T.primary : T.border,
                                            display: 'flex', alignItems: 'center', padding: '0 2px', transition: 'background .2s',
                                        }}>
                                            <div style={{
                                                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                                                transition: 'transform .2s ease',
                                                transform: item.toggleState ? 'translateX(18px)' : 'translateX(0)',
                                                boxShadow: '0 1px 3px rgba(0,0,0,.2)',
                                            }} />
                                        </div>
                                    ) : (
                                        <ChevronRight size={14} color={T.textMuted} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* Logout */}
            <button onClick={() => setShowLogout(true)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px', borderRadius: 16, border: `1px solid ${T.danger}25`,
                background: `${T.danger}08`, textAlign: 'left', marginBottom: 20,
                transition: 'background .12s',
            }} onMouseEnter={e => e.currentTarget.style.background = `${T.danger}15`} onMouseLeave={e => e.currentTarget.style.background = `${T.danger}08`}>
                <div style={{ width: 36, height: 36, borderRadius: 11, background: `${T.danger}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <LogOut size={15} color={T.danger} />
                </div>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.danger }}>Keluar</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>Logout dari akun ini</div>
                </div>
            </button>

            <div style={{ textAlign: 'center', paddingBottom: 12 }}>
                <div style={{ fontSize: 10, color: `${T.textMuted}80` }}>Corextor Platform v1.0.0</div>
            </div>

            {/* Logout modal */}
            {showLogout && (
                <>
                    <div onClick={() => setShowLogout(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)', zIndex: 10000 }} />
                    <div style={{
                        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 10001,
                        width: 'min(340px, calc(100vw - 32px))', borderRadius: 20,
                        background: T.card, border: `1px solid ${T.border}`, padding: 24,
                        boxShadow: '0 24px 60px rgba(0,0,0,.4)', animation: 'scaleIn .2s ease',
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <LogOut size={28} color={T.danger} style={{ marginBottom: 12 }} />
                            <h3 style={{ fontSize: 16, fontWeight: 900, color: T.text }}>Keluar dari Akun?</h3>
                            <p style={{ fontSize: 12, color: T.textMuted, marginTop: 6 }}>Anda perlu login ulang untuk mengakses absensi.</p>
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button onClick={() => setShowLogout(false)} style={{ flex: 1, height: 44, borderRadius: 12, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontWeight: 700, fontSize: 13 }}>Batal</button>
                            <button onClick={handleLogout} style={{ flex: 1, height: 44, borderRadius: 12, background: T.danger, color: '#fff', fontWeight: 700, fontSize: 13 }}>Ya, Keluar</button>
                        </div>
                    </div>
                </>
            )}

            <style>{`@keyframes scaleIn { from { opacity: 0; transform: translate(-50%, -50%) scale(.92); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }`}</style>
        </div>
    );
}
