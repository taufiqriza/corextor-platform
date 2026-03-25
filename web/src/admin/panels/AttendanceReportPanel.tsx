import { useEffect, useMemo, useState } from 'react';
import {
    AlertCircle, Calendar, CheckCircle2, ClipboardList,
    Loader2, Pencil, RefreshCcw, Search,
    UserCheck, X,
} from 'lucide-react';
import { AttendanceEvidenceSummary } from '@/components/attendance/AttendanceEvidenceSummary';
import type { Theme } from '@/theme/tokens';
import { attendanceApi } from '@/api/platform.api';
import type { AttendanceAdminReportPayload, AttendanceAdminReportItem } from '@/types/attendance.types';

/* ═══════════════════ Types ═══════════════════ */
interface Props { T: Theme; isDesktop: boolean; }

const PER_PAGE = 15;

/* ═══════════════════ Helpers ═══════════════════ */
function formatDate(v?: string): string {
    if (!v) return '-';
    try { return new Date(v).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }); } catch { return v; }
}

function statusMeta(status: string, T: Theme) {
    switch (status) {
        case 'present': return { label: 'Hadir', bg: `${T.success}14`, color: T.success, border: `${T.success}35` };
        case 'corrected': return { label: 'Dikoreksi', bg: `${T.info}14`, color: T.info, border: `${T.info}35` };
        case 'late': return { label: 'Terlambat', bg: `${T.gold}14`, color: T.gold, border: `${T.gold}35` };
        case 'absent': return { label: 'Tidak Hadir', bg: `${T.danger}12`, color: T.danger, border: `${T.danger}35` };
        default: return { label: status, bg: `${T.textMuted}10`, color: T.textMuted, border: T.border };
    }
}

