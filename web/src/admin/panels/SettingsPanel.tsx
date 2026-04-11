import { useEffect, useState } from 'react';
import { Moon, Sun, Shield, Globe, Bell, User, ChevronRight, CreditCard, Radio, Save, CheckCircle2, AlertCircle, Loader2, RefreshCcw, KeyRound, Webhook } from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { useTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/authStore';
import { platformApi } from '@/api/platform.api';

interface Props { T: Theme; isDesktop: boolean; }

export function SettingsPanel({ T, isDesktop }: Props) {
    const { isDark, toggleTheme } = useTheme();
    const user = useAuthStore(s => s.user);
    const canManageTripay = user?.role === 'super_admin';
    const [tripay, setTripay] = useState({
        mode: 'test',
        base_url: '',
        merchant_code: '',
        api_key: '',
        private_key: '',
        webhook_url: '',
        recommended_webhook_url: '',
        bank_transfer_channel: 'BCAVA',
        ewallet_channel: 'QRIS',
        has_api_key: false,
        has_private_key: false,
        api_key_masked: '',
        private_key_masked: '',
        configured_base_url: '',
        expected_base_url: '',
        is_base_url_aligned: true,
    });
    const [tripayLoading, setTripayLoading] = useState(false);
    const [tripaySaving, setTripaySaving] = useState(false);
    const [tripayTesting, setTripayTesting] = useState(false);
    const [tripayNotice, setTripayNotice] = useState<{ tone: 'success' | 'danger' | 'info'; text: string } | null>(null);

    useEffect(() => {
        if (!canManageTripay) return;

        let mounted = true;
        setTripayLoading(true);

        platformApi.getPlatformSettings()
            .then(response => {
                if (!mounted) return;
                const nextTripay = response.data?.data?.tripay;
                if (nextTripay) {
                    setTripay(current => ({
                        ...current,
                        ...nextTripay,
                        api_key: '',
                        private_key: '',
                    }));
                }
            })
            .catch(() => {
                if (mounted) {
                    setTripayNotice({ tone: 'danger', text: 'Gagal memuat konfigurasi Tripay.' });
                }
            })
            .finally(() => {
                if (mounted) setTripayLoading(false);
            });

        return () => { mounted = false; };
    }, [canManageTripay]);

    const sections = [
        {
            title: 'Akun',
            items: [
                { icon: User, label: 'Profil', desc: user?.name ?? 'Admin', color: T.primary },
                { icon: Shield, label: 'Role', desc: user?.role ?? '-', color: T.info },
            ],
        },
        {
            title: 'Preferensi',
            items: [
                {
                    icon: isDark ? Moon : Sun, label: 'Tema',
                    desc: isDark ? 'Dark Mode' : 'Light Mode',
                    color: isDark ? '#A855F7' : T.gold,
                    action: toggleTheme,
                    toggle: true, toggleState: isDark,
                },
                { icon: Globe, label: 'Bahasa', desc: 'Bahasa Indonesia', color: T.success },
                { icon: Bell, label: 'Notifikasi', desc: 'Aktif', color: T.danger },
            ],
        },
    ];

    return (
        <div style={{ maxWidth: 560 }}>
            {/* Profile card */}
            <div style={{
                background: T.card, borderRadius: 16, border: `1px solid ${T.border}`,
                padding: isDesktop ? 24 : 18, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16,
            }}>
                <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 900, fontSize: 20, fontFamily: "'Sora', sans-serif", flexShrink: 0,
                }}>
                    {(user?.name ?? 'A').slice(0, 1).toUpperCase()}
                </div>
                <div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: T.text }}>{user?.name ?? 'Admin'}</div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2, textTransform: 'capitalize' }}>{user?.role ?? '-'}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                        {user?.active_products?.map(p => (
                            <span key={p} style={{
                                fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                                background: `${T.success}15`, color: T.success, textTransform: 'capitalize',
                            }}>{p}</span>
                        ))}
                    </div>
                </div>
            </div>

            {sections.map(section => (
                <div key={section.title} style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: .8, marginBottom: 10, paddingLeft: 2 }}>
                        {section.title}
                    </div>
                    <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                        {section.items.map((item, idx) => {
                            const Icon = item.icon;
                            return (
                                <button key={item.label} onClick={item.action} style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '14px 16px', textAlign: 'left',
                                    borderBottom: idx < section.items.length - 1 ? `1px solid ${T.border}30` : 'none',
                                    transition: 'background .12s',
                                }} onMouseEnter={e => e.currentTarget.style.background = `${T.border}20`} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <div style={{ width: 34, height: 34, borderRadius: 10, background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Icon size={15} color={item.color} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{item.label}</div>
                                        <div style={{ fontSize: 11, color: T.textMuted }}>{item.desc}</div>
                                    </div>
                                    {item.toggle ? (
                                        <div style={{
                                            width: 42, height: 24, borderRadius: 12,
                                            background: item.toggleState ? T.primary : T.border,
                                            display: 'flex', alignItems: 'center',
                                            padding: '0 2px', transition: 'background .2s',
                                        }}>
                                            <div style={{
                                                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                                                transition: 'transform .2s ease',
                                                transform: item.toggleState ? 'translateX(18px)' : 'translateX(0)',
                                                boxShadow: '0 1px 3px rgba(0,0,0,.2)',
                                            }} />
                                        </div>
                                    ) : (
                                        <ChevronRight size={14} color={T.textMuted} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}

            {canManageTripay && (
                <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: .8, marginBottom: 10, paddingLeft: 2 }}>
                        Payment Gateway
                    </div>
                    <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: isDesktop ? 18 : 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 12, background: `${T.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CreditCard size={18} color={T.primary} />
                            </div>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>Tripay</div>
                                <div style={{ fontSize: 11, color: T.textMuted }}>Konfigurasi checkout dan webhook untuk pembayaran invoice customer.</div>
                            </div>
                        </div>

                        {tripayNotice && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
                                padding: '10px 12px', borderRadius: 10,
                                background: tripayNotice.tone === 'success' ? `${T.success}10` : tripayNotice.tone === 'danger' ? `${T.danger}10` : `${T.primary}10`,
                                color: tripayNotice.tone === 'success' ? T.success : tripayNotice.tone === 'danger' ? T.danger : T.primary,
                                border: `1px solid ${tripayNotice.tone === 'success' ? `${T.success}25` : tripayNotice.tone === 'danger' ? `${T.danger}25` : `${T.primary}25`}`,
                            }}>
                                {tripayNotice.tone === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                <span style={{ fontSize: 11, fontWeight: 700 }}>{tripayNotice.text}</span>
                            </div>
                        )}

                        {tripayLoading ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.textMuted, padding: '10px 0' }}>
                                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                Memuat konfigurasi Tripay...
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: 10 }}>
                                    <label style={fieldWrap}>
                                        <span style={{ ...fieldLabel, color: T.textMuted }}><Radio size={12} /> Mode</span>
                                        <select
                                            value={tripay.mode}
                                            onChange={e => setTripay(current => ({ ...current, mode: e.target.value }))}
                                            style={fieldInput(T)}
                                        >
                                            <option value="test">Sandbox</option>
                                            <option value="live">Live</option>
                                        </select>
                                    </label>
                                    <label style={fieldWrap}>
                                        <span style={{ ...fieldLabel, color: T.textMuted }}><Globe size={12} /> Base URL</span>
                                        <input value={tripay.base_url ?? ''} onChange={e => setTripay(current => ({ ...current, base_url: e.target.value }))} style={fieldInput(T)} />
                                    </label>
                                    <label style={fieldWrap}>
                                        <span style={{ ...fieldLabel, color: T.textMuted }}><KeyRound size={12} /> Merchant Code</span>
                                        <input value={tripay.merchant_code ?? ''} onChange={e => setTripay(current => ({ ...current, merchant_code: e.target.value }))} style={fieldInput(T)} />
                                    </label>
                                    <label style={fieldWrap}>
                                        <span style={{ ...fieldLabel, color: T.textMuted }}><Webhook size={12} /> Webhook URL</span>
                                        <input value={tripay.webhook_url ?? ''} onChange={e => setTripay(current => ({ ...current, webhook_url: e.target.value }))} style={fieldInput(T)} />
                                    </label>
                                    <label style={fieldWrap}>
                                        <span style={{ ...fieldLabel, color: T.textMuted }}><CreditCard size={12} /> Bank Transfer Channel</span>
                                        <input value={tripay.bank_transfer_channel ?? ''} onChange={e => setTripay(current => ({ ...current, bank_transfer_channel: e.target.value.toUpperCase() }))} style={fieldInput(T)} />
                                    </label>
                                    <label style={fieldWrap}>
                                        <span style={{ ...fieldLabel, color: T.textMuted }}><CreditCard size={12} /> E-Wallet Channel</span>
                                        <input value={tripay.ewallet_channel ?? ''} onChange={e => setTripay(current => ({ ...current, ewallet_channel: e.target.value.toUpperCase() }))} style={fieldInput(T)} />
                                    </label>
                                    <label style={{ ...fieldWrap, gridColumn: isDesktop ? 'span 2' : undefined }}>
                                        <span style={{ ...fieldLabel, color: T.textMuted }}><KeyRound size={12} /> API Key {tripay.has_api_key && tripay.api_key_masked ? `• ${tripay.api_key_masked}` : ''}</span>
                                        <input type="password" value={tripay.api_key} onChange={e => setTripay(current => ({ ...current, api_key: e.target.value }))} placeholder={tripay.has_api_key ? 'Kosongkan jika tidak ingin mengganti' : 'Masukkan API key Tripay'} style={fieldInput(T)} />
                                    </label>
                                    <label style={{ ...fieldWrap, gridColumn: isDesktop ? 'span 2' : undefined }}>
                                        <span style={{ ...fieldLabel, color: T.textMuted }}><KeyRound size={12} /> Private Key {tripay.has_private_key && tripay.private_key_masked ? `• ${tripay.private_key_masked}` : ''}</span>
                                        <input type="password" value={tripay.private_key} onChange={e => setTripay(current => ({ ...current, private_key: e.target.value }))} placeholder={tripay.has_private_key ? 'Kosongkan jika tidak ingin mengganti' : 'Masukkan private key Tripay'} style={fieldInput(T)} />
                                    </label>
                                </div>

                                <div style={{
                                    marginTop: 12, padding: '10px 12px', borderRadius: 10,
                                    background: `${tripay.is_base_url_aligned ? T.success : T.gold}10`,
                                    color: tripay.is_base_url_aligned ? T.success : T.gold,
                                    border: `1px solid ${tripay.is_base_url_aligned ? `${T.success}20` : `${T.gold}20`}`,
                                    fontSize: 11, fontWeight: 700,
                                }}>
                                    Base URL {tripay.is_base_url_aligned ? 'selaras' : 'belum selaras'} dengan mode. Rekomendasi: {tripay.expected_base_url || tripay.recommended_webhook_url}
                                </div>

                                <div style={{
                                    marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap',
                                    justifyContent: 'space-between',
                                }}>
                                    <div style={{ fontSize: 10, color: T.textMuted, lineHeight: 1.5 }}>
                                        Recommended webhook:
                                        <div style={{ color: T.text, fontWeight: 700, marginTop: 2 }}>{tripay.recommended_webhook_url}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        <button
                                            onClick={async () => {
                                                setTripayTesting(true);
                                                setTripayNotice(null);
                                                try {
                                                    const response = await platformApi.testTripayConnection();
                                                    const result = response.data?.data;
                                                    setTripayNotice({
                                                        tone: result?.ok ? 'success' : 'danger',
                                                        text: result?.message || 'Tripay test selesai.',
                                                    });
                                                } catch (error: any) {
                                                    setTripayNotice({ tone: 'danger', text: error?.response?.data?.message || 'Tripay test gagal.' });
                                                } finally {
                                                    setTripayTesting(false);
                                                }
                                            }}
                                            style={actionButton(T, 'secondary')}
                                        >
                                            {tripayTesting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCcw size={14} />}
                                            Test Connection
                                        </button>
                                        <button
                                            onClick={async () => {
                                                setTripaySaving(true);
                                                setTripayNotice(null);
                                                try {
                                                    const response = await platformApi.updateTripaySettings({
                                                        mode: tripay.mode as 'test' | 'live',
                                                        base_url: tripay.base_url,
                                                        merchant_code: tripay.merchant_code,
                                                        api_key: tripay.api_key || undefined,
                                                        private_key: tripay.private_key || undefined,
                                                        webhook_url: tripay.webhook_url,
                                                        bank_transfer_channel: tripay.bank_transfer_channel,
                                                        ewallet_channel: tripay.ewallet_channel,
                                                    });
                                                    const nextTripay = response.data?.data?.tripay;
                                                    if (nextTripay) {
                                                        setTripay(current => ({
                                                            ...current,
                                                            ...nextTripay,
                                                            api_key: '',
                                                            private_key: '',
                                                        }));
                                                    }
                                                    setTripayNotice({ tone: 'success', text: 'Konfigurasi Tripay berhasil disimpan.' });
                                                } catch (error: any) {
                                                    setTripayNotice({ tone: 'danger', text: error?.response?.data?.message || 'Gagal menyimpan konfigurasi Tripay.' });
                                                } finally {
                                                    setTripaySaving(false);
                                                }
                                            }}
                                            style={actionButton(T, 'primary')}
                                        >
                                            {tripaySaving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                                            Simpan
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted }}>Corextor Platform</div>
                <div style={{ fontSize: 10, color: `${T.textMuted}80`, marginTop: 2 }}>v1.0.0 — Built with ❤️</div>
            </div>
        </div>
    );
}

const fieldWrap: React.CSSProperties = {
    display: 'grid',
    gap: 6,
};

const fieldLabel: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    fontWeight: 700,
};

function fieldInput(T: Theme): React.CSSProperties {
    return {
        width: '100%',
        height: 40,
        borderRadius: 10,
        border: `1px solid ${T.border}`,
        background: T.bgAlt,
        color: T.text,
        fontSize: 12,
        padding: '0 12px',
    };
}

function actionButton(T: Theme, tone: 'primary' | 'secondary'): React.CSSProperties {
    return {
        height: 40,
        borderRadius: 10,
        padding: '0 14px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12,
        fontWeight: 800,
        background: tone === 'primary' ? T.primary : T.bgAlt,
        color: tone === 'primary' ? '#fff' : T.text,
        border: tone === 'primary' ? `1px solid ${T.primary}` : `1px solid ${T.border}`,
    };
}
