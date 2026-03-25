import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ChangeEvent } from 'react';
import {
    AlertCircle,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock3,
    File as FileIcon,
    FileText,
    Image as ImageIcon,
    Loader2,
    Paperclip,
    Plus,
    Send,
    Trash2,
    X,
} from 'lucide-react';
import { attendanceApi } from '@/api/platform.api';
import { downloadEmployeeReportAttachment } from '@/lib/downloadEmployeeReportAttachment';
import type { Theme } from '@/theme/tokens';
import type { EmployeeReportAttachment, MyEmployeeReportPayload } from '@/types/attendance.types';

interface Props {
    T: Theme;
    isDesktop: boolean;
}

const MOBILE_SHEET_OFFSET = 'calc(96px + env(safe-area-inset-bottom, 0px))';
const MOBILE_SHEET_TOP_GAP = '132px';
const PER_PAGE = 15;

export function EmployeeReportTab({ T, isDesktop }: Props) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [showComposer, setShowComposer] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [sending, setSending] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [reportState, setReportState] = useState<MyEmployeeReportPayload | null>(null);

    const today = useMemo(() => new Date(), []);
    const todayLabel = today.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const loadReports = useCallback(async (targetPage: number) => {
        setLoading(true);

        try {
            const response = await attendanceApi.getMyReports({
                per_page: PER_PAGE,
                page: targetPage,
            });
            setReportState(response.data.data);
            setErrorMsg('');
        } catch (error: any) {
            setErrorMsg(error?.response?.data?.message ?? 'Gagal memuat laporan harian.');
            setReportState(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadReports(page);
    }, [loadReports, page]);

    const reports = reportState?.pagination.data ?? [];
    const stats = reportState?.stats ?? { total: 0, today: 0, with_attachments: 0 };
    const pagination = reportState?.pagination ?? {
        current_page: 1,
        per_page: PER_PAGE,
        total: 0,
        last_page: 1,
        data: [],
    };
    const headerStats = [
        { label: 'Laporan', value: `${stats.total}`, icon: FileText },
        { label: 'Hari Ini', value: `${stats.today}`, icon: CalendarDays },
        { label: 'File', value: `${stats.with_attachments}`, icon: Paperclip },
    ];

    const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []);
        setAttachments(prev => [...prev, ...files].slice(0, 5));
        if (fileRef.current) fileRef.current.value = '';
    };

    const removeFile = (index: number) => {
        setAttachments(prev => prev.filter((_, fileIndex) => fileIndex !== index));
    };

    const closeComposer = () => {
        if (sending) return;
        setShowComposer(false);
        setTitle('');
        setDescription('');
        setAttachments([]);
        setErrorMsg('');
    };

    const forceCloseComposer = () => {
        setShowComposer(false);
        setTitle('');
        setDescription('');
        setAttachments([]);
        setErrorMsg('');
    };

    const handleSubmit = async () => {
        if (!title.trim() || !description.trim()) return;

        setSending(true);
        setErrorMsg('');

        try {
            const formData = new FormData();
            formData.append('title', title.trim());
            formData.append('description', description.trim());
            attachments.forEach(file => formData.append('attachments[]', file));

            await attendanceApi.submitReport(formData);

            forceCloseComposer();
            setSuccessMsg('Laporan berhasil dikirim.');
            setPage(1);
            await loadReports(1);
            window.setTimeout(() => setSuccessMsg(''), 2600);
        } catch (error: any) {
            setErrorMsg(error?.response?.data?.message ?? 'Gagal mengirim laporan.');
        } finally {
            setSending(false);
        }
    };

    const handleAttachmentDownload = async (reportId: number, attachment: EmployeeReportAttachment) => {
        if (attachment.download_index === undefined) {
            setErrorMsg('Lampiran tidak tersedia untuk diunduh.');
            return;
        }

        try {
            await downloadEmployeeReportAttachment(reportId, attachment.download_index, attachment.name);
        } catch (error: any) {
            setErrorMsg(error?.response?.data?.message ?? 'Gagal mengunduh lampiran.');
        }
    };

    return (
        <>
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
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.76)', fontWeight: 800 }}>
                                    Daily Report
                                </div>
                                <div style={{
                                    marginTop: 6,
                                    fontSize: isDesktop ? 24 : 20,
                                    lineHeight: 1.16,
                                    fontWeight: 900,
                                    fontFamily: "'Sora', sans-serif",
                                    letterSpacing: -.5,
                                }}>
                                    Laporan Harian
                                </div>
                                <div style={{
                                    marginTop: 6,
                                    fontSize: 11,
                                    color: 'rgba(255,255,255,.82)',
                                    fontWeight: 700,
                                }}>
                                    {todayLabel}
                                </div>
                            </div>

                            <button
                                onClick={() => setShowComposer(true)}
                                style={{
                                    height: 38,
                                    padding: '0 12px',
                                    borderRadius: 14,
                                    border: '1px solid rgba(255,255,255,.16)',
                                    background: 'rgba(255,255,255,.12)',
                                    color: '#fff',
                                    fontSize: 11,
                                    fontWeight: 800,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 7,
                                    flexShrink: 0,
                                }}
                            >
                                <Plus size={14} />
                                Tulis
                            </button>
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
                                        {loading ? '...' : item.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {successMsg && (
                    <div style={{
                        borderRadius: 18,
                        padding: '12px 14px',
                        border: `1px solid ${T.success}30`,
                        background: `${T.success}12`,
                        color: T.success,
                        fontSize: 12,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}>
                        <CheckCircle2 size={16} />
                        {successMsg}
                    </div>
                )}

                {errorMsg && !showComposer && !loading && (
                    <div style={{
                        borderRadius: 18,
                        padding: '12px 14px',
                        border: `1px solid ${T.danger}26`,
                        background: `${T.danger}10`,
                        color: T.danger,
                        fontSize: 12,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}>
                        <AlertCircle size={16} />
                        {errorMsg}
                    </div>
                )}

                {loading ? (
                    <section style={surfaceCard(T, { padding: isDesktop ? '42px 28px' : '34px 18px', textAlign: 'center' })}>
                        <Loader2 size={22} color={T.primary} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                        <div style={{ marginTop: 12, fontSize: 12, color: T.textMuted }}>
                            Memuat laporan...
                        </div>
                    </section>
                ) : reports.length === 0 ? (
                    <section style={surfaceCard(T, { padding: isDesktop ? '42px 28px' : '34px 18px', textAlign: 'center' })}>
                        <div style={{
                            width: 64,
                            height: 64,
                            margin: '0 auto 16px',
                            borderRadius: 22,
                            background: `${T.primary}10`,
                            border: `1px solid ${T.primary}18`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <FileText size={28} color={T.primary} />
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>
                            Belum ada laporan
                        </div>
                        <div style={{ marginTop: 6, fontSize: 12, color: T.textMuted, lineHeight: 1.7 }}>
                            Tulis laporan harian untuk mencatat progres kerja yang sudah selesai.
                        </div>
                        <button
                            onClick={() => setShowComposer(true)}
                            style={{
                                marginTop: 18,
                                height: 42,
                                padding: '0 18px',
                                borderRadius: 14,
                                border: 'none',
                                background: `linear-gradient(135deg, ${T.primary}, ${T.info})`,
                                color: '#fff',
                                fontSize: 12,
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                boxShadow: `0 14px 28px ${T.primaryGlow}`,
                            }}
                        >
                            <Plus size={15} />
                            Buat Laporan
                        </button>
                    </section>
                ) : (
                    <>
                        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {reports.map(report => (
                                <article
                                    key={report.id}
                                    style={surfaceCard(T, {
                                        padding: isDesktop ? '16px' : '14px',
                                    })}
                                >
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        justifyContent: 'space-between',
                                        gap: 12,
                                        marginBottom: 10,
                                    }}>
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <div style={{
                                                fontSize: 14,
                                                fontWeight: 900,
                                                color: T.text,
                                                fontFamily: "'Sora', sans-serif",
                                                lineHeight: 1.3,
                                            }}>
                                                {report.title}
                                            </div>
                                            <div style={{
                                                marginTop: 6,
                                                fontSize: 12,
                                                color: T.textMuted,
                                                lineHeight: 1.65,
                                                display: '-webkit-box',
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                            } as CSSProperties}>
                                                {report.description}
                                            </div>
                                        </div>

                                        <span style={{
                                            flexShrink: 0,
                                            fontSize: 9.5,
                                            fontWeight: 800,
                                            padding: '4px 9px',
                                            borderRadius: 999,
                                            background: `${T.success}12`,
                                            color: T.success,
                                            border: `1px solid ${T.success}18`,
                                        }}>
                                            Terkirim
                                        </span>
                                    </div>

                                    {report.attachments.length > 0 && (
                                        <div style={{
                                            display: 'flex',
                                            gap: 8,
                                            flexWrap: 'wrap',
                                            marginBottom: 10,
                                        }}>
                                            {report.attachments.map(attachment => (
                                                <AttachmentChip
                                                    key={`${report.id}-${attachment.download_index ?? attachment.name}`}
                                                    attachment={attachment}
                                                    T={T}
                                                    onClick={() => void handleAttachmentDownload(report.id, attachment)}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        flexWrap: 'wrap',
                                        fontSize: 10.5,
                                        color: T.textMuted,
                                        fontWeight: 700,
                                    }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                            <CalendarDays size={12} color={T.primary} />
                                            {formatDateLabel(report.report_date)}
                                        </span>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                            <Clock3 size={12} color={T.info} />
                                            {formatTimeLabel(report.created_at)}
                                        </span>
                                        {report.branch_name && (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                                <FileText size={12} color={T.primary} />
                                                {report.branch_name}
                                            </span>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </section>

                        {pagination.last_page > 1 && (
                            <div style={surfaceCard(T, { padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 })}>
                                <button
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
                                    onClick={() => setPage(current => Math.min(pagination.last_page, current + 1))}
                                    disabled={pagination.current_page >= pagination.last_page}
                                    style={pagerButtonStyle(T, pagination.current_page >= pagination.last_page)}
                                >
                                    Next
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {showComposer && (
                <>
                    <div
                        onClick={closeComposer}
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
                            width: isDesktop ? 'min(480px, calc(100vw - 24px))' : 'min(480px, 100%)',
                            borderTopLeftRadius: 28,
                            borderTopRightRadius: 28,
                            borderBottomLeftRadius: 26,
                            borderBottomRightRadius: 26,
                            background: T.card,
                            border: `1px solid ${T.border}`,
                            padding: isDesktop ? 18 : 14,
                            boxShadow: T.shadow,
                            maxHeight: isDesktop
                                ? 'min(82vh, 780px)'
                                : `min(80vh, calc(100vh - ${MOBILE_SHEET_TOP_GAP} - ${MOBILE_SHEET_OFFSET}))`,
                            overflowY: 'auto',
                            pointerEvents: 'auto',
                            animation: isDesktop
                                ? 'fadeUp .18s ease'
                                : 'sheetRise .24s cubic-bezier(.22,.8,.2,1)',
                        }}>
                            {!isDesktop && (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    paddingTop: 2,
                                    paddingBottom: 10,
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
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 10,
                                marginBottom: 14,
                            }}>
                                <div>
                                    <div style={{
                                        fontSize: 14,
                                        fontWeight: 900,
                                        color: T.text,
                                        fontFamily: "'Sora', sans-serif",
                                    }}>
                                        Tulis Laporan
                                    </div>
                                    <div style={{ marginTop: 4, fontSize: 11, color: T.textMuted }}>
                                        Ringkas, jelas, dan langsung ke inti.
                                    </div>
                                </div>
                                <button
                                    onClick={closeComposer}
                                    style={{
                                        width: 34,
                                        height: 34,
                                        borderRadius: 12,
                                        border: `1px solid ${T.border}`,
                                        background: T.bgAlt,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: T.text,
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div>
                                    <label style={labelStyle(T)}>Judul</label>
                                    <input
                                        value={title}
                                        onChange={event => setTitle(event.target.value)}
                                        placeholder="Contoh: Finalisasi revisi modul attendance"
                                        style={inputStyle(T)}
                                    />
                                </div>

                                <div>
                                    <label style={labelStyle(T)}>Deskripsi</label>
                                    <textarea
                                        value={description}
                                        onChange={event => setDescription(event.target.value)}
                                        rows={5}
                                        placeholder="Tulis progres, hasil kerja, atau kendala singkat..."
                                        style={textareaStyle(T)}
                                    />
                                </div>

                                <div>
                                    <div style={labelStyle(T)}>Lampiran</div>
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        multiple
                                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                                        onChange={handleFileSelect}
                                        style={{ display: 'none' }}
                                    />
                                    <button
                                        onClick={() => fileRef.current?.click()}
                                        style={{
                                            width: '100%',
                                            minHeight: 52,
                                            borderRadius: 16,
                                            border: `1px dashed ${T.border}`,
                                            background: T.bgAlt,
                                            color: T.text,
                                            fontSize: 12,
                                            fontWeight: 800,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 8,
                                        }}
                                    >
                                        <Paperclip size={15} />
                                        Tambah lampiran
                                    </button>

                                    {attachments.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                                            {attachments.map((file, index) => (
                                                <div
                                                    key={`${file.name}-${index}`}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 10,
                                                        padding: '10px 12px',
                                                        borderRadius: 14,
                                                        background: T.bgAlt,
                                                        border: `1px solid ${T.border}`,
                                                    }}
                                                >
                                                    <div style={{
                                                        width: 34,
                                                        height: 34,
                                                        borderRadius: 10,
                                                        background: file.type.startsWith('image/') ? `${T.primary}12` : `${T.info}12`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0,
                                                    }}>
                                                        {file.type.startsWith('image/')
                                                            ? <ImageIcon size={15} color={T.primary} />
                                                            : <FileIcon size={15} color={T.info} />}
                                                    </div>
                                                    <div style={{ minWidth: 0, flex: 1 }}>
                                                        <div style={{
                                                            fontSize: 11.5,
                                                            fontWeight: 700,
                                                            color: T.text,
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                        }}>
                                                            {file.name}
                                                        </div>
                                                        <div style={{ marginTop: 3, fontSize: 10, color: T.textMuted }}>
                                                            {formatFileSize(file.size)}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFile(index)}
                                                        style={{
                                                            width: 30,
                                                            height: 30,
                                                            borderRadius: 10,
                                                            border: `1px solid ${T.danger}20`,
                                                            background: `${T.danger}08`,
                                                            color: T.danger,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {errorMsg && (
                                    <div style={{
                                        padding: '10px 12px',
                                        borderRadius: 14,
                                        background: `${T.danger}10`,
                                        border: `1px solid ${T.danger}24`,
                                        color: T.danger,
                                        fontSize: 11.5,
                                        fontWeight: 700,
                                    }}>
                                        {errorMsg}
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 8 }}>
                                    <button onClick={closeComposer} style={secondaryButtonStyle(T)}>
                                        Batal
                                    </button>
                                    <button
                                        onClick={() => void handleSubmit()}
                                        disabled={sending || !title.trim() || !description.trim()}
                                        style={primaryButtonStyle(T, sending || !title.trim() || !description.trim())}
                                    >
                                        {sending ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={15} />}
                                        {sending ? 'Mengirim...' : 'Kirim Laporan'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
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

function AttachmentChip({ attachment, T, onClick }: { attachment: EmployeeReportAttachment; T: Theme; onClick: () => void }) {
    const isImage = attachment.mime_type?.startsWith('image/');
    const content = (
        <>
            {isImage ? <ImageIcon size={12} color={T.primary} /> : <FileIcon size={12} color={T.info} />}
            {shortenName(attachment.name)}
        </>
    );

    const style: CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        borderRadius: 12,
        background: T.bgAlt,
        border: `1px solid ${T.border}`,
        fontSize: 10.5,
        color: T.textMuted,
        fontWeight: 700,
        textDecoration: 'none',
    };

    return <button type="button" onClick={onClick} style={style}>{content}</button>;
}

function surfaceCard(T: Theme, extra?: CSSProperties): CSSProperties {
    return {
        background: T.card,
        borderRadius: 20,
        border: `1px solid ${T.border}`,
        ...extra,
    };
}

function labelStyle(T: Theme): CSSProperties {
    return {
        display: 'block',
        marginBottom: 6,
        fontSize: 11,
        fontWeight: 800,
        color: T.textMuted,
    };
}

function inputStyle(T: Theme): CSSProperties {
    return {
        width: '100%',
        height: 48,
        borderRadius: 14,
        border: `1px solid ${T.border}`,
        background: T.bgAlt,
        color: T.text,
        fontSize: 13,
        padding: '0 14px',
        boxSizing: 'border-box',
    };
}

function textareaStyle(T: Theme): CSSProperties {
    return {
        width: '100%',
        borderRadius: 14,
        border: `1px solid ${T.border}`,
        background: T.bgAlt,
        color: T.text,
        fontSize: 13,
        padding: '12px 14px',
        boxSizing: 'border-box',
        resize: 'none',
        lineHeight: 1.7,
    };
}

function secondaryButtonStyle(T: Theme): CSSProperties {
    return {
        height: 44,
        borderRadius: 14,
        border: `1px solid ${T.border}`,
        background: T.bgAlt,
        color: T.textSub,
        fontSize: 12,
        fontWeight: 800,
    };
}

function primaryButtonStyle(T: Theme, disabled: boolean): CSSProperties {
    return {
        height: 44,
        borderRadius: 14,
        border: 'none',
        background: disabled ? T.border : `linear-gradient(135deg, ${T.primary}, ${T.info})`,
        color: '#fff',
        fontSize: 12,
        fontWeight: 800,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        boxShadow: disabled ? 'none' : `0 16px 28px ${T.primaryGlow}`,
    };
}

function pagerButtonStyle(T: Theme, disabled: boolean): CSSProperties {
    return {
        height: 38,
        padding: '0 12px',
        borderRadius: 12,
        border: `1px solid ${T.border}`,
        background: T.bgAlt,
        color: disabled ? T.textMuted : T.text,
        fontSize: 11.5,
        fontWeight: 800,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        opacity: disabled ? .55 : 1,
    };
}

function formatDateLabel(value: string): string {
    try {
        return new Date(value).toLocaleDateString('id-ID', {
            weekday: 'short',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    } catch {
        return value;
    }
}

function formatTimeLabel(value: string): string {
    try {
        return new Date(value).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return value;
    }
}

function shortenName(name: string): string {
    return name.length > 22 ? `${name.slice(0, 19)}...` : name;
}

function formatFileSize(size: number): string {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
