import { useEffect, useMemo, useState } from 'react';
import { Compass, Download, Share, Smartphone, X } from 'lucide-react';
import type { Theme } from '@/theme/tokens';

interface Props {
    T: Theme;
    bottomOffset?: number;
}

type DeviceType = 'ios' | 'android' | null;
type BrowserType = 'safari' | 'chrome' | 'samsung' | 'other';

type InstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const DISMISS_KEY = 'corextor_employee_pwa_dismissed_at';
const DISMISS_DURATION = 1000 * 60 * 60 * 12;

function detectDevice(): DeviceType {
    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isIOS) return 'ios';
    if (/Android/i.test(ua)) return 'android';
    return null;
}

function detectBrowser(): BrowserType {
    const ua = navigator.userAgent || '';
    if (/SamsungBrowser/i.test(ua)) return 'samsung';
    if (/CriOS|Chrome/i.test(ua) && !/Edg|OPR|SamsungBrowser/i.test(ua)) return 'chrome';
    if (/Safari/i.test(ua) && !/CriOS|Chrome|FxiOS|Edg|OPR/i.test(ua)) return 'safari';
    return 'other';
}

function isStandalone(): boolean {
    if ((window.navigator as Navigator & { standalone?: boolean }).standalone) return true;
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
    if (window.matchMedia('(display-mode: fullscreen)').matches) return true;
    return false;
}

function isDismissed(): boolean {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at)) return false;
    return Date.now() - at < DISMISS_DURATION;
}

function StepCard({
    T,
    number,
    title,
    children,
}: {
    T: Theme;
    number: number;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div
            style={{
                borderRadius: 16,
                border: `1px solid ${T.border}`,
                background: T.bgAlt,
                padding: '12px 12px 12px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
            }}
        >
            <div
                style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 900,
                }}
            >
                {number}
            </div>
            <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: T.text, marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 11, lineHeight: 1.65, color: T.textSub }}>{children}</div>
            </div>
        </div>
    );
}

