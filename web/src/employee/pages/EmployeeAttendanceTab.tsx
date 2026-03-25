import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
    CircleUserRound,
    Camera,
    CameraOff,
    CheckCircle2,
    Clock3,
    Compass,
    Fingerprint,
    MapPinned,
    Loader2,
    LogIn,
    LogOut,
    MapPin,
    RefreshCw,
    ScanFace,
    X,
} from 'lucide-react';
import { attendanceApi } from '@/api/platform.api';
import { calculateDistanceMeters, formatDistanceMeters } from '@/employee/lib/attendance';
import { useAuthStore } from '@/store/authStore';
import type { Theme } from '@/theme/tokens';
import type { AttendanceContextPayload, AttendanceMode } from '@/types/attendance.types';

interface Props {
    T: Theme;
    isDesktop: boolean;
}

const MOBILE_SHEET_OFFSET = 'calc(96px + env(safe-area-inset-bottom, 0px))';
const MOBILE_SHEET_TOP_GAP = '132px';

type DeviceLocation = {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    timestamp: number;
};

type BannerState = {
    tone: 'success' | 'error' | 'info';
    message: string;
} | null;

export function EmployeeAttendanceTab({ T, isDesktop }: Props) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const user = useAuthStore(state => state.user);

    const [context, setContext] = useState<AttendanceContextPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [banner, setBanner] = useState<BannerState>(null);
    const [cameraModalOpen, setCameraModalOpen] = useState(false);
    const [cameraError, setCameraError] = useState('');
    const [cameraReady, setCameraReady] = useState(false);
    const [selfieDataUrl, setSelfieDataUrl] = useState('');
    const [now, setNow] = useState(new Date());
    const [selectedCheckInMode, setSelectedCheckInMode] = useState<AttendanceMode>('office');
    const [locationState, setLocationState] = useState<{
        status: 'idle' | 'loading' | 'ready' | 'error';
        position: DeviceLocation | null;
        message: string;
    }>({
        status: 'idle',
        position: null,
        message: '',
    });

    useEffect(() => {
        const baseTime = context?.server_time ? new Date(context.server_time) : new Date();
        const startedAt = Date.now();

        setNow(baseTime);

        const timer = window.setInterval(() => {
            setNow(new Date(baseTime.getTime() + (Date.now() - startedAt)));
        }, 1000);

        return () => window.clearInterval(timer);
    }, [context?.server_time]);

    const fetchContext = useCallback(async () => {
        setLoading(true);

        try {
            const response = await attendanceApi.getContext();
            setContext(response.data.data);
        } catch (error: any) {
            setBanner({
                tone: 'error',
                message: error?.response?.data?.message || 'Gagal memuat kehadiran.',
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchContext();
    }, [fetchContext]);

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        setCameraReady(false);

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    useEffect(() => () => stopCamera(), [stopCamera]);

    const resetCameraModal = useCallback(() => {
        stopCamera();
        setCameraError('');
        setSelfieDataUrl('');
        setCameraModalOpen(false);
    }, [stopCamera]);

    const refreshLocation = useCallback(async () => {
        if (!navigator.geolocation) {
            setLocationState({
                status: 'error',
                position: null,
                message: 'Browser ini belum mendukung geolokasi.',
            });
            return;
        }

        setLocationState(current => ({
            ...current,
            status: 'loading',
            message: '',
        }));

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 12000,
                    maximumAge: 30000,
                });
            });

            setLocationState({
                status: 'ready',
                position: {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy ?? null,
                    timestamp: position.timestamp,
                },
                message: '',
            });
        } catch (error: any) {
            const message = error?.code === 1
                ? 'Akses lokasi ditolak. Aktifkan GPS untuk melanjutkan.'
                : 'Lokasi tidak berhasil didapatkan. Coba lagi.';

            setLocationState({
                status: 'error',
                position: null,
                message,
            });
        }
    }, []);

    useEffect(() => {
        if (context && locationState.status === 'idle') {
            void refreshLocation();
        }
    }, [context, locationState.status, refreshLocation]);

    useEffect(() => {
        if (context?.today_record?.attendance_mode_in) {
            setSelectedCheckInMode(context.today_record.attendance_mode_in);
        }
    }, [context?.today_record?.attendance_mode_in]);

    const startCamera = useCallback(async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            setCameraError('Browser ini belum mendukung akses kamera.');
            return;
        }

        setCameraError('');

        try {
            stopCamera();

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 720 },
                    height: { ideal: 1280 },
                },
                audio: false,
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            setCameraReady(true);
        } catch {
            setCameraError('Kamera tidak bisa diakses. Pastikan izin kamera diberikan.');
        }
    }, [stopCamera]);

    useEffect(() => {
        if (!cameraModalOpen) return;
        if (selfieDataUrl || cameraReady) return;
        void startCamera();
    }, [cameraModalOpen, cameraReady, selfieDataUrl, startCamera]);

    const captureSelfie = useCallback(() => {
        if (!videoRef.current) return;

        const width = videoRef.current.videoWidth || 720;
        const height = videoRef.current.videoHeight || 960;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const context2d = canvas.getContext('2d');
        if (!context2d) return;

        context2d.drawImage(videoRef.current, 0, 0, width, height);
        setSelfieDataUrl(canvas.toDataURL('image/jpeg', 0.92));
        stopCamera();
    }, [stopCamera]);

    const attendanceMode = useMemo(() => {
        if (!context?.today_record?.time_in) return 'check_in';
        if (!context.today_record.time_out) return 'check_out';
        return 'complete';
    }, [context]);

    const branch = context?.branch;
    const radiusMeters = context?.rules.radius_meters ?? branch?.radius_meters ?? 100;
    const hasCoordinates = Boolean(
        branch?.latitude != null
        && branch?.longitude != null,
    );

    const distanceMeters = useMemo(() => {
        if (!hasCoordinates || !locationState.position || branch?.latitude == null || branch.longitude == null) {
            return null;
        }

        return calculateDistanceMeters(
            branch.latitude,
            branch.longitude,
            locationState.position.latitude,
            locationState.position.longitude,
        );
    }, [branch, hasCoordinates, locationState.position]);

    const withinRadius = useMemo(() => {
        if (!context?.rules.requires_location_validation) return true;
        if (distanceMeters == null) return false;
        return distanceMeters <= radiusMeters;
    }, [context?.rules.requires_location_validation, distanceMeters, radiusMeters]);

    const requiresOfficeValidation = attendanceMode === 'check_in'
        && selectedCheckInMode === 'office'
        && Boolean(context?.rules.requires_location_validation);

    const hardBlockers = useMemo(() => {
        const nextBlockers: string[] = [];

        if (context?.attendance_user.status !== 'active') {
            nextBlockers.push('Profil attendance belum aktif.');
        }

        if (!locationState.position) {
            nextBlockers.push('Lokasi perangkat belum tersedia.');
        } else if (requiresOfficeValidation && !withinRadius) {
            nextBlockers.push(`Anda berada ${formatDistanceMeters(distanceMeters)} dari titik kantor.`);
        }

        return nextBlockers;
    }, [
        context?.attendance_user.status,
        distanceMeters,
        locationState.position,
        requiresOfficeValidation,
        withinRadius,
    ]);

    const locationReady = Boolean(
        locationState.position
        && (!requiresOfficeValidation || withinRadius),
    );
    const locationLabel = locationState.status === 'loading'
        ? 'Mencari lokasi'
        : !locationState.position
            ? 'Lokasi belum siap'
            : requiresOfficeValidation
                ? withinRadius
                    ? 'Dalam radius kantor'
                    : 'Di luar radius kantor'
                : attendanceMode === 'check_out'
                    ? 'Lokasi checkout siap'
                    : selectedCheckInMode === 'field'
                        ? 'Lokasi tugas luar siap'
                        : 'Lokasi siap';

    const selectedModeLabel = selectedCheckInMode === 'office' ? 'Di Kantor' : 'Tugas Luar';
    const storedModeLabel = context?.today_record?.attendance_mode_in === 'field' ? 'Tugas Luar' : 'Di Kantor';
    const modeHint = attendanceMode === 'check_out'
        ? 'Checkout menyimpan lokasi aktual saat ini.'
        : selectedCheckInMode === 'office'
            ? context?.rules.requires_location_validation
                ? 'Check-in kantor divalidasi dengan radius kantor.'
                : 'Check-in kantor menyimpan lokasi aktual Anda.'
            : 'Mode lapangan menyimpan lokasi aktual tanpa radius kantor.';
    const currentLocationLabel = locationState.position
        ? formatCoordinates(locationState.position.latitude, locationState.position.longitude)
        : 'GPS belum mengirim koordinat.';
    const currentLocationUpdatedAt = locationState.position
        ? new Date(locationState.position.timestamp).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        })
        : null;
    const mapEmbedUrl = locationState.position
        ? buildMapEmbedUrl(locationState.position.latitude, locationState.position.longitude)
        : hasCoordinates && branch?.latitude != null && branch.longitude != null
            ? buildMapEmbedUrl(branch.latitude, branch.longitude)
            : '';
    const employeeName = user?.name || 'Karyawan';
    const employeeInitials = employeeName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0])
        .join('')
        .toUpperCase();
    const officeLocationLabel = branch?.location || branch?.name || 'Lokasi kantor belum diatur';

    const heroStatus = attendanceMode === 'complete'
        ? { label: 'Complete', background: 'rgba(214,255,192,.92)', color: '#4B6B0B' }
        : attendanceMode === 'check_out'
            ? { label: 'Working', background: 'rgba(211,236,255,.94)', color: '#0E5B98' }
            : { label: 'Ready', background: 'rgba(255,236,207,.94)', color: '#9A5B00' };

    const checkInValue = context?.today_record?.time_in ? formatAttendanceTime(context.today_record.time_in) : 'Belum ada';
    const checkOutValue = context?.today_record?.time_out
        ? formatAttendanceTime(context.today_record.time_out)
        : attendanceMode === 'check_out'
            ? 'Belum pulang'
            : 'Menunggu';
    const durationValue = getWorkDuration(
        context?.today_record?.date,
        context?.today_record?.time_in,
        context?.today_record?.time_out,
        now,
    );
    const syncLabel = `${formatClock(now)} WIB`;
    const actionLabel = attendanceMode === 'check_in'
        ? 'Check-in'
        : attendanceMode === 'check_out'
            ? 'Check-out'
            : 'Selesai';
    const primaryButtonLabel = attendanceMode === 'check_in'
        ? 'Check-in Sekarang'
            : attendanceMode === 'check_out'
                ? 'Check-out Sekarang'
                : 'Absensi Hari Ini Selesai';
    const cameraSheetHeight = isDesktop
        ? 'min(82vh, 760px)'
        : `calc(100vh - ${MOBILE_SHEET_TOP_GAP} - ${MOBILE_SHEET_OFFSET})`;

    const submitAttendance = useCallback(async () => {
        if (!context || attendanceMode === 'complete' || hardBlockers.length > 0) {
            return;
        }

        if (context.rules.requires_selfie_capture && !selfieDataUrl) {
            setCameraError('Ambil selfie terlebih dahulu.');
            return;
        }

        if (!locationState.position) {
            setCameraError('Lokasi belum tersedia. Refresh GPS terlebih dahulu.');
            return;
        }

        setSubmitting(true);
        setBanner(null);

        try {
            const selfieFile = selfieDataUrl
                ? dataUrlToFile(selfieDataUrl, `${attendanceMode}-${Date.now()}.jpg`)
                : undefined;
            const payload = {
                latitude: locationState.position.latitude,
                longitude: locationState.position.longitude,
                accuracy: locationState.position.accuracy ?? undefined,
                selfie: selfieFile,
                attendance_mode: attendanceMode === 'check_in' ? selectedCheckInMode : undefined,
            };

            if (attendanceMode === 'check_in') {
                await attendanceApi.checkIn(payload);
            } else {
                await attendanceApi.checkOut(payload);
            }

            setBanner({
                tone: 'success',
                message: attendanceMode === 'check_in'
                    ? 'Check-in berhasil direkam.'
                    : 'Check-out berhasil direkam.',
            });
            resetCameraModal();
            await fetchContext();
        } catch (error: any) {
            setBanner({
                tone: 'error',
                message: error?.response?.data?.message || 'Aksi absensi gagal diproses.',
            });
        } finally {
            setSubmitting(false);
        }
    }, [
        attendanceMode,
        context,
        fetchContext,
        hardBlockers.length,
        locationState.position,
        resetCameraModal,
        selectedCheckInMode,
        selfieDataUrl,
    ]);

    const handlePrimaryAction = useCallback(() => {
        if (attendanceMode === 'complete' || submitting || hardBlockers.length > 0) {
            return;
        }

        if (context?.rules.requires_selfie_capture) {
            setBanner(null);
            setCameraError('');
            setSelfieDataUrl('');
            setCameraModalOpen(true);
            return;
        }

        void submitAttendance();
    }, [attendanceMode, context?.rules.requires_selfie_capture, hardBlockers.length, submitAttendance, submitting]);

    if (loading) {
        return (
            <div style={{
                minHeight: '60vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 14,
            }}>
                <Loader2 size={28} color={T.primary} style={{ animation: 'spin 1s linear infinite' }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: T.textMuted }}>
                    Memuat kehadiran...
                </div>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                height: isDesktop ? 'auto' : 'calc(100vh - 186px - env(safe-area-inset-bottom))',
                minHeight: isDesktop ? 'auto' : 'calc(100vh - 186px - env(safe-area-inset-bottom))',
            }}>
                <section style={{
                    position: 'relative',
                    overflow: 'hidden',
                    margin: isDesktop ? '0' : '-12px -14px 0',
                    borderRadius: isDesktop ? '28px 28px 36px 36px' : '0 0 34px 34px',
                    padding: isDesktop ? '16px 16px 14px' : '14px 14px 12px',
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
                            gap: 10,
                            marginBottom: 12,
                        }}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                }}>
                                    <div style={{
                                        width: isDesktop ? 42 : 38,
                                        height: isDesktop ? 42 : 38,
                                        borderRadius: 16,
                                        border: '1px solid rgba(255,255,255,.18)',
                                        background: 'linear-gradient(145deg, rgba(255,255,255,.18), rgba(255,255,255,.06))',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 10px 24px rgba(8,49,87,.18)',
                                        overflow: 'hidden',
                                        flexShrink: 0,
                                    }}>
                                        {employeeInitials ? (
                                            <span style={{
                                                fontSize: isDesktop ? 13 : 12,
                                                fontWeight: 900,
                                                fontFamily: "'Sora', sans-serif",
                                                color: '#fff',
                                            }}>
                                                {employeeInitials}
                                            </span>
                                        ) : (
                                            <CircleUserRound size={18} />
                                        )}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{
                                            fontSize: isDesktop ? 16 : 14,
                                            lineHeight: 1.15,
                                            fontWeight: 900,
                                            fontFamily: "'Sora', sans-serif",
                                            letterSpacing: -.3,
                                            color: '#fff',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}>
                                            {employeeName}
                                        </div>
                                        <div style={{
                                            marginTop: 4,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            fontSize: 9.75,
                                            color: 'rgba(255,255,255,.8)',
                                            fontWeight: 700,
                                            flexWrap: 'wrap',
                                            minWidth: 0,
                                        }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                <Clock3 size={11} />
                                                {syncLabel}
                                            </span>
                                            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,.42)' }} />
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                minWidth: 0,
                                            }}>
                                                <MapPinned size={11} />
                                                <span style={{
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}>
                                                    {officeLocationLabel}
                                                </span>
                                            </span>
                                            {attendanceMode !== 'check_in' && (
                                                <>
                                                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,.42)' }} />
                                                    <span>{storedModeLabel}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: isDesktop ? '4px 8px' : '3px 7px',
                                borderRadius: 999,
                                background: heroStatus.background,
                                color: heroStatus.color,
                                fontSize: isDesktop ? 10 : 9.5,
                                fontWeight: 800,
                                flexShrink: 0,
                            }}>
                                <span style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    background: heroStatus.color,
                                }} />
                                {heroStatus.label}
                            </div>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                            gap: 6,
                        }}>
                            {[
                                { label: 'Masuk', value: checkInValue, icon: LogIn },
                                { label: 'Pulang', value: checkOutValue, icon: LogOut },
                                { label: 'Durasi', value: durationValue, icon: Clock3 },
                            ].map(item => (
                                <div key={item.label} style={{
                                    borderRadius: 14,
                                    padding: isDesktop ? '9px 9px 8px' : '8px 8px 7px',
                                    background: 'rgba(255,255,255,.12)',
                                    border: '1px solid rgba(255,255,255,.12)',
                                    backdropFilter: 'blur(18px)',
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 5,
                                        fontSize: 8.5,
                                        color: 'rgba(255,255,255,.72)',
                                        fontWeight: 700,
                                    }}>
                                        <item.icon size={11} />
                                        {item.label}
                                    </div>
                                    <div style={{
                                        marginTop: 5,
                                        fontSize: isDesktop ? 14 : 11.5,
                                        fontWeight: 900,
                                        fontFamily: "'Sora', sans-serif",
                                        lineHeight: 1.1,
                                    }}>
                                        {item.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {banner && (
                    <div style={{
                        borderRadius: 18,
                        padding: '12px 14px',
                        border: `1px solid ${banner.tone === 'success' ? `${T.success}30` : banner.tone === 'error' ? `${T.danger}30` : `${T.info}30`}`,
                        background: banner.tone === 'success'
                            ? `${T.success}12`
                            : banner.tone === 'error'
                                ? `${T.danger}10`
                                : `${T.info}10`,
                        color: banner.tone === 'success' ? T.success : banner.tone === 'error' ? T.danger : T.info,
                        fontSize: 12,
                        fontWeight: 700,
                    }}>
                        {banner.message}
                    </div>
                )}

                {attendanceMode === 'check_in' && (
                    <section style={{
                        borderRadius: 16,
                        padding: '7px',
                        background: T.card,
                        border: `1px solid ${T.border}`,
                        boxShadow: T.shadowSm,
                    }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                            gap: 6,
                        }}>
                            {context?.rules.available_check_in_modes.map(mode => {
                                const active = selectedCheckInMode === mode;
                                const label = mode === 'office' ? 'Kantor' : 'Lapangan';

                                return (
                                    <button
                                        key={mode}
                                        onClick={() => setSelectedCheckInMode(mode)}
                                        style={modePillStyle(T, active)}
                                    >
                                        <span>{label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                )}

                <div style={{
                    display: 'grid',
                    gap: 8,
                    flex: 1,
                    minHeight: 0,
                    marginTop: 'auto',
                }}>
                    <div style={{
                        position: 'relative',
                        borderRadius: isDesktop ? 20 : 24,
                        margin: isDesktop ? '0' : '0 -10px',
                        padding: 0,
                        background: isDarkTheme(T)
                            ? 'linear-gradient(160deg, rgba(15,23,42,.98), rgba(30,64,175,.22))'
                            : 'linear-gradient(160deg, #F7FBFF, #EEF6FF)',
                        border: `1px solid ${T.border}`,
                        boxShadow: T.shadowSm,
                        display: 'grid',
                        gap: 8,
                        flex: 1,
                        minHeight: 0,
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            position: 'relative',
                            overflow: 'hidden',
                            borderRadius: isDesktop ? 18 : 24,
                            minHeight: isDesktop ? 250 : 0,
                            height: isDesktop ? 250 : '100%',
                            border: 'none',
                            background: isDarkTheme(T)
                                ? 'linear-gradient(160deg, rgba(15,23,42,.98), rgba(37,99,235,.24))'
                                : 'linear-gradient(160deg, #EAF5FF, #F8FBFF)',
                        }}>
                            {mapEmbedUrl ? (
                                <iframe
                                    title="Attendance map preview"
                                    src={mapEmbedUrl}
                                    loading="lazy"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        minHeight: isDesktop ? 250 : '100%',
                                        border: 'none',
                                        filter: isDarkTheme(T) ? 'saturate(.88) contrast(1.02)' : 'saturate(1.02)',
                                    }}
                                />
                            ) : (
                                <div style={{
                                    minHeight: isDesktop ? 250 : '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'column',
                                    gap: 10,
                                    color: T.textMuted,
                                }}>
                                    <div style={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: 18,
                                        border: `1px solid ${T.border}`,
                                        background: `${T.primary}10`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <MapPin size={22} color={T.primary} />
                                    </div>
                                    <div style={{ fontSize: 11.5, fontWeight: 700 }}>
                                        Menunggu lokasi aktif
                                    </div>
                                </div>
                            )}

                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(180deg, rgba(15,23,42,.08) 0%, rgba(15,23,42,0) 26%, rgba(15,23,42,.14) 100%)',
                                pointerEvents: 'none',
                            }} />

                            <div style={{
                                position: 'absolute',
                                top: 10,
                                left: 10,
                                display: 'flex',
                                gap: 6,
                                flexWrap: 'wrap',
                            }}>
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    padding: '5px 9px',
                                    borderRadius: 999,
                                    background: 'rgba(255,255,255,.92)',
                                    color: locationReady ? T.success : T.gold,
                                    fontSize: 9.5,
                                    fontWeight: 800,
                                    boxShadow: '0 8px 20px rgba(15,23,42,.14)',
                                }}>
                                    <Compass size={11} />
                                    {locationLabel}
                                </div>
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    padding: '5px 9px',
                                    borderRadius: 999,
                                    background: 'rgba(255,255,255,.88)',
                                    color: T.primary,
                                    fontSize: 9.5,
                                    fontWeight: 800,
                                    boxShadow: '0 8px 20px rgba(15,23,42,.12)',
                                }}>
                                    <Fingerprint size={11} />
                                    {attendanceMode === 'check_in'
                                        ? (selectedCheckInMode === 'office' ? 'Kantor' : 'Lapangan')
                                        : storedModeLabel}
                                </div>
                            </div>

                            <div style={{
                                position: 'absolute',
                                top: 10,
                                right: 10,
                            }}>
                                <button
                                    onClick={() => void refreshLocation()}
                                    disabled={locationState.status === 'loading'}
                                    style={mapGhostButtonStyle(T)}
                                >
                                    {locationState.status === 'loading'
                                        ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                        : <RefreshCw size={14} />}
                                    GPS
                                </button>
                            </div>

                            <div style={{
                                position: 'absolute',
                                left: 10,
                                right: 10,
                                bottom: 76,
                                display: 'grid',
                                gap: 6,
                                padding: '10px 11px',
                                borderRadius: 16,
                                background: 'rgba(255,255,255,.94)',
                                backdropFilter: 'blur(12px)',
                                boxShadow: '0 14px 28px rgba(15,23,42,.12)',
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 10,
                                }}>
                                    <div style={{
                                        minWidth: 0,
                                        fontSize: 11.5,
                                        fontWeight: 900,
                                        color: T.text,
                                        fontFamily: "'Sora', sans-serif",
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}>
                                        {currentLocationLabel}
                                    </div>
                                    {locationState.position?.accuracy ? (
                                        <div style={{
                                            flexShrink: 0,
                                            fontSize: 9.5,
                                            fontWeight: 800,
                                            color: T.textMuted,
                                        }}>
                                            {Math.round(locationState.position.accuracy)} m
                                        </div>
                                    ) : null}
                                </div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 10,
                                    fontSize: 9.75,
                                    color: T.textMuted,
                                }}>
                                    <span style={{
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}>
                                        {distanceMeters == null
                                            ? modeHint
                                            : `${attendanceMode === 'check_out' ? 'Jarak pulang' : 'Jarak'} ${formatDistanceMeters(distanceMeters)}`}
                                    </span>
                                    {currentLocationUpdatedAt && (
                                        <span style={{ flexShrink: 0 }}>
                                            {currentLocationUpdatedAt} WIB
                                        </span>
                                    )}
                                </div>
                            </div>
                            {(locationState.message || hardBlockers[0]) && (
                                <div style={{
                                    position: 'absolute',
                                    left: 10,
                                    right: 10,
                                    bottom: 138,
                                    borderRadius: 14,
                                    padding: '9px 10px',
                                    background: 'rgba(255,248,235,.94)',
                                    border: `1px solid ${T.gold}22`,
                                    color: T.gold,
                                    fontSize: 10.25,
                                    fontWeight: 700,
                                    lineHeight: 1.45,
                                    backdropFilter: 'blur(12px)',
                                    boxShadow: '0 10px 24px rgba(15,23,42,.12)',
                                }}>
                                    {locationState.message || hardBlockers[0]}
                                </div>
                            )}

                            <button
                                onClick={handlePrimaryAction}
                                disabled={attendanceMode === 'complete' || hardBlockers.length > 0 || submitting}
                                style={{
                                    position: 'absolute',
                                    left: 12,
                                    right: 12,
                                    bottom: 12,
                                    height: 52,
                                    borderRadius: 18,
                                    border: 'none',
                                    background: attendanceMode === 'complete'
                                        ? `${T.success}18`
                                        : attendanceMode === 'check_in'
                                            ? 'linear-gradient(135deg, #16A34A, #22C55E)'
                                            : 'linear-gradient(135deg, #2563EB, #0EA5E9)',
                                    color: attendanceMode === 'complete' ? T.success : '#fff',
                                    fontSize: 13,
                                    fontWeight: 900,
                                    boxShadow: attendanceMode === 'complete'
                                        ? 'none'
                                        : attendanceMode === 'check_in'
                                            ? '0 18px 34px rgba(22,163,74,.24)'
                                            : '0 18px 34px rgba(37,99,235,.22)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    opacity: attendanceMode === 'complete' || hardBlockers.length > 0 || submitting ? .72 : 1,
                                }}
                            >
                                {submitting
                                    ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                    : attendanceMode === 'complete'
                                        ? <CheckCircle2 size={16} />
                                        : attendanceMode === 'check_in'
                                            ? <Fingerprint size={16} />
                                            : <Clock3 size={16} />}
                                {primaryButtonLabel}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {cameraModalOpen && (
                <>
                    <div
                        onClick={resetCameraModal}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(2,6,23,.72)',
                            backdropFilter: 'blur(8px)',
                            zIndex: 10000,
                        }}
                    />
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 10001,
                        display: 'flex',
                        alignItems: isDesktop ? 'center' : 'flex-end',
                        justifyContent: 'center',
                        padding: isDesktop ? 12 : `0 12px ${MOBILE_SHEET_OFFSET}`,
                        pointerEvents: 'none',
                    }}>
                        <div style={{
                            width: isDesktop ? 'min(420px, calc(100vw - 24px))' : 'min(420px, 100%)',
                            borderTopLeftRadius: 28,
                            borderTopRightRadius: 28,
                            borderBottomLeftRadius: 26,
                            borderBottomRightRadius: 26,
                            background: isDarkTheme(T)
                                ? 'linear-gradient(180deg, rgba(11,15,26,.98) 0%, rgba(15,23,42,.96) 100%)'
                                : 'linear-gradient(180deg, rgba(255,255,255,.98) 0%, rgba(246,250,255,.98) 100%)',
                            border: `1px solid ${isDarkTheme(T) ? 'rgba(255,255,255,.1)' : T.border}`,
                            padding: isDesktop ? 18 : 14,
                            boxShadow: isDarkTheme(T)
                                ? '0 28px 64px rgba(2,6,23,.52), inset 0 1px 0 rgba(255,255,255,.06)'
                                : '0 26px 60px rgba(15,23,42,.18), inset 0 1px 0 rgba(255,255,255,.55)',
                            height: cameraSheetHeight,
                            maxHeight: cameraSheetHeight,
                            overflow: 'hidden',
                            pointerEvents: 'auto',
                            animation: isDesktop
                                ? 'fadeUp .18s ease'
                                : 'sheetRise .24s cubic-bezier(.22,.8,.2,1)',
                            display: 'grid',
                            gridTemplateRows: 'auto 1fr auto auto',
                            gap: 10,
                            position: 'relative',
                        }}>
                            <button
                                onClick={resetCameraModal}
                                style={{
                                    position: 'absolute',
                                    top: isDesktop ? 14 : 10,
                                    right: isDesktop ? 14 : 10,
                                    zIndex: 3,
                                    width: 36,
                                    height: 36,
                                    borderRadius: 14,
                                    border: `1px solid ${T.border}`,
                                    background: isDarkTheme(T) ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.76)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: T.text,
                                    boxShadow: isDarkTheme(T)
                                        ? '0 10px 22px rgba(2,6,23,.26), inset 0 1px 0 rgba(255,255,255,.04)'
                                        : '0 10px 18px rgba(15,23,42,.08)',
                                }}
                            >
                                <X size={16} />
                            </button>
                            {!isDesktop && (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    paddingTop: 2,
                                    paddingBottom: 4,
                                }}>
                                    <div style={{
                                        width: 44,
                                        height: 5,
                                        borderRadius: 999,
                                        background: `${T.textMuted}44`,
                                    }} />
                                </div>
                            )}

                        <div style={{
                            position: 'relative',
                            borderRadius: 24,
                            overflow: 'hidden',
                            minHeight: 0,
                            height: '100%',
                            border: `1px solid ${T.border}`,
                            background: isDarkTheme(T)
                                ? 'linear-gradient(160deg, rgba(15,23,42,.98), rgba(59,130,246,.18))'
                                : 'linear-gradient(160deg, #F8FBFF, #EDF6FF)',
                            boxShadow: isDarkTheme(T)
                                ? 'inset 0 1px 0 rgba(255,255,255,.04)'
                                : 'inset 0 1px 0 rgba(255,255,255,.7)',
                        }}>
                            {selfieDataUrl ? (
                                <img
                                    src={selfieDataUrl}
                                    alt="Selfie verification"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <>
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        muted
                                        playsInline
                                        style={{
                                            display: cameraReady ? 'block' : 'none',
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            transform: 'scaleX(-1)',
                                        }}
                                    />
                                    {!cameraReady && (
                                        <div style={{
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 12,
                                            padding: 24,
                                            textAlign: 'center',
                                        }}>
                                            <div style={{
                                                width: 70,
                                                height: 70,
                                                borderRadius: 22,
                                                background: `${T.primary}12`,
                                                border: `1px solid ${T.primary}24`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: isDarkTheme(T)
                                                    ? '0 18px 40px rgba(59,130,246,.16)'
                                                    : '0 18px 40px rgba(37,99,235,.14)',
                                            }}>
                                                <Camera size={28} color={T.primary} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>
                                                    Menyalakan kamera
                                                </div>
                                                <div style={{ marginTop: 6, fontSize: 11.5, color: T.textMuted, lineHeight: 1.6 }}>
                                                    Pastikan wajah terlihat jelas sebelum lanjut.
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            <div style={{
                                position: 'absolute',
                                top: 14,
                                left: 14,
                                right: 14,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 6,
                                textAlign: 'center',
                                pointerEvents: 'none',
                            }}>
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                    width: 'fit-content',
                                    padding: '7px 11px',
                                    borderRadius: 999,
                                    background: 'rgba(255,255,255,.9)',
                                    color: T.primary,
                                    fontSize: 10,
                                    fontWeight: 800,
                                    boxShadow: '0 10px 22px rgba(15,23,42,.12)',
                                }}>
                                    <Fingerprint size={12} />
                                    {selfieDataUrl ? 'Selfie siap digunakan' : cameraReady ? 'Kamera aktif' : 'Siapkan selfie'}
                                </div>
                                <div style={{
                                    padding: '10px 12px',
                                    borderRadius: 18,
                                    background: 'rgba(15,23,42,.24)',
                                    backdropFilter: 'blur(12px)',
                                    color: '#fff',
                                    maxWidth: '90%',
                                }}>
                                    <div style={{
                                        fontSize: 14,
                                        fontWeight: 900,
                                        fontFamily: "'Sora', sans-serif",
                                        lineHeight: 1.1,
                                    }}>
                                        Selfie Verifikasi
                                    </div>
                                    <div style={{
                                        marginTop: 4,
                                        fontSize: 10.25,
                                        lineHeight: 1.45,
                                        color: 'rgba(255,255,255,.86)',
                                    }}>
                                        {attendanceMode === 'check_in'
                                            ? `${selectedModeLabel} akan direkam bersama selfie dan lokasi saat ini.`
                                            : 'Checkout akan menyimpan selfie dan lokasi aktual Anda saat ini.'}
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                position: 'absolute',
                                inset: 18,
                                borderRadius: 24,
                                border: `1px dashed ${selfieDataUrl ? 'rgba(255,255,255,.42)' : `${T.primary}28`}`,
                                pointerEvents: 'none',
                            }} />
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(180deg, rgba(15,23,42,.08) 0%, rgba(15,23,42,0) 32%, rgba(15,23,42,.18) 100%)',
                                pointerEvents: 'none',
                            }} />
                        </div>

                        {cameraError && (
                            <div style={{
                                borderRadius: 14,
                                padding: '10px 12px',
                                background: isDarkTheme(T) ? 'rgba(239,68,68,.12)' : `${T.danger}10`,
                                border: `1px solid ${T.danger}20`,
                                color: T.danger,
                                fontSize: 10.75,
                                fontWeight: 700,
                                textAlign: 'center',
                            }}>
                                {cameraError}
                            </div>
                        )}

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                            gap: 8,
                            paddingTop: 2,
                        }}>
                            {!cameraReady && !selfieDataUrl && (
                                <button onClick={() => void startCamera()} style={modalButtonStyle(T, false)}>
                                    <Camera size={15} />
                                    Buka Kamera
                                </button>
                            )}

                            {cameraReady && (
                                <>
                                    <button onClick={captureSelfie} style={modalButtonStyle(T, true)}>
                                        <ScanFace size={15} />
                                        Ambil Selfie
                                    </button>
                                    <button onClick={stopCamera} style={modalButtonStyle(T, false)}>
                                        <CameraOff size={15} />
                                        Batalkan
                                    </button>
                                </>
                            )}

                            {selfieDataUrl && (
                                <>
                                    <button
                                        onClick={() => {
                                            setSelfieDataUrl('');
                                            void startCamera();
                                        }}
                                        style={modalButtonStyle(T, false)}
                                    >
                                        <RefreshCw size={15} />
                                        Ulangi
                                    </button>
                                    <button
                                        onClick={() => void submitAttendance()}
                                        disabled={submitting}
                                        style={modalButtonStyle(T, true)}
                                    >
                                        {submitting ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={15} />}
                                        Gunakan & {actionLabel}
                                    </button>
                                </>
                            )}
                        </div>
                        </div>
                    </div>
                </>
            )}

            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @keyframes sheetRise {
                    from { opacity: 0; transform: translateY(28px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </>
    );
}

function mapGhostButtonStyle(T: Theme): CSSProperties {
    return {
        height: 32,
        padding: '0 10px',
        borderRadius: 11,
        border: '1px solid rgba(255,255,255,.66)',
        background: 'rgba(255,255,255,.9)',
        color: T.text,
        fontSize: 10.5,
        fontWeight: 800,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        flexShrink: 0,
    };
}

function modePillStyle(T: Theme, active: boolean): CSSProperties {
    return {
        minHeight: 42,
        borderRadius: 13,
        border: `1px solid ${active ? `${T.primary}32` : 'transparent'}`,
        background: active
            ? `linear-gradient(135deg, ${T.primary}16, ${T.info}10)`
            : 'transparent',
        color: active ? T.primary : T.text,
        fontSize: 10.5,
        fontWeight: 800,
        padding: '7px 10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        textAlign: 'center',
        boxShadow: active ? `0 8px 16px ${T.primaryGlow}` : 'none',
    };
}

function modalButtonStyle(T: Theme, primary = false): CSSProperties {
    return {
        minHeight: 46,
        borderRadius: 16,
        border: primary ? 'none' : `1px solid ${T.border}`,
        background: primary
            ? `linear-gradient(135deg, ${T.primary}, ${T.info})`
            : T.bgAlt,
        color: primary ? '#fff' : T.text,
        fontSize: 12,
        fontWeight: 800,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        boxShadow: primary ? `0 14px 28px ${T.primaryGlow}` : 'none',
    };
}


function formatClock(value: Date): string {
    return value.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

function formatAttendanceTime(time?: string | null): string {
    if (!time) return '—';
    return `${time.slice(0, 5)} WIB`;
}

function formatCoordinates(latitude: number, longitude: number): string {
    return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

function buildMapEmbedUrl(latitude: number, longitude: number): string {
    const delta = 0.0045;
    const left = longitude - delta;
    const right = longitude + delta;
    const top = latitude + delta;
    const bottom = latitude - delta;

    const params = new URLSearchParams({
        bbox: `${left},${bottom},${right},${top}`,
        layer: 'mapnik',
        marker: `${latitude},${longitude}`,
    });

    return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
}

function getWorkDuration(
    date: string | undefined,
    timeIn: string | null | undefined,
    timeOut: string | null | undefined,
    now: Date,
): string {
    if (!timeIn) return 'Belum mulai';

    const recordDate = date || now.toISOString().slice(0, 10);
    const start = new Date(`${recordDate}T${timeIn}`);
    const end = timeOut ? new Date(`${recordDate}T${timeOut}`) : now;

    const diffMs = Math.max(0, end.getTime() - start.getTime());
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours <= 0) {
        return `${minutes}m`;
    }

    return `${hours}j ${minutes}m`;
}

function isDarkTheme(T: Theme): boolean {
    return T.bg.toLowerCase() === '#0b0f1a';
}

function dataUrlToFile(dataUrl: string, filename: string): File {
    const [meta, content] = dataUrl.split(',');

    if (!meta || !content) {
        throw new Error('Data selfie tidak valid.');
    }

    const mimeMatch = meta.match(/data:(.*?);base64/);
    const mime = mimeMatch?.[1] || 'image/jpeg';
    const binary = window.atob(content);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }

    return new File([bytes], filename, { type: mime });
}
