import { useEffect, useState } from 'react';
import { Receipt, Loader2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { platformApi } from '@/api/platform.api';
import { useAuthStore } from '@/store/authStore';

interface Props { T: Theme; isDesktop: boolean; }

export function InvoicePanel({ T, isDesktop }: Props) {
    const user = useAuthStore(s => s.user);
    const isSuperAdmin = user?.role === 'super_admin';
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = isSuperAdmin
            ? platformApi.getInvoices(user?.current_company_id ?? 0)
            : platformApi.getInvoices(user?.current_company_id ?? 0);
        fetch.then(res => setInvoices(res.data?.data ?? [])).finally(() => setLoading(false));
    }, [isSuperAdmin, user?.current_company_id]);

    const statusIcon = (status: string) => {
        switch (status) {
            case 'paid': return <CheckCircle2 size={12} color={T.success} />;
            case 'pending': return <Clock size={12} color={T.gold} />;
            default: return <AlertCircle size={12} color={T.danger} />;
        }
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'paid': return { bg: `${T.success}15`, color: T.success };
            case 'pending': return { bg: `${T.gold}15`, color: T.gold };
            default: return { bg: `${T.danger}15`, color: T.danger };
        }
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: currency || 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60, flexDirection: 'column', gap: 12 }}>
            <Loader2 size={24} color={T.primary} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 12, color: T.textMuted }}>Memuat invoices...</span>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: T.textMuted }}>{invoices.length} invoices</span>
                <div style={{ display: 'flex', gap: 6 }}>
                    {['all', 'paid', 'pending'].map(f => (
                        <span key={f} style={{
                            fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
                            background: T.surface, border: `1px solid ${T.border}`, color: T.textSub,
                            cursor: 'pointer', textTransform: 'capitalize',
                        }}>{f}</span>
                    ))}
                </div>
            </div>

            {invoices.length === 0 ? (
                <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: 40, textAlign: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: `${T.primary}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                        <Receipt size={22} color={T.textMuted} />
                    </div>
                    <p style={{ fontSize: 13, color: T.textMuted }}>Belum ada invoice.</p>
                </div>
            ) : isDesktop ? (
                <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                                {['Invoice #', 'Tanggal', 'Jatuh Tempo', 'Total', 'Status'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', fontSize: 10, fontWeight: 700, color: T.textMuted, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map((inv: any) => {
                                const sc = statusColor(inv.status);
                                return (
                                    <tr key={inv.id} style={{ borderBottom: `1px solid ${T.border}20`, transition: 'background .1s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = `${T.border}15`}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{inv.invoice_number}</div>
                                        </td>
                                        <td style={{ padding: '14px 16px', fontSize: 12, color: T.textSub }}>{inv.issued_at?.split('T')[0] ?? '-'}</td>
                                        <td style={{ padding: '14px 16px', fontSize: 12, color: T.textSub }}>{inv.due_at?.split('T')[0] ?? '-'}</td>
                                        <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 800, color: T.text }}>
                                            {formatCurrency(inv.amount_total ?? 0, inv.currency)}
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <span style={{
                                                fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                                                background: sc.bg, color: sc.color,
                                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                            }}>
                                                {statusIcon(inv.status)} {inv.status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {invoices.map((inv: any) => {
                        const sc = statusColor(inv.status);
                        return (
                            <div key={inv.id} style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{inv.invoice_number}</div>
                                    <span style={{
                                        fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                                        background: sc.bg, color: sc.color,
                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                    }}>
                                        {statusIcon(inv.status)} {inv.status}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <div>
                                        <div style={{ fontSize: 11, color: T.textMuted }}>Due: {inv.due_at?.split('T')[0] ?? '-'}</div>
                                    </div>
                                    <div style={{ fontSize: 16, fontWeight: 900, color: T.text }}>
                                        {formatCurrency(inv.amount_total ?? 0, inv.currency)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
