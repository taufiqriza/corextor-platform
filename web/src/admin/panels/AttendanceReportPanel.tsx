import { Loader2, Clock, Pencil, X } from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { useEffect, useState } from 'react';
import { attendanceApi } from '@/api/platform.api';

interface Props { T: Theme; isDesktop: boolean; }

export function AttendanceReportPanel({ T, isDesktop }: Props) {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [correcting, setCorrecting] = useState<any>(null);
    const [corrTimeIn, setCorrTimeIn] = useState('');
    const [corrTimeOut, setCorrTimeOut] = useState('');
    const [corrNote, setCorrNote] = useState('');
    const [corrSaving, setCorrSaving] = useState(false);
    const [corrMsg, setCorrMsg] = useState('');

    const load = () => {
        setLoading(true);
        attendanceApi.getReport().then(res => setRecords(res.data?.data ?? [])).finally(() => setLoading(false));
    };

    useEffect(load, []);

    const openCorrection = (r: any) => {
        setCorrecting(r);
        setCorrTimeIn(r.time_in ?? '');
        setCorrTimeOut(r.time_out ?? '');
        setCorrNote('');
        setCorrMsg('');
    };

    const handleCorrection = async () => {
        if (!correcting) return;
        setCorrSaving(true);
        setCorrMsg('');
        try {
            await attendanceApi.correctAttendance(correcting.id, {
                time_in: corrTimeIn || undefined,
                time_out: corrTimeOut || undefined,
                note: corrNote || undefined,
            });
            setCorrMsg('Koreksi berhasil disimpan!');
            setTimeout(() => { setCorrecting(null); setCorrMsg(''); load(); }, 1200);
        } catch (err: any) {
            setCorrMsg(err?.response?.data?.message || 'Gagal menyimpan koreksi');
        } finally { setCorrSaving(false); }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60, flexDirection: 'column', gap: 12 }}>
            <Loader2 size={24} color={T.primary} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 12, color: T.textMuted }}>Memuat laporan...</span>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <span style={{ fontSize: 13, color: T.textMuted }}>{records.length} records</span>
            </div>

            {records.length === 0 ? (
                <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: 40, textAlign: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: `${T.primary}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                        <Clock size={22} color={T.textMuted} />
                    </div>
                    <p style={{ fontSize: 13, color: T.textMuted }}>Belum ada data kehadiran.</p>
                </div>
            ) : isDesktop ? (
                <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                                {['Karyawan', 'Tanggal', 'Check-in', 'Check-out', 'Status', 'Aksi'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', fontSize: 10, fontWeight: 700, color: T.textMuted, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((r: any) => (
                                <tr key={r.id} style={{ borderBottom: `1px solid ${T.border}20`, transition: 'background .1s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = `${T.border}15`}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: T.text }}>{r.employee_name ?? `User #${r.attendance_user_id}`}</td>
                                    <td style={{ padding: '12px 16px', fontSize: 12, color: T.textSub }}>{r.date}</td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: r.time_in ? T.success : T.textMuted }}>{r.time_in ?? '—'}</span>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: r.time_out ? T.info : T.textMuted }}>{r.time_out ?? '—'}</span>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{
                                            fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                                            background: r.time_out ? `${T.success}15` : `${T.gold}15`,
                                            color: r.time_out ? T.success : T.gold,
                                        }}>{r.time_out ? 'Complete' : 'In Progress'}</span>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <button onClick={() => openCorrection(r)} style={{
                                            fontSize: 10, fontWeight: 700, color: T.primary,
                                            display: 'flex', alignItems: 'center', gap: 4,
                                            padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.primary}30`,
                                            background: `${T.primary}08`,
                                        }}>
                                            <Pencil size={10} /> Koreksi
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
                            <div style={{ display: 'flex', gap: 16, fontSize: 11, color: T.textSub, marginBottom: 8 }}>
                                <span>{r.date}</span>
                                <span style={{ color: T.success }}>{r.time_in ? `In: ${r.time_in}` : ''}</span>
                                <span style={{ color: T.info }}>{r.time_out ? `Out: ${r.time_out}` : ''}</span>
                            </div>
                            <button onClick={() => openCorrection(r)} style={{
                                fontSize: 10, fontWeight: 700, color: T.primary,
                                display: 'flex', alignItems: 'center', gap: 4,
                                padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.primary}30`,
                                background: `${T.primary}08`,
                            }}>
                                <Pencil size={10} /> Koreksi
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Correction Modal */}
            {correcting && (
                <>
                    <div onClick={() => setCorrecting(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)', zIndex: 100 }} />
                    <div style={{
                        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 101,
                        width: 'min(420px, calc(100vw - 32px))', borderRadius: 20,
                        background: T.card, border: `1px solid ${T.border}`, padding: 24,
                        boxShadow: '0 24px 60px rgba(0,0,0,.4)', animation: 'scaleIn .2s ease',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <div>
                                <h3 style={{ fontSize: 16, fontWeight: 900, color: T.text }}>Koreksi Absensi</h3>
                                <p style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                                    {correcting.employee_name ?? `User #${correcting.attendance_user_id}`} — {correcting.date}
                                </p>
                            </div>
                            <button onClick={() => setCorrecting(null)} style={{ width: 32, height: 32, borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textSub }}>
                                <X size={14} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                            <div>
                                <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Check-in</label>
                                <input type="time" value={corrTimeIn} onChange={e => setCorrTimeIn(e.target.value)} style={{
                                    width: '100%', height: 40, borderRadius: 10, border: `1px solid ${T.border}`,
                                    background: T.surface, padding: '0 12px', fontSize: 13, color: T.text,
                                }} />
                            </div>
                            <div>
                                <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Check-out</label>
                                <input type="time" value={corrTimeOut} onChange={e => setCorrTimeOut(e.target.value)} style={{
                                    width: '100%', height: 40, borderRadius: 10, border: `1px solid ${T.border}`,
                                    background: T.surface, padding: '0 12px', fontSize: 13, color: T.text,
                                }} />
                            </div>
                        </div>

                        <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Catatan Koreksi</label>
                        <textarea value={corrNote} onChange={e => setCorrNote(e.target.value)}
                            placeholder="Alasan koreksi..." rows={3}
                            style={{
                                width: '100%', borderRadius: 10, border: `1px solid ${T.border}`,
                                background: T.surface, padding: '10px 12px', fontSize: 13, color: T.text,
                                resize: 'none', marginBottom: 20,
                            }} />

                        {corrMsg && (
                            <div style={{
                                padding: '8px 12px', borderRadius: 8, marginBottom: 16, fontSize: 12, fontWeight: 600,
                                background: corrMsg.includes('berhasil') ? `${T.success}12` : `${T.danger}12`,
                                color: corrMsg.includes('berhasil') ? T.success : T.danger,
                            }}>
                                {corrMsg}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setCorrecting(null)} style={{
                                flex: 1, height: 44, borderRadius: 12, border: `1px solid ${T.border}`,
                                background: T.surface, color: T.text, fontWeight: 700, fontSize: 13,
                            }}>Batal</button>
                            <button onClick={handleCorrection} disabled={corrSaving} style={{
                                flex: 1, height: 44, borderRadius: 12,
                                background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`,
                                color: '#fff', fontWeight: 700, fontSize: 13,
                                opacity: corrSaving ? .6 : 1,
                            }}>
                                {corrSaving ? 'Menyimpan...' : 'Simpan Koreksi'}
                            </button>
                        </div>
                    </div>
                </>
            )}

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes scaleIn { from { opacity: 0; transform: translate(-50%, -50%) scale(.92); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
            `}</style>
        </div>
    );
}
