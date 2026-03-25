import { Clock3, Compass, FileText, Home, User, type LucideIcon } from 'lucide-react';
import type { Theme } from '@/theme/tokens';

export type EmployeeTabId = 'home' | 'attendance' | 'history' | 'report' | 'profile';

interface BottomNavProps {
    active: EmployeeTabId;
    setActive: (tab: EmployeeTabId) => void;
    T: Theme;
}

const leftTabs: { id: EmployeeTabId; Ico: LucideIcon; label: string }[] = [
    { id: 'home', Ico: Home, label: 'Beranda' },
    { id: 'history', Ico: Clock3, label: 'Riwayat' },
];

const rightTabs: { id: EmployeeTabId; Ico: LucideIcon; label: string }[] = [
    { id: 'report', Ico: FileText, label: 'Laporan' },
    { id: 'profile', Ico: User, label: 'Profil' },
];

export function EmployeeBottomNav({ active, setActive }: BottomNavProps) {
    const attendanceActive = active === 'attendance';
    const navBlue = 'linear-gradient(180deg, #0F5FA6 0%, #176DAE 42%, #1B74B6 100%)';
    const buttonBlue = attendanceActive
        ? 'linear-gradient(180deg, #0B4E85 0%, #1567A7 100%)'
        : 'linear-gradient(180deg, #0F5FA6 0%, #1B74B6 100%)';

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 9000,
            padding: '0 14px 12px',
            paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        }}>
            <div style={{
                position: 'relative',
                maxWidth: 460,
                margin: '0 auto',
            }}>
                <nav style={{
                    position: 'relative',
                    background: navBlue,
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    borderRadius: 999,
                    border: '1px solid rgba(255,255,255,.14)',
                    boxShadow: '0 10px 22px rgba(8,49,87,.12)',
                    padding: '7px 10px calc(7px + env(safe-area-inset-bottom))',
                    minHeight: 64,
                }} aria-label="Bottom navigation">
                    <div style={{
                        position: 'absolute',
                        inset: '1px 1px auto 1px',
                        height: 12,
                        borderRadius: 999,
                        background: 'linear-gradient(180deg, rgba(255,255,255,.1), rgba(255,255,255,0))',
                        pointerEvents: 'none',
                    }} />

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 72px 1fr 1fr',
                        alignItems: 'center',
                        justifyItems: 'center',
                        gap: 0,
                    }}>
                        {leftTabs.map(tab => renderSecondaryTab(tab, active, setActive))}

                        <div style={{
                            position: 'relative',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'flex-end',
                        }}>
                            <button
                                onClick={() => setActive('attendance')}
                                aria-label="Attendance"
                                aria-current={attendanceActive ? 'page' : undefined}
                                style={{
                                    position: 'relative',
                                    width: 58,
                                    height: 58,
                                    borderRadius: 999,
                                    border: attendanceActive
                                        ? '2px solid rgba(255,255,255,.2)'
                                        : '1.5px solid rgba(255,255,255,.16)',
                                    background: buttonBlue,
                                    color: '#fff',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 2,
                                    transform: 'translateY(-10px)',
                                    boxShadow: 'none',
                                    transition: 'transform .22s ease, background .22s ease, border-color .22s ease',
                                }}
                            >
                                <div style={{
                                    position: 'absolute',
                                    inset: 4,
                                    borderRadius: 999,
                                    background: 'linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.01))',
                                    pointerEvents: 'none',
                                }} />
                                <Compass size={18} strokeWidth={2.25} style={{ position: 'relative' }} />
                                <span style={{
                                    position: 'relative',
                                    fontSize: 7.8,
                                    fontWeight: 900,
                                    letterSpacing: .18,
                                    textTransform: 'uppercase',
                                    lineHeight: 1,
                                }}>
                                    Absen
                                </span>
                            </button>
                        </div>

                        {rightTabs.map(tab => renderSecondaryTab(tab, active, setActive))}
                    </div>
                </nav>
            </div>
        </div>
    );
}

function renderSecondaryTab(
    tab: { id: EmployeeTabId; Ico: LucideIcon; label: string },
    active: EmployeeTabId,
    setActive: (tab: EmployeeTabId) => void,
) {
    const isActive = active === tab.id;
    const Icon = tab.Ico;

    return (
        <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
            style={{
                width: '100%',
                minHeight: 44,
                border: 'none',
                background: 'transparent',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                color: isActive ? '#FFFFFF' : 'rgba(255,255,255,.78)',
                transition: 'transform .2s ease, color .2s ease, opacity .2s ease',
                transform: isActive ? 'translateY(-1px)' : 'translateY(0)',
                opacity: isActive ? 1 : .96,
            }}
        >
            <div style={{
                width: 30,
                height: 30,
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isActive
                    ? 'linear-gradient(180deg, rgba(255,255,255,.15) 0%, rgba(255,255,255,.08) 100%)'
                    : 'transparent',
                border: isActive ? '1px solid rgba(255,255,255,.16)' : '1px solid transparent',
            }}>
                <Icon size={16} strokeWidth={isActive ? 2.15 : 1.9} />
            </div>
            <span style={{
                fontSize: 8,
                fontWeight: isActive ? 800 : 650,
                lineHeight: 1,
                letterSpacing: isActive ? -.15 : 0,
            }}>
                {tab.label}
            </span>
        </button>
    );
}
