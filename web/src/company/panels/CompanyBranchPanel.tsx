import { useCallback, useEffect, useState } from 'react';
import {
    MapPin, Plus, Pencil, Trash2, Search, Loader2, X, Save,
    Navigation, Crosshair, AlertTriangle, Check, Users, Radius,
} from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { attendanceApi } from '@/api/platform.api';

/* ═══ Types ═══ */
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

/* ═══ Panel ═══ */
export function CompanyBranchPanel({ T, isDesktop }: { T: Theme; isDesktop: boolean }) {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [form, setForm] = useState<BranchForm>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [geoLoading, setGeoLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<Branch | null>(null);

    const fetchBranches = useCallback(async () => {
        setLoading(true);
        try {
            const res = await attendanceApi.getBranches();
            setBranches(res.data.data ?? []);
        } catch { /* ignore */ }
        setLoading(false);
    }, []);

    useEffect(() => { fetchBranches(); }, [fetchBranches]);

    const flash = (msg: string, type: 'success' | 'error') => {
        if (type === 'success') { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); }
        else { setErrorMsg(msg); setTimeout(() => setErrorMsg(''), 4000); }
    };

    const openCreate = () => {
        setEditingBranch(null);
        setForm(emptyForm);
        setShowModal(true);
    };

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
        if (!navigator.geolocation) {
            flash('Browser tidak mendukung Geolocation', 'error');
            return;
        }
        setGeoLoading(true);
        navigator.geolocation.getCurrentPosition(
            pos => {
                setForm(f => ({
                    ...f,
                    latitude: pos.coords.latitude.toFixed(7),
                    longitude: pos.coords.longitude.toFixed(7),
                }));
                setGeoLoading(false);
            },
            err => {
                flash(`Gagal mendapatkan lokasi: ${err.message}`, 'error');
                setGeoLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleSave = async () => {
        if (!form.name.trim()) return flash('Nama cabang wajib diisi', 'error');
        setSaving(true);
        try {
            const payload: Record<string, unknown> = {
                name: form.name.trim(),
                location: form.location.trim() || null,
                latitude: form.latitude ? parseFloat(form.latitude) : null,
                longitude: form.longitude ? parseFloat(form.longitude) : null,
                radius_meters: parseInt(form.radius_meters) || 100,
            };

            if (editingBranch) {
                await attendanceApi.updateBranch(editingBranch.id, payload as Parameters<typeof attendanceApi.updateBranch>[1]);
                flash('Cabang berhasil diperbarui!', 'success');
            } else {
                await attendanceApi.createBranch(payload as Parameters<typeof attendanceApi.createBranch>[0]);
                flash('Cabang berhasil ditambahkan!', 'success');
            }
            setShowModal(false);
            await fetchBranches();
        } catch {
            flash('Gagal menyimpan cabang.', 'error');
        }
        setSaving(false);
    };

    const handleDelete = async (b: Branch) => {
        try {
            await attendanceApi.deleteBranch(b.id);
            flash(`${b.name} berhasil dinonaktifkan.`, 'success');
            setDeleteConfirm(null);
            await fetchBranches();
        } catch {
            flash('Gagal menghapus cabang.', 'error');
        }
    };

    const filtered = branches.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        (b.location ?? '').toLowerCase().includes(search.toLowerCase())
    );

    const activeBranches = filtered.filter(b => b.status === 'active');
    const inactiveBranches = filtered.filter(b => b.status === 'inactive');

    /* ═══ Shared Styles ═══ */
    const card = (p?: React.CSSProperties): React.CSSProperties => ({
        background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, ...p,
    });

    const inputStyle: React.CSSProperties = {
        width: '100%', height: 44, borderRadius: 12,
        border: `1px solid ${T.border}`, background: T.bgAlt,
        padding: '0 14px', fontSize: 13, color: T.text,
    };

    const labelStyle: React.CSSProperties = {
        fontSize: 11, fontWeight: 700, color: T.textSub,
        marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5,
    };

    const hasCoords = (b: Branch) => b.latitude != null && b.longitude != null;

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80, color: T.textMuted }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /><span style={{ marginLeft: 10, fontSize: 14 }}>Memuat cabang…</span>
            </div>
        );
    }

    return (
        <div style={{ width: '100%' }}>
            {/* Toast */}
            {successMsg && (
                <div style={{ ...card({ padding: '12px 16px', marginBottom: 16, borderColor: `${T.success}50`, background: `${T.success}10` }), display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Check size={16} color={T.success} /><span style={{ fontSize: 13, fontWeight: 700, color: T.success }}>{successMsg}</span>
                </div>
            )}
            {errorMsg && (
                <div style={{ ...card({ padding: '12px 16px', marginBottom: 16, borderColor: `${T.danger}50`, background: `${T.danger}10` }), display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AlertTriangle size={16} color={T.danger} /><span style={{ fontSize: 13, fontWeight: 700, color: T.danger }}>{errorMsg}</span>
                </div>
            )}

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(3,1fr)' : '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[
                    { label: 'Total Cabang', value: branches.length, color: T.primary },
                    { label: 'Aktif', value: branches.filter(b => b.status === 'active').length, color: T.success },
                    { label: 'Dengan Lokasi', value: branches.filter(b => hasCoords(b)).length, color: T.info },
                ].map(s => (
                    <div key={s.label} style={{ ...card({ padding: '14px 16px' }) }}>
                        <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, marginTop: 2 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Search + Add */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, position: 'relative', minWidth: 200 }}>
                    <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: T.textMuted }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari cabang…"
                        style={{ ...inputStyle, paddingLeft: 38 }} />
                </div>
                <button onClick={openCreate} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px', height: 44,
                    borderRadius: 12, background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`,
                    color: '#fff', fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap',
                    boxShadow: T.shadowSm,
                }}>
                    <Plus size={16} /> Tambah Cabang
                </button>
            </div>

            {/* Branch Cards */}
            {activeBranches.length === 0 && inactiveBranches.length === 0 && (
                <div style={{ ...card({ padding: 60 }), textAlign: 'center' }}>
                    <MapPin size={40} style={{ color: T.textMuted, opacity: 0.3, marginBottom: 12 }} />
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.textSub }}>Belum ada cabang</div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Tambahkan cabang pertama untuk mulai mengatur lokasi absensi.</div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: 12 }}>
                {activeBranches.map(b => (
                    <div key={b.id} style={{ ...card({ padding: 0, overflow: 'hidden' }) }}>
                        {/* Map Preview */}
                        {hasCoords(b) ? (
                            <div style={{
                                height: 140, position: 'relative',
                                background: `linear-gradient(135deg, ${T.primary}10, ${T.info}08)`,
                                borderBottom: `1px solid ${T.border}`,
                            }}>
                                <img
                                    src={`https://maps.googleapis.com/maps/api/staticmap?center=${b.latitude},${b.longitude}&zoom=16&size=400x140&scale=2&markers=color:red|${b.latitude},${b.longitude}&key=`}
                                    alt="Map"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.2 }}
                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                                {/* Coordinate overlay */}
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <div style={{
                                        width: 48, height: 48, borderRadius: 24,
                                        background: `${T.primary}20`, border: `2px solid ${T.primary}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: `0 0 0 ${b.radius_meters > 200 ? 24 : b.radius_meters > 100 ? 18 : 12}px ${T.primary}12`,
                                    }}>
                                        <Navigation size={20} color={T.primary} />
                                    </div>
                                    <div style={{
                                        marginTop: 8, padding: '4px 10px', borderRadius: 8,
                                        background: `${T.card}DD`, backdropFilter: 'blur(6px)',
                                        fontSize: 10, fontWeight: 700, color: T.text,
                                        border: `1px solid ${T.border}`,
                                    }}>
                                        {b.latitude?.toFixed(5)}, {b.longitude?.toFixed(5)}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: `${T.gold}06`, borderBottom: `1px solid ${T.border}`,
                            }}>
                                <AlertTriangle size={16} color={T.gold} style={{ marginRight: 6 }} />
                                <span style={{ fontSize: 11, color: T.gold, fontWeight: 600 }}>Koordinat belum diatur</span>
                            </div>
                        )}

                        {/* Branch Info */}
                        <div style={{ padding: '16px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                                <div>
                                    <h4 style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 4 }}>{b.name}</h4>
                                    {b.location && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: T.textMuted, fontSize: 11 }}>
                                            <MapPin size={10} /> {b.location}
                                        </div>
                                    )}
                                </div>
                                <span style={{
                                    fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                                    background: `${T.success}15`, color: T.success,
                                }}>● Aktif</span>
                            </div>

                            {/* Geofence Info */}
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                                {hasCoords(b) && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 5,
                                        padding: '6px 10px', borderRadius: 8,
                                        background: `${T.info}10`, border: `1px solid ${T.info}20`,
                                        fontSize: 10, fontWeight: 700, color: T.info,
                                    }}>
                                        <Radius size={10} /> Radius {b.radius_meters}m
                                    </div>
                                )}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 5,
                                    padding: '6px 10px', borderRadius: 8,
                                    background: T.bgAlt, border: `1px solid ${T.border}`,
                                    fontSize: 10, fontWeight: 600, color: T.textMuted,
                                }}>
                                    <Users size={10} /> Karyawan: —
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => openEdit(b)} style={{
                                    flex: 1, height: 36, borderRadius: 10,
                                    border: `1px solid ${T.primary}30`, background: `${T.primary}08`,
                                    color: T.primary, fontSize: 11, fontWeight: 700,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                }}>
                                    <Pencil size={12} /> Edit
                                </button>
                                <button onClick={() => setDeleteConfirm(b)} style={{
                                    width: 36, height: 36, borderRadius: 10,
                                    border: `1px solid ${T.danger}25`, background: `${T.danger}06`,
                                    color: T.danger, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Inactive branches */}
            {inactiveBranches.length > 0 && (
                <div style={{ marginTop: 24 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                        Non-Aktif ({inactiveBranches.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {inactiveBranches.map(b => (
                            <div key={b.id} style={{
                                ...card({ padding: '12px 16px' }),
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.6,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <MapPin size={14} color={T.textMuted} />
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: T.textSub }}>{b.name}</div>
                                        <div style={{ fontSize: 10, color: T.textMuted }}>{b.location || 'Tanpa lokasi'}</div>
                                    </div>
                                </div>
                                <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: `${T.danger}15`, color: T.danger }}>
                                    Non-aktif
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══ Create/Edit Modal ═══ */}
            {showModal && (
                <>
                    <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)', zIndex: 9999 }} />
                    <div style={{
                        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 10000,
                        width: 'min(520px, calc(100vw - 32px))', maxHeight: '90vh', overflowY: 'auto',
                        borderRadius: 20, background: T.card, border: `1px solid ${T.border}`,
                        padding: 24, boxShadow: '0 24px 60px rgba(0,0,0,.4)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 900, color: T.text }}>
                                {editingBranch ? 'Edit Cabang' : 'Tambah Cabang'}
                            </h3>
                            <button onClick={() => setShowModal(false)} style={{
                                width: 32, height: 32, borderRadius: 10, border: `1px solid ${T.border}`,
                                background: T.bgAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textSub,
                            }}>
                                <X size={14} />
                            </button>
                        </div>

                        {/* Name */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}><MapPin size={11} style={{ display: 'inline', marginRight: 4 }} />Nama Cabang *</label>
                            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="Kantor Pusat Jakarta" />
                        </div>

                        {/* Address */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}><MapPin size={11} style={{ display: 'inline', marginRight: 4 }} />Alamat / Deskripsi Lokasi</label>
                            <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} style={inputStyle} placeholder="Jl. Sudirman No. 123, Jakarta Selatan" />
                        </div>

                        {/* Geolocation Section */}
                        <div style={{
                            padding: 16, borderRadius: 14,
                            background: `${T.info}06`, border: `1px solid ${T.info}20`,
                            marginBottom: 16,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: T.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Crosshair size={14} color={T.info} /> Koordinat GPS
                                    </div>
                                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>
                                        Koordinat ini digunakan untuk validasi lokasi absensi karyawan
                                    </div>
                                </div>
                                <button onClick={handleGetLocation} disabled={geoLoading} style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '8px 14px', borderRadius: 10,
                                    background: `${T.info}15`, border: `1px solid ${T.info}30`,
                                    color: T.info, fontWeight: 700, fontSize: 11,
                                    opacity: geoLoading ? 0.6 : 1, whiteSpace: 'nowrap',
                                }}>
                                    {geoLoading ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Navigation size={12} />}
                                    {geoLoading ? 'Mencari…' : 'Lokasi Saat Ini'}
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div>
                                    <label style={{ ...labelStyle, fontSize: 10 }}>Latitude</label>
                                    <input value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })}
                                        style={inputStyle} placeholder="-6.2088000" type="number" step="0.0000001" />
                                </div>
                                <div>
                                    <label style={{ ...labelStyle, fontSize: 10 }}>Longitude</label>
                                    <input value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })}
                                        style={inputStyle} placeholder="106.8456000" type="number" step="0.0000001" />
                                </div>
                            </div>

                            {form.latitude && form.longitude && (
                                <div style={{
                                    marginTop: 10, padding: '8px 12px', borderRadius: 8,
                                    background: `${T.success}10`, border: `1px solid ${T.success}25`,
                                    display: 'flex', alignItems: 'center', gap: 8,
                                }}>
                                    <Check size={12} color={T.success} />
                                    <span style={{ fontSize: 11, color: T.success, fontWeight: 600 }}>
                                        Koordinat: {parseFloat(form.latitude).toFixed(5)}, {parseFloat(form.longitude).toFixed(5)}
                                    </span>
                                    <a
                                        href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`}
                                        target="_blank" rel="noopener noreferrer"
                                        style={{ marginLeft: 'auto', fontSize: 10, color: T.info, fontWeight: 700, textDecoration: 'underline' }}
                                    >
                                        Lihat Peta ↗
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Radius */}
                        <div style={{
                            padding: 16, borderRadius: 14,
                            background: `${T.gold}06`, border: `1px solid ${T.gold}20`,
                            marginBottom: 20,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                                <Radius size={14} color={T.gold} />
                                <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Radius Geofence</span>
                            </div>
                            <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 12 }}>
                                Karyawan hanya bisa absen jika berada dalam radius ini dari koordinat cabang
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <input type="range" min="10" max="1000" step="10"
                                    value={form.radius_meters}
                                    onChange={e => setForm({ ...form, radius_meters: e.target.value })}
                                    style={{ flex: 1, accentColor: T.gold }}
                                />
                                <div style={{
                                    minWidth: 80, textAlign: 'center', padding: '8px 0',
                                    borderRadius: 10, background: `${T.gold}15`, border: `1px solid ${T.gold}30`,
                                }}>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: T.gold }}>{form.radius_meters}</div>
                                    <div style={{ fontSize: 9, fontWeight: 600, color: T.textMuted }}>meter</div>
                                </div>
                            </div>

                            {/* Presets */}
                            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                                {[
                                    { label: '50m', val: '50', desc: 'Ketat' },
                                    { label: '100m', val: '100', desc: 'Normal' },
                                    { label: '200m', val: '200', desc: 'Luas' },
                                    { label: '500m', val: '500', desc: 'Area' },
                                ].map(p => (
                                    <button key={p.val} onClick={() => setForm({ ...form, radius_meters: p.val })}
                                        style={{
                                            flex: 1, padding: '6px 0', borderRadius: 8,
                                            border: form.radius_meters === p.val ? `1.5px solid ${T.gold}60` : `1px solid ${T.border}`,
                                            background: form.radius_meters === p.val ? `${T.gold}12` : T.bgAlt,
                                            color: form.radius_meters === p.val ? T.gold : T.textMuted,
                                            fontSize: 11, fontWeight: 700, textAlign: 'center',
                                        }}>
                                        {p.label}
                                        <div style={{ fontSize: 8, fontWeight: 500, marginTop: 1 }}>{p.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Save */}
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setShowModal(false)} style={{
                                flex: 1, height: 46, borderRadius: 12,
                                border: `1px solid ${T.border}`, background: T.surface,
                                color: T.textSub, fontWeight: 700, fontSize: 13,
                            }}>Batal</button>
                            <button onClick={handleSave} disabled={saving} style={{
                                flex: 2, height: 46, borderRadius: 12,
                                background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`,
                                color: '#fff', fontWeight: 800, fontSize: 13,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                opacity: saving ? 0.6 : 1, boxShadow: T.shadowSm,
                            }}>
                                {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
                                {saving ? 'Menyimpan…' : editingBranch ? 'Simpan Perubahan' : 'Tambah Cabang'}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* ═══ Delete Confirm Modal ═══ */}
            {deleteConfirm && (
                <>
                    <div onClick={() => setDeleteConfirm(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)', zIndex: 9999 }} />
                    <div style={{
                        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 10000,
                        width: 'min(380px, calc(100vw - 32px))', borderRadius: 20,
                        background: T.card, border: `1px solid ${T.border}`, padding: 24, boxShadow: '0 24px 60px rgba(0,0,0,.4)',
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: 56, height: 56, borderRadius: 16, background: `${T.danger}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <Trash2 size={24} color={T.danger} />
                            </div>
                            <h3 style={{ fontSize: 16, fontWeight: 900, color: T.text, marginBottom: 8 }}>Nonaktifkan Cabang?</h3>
                            <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 20 }}>
                                <strong style={{ color: T.text }}>{deleteConfirm.name}</strong> akan dinonaktifkan. Karyawan tidak bisa absen di cabang ini.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setDeleteConfirm(null)} style={{
                                flex: 1, height: 44, borderRadius: 12, border: `1px solid ${T.border}`,
                                background: T.surface, color: T.text, fontWeight: 700, fontSize: 13,
                            }}>Batal</button>
                            <button onClick={() => handleDelete(deleteConfirm)} style={{
                                flex: 1, height: 44, borderRadius: 12,
                                background: T.danger, color: '#fff', fontWeight: 700, fontSize: 13,
                            }}>Ya, Nonaktifkan</button>
                        </div>
                    </div>
                </>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
