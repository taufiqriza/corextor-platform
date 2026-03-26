import { Children, useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
    Bell,
    Camera,
    ChevronRight,
    Clock3,
    Code2,
    Globe,
    HelpCircle,
    Info,
    KeyRound,
    Loader2,
    LogOut,
    MapPin,
    Moon,
    Shield,
    Smartphone,
    Sparkles,
    Sun,
    User,
    X,
    type LucideIcon,
} from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { attendanceApi, platformApi } from '@/api/platform.api';
import type { AttendanceContextPayload } from '@/types/attendance.types';
import { getLoginDestination, navigateToResolvedUrl } from '@/lib/appSurface';
import { normalizePublicAssetUrl } from '@/lib/publicAsset';

interface Props {
    T: Theme;
    isDesktop: boolean;
    isDark: boolean;
    toggleTheme: () => void;
}

type SheetKey = 'account' | 'role' | 'pin' | 'language' | 'notifications' | 'version' | 'help' | 'services' | 'logout' | null;
type NoticeTone = 'success' | 'error' | 'info';
type NoticeState = { tone: NoticeTone; message: string } | null;
type LanguageCode = 'id' | 'en';
type NotificationPrefs = {
    reminders: boolean;
    summary: boolean;
    account: boolean;
};

const LANGUAGE_KEY = 'corextor_employee_language';
const NOTIFICATION_KEY = 'corextor_employee_notifications';
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
const MOBILE_NAV_OFFSET = 'calc(96px + env(safe-area-inset-bottom, 0px))';

