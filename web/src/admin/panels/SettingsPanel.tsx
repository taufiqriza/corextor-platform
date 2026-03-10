import { Moon, Sun, Shield, Globe, Bell, User, ChevronRight } from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { useTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/authStore';

interface Props { T: Theme; isDesktop: boolean; }

export function SettingsPanel({ T, isDesktop }: Props) {
    const { isDark, toggleTheme } = useTheme();
    const user = useAuthStore(s => s.user);

    const sections = [
        {
            title: 'Akun',
            items: [
                { icon: User, label: 'Profil', desc: user?.name ?? 'Admin', color: T.primary },
                { icon: Shield, label: 'Role', desc: user?.role ?? '-', color: T.info },
            ],
        },
        {
            title: 'Preferensi',
            items: [
                {
                    icon: isDark ? Moon : Sun, label: 'Tema',
                    desc: isDark ? 'Dark Mode' : 'Light Mode',
                    color: isDark ? '#A855F7' : T.gold,
                    action: toggleTheme,
                    toggle: true, toggleState: isDark,
                },
                { icon: Globe, label: 'Bahasa', desc: 'Bahasa Indonesia', color: T.success },
                { icon: Bell, label: 'Notifikasi', desc: 'Aktif', color: T.danger },
            ],
        },
    ];

    return (
        <div style={{ maxWidth: 560 }}>
            {/* Profile card */}
            <div style={{
                background: T.card, borderRadius: 16, border: `1px solid ${T.border}`,
                padding: isDesktop ? 24 : 18, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16,
            }}>
                <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 900, fontSize: 20, fontFamily: "'Sora', sans-serif", flexShrink: 0,
                }}>
                    {(user?.name ?? 'A').slice(0, 1).toUpperCase()}
                </div>
                <div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: T.text }}>{user?.name ?? 'Admin'}</div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2, textTransform: 'capitalize' }}>{user?.role ?? '-'}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                        {user?.active_products?.map(p => (
                            <span key={p} style={{
                                fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                                background: `${T.success}15`, color: T.success, textTransform: 'capitalize',
                            }}>{p}</span>
                        ))}
                    </div>
                </div>
            </div>

            {sections.map(section => (
                <div key={section.title} style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: .8, marginBottom: 10, paddingLeft: 2 }}>
                        {section.title}
                    </div>
                    <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                        {section.items.map((item, idx) => {
                            const Icon = item.icon;
                            return (
                                <button key={item.label} onClick={item.action} style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '14px 16px', textAlign: 'left',
                                    borderBottom: idx < section.items.length - 1 ? `1px solid ${T.border}30` : 'none',
                                    transition: 'background .12s',
                                }} onMouseEnter={e => e.currentTarget.style.background = `${T.border}20`} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <div style={{ width: 34, height: 34, borderRadius: 10, background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
                                            display: 'flex', alignItems: 'center',
                                            padding: '0 2px', transition: 'background .2s',
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

            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted }}>Corextor Platform</div>
                <div style={{ fontSize: 10, color: `${T.textMuted}80`, marginTop: 2 }}>v1.0.0 — Built with ❤️</div>
            </div>
        </div>
    );
}
