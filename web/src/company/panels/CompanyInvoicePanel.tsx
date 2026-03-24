import { useEffect, useState } from 'react';
import { Loader2, Receipt } from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { platformApi } from '@/api/platform.api';

interface Props { T: Theme; isDesktop: boolean; }

export function CompanyInvoicePanel({ T, isDesktop }: Props) {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await platformApi.getMyInvoices();
                setInvoices(res.data?.data ?? []);
            } catch { setInvoices([]); }
            finally { setLoading(false); }
        })();
    }, []);

    const statusMeta = (s: string) => {
        switch (s) {
            case 'paid': return { label: 'Lunas', bg: `${T.success}14`, color: T.success };
            case 'pending': return { label: 'Menunggu', bg: `${T.gold}14`, color: T.gold };
            case 'overdue': return { label: 'Jatuh Tempo', bg: `${T.danger}12`, color: T.danger };
            case 'cancelled': return { label: 'Dibatalkan', bg: `${T.textMuted}10`, color: T.textMuted };
            default: return { label: s, bg: `${T.textMuted}10`, color: T.textMuted };
        }
    };

    const formatRp = (n: number) => 'Rp ' + n.toLocaleString('id-ID');
    const formatDate = (v?: string) => v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

    return (
        <div style={{ display: 'grid', gap: 14 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 18, padding: isDesktop ? 16 : 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 10, background: `${T.gold}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Receipt size={14} color={T.gold} /></div>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>Tagihan</div>
                        <div style={{ fontSize: 11, color: T.textMuted }}>Riwayat pembayaran subscription.</div>
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center' }}>
                        <Loader2 size={22} color={T.primary} style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 8px' }} />
                        <span style={{ fontSize: 12, color: T.textMuted }}>Memuat...</span>
                    </div>
                ) : invoices.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center' }}>
                        <Receipt size={28} color={T.textMuted} style={{ display: 'block', margin: '0 auto 8px' }} />
                        <p style={{ fontSize: 13, color: T.textMuted }}>Belum ada tagihan.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: 8 }}>
                        {invoices.map((inv: any) => {
                            const sm = statusMeta(inv.status);
                            return (
                                <div key={inv.id} style={{ borderRadius: 14, border: `1px solid ${T.border}`, background: T.bgAlt, padding: 14 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{inv.invoice_number ?? `INV-${inv.id}`}</div>
                                            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Jatuh tempo: {formatDate(inv.due_date)}</div>
                                        </div>
                                        <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 999, background: sm.bg, color: sm.color }}>{sm.label}</span>
                                    </div>
                                    <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontSize: 18, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>{formatRp(inv.total_amount ?? 0)}</div>
                                        {inv.paid_at && <div style={{ fontSize: 10, color: T.success }}>Dibayar: {formatDate(inv.paid_at)}</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
