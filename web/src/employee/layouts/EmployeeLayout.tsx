import { useEffect, useMemo, useState } from 'react';
import { Bell, LogOut, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/authStore';
import { EmployeeBottomNav, type EmployeeTabId } from '@/employee/components/EmployeeBottomNav';
import { EmployeePwaInstallPrompt } from '@/employee/components/EmployeePwaInstallPrompt';
import { EmployeeAttendanceTab } from '@/employee/pages/EmployeeAttendanceTab';
import { EmployeeHistoryTab } from '@/employee/pages/EmployeeHistoryTab';
import { EmployeeHomeTab } from '@/employee/pages/EmployeeHomeTab';
import { EmployeeProfileTab } from '@/employee/pages/EmployeeProfileTab';
import { EmployeeReportTab } from '@/employee/pages/EmployeeReportTab';
import { getLoginDestination, navigateToResolvedUrl } from '@/lib/appSurface';

const THEME_STORAGE_KEY = 'corextor-theme-mode';

function useIsDesktop() {
    const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 768px)');
        const handleChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return isDesktop;
}

export function EmployeeLayout() {
    const navigate = useNavigate();
    const { T, isDark, toggleTheme } = useTheme();
    const logout = useAuthStore(state => state.logout);
    const user = useAuthStore(state => state.user);
    const isDesktop = useIsDesktop();

    const [activeTab, setActiveTab] = useState<EmployeeTabId>('home');
    const [showLogout, setShowLogout] = useState(false);

    useEffect(() => {
        try {
            const storedMode = localStorage.getItem(THEME_STORAGE_KEY);
            if (storedMode === 'light' || storedMode === 'dark') return;

            localStorage.setItem(THEME_STORAGE_KEY, 'light');
            if (isDark) {
                toggleTheme();
            }
        } catch {
            // Ignore storage failures; employee portal still renders.
        }
    }, [isDark, toggleTheme]);

    useEffect(() => {
        document.body.style.background = T.bg;
        return () => {
            document.body.style.background = '';
        };
    }, [T.bg]);

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Selamat pagi';
        if (hour < 15) return 'Selamat siang';
        if (hour < 18) return 'Selamat sore';
        return 'Selamat malam';
    }, []);

    const currentDateLabel = useMemo(
        () => new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
        }),
        [],
    );

    const companyName = user?.company?.name || 'Corextor';
    const companyLogo = user?.company?.logo_url || '';
    const initials = companyName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(word => word[0])
        .join('')
        .toUpperCase();

    const tabs: { id: EmployeeTabId; label: string }[] = [
        { id: 'home', label: 'Beranda' },
        { id: 'attendance', label: 'Kehadiran' },
        { id: 'history', label: 'Riwayat' },
        { id: 'report', label: 'Laporan' },
        { id: 'profile', label: 'Profil' },
    ];
    const activeTabLabel = tabs.find(tab => tab.id === activeTab)?.label ?? 'Beranda';
    const headerActionBackground = isDark
        ? 'rgba(255,255,255,.12)'
        : 'linear-gradient(180deg, rgba(255,255,255,.28) 0%, rgba(223,238,255,.2) 100%)';
    const headerActionBorder = isDark
        ? '1px solid rgba(255,255,255,.16)'
        : '1px solid rgba(8,49,87,.16)';
    const headerActionColor = isDark ? 'rgba(255,255,255,.86)' : '#0A4E87';
    const headerActionShadow = isDark
        ? T.shadowSm
        : '0 10px 18px rgba(8,49,87,.1), inset 0 1px 0 rgba(255,255,255,.22)';

    const handleLogout = async () => {
        await logout();
        navigateToResolvedUrl(getLoginDestination('employee'), navigate);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'attendance':
                return <EmployeeAttendanceTab T={T} isDesktop={isDesktop} />;
            case 'history':
                return <EmployeeHistoryTab T={T} isDesktop={isDesktop} />;
            case 'report':
                return <EmployeeReportTab T={T} isDesktop={isDesktop} />;
            case 'profile':
                return <EmployeeProfileTab T={T} isDesktop={isDesktop} isDark={isDark} toggleTheme={toggleTheme} />;
            default:
                return (
                    <EmployeeHomeTab
                        T={T}
                        isDesktop={isDesktop}
                        onNavigate={setActiveTab}
                    />
                );
        }
    };

    return (
        <>
            <div style={{
                minHeight: '100vh',
                color: T.text,
                background: isDark
                    ? 'radial-gradient(circle at top, rgba(37,99,235,.18), transparent 36%), linear-gradient(180deg, #07111E 0%, #0B0F1A 38%, #0B0F1A 100%)'
                    : 'radial-gradient(circle at top, rgba(37,99,235,.14), transparent 34%), linear-gradient(180deg, #F5F9FF 0%, #EEF4FF 38%, #F0F4FF 100%)',
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                transition: 'background .3s ease, color .3s ease',
            }}>
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    pointerEvents: 'none',
                    overflow: 'hidden',
                    zIndex: 0,
                }}>
                    <div style={{
                        position: 'absolute',
                        top: -120,
                        right: -60,
                        width: 240,
                        height: 240,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(59,130,246,.18) 0%, transparent 72%)',
                    }} />
                    <div style={{
                        position: 'absolute',
                        top: 180,
                        left: -80,
                        width: 220,
                        height: 220,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(16,185,129,.12) 0%, transparent 74%)',
                    }} />
                </div>

                <header style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 20,
                    padding: isDesktop ? '22px 28px 14px' : '12px 14px 10px',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    background: isDark
                        ? 'linear-gradient(180deg, rgba(9,50,90,.88) 0%, rgba(15,95,166,.62) 100%)'
                        : 'linear-gradient(180deg, rgba(15,95,166,.94) 0%, rgba(27,116,182,.82) 100%)',
                    borderBottom: '1px solid rgba(255,255,255,.12)',
                    boxShadow: '0 10px 28px rgba(8,49,87,.12)',
                }}>
                    <div style={{
                        maxWidth: 820,
                        margin: '0 auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: isDesktop ? 14 : 10, minWidth: 0 }}>
                            {companyLogo ? (
                                <img
                                    src={companyLogo}
                                    alt={companyName}
                                    style={{
                                        width: isDesktop ? 46 : 40,
                                        height: isDesktop ? 46 : 40,
                                        borderRadius: isDesktop ? 16 : 14,
                                        objectFit: 'cover',
                                        border: '1px solid rgba(255,255,255,.16)',
                                        boxShadow: T.shadowSm,
                                    }}
                                />
                            ) : (
                                <div style={{
                                    width: isDesktop ? 46 : 40,
                                    height: isDesktop ? 46 : 40,
                                    borderRadius: isDesktop ? 16 : 14,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'linear-gradient(145deg, #1D4ED8 0%, #0F172A 100%)',
                                    color: '#fff',
                                    boxShadow: '0 14px 30px rgba(29,78,216,.3)',
                                    fontFamily: "'Sora', sans-serif",
                                    fontWeight: 900,
                                    fontSize: isDesktop ? 15 : 13,
                                }}>
                                    {initials}
                                </div>
                            )}

                            <div style={{ minWidth: 0 }}>
                                <div style={{
                                    fontFamily: "'Sora', sans-serif",
                                    fontSize: isDesktop ? 18 : 15,
                                    fontWeight: 900,
                                    letterSpacing: -.5,
                                    color: '#fff',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}>
                                    {companyName}
                                </div>
                                <div style={{
                                    marginTop: 4,
                                    fontSize: isDesktop ? 11 : 10,
                                    color: 'rgba(255,255,255,.78)',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    flexWrap: 'wrap',
                                }}>
                                    {isDesktop ? (
                                        <>
                                            <span>{greeting}, {user?.name?.split(' ')[0] ?? 'Tim'}</span>
                                            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,.5)' }} />
                                            <span>{currentDateLabel}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>{activeTabLabel}</span>
                                            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,.5)' }} />
                                            <span>{currentDateLabel}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {isDesktop && (
                                <button style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 14,
                                    border: headerActionBorder,
                                    background: headerActionBackground,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: headerActionColor,
                                    boxShadow: headerActionShadow,
                                }}>
                                    <Bell size={16} />
                                </button>
                            )}
                            <button
                                onClick={toggleTheme}
                                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                                style={{
                                    width: isDesktop ? 40 : 36,
                                    height: isDesktop ? 40 : 36,
                                    borderRadius: isDesktop ? 14 : 12,
                                    border: headerActionBorder,
                                    background: headerActionBackground,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: headerActionColor,
                                    boxShadow: headerActionShadow,
                                }}
                            >
                                {isDark
                                    ? <Sun size={isDesktop ? 16 : 15} color={T.gold} />
                                    : <Moon size={isDesktop ? 16 : 15} color="#0A4E87" />}
                            </button>
                            <button
                                onClick={() => setShowLogout(true)}
                                aria-label="Open logout dialog"
                                style={{
                                    width: isDesktop ? 40 : 36,
                                    height: isDesktop ? 40 : 36,
                                    borderRadius: isDesktop ? 14 : 12,
                                    border: headerActionBorder,
                                    background: headerActionBackground,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: headerActionColor,
                                    boxShadow: headerActionShadow,
                                }}
                            >
                                <LogOut size={isDesktop ? 16 : 15} />
                            </button>
                        </div>
                    </div>

                    {isDesktop && (
                        <div style={{
                            maxWidth: 820,
                            margin: '14px auto 0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            flexWrap: 'wrap',
                        }}>
                            {tabs.map(tab => {
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        style={{
                                            height: 40,
                                            padding: '0 16px',
                                            borderRadius: 14,
                                            background: isActive
                                                ? 'rgba(255,255,255,.18)'
                                                : 'rgba(255,255,255,.08)',
                                            border: isActive ? '1px solid rgba(255,255,255,.24)' : '1px solid rgba(255,255,255,.12)',
                                            color: '#fff',
                                            fontSize: 12,
                                            fontWeight: isActive ? 800 : 700,
                                            boxShadow: isActive ? '0 10px 24px rgba(8,49,87,.18)' : 'none',
                                        }}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </header>

                <main style={{
                    position: 'relative',
                    zIndex: 1,
                    maxWidth: 820,
                    margin: '0 auto',
                    padding: isDesktop
                        ? '142px 24px 72px'
                        : '78px 14px calc(108px + env(safe-area-inset-bottom))',
                    minHeight: '100vh',
                }}>
                    {renderContent()}
                </main>
            </div>

            {!isDesktop && <EmployeePwaInstallPrompt T={T} bottomOffset={102} />}
            {!isDesktop && <EmployeeBottomNav active={activeTab} setActive={setActiveTab} T={T} />}

            {showLogout && (
                <>
                    <div
                        onClick={() => setShowLogout(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(2,6,23,.56)',
                            backdropFilter: 'blur(5px)',
                            zIndex: 40,
                        }}
                    />
                    <div style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 41,
                        width: 'min(360px, calc(100vw - 32px))',
                        borderRadius: 28,
                        background: T.card,
                        border: `1px solid ${T.border}`,
                        padding: 28,
                        boxShadow: T.shadow,
                        animation: 'scaleIn .18s ease',
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                width: 58,
                                height: 58,
                                borderRadius: 18,
                                margin: '0 auto 16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: `${T.danger}12`,
                                border: `1px solid ${T.danger}24`,
                            }}>
                                <LogOut size={24} color={T.danger} />
                            </div>
                            <h3 style={{
                                margin: 0,
                                fontFamily: "'Sora', sans-serif",
                                fontSize: 18,
                                fontWeight: 900,
                                color: T.text,
                            }}>
                                Keluar dari portal?
                            </h3>
                            <p style={{
                                margin: '8px 0 0',
                                fontSize: 13,
                                lineHeight: 1.6,
                                color: T.textMuted,
                            }}>
                                Anda akan kembali ke halaman PIN login untuk membuka lagi dashboard, kehadiran, dan riwayat kerja.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                            <button
                                onClick={() => setShowLogout(false)}
                                style={{
                                    flex: 1,
                                    height: 48,
                                    borderRadius: 16,
                                    border: `1px solid ${T.border}`,
                                    background: T.surface,
                                    color: T.text,
                                    fontSize: 14,
                                    fontWeight: 800,
                                }}
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleLogout}
                                style={{
                                    flex: 1,
                                    height: 48,
                                    borderRadius: 16,
                                    border: 'none',
                                    background: `linear-gradient(135deg, ${T.danger}, #F97316)`,
                                    color: '#fff',
                                    fontSize: 14,
                                    fontWeight: 800,
                                    boxShadow: `0 14px 30px ${T.danger}33`,
                                }}
                            >
                                Ya, keluar
                            </button>
                        </div>
                    </div>
                </>
            )}

            <style>{`
                @keyframes scaleIn {
                    from { opacity: 0; transform: translate(-50%, -50%) scale(.94); }
                    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
            `}</style>
        </>
    );
}
