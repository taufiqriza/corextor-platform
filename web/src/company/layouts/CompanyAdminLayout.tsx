import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Building2, ChevronDown, ClipboardList,
    LayoutDashboard, LogOut, MapPin, Menu, Moon, Receipt,
    Settings, Sun, UserCircle, Users, X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/authStore';
import { CompanyDashboardPanel } from '@/company/panels/CompanyDashboardPanel';
import { CompanyEmployeePanel } from '@/company/panels/CompanyEmployeePanel';
import { CompanyAttendancePanel } from '@/company/panels/CompanyAttendancePanel';
import { CompanyBranchPanel } from '@/company/panels/CompanyBranchPanel';
import { CompanyReportPanel } from '@/company/panels/CompanyReportPanel';
import { CompanyInvoicePanel } from '@/company/panels/CompanyInvoicePanel';
import { CompanySettingsPanel } from '@/company/panels/CompanySettingsPanel';

function useIsDesktop() {
    const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);
    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1024px)');
        const handler = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);
    return isDesktop;
}

type NavKey = 'dashboard' | 'employees' | 'attendance' | 'branches' | 'report' | 'invoices' | 'settings';
type NavItem = { key: NavKey; label: string; icon: typeof LayoutDashboard };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
    {
        label: 'Utama',
        items: [
            { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        ],
    },
    {
        label: 'Manajemen',
        items: [
            { key: 'employees', label: 'Karyawan', icon: Users },
            { key: 'branches', label: 'Cabang', icon: MapPin },
        ],
    },
    {
        label: 'Kehadiran',
        items: [
            { key: 'attendance', label: 'Kehadiran', icon: ClipboardList },
            { key: 'report', label: 'Laporan', icon: ClipboardList },
        ],
    },
    {
        label: 'Billing',
        items: [
            { key: 'invoices', label: 'Tagihan', icon: Receipt },
        ],
    },
    {
        label: 'Lainnya',
        items: [
            { key: 'settings', label: 'Pengaturan', icon: Settings },
        ],
    },
];

const SECTION_META: Record<NavKey, { title: string; subtitle: string }> = {
    dashboard: { title: 'Dashboard', subtitle: 'Ringkasan perusahaan Anda.' },
    employees: { title: 'Karyawan', subtitle: 'Kelola data karyawan perusahaan.' },
    attendance: { title: 'Kehadiran', subtitle: 'Pantau kehadiran hari ini.' },
    branches: { title: 'Cabang', subtitle: 'Kelola lokasi cabang.' },
    report: { title: 'Laporan Kehadiran', subtitle: 'Laporan dan rekap absensi.' },
    invoices: { title: 'Tagihan', subtitle: 'Riwayat tagihan subscription.' },
    settings: { title: 'Pengaturan', subtitle: 'Konfigurasi perusahaan.' },
};

