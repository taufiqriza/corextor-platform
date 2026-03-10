import { Loader2, Receipt } from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { useEffect, useState } from 'react';
import { platformApi } from '@/api/platform.api';
import { useAuthStore } from '@/store/authStore';

interface Props { T: Theme; isDesktop: boolean; }

export function InvoicePanel({ T, isDesktop }: Props) {
    const user = useAuthStore(s => s.user);
    const isSuperAdmin = user?.role === 'super_admin';
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = isSuperAdmin ? platformApi.getInvoices() : platformApi.getMyInvoices();
        fetch.then(res => setInvoices(res.data?.data?.data ?? [])).finally(() => setLoading(false));
    }, [isSuperAdmin]);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={24} color={T.primary} style={{ animation: 'spin 1s linear infinite' }} /></div>;

    return (
        <div>
            <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 16 }}>{invoices.length} invoices</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {invoices.map((inv: any) => (
                    <div key={inv.id} style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: isDesktop ? '16px 20px' : 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${T.info}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Receipt size={16} color={T.info} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{inv.invoice_number}</div>
                            <div style={{ fontSize: 11, color: T.textMuted }}>{inv.due_date}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Rp {Number(inv.total_amount ?? 0).toLocaleString('id-ID')}</div>
                            <span style={{
                                fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
                                background: inv.status === 'paid' ? `${T.success}15` : `${T.gold}15`,
                                color: inv.status === 'paid' ? T.success : T.gold,
                            }}>{inv.status}</span>
                        </div>
                    </div>
                ))}
                {invoices.length === 0 && (
                    <div style={{ padding: 24, color: T.textMuted, fontSize: 13 }}>Belum ada invoice.</div>
                )}
            </div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
