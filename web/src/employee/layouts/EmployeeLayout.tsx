import { useState, useEffect, useMemo } from 'react';
import { Sun, Moon, MapPin, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/authStore';
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
    const mobileHeaderHeight = 64;

    const [activeTab, setActiveTab] = useState<EmployeeTabId>('home');
    const [showLogout, setShowLogout] = useState(false);

    useEffect(() => {
        document.body.style.background = T.bg;
    }, [T.bg]);

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

    const renderContent = () => {
        switch (activeTab) {
            case 'history': return <EmployeeHistoryTab T={T} isDesktop={isDesktop} />;
            case 'report': return <EmployeeReportTab T={T} isDesktop={isDesktop} />;
            case 'profile': return <EmployeeProfileTab T={T} isDesktop={isDesktop} isDark={isDark} toggleTheme={toggleTheme} />;
            default: return <EmployeeHomeTab T={T} isDesktop={isDesktop} greeting={greeting} />;
        }
    };

    return (
        <>
            {isDesktop ? (
                /* ── Desktop layout ── */
                <div style={{
                    background: T.bg, color: T.text, minHeight: '100vh',
                    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                    transition: 'background .3s, color .3s',
                }}>
                    {/* Desktop top bar */}
                    <header style={{
                        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 8200, height: 64,
                        background: isDark ? `${T.bg}F8` : `${T.bgAlt ?? '#F8FAFF'}F4`,
                        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                        borderBottom: `1px solid ${T.border}`, padding: '0 32px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 11,
                                background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 14px rgba(59,130,246,.25)',
                            }}>
                                <span style={{ fontSize: 15, fontWeight: 900, color: '#fff', fontFamily: "'Sora', sans-serif" }}>C</span>
                            </div>
                            <div>
                                <div style={{ fontWeight: 900, fontSize: 17, color: T.text, fontFamily: "'Sora', sans-serif" }}>
                                    Corextor <span style={{ color: T.primary }}>Attendance</span>
                                </div>
                                <div style={{ fontSize: 10, color: T.textMuted }}>{greeting}, {user?.name ?? 'Employee'}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            {/* Desktop tab nav */}
                            {(['home', 'history', 'report', 'profile'] as EmployeeTabId[]).map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                                    height: 36, padding: '0 14px', borderRadius: 10,
                                    background: activeTab === tab ? `${T.primary}15` : 'transparent',
                                    border: activeTab === tab ? `1px solid ${T.primary}40` : '1px solid transparent',
                                    color: activeTab === tab ? T.primary : T.textSub,
                                    fontSize: 12, fontWeight: 700, textTransform: 'capitalize', transition: 'all .15s',
                                }}>
                                    {tab === 'home' ? 'Beranda' : tab === 'history' ? 'Riwayat' : tab === 'report' ? 'Laporan' : 'Profil'}
                                </button>
                            ))}
                            <button onClick={toggleTheme} style={{
                                width: 36, height: 36, borderRadius: 11, background: T.card,
                                border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                {isDark ? <Sun size={15} color={T.gold} /> : <Moon size={15} color={T.info} />}
                            </button>
                        </div>
                    </header>

                    <main style={{ maxWidth: 720, margin: '0 auto', padding: '96px 24px 60px', minHeight: '100vh' }}>
                        {renderContent()}
                    </main>
                </div>
            ) : (
                /* ── Mobile layout (Kiosk PWA) ── */
                <div className="cx-fade-in" style={{
                    background: T.bg, color: T.text,
                    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                    transition: 'background .3s, color .3s',
                }}>
                    {/* Mobile header */}
                    <header style={{
                        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 8200,
                        height: mobileHeaderHeight, padding: '0 16px',
                        background: isDark ? `${T.bg}F8` : `#F8FAFF${isDark ? 'F8' : 'F4'}`,
                        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                        borderBottom: `1px solid ${T.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 11,
                                background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 14px rgba(59,130,246,.25)',
                            }}>
                                <span style={{ fontSize: 15, fontWeight: 900, color: '#fff', fontFamily: "'Sora', sans-serif" }}>C</span>
                            </div>
                            <div>
                                <div style={{ fontWeight: 900, fontSize: 17, color: T.text, letterSpacing: -.5, lineHeight: 1, fontFamily: "'Sora', sans-serif" }}>
                                    Corextor<span style={{ color: T.primary }}>Attendance</span>
                                </div>
                                <div style={{ fontSize: 10, color: T.textMuted, display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
                                    <MapPin size={8} color={T.primary} />
                                    <span>{user?.name ?? 'Employee'}</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={toggleTheme} style={{
                                width: 36, height: 36, borderRadius: 11, background: T.card,
                                border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                {isDark ? <Sun size={15} color={T.gold} /> : <Moon size={15} color={T.info} />}
                            </button>
                        </div>
                    </header>

                    <main style={{
                        overflowX: 'hidden', paddingTop: mobileHeaderHeight,
                        minHeight: '100vh', display: 'flex', flexDirection: 'column',
                    }}>
                        <div style={{ padding: '8px 16px calc(110px + env(safe-area-inset-bottom))' }}>
                            {renderContent()}
                        </div>
                    </main>
                </div>
            )}

            {/* Mobile bottom nav */}
            {!isDesktop && <EmployeeBottomNav active={activeTab} setActive={setActiveTab} T={T} />}

            {/* Logout modal */}
            {showLogout && (
                <>
                    <div onClick={() => setShowLogout(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 10000 }} />
                    <div style={{
                        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 10001,
                        width: 'min(340px, calc(100vw - 32px))', borderRadius: 20,
                        background: T.card, border: `1px solid ${T.border}`, padding: 24,
                        boxShadow: '0 24px 60px rgba(0,0,0,.4)',
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <LogOut size={28} color={T.danger} style={{ marginBottom: 12 }} />
                            <h3 style={{ fontSize: 16, fontWeight: 900, color: T.text }}>Keluar?</h3>
                            <p style={{ fontSize: 12, color: T.textMuted, marginTop: 6 }}>Anda akan keluar dari akun ini.</p>
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button onClick={() => setShowLogout(false)} style={{ flex: 1, height: 44, borderRadius: 12, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontWeight: 700, fontSize: 13 }}>Batal</button>
                            <button onClick={handleLogout} style={{ flex: 1, height: 44, borderRadius: 12, background: T.danger, color: '#fff', fontWeight: 700, fontSize: 13 }}>Keluar</button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
