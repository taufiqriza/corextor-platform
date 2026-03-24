import { useEffect, useState } from 'react';
import {
    Key, Loader2, MapPin, MoreVertical,
    RefreshCcw, Search, Trash2, UserPlus, Users, X,
} from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { attendanceApi } from '@/api/platform.api';

interface Props { T: Theme; isDesktop: boolean; }

export function CompanyEmployeePanel({ T, isDesktop }: Props) {
    const [users, setUsers] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [menu, setMenu] = useState<number | null>(null);

    // Add Modal
    const [showAdd, setShowAdd] = useState(false);
    const [addPlatformUserId, setAddPlatformUserId] = useState('');
    const [addBranch, setAddBranch] = useState('');
    const [addPin, setAddPin] = useState('');
    const [adding, setAdding] = useState(false);
    const [addError, setAddError] = useState('');

    // Edit Modal


    // Reset PIN
    const [resettingPin, setResettingPin] = useState<any>(null);
    const [newPin, setNewPin] = useState('');
    const [pinSaving, setPinSaving] = useState(false);
    const [pinMsg, setPinMsg] = useState('');

    const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; msg: string } | null>(null);
    useEffect(() => { if (feedback) { const t = setTimeout(() => setFeedback(null), 3000); return () => clearTimeout(t); } }, [feedback]);

    const load = async () => {
        setLoading(true);
        try {
            const [u, b] = await Promise.all([attendanceApi.getUsers(), attendanceApi.getBranches()]);
            setUsers(u.data?.data ?? []);
            setBranches(b.data?.data ?? []);
        } catch { setUsers([]); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const filtered = search.trim()
        ? users.filter(u => {
            const q = search.toLowerCase();
            return String(u.platform_user_id).includes(q) ||
                u.branch?.name?.toLowerCase().includes(q) ||
                u.platform_user?.name?.toLowerCase().includes(q);
        })
        : users;

    const handleAdd = async () => {
        if (!addPlatformUserId || !addBranch || !addPin) return;
        setAdding(true); setAddError('');
        try {
            await attendanceApi.createUser({ platform_user_id: Number(addPlatformUserId), branch_id: Number(addBranch), pin: addPin });
            setShowAdd(false);
            setFeedback({ kind: 'success', msg: 'Karyawan berhasil ditambahkan!' });
            load();
        } catch (err: any) { setAddError(err?.response?.data?.message ?? 'Gagal menambah'); }
        finally { setAdding(false); }
    };

    const handleResetPin = async () => {
        if (!resettingPin || !newPin) return;
        if (newPin.length < 4) { setPinMsg('PIN minimal 4 digit.'); return; }
        setPinSaving(true); setPinMsg('');
        try {
            await attendanceApi.resetPin(resettingPin.id, newPin);
            setPinMsg('PIN berhasil direset!');
            setTimeout(() => { setResettingPin(null); setPinMsg(''); setNewPin(''); load(); }, 1200);
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? 'Gagal reset PIN';
            setPinMsg(msg);
        }
        finally { setPinSaving(false); }
    };

    /* ═══ Styles ═══ */
    const s = {
        section: { background: T.card, border: `1px solid ${T.border}`, borderRadius: 18, padding: isDesktop ? 16 : 12 } as React.CSSProperties,
        searchWrap: { flex: 1, minWidth: isDesktop ? 220 : '100%', display: 'flex', alignItems: 'center', gap: 8, height: 40, borderRadius: 11, border: `1px solid ${T.border}`, background: T.bgAlt, padding: '0 10px' } as React.CSSProperties,
        primaryBtn: { height: 40, padding: '0 14px', borderRadius: 11, background: T.primary, color: '#fff', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', border: 'none' } as React.CSSProperties,
        th: { textAlign: 'left' as const, padding: '11px 12px', fontSize: 11, color: T.textMuted, borderBottom: `1px solid ${T.border}`, textTransform: 'uppercase' as const, letterSpacing: '.02em' } as React.CSSProperties,
        td: { padding: '12px 12px', borderBottom: `1px solid ${T.border}` } as React.CSSProperties,
        mCard: { borderRadius: 14, border: `1px solid ${T.border}`, background: T.bgAlt, padding: 14, marginBottom: 8 } as React.CSSProperties,
        modal: { position: 'fixed' as const, inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 } as React.CSSProperties,
        modalBox: { background: T.card, borderRadius: 18, border: `1px solid ${T.border}`, padding: isDesktop ? 28 : 20, width: '100%', maxWidth: 440, maxHeight: '85vh', overflowY: 'auto' as const } as React.CSSProperties,
        input: { width: '100%', height: 42, borderRadius: 10, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.text, fontSize: 13, padding: '0 12px', boxSizing: 'border-box' as const } as React.CSSProperties,
        pill: (active: boolean) => ({
            fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 999,
            background: active ? `${T.success}14` : `${T.danger}12`,
            color: active ? T.success : T.danger,
            border: `1px solid ${active ? `${T.success}35` : `${T.danger}35`}`,
        } as React.CSSProperties),
    };

    return (
        <div style={{ display: 'grid', gap: 14 }}>
            {/* Feedback Toast */}
            {feedback && (
                <div style={{
                    position: 'fixed', top: 16, right: 16, zIndex: 9999, padding: '12px 20px', borderRadius: 12,
                    background: feedback.kind === 'success' ? T.success : T.danger, color: '#fff',
                    fontSize: 13, fontWeight: 700, boxShadow: '0 4px 20px rgba(0,0,0,.2)',
                    animation: 'slideIn .3s ease',
                }}>{feedback.msg}</div>
            )}

            <section style={s.section}>
                <div style={{ display: 'flex', alignItems: isDesktop ? 'center' : 'flex-start', justifyContent: 'space-between', gap: 10, flexDirection: isDesktop ? 'row' : 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 10, background: `${T.primary}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={14} color={T.primary} />
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>Data Karyawan</div>
                            <div style={{ fontSize: 11, color: T.textMuted }}>{filtered.length} karyawan terdaftar</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, width: isDesktop ? 'auto' : '100%' }}>
                        <button onClick={load} style={{ height: 40, width: 40, borderRadius: 11, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <RefreshCcw size={14} />
                        </button>
                        <button onClick={() => { setShowAdd(true); setAddError(''); setAddPlatformUserId(''); setAddBranch(branches[0]?.id?.toString() ?? ''); setAddPin(''); }}
                            style={s.primaryBtn}>
                            <UserPlus size={14} /> Tambah Karyawan
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div style={{ marginTop: 12 }}>
                    <div style={s.searchWrap}>
                        <Search size={14} color={T.textMuted} />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari karyawan..."
                            style={{ flex: 1, color: T.text, fontSize: 13 }} />
                        {search && <button onClick={() => setSearch('')} style={{ color: T.textMuted }}><X size={12} /></button>}
                    </div>
                </div>

                {/* Data */}
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center' }}>
                        <Loader2 size={22} color={T.primary} style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 8px' }} />
                        <span style={{ fontSize: 12, color: T.textMuted }}>Memuat data...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center' }}>
                        <Users size={28} color={T.textMuted} style={{ display: 'block', margin: '0 auto 8px' }} />
                        <p style={{ fontSize: 13, color: T.textMuted }}>{search ? 'Tidak ditemukan.' : 'Belum ada karyawan.'}</p>
                    </div>
                ) : isDesktop ? (
                    <div style={{ marginTop: 12, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'visible' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 600 }}>
                            <thead><tr style={{ background: T.bgAlt }}>
                                {['ID', 'Platform User', 'Cabang', 'Status', 'Aksi'].map(h => <th key={h} style={s.th}>{h}</th>)}
                            </tr></thead>
                            <tbody>{filtered.map(u => (
                                <tr key={u.id} style={{ background: T.card, transition: 'background .15s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = T.bgAlt}
                                    onMouseLeave={e => e.currentTarget.style.background = T.card}>
                                    <td style={{ ...s.td, fontSize: 12, fontWeight: 700, color: T.textSub }}>#{u.id}</td>
                                    <td style={s.td}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{
                                                width: 32, height: 32, borderRadius: 10, background: `${T.primary}14`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 12, fontWeight: 900, color: T.primary,
                                            }}>{(u.platform_user?.name ?? 'U').charAt(0).toUpperCase()}</div>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{u.platform_user?.name ?? `User #${u.platform_user_id}`}</div>
                                                <div style={{ fontSize: 10, color: T.textMuted }}>{u.platform_user?.email ?? '-'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ ...s.td, fontSize: 12, color: T.textSub }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <MapPin size={10} /> {u.branch?.name ?? '-'}
                                        </div>
                                    </td>
                                    <td style={s.td}><span style={s.pill(u.status === 'active')}>{u.status}</span></td>
                                    <td style={{ ...s.td, position: 'relative', overflow: 'visible', zIndex: menu === u.id ? 50 : 1 }}>
                                        <div style={{ position: 'relative', display: 'inline-block' }}>
                                            <button onClick={() => setMenu(menu === u.id ? null : u.id)} style={{ color: T.textMuted, padding: 6, borderRadius: 8 }}>
                                                <MoreVertical size={14} />
                                            </button>
                                            {menu === u.id && (
                                                <>
                                                    <div onClick={() => setMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 49 }} />
                                                    <div style={{
                                                        position: 'absolute', right: 0, top: '100%', zIndex: 50,
                                                        background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
                                                        boxShadow: '0 12px 32px rgba(0,0,0,.25)', minWidth: 160, overflow: 'hidden',
                                                    }}>
                                                        <button onClick={() => { setResettingPin(u); setNewPin(''); setPinMsg(''); setMenu(null); }} style={{
                                                            display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
                                                            padding: '10px 14px', fontSize: 12, color: T.text, borderBottom: `1px solid ${T.border}`,
                                                        }}><Key size={12} /> Reset PIN</button>
                                                        <button onClick={async () => {
                                                            if (!confirm(`Hapus karyawan ini?`)) return;
                                                            try { await attendanceApi.deleteUser(u.id); setFeedback({ kind: 'success', msg: 'Karyawan dihapus.' }); load(); } catch {}
                                                            setMenu(null);
                                                        }} style={{
                                                            display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
                                                            padding: '10px 14px', fontSize: 12, color: T.danger,
                                                        }}><Trash2 size={12} /> Hapus</button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ marginTop: 12 }}>
                        {filtered.map(u => (
                            <div key={u.id} style={s.mCard}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: 10, background: `${T.primary}14`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 14, fontWeight: 900, color: T.primary,
                                        }}>{(u.platform_user?.name ?? 'U').charAt(0).toUpperCase()}</div>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{u.platform_user?.name ?? `User #${u.platform_user_id}`}</div>
                                            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>
                                                <MapPin size={9} style={{ display: 'inline' }} /> {u.branch?.name ?? '-'}
                                            </div>
                                        </div>
                                    </div>
                                    <span style={s.pill(u.status === 'active')}>{u.status}</span>
                                </div>
                                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                                    <button onClick={() => { setResettingPin(u); setNewPin(''); setPinMsg(''); }} style={{
                                        height: 30, padding: '0 10px', borderRadius: 8, border: `1px solid ${T.border}`,
                                        background: T.bgAlt, color: T.text, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4,
                                    }}><Key size={10} /> Reset PIN</button>
                                    <button onClick={async () => {
                                        if (!confirm('Hapus karyawan ini?')) return;
                                        try { await attendanceApi.deleteUser(u.id); setFeedback({ kind: 'success', msg: 'Karyawan dihapus.' }); load(); } catch {}
                                    }} style={{
                                        height: 30, padding: '0 10px', borderRadius: 8, border: `1px solid ${T.danger}30`,
                                        background: `${T.danger}08`, color: T.danger, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4,
                                    }}><Trash2 size={10} /> Hapus</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Add Employee Modal */}
            {showAdd && (
                <div style={s.modal} onClick={() => setShowAdd(false)}>
                    <div style={s.modalBox} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <div>
                                <h3 style={{ fontSize: 16, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>Tambah Karyawan</h3>
                                <p style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>Daftarkan karyawan baru ke sistem absensi.</p>
                            </div>
                            <button onClick={() => setShowAdd(false)} style={{ color: T.textMuted }}><X size={18} /></button>
                        </div>
                        {addError && <div style={{ padding: '10px 14px', borderRadius: 12, background: `${T.danger}12`, color: T.danger, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>{addError}</div>}
                        <div style={{ display: 'grid', gap: 14 }}>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub, display: 'block', marginBottom: 6 }}>Platform User ID</label>
                                <input value={addPlatformUserId} onChange={e => setAddPlatformUserId(e.target.value)} placeholder="ID user dari platform" type="number" style={s.input} />
                                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>ID user yang sudah terdaftar di Corextor Platform.</div>
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub, display: 'block', marginBottom: 6 }}>Cabang</label>
                                <select value={addBranch} onChange={e => setAddBranch(e.target.value)} style={{ ...s.input, padding: '0 10px' }}>
                                    <option value="">Pilih cabang</option>
                                    {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub, display: 'block', marginBottom: 6 }}>PIN (6 digit)</label>
                                <input value={addPin} onChange={e => setAddPin(e.target.value)} placeholder="123456" maxLength={6} type="password" style={s.input} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
                                <button onClick={() => setShowAdd(false)} style={{ height: 40, padding: '0 16px', borderRadius: 11, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.textSub, fontSize: 12, fontWeight: 700 }}>Batal</button>
                                <button onClick={handleAdd} disabled={!addPlatformUserId || !addBranch || !addPin || adding} style={{ ...s.primaryBtn, opacity: adding ? .5 : 1 }}>
                                    {adding ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <UserPlus size={14} />}
                                    {adding ? 'Menambahkan...' : 'Tambah'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset PIN Modal */}
            {resettingPin && (
                <div style={s.modal} onClick={() => setResettingPin(null)}>
                    <div style={s.modalBox} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <div>
                                <h3 style={{ fontSize: 16, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>Reset PIN</h3>
                                <p style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>{resettingPin.platform_user?.name ?? `User #${resettingPin.platform_user_id}`}</p>
                            </div>
                            <button onClick={() => setResettingPin(null)} style={{ color: T.textMuted }}><X size={18} /></button>
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub, display: 'block', marginBottom: 6 }}>PIN Baru (6 digit)</label>
                            <input value={newPin} onChange={e => setNewPin(e.target.value)} placeholder="123456" maxLength={6} type="password" style={s.input} />
                        </div>
                        {pinMsg && <div style={{ padding: '8px 12px', borderRadius: 10, marginBottom: 12, fontSize: 12, fontWeight: 600, background: pinMsg.includes('berhasil') ? `${T.success}12` : `${T.danger}12`, color: pinMsg.includes('berhasil') ? T.success : T.danger }}>{pinMsg}</div>}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <button onClick={() => setResettingPin(null)} style={{ height: 40, padding: '0 16px', borderRadius: 11, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.textSub, fontSize: 12, fontWeight: 700 }}>Batal</button>
                            <button onClick={handleResetPin} disabled={!newPin || pinSaving} style={{ ...s.primaryBtn, opacity: pinSaving ? .5 : 1 }}>
                                {pinSaving ? 'Menyimpan...' : '✓ Reset PIN'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
