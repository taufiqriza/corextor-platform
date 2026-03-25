import { useEffect, useState } from 'react';
import {
    Activity, Building2, CheckCircle2, Clock, CreditCard,
    Loader2, Package, PencilLine, RefreshCcw, TrendingUp, Users, X,
} from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { platformApi } from '@/api/platform.api';

/* ═══════════════════ Types ═══════════════════ */
interface Props { T: Theme; isDesktop: boolean; isSuperAdmin: boolean; }

interface PlanInfo {
    id: number;
    name: string;
    code: string;
    family_code?: string;
    version_number?: number;
    price: number;
    billing_cycle: string;
    status?: string;
    effective_from?: string | null;
    version_notes?: string | null;
}

interface ProductOverview {
    id: number;
    name: string;
    code: string;
    description: string | null;
    workspace_key?: string | null;
    app_url?: string | null;
    metadata_json?: Record<string, unknown> | null;
    status: string;
    plans: PlanInfo[];
    stats: {
        total_subscribers: number;
        active_subscribers: number;
        total_revenue: number;
        plan_families?: number;
        plan_versions?: number;
    };
}

/* ═══════════════════ Helpers ═══════════════════ */
const currencyFmt = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

/* ═══════════════════ Component ═══════════════════ */
export function SubscriptionPanel({ T, isDesktop, isSuperAdmin }: Props) {
    const [products, setProducts] = useState<ProductOverview[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPlan, setEditingPlan] = useState<PlanInfo | null>(null);
    const [editPlanName, setEditPlanName] = useState('');
    const [editPlanPrice, setEditPlanPrice] = useState('');
    const [editPlanBillingCycle, setEditPlanBillingCycle] = useState('monthly');
    const [editPlanStatus, setEditPlanStatus] = useState('active');
    const [savingPlan, setSavingPlan] = useState(false);
    const [planError, setPlanError] = useState('');

    const loadProducts = async () => {
        setLoading(true);
        try {
            const res = await platformApi.getProductOverview();
            setProducts(res.data?.data ?? []);
        } catch { setProducts([]); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadProducts(); }, []);

    const openEditPlan = (plan: PlanInfo) => {
        setEditingPlan(plan);
        setEditPlanName(plan.name);
        setEditPlanPrice(String(plan.price));
        setEditPlanBillingCycle(plan.billing_cycle);
        setEditPlanStatus(plan.status ?? 'active');
        setPlanError('');
    };

    const handleUpdatePlan = async () => {
        if (!editingPlan) return;
        setSavingPlan(true);
        setPlanError('');
        try {
            await platformApi.updatePlan(editingPlan.id, {
                name: editPlanName.trim(),
                price: Number(editPlanPrice),
                billing_cycle: editPlanBillingCycle,
                status: editPlanStatus,
            });
            setEditingPlan(null);
            await loadProducts();
        } catch (err: any) {
            setPlanError(err?.response?.data?.message ?? 'Gagal memperbarui plan.');
        } finally {
            setSavingPlan(false);
        }
    };

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
        overlay: {
            position: 'fixed' as const,
            inset: 0,
            zIndex: 140,
            background: 'rgba(2,10,7,.56)',
            backdropFilter: 'blur(4px)',
        } as React.CSSProperties,
        modalFrame: {
            position: 'fixed' as const,
            inset: 0,
            zIndex: 141,
            display: 'flex',
            alignItems: isDesktop ? 'center' : 'stretch',
            justifyContent: 'center',
            padding: isDesktop ? 16 : 0,
        } as React.CSSProperties,
        modalDialog: {
            width: '100%',
            maxWidth: 520,
            maxHeight: isDesktop ? '92vh' : '100vh',
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: isDesktop ? 18 : 0,
            boxShadow: T.shadow,
            display: 'flex',
            flexDirection: 'column' as const,
            overflow: 'hidden',
        } as React.CSSProperties,
        modalHeader: {
            padding: isDesktop ? '14px 18px' : '12px 14px',
            borderBottom: `1px solid ${T.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
        } as React.CSSProperties,
        modalBody: {
            padding: isDesktop ? 18 : 14,
            overflowY: 'auto' as const,
            flex: 1,
            display: 'grid',
            gap: 14,
        } as React.CSSProperties,
        modalClose: {
            width: 32,
            height: 32,
            borderRadius: 9,
            border: `1px solid ${T.border}`,
            background: T.bgAlt,
            color: T.textSub,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
        } as React.CSSProperties,
        input: {
            width: '100%',
            height: 42,
            borderRadius: 10,
            border: `1px solid ${T.border}`,
            background: T.bgAlt,
            color: T.text,
            fontSize: 13,
            padding: '0 12px',
            boxSizing: 'border-box' as const,
        } as React.CSSProperties,
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
                                            {product.code.toUpperCase()} • {product.plans.length} plan aktif • {product.stats.plan_versions ?? product.plans.length} versi
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
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 10,
                                        marginBottom: 10,
                                        flexWrap: 'wrap',
                                    }}>
                                        <div style={{ fontSize: 11, fontWeight: 800, color: T.textSub, textTransform: 'uppercase', letterSpacing: .5 }}>
                                            Available Plans
                                        </div>
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                            {product.workspace_key && (
                                                <span style={{
                                                    fontSize: 10,
                                                    fontWeight: 800,
                                                    padding: '4px 8px',
                                                    borderRadius: 999,
                                                    background: `${T.info}12`,
                                                    color: T.info,
                                                    border: `1px solid ${T.info}22`,
                                                }}>
                                                    workspace: {product.workspace_key}
                                                </span>
                                            )}
                                            {product.stats.plan_families ? (
                                                <span style={{
                                                    fontSize: 10,
                                                    fontWeight: 800,
                                                    padding: '4px 8px',
                                                    borderRadius: 999,
                                                    background: `${T.primary}12`,
                                                    color: T.primary,
                                                    border: `1px solid ${T.primary}22`,
                                                }}>
                                                    {product.stats.plan_families} family
                                                </span>
                                            ) : null}
                                        </div>
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
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                            <div style={{ fontSize: 12, fontWeight: 800, color: T.text }}>{plan.name}</div>
                                                            <span style={{
                                                                fontSize: 9,
                                                                fontWeight: 800,
                                                                padding: '2px 6px',
                                                                borderRadius: 999,
                                                                background: `${T.primary}12`,
                                                                color: T.primary,
                                                            }}>
                                                                v{plan.version_number ?? 1}
                                                            </span>
                                                        </div>
                                                        <div style={{ fontSize: 10, color: T.textMuted }}>
                                                            {plan.family_code ?? plan.code} • {plan.billing_cycle}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 900, color: T.primary }}>
                                                        {currencyFmt.format(plan.price)}
                                                    </div>
                                                    {isSuperAdmin && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditPlan(plan)}
                                                            style={{
                                                                width: 30,
                                                                height: 30,
                                                                borderRadius: 9,
                                                                border: `1px solid ${T.border}`,
                                                                background: T.bgAlt,
                                                                color: T.textSub,
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                            }}
                                                            title="Edit plan"
                                                        >
                                                            <PencilLine size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{
                                    marginTop: 10,
                                    padding: '10px 12px',
                                    borderRadius: 12,
                                    background: `${T.primary}08`,
                                    border: `1px solid ${T.primary}18`,
                                    fontSize: 11,
                                    color: T.textSub,
                                    lineHeight: 1.6,
                                }}>
                                    Edit plan di catalog sekarang membuat <strong style={{ color: T.text }}>versi baru</strong>, jadi subscription lama tetap
                                    menyimpan referensi plan historisnya.
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {editingPlan && (
                <>
                    <div onClick={() => setEditingPlan(null)} style={s.overlay} />
                    <div style={s.modalFrame}>
                        <div style={s.modalDialog} onClick={e => e.stopPropagation()}>
                            <div style={s.modalHeader}>
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>
                                        Edit Plan Catalog
                                    </div>
                                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>
                                        Simpan perubahan akan membuat versi plan baru. Versi lama tetap dipakai subscription historis.
                                    </div>
                                </div>
                                <button onClick={() => setEditingPlan(null)} style={s.modalClose}><X size={14} /></button>
                            </div>
                            <div style={s.modalBody}>
                                {planError && (
                                    <div style={{ padding: '10px 14px', borderRadius: 12, background: `${T.danger}12`, border: `1px solid ${T.danger}30`, color: T.danger, fontSize: 12, fontWeight: 600 }}>
                                        {planError}
                                    </div>
                                )}

                                <div style={{ display: 'grid', gap: 8 }}>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub }}>Nama Plan</label>
                                    <input value={editPlanName} onChange={e => setEditPlanName(e.target.value)} style={s.input} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(3, minmax(0, 1fr))' : '1fr', gap: 12 }}>
                                    <div style={{ display: 'grid', gap: 8 }}>
                                        <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub }}>Harga</label>
                                        <input type="number" min="0" value={editPlanPrice} onChange={e => setEditPlanPrice(e.target.value)} style={s.input} />
                                    </div>
                                    <div style={{ display: 'grid', gap: 8 }}>
                                        <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub }}>Billing</label>
                                        <select value={editPlanBillingCycle} onChange={e => setEditPlanBillingCycle(e.target.value)} style={s.input}>
                                            <option value="monthly">Monthly</option>
                                            <option value="yearly">Yearly</option>
                                            <option value="lifetime">Lifetime</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'grid', gap: 8 }}>
                                        <label style={{ fontSize: 11, fontWeight: 700, color: T.textSub }}>Status</label>
                                        <select value={editPlanStatus} onChange={e => setEditPlanStatus(e.target.value)} style={s.input}>
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
                                    <button onClick={() => setEditingPlan(null)} style={{ height: 38, borderRadius: 11, border: `1px solid ${T.border}`, background: T.bgAlt, color: T.textSub, fontSize: 12, fontWeight: 700, padding: '0 14px' }}>
                                        Batal
                                    </button>
                                    <button onClick={handleUpdatePlan} disabled={savingPlan}
                                        style={{ ...s.neutralBtn, height: 38, border: 'none', background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`, color: '#fff', padding: '0 14px', fontSize: 12, fontWeight: 800, opacity: savingPlan ? .6 : 1 }}>
                                        {savingPlan ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <PencilLine size={13} />}
                                        {savingPlan ? 'Menyimpan...' : 'Simpan Plan'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
