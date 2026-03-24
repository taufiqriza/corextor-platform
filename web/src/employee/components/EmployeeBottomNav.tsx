import { Home, Clock, FileText, User, type LucideIcon } from 'lucide-react';
import type { Theme } from '@/theme/tokens';

export type EmployeeTabId = 'home' | 'history' | 'report' | 'profile';

interface BottomNavProps {
    active: EmployeeTabId;
    setActive: (tab: EmployeeTabId) => void;
    T: Theme;
}

const tabs: { id: EmployeeTabId; Ico: LucideIcon; label: string }[] = [
    { id: 'home', Ico: Home, label: 'Beranda' },
    { id: 'history', Ico: Clock, label: 'Riwayat' },
    { id: 'report', Ico: FileText, label: 'Laporan' },
    { id: 'profile', Ico: User, label: 'Profil' },
];

export function EmployeeBottomNav({ active, setActive, T }: BottomNavProps) {
    return (
        <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9000,
            padding: '0 16px 12px',
            paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        }}>
            <nav style={{
                background: T.card,
                backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                borderRadius: 22, border: `1px solid ${T.border}`,
                boxShadow: `0 -4px 30px rgba(0,0,0,.12), 0 0 0 1px ${T.border}`,
                display: 'flex', justifyContent: 'space-around', alignItems: 'center',
                padding: '6px 4px', height: 68,
            }} aria-label="Bottom navigation">
                {tabs.map(tab => {
                    const isActive = active === tab.id;
                    const Icon = tab.Ico;
                    return (
                        <button key={tab.id} onClick={() => setActive(tab.id)}
                            aria-label={tab.label} aria-current={isActive ? 'page' : undefined}
                            style={{
                                flex: 1, display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                background: 'none', border: 'none', cursor: 'pointer',
                                padding: '4px 0', fontFamily: 'inherit', position: 'relative',
                                transition: 'all .25s cubic-bezier(.22,1,.36,1)',
                            }}>
                            {/* Glow indicator */}
                            {isActive && (
                                <div style={{
                                    position: 'absolute', top: -6, width: 32, height: 3,
                                    borderRadius: 99,
                                    background: `linear-gradient(90deg, ${T.primary}, ${T.info ?? T.primary})`,
                                    boxShadow: `0 0 12px ${T.primary}60`,
                                    animation: 'navGlow .4s ease',
                                }} />
                            )}
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: 38, height: 38, borderRadius: 14,
                                background: isActive ? `${T.primary}12` : 'transparent',
                                border: isActive ? `1.5px solid ${T.primary}30` : '1.5px solid transparent',
                                transition: 'all .25s cubic-bezier(.22,1,.36,1)',
                                transform: isActive ? 'translateY(-2px) scale(1.05)' : 'translateY(0) scale(1)',
                            }}>
                                <Icon size={19}
                                    color={isActive ? T.primary : T.textMuted}
                                    strokeWidth={isActive ? 2.3 : 1.8}
                                    style={{ transition: 'all .25s' }}
                                />
                            </div>
                            <span style={{
                                fontSize: 10, fontWeight: isActive ? 800 : 500,
                                color: isActive ? T.primary : T.textMuted,
                                marginTop: 2, transition: 'all .25s',
                                letterSpacing: isActive ? -.2 : 0,
                            }}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </nav>

            <style>{`
                @keyframes navGlow {
                    from { opacity: 0; width: 0; }
                    to { opacity: 1; width: 32px; }
                }
            `}</style>
        </div>
    );
}
