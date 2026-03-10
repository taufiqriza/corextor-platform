import { useEffect, useState } from 'react';
import { Clock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { attendanceApi } from '@/api/platform.api';

interface Props { T: Theme; isDesktop: boolean; }

export function EmployeeHistoryTab({ T, isDesktop }: Props) {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        attendanceApi.getHistory()
            .then(res => setRecords(res.data?.data ?? []))
            .catch(() => setRecords([]))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60, flexDirection: 'column', gap: 12 }}>
            <Loader2 size={24} color={T.primary} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 12, color: T.textMuted }}>Memuat riwayat...</span>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: isDesktop ? 22 : 18, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>Riwayat Absensi</h2>
                <p style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Catatan kehadiran Anda.</p>
            </div>

            {records.length === 0 ? (
                <div style={{
                    background: `linear-gradient(145deg, ${T.primary}12, ${T.card})`,
                    borderRadius: 20, padding: 32, border: `1px solid ${T.primary}25`, textAlign: 'center',
                }}>
                    <div style={{ width: 56, height: 56, margin: '0 auto 14px', borderRadius: '50%', background: `${T.primary}15`, border: `2px solid ${T.primary}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Clock size={24} color={T.primary} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>Belum Ada Riwayat</div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginTop: 6, lineHeight: 1.6 }}>
                        Belum ada catatan kehadiran. Lakukan check-in pertama Anda!
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {records.map((r: any, i: number) => {
                        const isComplete = Boolean(r.time_out);
                        return (
                            <div key={r.id ?? i} style={{
                                background: T.card, borderRadius: 16, border: `1px solid ${T.border}`,
                                padding: 16, display: 'flex', alignItems: 'center', gap: 14,
                            }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                                    background: isComplete ? `${T.success}15` : `${T.gold}15`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {isComplete ? <CheckCircle2 size={20} color={T.success} /> : <AlertCircle size={20} color={T.gold} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{r.date}</div>
                                    <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 11, color: T.textMuted }}>
                                        <span>In: <span style={{ fontWeight: 700, color: T.success }}>{r.time_in ?? '—'}</span></span>
                                        <span>Out: <span style={{ fontWeight: 700, color: T.info }}>{r.time_out ?? '—'}</span></span>
                                    </div>
                                </div>
                                <span style={{
                                    fontSize: 9, fontWeight: 800, padding: '4px 8px', borderRadius: 8,
                                    background: isComplete ? `${T.success}15` : `${T.gold}15`,
                                    color: isComplete ? T.success : T.gold,
                                }}>{isComplete ? 'Selesai' : 'Aktif'}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
