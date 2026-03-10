import { Loader2, Package } from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { useEffect, useState } from 'react';
import { platformApi } from '@/api/platform.api';
import { useAuthStore } from '@/store/authStore';

interface Props { T: Theme; isDesktop: boolean; isSuperAdmin: boolean; }

export function SubscriptionPanel({ T, isDesktop, isSuperAdmin }: Props) {
    const user = useAuthStore(s => s.user);
    const [subs, setSubs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = isSuperAdmin
            ? platformApi.getCompanySubscriptions(user?.current_company_id ?? 0)
            : platformApi.getMySubscriptions();
        fetch.then(res => setSubs(res.data?.data ?? [])).finally(() => setLoading(false));
    }, [isSuperAdmin, user?.current_company_id]);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={24} color={T.primary} style={{ animation: 'spin 1s linear infinite' }} /></div>;

    return (
        <div>
            <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 16 }}>{subs.length} subscriptions</div>
            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(2, 1fr)' : '1fr', gap: 12 }}>
                {subs.map((sub: any) => (
                    <div key={sub.id} style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: 18 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${T.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Package size={16} color={T.primary} />
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Plan #{sub.plan_id ?? sub.bundle_id}</div>
                                <div style={{ fontSize: 11, color: T.textMuted }}>Start: {sub.start_date}</div>
                            </div>
                        </div>
                        <span style={{
                            fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                            background: sub.status === 'active' ? `${T.success}15` : `${T.danger}15`,
                            color: sub.status === 'active' ? T.success : T.danger,
                        }}>{sub.status}</span>
                    </div>
                ))}
                {subs.length === 0 && (
                    <div style={{ padding: 24, color: T.textMuted, fontSize: 13 }}>Belum ada subscription.</div>
                )}
            </div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
