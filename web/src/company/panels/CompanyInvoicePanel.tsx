import { useCallback, useEffect, useState } from 'react';
import {
    Receipt, Loader2, Check, Clock, AlertTriangle, XCircle,
    CreditCard, TrendingUp, FileText, ChevronDown, ChevronUp,
    Crown, Infinity as InfinityIcon, Package, Shield,
} from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { platformApi } from '@/api/platform.api';

/* ═══ Types ═══ */
type InvoiceItem = { id: number; description: string; quantity: number; unit_price: number; line_total: number };
type Invoice = {
    id: number; invoice_number: string; status: string; currency: string;
    amount_total: number; issued_at: string | null; due_at: string | null; paid_at: string | null;
    items: InvoiceItem[];
};
type Stats = {
    total: number; paid: number; pending: number; overdue: number;
    total_amount: number; paid_amount: number; unpaid_amount: number;
};
type Subscription = {
    id: number; status: string; billing_cycle: string; starts_at: string; ends_at: string | null;
    product: { id: number; name: string; code: string } | null;
    plan: { id: number; name: string; code: string; price: string; billing_cycle: string; features_json: Record<string, unknown> } | null;
};

type ActiveTab = 'overview' | 'history';

/* ═══ Panel ═══ */
export function CompanyInvoicePanel({ T, isDesktop }: { T: Theme; isDesktop: boolean }) {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
    const [expandedInvoice, setExpandedInvoice] = useState<number | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [invRes, subRes] = await Promise.all([
                platformApi.getMyInvoices(),
                platformApi.getMySubscriptions(),
            ]);
            const invData = invRes.data?.data;
            setInvoices(invData?.invoices ?? []);
            setStats(invData?.stats ?? null);
            setSubscriptions(subRes.data?.data ?? []);
        } catch { /* ignore */ }
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    /* ═══ Helpers ═══ */
    const formatRp = (n: number) => 'Rp ' + n.toLocaleString('id-ID');
    const formatDate = (v?: string | null) => v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

    const statusMeta = (s: string) => {
        switch (s) {
            case 'paid': return { label: 'Lunas', icon: Check, bg: `${T.success}14`, color: T.success, border: `${T.success}30` };
            case 'pending': return { label: 'Menunggu', icon: Clock, bg: `${T.gold}14`, color: T.gold, border: `${T.gold}30` };
            case 'overdue': return { label: 'Jatuh Tempo', icon: AlertTriangle, bg: `${T.danger}12`, color: T.danger, border: `${T.danger}30` };
            case 'cancelled': return { label: 'Dibatalkan', icon: XCircle, bg: `${T.textMuted}10`, color: T.textMuted, border: `${T.textMuted}20` };
            default: return { label: s, icon: FileText, bg: `${T.textMuted}10`, color: T.textMuted, border: `${T.textMuted}20` };
        }
    };

    const cycleMeta = (c: string) => {
        switch (c) {
            case 'lifetime': return { label: 'Lifetime', color: T.gold, icon: Crown };
            case 'yearly': return { label: 'Tahunan', color: T.info, icon: Package };
            default: return { label: 'Bulanan', color: T.primary, icon: CreditCard };
        }
    };

    /* ═══ Styles ═══ */
    const card = (p?: React.CSSProperties): React.CSSProperties => ({
        background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, ...p,
    });

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80, color: T.textMuted }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /><span style={{ marginLeft: 10, fontSize: 14 }}>Memuat tagihan…</span>
            </div>
        );
    }

    const activeSub = subscriptions.find(s => s.status === 'active' || s.status === 'trial');
    const isLifetime = activeSub?.billing_cycle === 'lifetime';

    return (
        <div style={{ width: '100%' }}>
            {/* Tab Nav */}
            <div style={{ ...card({ padding: 6, marginBottom: 16 }), display: 'flex', gap: 4 }}>
                {[
                    { key: 'overview' as ActiveTab, label: 'Ringkasan', icon: TrendingUp },
                    { key: 'history' as ActiveTab, label: 'Riwayat Tagihan', icon: FileText },
                ].map(tab => {
                    const active = activeTab === tab.key;
                    const Icon = tab.icon;
                    return (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            padding: '12px 16px', borderRadius: 12,
                            background: active ? `${T.primary}14` : 'transparent',
                            border: active ? `1.5px solid ${T.primary}40` : '1.5px solid transparent',
                            color: active ? T.primary : T.textMuted,
                            fontWeight: active ? 800 : 600, fontSize: 13,
                            transition: 'all .15s ease',
                        }}>
                            <Icon size={16} /> {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* ═══ OVERVIEW TAB ═══ */}
            {activeTab === 'overview' && (
                <>
                    {/* Active Subscription Card */}
                    {activeSub && (
                        <div style={{
                            ...card({
                                padding: 0, marginBottom: 16, overflow: 'hidden',
                                background: isLifetime
                                    ? `linear-gradient(135deg, ${T.gold}08, ${T.card})`
                                    : T.card,
                                borderColor: isLifetime ? `${T.gold}40` : T.border,
                            }),
                        }}>
                            {/* Header banner */}
                            <div style={{
                                padding: '16px 20px',
                                background: isLifetime
                                    ? `linear-gradient(135deg, #92400E15, #F59E0B08)`
                                    : `${T.primary}06`,
                                borderBottom: `1px solid ${isLifetime ? `${T.gold}20` : `${T.border}`}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{
                                        width: 44, height: 44, borderRadius: 14,
                                        background: isLifetime ? `${T.gold}20` : `${T.primary}15`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        {isLifetime ? <Crown size={20} color={T.gold} /> : <Package size={20} color={T.primary} />}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 16, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>
                                            {activeSub.plan?.name ?? activeSub.product?.name ?? 'Subscription'}
                                        </div>
                                        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                                            {activeSub.product?.name} • Aktif sejak {formatDate(activeSub.starts_at)}
                                        </div>
                                    </div>
                                </div>
                                <span style={{
                                    fontSize: 10, fontWeight: 800, padding: '5px 12px', borderRadius: 8,
                                    background: `${T.success}15`, color: T.success,
                                    border: `1px solid ${T.success}30`,
                                }}>
                                    ● Aktif
                                </span>
                            </div>

                            {/* Plan Details */}
                            <div style={{ padding: '18px 20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(3,1fr)' : '1fr 1fr', gap: 12, marginBottom: 16 }}>
                                    <div style={{ padding: '12px 14px', borderRadius: 12, background: T.bgAlt, border: `1px solid ${T.border}` }}>
                                        <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, marginBottom: 4 }}>Harga</div>
                                        <div style={{ fontSize: 20, fontWeight: 900, color: T.text }}>
                                            {formatRp(parseFloat(activeSub.plan?.price ?? '0'))}
                                        </div>
                                        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>
                                            {(() => { const cm = cycleMeta(activeSub.billing_cycle); return cm.label; })()}
                                        </div>
                                    </div>
                                    <div style={{ padding: '12px 14px', borderRadius: 12, background: T.bgAlt, border: `1px solid ${T.border}` }}>
                                        <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, marginBottom: 4 }}>Siklus</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                            {(() => {
                                                const cm = cycleMeta(activeSub.billing_cycle);
                                                const Icon = cm.icon;
                                                return (
                                                    <>
                                                        <Icon size={18} color={cm.color} />
                                                        <span style={{ fontSize: 16, fontWeight: 900, color: cm.color }}>{cm.label}</span>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                    <div style={{ padding: '12px 14px', borderRadius: 12, background: T.bgAlt, border: `1px solid ${T.border}`, gridColumn: !isDesktop ? 'span 2' : undefined }}>
                                        <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, marginBottom: 4 }}>Berlaku Hingga</div>
                                        <div style={{ fontSize: 16, fontWeight: 900, color: isLifetime ? T.gold : T.text }}>
                                            {isLifetime ? (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <InfinityIcon size={20} /> Selamanya
                                                </span>
                                            ) : (
                                                activeSub.ends_at ? formatDate(activeSub.ends_at) : 'Berlanjut'
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Features */}
                                {activeSub.plan?.features_json && (
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Fitur Termasuk</div>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            {Object.entries(activeSub.plan.features_json).map(([key, val]) => {
                                                const labels: Record<string, string> = {
                                                    selfie: 'Selfie', geofence: 'Geofence', max_users: 'Max User',
                                                    max_branches: 'Max Cabang', lifetime: 'Lifetime', priority_support: 'Support Prioritas',
                                                };
                                                const label = labels[key] ?? key;
                                                const display = typeof val === 'boolean' ? (val ? '✓' : '✗') : String(val);
                                                const isActive = val === true || (typeof val === 'number' && val > 0);
                                                return (
                                                    <span key={key} style={{
                                                        fontSize: 10, fontWeight: 700, padding: '5px 10px', borderRadius: 8,
                                                        background: isActive ? `${T.success}10` : `${T.textMuted}08`,
                                                        color: isActive ? T.success : T.textMuted,
                                                        border: `1px solid ${isActive ? `${T.success}25` : `${T.textMuted}15`}`,
                                                        display: 'flex', alignItems: 'center', gap: 4,
                                                    }}>
                                                        {typeof val === 'boolean' ? (
                                                            <>{isActive ? <Check size={10} /> : <XCircle size={10} />} {label}</>
                                                        ) : (
                                                            <>{label}: {display}</>
                                                        )}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {isLifetime && (
                                <div style={{
                                    padding: '12px 20px', borderTop: `1px solid ${T.gold}15`,
                                    background: `${T.gold}04`,
                                    display: 'flex', alignItems: 'center', gap: 10,
                                }}>
                                    <Shield size={14} color={T.gold} />
                                    <span style={{ fontSize: 11, color: T.gold, fontWeight: 600 }}>
                                        Paket Lifetime — Tidak ada tagihan berulang. Akses penuh selamanya.
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Stats Grid */}
                    {stats && (
                        <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(4,1fr)' : 'repeat(2,1fr)', gap: 10, marginBottom: 16 }}>
                            {[
                                { label: 'Total Tagihan', value: stats.total, color: T.primary, prefix: '' },
                                { label: 'Lunas', value: stats.paid, color: T.success, prefix: '' },
                                { label: 'Total Dibayar', value: stats.paid_amount, color: T.success, prefix: 'Rp', isCurrency: true },
                                { label: 'Belum Bayar', value: stats.unpaid_amount, color: stats.unpaid_amount > 0 ? T.danger : T.textMuted, prefix: 'Rp', isCurrency: true },
                            ].map(s => (
                                <div key={s.label} style={{ ...card({ padding: '14px 16px' }) }}>
                                    <div style={{ fontSize: s.isCurrency ? 16 : 24, fontWeight: 900, color: s.color }}>
                                        {s.isCurrency ? formatRp(s.value as number) : s.value}
                                    </div>
                                    <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, marginTop: 2 }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* No subscription */}
                    {!activeSub && (
                        <div style={{ ...card({ padding: 40 }), textAlign: 'center' }}>
                            <Package size={36} style={{ color: T.textMuted, opacity: 0.3, marginBottom: 12 }} />
                            <div style={{ fontSize: 14, fontWeight: 700, color: T.textSub }}>Belum ada subscription aktif</div>
                            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Hubungi admin Corextor untuk aktivasi layanan.</div>
                        </div>
                    )}
                </>
            )}

            {/* ═══ HISTORY TAB ═══ */}
            {activeTab === 'history' && (
                <>
                    {invoices.length === 0 ? (
                        <div style={{ ...card({ padding: 60 }), textAlign: 'center' }}>
                            <Receipt size={36} style={{ color: T.textMuted, opacity: 0.3, marginBottom: 12 }} />
                            <div style={{ fontSize: 14, fontWeight: 700, color: T.textSub }}>Belum ada tagihan</div>
                            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Tagihan akan muncul setelah subscription diaktifkan.</div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {invoices.map(inv => {
                                const sm = statusMeta(inv.status);
                                const StatusIcon = sm.icon;
                                const isExpanded = expandedInvoice === inv.id;

                                return (
                                    <div key={inv.id} style={{
                                        ...card({ overflow: 'hidden' }),
                                        borderColor: inv.status === 'overdue' ? `${T.danger}40` : T.border,
                                    }}>
                                        {/* Invoice Header */}
                                        <button onClick={() => setExpandedInvoice(isExpanded ? null : inv.id)} style={{
                                            width: '100%', padding: '16px 18px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            textAlign: 'left', transition: 'background .12s',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                                <div style={{
                                                    width: 42, height: 42, borderRadius: 12,
                                                    background: sm.bg, border: `1px solid ${sm.border}`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                }}>
                                                    <StatusIcon size={18} color={sm.color} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{inv.invoice_number}</div>
                                                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                                                        Diterbitkan: {formatDate(inv.issued_at)}
                                                        {inv.due_at && ` • Jatuh tempo: ${formatDate(inv.due_at)}`}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: 16, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>
                                                        {formatRp(inv.amount_total)}
                                                    </div>
                                                    <span style={{
                                                        fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                                                        background: sm.bg, color: sm.color, border: `1px solid ${sm.border}`,
                                                    }}>
                                                        {sm.label}
                                                    </span>
                                                </div>
                                                {isExpanded ? <ChevronUp size={16} color={T.textMuted} /> : <ChevronDown size={16} color={T.textMuted} />}
                                            </div>
                                        </button>

                                        {/* Expanded Detail */}
                                        {isExpanded && (
                                            <div style={{
                                                padding: '0 18px 16px',
                                                borderTop: `1px solid ${T.border}40`,
                                            }}>
                                                {/* Items */}
                                                <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, padding: '12px 0 8px' }}>
                                                    Item Tagihan
                                                </div>
                                                {inv.items.map(item => (
                                                    <div key={item.id} style={{
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        padding: '10px 12px', borderRadius: 10, background: T.bgAlt,
                                                        border: `1px solid ${T.border}`, marginBottom: 6,
                                                    }}>
                                                        <div>
                                                            <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{item.description}</div>
                                                            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>
                                                                {item.quantity} × {formatRp(item.unit_price)}
                                                            </div>
                                                        </div>
                                                        <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{formatRp(item.line_total)}</div>
                                                    </div>
                                                ))}

                                                {/* Total */}
                                                <div style={{
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    padding: '12px 12px', borderTop: `1px solid ${T.border}`,
                                                    marginTop: 4,
                                                }}>
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: T.textSub }}>Total</span>
                                                    <span style={{ fontSize: 18, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>
                                                        {formatRp(inv.amount_total)}
                                                    </span>
                                                </div>

                                                {/* Payment Info */}
                                                {inv.paid_at && (
                                                    <div style={{
                                                        display: 'flex', alignItems: 'center', gap: 8,
                                                        padding: '10px 12px', borderRadius: 10,
                                                        background: `${T.success}08`, border: `1px solid ${T.success}20`,
                                                        marginTop: 8,
                                                    }}>
                                                        <Check size={14} color={T.success} />
                                                        <span style={{ fontSize: 11, fontWeight: 600, color: T.success }}>
                                                            Dibayar pada {formatDate(inv.paid_at)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
