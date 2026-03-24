import { useState, useEffect, useCallback } from 'react';
import {
    Fingerprint, Clock, CheckCircle2, MapPin, Loader2,
    ArrowRight, Calendar, TrendingUp, Zap, Sun,
} from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { useAuthStore } from '@/store/authStore';
import { attendanceApi } from '@/api/platform.api';

interface Props { T: Theme; isDesktop: boolean; greeting: string; companyName: string; }

export function EmployeeHomeTab({ T, isDesktop, greeting, companyName }: Props) {
    const user = useAuthStore(s => s.user);
    const [status, setStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
    const [statusMsg, setStatusMsg] = useState('');
    const [lastAction, setLastAction] = useState<string | null>(null);
    const [time, setTime] = useState(new Date());
    const [todayRecord, setTodayRecord] = useState<any>(null);
    const [monthStats, setMonthStats] = useState({ total: 0, onTime: 0, late: 0 });

    // Live clock
    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    // Fetch today's attendance
    const fetchToday = useCallback(async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const res = await attendanceApi.getHistory({ from: today, to: today });
            const records = res.data?.data ?? [];
            if (records.length > 0) setTodayRecord(records[0]);
        } catch { /* */ }
    }, []);

    // Fetch month stats
    const fetchStats = useCallback(async () => {
        try {
            const now = new Date();
            const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
            const res = await attendanceApi.getHistory({ from });
            const records = res.data?.data ?? [];
            setMonthStats({
                total: records.length,
                onTime: records.filter((r: any) => r.time_out).length,
                late: records.filter((r: any) => !r.time_out && r.time_in).length,
            });
        } catch { /* */ }
    }, []);

    useEffect(() => { fetchToday(); fetchStats(); }, [fetchToday, fetchStats]);

    const timeStr = time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const handleAction = async (type: 'in' | 'out') => {
        setStatus('checking');
        try {
            if (type === 'in') {
                await attendanceApi.checkIn();
                setStatusMsg('Check-in berhasil! 🎉');
                setLastAction(`Check-in: ${time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`);
            } else {
                await attendanceApi.checkOut();
                setStatusMsg('Check-out berhasil! 👋');
                setLastAction(`Check-out: ${time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`);
            }
            setStatus('success');
            fetchToday();
            fetchStats();
        } catch (err: any) {
            setStatus('error');
            setStatusMsg(err?.response?.data?.message || 'Gagal. Coba lagi.');
        }
        setTimeout(() => setStatus('idle'), 3000);
    };

    const hasCheckedIn = todayRecord?.time_in;
    const hasCheckedOut = todayRecord?.time_out;

    const card = (extra?: React.CSSProperties): React.CSSProperties => ({
        background: T.card, borderRadius: 20, border: `1px solid ${T.border}`, ...extra,
    });

    return (
        <div>
            {/* ═══ Hero Banner ═══ */}
            <div style={{
                background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0F2341 100%)',
                borderRadius: 24, padding: isDesktop ? 28 : 22, marginBottom: 16,
                position: 'relative', overflow: 'hidden',
            }}>
                {/* Decorative circles */}
                <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(59,130,246,.08)' }} />
                <div style={{ position: 'absolute', bottom: -20, left: '40%', width: 90, height: 90, borderRadius: '50%', background: 'rgba(147,197,253,.04)' }} />
                <div style={{ position: 'absolute', top: 20, right: 30, width: 50, height: 50, borderRadius: '50%', background: 'rgba(96,165,250,.06)' }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <Sun size={12} color="#FBBF24" />
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#93C5FD' }}>{greeting}</span>
                    </div>
                    <h2 style={{
                        fontSize: isDesktop ? 24 : 22, fontWeight: 900, color: '#fff',
                        fontFamily: "'Sora', sans-serif", letterSpacing: -.5, marginBottom: 6,
                    }}>
                        {(user?.name ?? 'Karyawan').split(' ')[0]} 👋
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{
                            fontSize: 10, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                            <MapPin size={9} /> {companyName}
                        </span>
                        {/* Today's status badge */}
                        <span style={{
                            fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 8,
                            background: hasCheckedOut
                                ? 'rgba(34,197,94,.15)' : hasCheckedIn
                                ? 'rgba(59,130,246,.15)' : 'rgba(148,163,184,.12)',
                            color: hasCheckedOut ? '#4ADE80' : hasCheckedIn ? '#60A5FA' : '#94A3B8',
                            border: `1px solid ${hasCheckedOut ? 'rgba(34,197,94,.25)' : hasCheckedIn ? 'rgba(59,130,246,.25)' : 'rgba(148,163,184,.15)'}`,
                        }}>
                            {hasCheckedOut ? '✓ Selesai' : hasCheckedIn ? '● Hadir' : '○ Belum Absen'}
                        </span>
                    </div>
                </div>
            </div>

            {/* ═══ Live Clock Card ═══ */}
            <div style={{
                ...card({ padding: '24px 20px', marginBottom: 16, textAlign: 'center', position: 'relative', overflow: 'hidden' }),
            }}>
                <div style={{ position: 'absolute', top: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: `${T.primary}04` }} />
                <div style={{ position: 'relative' }}>
                    <div style={{
                        fontSize: 52, fontWeight: 900, color: T.text,
                        fontFamily: "'Sora', sans-serif", letterSpacing: -3,
                        lineHeight: 1,
                    }}>
                        {timeStr}
                    </div>
                    <div style={{ fontSize: 13, color: T.textMuted, marginTop: 8, fontWeight: 500 }}>{dateStr}</div>

                    {/* Today status chips */}
                    {todayRecord && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 14 }}>
                            {todayRecord.time_in && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px',
                                    borderRadius: 10, background: `${T.success}10`, border: `1px solid ${T.success}20`,
                                }}>
                                    <Fingerprint size={12} color={T.success} />
                                    <span style={{ fontSize: 11, fontWeight: 700, color: T.success }}>In: {todayRecord.time_in}</span>
                                </div>
                            )}
                            {todayRecord.time_out && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px',
                                    borderRadius: 10, background: `${T.info}10`, border: `1px solid ${T.info}20`,
                                }}>
                                    <Clock size={12} color={T.info} />
                                    <span style={{ fontSize: 11, fontWeight: 700, color: T.info }}>Out: {todayRecord.time_out}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {lastAction && (
                        <div style={{
                            marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                            animation: 'fadeUp .4s ease',
                        }}>
                            <CheckCircle2 size={13} color={T.success} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: T.success }}>{lastAction}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ═══ Status Toast ═══ */}
            {status !== 'idle' && status !== 'checking' && (
                <div style={{
                    padding: '14px 18px', borderRadius: 16, marginBottom: 14, textAlign: 'center',
                    background: status === 'success' ? `${T.success}12` : `${T.danger}12`,
                    border: `1px solid ${status === 'success' ? `${T.success}30` : `${T.danger}30`}`,
                    color: status === 'success' ? T.success : T.danger,
                    fontSize: 13, fontWeight: 700, animation: 'fadeUp .3s ease',
                }}>
                    {statusMsg}
                </div>
            )}

            {/* ═══ Check-in / Check-out Buttons ═══ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <button onClick={() => handleAction('in')} disabled={status === 'checking'} style={{
                    height: 110, borderRadius: 22, border: 'none', position: 'relative', overflow: 'hidden',
                    background: hasCheckedIn
                        ? `linear-gradient(135deg, ${T.success}15, ${T.success}08)`
                        : 'linear-gradient(135deg, #22C55E, #16A34A)',
                    color: hasCheckedIn ? T.success : '#fff',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: hasCheckedIn ? 'none' : '0 8px 32px rgba(34,197,94,.35)',
                    transition: 'all .2s', opacity: status === 'checking' ? .6 : 1,
                    cursor: status === 'checking' ? 'not-allowed' : 'pointer',
                    border: hasCheckedIn ? `2px solid ${T.success}30` : 'none',
                }}>
                    {hasCheckedIn && <div style={{ position: 'absolute', top: 10, right: 10 }}><CheckCircle2 size={14} color={T.success} /></div>}
                    {status === 'checking' ? (
                        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                        <Fingerprint size={30} strokeWidth={1.5} />
                    )}
                    <span style={{ fontSize: 15, fontWeight: 800 }}>Check-in</span>
                    {hasCheckedIn && <span style={{ fontSize: 9, opacity: .7 }}>{todayRecord?.time_in}</span>}
                </button>

                <button onClick={() => handleAction('out')} disabled={status === 'checking' || !hasCheckedIn} style={{
                    height: 110, borderRadius: 22, border: 'none', position: 'relative', overflow: 'hidden',
                    background: hasCheckedOut
                        ? `linear-gradient(135deg, ${T.info}15, ${T.info}08)`
                        : !hasCheckedIn
                        ? `${T.textMuted}10`
                        : 'linear-gradient(135deg, #3B82F6, #2563EB)',
                    color: hasCheckedOut ? T.info : !hasCheckedIn ? T.textMuted : '#fff',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: hasCheckedOut || !hasCheckedIn ? 'none' : '0 8px 32px rgba(59,130,246,.35)',
                    transition: 'all .2s', opacity: status === 'checking' || !hasCheckedIn ? .5 : 1,
                    cursor: !hasCheckedIn || status === 'checking' ? 'not-allowed' : 'pointer',
                    border: hasCheckedOut ? `2px solid ${T.info}30` : !hasCheckedIn ? `1px solid ${T.border}` : 'none',
                }}>
                    {hasCheckedOut && <div style={{ position: 'absolute', top: 10, right: 10 }}><CheckCircle2 size={14} color={T.info} /></div>}
                    {status === 'checking' ? (
                        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                        <Clock size={30} strokeWidth={1.5} />
                    )}
                    <span style={{ fontSize: 15, fontWeight: 800 }}>Check-out</span>
                    {hasCheckedOut && <span style={{ fontSize: 9, opacity: .7 }}>{todayRecord?.time_out}</span>}
                </button>
            </div>

            {/* ═══ Quick Stats ═══ */}
            <div style={{
                ...card({ padding: 18, marginBottom: 16 }),
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 10,
                            background: `${T.primary}12`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <TrendingUp size={14} color={T.primary} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Statistik Bulan Ini</span>
                    </div>
                    <span style={{ fontSize: 10, color: T.textMuted, fontWeight: 600 }}>
                        {time.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                    </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {[
                        { label: 'Hadir', value: monthStats.total, color: T.primary, icon: Calendar },
                        { label: 'Lengkap', value: monthStats.onTime, color: T.success, icon: CheckCircle2 },
                        { label: 'Aktif', value: monthStats.late, color: T.gold, icon: Zap },
                    ].map(stat => {
                        const Icon = stat.icon;
                        return (
                            <div key={stat.label} style={{
                                padding: '14px 10px', borderRadius: 16, textAlign: 'center',
                                background: `${stat.color}06`, border: `1px solid ${stat.color}15`,
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
            </div>

            {/* ═══ Quick Actions ═══ */}
            <div style={{
                ...card({ padding: 16 }),
            }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 12 }}>Aksi Cepat</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                        { label: 'Riwayat Absensi', desc: 'Lihat catatan', color: T.info, icon: Clock },
                        { label: 'Laporan Kerja', desc: 'Buat laporan', color: T.success, icon: Zap },
                    ].map(act => {
                        const Icon = act.icon;
                        return (
                            <button key={act.label} style={{
                                padding: '14px 12px', borderRadius: 16, textAlign: 'left',
                                background: `${act.color}06`, border: `1px solid ${act.color}15`,
                                display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                                transition: 'all .15s',
                            }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 12,
                                    background: `${act.color}15`, flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Icon size={16} color={act.color} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{act.label}</div>
                                    <div style={{ fontSize: 10, color: T.textMuted }}>{act.desc}</div>
                                </div>
                                <ArrowRight size={14} color={T.textMuted} />
                            </button>
                        );
                    })}
                </div>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
