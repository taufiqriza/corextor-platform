import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Building2, Save, Users, Shield, Crown, Mail, Phone,
    MapPin, Briefcase, ChevronRight, Check, AlertTriangle,
    Loader2, Pencil, Trash2, UploadCloud, X,
} from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { platformApi } from '@/api/platform.api';
import { useAuthStore } from '@/store/authStore';
import { normalizePublicAssetUrl } from '@/lib/publicAsset';

/* ═══ Types ═══ */
type CompanyProfile = {
    id: number;
    name: string;
    code: string;
    logo_url: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    industry: string | null;
    status: string;
};

type Member = {
    id: number;
    user_id: number;
    role: string;
    status: string;
    created_at: string;
    user: { id: number; name: string; email: string } | null;
};

type MemberStats = {
    total: number;
    admins: number;
    employees: number;
    active: number;
    suspended: number;
};

type ActiveSection = 'profile' | 'team' | 'security';

/* ═══ Settings Panel ═══ */
export function CompanySettingsPanel({ T, isDesktop }: { T: Theme; isDesktop: boolean }) {
    const user = useAuthStore(s => s.user);
    const fetchMe = useAuthStore(s => s.fetchMe);

    const [activeSection, setActiveSection] = useState<ActiveSection>('profile');
    const [company, setCompany] = useState<CompanyProfile | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [stats, setStats] = useState<MemberStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Editable profile
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({ name: '', address: '', phone: '', email: '', industry: '' });
    const [logoUploading, setLogoUploading] = useState(false);
    const [logoRemoving, setLogoRemoving] = useState(false);
    const logoInputRef = useRef<HTMLInputElement | null>(null);

    // Role change modal
    const [roleModal, setRoleModal] = useState<Member | null>(null);

    const fetchProfile = useCallback(async () => {
        setLoading(true);
        try {
            const res = await platformApi.getMyProfile();
            const d = res.data.data;
            setCompany(d.company ? {
                ...d.company,
                logo_url: normalizePublicAssetUrl(d.company.logo_url),
            } : null);
            setStats(d.stats);
            setForm({
                name: d.company.name ?? '',
                address: d.company.address ?? '',
                phone: d.company.phone ?? '',
                email: d.company.email ?? '',
                industry: d.company.industry ?? '',
            });
        } catch { /* ignore */ }
        setLoading(false);
    }, []);

    const fetchMembers = useCallback(async () => {
        try {
            const res = await platformApi.getMyMembers();
            setMembers(res.data.data.members);
            setStats(res.data.data.stats);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => { fetchProfile(); fetchMembers(); }, [fetchProfile, fetchMembers]);

    const handleSaveProfile = async () => {
        setSaving(true);
        setSuccessMsg('');
        setErrorMsg('');
        try {
            await platformApi.updateMyProfile(form);
            setSuccessMsg('Profil berhasil diperbarui!');
            setEditMode(false);
            await fetchProfile();
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch {
            setErrorMsg('Gagal menyimpan. Coba lagi.');
            setTimeout(() => setErrorMsg(''), 4000);
        }
        setSaving(false);
    };

    const handleRoleChange = async (member: Member, newRole: string) => {
        try {
            await platformApi.updateMyMember(member.id, { role: newRole });
            setRoleModal(null);
            await fetchMembers();
            setSuccessMsg('Role berhasil diubah!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch {
            setErrorMsg('Gagal mengubah role.');
            setTimeout(() => setErrorMsg(''), 4000);
        }
    };

    const handleLogoSelect = () => {
        if (logoUploading || logoRemoving) return;
        logoInputRef.current?.click();
    };

    const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLogoUploading(true);
        setSuccessMsg('');
        setErrorMsg('');

        try {
            const formData = new FormData();
            formData.append('logo', file);
            await platformApi.updateMyCompanyLogo(formData);
            await fetchProfile();
            await fetchMe();
            setSuccessMsg('Logo perusahaan berhasil diperbarui!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch {
            setErrorMsg('Gagal mengunggah logo perusahaan.');
            setTimeout(() => setErrorMsg(''), 4000);
        } finally {
            setLogoUploading(false);
            event.target.value = '';
        }
    };

    const handleRemoveLogo = async () => {
        if (!company?.logo_url || logoUploading || logoRemoving) return;
        if (!window.confirm('Hapus logo perusahaan saat ini?')) return;

        setLogoRemoving(true);
        setSuccessMsg('');
        setErrorMsg('');

        try {
            await platformApi.removeMyCompanyLogo();
            await fetchProfile();
            await fetchMe();
            setSuccessMsg('Logo perusahaan berhasil dihapus!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch {
            setErrorMsg('Gagal menghapus logo perusahaan.');
            setTimeout(() => setErrorMsg(''), 4000);
        } finally {
            setLogoRemoving(false);
        }
    };

    /* ═══ Shared Styles ═══ */
    const card = (p?: React.CSSProperties): React.CSSProperties => ({
        background: T.card, borderRadius: 16, border: `1px solid ${T.border}`,
        padding: isDesktop ? 24 : 18, marginBottom: 16, ...p,
    });

    const inputStyle: React.CSSProperties = {
        width: '100%', height: 44, borderRadius: 12,
        border: `1px solid ${T.border}`, background: T.bgAlt,
        padding: '0 14px', fontSize: 13, color: T.text,
        transition: 'border-color .15s',
    };

    const labelStyle: React.CSSProperties = {
        fontSize: 11, fontWeight: 700, color: T.textSub,
        marginBottom: 6, display: 'block', textTransform: 'uppercase',
        letterSpacing: 0.5,
    };

    /* ═══ Section Nav ═══ */
    const sections: { key: ActiveSection; label: string; icon: typeof Building2; desc: string }[] = [
        { key: 'profile', label: 'Profil Perusahaan', icon: Building2, desc: 'Nama, alamat, kontak' },
        { key: 'team', label: 'Tim & Role', icon: Users, desc: 'Kelola anggota & peran' },
        { key: 'security', label: 'Keamanan', icon: Shield, desc: 'Akses & informasi' },
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80, color: T.textMuted }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ marginLeft: 10, fontSize: 14 }}>Memuat pengaturan…</span>
            </div>
        );
    }

    return (
        <div style={{ width: '100%' }}>
            {/* Toast */}
            {successMsg && (
                <div style={{ ...card({ marginBottom: 16, padding: '12px 16px', borderColor: `${T.success}50`, background: `${T.success}10` }), display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Check size={16} color={T.success} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.success }}>{successMsg}</span>
                </div>
            )}
            {errorMsg && (
                <div style={{ ...card({ marginBottom: 16, padding: '12px 16px', borderColor: `${T.danger}50`, background: `${T.danger}10` }), display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AlertTriangle size={16} color={T.danger} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.danger }}>{errorMsg}</span>
                </div>
            )}

            {/* Section Nav */}
            <div style={{
                ...card({ padding: 8 }),
                display: 'flex', gap: 6,
                flexDirection: isDesktop ? 'row' : 'column',
            }}>
                {sections.map(s => {
                    const active = activeSection === s.key;
                    const Icon = s.icon;
                    return (
                        <button key={s.key} onClick={() => setActiveSection(s.key)} style={{
                            flex: 1, display: 'flex', alignItems: 'center', gap: 12,
                            padding: '14px 16px', borderRadius: 12,
                            background: active ? `${T.primary}14` : 'transparent',
                            border: active ? `1.5px solid ${T.primary}40` : '1.5px solid transparent',
                            color: active ? T.primary : T.textSub,
                            transition: 'all .15s ease', textAlign: 'left',
                        }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 12,
                                background: active ? `${T.primary}20` : T.bgAlt,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                                <Icon size={18} />
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: active ? 800 : 600, color: active ? T.text : T.textSub }}>{s.label}</div>
                                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{s.desc}</div>
                            </div>
                            {isDesktop && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: active ? 1 : 0.3 }} />}
                        </button>
                    );
                })}
            </div>

            {/* ═══ PROFILE SECTION ═══ */}
            {activeSection === 'profile' && (
                <>
                    <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handleLogoChange}
                        style={{ display: 'none' }}
                    />
                    {/* Company Logo + Name Header */}
                    <div style={card()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                    <button
                                        onClick={handleLogoSelect}
                                        disabled={logoUploading || logoRemoving}
                                        style={{
                                            width: 64, height: 64, borderRadius: 16,
                                            background: `linear-gradient(135deg, ${T.primary}30, ${T.primary}10)`,
                                            border: `2px dashed ${T.primary}40`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: logoUploading || logoRemoving ? 'not-allowed' : 'pointer',
                                            opacity: logoUploading || logoRemoving ? 0.7 : 1,
                                            overflow: 'hidden',
                                        }}
                                        title="Ubah logo perusahaan"
                                    >
                                        {company?.logo_url ? (
                                            <img src={company.logo_url} alt="Logo" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover' }} />
                                        ) : (
                                            <Building2 size={28} color={T.primary} />
                                        )}
                                    </button>

                                    <button
                                        onClick={handleLogoSelect}
                                        disabled={logoUploading || logoRemoving}
                                        title="Upload logo"
                                        style={{
                                            position: 'absolute',
                                            right: -4,
                                            bottom: -4,
                                            width: 28,
                                            height: 28,
                                            borderRadius: 10,
                                            border: `1px solid ${T.card}`,
                                            background: logoUploading ? `${T.primary}80` : T.primary,
                                            color: '#fff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: T.shadowSm,
                                            cursor: logoUploading || logoRemoving ? 'not-allowed' : 'pointer',
                                        }}
                                    >
                                        {logoUploading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <UploadCloud size={13} />}
                                    </button>
                                </div>
                                <div>
                                    <h3 style={{ fontSize: 20, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>
                                        {company?.name ?? 'Perusahaan'}
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                        <span style={{
                                            fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                                            background: `${T.primary}15`, color: T.primary, textTransform: 'uppercase', letterSpacing: 0.5,
                                        }}>
                                            {company?.code}
                                        </span>
                                        <span style={{
                                            fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                                            background: company?.status === 'active' ? `${T.success}15` : `${T.danger}15`,
                                            color: company?.status === 'active' ? T.success : T.danger,
                                        }}>
                                            {company?.status === 'active' ? '● Aktif' : '● Non-aktif'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                {company?.logo_url && (
                                    <button
                                        onClick={handleRemoveLogo}
                                        disabled={logoUploading || logoRemoving}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            padding: '8px 14px', borderRadius: 10,
                                            background: `${T.danger}10`,
                                            color: T.danger,
                                            border: `1px solid ${T.danger}30`,
                                            fontWeight: 700, fontSize: 12,
                                            opacity: logoRemoving ? 0.7 : 1,
                                        }}
                                    >
                                        {logoRemoving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
                                        Hapus Logo
                                    </button>
                                )}

                                <button onClick={() => setEditMode(!editMode)} style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '8px 16px', borderRadius: 10,
                                    background: editMode ? `${T.danger}10` : `${T.primary}10`,
                                    color: editMode ? T.danger : T.primary,
                                    border: `1px solid ${editMode ? `${T.danger}30` : `${T.primary}30`}`,
                                    fontWeight: 700, fontSize: 12,
                                }}>
                                    {editMode ? <><X size={14} /> Batal</> : <><Pencil size={14} /> Edit</>}
                                </button>
                            </div>
                        </div>

                        {/* Stats Row */}
                        {stats && (
                            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(4,1fr)' : 'repeat(2,1fr)', gap: 10, marginBottom: editMode ? 24 : 0 }}>
                                {[
                                    { label: 'Total Anggota', value: stats.total, color: T.primary },
                                    { label: 'Admin', value: stats.admins, color: T.gold },
                                    { label: 'Karyawan', value: stats.employees, color: T.info },
                                    { label: 'Aktif', value: stats.active, color: T.success },
                                ].map(s => (
                                    <div key={s.label} style={{
                                        padding: '12px 14px', borderRadius: 12,
                                        background: `${s.color}08`, border: `1px solid ${s.color}20`,
                                    }}>
                                        <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
                                        <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, marginTop: 2 }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Edit Form */}
                        {editMode && (
                            <div>
                                <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: 16 }}>
                                    <div>
                                        <label style={labelStyle}><Building2 size={11} style={{ display: 'inline', marginRight: 4 }} />Nama Perusahaan</label>
                                        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="PT. Contoh Indonesia" />
                                    </div>
                                    <div>
                                        <label style={labelStyle}><Briefcase size={11} style={{ display: 'inline', marginRight: 4 }} />Industri</label>
                                        <input value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} style={inputStyle} placeholder="Teknologi, Retail, dll" />
                                    </div>
                                    <div>
                                        <label style={labelStyle}><Mail size={11} style={{ display: 'inline', marginRight: 4 }} />Email Perusahaan</label>
                                        <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} placeholder="info@company.com" />
                                    </div>
                                    <div>
                                        <label style={labelStyle}><Phone size={11} style={{ display: 'inline', marginRight: 4 }} />Telepon</label>
                                        <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} placeholder="+62 812 3456 7890" />
                                    </div>
                                    <div style={{ gridColumn: isDesktop ? 'span 2' : 'span 1' }}>
                                        <label style={labelStyle}><MapPin size={11} style={{ display: 'inline', marginRight: 4 }} />Alamat</label>
                                        <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={inputStyle} placeholder="Jl. Contoh No. 123, Jakarta" />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                                    <button onClick={handleSaveProfile} disabled={saving} style={{
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        padding: '10px 24px', borderRadius: 12,
                                        background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`,
                                        color: '#fff', fontWeight: 800, fontSize: 13,
                                        opacity: saving ? 0.6 : 1, boxShadow: T.shadowSm,
                                    }}>
                                        {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
                                        {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Read-only info (when not editing) */}
                        {!editMode && (
                            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: 0, marginTop: 16 }}>
                                {[
                                    { label: 'Industri', value: company?.industry, icon: Briefcase },
                                    { label: 'Email', value: company?.email, icon: Mail },
                                    { label: 'Telepon', value: company?.phone, icon: Phone },
                                    { label: 'Alamat', value: company?.address, icon: MapPin },
                                ].map(item => (
                                    <div key={item.label} style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        padding: '12px 0', borderBottom: `1px solid ${T.border}40`,
                                    }}>
                                        <div style={{
                                            width: 32, height: 32, borderRadius: 8,
                                            background: T.bgAlt, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: T.textMuted, flexShrink: 0,
                                        }}>
                                            <item.icon size={14} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted }}>{item.label}</div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: item.value ? T.text : T.textMuted }}>
                                                {item.value || 'Belum diisi'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ═══ TEAM SECTION ═══ */}
            {activeSection === 'team' && (
                <div style={card()}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 900, color: T.text }}>Anggota Tim</h3>
                            <p style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>
                                {stats?.total ?? 0} anggota • {stats?.admins ?? 0} admin • {stats?.employees ?? 0} karyawan
                            </p>
                        </div>
                    </div>

                    {/* Member List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {members.map(m => {
                            const isAdmin = m.role === 'company_admin';
                            const isSelf = m.user_id === user?.id;
                            return (
                                <div key={m.id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '14px 16px', borderRadius: 14,
                                    background: isAdmin ? `${T.gold}06` : T.bgAlt,
                                    border: `1px solid ${isAdmin ? `${T.gold}25` : T.border}`,
                                    transition: 'all .15s ease',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 40, height: 40, borderRadius: 12,
                                            background: isAdmin ? `linear-gradient(135deg, ${T.gold}30, ${T.gold}10)` : `${T.primary}15`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: isAdmin ? T.gold : T.primary,
                                            fontWeight: 900, fontSize: 14, flexShrink: 0,
                                        }}>
                                            {(m.user?.name ?? '?').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{m.user?.name ?? '-'}</span>
                                                {isSelf && (
                                                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: `${T.info}15`, color: T.info }}>
                                                        Anda
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{m.user?.email ?? '-'}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{
                                            display: 'flex', alignItems: 'center', gap: 4,
                                            fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
                                            background: isAdmin ? `${T.gold}15` : `${T.info}12`,
                                            color: isAdmin ? T.gold : T.info,
                                            border: `1px solid ${isAdmin ? `${T.gold}30` : `${T.info}25`}`,
                                        }}>
                                            {isAdmin ? <Crown size={10} /> : <Users size={10} />}
                                            {isAdmin ? 'Admin' : 'Employee'}
                                        </span>
                                        {!isSelf && (
                                            <button onClick={() => setRoleModal(m)} style={{
                                                width: 32, height: 32, borderRadius: 8,
                                                border: `1px solid ${T.border}`, background: T.card,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: T.textMuted, cursor: 'pointer',
                                            }}>
                                                <Pencil size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {members.length === 0 && (
                            <div style={{ textAlign: 'center', padding: 40, color: T.textMuted }}>
                                <Users size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                                <div style={{ fontSize: 13 }}>Belum ada anggota</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══ SECURITY SECTION ═══ */}
            {activeSection === 'security' && (
                <div style={card()}>
                    <h3 style={{ fontSize: 16, fontWeight: 900, color: T.text, marginBottom: 16 }}>Informasi Keamanan</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[
                            { label: 'Login Sebagai', value: user?.name ?? '-', sub: user?.email ?? '-' },
                            { label: 'Role', value: 'Company Admin', sub: 'Akses penuh ke portal perusahaan' },
                            { label: 'Kode Perusahaan', value: company?.code ?? '-', sub: 'Digunakan untuk identifikasi unik' },
                            { label: 'Status Akun', value: company?.status === 'active' ? 'Aktif' : 'Non-aktif', sub: 'Status subscription perusahaan' },
                        ].map(item => (
                            <div key={item.label} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '14px 16px', borderRadius: 12, background: T.bgAlt,
                                border: `1px solid ${T.border}`,
                            }}>
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, marginBottom: 2 }}>{item.label}</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{item.value}</div>
                                </div>
                                <div style={{ fontSize: 10, color: T.textMuted, textAlign: 'right', maxWidth: '50%' }}>{item.sub}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{
                        marginTop: 20, padding: '14px 16px', borderRadius: 12,
                        background: `${T.gold}08`, border: `1px solid ${T.gold}25`,
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                    }}>
                        <AlertTriangle size={18} color={T.gold} style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>Perubahan Password</div>
                            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                                Untuk mengubah password, silakan hubungi administrator Corextor atau gunakan fitur reset password pada halaman login.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ Role Change Modal ═══ */}
            {roleModal && (
                <>
                    <div onClick={() => setRoleModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)', zIndex: 9999 }} />
                    <div style={{
                        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 10000,
                        width: 'min(400px, calc(100vw - 32px))', borderRadius: 20,
                        background: T.card, border: `1px solid ${T.border}`, padding: 24,
                        boxShadow: '0 24px 60px rgba(0,0,0,.4)',
                    }}>
                        <h3 style={{ fontSize: 16, fontWeight: 900, color: T.text, marginBottom: 6 }}>Ubah Role</h3>
                        <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 20 }}>
                            Ubah role untuk <strong style={{ color: T.text }}>{roleModal.user?.name}</strong>
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                            {[
                                { role: 'company_admin', label: 'Admin', desc: 'Akses penuh ke semua fitur portal', icon: Crown, color: T.gold },
                                { role: 'employee', label: 'Employee', desc: 'Akses ke absensi dan laporan', icon: Users, color: T.info },
                            ].map(opt => {
                                const current = roleModal.role === opt.role;
                                const Icon = opt.icon;
                                return (
                                    <button key={opt.role} onClick={() => !current && handleRoleChange(roleModal, opt.role)} style={{
                                        display: 'flex', alignItems: 'center', gap: 14,
                                        padding: '14px 16px', borderRadius: 14,
                                        background: current ? `${opt.color}12` : T.bgAlt,
                                        border: current ? `1.5px solid ${opt.color}50` : `1px solid ${T.border}`,
                                        opacity: current ? 0.7 : 1,
                                        cursor: current ? 'default' : 'pointer',
                                        textAlign: 'left',
                                    }}>
                                        <div style={{
                                            width: 40, height: 40, borderRadius: 12,
                                            background: `${opt.color}18`, color: opt.color,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        }}>
                                            <Icon size={18} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{opt.label}</div>
                                            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{opt.desc}</div>
                                        </div>
                                        {current && (
                                            <span style={{
                                                fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                                                background: `${opt.color}20`, color: opt.color,
                                            }}>
                                                Saat ini
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <button onClick={() => setRoleModal(null)} style={{
                            width: '100%', height: 44, borderRadius: 12,
                            border: `1px solid ${T.border}`, background: T.surface,
                            color: T.textSub, fontWeight: 700, fontSize: 13,
                        }}>
                            Tutup
                        </button>
                    </div>
                </>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