export function CompanyAdminLayout() {
    const navigate = useNavigate();
    const isDesktop = useIsDesktop();
    const { T, isDark, toggleTheme } = useTheme();
    const user = useAuthStore(s => s.user);
    const logout = useAuthStore(s => s.logout);

    const [activeNav, setActiveNav] = useState<NavKey>('dashboard');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const sidebarWidth = sidebarCollapsed ? 72 : 220;
    const curveSize = 32;
    const activeMeta = SECTION_META[activeNav];

    const companyName = user?.company?.name ?? 'Perusahaan';

    const handleSelectNav = (key: NavKey) => {
        setActiveNav(key);
        setMobileMenuOpen(false);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    useEffect(() => {
        if (!profileOpen) return;
        const handler = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [profileOpen]);

    const renderContent = () => {
        switch (activeNav) {
            case 'employees': return <CompanyEmployeePanel T={T} isDesktop={isDesktop} />;
            case 'attendance': return <CompanyAttendancePanel T={T} isDesktop={isDesktop} />;
            case 'branches': return <CompanyBranchPanel T={T} isDesktop={isDesktop} />;
            case 'report': return <CompanyReportPanel T={T} isDesktop={isDesktop} />;
            case 'invoices': return <CompanyInvoicePanel T={T} isDesktop={isDesktop} />;
            case 'settings': return <CompanySettingsPanel T={T} isDesktop={isDesktop} />;
            default: return <CompanyDashboardPanel T={T} isDesktop={isDesktop} onNavigate={k => setActiveNav(k as NavKey)} />;
        }
    };

    /* ═══ Shared Styles ═══ */
    const ss = {
        sidebarItem: (active: boolean) => ({
            display: 'flex', alignItems: 'center', gap: 10,
            padding: sidebarCollapsed ? '10px 0' : '10px 14px',
            borderRadius: 12, cursor: 'pointer', transition: 'all .15s ease',
            background: active ? `${T.primary}14` : 'transparent',
            color: active ? T.primary : T.textSub,
            fontWeight: active ? 800 : 500,
            fontSize: 13,
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            border: active ? `1px solid ${T.primary}30` : '1px solid transparent',
        } as React.CSSProperties),
        mobileNavItem: (active: boolean) => ({
            display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 2,
            padding: '8px 0', borderRadius: 12, flex: 1,
            color: active ? T.primary : T.textMuted, fontSize: 10, fontWeight: active ? 800 : 500,
            background: active ? `${T.primary}10` : 'transparent',
        } as React.CSSProperties),
    };

    return (
        <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
            {isDesktop ? (
                <>
                    {/* Corner notches */}
                    <div style={{ position: 'fixed', left: sidebarWidth - 1, top: 0, width: curveSize, height: curveSize, zIndex: 11, overflow: 'hidden', pointerEvents: 'none' }}>
                        <div style={{ position: 'absolute', inset: 0, background: T.bg, borderTopLeftRadius: curveSize }} />
                    </div>
                    <div style={{ position: 'fixed', left: sidebarWidth - 1, bottom: 0, width: curveSize, height: curveSize, zIndex: 11, overflow: 'hidden', pointerEvents: 'none' }}>
                        <div style={{ position: 'absolute', inset: 0, background: T.bg, borderBottomLeftRadius: curveSize }} />
                    </div>

                    {/* Desktop Sidebar */}
                    <nav style={{
                        position: 'fixed', left: 0, top: 0, bottom: 0,
                        width: sidebarWidth, transition: 'width .2s ease',
                        background: T.navBg, backdropFilter: 'blur(24px)',
                        display: 'flex', flexDirection: 'column', zIndex: 10,
                        borderRight: `1px solid ${T.border}`,
                    }}>
                        {/* Logo */}
                        <div style={{
                            padding: sidebarCollapsed ? '18px 8px' : '18px 16px',
                            borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center',
                            justifyContent: sidebarCollapsed ? 'center' : 'space-between',
                        }}>
                            {!sidebarCollapsed && (
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 900, color: T.primary, fontFamily: "'Sora', sans-serif" }}>
                                        <Building2 size={14} style={{ display: 'inline', marginRight: 6 }} />
                                        {companyName.length > 16 ? companyName.slice(0, 16) + '…' : companyName}
                                    </div>
                                    <div style={{ fontSize: 9, color: T.textMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1.2 }}>Company Portal</div>
                                </div>
                            )}
                            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                style={{ color: T.textMuted, padding: 4, borderRadius: 8, transition: 'color .15s' }}>
                                <Menu size={16} />
                            </button>
                        </div>

                        {/* Nav */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: sidebarCollapsed ? '8px' : '8px 10px' }}>
                            {NAV_GROUPS.map(group => (
                                <div key={group.label} style={{ marginBottom: 12 }}>
                                    {!sidebarCollapsed && (
                                        <div style={{ fontSize: 9, fontWeight: 800, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, padding: '6px 14px' }}>
                                            {group.label}
                                        </div>
                                    )}
                                    {group.items.map(item => (
                                        <button key={item.key} onClick={() => handleSelectNav(item.key)} style={ss.sidebarItem(activeNav === item.key)} title={item.label}>
                                            <item.icon size={16} />
                                            {!sidebarCollapsed && <span>{item.label}</span>}
                                        </button>
                                    ))}
                                </div>
                            ))}
                        </div>

                        {/* User */}
                        <div style={{ padding: sidebarCollapsed ? '10px 8px' : '10px 14px', borderTop: `1px solid ${T.border}` }}>
                            <button onClick={() => setShowLogoutModal(true)} style={{
                                display: 'flex', alignItems: 'center', gap: 8, color: T.danger,
                                fontSize: 12, fontWeight: 600, padding: '8px 0', width: '100%',
                                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                            }}>
                                <LogOut size={14} />{!sidebarCollapsed && 'Keluar'}
                            </button>
                        </div>
                    </nav>

                    {/* Desktop Main */}
                    <main style={{ marginLeft: sidebarWidth, transition: 'margin .2s ease', minHeight: '100vh' }}>
                        {/* Header */}
                        <header style={{
                            padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            borderBottom: `1px solid ${T.border}`, background: T.bg, position: 'sticky', top: 0, zIndex: 5,
                        }}>
                            <div>
                                <h1 style={{ fontSize: 18, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>{activeMeta.title}</h1>
                                <p style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{activeMeta.subtitle}</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <button onClick={toggleTheme} style={{
                                    width: 36, height: 36, borderRadius: 10, border: `1px solid ${T.border}`,
                                    background: T.bgAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textSub,
                                }}>{isDark ? <Sun size={14} /> : <Moon size={14} />}</button>
                                <div ref={profileRef} style={{ position: 'relative' }}>
                                    <button onClick={() => setProfileOpen(!profileOpen)} style={{
                                        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
                                        borderRadius: 12, border: `1px solid ${T.border}`, background: T.bgAlt,
                                    }}>
                                        <div style={{
                                            width: 28, height: 28, borderRadius: 8, background: `${T.primary}20`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 11, fontWeight: 900, color: T.primary,
                                        }}>{(user?.name ?? 'A').charAt(0)}</div>
                                        <div style={{ textAlign: 'left' }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{user?.name ?? 'Admin'}</div>
                                            <div style={{ fontSize: 9, color: T.textMuted }}>Company Admin</div>
                                        </div>
                                        <ChevronDown size={12} color={T.textMuted} />
                                    </button>
                                    {profileOpen && (
                                        <div style={{
                                            position: 'absolute', right: 0, top: '100%', marginTop: 6,
                                            background: T.card, border: `1px solid ${T.border}`, borderRadius: 14,
                                            boxShadow: T.shadow, minWidth: 180, overflow: 'hidden', zIndex: 20,
                                        }}>
                                            <button onClick={() => { setProfileOpen(false); setActiveNav('settings'); }} style={{
                                                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', width: '100%',
                                                fontSize: 12, color: T.text, borderBottom: `1px solid ${T.border}`,
                                            }}><UserCircle size={14} /> Profil</button>
                                            <button onClick={() => { setProfileOpen(false); setShowLogoutModal(true); }} style={{
                                                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', width: '100%',
                                                fontSize: 12, color: T.danger,
                                            }}><LogOut size={14} /> Keluar</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </header>

                        {/* Content */}
                        <div style={{ padding: 20 }}>{renderContent()}</div>
                    </main>
                </>
            ) : (
                <>
                    {/* Mobile Header */}
                    <header style={{
                        position: 'sticky', top: 0, zIndex: 20, padding: '12px 16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: T.navBg, backdropFilter: 'blur(20px)', borderBottom: `1px solid ${T.border}`,
                    }}>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 900, color: T.primary, fontFamily: "'Sora', sans-serif" }}>
                                <Building2 size={14} style={{ display: 'inline', marginRight: 4 }} />
                                {companyName.length > 20 ? companyName.slice(0, 20) + '…' : companyName}
                            </div>
                            <div style={{ fontSize: 9, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>Company Portal</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={toggleTheme} style={{
                                width: 34, height: 34, borderRadius: 10, border: `1px solid ${T.border}`,
                                background: T.bgAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textSub,
                            }}>{isDark ? <Sun size={14} /> : <Moon size={14} />}</button>
                            <button onClick={() => setMobileMenuOpen(true)} style={{
                                width: 34, height: 34, borderRadius: 10, border: `1px solid ${T.border}`,
                                background: T.bgAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textSub,
                            }}><Menu size={16} /></button>
                        </div>
                    </header>

                    {/* Mobile Section Title */}
                    <div style={{ padding: '12px 16px 0' }}>
                        <h1 style={{ fontSize: 18, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>{activeMeta.title}</h1>
                        <p style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{activeMeta.subtitle}</p>
                    </div>

                    {/* Mobile Content */}
                    <div style={{ padding: 16, paddingBottom: 90 }}>{renderContent()}</div>

                    {/* Mobile Bottom Nav */}
                    <nav style={{
                        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20,
                        background: T.navBg, backdropFilter: 'blur(20px)',
                        borderTop: `1px solid ${T.border}`,
                        display: 'flex', padding: '6px 8px', paddingBottom: 'max(6px, env(safe-area-inset-bottom))',
                    }}>
                        {([
                            { key: 'dashboard' as NavKey, label: 'Home', icon: LayoutDashboard },
                            { key: 'employees' as NavKey, label: 'Karyawan', icon: Users },
                            { key: 'attendance' as NavKey, label: 'Hadir', icon: ClipboardList },
                            { key: 'report' as NavKey, label: 'Laporan', icon: ClipboardList },
                            { key: 'settings' as NavKey, label: 'Lainnya', icon: Settings },
                        ]).map(item => (
                            <button key={item.key} onClick={() => handleSelectNav(item.key)} style={ss.mobileNavItem(activeNav === item.key)}>
                                <item.icon size={18} />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>

                    {/* Mobile Full Menu */}
                    {mobileMenuOpen && (
                        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,.5)' }} onClick={() => setMobileMenuOpen(false)}>
                            <div style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                background: T.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
                                maxHeight: '80vh', overflowY: 'auto', padding: '16px 16px 32px',
                            }} onClick={e => e.stopPropagation()}>
                                <div style={{ width: 40, height: 4, borderRadius: 2, background: T.border, margin: '0 auto 16px' }} />
                                {NAV_GROUPS.map(g => (
                                    <div key={g.label} style={{ marginBottom: 12 }}>
                                        <div style={{ fontSize: 9, fontWeight: 800, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, padding: '4px 0' }}>{g.label}</div>
                                        {g.items.map(item => (
                                            <button key={item.key} onClick={() => handleSelectNav(item.key)} style={{
                                                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', width: '100%',
                                                borderRadius: 12, fontSize: 14, fontWeight: activeNav === item.key ? 800 : 500,
                                                color: activeNav === item.key ? T.primary : T.text,
                                                background: activeNav === item.key ? `${T.primary}10` : 'transparent',
                                            }}>
                                                <item.icon size={18} />{item.label}
                                            </button>
                                        ))}
                                    </div>
                                ))}
                                <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 8, paddingTop: 12 }}>
                                    <button onClick={() => { setMobileMenuOpen(false); setShowLogoutModal(true); }} style={{
                                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', width: '100%',
                                        borderRadius: 12, fontSize: 14, color: T.danger,
                                    }}><LogOut size={18} /> Keluar</button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Logout Confirmation */}
            {showLogoutModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
                    onClick={() => setShowLogoutModal(false)}>
                    <div style={{ background: T.card, borderRadius: 18, border: `1px solid ${T.border}`, padding: 24, width: '100%', maxWidth: 360 }}
                        onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontSize: 16, fontWeight: 900, color: T.text, marginBottom: 8 }}>Keluar dari Akun?</h3>
                        <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 20 }}>Anda akan keluar dari Company Portal.</p>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowLogoutModal(false)} style={{
                                height: 40, padding: '0 18px', borderRadius: 11, border: `1px solid ${T.border}`,
                                background: T.bgAlt, color: T.textSub, fontSize: 12, fontWeight: 700,
                            }}>Batal</button>
                            <button onClick={handleLogout} style={{
                                height: 40, padding: '0 20px', borderRadius: 11, background: T.danger,
                                color: '#fff', fontSize: 12, fontWeight: 700,
                            }}>Ya, Keluar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
