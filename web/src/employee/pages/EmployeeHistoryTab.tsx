import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock3,
    Filter,
    Fingerprint,
    History,
    Loader2,
    MapPin,
} from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { attendanceApi } from '@/api/platform.api';
import { unwrapAttendanceRecords } from '@/employee/lib/attendance';
import type { AttendanceHistoryPayload, AttendanceRecordItem } from '@/types/attendance.types';

interface Props {
    T: Theme;
    isDesktop: boolean;
}

const PER_PAGE = 10;

export function EmployeeHistoryTab({ T, isDesktop }: Props) {
    const [records, setRecords] = useState<AttendanceRecordItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [showFilter, setShowFilter] = useState(false);
    const [filterMonth, setFilterMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    const fetchHistory = useCallback(async () => {
        setLoading(true);

        try {
            const [year, month] = filterMonth.split('-').map(Number);
            const from = `${year}-${String(month).padStart(2, '0')}-01`;
            const lastDay = new Date(year, month, 0).getDate();
            const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

            const response = await attendanceApi.getHistory({
                from,
                to,
                per_page: PER_PAGE,
                page: currentPage,
            });

            const payload = response.data?.data as AttendanceHistoryPayload;
            setRecords(unwrapAttendanceRecords(payload));
            setCurrentPage(payload.current_page ?? 1);
            setLastPage(payload.last_page ?? 1);
            setTotalRecords(payload.total ?? 0);
        } catch {
            setRecords([]);
            setCurrentPage(1);
            setLastPage(1);
            setTotalRecords(0);
        } finally {
            setLoading(false);
        }
    }, [currentPage, filterMonth]);

    useEffect(() => {
        void fetchHistory();
    }, [fetchHistory]);

    const monthLabel = useMemo(() => {
        const [year, month] = filterMonth.split('-').map(Number);
        return new Date(year, month - 1).toLocaleDateString('id-ID', {
            month: 'long',
            year: 'numeric',
        });
    }, [filterMonth]);

    const monthOptions = useMemo(() => (
        Array.from({ length: 6 }, (_, index) => {
            const date = new Date();
            date.setMonth(date.getMonth() - index);
            const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const label = date.toLocaleDateString('id-ID', {
                month: 'long',
                year: 'numeric',
            });
            return { value, label };
        })
    ), []);

    const completeOnPage = records.filter(record => record.time_in && record.time_out).length;
    const visibleRangeStart = totalRecords === 0 ? 0 : ((currentPage - 1) * PER_PAGE) + 1;
    const visibleRangeEnd = totalRecords === 0 ? 0 : Math.min(currentPage * PER_PAGE, totalRecords);
    const pageNumbers = getPageNumbers(currentPage, lastPage);
    const headerStats = [
        { label: 'Total', value: `${totalRecords}`, icon: History },
        { label: 'Tampil', value: `${records.length}`, icon: Fingerprint },
        { label: 'Lengkap', value: `${completeOnPage}`, icon: CheckCircle2 },
    ];

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
                    Memuat riwayat...
                </div>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

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
                                Attendance History
                            </div>
                            <div style={{
                                marginTop: 6,
                                fontSize: isDesktop ? 24 : 20,
                                lineHeight: 1.16,
                                fontWeight: 900,
                                fontFamily: "'Sora', sans-serif",
                                letterSpacing: -.5,
                            }}>
                                {monthLabel}
                            </div>
                            <div style={{
                                marginTop: 6,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                flexWrap: 'wrap',
                                fontSize: 11,
                                color: 'rgba(255,255,255,.82)',
                                fontWeight: 700,
                            }}>
                                <span>Total {totalRecords} catatan</span>
                                <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,.5)' }} />
                                <span>Halaman {currentPage}/{lastPage}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowFilter(prev => !prev)}
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
                            <Filter size={14} />
                            Filter
                            <ChevronDown
                                size={13}
                                style={{ transform: showFilter ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease' }}
                            />
                        </button>
                    </div>

                    {showFilter && (
                        <div style={{
                            display: 'flex',
                            gap: 8,
                            flexWrap: 'wrap',
                            marginBottom: 12,
                        }}>
                            {monthOptions.map(option => {
                                const isActive = option.value === filterMonth;
                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => {
                                            setFilterMonth(option.value);
                                            setCurrentPage(1);
                                            setShowFilter(false);
                                        }}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: 12,
                                            border: isActive ? '1px solid rgba(255,255,255,.26)' : '1px solid rgba(255,255,255,.14)',
                                            background: isActive ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.08)',
                                            color: '#fff',
                                            fontSize: 11,
                                            fontWeight: 800,
                                        }}
                                    >
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                    )}

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
                                    {item.value}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {records.length === 0 ? (
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
                        <History size={28} color={T.primary} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>
                        Belum ada riwayat
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12, color: T.textMuted, lineHeight: 1.7 }}>
                        Tidak ada catatan attendance untuk {monthLabel}.
                    </div>
                </section>
            ) : (
                <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {records.map(record => {
                        const isComplete = Boolean(record.time_in && record.time_out);
                        return (
                            <article
                                key={record.id}
                                style={surfaceCard(T, {
                                    padding: isDesktop ? '15px 16px' : '13px 14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                })}
                            >
                                <div style={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: 14,
                                    background: isComplete ? `${T.success}12` : `${T.gold}12`,
                                    border: `1px solid ${isComplete ? `${T.success}18` : `${T.gold}18`}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    {isComplete
                                        ? <CheckCircle2 size={18} color={T.success} />
                                        : <Clock3 size={18} color={T.gold} />}
                                </div>

                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        flexWrap: 'wrap',
                                        marginBottom: 6,
                                    }}>
                                        <span style={{
                                            fontSize: 12.5,
                                            fontWeight: 900,
                                            color: T.text,
                                            fontFamily: "'Sora', sans-serif",
                                        }}>
                                            {formatDateLabel(record.date)}
                                        </span>
                                        <span style={{
                                            fontSize: 9.5,
                                            fontWeight: 800,
                                            padding: '4px 9px',
                                            borderRadius: 999,
                                            background: isComplete ? `${T.success}12` : `${T.gold}12`,
                                            color: isComplete ? T.success : T.gold,
                                            border: `1px solid ${isComplete ? `${T.success}18` : `${T.gold}18`}`,
                                        }}>
                                            {isComplete ? 'Selesai' : 'Aktif'}
                                        </span>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 14,
                                        flexWrap: 'wrap',
                                        fontSize: 11,
                                        color: T.textMuted,
                                        fontWeight: 700,
                                    }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                            <Fingerprint size={12} color={T.success} />
                                            {record.time_in || '—'}
                                        </span>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                            <Clock3 size={12} color={record.time_out ? T.info : T.textMuted} />
                                            {record.time_out || '—'}
                                        </span>
                                        {record.branch?.name && (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                                <MapPin size={12} color={T.primary} />
                                                {record.branch.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </section>
            )}

            {lastPage > 1 && (
                <section style={surfaceCard(T, {
                    padding: isDesktop ? '14px 16px' : '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                })}>
                    <button
                        onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                        disabled={currentPage === 1}
                        style={paginationButtonStyle(T, currentPage === 1)}
                    >
                        <ChevronLeft size={15} />
                        Prev
                    </button>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                    }}>
                        {pageNumbers.map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                style={{
                                    minWidth: 34,
                                    height: 34,
                                    borderRadius: 12,
                                    border: page === currentPage ? 'none' : `1px solid ${T.border}`,
                                    background: page === currentPage
                                        ? `linear-gradient(135deg, ${T.primary}, ${T.info})`
                                        : T.bgAlt,
                                    color: page === currentPage ? '#fff' : T.text,
                                    fontSize: 11,
                                    fontWeight: 800,
                                }}
                            >
                                {page}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setCurrentPage(page => Math.min(lastPage, page + 1))}
                        disabled={currentPage === lastPage}
                        style={paginationButtonStyle(T, currentPage === lastPage)}
                    >
                        Next
                        <ChevronRight size={15} />
                    </button>
                </section>
            )}

            {totalRecords > 0 && (
                <div style={{
                    fontSize: 11,
                    color: T.textMuted,
                    textAlign: 'center',
                    fontWeight: 700,
                }}>
                    Menampilkan {visibleRangeStart}-{visibleRangeEnd} dari {totalRecords} catatan
                </div>
            )}
        </div>
    );
}

function surfaceCard(T: Theme, extra?: CSSProperties): CSSProperties {
    return {
        borderRadius: 24,
        background: T.card,
        border: `1px solid ${T.border}`,
        boxShadow: T.shadowSm,
        ...extra,
    };
}

function paginationButtonStyle(T: Theme, disabled = false): CSSProperties {
    return {
        height: 36,
        padding: '0 12px',
        borderRadius: 12,
        border: `1px solid ${T.border}`,
        background: T.bgAlt,
        color: T.text,
        fontSize: 11,
        fontWeight: 800,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        opacity: disabled ? .45 : 1,
    };
}

function formatDateLabel(date: string): string {
    return new Date(`${date}T00:00:00`).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function getPageNumbers(currentPage: number, lastPage: number): number[] {
    if (lastPage <= 3) {
        return Array.from({ length: lastPage }, (_, index) => index + 1);
    }

    if (currentPage <= 2) {
        return [1, 2, 3];
    }

    if (currentPage >= lastPage - 1) {
        return [lastPage - 2, lastPage - 1, lastPage];
    }

    return [currentPage - 1, currentPage, currentPage + 1];
}
