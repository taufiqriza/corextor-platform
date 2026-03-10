import { useEffect, useState } from 'react';
import {
    Activity, Building2, CheckCircle2, Clock, CreditCard,
    Loader2, Package, RefreshCcw, TrendingUp, Users,
} from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { platformApi } from '@/api/platform.api';

/* ═══════════════════ Types ═══════════════════ */
interface Props { T: Theme; isDesktop: boolean; isSuperAdmin: boolean; }

interface PlanInfo {
    id: number;
    name: string;
    code: string;
    price: number;
    billing_cycle: string;
}

interface ProductOverview {
    id: number;
    name: string;
    code: string;
    description: string | null;
    status: string;
    plans: PlanInfo[];
    stats: {
        total_subscribers: number;
        active_subscribers: number;
        total_revenue: number;
    };
}

/* ═══════════════════ Helpers ═══════════════════ */
const currencyFmt = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

/* ═══════════════════ Component ═══════════════════ */
export function SubscriptionPanel({ T, isDesktop }: Props) {
    const [products, setProducts] = useState<ProductOverview[]>([]);
    const [loading, setLoading] = useState(true);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const res = await platformApi.getProductOverview();
            setProducts(res.data?.data ?? []);
        } catch { setProducts([]); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadProducts(); }, []);

    /* ═══ Aggregate stats ═══ */
    const totalSubs = products.reduce((n, p) => n + p.stats.total_subscribers, 0);
    const activeSubs = products.reduce((n, p) => n + p.stats.active_subscribers, 0);
    const totalRevenue = products.reduce((n, p) => n + p.stats.total_revenue, 0);
    const totalPlans = products.reduce((n, p) => n + p.plans.length, 0);

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
        sectionIcon: (bg: string, color: string) => ({
            width: 30, height: 30, borderRadius: 10, background: bg, color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        } as React.CSSProperties),
        sectionTitle: {
            fontSize: 15, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif",
        } as React.CSSProperties,
        sectionMeta: { marginTop: 4, fontSize: 12, color: T.textMuted } as React.CSSProperties,
        neutralBtn: {
            height: 36, borderRadius: 10, border: `1px solid ${T.border}`, background: T.bgAlt,
            color: T.textSub, padding: '0 10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        } as React.CSSProperties,
        pill: (active: boolean) => ({
            fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 999,
            background: active ? `${T.success}16` : `${T.danger}12`,
            color: active ? T.success : T.danger,
        } as React.CSSProperties),
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60, flexDirection: 'column', gap: 12 }}>
                <Loader2 size={24} color={T.primary} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 12, color: T.textMuted }}>Memuat data produk...</span>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gap: 14 }}>
            {/* ── Stats Grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(4, minmax(0, 1fr))' : '1fr 1fr', gap: 10 }}>
                {[
                    { label: 'Total Products', value: products.length, icon: Package, tone: T.primary },
                    { label: 'Active Subscribers', value: activeSubs, icon: CheckCircle2, tone: T.success },
                    { label: 'Total Subscribers', value: totalSubs, icon: Users, tone: T.info },
                    { label: 'Monthly Revenue', value: currencyFmt.format(totalRevenue), icon: TrendingUp, tone: T.gold },
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

            {/* ── Product Cards ── */}
            <section style={s.section}>
                <div style={{ display: 'flex', alignItems: isDesktop ? 'center' : 'flex-start', justifyContent: 'space-between', gap: 10, flexDirection: isDesktop ? 'row' : 'column' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={s.sectionIcon(`${T.primary}18`, T.primary)}><Package size={14} /></div>
                            <div style={s.sectionTitle}>Product Catalog</div>
                        </div>
                        <div style={s.sectionMeta}>{products.length} products • {totalPlans} plans</div>
                    </div>
                    <button onClick={loadProducts} style={s.neutralBtn} title="Refresh">
                        <RefreshCcw size={14} />
                    </button>
                </div>

                {products.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center' }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: `${T.primary}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                            <Package size={22} color={T.textMuted} />
                        </div>
                        <p style={{ fontSize: 13, color: T.textMuted }}>Belum ada product.</p>
                    </div>
                ) : (
                    <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(2, 1fr)' : '1fr', gap: 12 }}>
                        {products.map(product => (
                            <div key={product.id} style={{
                                borderRadius: 16, border: `1px solid ${T.border}`, background: T.bgAlt,
                                overflow: 'hidden',
                            }}>
                                {/* Product header */}
                                <div style={{
                                    padding: '16px 16px 12px',
                                    background: `linear-gradient(135deg, ${T.primary}08, ${T.primaryDark}06)`,
                                    borderBottom: `1px solid ${T.border}`,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{
                                                width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                                                background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                boxShadow: `0 6px 20px ${T.primaryGlow}`,
                                            }}>
                                                <Package size={20} color="#fff" />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 16, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>
                                                    {product.name}
                                                </div>
                                                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                                                    {product.code.toUpperCase()} • {product.plans.length} plan
                                                </div>
                                            </div>
                                        </div>
                                        <span style={s.pill(product.status === 'active')}>
                                            {product.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Subscriber stats */}
                                <div style={{ padding: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                                    {[
                                        { label: 'Active', value: product.stats.active_subscribers, icon: Activity, tone: T.success },
                                        { label: 'Total', value: product.stats.total_subscribers, icon: Building2, tone: T.info },
                                        { label: 'Revenue', value: currencyFmt.format(product.stats.total_revenue), icon: CreditCard, tone: T.gold, small: true },
                                    ].map(stat => (
                                        <div key={stat.label} style={{
                                            background: T.card, borderRadius: 11, padding: '10px 10px', textAlign: 'center',
                                            border: `1px solid ${T.border}`,
                                        }}>
                                            <stat.icon size={14} color={stat.tone} style={{ margin: '0 auto 4px', display: 'block' }} />
                                            <div style={{ fontSize: stat.small ? 11 : 16, fontWeight: 900, color: T.text }}>
                                                {stat.value}
                                            </div>
                                            <div style={{ fontSize: 9, color: T.textMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: .5 }}>
                                                {stat.label}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Plans */}
                                <div style={{ padding: '0 14px 14px' }}>
                                    <div style={{ fontSize: 11, fontWeight: 800, color: T.textSub, marginBottom: 8, textTransform: 'uppercase', letterSpacing: .5 }}>
                                        Available Plans
                                    </div>
                                    <div style={{ display: 'grid', gap: 6 }}>
                                        {product.plans.map(plan => (
                                            <div key={plan.id} style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '10px 12px', borderRadius: 10,
                                                background: T.card, border: `1px solid ${T.border}`,
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{
                                                        width: 28, height: 28, borderRadius: 8,
                                                        background: `${T.info}12`, color: T.info,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}>
                                                        <Clock size={13} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: 12, fontWeight: 800, color: T.text }}>{plan.name}</div>
                                                        <div style={{ fontSize: 10, color: T.textMuted }}>{plan.billing_cycle}</div>
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: 13, fontWeight: 900, color: T.primary }}>
                                                    {currencyFmt.format(plan.price)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
