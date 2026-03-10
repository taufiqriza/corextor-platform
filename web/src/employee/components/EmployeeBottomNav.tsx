import { useState, useEffect } from 'react';
import { Home, Clock, ClipboardList, User, type LucideIcon } from 'lucide-react';
import type { Theme } from '@/theme/tokens';

export type EmployeeTabId = 'home' | 'history' | 'report' | 'profile';

interface BottomNavProps {
    active: EmployeeTabId;
    setActive: (tab: EmployeeTabId) => void;
    T: Theme;
}

export function EmployeeBottomNav({ active, setActive, T }: BottomNavProps) {
    const tabs: { id: EmployeeTabId; Ico: LucideIcon; label: string }[] = [
        { id: 'home', Ico: Home, label: 'Beranda' },
        { id: 'history', Ico: Clock, label: 'Riwayat' },
        { id: 'report', Ico: ClipboardList, label: 'Laporan' },
        { id: 'profile', Ico: User, label: 'Profil' },
    ];

    const activeIndex = Math.max(tabs.findIndex(t => t.id === active), 0);
    const navInnerXPadding = 6;

    return (
        <div style={{
            position: 'fixed', bottom: 0, left: '50%',
            transform: 'translateX(-50%)', width: '100%', zIndex: 9000,
            padding: '0 12px 16px',
            paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        }}>
            <nav style={{
                position: 'relative',
                background: 'linear-gradient(135deg, #1E3A5F, #0F2341)',
                backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                borderRadius: 9999, border: '1px solid rgba(255,255,255,0.18)',
                boxShadow: '0 16px 34px rgba(15,35,65,0.45)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 6px 14px', gap: 0,
            }} aria-label="Bottom navigation">
                {/* Active indicator */}
                <div style={{
                    position: 'absolute', left: navInnerXPadding, bottom: 5,
                    width: `calc((100% - ${navInnerXPadding * 2}px) / ${tabs.length})`,
                    transform: `translateX(${activeIndex * 100}%)`,
                    transition: 'transform .38s cubic-bezier(.22,1,.36,1)',
                    pointerEvents: 'none',
                }}>
                    <div style={{
                        width: 20, margin: '0 auto', height: 2, borderRadius: 100,
                        background: 'linear-gradient(90deg, rgba(59,130,246,.98), rgba(147,197,253,.94))',
                        boxShadow: '0 0 8px rgba(59,130,246,.32)',
                    }} />
                </div>

                {tabs.map(tab => {
                    const isActive = active === tab.id;
                    return (
                        <button key={tab.id} onClick={() => setActive(tab.id)}
                            aria-label={tab.label} aria-current={isActive ? 'page' : undefined}
                            style={{
                                flex: 1, display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                background: 'none', border: 'none', cursor: 'pointer',
                                padding: '2px 0', fontFamily: 'inherit', position: 'relative', minWidth: 44,
                            }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: 34, height: 34, borderRadius: 11,
                                background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                                border: isActive ? '1px solid rgba(255,255,255,0.28)' : '1px solid transparent',
                                transition: 'all .28s cubic-bezier(.22,1,.36,1)',
                                transform: isActive ? 'translateY(-1px)' : 'translateY(0)',
                            }}>
                                <tab.Ico size={17} color={isActive ? '#fff' : 'rgba(255,255,255,0.65)'} strokeWidth={isActive ? 2.1 : 1.8} />
                            </div>
                            <span style={{
                                fontSize: 10, fontWeight: isActive ? 800 : 600,
                                color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                                marginTop: 4, transition: 'all .25s',
                            }}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
