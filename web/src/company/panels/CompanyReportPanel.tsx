import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Clock3,
    File as FileIcon,
    FileText,
    Image as ImageIcon,
    Loader2,
    Paperclip,
    RefreshCcw,
    Search,
    Users,
    X,
} from 'lucide-react';
import { attendanceApi } from '@/api/platform.api';
import { downloadEmployeeReportAttachment } from '@/lib/downloadEmployeeReportAttachment';
import type { Theme } from '@/theme/tokens';
import type {
    CompanyEmployeeReportPayload,
    EmployeeReportAttachment,
    EmployeeReportItem,
} from '@/types/attendance.types';

interface Props {
    T: Theme;
    isDesktop: boolean;
    companyContextId?: number;
}

const PER_PAGE = 15;

function formatDate(value?: string): string {
    if (!value) return '-';
    try {
        return new Date(value).toLocaleDateString('id-ID', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return value;
    }
}

function formatTime(value?: string): string {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return value;
    }
}

export function CompanyReportPanel({ T, isDesktop, companyContextId }: Props) {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = today.slice(0, 8) + '01';

    const [payload, setPayload] = useState<CompanyEmployeeReportPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [dateFrom, setDateFrom] = useState(monthStart);
    const [dateTo, setDateTo] = useState(today);
    const [page, setPage] = useState(1);
    const [selectedReport, setSelectedReport] = useState<EmployeeReportItem | null>(null);

    const loadReports = async (targetPage = page) => {
        setLoading(true);
        try {
            const res = await attendanceApi.getCompanyReports({
                from: dateFrom,
                to: dateTo,
                per_page: PER_PAGE,
                page: targetPage,
            }, companyContextId);
            setPayload(res.data?.data ?? null);
        } catch {
            setPayload(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadReports(page);
    }, [companyContextId, dateFrom, dateTo, page]);

    const reports = payload?.pagination.data ?? [];
    const stats = payload?.stats ?? {
        total: 0,
        today: 0,
        with_attachments: 0,
        employees: 0,
    };
    const pagination = payload?.pagination ?? {
        current_page: 1,
        per_page: PER_PAGE,
        total: 0,
        last_page: 1,
        data: [],
    };

    const filteredReports = useMemo(() => {
        if (!search.trim()) return reports;
        const q = search.toLowerCase();
        return reports.filter(report =>
            report.employee_name?.toLowerCase().includes(q)
            || report.employee_email?.toLowerCase().includes(q)
            || report.title.toLowerCase().includes(q)
            || report.description.toLowerCase().includes(q)
            || report.branch_name?.toLowerCase().includes(q),
        );
    }, [reports, search]);

    const handleAttachmentDownload = async (reportId: number, attachment: EmployeeReportAttachment) => {
        if (attachment.download_index === undefined) {
            return;
        }

        try {
            await downloadEmployeeReportAttachment(reportId, attachment.download_index, attachment.name, companyContextId);
        } catch {
            // keep the panel stable on download failure
        }
    };

    const topStats = [
        { label: 'Total Laporan', value: stats.total, icon: FileText, tone: T.primary },
        { label: 'Hari Ini', value: stats.today, icon: Calendar, tone: T.success },
        { label: 'Dengan File', value: stats.with_attachments, icon: Paperclip, tone: T.info },
        { label: 'Karyawan Aktif', value: stats.employees, icon: Users, tone: T.gold },
    ];

    const s = {
        section: {
            background: `linear-gradient(180deg, ${T.card} 0%, ${T.bgAlt} 100%)`,
            border: `1px solid ${T.border}`,
            borderRadius: 24,
            padding: isDesktop ? 18 : 14,
            boxShadow: T.shadowSm,
        } satisfies CSSProperties,
        statCard: {
            position: 'relative',
            overflow: 'hidden',
            background: `linear-gradient(180deg, ${T.card} 0%, ${T.bgAlt} 100%)`,
            borderRadius: 18,
            border: `1px solid ${T.border}`,
            padding: isDesktop ? '14px 15px' : '12px 13px',
            boxShadow: T.shadowSm,
        } satisfies CSSProperties,
        controlCard: {
            marginTop: 12,
            borderRadius: 18,
            border: `1px solid ${T.border}`,
            background: T.card,
            padding: isDesktop ? 12 : 10,
            boxShadow: T.shadowSm,
        } satisfies CSSProperties,
        searchWrap: {
            flex: 1,
            minWidth: isDesktop ? 240 : '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: 40,
            borderRadius: 13,
            border: `1px solid ${T.border}`,
            background: T.bgAlt,
            padding: '0 12px',
        } satisfies CSSProperties,
        dateInput: {
            height: 40,
            borderRadius: 13,
            border: `1px solid ${T.border}`,
            background: T.bgAlt,
            color: T.text,
            fontSize: 12,
            padding: '0 12px',
        } satisfies CSSProperties,
        tableWrap: {
            marginTop: 12,
            border: `1px solid ${T.border}`,
            borderRadius: 16,
            overflowX: 'auto',
            background: T.card,
        } satisfies CSSProperties,
        th: {
            textAlign: 'left',
            padding: '10px 11px',
            fontSize: 10.5,
            color: T.textMuted,
            borderBottom: `1px solid ${T.border}`,
            textTransform: 'uppercase',
        } satisfies CSSProperties,
        td: {
            padding: '11px 11px',
            borderBottom: `1px solid ${T.border}`,
            verticalAlign: 'top',
        } satisfies CSSProperties,
        mCard: {
            borderRadius: 18,
            border: `1px solid ${T.border}`,
            background: T.card,
            boxShadow: T.shadowSm,
            padding: 14,
            marginBottom: 10,
        } satisfies CSSProperties,
        overlay: {
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(2,8,23,.62)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
        } satisfies CSSProperties,
        modal: {
            width: 'min(980px, 100%)',
            maxHeight: 'calc(100vh - 32px)',
            overflowY: 'auto',
            background: T.card,
            borderRadius: 24,
            border: `1px solid ${T.border}`,
            padding: 18,
            boxShadow: '0 28px 72px rgba(2,8,23,.28)',
        } satisfies CSSProperties,
    };

    return (
        <div style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', gap: 10 }}>
                {topStats.map(card => (
                    <div key={card.label} style={s.statCard}>
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: `linear-gradient(135deg, ${card.tone}08 0%, transparent 42%)`,
                            pointerEvents: 'none',
                        }} />
                        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                            <div>
                                <div style={{ fontSize: 10.5, color: T.textMuted, fontWeight: 700 }}>
                                    {card.label}
                                </div>
                                <div style={{ fontSize: isDesktop ? 22 : 19, fontWeight: 900, color: T.text, marginTop: 7, fontFamily: "'Sora', sans-serif", lineHeight: 1 }}>
                                    {card.value}
                                </div>
                            </div>
                            <div style={{
                                width: 34,
                                height: 34,
                                borderRadius: 12,
                                background: `${card.tone}14`,
                                border: `1px solid ${card.tone}18`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <card.icon size={15} color={card.tone} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <section style={s.section}>
                <div style={{ display: 'flex', alignItems: isDesktop ? 'center' : 'flex-start', justifyContent: 'space-between', gap: 12, flexDirection: isDesktop ? 'row' : 'column' }}>
                    <div>
                        <div style={{ fontSize: 17, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>
                            Laporan Karyawan
                        </div>
                        <div style={{ marginTop: 4, fontSize: 11.5, color: T.textMuted, fontWeight: 700 }}>
                            Tinjau laporan kerja harian, lampiran, dan detail pengiriman dalam satu panel.
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={plainChipStyle(T)}>{dateFrom} - {dateTo}</span>
                        <span style={plainChipStyle(T)}>{pagination.total} laporan</span>
                    </div>
                </div>

                <div style={s.controlCard}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={s.searchWrap}>
                            <Search size={14} color={T.textMuted} />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Cari laporan, judul, karyawan, atau cabang..."
                                style={{ flex: 1, color: T.text, fontSize: 13, background: 'transparent', border: 'none', outline: 'none' }}
                            />
                            {search && (
                                <button type="button" onClick={() => setSearch('')} style={{ color: T.textMuted }}>
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Calendar size={14} color={T.textMuted} />
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                                style={s.dateInput}
                            />
                            <span style={{ color: T.textMuted, fontSize: 11 }}>—</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={e => { setDateTo(e.target.value); setPage(1); }}
                                style={s.dateInput}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => void loadReports(page)}
                            style={{
                                height: 40,
                                padding: '0 14px',
                                borderRadius: 13,
                                background: T.bgAlt,
                                color: T.textSub,
                                fontSize: 12,
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                border: `1px solid ${T.border}`,
                            }}
                        >
                            <RefreshCcw size={14} />
                            Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center' }}>
                        <Loader2 size={22} color={T.primary} style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 8px' }} />
                        <span style={{ fontSize: 12, color: T.textMuted }}>Memuat laporan karyawan...</span>
                    </div>
                ) : filteredReports.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center' }}>
                        <p style={{ fontSize: 13, color: T.textMuted }}>{search ? 'Tidak ditemukan.' : 'Belum ada laporan karyawan di rentang ini.'}</p>
                    </div>
                ) : isDesktop ? (
                    <div style={s.tableWrap}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 820 }}>
                            <thead>
                                <tr style={{ background: T.bgAlt }}>
                                    {['Karyawan', 'Laporan', 'Waktu', 'File', 'Aksi'].map(header => (
                                        <th key={header} style={s.th}>{header}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReports.map(report => (
                                    <tr
                                        key={report.id}
                                        style={{ background: T.card, transition: 'background .15s' }}
                                        onMouseEnter={event => { event.currentTarget.style.background = T.bgAlt; }}
                                        onMouseLeave={event => { event.currentTarget.style.background = T.card; }}
                                    >
                                        <td style={{ ...s.td, minWidth: 220 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                                <div style={{
                                                    width: 34,
                                                    height: 34,
                                                    borderRadius: 10,
                                                    background: `${T.primary}14`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: 13,
                                                    fontWeight: 900,
                                                    color: T.primary,
                                                    flexShrink: 0,
                                                }}>
                                                    {(report.employee_name ?? 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>
                                                        {report.employee_name ?? 'Unknown'}
                                                    </div>
                                                    <div style={{ marginTop: 3, fontSize: 10.5, color: T.textMuted }}>
                                                        {report.employee_email ?? '-'}{report.branch_name ? ` • ${report.branch_name}` : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ ...s.td, minWidth: 320 }}>
                                            <div style={{ display: 'grid', gap: 6 }}>
                                                <div style={{ fontSize: 13.5, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif", lineHeight: 1.3 }}>
                                                    {report.title}
                                                </div>
                                                <div style={{ fontSize: 11.5, color: T.textSub, lineHeight: 1.6 }}>
                                                    {truncateText(report.description, 130)}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ ...s.td, minWidth: 150 }}>
                                            <div style={{ display: 'grid', gap: 6 }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.textSub, fontWeight: 700 }}>
                                                    <Calendar size={12} color={T.primary} />
                                                    {formatDate(report.report_date)}
                                                </span>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.textMuted, fontWeight: 700 }}>
                                                    <Clock3 size={12} color={T.info} />
                                                    {formatTime(report.created_at)}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ ...s.td, minWidth: 170 }}>
                                            <div style={{ display: 'grid', gap: 8 }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.text, fontWeight: 800 }}>
                                                    <Paperclip size={12} color={T.gold} />
                                                    {report.attachments.length} lampiran
                                                </span>
                                                <AttachmentPreviewRow attachments={report.attachments} T={T} />
                                            </div>
                                        </td>
                                        <td style={s.td}>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedReport(report)}
                                                style={actionButtonStyle(T)}
                                            >
                                                Detail
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ marginTop: 12 }}>
                        {filteredReports.map(report => (
                            <article key={report.id} style={s.mCard}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                        <div style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: 11,
                                            background: `${T.primary}14`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 13,
                                            fontWeight: 900,
                                            color: T.primary,
                                            flexShrink: 0,
                                        }}>
                                            {(report.employee_name ?? 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>
                                                {report.employee_name ?? 'Unknown'}
                                            </div>
                                            <div style={{ marginTop: 2, fontSize: 10.5, color: T.textMuted }}>
                                                {report.branch_name ?? '-'}
                                            </div>
                                        </div>
                                    </div>
                                    <span style={statusBadgeStyle(T)}>Terkirim</span>
                                </div>

                                <div style={{ marginTop: 12, fontSize: 13.5, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif", lineHeight: 1.3 }}>
                                    {report.title}
                                </div>
                                <div style={{ marginTop: 6, fontSize: 11.5, color: T.textSub, lineHeight: 1.65 }}>
                                    {truncateText(report.description, 120)}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 12, fontSize: 10.5, color: T.textMuted, fontWeight: 700 }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                        <Calendar size={12} color={T.primary} />
                                        {formatDate(report.report_date)}
                                    </span>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                        <Clock3 size={12} color={T.info} />
                                        {formatTime(report.created_at)}
                                    </span>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                        <Paperclip size={12} color={T.gold} />
                                        {report.attachments.length} lampiran
                                    </span>
                                </div>

                                <div style={{ marginTop: 12 }}>
                                    <AttachmentPreviewRow attachments={report.attachments} T={T} />
                                </div>

                                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedReport(report)}
                                        style={actionButtonStyle(T)}
                                    >
                                        Detail
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                {pagination.last_page > 1 && (
                    <div style={{ marginTop: 12, borderRadius: 14, border: `1px solid ${T.border}`, background: T.bgAlt, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <button
                            type="button"
                            onClick={() => setPage(current => Math.max(1, current - 1))}
                            disabled={pagination.current_page <= 1}
                            style={pagerButtonStyle(T, pagination.current_page <= 1)}
                        >
                            <ChevronLeft size={14} />
                            Prev
                        </button>
                        <div style={{ fontSize: 11.5, color: T.textMuted, fontWeight: 700 }}>
                            Halaman {pagination.current_page} dari {pagination.last_page}
                        </div>
                        <button
                            type="button"
                            onClick={() => setPage(current => Math.min(pagination.last_page, current + 1))}
                            disabled={pagination.current_page >= pagination.last_page}
                            style={pagerButtonStyle(T, pagination.current_page >= pagination.last_page)}
                        >
                            Next
                            <ChevronRight size={14} />
                        </button>
                    </div>
                )}
            </section>

            {selectedReport && (
                <ReportDetailModal
                    report={selectedReport}
                    T={T}
                    isDesktop={isDesktop}
                    onClose={() => setSelectedReport(null)}
                    onDownload={attachment => void handleAttachmentDownload(selectedReport.id, attachment)}
                />
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

function ReportDetailModal({
    report,
    T,
    isDesktop,
    onClose,
    onDownload,
}: {
    report: EmployeeReportItem;
    T: Theme;
    isDesktop: boolean;
    onClose: () => void;
    onDownload: (attachment: EmployeeReportAttachment) => void;
}) {
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(2,8,23,.62)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
        }} onClick={onClose}>
            <div
                style={{
                    width: 'min(980px, 100%)',
                    maxHeight: 'calc(100vh - 32px)',
                    overflowY: 'auto',
                    background: T.card,
                    borderRadius: 24,
                    border: `1px solid ${T.border}`,
                    padding: 18,
                    boxShadow: '0 28px 72px rgba(2,8,23,.28)',
                }}
                onClick={event => event.stopPropagation()}
            >
                <div style={{
                    display: 'grid',
                    gap: 12,
                    marginBottom: 14,
                    padding: 14,
                    borderRadius: 22,
                    border: `1px solid ${T.border}`,
                    background: `linear-gradient(180deg, ${T.card} 0%, ${T.bgAlt} 100%)`,
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                            <div style={{
                                width: 48,
                                height: 48,
                                borderRadius: 16,
                                background: `${T.primary}14`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 18,
                                fontWeight: 900,
                                color: T.primary,
                                flexShrink: 0,
                            }}>
                                {(report.employee_name ?? 'U').charAt(0).toUpperCase()}
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 19, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif", lineHeight: 1.15 }}>
                                    {report.title}
                                </div>
                                <div style={{ marginTop: 5, fontSize: 11.5, color: T.textMuted, fontWeight: 700 }}>
                                    {report.employee_name ?? 'Unknown'}{report.branch_name ? ` • ${report.branch_name}` : ''}{report.employee_email ? ` • ${report.employee_email}` : ''}
                                </div>
                            </div>
                        </div>
                        <button type="button" onClick={onClose} style={modalCloseButtonStyle(T)}>
                            <X size={16} />
                        </button>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: 8,
                    }}>
                        <MetaCard T={T} icon={Calendar} tone={T.primary} label="Tanggal" value={formatDate(report.report_date)} />
                        <MetaCard T={T} icon={Clock3} tone={T.info} label="Dikirim" value={formatTime(report.created_at)} />
                        <MetaCard T={T} icon={Paperclip} tone={T.gold} label="Lampiran" value={`${report.attachments.length}`} />
                        <MetaCard T={T} icon={Users} tone={T.success} label="Karyawan" value={report.employee_name ?? 'Unknown'} />
                    </div>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isDesktop ? 'minmax(0, 1.15fr) minmax(280px, 0.85fr)' : '1fr',
                    gap: 14,
                    alignItems: 'start',
                }}>
                    <div style={detailSurfaceStyle(T)}>
                        <div style={detailHeadStyle(T)}>
                            <span style={detailLabelStyle(T)}>
                                <FileText size={14} color={T.primary} />
                                Isi Laporan
                            </span>
                        </div>
                        <div style={{ padding: '2px 16px 16px', fontSize: 12.5, color: T.textSub, lineHeight: 1.85 }}>
                            {report.description}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: 14 }}>
                        <div style={detailSurfaceStyle(T)}>
                            <div style={detailHeadStyle(T)}>
                                <span style={detailLabelStyle(T)}>
                                    <Users size={14} color={T.success} />
                                    Informasi
                                </span>
                            </div>
                            <div style={{ display: 'grid', gap: 0, padding: '2px 16px 12px' }}>
                                <DetailRow T={T} label="Nama" value={report.employee_name ?? 'Unknown'} icon={<Users size={14} color={T.success} />} />
                                <DetailRow T={T} label="Email" value={report.employee_email ?? '-'} icon={<FileText size={14} color={T.primary} />} />
                                <DetailRow T={T} label="Cabang" value={report.branch_name ?? '-'} icon={<Calendar size={14} color={T.info} />} />
                                <DetailRow T={T} label="Tanggal" value={formatDate(report.report_date)} icon={<Calendar size={14} color={T.primary} />} />
                                <DetailRow T={T} label="Dikirim" value={formatTime(report.created_at)} icon={<Clock3 size={14} color={T.info} />} />
                            </div>
                        </div>

                        <div style={detailSurfaceStyle(T)}>
                            <div style={detailHeadStyle(T)}>
                                <span style={detailLabelStyle(T)}>
                                    <Paperclip size={14} color={T.gold} />
                                    Lampiran
                                </span>
                            </div>
                            <div style={{ padding: '2px 16px 16px' }}>
                                {report.attachments.length === 0 ? (
                                    <div style={{ minHeight: 120, borderRadius: 16, border: `1px dashed ${T.border}`, background: T.bgAlt, color: T.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 18, fontSize: 11.5, fontWeight: 700 }}>
                                        Tidak ada lampiran.
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gap: 8 }}>
                                        {report.attachments.map(attachment => (
                                            <AttachmentRow
                                                key={`${report.id}-${attachment.download_index ?? attachment.name}`}
                                                attachment={attachment}
                                                T={T}
                                                onClick={() => onDownload(attachment)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetaCard({
    T,
    icon: Icon,
    tone,
    label,
    value,
}: {
    T: Theme;
    icon: typeof Calendar;
    tone: string;
    label: string;
    value: string;
}) {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '36px minmax(0, 1fr)',
            alignItems: 'center',
            gap: 10,
            minHeight: 54,
            borderRadius: 16,
            border: `1px solid ${T.border}`,
            background: T.card,
            padding: '9px 11px',
        }}>
            <div style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                border: `1px solid ${T.border}`,
                background: T.bgAlt,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <Icon size={14} color={tone} />
            </div>
            <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 800, textTransform: 'uppercase' }}>
                    {label}
                </div>
                <div style={{ marginTop: 3, fontSize: 12.5, color: T.text, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {value}
                </div>
            </div>
        </div>
    );
}

function DetailRow({
    T,
    label,
    value,
    icon,
}: {
    T: Theme;
    label: string;
    value: string;
    icon: ReactNode;
}) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            paddingBottom: 10,
            paddingTop: 10,
            borderBottom: `1px solid ${T.border}`,
        }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 10.5, fontWeight: 800, color: T.textMuted, textTransform: 'uppercase' }}>
                {icon}
                {label}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.text, textAlign: 'right', lineHeight: 1.5 }}>
                {value}
            </span>
        </div>
    );
}

function AttachmentPreviewRow({
    attachments,
    T,
}: {
    attachments: EmployeeReportAttachment[];
    T: Theme;
}) {
    if (attachments.length === 0) {
        return (
            <span style={{ fontSize: 10.5, color: T.textMuted, fontWeight: 700 }}>
                Tidak ada file
            </span>
        );
    }

    return (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {attachments.slice(0, 2).map(attachment => (
                <span
                    key={`${attachment.download_index ?? attachment.name}-${attachment.name}`}
                    style={attachmentPreviewChipStyle(T)}
                >
                    {attachment.mime_type?.startsWith('image/')
                        ? <ImageIcon size={11} color={T.primary} />
                        : <FileIcon size={11} color={T.info} />}
                    <span style={attachmentPreviewLabelStyle}>
                        {shortenName(attachment.name)}
                    </span>
                </span>
            ))}
            {attachments.length > 2 && (
                <span style={attachmentPreviewChipStyle(T)}>+{attachments.length - 2}</span>
            )}
        </div>
    );
}

function AttachmentRow({
    attachment,
    T,
    onClick,
}: {
    attachment: EmployeeReportAttachment;
    T: Theme;
    onClick: () => void;
}) {
    const isImage = attachment.mime_type?.startsWith('image/');

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={attachment.download_index === undefined}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                width: '100%',
                minHeight: 48,
                borderRadius: 14,
                border: `1px solid ${T.border}`,
                background: T.bgAlt,
                padding: '10px 12px',
                textAlign: 'left',
                opacity: attachment.download_index === undefined ? 0.65 : 1,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: 11,
                    border: `1px solid ${T.border}`,
                    background: T.card,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    {isImage ? <ImageIcon size={13} color={T.primary} /> : <FileIcon size={13} color={T.info} />}
                </div>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11.5, color: T.text, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {attachment.name}
                    </div>
                    <div style={{ marginTop: 3, fontSize: 10, color: T.textMuted, fontWeight: 700 }}>
                        {attachment.mime_type ?? 'File'}{attachment.size_bytes ? ` • ${formatBytes(attachment.size_bytes)}` : ''}
                    </div>
                </div>
            </div>
            <span style={downloadChipStyle(T)}>
                Unduh
            </span>
        </button>
    );
}

