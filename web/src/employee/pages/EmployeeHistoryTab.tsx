import { useEffect, useState, useCallback } from 'react';
import {
    Clock, Loader2, CheckCircle2, AlertCircle, Calendar,
    ChevronDown, Filter, Fingerprint, LogOut as LogOutIcon,
} from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { attendanceApi } from '@/api/platform.api';

interface Props { T: Theme; isDesktop: boolean; }

export function EmployeeHistoryTab({ T }: Props) {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterMonth, setFilterMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [showFilter, setShowFilter] = useState(false);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const [year, month] = filterMonth.split('-').map(Number);
            const from = `${year}-${String(month).padStart(2, '0')}-01`;
            const lastDay = new Date(year, month, 0).getDate();
            const to = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
            const res = await attendanceApi.getHistory({ from, to });
            setRecords(res.data?.data ?? []);
        } catch { setRecords([]); }
        setLoading(false);
    }, [filterMonth]);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    const totalDays = records.length;
    const completeDays = records.filter((r: any) => r.time_out).length;
    const activeDays = totalDays - completeDays;
    const completionRate = totalDays > 0 ? Math.round((completeDays / totalDays) * 100) : 0;

    const monthLabel = (() => {
        const [y, m] = filterMonth.split('-').map(Number);
        return new Date(y, m - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    })();

    // Generate month options (last 6 months)
    const monthOptions = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        return { val, label };
    });

    const card = (extra?: React.CSSProperties): React.CSSProperties => ({
        background: T.card, borderRadius: 20, border: `1px solid ${T.border}`, ...extra,
    });

    const formatDay = (dateStr: string) => {
        const d = new Date(dateStr + 'T00:00:00');
        return {
            day: d.toLocaleDateString('id-ID', { weekday: 'short' }),
            num: d.getDate(),
        };
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 80, flexDirection: 'column', gap: 12 }}>
            <Loader2 size={24} color={T.primary} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 12, color: T.textMuted }}>Memuat riwayat...</span>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>
                        Riwayat Absensi
                    </h2>
                    <p style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Catatan kehadiran Anda.</p>
                </div>
                <button onClick={() => setShowFilter(!showFilter)} style={{
                    height: 36, padding: '0 14px', borderRadius: 12,
                    border: `1px solid ${T.border}`, background: T.bgAlt ?? T.surface,
                    color: T.text, fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 6,
                }}>
                    <Filter size={13} /> {monthLabel}
                    <ChevronDown size={12} style={{ transform: showFilter ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
                </button>
            </div>

            {/* Month Filter */}
            {showFilter && (
                <div style={{
                    ...card({ padding: 10, marginBottom: 14 }),
                    display: 'flex', gap: 6, flexWrap: 'wrap', animation: 'fadeUp .2s ease',
                }}>
                    {monthOptions.map(opt => (
                        <button key={opt.val} onClick={() => { setFilterMonth(opt.val); setShowFilter(false); }}
                            style={{
                                padding: '8px 14px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                                background: filterMonth === opt.val ? `${T.primary}12` : T.bgAlt ?? T.surface,
                                border: filterMonth === opt.val ? `1.5px solid ${T.primary}35` : `1px solid ${T.border}`,
                                color: filterMonth === opt.val ? T.primary : T.textMuted,
                            }}>
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Stats Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                {[
                    { label: 'Total Hari', value: totalDays, color: T.primary, icon: Calendar },
                    { label: 'Lengkap', value: completeDays, color: T.success, icon: CheckCircle2 },
                    { label: 'Aktif', value: activeDays, color: T.gold, icon: AlertCircle },
                ].map(stat => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} style={{
                            ...card({ padding: '14px 10px', textAlign: 'center' }),
                        }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: 9, margin: '0 auto 6px',
                                background: `${stat.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Icon size={13} color={stat.color} />
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>
                                {stat.value}
                            </div>
                            <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, marginTop: 2 }}>{stat.label}</div>
                        </div>
                    );
                })}
            </div>

            {/* Completion Rate */}
            <div style={{ ...card({ padding: '14px 18px', marginBottom: 16 }) }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.textMuted }}>Tingkat Penyelesaian</span>
                    <span style={{ fontSize: 16, fontWeight: 900, color: T.primary, fontFamily: "'Sora', sans-serif" }}>
                        {completionRate}%
                    </span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: T.surface, overflow: 'hidden' }}>
                    <div style={{
                        height: '100%', borderRadius: 3, transition: 'width .6s ease',
                        width: `${completionRate}%`,
                        background: completionRate >= 80
                            ? `linear-gradient(90deg, ${T.success}, #4ADE80)`
                            : completionRate >= 50
                            ? `linear-gradient(90deg, ${T.gold}, #FBBF24)`
                            : `linear-gradient(90deg, ${T.danger}, #F87171)`,
                    }} />
                </div>
            </div>

            {/* Records Timeline */}
            {records.length === 0 ? (
                <div style={{ ...card({ padding: 48 }), textAlign: 'center' }}>
                    <div style={{
                        width: 56, height: 56, margin: '0 auto 16px', borderRadius: '50%',
                        background: `${T.primary}08`, border: `2px solid ${T.primary}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Clock size={24} color={T.primary} style={{ opacity: .4 }} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>Belum Ada Riwayat</div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginTop: 6, lineHeight: 1.6 }}>
                        Belum ada catatan kehadiran untuk<br />{monthLabel}.
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {records.map((r: any, i: number) => {
                        const isComplete = Boolean(r.time_out);
                        const dayInfo = formatDay(r.date);
                        return (
                            <div key={r.id ?? i} style={{
                                ...card({ padding: 0, overflow: 'hidden' }),
                                display: 'flex',
                            }}>
                                {/* Date column */}
                                <div style={{
                                    width: 60, flexShrink: 0,
                                    background: isComplete ? `${T.success}06` : `${T.gold}06`,
                                    borderRight: `1px solid ${T.border}`,
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    padding: '12px 0',
                                }}>
                                    <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase' }}>
                                        {dayInfo.day}
                                    </div>
                                    <div style={{
                                        fontSize: 22, fontWeight: 900, color: T.text,
                                        fontFamily: "'Sora', sans-serif", lineHeight: 1,
                                    }}>
                                        {dayInfo.num}
                                    </div>
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ flex: 1 }}>
                                        {/* Time chips */}
                                        <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Fingerprint size={11} color={T.success} />
                                                <span style={{ fontSize: 12, fontWeight: 800, color: T.success }}>
                                                    {r.time_in ?? '—'}
                                                </span>
                                            </div>
                                            <span style={{ color: T.textMuted, fontSize: 11 }}>→</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <LogOutIcon size={11} color={r.time_out ? T.info : T.textMuted} />
                                                <span style={{
                                                    fontSize: 12, fontWeight: 800,
                                                    color: r.time_out ? T.info : T.textMuted,
                                                }}>
                                                    {r.time_out ?? '—'}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: 10, color: T.textMuted }}>
                                            {r.date}
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <span style={{
                                        fontSize: 9, fontWeight: 800, padding: '4px 10px', borderRadius: 8,
                                        background: isComplete ? `${T.success}12` : `${T.gold}12`,
                                        color: isComplete ? T.success : T.gold,
                                        border: `1px solid ${isComplete ? `${T.success}25` : `${T.gold}25`}`,
                                    }}>
                                        {isComplete ? '✓ Selesai' : '● Aktif'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
