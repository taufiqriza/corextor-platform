import { useEffect, useState } from 'react';
import { BarChart3, Loader2, CalendarDays, TrendingUp } from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { attendanceApi } from '@/api/platform.api';

interface Props { T: Theme; isDesktop: boolean; }

export function EmployeeReportTab({ T, isDesktop }: Props) {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        attendanceApi.getHistory()
            .then(res => setRecords(res.data?.data ?? []))
            .catch(() => setRecords([]))
            .finally(() => setLoading(false));
    }, []);

    const totalDays = records.length;
    const completeDays = records.filter((r: any) => r.time_out).length;
    const inProgressDays = totalDays - completeDays;

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60, flexDirection: 'column', gap: 12 }}>
            <Loader2 size={24} color={T.primary} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 12, color: T.textMuted }}>Menghitung...</span>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div>
            <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: isDesktop ? 22 : 18, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>Laporan Saya</h2>
                <p style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Ringkasan kehadiran Anda.</p>
            </div>

            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                {[
                    { icon: CalendarDays, label: 'Total Hari', value: totalDays, color: T.primary },
                    { icon: TrendingUp, label: 'Lengkap', value: completeDays, color: T.success },
                    { icon: BarChart3, label: 'Ongoing', value: inProgressDays, color: T.gold },
                ].map(stat => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} style={{
                            background: T.card, borderRadius: 16, border: `1px solid ${T.border}`,
                            padding: 16, textAlign: 'center', position: 'relative', overflow: 'hidden',
                        }}>
                            <div style={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, borderRadius: '50%', background: `${stat.color}08` }} />
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                                <Icon size={15} color={stat.color} />
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>{stat.value}</div>
                            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2, fontWeight: 600 }}>{stat.label}</div>
                        </div>
                    );
                })}
            </div>

            {/* Attendance rate */}
            <div style={{
                background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16,
            }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: .5 }}>Tingkat Kehadiran</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ fontSize: 32, fontWeight: 900, color: T.primary, fontFamily: "'Sora', sans-serif" }}>
                        {totalDays > 0 ? Math.round((completeDays / totalDays) * 100) : 0}%
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            height: 8, borderRadius: 4, background: T.surface, overflow: 'hidden',
                        }}>
                            <div style={{
                                height: '100%', borderRadius: 4,
                                width: totalDays > 0 ? `${(completeDays / totalDays) * 100}%` : '0%',
                                background: `linear-gradient(90deg, ${T.primary}, ${T.info})`,
                                transition: 'width .6s ease',
                            }} />
                        </div>
                        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>
                            {completeDays} dari {totalDays} hari check-out lengkap
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent list */}
            <div style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: .5 }}>
                5 Hari Terakhir
            </div>
            {records.slice(0, 5).map((r: any, i: number) => (
                <div key={r.id ?? i} style={{
                    background: T.card, borderRadius: 12, border: `1px solid ${T.border}`,
                    padding: '12px 14px', marginBottom: 6,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{r.date}</span>
                    <div style={{ display: 'flex', gap: 10, fontSize: 11, color: T.textMuted }}>
                        <span>{r.time_in ?? '—'}</span>
                        <span style={{ color: T.border }}>→</span>
                        <span>{r.time_out ?? '—'}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
