import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import {
    BadgeCheck,
    Building2,
    Check,
    KeyRound,
    Loader2,
    Mail,
    Pencil,
    Save,
    Shield,
} from 'lucide-react';
import { platformApi } from '@/api/platform.api';
import { useAuthStore } from '@/store/authStore';
import type { Theme } from '@/theme/tokens';

export function CompanyPersonalProfilePanel({
    T,
    isDesktop,
}: {
    T: Theme;
    isDesktop: boolean;
}) {
    const user = useAuthStore(s => s.user);
    const fetchMe = useAuthStore(s => s.fetchMe);

    const [name, setName] = useState(user?.name ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [saving, setSaving] = useState(false);
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        setName(user?.name ?? '');
        setEmail(user?.email ?? '');
    }, [user?.name, user?.email]);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            await platformApi.updateMe({ name: name.trim(), email: email.trim() });
            await fetchMe();
            setMessage({ type: 'success', text: 'Profil personal berhasil diperbarui.' });
            window.setTimeout(() => setMessage(null), 2800);
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error?.response?.data?.message ?? 'Gagal memperbarui profil personal.',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            setMessage({ type: 'error', text: 'Lengkapi seluruh field password terlebih dahulu.' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Konfirmasi password baru tidak cocok.' });
            return;
        }

        setPasswordSaving(true);
        setMessage(null);
        try {
            await platformApi.changePassword({
                current_password: currentPassword,
                new_password: newPassword,
                new_password_confirmation: confirmPassword,
            });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setMessage({ type: 'success', text: 'Password berhasil diperbarui.' });
            window.setTimeout(() => setMessage(null), 2800);
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error?.response?.data?.message ?? 'Gagal memperbarui password.',
            });
        } finally {
            setPasswordSaving(false);
        }
    };

    const products = user?.active_products ?? [];
    const companyName = user?.company?.name ?? 'Perusahaan';
    const companyCode = user?.company?.code ?? '-';
    const roleLabel = describeRole(user?.role);

    const topStats = [
        { label: 'Role', value: roleLabel, icon: Shield, tone: T.primary },
        { label: 'Perusahaan', value: companyCode, icon: Building2, tone: T.info },
        { label: 'Produk Aktif', value: String(products.length), icon: BadgeCheck, tone: T.success },
        { label: 'Status', value: user?.company?.status === 'active' ? 'Aktif' : 'Tidak aktif', icon: Check, tone: user?.company?.status === 'active' ? T.success : T.gold },
    ];

    return (
        <div style={{ display: 'grid', gap: 14 }}>
            {message && (
                <div style={{
                    borderRadius: 16,
                    border: `1px solid ${message.type === 'success' ? `${T.success}45` : `${T.danger}45`}`,
                    background: message.type === 'success' ? `${T.success}10` : `${T.danger}10`,
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    color: message.type === 'success' ? T.success : T.danger,
                    fontSize: 12.5,
                    fontWeight: 800,
                }}>
                    {message.type === 'success' ? <Check size={15} /> : <Shield size={15} />}
                    {message.text}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', gap: 10 }}>
                {topStats.map(card => (
                    <div key={card.label} style={statCardStyle(T, isDesktop, card.tone)}>
                        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                            <div>
                                <div style={{ fontSize: 10.5, color: T.textMuted, fontWeight: 700 }}>
                                    {card.label}
                                </div>
                                <div style={{
                                    fontSize: isDesktop ? 20 : 17,
                                    fontWeight: 900,
                                    color: T.text,
                                    marginTop: 7,
                                    fontFamily: "'Sora', sans-serif",
                                    lineHeight: 1.05,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}>
                                    {card.value}
                                </div>
                            </div>
                            <div style={statIconWrapStyle(card.tone)}>
                                <card.icon size={15} color={card.tone} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <section style={sectionStyle(T, isDesktop)}>
                <div style={{ display: 'grid', gap: 14 }}>
                    <div style={heroCardStyle(T, isDesktop)}>
                        <div style={{
                            display: 'flex',
                            alignItems: isDesktop ? 'center' : 'flex-start',
                            justifyContent: 'space-between',
                            gap: 14,
                            flexDirection: isDesktop ? 'row' : 'column',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                                <div style={avatarWrapStyle(T)}>
                                    {(user?.name ?? 'A').slice(0, 1).toUpperCase()}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{
                                        fontSize: isDesktop ? 22 : 18,
                                        fontWeight: 900,
                                        color: T.text,
                                        fontFamily: "'Sora', sans-serif",
                                        lineHeight: 1.1,
                                    }}>
                                        {user?.name ?? 'Admin'}
                                    </div>
                                    <div style={{ marginTop: 5, fontSize: 11.5, color: T.textMuted, fontWeight: 700 }}>
                                        {roleLabel} • {companyName}
                                    </div>
                                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {products.length > 0 ? products.map(product => (
                                            <span key={product} style={chipStyle(T)}>
                                                {product}
                                            </span>
                                        )) : (
                                            <span style={chipStyle(T)}>Belum ada produk aktif</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: isDesktop ? 'repeat(2, minmax(0, 1fr))' : '1fr 1fr',
                                gap: 8,
                                width: isDesktop ? 'auto' : '100%',
                                minWidth: isDesktop ? 260 : 0,
                            }}>
                                <HeroMetaCard T={T} icon={<Mail size={14} color={T.primary} />} label="Email Login" value={user?.email ?? '-'} />
                                <HeroMetaCard T={T} icon={<Building2 size={14} color={T.info} />} label="Perusahaan" value={companyCode} />
                                <HeroMetaCard T={T} icon={<Shield size={14} color={T.success} />} label="Akses" value={roleLabel} />
                                <HeroMetaCard T={T} icon={<BadgeCheck size={14} color={T.gold} />} label="Produk" value={products.length > 0 ? `${products.length} aktif` : 'Belum ada'} />
                            </div>
                        </div>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: isDesktop ? 'repeat(2, minmax(0, 1fr))' : '1fr',
                        gap: 14,
                        alignItems: 'start',
                    }}>
                        <div style={surfaceStyle(T)}>
                            <div style={surfaceHeadStyle(T)}>
                                <span style={surfaceLabelStyle(T)}>
                                    <Pencil size={14} color={T.primary} />
                                    Edit Profil Personal
                                </span>
                            </div>
                            <div style={{ padding: 16, display: 'grid', gap: 14 }}>
                                <div>
                                    <label style={fieldLabelStyle(T)}>Nama Lengkap</label>
                                    <input
                                        value={name}
                                        onChange={event => setName(event.target.value)}
                                        placeholder="Nama lengkap admin"
                                        style={inputStyle(T)}
                                    />
                                </div>
                                <div>
                                    <label style={fieldLabelStyle(T)}>Email</label>
                                    <input
                                        value={email}
                                        onChange={event => setEmail(event.target.value)}
                                        placeholder="nama@company.com"
                                        style={inputStyle(T)}
                                    />
                                </div>
                                <div style={{
                                    borderRadius: 14,
                                    border: `1px solid ${T.border}`,
                                    background: T.bgAlt,
                                    padding: '12px 14px',
                                    fontSize: 11.5,
                                    color: T.textMuted,
                                    lineHeight: 1.7,
                                    fontWeight: 700,
                                }}>
                                    Perubahan di sini memperbarui identitas akun yang dipakai login ke portal company admin.
                                </div>
                                <div style={{ display: 'flex', justifyContent: isDesktop ? 'flex-end' : 'stretch' }}>
                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        disabled={saving || !name.trim() || !email.trim()}
                                        style={primaryButtonStyle(T, saving || !name.trim() || !email.trim(), isDesktop)}
                                    >
                                        {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                                        {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div style={surfaceStyle(T)}>
                            <div style={surfaceHeadStyle(T)}>
                                <span style={surfaceLabelStyle(T)}>
                                    <KeyRound size={14} color={T.gold} />
                                    Ubah Password
                                </span>
                            </div>
                            <div style={{ padding: 16, display: 'grid', gap: 14 }}>
                                <div>
                                    <label style={fieldLabelStyle(T)}>Password Saat Ini</label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={event => setCurrentPassword(event.target.value)}
                                        placeholder="Masukkan password saat ini"
                                        style={inputStyle(T)}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: 12 }}>
                                    <div>
                                        <label style={fieldLabelStyle(T)}>Password Baru</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={event => setNewPassword(event.target.value)}
                                            placeholder="Minimal 8 karakter"
                                            style={inputStyle(T)}
                                        />
                                    </div>
                                    <div>
                                        <label style={fieldLabelStyle(T)}>Konfirmasi Password Baru</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={event => setConfirmPassword(event.target.value)}
                                            placeholder="Ulangi password baru"
                                            style={inputStyle(T)}
                                        />
                                    </div>
                                </div>
                                <div style={{
                                    borderRadius: 14,
                                    border: `1px solid ${T.border}`,
                                    background: T.bgAlt,
                                    padding: '12px 14px',
                                    fontSize: 11.5,
                                    color: T.textMuted,
                                    lineHeight: 1.7,
                                    fontWeight: 700,
                                }}>
                                    Gunakan password baru yang kuat dan berbeda dari password lama. Minimal 8 karakter.
                                </div>
                                <div style={{ display: 'flex', justifyContent: isDesktop ? 'flex-end' : 'stretch' }}>
                                    <button
                                        type="button"
                                        onClick={handleChangePassword}
                                        disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
                                        style={primaryButtonStyle(T, passwordSaving || !currentPassword || !newPassword || !confirmPassword, isDesktop)}
                                    >
                                        {passwordSaving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <KeyRound size={14} />}
                                        {passwordSaving ? 'Memperbarui...' : 'Update Password'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

function describeRole(role?: string): string {
    switch (role) {
        case 'super_admin':
            return 'Super Admin';
        case 'platform_staff':
            return 'Platform Staff';
        case 'platform_finance':
            return 'Platform Finance';
        case 'company_admin':
            return 'Company Admin';
        case 'employee':
            return 'Employee';
        default:
            return role ?? 'User';
    }
}

function sectionStyle(T: Theme, isDesktop: boolean): CSSProperties {
    return {
        background: `linear-gradient(180deg, ${T.card} 0%, ${T.bgAlt} 100%)`,
        border: `1px solid ${T.border}`,
        borderRadius: 24,
        padding: isDesktop ? 18 : 14,
        boxShadow: T.shadowSm,
    };
}

function statCardStyle(T: Theme, isDesktop: boolean, tone: string): CSSProperties {
    return {
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(180deg, ${T.card} 0%, ${T.bgAlt} 100%)`,
        borderRadius: 18,
        border: `1px solid ${T.border}`,
        padding: isDesktop ? '14px 15px' : '12px 13px',
        boxShadow: T.shadowSm,
        backgroundImage: `linear-gradient(135deg, ${tone}08 0%, transparent 42%)`,
    };
}

function statIconWrapStyle(tone: string): CSSProperties {
    return {
        width: 34,
        height: 34,
        borderRadius: 12,
        background: `${tone}14`,
        border: `1px solid ${tone}18`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    };
}

function surfaceStyle(T: Theme): CSSProperties {
    return {
        borderRadius: 20,
        border: `1px solid ${T.border}`,
        background: T.card,
        boxShadow: T.shadowSm,
        overflow: 'hidden',
    };
}

function surfaceHeadStyle(T: Theme): CSSProperties {
    return {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        padding: '14px 16px 12px',
        borderBottom: `1px solid ${T.border}`,
    };
}

function surfaceLabelStyle(T: Theme): CSSProperties {
    return {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        fontSize: 11.5,
        fontWeight: 800,
        color: T.text,
    };
}

function chipStyle(T: Theme): CSSProperties {
    return {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 26,
        padding: '0 10px',
        borderRadius: 999,
        border: `1px solid ${T.border}`,
        background: T.bgAlt,
        color: T.textSub,
        fontSize: 10.5,
        fontWeight: 800,
        textTransform: 'capitalize',
    };
}

function heroCardStyle(T: Theme, isDesktop: boolean): CSSProperties {
    return {
        borderRadius: 22,
        border: `1px solid ${T.border}`,
        background: `linear-gradient(135deg, ${T.card} 0%, ${T.bgAlt} 55%, ${T.primary}08 100%)`,
        boxShadow: T.shadowSm,
        padding: isDesktop ? 18 : 14,
    };
}

function avatarWrapStyle(T: Theme): CSSProperties {
    return {
        width: 78,
        height: 78,
        borderRadius: 24,
        background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 30,
        fontWeight: 900,
        fontFamily: "'Sora', sans-serif",
        flexShrink: 0,
        boxShadow: `0 14px 34px ${T.primary}28`,
    };
}

function heroMetaCardStyle(T: Theme): CSSProperties {
    return {
        borderRadius: 16,
        border: `1px solid ${T.border}`,
        background: `${T.card}E8`,
        padding: '10px 11px',
        minWidth: 0,
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

function inputStyle(T: Theme): CSSProperties {
    return {
        width: '100%',
        height: 44,
        borderRadius: 12,
        border: `1px solid ${T.border}`,
        background: T.bgAlt,
        padding: '0 14px',
        fontSize: 13,
        color: T.text,
        boxSizing: 'border-box',
    };
}

function primaryButtonStyle(T: Theme, disabled: boolean, isDesktop: boolean): CSSProperties {
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
        width: isDesktop ? 'auto' : '100%',
    };
}

function HeroMetaCard({
    T,
    icon,
    label,
    value,
}: {
    T: Theme;
    icon: ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div style={heroMetaCardStyle(T)}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, color: T.textMuted, fontWeight: 800, textTransform: 'uppercase' }}>
                {icon}
                {label}
            </div>
            <div style={{
                marginTop: 6,
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
