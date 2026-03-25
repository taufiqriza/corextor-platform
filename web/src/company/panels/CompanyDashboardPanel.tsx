import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    Building2,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Clock3,
    FileText,
    Gauge,
    Landmark,
    Loader2,
    MapPin,
    Paperclip,
    RefreshCcw,
    ShieldCheck,
    TrendingUp,
    UserCheck,
    Users,
    Zap,
} from 'lucide-react';
import { attendanceApi, platformApi } from '@/api/platform.api';
import type {
    AttendanceAdminReportItem,
    AttendanceAdminReportPayload,
    AttendanceBranch,
    EmployeeReportItem,
} from '@/types/attendance.types';
import type { Theme } from '@/theme/tokens';

interface Props {
    T: Theme;
    isDesktop: boolean;
    onNavigate: (key: string) => void;
}

type CompanyProfile = {
    id: number;
    name: string;
    code: string;
    address: string | null;
    industry: string | null;
    status: string;
};

type CompanyStats = {
    total: number;
    admins: number;
    employees: number;
    active: number;
    suspended: number;
};

type AttendanceUserItem = {
    id: number;
    status: string;
    branch?: { id: number; name: string } | null;
};

type InvoiceItem = {
    id: number;
    invoice_number: string;
    status: string;
    amount_total: number;
    due_at: string | null;
    issued_at: string | null;
};

type SubscriptionItem = {
    id: number;
    status: string;
    billing_cycle: string;
    starts_at: string;
    ends_at: string | null;
    product?: { name?: string | null } | null;
    plan?: { name?: string | null } | null;
};

type DashboardPayload = {
    company: CompanyProfile | null;
    teamStats: CompanyStats | null;
    attendanceUsers: AttendanceUserItem[];
    branches: AttendanceBranch[];
    todayStats: AttendanceAdminReportPayload['stats'];
    monthStats: AttendanceAdminReportPayload['stats'];
    recentAttendance: AttendanceAdminReportItem[];
    recentReports: EmployeeReportItem[];
    reportStats: {
        total: number;
        today: number;
        with_attachments: number;
        employees: number;
    };
    invoices: InvoiceItem[];
    subscriptions: SubscriptionItem[];
};

const EMPTY_ATTENDANCE_STATS: AttendanceAdminReportPayload['stats'] = {
    total: 0,
    present: 0,
    corrected: 0,
    complete: 0,
    ongoing: 0,
    office: 0,
    field: 0,
};

function formatDate(value?: string | null): string {
    if (!value) return '-';
    try {
        return new Date(value).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return value;
    }
}

function formatDateTime(value?: string | null): string {
    if (!value) return '-';
    try {
        return new Date(value).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return value;
    }
}

function formatRelative(value?: string | null): string {
    if (!value) return '-';
    const diffMs = Date.now() - new Date(value).getTime();
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 1) return 'Baru saja';
    if (mins < 60) return `${mins}m lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}j lalu`;
    const days = Math.floor(hours / 24);
    return `${days}h lalu`;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
}

function formatPercent(value: number): string {
    if (!Number.isFinite(value)) return '0%';
    return `${Math.round(value)}%`;
}

function modeLabel(value?: string | null): string {
    return value === 'field' ? 'Lapangan' : 'Kantor';
}

function invoiceStatusLabel(value?: string | null): string {
    switch (value) {
        case 'paid': return 'Lunas';
        case 'pending': return 'Menunggu';
        case 'overdue': return 'Jatuh tempo';
        case 'cancelled': return 'Dibatalkan';
        default: return value ?? 'Tagihan';
    }
}

