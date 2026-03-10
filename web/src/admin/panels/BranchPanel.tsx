import { Loader2, MapPin, Plus, Trash2, Pencil, X, Check } from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { useEffect, useState } from 'react';
import { attendanceApi } from '@/api/platform.api';

interface Props { T: Theme; isDesktop: boolean; }

export function BranchPanel({ T, isDesktop }: Props) {
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editLocation, setEditLocation] = useState('');

    const load = () => {
        setLoading(true);
        attendanceApi.getBranches().then(res => setBranches(res.data?.data ?? [])).finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleCreate = async () => {
        if (!name.trim()) return;
        setSaving(true);
        try {
            await attendanceApi.createBranch({ name: name.trim(), location: location.trim() || undefined });
            setName(''); setLocation(''); setShowForm(false);
            load();
        } finally { setSaving(false); }
    };

    const handleUpdate = async (id: number) => {
        if (!editName.trim()) return;
        setSaving(true);
        try {
            await attendanceApi.updateBranch(id, { name: editName.trim(), location: editLocation.trim() || undefined });
            setEditingId(null);
            load();
        } finally { setSaving(false); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Hapus branch ini?')) return;
        await attendanceApi.deleteBranch(id);
        load();
    };

    const startEdit = (b: any) => {
        setEditingId(b.id);
        setEditName(b.name);
        setEditLocation(b.location ?? '');
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60, flexDirection: 'column', gap: 12 }}>
            <Loader2 size={24} color={T.primary} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 12, color: T.textMuted }}>Memuat branches...</span>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: T.textMuted }}>{branches.length} branches</div>
                <button onClick={() => setShowForm(p => !p)} style={{
                    height: 36, padding: '0 14px', borderRadius: 10,
                    background: showForm ? T.surface : `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`,
                    color: showForm ? T.text : '#fff',
                    border: showForm ? `1px solid ${T.border}` : 'none',
                    fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
                }}>
                    {showForm ? <><X size={14} /> Batal</> : <><Plus size={14} /> Tambah</>}
                </button>
            </div>

            {showForm && (
                <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: 18, marginBottom: 16, animation: 'slideUp .2s ease' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 12 }}>Branch Baru</div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nama branch" style={{
                            flex: 1, minWidth: 160, height: 40, borderRadius: 10, border: `1px solid ${T.border}`,
                            background: T.surface, padding: '0 12px', fontSize: 13, color: T.text,
                        }} />
                        <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Lokasi (opsional)" style={{
                            flex: 1, minWidth: 160, height: 40, borderRadius: 10, border: `1px solid ${T.border}`,
                            background: T.surface, padding: '0 12px', fontSize: 13, color: T.text,
                        }} />
                        <button onClick={handleCreate} disabled={saving} style={{
                            height: 40, padding: '0 18px', borderRadius: 10,
                            background: T.primary, color: '#fff', fontSize: 12, fontWeight: 700,
                            opacity: saving ? .6 : 1,
                        }}>
                            {saving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </div>
            )}

            {branches.length === 0 ? (
                <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: 40, textAlign: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: `${T.success}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                        <MapPin size={22} color={T.textMuted} />
                    </div>
                    <p style={{ fontSize: 13, color: T.textMuted }}>Belum ada branch. Tambahkan branch pertama.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : '1fr', gap: 12 }}>
                    {branches.map((b: any) => (
                        <div key={b.id} style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: 18 }}>
                            {editingId === b.id ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <input value={editName} onChange={e => setEditName(e.target.value)} style={{
                                        height: 36, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface,
                                        padding: '0 10px', fontSize: 12, color: T.text,
                                    }} />
                                    <input value={editLocation} onChange={e => setEditLocation(e.target.value)} placeholder="Lokasi" style={{
                                        height: 36, borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface,
                                        padding: '0 10px', fontSize: 12, color: T.text,
                                    }} />
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button onClick={() => handleUpdate(b.id)} style={{ flex: 1, height: 32, borderRadius: 8, background: T.primary, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                            <Check size={12} /> Simpan
                                        </button>
                                        <button onClick={() => setEditingId(null)} style={{ height: 32, padding: '0 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.textSub, fontSize: 11, fontWeight: 700 }}>
                                            Batal
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: `${T.success}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <MapPin size={18} color={T.success} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{b.name}</div>
                                        <div style={{ fontSize: 11, color: T.textMuted }}>{b.location || 'No location'}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 2 }}>
                                        <button onClick={() => startEdit(b)} style={{ padding: 6, color: T.primary, borderRadius: 6 }} title="Edit">
                                            <Pencil size={13} />
                                        </button>
                                        <button onClick={() => handleDelete(b.id)} style={{ padding: 6, color: T.danger, borderRadius: 6 }} title="Hapus">
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