function truncateText(text: string, maxLength: number): string {
    return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
}

function shortenName(name: string): string {
    return name.length > 22 ? `${name.slice(0, 19)}...` : name;
}

function formatBytes(size: number): string {
    if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    if (size >= 1024) return `${Math.round(size / 1024)} KB`;
    return `${size} B`;
}

function actionButtonStyle(T: Theme): CSSProperties {
    return {
        height: 32,
        padding: '0 12px',
        borderRadius: 999,
        border: `1px solid ${T.primary}30`,
        background: `${T.primary}08`,
        color: T.primary,
        fontSize: 11,
        fontWeight: 800,
    };
}

function statusBadgeStyle(T: Theme): CSSProperties {
    return {
        flexShrink: 0,
        fontSize: 10,
        fontWeight: 800,
        padding: '4px 9px',
        borderRadius: 999,
        background: `${T.success}12`,
        color: T.success,
    };
}

function attachmentPreviewChipStyle(T: Theme): CSSProperties {
    return {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        height: 24,
        padding: '0 8px',
        borderRadius: 999,
        border: `1px solid ${T.border}`,
        background: T.bgAlt,
        color: T.textMuted,
        fontSize: 10,
        fontWeight: 700,
        maxWidth: 132,
    };
}

const attachmentPreviewLabelStyle: CSSProperties = {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
};

