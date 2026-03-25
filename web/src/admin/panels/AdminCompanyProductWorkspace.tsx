import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Box, Package } from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { getRegisteredProductWorkspace } from '@/admin/lib/productWorkspaceRegistry';

interface CompanyProduct {
    code?: string;
    name?: string;
    workspace_key?: string | null;
}

interface CompanySubscriptionLike {
    id: number;
    status: string;
    product?: CompanyProduct;
}

interface Props {
    T: Theme;
    isDesktop: boolean;
    companyId: number;
    companyName: string;
    subscriptions: CompanySubscriptionLike[];
    onGoToSubscriptions: () => void;
}

export function AdminCompanyProductWorkspace({
    T,
    isDesktop,
    companyId,
    companyName,
    subscriptions,
    onGoToSubscriptions,
}: Props) {
    const availableWorkspaces = useMemo(() => {
        return subscriptions
            .filter(subscription => ['active', 'trial'].includes(subscription.status))
            .map(subscription => {
                const productCode = subscription.product?.code ?? null;
                const workspaceKey = subscription.product?.workspace_key ?? null;
                const registration = getRegisteredProductWorkspace(productCode, workspaceKey);

                if (!registration || !productCode) {
                    return null;
                }

                return {
                    productCode,
                    workspaceKey: registration.workspaceKey,
                    label: registration.label,
                    description: registration.description,
                    icon: registration.icon,
                    render: registration.render,
                };
            })
            .filter((item): item is NonNullable<typeof item> => Boolean(item))
            .filter((item, index, array) => array.findIndex(entry => entry.productCode === item.productCode) === index);
    }, [subscriptions]);

    const [activeProductCode, setActiveProductCode] = useState<string | null>(availableWorkspaces[0]?.productCode ?? null);

    useEffect(() => {
        if (!availableWorkspaces.length) {
            setActiveProductCode(null);
            return;
        }

        if (!activeProductCode || !availableWorkspaces.some(item => item.productCode === activeProductCode)) {
            setActiveProductCode(availableWorkspaces[0].productCode);
        }
    }, [activeProductCode, availableWorkspaces]);

    const activeWorkspace = availableWorkspaces.find(item => item.productCode === activeProductCode) ?? availableWorkspaces[0] ?? null;

    const sectionStyle: CSSProperties = {
        background: `linear-gradient(180deg, ${T.card} 0%, ${T.bgAlt} 100%)`,
        border: `1px solid ${T.border}`,
        borderRadius: 20,
        padding: isDesktop ? 18 : 14,
        boxShadow: T.shadowSm,
    };

    if (availableWorkspaces.length === 0) {
        return (
            <section style={sectionStyle}>
                <div style={{ display: 'grid', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 42,
                            height: 42,
                            borderRadius: 14,
                            background: `${T.primary}14`,
                            color: T.primary,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Package size={18} />
                        </div>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>
                                Product Workspaces
                            </div>
                            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>
                                Company ini belum punya produk aktif yang memiliki workspace internal di portal superadmin.
                            </div>
                        </div>
                    </div>

                    <div style={{
                        borderRadius: 18,
                        border: `1px solid ${T.border}`,
                        background: T.bgAlt,
                        padding: isDesktop ? 18 : 14,
                        display: 'grid',
                        gap: 12,
                    }}>
                        <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.7 }}>
                            Struktur ini sudah siap untuk multi-produk. Produk baru nanti cukup register `workspace_key` dan komponen
                            workspacenya, lalu akan muncul di company detail tanpa mengubah alur inti tenant.
                        </div>
                        <button
                            type="button"
                            onClick={onGoToSubscriptions}
                            style={{
                                height: 42,
                                borderRadius: 12,
                                border: 'none',
                                background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`,
                                color: '#fff',
                                fontSize: 12,
                                fontWeight: 800,
                                padding: '0 16px',
                                width: isDesktop ? 'fit-content' : '100%',
                            }}
                        >
                            Kelola Subscription Company
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <div style={{ display: 'grid', gap: 14 }}>
            <section style={sectionStyle}>
                <div style={{ display: 'flex', alignItems: isDesktop ? 'center' : 'flex-start', justifyContent: 'space-between', gap: 12, flexDirection: isDesktop ? 'row' : 'column' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: 11,
                                background: `${T.primary}16`,
                                color: T.primary,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <Box size={15} />
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 900, color: T.text, fontFamily: "'Sora', sans-serif" }}>
                                Product Workspaces
                            </div>
                        </div>
                        <div style={{ fontSize: 12, color: T.textMuted, marginTop: 6 }}>
                            Workspace internal dijalankan dalam konteks tenant <strong style={{ color: T.text }}>{companyName}</strong>.
                        </div>
                    </div>
                </div>

                <div style={{
                    marginTop: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexWrap: 'wrap',
                    background: T.card,
                    padding: 6,
                    borderRadius: 14,
                    border: `1px solid ${T.border}`,
                }}>
                    {availableWorkspaces.map(workspace => (
                        <button
                            key={workspace.productCode}
                            type="button"
                            onClick={() => setActiveProductCode(workspace.productCode)}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                height: 38,
                                padding: '0 14px',
                                borderRadius: 11,
                                border: 'none',
                                background: activeWorkspace?.productCode === workspace.productCode ? `${T.primary}14` : 'transparent',
                                color: activeWorkspace?.productCode === workspace.productCode ? T.primary : T.textMuted,
                                fontSize: 12,
                                fontWeight: activeWorkspace?.productCode === workspace.productCode ? 800 : 700,
                            }}
                        >
                            <workspace.icon size={14} />
                            {workspace.label}
                        </button>
                    ))}
                </div>
            </section>

            {activeWorkspace && activeWorkspace.render({
                T,
                isDesktop,
                companyId,
                companyName,
                hasProduct: true,
                onGoToSubscriptions,
            })}
        </div>
    );
}
