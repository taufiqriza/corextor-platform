import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
    CalendarDays,
    CheckCircle2,
    Clock3,
    Compass,
    FileText,
    Fingerprint,
    History,
    LogIn,
    LogOut,
    MapPin,
    UserRound,
} from 'lucide-react';
import { attendanceApi } from '@/api/platform.api';
import { calculateAttendanceStreak, unwrapAttendanceRecords } from '@/employee/lib/attendance';
import type { EmployeeTabId } from '@/employee/components/EmployeeBottomNav';
import type { Theme } from '@/theme/tokens';
import type { AttendanceContextPayload, AttendanceRecordItem } from '@/types/attendance.types';
import { useAuthStore } from '@/store/authStore';

interface Props {
    T: Theme;
    isDesktop: boolean;
    onNavigate: (tab: EmployeeTabId) => void;
}

export function EmployeeHomeTab({ T, isDesktop, onNavigate }: Props) {
    const user = useAuthStore(state => state.user);

    const [now, setNow] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [context, setContext] = useState<AttendanceContextPayload | null>(null);
    const [records, setRecords] = useState<AttendanceRecordItem[]>([]);
    const [monthlyTotal, setMonthlyTotal] = useState(0);

    useEffect(() => {
        const baseTime = context?.server_time ? new Date(context.server_time) : new Date();
        const startedAt = Date.now();

        setNow(baseTime);

        const timer = window.setInterval(() => {
            setNow(new Date(baseTime.getTime() + (Date.now() - startedAt)));
        }, 1000);

        return () => window.clearInterval(timer);
    }, [context?.server_time]);

    const fetchDashboard = useCallback(async () => {
        setLoading(true);

        try {
            const currentDate = new Date();
            const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().slice(0, 10);
            const today = currentDate.toISOString().slice(0, 10);

            const [contextResponse, historyResponse] = await Promise.all([
                attendanceApi.getContext(),
                attendanceApi.getHistory({
                    from: startOfMonth,
                    to: today,
                    per_page: 100,
                }),
            ]);

            const historyPayload = historyResponse.data.data;
            setContext(contextResponse.data.data);
            setRecords(unwrapAttendanceRecords(historyPayload));
            setMonthlyTotal(historyPayload.total ?? 0);
        } catch {
            setContext(null);
            setRecords([]);
            setMonthlyTotal(0);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchDashboard();
    }, [fetchDashboard]);

    const fullName = user?.name || 'Karyawan';
    const initials = (user?.name || 'K')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(word => word[0])
        .join('')
        .toUpperCase();
    const avatarUrl = user?.avatar_url || '';

    const stats = useMemo(() => {
        const total = monthlyTotal;
        const complete = records.filter(record => record.time_in && record.time_out).length;
        return {
            total,
            complete,
            streak: calculateAttendanceStreak(records),
        };
    }, [monthlyTotal, records]);

    const todayRecord = context?.today_record;
    const currentTime = formatClock(now);
    const roleLabel = user?.role === 'employee' ? 'Karyawan' : (user?.role || 'Member');
    const branchName = context?.branch?.name || 'Belum ada branch';
    const branchLocation = context?.branch?.location || 'Lokasi kerja belum diatur';
    const checkInLabel = todayRecord?.time_in ? formatAttendanceTime(todayRecord.time_in) : 'Belum masuk';
    const checkOutLabel = todayRecord?.time_out
        ? formatAttendanceTime(todayRecord.time_out)
        : todayRecord?.time_in
            ? 'Belum pulang'
            : 'Menunggu';
    const checkInNote = todayRecord?.time_in ? 'Tercatat hari ini' : 'Belum ada check-in';
    const checkOutNote = todayRecord?.time_out
        ? 'Tercatat hari ini'
        : todayRecord?.time_in
            ? 'Masih bekerja'
            : 'Check-in Terlebih Dahulu';
    const syncLabel = `${currentTime} WIB`;

    const status = todayRecord?.time_out
        ? { label: 'Complete', background: 'rgba(214,255,192,.92)', color: '#4B6B0B' }
        : todayRecord?.time_in
            ? { label: 'Working', background: 'rgba(211,236,255,.94)', color: '#0E5B98' }
            : { label: 'Ready', background: 'rgba(255,236,207,.94)', color: '#9A5B00' };

    const quickActions: {
        id: EmployeeTabId;
        label: string;
        icon: typeof Compass;
        color: string;
    }[] = [
        { id: 'attendance', label: 'Absen', icon: Fingerprint, color: '#2F80ED' },
        { id: 'history', label: 'Riwayat', icon: History, color: '#1D9BF0' },
        { id: 'report', label: 'Laporan', icon: FileText, color: '#0EA5E9' },
        { id: 'profile', label: 'Profil', icon: UserRound, color: '#4F46E5' },
    ];

    const latestRecords = records.slice(0, 2);
    const headerStats = [
        { label: 'Hadir', value: loading ? '...' : `${stats.total}`, note: 'bulan ini', icon: CalendarDays },
        { label: 'Selesai', value: loading ? '...' : `${stats.complete}`, note: 'hari', icon: CheckCircle2 },
        { label: 'Streak', value: loading ? '...' : `${stats.streak}`, note: 'hari', icon: Clock3 },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <section style={{
                position: 'relative',
                overflow: 'hidden',
                margin: isDesktop ? '0' : '-12px -14px 0',
                borderRadius: isDesktop ? '28px 28px 36px 36px' : '0 0 34px 34px',
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
                    top: isDesktop ? 28 : 22,
                    right: isDesktop ? 92 : 76,
                    width: isDesktop ? 72 : 64,
                    height: isDesktop ? 72 : 64,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,255,255,.12) 0%, rgba(255,255,255,0) 72%)',
                    opacity: .7,
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

                <div style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: isDesktop ? -82 : -92,
                    transform: 'translateX(-50%)',
                    width: isDesktop ? '128%' : '136%',
                    height: isDesktop ? 156 : 174,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,.08)',
                    pointerEvents: 'none',
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        marginBottom: 16,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                            <div style={{
                                width: isDesktop ? 48 : 42,
                                height: isDesktop ? 48 : 42,
                                borderRadius: 999,
                                background: 'rgba(255,255,255,.22)',
                                border: '1px solid rgba(255,255,255,.24)',
                                boxShadow: '0 8px 20px rgba(14,62,105,.18)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                            }}>
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={fullName}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                        }}
                                    />
                                ) : (
                                    <span style={{
                                        fontFamily: "'Sora', sans-serif",
                                        fontSize: isDesktop ? 15 : 13,
                                        fontWeight: 900,
                                    }}>
                                        {initials}
                                    </span>
                                )}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 7,
                                    minWidth: 0,
                                }}>
                                    <UserRound size={isDesktop ? 15 : 14} />
                                    <div style={{
                                        fontSize: isDesktop ? 18 : 16,
                                        fontWeight: 800,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}>
                                        {fullName}
                                    </div>
                                </div>
                                <div style={{
                                    marginTop: 4,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    flexWrap: 'wrap',
                                    fontSize: 11,
                                    color: 'rgba(255,255,255,.82)',
                                }}>
                                    <span>{roleLabel}</span>
                                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,.65)' }} />
                                    <span>{branchName}</span>
                                </div>
                            </div>
                        </div>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: isDesktop ? '5px 9px' : '4px 8px',
                            borderRadius: 999,
                            background: status.background,
                            color: status.color,
                            fontSize: isDesktop ? 10.5 : 10,
                            fontWeight: 800,
                            flexShrink: 0,
                        }}>
                            <span style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: '#7CC34A',
                            }} />
                            {status.label}
                        </div>
                    </div>

                    <div style={{
                        background: 'rgba(255,255,255,.96)',
                        color: '#0F172A',
                        borderRadius: 24,
                        padding: isDesktop ? '14px' : '12px',
                        boxShadow: '0 18px 34px rgba(8,49,87,.16)',
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            marginBottom: 10,
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
                                    <MapPin size={12} />
                                    <span style={{
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}>
                                        {branchName}
                                    </span>
                                </div>
                                <div style={{
                                    minWidth: 0,
                                    fontSize: 10.5,
                                    color: '#64748B',
                                    fontWeight: 700,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}>
                                    {branchLocation}
                                </div>
                            </div>
                            <div style={{
                                fontSize: 11,
                                fontWeight: 800,
                                color: '#0F5FA6',
                                flexShrink: 0,
                                fontFamily: "'Sora', sans-serif",
                            }}>
                                {syncLabel}
                            </div>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                            gap: 6,
                            marginBottom: 12,
                        }}>
                            {headerStats.map(item => (
                                <TopMetric
                                    key={item.label}
                                    label={item.label}
                                    value={item.value}
                                    note={item.note}
                                    icon={item.icon}
                                />
                            ))}
                        </div>

                        <div style={{
                            borderRadius: 18,
                            padding: '10px',
                            background: 'linear-gradient(180deg, #156FB7 0%, #0F5FA6 56%, #0B4B8A 100%)',
                            color: '#fff',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.16)',
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 10,
                                marginBottom: 10,
                            }}>
                                <div style={{ fontSize: 12, fontWeight: 900, fontFamily: "'Sora', sans-serif" }}>
                                    Kehadiran Hari Ini
                                </div>
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    padding: '4px 9px',
                                    borderRadius: 999,
                                    background: 'rgba(255,255,255,.16)',
                                    color: '#fff',
                                    fontSize: 10,
                                    fontWeight: 800,
                                    flexShrink: 0,
                                }}>
                                    {status.label}
                                </div>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                                gap: 8,
                            }}>
                                <ActionButton
                                    tone="blue"
                                    title={checkInLabel}
                                    label="Masuk"
                                    note={checkInNote}
                                    icon={LogIn}
                                    onClick={() => onNavigate('attendance')}
                                />
                                <ActionButton
                                    tone="navy"
                                    title={checkOutLabel}
                                    label="Pulang"
                                    note={checkOutNote}
                                    icon={LogOut}
                                    onClick={() => onNavigate('attendance')}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section style={cardStyle(T, { padding: isDesktop ? '14px 16px 16px' : '12px 12px 14px' })}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                    gap: 10,
                }}>
                    {quickActions.map(action => {
                        const Icon = action.icon;
                        return (
                            <button
                                key={action.id}
                                onClick={() => onNavigate(action.id)}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: 0,
                                }}
                            >
                                <div style={{
                                    width: isDesktop ? 52 : 46,
                                    height: isDesktop ? 52 : 46,
                                    borderRadius: '50%',
                                    background: `${action.color}12`,
                                    border: `1px solid ${action.color}15`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: T.shadowSm,
                                }}>
                                    <Icon size={18} color={action.color} />
                                </div>
                                <span style={{
                                    fontSize: isDesktop ? 11 : 10,
                                    fontWeight: 700,
                                    color: T.text,
                                    textAlign: 'center',
                                    lineHeight: 1.25,
                                }}>
                                    {action.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </section>

            <section style={cardStyle(T, { padding: isDesktop ? '16px' : '14px' })}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    marginBottom: 12,
                }}>
                    <div>
                        <div style={{
                            fontSize: 13,
                            fontWeight: 900,
                            color: T.text,
                            fontFamily: "'Sora', sans-serif",
                        }}>
                            Last History Attendance
                        </div>
                        <div style={{ marginTop: 4, fontSize: 11, color: T.textMuted }}>
                            Ringkas dan langsung ke inti.
                        </div>
                    </div>
                    <button
                        onClick={() => onNavigate('history')}
                        style={{
                            border: 'none',
                            background: 'transparent',
                            color: T.primary,
                            fontSize: 11,
                            fontWeight: 800,
                            flexShrink: 0,
                        }}
                    >
                        See More
                    </button>
                </div>

                {loading ? (
                    <div style={{
                        borderRadius: 16,
                        padding: '16px 14px',
                        background: T.bgAlt,
                        border: `1px solid ${T.border}`,
                        fontSize: 12,
                        color: T.textMuted,
                        textAlign: 'center',
                    }}>
                        Memuat riwayat...
                    </div>
                ) : latestRecords.length === 0 ? (
                    <div style={{
                        borderRadius: 16,
                        padding: '16px 14px',
                        background: T.bgAlt,
                        border: `1px solid ${T.border}`,
                        fontSize: 12,
                        color: T.textMuted,
                        textAlign: 'center',
                    }}>
                        Belum ada riwayat attendance bulan ini.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {latestRecords.map(record => {
                            const complete = Boolean(record.time_in && record.time_out);
                            return (
                                <button
                                    key={record.id}
                                    onClick={() => onNavigate('history')}
                                    style={{
                                        width: '100%',
                                        borderRadius: 18,
                                        border: `1px solid ${T.border}`,
                                        background: T.bgAlt,
                                        padding: '12px 14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 12,
                                        textAlign: 'left',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                                        <div style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: 12,
                                            background: complete ? `${T.success}12` : `${T.gold}12`,
                                            border: `1px solid ${complete ? `${T.success}18` : `${T.gold}18`}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            {complete
                                                ? <CheckCircle2 size={16} color={T.success} />
                                                : <CalendarDays size={16} color={T.gold} />}
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{
                                                fontSize: 12,
                                                fontWeight: 800,
                                                color: T.text,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}>
                                                {formatDateLabel(record.date)}
                                            </div>
                                            <div style={{ marginTop: 4, fontSize: 11, color: T.textMuted }}>
                                                {record.time_in || '—'} → {record.time_out || '—'}
                                            </div>
                                        </div>
                                    </div>
                                    <span style={{
                                        flexShrink: 0,
                                        fontSize: 11,
                                        fontWeight: 800,
                                        color: T.textMuted,
                                    }}>
                                        Detail
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}

function cardStyle(T: Theme, extra?: CSSProperties): CSSProperties {
    return {
        borderRadius: 24,
        background: T.card,
        border: `1px solid ${T.border}`,
        boxShadow: T.shadowSm,
        ...extra,
    };
}

function TopMetric({
    label,
    value,
    note,
    icon: Icon,
}: {
    label: string;
    value: string;
    note: string;
    icon: typeof CalendarDays;
}) {
    return (
        <div style={{
            borderRadius: 14,
            padding: '8px 8px 7px',
            background: 'linear-gradient(180deg, #F8FBFF 0%, #F1F7FF 100%)',
            border: '1px solid rgba(15,23,42,.06)',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 8.5,
                color: '#64748B',
                fontWeight: 700,
            }}>
                <Icon size={11} />
                {label}
            </div>
            <div style={{ marginTop: 5, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{
                    fontSize: 14,
                    lineHeight: 1.05,
                    fontWeight: 900,
                    fontFamily: "'Sora', sans-serif",
                    color: '#0F172A',
                }}>
                    {value}
                </span>
                <span style={{ fontSize: 9.5, color: '#64748B', fontWeight: 700 }}>
                    {note}
                </span>
            </div>
        </div>
    );
}

function ActionButton({
    tone,
    title,
    label,
    note,
    icon: Icon,
    onClick,
}: {
    tone: 'blue' | 'navy';
    title: string;
    label: string;
    note: string;
    icon: typeof LogIn;
    onClick: () => void;
}) {
    const background = tone === 'blue'
        ? 'linear-gradient(135deg, #278DDA 0%, #176FBC 100%)'
        : 'linear-gradient(135deg, #123E70 0%, #0B2E55 100%)';

    return (
        <button
            onClick={onClick}
            style={{
                minHeight: 76,
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,.16)',
                background,
                color: '#fff',
                padding: '9px 10px',
                textAlign: 'left',
                boxShadow: '0 8px 16px rgba(8,49,87,.12)',
            }}
        >
            <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 10,
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, opacity: .92 }}>
                        {label}
                    </span>
                    <span style={{
                        fontSize: 15,
                        fontWeight: 900,
                        fontFamily: "'Sora', sans-serif",
                        lineHeight: 1,
                    }}>
                        {title}
                    </span>
                </div>
                <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: 10,
                    background: 'rgba(255,255,255,.16)',
                    border: '1px solid rgba(255,255,255,.14)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <Icon size={14} />
                </div>
            </div>
            <div style={{ marginTop: 7, fontSize: 9.5, fontWeight: 700, opacity: .82, lineHeight: 1.25 }}>
                {note}
            </div>
        </button>
    );
}

function formatDateLabel(date: string): string {
    return new Date(`${date}T00:00:00`).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
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
