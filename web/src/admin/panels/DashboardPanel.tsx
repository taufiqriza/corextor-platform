import { useEffect, useState } from 'react';
import { BarChart3, Building2, Users, Package, TrendingUp } from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { platformApi } from '@/api/platform.api';
import { useAuthStore } from '@/store/authStore';

interface Props { T: Theme; isDesktop: boolean; }

export function DashboardPanel({ T, isDesktop }: Props) {
    const user = useAuthStore(s => s.user);
    const isSuperAdmin = user?.role === 'super_admin';
    const [stats, setStats] = useState({ companies: 0, products: 0 });

    useEffect(() => {
        if (!isSuperAdmin) return;
        Promise.all([
            platformApi.getCompanies().catch(() => ({ data: { data: { total: 0 } } })),
            platformApi.getProducts().catch(() => ({ data: { data: [] } })),
        ]).then(([comp, prod]) => {
            setStats({
                companies: comp.data?.data?.total ?? 0,
                products: Array.isArray(prod.data?.data) ? prod.data.data.length : 0,
            });
        });
    }, [isSuperAdmin]);

    const cards = [
        { label: 'Companies', value: isSuperAdmin ? stats.companies : 1, icon: Building2, color: T.primary },
        { label: 'Active Products', value: user?.active_products?.length ?? 0, icon: Package, color: T.success },
        { label: 'Role', value: isSuperAdmin ? 'Super Admin' : user?.role ?? '-', icon: Users, color: T.info },
        { label: 'Status', value: 'active', icon: TrendingUp, color: T.gold },
    ];

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', gap: isDesktop ? 16 : 10, marginBottom: 24 }}>
                {cards.map(card => {
                    const Icon = card.icon;
                    return (
                        <div key={card.label} style={{
                            background: T.card, borderRadius: 16, border: `1px solid ${T.border}`,
                            padding: isDesktop ? 20 : 16, transition: 'all .2s',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Icon size={16} color={card.color} />
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted }}>{card.label}</span>
                            </div>
                            <div style={{ fontSize: isDesktop ? 22 : 18, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif", textTransform: 'capitalize' }}>
                                {card.value}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, padding: isDesktop ? 24 : 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 8 }}>Selamat Datang, {user?.name}!</h3>
                <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.7 }}>
                    {isSuperAdmin
                        ? 'Anda masuk sebagai Super Admin. Kelola semua company, subscription, dan produk platform dari sini.'
                        : `Anda masuk sebagai ${user?.role}. Kelola operasi perusahaan Anda dari sini.`
                    }
                </p>
            </div>
        </div>
    );
}
