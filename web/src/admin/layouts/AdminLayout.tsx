import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Building2, ChevronDown, ClipboardList,
    LayoutDashboard, LogOut, MapPin, Menu, Moon, Package, Receipt,
    Sun, UserCircle, Users, X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/authStore';
import { DashboardPanel } from '@/admin/panels/DashboardPanel';
import { CompanyPanel } from '@/admin/panels/CompanyPanel';
import { SubscriptionPanel } from '@/admin/panels/SubscriptionPanel';
import { InvoicePanel } from '@/admin/panels/InvoicePanel';
import { BranchPanel } from '@/admin/panels/BranchPanel';
import { AttendanceUserPanel } from '@/admin/panels/AttendanceUserPanel';
import { AttendanceReportPanel } from '@/admin/panels/AttendanceReportPanel';

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

type AdminNavKey = 'dashboard' | 'companies' | 'subscriptions' | 'invoices' | 'branches' | 'att-users' | 'att-report' | 'settings';

type NavItem = { key: AdminNavKey; label: string; icon: typeof LayoutDashboard; };
type NavGroup = { label: string; items: NavItem[]; };

const NAV_GROUPS: NavGroup[] = [
    {
        label: 'Utama',
        items: [
            { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        ],
    },
    {
        label: 'Platform',
        items: [
            { key: 'companies', label: 'Companies', icon: Building2 },
            { key: 'subscriptions', label: 'Subscriptions', icon: Package },
            { key: 'invoices', label: 'Invoices', icon: Receipt },
        ],
    },
    {
        label: 'Attendance',
        items: [
            { key: 'branches', label: 'Branches', icon: MapPin },
            { key: 'att-users', label: 'Users', icon: Users },
            { key: 'att-report', label: 'Report', icon: ClipboardList },
        ],
    },
];

const SECTION_META: Record<AdminNavKey, { title: string; subtitle: string }> = {
    dashboard: { title: 'Dashboard', subtitle: 'Ringkasan operasional platform.' },
    companies: { title: 'Companies', subtitle: 'Kelola tenant dan organisasi.' },
    subscriptions: { title: 'Subscriptions', subtitle: 'Kelola langganan produk.' },
    invoices: { title: 'Invoices', subtitle: 'Riwayat tagihan dan pembayaran.' },
    branches: { title: 'Branches', subtitle: 'Kelola cabang perusahaan.' },
    'att-users': { title: 'Attendance Users', subtitle: 'Kelola profil absensi karyawan.' },
    'att-report': { title: 'Attendance Report', subtitle: 'Laporan kehadiran karyawan.' },
    settings: { title: 'Settings', subtitle: 'Konfigurasi platform.' },
};

export function AdminLayout() {
    const navigate = useNavigate();
    const isDesktop = useIsDesktop();
    const { T, isDark, toggleTheme } = useTheme();
    const user = useAuthStore(s => s.user);
    const logout = useAuthStore(s => s.logout);

    const [activeNav, setActiveNav] = useState<AdminNavKey>('dashboard');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const sidebarWidth = sidebarCollapsed ? 72 : 220;
    const curveSize = 32;
    const activeMeta = SECTION_META[activeNav];

    const isSuperAdmin = user?.role === 'super_admin';
    const isCompanyAdmin = user?.role === 'company_admin';
    const hasAttendance = user?.active_products?.includes('attendance');

    const visibleGroups = useMemo(() => {
        return NAV_GROUPS.map(g => ({
            ...g,
            items: g.items.filter(item => {
                if (['dashboard'].includes(item.key)) return true;
                if (['companies', 'invoices'].includes(item.key)) return isSuperAdmin;
                if (item.key === 'subscriptions') return isSuperAdmin || isCompanyAdmin;
                if (['branches', 'att-users', 'att-report'].includes(item.key)) return (isSuperAdmin || isCompanyAdmin) && hasAttendance;
                return true;
            }),
        })).filter(g => g.items.length > 0);
    }, [isSuperAdmin, isCompanyAdmin, hasAttendance]);

    const handleSelectNav = (key: AdminNavKey) => {
        setActiveNav(key);
        setMobileMenuOpen(false);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    // Close profile dropdown on outside click
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
            case 'companies': return <CompanyPanel T={T} isDesktop={isDesktop} />;
            case 'subscriptions': return <SubscriptionPanel T={T} isDesktop={isDesktop} isSuperAdmin={isSuperAdmin} />;
            case 'invoices': return <InvoicePanel T={T} isDesktop={isDesktop} />;
            case 'branches': return <BranchPanel T={T} isDesktop={isDesktop} />;
            case 'att-users': return <AttendanceUserPanel T={T} isDesktop={isDesktop} />;
            case 'att-report': return <AttendanceReportPanel T={T} isDesktop={isDesktop} />;
            default: return <DashboardPanel T={T} isDesktop={isDesktop} />;
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
            {isDesktop ? (
                <>
                    {/* Corner notches */}
                    {[
                        { top: 0, left: sidebarWidth, bg: `radial-gradient(circle at 100% 100%, transparent ${curveSize}px, #1E3A5F ${curveSize}px)` },
                        { bottom: 0, left: sidebarWidth, bg: `radial-gradient(circle at 100% 0%, transparent ${curveSize}px, #0F1D32 ${curveSize}px)` },
                        { top: 0, right: 0, bg: `radial-gradient(circle at 0% 100%, transparent ${curveSize}px, ${T.bg} ${curveSize}px)` },
                        { bottom: 0, right: 0, bg: `radial-gradient(circle at 0% 0%, transparent ${curveSize}px, ${T.bg} ${curveSize}px)` },
                    ].map((pos, i) => (
                        <div key={i} aria-hidden style={{
                            position: 'fixed', width: curveSize, height: curveSize, zIndex: 61, pointerEvents: 'none',
                            background: pos.bg, transition: 'left .25s ease',
                            ...(pos.top !== undefined ? { top: pos.top } : {}),
                            ...(pos.bottom !== undefined ? { bottom: pos.bottom } : {}),
                            ...(pos.left !== undefined ? { left: pos.left } : {}),
                            ...(pos.right !== undefined ? { right: pos.right } : {}),
                        }} />
                    ))}

                    {/* Sidebar */}
                    <aside style={{
                        position: 'fixed', top: 0, left: 0, bottom: 0, width: sidebarWidth, zIndex: 60,
                        background: 'linear-gradient(180deg, #1E3A5F 0%, #152A4A 38%, #0F1D32 100%)',
                        display: 'flex', flexDirection: 'column', transition: 'width .25s ease',
                        boxShadow: '10px 0 30px rgba(3,10,20,.25)',
                    }}>
                        {/* Logo */}
                        <div style={{ height: 72, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'space-between', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                                <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg, #3B82F6, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', fontFamily: "'Sora', sans-serif" }}>C</span>
                                </div>
                                {!sidebarCollapsed && (
                                    <div>
                                        <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', fontFamily: "'Sora', sans-serif", lineHeight: 1.1 }}>Corextor</div>
                                        <div style={{ fontSize: 10, color: '#93C5FD', marginTop: 2 }}>Admin Portal</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Nav Groups */}
                        <div style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
                            {visibleGroups.map(group => (
                                <div key={group.label} style={{ marginBottom: 6 }}>
                                    {!sidebarCollapsed && (
                                        <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(147,197,253,.45)', textTransform: 'uppercase', letterSpacing: 1.2, padding: '8px 12px 4px', userSelect: 'none' }}>
                                            {group.label}
                                        </div>
                                    )}
                                    {sidebarCollapsed && <div style={{ height: 1, background: 'rgba(255,255,255,.06)', margin: '6px 8px' }} />}
                                    {group.items.map(item => {
                                        const Icon = item.icon;
                                        const isActive = activeNav === item.key;
                                        return (
                                            <button key={item.key} onClick={() => handleSelectNav(item.key)} title={sidebarCollapsed ? item.label : undefined}
                                                style={{
                                                    width: '100%', display: 'flex', alignItems: 'center',
                                                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                                                    gap: 9, borderRadius: 10, padding: sidebarCollapsed ? '9px 0' : '9px 10px',
                                                    background: isActive ? 'rgba(59,130,246,.22)' : 'transparent',
                                                    color: isActive ? '#fff' : '#CBD5E1', marginBottom: 2,
                                                    transition: 'all .2s ease', position: 'relative',
                                                }}
                                            >
                                                {isActive && <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 18, borderRadius: 20, background: '#60A5FA', boxShadow: '0 0 14px #60A5FA88' }} />}
                                                <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive ? 'rgba(255,255,255,.17)' : 'rgba(255,255,255,.06)' }}>
                                                    <Icon size={14} />
                                                </div>
                                                {!sidebarCollapsed && <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 600 }}>{item.label}</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>

                        {/* Logout */}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', padding: '10px 8px' }}>
                            <button onClick={() => setShowLogoutModal(true)} style={{
                                width: '100%', height: 38, borderRadius: 10,
                                border: '1px solid rgba(255,255,255,.15)', background: 'rgba(239,68,68,.1)',
                                color: '#FCA5A5', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                                fontWeight: 700, fontSize: 11,
                            }}>
                                <LogOut size={13} />
                                {!sidebarCollapsed && 'Keluar'}
                            </button>
                            {!sidebarCollapsed && (
                                <div style={{ textAlign: 'center', marginTop: 8 }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.35)' }}>Corextor</div>
                                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,.2)', marginTop: 1 }}>v1.0.0</div>
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* Header */}
                    <header style={{
                        position: 'fixed', top: 0, left: sidebarWidth, right: 0, height: 72, zIndex: 50,
                        background: isDark ? `${T.bgAlt}F4` : `${T.bgAlt}EE`,
                        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0 24px', transition: 'left .25s ease',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <button onClick={() => setSidebarCollapsed(p => !p)} style={{
                                width: 38, height: 38, borderRadius: 10, border: `1px solid ${T.border}`,
                                background: T.card, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: T.textSub,
                            }} aria-label="Toggle sidebar">
                                <Menu size={16} />
                            </button>
                            <div>
                                <div style={{ fontSize: 18, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif", lineHeight: 1.1 }}>{activeMeta.title}</div>
                                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>
                                    {new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <button onClick={toggleTheme} style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${T.border}`, background: T.card, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: T.textSub }} aria-label="Toggle theme">
                                {isDark ? <Sun size={16} color={T.gold} /> : <Moon size={16} color={T.info} />}
                            </button>

                            <div style={{ width: 1, height: 30, background: T.border }} />

                            {/* Profile */}
                            <div ref={profileRef} style={{ position: 'relative' }}>
                                <button onClick={() => setProfileOpen(p => !p)} style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    background: profileOpen ? `${T.primary}10` : 'transparent',
                                    border: profileOpen ? `1px solid ${T.primary}30` : `1px solid transparent`,
                                    borderRadius: 12, padding: '4px 10px 4px 4px', cursor: 'pointer', transition: 'all .15s ease',
                                }}>
                                    <div style={{
                                        width: 34, height: 34, borderRadius: 10,
                                        background: `linear-gradient(135deg,${T.primary},${T.primaryDark})`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#fff', fontWeight: 900, fontSize: 13,
                                    }}>
                                        {(user?.name ?? 'A').slice(0, 1).toUpperCase()}
                                    </div>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: T.text, lineHeight: 1.2 }}>{user?.name ?? 'Admin'}</div>
                                        <div style={{ fontSize: 9, color: T.textMuted }}>{isSuperAdmin ? 'Super Admin' : 'Company Admin'}</div>
                                    </div>
                                    <ChevronDown size={12} color={T.textMuted} style={{ transition: 'transform .15s', transform: profileOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
                                </button>

                                {profileOpen && (
                                    <div style={{
                                        position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                                        width: 240, borderRadius: 14, overflow: 'hidden',
                                        background: T.card, border: `1px solid ${T.border}`,
                                        boxShadow: '0 12px 40px rgba(0,0,0,.2)', backdropFilter: 'blur(16px)',
                                        zIndex: 999, animation: 'profileDropIn .15s ease',
                                    }}>
                                        <div style={{ padding: '14px 16px 12px', borderBottom: `1px solid ${T.border}40`, background: `${T.primary}06` }}>
                                            <div style={{ fontSize: 12, fontWeight: 800, color: T.text }}>{user?.name ?? 'Admin'}</div>
                                            <div style={{ fontSize: 9, color: T.textMuted }}>{user?.role ?? ''}</div>
                                        </div>
                                        <div style={{ padding: '6px' }}>
                                            {[
                                                { icon: UserCircle, label: 'Profil', desc: 'Informasi akun' },
                                                { icon: isDark ? Sun : Moon, label: isDark ? 'Light Mode' : 'Dark Mode', desc: `Saat ini: ${isDark ? 'Dark' : 'Light'}`, action: toggleTheme },
                                            ].map((item, idx) => (
                                                <button key={idx} onClick={() => { item.action?.(); setProfileOpen(false); }} style={{
                                                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                                    padding: '8px 10px', borderRadius: 8, textAlign: 'left',
                                                    transition: 'background .12s ease',
                                                }} onMouseEnter={e => (e.currentTarget.style.background = `${T.border}40`)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `${T.primary}12`, color: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <item.icon size={13} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: 11, fontWeight: 700, color: T.text }}>{item.label}</div>
                                                        <div style={{ fontSize: 9, color: T.textMuted }}>{item.desc}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                        <div style={{ padding: '4px 6px 8px', borderTop: `1px solid ${T.border}40` }}>
                                            <button onClick={() => { setProfileOpen(false); setShowLogoutModal(true); }} style={{
                                                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                                padding: '8px 10px', borderRadius: 8, textAlign: 'left', transition: 'background .12s ease',
                                            }} onMouseEnter={e => (e.currentTarget.style.background = '#ef444410')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#ef444415', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <LogOut size={13} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444' }}>Keluar</div>
                                                    <div style={{ fontSize: 9, color: T.textMuted }}>Logout dari portal</div>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>

                    <main style={{ marginLeft: sidebarWidth, padding: '96px 24px 34px', transition: 'margin-left .25s ease' }}>
                        {renderContent()}
                    </main>
                </>
            ) : (
                <>
                    {/* Mobile Header */}
                    <header style={{
                        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 70, height: 64,
                        padding: '0 var(--cx-mobile-gutter, 16px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        borderBottom: `1px solid ${T.border}`,
                        background: isDark ? `${T.bgAlt}F4` : `${T.bgAlt}EC`,
                        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <button onClick={() => setMobileMenuOpen(true)} style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${T.border}`, background: T.card, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: T.textSub }} aria-label="Open menu">
                                <Menu size={15} />
                            </button>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 900, color: T.text, lineHeight: 1.1 }}>Corextor</div>
                                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 1 }}>{activeMeta.title}</div>
                            </div>
                        </div>
                        <button onClick={toggleTheme} style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${T.border}`, background: T.card, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Toggle theme">
                            {isDark ? <Sun size={14} color={T.gold} /> : <Moon size={14} color={T.info} />}
                        </button>
                    </header>

                    <main style={{ padding: '76px var(--cx-mobile-gutter, 16px) 104px' }}>
                        {renderContent()}
                    </main>

                    {/* Bottom Nav */}
                    <nav style={{
                        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 75,
                        padding: '0 var(--cx-mobile-nav-padding, 12px) 14px',
                        paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
                    }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, background: T.navBg, border: `1px solid ${T.border}`, borderRadius: 'var(--cx-mobile-nav-radius, 30px)', padding: '8px 6px 14px', boxShadow: T.shadow }}>
                            {[
                                { key: 'dashboard' as AdminNavKey, label: 'Home', icon: LayoutDashboard },
                                { key: 'companies' as AdminNavKey, label: 'Companies', icon: Building2 },
                                { key: 'att-report' as AdminNavKey, label: 'Report', icon: ClipboardList },
                                { key: 'settings' as AdminNavKey, label: 'Menu', icon: Menu },
                            ].map(item => {
                                const isActive = item.key === 'settings' ? mobileMenuOpen : activeNav === item.key;
                                const Icon = item.icon;
                                return (
                                    <button key={item.label} onClick={() => item.key === 'settings' ? setMobileMenuOpen(true) : handleSelectNav(item.key)}
                                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, paddingTop: 2, color: isActive ? T.primary : T.textMuted }}>
                                        <div style={{ width: 32, height: 32, borderRadius: 10, background: isActive ? `${T.primary}20` : 'transparent', border: isActive ? `1px solid ${T.primary}40` : '1px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Icon size={16} />
                                        </div>
                                        <span style={{ fontSize: 10, fontWeight: isActive ? 800 : 600 }}>{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </nav>
                </>
            )}

            {/* Mobile Menu Bottom Sheet */}
            {mobileMenuOpen && (
                <>
                    <div onClick={() => setMobileMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(6px)', zIndex: 88 }} />
                    <div style={{
                        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 89,
                        maxHeight: '80vh', overflowY: 'auto',
                        background: T.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
                        border: `1px solid ${T.border}`, boxShadow: T.shadow,
                        padding: '0 var(--cx-mobile-gutter, 16px) calc(16px + env(safe-area-inset-bottom))',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px' }}>
                            <div style={{ width: 36, height: 4, borderRadius: 99, background: T.border }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 900, color: T.text }}>Menu</div>
                                <div style={{ fontSize: 10, color: T.textMuted }}>Corextor Admin</div>
                            </div>
                            <button onClick={() => setMobileMenuOpen(false)} style={{ width: 32, height: 32, borderRadius: 10, border: `1px solid ${T.border}`, background: T.card, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: T.textSub }}>
                                <X size={14} />
                            </button>
                        </div>

                        {visibleGroups.map(group => (
                            <div key={group.label} style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, paddingLeft: 2 }}>{group.label}</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                                    {group.items.map(item => {
                                        const isActive = activeNav === item.key;
                                        const Icon = item.icon;
                                        return (
                                            <button key={item.key} onClick={() => handleSelectNav(item.key)} style={{
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                                                padding: '12px 4px 10px', borderRadius: 14,
                                                border: isActive ? `1.5px solid ${T.primary}50` : `1px solid ${T.border}`,
                                                background: isActive ? `${T.primary}12` : T.card,
                                                color: isActive ? T.primary : T.textSub, transition: 'all .15s ease',
                                            }}>
                                                <div style={{ width: 40, height: 40, borderRadius: 12, background: isActive ? `${T.primary}20` : T.bgAlt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Icon size={18} />
                                                </div>
                                                <span style={{ fontSize: 10, fontWeight: isActive ? 800 : 600, lineHeight: 1.1, textAlign: 'center' }}>{item.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        <button onClick={() => setShowLogoutModal(true)} style={{
                            width: '100%', height: 44, borderRadius: 14,
                            border: `1px solid ${T.danger}40`, background: `${T.danger}08`,
                            color: T.danger, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            fontWeight: 800, fontSize: 13,
                        }}>
                            <LogOut size={15} /> Keluar
                        </button>
                    </div>
                </>
            )}

            {/* Logout Modal */}
            {showLogoutModal && (
                <>
                    <div onClick={() => setShowLogoutModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)', zIndex: 100 }} />
                    <div style={{
                        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 101,
                        width: 'min(380px, calc(100vw - 32px))', borderRadius: 20,
                        background: T.card, border: `1px solid ${T.border}`, padding: 24,
                        boxShadow: '0 24px 60px rgba(0,0,0,.4)', animation: 'scaleIn .2s ease',
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: 56, height: 56, borderRadius: 16, background: `${T.danger}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <LogOut size={24} color={T.danger} />
                            </div>
                            <h3 style={{ fontSize: 18, fontWeight: 900, color: T.text, marginBottom: 8 }}>Keluar dari Admin?</h3>
                            <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 24 }}>Anda akan logout dan dikembalikan ke halaman login.</p>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setShowLogoutModal(false)} style={{
                                flex: 1, height: 44, borderRadius: 12, border: `1px solid ${T.border}`,
                                background: T.surface, color: T.text, fontWeight: 700, fontSize: 13,
                            }}>Batal</button>
                            <button onClick={handleLogout} style={{
                                flex: 1, height: 44, borderRadius: 12,
                                background: T.danger, color: '#fff', fontWeight: 700, fontSize: 13,
                            }}>Ya, Keluar</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
