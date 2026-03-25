import { useEffect, useState } from 'react';
import {
    Activity, AlertCircle, Building2, CheckCircle2, CreditCard,
    Package, TrendingUp, Users,
} from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { platformApi } from '@/api/platform.api';
import { useAuthStore } from '@/store/authStore';

/* ═══════════════════ Types ═══════════════════ */
interface Props {
    T: Theme;
    isDesktop: boolean;
    onNavigate?: (key: string) => void;
}

/* ═══════════════════ Component ═══════════════════ */
export function DashboardPanel({ T, isDesktop, onNavigate }: Props) {
    const user = useAuthStore(s => s.user);
    const isSuperAdmin = user?.role === 'super_admin';
    const isPlatformTeam = ['super_admin', 'platform_staff'].includes(user?.role ?? '');
    const [stats, setStats] = useState({ companies: 0, products: 0, activeSubs: 0 });
    const [loading, setLoading] = useState(true);
    const [recentInvoices, setRecentInvoices] = useState<any[]>([]);

    useEffect(() => {
        const promises: Promise<any>[] = [];

        if (isPlatformTeam) {
            promises.push(platformApi.getCompanies().catch(() => ({ data: { data: { total: 0 } } })));
            promises.push(platformApi.getProductOverview().catch(() => ({ data: { data: [] } })));
            promises.push(platformApi.getInvoices().catch(() => ({ data: { data: [] } })));
        }

        Promise.all(promises).then(results => {
            let idx = 0;
            const newStats = { ...stats };

            if (isPlatformTeam) {
                const compData = results[idx]?.data?.data;
                newStats.companies = compData?.total ?? compData?.length ?? (Array.isArray(compData) ? compData.length : 0);
                idx++;
                const prodData = results[idx]?.data?.data ?? [];
                newStats.products = Array.isArray(prodData) ? prodData.length : 0;
                newStats.activeSubs = Array.isArray(prodData) ? prodData.reduce((n: number, p: any) => n + (p.stats?.active_subscribers ?? 0), 0) : 0;
                idx++;
                const invData = results[idx]?.data?.data ?? [];
                setRecentInvoices(Array.isArray(invData) ? invData.slice(0, 3) : []);
                idx++;
            }

            setStats(newStats);
        }).finally(() => setLoading(false));
    }, [isPlatformTeam]);

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Selamat Pagi';
        if (h < 15) return 'Selamat Siang';
        if (h < 18) return 'Selamat Sore';
        return 'Selamat Malam';
    };

    const navigate = (key: string) => { onNavigate?.(key); };

    /* ═══ Styles ═══ */
    const s = {
        statCard: {
            background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: '12px 14px',
            position: 'relative' as const, overflow: 'hidden',
        } as React.CSSProperties,
        statLabel: { fontSize: 11, color: T.textMuted } as React.CSSProperties,
        statValue: { fontSize: 22, fontWeight: 900, color: T.text, marginTop: 6, fontFamily: "'Sora', sans-serif" } as React.CSSProperties,
        section: {
            background: T.card, border: `1px solid ${T.border}`, borderRadius: 18, padding: isDesktop ? 18 : 14,
        } as React.CSSProperties,
    };

    /* ═══ Stat Cards Config ═══ */
    const statCards = [
        ...(isPlatformTeam ? [
            { label: 'Companies', value: stats.companies, icon: Building2, tone: T.primary, desc: 'Total tenant', nav: 'companies' },
            { label: 'Products', value: stats.products, icon: Package, tone: T.info, desc: 'Produk aktif', nav: 'subscriptions' },
            { label: 'Active Subs', value: stats.activeSubs, icon: CheckCircle2, tone: T.success, desc: 'Subscriber aktif', nav: 'subscriptions' },
        ] : []),
    ];

    const quickActions = [
        ...(isPlatformTeam ? [
            { label: 'Kelola Companies', desc: 'Lihat daftar tenant', color: T.primary, icon: Building2, nav: 'companies' },
            { label: 'Product Overview', desc: 'Lihat produk & subscriber', color: T.info, icon: Package, nav: 'subscriptions' },
            { label: 'Lihat Invoices', desc: 'Tagihan & pembayaran', color: T.gold, icon: CreditCard, nav: 'invoices' },
        ] : []),
    ];

    return (
        <div style={{ display: 'grid', gap: 16 }}>
            {/* ── Welcome Banner ── */}
            <div style={{
                background: 'linear-gradient(135deg, #1E3A5F, #0F2341)',
                borderRadius: 18, padding: isDesktop ? '28px 32px' : '22px 18px',
                position: 'relative', overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(59,130,246,.12)' }} />
                <div style={{ position: 'absolute', bottom: -20, right: 60, width: 80, height: 80, borderRadius: '50%', background: 'rgba(96,165,250,.08)' }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <Activity size={14} color="#60A5FA" />
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#93C5FD' }}>{greeting()}</span>
                    </div>
                    <h2 style={{ fontSize: isDesktop ? 22 : 18, fontWeight: 900, color: '#fff', fontFamily: "'Sora', sans-serif", marginBottom: 6 }}>
                        {user?.name ?? 'Admin'}
                    </h2>
                    <p style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.6, maxWidth: 500 }}>
                        {isSuperAdmin
                            ? 'Super Admin — Kelola tenant, product catalog, subscription, dan billing platform dari sini.'
                            : `${user?.role ?? 'Admin'} — Pantau operasi SaaS Corextor dan workspace tenant.`
                        }
                    </p>
                    {/* Quick Info badges */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '5px 10px', borderRadius: 8,
                            background: 'rgba(59,130,246,.15)', border: '1px solid rgba(59,130,246,.3)',
                            fontSize: 10, fontWeight: 700, color: '#93C5FD',
                        }}>
                            <Users size={10} /> {isSuperAdmin ? 'Super Admin' : user?.role}
                        </span>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '5px 10px', borderRadius: 8,
                            background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.25)',
                            fontSize: 10, fontWeight: 700, color: '#86EFAC',
                        }}>
                            <Package size={10} /> {user?.active_products?.join(', ') || 'No Products'}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? `repeat(${Math.min(6, statCards.length || 3)}, 1fr)` : 'repeat(2, 1fr)', gap: 10 }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ height: 100, borderRadius: 14, background: T.card, border: `1px solid ${T.border}`, opacity: .5 }} />
                    ))}
                </div>
            ) : statCards.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? `repeat(${Math.min(statCards.length, 6)}, 1fr)` : 'repeat(2, 1fr)', gap: 10 }}>
                    {statCards.map(card => {
                        const Icon = card.icon;
                        return (
                            <button key={card.label} onClick={() => navigate(card.nav)}
                                style={{ ...s.statCard, textAlign: 'left', cursor: 'pointer', transition: 'border-color .15s' }}
                                onMouseEnter={e => (e.currentTarget.style.borderColor = `${card.tone}50`)}
                                onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}>
                                <div style={{ position: 'absolute', top: -10, right: -10, width: 48, height: 48, borderRadius: '50%', background: `${card.tone}08` }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                                    <div style={s.statLabel}>{card.label}</div>
                                    <Icon size={14} color={card.tone} />
                                </div>
                                <div style={s.statValue}>{card.value}</div>
                                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>{card.desc}</div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ── Bottom Grid: Quick Actions + Recent Invoices ── */}
            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: 14 }}>
                {/* Quick Actions */}
                <div style={s.section}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <div style={{
                            width: 28, height: 28, borderRadius: 8, background: `${T.primary}15`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <AlertCircle size={13} color={T.primary} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Quick Actions</span>
                    </div>
                    <div style={{ display: 'grid', gap: 8 }}>
                        {quickActions.map(action => {
                            const Icon = action.icon;
                            return (
                                <button key={action.label} onClick={() => navigate(action.nav)} style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '10px 12px', borderRadius: 11,
                                    border: `1px solid ${T.border}`, background: T.bgAlt,
                                    cursor: 'pointer', transition: 'all .15s ease', textAlign: 'left',
                                }}
                                    onMouseEnter={e => (e.currentTarget.style.borderColor = `${action.color}40`)}
                                    onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}>
                                    <div style={{
                                        width: 32, height: 32, borderRadius: 9,
                                        background: `${action.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        <Icon size={14} color={action.color} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{action.label}</div>
                                        <div style={{ fontSize: 10, color: T.textMuted }}>{action.desc}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Platform Info + Recent Invoices */}
                <div style={{ display: 'grid', gap: 14 }}>
                    {/* Platform Info */}
                    <div style={s.section}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: 8, background: `${T.info}15`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <TrendingUp size={13} color={T.info} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Platform Info</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                            {[
                                { label: 'API Version', value: 'v1.0.0' },
                                { label: 'Session', value: 'Active' },
                                { label: 'Environment', value: 'Development' },
                            ].map(item => (
                                <div key={item.label} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '9px 0', borderBottom: `1px solid ${T.border}30`,
                                }}>
                                    <span style={{ fontSize: 12, color: T.textMuted }}>{item.label}</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Invoices */}
                    {isSuperAdmin && recentInvoices.length > 0 && (
                        <div style={s.section}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: 8, background: `${T.gold}15`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <CreditCard size={13} color={T.gold} />
                                    </div>
                                    <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Recent Invoices</span>
                                </div>
                                <button onClick={() => navigate('invoices')} style={{
                                    fontSize: 10, fontWeight: 700, color: T.primary, padding: '4px 8px',
                                    borderRadius: 6, background: `${T.primary}10`,
                                }}>
                                    Lihat Semua
                                </button>
                            </div>
                            <div style={{ display: 'grid', gap: 6 }}>
                                {recentInvoices.map((inv: any) => (
                                    <div key={inv.id} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '10px 12px', borderRadius: 10,
                                        border: `1px solid ${T.border}`, background: T.bgAlt,
                                    }}>
                                        <div>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{inv.invoice_number}</div>
                                            <div style={{ fontSize: 10, color: T.textMuted }}>
                                                {inv.due_at ? new Date(inv.due_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '-'}
                                            </div>
                                        </div>
                                        <span style={{
                                            fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 999,
                                            background: inv.status === 'paid' ? `${T.success}14` : `${T.gold}14`,
                                            color: inv.status === 'paid' ? T.success : T.gold,
                                        }}>
                                            {inv.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
