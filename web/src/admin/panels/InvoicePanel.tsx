import { useEffect, useMemo, useState } from 'react';
import {
    AlertCircle, CheckCircle2, Clock, CreditCard,
    Loader2, Receipt, RefreshCcw, Search, TrendingUp, X,
} from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { platformApi } from '@/api/platform.api';
import { useAuthStore } from '@/store/authStore';

/* ═══════════════════ Types ═══════════════════ */
interface Props { T: Theme; isDesktop: boolean; }

interface Invoice {
    id: number;
    invoice_number: string;
    company_id: number;
    amount_total: number;
    currency: string;
    status: 'paid' | 'pending' | 'overdue' | 'cancelled';
    issued_at: string;
    due_at: string;
    paid_at: string | null;
    company?: { id: number; name: string; code: string };
}

/* ═══════════════════ Helpers ═══════════════════ */
const currencyFmt = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

function formatDate(v?: string | null): string {
    if (!v) return '-';
    try {
        return new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return '-'; }
}

function statusMeta(status: string, T: Theme) {
    switch (status) {
        case 'paid': return { bg: `${T.success}14`, color: T.success, border: `${T.success}35`, icon: CheckCircle2 };
        case 'pending': return { bg: `${T.gold}14`, color: T.gold, border: `${T.gold}35`, icon: Clock };
        case 'overdue': return { bg: `${T.danger}12`, color: T.danger, border: `${T.danger}35`, icon: AlertCircle };
        default: return { bg: `${T.textMuted}10`, color: T.textMuted, border: T.border, icon: Receipt };
    }
}

