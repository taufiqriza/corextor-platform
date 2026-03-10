import { Loader2, MapPin, Plus, Trash2, Pencil } from 'lucide-react';
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

    const handleDelete = async (id: number) => {
        if (!confirm('Hapus branch ini?')) return;
        await attendanceApi.deleteBranch(id);
        load();
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={24} color={T.primary} style={{ animation: 'spin 1s linear infinite' }} /></div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: T.textMuted }}>{branches.length} branches</div>
                <button onClick={() => setShowForm(p => !p)} style={{
                    height: 36, padding: '0 14px', borderRadius: 10,
                    background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`,
                    color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
                }}>
                    <Plus size={14} /> Tambah
                </button>
            </div>

            {showForm && (
                <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: 18, marginBottom: 16 }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : '1fr', gap: 12 }}>
                {branches.map((b: any) => (
                    <div key={b.id} style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: 18 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${T.success}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <MapPin size={18} color={T.success} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{b.name}</div>
                                <div style={{ fontSize: 11, color: T.textMuted }}>{b.location || 'No location'}</div>
                            </div>
                            <button onClick={() => handleDelete(b.id)} style={{ color: T.danger, padding: 6 }}>
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
