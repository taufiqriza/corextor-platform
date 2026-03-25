import { useEffect, useMemo, useState } from 'react';
import {
    AlertCircle, Building2, Calendar, CheckCircle2, Clock, ClipboardList,
    Loader2, MapPinned, Pencil, RefreshCcw, Search, X,
} from 'lucide-react';
import { AttendanceEvidenceSummary } from '@/components/attendance/AttendanceEvidenceSummary';
import type { Theme } from '@/theme/tokens';
import { attendanceApi } from '@/api/platform.api';
import type { AttendanceAdminReportPayload, AttendanceBranch, AttendanceMode } from '@/types/attendance.types';

interface Props {
    T: Theme;
    isDesktop: boolean;
    companyContextId?: number;
}
const PER_PAGE = 15;

function formatTime(v?: string | null) { return v ?? '—'; }

export function CompanyAttendancePanel({ T, isDesktop, companyContextId }: Props) {
    const [payload, setPayload] = useState<AttendanceAdminReportPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [page, setPage] = useState(1);
    const [attendanceModeFilter, setAttendanceModeFilter] = useState<'all' | AttendanceMode>('all');
    const [branches, setBranches] = useState<AttendanceBranch[]>([]);
    const [branchFilter, setBranchFilter] = useState<'all' | number>('all');
    const [detailRecordId, setDetailRecordId] = useState<number | null>(null);
    const [detailToken, setDetailToken] = useState(0);

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
            const res = await attendanceApi.getReport({
                from: selectedDate,
                to: selectedDate,
                branch_id: branchFilter === 'all' ? undefined : branchFilter,
                attendance_mode: attendanceModeFilter === 'all' ? undefined : attendanceModeFilter,
                per_page: PER_PAGE,
                page,
            }, companyContextId);
            setPayload(res.data?.data ?? null);
        } catch { setPayload(null); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        void attendanceApi.getBranches(companyContextId)
            .then(response => setBranches(response.data?.data ?? []))
            .catch(() => setBranches([]));
    }, [companyContextId]);

    useEffect(() => { load(); }, [attendanceModeFilter, branchFilter, companyContextId, page, selectedDate]);

    const records = payload?.pagination.data ?? [];
    const stats = payload?.stats ?? { total: 0, present: 0, complete: 0, ongoing: 0, corrected: 0, office: 0, field: 0 };
    const pagination = payload?.pagination ?? { current_page: 1, per_page: PER_PAGE, total: 0, last_page: 1, data: [] };

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
            }, companyContextId);
            setCorrMsg('Koreksi berhasil!');
            setTimeout(() => { setCorrecting(null); load(); }, 1000);
        } catch (err: any) { setCorrMsg(err?.response?.data?.message ?? 'Gagal'); }
        finally { setCorrSaving(false); }
    };

    const s = {
        section: {
            background: `linear-gradient(180deg, ${T.card} 0%, ${T.bgAlt} 100%)`,
            border: `1px solid ${T.border}`,
            borderRadius: 24,
            padding: isDesktop ? 18 : 14,
            boxShadow: T.shadowSm,
        } as React.CSSProperties,
        statCard: {
            position: 'relative',
            overflow: 'hidden',
            background: `linear-gradient(180deg, ${T.card} 0%, ${T.bgAlt} 100%)`,
            borderRadius: 18,
            border: `1px solid ${T.border}`,
            padding: isDesktop ? '14px 15px' : '12px 13px',
            boxShadow: T.shadowSm,
        } as React.CSSProperties,
        controlCard: {
            marginTop: 12,
            borderRadius: 18,
            border: `1px solid ${T.border}`,
            background: T.card,
            padding: isDesktop ? 12 : 10,
            boxShadow: T.shadowSm,
        } as React.CSSProperties,
        searchWrap: { flex: 1, minWidth: isDesktop ? 220 : '100%', display: 'flex', alignItems: 'center', gap: 8, height: 40, borderRadius: 13, border: `1px solid ${T.border}`, background: T.bgAlt, padding: '0 12px' } as React.CSSProperties,
        th: { textAlign: 'left' as const, padding: '10px 11px', fontSize: 10.5, color: T.textMuted, borderBottom: `1px solid ${T.border}`, textTransform: 'uppercase' as const } as React.CSSProperties,
        td: { padding: '10px 11px', borderBottom: `1px solid ${T.border}` } as React.CSSProperties,
        mCard: { borderRadius: 18, border: `1px solid ${T.border}`, background: T.card, boxShadow: T.shadowSm, padding: 14, marginBottom: 10 } as React.CSSProperties,
        modal: { position: 'fixed' as const, inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 } as React.CSSProperties,
        modalBox: { background: T.card, borderRadius: 18, border: `1px solid ${T.border}`, padding: isDesktop ? 28 : 20, width: '100%', maxWidth: 440 } as React.CSSProperties,
        input: { width: '100%', height: 42, borderRadius: 10, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.text, fontSize: 13, padding: '0 12px', boxSizing: 'border-box' as const } as React.CSSProperties,
    };

    return (
        <div style={{ display: 'grid', gap: 14 }}>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(5, 1fr)' : 'repeat(2, 1fr)', gap: 10 }}>
                {[
                    { label: 'Total', value: stats.total, icon: ClipboardList, tone: T.primary },
                    { label: 'Kantor', value: stats.office, icon: Building2, tone: T.success },
                    { label: 'Lapangan', value: stats.field, icon: MapPinned, tone: T.info },
                    { label: 'Selesai', value: stats.complete, icon: CheckCircle2, tone: T.primary },
                    { label: 'Belum Keluar', value: stats.ongoing, icon: AlertCircle, tone: T.gold },
                ].map(c => (
                    <div key={c.label} style={s.statCard}>
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: `linear-gradient(135deg, ${c.tone}08 0%, transparent 42%)`,
                            pointerEvents: 'none',
                        }} />
                        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                            <div>
                                <div style={{ fontSize: 10.5, color: T.textMuted, fontWeight: 700 }}>
                                    {c.label}
                                </div>
                                <div style={{ fontSize: isDesktop ? 22 : 19, fontWeight: 900, color: T.text, marginTop: 7, fontFamily: "'Sora', sans-serif", lineHeight: 1 }}>
                                    {c.value}
                                </div>
                            </div>
                            <div style={{
                                width: 34,
                                height: 34,
                                borderRadius: 12,
                                background: `${c.tone}14`,
                                border: `1px solid ${c.tone}18`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <c.icon size={15} color={c.tone} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main */}
            <section style={s.section}>
                <div style={{ display: 'flex', alignItems: isDesktop ? 'center' : 'flex-start', justifyContent: 'space-between', gap: 12, flexDirection: isDesktop ? 'row' : 'column' }}>
                    <div>
                        <div style={{ fontSize: 17, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>
                            Kehadiran Karyawan
                        </div>
                        <div style={{ marginTop: 4, fontSize: 11.5, color: T.textMuted, fontWeight: 700 }}>
                            Pantau absensi kantor, lapangan, selfie, dan lokasi dalam satu panel.
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={plainChipStyle(T)}>{selectedDate}</span>
                        <span style={plainChipStyle(T)}>{filtered.length} record</span>
                    </div>
                </div>

                <div style={s.controlCard}>
                    <div style={{ display: 'flex', alignItems: isDesktop ? 'center' : 'stretch', justifyContent: 'space-between', gap: 10, flexDirection: isDesktop ? 'row' : 'column' }}>
                        <div style={s.searchWrap}>
                            <Search size={14} color={T.textMuted} />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama karyawan atau cabang..."
                                style={{ flex: 1, color: T.text, fontSize: 13 }} />
                            {search && <button onClick={() => setSearch('')} style={{ color: T.textMuted }}><X size={12} /></button>}
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Calendar size={14} color={T.textMuted} />
                                <input type="date" value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setPage(1); }}
                                    style={{ height: 40, borderRadius: 13, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.text, fontSize: 12, padding: '0 12px' }} />
                            </div>
                            <select
                                value={branchFilter === 'all' ? 'all' : String(branchFilter)}
                                onChange={event => {
                                    const value = event.target.value;
                                    setBranchFilter(value === 'all' ? 'all' : Number(value));
                                    setPage(1);
                                }}
                                style={{ height: 40, borderRadius: 13, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.text, fontSize: 12, padding: '0 12px', minWidth: 156 }}
                            >
                                <option value="all">Semua Lokasi</option>
                                {branches.map(branch => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.name}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={attendanceModeFilter}
                                onChange={event => {
                                    setAttendanceModeFilter(event.target.value as 'all' | AttendanceMode);
                                    setPage(1);
                                }}
                                style={{ height: 40, borderRadius: 13, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.text, fontSize: 12, padding: '0 12px', minWidth: 148 }}
                            >
                                <option value="all">Semua Mode</option>
                                <option value="office">Kantor</option>
                                <option value="field">Lapangan</option>
                            </select>
                            <button onClick={load} style={{ height: 40, width: 40, borderRadius: 13, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <RefreshCcw size={14} />
                            </button>
                        </div>
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
                    <div style={{ marginTop: 12, border: `1px solid ${T.border}`, borderRadius: 16, overflowX: 'auto', background: T.card }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 700 }}>
                            <thead><tr style={{ background: T.bgAlt }}>
                                {['Karyawan', 'Waktu', 'Keterangan', 'Status', 'Aksi'].map(h => <th key={h} style={s.th}>{h}</th>)}
                            </tr></thead>
                            <tbody>{filtered.map(r => (
                                <tr key={r.id} style={{ background: T.card, transition: 'background .15s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = T.bgAlt}
                                    onMouseLeave={e => e.currentTarget.style.background = T.card}>
                                    <td style={s.td}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: 10, background: `${T.primary}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: T.primary }}>
                                                {(r.employee_name ?? 'U').charAt(0).toUpperCase()}</div>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{r.employee_name}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 3 }}>
                                                    {r.employee_email && <div style={{ fontSize: 10, color: T.textMuted }}>{r.employee_email}</div>}
                                                    <span style={{ fontSize: 10, color: T.textMuted }}>{r.branch_name ?? '-'}</span>
                                                    <span style={miniModeBadge(T, r.attendance_mode_in)}>
                                                        {r.attendance_mode_in === 'field' ? 'Lapangan' : 'Kantor'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ ...s.td, minWidth: 138 }}>
                                        <div style={{ display: 'grid', gap: 5 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                                <span style={{ fontSize: 9.5, color: T.textMuted, fontWeight: 800, textTransform: 'uppercase' }}>Masuk</span>
                                                <span style={{ fontSize: 12.5, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: r.time_in ? T.success : T.textMuted }}>{formatTime(r.time_in)}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                                <span style={{ fontSize: 9.5, color: T.textMuted, fontWeight: 800, textTransform: 'uppercase' }}>Pulang</span>
                                                <span style={{ fontSize: 12.5, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: r.time_out ? T.info : T.textMuted }}>{formatTime(r.time_out)}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ ...s.td, minWidth: 200 }}>
                                        <AttendanceEvidenceSummary
                                            T={T}
                                            compact
                                            recordId={r.id}
                                            showDetailButton={false}
                                        detailToken={detailRecordId === r.id ? detailToken : 0}
                                        attendanceModeIn={r.attendance_mode_in}
                                        checkInLocation={r.check_in_location}
                                        checkOutLocation={r.check_out_location}
                                        companyContextId={companyContextId}
                                        />
                                    </td>
                                    <td style={s.td}>
                                        <span style={{
                                            fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 999,
                                            background: r.time_out ? `${T.success}14` : `${T.gold}14`,
                                            color: r.time_out ? T.success : T.gold,
                                        }}>{r.time_out ? 'Selesai' : 'Berjalan'}</span>
                                    </td>
                                    <td style={s.td}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                            <button
                                                onClick={() => {
                                                    setDetailRecordId(r.id);
                                                    setDetailToken(token => token + 1);
                                                }}
                                                style={actionButtonStyle(T, 'neutral')}
                                            >
                                                Detail
                                            </button>
                                            <button onClick={() => {
                                                setCorrecting(r); setCorrTimeIn(r.time_in ?? ''); setCorrTimeOut(r.time_out ?? ''); setCorrNote(''); setCorrMsg('');
                                            }} style={actionButtonStyle(T, 'primary')}><Pencil size={10} /> Koreksi</button>
                                        </div>
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
                                    }}>{r.time_out ? 'Selesai' : 'Berjalan'}</span>
                                </div>
                                <div style={{ marginTop: 8 }}>
                                    <span style={miniModeBadge(T, r.attendance_mode_in)}>
                                        {r.attendance_mode_in === 'field' ? 'Lapangan' : 'Kantor'}
                                    </span>
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
                                <div style={{ marginTop: 10 }}>
                                    <AttendanceEvidenceSummary
                                        T={T}
                                        recordId={r.id}
                                        showDetailButton={false}
                                        detailToken={detailRecordId === r.id ? detailToken : 0}
                                        attendanceModeIn={r.attendance_mode_in}
                                        checkInLocation={r.check_in_location}
                                        checkOutLocation={r.check_out_location}
                                        companyContextId={companyContextId}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDetailRecordId(r.id);
                                            setDetailToken(token => token + 1);
                                        }}
                                        style={actionButtonStyle(T, 'neutral')}
                                    >
                                        Detail
                                    </button>
                                    <button onClick={() => {
                                        setCorrecting(r); setCorrTimeIn(r.time_in ?? ''); setCorrTimeOut(r.time_out ?? ''); setCorrNote(''); setCorrMsg('');
                                    }} style={actionButtonStyle(T, 'primary')}><Pencil size={10} /> Koreksi</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {pagination.last_page > 1 && (
                    <div style={{ marginTop: 12, borderRadius: 14, border: `1px solid ${T.border}`, background: T.bgAlt, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <button
                            onClick={() => setPage(current => Math.max(1, current - 1))}
                            disabled={pagination.current_page <= 1}
                            style={pagerButtonStyle(T, pagination.current_page <= 1)}
                        >
                            Prev
                        </button>
                        <div style={{ fontSize: 11.5, color: T.textMuted, fontWeight: 700 }}>
                            Halaman {pagination.current_page} dari {pagination.last_page}
                        </div>
                        <button
                            onClick={() => setPage(current => Math.min(pagination.last_page, current + 1))}
                            disabled={pagination.current_page >= pagination.last_page}
                            style={pagerButtonStyle(T, pagination.current_page >= pagination.last_page)}
                        >
                            Next
                        </button>
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

function pagerButtonStyle(T: Theme, disabled: boolean): React.CSSProperties {
    return {
        height: 38,
        padding: '0 12px',
        borderRadius: 12,
        border: `1px solid ${T.border}`,
        background: T.card,
        color: disabled ? T.textMuted : T.text,
        fontSize: 11.5,
        fontWeight: 800,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? .55 : 1,
    };
}

function plainChipStyle(T: Theme): React.CSSProperties {
    return {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 30,
        padding: '0 10px',
        borderRadius: 999,
        border: `1px solid ${T.border}`,
        background: T.bgAlt,
        color: T.textSub,
        fontSize: 10.5,
        fontWeight: 800,
        whiteSpace: 'nowrap',
    };
}

function miniModeBadge(T: Theme, mode?: AttendanceMode | null): React.CSSProperties {
    const isField = mode === 'field';

    return {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 26,
        padding: '0 10px',
        borderRadius: 999,
        background: isField ? `${T.info}12` : `${T.success}12`,
        color: isField ? T.info : T.success,
        fontSize: 10,
        fontWeight: 800,
    };
}

function actionButtonStyle(T: Theme, tone: 'primary' | 'neutral'): React.CSSProperties {
    return {
        height: 30,
        padding: '0 10px',
        borderRadius: 999,
        border: `1px solid ${tone === 'primary' ? `${T.primary}30` : T.border}`,
        background: tone === 'primary' ? `${T.primary}08` : T.bgAlt,
        color: tone === 'primary' ? T.primary : T.textSub,
        fontSize: 10,
        fontWeight: 800,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
    };
}
