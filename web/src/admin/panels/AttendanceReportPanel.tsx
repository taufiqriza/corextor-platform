import { Loader2, Clock, CheckCircle2, XCircle } from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { useEffect, useState } from 'react';
import { attendanceApi } from '@/api/platform.api';

interface Props { T: Theme; isDesktop: boolean; }

export function AttendanceReportPanel({ T, isDesktop }: Props) {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        attendanceApi.getReport().then(res => setRecords(res.data?.data ?? [])).finally(() => setLoading(false));
    }, []);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={24} color={T.primary} style={{ animation: 'spin 1s linear infinite' }} /></div>;

    return (
        <div>
            <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 16 }}>{records.length} records</div>

            {isDesktop ? (
                <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                                {['Karyawan', 'Tanggal', 'Check-in', 'Check-out', 'Status'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: T.textMuted, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((r: any) => (
                                <tr key={r.id} style={{ borderBottom: `1px solid ${T.border}20` }}>
                                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: T.text }}>{r.employee_name ?? `User #${r.attendance_user_id}`}</td>
                                    <td style={{ padding: '12px 16px', fontSize: 12, color: T.textSub }}>{r.date}</td>
                                    <td style={{ padding: '12px 16px', fontSize: 12, color: r.time_in ? T.success : T.textMuted }}>{r.time_in ?? '—'}</td>
                                    <td style={{ padding: '12px 16px', fontSize: 12, color: r.time_out ? T.info : T.textMuted }}>{r.time_out ?? '—'}</td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{
                                            fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                                            background: r.time_out ? `${T.success}15` : `${T.gold}15`,
                                            color: r.time_out ? T.success : T.gold,
                                        }}>{r.time_out ? 'Complete' : 'In Progress'}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {records.length === 0 && (
                        <div style={{ padding: 24, textAlign: 'center', color: T.textMuted, fontSize: 13 }}>Belum ada data kehadiran.</div>
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {records.map((r: any) => (
                        <div key={r.id} style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{r.employee_name ?? `User #${r.attendance_user_id}`}</div>
                                <span style={{
                                    fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
                                    background: r.time_out ? `${T.success}15` : `${T.gold}15`,
                                    color: r.time_out ? T.success : T.gold,
                                }}>{r.time_out ? 'Complete' : 'In Progress'}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 16, fontSize: 11, color: T.textSub }}>
                                <span>{r.date}</span>
                                <span style={{ color: T.success }}>{r.time_in ? `In: ${r.time_in}` : ''}</span>
                                <span style={{ color: T.info }}>{r.time_out ? `Out: ${r.time_out}` : ''}</span>
                            </div>
                        </div>
                    ))}
                    {records.length === 0 && (
                        <div style={{ padding: 24, color: T.textMuted, fontSize: 13, textAlign: 'center' }}>Belum ada data kehadiran.</div>
                    )}
                </div>
            )}
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
