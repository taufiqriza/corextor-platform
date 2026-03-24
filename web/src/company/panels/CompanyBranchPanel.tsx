import { useEffect, useState } from 'react';
import { Loader2, MapPin, MoreVertical, Pencil, Plus, RefreshCcw, Search, Trash2, X } from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { attendanceApi } from '@/api/platform.api';

interface Props { T: Theme; isDesktop: boolean; }

export function CompanyBranchPanel({ T, isDesktop }: Props) {
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [menu, setMenu] = useState<number | null>(null);

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; msg: string } | null>(null);
    useEffect(() => { if (feedback) { const t = setTimeout(() => setFeedback(null), 3000); return () => clearTimeout(t); } }, [feedback]);

    const load = async () => {
        setLoading(true);
        try { const res = await attendanceApi.getBranches(); setBranches(res.data?.data ?? []); }
        catch { setBranches([]); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const filtered = search.trim() ? branches.filter(b => b.name?.toLowerCase().includes(search.toLowerCase()) || b.location?.toLowerCase().includes(search.toLowerCase())) : branches;

    const openAdd = () => { setEditId(null); setName(''); setLocation(''); setError(''); setShowModal(true); };
    const openEdit = (b: any) => { setEditId(b.id); setName(b.name ?? ''); setLocation(b.location ?? ''); setError(''); setShowModal(true); setMenu(null); };

    const handleSave = async () => {
        if (!name.trim()) return;
        setSaving(true); setError('');
        try {
            if (editId) await attendanceApi.updateBranch(editId, { name, location });
            else await attendanceApi.createBranch({ name, location });
            setShowModal(false);
            setFeedback({ kind: 'success', msg: editId ? 'Cabang diperbarui!' : 'Cabang ditambahkan!' });
            load();
        } catch (err: any) { setError(err?.response?.data?.message ?? 'Gagal menyimpan'); }
        finally { setSaving(false); }
    };

    const s = {
        section: { background: T.card, border: `1px solid ${T.border}`, borderRadius: 18, padding: isDesktop ? 16 : 12 } as React.CSSProperties,
        primaryBtn: { height: 40, padding: '0 14px', borderRadius: 11, background: T.primary, color: '#fff', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', cursor: 'pointer' } as React.CSSProperties,
        modal: { position: 'fixed' as const, inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 } as React.CSSProperties,
        modalBox: { background: T.card, borderRadius: 18, border: `1px solid ${T.border}`, padding: isDesktop ? 28 : 20, width: '100%', maxWidth: 420 } as React.CSSProperties,
        input: { width: '100%', height: 42, borderRadius: 10, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.text, fontSize: 13, padding: '0 12px', boxSizing: 'border-box' as const } as React.CSSProperties,
    };

    return (
        <div style={{ display: 'grid', gap: 14 }}>
            {feedback && (
                <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, padding: '12px 20px', borderRadius: 12, background: feedback.kind === 'success' ? T.success : T.danger, color: '#fff', fontSize: 13, fontWeight: 700, boxShadow: '0 4px 20px rgba(0,0,0,.2)' }}>{feedback.msg}</div>
            )}
            <section style={s.section}>
                <div style={{ display: 'flex', alignItems: isDesktop ? 'center' : 'flex-start', justifyContent: 'space-between', gap: 10, flexDirection: isDesktop ? 'row' : 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 10, background: `${T.info}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MapPin size={14} color={T.info} /></div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>Cabang</div>
                            <div style={{ fontSize: 11, color: T.textMuted }}>{branches.length} lokasi</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={load} style={{ height: 40, width: 40, borderRadius: 11, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><RefreshCcw size={14} /></button>
                        <button onClick={openAdd} style={s.primaryBtn}><Plus size={14} /> Tambah</button>
                    </div>
                </div>

                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, height: 40, borderRadius: 11, border: `1px solid ${T.border}`, background: T.bgAlt, padding: '0 10px' }}>
                    <Search size={14} color={T.textMuted} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari cabang..." style={{ flex: 1, color: T.text, fontSize: 13 }} />
                    {search && <button onClick={() => setSearch('')} style={{ color: T.textMuted }}><X size={12} /></button>}
                </div>

                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center' }}>
                        <Loader2 size={22} color={T.primary} style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 8px' }} />
                        <span style={{ fontSize: 12, color: T.textMuted }}>Memuat...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center' }}><MapPin size={28} color={T.textMuted} style={{ display: 'block', margin: '0 auto 8px' }} /><p style={{ fontSize: 13, color: T.textMuted }}>Belum ada cabang.</p></div>
                ) : (
                    <div style={{ marginTop: 12, display: 'grid', gap: 8, gridTemplateColumns: isDesktop ? 'repeat(auto-fill, minmax(280px, 1fr))' : '1fr' }}>
                        {filtered.map(b => (
                            <div key={b.id} style={{ borderRadius: 14, border: `1px solid ${T.border}`, background: T.bgAlt, padding: 14, transition: 'all .15s' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${T.info}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <MapPin size={16} color={T.info} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{b.name}</div>
                                            {b.location && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{b.location}</div>}
                                        </div>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <button onClick={() => setMenu(menu === b.id ? null : b.id)} style={{ color: T.textMuted, padding: 4 }}><MoreVertical size={14} /></button>
                                        {menu === b.id && (
                                            <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 20, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,.15)', minWidth: 130, overflow: 'hidden' }}>
                                                <button onClick={() => openEdit(b)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 12, color: T.text, borderBottom: `1px solid ${T.border}` }}><Pencil size={12} /> Edit</button>
                                                <button onClick={async () => {
                                                    if (!confirm(`Hapus ${b.name}?`)) return;
                                                    try { await attendanceApi.deleteBranch(b.id); setFeedback({ kind: 'success', msg: 'Cabang dihapus.' }); load(); } catch {}
                                                    setMenu(null);
                                                }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 12, color: T.danger }}><Trash2 size={12} /> Hapus</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Add/Edit Modal */}
            {showModal && (
                <div style={s.modal} onClick={() => setShowModal(false)}>
                    <div style={s.modalBox} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>{editId ? 'Edit Cabang' : 'Tambah Cabang'}</h3>
                            <button onClick={() => setShowModal(false)} style={{ color: T.textMuted }}><X size={18} /></button>
                        </div>
                        {error && <div style={{ padding: '10px 14px', borderRadius: 12, background: `${T.danger}12`, color: T.danger, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>{error}</div>}
                        <div style={{ display: 'grid', gap: 14 }}>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub, display: 'block', marginBottom: 6 }}>Nama Cabang</label>
                                <input value={name} onChange={e => setName(e.target.value)} placeholder="Kantor Pusat" style={s.input} />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub, display: 'block', marginBottom: 6 }}>Lokasi (opsional)</label>
                                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Jl. Sudirman No. 1, Jakarta" style={s.input} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
                                <button onClick={() => setShowModal(false)} style={{ height: 40, padding: '0 16px', borderRadius: 11, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.textSub, fontSize: 12, fontWeight: 700 }}>Batal</button>
                                <button onClick={handleSave} disabled={!name.trim() || saving} style={{ ...s.primaryBtn, opacity: saving ? .5 : 1 }}>
                                    {saving ? 'Menyimpan...' : '✓ Simpan'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
