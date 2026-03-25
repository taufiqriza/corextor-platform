import { useMemo, useState, type CSSProperties } from 'react';
import {
    Building2,
    ClipboardList,
    FileText,
    MapPin,
    Package,
    ShieldCheck,
    Users,
} from 'lucide-react';
import { CompanyAttendancePanel } from '@/company/panels/CompanyAttendancePanel';
import { CompanyBranchPanel } from '@/company/panels/CompanyBranchPanel';
import { CompanyEmployeePanel } from '@/company/panels/CompanyEmployeePanel';
import { CompanyReportPanel } from '@/company/panels/CompanyReportPanel';
import type { Theme } from '@/theme/tokens';

type WorkspaceTab = 'attendance' | 'employees' | 'locations' | 'reports';

interface Props {
    T: Theme;
    isDesktop: boolean;
    companyId: number;
    companyName: string;
    hasAttendance: boolean;
    onGoToSubscriptions: () => void;
}

export function AdminCompanyAttendanceWorkspace({
    T,
    isDesktop,
    companyId,
    companyName,
    hasAttendance,
    onGoToSubscriptions,
}: Props) {
    const [activeTab, setActiveTab] = useState<WorkspaceTab>('attendance');

    const tabs = useMemo(() => ([
        { key: 'attendance' as WorkspaceTab, label: 'Kehadiran', icon: ClipboardList },
        { key: 'employees' as WorkspaceTab, label: 'User Absensi', icon: Users },
        { key: 'locations' as WorkspaceTab, label: 'Lokasi', icon: MapPin },
        { key: 'reports' as WorkspaceTab, label: 'Laporan', icon: FileText },
    ]), []);

    const sectionStyle: CSSProperties = {
        background: `linear-gradient(180deg, ${T.card} 0%, ${T.bgAlt} 100%)`,
        border: `1px solid ${T.border}`,
        borderRadius: 20,
        padding: isDesktop ? 18 : 14,
        boxShadow: T.shadowSm,
    };

    if (!hasAttendance) {
        return (
            <section style={sectionStyle}>
                <div style={{ display: 'grid', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 42,
                            height: 42,
                            borderRadius: 14,
                            background: `${T.primary}14`,
                            color: T.primary,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Package size={18} />
                        </div>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>
                                Attendance Workspace
                            </div>
                            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>
                                Workspace attendance hanya aktif saat company memiliki subscription Attendance.
                            </div>
                        </div>
                    </div>

                    <div style={{
                        borderRadius: 18,
                        border: `1px solid ${T.border}`,
                        background: T.bgAlt,
                        padding: isDesktop ? 18 : 14,
                        display: 'grid',
                        gap: 12,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                                width: 36,
                                height: 36,
                                borderRadius: 12,
                                background: `${T.info}14`,
                                color: T.info,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <Building2 size={16} />
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>
                                    {companyName}
                                </div>
                                <div style={{ fontSize: 11, color: T.textMuted }}>
                                    Company ini belum memiliki entitlement Attendance aktif.
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexDirection: isDesktop ? 'row' : 'column' }}>
                            <div style={{
                                fontSize: 12,
                                color: T.textSub,
                                lineHeight: 1.6,
                                padding: '12px 14px',
                                borderRadius: 14,
                                background: T.card,
                                border: `1px solid ${T.border}`,
                                flex: 1,
                            }}>
                                Superadmin tetap mengelola attendance dalam konteks company. Aktifkan produk lebih dulu agar data
                                lokasi, user absensi, kehadiran, dan laporan bisa dibuka dari sini.
                            </div>
                            <button
                                type="button"
                                onClick={onGoToSubscriptions}
                                style={{
                                    height: 42,
                                    borderRadius: 12,
                                    border: 'none',
                                    background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`,
                                    color: '#fff',
                                    fontSize: 12,
                                    fontWeight: 800,
                                    padding: '0 16px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                <ShieldCheck size={14} />
                                Kelola Subscription
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <div style={{ display: 'grid', gap: 14 }}>
            <section style={sectionStyle}>
                <div style={{ display: 'flex', alignItems: isDesktop ? 'center' : 'flex-start', justifyContent: 'space-between', gap: 12, flexDirection: isDesktop ? 'row' : 'column' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: 11,
                                background: `${T.primary}16`,
                                color: T.primary,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <ShieldCheck size={15} />
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>
                                Attendance Workspace
                            </div>
                        </div>
                        <div style={{ fontSize: 12, color: T.textMuted, marginTop: 6 }}>
                            Semua operasi attendance dijalankan dalam konteks <strong style={{ color: T.text }}>{companyName}</strong>.
                        </div>
                    </div>

                    <div style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        color: T.primary,
                        background: `${T.primary}12`,
                        border: `1px solid ${T.primary}28`,
                        padding: '6px 10px',
                        borderRadius: 999,
                    }}>
                        Company #{companyId}
                    </div>
                </div>

                <div style={{
                    marginTop: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexWrap: 'wrap',
                    background: T.card,
                    padding: 6,
                    borderRadius: 14,
                    border: `1px solid ${T.border}`,
                }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                height: 38,
                                padding: '0 14px',
                                borderRadius: 11,
                                border: 'none',
                                background: activeTab === tab.key ? `${T.primary}14` : 'transparent',
                                color: activeTab === tab.key ? T.primary : T.textMuted,
                                fontSize: 12,
                                fontWeight: activeTab === tab.key ? 800 : 700,
                            }}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </section>

            {activeTab === 'attendance' && (
                <CompanyAttendancePanel T={T} isDesktop={isDesktop} companyContextId={companyId} />
            )}
            {activeTab === 'employees' && (
                <CompanyEmployeePanel T={T} isDesktop={isDesktop} companyContextId={companyId} />
            )}
            {activeTab === 'locations' && (
                <CompanyBranchPanel T={T} isDesktop={isDesktop} companyContextId={companyId} />
            )}
            {activeTab === 'reports' && (
                <CompanyReportPanel T={T} isDesktop={isDesktop} companyContextId={companyId} />
            )}
        </div>
    );
}
