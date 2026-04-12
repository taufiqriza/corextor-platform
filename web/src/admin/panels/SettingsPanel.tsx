import { type CSSProperties, type FormEvent, useEffect, useMemo, useState } from 'react';
import {
    AlertCircle,
    Bell,
    Building2,
    CheckCircle2,
    ChevronRight,
    CreditCard,
    Globe,
    Info,
    KeyRound,
    LayoutGrid,
    Link2,
    Loader2,
    MapPin,
    Moon,
    Radio,
    Save,
    Shield,
    Sun,
    User,
    Webhook,
    Zap,
} from 'lucide-react';
import { platformApi } from '@/api/platform.api';
import { useTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/authStore';
import type { Theme } from '@/theme/tokens';
import type {
    PlatformCompanySettings,
    PlatformSettingsPayload,
    PlatformTripaySettings,
    UpdateTripaySettingsPayload,
} from '@/types/platform-settings.types';

interface Props {
    T: Theme;
    isDesktop: boolean;
}

type SettingsTab = 'company' | 'tripay' | 'preferences';
type FlashState = { kind: 'success' | 'error' | 'info'; message: string } | null;

type TripayFormState = {
    mode: 'test' | 'live';
    base_url: string;
    merchant_code: string;
    bank_transfer_channel: string;
    ewallet_channel: string;
    webhook_url: string;
    api_key: string;
    private_key: string;
    clear_api_key: boolean;
    clear_private_key: boolean;
};

const EMPTY_COMPANY: PlatformCompanySettings = {
    company_name: '',
    company_email: '',
    company_phone: '',
    company_address: '',
    company_city: '',
    company_province: '',
    company_postal_code: '',
    company_country: 'Indonesia',
    company_website: 'https://corextor.com',
    support_whatsapp: '',
    support_email: '',
    platform_tagline: '',
    platform_summary: '',
    social_instagram: '',
    social_facebook: '',
    social_tiktok: '',
    social_youtube: '',
    social_linkedin: '',
};

const EMPTY_TRIPAY_META: PlatformTripaySettings = {
    mode: 'test',
    base_url: '',
    configured_base_url: '',
    expected_base_url: '',
    is_base_url_aligned: true,
    merchant_code: '',
    bank_transfer_channel: 'BCAVA',
    ewallet_channel: 'QRIS',
    webhook_url: '',
    recommended_webhook_url: '',
    has_api_key: false,
    has_private_key: false,
    api_key_masked: null,
    private_key_masked: null,
};

const EMPTY_TRIPAY_FORM: TripayFormState = {
    mode: 'test',
    base_url: '',
    merchant_code: '',
    bank_transfer_channel: 'BCAVA',
    ewallet_channel: 'QRIS',
    webhook_url: '',
    api_key: '',
    private_key: '',
    clear_api_key: false,
    clear_private_key: false,
};

const COMPANY_FIELDS: Array<{
    key: keyof PlatformCompanySettings;
    label: string;
    icon: typeof Building2;
    type?: 'text' | 'email' | 'url';
}> = [
    { key: 'company_name', label: 'Nama Brand', icon: Building2 },
    { key: 'platform_tagline', label: 'Tagline', icon: Info },
    { key: 'company_email', label: 'Email Brand', icon: Bell, type: 'email' },
    { key: 'support_email', label: 'Email Support', icon: Bell, type: 'email' },
    { key: 'company_phone', label: 'Telepon Brand', icon: Bell },
    { key: 'support_whatsapp', label: 'WhatsApp Support', icon: Bell },
    { key: 'company_website', label: 'Website', icon: Globe, type: 'url' },
    { key: 'company_city', label: 'Kota', icon: MapPin },
    { key: 'company_province', label: 'Provinsi', icon: MapPin },
    { key: 'company_postal_code', label: 'Kode Pos', icon: MapPin },
    { key: 'company_country', label: 'Negara', icon: Globe },
    { key: 'social_linkedin', label: 'LinkedIn URL', icon: Link2, type: 'url' },
    { key: 'social_instagram', label: 'Instagram URL', icon: Link2, type: 'url' },
    { key: 'social_facebook', label: 'Facebook URL', icon: Link2, type: 'url' },
    { key: 'social_tiktok', label: 'TikTok URL', icon: Link2, type: 'url' },
    { key: 'social_youtube', label: 'YouTube URL', icon: Link2, type: 'url' },
];

function normalizeCompany(company?: Partial<PlatformCompanySettings>): PlatformCompanySettings {
    return {
        ...EMPTY_COMPANY,
        ...company,
    };
}

function normalizeTripay(tripay?: Partial<PlatformTripaySettings>): PlatformTripaySettings {
    return {
        ...EMPTY_TRIPAY_META,
        ...tripay,
        mode: tripay?.mode === 'live' ? 'live' : 'test',
        bank_transfer_channel: tripay?.bank_transfer_channel?.trim() || EMPTY_TRIPAY_META.bank_transfer_channel,
        ewallet_channel: tripay?.ewallet_channel?.trim() || EMPTY_TRIPAY_META.ewallet_channel,
    };
}

function getTripayFormFromMeta(tripay: PlatformTripaySettings): TripayFormState {
    return {
        mode: tripay.mode,
        base_url: tripay.base_url,
        merchant_code: tripay.merchant_code,
        bank_transfer_channel: tripay.bank_transfer_channel,
        ewallet_channel: tripay.ewallet_channel,
        webhook_url: tripay.webhook_url,
        api_key: '',
        private_key: '',
        clear_api_key: false,
        clear_private_key: false,
    };
}

function getApiErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null) {
        const candidate = error as {
            response?: { data?: { message?: unknown } };
            message?: unknown;
        };
        const responseMessage = candidate.response?.data?.message;
        if (typeof responseMessage === 'string' && responseMessage.trim()) {
            return responseMessage;
        }
        if (typeof candidate.message === 'string' && candidate.message.trim()) {
            return candidate.message;
        }
    }

    return fallback;
}