/* ═══════════════════ Component ═══════════════════ */
export function AttendanceReportPanel({ T, isDesktop }: Props) {
    const [payload, setPayload] = useState<AttendanceAdminReportPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);

    // Date range
    const today = new Date().toISOString().split('T')[0];
    const monthStart = today.slice(0, 8) + '01';
    const [dateFrom, setDateFrom] = useState(monthStart);
    const [dateTo, setDateTo] = useState(today);

    // Correction modal
    const [correcting, setCorrecting] = useState<AttendanceAdminReportItem | null>(null);
    const [corrTimeIn, setCorrTimeIn] = useState('');
    const [corrTimeOut, setCorrTimeOut] = useState('');
    const [corrNote, setCorrNote] = useState('');
    const [corrSaving, setCorrSaving] = useState(false);
    const [corrMsg, setCorrMsg] = useState('');

    const loadReport = async () => {
        setLoading(true);
        try {
            const res = await attendanceApi.getReport({ from: dateFrom, to: dateTo, per_page: PER_PAGE, page });
            setPayload(res.data?.data ?? null);
        } catch { setPayload(null); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadReport(); }, [dateFrom, dateTo, page]);

    const records = payload?.pagination.data ?? [];
    const stats = payload?.stats ?? { total: 0, present: 0, corrected: 0, complete: 0, ongoing: 0 };
    const pagination = payload?.pagination ?? { current_page: 1, per_page: PER_PAGE, total: 0, last_page: 1, data: [] };

    const filtered = useMemo(() => {
        let list = records;
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(r =>
                r.employee_name?.toLowerCase().includes(q) ||
                r.branch_name?.toLowerCase().includes(q) ||
                r.date?.includes(q)
            );
        }
        if (statusFilter !== 'all') {
            if (statusFilter === 'complete') list = list.filter(r => r.time_out);
            else if (statusFilter === 'ongoing') list = list.filter(r => r.time_in && !r.time_out);
            else list = list.filter(r => r.status === statusFilter);
        }
        return list;
    }, [records, search, statusFilter]);

    /* ── Correction ── */
    const openCorrection = (r: AttendanceAdminReportItem) => {
        setCorrecting(r);
        setCorrTimeIn(r.time_in ?? '');
        setCorrTimeOut(r.time_out ?? '');
        setCorrNote('');
        setCorrMsg('');
    };

    const handleCorrection = async () => {
        if (!correcting) return;
        setCorrSaving(true); setCorrMsg('');
        try {
            await attendanceApi.correctAttendance(correcting.id, {
                time_in: corrTimeIn || undefined,
                time_out: corrTimeOut || undefined,
                note: corrNote || undefined,
            });
            setCorrMsg('Koreksi berhasil disimpan!');
            setTimeout(() => { setCorrecting(null); loadReport(); }, 1000);
        } catch (err: any) {
            setCorrMsg(err?.response?.data?.message || 'Gagal menyimpan koreksi');
        } finally { setCorrSaving(false); }
    };

    /* ═══ Styles ═══ */
    const s = {
        statCard: { background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: '12px 14px' } as React.CSSProperties,
        statVal: { fontSize: 22, fontWeight: 900, color: T.text, marginTop: 6, fontFamily: "'Sora', sans-serif" } as React.CSSProperties,
        section: { background: T.card, border: `1px solid ${T.border}`, borderRadius: 18, padding: isDesktop ? 16 : 12 } as React.CSSProperties,
        sectionIcon: (bg: string) => ({ width: 30, height: 30, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' } as React.CSSProperties),
        th: { textAlign: 'left' as const, padding: '11px 12px', fontSize: 11, letterSpacing: '.02em', textTransform: 'uppercase' as const, color: T.textMuted, borderBottom: `1px solid ${T.border}` } as React.CSSProperties,
        td: { padding: '12px 12px', borderBottom: `1px solid ${T.border}` } as React.CSSProperties,
        mCard: { borderRadius: 14, border: `1px solid ${T.border}`, background: T.bgAlt, padding: 14, marginBottom: 8 } as React.CSSProperties,
        pill: (bg: string, color: string, border?: string) => ({
            fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 999,
            background: bg, color, border: `1px solid ${border || bg}`,
            display: 'inline-flex', alignItems: 'center', gap: 4,
        } as React.CSSProperties),
        searchWrap: { flex: 1, minWidth: isDesktop ? 220 : '100%', display: 'flex', alignItems: 'center', gap: 8, height: 40, borderRadius: 11, border: `1px solid ${T.border}`, background: T.bgAlt, padding: '0 10px' } as React.CSSProperties,
        dateInput: { height: 40, borderRadius: 11, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.text, fontSize: 12, padding: '0 10px' } as React.CSSProperties,
        btn: (bg: string, color: string) => ({
            height: 40, padding: '0 14px', borderRadius: 11, background: bg, color,
            fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6,
            border: 'none', cursor: 'pointer',
        } as React.CSSProperties),
        modal: { position: 'fixed' as const, inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 } as React.CSSProperties,
        modalBox: { background: T.card, borderRadius: 18, border: `1px solid ${T.border}`, padding: isDesktop ? 28 : 20, width: '100%', maxWidth: 440, maxHeight: '85vh', overflowY: 'auto' as const } as React.CSSProperties,
        input: { width: '100%', height: 42, borderRadius: 10, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.text, fontSize: 13, padding: '0 12px', boxSizing: 'border-box' as const } as React.CSSProperties,
    };

    return (
        <div style={{ display: 'grid', gap: 14 }}>
            {/* ── Stats Grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(5, minmax(0,1fr))' : 'repeat(2, 1fr)', gap: 10 }}>
                {[
                    { label: 'Total Record', value: stats.total, icon: ClipboardList, tone: T.primary },
                    { label: 'Hadir', value: stats.present, icon: UserCheck, tone: T.success },
                    { label: 'Dikoreksi', value: stats.corrected, icon: Pencil, tone: T.info },
                    { label: 'Selesai', value: stats.complete, icon: CheckCircle2, tone: T.success },
                    { label: 'Belum Keluar', value: stats.ongoing, icon: AlertCircle, tone: T.gold },
                ].map(c => (
                    <div key={c.label} style={s.statCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: T.textMuted }}>{c.label}</span>
                            <c.icon size={14} color={c.tone} />
                        </div>
                        <div style={s.statVal}>{c.value}</div>
                    </div>
                ))}
            </div>

            {/* ── Main Section ── */}
            <section style={s.section}>
                <div style={{ display: 'flex', alignItems: isDesktop ? 'center' : 'flex-start', justifyContent: 'space-between', gap: 10, flexDirection: isDesktop ? 'row' : 'column' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={s.sectionIcon(`${T.primary}18`)}><ClipboardList size={14} color={T.primary} /></div>
                            <div style={{ fontSize: 15, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>Laporan Kehadiran</div>
                        </div>
                        <div style={{ marginTop: 4, fontSize: 12, color: T.textMuted }}>{filtered.length} record ditemukan</div>
                    </div>
                    <button onClick={loadReport} style={s.btn(T.bgAlt, T.textSub)}>
                        <RefreshCcw size={14} /> Refresh
                    </button>
                </div>

                {/* Filters */}
                <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={s.searchWrap}>
                        <Search size={14} color={T.textMuted} />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama karyawan..."
                            style={{ flex: 1, color: T.text, fontSize: 13 }} />
                        {search && <button onClick={() => setSearch('')} style={{ color: T.textMuted }}><X size={12} /></button>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={14} color={T.textMuted} />
                        <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} style={s.dateInput} />
                        <span style={{ color: T.textMuted, fontSize: 11 }}>—</span>
                        <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} style={s.dateInput} />
                    </div>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                        style={{ height: 40, borderRadius: 11, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.text, fontSize: 12, padding: '0 10px', minWidth: 120 }}>
                        <option value="all">Semua Status</option>
                        <option value="present">Hadir</option>
                        <option value="corrected">Dikoreksi</option>
                        <option value="complete">Selesai</option>
                        <option value="ongoing">Belum Keluar</option>
                    </select>
                </div>

                {/* Content */}
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center' }}>
                        <Loader2 size={22} color={T.primary} style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 8px' }} />
                        <span style={{ fontSize: 12, color: T.textMuted }}>Memuat laporan...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center' }}>
                        <ClipboardList size={28} color={T.textMuted} style={{ margin: '0 auto 8px', display: 'block' }} />
                        <p style={{ fontSize: 13, color: T.textMuted }}>{search ? 'Tidak ditemukan.' : 'Belum ada data kehadiran.'}</p>
                    </div>
                ) : isDesktop ? (
                    /* Desktop Table */
                    <div style={{ marginTop: 12, border: `1px solid ${T.border}`, borderRadius: 14, overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 960 }}>
                            <thead><tr style={{ background: T.bgAlt }}>
                                {['Karyawan', 'Cabang', 'Tanggal', 'Check-in', 'Check-out', 'Bukti', 'Status', 'Aksi'].map(h => <th key={h} style={s.th}>{h}</th>)}
                            </tr></thead>
                            <tbody>{filtered.map(r => {
                                const sm = statusMeta(r.status, T);
                                const isComplete = !!r.time_out;
                                return (
                                    <tr key={r.id} style={{ background: T.card, transition: 'background .15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = T.bgAlt}
                                        onMouseLeave={e => e.currentTarget.style.background = T.card}>
                                        <td style={s.td}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{
                                                    width: 32, height: 32, borderRadius: 10,
                                                    background: `${T.primary}14`, display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 12, fontWeight: 900, color: T.primary,
                                                }}>{(r.employee_name ?? 'U').charAt(0).toUpperCase()}</div>
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{r.employee_name ?? 'Unknown'}</div>
                                                    {r.employee_email && <div style={{ fontSize: 10, color: T.textMuted }}>{r.employee_email}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ ...s.td, fontSize: 12, color: T.textSub }}>{r.branch_name ?? '-'}</td>
                                        <td style={{ ...s.td, fontSize: 12, color: T.textSub }}>{formatDate(r.date)}</td>
                                        <td style={s.td}>
                                            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: r.time_in ? T.success : T.textMuted }}>
                                                {r.time_in ?? '—'}
                                            </span>
                                        </td>
                                        <td style={s.td}>
                                            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: r.time_out ? T.info : T.textMuted }}>
                                                {r.time_out ?? '—'}
                                            </span>
                                        </td>
                                        <td style={{ ...s.td, minWidth: 240 }}>
                                            <AttendanceEvidenceSummary
                                                T={T}
                                                compact
                                                attendanceModeIn={r.attendance_mode_in}
                                                checkInLocation={r.check_in_location}
                                                checkOutLocation={r.check_out_location}
                                            />
                                        </td>
                                        <td style={s.td}>
                                            <span style={s.pill(sm.bg, sm.color, sm.border)}>{sm.label}</span>
                                            {!isComplete && r.time_in && (
                                                <span style={{ ...s.pill(`${T.gold}14`, T.gold, `${T.gold}35`), marginLeft: 4 }}>Ongoing</span>
                                            )}
                                        </td>
                                        <td style={s.td}>
                                            <button onClick={() => openCorrection(r)} style={{
                                                fontSize: 10, fontWeight: 700, color: T.primary,
                                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                                padding: '5px 10px', borderRadius: 8, border: `1px solid ${T.primary}30`,
                                                background: `${T.primary}08`,
                                            }}>
                                                <Pencil size={10} /> Koreksi
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}</tbody>
                        </table>
                    </div>
                ) : (
                    /* Mobile Cards */
                    <div style={{ marginTop: 12 }}>
                        {filtered.map(r => {
                            const sm = statusMeta(r.status, T);
                            return (
                                <div key={r.id} style={s.mCard}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{
                                                width: 34, height: 34, borderRadius: 10,
                                                background: `${T.primary}14`, display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 13, fontWeight: 900, color: T.primary,
                                                }}>{(r.employee_name ?? 'U').charAt(0).toUpperCase()}</div>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{r.employee_name}</div>
                                                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{r.branch_name ?? '-'} • {formatDate(r.date)}</div>
                                            </div>
                                        </div>
                                        <span style={s.pill(sm.bg, sm.color, sm.border)}>{sm.label}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 16, marginTop: 10, alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: 9, color: T.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>In</div>
                                            <div style={{ fontSize: 14, fontWeight: 800, color: r.time_in ? T.success : T.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>{r.time_in ?? '—'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 9, color: T.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Out</div>
                                            <div style={{ fontSize: 14, fontWeight: 800, color: r.time_out ? T.info : T.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>{r.time_out ?? '—'}</div>
                                        </div>
                                        <div style={{ marginLeft: 'auto' }}>
                                            <button onClick={() => openCorrection(r)} style={{
                                                fontSize: 10, fontWeight: 700, color: T.primary,
                                                display: 'flex', alignItems: 'center', gap: 4,
                                                padding: '5px 10px', borderRadius: 8, border: `1px solid ${T.primary}30`,
                                                background: `${T.primary}08`,
                                            }}>
                                                <Pencil size={10} /> Koreksi
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: 10 }}>
                                        <AttendanceEvidenceSummary
                                            T={T}
                                            attendanceModeIn={r.attendance_mode_in}
                                            checkInLocation={r.check_in_location}
                                            checkOutLocation={r.check_out_location}
                                        />
                                    </div>
                                    {r.note && <div style={{ marginTop: 8, fontSize: 11, color: T.textMuted, fontStyle: 'italic' }}>📝 {r.note}</div>}
                                </div>
                            );
                        })}
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

            {/* ═══ Correction Modal ═══ */}
            {correcting && (
                <div style={s.modal} onClick={() => setCorrecting(null)}>
                    <div style={s.modalBox} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <div>
                                <h3 style={{ fontSize: 16, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>Koreksi Absensi</h3>
                                <p style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>
                                    {correcting.employee_name} — {formatDate(correcting.date)}
                                </p>
                            </div>
                            <button onClick={() => setCorrecting(null)} style={{ color: T.textMuted }}><X size={18} /></button>
                        </div>

                        {/* Current values */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                            {[
                                { label: 'Status', value: statusMeta(correcting.status, T).label },
                                { label: 'Cabang', value: correcting.branch_name ?? '-' },
                                { label: 'Tanggal', value: formatDate(correcting.date) },
                            ].map(item => (
                                <div key={item.label}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{item.value}</div>
                                </div>
                            ))}
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

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Catatan Koreksi</label>
                            <textarea value={corrNote} onChange={e => setCorrNote(e.target.value)}
                                placeholder="Alasan koreksi..." rows={3}
                                style={{ ...s.input, height: 'auto', padding: '10px 12px', resize: 'none' }} />
                        </div>

                        {corrMsg && (
                            <div style={{
                                padding: '8px 12px', borderRadius: 10, marginBottom: 16, fontSize: 12, fontWeight: 600,
                                background: corrMsg.includes('berhasil') ? `${T.success}12` : `${T.danger}12`,
                                color: corrMsg.includes('berhasil') ? T.success : T.danger,
                            }}>{corrMsg}</div>
                        )}

                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button onClick={() => setCorrecting(null)} style={{
                                height: 42, padding: '0 18px', borderRadius: 11, border: `1px solid ${T.border}`,
                                background: T.bgAlt, color: T.textSub, fontSize: 12, fontWeight: 700,
                            }}>Batal</button>
                            <button onClick={handleCorrection} disabled={corrSaving} style={{
                                height: 42, padding: '0 22px', borderRadius: 11, background: T.primary,
                                color: '#fff', fontSize: 12, fontWeight: 700, opacity: corrSaving ? .6 : 1,
                            }}>
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