/* ═══════════════════ Component ═══════════════════ */
export function InvoicePanel({ T, isDesktop }: Props) {
    const user = useAuthStore(s => s.user);
    const isSuperAdmin = user?.role === 'super_admin';
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');

    const loadInvoices = async () => {
        setLoading(true);
        try {
            const res = isSuperAdmin
                ? await platformApi.getInvoices()
                : await platformApi.getMyInvoices();
            setInvoices(res.data?.data ?? []);
        } catch { setInvoices([]); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadInvoices(); }, [isSuperAdmin]);

    /* ── Filtered + Stats ── */
    const filtered = useMemo(() => {
        let list = invoices;
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(inv =>
                inv.invoice_number?.toLowerCase().includes(q) ||
                inv.company?.name?.toLowerCase().includes(q)
            );
        }
        if (statusFilter !== 'all') {
            list = list.filter(inv => inv.status === statusFilter);
        }
        return list;
    }, [invoices, search, statusFilter]);

    const stats = useMemo(() => ({
        total: invoices.length,
        paid: invoices.filter(i => i.status === 'paid').length,
        pending: invoices.filter(i => i.status === 'pending').length,
        totalAmount: invoices.reduce((s, i) => s + (i.amount_total ?? 0), 0),
    }), [invoices]);

    /* ═══ Styles ═══ */
    const s = {
        statCard: {
            background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: '12px 14px',
        } as React.CSSProperties,
        statLabel: { fontSize: 11, color: T.textMuted } as React.CSSProperties,
        statValue: { fontSize: 22, fontWeight: 900, color: T.text, marginTop: 6, fontFamily: "'Sora', sans-serif" } as React.CSSProperties,
        section: {
            background: T.card, border: `1px solid ${T.border}`, borderRadius: 18, padding: isDesktop ? 16 : 12,
        } as React.CSSProperties,
        sectionIcon: {
            width: 30, height: 30, borderRadius: 10, background: `${T.gold}18`, color: T.gold,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        } as React.CSSProperties,
        sectionTitle: {
            fontSize: 15, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif",
        } as React.CSSProperties,
        sectionMeta: { marginTop: 4, fontSize: 12, color: T.textMuted } as React.CSSProperties,
        searchWrap: {
            flex: 1, minWidth: isDesktop ? 240 : '100%', display: 'flex', alignItems: 'center', gap: 8,
            height: 40, borderRadius: 11, border: `1px solid ${T.border}`, background: T.bgAlt, padding: '0 10px',
        } as React.CSSProperties,
        searchInput: { flex: 1, color: T.text, fontSize: 13 } as React.CSSProperties,
        filterSelect: {
            height: 40, borderRadius: 11, border: `1px solid ${T.border}`, background: T.bgAlt,
            color: T.text, fontSize: 12, padding: '0 10px', minWidth: 110,
        } as React.CSSProperties,
        neutralBtn: {
            height: 40, borderRadius: 10, border: `1px solid ${T.border}`, background: T.bgAlt,
            color: T.textSub, padding: '0 10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        } as React.CSSProperties,
        thCell: {
            textAlign: 'left' as const, padding: '11px 12px', fontSize: 11, letterSpacing: '.02em',
            textTransform: 'uppercase' as const, color: T.textMuted, borderBottom: `1px solid ${T.border}`,
        } as React.CSSProperties,
        tdCell: { padding: '12px 12px', borderBottom: `1px solid ${T.border}` } as React.CSSProperties,
        mCard: {
            borderRadius: 14, border: `1px solid ${T.border}`, background: T.bgAlt, padding: 14,
        } as React.CSSProperties,
        pill: (status: string) => {
            const m = statusMeta(status, T);
            return {
                fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 999,
                background: m.bg, color: m.color, border: `1px solid ${m.border}`,
                display: 'inline-flex', alignItems: 'center', gap: 4,
            } as React.CSSProperties;
        },
    };

    return (
        <div style={{ display: 'grid', gap: 14 }}>
            {/* ── Stats Grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(4, minmax(0, 1fr))' : '1fr 1fr', gap: 10 }}>
                {[
                    { label: 'Total Invoice', value: stats.total, icon: Receipt, tone: T.primary },
                    { label: 'Lunas', value: stats.paid, icon: CheckCircle2, tone: T.success },
                    { label: 'Pending', value: stats.pending, icon: Clock, tone: T.gold },
                    { label: 'Total Tagihan', value: currencyFmt.format(stats.totalAmount), icon: TrendingUp, tone: T.info },
                ].map(item => (
                    <div key={item.label} style={s.statCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={s.statLabel}>{item.label}</div>
                            <item.icon size={14} color={item.tone} />
                        </div>
                        <div style={s.statValue}>{item.value}</div>
                    </div>
                ))}
            </div>

            {/* ── Main Section ── */}
            <section style={s.section}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: isDesktop ? 'center' : 'flex-start', justifyContent: 'space-between', gap: 10, flexDirection: isDesktop ? 'row' : 'column' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={s.sectionIcon}><Receipt size={14} /></div>
                            <div style={s.sectionTitle}>Daftar Invoice</div>
                        </div>
                        <div style={s.sectionMeta}>{filtered.length} invoice • filter {statusFilter === 'all' ? 'Semua' : statusFilter}</div>
                    </div>
                </div>

                {/* Search + Filter */}
                <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <div style={s.searchWrap}>
                        <Search size={14} color={T.textMuted} />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nomor invoice..."
                            style={s.searchInput} />
                        {search && <button onClick={() => setSearch('')} style={{ color: T.textMuted }}><X size={12} /></button>}
                    </div>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
                        style={s.filterSelect}>
                        <option value="all">Semua</option>
                        <option value="paid">Lunas</option>
                        <option value="pending">Pending</option>
                        <option value="overdue">Overdue</option>
                    </select>
                    <button onClick={loadInvoices} style={s.neutralBtn} title="Refresh"><RefreshCcw size={14} /></button>
                </div>

                {/* Content */}
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center' }}>
                        <Loader2 size={22} color={T.primary} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px', display: 'block' }} />
                        <span style={{ fontSize: 12, color: T.textMuted }}>Memuat data invoice...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center' }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: `${T.gold}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                            <Receipt size={22} color={T.textMuted} />
                        </div>
                        <p style={{ fontSize: 13, color: T.textMuted }}>{search ? 'Tidak ditemukan.' : 'Belum ada invoice.'}</p>
                    </div>
                ) : isDesktop ? (
                    /* Desktop table */
                    <div style={{ marginTop: 12, border: `1px solid ${T.border}`, borderRadius: 14, overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 650 }}>
                            <thead><tr style={{ background: T.bgAlt }}>
                                {['Invoice', 'Tanggal', 'Jatuh Tempo', 'Total', 'Status'].map(h => (
                                    <th key={h} style={s.thCell}>{h}</th>
                                ))}
                            </tr></thead>
                            <tbody>
                                {filtered.map(inv => {
                                    const sm = statusMeta(inv.status, T);
                                    const Icon = sm.icon;
                                    return (
                                        <tr key={inv.id} style={{ background: T.card, transition: 'background .15s' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = T.bgAlt)}
                                            onMouseLeave={e => (e.currentTarget.style.background = T.card)}>
                                            <td style={s.tdCell}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{
                                                        width: 34, height: 34, borderRadius: 10,
                                                        background: `${T.gold}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                    }}>
                                                        <CreditCard size={15} color={T.gold} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: 12, fontWeight: 800, color: T.text }}>{inv.invoice_number}</div>
                                                        {inv.company && <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{inv.company.name}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ ...s.tdCell, fontSize: 11, color: T.textSub }}>{formatDate(inv.issued_at)}</td>
                                            <td style={{ ...s.tdCell, fontSize: 11, color: T.textSub }}>{formatDate(inv.due_at)}</td>
                                            <td style={{ ...s.tdCell, fontSize: 13, fontWeight: 900, color: T.text }}>
                                                {currencyFmt.format(inv.amount_total ?? 0)}
                                            </td>
                                            <td style={s.tdCell}>
                                                <span style={s.pill(inv.status)}>
                                                    <Icon size={10} /> {inv.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    /* Mobile cards */
                    <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                        {filtered.map(inv => {
                            const sm = statusMeta(inv.status, T);
                            const Icon = sm.icon;
                            return (
                                <div key={inv.id} style={s.mCard}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{
                                                width: 36, height: 36, borderRadius: 11,
                                                background: `${T.gold}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                            }}>
                                                <CreditCard size={16} color={T.gold} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{inv.invoice_number}</div>
                                                {inv.company && <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{inv.company.name}</div>}
                                            </div>
                                        </div>
                                        <span style={s.pill(inv.status)}><Icon size={10} /> {inv.status}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 }}>
                                        <div>
                                            <div style={{ fontSize: 10, color: T.textMuted }}>Due: {formatDate(inv.due_at)}</div>
                                            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 1 }}>Issued: {formatDate(inv.issued_at)}</div>
                                        </div>
                                        <div style={{ fontSize: 16, fontWeight: 900, color: T.text }}>
                                            {currencyFmt.format(inv.amount_total ?? 0)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