export function SettingsPanel({ T, isDesktop }: Props) {
    const { isDark, toggleTheme } = useTheme();
    const user = useAuthStore((state) => state.user);
    const canManageSettings = user?.role === 'super_admin';

    const [activeTab, setActiveTab] = useState<SettingsTab>('company');
    const [isLoading, setIsLoading] = useState(canManageSettings);
    const [flash, setFlash] = useState<FlashState>(null);
    const [companySaving, setCompanySaving] = useState(false);
    const [tripaySaving, setTripaySaving] = useState(false);
    const [tripayTesting, setTripayTesting] = useState(false);
    const [companyForm, setCompanyForm] = useState<PlatformCompanySettings>(EMPTY_COMPANY);
    const [tripayMeta, setTripayMeta] = useState<PlatformTripaySettings>(EMPTY_TRIPAY_META);
    const [tripayForm, setTripayForm] = useState<TripayFormState>(EMPTY_TRIPAY_FORM);

    const tabs = useMemo(
        () => [
            { key: 'company' as const, label: 'Identitas Platform', icon: Building2 },
            { key: 'tripay' as const, label: 'Tripay Gateway', icon: CreditCard },
            { key: 'preferences' as const, label: 'Preferensi', icon: LayoutGrid },
        ],
        [],
    );

    const preferenceSections = useMemo(
        () => [
            {
                title: 'Akun',
                items: [
                    { icon: User, label: 'Profil Aktif', desc: user?.name ?? 'Admin', color: T.primary },
                    { icon: Shield, label: 'Role', desc: user?.role ?? '-', color: T.info },
                ],
            },
            {
                title: 'Preferensi Lokal',
                items: [
                    {
                        icon: isDark ? Moon : Sun,
                        label: 'Tema',
                        desc: isDark ? 'Dark Mode' : 'Light Mode',
                        color: isDark ? T.gold : T.primary,
                        action: toggleTheme,
                        toggle: true,
                        toggleState: isDark,
                    },
                    { icon: Globe, label: 'Bahasa', desc: 'Bahasa Indonesia', color: T.success },
                    { icon: Bell, label: 'Notifikasi', desc: 'Aktif', color: T.gold },
                ],
            },
        ],
        [T.gold, T.info, T.primary, T.success, isDark, toggleTheme, user?.name, user?.role],
    );

    useEffect(() => {
        if (!canManageSettings) {
            setIsLoading(false);
            return;
        }

        let mounted = true;

        const loadSettings = async () => {
            setIsLoading(true);
            setFlash(null);
            try {
                const response = await platformApi.getPlatformSettings();
                if (!mounted) {
                    return;
                }

                const payload: PlatformSettingsPayload | undefined = response.data?.data;
                const nextCompany = normalizeCompany(payload?.company);
                const nextTripay = normalizeTripay(payload?.tripay);

                setCompanyForm(nextCompany);
                setTripayMeta(nextTripay);
                setTripayForm(getTripayFormFromMeta(nextTripay));
            } catch (error) {
                if (mounted) {
                    setFlash({ kind: 'error', message: getApiErrorMessage(error, 'Gagal memuat pengaturan platform.') });
                }
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        loadSettings();

        return () => {
            mounted = false;
        };
    }, [canManageSettings]);

    const saveCompany = async (event: FormEvent) => {
        event.preventDefault();
        setCompanySaving(true);
        setFlash(null);

        try {
            const response = await platformApi.updatePlatformCompanySettings(companyForm);
            const payload = response.data?.data;
            const nextCompany = normalizeCompany(payload?.company);
            const nextTripay = normalizeTripay(payload?.tripay);
            setCompanyForm(nextCompany);
            setTripayMeta(nextTripay);
            setFlash({ kind: 'success', message: 'Identitas platform berhasil disimpan.' });
        } catch (error) {
            setFlash({ kind: 'error', message: getApiErrorMessage(error, 'Gagal menyimpan identitas platform.') });
        } finally {
            setCompanySaving(false);
        }
    };

    const saveTripay = async (event: FormEvent) => {
        event.preventDefault();
        setTripaySaving(true);
        setFlash(null);

        try {
            const payload: UpdateTripaySettingsPayload = {
                mode: tripayForm.mode,
                base_url: tripayForm.base_url.trim(),
                merchant_code: tripayForm.merchant_code.trim(),
                bank_transfer_channel: tripayForm.bank_transfer_channel.trim().toUpperCase(),
                ewallet_channel: tripayForm.ewallet_channel.trim().toUpperCase(),
                webhook_url: tripayForm.webhook_url.trim(),
                clear_api_key: tripayForm.clear_api_key,
                clear_private_key: tripayForm.clear_private_key,
            };

            if (tripayForm.api_key.trim()) {
                payload.api_key = tripayForm.api_key.trim();
            }
            if (tripayForm.private_key.trim()) {
                payload.private_key = tripayForm.private_key.trim();
            }

            const response = await platformApi.updateTripaySettings(payload);
            const nextTripay = normalizeTripay(response.data?.data?.tripay);
            setTripayMeta(nextTripay);
            setTripayForm(getTripayFormFromMeta(nextTripay));
            setFlash({ kind: 'success', message: 'Pengaturan Tripay berhasil disimpan.' });
        } catch (error) {
            setFlash({ kind: 'error', message: getApiErrorMessage(error, 'Gagal menyimpan pengaturan Tripay.') });
        } finally {
            setTripaySaving(false);
        }
    };

    const testTripayConnection = async () => {
        setTripayTesting(true);
        setFlash(null);

        try {
            const response = await platformApi.testTripayConnection();
            const result = response.data?.data;
            setFlash({
                kind: result?.ok ? 'success' : 'error',
                message: result?.message || (result?.ok ? 'Koneksi Tripay berhasil.' : 'Tes koneksi Tripay gagal.'),
            });
        } catch (error) {
            setFlash({ kind: 'error', message: getApiErrorMessage(error, 'Tes koneksi Tripay gagal.') });
        } finally {
            setTripayTesting(false);
        }
    };

    const activeProducts = user?.active_products ?? [];

    return (
        <div style={{ maxWidth: 980 }}>
            <div style={heroCard(T, isDesktop)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={heroAvatar(T)}>
                        {(user?.name ?? 'A').slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontSize: 17, fontWeight: 900, color: T.text }}>Platform Settings</div>
                        <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>
                            Pola tab mengikuti referensi `santriexpress`: identitas platform, payment gateway, lalu preferensi operator dipisah agar konfigurasi tetap terstruktur.
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                            {activeProducts.map((product) => (
                                <span key={product} style={badgePill(T, 'blue')}>
                                    {product}
                                </span>
                            ))}
                            <span style={badgePill(T, canManageSettings ? 'green' : 'gold')}>
                                {canManageSettings ? 'Super Admin Access' : 'Read Only'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {flash && (
                <div style={flashStyle(T, flash.kind)}>
                    {flash.kind === 'success' ? <CheckCircle2 size={14} /> : flash.kind === 'error' ? <AlertCircle size={14} /> : <Info size={14} />}
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{flash.message}</span>
                </div>
            )}

            <div style={tabBar(T)}>
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = tab.key === activeTab;
                    const disabled = !canManageSettings && tab.key !== 'preferences';
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => !disabled && setActiveTab(tab.key)}
                            disabled={disabled}
                            style={tabButton(T, isActive, disabled)}
                        >
                            <Icon size={14} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {!canManageSettings && (
                <>
                    <div style={noticeCard(T)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={noticeIcon(T)}>
                                <Shield size={16} color={T.gold} />
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Akses dibatasi untuk super admin</div>
                                <div style={{ fontSize: 12, color: T.textSub, marginTop: 4, lineHeight: 1.6 }}>
                                    Setting gateway, branding platform, dan kontak publik dijaga terpusat supaya data bisnis tidak tersebar ke role lain. Anda tetap bisa memakai tab preferensi untuk tema dan utilitas lokal.
                                </div>
                            </div>
                        </div>
                    </div>

                    <PreferencesTab T={T} sections={preferenceSections} isDesktop={isDesktop} />
                </>
            )}

            {canManageSettings && isLoading && (
                <div style={loadingCard(T)}>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: 12, fontWeight: 700 }}>Memuat modul pengaturan...</span>
                </div>
            )}

            {canManageSettings && !isLoading && activeTab === 'company' && (
                <form onSubmit={saveCompany} style={panelCard(T)}>
                    <div style={panelHeader(T)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={sectionIcon(T)}>
                                <Building2 size={16} color={T.primary} />
                            </div>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 900, color: T.text }}>Identitas Platform</div>
                                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>
                                    Data ini menjadi sumber tunggal untuk branding, support, landing page, dan kebutuhan pembayaran customer.
                                </div>
                            </div>
                        </div>
                        <div style={summaryWrap(isDesktop)}>
                            <div style={summaryCard(T)}>
                                <div style={summaryLabel(T)}>Brand</div>
                                <div style={summaryValue(T)}>{companyForm.company_name || 'Belum diisi'}</div>
                            </div>
                            <div style={summaryCard(T)}>
                                <div style={summaryLabel(T)}>Support</div>
                                <div style={summaryValue(T)}>{companyForm.support_email || companyForm.support_whatsapp || 'Belum diisi'}</div>
                            </div>
                            <div style={summaryCard(T)}>
                                <div style={summaryLabel(T)}>Public URL</div>
                                <div style={summaryValue(T)}>{companyForm.company_website || 'Belum diisi'}</div>
                            </div>
                        </div>
                    </div>

                    <div style={formGrid(isDesktop)}>
                        {COMPANY_FIELDS.map((field) => {
                            const Icon = field.icon;
                            return (
                                <label key={field.key} style={fieldWrap}>
                                    <span style={fieldLabel(T)}>
                                        <Icon size={12} />
                                        {field.label}
                                    </span>
                                    <input
                                        type={field.type ?? 'text'}
                                        value={companyForm[field.key]}
                                        onChange={(event) => {
                                            const value = event.target.value;
                                            setCompanyForm((current) => ({
                                                ...current,
                                                [field.key]: value,
                                            }));
                                        }}
                                        style={fieldInput(T)}
                                    />
                                </label>
                            );
                        })}
                    </div>

                    <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
                        <label style={fieldWrap}>
                            <span style={fieldLabel(T)}>
                                <Info size={12} />
                                Ringkasan Platform
                            </span>
                            <textarea
                                rows={4}
                                value={companyForm.platform_summary}
                                onChange={(event) => setCompanyForm((current) => ({ ...current, platform_summary: event.target.value }))}
                                style={textareaInput(T)}
                            />
                        </label>

                        <label style={fieldWrap}>
                            <span style={fieldLabel(T)}>
                                <MapPin size={12} />
                                Alamat Lengkap
                            </span>
                            <textarea
                                rows={4}
                                value={companyForm.company_address}
                                onChange={(event) => setCompanyForm((current) => ({ ...current, company_address: event.target.value }))}
                                style={textareaInput(T)}
                            />
                        </label>
                    </div>

                    <div style={footerActions}>
                        <div style={helperNote(T)}>
                            Gunakan halaman ini sebagai sumber tunggal. Tujuannya agar branding landing page, invoice, dan contact support tetap sinkron, tidak di-hardcode di beberapa tempat.
                        </div>
                        <button type="submit" disabled={companySaving} style={primaryButton(T)}>
                            {companySaving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                            {companySaving ? 'Menyimpan...' : 'Simpan Platform'}
                        </button>
                    </div>
                </form>
            )}

            {canManageSettings && !isLoading && activeTab === 'tripay' && (
                <form onSubmit={saveTripay} style={panelCard(T)}>
                    <div style={panelHeader(T)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={sectionIcon(T)}>
                                <CreditCard size={16} color={T.primary} />
                            </div>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 900, color: T.text }}>Tripay Payment Gateway</div>
                                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>
                                    Credential, channel default, dan webhook dipisah dari identitas platform supaya modul billing tetap bersih dan bisa diperluas ke gateway lain.
                                </div>
                            </div>
                        </div>
                        <button type="button" onClick={testTripayConnection} disabled={tripayTesting} style={secondaryButton(T)}>
                            {tripayTesting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={14} />}
                            {tripayTesting ? 'Testing...' : 'Tes Koneksi'}
                        </button>
                    </div>

                    <div style={tripayStatusGrid(isDesktop)}>
                        <div style={statusCard(T, tripayMeta.is_base_url_aligned ? 'success' : 'warning')}>
                            <div style={statusTitle(T)}>Mode Gateway</div>
                            <div style={statusValue(T)}>{tripayMeta.mode === 'live' ? 'Live' : 'Sandbox'}</div>
                            <div style={statusMeta(T)}>
                                {tripayMeta.is_base_url_aligned ? 'Mode dan base URL sudah selaras.' : 'Mode dan base URL belum selaras.'}
                            </div>
                        </div>
                        <div style={statusCard(T, tripayMeta.has_api_key && tripayMeta.has_private_key ? 'success' : 'warning')}>
                            <div style={statusTitle(T)}>Secrets</div>
                            <div style={statusValue(T)}>
                                {tripayMeta.has_api_key && tripayMeta.has_private_key ? 'Lengkap' : 'Belum lengkap'}
                            </div>
                            <div style={statusMeta(T)}>
                                API key {tripayMeta.has_api_key ? 'tersimpan' : 'belum ada'} • Private key {tripayMeta.has_private_key ? 'tersimpan' : 'belum ada'}
                            </div>
                        </div>
                        <div style={statusCard(T, 'info')}>
                            <div style={statusTitle(T)}>Webhook</div>
                            <div style={statusValue(T)}>{tripayMeta.webhook_url || 'Belum diatur'}</div>
                            <div style={statusMeta(T)}>Rekomendasi: {tripayMeta.recommended_webhook_url || '-'}</div>
                        </div>
                    </div>

                    <div style={hintCard(T)}>
                        Referensi `santriexpress` yang kita bawa ke sini: save per-domain, masking secret tersimpan, tombol tes koneksi terpisah dari simpan, dan normalisasi payload supaya perubahan backend tidak merusak form state.
                    </div>

                    <div style={formGrid(isDesktop)}>
                        <label style={fieldWrap}>
                            <span style={fieldLabel(T)}>
                                <Radio size={12} />
                                Mode
                            </span>
                            <select
                                value={tripayForm.mode}
                                onChange={(event) => setTripayForm((current) => ({ ...current, mode: event.target.value as 'test' | 'live' }))}
                                style={fieldInput(T)}
                            >
                                <option value="test">Sandbox</option>
                                <option value="live">Live</option>
                            </select>
                        </label>

                        <label style={fieldWrap}>
                            <span style={fieldLabel(T)}>
                                <Globe size={12} />
                                Base URL
                            </span>
                            <input
                                type="url"
                                value={tripayForm.base_url}
                                onChange={(event) => setTripayForm((current) => ({ ...current, base_url: event.target.value }))}
                                style={fieldInput(T)}
                            />
                        </label>

                        <label style={fieldWrap}>
                            <span style={fieldLabel(T)}>
                                <KeyRound size={12} />
                                Merchant Code
                            </span>
                            <input
                                value={tripayForm.merchant_code}
                                onChange={(event) => setTripayForm((current) => ({ ...current, merchant_code: event.target.value }))}
                                style={fieldInput(T)}
                            />
                        </label>

                        <label style={fieldWrap}>
                            <span style={fieldLabel(T)}>
                                <Webhook size={12} />
                                Webhook URL
                            </span>
                            <input
                                type="url"
                                value={tripayForm.webhook_url}
                                onChange={(event) => setTripayForm((current) => ({ ...current, webhook_url: event.target.value }))}
                                style={fieldInput(T)}
                            />
                        </label>

                        <label style={fieldWrap}>
                            <span style={fieldLabel(T)}>
                                <CreditCard size={12} />
                                Channel Bank Transfer
                            </span>
                            <input
                                value={tripayForm.bank_transfer_channel}
                                onChange={(event) => setTripayForm((current) => ({ ...current, bank_transfer_channel: event.target.value.toUpperCase() }))}
                                style={fieldInput(T)}
                            />
                        </label>

                        <label style={fieldWrap}>
                            <span style={fieldLabel(T)}>
                                <CreditCard size={12} />
                                Channel E-Wallet
                            </span>
                            <input
                                value={tripayForm.ewallet_channel}
                                onChange={(event) => setTripayForm((current) => ({ ...current, ewallet_channel: event.target.value.toUpperCase() }))}
                                style={fieldInput(T)}
                            />
                        </label>

                        <label style={{ ...fieldWrap, gridColumn: isDesktop ? 'span 2' : undefined }}>
                            <span style={fieldLabel(T)}>
                                <KeyRound size={12} />
                                API Key {tripayMeta.api_key_masked ? `• ${tripayMeta.api_key_masked}` : ''}
                            </span>
                            <input
                                type="password"
                                value={tripayForm.api_key}
                                onChange={(event) => setTripayForm((current) => ({ ...current, api_key: event.target.value }))}
                                placeholder={tripayMeta.has_api_key ? 'Isi hanya jika ingin mengganti' : 'Masukkan API key Tripay'}
                                style={fieldInput(T)}
                            />
                            <label style={checkboxLabel(T)}>
                                <input
                                    type="checkbox"
                                    checked={tripayForm.clear_api_key}
                                    onChange={(event) => setTripayForm((current) => ({ ...current, clear_api_key: event.target.checked }))}
                                />
                                Kosongkan API key tersimpan
                            </label>
                        </label>

                        <label style={{ ...fieldWrap, gridColumn: isDesktop ? 'span 2' : undefined }}>
                            <span style={fieldLabel(T)}>
                                <KeyRound size={12} />
                                Private Key {tripayMeta.private_key_masked ? `• ${tripayMeta.private_key_masked}` : ''}
                            </span>
                            <input
                                type="password"
                                value={tripayForm.private_key}
                                onChange={(event) => setTripayForm((current) => ({ ...current, private_key: event.target.value }))}
                                placeholder={tripayMeta.has_private_key ? 'Isi hanya jika ingin mengganti' : 'Masukkan private key Tripay'}
                                style={fieldInput(T)}
                            />
                            <label style={checkboxLabel(T)}>
                                <input
                                    type="checkbox"
                                    checked={tripayForm.clear_private_key}
                                    onChange={(event) => setTripayForm((current) => ({ ...current, clear_private_key: event.target.checked }))}
                                />
                                Kosongkan private key tersimpan
                            </label>
                        </label>
                    </div>

                    <div style={detailCard(T)}>
                        <div style={{ display: 'grid', gap: 6 }}>
                            <div style={detailLabel(T)}>Expected base URL</div>
                            <div style={detailValue(T)}>{tripayMeta.expected_base_url || '-'}</div>
                        </div>
                        <div style={{ display: 'grid', gap: 6 }}>
                            <div style={detailLabel(T)}>Configured base URL</div>
                            <div style={detailValue(T)}>{tripayMeta.configured_base_url || '-'}</div>
                        </div>
                        <div style={{ display: 'grid', gap: 6 }}>
                            <div style={detailLabel(T)}>Recommended webhook</div>
                            <div style={detailValue(T)}>{tripayMeta.recommended_webhook_url || '-'}</div>
                        </div>
                    </div>

                    <div style={footerActions}>
                        <div style={helperNote(T)}>
                            Signature callback divalidasi di backend. Dengan pola ini, jika nanti Corextor menambah Midtrans atau gateway lain, tiap gateway tetap bisa hidup di tab dan service layer terpisah.
                        </div>
                        <button type="submit" disabled={tripaySaving} style={primaryButton(T)}>
                            {tripaySaving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                            {tripaySaving ? 'Menyimpan...' : 'Simpan Tripay'}
                        </button>
                    </div>
                </form>
            )}

            {canManageSettings && !isLoading && activeTab === 'preferences' && (
                <PreferencesTab T={T} sections={preferenceSections} isDesktop={isDesktop} />
            )}
        </div>
    );
}

function PreferencesTab({
    T,
    sections,
    isDesktop,
}: {
    T: Theme;
    sections: Array<{
        title: string;
        items: Array<{
            icon: typeof User;
            label: string;
            desc: string;
            color: string;
            action?: () => void;
            toggle?: boolean;
            toggleState?: boolean;
        }>;
    }>;
    isDesktop: boolean;
}) {
    return (
        <div style={panelCard(T)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={sectionIcon(T)}>
                    <LayoutGrid size={16} color={T.primary} />
                </div>
                <div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: T.text }}>Preferensi & Utilitas Lokal</div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>
                        Area ini sengaja dipisahkan dari pengaturan bisnis. Tujuannya agar tema, informasi akun, dan preferensi operator tetap ringan dan tidak bercampur dengan konfigurasi platform.
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: 12 }}>
                {sections.map((section) => (
                    <div key={section.title} style={subPanel(T)}>
                        <div style={subPanelHeader(T)}>{section.title}</div>
                        {section.items.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.label}
                                    type="button"
                                    onClick={item.action}
                                    style={{
                                        ...listButton(T),
                                        borderBottom: index < section.items.length - 1 ? `1px solid ${T.border}35` : 'none',
                                        cursor: item.action ? 'pointer' : 'default',
                                    }}
                                >
                                    <div style={listIconWrap(item.color)}>
                                        <Icon size={15} color={item.color} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{item.label}</div>
                                        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{item.desc}</div>
                                    </div>
                                    {item.toggle ? (
                                        <div style={toggleWrap(T, !!item.toggleState)}>
                                            <div style={toggleDot(!!item.toggleState)} />
                                        </div>
                                    ) : (
                                        <ChevronRight size={14} color={T.textMuted} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>

            <div style={detailCard(T)}>
                <div style={{ display: 'grid', gap: 6 }}>
                    <div style={detailLabel(T)}>Prinsip Arsitektur</div>
                    <div style={detailValue(T)}>Settings dikelompokkan per domain: identity, billing gateway, lalu operator preference.</div>
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                    <div style={detailLabel(T)}>Arah Jangka Panjang</div>
                    <div style={detailValue(T)}>Tab analytics, security, social auth, atau webhook lain bisa ditambah tanpa membongkar struktur yang ada.</div>
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                    <div style={detailLabel(T)}>Referensi</div>
                    <div style={detailValue(T)}>Pola tab dan save per modul diadaptasi dari `santriexpress`, tetapi disederhanakan untuk kebutuhan Corextor saat ini.</div>
                </div>
            </div>
        </div>
    );
}

function heroCard(T: Theme, isDesktop: boolean): CSSProperties {
    return {
        background: `linear-gradient(135deg, ${T.card}, ${T.bgAlt})`,
        borderRadius: 18,
        border: `1px solid ${T.border}`,
        padding: isDesktop ? 22 : 18,
        marginBottom: 18,
        boxShadow: T.shadowSm,
    };
}

function heroAvatar(T: Theme): CSSProperties {
    return {
        width: 58,
        height: 58,
        borderRadius: 18,
        background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20,
        fontWeight: 900,
        flexShrink: 0,
    };
}

function badgePill(T: Theme, tone: 'blue' | 'green' | 'gold'): CSSProperties {
    const color = tone === 'green' ? T.success : tone === 'gold' ? T.gold : T.primary;
    return {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 10,
        fontWeight: 800,
        padding: '5px 10px',
        borderRadius: 999,
        background: `${color}14`,
        border: `1px solid ${color}24`,
        color,
        textTransform: 'capitalize',
    };
}

function flashStyle(T: Theme, kind: 'success' | 'error' | 'info'): CSSProperties {
    const color = kind === 'success' ? T.success : kind === 'error' ? T.danger : T.primary;
    return {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 14px',
        borderRadius: 12,
        background: `${color}10`,
        border: `1px solid ${color}22`,
        color,
        marginBottom: 16,
    };
}

function tabBar(T: Theme): CSSProperties {
    return {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        padding: 6,
        borderRadius: 14,
        border: `1px solid ${T.border}`,
        background: T.card,
        marginBottom: 18,
    };
}

function tabButton(T: Theme, active: boolean, disabled: boolean): CSSProperties {
    return {
        height: 40,
        padding: '0 14px',
        borderRadius: 10,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        border: active ? `1px solid ${T.primary}33` : '1px solid transparent',
        background: active ? `${T.primary}14` : 'transparent',
        color: disabled ? T.textMuted : active ? T.primary : T.textSub,
        fontSize: 12,
        fontWeight: active ? 800 : 700,
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
    };
}

function noticeCard(T: Theme): CSSProperties {
    return {
        background: T.card,
        borderRadius: 14,
        border: `1px solid ${T.border}`,
        padding: 18,
        marginBottom: 18,
    };
}

function noticeIcon(T: Theme): CSSProperties {
    return {
        width: 40,
        height: 40,
        borderRadius: 12,
        background: `${T.gold}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    };
}

function loadingCard(T: Theme): CSSProperties {
    return {
        background: T.card,
        borderRadius: 14,
        border: `1px solid ${T.border}`,
        padding: 20,
        marginBottom: 18,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        color: T.textMuted,
    };
}

function panelCard(T: Theme): CSSProperties {
    return {
        background: T.card,
        borderRadius: 16,
        border: `1px solid ${T.border}`,
        padding: 18,
        boxShadow: T.shadowSm,
    };
}

function panelHeader(T: Theme): CSSProperties {
    return {
        display: 'grid',
        gap: 14,
        marginBottom: 16,
        paddingBottom: 16,
        borderBottom: `1px solid ${T.border}55`,
    };
}

function sectionIcon(T: Theme): CSSProperties {
    return {
        width: 38,
        height: 38,
        borderRadius: 12,
        background: `${T.primary}14`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    };
}

function summaryWrap(isDesktop: boolean): CSSProperties {
    return {
        display: 'grid',
        gridTemplateColumns: isDesktop ? 'repeat(3, minmax(0, 1fr))' : '1fr',
        gap: 10,
    };
}

function summaryCard(T: Theme): CSSProperties {
    return {
        background: T.bgAlt,
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        padding: '12px 14px',
        display: 'grid',
        gap: 6,
    };
}

function summaryLabel(T: Theme): CSSProperties {
    return {
        fontSize: 10,
        fontWeight: 800,
        color: T.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    };
}

function summaryValue(T: Theme): CSSProperties {
    return {
        fontSize: 12,
        fontWeight: 700,
        color: T.text,
        wordBreak: 'break-word',
    };
}

function formGrid(isDesktop: boolean): CSSProperties {
    return {
        display: 'grid',
        gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr',
        gap: 12,
    };
}

const fieldWrap: CSSProperties = {
    display: 'grid',
    gap: 7,
};

function fieldLabel(T: Theme): CSSProperties {
    return {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        fontWeight: 700,
        color: T.textMuted,
    };
}

function fieldInput(T: Theme): CSSProperties {
    return {
        width: '100%',
        height: 42,
        borderRadius: 10,
        border: `1px solid ${T.border}`,
        background: T.bgAlt,
        color: T.text,
        padding: '0 12px',
        fontSize: 12,
    };
}

function textareaInput(T: Theme): CSSProperties {
    return {
        width: '100%',
        minHeight: 96,
        borderRadius: 10,
        border: `1px solid ${T.border}`,
        background: T.bgAlt,
        color: T.text,
        padding: '12px',
        fontSize: 12,
        resize: 'vertical',
    };
}

function statusCard(T: Theme, tone: 'success' | 'warning' | 'info'): CSSProperties {
    const color = tone === 'success' ? T.success : tone === 'warning' ? T.gold : T.primary;
    return {
        background: `${color}08`,
        border: `1px solid ${color}20`,
        borderRadius: 14,
        padding: '14px 16px',
        display: 'grid',
        gap: 6,
    };
}

function tripayStatusGrid(isDesktop: boolean): CSSProperties {
    return {
        display: 'grid',
        gridTemplateColumns: isDesktop ? 'repeat(3, minmax(0, 1fr))' : '1fr',
        gap: 10,
        marginBottom: 14,
    };
}

function statusTitle(T: Theme): CSSProperties {
    return {
        fontSize: 10,
        fontWeight: 800,
        color: T.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    };
}

function statusValue(T: Theme): CSSProperties {
    return {
        fontSize: 13,
        fontWeight: 800,
        color: T.text,
        wordBreak: 'break-word',
    };
}

function statusMeta(T: Theme): CSSProperties {
    return {
        fontSize: 11,
        color: T.textSub,
        lineHeight: 1.6,
    };
}

function hintCard(T: Theme): CSSProperties {
    return {
        marginBottom: 14,
        background: `${T.primary}08`,
        border: `1px solid ${T.primary}18`,
        borderRadius: 12,
        padding: '12px 14px',
        fontSize: 12,
        lineHeight: 1.7,
        color: T.textSub,
    };
}

function checkboxLabel(T: Theme): CSSProperties {
    return {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 11,
        fontWeight: 700,
        color: T.textMuted,
    };
}

function detailCard(T: Theme): CSSProperties {
    return {
        display: 'grid',
        gap: 12,
        marginTop: 14,
        background: T.bgAlt,
        border: `1px solid ${T.border}`,
        borderRadius: 14,
        padding: '14px 16px',
    };
}

function detailLabel(T: Theme): CSSProperties {
    return {
        fontSize: 10,
        fontWeight: 800,
        color: T.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    };
}

function detailValue(T: Theme): CSSProperties {
    return {
        fontSize: 12,
        fontWeight: 700,
        color: T.text,
        lineHeight: 1.7,
        wordBreak: 'break-word',
    };
}

const footerActions: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    marginTop: 16,
};

function helperNote(T: Theme): CSSProperties {
    return {
        flex: 1,
        minWidth: 220,
        fontSize: 11,
        color: T.textMuted,
        lineHeight: 1.7,
    };
}

function primaryButton(T: Theme): CSSProperties {
    return {
        height: 40,
        padding: '0 14px',
        borderRadius: 10,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: T.primary,
        color: '#fff',
        border: `1px solid ${T.primary}`,
        fontSize: 12,
        fontWeight: 800,
    };
}

function secondaryButton(T: Theme): CSSProperties {
    return {
        height: 40,
        padding: '0 14px',
        borderRadius: 10,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: T.bgAlt,
        color: T.text,
        border: `1px solid ${T.border}`,
        fontSize: 12,
        fontWeight: 800,
    };
}

function subPanel(T: Theme): CSSProperties {
    return {
        background: T.bgAlt,
        border: `1px solid ${T.border}`,
        borderRadius: 14,
        overflow: 'hidden',
    };
}

function subPanelHeader(T: Theme): CSSProperties {
    return {
        padding: '12px 14px',
        fontSize: 11,
        fontWeight: 800,
        color: T.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        borderBottom: `1px solid ${T.border}`,
    };
}

function listButton(T: Theme): CSSProperties {
    return {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        textAlign: 'left',
        background: 'transparent',
        color: T.text,
    };
}

function listIconWrap(color: string): CSSProperties {
    return {
        width: 34,
        height: 34,
        borderRadius: 10,
        background: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    };
}

function toggleWrap(T: Theme, active: boolean): CSSProperties {
    return {
        width: 42,
        height: 24,
        borderRadius: 999,
        background: active ? T.primary : T.border,
        display: 'flex',
        alignItems: 'center',
        padding: '0 2px',
    };
}

function toggleDot(active: boolean): CSSProperties {
    return {
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: '#fff',
        transform: active ? 'translateX(18px)' : 'translateX(0)',
        transition: 'transform .2s ease',
    };
}