function downloadChipStyle(T: Theme): CSSProperties {
    return {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 28,
        padding: '0 10px',
        borderRadius: 999,
        border: `1px solid ${T.primary}24`,
        background: `${T.primary}10`,
        color: T.primary,
        fontSize: 10.5,
        fontWeight: 800,
        flexShrink: 0,
    };
}

function pagerButtonStyle(T: Theme, disabled: boolean): CSSProperties {
    return {
        height: 38,
        padding: '0 12px',
        borderRadius: 12,
        border: `1px solid ${T.border}`,
        background: T.card,
        color: disabled ? T.textMuted : T.text,
        fontSize: 11.5,
        fontWeight: 800,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        opacity: disabled ? 0.55 : 1,
    };
}

function plainChipStyle(T: Theme): CSSProperties {
    return {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 30,
        padding: '0 10px',
        borderRadius: 999,
        border: `1px solid ${T.border}`,
        background: T.bgAlt,
        color: T.textSub,
        fontSize: 10.5,
        fontWeight: 800,
        whiteSpace: 'nowrap',
    };
}

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

function detailSurfaceStyle(T: Theme): CSSProperties {
    return {
        borderRadius: 20,
        border: `1px solid ${T.border}`,
        background: T.card,
        alignSelf: 'start',
    };
}

function detailHeadStyle(T: Theme): CSSProperties {
    return {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        padding: '14px 16px 12px',
        borderBottom: `1px solid ${T.border}`,
    };
}

function detailLabelStyle(T: Theme): CSSProperties {
    return {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        fontSize: 11.5,
        fontWeight: 800,
        color: T.text,
    };
}
