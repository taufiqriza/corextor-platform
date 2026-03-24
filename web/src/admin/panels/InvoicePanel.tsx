import { useEffect, useMemo, useState } from 'react';
import {
    AlertCircle, Ban, CheckCircle2, Clock,
    FileText, Loader2, MoreVertical, Plus, Receipt, RefreshCcw,
    Search, TrendingUp, X,
} from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { platformApi } from '@/api/platform.api';
import { useAuthStore } from '@/store/authStore';

/* ═══════════════════ Types ═══════════════════ */
interface Props { T: Theme; isDesktop: boolean; }

interface InvoiceItem {
    id: number; description: string; quantity: number;
    unit_price: number; line_total: number;
}
interface Invoice {
    id: number; invoice_number: string; company_id: number;
    amount_total: number; currency: string;
    status: 'draft' | 'issued' | 'pending' | 'paid' | 'overdue' | 'cancelled';
    issued_at: string; due_at: string; paid_at: string | null;
    company?: { id: number; name: string; code: string };
    items: InvoiceItem[];
}
interface Stats {
    total: number; paid: number; pending: number; overdue: number;
    total_amount: number; paid_amount: number; unpaid_amount: number;
}

/* ═══════════════════ Helpers ═══════════════════ */
const fmt = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

function formatDate(v?: string | null): string {
    if (!v) return '-';
    try { return new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return '-'; }
}

function statusMeta(status: string, T: Theme) {
    switch (status) {
        case 'paid': return { label: 'Lunas', bg: `${T.success}14`, color: T.success, border: `${T.success}35`, icon: CheckCircle2 };
        case 'pending': case 'issued': return { label: 'Pending', bg: `${T.gold}14`, color: T.gold, border: `${T.gold}35`, icon: Clock };
        case 'overdue': return { label: 'Jatuh Tempo', bg: `${T.danger}12`, color: T.danger, border: `${T.danger}35`, icon: AlertCircle };
        case 'cancelled': return { label: 'Dibatalkan', bg: `${T.textMuted}10`, color: T.textMuted, border: T.border, icon: Ban };
        default: return { label: status, bg: `${T.textMuted}10`, color: T.textMuted, border: T.border, icon: Receipt };
    }
}

