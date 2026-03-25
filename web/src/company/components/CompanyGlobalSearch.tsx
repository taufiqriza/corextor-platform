import { useEffect, useMemo, useRef, useState } from 'react';
import {
    ClipboardList,
    FileText,
    Loader2,
    MapPin,
    Receipt,
    Search,
    Settings,
    UserCircle,
    Users,
    X,
    type LucideIcon,
} from 'lucide-react';
import { attendanceApi, platformApi } from '@/api/platform.api';
import type { EmployeeReportItem } from '@/types/attendance.types';
import type { Theme } from '@/theme/tokens';
import { useAuthStore } from '@/store/authStore';

type NavKey =
    | 'dashboard'
    | 'employees'
    | 'attendance'
    | 'branches'
    | 'report'
    | 'payroll'
    | 'invoices'
    | 'settings'
    | 'profile';

type SearchKind = 'nav' | 'employee' | 'location' | 'report' | 'invoice';

type SearchResult = {
    id: string;
    type: SearchKind;
    navKey: NavKey;
    label: string;
    sub: string;
    badge?: string;
    keywords: string[];
};

type AttendanceUserSearchItem = {
    id: number;
    platform_user_id?: number;
    status?: string;
    branch?: { name?: string | null } | null;
    platform_user?: { name?: string | null; email?: string | null } | null;
};

type BranchSearchItem = {
    id: number;
    name: string;
    location?: string | null;
    radius_meters?: number | null;
    status?: string;
};

type InvoiceSearchItem = {
    id: number;
    invoice_number: string;
    status: string;
    amount_total: number;
    due_at?: string | null;
    issued_at?: string | null;
};

type Props = {
    T: Theme;
    onNavigate: (navKey: NavKey) => void;
    isMobile?: boolean;
};

const NAV_RESULTS: SearchResult[] = [
    {
        id: 'nav-dashboard',
        type: 'nav',
        navKey: 'dashboard',
        label: 'Dashboard',
        sub: 'Ringkasan perusahaan, statistik, dan aktivitas terbaru',
        keywords: ['dashboard', 'home', 'ringkasan', 'overview', 'utama'],
    },
    {
        id: 'nav-employees',
        type: 'nav',
        navKey: 'employees',
        label: 'Karyawan',
        sub: 'Data karyawan, PIN, branch, dan akun attendance',
        keywords: ['karyawan', 'employee', 'pegawai', 'pin', 'users'],
    },
    {
        id: 'nav-attendance',
        type: 'nav',
        navKey: 'attendance',
        label: 'Kehadiran',
        sub: 'Absensi kantor dan lapangan, selfie, lokasi, dan koreksi',
        keywords: ['attendance', 'kehadiran', 'absensi', 'selfie', 'lokasi'],
    },
    {
        id: 'nav-branches',
        type: 'nav',
        navKey: 'branches',
        label: 'Lokasi',
        sub: 'Titik kantor, cabang, geofence, dan radius kerja',
        keywords: ['lokasi', 'branch', 'cabang', 'kantor', 'geofence'],
    },
    {
        id: 'nav-report',
        type: 'nav',
        navKey: 'report',
        label: 'Laporan',
        sub: 'Laporan karyawan, lampiran, dan tindak lanjut',
        keywords: ['laporan', 'report', 'attachment', 'lampiran'],
    },
    {
        id: 'nav-payroll',
        type: 'nav',
        navKey: 'payroll',
        label: 'Payroll',
        sub: 'Payroll profile, komponen gaji, payroll run, dan snapshot attendance',
        keywords: ['payroll', 'gaji', 'salary', 'komponen', 'run'],
    },
    {
        id: 'nav-invoices',
        type: 'nav',
        navKey: 'invoices',
        label: 'Tagihan',
        sub: 'Invoice subscription, pembayaran, dan histori billing',
        keywords: ['tagihan', 'invoice', 'billing', 'payment'],
    },
    {
        id: 'nav-settings',
        type: 'nav',
        navKey: 'settings',
        label: 'Pengaturan',
        sub: 'Konfigurasi perusahaan dan preferensi portal',
        keywords: ['setting', 'pengaturan', 'konfigurasi'],
    },
    {
        id: 'nav-profile',
        type: 'nav',
        navKey: 'profile',
        label: 'Profil Personal',
        sub: 'Kelola akun admin perusahaan dan password',
        keywords: ['profil', 'profile', 'akun', 'password', 'admin'],
    },
];

