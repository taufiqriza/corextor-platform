import { useEffect, useMemo, useState } from 'react';
import {
    AlertCircle, Calendar, CheckCircle2, Clock, ClipboardList,
    Loader2, Pencil, RefreshCcw, Search, UserCheck, X,
} from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { attendanceApi } from '@/api/platform.api';

interface Props { T: Theme; isDesktop: boolean; }

function formatTime(v?: string | null) { return v ?? '—'; }

export function CompanyAttendancePanel({ T, isDesktop }: Props) {
    const [records, setRecords] = useState<any[]>([]);
    const [stats, setStats] = useState({ total: 0, present: 0, complete: 0, ongoing: 0, corrected: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Correction
    const [correcting, setCorrecting] = useState<any>(null);
    const [corrTimeIn, setCorrTimeIn] = useState('');
    const [corrTimeOut, setCorrTimeOut] = useState('');
    const [corrNote, setCorrNote] = useState('');
    const [corrSaving, setCorrSaving] = useState(false);
    const [corrMsg, setCorrMsg] = useState('');

    const load = async () => {
        setLoading(true);
        try {
            const res = await attendanceApi.getReport({ from: selectedDate, to: selectedDate });
            const data = res.data?.data ?? {};
            setRecords(data.records ?? []);
            if (data.stats) setStats(data.stats);
        } catch { setRecords([]); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, [selectedDate]);

    const filtered = useMemo(() => {
        if (!search.trim()) return records;
        const q = search.toLowerCase();
        return records.filter(r => r.employee_name?.toLowerCase().includes(q) || r.branch_name?.toLowerCase().includes(q));
    }, [records, search]);

    const handleCorrection = async () => {
        if (!correcting) return;
        setCorrSaving(true); setCorrMsg('');
        try {
            await attendanceApi.correctAttendance(correcting.id, {
                time_in: corrTimeIn || undefined, time_out: corrTimeOut || undefined, note: corrNote || undefined,
            });
            setCorrMsg('Koreksi berhasil!');
            setTimeout(() => { setCorrecting(null); load(); }, 1000);
        } catch (err: any) { setCorrMsg(err?.response?.data?.message ?? 'Gagal'); }
        finally { setCorrSaving(false); }
    };

    const s = {
        section: { background: T.card, border: `1px solid ${T.border}`, borderRadius: 18, padding: isDesktop ? 16 : 12 } as React.CSSProperties,
        statCard: { background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: '12px 14px' } as React.CSSProperties,
        searchWrap: { flex: 1, minWidth: isDesktop ? 220 : '100%', display: 'flex', alignItems: 'center', gap: 8, height: 40, borderRadius: 11, border: `1px solid ${T.border}`, background: T.bgAlt, padding: '0 10px' } as React.CSSProperties,
        th: { textAlign: 'left' as const, padding: '11px 12px', fontSize: 11, color: T.textMuted, borderBottom: `1px solid ${T.border}`, textTransform: 'uppercase' as const } as React.CSSProperties,
        td: { padding: '12px 12px', borderBottom: `1px solid ${T.border}` } as React.CSSProperties,
        mCard: { borderRadius: 14, border: `1px solid ${T.border}`, background: T.bgAlt, padding: 14, marginBottom: 8 } as React.CSSProperties,
        modal: { position: 'fixed' as const, inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 } as React.CSSProperties,
        modalBox: { background: T.card, borderRadius: 18, border: `1px solid ${T.border}`, padding: isDesktop ? 28 : 20, width: '100%', maxWidth: 440 } as React.CSSProperties,
        input: { width: '100%', height: 42, borderRadius: 10, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.text, fontSize: 13, padding: '0 12px', boxSizing: 'border-box' as const } as React.CSSProperties,
    };

    return (
        <div style={{ display: 'grid', gap: 14 }}>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', gap: 10 }}>
                {[
                    { label: 'Total', value: stats.total, icon: ClipboardList, tone: T.primary },
                    { label: 'Hadir', value: stats.present, icon: UserCheck, tone: T.success },
                    { label: 'Selesai', value: stats.complete, icon: CheckCircle2, tone: T.info },
                    { label: 'Belum Keluar', value: stats.ongoing, icon: AlertCircle, tone: T.gold },
                ].map(c => (
                    <div key={c.label} style={s.statCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: T.textMuted }}>{c.label}</span>
                            <c.icon size={14} color={c.tone} />
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: T.text, marginTop: 6, fontFamily: "'Sora', sans-serif" }}>{c.value}</div>
                    </div>
                ))}
            </div>

            {/* Main */}
            <section style={s.section}>
                <div style={{ display: 'flex', alignItems: isDesktop ? 'center' : 'flex-start', justifyContent: 'space-between', gap: 10, flexDirection: isDesktop ? 'row' : 'column' }}>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>Kehadiran Hari Ini</div>
                        <div style={{ fontSize: 11, color: T.textMuted }}>{filtered.length} record</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Calendar size={14} color={T.textMuted} />
                            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                                style={{ height: 40, borderRadius: 11, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.text, fontSize: 12, padding: '0 10px' }} />
                        </div>
                        <button onClick={load} style={{ height: 40, width: 40, borderRadius: 11, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <RefreshCcw size={14} />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div style={{ marginTop: 12 }}>
                    <div style={s.searchWrap}>
                        <Search size={14} color={T.textMuted} />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama karyawan..."
                            style={{ flex: 1, color: T.text, fontSize: 13 }} />
                        {search && <button onClick={() => setSearch('')} style={{ color: T.textMuted }}><X size={12} /></button>}
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center' }}>
                        <Loader2 size={22} color={T.primary} style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 8px' }} />
                        <span style={{ fontSize: 12, color: T.textMuted }}>Memuat...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center' }}>
                        <Clock size={28} color={T.textMuted} style={{ display: 'block', margin: '0 auto 8px' }} />
                        <p style={{ fontSize: 13, color: T.textMuted }}>{search ? 'Tidak ditemukan.' : 'Belum ada kehadiran.'}</p>
                    </div>
                ) : isDesktop ? (
                    <div style={{ marginTop: 12, border: `1px solid ${T.border}`, borderRadius: 14, overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 650 }}>
                            <thead><tr style={{ background: T.bgAlt }}>
                                {['Karyawan', 'Cabang', 'Check-in', 'Check-out', 'Status', 'Aksi'].map(h => <th key={h} style={s.th}>{h}</th>)}
                            </tr></thead>
                            <tbody>{filtered.map(r => (
                                <tr key={r.id} style={{ background: T.card, transition: 'background .15s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = T.bgAlt}
                                    onMouseLeave={e => e.currentTarget.style.background = T.card}>
                                    <td style={s.td}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: 10, background: `${T.primary}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: T.primary }}>
                                                {(r.employee_name ?? 'U').charAt(0).toUpperCase()}</div>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{r.employee_name}</div>
                                                {r.employee_email && <div style={{ fontSize: 10, color: T.textMuted }}>{r.employee_email}</div>}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ ...s.td, fontSize: 12, color: T.textSub }}>{r.branch_name ?? '-'}</td>
                                    <td style={s.td}><span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: r.time_in ? T.success : T.textMuted }}>{formatTime(r.time_in)}</span></td>
                                    <td style={s.td}><span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: r.time_out ? T.info : T.textMuted }}>{formatTime(r.time_out)}</span></td>
                                    <td style={s.td}>
                                        <span style={{
                                            fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 999,
                                            background: r.time_out ? `${T.success}14` : `${T.gold}14`,
                                            color: r.time_out ? T.success : T.gold,
                                        }}>{r.time_out ? 'Selesai' : 'Ongoing'}</span>
                                    </td>
                                    <td style={s.td}>
                                        <button onClick={() => {
                                            setCorrecting(r); setCorrTimeIn(r.time_in ?? ''); setCorrTimeOut(r.time_out ?? ''); setCorrNote(''); setCorrMsg('');
                                        }} style={{
                                            fontSize: 10, fontWeight: 700, color: T.primary, display: 'inline-flex', alignItems: 'center', gap: 4,
                                            padding: '5px 10px', borderRadius: 8, border: `1px solid ${T.primary}30`, background: `${T.primary}08`,
                                        }}><Pencil size={10} /> Koreksi</button>
                                    </td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ marginTop: 12 }}>
                        {filtered.map(r => (
                            <div key={r.id} style={s.mCard}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 34, height: 34, borderRadius: 10, background: `${T.primary}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: T.primary }}>
                                            {(r.employee_name ?? 'U').charAt(0).toUpperCase()}</div>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{r.employee_name}</div>
                                            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{r.branch_name ?? '-'}</div>
                                        </div>
                                    </div>
                                    <span style={{
                                        fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 999,
                                        background: r.time_out ? `${T.success}14` : `${T.gold}14`,
                                        color: r.time_out ? T.success : T.gold,
                                    }}>{r.time_out ? 'Selesai' : 'Ongoing'}</span>
                                </div>
                                <div style={{ display: 'flex', gap: 16, marginTop: 10, alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: 9, color: T.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>In</div>
                                        <div style={{ fontSize: 14, fontWeight: 800, color: T.success, fontFamily: "'JetBrains Mono', monospace" }}>{formatTime(r.time_in)}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 9, color: T.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Out</div>
                                        <div style={{ fontSize: 14, fontWeight: 800, color: r.time_out ? T.info : T.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>{formatTime(r.time_out)}</div>
                                    </div>
                                    <div style={{ marginLeft: 'auto' }}>
                                        <button onClick={() => {
                                            setCorrecting(r); setCorrTimeIn(r.time_in ?? ''); setCorrTimeOut(r.time_out ?? ''); setCorrNote(''); setCorrMsg('');
                                        }} style={{
                                            fontSize: 10, fontWeight: 700, color: T.primary, display: 'flex', alignItems: 'center', gap: 4,
                                            padding: '5px 10px', borderRadius: 8, border: `1px solid ${T.primary}30`, background: `${T.primary}08`,
                                        }}><Pencil size={10} /> Koreksi</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Correction Modal */}
            {correcting && (
                <div style={s.modal} onClick={() => setCorrecting(null)}>
                    <div style={s.modalBox} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <div>
                                <h3 style={{ fontSize: 16, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>Koreksi Absensi</h3>
                                <p style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>{correcting.employee_name}</p>
                            </div>
                            <button onClick={() => setCorrecting(null)} style={{ color: T.textMuted }}><X size={18} /></button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                            <div>
                                <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Check-in</label>
                                <input type="time" step="1" value={corrTimeIn} onChange={e => setCorrTimeIn(e.target.value)} style={s.input} />
                            </div>
                            <div>
                                <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Check-out</label>
                                <input type="time" step="1" value={corrTimeOut} onChange={e => setCorrTimeOut(e.target.value)} style={s.input} />
                            </div>
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Catatan</label>
                            <textarea value={corrNote} onChange={e => setCorrNote(e.target.value)} placeholder="Alasan koreksi..." rows={3}
                                style={{ ...s.input, height: 'auto', padding: '10px 12px', resize: 'none' }} />
                        </div>
                        {corrMsg && <div style={{ padding: '8px 12px', borderRadius: 10, marginBottom: 12, fontSize: 12, fontWeight: 600, background: corrMsg.includes('berhasil') ? `${T.success}12` : `${T.danger}12`, color: corrMsg.includes('berhasil') ? T.success : T.danger }}>{corrMsg}</div>}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <button onClick={() => setCorrecting(null)} style={{ height: 42, padding: '0 18px', borderRadius: 11, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.textSub, fontSize: 12, fontWeight: 700 }}>Batal</button>
                            <button onClick={handleCorrection} disabled={corrSaving} style={{ height: 42, padding: '0 22px', borderRadius: 11, background: T.primary, color: '#fff', fontSize: 12, fontWeight: 700, opacity: corrSaving ? .6 : 1 }}>
                                {corrSaving ? 'Menyimpan...' : '✓ Simpan Koreksi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
