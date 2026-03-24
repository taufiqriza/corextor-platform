import { Moon, Sun, Shield, Globe, Bell, User, Building2, ChevronRight, LogOut } from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { useTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/authStore';

interface Props { T: Theme; isDesktop: boolean; }

export function CompanySettingsPanel({ T, isDesktop }: Props) {
    const { isDark, toggleTheme } = useTheme();
    const user = useAuthStore(s => s.user);

    const sections = [
        {
            title: 'Akun',
            items: [
                { icon: User, label: 'Profil', desc: user?.name ?? 'Admin', color: T.primary },
                { icon: Shield, label: 'Role', desc: 'Company Admin', color: T.info },
                { icon: Building2, label: 'Perusahaan', desc: user?.company?.name ?? '-', color: T.gold },
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
                { icon: Bell, label: 'Notifikasi', desc: 'Aktif', color: T.info },
            ],
        },
    ];

    return (
        <div style={{ display: 'grid', gap: 14 }}>
            {sections.map(section => (
                <div key={section.title} style={{
                    background: T.card, border: `1px solid ${T.border}`, borderRadius: 18,
                    padding: isDesktop ? 16 : 12,
                }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: T.text, marginBottom: 12, fontFamily: "'Sora', sans-serif" }}>
                        {section.title}
                    </div>
                    <div style={{ display: 'grid', gap: 2 }}>
                        {section.items.map(item => (
                            <button key={item.label}
                                onClick={item.action ?? undefined}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '12px 14px', borderRadius: 12,
                                    background: 'transparent', color: T.text, width: '100%',
                                    textAlign: 'left', transition: 'background .15s', cursor: item.action ? 'pointer' : 'default',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = T.bgAlt}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10,
                                    background: `${item.color}14`, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <item.icon size={16} color={item.color} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{item.label}</div>
                                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>{item.desc}</div>
                                </div>
                                {'toggle' in item ? (
                                    <div style={{
                                        width: 42, height: 24, borderRadius: 12,
                                        background: item.toggleState ? T.primary : T.border,
                                        position: 'relative', transition: 'background .2s',
                                    }}>
                                        <div style={{
                                            width: 18, height: 18, borderRadius: 9,
                                            background: '#fff', position: 'absolute',
                                            top: 3, left: item.toggleState ? 21 : 3,
                                            transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
                                        }} />
                                    </div>
                                ) : (
                                    <ChevronRight size={14} color={T.textMuted} />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            ))}

            {/* Info */}
            <div style={{
                textAlign: 'center', padding: 16, fontSize: 11, color: T.textMuted,
            }}>
                Corextor Platform • Company Portal v1.0
            </div>
        </div>
    );
}
