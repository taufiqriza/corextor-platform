import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
    AlertTriangle,
    Building2,
    Check,
    Crosshair,
    Loader2,
    MapPin,
    Navigation,
    Pencil,
    Pin,
    Plus,
    Radius,
    RefreshCcw,
    Search,
    ShieldCheck,
    Trash2,
    X,
} from 'lucide-react';
import { attendanceApi } from '@/api/platform.api';
import type { AttendanceBranch } from '@/types/attendance.types';
import type { Theme } from '@/theme/tokens';

type LocationForm = {
    name: string;
    location: string;
    latitude: string;
    longitude: string;
    radius_meters: string;
};

const EMPTY_FORM: LocationForm = {
    name: '',
    location: '',
    latitude: '',
    longitude: '',
    radius_meters: '100',
};

export function CompanyBranchPanel({
    T,
    isDesktop,
    companyContextId,
}: {
    T: Theme;
    isDesktop: boolean;
    companyContextId?: number;
}) {
    const [locations, setLocations] = useState<AttendanceBranch[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingLocation, setEditingLocation] = useState<AttendanceBranch | null>(null);
    const [form, setForm] = useState<LocationForm>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [geoLoading, setGeoLoading] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<AttendanceBranch | null>(null);

    const loadLocations = async () => {
        setLoading(true);
        try {
            const response = await attendanceApi.getBranches(companyContextId);
            setLocations(response.data?.data ?? []);
        } catch {
            setLocations([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadLocations();
    }, [companyContextId]);

    const flash = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        window.setTimeout(() => setToast(null), type === 'success' ? 2800 : 3600);
    };

    const openCreate = () => {
        setEditingLocation(null);
        setForm(EMPTY_FORM);
        setShowModal(true);
    };

    const openEdit = (location: AttendanceBranch) => {
        setEditingLocation(location);
        setForm({
            name: location.name,
            location: location.location ?? '',
            latitude: location.latitude != null ? String(location.latitude) : '',
            longitude: location.longitude != null ? String(location.longitude) : '',
            radius_meters: String(location.radius_meters ?? 100),
        });
        setShowModal(true);
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            flash('Browser tidak mendukung Geolocation.', 'error');
            return;
        }

        setGeoLoading(true);
        navigator.geolocation.getCurrentPosition(
            position => {
                setForm(current => ({
                    ...current,
                    latitude: position.coords.latitude.toFixed(7),
                    longitude: position.coords.longitude.toFixed(7),
                }));
                setGeoLoading(false);
            },
            error => {
                flash(`Gagal mendapatkan lokasi: ${error.message}`, 'error');
                setGeoLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            flash('Nama lokasi wajib diisi.', 'error');
            return;
        }

        setSaving(true);
        try {
            const payload: Record<string, unknown> = {
                name: form.name.trim(),
                location: form.location.trim() || null,
                latitude: form.latitude ? parseFloat(form.latitude) : null,
                longitude: form.longitude ? parseFloat(form.longitude) : null,
                radius_meters: parseInt(form.radius_meters, 10) || 100,
            };

            if (editingLocation) {
                await attendanceApi.updateBranch(editingLocation.id, payload as Parameters<typeof attendanceApi.updateBranch>[1], companyContextId);
                flash('Lokasi berhasil diperbarui.', 'success');
            } else {
                await attendanceApi.createBranch(payload as Parameters<typeof attendanceApi.createBranch>[0], companyContextId);
                flash('Lokasi berhasil ditambahkan.', 'success');
            }

            setShowModal(false);
            await loadLocations();
        } catch {
            flash('Gagal menyimpan lokasi.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (location: AttendanceBranch) => {
        try {
            await attendanceApi.deleteBranch(location.id, companyContextId);
            flash(`${location.name} berhasil dinonaktifkan.`, 'success');
            setDeleteConfirm(null);
            await loadLocations();
        } catch {
            flash('Gagal menonaktifkan lokasi.', 'error');
        }
    };

    const filteredLocations = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return locations;
        return locations.filter(location =>
            location.name.toLowerCase().includes(query)
            || (location.location ?? '').toLowerCase().includes(query),
        );
    }, [locations, search]);

    const activeLocations = filteredLocations.filter(location => location.status === 'active');
    const inactiveLocations = filteredLocations.filter(location => location.status !== 'active');

    const topStats = [
        { label: 'Total Lokasi', value: locations.length, icon: Building2, tone: T.primary },
        { label: 'Aktif', value: locations.filter(location => location.status === 'active').length, icon: ShieldCheck, tone: T.success },
        { label: 'Dengan Geofence', value: locations.filter(location => location.has_geofence).length, icon: Radius, tone: T.info },
        { label: 'Tanpa Koordinat', value: locations.filter(location => !hasCoordinates(location)).length, icon: AlertTriangle, tone: T.gold },
    ];

    const s = {
        section: {
            background: `linear-gradient(180deg, ${T.card} 0%, ${T.bgAlt} 100%)`,
            border: `1px solid ${T.border}`,
            borderRadius: 24,
            padding: isDesktop ? 18 : 14,
            boxShadow: T.shadowSm,
        } satisfies CSSProperties,
        statCard: {
            position: 'relative',
            overflow: 'hidden',
            background: `linear-gradient(180deg, ${T.card} 0%, ${T.bgAlt} 100%)`,
            borderRadius: 18,
            border: `1px solid ${T.border}`,
            padding: isDesktop ? '14px 15px' : '12px 13px',
            boxShadow: T.shadowSm,
        } satisfies CSSProperties,
        controlCard: {
            marginTop: 12,
            borderRadius: 18,
            border: `1px solid ${T.border}`,
            background: T.card,
            padding: isDesktop ? 12 : 10,
            boxShadow: T.shadowSm,
        } satisfies CSSProperties,
        searchWrap: {
            flex: 1,
            minWidth: isDesktop ? 240 : '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: 40,
            borderRadius: 13,
            border: `1px solid ${T.border}`,
            background: T.bgAlt,
            padding: '0 12px',
        } satisfies CSSProperties,
        modalOverlay: {
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(2,8,23,.6)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
        } satisfies CSSProperties,
        modal: {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10000,
            width: 'min(760px, calc(100vw - 32px))',
            maxHeight: 'calc(100vh - 32px)',
            overflowY: 'auto',
            borderRadius: 24,
            background: T.card,
            border: `1px solid ${T.border}`,
            padding: 18,
            boxShadow: '0 28px 72px rgba(2,8,23,.28)',
        } satisfies CSSProperties,
        input: {
            width: '100%',
            height: 44,
            borderRadius: 12,
            border: `1px solid ${T.border}`,
            background: T.bgAlt,
            padding: '0 14px',
            fontSize: 13,
            color: T.text,
            boxSizing: 'border-box',
        } satisfies CSSProperties,
        textarea: {
            width: '100%',
            minHeight: 82,
            borderRadius: 12,
            border: `1px solid ${T.border}`,
            background: T.bgAlt,
            padding: '12px 14px',
            fontSize: 13,
            color: T.text,
            boxSizing: 'border-box',
            resize: 'vertical',
        } satisfies CSSProperties,
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80, color: T.textMuted }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ marginLeft: 10, fontSize: 14 }}>Memuat lokasi...</span>
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gap: 14 }}>
            {toast && (
                <div style={{
                    borderRadius: 16,
                    border: `1px solid ${toast.type === 'success' ? `${T.success}45` : `${T.danger}45`}`,
                    background: toast.type === 'success' ? `${T.success}10` : `${T.danger}10`,
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    color: toast.type === 'success' ? T.success : T.danger,
                    fontSize: 12.5,
                    fontWeight: 800,
                }}>
                    {toast.type === 'success' ? <Check size={15} /> : <AlertTriangle size={15} />}
                    {toast.message}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', gap: 10 }}>
                {topStats.map(card => (
                    <div key={card.label} style={s.statCard}>
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: `linear-gradient(135deg, ${card.tone}08 0%, transparent 42%)`,
                            pointerEvents: 'none',
                        }} />
                        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                            <div>
                                <div style={{ fontSize: 10.5, color: T.textMuted, fontWeight: 700 }}>
                                    {card.label}
                                </div>
                                <div style={{ fontSize: isDesktop ? 22 : 19, fontWeight: 900, color: T.text, marginTop: 7, fontFamily: "'Sora', sans-serif", lineHeight: 1 }}>
                                    {card.value}
                                </div>
                            </div>
                            <div style={{
                                width: 34,
                                height: 34,
                                borderRadius: 12,
                                background: `${card.tone}14`,
                                border: `1px solid ${card.tone}18`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <card.icon size={15} color={card.tone} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <section style={s.section}>
                <div style={{ display: 'flex', alignItems: isDesktop ? 'center' : 'flex-start', justifyContent: 'space-between', gap: 12, flexDirection: isDesktop ? 'row' : 'column' }}>
                    <div>
                        <div style={{ fontSize: 17, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>
                            Lokasi Kerja
                        </div>
                        <div style={{ marginTop: 4, fontSize: 11.5, color: T.textMuted, fontWeight: 700 }}>
                            Kelola titik kerja, koordinat GPS, dan radius geofence untuk absensi kantor maupun lapangan.
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={plainChipStyle(T)}>{filteredLocations.length} lokasi</span>
                        <span style={plainChipStyle(T)}>{activeLocations.length} aktif</span>
                    </div>
                </div>

                <div style={s.controlCard}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={s.searchWrap}>
                            <Search size={14} color={T.textMuted} />
                            <input
                                value={search}
                                onChange={event => setSearch(event.target.value)}
                                placeholder="Cari lokasi atau alamat..."
                                style={{ flex: 1, color: T.text, fontSize: 13, background: 'transparent', border: 'none', outline: 'none' }}
                            />
                            {search && (
                                <button type="button" onClick={() => setSearch('')} style={{ color: T.textMuted }}>
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => void loadLocations()}
                            style={{
                                height: 40,
                                width: 40,
                                borderRadius: 13,
                                border: `1px solid ${T.border}`,
                                background: T.bgAlt,
                                color: T.textSub,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <RefreshCcw size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={openCreate}
                            style={{
                                height: 40,
                                padding: '0 16px',
                                borderRadius: 13,
                                background: T.primary,
                                color: '#fff',
                                fontSize: 12,
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 7,
                            }}
                        >
                            <Plus size={14} />
                            Tambah Lokasi
                        </button>
                    </div>
                </div>

                {activeLocations.length === 0 && inactiveLocations.length === 0 ? (
                    <div style={{
                        marginTop: 12,
                        borderRadius: 20,
                        border: `1px solid ${T.border}`,
                        background: T.card,
                        padding: isDesktop ? 54 : 36,
                        textAlign: 'center',
                    }}>
                        <MapPin size={38} color={T.textMuted} style={{ opacity: 0.35, marginBottom: 12 }} />
                        <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>Belum ada lokasi kerja</div>
                        <div style={{ marginTop: 5, fontSize: 12, color: T.textMuted }}>
                            Tambahkan lokasi pertama untuk mulai mengatur titik absensi karyawan.
                        </div>
                    </div>
                ) : (
                    <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(2, minmax(0, 1fr))' : '1fr', gap: 12 }}>
                        {activeLocations.map(location => (
                            <article key={location.id} style={{
                                borderRadius: 20,
                                border: `1px solid ${T.border}`,
                                background: T.card,
                                boxShadow: T.shadowSm,
                                overflow: 'hidden',
                            }}>
                                <div style={{ position: 'relative', height: isDesktop ? 190 : 168, background: `${T.info}08`, borderBottom: `1px solid ${T.border}` }}>
                                    {hasCoordinates(location) ? (
                                        <iframe
                                            title={`Map ${location.name}`}
                                            src={buildEmbedMapUrl(location.latitude as number, location.longitude as number)}
                                            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: T.textMuted }}>
                                            <AlertTriangle size={18} color={T.gold} />
                                            <span style={{ fontSize: 11.5, fontWeight: 700 }}>Koordinat belum diatur</span>
                                        </div>
                                    )}

                                    <div style={{ position: 'absolute', inset: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pointerEvents: 'none' }}>
                                        <span style={statusChipStyle(T, true)}>
                                            Aktif
                                        </span>
                                        {location.has_geofence && (
                                            <span style={geofenceChipStyle(T)}>
                                                <Radius size={11} />
                                                {location.radius_meters ?? 0}m
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div style={{ padding: '16px 16px 14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: 15, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>
                                                {location.name}
                                            </div>
                                            <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 6, color: T.textMuted, fontSize: 11.5, fontWeight: 700 }}>
                                                <MapPin size={12} color={T.primary} />
                                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {location.location || 'Tanpa deskripsi alamat'}
                                                </span>
                                            </div>
                                        </div>
                                        <a
                                            href={hasCoordinates(location) ? buildExternalMapUrl(location.latitude as number, location.longitude as number) : undefined}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{
                                                ...secondaryButtonStyle(T),
                                                pointerEvents: hasCoordinates(location) ? 'auto' : 'none',
                                                opacity: hasCoordinates(location) ? 1 : 0.55,
                                                textDecoration: 'none',
                                            }}
                                        >
                                            <Navigation size={12} />
                                            Peta
                                        </a>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginTop: 14 }}>
                                        <MiniInfoCard T={T} icon={Pin} label="Koordinat" value={hasCoordinates(location) ? formatCoordinatePair(location) : 'Belum ada'} tone={T.primary} />
                                        <MiniInfoCard T={T} icon={Radius} label="Radius" value={location.has_geofence ? `${location.radius_meters ?? 0}m` : 'Off'} tone={T.info} />
                                        <MiniInfoCard T={T} icon={ShieldCheck} label="Validasi" value={location.has_geofence ? 'Aktif' : 'Manual'} tone={location.has_geofence ? T.success : T.gold} />
                                    </div>

                                    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                                        <button type="button" onClick={() => openEdit(location)} style={primaryGhostButtonStyle(T)}>
                                            <Pencil size={12} />
                                            Edit
                                        </button>
                                        <button type="button" onClick={() => setDeleteConfirm(location)} style={dangerIconButtonStyle(T)}>
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                {inactiveLocations.length > 0 && (
                    <div style={{ marginTop: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
                            Lokasi Nonaktif ({inactiveLocations.length})
                        </div>
                        <div style={{ display: 'grid', gap: 8 }}>
                            {inactiveLocations.map(location => (
                                <div key={location.id} style={{
                                    borderRadius: 16,
                                    border: `1px solid ${T.border}`,
                                    background: T.card,
                                    padding: '12px 14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 12,
                                    opacity: 0.72,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                        <div style={{
                                            width: 34,
                                            height: 34,
                                            borderRadius: 11,
                                            background: `${T.danger}10`,
                                            border: `1px solid ${T.danger}22`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            <MapPin size={14} color={T.danger} />
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: 12.5, fontWeight: 800, color: T.text }}>
                                                {location.name}
                                            </div>
                                            <div style={{ marginTop: 3, fontSize: 10.5, color: T.textMuted }}>
                                                {location.location || 'Tanpa deskripsi lokasi'}
                                            </div>
                                        </div>
                                    </div>
                                    <span style={statusChipStyle(T, false)}>
                                        Nonaktif
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {showModal && (
                <>
                    <div onClick={() => setShowModal(false)} style={s.modalOverlay} />
                    <div style={s.modal}>
                        <div style={{
                            display: 'grid',
                            gap: 12,
                            marginBottom: 16,
                            padding: 14,
                            borderRadius: 22,
                            border: `1px solid ${T.border}`,
                            background: `linear-gradient(180deg, ${T.card} 0%, ${T.bgAlt} 100%)`,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>
                                        {editingLocation ? 'Edit Lokasi' : 'Tambah Lokasi'}
                                    </div>
                                    <div style={{ marginTop: 4, fontSize: 11.5, color: T.textMuted, fontWeight: 700 }}>
                                        Atur nama lokasi, koordinat GPS, dan radius geofence untuk validasi absensi.
                                    </div>
                                </div>
                                <button type="button" onClick={() => setShowModal(false)} style={modalCloseButtonStyle(T)}>
                                    <X size={16} />
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(3, minmax(0, 1fr))' : '1fr', gap: 8 }}>
                                <MiniMetric T={T} icon={Building2} tone={T.primary} label="Status" value={editingLocation ? 'Perbarui' : 'Baru'} />
                                <MiniMetric T={T} icon={Radius} tone={T.info} label="Radius" value={`${form.radius_meters}m`} />
                                <MiniMetric T={T} icon={Pin} tone={form.latitude && form.longitude ? T.success : T.gold} label="Koordinat" value={form.latitude && form.longitude ? 'Siap' : 'Belum'} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gap: 14 }}>
                            <div style={formSurfaceStyle(T)}>
                                <div style={formHeadStyle(T)}>
                                    <span style={formLabelStyle(T)}>
                                        <MapPin size={14} color={T.primary} />
                                        Informasi Utama
                                    </span>
                                </div>
                                <div style={{ padding: 16, display: 'grid', gap: 14 }}>
                                    <div>
                                        <label style={fieldLabelStyle(T)}>Nama Lokasi *</label>
                                        <input
                                            value={form.name}
                                            onChange={event => setForm(current => ({ ...current, name: event.target.value }))}
                                            placeholder="Gudang Proyek Barat"
                                            style={s.input}
                                        />
                                    </div>
                                    <div>
                                        <label style={fieldLabelStyle(T)}>Alamat / Deskripsi Lokasi</label>
                                        <textarea
                                            value={form.location}
                                            onChange={event => setForm(current => ({ ...current, location: event.target.value }))}
                                            placeholder="Jl. Proyek Industri No. 8, Surabaya"
                                            style={s.textarea}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'minmax(0, 1fr) 300px' : '1fr', gap: 14 }}>
                                <div style={formSurfaceStyle(T)}>
                                    <div style={formHeadStyle(T)}>
                                        <span style={formLabelStyle(T)}>
                                            <Crosshair size={14} color={T.info} />
                                            Koordinat GPS
                                        </span>
                                        <button type="button" onClick={handleGetLocation} disabled={geoLoading} style={secondaryButtonStyle(T)}>
                                            {geoLoading ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Navigation size={12} />}
                                            {geoLoading ? 'Mencari...' : 'Lokasi Saya'}
                                        </button>
                                    </div>
                                    <div style={{ padding: 16, display: 'grid', gap: 14 }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                            <div>
                                                <label style={fieldLabelStyle(T)}>Latitude</label>
                                                <input
                                                    value={form.latitude}
                                                    onChange={event => setForm(current => ({ ...current, latitude: event.target.value }))}
                                                    placeholder="-6.2088000"
                                                    type="number"
                                                    step="0.0000001"
                                                    style={s.input}
                                                />
                                            </div>
                                            <div>
                                                <label style={fieldLabelStyle(T)}>Longitude</label>
                                                <input
                                                    value={form.longitude}
                                                    onChange={event => setForm(current => ({ ...current, longitude: event.target.value }))}
                                                    placeholder="106.8456000"
                                                    type="number"
                                                    step="0.0000001"
                                                    style={s.input}
                                                />
                                            </div>
                                        </div>

                                        {form.latitude && form.longitude ? (
                                            <div style={{
                                                borderRadius: 14,
                                                border: `1px solid ${T.success}25`,
                                                background: `${T.success}10`,
                                                padding: '10px 12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                color: T.success,
                                                fontSize: 11.5,
                                                fontWeight: 700,
                                            }}>
                                                <Check size={13} />
                                                {parseFloat(form.latitude).toFixed(5)}, {parseFloat(form.longitude).toFixed(5)}
                                            </div>
                                        ) : (
                                            <div style={{
                                                borderRadius: 14,
                                                border: `1px dashed ${T.border}`,
                                                background: T.bgAlt,
                                                padding: '10px 12px',
                                                color: T.textMuted,
                                                fontSize: 11.5,
                                                fontWeight: 700,
                                            }}>
                                                Koordinat belum diisi.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={formSurfaceStyle(T)}>
                                    <div style={formHeadStyle(T)}>
                                        <span style={formLabelStyle(T)}>
                                            <Radius size={14} color={T.gold} />
                                            Radius Geofence
                                        </span>
                                    </div>
                                    <div style={{ padding: 16, display: 'grid', gap: 14 }}>
                                        <input
                                            type="range"
                                            min="10"
                                            max="1000"
                                            step="10"
                                            value={form.radius_meters}
                                            onChange={event => setForm(current => ({ ...current, radius_meters: event.target.value }))}
                                            style={{ width: '100%', accentColor: T.gold }}
                                        />
                                        <div style={{
                                            borderRadius: 16,
                                            border: `1px solid ${T.gold}24`,
                                            background: `${T.gold}10`,
                                            padding: '12px 14px',
                                            textAlign: 'center',
                                        }}>
                                            <div style={{ fontSize: 22, fontWeight: 900, color: T.gold, fontFamily: "'Sora', sans-serif" }}>
                                                {form.radius_meters}
                                            </div>
                                            <div style={{ fontSize: 10.5, color: T.textMuted, fontWeight: 700 }}>
                                                meter
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                                            {[
                                                { label: '50m', value: '50' },
                                                { label: '100m', value: '100' },
                                                { label: '200m', value: '200' },
                                                { label: '500m', value: '500' },
                                            ].map(item => {
                                                const active = form.radius_meters === item.value;
                                                return (
                                                    <button
                                                        key={item.value}
                                                        type="button"
                                                        onClick={() => setForm(current => ({ ...current, radius_meters: item.value }))}
                                                        style={{
                                                            height: 34,
                                                            borderRadius: 10,
                                                            border: `1px solid ${active ? `${T.gold}45` : T.border}`,
                                                            background: active ? `${T.gold}12` : T.bgAlt,
                                                            color: active ? T.gold : T.textSub,
                                                            fontSize: 11,
                                                            fontWeight: 800,
                                                        }}
                                                    >
                                                        {item.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {(form.latitude && form.longitude) && (
                                <div style={formSurfaceStyle(T)}>
                                    <div style={formHeadStyle(T)}>
                                        <span style={formLabelStyle(T)}>
                                            <Navigation size={14} color={T.primary} />
                                            Preview Lokasi
                                        </span>
                                        <a
                                            href={buildExternalMapUrl(parseFloat(form.latitude), parseFloat(form.longitude))}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{ ...secondaryButtonStyle(T), textDecoration: 'none' }}
                                        >
                                            <Pin size={12} />
                                            Buka Peta
                                        </a>
                                    </div>
                                    <iframe
                                        title="Preview lokasi"
                                        src={buildEmbedMapUrl(parseFloat(form.latitude), parseFloat(form.longitude))}
                                        style={{ width: '100%', height: 220, border: 'none', display: 'block' }}
                                        loading="lazy"
                                    />
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                <button type="button" onClick={() => setShowModal(false)} style={secondaryFooterButtonStyle(T)}>
                                    Batal
                                </button>
                                <button type="button" onClick={handleSave} disabled={saving} style={primaryFooterButtonStyle(T, saving)}>
                                    {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />}
                                    {saving ? 'Menyimpan...' : editingLocation ? 'Simpan Perubahan' : 'Tambah Lokasi'}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {deleteConfirm && (
                <>
                    <div onClick={() => setDeleteConfirm(null)} style={s.modalOverlay} />
                    <div style={{
                        ...s.modal,
                        width: 'min(420px, calc(100vw - 32px))',
                        padding: 22,
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                width: 60,
                                height: 60,
                                borderRadius: 18,
                                background: `${T.danger}12`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px',
                            }}>
                                <Trash2 size={24} color={T.danger} />
                            </div>
                            <div style={{ fontSize: 17, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>
                                Nonaktifkan Lokasi?
                            </div>
                            <div style={{ marginTop: 8, fontSize: 12, color: T.textMuted, lineHeight: 1.7 }}>
                                <strong style={{ color: T.text }}>{deleteConfirm.name}</strong> akan dinonaktifkan dan tidak lagi dipakai sebagai titik absensi aktif.
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                            <button type="button" onClick={() => setDeleteConfirm(null)} style={secondaryFooterButtonStyle(T)}>
                                Batal
                            </button>
                            <button type="button" onClick={() => void handleDelete(deleteConfirm)} style={dangerFooterButtonStyle(T)}>
                                Ya, Nonaktifkan
                            </button>
                        </div>
                    </div>
                </>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

function hasCoordinates(location: AttendanceBranch): boolean {
    return location.latitude != null && location.longitude != null;
}

function formatCoordinatePair(location: AttendanceBranch): string {
    if (!hasCoordinates(location)) return 'Belum ada';
    return `${location.latitude!.toFixed(3)}, ${location.longitude!.toFixed(3)}`;
}

function buildEmbedMapUrl(latitude: number, longitude: number): string {
    const delta = 0.0045;
    const left = longitude - delta;
    const bottom = latitude - delta;
    const right = longitude + delta;
    const top = latitude + delta;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(`${left},${bottom},${right},${top}`)}&layer=mapnik&marker=${latitude},${longitude}`;
}

function buildExternalMapUrl(latitude: number, longitude: number): string {
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

function plainChipStyle(T: Theme): CSSProperties {
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

function statusChipStyle(T: Theme, active: boolean): CSSProperties {
    return {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 26,
        padding: '0 9px',
        borderRadius: 999,
        background: active ? `${T.success}14` : `${T.danger}12`,
        color: active ? T.success : T.danger,
        fontSize: 10,
        fontWeight: 800,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
    };
}

function geofenceChipStyle(T: Theme): CSSProperties {
    return {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        height: 26,
        padding: '0 9px',
        borderRadius: 999,
        background: `${T.card}D6`,
        color: T.text,
        border: `1px solid ${T.border}`,
        fontSize: 10,
        fontWeight: 800,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        pointerEvents: 'auto',
    };
}

function secondaryButtonStyle(T: Theme): CSSProperties {
    return {
        height: 30,
        padding: '0 10px',
        borderRadius: 999,
        border: `1px solid ${T.border}`,
        background: T.bgAlt,
        color: T.primary,
        fontSize: 10.5,
        fontWeight: 800,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
    };
}

function primaryGhostButtonStyle(T: Theme): CSSProperties {
    return {
        flex: 1,
        height: 34,
        borderRadius: 11,
        border: `1px solid ${T.primary}30`,
        background: `${T.primary}08`,
        color: T.primary,
        fontSize: 11,
        fontWeight: 800,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    };
}

function dangerIconButtonStyle(T: Theme): CSSProperties {
    return {
        width: 34,
        height: 34,
        borderRadius: 11,
        border: `1px solid ${T.danger}28`,
        background: `${T.danger}08`,
        color: T.danger,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };
}

function modalCloseButtonStyle(T: Theme): CSSProperties {
    return {
        width: 40,
        height: 40,
        borderRadius: 14,
        border: `1px solid ${T.border}`,
        background: T.bgAlt,
        color: T.textSub,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    };
}

function formSurfaceStyle(T: Theme): CSSProperties {
    return {
        borderRadius: 20,
        border: `1px solid ${T.border}`,
        background: T.card,
        overflow: 'hidden',
    };
}

function formHeadStyle(T: Theme): CSSProperties {
    return {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        padding: '14px 16px 12px',
        borderBottom: `1px solid ${T.border}`,
    };
}

function formLabelStyle(T: Theme): CSSProperties {
    return {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        fontSize: 11.5,
        fontWeight: 800,
        color: T.text,
    };
}

function fieldLabelStyle(T: Theme): CSSProperties {
    return {
        display: 'block',
        marginBottom: 6,
        fontSize: 10.5,
        fontWeight: 800,
        color: T.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    };
}

function primaryFooterButtonStyle(T: Theme, disabled: boolean): CSSProperties {
    return {
        height: 44,
        padding: '0 18px',
        borderRadius: 12,
        background: T.primary,
        color: '#fff',
        fontSize: 12,
        fontWeight: 800,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        opacity: disabled ? 0.65 : 1,
    };
}

function secondaryFooterButtonStyle(T: Theme): CSSProperties {
    return {
        height: 44,
        padding: '0 18px',
        borderRadius: 12,
        border: `1px solid ${T.border}`,
        background: T.bgAlt,
        color: T.textSub,
        fontSize: 12,
        fontWeight: 800,
    };
}

function dangerFooterButtonStyle(T: Theme): CSSProperties {
    return {
        height: 44,
        padding: '0 18px',
        borderRadius: 12,
        background: T.danger,
        color: '#fff',
        fontSize: 12,
        fontWeight: 800,
    };
}

function MiniInfoCard({
    T,
    icon: Icon,
    label,
    value,
    tone,
}: {
    T: Theme;
    icon: typeof MapPin;
    label: string;
    value: string;
    tone: string;
}) {
    return (
        <div style={{
            borderRadius: 14,
            border: `1px solid ${T.border}`,
            background: T.bgAlt,
            padding: '10px 11px',
            minWidth: 0,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 10, color: T.textMuted, fontWeight: 800 }}>
                    {label}
                </span>
                <Icon size={12} color={tone} />
            </div>
            <div style={{
                marginTop: 7,
                fontSize: 12,
                fontWeight: 800,
                color: T.text,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            }}>
                {value}
            </div>
        </div>
    );
}

function MiniMetric({
    T,
    icon: Icon,
    label,
    value,
    tone,
}: {
    T: Theme;
    icon: typeof Building2;
    label: string;
    value: string;
    tone: string;
}) {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '36px minmax(0, 1fr)',
            alignItems: 'center',
            gap: 10,
            minHeight: 54,
            borderRadius: 16,
            border: `1px solid ${T.border}`,
            background: T.card,
            padding: '9px 11px',
        }}>
            <div style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                border: `1px solid ${T.border}`,
                background: T.bgAlt,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <Icon size={14} color={tone} />
            </div>
            <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 800, textTransform: 'uppercase' }}>
                    {label}
                </div>
                <div style={{ marginTop: 3, fontSize: 12.5, color: T.text, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {value}
                </div>
            </div>
        </div>
    );
}