const GROUP_META: Record<SearchKind, { label: string; icon: LucideIcon; tone: string }> = {
    nav: { label: 'Navigasi', icon: Search, tone: '#2563EB' },
    employee: { label: 'Karyawan', icon: Users, tone: '#0F766E' },
    location: { label: 'Lokasi', icon: MapPin, tone: '#0284C7' },
    report: { label: 'Laporan', icon: FileText, tone: '#7C3AED' },
    invoice: { label: 'Tagihan', icon: Receipt, tone: '#C2410C' },
};

function normalize(value: string): string {
    return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
}

function formatShortDate(value?: string | null): string {
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

function invoiceStatusLabel(status: string): string {
    switch (status) {
        case 'paid': return 'Lunas';
        case 'pending': return 'Menunggu';
        case 'overdue': return 'Jatuh tempo';
        case 'cancelled': return 'Dibatalkan';
        default: return status;
    }
}

function attendanceStatusLabel(status?: string): string {
    if (!status) return 'Attendance';
    return status === 'active' ? 'Aktif' : status;
}

function getMatchScore(result: SearchResult, query: string): number {
    const q = normalize(query);
    if (!q) return result.type === 'nav' ? 120 : 0;

    const label = normalize(result.label);
    const sub = normalize(result.sub);
    const keywords = normalize(result.keywords.join(' '));
    const haystack = `${label} ${sub} ${keywords}`;
    const tokens = q.split(' ').filter(Boolean);

    if (!tokens.every(token => haystack.includes(token))) {
        return 0;
    }

    let score = 0;
    for (const token of tokens) {
        if (label === token) score += 140;
        else if (label.startsWith(token)) score += 96;
        else if (label.includes(token)) score += 68;

        if (keywords.includes(token)) score += 34;
        if (sub.includes(token)) score += 18;
    }

    if (result.type === 'nav') score += 12;
    if (result.label.length < 24) score += 4;

    return score;
}

async function fetchReportPool(): Promise<EmployeeReportItem[]> {
    const first = await attendanceApi.getCompanyReports({ per_page: 50, page: 1 });
    const payload = first.data?.data;
    const items = payload?.pagination.data ?? [];
    const lastPage = Math.min(payload?.pagination.last_page ?? 1, 3);

    if (lastPage <= 1) {
        return items;
    }

    const rest = await Promise.allSettled(
        Array.from({ length: lastPage - 1 }, (_, index) =>
            attendanceApi.getCompanyReports({ per_page: 50, page: index + 2 }),
        ),
    );

    for (const result of rest) {
        if (result.status === 'fulfilled') {
            items.push(...(result.value.data?.data?.pagination.data ?? []));
        }
    }

    return items;
}

export function CompanyGlobalSearch({ T, onNavigate, isMobile = false }: Props) {
    const user = useAuthStore(state => state.user);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [hydrated, setHydrated] = useState(false);
    const [users, setUsers] = useState<AttendanceUserSearchItem[]>([]);
    const [locations, setLocations] = useState<BranchSearchItem[]>([]);
    const [reports, setReports] = useState<EmployeeReportItem[]>([]);
    const [invoices, setInvoices] = useState<InvoiceSearchItem[]>([]);
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [panelMetrics, setPanelMetrics] = useState({ top: 84, left: 18, width: 640, maxHeight: 520 });

    const anchorRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const shortcutLabel = /Mac|iPhone|iPad/.test(window.navigator.platform) ? '⌘K' : 'Ctrl K';
    const hasPayroll = user?.active_products?.includes('payroll') ?? false;

    const openSearch = () => setOpen(true);
    const closeSearch = () => setOpen(false);

    useEffect(() => {
        if (!open) return;

        const updateMetrics = () => {
            const margin = isMobile ? 12 : 18;
            const rect = anchorRef.current?.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            if (!rect) {
                const fallbackWidth = Math.min(isMobile ? viewportWidth - (margin * 2) : 340, viewportWidth - (margin * 2));
                const fallbackLeft = Math.max(margin, (viewportWidth - fallbackWidth) / 2);
                const fallbackTop = margin + 64;
                setPanelMetrics({
                    top: fallbackTop,
                    left: fallbackLeft,
                    width: fallbackWidth,
                    maxHeight: Math.max(280, viewportHeight - fallbackTop - margin),
                });
                return;
            }

            const desiredWidth = isMobile
                ? Math.min(viewportWidth - (margin * 2), 380)
                : Math.min(Math.max(rect.width + 140, 460), 560, viewportWidth - (margin * 2));

            const nextLeft = isMobile
                ? Math.max(margin, (viewportWidth - desiredWidth) / 2)
                : Math.min(
                    Math.max(rect.right - desiredWidth - 140, margin),
                    viewportWidth - desiredWidth - margin,
                );

            const nextTop = Math.max(margin, rect.bottom + 10);

            setPanelMetrics({
                top: nextTop,
                left: nextLeft,
                width: desiredWidth,
                maxHeight: Math.max(280, viewportHeight - nextTop - margin),
            });
        };

        updateMetrics();
        window.addEventListener('resize', updateMetrics);
        window.addEventListener('scroll', updateMetrics, true);
        return () => {
            window.removeEventListener('resize', updateMetrics);
            window.removeEventListener('scroll', updateMetrics, true);
        };
    }, [isMobile, open]);

    useEffect(() => {
        const handleShortcut = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                setOpen(true);
            }
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        window.addEventListener('keydown', handleShortcut);
        return () => window.removeEventListener('keydown', handleShortcut);
    }, []);

    useEffect(() => {
        if (!open) {
            setQuery('');
            setSelectedIdx(0);
            return;
        }

        const previousOverflow = document.body.style.overflow;
        if (isMobile) {
            document.body.style.overflow = 'hidden';
        }
        window.setTimeout(() => inputRef.current?.focus(), 40);

        if (!hydrated) {
            setLoading(true);
            void Promise.allSettled([
                attendanceApi.getUsers(),
                attendanceApi.getBranches(),
                fetchReportPool(),
                platformApi.getMyInvoices(),
            ]).then(([usersResult, locationsResult, reportsResult, invoicesResult]) => {
                if (usersResult.status === 'fulfilled') {
                    setUsers(usersResult.value.data?.data ?? []);
                }
                if (locationsResult.status === 'fulfilled') {
                    setLocations(locationsResult.value.data?.data ?? []);
                }
                if (reportsResult.status === 'fulfilled') {
                    setReports(reportsResult.value);
                }
                if (invoicesResult.status === 'fulfilled') {
                    setInvoices(invoicesResult.value.data?.data?.invoices ?? []);
                }
                setHydrated(true);
                setLoading(false);
            });
        }

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [hydrated, isMobile, open]);

    useEffect(() => {
        if (!open) return;

        const handlePointerDown = (event: MouseEvent | TouchEvent) => {
            const target = event.target as Node;
            if (anchorRef.current?.contains(target) || panelRef.current?.contains(target)) {
                return;
            }
            closeSearch();
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('touchstart', handlePointerDown);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('touchstart', handlePointerDown);
        };
    }, [open]);

    const dynamicResults = useMemo<SearchResult[]>(() => {
        const employeeResults = users.map(user => ({
            id: `employee-${user.id}`,
            type: 'employee' as const,
            navKey: 'employees' as const,
            label: user.platform_user?.name?.trim() || `Karyawan #${user.platform_user_id ?? user.id}`,
            sub: [
                user.platform_user?.email?.trim() || 'Tanpa email',
                user.branch?.name?.trim() || 'Tanpa lokasi',
                attendanceStatusLabel(user.status),
            ].join(' • '),
            badge: user.branch?.name?.trim() || 'Karyawan',
            keywords: [
                'karyawan',
                'employee',
                user.platform_user?.name || '',
                user.platform_user?.email || '',
                user.branch?.name || '',
                String(user.platform_user_id ?? ''),
            ],
        }));

        const locationResults = locations.map(location => ({
            id: `location-${location.id}`,
            type: 'location' as const,
            navKey: 'branches' as const,
            label: location.name,
            sub: [
                location.location?.trim() || 'Tanpa alamat',
                location.radius_meters ? `Radius ${location.radius_meters} m` : 'Tanpa radius',
                location.status === 'active' ? 'Aktif' : location.status ?? 'Status',
            ].join(' • '),
            badge: 'Lokasi',
            keywords: [
                'lokasi',
                'kantor',
                'branch',
                'cabang',
                location.name,
                location.location || '',
            ],
        }));

        const reportResults = reports.map(report => ({
            id: `report-${report.id}`,
            type: 'report' as const,
            navKey: 'report' as const,
            label: report.title,
            sub: [
                report.employee_name?.trim() || 'Karyawan',
                report.branch_name?.trim() || 'Tanpa lokasi',
                formatShortDate(report.report_date),
            ].join(' • '),
            badge: report.branch_name?.trim() || 'Laporan',
            keywords: [
                'laporan',
                'report',
                report.title,
                report.description,
                report.employee_name || '',
                report.employee_email || '',
                report.branch_name || '',
            ],
        }));

        const invoiceResults = invoices.map(invoice => ({
            id: `invoice-${invoice.id}`,
            type: 'invoice' as const,
            navKey: 'invoices' as const,
            label: invoice.invoice_number,
            sub: [
                invoiceStatusLabel(invoice.status),
                formatCurrency(invoice.amount_total),
                formatShortDate(invoice.due_at || invoice.issued_at),
            ].join(' • '),
            badge: invoiceStatusLabel(invoice.status),
            keywords: [
                'tagihan',
                'invoice',
                'billing',
                invoice.invoice_number,
                invoice.status,
                String(invoice.amount_total),
            ],
        }));

        return [...employeeResults, ...locationResults, ...reportResults, ...invoiceResults];
    }, [invoices, locations, reports, users]);

    const visibleResults = useMemo(() => {
        const navResults = hasPayroll
            ? NAV_RESULTS
            : NAV_RESULTS.filter(result => result.navKey !== 'payroll');
        const pool = [...navResults, ...dynamicResults];
        const scored = pool
            .map(result => ({ result, score: getMatchScore(result, query) }))
            .filter(entry => entry.score > 0)
            .sort((a, b) => b.score - a.score);

        return scored.slice(0, query.trim() ? 18 : 8).map(entry => entry.result);
    }, [dynamicResults, hasPayroll, query]);

    const groupedResults = useMemo(() => {
        return visibleResults.reduce<Partial<Record<SearchKind, SearchResult[]>>>((acc, result) => {
            if (!acc[result.type]) {
                acc[result.type] = [];
            }
            acc[result.type]?.push(result);
            return acc;
        }, {});
    }, [visibleResults]);

    useEffect(() => {
        setSelectedIdx(visibleResults.length > 0 ? 0 : -1);
    }, [query, visibleResults.length]);

    const handleSelect = (result: SearchResult) => {
        onNavigate(result.navKey);
        closeSearch();
    };

    const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (!visibleResults.length) {
            if (event.key === 'Escape') {
                closeSearch();
            }
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setSelectedIdx(current => Math.min(current + 1, visibleResults.length - 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setSelectedIdx(current => Math.max(current - 1, 0));
        } else if (event.key === 'Enter') {
            event.preventDefault();
            const target = visibleResults[selectedIdx] ?? visibleResults[0];
            if (target) {
                handleSelect(target);
            }
        } else if (event.key === 'Escape') {
            event.preventDefault();
            closeSearch();
        }
    };

    const trigger = (
        <div
            ref={anchorRef}
            style={{
                position: 'relative',
                width: isMobile ? 'auto' : 320,
                flexShrink: 0,
            }}
        >
            {isMobile ? (
                <button
                    type="button"
                    onClick={openSearch}
                    aria-label="Buka global search"
                    style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        border: `1px solid ${T.border}`,
                        background: T.card,
                        color: T.textSub,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: T.shadowSm,
                    }}
                >
                    <Search size={15} />
                </button>
            ) : open ? (
                <div
                    style={{
                        width: '100%',
                        height: 40,
                        borderRadius: 12,
                        border: `1px solid ${T.primary}40`,
                        background: T.card,
                        color: T.text,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '0 10px 0 12px',
                        boxShadow: T.shadowSm,
                    }}
                >
                    <Search size={15} color={T.primary} />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={event => setQuery(event.target.value)}
                        onKeyDown={handleInputKeyDown}
                        placeholder="Cari menu, karyawan, lokasi, laporan..."
                        style={{
                            flex: 1,
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            color: T.text,
                            fontSize: 12.5,
                            fontWeight: 700,
                            padding: 0,
                            minWidth: 0,
                        }}
                    />
                    <button
                        type="button"
                        onClick={closeSearch}
                        aria-label="Tutup search"
                        style={{
                            width: 22,
                            height: 22,
                            borderRadius: 7,
                            border: `1px solid ${T.border}`,
                            background: T.bgAlt,
                            color: T.textMuted,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <X size={12} />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={openSearch}
                    aria-label="Buka global search"
                    style={{
                        width: '100%',
                        height: 40,
                        borderRadius: 12,
                        border: `1px solid ${T.border}`,
                        background: T.card,
                        color: T.textMuted,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '0 12px',
                        boxShadow: T.shadowSm,
                    }}
                >
                    <Search size={15} color={T.primary} />
                    <span style={{ flex: 1, textAlign: 'left', fontSize: 12.5, fontWeight: 600 }}>
                        Cari data...
                    </span>
                    <kbd style={{
                        minWidth: 46,
                        height: 22,
                        borderRadius: 7,
                        border: `1px solid ${T.border}`,
                        background: T.bgAlt,
                        color: T.textMuted,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 800,
                        fontFamily: 'inherit',
                        padding: '0 7px',
                    }}>
                        {shortcutLabel}
                    </kbd>
                </button>
            )}
        </div>
    );

    return (
        <>
            {trigger}

            {open && (
                <div
                    ref={panelRef}
                    style={{
                        position: 'fixed',
                        top: panelMetrics.top,
                        left: panelMetrics.left,
                        width: panelMetrics.width,
                        maxWidth: `calc(100vw - ${isMobile ? 24 : 36}px)`,
                        maxHeight: panelMetrics.maxHeight,
                        zIndex: 9999,
                        borderRadius: isMobile ? 22 : 20,
                        border: `1px solid ${T.border}`,
                        background: T.card,
                        boxShadow: `0 22px 64px rgba(2,8,23,.18), 0 0 0 1px ${T.border}`,
                        overflow: 'hidden',
                    }}
                >
                        {isMobile && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '14px 14px 12px',
                                borderBottom: `1px solid ${T.border}`,
                                background: `linear-gradient(180deg, ${T.bgAlt} 0%, ${T.card} 100%)`,
                            }}>
                                <Search size={16} color={T.primary} />
                                <input
                                    ref={inputRef}
                                    value={query}
                                    onChange={event => setQuery(event.target.value)}
                                    onKeyDown={handleInputKeyDown}
                                    placeholder="Cari menu, karyawan, lokasi..."
                                    style={{
                                        flex: 1,
                                        border: 'none',
                                        outline: 'none',
                                        background: 'transparent',
                                        color: T.text,
                                        fontSize: 14,
                                        fontWeight: 800,
                                        padding: 0,
                                        minWidth: 0,
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={closeSearch}
                                    aria-label="Tutup search"
                                    style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: 9,
                                        border: `1px solid ${T.border}`,
                                        background: T.bgAlt,
                                        color: T.textMuted,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}

                        <div style={{
                            padding: isMobile ? '10px 14px' : '9px 12px',
                            borderBottom: `1px solid ${T.border}`,
                            background: isMobile ? `${T.primary}06` : T.bgAlt,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                        }}>
                            <div style={{ fontSize: 10.5, color: T.textMuted, fontWeight: 700 }}>
                                {query.trim() ? `${visibleResults.length} hasil` : 'Shortcut cepat'}
                            </div>
                            {!isMobile && (
                                <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700 }}>
                                    ↑↓ pilih • Enter buka • Esc tutup
                                </div>
                            )}
                        </div>

                        <div style={{
                            maxHeight: Math.max(180, panelMetrics.maxHeight - (isMobile ? 154 : 96)),
                            overflowY: 'auto',
                            padding: loading || visibleResults.length ? '8px 0' : '22px 16px 24px',
                        }}>
                            {loading ? (
                                <div style={{
                                    minHeight: 180,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 10,
                                    color: T.textMuted,
                                }}>
                                    <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
                                    <div style={{ fontSize: 12, fontWeight: 700 }}>
                                        Menyiapkan indeks pencarian...
                                    </div>
                                </div>
                            ) : visibleResults.length === 0 ? (
                                <div style={{
                                    minHeight: 180,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textAlign: 'center',
                                    gap: 10,
                                    color: T.textMuted,
                                }}>
                                    <div style={{
                                        width: 54,
                                        height: 54,
                                        borderRadius: 18,
                                        background: `${T.primary}10`,
                                        color: T.primary,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <Search size={22} />
                                    </div>
                                    <div style={{ fontSize: 15, fontWeight: 900, color: T.text }}>
                                        Tidak ada hasil
                                    </div>
                                    <div style={{ maxWidth: 360, fontSize: 12, lineHeight: 1.6 }}>
                                        Coba kata kunci lain seperti nama karyawan, lokasi kantor, judul laporan, atau nomor invoice.
                                    </div>
                                </div>
                            ) : (
                                (['nav', 'employee', 'location', 'report', 'invoice'] as SearchKind[]).map(groupKey => {
                                    const group = groupedResults[groupKey];
                                    if (!group?.length) return null;

                                    const meta = GROUP_META[groupKey];
                                    const Icon = meta.icon;

                                    return (
                                        <div key={groupKey} style={{ padding: '0 8px 4px' }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                padding: '4px 6px 7px',
                                            }}>
                                                <div style={{
                                                    width: 22,
                                                    height: 22,
                                                    borderRadius: 7,
                                                    background: `${meta.tone}14`,
                                                    color: meta.tone,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}>
                                                    <Icon size={12} />
                                                </div>
                                                <div style={{ fontSize: 10, fontWeight: 900, color: T.textMuted, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                                                    {meta.label}
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gap: 5 }}>
                                                {group.map(result => {
                                                    const isSelected = visibleResults[selectedIdx]?.id === result.id;
                                                    return (
                                                        <button
                                                            key={result.id}
                                                            type="button"
                                                            onMouseEnter={() => {
                                                                const index = visibleResults.findIndex(item => item.id === result.id);
                                                                if (index >= 0) setSelectedIdx(index);
                                                            }}
                                                            onClick={() => handleSelect(result)}
                                                            style={{
                                                                width: '100%',
                                                                textAlign: 'left',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 10,
                                                                padding: isMobile ? '11px 11px' : '10px 12px',
                                                                borderRadius: 14,
                                                                border: `1px solid ${isSelected ? `${T.primary}40` : T.border}`,
                                                                background: isSelected ? `${T.primary}0E` : T.card,
                                                                boxShadow: isSelected ? T.shadowSm : 'none',
                                                                transition: 'all .14s ease',
                                                            }}
                                                        >
                                                            <div style={{
                                                                width: isMobile ? 34 : 36,
                                                                height: isMobile ? 34 : 36,
                                                                borderRadius: 11,
                                                                background: isSelected ? `${meta.tone}16` : `${T.primary}0C`,
                                                                color: isSelected ? meta.tone : T.primary,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                flexShrink: 0,
                                                            }}>
                                                                <Icon size={16} />
                                                            </div>

                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 8,
                                                                    justifyContent: 'space-between',
                                                                }}>
                                                                    <div style={{
                                                                        fontSize: 12.5,
                                                                        fontWeight: 800,
                                                                        color: T.text,
                                                                        whiteSpace: 'nowrap',
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                    }}>
                                                                        {result.label}
                                                                    </div>
                                                                    {result.badge && (
                                                                        <span style={{
                                                                            flexShrink: 0,
                                                                            fontSize: 9,
                                                                            fontWeight: 800,
                                                                            color: meta.tone,
                                                                            padding: '3px 7px',
                                                                            borderRadius: 999,
                                                                            background: `${meta.tone}10`,
                                                                            border: `1px solid ${meta.tone}18`,
                                                                        }}>
                                                                            {result.badge}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div style={{
                                                                    marginTop: 3,
                                                                    fontSize: 10.5,
                                                                    color: T.textMuted,
                                                                    lineHeight: 1.5,
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                }}>
                                                                    {result.sub}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div style={{
                            padding: isMobile ? '10px 12px' : '9px 12px',
                            borderTop: `1px solid ${T.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                            flexWrap: 'wrap',
                            background: T.bgAlt,
                        }}>
                            <div style={{ fontSize: 10.5, color: T.textMuted, fontWeight: 700 }}>
                                Menu, karyawan, lokasi, laporan, dan tagihan
                            </div>
                            {!isMobile && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: T.textMuted }}>
                                    <Users size={12} />
                                    <MapPin size={12} />
                                    <FileText size={12} />
                                    <Receipt size={12} />
                                    <Settings size={12} />
                                    <UserCircle size={12} />
                                    <ClipboardList size={12} />
                                </div>
                            )}
                        </div>
                </div>
            )}
        </>
    );
}