export function EmployeeProfileTab({ T, isDesktop, isDark, toggleTheme }: Props) {
    const user = useAuthStore(s => s.user);
    const logout = useAuthStore(s => s.logout);
    const fetchMe = useAuthStore(s => s.fetchMe);
    const navigate = useNavigate();

    const [profileContext, setProfileContext] = useState<AttendanceContextPayload | null>(null);
    const [activeSheet, setActiveSheet] = useState<SheetKey>(null);
    const [sheetError, setSheetError] = useState('');
    const [notice, setNotice] = useState<NoticeState>(null);
    const [savingSheet, setSavingSheet] = useState<'account' | 'pin' | null>(null);
    const [avatarBusy, setAvatarBusy] = useState(false);
    const [showServicePromo, setShowServicePromo] = useState(true);
    const [language, setLanguage] = useState<LanguageCode>(() => loadLanguagePreference());
    const [languageDraft, setLanguageDraft] = useState<LanguageCode>(() => loadLanguagePreference());
    const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>(() => loadNotificationPreference());
    const [notificationDraft, setNotificationDraft] = useState<NotificationPrefs>(() => loadNotificationPreference());
    const [accountForm, setAccountForm] = useState({
        name: user?.name ?? '',
        email: user?.email ?? '',
    });
    const [pinForm, setPinForm] = useState({
        current_pin: '',
        new_pin: '',
        new_pin_confirmation: '',
    });
    const avatarInputRef = useRef<HTMLInputElement | null>(null);

    const fetchContext = useCallback(async () => {
        try {
            const res = await attendanceApi.getContext();
            setProfileContext(res.data?.data ?? null);
        } catch {
            // Profile should remain usable even if attendance context is unavailable.
        }
    }, []);

    useEffect(() => {
        void fetchContext();
    }, [fetchContext]);

    useEffect(() => {
        if (activeSheet !== 'account') {
            setAccountForm({
                name: user?.name ?? '',
                email: user?.email ?? '',
            });
        }
    }, [activeSheet, user?.email, user?.name]);

    const flashNotice = useCallback((tone: NoticeTone, message: string) => {
        setNotice({ tone, message });
        window.setTimeout(() => {
            setNotice(current => current?.message === message ? null : current);
        }, 2800);
    }, []);

    const openSheet = (sheet: Exclude<SheetKey, null>) => {
        setSheetError('');

        if (sheet === 'account') {
            setAccountForm({
                name: user?.name ?? '',
                email: user?.email ?? '',
            });
        }

        if (sheet === 'pin') {
            setPinForm({
                current_pin: '',
                new_pin: '',
                new_pin_confirmation: '',
            });
        }

        if (sheet === 'language') {
            setLanguageDraft(language);
        }

        if (sheet === 'notifications') {
            setNotificationDraft(notificationPrefs);
        }

        setActiveSheet(sheet);
    };

    const closeSheet = () => {
        if (savingSheet) return;
        setSheetError('');
        setActiveSheet(null);
    };

    const handleLogout = async () => {
        await logout();
        navigateToResolvedUrl(getLoginDestination('employee'), navigate);
    };

    const handleSaveAccount = async () => {
        const name = accountForm.name.trim();
        const email = accountForm.email.trim().toLowerCase();

        if (name.length < 2) {
            setSheetError('Nama minimal 2 karakter.');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setSheetError('Masukkan email yang valid.');
            return;
        }

        setSavingSheet('account');
        setSheetError('');

        try {
            await platformApi.updateMe({ name, email });
            await fetchMe();
            setSheetError('');
            setActiveSheet(null);
            flashNotice('success', 'Profil akun berhasil diperbarui.');
        } catch (error: any) {
            setSheetError(extractApiMessage(error, 'Gagal menyimpan profil akun.'));
        } finally {
            setSavingSheet(null);
        }
    };

    const handleSavePin = async () => {
        if (!/^[0-9]{6}$/.test(pinForm.current_pin)) {
            setSheetError('PIN saat ini harus 6 digit angka.');
            return;
        }

        if (!/^[0-9]{6}$/.test(pinForm.new_pin)) {
            setSheetError('PIN baru harus 6 digit angka.');
            return;
        }

        if (pinForm.new_pin === pinForm.current_pin) {
            setSheetError('PIN baru harus berbeda dari PIN saat ini.');
            return;
        }

        if (pinForm.new_pin !== pinForm.new_pin_confirmation) {
            setSheetError('Konfirmasi PIN baru belum cocok.');
            return;
        }

        setSavingSheet('pin');
        setSheetError('');

        try {
            await attendanceApi.changeMyPin(pinForm);
            setPinForm({
                current_pin: '',
                new_pin: '',
                new_pin_confirmation: '',
            });
            setSheetError('');
            setActiveSheet(null);
            flashNotice('success', 'PIN absensi berhasil diganti.');
        } catch (error: any) {
            setSheetError(extractApiMessage(error, 'Gagal mengganti PIN absensi.'));
        } finally {
            setSavingSheet(null);
        }
    };

    const saveLanguagePreference = () => {
        localStorage.setItem(LANGUAGE_KEY, languageDraft);
        setLanguage(languageDraft);
        closeSheet();
        flashNotice('success', `Bahasa preferensi disimpan ke ${languageDraft === 'id' ? 'Indonesia' : 'English'}.`);
    };

    const saveNotificationPreference = () => {
        localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(notificationDraft));
        setNotificationPrefs(notificationDraft);
        closeSheet();
        flashNotice('success', 'Preferensi notifikasi berhasil disimpan.');
    };

    const handlePickAvatar = () => {
        if (avatarBusy) return;
        avatarInputRef.current?.click();
    };

    const handleAvatarSelected = async (file?: File | null) => {
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            flashNotice('error', 'File harus berupa gambar.');
            return;
        }

        if (file.size > 4 * 1024 * 1024) {
            flashNotice('error', 'Ukuran foto maksimal 4 MB.');
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file);

        setAvatarBusy(true);
        try {
            await platformApi.updateMyAvatar(formData);
            await fetchMe();
            flashNotice('success', 'Foto profil berhasil diperbarui.');
        } catch (error: any) {
            flashNotice('error', extractApiMessage(error, 'Gagal memperbarui foto profil.'));
        } finally {
            setAvatarBusy(false);
            if (avatarInputRef.current) {
                avatarInputRef.current.value = '';
            }
        }
    };

    const initials = (user?.name ?? 'E')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(word => word[0])
        .join('')
        .toUpperCase();
    const firstName = (user?.name ?? 'Karyawan').split(' ')[0];
    const companyName = profileContext?.company?.name ?? user?.company?.name ?? 'Corextor';
    const companyLogo = normalizePublicAssetUrl(profileContext?.company?.logo_url ?? user?.company?.logo_url ?? '');
    const avatarUrl = normalizePublicAssetUrl(user?.avatar_url ?? '');
    const branchName = profileContext?.branch?.name ?? 'Belum ada branch';
    const attendanceStatus = profileContext?.attendance_user.status ?? 'unknown';
    const todayStatus = profileContext?.today_record?.time_out
        ? 'Selesai'
        : profileContext?.today_record?.time_in
            ? 'Sedang bekerja'
            : 'Belum absen';
    const roleMeta = getRoleMeta(user?.role);
    const attendanceLabel = getAttendanceStatusLabel(attendanceStatus);
    const statusChip = profileContext?.today_record?.time_out
        ? { label: 'Selesai', background: 'rgba(214,255,192,.92)', color: '#4B6B0B' }
        : profileContext?.today_record?.time_in
            ? { label: 'Aktif', background: 'rgba(211,236,255,.94)', color: '#0E5B98' }
            : { label: 'Siap', background: 'rgba(255,236,207,.94)', color: '#9A5B00' };
    const productChips = user?.active_products ?? [];
    const activeNotificationCount = Object.values(notificationPrefs).filter(Boolean).length;
    const languageLabel = language === 'id' ? 'Indonesia' : 'English';
    const browserLabel = getBrowserLabel();
    const deviceLabel = typeof navigator !== 'undefined'
        ? `${navigator.platform || 'Web'}`
        : 'Web';
    const headerStats = [
        { label: 'Hari Ini', value: todayStatus, icon: Clock3 },
        { label: 'Branch', value: branchName, icon: MapPin },
        { label: 'Status', value: attendanceLabel, icon: Shield },
    ];
    const heroCardBackground = isDark ? 'rgba(10,18,32,.78)' : 'rgba(255,255,255,.96)';
    const heroCardText = isDark ? '#E2E8F0' : '#0F172A';
    const heroCardMuted = isDark ? '#94A3B8' : '#64748B';
    const heroCardShadow = isDark ? '0 18px 34px rgba(2,6,23,.4)' : '0 18px 34px rgba(8,49,87,.16)';
    const heroMetricBackground = isDark
        ? 'linear-gradient(180deg, rgba(255,255,255,.05) 0%, rgba(255,255,255,.03) 100%)'
        : 'linear-gradient(180deg, #F8FBFF 0%, #F1F7FF 100%)';
    const heroMetricBorder = isDark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(15,23,42,.06)';

    const sections: {
        title: string;
        items: {
            icon: LucideIcon;
            label: string;
            desc: string;
            color: string;
            action?: () => void;
            toggle?: boolean;
            toggleState?: boolean;
        }[];
    }[] = [
        {
            title: 'Akun',
            items: [
                {
                    icon: User,
                    label: 'Edit akun',
                    desc: user?.email ?? 'Perbarui nama dan email login',
                    color: T.primary,
                    action: () => openSheet('account'),
                },
                {
                    icon: Shield,
                    label: 'Informasi role',
                    desc: `${roleMeta.label}${productChips.length ? ` • ${productChips.length} produk aktif` : ''}`,
                    color: T.info,
                    action: () => openSheet('role'),
                },
                {
                    icon: KeyRound,
                    label: 'Ubah PIN',
                    desc: 'Ganti PIN absensi 6 digit',
                    color: '#A855F7',
                    action: () => openSheet('pin'),
                },
            ],
        },
        {
            title: 'Preferensi',
            items: [
                {
                    icon: isDark ? Moon : Sun,
                    label: 'Mode gelap',
                    desc: isDark ? 'Dark mode aktif' : 'Light mode aktif',
                    color: isDark ? '#A855F7' : T.gold,
                    action: toggleTheme,
                    toggle: true,
                    toggleState: isDark,
                },
                {
                    icon: Globe,
                    label: 'Bahasa',
                    desc: languageLabel,
                    color: T.success,
                    action: () => openSheet('language'),
                },
                {
                    icon: Bell,
                    label: 'Notifikasi',
                    desc: activeNotificationCount > 0
                        ? `${activeNotificationCount}/3 pengingat aktif`
                        : 'Semua pengingat nonaktif',
                    color: T.danger,
                    action: () => openSheet('notifications'),
                },
            ],
        },
        {
            title: 'Tentang',
            items: [
                {
                    icon: Smartphone,
                    label: 'Versi aplikasi',
                    desc: `Portal employee • v${APP_VERSION}`,
                    color: T.textMuted,
                    action: () => openSheet('version'),
                },
                {
                    icon: Info,
                    label: 'Bantuan',
                    desc: 'Panduan akun & absensi',
                    color: T.info,
                    action: () => openSheet('help'),
                },
            ],
        },
    ];

    const card = (extra?: CSSProperties): CSSProperties => ({
        background: T.card,
        borderRadius: 20,
        border: `1px solid ${T.border}`,
        ...extra,
    });

    return (
        <div>
            <input
                ref={avatarInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                style={{ display: 'none' }}
                onChange={event => void handleAvatarSelected(event.target.files?.[0] ?? null)}
            />

            <section style={{
                position: 'relative',
                overflow: 'hidden',
                margin: isDesktop ? '0 0 18px' : '-12px -14px 18px',
                borderRadius: isDesktop ? '28px 28px 34px 34px' : '0 0 34px 34px',
                padding: isDesktop ? '20px 20px 18px' : '18px 18px 16px',
                background: 'linear-gradient(180deg, #0F5FA6 0%, #176DAE 38%, #1B74B6 100%)',
                boxShadow: isDesktop ? '0 24px 54px rgba(12,63,112,.24)' : '0 18px 42px rgba(12,63,112,.22)',
                color: '#fff',
            }}>
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at top right, rgba(255,255,255,.11), transparent 26%), radial-gradient(circle at bottom left, rgba(255,255,255,.09), transparent 34%), linear-gradient(135deg, rgba(255,255,255,.06), transparent 42%)',
                }} />
                <div style={{
                    position: 'absolute',
                    top: isDesktop ? -42 : -54,
                    right: isDesktop ? -8 : -18,
                    width: isDesktop ? 180 : 160,
                    height: isDesktop ? 180 : 160,
                    borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,.16)',
                    opacity: .42,
                    pointerEvents: 'none',
                }} />
                <div style={{
                    position: 'absolute',
                    top: isDesktop ? 22 : 18,
                    right: isDesktop ? 32 : 22,
                    width: isDesktop ? 110 : 96,
                    height: isDesktop ? 110 : 96,
                    borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,.09)',
                    opacity: .5,
                    pointerEvents: 'none',
                }} />
                <div style={{
                    position: 'absolute',
                    left: isDesktop ? 22 : 16,
                    top: isDesktop ? 22 : 18,
                    width: isDesktop ? 82 : 74,
                    height: isDesktop ? 48 : 42,
                    backgroundImage: 'radial-gradient(rgba(255,255,255,.16) 1.2px, transparent 1.2px)',
                    backgroundSize: '16px 16px',
                    opacity: .35,
                    pointerEvents: 'none',
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 12,
                        marginBottom: 14,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                            <div style={{
                                width: isDesktop ? 62 : 54,
                                height: isDesktop ? 62 : 54,
                                borderRadius: isDesktop ? 20 : 18,
                                background: 'rgba(255,255,255,.2)',
                                border: '1px solid rgba(255,255,255,.24)',
                                boxShadow: '0 10px 24px rgba(14,62,105,.18)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                overflow: 'hidden',
                                position: 'relative',
                                flexShrink: 0,
                            }}>
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={user?.name ?? 'Karyawan'}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <span style={{
                                        fontWeight: 900,
                                        fontSize: isDesktop ? 20 : 18,
                                        fontFamily: "'Sora', sans-serif",
                                    }}>
                                        {initials}
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={handlePickAvatar}
                                    disabled={avatarBusy}
                                    style={{
                                        position: 'absolute',
                                        right: 4,
                                        bottom: 4,
                                        width: 22,
                                        height: 22,
                                        borderRadius: 999,
                                        background: 'rgba(15,23,42,.72)',
                                        border: '1px solid rgba(255,255,255,.18)',
                                        color: '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 6px 14px rgba(15,23,42,.22)',
                                    }}
                                >
                                    {avatarBusy ? <Loader2 size={11} className="cx-spin" /> : <Camera size={11} />}
                                </button>
                            </div>

                            <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{
                                    fontSize: isDesktop ? 20 : 17,
                                    fontWeight: 900,
                                    fontFamily: "'Sora', sans-serif",
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}>
                                    {user?.name ?? 'Karyawan'}
                                </div>
                                <div style={{
                                    marginTop: 4,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    flexWrap: 'wrap',
                                    fontSize: 11,
                                    color: 'rgba(255,255,255,.82)',
                                    fontWeight: 700,
                                }}>
                                    <span>{roleMeta.label}</span>
                                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,.5)' }} />
                                    <span>{companyName}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: isDesktop ? '5px 9px' : '4px 8px',
                            borderRadius: 999,
                            background: statusChip.background,
                            color: statusChip.color,
                            fontSize: isDesktop ? 10.5 : 10,
                            fontWeight: 800,
                            flexShrink: 0,
                        }}>
                            <span style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: statusChip.color,
                            }} />
                            {statusChip.label}
                        </div>
                    </div>

                    <div style={{
                        background: heroCardBackground,
                        color: heroCardText,
                        borderRadius: 22,
                        padding: isDesktop ? '14px' : '12px',
                        boxShadow: heroCardShadow,
                        border: isDark ? '1px solid rgba(255,255,255,.08)' : undefined,
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            marginBottom: 12,
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                minWidth: 0,
                                flex: 1,
                            }}>
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '6px 10px',
                                    borderRadius: 999,
                                    background: 'linear-gradient(135deg, #163E73, #1E5BA8)',
                                    color: '#fff',
                                    fontSize: 10,
                                    fontWeight: 800,
                                    flexShrink: 0,
                                }}>
                                    <Shield size={12} />
                                    Profil
                                </div>
                                <div style={{
                                    minWidth: 0,
                                    fontSize: 10.5,
                                    color: heroCardMuted,
                                    fontWeight: 700,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}>
                                    {branchName}
                                </div>
                            </div>
                            {companyLogo && (
                                <img
                                    src={companyLogo}
                                    alt={companyName}
                                    style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 11,
                                        objectFit: 'cover',
                                        border: `1px solid ${T.border}`,
                                        boxShadow: T.shadowSm,
                                        flexShrink: 0,
                                    }}
                                />
                            )}
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                            gap: 6,
                        }}>
                            {headerStats.map(item => (
                                <div key={item.label} style={{
                                    borderRadius: 14,
                                    padding: isDesktop ? '9px 9px 8px' : '8px 8px 7px',
                                    background: heroMetricBackground,
                                    border: heroMetricBorder,
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 5,
                                        fontSize: 8.5,
                                        color: heroCardMuted,
                                        fontWeight: 700,
                                    }}>
                                        <item.icon size={11} />
                                        {item.label}
                                    </div>
                                    <div style={{
                                        marginTop: 5,
                                        fontSize: isDesktop ? 14 : 11.5,
                                        lineHeight: 1.1,
                                        fontWeight: 900,
                                        fontFamily: "'Sora', sans-serif",
                                        color: heroCardText,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}>
                                        {item.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {showServicePromo && (
                <section
                    style={{
                        position: 'relative',
                        overflow: 'hidden',
                        marginBottom: 18,
                        borderRadius: 22,
                        padding: isDesktop ? '13px 14px 12px' : '12px 12px 11px',
                        background: 'linear-gradient(135deg, #0E3B73 0%, #125296 48%, #1C78BA 100%)',
                        boxShadow: '0 18px 36px rgba(12,63,112,.18)',
                        color: '#fff',
                        cursor: 'pointer',
                    }}
                    role="button"
                    tabIndex={0}
                    onClick={() => openSheet('services')}
                    onKeyDown={event => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            openSheet('services');
                        }
                    }}
                >
                    <div style={{
                        position: 'absolute',
                        top: -36,
                        right: -24,
                        width: 116,
                        height: 116,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,.1)',
                        border: '1px solid rgba(255,255,255,.08)',
                        pointerEvents: 'none',
                    }} />
                    <div style={{
                        position: 'absolute',
                        bottom: -44,
                        left: -20,
                        width: 96,
                        height: 96,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,.08)',
                        pointerEvents: 'none',
                    }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                        }}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    height: 24,
                                    padding: '0 9px',
                                    borderRadius: 999,
                                    background: 'rgba(255,255,255,.12)',
                                    border: '1px solid rgba(255,255,255,.14)',
                                    fontSize: 9,
                                    fontWeight: 900,
                                    letterSpacing: .3,
                                    marginBottom: 8,
                                }}>
                                    <Sparkles size={11} />
                                    Build with Corextor
                                </div>
                                <div style={{
                                    fontSize: isDesktop ? 15 : 13,
                                    fontWeight: 900,
                                    fontFamily: "'Sora', sans-serif",
                                    lineHeight: 1.2,
                                }}>
                                    Butuh website atau system untuk bisnismu?
                                </div>
                                <div style={{
                                    marginTop: 4,
                                    fontSize: 11,
                                    lineHeight: 1.45,
                                    color: 'rgba(255,255,255,.82)',
                                    maxWidth: 540,
                                }}>
                                    Website, web apps, Android & iOS, dan system bisnis modern untuk perusahaan.
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 6,
                                flexShrink: 0,
                            }}>
                                <div
                                    style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: 999,
                                        background: 'rgba(255,255,255,.12)',
                                        border: '1px solid rgba(255,255,255,.18)',
                                        color: '#fff',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <ChevronRight size={14} />
                                </div>
                                <button
                                    type="button"
                                    aria-label="Tutup promosi layanan"
                                    onClick={event => {
                                        event.stopPropagation();
                                        setShowServicePromo(false);
                                    }}
                                    style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: 999,
                                        background: 'rgba(255,255,255,.12)',
                                        border: '1px solid rgba(255,255,255,.18)',
                                        color: '#fff',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {sections.map(section => (
                <div key={section.title} style={{ marginBottom: 18 }}>
                    <div style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: T.textMuted,
                        textTransform: 'uppercase',
                        letterSpacing: .8,
                        marginBottom: 8,
                        paddingLeft: 4,
                    }}>
                        {section.title}
                    </div>
                    <div style={card({ overflow: 'hidden' })}>
                        {section.items.map((item, idx) => {
                            const Icon = item.icon;

                            return (
                                <button
                                    key={item.label + idx}
                                    type="button"
                                    onClick={item.action}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        padding: '14px 16px',
                                        textAlign: 'left',
                                        borderBottom: idx < section.items.length - 1 ? `1px solid ${T.border}40` : 'none',
                                        transition: 'background .12s',
                                    }}
                                >
                                    <div style={{
                                        width: 38,
                                        height: 38,
                                        borderRadius: 12,
                                        background: `${item.color}10`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        <Icon size={16} color={item.color} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{item.label}</div>
                                        <div style={{
                                            fontSize: 11,
                                            color: T.textMuted,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}>
                                            {item.desc}
                                        </div>
                                    </div>
                                    {item.toggle ? (
                                        <SwitchPill T={T} enabled={Boolean(item.toggleState)} />
                                    ) : (
                                        <ChevronRight size={15} color={T.textMuted} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}

            <button
                type="button"
                onClick={() => openSheet('logout')}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                    borderRadius: 20,
                    border: `1px solid ${T.danger}20`,
                    background: `${T.danger}06`,
                    textAlign: 'left',
                    marginBottom: 20,
                }}
            >
                <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    background: `${T.danger}12`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <LogOut size={16} color={T.danger} />
                </div>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.danger }}>Keluar</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>Logout dari akun ini</div>
                </div>
            </button>

            <div style={{ textAlign: 'center', paddingBottom: 16 }}>
                <div style={{ fontSize: 10, color: `${T.textMuted}80` }}>Corextor Platform v{APP_VERSION}</div>
            </div>

            <BottomSheet
                open={activeSheet === 'account'}
                title="Edit akun"
                subtitle="Perbarui nama dan email login Anda."
                onClose={closeSheet}
                T={T}
                isDesktop={isDesktop}
                footer={(
                    <>
                        <button type="button" onClick={closeSheet} style={sheetButtonStyle(T, false)} disabled={savingSheet === 'account'}>
                            Batal
                        </button>
                        <button type="button" onClick={handleSaveAccount} style={sheetButtonStyle(T, true)} disabled={savingSheet === 'account'}>
                            {savingSheet === 'account' ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </>
                )}
            >
                <div style={sheetStatGridStyle(isDesktop)}>
                    <InfoCard T={T} label="Role aktif" value={roleMeta.label} />
                    <InfoCard T={T} label="Perusahaan" value={companyName} />
                </div>

                <div style={{ display: 'grid', gap: 12 }}>
                    <label style={{ display: 'grid', gap: 6 }}>
                        <span style={fieldLabelStyle(T)}>Nama lengkap</span>
                        <input
                            value={accountForm.name}
                            onChange={e => setAccountForm(current => ({ ...current, name: e.target.value }))}
                            placeholder="Nama lengkap"
                            style={fieldInputStyle(T)}
                        />
                    </label>
                    <label style={{ display: 'grid', gap: 6 }}>
                        <span style={fieldLabelStyle(T)}>Email login</span>
                        <input
                            value={accountForm.email}
                            onChange={e => setAccountForm(current => ({ ...current, email: e.target.value }))}
                            placeholder="nama@company.com"
                            inputMode="email"
                            style={fieldInputStyle(T)}
                        />
                    </label>
                </div>

                {sheetError && <InlineMessage T={T} tone="error" message={sheetError} />}
            </BottomSheet>

            <BottomSheet
                open={activeSheet === 'role'}
                title="Informasi role"
                subtitle="Ringkasan akses yang sedang aktif di akun ini."
                onClose={closeSheet}
                T={T}
                isDesktop={isDesktop}
                footer={(
                    <button type="button" onClick={closeSheet} style={sheetButtonStyle(T, true)}>
                        Tutup
                    </button>
                )}
            >
                <div style={sheetHeroCardStyle(T)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 42,
                            height: 42,
                            borderRadius: 14,
                            background: `${T.primary}16`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Shield size={18} color={T.primary} />
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{roleMeta.label}</div>
                            <div style={{ fontSize: 12, color: T.textMuted }}>{roleMeta.description}</div>
                        </div>
                    </div>
                </div>

                <div style={sheetStatGridStyle(isDesktop)}>
                    <InfoCard T={T} label="Branch aktif" value={branchName} />
                    <InfoCard T={T} label="Status attendance" value={attendanceLabel} />
                </div>

                <div style={{ display: 'grid', gap: 10 }}>
                    <div style={infoBlockStyle(T)}>
                        <div style={infoBlockTitleStyle(T)}>Produk aktif</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {productChips.length > 0 ? productChips.map(product => (
                                <span key={product} style={tagStyle(T, true)}>
                                    {formatProductLabel(product)}
                                </span>
                            )) : (
                                <span style={tagStyle(T, false)}>Belum ada produk aktif</span>
                            )}
                        </div>
                    </div>
                    <div style={infoBlockStyle(T)}>
                        <div style={infoBlockTitleStyle(T)}>Akses akun ini</div>
                        <div style={{ display: 'grid', gap: 8 }}>
                            {roleMeta.abilities.map(item => (
                                <div key={item} style={bulletRowStyle(T)}>
                                    <span style={bulletDotStyle(T)} />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </BottomSheet>

            <BottomSheet
                open={activeSheet === 'pin'}
                title="Ubah PIN absensi"
                subtitle="Gunakan PIN 6 digit angka untuk login dan absensi."
                onClose={closeSheet}
                T={T}
                isDesktop={isDesktop}
                footer={(
                    <>
                        <button type="button" onClick={closeSheet} style={sheetButtonStyle(T, false)} disabled={savingSheet === 'pin'}>
                            Batal
                        </button>
                        <button type="button" onClick={handleSavePin} style={sheetButtonStyle(T, true)} disabled={savingSheet === 'pin'}>
                            {savingSheet === 'pin' ? 'Menyimpan...' : 'Simpan PIN'}
                        </button>
                    </>
                )}
            >
                <div style={sheetHeroCardStyle(T)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 42,
                            height: 42,
                            borderRadius: 14,
                            background: 'rgba(168,85,247,.14)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <KeyRound size={18} color="#9333EA" />
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>PIN hanya untuk Anda</div>
                            <div style={{ fontSize: 12, color: T.textMuted }}>Jangan bagikan PIN ke orang lain.</div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gap: 12 }}>
                    <label style={{ display: 'grid', gap: 6 }}>
                        <span style={fieldLabelStyle(T)}>PIN saat ini</span>
                        <input
                            value={pinForm.current_pin}
                            onChange={e => setPinForm(current => ({ ...current, current_pin: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                            placeholder="Masukkan PIN lama"
                            inputMode="numeric"
                            type="password"
                            style={fieldInputStyle(T)}
                        />
                    </label>
                    <label style={{ display: 'grid', gap: 6 }}>
                        <span style={fieldLabelStyle(T)}>PIN baru</span>
                        <input
                            value={pinForm.new_pin}
                            onChange={e => setPinForm(current => ({ ...current, new_pin: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                            placeholder="Masukkan PIN baru"
                            inputMode="numeric"
                            type="password"
                            style={fieldInputStyle(T)}
                        />
                    </label>
                    <label style={{ display: 'grid', gap: 6 }}>
                        <span style={fieldLabelStyle(T)}>Konfirmasi PIN baru</span>
                        <input
                            value={pinForm.new_pin_confirmation}
                            onChange={e => setPinForm(current => ({ ...current, new_pin_confirmation: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                            placeholder="Ulangi PIN baru"
                            inputMode="numeric"
                            type="password"
                            style={fieldInputStyle(T)}
                        />
                    </label>
                </div>

                {sheetError && <InlineMessage T={T} tone="error" message={sheetError} />}
            </BottomSheet>

            <BottomSheet
                open={activeSheet === 'language'}
                title="Bahasa"
                subtitle="Simpan bahasa preferensi untuk pengalaman employee portal."
                onClose={closeSheet}
                T={T}
                isDesktop={isDesktop}
                footer={(
                    <>
                        <button type="button" onClick={closeSheet} style={sheetButtonStyle(T, false)}>
                            Batal
                        </button>
                        <button type="button" onClick={saveLanguagePreference} style={sheetButtonStyle(T, true)}>
                            Simpan
                        </button>
                    </>
                )}
            >
                <div style={{ display: 'grid', gap: 10 }}>
                    {[
                        { code: 'id', label: 'Indonesia', desc: 'Default utama untuk employee portal.' },
                        { code: 'en', label: 'English', desc: 'Preferensi bahasa alternatif.' },
                    ].map(option => (
                        <button
                            key={option.code}
                            type="button"
                            onClick={() => setLanguageDraft(option.code as LanguageCode)}
                            style={{
                                ...selectCardStyle(T, languageDraft === option.code),
                                textAlign: 'left',
                            }}
                        >
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{option.label}</div>
                                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>{option.desc}</div>
                            </div>
                            <span style={radioDotStyle(T, languageDraft === option.code)} />
                        </button>
                    ))}
                </div>
            </BottomSheet>

            <BottomSheet
                open={activeSheet === 'notifications'}
                title="Notifikasi"
                subtitle="Atur pengingat yang ingin Anda tampilkan di perangkat ini."
                onClose={closeSheet}
                T={T}
                isDesktop={isDesktop}
                footer={(
                    <>
                        <button type="button" onClick={closeSheet} style={sheetButtonStyle(T, false)}>
                            Batal
                        </button>
                        <button type="button" onClick={saveNotificationPreference} style={sheetButtonStyle(T, true)}>
                            Simpan
                        </button>
                    </>
                )}
            >
                <div style={{ display: 'grid', gap: 10 }}>
                    {[
                        {
                            key: 'reminders' as const,
                            label: 'Pengingat check-in / check-out',
                            desc: 'Pengingat saat masuk dan pulang kerja.',
                        },
                        {
                            key: 'summary' as const,
                            label: 'Ringkasan riwayat',
                            desc: 'Ringkasan aktivitas dan kehadiran.',
                        },
                        {
                            key: 'account' as const,
                            label: 'Perubahan akun',
                            desc: 'Info perubahan profil dan PIN absensi.',
                        },
                    ].map(item => (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => setNotificationDraft(current => ({ ...current, [item.key]: !current[item.key] }))}
                            style={{
                                ...selectCardStyle(T, notificationDraft[item.key]),
                                textAlign: 'left',
                            }}
                        >
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{item.label}</div>
                                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>{item.desc}</div>
                            </div>
                            <SwitchPill T={T} enabled={notificationDraft[item.key]} />
                        </button>
                    ))}
                </div>
            </BottomSheet>

            <BottomSheet
                open={activeSheet === 'version'}
                title="Versi aplikasi"
                subtitle="Informasi build dan perangkat yang sedang dipakai."
                onClose={closeSheet}
                T={T}
                isDesktop={isDesktop}
                footer={(
                    <button type="button" onClick={closeSheet} style={sheetButtonStyle(T, true)}>
                        Tutup
                    </button>
                )}
            >
                <div style={sheetStatGridStyle(isDesktop)}>
                    <InfoCard T={T} label="Versi portal" value={`v${APP_VERSION}`} />
                    <InfoCard T={T} label="Tema aktif" value={isDark ? 'Dark mode' : 'Light mode'} />
                    <InfoCard T={T} label="Browser" value={browserLabel} />
                    <InfoCard T={T} label="Perangkat" value={deviceLabel} />
                </div>

                <div style={infoBlockStyle(T)}>
                    <div style={infoBlockTitleStyle(T)}>Runtime</div>
                    <div style={{ display: 'grid', gap: 8 }}>
                        <div style={bulletRowStyle(T)}>
                            <span style={bulletDotStyle(T)} />
                            <span>Portal: Employee web</span>
                        </div>
                        <div style={bulletRowStyle(T)}>
                            <span style={bulletDotStyle(T)} />
                            <span>Produk aktif: {productChips.length ? productChips.map(formatProductLabel).join(', ') : 'Belum ada'}</span>
                        </div>
                        <div style={bulletRowStyle(T)}>
                            <span style={bulletDotStyle(T)} />
                            <span>Host: {typeof window !== 'undefined' ? window.location.host : 'localhost'}</span>
                        </div>
                    </div>
                </div>
            </BottomSheet>

            <BottomSheet
                open={activeSheet === 'help'}
                title="Bantuan"
                subtitle="Panduan singkat saat mengalami kendala akun atau absensi."
                onClose={closeSheet}
                T={T}
                isDesktop={isDesktop}
                footer={(
                    <button type="button" onClick={closeSheet} style={sheetButtonStyle(T, true)}>
                        Selesai
                    </button>
                )}
            >
                <div style={sheetHeroCardStyle(T)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 42,
                            height: 42,
                            borderRadius: 14,
                            background: `${T.info}16`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <HelpCircle size={18} color={T.info} />
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>Pusat bantuan employee</div>
                            <div style={{ fontSize: 12, color: T.textMuted }}>Fokus ke masalah akun, PIN, dan kehadiran.</div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gap: 10 }}>
                    {[
                        `Jika PIN lupa atau akses ditolak, hubungi admin perusahaan ${companyName}.`,
                        `Pastikan status attendance Anda ${attendanceLabel.toLowerCase()} dan branch aktif di ${branchName}.`,
                        'Saat akan absen, aktifkan lokasi dan izinkan kamera untuk selfie.',
                    ].map(item => (
                        <div key={item} style={bulletRowStyle(T)}>
                            <span style={bulletDotStyle(T)} />
                            <span>{item}</span>
                        </div>
                    ))}
                </div>

                <div style={sheetStatGridStyle(isDesktop)}>
                    <InfoCard T={T} label="Perusahaan" value={companyName} />
                    <InfoCard T={T} label="Branch" value={branchName} />
                    <InfoCard T={T} label="Role" value={roleMeta.label} />
                    <InfoCard T={T} label="Hari ini" value={todayStatus} />
                </div>
            </BottomSheet>

            <BottomSheet
                open={activeSheet === 'services'}
                title="Layanan pengembangan"
                subtitle="Untuk perusahaan dan bisnis yang butuh website, web apps, atau system operasional yang lebih rapi."
                onClose={closeSheet}
                T={T}
                isDesktop={isDesktop}
                footer={(
                    <>
                        <button type="button" onClick={closeSheet} style={sheetButtonStyle(T, false)}>
                            Nanti saja
                        </button>
                        <a
                            href="https://wa.me/6282117049501"
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                ...sheetButtonStyle(T, true),
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textDecoration: 'none',
                            }}
                        >
                            Chat WhatsApp
                        </a>
                    </>
                )}
            >
                <div style={sheetHeroCardStyle(T)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 46,
                            height: 46,
                            borderRadius: 16,
                            background: 'linear-gradient(135deg, #0E3B73, #1C78BA)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            flexShrink: 0,
                        }}>
                            <Code2 size={20} />
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>Bangun system yang lebih proper</div>
                            <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.6 }}>
                                Cocok untuk company profile, web apps, dashboard internal, dan system bisnis custom.
                            </div>
                        </div>
                    </div>
                </div>

                <div style={sheetStatGridStyle(isDesktop)}>
                    <InfoCard T={T} label="Fokus" value="Website & Web Apps" />
                    <InfoCard T={T} label="Platform" value="Android, iOS & Web" />
                </div>

                <div style={{ display: 'grid', gap: 10 }}>
                    {[
                        {
                            icon: Globe,
                            title: 'Website perusahaan',
                            desc: 'Company profile, landing page, microsite, dan website bilingual Indonesia / English.',
                            color: T.primary,
                        },
                        {
                            icon: Smartphone,
                            title: 'Web apps modern',
                            desc: 'Portal customer, employee apps, booking flow, dashboard mobile-friendly, dan pengalaman seperti aplikasi.',
                            color: T.info,
                        },
                        {
                            icon: Smartphone,
                            title: 'Aplikasi Android & iOS',
                            desc: 'MVP mobile, PWA, atau aplikasi operasional untuk tim lapangan, sales, dan kebutuhan bisnis harian.',
                            color: '#8B5CF6',
                        },
                        {
                            icon: Shield,
                            title: 'System untuk bisnis',
                            desc: 'Admin panel, CRM ringan, workflow operasional, dan system internal sesuai proses perusahaan.',
                            color: T.success,
                        },
                    ].map(item => (
                        <div key={item.title} style={serviceOfferStyle(T)}>
                            <div style={serviceOfferIconStyle(item.color)}>
                                <item.icon size={18} color={item.color} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{item.title}</div>
                                <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.7, color: T.textMuted }}>
                                    {item.desc}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={infoBlockStyle(T)}>
                    <div style={infoBlockTitleStyle(T)}>Contoh yang bisa dibangun</div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                    }}>
                        {['System Kasir', 'Kehadiran', 'Laporan', 'Company Profile', 'Dashboard Admin'].map(item => (
                            <span
                                key={item}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    height: 30,
                                    padding: '0 12px',
                                    borderRadius: 999,
                                    background: `${T.primary}10`,
                                    border: `1px solid ${T.primary}18`,
                                    color: T.text,
                                    fontSize: 11,
                                    fontWeight: 800,
                                }}
                            >
                                {item}
                            </span>
                        ))}
                    </div>
                </div>

                <div style={infoBlockStyle(T)}>
                    <div style={infoBlockTitleStyle(T)}>Portfolio</div>
                    <div style={{ display: 'grid', gap: 8 }}>
                        <div style={bulletRowStyle(T)}>
                            <span style={bulletDotStyle(T)} />
                            <span>
                                Lihat karya dan eksplorasi project di{' '}
                                <a
                                    href="https://taufiqriza.github.io"
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        color: T.primary,
                                        fontWeight: 800,
                                        textDecoration: 'none',
                                    }}
                                >
                                    taufiqriza.github.io
                                </a>
                            </span>
                        </div>
                    </div>
                </div>

                <div style={infoBlockStyle(T)}>
                    <div style={infoBlockTitleStyle(T)}>Contact person</div>
                    <div style={{ display: 'grid', gap: 8 }}>
                        <div style={bulletRowStyle(T)}>
                            <span style={bulletDotStyle(T)} />
                            <span><strong style={{ color: T.text }}>Muhamad Taufiq Riza</strong></span>
                        </div>
                        <div style={bulletRowStyle(T)}>
                            <span style={bulletDotStyle(T)} />
                            <span>Software Engineering</span>
                        </div>
                        <div style={bulletRowStyle(T)}>
                            <span style={bulletDotStyle(T)} />
                            <span>WhatsApp: 082117049501</span>
                        </div>
                    </div>
                </div>
            </BottomSheet>

            <BottomSheet
                open={activeSheet === 'logout'}
                title={`Keluar, ${firstName}?`}
                subtitle="Anda akan kembali ke halaman PIN login untuk mengakses employee portal."
                onClose={closeSheet}
                T={T}
                isDesktop={isDesktop}
                footer={(
                    <>
                        <button type="button" onClick={closeSheet} style={sheetButtonStyle(T, false)}>
                            Batal
                        </button>
                        <button type="button" onClick={() => void handleLogout()} style={sheetButtonStyle(T, true, T.danger)}>
                            Ya, Keluar
                        </button>
                    </>
                )}
            >
                <div style={sheetHeroCardStyle(T)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 42,
                            height: 42,
                            borderRadius: 14,
                            background: `${T.danger}14`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <LogOut size={18} color={T.danger} />
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>Akhiri sesi akun ini</div>
                            <div style={{ fontSize: 12, color: T.textMuted }}>Token akses akan dibersihkan dari perangkat ini.</div>
                        </div>
                    </div>
                </div>
            </BottomSheet>

            {notice && (
                <div style={{
                    position: 'fixed',
                    left: 16,
                    right: 16,
                    bottom: isDesktop ? 24 : 'calc(88px + env(safe-area-inset-bottom, 0px))',
                    zIndex: 10050,
                    display: 'flex',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                }}>
                    <div style={noticeStyle(T, notice.tone)}>
                        {notice.message}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes sheetFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes sheetSlideUp {
                    from { opacity: 0; transform: translateY(28px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

function BottomSheet({
    open,
    title,
    subtitle,
    onClose,
    T,
    isDesktop,
    children,
    footer,
}: {
    open: boolean;
    title: string;
    subtitle: string;
    onClose: () => void;
    T: Theme;
    isDesktop: boolean;
    children: ReactNode;
    footer?: ReactNode;
}) {
    if (!open) return null;

    return (
        <>
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(2, 6, 23, .44)',
                    backdropFilter: 'blur(10px)',
                    zIndex: 10000,
                    animation: 'sheetFadeIn .18s ease',
                }}
            />
            <div style={{
                position: 'fixed',
                inset: 0,
                zIndex: 10001,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                pointerEvents: 'none',
                padding: isDesktop ? '0' : `0 12px ${MOBILE_NAV_OFFSET}`,
            }}>
                <div
                    onClick={event => event.stopPropagation()}
                    style={{
                        width: isDesktop ? 'min(520px, calc(100vw - 40px))' : 'min(520px, 100%)',
                        maxHeight: isDesktop
                            ? '82vh'
                            : `min(80vh, calc(100vh - 132px - ${MOBILE_NAV_OFFSET}))`,
                        pointerEvents: 'auto',
                        display: 'grid',
                        gridTemplateRows: 'auto auto 1fr auto',
                        background: T.card,
                        color: T.text,
                        borderTopLeftRadius: 28,
                        borderTopRightRadius: 28,
                        borderBottomLeftRadius: isDesktop ? 28 : 26,
                        borderBottomRightRadius: isDesktop ? 28 : 26,
                        border: `1px solid ${T.border}`,
                        boxShadow: '0 -12px 44px rgba(15,23,42,.22)',
                        overflow: 'hidden',
                        animation: 'sheetSlideUp .24s cubic-bezier(.22,.8,.2,1)',
                    }}
                >
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        paddingTop: 10,
                    }}>
                        <div style={{
                            width: 46,
                            height: 5,
                            borderRadius: 999,
                            background: `${T.textMuted}44`,
                        }} />
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 12,
                        padding: isDesktop ? '10px 22px 18px' : '8px 18px 16px',
                    }}>
                        <div>
                            <div style={{
                                fontSize: 18,
                                fontWeight: 900,
                                color: T.text,
                                fontFamily: "'Sora', sans-serif",
                            }}>
                                {title}
                            </div>
                            <div style={{
                                marginTop: 5,
                                fontSize: 12.5,
                                lineHeight: 1.5,
                                color: T.textMuted,
                            }}>
                                {subtitle}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                width: 34,
                                height: 34,
                                borderRadius: 12,
                                border: `1px solid ${T.border}`,
                                background: T.surface,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <X size={16} color={T.textMuted} />
                        </button>
                    </div>

                    <div style={{
                        overflowY: 'auto',
                        padding: isDesktop ? '0 22px 22px' : '0 18px 18px',
                        display: 'grid',
                        gap: 14,
                    }}>
                        {children}
                    </div>

                    {footer && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${Math.max(Children.count(footer), 1)}, minmax(0, 1fr))`,
                            gap: 10,
                            padding: isDesktop ? '16px 22px 24px' : '14px 18px calc(18px + env(safe-area-inset-bottom, 0px))',
                            borderTop: `1px solid ${T.border}55`,
                            background: `${T.bgAlt}F5`,
                        }}>
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function InfoCard({ T, label, value }: { T: Theme; label: string; value: string }) {
    return (
        <div style={{
            padding: '12px 13px',
            borderRadius: 18,
            border: `1px solid ${T.border}`,
            background: `${T.primary}05`,
        }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: T.textMuted }}>{label}</div>
            <div style={{
                marginTop: 6,
                fontSize: 14,
                fontWeight: 800,
                color: T.text,
                lineHeight: 1.35,
            }}>
                {value}
            </div>
        </div>
    );
}

function InlineMessage({ T, tone, message }: { T: Theme; tone: NoticeTone; message: string }) {
    return (
        <div style={inlineMessageStyle(T, tone)}>
            {message}
        </div>
    );
}

function SwitchPill({ T, enabled }: { T: Theme; enabled: boolean }) {
    return (
        <div style={{
            width: 46,
            height: 26,
            borderRadius: 13,
            background: enabled ? T.primary : T.border,
            display: 'flex',
            alignItems: 'center',
            padding: '0 3px',
            transition: 'background .2s',
            flexShrink: 0,
        }}>
            <div style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#fff',
                transition: 'transform .2s ease',
                transform: enabled ? 'translateX(20px)' : 'translateX(0)',
                boxShadow: '0 1px 3px rgba(0,0,0,.2)',
            }} />
        </div>
    );
}

function fieldLabelStyle(T: Theme): CSSProperties {
    return {
        fontSize: 11,
        fontWeight: 800,
        color: T.textMuted,
        letterSpacing: .2,
    };
}

function fieldInputStyle(T: Theme): CSSProperties {
    return {
        width: '100%',
        height: 48,
        padding: '0 14px',
        borderRadius: 16,
        border: `1px solid ${T.border}`,
        background: T.surface,
        color: T.text,
        fontSize: 14,
        fontWeight: 600,
        outline: 'none',
    };
}

function sheetButtonStyle(T: Theme, primary: boolean, forceBg?: string): CSSProperties {
    return {
        width: '100%',
        height: 48,
        borderRadius: 16,
        border: primary ? 'none' : `1px solid ${T.border}`,
        background: primary ? (forceBg ?? `linear-gradient(135deg, ${T.primaryDark}, ${T.primary})`) : T.surface,
        color: primary ? '#fff' : T.text,
        fontWeight: 800,
        fontSize: 14,
    };
}

function sheetStatGridStyle(isDesktop: boolean): CSSProperties {
    return {
        display: 'grid',
        gridTemplateColumns: isDesktop ? 'repeat(2, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))',
        gap: 10,
    };
}

function sheetHeroCardStyle(T: Theme): CSSProperties {
    return {
        padding: '14px',
        borderRadius: 20,
        background: `linear-gradient(135deg, ${T.primary}12, ${T.primaryGlow})`,
        border: `1px solid ${T.border}`,
    };
}

function infoBlockStyle(T: Theme): CSSProperties {
    return {
        padding: '14px',
        borderRadius: 18,
        border: `1px solid ${T.border}`,
        background: T.surface,
        display: 'grid',
        gap: 10,
    };
}

function infoBlockTitleStyle(T: Theme): CSSProperties {
    return {
        fontSize: 12,
        fontWeight: 900,
        color: T.text,
        letterSpacing: .2,
    };
}

function bulletRowStyle(T: Theme): CSSProperties {
    return {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 9,
        fontSize: 13,
        lineHeight: 1.5,
        color: T.textSub,
    };
}

function bulletDotStyle(T: Theme): CSSProperties {
    return {
        width: 7,
        height: 7,
        marginTop: 6,
        borderRadius: '50%',
        background: T.primary,
        flexShrink: 0,
    };
}

function tagStyle(T: Theme, active: boolean): CSSProperties {
    return {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '6px 10px',
        borderRadius: 999,
        border: `1px solid ${active ? `${T.primary}30` : T.border}`,
        background: active ? `${T.primary}12` : T.surface,
        color: active ? T.primary : T.textMuted,
        fontSize: 11,
        fontWeight: 800,
        textTransform: 'capitalize',
    };
}

function selectCardStyle(T: Theme, active: boolean): CSSProperties {
    return {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '14px',
        borderRadius: 18,
        border: `1px solid ${active ? `${T.primary}66` : T.border}`,
        background: active ? `${T.primary}0C` : T.surface,
    };
}

function radioDotStyle(T: Theme, active: boolean): CSSProperties {
    return {
        width: 22,
        height: 22,
        borderRadius: '50%',
        border: `2px solid ${active ? T.primary : T.border}`,
        background: active
            ? `radial-gradient(circle, ${T.primary} 0 40%, transparent 44% 100%)`
            : 'transparent',
        flexShrink: 0,
    };
}

function inlineMessageStyle(T: Theme, tone: NoticeTone): CSSProperties {
    const palette = tone === 'success'
        ? { bg: `${T.success}12`, text: T.success, border: `${T.success}26` }
        : tone === 'info'
            ? { bg: `${T.info}12`, text: T.info, border: `${T.info}26` }
            : { bg: `${T.danger}12`, text: T.danger, border: `${T.danger}26` };

    return {
        padding: '12px 14px',
        borderRadius: 16,
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        color: palette.text,
        fontSize: 12.5,
        fontWeight: 700,
        lineHeight: 1.5,
    };
}

function serviceOfferStyle(T: Theme): CSSProperties {
    return {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px',
        borderRadius: 18,
        border: `1px solid ${T.border}`,
        background: T.surface,
    };
}

function serviceOfferIconStyle(color: string): CSSProperties {
    return {
        width: 42,
        height: 42,
        borderRadius: 14,
        background: `${color}12`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    };
}

function noticeStyle(T: Theme, tone: NoticeTone): CSSProperties {
    const palette = tone === 'success'
        ? { bg: '#14532D', text: '#DCFCE7' }
        : tone === 'info'
            ? { bg: '#0C4A6E', text: '#E0F2FE' }
            : { bg: '#7F1D1D', text: '#FEE2E2' };

    return {
        maxWidth: 360,
        width: '100%',
        padding: '12px 14px',
        borderRadius: 16,
        background: palette.bg,
        color: palette.text,
        fontSize: 12.5,
        fontWeight: 800,
        textAlign: 'center',
        boxShadow: T.shadow,
    };
}

function loadLanguagePreference(): LanguageCode {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    return stored === 'en' ? 'en' : 'id';
}

function loadNotificationPreference(): NotificationPrefs {
    try {
        const raw = localStorage.getItem(NOTIFICATION_KEY);

        if (!raw) {
            return { reminders: true, summary: true, account: true };
        }

        const parsed = JSON.parse(raw);

        return {
            reminders: Boolean(parsed?.reminders),
            summary: Boolean(parsed?.summary),
            account: Boolean(parsed?.account),
        };
    } catch {
        return { reminders: true, summary: true, account: true };
    }
}

function getRoleMeta(role?: string | null): { label: string; description: string; abilities: string[] } {
    switch (role) {
        case 'company_admin':
            return {
                label: 'Admin Perusahaan',
                description: 'Mengelola anggota, branch, dan operasional perusahaan.',
                abilities: [
                    'Melihat dan mengelola data anggota perusahaan.',
                    'Mengakses absensi serta pengaturan operasional perusahaan.',
                    'Tetap bisa memakai portal employee jika profil attendance aktif.',
                ],
            };
        case 'super_admin':
            return {
                label: 'Super Admin',
                description: 'Akses penuh untuk mengelola platform Corextor.',
                abilities: [
                    'Mengakses seluruh area platform.',
                    'Mengelola company, team internal, dan billing.',
                    'Melihat seluruh modul produk yang tersedia.',
                ],
            };
        case 'platform_staff':
            return {
                label: 'Platform Staff',
                description: 'Tim internal Corextor untuk operasional platform.',
                abilities: [
                    'Mengelola company dan langganan produk.',
                    'Memantau data operasional perusahaan.',
                    'Mendampingi onboarding dan konfigurasi awal.',
                ],
            };
        case 'platform_finance':
            return {
                label: 'Platform Finance',
                description: 'Tim internal untuk invoice dan pembayaran platform.',
                abilities: [
                    'Melihat invoice dan status pembayaran.',
                    'Memproses penagihan dan rekonsiliasi pembayaran.',
                    'Memantau kondisi billing per perusahaan.',
                ],
            };
        default:
            return {
                label: 'Karyawan',
                description: 'Akses employee untuk absensi dan aktivitas harian.',
                abilities: [
                    'Melakukan check-in dan check-out sesuai aturan branch.',
                    'Melihat riwayat kehadiran pribadi.',
                    'Mengelola profil akun dan PIN absensi milik sendiri.',
                ],
            };
    }
}

function getAttendanceStatusLabel(status?: string | null): string {
    switch (status) {
        case 'active':
            return 'Aktif';
        case 'suspended':
            return 'Ditangguhkan';
        case 'deactivated':
            return 'Nonaktif';
        default:
            return 'Belum tersedia';
    }
}

function formatProductLabel(product: string): string {
    return product
        .replace(/_/g, ' ')
        .replace(/\b\w/g, letter => letter.toUpperCase());
}

function getBrowserLabel(): string {
    if (typeof navigator === 'undefined') {
        return 'Web Browser';
    }

    const ua = navigator.userAgent;

    if (/Edg/i.test(ua)) return 'Microsoft Edge';
    if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) return 'Google Chrome';
    if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
    if (/Firefox/i.test(ua)) return 'Mozilla Firefox';

    return 'Web Browser';
}

function extractApiMessage(error: any, fallback: string): string {
    return error?.response?.data?.message
        || error?.message
        || fallback;
}