export function CompanyDashboardPanel({ T, isDesktop, onNavigate }: Props) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [dashboard, setDashboard] = useState<DashboardPayload>({
        company: null,
        teamStats: null,
        attendanceUsers: [],
        branches: [],
        todayStats: EMPTY_ATTENDANCE_STATS,
        monthStats: EMPTY_ATTENDANCE_STATS,
        recentAttendance: [],
        recentReports: [],
        reportStats: { total: 0, today: 0, with_attachments: 0, employees: 0 },
        invoices: [],
        subscriptions: [],
    });

    const loadDashboard = useCallback(async (silent = false) => {
        if (silent) setRefreshing(true);
        else setLoading(true);

        const today = new Date().toISOString().split('T')[0];
        const monthStart = `${today.slice(0, 8)}01`;

        try {
            const [
                profileResult,
                usersResult,
                branchesResult,
                todayAttendanceResult,
                monthAttendanceResult,
                reportsResult,
                invoicesResult,
                subscriptionsResult,
            ] = await Promise.allSettled([
                platformApi.getMyProfile(),
                attendanceApi.getUsers(),
                attendanceApi.getBranches(),
                attendanceApi.getReport({ from: today, to: today, per_page: 6, page: 1 }),
                attendanceApi.getReport({ from: monthStart, to: today, per_page: 1, page: 1 }),
                attendanceApi.getCompanyReports({ from: monthStart, to: today, per_page: 5, page: 1 }),
                platformApi.getMyInvoices(),
                platformApi.getMySubscriptions(),
            ]);

            const profileData = profileResult.status === 'fulfilled' ? profileResult.value.data?.data : null;
            const attendanceUsers = usersResult.status === 'fulfilled' ? (usersResult.value.data?.data ?? []) : [];
            const branches = branchesResult.status === 'fulfilled' ? (branchesResult.value.data?.data ?? []) : [];

            const todayAttendanceData = todayAttendanceResult.status === 'fulfilled'
                ? (todayAttendanceResult.value.data?.data ?? null)
                : null;

            const monthAttendanceData = monthAttendanceResult.status === 'fulfilled'
                ? (monthAttendanceResult.value.data?.data ?? null)
                : null;

            const reportsData = reportsResult.status === 'fulfilled'
                ? (reportsResult.value.data?.data ?? null)
                : null;

            const invoices = invoicesResult.status === 'fulfilled'
                ? (invoicesResult.value.data?.data?.invoices ?? [])
                : [];

            const subscriptions = subscriptionsResult.status === 'fulfilled'
                ? (subscriptionsResult.value.data?.data ?? [])
                : [];

            setDashboard({
                company: profileData?.company ?? null,
                teamStats: profileData?.stats ?? null,
                attendanceUsers,
                branches,
                todayStats: todayAttendanceData?.stats ?? EMPTY_ATTENDANCE_STATS,
                monthStats: monthAttendanceData?.stats ?? EMPTY_ATTENDANCE_STATS,
                recentAttendance: todayAttendanceData?.pagination?.data ?? [],
                recentReports: reportsData?.pagination?.data ?? [],
                reportStats: reportsData?.stats ?? { total: 0, today: 0, with_attachments: 0, employees: 0 },
                invoices,
                subscriptions,
            });
            setLastUpdated(new Date().toISOString());
        } finally {
            setRefreshing(false);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadDashboard();
        const timer = window.setInterval(() => void loadDashboard(true), 60_000);
        return () => window.clearInterval(timer);
    }, [loadDashboard]);

    const activeAttendanceUsers = dashboard.attendanceUsers.filter(user => user.status === 'active').length;
    const activeLocations = dashboard.branches.filter(branch => branch.status === 'active');
    const geofenceReady = activeLocations.filter(branch => branch.has_geofence);
    const presentRate = activeAttendanceUsers > 0 ? (dashboard.todayStats.present / activeAttendanceUsers) * 100 : 0;
    const completionRate = dashboard.todayStats.present > 0 ? (dashboard.todayStats.complete / dashboard.todayStats.present) * 100 : 0;
    const officeRate = dashboard.todayStats.present > 0 ? (dashboard.todayStats.office / dashboard.todayStats.present) * 100 : 0;
    const fieldRate = dashboard.todayStats.present > 0 ? (dashboard.todayStats.field / dashboard.todayStats.present) * 100 : 0;
    const reportAttachmentRate = dashboard.reportStats.total > 0 ? (dashboard.reportStats.with_attachments / dashboard.reportStats.total) * 100 : 0;

    const attentionInvoice = dashboard.invoices.find(item => item.status === 'overdue' || item.status === 'pending')
        ?? dashboard.invoices[0]
        ?? null;

    const heroStats = [
        {
            label: 'Karyawan Aktif',
            value: activeAttendanceUsers,
            icon: Users,
            tone: T.primary,
        },
        {
            label: 'Hadir Hari Ini',
            value: dashboard.todayStats.present,
            icon: UserCheck,
            tone: T.success,
        },
        {
            label: 'Laporan Hari Ini',
            value: dashboard.reportStats.today,
            icon: FileText,
            tone: T.info,
        },
        {
            label: 'Lokasi Aktif',
            value: activeLocations.length,
            icon: Landmark,
            tone: T.gold,
        },
    ];

    const topCards = [
        {
            label: 'Coverage Absensi',
            value: formatPercent(presentRate),
            sub: `${dashboard.todayStats.present}/${activeAttendanceUsers || 0} karyawan sudah check-in`,
            icon: Gauge,
            tone: T.primary,
            nav: 'attendance',
        },
        {
            label: 'Selesai Check-out',
            value: formatPercent(completionRate),
            sub: `${dashboard.todayStats.complete} sesi selesai hari ini`,
            icon: CheckCircle2,
            tone: T.success,
            nav: 'attendance',
        },
        {
            label: 'Aktivitas Lapangan',
            value: `${dashboard.todayStats.field}`,
            sub: `${formatPercent(fieldRate)} dari kehadiran hari ini`,
            icon: MapPin,
            tone: T.info,
            nav: 'attendance',
        },
        {
            label: 'Lampiran Laporan',
            value: formatPercent(reportAttachmentRate),
            sub: `${dashboard.reportStats.with_attachments} laporan memiliki file`,
            icon: Paperclip,
            tone: T.gold,
            nav: 'report',
        },
    ];

    const progressRows = [
        {
            label: 'Kehadiran hari ini',
            value: dashboard.todayStats.present,
            total: activeAttendanceUsers || Math.max(dashboard.todayStats.present, 1),
            tone: T.primary,
            helper: `${dashboard.todayStats.present} dari ${activeAttendanceUsers || 0} karyawan aktif`,
        },
        {
            label: 'Check-out selesai',
            value: dashboard.todayStats.complete,
            total: Math.max(dashboard.todayStats.present, 1),
            tone: T.success,
            helper: `${dashboard.todayStats.complete} sesi selesai`,
        },
        {
            label: 'Mode kantor',
            value: dashboard.todayStats.office,
            total: Math.max(dashboard.todayStats.present, 1),
            tone: T.info,
            helper: `${dashboard.todayStats.office} absensi kantor`,
        },
        {
            label: 'Mode lapangan',
            value: dashboard.todayStats.field,
            total: Math.max(dashboard.todayStats.present, 1),
            tone: T.gold,
            helper: `${dashboard.todayStats.field} absensi lapangan`,
        },
    ];

    const insightItems = [
        {
            label: 'Belum check-out',
            value: dashboard.todayStats.ongoing,
            tone: dashboard.todayStats.ongoing > 0 ? T.gold : T.success,
            desc: dashboard.todayStats.ongoing > 0
                ? 'Masih ada sesi aktif yang perlu dipantau'
                : 'Semua sesi hari ini sudah selesai',
        },
        {
            label: 'Lokasi siap geofence',
            value: `${geofenceReady.length}/${activeLocations.length || 0}`,
            tone: T.info,
            desc: geofenceReady.length === activeLocations.length
                ? 'Semua lokasi aktif sudah punya radius'
                : 'Masih ada lokasi aktif tanpa geofence',
        },
        {
            label: 'Laporan masuk',
            value: dashboard.reportStats.total,
            tone: T.primary,
            desc: `${dashboard.reportStats.today} laporan dibuat hari ini`,
        },
        {
            label: 'Tagihan aktif',
            value: attentionInvoice ? invoiceStatusLabel(attentionInvoice.status) : 'Aman',
            tone: attentionInvoice?.status === 'overdue' ? T.danger : attentionInvoice?.status === 'pending' ? T.gold : T.success,
            desc: attentionInvoice
                ? `${attentionInvoice.invoice_number} • ${formatCurrency(attentionInvoice.amount_total)}`
                : 'Tidak ada tagihan tertunda',
        },
    ];

    const quickActions = [
        {
            label: 'Buka Kehadiran',
            desc: 'Pantau kantor dan lapangan realtime',
            icon: ClipboardList,
            tone: T.primary,
            nav: 'attendance',
        },
        {
            label: 'Kelola Karyawan',
            desc: 'Tambah user, reset PIN, atur lokasi',
            icon: Users,
            tone: T.success,
            nav: 'employees',
        },
        {
            label: 'Periksa Laporan',
            desc: 'Cek laporan karyawan dan lampiran',
            icon: FileText,
            tone: T.info,
            nav: 'report',
        },
    ];

    const companyStatusLabel = dashboard.company?.status === 'active' ? 'Aktif' : dashboard.company?.status ?? 'Perusahaan';

    const card: CSSProperties = {
        background: T.card,
        borderRadius: 22,
        border: `1px solid ${T.border}`,
        boxShadow: T.shadowSm,
    };

    if (loading) {
        return (
            <div style={{
                minHeight: 380,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 12,
                color: T.textMuted,
            }}>
                <Loader2 size={24} color={T.primary} style={{ animation: 'spin 1s linear infinite' }} />
                <div style={{ fontSize: 12.5, fontWeight: 700 }}>Memuat command center perusahaan...</div>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gap: 14 }}>
            <section style={{
                ...card,
                overflow: 'hidden',
                background: `linear-gradient(135deg, #0F4C81 0%, #155EA9 42%, #0E76C8 100%)`,
                color: '#fff',
                position: 'relative',
                padding: isDesktop ? 22 : 16,
            }}>
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at 85% 18%, rgba(255,255,255,.14), transparent 24%), radial-gradient(circle at 14% 82%, rgba(255,255,255,.08), transparent 28%)',
                    pointerEvents: 'none',
                }} />

                <div style={{
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: isDesktop ? 'flex-start' : 'stretch',
                    gap: 14,
                    flexDirection: isDesktop ? 'row' : 'column',
                }}>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{
                                padding: '6px 10px',
                                borderRadius: 999,
                                background: 'rgba(255,255,255,.16)',
                                border: '1px solid rgba(255,255,255,.18)',
                                fontSize: 10,
                                fontWeight: 800,
                                letterSpacing: '.04em',
                                textTransform: 'uppercase',
                            }}>
                                Company Command Center
                            </span>
                            <span style={{
                                padding: '6px 10px',
                                borderRadius: 999,
                                background: 'rgba(255,255,255,.12)',
                                fontSize: 10.5,
                                fontWeight: 700,
                            }}>
                                {companyStatusLabel}
                            </span>
                        </div>

                        <div style={{
                            marginTop: 12,
                            fontSize: isDesktop ? 28 : 22,
                            fontWeight: 900,
                            lineHeight: 1.08,
                            fontFamily: "'Sora', sans-serif",
                        }}>
                            {dashboard.company?.name ?? 'Perusahaan Anda'}
                        </div>

                        <div style={{
                            marginTop: 8,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            flexWrap: 'wrap',
                            color: 'rgba(255,255,255,.84)',
                            fontSize: 12,
                            fontWeight: 600,
                        }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                <Building2 size={13} />
                                {dashboard.company?.code ?? 'COMPANY'}
                            </span>
                            {dashboard.company?.industry && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                    <ShieldCheck size={13} />
                                    {dashboard.company.industry}
                                </span>
                            )}
                            {dashboard.company?.address && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                    <MapPin size={13} />
                                    {dashboard.company.address}
                                </span>
                            )}
                        </div>
                    </div>

                    <div style={{
                        display: 'grid',
                        gap: 10,
                        justifyItems: isDesktop ? 'end' : 'stretch',
                        minWidth: isDesktop ? 240 : undefined,
                    }}>
                        <div style={{
                            padding: '12px 14px',
                            borderRadius: 18,
                            background: 'rgba(255,255,255,.14)',
                            border: '1px solid rgba(255,255,255,.18)',
                            minWidth: isDesktop ? 220 : undefined,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                <div>
                                    <div style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.74)' }}>
                                        Pulse Hari Ini
                                    </div>
                                    <div style={{ marginTop: 4, fontSize: 20, fontWeight: 900 }}>
                                        {dashboard.todayStats.present} hadir
                                    </div>
                                    <div style={{ marginTop: 4, fontSize: 11.5, color: 'rgba(255,255,255,.76)' }}>
                                        {formatPercent(presentRate)} coverage • {dashboard.todayStats.ongoing} sesi aktif
                                    </div>
                                </div>
                                <div style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 14,
                                    background: 'rgba(255,255,255,.14)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <Activity size={20} />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: isDesktop ? 'flex-end' : 'flex-start' }}>
                            <button
                                type="button"
                                onClick={() => void loadDashboard(true)}
                                style={{
                                    height: 38,
                                    padding: '0 14px',
                                    borderRadius: 12,
                                    border: '1px solid rgba(255,255,255,.18)',
                                    background: 'rgba(255,255,255,.12)',
                                    color: '#fff',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 7,
                                    fontSize: 12,
                                    fontWeight: 800,
                                }}
                            >
                                <RefreshCcw size={14} style={refreshing ? { animation: 'spin 1s linear infinite' } : undefined} />
                                Refresh
                            </button>
                            <button
                                type="button"
                                onClick={() => onNavigate('attendance')}
                                style={{
                                    height: 38,
                                    padding: '0 14px',
                                    borderRadius: 12,
                                    border: '1px solid rgba(255,255,255,.18)',
                                    background: '#fff',
                                    color: '#0F4C81',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 7,
                                    fontSize: 12,
                                    fontWeight: 900,
                                }}
                            >
                                Buka Kehadiran
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{
                    position: 'relative',
                    display: 'grid',
                    gridTemplateColumns: isDesktop ? 'repeat(4, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))',
                    gap: 10,
                    marginTop: 16,
                }}>
                    {heroStats.map(item => (
                        <div key={item.label} style={{
                            padding: isDesktop ? '12px 14px' : '11px 12px',
                            borderRadius: 18,
                            background: 'rgba(255,255,255,.12)',
                            border: '1px solid rgba(255,255,255,.14)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                <div style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.74)' }}>{item.label}</div>
                                <item.icon size={14} color="#fff" />
                            </div>
                            <div style={{ marginTop: 8, fontSize: isDesktop ? 22 : 18, fontWeight: 900, lineHeight: 1 }}>
                                {item.value}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <div style={{
                display: 'grid',
                gridTemplateColumns: isDesktop ? 'repeat(4, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))',
                gap: 10,
            }}>
                {topCards.map(item => (
                    <button
                        key={item.label}
                        type="button"
                        onClick={() => onNavigate(item.nav)}
                        style={{
                            ...card,
                            textAlign: 'left',
                            padding: isDesktop ? '16px 16px 15px' : '14px 14px 13px',
                            cursor: 'pointer',
                            background: `linear-gradient(180deg, ${T.card} 0%, ${T.bgAlt} 100%)`,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                            <div style={{ fontSize: 10.5, fontWeight: 700, color: T.textMuted }}>{item.label}</div>
                            <div style={{
                                width: 34,
                                height: 34,
                                borderRadius: 12,
                                background: `${item.tone}14`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: item.tone,
                            }}>
                                <item.icon size={15} />
                            </div>
                        </div>
                        <div style={{ marginTop: 12, fontSize: isDesktop ? 24 : 20, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>
                            {item.value}
                        </div>
                        <div style={{ marginTop: 6, fontSize: 11, lineHeight: 1.55, color: T.textMuted }}>
                            {item.sub}
                        </div>
                    </button>
                ))}
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: isDesktop ? '1.45fr 1fr' : '1fr',
                gap: 12,
            }}>
                <section style={{ ...card, padding: isDesktop ? 18 : 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: 12,
                                    background: `${T.primary}14`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: T.primary,
                                }}>
                                    <TrendingUp size={16} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>
                                        Operational Pulse
                                    </div>
                                    <div style={{ fontSize: 11, color: T.textMuted }}>
                                        Insight real-time untuk absensi dan aktivitas hari ini
                                    </div>
                                </div>
                            </div>
                        </div>
                        <span style={{
                            padding: '6px 10px',
                            borderRadius: 999,
                            background: `${T.primary}10`,
                            color: T.primary,
                            fontSize: 10.5,
                            fontWeight: 800,
                            border: `1px solid ${T.primary}18`,
                        }}>
                            {formatDate(lastUpdated)}
                        </span>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: isDesktop ? 'repeat(4, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))',
                        gap: 10,
                        marginBottom: 14,
                    }}>
                        {[
                            { label: 'Coverage', value: formatPercent(presentRate), icon: Gauge, tone: T.primary },
                            { label: 'Selesai', value: formatPercent(completionRate), icon: CheckCircle2, tone: T.success },
                            { label: 'Kantor', value: formatPercent(officeRate), icon: Landmark, tone: T.info },
                            { label: 'Lapangan', value: formatPercent(fieldRate), icon: MapPin, tone: T.gold },
                        ].map(item => (
                            <div key={item.label} style={{
                                borderRadius: 18,
                                border: `1px solid ${T.border}`,
                                background: T.bgAlt,
                                padding: isDesktop ? '13px 14px' : '12px 12px',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                    <div style={{ fontSize: 10.5, fontWeight: 700, color: T.textMuted }}>{item.label}</div>
                                    <item.icon size={14} color={item.tone} />
                                </div>
                                <div style={{ marginTop: 10, fontSize: isDesktop ? 24 : 20, fontWeight: 900, color: T.text }}>
                                    {item.value}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gap: 10 }}>
                        {progressRows.map(row => {
                            const percent = row.total > 0 ? Math.min(100, (row.value / row.total) * 100) : 0;
                            return (
                                <div key={row.label} style={{
                                    borderRadius: 16,
                                    border: `1px solid ${T.border}`,
                                    background: T.bgAlt,
                                    padding: '12px 14px',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                        <div>
                                            <div style={{ fontSize: 12, fontWeight: 800, color: T.text }}>{row.label}</div>
                                            <div style={{ marginTop: 4, fontSize: 10.5, color: T.textMuted }}>{row.helper}</div>
                                        </div>
                                        <div style={{ fontSize: 12.5, fontWeight: 900, color: row.tone }}>
                                            {formatPercent(percent)}
                                        </div>
                                    </div>
                                    <div style={{
                                        marginTop: 10,
                                        height: 8,
                                        borderRadius: 999,
                                        background: `${row.tone}12`,
                                        overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            width: `${percent}%`,
                                            height: '100%',
                                            borderRadius: 999,
                                            background: `linear-gradient(90deg, ${row.tone}, ${row.tone}BB)`,
                                        }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{
                        marginTop: 12,
                        padding: '12px 14px',
                        borderRadius: 16,
                        background: dashboard.todayStats.ongoing > 0 ? `${T.gold}10` : `${T.success}10`,
                        border: `1px solid ${dashboard.todayStats.ongoing > 0 ? `${T.gold}20` : `${T.success}20`}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                    }}>
                        <AlertTriangle size={16} color={dashboard.todayStats.ongoing > 0 ? T.gold : T.success} />
                        <div style={{ fontSize: 11.5, color: T.textSub, lineHeight: 1.55 }}>
                            {dashboard.todayStats.ongoing > 0
                                ? `${dashboard.todayStats.ongoing} sesi masih berjalan. Fokuskan follow-up ke panel Kehadiran untuk memastikan check-out tepat waktu.`
                                : 'Semua sesi hari ini sudah clean. Dashboard menunjukkan operasional absensi dalam kondisi aman.'}
                        </div>
                    </div>
                </section>

                <div style={{ display: 'grid', gap: 12 }}>
                    <section style={{ ...card, padding: isDesktop ? 18 : 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                            <div style={{
                                width: 34,
                                height: 34,
                                borderRadius: 12,
                                background: `${T.success}14`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: T.success,
                            }}>
                                <Zap size={16} />
                            </div>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>
                                    Control Center
                                </div>
                                <div style={{ fontSize: 11, color: T.textMuted }}>
                                    Aksi cepat dan indikator yang perlu perhatian
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gap: 8 }}>
                            {quickActions.map(action => (
                                <button
                                    key={action.label}
                                    type="button"
                                    onClick={() => onNavigate(action.nav)}
                                    style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        padding: '12px 12px',
                                        borderRadius: 16,
                                        border: `1px solid ${action.tone}20`,
                                        background: `${action.tone}08`,
                                    }}
                                >
                                    <div style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 12,
                                        background: `${action.tone}16`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: action.tone,
                                        flexShrink: 0,
                                    }}>
                                        <action.icon size={16} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 12.5, fontWeight: 800, color: T.text }}>{action.label}</div>
                                        <div style={{ marginTop: 2, fontSize: 10.5, color: T.textMuted }}>{action.desc}</div>
                                    </div>
                                    <ArrowRight size={14} color={action.tone} />
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                            {insightItems.map(item => (
                                <div key={item.label} style={{
                                    padding: '12px 12px',
                                    borderRadius: 16,
                                    border: `1px solid ${T.border}`,
                                    background: T.bgAlt,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                        <div style={{ fontSize: 10.5, fontWeight: 700, color: T.textMuted }}>{item.label}</div>
                                        <div style={{ fontSize: 13, fontWeight: 900, color: item.tone }}>{item.value}</div>
                                    </div>
                                    <div style={{ marginTop: 4, fontSize: 10.5, lineHeight: 1.5, color: T.textSub }}>
                                        {item.desc}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: isDesktop ? '1.25fr 1fr' : '1fr',
                gap: 12,
            }}>
                <section style={{ ...card, padding: isDesktop ? 18 : 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                                width: 34,
                                height: 34,
                                borderRadius: 12,
                                background: `${T.primary}14`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: T.primary,
                            }}>
                                <Clock3 size={16} />
                            </div>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>
                                    Live Attendance
                                </div>
                                <div style={{ fontSize: 11, color: T.textMuted }}>
                                    Snapshot kehadiran terbaru hari ini
                                </div>
                            </div>
                        </div>
                        <button onClick={() => onNavigate('attendance')} style={{ fontSize: 11, fontWeight: 800, color: T.primary }}>
                            Lihat Semua
                        </button>
                    </div>

                    {dashboard.recentAttendance.length === 0 ? (
                        <div style={{
                            padding: '28px 16px',
                            borderRadius: 18,
                            border: `1px dashed ${T.border}`,
                            background: T.bgAlt,
                            textAlign: 'center',
                            fontSize: 12,
                            color: T.textMuted,
                        }}>
                            Belum ada absensi yang tercatat hari ini.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: 8 }}>
                            {dashboard.recentAttendance.map(record => (
                                <div key={record.id} style={{
                                    padding: '12px 12px',
                                    borderRadius: 18,
                                    border: `1px solid ${T.border}`,
                                    background: T.bgAlt,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                }}>
                                    <div style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 14,
                                        background: `${T.primary}14`,
                                        color: T.primary,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 900,
                                        fontSize: 14,
                                        flexShrink: 0,
                                    }}>
                                        {(record.employee_name ?? 'U').charAt(0).toUpperCase()}
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                            <div style={{ fontSize: 12.5, fontWeight: 800, color: T.text }}>
                                                {record.employee_name ?? 'Unknown'}
                                            </div>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: 999,
                                                background: `${record.attendance_mode_in === 'field' ? T.gold : T.info}12`,
                                                color: record.attendance_mode_in === 'field' ? T.gold : T.info,
                                                fontSize: 9.5,
                                                fontWeight: 800,
                                            }}>
                                                {modeLabel(record.attendance_mode_in)}
                                            </span>
                                        </div>
                                        <div style={{ marginTop: 3, fontSize: 10.5, color: T.textMuted }}>
                                            {record.branch_name ?? 'Tanpa lokasi'} • {record.time_in ?? '—'} / {record.time_out ?? 'Belum keluar'}
                                        </div>
                                    </div>

                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{
                                            fontSize: 10.5,
                                            fontWeight: 800,
                                            color: record.time_out ? T.success : T.gold,
                                        }}>
                                            {record.time_out ? 'Selesai' : 'Ongoing'}
                                        </div>
                                        <div style={{ marginTop: 3, fontSize: 10, color: T.textMuted }}>
                                            {formatRelative(record.date)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section style={{ ...card, padding: isDesktop ? 18 : 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                                width: 34,
                                height: 34,
                                borderRadius: 12,
                                background: `${T.info}14`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: T.info,
                            }}>
                                <FileText size={16} />
                            </div>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>
                                    Report Inbox
                                </div>
                                <div style={{ fontSize: 11, color: T.textMuted }}>
                                    Laporan terbaru dari karyawan
                                </div>
                            </div>
                        </div>
                        <button onClick={() => onNavigate('report')} style={{ fontSize: 11, fontWeight: 800, color: T.primary }}>
                            Buka Laporan
                        </button>
                    </div>

                    {dashboard.recentReports.length === 0 ? (
                        <div style={{
                            padding: '28px 16px',
                            borderRadius: 18,
                            border: `1px dashed ${T.border}`,
                            background: T.bgAlt,
                            textAlign: 'center',
                            fontSize: 12,
                            color: T.textMuted,
                        }}>
                            Belum ada laporan terbaru untuk periode ini.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: 8 }}>
                            {dashboard.recentReports.map(report => (
                                <div key={report.id} style={{
                                    padding: '12px 12px',
                                    borderRadius: 18,
                                    border: `1px solid ${T.border}`,
                                    background: T.bgAlt,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: 12.5, fontWeight: 800, color: T.text }}>
                                                {report.title}
                                            </div>
                                            <div style={{ marginTop: 4, fontSize: 10.5, color: T.textMuted }}>
                                                {report.employee_name ?? 'Karyawan'} • {report.branch_name ?? 'Tanpa lokasi'}
                                            </div>
                                        </div>
                                        <span style={{
                                            flexShrink: 0,
                                            padding: '4px 8px',
                                            borderRadius: 999,
                                            background: `${T.info}12`,
                                            color: T.info,
                                            fontSize: 9.5,
                                            fontWeight: 800,
                                        }}>
                                            {report.attachments.length} file
                                        </span>
                                    </div>
                                    <div style={{
                                        marginTop: 8,
                                        fontSize: 10.5,
                                        lineHeight: 1.55,
                                        color: T.textSub,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                    }}>
                                        {report.description}
                                    </div>
                                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                        <div style={{ fontSize: 10, color: T.textMuted }}>
                                            {formatDateTime(report.created_at)}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: T.textMuted }}>
                                            <Paperclip size={12} />
                                            {report.attachments.length > 0 ? 'Ada lampiran' : 'Tanpa lampiran'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <section style={{
                ...card,
                padding: isDesktop ? '12px 16px' : '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                flexWrap: 'wrap',
                background: `linear-gradient(180deg, ${T.card} 0%, ${T.bgAlt} 100%)`,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', color: T.textMuted, fontSize: 10.5 }}>
                    <CalendarDays size={12} color={T.primary} />
                    <span>{new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}</span>
                    <span style={{ opacity: 0.35 }}>•</span>
                    <span>{dashboard.teamStats?.admins ?? 0} admin</span>
                    <span style={{ opacity: 0.35 }}>•</span>
                    <span>{dashboard.teamStats?.employees ?? activeAttendanceUsers} employee</span>
                    <span style={{ opacity: 0.35 }}>•</span>
                    <span>{geofenceReady.length}/{activeLocations.length || 0} lokasi siap geofence</span>
                </div>
                <div style={{ fontSize: 10, color: T.textMuted }}>
                    Diperbarui {lastUpdated ? formatRelative(lastUpdated) : 'baru saja'}
                </div>
            </section>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
