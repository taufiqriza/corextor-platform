import { useEffect, useState } from 'react';
import { Building2, Clock, ClipboardList, Loader2, TrendingUp, UserCheck, Users } from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { attendanceApi } from '@/api/platform.api';

interface Props { T: Theme; isDesktop: boolean; onNavigate: (key: string) => void; }

export function CompanyDashboardPanel({ T, isDesktop, onNavigate }: Props) {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ employees: 0, branches: 0, todayPresent: 0, todayTotal: 0 });
    const [recentRecords, setRecentRecords] = useState<any[]>([]);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const [usersRes, branchRes, reportRes] = await Promise.allSettled([
                    attendanceApi.getUsers(),
                    attendanceApi.getBranches(),
                    attendanceApi.getReport({ from: new Date().toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] }),
                ]);
                const users = usersRes.status === 'fulfilled' ? (usersRes.value.data?.data ?? []) : [];
                const branches = branchRes.status === 'fulfilled' ? (branchRes.value.data?.data ?? []) : [];
                const reportData = reportRes.status === 'fulfilled' ? (reportRes.value.data?.data ?? {}) : {};
                const records = reportData.records ?? [];
                setStats({
                    employees: Array.isArray(users) ? users.length : 0,
                    branches: Array.isArray(branches) ? branches.length : 0,
                    todayPresent: records.filter((r: any) => r.time_in).length,
                    todayTotal: records.length,
                });
                setRecentRecords(records.slice(0, 5));
            } catch {}
            finally { setLoading(false); }
        })();
    }, []);

    const s = {
        statCard: { background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: '14px 16px', cursor: 'pointer', transition: 'all .15s' } as React.CSSProperties,
        section: { background: T.card, border: `1px solid ${T.border}`, borderRadius: 18, padding: isDesktop ? 16 : 12 } as React.CSSProperties,
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60, flexDirection: 'column', gap: 12 }}>
            <Loader2 size={24} color={T.primary} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 12, color: T.textMuted }}>Memuat dashboard...</span>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div style={{ display: 'grid', gap: 14 }}>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(4, 1fr)' : '1fr 1fr', gap: 10 }}>
                {[
                    { label: 'Total Karyawan', value: stats.employees, icon: Users, tone: T.primary, nav: 'employees' },
                    { label: 'Cabang', value: stats.branches, icon: Building2, tone: T.info, nav: 'branches' },
                    { label: 'Hadir Hari Ini', value: stats.todayPresent, icon: UserCheck, tone: T.success, nav: 'attendance' },
                    { label: 'Belum Check-out', value: stats.todayPresent - (recentRecords.filter((r: any) => r.time_out).length), icon: Clock, tone: T.gold, nav: 'attendance' },
                ].map(c => (
                    <div key={c.label} style={s.statCard} onClick={() => onNavigate(c.nav)}
                        onMouseEnter={e => e.currentTarget.style.borderColor = c.tone}
                        onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: T.textMuted }}>{c.label}</span>
                            <c.icon size={14} color={c.tone} />
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: T.text, marginTop: 8, fontFamily: "'Sora', sans-serif" }}>{c.value}</div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <section style={s.section}>
                <div style={{ fontSize: 15, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif", marginBottom: 12 }}>Aksi Cepat</div>
                <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : '1fr', gap: 8 }}>
                    {[
                        { label: 'Kelola Karyawan', desc: 'Tambah, edit, atau hapus karyawan', icon: Users, tone: T.primary, nav: 'employees' },
                        { label: 'Lihat Kehadiran', desc: 'Pantau absensi hari ini secara realtime', icon: ClipboardList, tone: T.success, nav: 'attendance' },
                        { label: 'Buka Laporan', desc: 'Rekap kehadiran bulanan', icon: TrendingUp, tone: T.info, nav: 'report' },
                    ].map(a => (
                        <button key={a.label} onClick={() => onNavigate(a.nav)} style={{
                            padding: 14, borderRadius: 14, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
                            background: `${a.tone}08`, border: `1px solid ${a.tone}20`, cursor: 'pointer', transition: 'all .15s',
                        }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${a.tone}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <a.icon size={16} color={a.tone} />
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{a.label}</div>
                                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{a.desc}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </section>

            {/* Recent Attendance */}
            <section style={s.section}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>Kehadiran Hari Ini</div>
                    <button onClick={() => onNavigate('attendance')} style={{ fontSize: 11, color: T.primary, fontWeight: 700 }}>Lihat Semua →</button>
                </div>
                {recentRecords.length === 0 ? (
                    <div style={{ padding: 28, textAlign: 'center', color: T.textMuted, fontSize: 12 }}>Belum ada data kehadiran hari ini.</div>
                ) : (
                    <div style={{ display: 'grid', gap: 6 }}>
                        {recentRecords.map((r: any) => (
                            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, background: T.bgAlt }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: 10, background: `${T.primary}14`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 12, fontWeight: 900, color: T.primary,
                                }}>{(r.employee_name ?? 'U').charAt(0)}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{r.employee_name ?? 'Unknown'}</div>
                                    <div style={{ fontSize: 10, color: T.textMuted }}>{r.branch_name ?? '-'}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: T.success, fontFamily: "'JetBrains Mono', monospace" }}>{r.time_in ?? '—'}</div>
                                    {r.time_out ? (
                                        <div style={{ fontSize: 10, color: T.info }}>{r.time_out}</div>
                                    ) : (
                                        <div style={{ fontSize: 9, color: T.gold, fontWeight: 700 }}>ONGOING</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