export function EmployeePwaInstallPrompt({ T, bottomOffset = 102 }: Props) {
    const [visible, setVisible] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [device, setDevice] = useState<DeviceType>(null);
    const [browser, setBrowser] = useState<BrowserType>('other');
    const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
    const [installing, setInstalling] = useState(false);

    useEffect(() => {
        const isMobile = window.innerWidth < 768;
        const nextDevice = detectDevice();
        const nextBrowser = detectBrowser();
        const standalone = isStandalone();

        setDevice(nextDevice);
        setBrowser(nextBrowser);

        if (!isMobile || !nextDevice || standalone || isDismissed()) return;

        const timer = window.setTimeout(() => setVisible(true), 2200);
        return () => window.clearTimeout(timer);
    }, []);

    useEffect(() => {
        const handleBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            setInstallEvent(event as InstallPromptEvent);
            if (!isStandalone() && !isDismissed()) {
                setVisible(true);
            }
        };

        const handleInstalled = () => {
            setVisible(false);
            setExpanded(false);
            localStorage.removeItem(DISMISS_KEY);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleInstalled);
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleInstalled);
        };
    }, []);

    const summary = useMemo(() => {
        if (device === 'ios' && browser === 'safari') {
            return 'Pasang dari Safari agar absensi dan laporan lebih cepat dibuka seperti aplikasi.';
        }
        if (device === 'ios') {
            return 'Untuk iPhone, buka portal ini di Safari lalu tambahkan ke Home Screen.';
        }
        if (installEvent) {
            return 'Chrome mendukung install langsung. Pasang sekarang agar portal terasa seperti web app.';
        }
        return 'Gunakan Chrome atau Samsung Internet di Android untuk memasang portal ke layar utama.';
    }, [browser, device, installEvent]);

    const dismiss = () => {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
        setExpanded(false);
        setVisible(false);
    };

    const installNow = async () => {
        if (!installEvent) return;
        setInstalling(true);
        try {
            await installEvent.prompt();
            const choice = await installEvent.userChoice;
            if (choice.outcome === 'accepted') {
                setVisible(false);
                setExpanded(false);
                localStorage.removeItem(DISMISS_KEY);
            }
        } finally {
            setInstalling(false);
        }
    };

    if (!visible || !device || isStandalone()) return null;

    const sheetBottom = `calc(${bottomOffset}px + env(safe-area-inset-bottom))`;

    return (
        <>
            {expanded && (
                <div
                    onClick={() => setExpanded(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 38,
                        background: 'rgba(2,6,23,.48)',
                        backdropFilter: 'blur(5px)',
                    }}
                />
            )}

            {expanded ? (
                <div
                    style={{
                        position: 'fixed',
                        left: 12,
                        right: 12,
                        bottom: sheetBottom,
                        zIndex: 39,
                    }}
                >
                    <div
                        style={{
                            borderRadius: 26,
                            background: T.card,
                            border: `1px solid ${T.border}`,
                            boxShadow: T.shadow,
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                padding: '8px 18px 0',
                                display: 'flex',
                                justifyContent: 'center',
                            }}
                        >
                            <div style={{ width: 34, height: 4, borderRadius: 999, background: T.border }} />
                        </div>

                        <div style={{ padding: '14px 16px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                                <div
                                    style={{
                                        width: 46,
                                        height: 46,
                                        borderRadius: 16,
                                        flexShrink: 0,
                                        background: 'linear-gradient(135deg, #1D4ED8 0%, #0F5FA6 54%, #0A1A2D 100%)',
                                        color: '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 14px 24px rgba(37,99,235,.22)',
                                    }}
                                >
                                    <Smartphone size={20} />
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 15, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>
                                        Pasang Corextor Employee
                                    </div>
                                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3, lineHeight: 1.6 }}>
                                        Portal akan lebih cepat dibuka untuk check-in, check-out, dan laporan harian.
                                    </div>
                                </div>

                                <button
                                    onClick={() => setExpanded(false)}
                                    style={{
                                        width: 30,
                                        height: 30,
                                        borderRadius: 10,
                                        border: `1px solid ${T.border}`,
                                        background: T.bgAlt,
                                        color: T.textMuted,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            <div
                                style={{
                                    borderRadius: 16,
                                    border: `1px solid ${T.primary}28`,
                                    background: `${T.primary}10`,
                                    padding: '12px 14px',
                                    marginBottom: 14,
                                }}
                            >
                                <div style={{ fontSize: 11, fontWeight: 900, color: T.primary, marginBottom: 4 }}>
                                    Kenapa perlu dipasang?
                                </div>
                                <div style={{ fontSize: 11, color: T.textSub, lineHeight: 1.7 }}>
                                    Buka lebih cepat dari layar utama, tampilan terasa seperti aplikasi, dan lebih nyaman dipakai setiap hari oleh karyawan lapangan maupun kantor.
                                </div>
                            </div>

                            <div style={{ display: 'grid', gap: 10 }}>
                                {device === 'ios' && browser === 'safari' && (
                                    <>
                                        <StepCard T={T} number={1} title="Tap tombol Share di Safari">
                                            Ketuk ikon <Share size={12} style={{ verticalAlign: 'middle', color: T.primary }} /> Share pada toolbar Safari.
                                        </StepCard>
                                        <StepCard T={T} number={2} title='Pilih "Add to Home Screen"'>
                                            Scroll menu lalu pilih opsi <strong>Add to Home Screen</strong>.
                                        </StepCard>
                                        <StepCard T={T} number={3} title='Konfirmasi "Add"'>
                                            Setelah itu ikon Corextor akan muncul di Home Screen dan bisa dibuka seperti web app.
                                        </StepCard>
                                    </>
                                )}

                                {device === 'ios' && browser !== 'safari' && (
                                    <>
                                        <StepCard T={T} number={1} title="Buka portal ini di Safari">
                                            iPhone hanya mendukung pemasangan web app dari Safari. Salin atau buka ulang portal di Safari.
                                        </StepCard>
                                        <StepCard T={T} number={2} title="Tap Share lalu Add to Home Screen">
                                            Setelah dibuka di Safari, gunakan menu Share lalu pilih <strong>Add to Home Screen</strong>.
                                        </StepCard>
                                    </>
                                )}

                                {device === 'android' && installEvent && (
                                    <>
                                        <StepCard T={T} number={1} title="Install langsung dari Chrome">
                                            Browser ini sudah mendukung pemasangan langsung. Tekan tombol install di bawah untuk melanjutkan.
                                        </StepCard>
                                        <button
                                            onClick={installNow}
                                            disabled={installing}
                                            style={{
                                                height: 46,
                                                borderRadius: 14,
                                                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 52%, #143777 100%)',
                                                color: '#fff',
                                                fontSize: 13,
                                                fontWeight: 900,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 8,
                                                boxShadow: '0 14px 28px rgba(37,99,235,.22)',
                                            }}
                                        >
                                            <Download size={16} />
                                            {installing ? 'Memproses...' : 'Install Sekarang'}
                                        </button>
                                    </>
                                )}

                                {device === 'android' && !installEvent && (
                                    <>
                                        <StepCard T={T} number={1} title="Buka menu browser">
                                            Ketuk menu <strong>⋮</strong> di Chrome atau menu browser Android yang kamu pakai.
                                        </StepCard>
                                        <StepCard T={T} number={2} title='Pilih "Install app" atau "Add to Home screen"'>
                                            Cari menu <strong>Install app</strong> atau <strong>Add to Home screen</strong>, lalu konfirmasi.
                                        </StepCard>
                                    </>
                                )}
                            </div>

                            <div
                                style={{
                                    marginTop: 14,
                                    display: 'flex',
                                    gap: 10,
                                }}
                            >
                                {!installEvent && (
                                    <button
                                        onClick={() => setExpanded(false)}
                                        style={{
                                            flex: 1,
                                            height: 42,
                                            borderRadius: 14,
                                            border: `1px solid ${T.border}`,
                                            background: T.bgAlt,
                                            color: T.text,
                                            fontSize: 12,
                                            fontWeight: 800,
                                        }}
                                    >
                                        Tutup
                                    </button>
                                )}
                                <button
                                    onClick={dismiss}
                                    style={{
                                        flex: 1,
                                        height: 42,
                                        borderRadius: 14,
                                        border: `1px solid ${T.border}`,
                                        background: T.surface,
                                        color: T.textSub,
                                        fontSize: 12,
                                        fontWeight: 800,
                                    }}
                                >
                                    Ingatkan nanti
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    style={{
                        position: 'fixed',
                        left: 12,
                        right: 12,
                        bottom: `calc(${bottomOffset + 4}px + env(safe-area-inset-bottom))`,
                        zIndex: 37,
                    }}
                >
                    <div
                        style={{
                            borderRadius: 18,
                            border: `1px solid ${T.primary}30`,
                            background: T.card,
                            boxShadow: `0 14px 36px ${T.primary}20`,
                            padding: '10px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                        }}
                    >
                        <div
                            style={{
                                width: 38,
                                height: 38,
                                borderRadius: 13,
                                flexShrink: 0,
                                background: 'linear-gradient(135deg, #1D4ED8 0%, #0F5FA6 54%, #0A1A2D 100%)',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {device === 'ios' ? <Compass size={17} /> : <Smartphone size={17} />}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 900, color: T.text, lineHeight: 1.2 }}>
                                Pasang sebagai Web App
                            </div>
                            <div
                                style={{
                                    fontSize: 10,
                                    color: T.textMuted,
                                    marginTop: 2,
                                    lineHeight: 1.45,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {summary}
                            </div>
                        </div>

                        {installEvent ? (
                            <button
                                onClick={installNow}
                                disabled={installing}
                                style={{
                                    height: 32,
                                    padding: '0 12px',
                                    borderRadius: 10,
                                    background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`,
                                    color: '#fff',
                                    fontSize: 11,
                                    fontWeight: 900,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    flexShrink: 0,
                                }}
                            >
                                <Download size={13} />
                                {installing ? '...' : 'Install'}
                            </button>
                        ) : (
                            <button
                                onClick={() => setExpanded(true)}
                                style={{
                                    height: 32,
                                    padding: '0 12px',
                                    borderRadius: 10,
                                    background: `${T.primary}12`,
                                    border: `1px solid ${T.primary}30`,
                                    color: T.primary,
                                    fontSize: 11,
                                    fontWeight: 900,
                                    flexShrink: 0,
                                }}
                            >
                                Lihat
                            </button>
                        )}

                        <button
                            onClick={dismiss}
                            style={{
                                width: 26,
                                height: 26,
                                borderRadius: 8,
                                border: `1px solid ${T.border}`,
                                background: T.bgAlt,
                                color: T.textMuted,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <X size={12} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
