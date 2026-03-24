import { useState, useEffect, useMemo, useCallback } from 'react';
import { Sun, Moon, LogOut, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/authStore';
import { platformApi } from '@/api/platform.api';
import { EmployeeBottomNav, type EmployeeTabId } from '@/employee/components/EmployeeBottomNav';
import { EmployeeHomeTab } from '@/employee/pages/EmployeeHomeTab';
import { EmployeeHistoryTab } from '@/employee/pages/EmployeeHistoryTab';
import { EmployeeReportTab } from '@/employee/pages/EmployeeReportTab';
import { EmployeeProfileTab } from '@/employee/pages/EmployeeProfileTab';

function useIsDesktop() {
    const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768);
    useEffect(() => {
        const mq = window.matchMedia('(min-width: 768px)');
        const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);
    return isDesktop;
}

export function EmployeeLayout() {
    const navigate = useNavigate();
    const { T, isDark, toggleTheme } = useTheme();
    const user = useAuthStore(s => s.user);
    const logout = useAuthStore(s => s.logout);
    const isDesktop = useIsDesktop();

    const [activeTab, setActiveTab] = useState<EmployeeTabId>('home');
    const [showLogout, setShowLogout] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [companyLogo, setCompanyLogo] = useState('');

    useEffect(() => { document.body.style.background = T.bg; }, [T.bg]);

    // Fetch company info
    const fetchCompany = useCallback(async () => {
        try {
            const res = await platformApi.getMyProfile();
            const c = res.data?.data;
            if (c?.name) setCompanyName(c.name);
            if (c?.logo_url) setCompanyLogo(c.logo_url);
        } catch { /* fallback to Corextor */ }
    }, []);
    useEffect(() => { fetchCompany(); }, [fetchCompany]);

    const greeting = useMemo(() => {
        const h = new Date().getHours();
        if (h < 12) return 'Selamat Pagi';
        if (h < 15) return 'Selamat Siang';
        if (h < 18) return 'Selamat Sore';
        return 'Selamat Malam';
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    const displayName = companyName || 'Corextor';
    const initials = displayName.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

    const renderContent = () => {
        switch (activeTab) {
            case 'history': return <EmployeeHistoryTab T={T} isDesktop={isDesktop} />;
            case 'report': return <EmployeeReportTab T={T} isDesktop={isDesktop} />;
            case 'profile': return <EmployeeProfileTab T={T} isDesktop={isDesktop} isDark={isDark} toggleTheme={toggleTheme} />;
            default: return <EmployeeHomeTab T={T} isDesktop={isDesktop} greeting={greeting} companyName={displayName} />;
        }
    };

    /* ═══ Header Component ═══ */
    const Header = () => (
        <header style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 8200,
            height: 64, padding: isDesktop ? '0 32px' : '0 16px',
            background: isDark ? `${T.bg}F8` : `${T.card}F4`,
            backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            borderBottom: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                {/* Company Logo / Initial */}
                {companyLogo ? (
                    <img src={companyLogo} alt={displayName}
                        style={{ width: 38, height: 38, borderRadius: 12, objectFit: 'cover', border: `1px solid ${T.border}` }} />
                ) : (
                    <div style={{
                        width: 38, height: 38, borderRadius: 12,
                        background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark ?? T.primary})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 4px 16px ${T.primary}30`,
                    }}>
                        <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', fontFamily: "'Sora', sans-serif" }}>
                            {initials}
                        </span>
                    </div>
                )}
                <div>
                    <div style={{
                        fontWeight: 900, fontSize: 16, color: T.text, letterSpacing: -.3,
                        fontFamily: "'Sora', sans-serif", lineHeight: 1.1,
                    }}>
                        {displayName}
                    </div>
                    <div style={{
                        fontSize: 10, color: T.textMuted, marginTop: 1,
                        fontWeight: 500,
                    }}>
                        {greeting}, {(user?.name ?? 'Karyawan').split(' ')[0]}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {/* Desktop tabs */}
                {isDesktop && (['home', 'history', 'report', 'profile'] as EmployeeTabId[]).map(tab => {
                    const labels: Record<EmployeeTabId, string> = { home: 'Beranda', history: 'Riwayat', report: 'Laporan', profile: 'Profil' };
                    const active = activeTab === tab;
                    return (
                        <button key={tab} onClick={() => setActiveTab(tab)} style={{
                            height: 34, padding: '0 14px', borderRadius: 10,
                            background: active ? `${T.primary}12` : 'transparent',
                            border: active ? `1.5px solid ${T.primary}35` : '1.5px solid transparent',
                            color: active ? T.primary : T.textMuted,
                            fontSize: 12, fontWeight: active ? 800 : 600, transition: 'all .15s',
                        }}>
                            {labels[tab]}
                        </button>
                    );
                })}

                {/* Notification bell */}
                <button style={{
                    width: 36, height: 36, borderRadius: 12, background: T.bgAlt ?? T.surface,
                    border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                }}>
                    <Bell size={15} color={T.textMuted} />
                    <div style={{
                        position: 'absolute', top: 6, right: 6, width: 6, height: 6,
                        borderRadius: '50%', background: T.danger,
                    }} />
                </button>

                {/* Theme toggle */}
                <button onClick={toggleTheme} style={{
                    width: 36, height: 36, borderRadius: 12, background: T.bgAlt ?? T.surface,
                    border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {isDark ? <Sun size={15} color={T.gold} /> : <Moon size={15} color={T.info} />}
                </button>
            </div>
        </header>
    );

    return (
        <>
            <div style={{
                background: T.bg, color: T.text, minHeight: '100vh',
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                transition: 'background .3s, color .3s',
            }}>
                <Header />

                <main style={{
                    maxWidth: isDesktop ? 720 : '100%',
                    margin: '0 auto',
                    padding: isDesktop
                        ? '88px 24px 60px'
                        : '72px 16px calc(100px + env(safe-area-inset-bottom))',
                    minHeight: '100vh',
                }}>
                    {renderContent()}
                </main>
            </div>

            {/* Mobile bottom nav */}
            {!isDesktop && <EmployeeBottomNav active={activeTab} setActive={setActiveTab} T={T} />}

            {/* Logout modal */}
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
                            <h3 style={{ fontSize: 17, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>Keluar?</h3>
                            <p style={{ fontSize: 13, color: T.textMuted, marginTop: 6 }}>Anda akan keluar dari akun ini.</p>
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

            <style>{`
                @keyframes scaleIn { from { opacity: 0; transform: translate(-50%, -50%) scale(.92); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
            `}</style>
        </>
    );
}