/* ═══════════════════ Component ═══════════════════ */
export function InvoicePanel({ T, isDesktop }: Props) {
    const user = useAuthStore(s => s.user);
    const isSuperAdmin = ['super_admin', 'platform_staff', 'platform_finance'].includes(user?.role ?? '');

    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, paid: 0, pending: 0, overdue: 0, total_amount: 0, paid_amount: 0, unpaid_amount: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Detail / Actions
    const [detailInv, setDetailInv] = useState<Invoice | null>(null);
    const [activeMenu, setActiveMenu] = useState<number | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Create modal
    const [showCreate, setShowCreate] = useState(false);
    const [createCompanyId, setCreateCompanyId] = useState('');
    const [createDesc, setCreateDesc] = useState('');
    const [createPrice, setCreatePrice] = useState('');
    const [createQty, setCreateQty] = useState('1');
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState('');

    const loadInvoices = async () => {
        setLoading(true);
        try {
            const res = isSuperAdmin
                ? await platformApi.getInvoices()
                : await platformApi.getMyInvoices();
            const data = res.data?.data ?? {};
            setInvoices(data.invoices ?? data ?? []);
            if (data.stats) setStats(data.stats);
        } catch { setInvoices([]); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadInvoices(); }, [isSuperAdmin]);

    const filtered = useMemo(() => {
        let list = invoices;
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(inv =>
                inv.invoice_number?.toLowerCase().includes(q) ||
                inv.company?.name?.toLowerCase().includes(q)
            );
        }
        if (statusFilter !== 'all') list = list.filter(inv => inv.status === statusFilter);
        return list;
    }, [invoices, search, statusFilter]);

    /* ── Actions ── */
    const handleMarkPaid = async (id: number) => {
        if (!confirm('Tandai invoice ini sebagai LUNAS?')) return;
        setActionLoading(true);
        try { await platformApi.markInvoicePaid(id); loadInvoices(); setActiveMenu(null); setDetailInv(null); }
        catch { } finally { setActionLoading(false); }
    };
    const handleCancel = async (id: number) => {
        if (!confirm('Batalkan invoice ini?')) return;
        setActionLoading(true);
        try { await platformApi.cancelInvoice(id); loadInvoices(); setActiveMenu(null); setDetailInv(null); }
        catch { } finally { setActionLoading(false); }
    };
    const handleCreate = async () => {
        if (!createCompanyId || !createDesc || !createPrice) return;
        setCreateLoading(true); setCreateError('');
        try {
            await platformApi.createInvoice({
                company_id: parseInt(createCompanyId),
                items: [{ description: createDesc, quantity: parseInt(createQty) || 1, unit_price: parseFloat(createPrice) }],
            });
            setShowCreate(false); setCreateCompanyId(''); setCreateDesc(''); setCreatePrice(''); setCreateQty('1');
            loadInvoices();
        } catch (e: any) { setCreateError(e.response?.data?.message || 'Gagal membuat invoice.'); }
        finally { setCreateLoading(false); }
    };

    /* ═══ Styles ═══ */
    const s = {
        statCard: { background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: '12px 14px' } as React.CSSProperties,
        statVal: { fontSize: 22, fontWeight: 900, color: T.text, marginTop: 6, fontFamily: "'Sora', sans-serif" } as React.CSSProperties,
        section: { background: T.card, border: `1px solid ${T.border}`, borderRadius: 18, padding: isDesktop ? 16 : 12 } as React.CSSProperties,
        sectionIcon: { width: 30, height: 30, borderRadius: 10, background: `${T.primary}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as React.CSSProperties,
        searchWrap: { flex: 1, minWidth: isDesktop ? 240 : '100%', display: 'flex', alignItems: 'center', gap: 8, height: 40, borderRadius: 11, border: `1px solid ${T.border}`, background: T.bgAlt, padding: '0 10px' } as React.CSSProperties,
        th: { textAlign: 'left' as const, padding: '11px 12px', fontSize: 11, letterSpacing: '.02em', textTransform: 'uppercase' as const, color: T.textMuted, borderBottom: `1px solid ${T.border}` } as React.CSSProperties,
        td: { padding: '12px 12px', borderBottom: `1px solid ${T.border}` } as React.CSSProperties,
        mCard: { borderRadius: 14, border: `1px solid ${T.border}`, background: T.bgAlt, padding: 14, marginBottom: 8 } as React.CSSProperties,
        pill: (bg: string, color: string, border?: string) => ({
            fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 999,
            background: bg, color, border: `1px solid ${border || bg}`,
            display: 'inline-flex', alignItems: 'center', gap: 4,
        } as React.CSSProperties),
        btn: (bg: string, color: string) => ({
            height: 40, padding: '0 16px', borderRadius: 11, background: bg, color,
            fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6,
        } as React.CSSProperties),
        modal: {
            position: 'fixed' as const, inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        } as React.CSSProperties,
        modalBox: (maxW = 480) => ({
            background: T.card, borderRadius: 18, border: `1px solid ${T.border}`,
            padding: isDesktop ? 28 : 20, width: '100%', maxWidth: maxW,
            maxHeight: '85vh', overflowY: 'auto' as const,
        } as React.CSSProperties),
        input: {
            width: '100%', height: 42, borderRadius: 10, border: `1px solid ${T.border}`,
            background: T.bgAlt, color: T.text, fontSize: 13, padding: '0 12px',
        } as React.CSSProperties,
    };

    return (
        <div style={{ display: 'grid', gap: 14 }}>
            {/* ── Stats Grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(4, minmax(0,1fr))' : '1fr 1fr', gap: 10 }}>
                {[
                    { label: 'Total Invoice', value: stats.total.toString(), icon: Receipt, tone: T.primary },
                    { label: 'Lunas', value: stats.paid.toString(), icon: CheckCircle2, tone: T.success },
                    { label: 'Pending', value: stats.pending.toString(), icon: Clock, tone: T.gold },
                    { label: 'Belum Dibayar', value: fmt.format(stats.unpaid_amount), icon: TrendingUp, tone: T.danger, small: true },
                ].map(c => (
                    <div key={c.label} style={s.statCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: T.textMuted }}>{c.label}</span>
                            <c.icon size={14} color={c.tone} />
                        </div>
                        <div style={{ ...s.statVal, fontSize: c.small ? 16 : 22 }}>{c.value}</div>
                    </div>
                ))}
            </div>

            {/* ── Main Section ── */}
            <section style={s.section}>
                <div style={{ display: 'flex', alignItems: isDesktop ? 'center' : 'flex-start', justifyContent: 'space-between', gap: 10, flexDirection: isDesktop ? 'row' : 'column' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={s.sectionIcon}><Receipt size={14} color={T.primary} /></div>
                            <div style={{ fontSize: 15, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>Daftar Invoice</div>
                        </div>
                        <div style={{ marginTop: 4, fontSize: 12, color: T.textMuted }}>{filtered.length} invoice ditemukan</div>
                    </div>
                    {isSuperAdmin && (
                        <button onClick={() => setShowCreate(true)} style={s.btn(T.primary, '#fff')}>
                            <Plus size={14} /> Buat Invoice
                        </button>
                    )}
                </div>

                {/* Search + Filter */}
                <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <div style={s.searchWrap}>
                        <Search size={14} color={T.textMuted} />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nomor invoice atau perusahaan..."
                            style={{ flex: 1, color: T.text, fontSize: 13 }} />
                        {search && <button onClick={() => setSearch('')} style={{ color: T.textMuted }}><X size={12} /></button>}
                    </div>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                        style={{ height: 40, borderRadius: 11, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.text, fontSize: 12, padding: '0 10px', minWidth: 120 }}>
                        <option value="all">Semua Status</option>
                        <option value="paid">Lunas</option>
                        <option value="pending">Pending</option>
                        <option value="overdue">Jatuh Tempo</option>
                        <option value="cancelled">Dibatalkan</option>
                    </select>
                    <button onClick={loadInvoices} style={{ height: 40, borderRadius: 10, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.textSub, padding: '0 10px', display: 'inline-flex', alignItems: 'center' }} title="Refresh"><RefreshCcw size={14} /></button>
                </div>

                {/* Content */}
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center' }}>
                        <Loader2 size={22} color={T.primary} style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 8px' }} />
                        <span style={{ fontSize: 12, color: T.textMuted }}>Memuat data invoice...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center' }}>
                        <Receipt size={28} color={T.textMuted} style={{ margin: '0 auto 8px', display: 'block' }} />
                        <p style={{ fontSize: 13, color: T.textMuted }}>{search ? 'Tidak ditemukan.' : 'Belum ada invoice.'}</p>
                    </div>
                ) : isDesktop ? (
                    /* Desktop Table */
                    <div style={{ marginTop: 12, border: `1px solid ${T.border}`, borderRadius: 14, overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 750 }}>
                            <thead><tr style={{ background: T.bgAlt }}>
                                {['No. Invoice', 'Perusahaan', 'Total', 'Status', 'Jatuh Tempo', ''].map(h => <th key={h} style={s.th}>{h}</th>)}
                            </tr></thead>
                            <tbody>{filtered.map(inv => {
                                const sm = statusMeta(inv.status, T);
                                const Icon = sm.icon;
                                return (
                                    <tr key={inv.id} style={{ background: T.card, transition: 'background .15s', cursor: 'pointer' }}
                                        onMouseEnter={e => e.currentTarget.style.background = T.bgAlt}
                                        onMouseLeave={e => e.currentTarget.style.background = T.card}
                                        onClick={() => setDetailInv(inv)}>
                                        <td style={s.td}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <FileText size={14} color={T.primary} />
                                                <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{inv.invoice_number}</span>
                                            </div>
                                        </td>
                                        <td style={{ ...s.td, fontSize: 12, color: T.textSub }}>{inv.company?.name ?? '-'}</td>
                                        <td style={{ ...s.td, fontSize: 13, fontWeight: 700, color: T.text }}>{fmt.format(inv.amount_total)}</td>
                                        <td style={s.td}>
                                            <span style={s.pill(sm.bg, sm.color, sm.border)}><Icon size={10} /> {sm.label}</span>
                                        </td>
                                        <td style={{ ...s.td, fontSize: 12, color: T.textSub }}>{formatDate(inv.due_at)}</td>
                                        <td style={{ ...s.td, textAlign: 'right', position: 'relative' }} onClick={e => e.stopPropagation()}>
                                            {['pending', 'issued', 'overdue'].includes(inv.status) && isSuperAdmin && (
                                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                                    <button onClick={() => setActiveMenu(activeMenu === inv.id ? null : inv.id)}
                                                        style={{ color: T.textMuted, padding: 6, borderRadius: 8 }}>
                                                        <MoreVertical size={14} />
                                                    </button>
                                                    {activeMenu === inv.id && (
                                                        <div style={{
                                                            position: 'absolute', right: 0, top: '100%', zIndex: 20,
                                                            background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
                                                            boxShadow: T.shadow, minWidth: 150, overflow: 'hidden',
                                                        }}>
                                                            <button onClick={() => handleMarkPaid(inv.id)} style={{
                                                                display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px',
                                                                fontSize: 12, color: T.success, borderBottom: `1px solid ${T.border}`,
                                                            }}>✓ Tandai Lunas</button>
                                                            <button onClick={() => handleCancel(inv.id)} style={{
                                                                display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px',
                                                                fontSize: 12, color: T.danger,
                                                            }}>✕ Batalkan</button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}</tbody>
                        </table>
                    </div>
                ) : (
                    /* Mobile Cards */
                    <div style={{ marginTop: 12 }}>
                        {filtered.map(inv => {
                            const sm = statusMeta(inv.status, T);
                            const Icon = sm.icon;
                            return (
                                <div key={inv.id} style={s.mCard} onClick={() => setDetailInv(inv)}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{inv.invoice_number}</div>
                                            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{inv.company?.name ?? '-'}</div>
                                        </div>
                                        <span style={s.pill(sm.bg, sm.color, sm.border)}><Icon size={10} /> {sm.label}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' }}>
                                        <div style={{ fontSize: 15, fontWeight: 900, color: T.text }}>{fmt.format(inv.amount_total)}</div>
                                        <div style={{ fontSize: 11, color: T.textMuted }}>Due: {formatDate(inv.due_at)}</div>
                                    </div>
                                    {['pending', 'issued', 'overdue'].includes(inv.status) && isSuperAdmin && (
                                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }} onClick={e => e.stopPropagation()}>
                                            <button onClick={() => handleMarkPaid(inv.id)} style={{
                                                ...s.btn(`${T.success}10`, T.success), height: 32, fontSize: 11, flex: 1,
                                            }}>✓ Lunas</button>
                                            <button onClick={() => handleCancel(inv.id)} style={{
                                                ...s.btn(`${T.danger}08`, T.danger), height: 32, fontSize: 11,
                                            }}>Batal</button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* ═══ Detail Modal ═══ */}
            {detailInv && (
                <div style={s.modal} onClick={() => setDetailInv(null)}>
                    <div style={s.modalBox(520)} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 900, color: T.text }}>Detail Invoice</h3>
                            <button onClick={() => setDetailInv(null)} style={{ color: T.textMuted }}><X size={18} /></button>
                        </div>

                        {/* Header info */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                            {[
                                { label: 'No. Invoice', value: detailInv.invoice_number },
                                { label: 'Status', value: statusMeta(detailInv.status, T).label, pill: true },
                                { label: 'Perusahaan', value: detailInv.company?.name ?? '-' },
                                { label: 'Total', value: fmt.format(detailInv.amount_total) },
                                { label: 'Diterbitkan', value: formatDate(detailInv.issued_at) },
                                { label: 'Jatuh Tempo', value: formatDate(detailInv.due_at) },
                                ...(detailInv.paid_at ? [{ label: 'Dibayar', value: formatDate(detailInv.paid_at) }] : []),
                            ].map((item, i) => (
                                <div key={i}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</div>
                                    {item.pill ? (() => { const sm = statusMeta(detailInv.status, T); const Icon = sm.icon; return <span style={s.pill(sm.bg, sm.color, sm.border)}><Icon size={10} /> {sm.label}</span>; })()
                                        : <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{item.value}</div>}
                                </div>
                            ))}
                        </div>

                        {/* Line Items */}
                        {detailInv.items && detailInv.items.length > 0 && (
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 800, color: T.textMuted, textTransform: 'uppercase', marginBottom: 8 }}>Item</div>
                                <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead><tr style={{ background: T.bgAlt }}>
                                            {['Deskripsi', 'Qty', 'Harga', 'Total'].map(h => (
                                                <th key={h} style={{ ...s.th, fontSize: 10 }}>{h}</th>
                                            ))}
                                        </tr></thead>
                                        <tbody>{detailInv.items.map(item => (
                                            <tr key={item.id}>
                                                <td style={{ ...s.td, fontSize: 12, color: T.text }}>{item.description}</td>
                                                <td style={{ ...s.td, fontSize: 12, textAlign: 'center' }}>{item.quantity}</td>
                                                <td style={{ ...s.td, fontSize: 12 }}>{fmt.format(item.unit_price)}</td>
                                                <td style={{ ...s.td, fontSize: 12, fontWeight: 700 }}>{fmt.format(item.line_total)}</td>
                                            </tr>
                                        ))}</tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        {['pending', 'issued', 'overdue'].includes(detailInv.status) && isSuperAdmin && (
                            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
                                <button onClick={() => handleCancel(detailInv.id)} disabled={actionLoading} style={{
                                    height: 40, padding: '0 18px', borderRadius: 10, border: `1px solid ${T.danger}30`,
                                    background: `${T.danger}08`, color: T.danger, fontSize: 12, fontWeight: 700,
                                }}>Batalkan</button>
                                <button onClick={() => handleMarkPaid(detailInv.id)} disabled={actionLoading} style={{
                                    height: 40, padding: '0 20px', borderRadius: 10, background: T.success,
                                    color: '#fff', fontSize: 12, fontWeight: 700, opacity: actionLoading ? .6 : 1,
                                }}>
                                    {actionLoading ? 'Memproses...' : '✓ Tandai Lunas'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══ Create Invoice Modal ═══ */}
            {showCreate && (
                <div style={s.modal} onClick={() => setShowCreate(false)}>
                    <div style={s.modalBox(480)} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 900, color: T.text }}>Buat Invoice Baru</h3>
                            <button onClick={() => setShowCreate(false)} style={{ color: T.textMuted }}><X size={18} /></button>
                        </div>

                        <div style={{ display: 'grid', gap: 14 }}>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 6 }}>COMPANY ID</label>
                                <input value={createCompanyId} onChange={e => setCreateCompanyId(e.target.value)} placeholder="Company ID (misal: 1)" style={s.input} type="number" />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 6 }}>DESKRIPSI ITEM</label>
                                <input value={createDesc} onChange={e => setCreateDesc(e.target.value)} placeholder="e.g. Attendance Basic — Maret 2026" style={s.input} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 6 }}>HARGA (IDR)</label>
                                    <input value={createPrice} onChange={e => setCreatePrice(e.target.value)} placeholder="99000" style={s.input} type="number" />
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 6 }}>QUANTITY</label>
                                    <input value={createQty} onChange={e => setCreateQty(e.target.value)} placeholder="1" style={s.input} type="number" />
                                </div>
                            </div>

                            {createError && <div style={{ fontSize: 12, color: T.danger, padding: '8px 12px', borderRadius: 8, background: `${T.danger}10` }}>{createError}</div>}

                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                                <button onClick={() => setShowCreate(false)} style={{
                                    height: 40, padding: '0 18px', borderRadius: 10, border: `1px solid ${T.border}`,
                                    background: T.bgAlt, color: T.textSub, fontSize: 12, fontWeight: 700,
                                }}>Batal</button>
                                <button onClick={handleCreate} disabled={createLoading || !createCompanyId || !createDesc || !createPrice} style={{
                                    height: 40, padding: '0 20px', borderRadius: 10, background: T.primary,
                                    color: '#fff', fontSize: 12, fontWeight: 700, opacity: createLoading ? .6 : 1,
                                }}>
                                    {createLoading ? 'Membuat...' : 'Buat Invoice'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
