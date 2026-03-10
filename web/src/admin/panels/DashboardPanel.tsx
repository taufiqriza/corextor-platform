import { useEffect, useState } from 'react';
import { Building2, Users, Package, TrendingUp, Activity, Clock, MapPin, AlertCircle } from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { platformApi, attendanceApi } from '@/api/platform.api';
import { useAuthStore } from '@/store/authStore';

interface Props { T: Theme; isDesktop: boolean; }

export function DashboardPanel({ T, isDesktop }: Props) {
    const user = useAuthStore(s => s.user);
    const isSuperAdmin = user?.role === 'super_admin';
    const hasAttendance = user?.active_products?.includes('attendance');
    const [stats, setStats] = useState({ companies: 0, products: 0, branches: 0, attUsers: 0, todayRecords: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const promises: Promise<any>[] = [];

        if (isSuperAdmin) {
            promises.push(platformApi.getCompanies().catch(() => ({ data: { data: { total: 0 } } })));
            promises.push(platformApi.getProducts().catch(() => ({ data: { data: [] } })));
        }

        if (hasAttendance) {
            promises.push(attendanceApi.getBranches().catch(() => ({ data: { data: [] } })));
            promises.push(attendanceApi.getUsers().catch(() => ({ data: { data: [] } })));
            promises.push(attendanceApi.getReport().catch(() => ({ data: { data: [] } })));
        }

        Promise.all(promises).then(results => {
            let idx = 0;
            const newStats = { ...stats };

            if (isSuperAdmin) {
                newStats.companies = results[idx]?.data?.data?.total ?? results[idx]?.data?.data?.length ?? 0;
                idx++;
                newStats.products = Array.isArray(results[idx]?.data?.data) ? results[idx].data.data.length : 0;
                idx++;
            }

            if (hasAttendance) {
                newStats.branches = Array.isArray(results[idx]?.data?.data) ? results[idx].data.data.length : 0;
                idx++;
                newStats.attUsers = Array.isArray(results[idx]?.data?.data) ? results[idx].data.data.length : 0;
                idx++;
                newStats.todayRecords = Array.isArray(results[idx]?.data?.data) ? results[idx].data.data.length : 0;
                idx++;
            }

            setStats(newStats);
        }).finally(() => setLoading(false));
    }, [isSuperAdmin, hasAttendance]);

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Selamat Pagi';
        if (h < 15) return 'Selamat Siang';
        if (h < 18) return 'Selamat Sore';
        return 'Selamat Malam';
    };

    const statCards = [
        ...(isSuperAdmin ? [
            { label: 'Companies', value: stats.companies, icon: Building2, color: T.primary, desc: 'Total tenant terdaftar' },
            { label: 'Products', value: stats.products, icon: Package, color: T.info, desc: 'Produk aktif di platform' },
        ] : []),
        ...(hasAttendance ? [
            { label: 'Branches', value: stats.branches, icon: MapPin, color: T.success, desc: 'Cabang terdaftar' },
            { label: 'Att. Users', value: stats.attUsers, icon: Users, color: '#A855F7', desc: 'Karyawan terdaftar absensi' },
            { label: 'Today', value: stats.todayRecords, icon: Clock, color: T.gold, desc: 'Record kehadiran hari ini' },
        ] : []),
    ];

    const quickInfo = [
        { label: 'Role', value: isSuperAdmin ? 'Super Admin' : (user?.role ?? '-'), color: T.primary },
        { label: 'Active Products', value: user?.active_products?.join(', ') || 'None', color: T.success },
    ];

    return (
        <div>
            {/* Welcome banner */}
            <div style={{
                background: `linear-gradient(135deg, #1E3A5F, #0F2341)`,
                borderRadius: 18, padding: isDesktop ? '28px 32px' : '22px 18px',
                marginBottom: 20, position: 'relative', overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(59,130,246,.12)' }} />
                <div style={{ position: 'absolute', bottom: -20, right: 60, width: 80, height: 80, borderRadius: '50%', background: 'rgba(96,165,250,.08)' }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <Activity size={14} color="#60A5FA" />
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#93C5FD' }}>{greeting()}</span>
                    </div>
                    <h2 style={{ fontSize: isDesktop ? 22 : 18, fontWeight: 900, color: '#fff', fontFamily: "'Sora', sans-serif", marginBottom: 6 }}>
                        {user?.name ?? 'Admin'}
                    </h2>
                    <p style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.6, maxWidth: 500 }}>
                        {isSuperAdmin
                            ? 'Anda masuk sebagai Super Admin. Kelola semua company, subscription, dan produk platform dari dashboard ini.'
                            : `Anda masuk sebagai ${user?.role ?? 'admin'}. Kelola operasi perusahaan Anda dari sini.`
                        }
                    </p>
                </div>
            </div>

            {/* Quick Info badges */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                {quickInfo.map(info => (
                    <div key={info.label} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 14px', borderRadius: 10,
                        background: T.card, border: `1px solid ${T.border}`,
                    }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase' }}>{info.label}:</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: info.color, textTransform: 'capitalize' }}>{info.value}</span>
                    </div>
                ))}
            </div>

            {/* Stat cards */}
            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? `repeat(${Math.min(statCards.length || 3, 5)}, 1fr)` : 'repeat(2, 1fr)', gap: isDesktop ? 14 : 10, marginBottom: 20 }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="cx-skeleton" style={{ height: 110, borderRadius: 16 }} />
                    ))}
                </div>
            ) : statCards.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? `repeat(${Math.min(statCards.length, 5)}, 1fr)` : 'repeat(2, 1fr)', gap: isDesktop ? 14 : 10, marginBottom: 20 }}>
                    {statCards.map(card => {
                        const Icon = card.icon;
                        return (
                            <div key={card.label} style={{
                                background: T.card, borderRadius: 16, border: `1px solid ${T.border}`,
                                padding: isDesktop ? 20 : 16, transition: 'all .2s',
                                position: 'relative', overflow: 'hidden',
                            }}>
                                <div style={{ position: 'absolute', top: -12, right: -12, width: 56, height: 56, borderRadius: '50%', background: `${card.color}08` }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, position: 'relative' }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Icon size={16} color={card.color} />
                                    </div>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: .5 }}>{card.label}</span>
                                </div>
                                <div style={{ fontSize: isDesktop ? 26 : 20, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif", position: 'relative' }}>
                                    {card.value}
                                </div>
                                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>{card.desc}</div>
                            </div>
                        );
                    })}
                </div>
            ) : null}

            {/* Activity section */}
            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: 14 }}>
                <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, padding: isDesktop ? 22 : 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${T.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TrendingUp size={13} color={T.primary} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Platform Info</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[
                            { label: 'API Version', value: 'v1.0.0' },
                            { label: 'Session', value: 'Active' },
                            { label: 'Environment', value: 'Development' },
                        ].map(item => (
                            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.border}30` }}>
                                <span style={{ fontSize: 12, color: T.textMuted }}>{item.label}</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, padding: isDesktop ? 22 : 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${T.info}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <AlertCircle size={13} color={T.info} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Quick Actions</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[
                            { label: 'Tambah Company', desc: 'Buat tenant baru', color: T.primary },
                            { label: 'Lihat Report', desc: 'Laporan attendance', color: T.success },
                            { label: 'Manage Branches', desc: 'CRUD cabang', color: T.gold },
                        ].map(action => (
                            <div key={action.label} style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '10px 12px', borderRadius: 10,
                                border: `1px solid ${T.border}`, background: T.surface,
                                cursor: 'pointer', transition: 'all .15s ease',
                            }} onMouseEnter={e => e.currentTarget.style.borderColor = `${action.color}40`} onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: action.color, flexShrink: 0 }} />
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{action.label}</div>
                                    <div style={{ fontSize: 10, color: T.textMuted }}>{action.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
