import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import {
    Camera,
    ExternalLink,
    Loader2,
    LocateFixed,
    MapPinned,
    Route,
    ShieldCheck,
    X,
} from 'lucide-react';
import { attendanceApi } from '@/api/platform.api';
import type { Theme } from '@/theme/tokens';
import type { AttendanceLocationEvidence, AttendanceMode } from '@/types/attendance.types';

type EvidenceMoment = 'check_in' | 'check_out';

interface Props {
    T: Theme;
    attendanceModeIn?: AttendanceMode | null;
    checkInLocation?: AttendanceLocationEvidence | null;
    checkOutLocation?: AttendanceLocationEvidence | null;
    compact?: boolean;
    recordId?: number;
    showDetailButton?: boolean;
    detailToken?: number;
    companyContextId?: number;
}

type MomentMeta = {
    moment: EvidenceMoment;
    label: string;
    evidence: AttendanceLocationEvidence | null | undefined;
    tone: string;
};

export function AttendanceEvidenceSummary({
    T,
    attendanceModeIn,
    checkInLocation,
    checkOutLocation,
    compact = false,
    recordId,
    showDetailButton = true,
    detailToken = 0,
    companyContextId,
}: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeMoment, setActiveMoment] = useState<EvidenceMoment>('check_in');
    const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
    const [selfieLoading, setSelfieLoading] = useState(false);
    const [selfieError, setSelfieError] = useState('');

    const modeMeta = useMemo(() => {
        if (attendanceModeIn === 'field') {
            return { label: 'Mode Lapangan', background: `${T.info}12`, color: T.info };
        }

        return { label: 'Mode Kantor', background: `${T.primary}12`, color: T.primary };
    }, [T.info, T.primary, attendanceModeIn]);

    const moments = useMemo<MomentMeta[]>(() => [
        { moment: 'check_in', label: 'Masuk', evidence: checkInLocation, tone: T.success },
        { moment: 'check_out', label: 'Pulang', evidence: checkOutLocation, tone: T.info },
    ], [T.info, T.success, checkInLocation, checkOutLocation]);

    const activeMeta = moments.find(item => item.moment === activeMoment) ?? moments[0];
    const availableMomentCount = moments.filter(item => item.evidence).length;

    const openDetail = () => {
        if (checkInLocation) {
            setActiveMoment('check_in');
        } else if (checkOutLocation) {
            setActiveMoment('check_out');
        }
        setIsOpen(true);
    };

    useEffect(() => {
        if (detailToken > 0 && availableMomentCount > 0) {
            openDetail();
        }
    }, [availableMomentCount, detailToken]);

    useEffect(() => {
        if (!isOpen) return;

        if (!activeMeta?.evidence && checkInLocation) {
            setActiveMoment('check_in');
        } else if (!activeMeta?.evidence && checkOutLocation) {
            setActiveMoment('check_out');
        }
    }, [activeMeta?.evidence, checkInLocation, checkOutLocation, isOpen]);

    useEffect(() => {
        if (!isOpen || !activeMeta?.evidence) {
            setSelfieUrl(null);
            setSelfieLoading(false);
            setSelfieError('');
            return;
        }

        if (!activeMeta.evidence.selfie_available || !recordId) {
            setSelfieUrl(null);
            setSelfieLoading(false);
            setSelfieError(activeMeta.evidence.selfie_available ? 'Selfie tidak bisa diakses.' : 'Tidak ada selfie tersimpan.');
            return;
        }

        let isActive = true;
        let objectUrl: string | null = null;

        setSelfieLoading(true);
        setSelfieError('');
        setSelfieUrl(null);

        void attendanceApi.getAttendanceSelfie(recordId, activeMeta.moment, companyContextId)
            .then(response => {
                objectUrl = URL.createObjectURL(response.data);
                if (!isActive) return;
                setSelfieUrl(objectUrl);
            })
            .catch((error: any) => {
                if (!isActive) return;
                setSelfieError(error?.response?.data?.message ?? 'Gagal memuat selfie.');
            })
            .finally(() => {
                if (!isActive) return;
                setSelfieLoading(false);
            });

        return () => {
            isActive = false;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [activeMeta, companyContextId, isOpen, recordId]);

    if (compact) {
        return (
            <>
                <div style={{
                    display: 'grid',
                    gap: 4,
                }}>
                    {showDetailButton && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: 6,
                        }}>
                            <button
                                type="button"
                                onClick={openDetail}
                                disabled={availableMomentCount === 0}
                                style={detailButtonStyle(T, true, availableMomentCount === 0)}
                            >
                                Detail
                            </button>
                        </div>
                    )}

                    <div style={{
                        display: 'grid',
                        gap: 4,
                    }}>
                        {moments.map(item => (
                            <div
                                key={item.moment}
                                style={{
                                    minHeight: 30,
                                    borderRadius: 9,
                                    border: `1px solid ${T.border}`,
                                    background: T.bgAlt,
                                    padding: '4px 7px',
                                    display: 'grid',
                                    gridTemplateColumns: '40px minmax(0, 1fr)',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                <div style={{
                                    fontSize: 8.5,
                                    color: T.textMuted,
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.2,
                                }}>
                                    {item.label}
                                </div>
                                <div style={{
                                    fontSize: 10,
                                    color: item.evidence ? T.text : T.textMuted,
                                    fontWeight: 700,
                                    lineHeight: 1.15,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}>
                                    {buildCompactEvidenceLine(item.evidence)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <EvidenceDetailModal
                    T={T}
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    modeMeta={modeMeta}
                    moments={moments}
                    activeMoment={activeMoment}
                    onChangeMoment={setActiveMoment}
                    activeMeta={activeMeta}
                    selfieUrl={selfieUrl}
                    selfieLoading={selfieLoading}
                    selfieError={selfieError}
                />
            </>
        );
    }

    return (
        <>
            <div style={{
                display: 'grid',
                gap: compact ? 6 : 8,
                borderRadius: compact ? 14 : 16,
                border: `1px solid ${T.border}`,
                background: T.bgAlt,
                padding: compact ? '8px 9px' : '10px 11px',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: showDetailButton ? 'space-between' : 'flex-start',
                    gap: 8,
                    flexWrap: 'wrap',
                }}>
                    <span style={badgeStyle(modeMeta.background, modeMeta.color, compact)}>
                        {modeMeta.label}
                    </span>
                    {showDetailButton && (
                        <button
                            type="button"
                            onClick={openDetail}
                            disabled={availableMomentCount === 0}
                            style={detailButtonStyle(T, compact, availableMomentCount === 0)}
                        >
                            Detail
                        </button>
                    )}
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: compact ? 'repeat(2, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))',
                    gap: compact ? 6 : 8,
                }}>
                    {moments.map(item => (
                        <div key={item.moment} style={{
                            borderRadius: compact ? 12 : 14,
                            border: `1px solid ${T.border}`,
                            background: T.card,
                            padding: compact ? '7px 8px' : '9px 10px',
                            display: 'grid',
                            gap: 4,
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 6,
                            }}>
                                <span style={{ fontSize: compact ? 9.5 : 10.5, color: T.textMuted, fontWeight: 800, textTransform: 'uppercase' }}>
                                    {item.label}
                                </span>
                                <span style={badgeStyle(`${item.tone}12`, item.tone, true)}>
                                    {describeEvidence(item.evidence)}
                                </span>
                            </div>
                            <div style={{
                                fontSize: compact ? 9.75 : 11,
                                color: T.text,
                                fontWeight: 700,
                                lineHeight: 1.35,
                            }}>
                                {item.evidence
                                    ? (typeof item.evidence.distance_meters === 'number'
                                        ? formatDistance(item.evidence.distance_meters)
                                        : 'Lokasi terekam')
                                    : 'Belum ada bukti'}
                            </div>
                            {item.evidence && (
                                <div style={{
                                    fontSize: compact ? 9 : 10,
                                    color: T.textMuted,
                                    fontWeight: 700,
                                }}>
                                    {item.evidence.selfie_available ? 'Selfie ada' : 'Tanpa selfie'}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <EvidenceDetailModal
                T={T}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                modeMeta={modeMeta}
                moments={moments}
                activeMoment={activeMoment}
                onChangeMoment={setActiveMoment}
                activeMeta={activeMeta}
                selfieUrl={selfieUrl}
                selfieLoading={selfieLoading}
                selfieError={selfieError}
            />
        </>
    );
}

function EvidenceDetailModal({
    T,
    isOpen,
    onClose,
    modeMeta,
    moments,
    activeMoment,
    onChangeMoment,
    activeMeta,
    selfieUrl,
    selfieLoading,
    selfieError,
}: {
    T: Theme;
    isOpen: boolean;
    onClose: () => void;
    modeMeta: { label: string; background: string; color: string };
    moments: MomentMeta[];
    activeMoment: EvidenceMoment;
    onChangeMoment: (moment: EvidenceMoment) => void;
    activeMeta: MomentMeta;
    selfieUrl: string | null;
    selfieLoading: boolean;
    selfieError: string;
}) {
    if (!isOpen) return null;

    const evidence = activeMeta.evidence;

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle(T)} onClick={event => event.stopPropagation()}>
                <div style={modalHeroStyle(T)}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 14,
                    }}>
                        <div style={{ display: 'grid', gap: 10, minWidth: 0, flex: 1 }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                flexWrap: 'wrap',
                            }}>
                                <span style={badgeStyle(modeMeta.background, modeMeta.color, false)}>
                                    {modeMeta.label}
                                </span>
                                {moments.map(item => {
                                    const active = activeMoment === item.moment;
                                    return (
                                        <button
                                            key={item.moment}
                                            type="button"
                                            disabled={!item.evidence}
                                            onClick={() => onChangeMoment(item.moment)}
                                            style={momentTabStyle(T, active, !item.evidence)}
                                        >
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <div style={{ display: 'grid', gap: 4 }}>
                                <div style={{
                                    fontSize: 20,
                                    fontWeight: 900,
                                    color: T.text,
                                    fontFamily: "'Sora', sans-serif",
                                    lineHeight: 1.15,
                                }}>
                                    Detail Bukti {activeMeta.label}
                                </div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    flexWrap: 'wrap',
                                    fontSize: 11.5,
                                    color: T.textMuted,
                                    fontWeight: 700,
                                }}>
                                    <MapPinned size={13} color={T.primary} />
                                    {evidence
                                        ? formatCoordinates(evidence.latitude, evidence.longitude)
                                        : 'Belum ada bukti lokasi untuk momen ini.'}
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            style={modalCloseButtonStyle(T)}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {evidence && (
                        <div style={modalMetricsGridStyle}>
                            <DetailMetric
                                T={T}
                                icon={<ShieldCheck size={14} color={evidence.within_branch_radius === false ? T.gold : T.success} />}
                                label="Status"
                                value={describeEvidence(evidence)}
                            />
                            <DetailMetric
                                T={T}
                                icon={<LocateFixed size={14} color={T.primary} />}
                                label="Akurasi"
                                value={typeof evidence.accuracy_meters === 'number' ? `${Math.round(evidence.accuracy_meters)} m` : 'Tidak tersedia'}
                            />
                            <DetailMetric
                                T={T}
                                icon={<Route size={14} color={T.info} />}
                                label="Jarak"
                                value={typeof evidence.distance_meters === 'number' ? formatDistance(evidence.distance_meters) : 'Tidak dihitung'}
                            />
                            <DetailMetric
                                T={T}
                                icon={<Camera size={14} color={T.gold} />}
                                label="Selfie"
                                value={evidence.selfie_available ? 'Tersimpan' : 'Tidak ada'}
                            />
                        </div>
                    )}
                </div>

                {evidence ? (
                    <div style={detailBodyGridStyle}>
                        <div style={surfaceStyle(T, { padding: 0, overflow: 'hidden' })}>
                            <div style={sectionHeadStyle(T)}>
                                <span style={sectionLabelStyle(T)}>
                                    <MapPinned size={14} color={T.primary} />
                                    Maps
                                </span>
                                <a
                                    href={evidence.map_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={linkButtonStyle(T)}
                                >
                                    <ExternalLink size={13} />
                                    Buka Maps
                                </a>
                            </div>
                            <iframe
                                title={`Map ${activeMeta.label}`}
                                src={buildEmbedMapUrl(evidence.latitude, evidence.longitude)}
                                style={{
                                    width: '100%',
                                    height: 360,
                                    border: 'none',
                                    display: 'block',
                                    background: T.bgAlt,
                                }}
                                loading="lazy"
                            />
                        </div>

                        <div style={surfaceStyle(T, { padding: 0, overflow: 'hidden' })}>
                            <div style={sectionHeadStyle(T)}>
                                <span style={sectionLabelStyle(T)}>
                                    <Camera size={14} color={T.gold} />
                                    Selfie
                                </span>
                            </div>
                            <div style={{ padding: 16 }}>
                                {!evidence.selfie_available ? (
                                    <EmptyBlock T={T} message="Tidak ada selfie yang tersimpan untuk bukti ini." minHeight={360} />
                                ) : selfieLoading ? (
                                    <EmptyBlock T={T} message="Memuat selfie..." loading minHeight={360} />
                                ) : selfieUrl ? (
                                    <img
                                        src={selfieUrl}
                                        alt={`Selfie ${activeMeta.label}`}
                                        style={{
                                            width: '100%',
                                            height: 360,
                                            objectFit: 'cover',
                                            borderRadius: 16,
                                            border: `1px solid ${T.border}`,
                                            background: T.bgAlt,
                                            display: 'block',
                                        }}
                                    />
                                ) : (
                                    <EmptyBlock T={T} message={selfieError || 'Selfie tidak tersedia.'} minHeight={360} />
                                )}
                            </div>
                        </div>

                        <div style={surfaceStyle(T, { padding: 0, alignSelf: 'start' })}>
                            <div style={sectionHeadStyle(T)}>
                                <span style={sectionLabelStyle(T)}>
                                    <ShieldCheck size={14} color={T.success} />
                                    Informasi Lokasi
                                </span>
                            </div>
                            <div style={{ display: 'grid', gap: 0, padding: '2px 16px 12px' }}>
                                <InfoRow label="Koordinat" value={formatCoordinates(evidence.latitude, evidence.longitude)} T={T} icon={<MapPinned size={14} color={T.primary} />} />
                                <InfoRow label="Status" value={describeEvidence(evidence)} T={T} icon={<ShieldCheck size={14} color={evidence.within_branch_radius === false ? T.gold : T.success} />} />
                                <InfoRow
                                    label="Akurasi"
                                    value={typeof evidence.accuracy_meters === 'number'
                                        ? `${Math.round(evidence.accuracy_meters)} m`
                                        : 'Tidak tersedia'}
                                    T={T}
                                    icon={<LocateFixed size={14} color={T.primary} />}
                                />
                                <InfoRow
                                    label="Jarak ke kantor"
                                    value={typeof evidence.distance_meters === 'number'
                                        ? formatDistance(evidence.distance_meters)
                                        : 'Tidak dihitung'}
                                    T={T}
                                    icon={<Route size={14} color={T.info} />}
                                />
                                <InfoRow
                                    label="Peta"
                                    value="Tersedia"
                                    T={T}
                                    icon={<ExternalLink size={14} color={T.textSub} />}
                                />
                                <InfoRow
                                    label="Selfie"
                                    value={evidence.selfie_available ? 'Tersimpan' : 'Tidak ada'}
                                    T={T}
                                    icon={<Camera size={14} color={T.gold} />}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <EmptyBlock T={T} message="Belum ada bukti untuk momen ini." />
                )}
            </div>
        </div>
    );
}

function InfoRow({
    label,
    value,
    T,
    icon,
}: {
    label: string;
    value: string;
    T: Theme;
    icon?: ReactNode;
}) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            paddingBottom: 10,
            borderBottom: `1px solid ${T.border}`,
        }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 10.5, fontWeight: 800, color: T.textMuted, textTransform: 'uppercase' }}>
                {icon}
                {label}
            </span>
            <span style={{
                fontSize: 12,
                fontWeight: 700,
                color: T.text,
                textAlign: 'right',
                lineHeight: 1.5,
            }}>
                {value}
            </span>
        </div>
    );
}

function EmptyBlock({
    T,
    message,
    loading = false,
    minHeight,
}: {
    T: Theme;
    message: string;
    loading?: boolean;
    minHeight?: number;
}) {
    return (
        <div style={{
            minHeight: minHeight ?? 220,
            borderRadius: 16,
            border: `1px dashed ${T.border}`,
            background: T.bgAlt,
            color: T.textMuted,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            fontSize: 11.5,
            fontWeight: 700,
            textAlign: 'center',
            padding: 18,
        }}>
            {loading && <Loader2 size={18} color={T.primary} style={{ animation: 'spin 1s linear infinite' }} />}
            {message}
        </div>
    );
}

function describeEvidence(evidence?: AttendanceLocationEvidence | null): string {
    if (!evidence) return 'Belum ada';
    if (evidence.within_branch_radius === true) return 'Dalam radius';
    if (evidence.within_branch_radius === false) return 'Di luar radius';
    return 'Terekam';
}

function describeEvidenceShort(evidence?: AttendanceLocationEvidence | null): string {
    if (!evidence) return 'Belum';
    if (evidence.within_branch_radius === true) return 'Dalam';
    if (evidence.within_branch_radius === false) return 'Luar';
    return 'Ada';
}

function buildCompactEvidenceLine(evidence?: AttendanceLocationEvidence | null): string {
    if (!evidence) return 'Belum ada bukti';

    const parts = [describeEvidenceShort(evidence)];

    if (typeof evidence.distance_meters === 'number') {
        parts.push(formatDistance(evidence.distance_meters));
    }

    if (evidence.selfie_available) {
        parts.push('Selfie');
    }

    return parts.join(' • ');
}

function formatCoordinates(latitude: number, longitude: number): string {
    return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

function formatDistance(distance: number): string {
    if (distance >= 1000) return `${(distance / 1000).toFixed(1)} km`;
    return `${Math.round(distance)} m`;
}

function buildEmbedMapUrl(latitude: number, longitude: number): string {
    const delta = 0.0045;
    const left = longitude - delta;
    const bottom = latitude - delta;
    const right = longitude + delta;
    const top = latitude + delta;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(`${left},${bottom},${right},${top}`)}&layer=mapnik&marker=${latitude},${longitude}`;
}

function badgeStyle(background: string, color: string, compact: boolean): CSSProperties {
    return {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 'fit-content',
        height: compact ? 24 : 26,
        padding: compact ? '0 8px' : '0 9px',
        borderRadius: 999,
        background,
        color,
        fontSize: compact ? 9.5 : 10,
        fontWeight: 800,
        lineHeight: 1,
        textDecoration: 'none',
    };
}

function DetailMetric({
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
        <div style={detailMetricStyle(T)}>
            <div style={detailMetricIconWrapStyle(T)}>{icon}</div>
            <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 800, textTransform: 'uppercase' }}>
                    {label}
                </div>
                <div style={{
                    marginTop: 3,
                    fontSize: 12.5,
                    color: T.text,
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}>
                    {value}
                </div>
            </div>
        </div>
    );
}

function detailButtonStyle(T: Theme, compact: boolean, disabled: boolean): CSSProperties {
    return {
        height: compact ? 26 : 28,
        padding: compact ? '0 9px' : '0 10px',
        borderRadius: 999,
        border: `1px solid ${T.primary}24`,
        background: `${T.primary}10`,
        color: disabled ? T.textMuted : T.primary,
        fontSize: compact ? 10 : 10.5,
        fontWeight: 800,
        opacity: disabled ? .6 : 1,
    };
}

function momentTabStyle(T: Theme, active: boolean, disabled: boolean): CSSProperties {
    return {
        height: 30,
        padding: '0 11px',
        borderRadius: 999,
        border: `1px solid ${active ? `${T.primary}30` : T.border}`,
        background: active ? `${T.primary}12` : T.bgAlt,
        color: disabled ? T.textMuted : (active ? T.primary : T.textSub),
        fontSize: 10.5,
        fontWeight: 800,
        opacity: disabled ? .55 : 1,
    };
}

function surfaceStyle(T: Theme, extra?: CSSProperties): CSSProperties {
    return {
        borderRadius: 20,
        border: `1px solid ${T.border}`,
        background: T.card,
        ...extra,
    };
}

function sectionHeadStyle(T: Theme): CSSProperties {
    return {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        padding: '14px 16px 12px',
        borderBottom: `1px solid ${T.border}`,
    };
}

function sectionLabelStyle(T: Theme): CSSProperties {
    return {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        fontSize: 11.5,
        fontWeight: 800,
        color: T.text,
    };
}

function linkButtonStyle(T: Theme): CSSProperties {
    return {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        height: 28,
        padding: '0 10px',
        borderRadius: 999,
        border: `1px solid ${T.border}`,
        background: T.bgAlt,
        color: T.primary,
        fontSize: 10.5,
        fontWeight: 800,
        textDecoration: 'none',
    };
}

const overlayStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: 'rgba(2, 8, 23, .58)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
};

function modalStyle(T: Theme): CSSProperties {
    return {
        width: 'min(1180px, 100%)',
        maxHeight: 'calc(100vh - 36px)',
        overflowY: 'auto',
        borderRadius: 24,
        border: `1px solid ${T.border}`,
        background: T.card,
        boxShadow: '0 30px 70px rgba(2,8,23,.28)',
        padding: 18,
    };
}

function modalHeroStyle(T: Theme): CSSProperties {
    return {
        display: 'grid',
        gap: 10,
        marginBottom: 14,
        padding: 14,
        borderRadius: 22,
        border: `1px solid ${T.border}`,
        background: `linear-gradient(180deg, ${T.card} 0%, ${T.bgAlt} 100%)`,
    };
}

const modalMetricsGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
    gap: 8,
};

const detailBodyGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 14,
    alignItems: 'start',
};

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

function detailMetricStyle(T: Theme): CSSProperties {
    return {
        display: 'grid',
        gridTemplateColumns: '36px minmax(0, 1fr)',
        alignItems: 'center',
        gap: 10,
        minHeight: 54,
        borderRadius: 16,
        border: `1px solid ${T.border}`,
        background: T.card,
        padding: '9px 11px',
    };
}

function detailMetricIconWrapStyle(T: Theme): CSSProperties {
    return {
        width: 36,
        height: 36,
        borderRadius: 12,
        border: `1px solid ${T.border}`,
        background: T.bgAlt,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };
}
