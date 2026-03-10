import { useEffect, useState } from 'react';
import { Building2, Plus, Loader2 } from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { platformApi } from '@/api/platform.api';

interface Props { T: Theme; isDesktop: boolean; }

export function CompanyPanel({ T, isDesktop }: Props) {
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        platformApi.getCompanies().then(res => {
            setCompanies(res.data?.data?.data ?? []);
        }).finally(() => setLoading(false));
    }, []);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={24} color={T.primary} style={{ animation: 'spin 1s linear infinite' }} /></div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: T.textMuted }}>{companies.length} companies</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : '1fr', gap: 12 }}>
                {companies.map((c: any) => (
                    <div key={c.id} style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: 18 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${T.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Building2 size={18} color={T.primary} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{c.name}</div>
                                <div style={{ fontSize: 11, color: T.textMuted }}>{c.code}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <span style={{
                                fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                                background: c.status === 'active' ? `${T.success}15` : `${T.danger}15`,
                                color: c.status === 'active' ? T.success : T.danger,
                            }}>{c.status}</span>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
