import { Loader2, MapPin, Plus, Trash2, Pencil, X, Check, Navigation, Crosshair, Radius, AlertTriangle, Save } from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { useEffect, useState, useCallback } from 'react';
import { attendanceApi } from '@/api/platform.api';

interface Props { T: Theme; isDesktop: boolean; }

type Branch = {
    id: number;
    name: string;
    location: string | null;
    latitude: number | null;
    longitude: number | null;
    radius_meters: number;
    status: string;
};

type BranchForm = {
    name: string;
    location: string;
    latitude: string;
    longitude: string;
    radius_meters: string;
};

const emptyForm: BranchForm = { name: '', location: '', latitude: '', longitude: '', radius_meters: '100' };

export function BranchPanel({ T, isDesktop }: Props) {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [form, setForm] = useState<BranchForm>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [geoLoading, setGeoLoading] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        attendanceApi.getBranches().then(res => setBranches(res.data?.data ?? [])).finally(() => setLoading(false));
    }, []);

    useEffect(load, [load]);

    const openCreate = () => { setEditingBranch(null); setForm(emptyForm); setShowModal(true); };

    const openEdit = (b: Branch) => {
        setEditingBranch(b);
        setForm({
            name: b.name,
            location: b.location ?? '',
            latitude: b.latitude != null ? String(b.latitude) : '',
            longitude: b.longitude != null ? String(b.longitude) : '',
            radius_meters: String(b.radius_meters ?? 100),
        });
        setShowModal(true);
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) return;
        setGeoLoading(true);
        navigator.geolocation.getCurrentPosition(
            pos => { setForm(f => ({ ...f, latitude: pos.coords.latitude.toFixed(7), longitude: pos.coords.longitude.toFixed(7) })); setGeoLoading(false); },
            () => setGeoLoading(false),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleSave = async () => {
        if (!form.name.trim()) return;
        setSaving(true);
        try {
            const payload = {
                name: form.name.trim(),
                location: form.location.trim() || undefined,
                latitude: form.latitude ? parseFloat(form.latitude) : undefined,
                longitude: form.longitude ? parseFloat(form.longitude) : undefined,
                radius_meters: parseInt(form.radius_meters) || 100,
            };
            if (editingBranch) {
                await attendanceApi.updateBranch(editingBranch.id, payload);
            } else {
                await attendanceApi.createBranch(payload as Parameters<typeof attendanceApi.createBranch>[0]);
            }
            setShowModal(false);
            load();
        } catch { /* ignore */ }
        setSaving(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Nonaktifkan branch ini?')) return;
        await attendanceApi.deleteBranch(id);
        load();
    };

    const hasCoords = (b: Branch) => b.latitude != null && b.longitude != null;

    const inputStyle: React.CSSProperties = {
        width: '100%', height: 40, borderRadius: 10, border: `1px solid ${T.border}`,
        background: T.surface, padding: '0 12px', fontSize: 13, color: T.text,
    };

    const labelStyle: React.CSSProperties = {
        fontSize: 10, fontWeight: 700, color: T.textSub, marginBottom: 5, display: 'block',
        textTransform: 'uppercase', letterSpacing: 0.5,
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
                <div>
                    <span style={{ fontSize: 13, color: T.textMuted }}>{branches.length} branches</span>
                    <span style={{ fontSize: 11, color: T.info, marginLeft: 12 }}>
                        📍 {branches.filter(hasCoords).length} dengan koordinat
                    </span>
                </div>
                <button onClick={openCreate} style={{
                    height: 36, padding: '0 14px', borderRadius: 10,
                    background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`,
                    color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
                }}>
                    <Plus size={14} /> Tambah
                </button>
            </div>

            {branches.length === 0 ? (
                <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: 40, textAlign: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: `${T.success}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                        <MapPin size={22} color={T.textMuted} />
                    </div>
                    <p style={{ fontSize: 13, color: T.textMuted }}>Belum ada branch. Tambahkan branch pertama.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : '1fr', gap: 12 }}>
                    {branches.map((b) => (
                        <div key={b.id} style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: 18 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                                    background: hasCoords(b) ? `${T.success}15` : `${T.gold}15`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {hasCoords(b) ? <Navigation size={16} color={T.success} /> : <AlertTriangle size={16} color={T.gold} />}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                        <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{b.name}</div>
                                        <span style={{
                                            fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                                            background: b.status === 'active' ? `${T.success}15` : `${T.danger}15`,
                                            color: b.status === 'active' ? T.success : T.danger,
                                        }}>
                                            {b.status}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>{b.location || 'Tanpa alamat'}</div>

                                    {/* Geo badges */}
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        {hasCoords(b) ? (
                                            <>
                                                <span style={{
                                                    fontSize: 9, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                                                    background: `${T.info}10`, color: T.info, border: `1px solid ${T.info}20`,
                                                    display: 'flex', alignItems: 'center', gap: 3,
                                                }}>
                                                    <Crosshair size={8} /> {b.latitude?.toFixed(4)}, {b.longitude?.toFixed(4)}
                                                </span>
                                                <span style={{
                                                    fontSize: 9, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                                                    background: `${T.gold}10`, color: T.gold, border: `1px solid ${T.gold}20`,
                                                    display: 'flex', alignItems: 'center', gap: 3,
                                                }}>
                                                    <Radius size={8} /> {b.radius_meters}m
                                                </span>
                                            </>
                                        ) : (
                                            <span style={{
                                                fontSize: 9, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                                                background: `${T.gold}10`, color: T.gold,
                                            }}>
                                                ⚠ Koordinat belum diatur
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                                    <button onClick={() => openEdit(b)} style={{ padding: 6, color: T.primary, borderRadius: 6 }} title="Edit">
                                        <Pencil size={13} />
                                    </button>
                                    <button onClick={() => handleDelete(b.id)} style={{ padding: 6, color: T.danger, borderRadius: 6 }} title="Hapus">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ═══ Create/Edit Modal ═══ */}
            {showModal && (
                <>
                    <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)', zIndex: 9999 }} />
                    <div style={{
                        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 10000,
                        width: 'min(500px, calc(100vw - 32px))', maxHeight: '90vh', overflowY: 'auto',
                        borderRadius: 20, background: T.card, border: `1px solid ${T.border}`,
                        padding: 24, boxShadow: '0 24px 60px rgba(0,0,0,.4)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 900, color: T.text }}>
                                {editingBranch ? 'Edit Branch' : 'Tambah Branch'}
                            </h3>
                            <button onClick={() => setShowModal(false)} style={{
                                width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.border}`,
                                background: T.bgAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textSub,
                            }}><X size={14} /></button>
                        </div>

                        <div style={{ marginBottom: 14 }}>
                            <label style={labelStyle}>Nama Branch *</label>
                            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="Kantor Pusat" />
                        </div>

                        <div style={{ marginBottom: 14 }}>
                            <label style={labelStyle}>Alamat / Lokasi</label>
                            <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} style={inputStyle} placeholder="Jl. Sudirman No. 123" />
                        </div>

                        {/* GPS */}
                        <div style={{ padding: 14, borderRadius: 12, background: `${T.info}06`, border: `1px solid ${T.info}20`, marginBottom: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                <div style={{ fontSize: 12, fontWeight: 800, color: T.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Crosshair size={13} color={T.info} /> Koordinat GPS
                                </div>
                                <button onClick={handleGetLocation} disabled={geoLoading} style={{
                                    display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8,
                                    background: `${T.info}15`, border: `1px solid ${T.info}30`, color: T.info, fontWeight: 700, fontSize: 10,
                                }}>
                                    {geoLoading ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <Navigation size={10} />}
                                    Lokasi Saat Ini
                                </button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <div>
                                    <label style={{ ...labelStyle, fontSize: 9 }}>Latitude</label>
                                    <input value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} style={inputStyle} placeholder="-6.2088000" type="number" step="0.0000001" />
                                </div>
                                <div>
                                    <label style={{ ...labelStyle, fontSize: 9 }}>Longitude</label>
                                    <input value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} style={inputStyle} placeholder="106.8456000" type="number" step="0.0000001" />
                                </div>
                            </div>
                            {form.latitude && form.longitude && (
                                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
                                    <Check size={10} color={T.success} />
                                    <span style={{ color: T.success, fontWeight: 600 }}>{parseFloat(form.latitude).toFixed(5)}, {parseFloat(form.longitude).toFixed(5)}</span>
                                    <a href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`} target="_blank" rel="noopener noreferrer"
                                        style={{ marginLeft: 'auto', color: T.info, fontWeight: 700, textDecoration: 'underline' }}>Peta ↗</a>
                                </div>
                            )}
                        </div>

                        {/* Radius */}
                        <div style={{ padding: 14, borderRadius: 12, background: `${T.gold}06`, border: `1px solid ${T.gold}20`, marginBottom: 18 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: T.text, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                <Radius size={13} color={T.gold} /> Radius Geofence
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <input type="range" min="10" max="1000" step="10" value={form.radius_meters}
                                    onChange={e => setForm({ ...form, radius_meters: e.target.value })} style={{ flex: 1, accentColor: T.gold }} />
                                <div style={{ minWidth: 60, textAlign: 'center', padding: '6px 0', borderRadius: 8, background: `${T.gold}15`, border: `1px solid ${T.gold}30` }}>
                                    <span style={{ fontSize: 16, fontWeight: 900, color: T.gold }}>{form.radius_meters}</span>
                                    <div style={{ fontSize: 8, color: T.textMuted }}>meter</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                                {[{ l: '50m', v: '50' }, { l: '100m', v: '100' }, { l: '200m', v: '200' }, { l: '500m', v: '500' }].map(p => (
                                    <button key={p.v} onClick={() => setForm({ ...form, radius_meters: p.v })} style={{
                                        flex: 1, padding: '5px 0', borderRadius: 6, fontSize: 10, fontWeight: 700,
                                        border: form.radius_meters === p.v ? `1.5px solid ${T.gold}60` : `1px solid ${T.border}`,
                                        background: form.radius_meters === p.v ? `${T.gold}12` : T.bgAlt,
                                        color: form.radius_meters === p.v ? T.gold : T.textMuted,
                                    }}>{p.l}</button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => setShowModal(false)} style={{
                                flex: 1, height: 42, borderRadius: 10, border: `1px solid ${T.border}`,
                                background: T.surface, color: T.textSub, fontWeight: 700, fontSize: 12,
                            }}>Batal</button>
                            <button onClick={handleSave} disabled={saving} style={{
                                flex: 2, height: 42, borderRadius: 10,
                                background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`,
                                color: '#fff', fontWeight: 800, fontSize: 12, opacity: saving ? .6 : 1,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            }}>
                                {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                                {saving ? 'Menyimpan…' : editingBranch ? 'Simpan' : 'Tambah'}
                            </button>
                        </div>
                    </div>
                </>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
