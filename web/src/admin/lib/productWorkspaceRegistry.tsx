import type { ReactNode } from 'react';
import { ClipboardList, Wallet } from 'lucide-react';
import type { Theme } from '@/theme/tokens';
import { AdminCompanyAttendanceWorkspace } from '@/admin/panels/AdminCompanyAttendanceWorkspace';
import { CompanyPayrollPanel } from '@/company/panels/CompanyPayrollPanel';

interface BaseWorkspaceProps {
    T: Theme;
    isDesktop: boolean;
    companyId: number;
    companyName: string;
    hasProduct: boolean;
    onGoToSubscriptions: () => void;
}

export interface ProductWorkspaceDefinition {
    productCode: string;
    workspaceKey: string;
    label: string;
    icon: typeof ClipboardList;
    description: string;
    render: (props: BaseWorkspaceProps) => ReactNode;
}

const REGISTRY: ProductWorkspaceDefinition[] = [
    {
        productCode: 'attendance',
        workspaceKey: 'attendance',
        label: 'Attendance Workspace',
        icon: ClipboardList,
        description: 'Kelola user absensi, lokasi, kehadiran, dan laporan tenant attendance.',
        render: (props) => <AdminCompanyAttendanceWorkspace {...props} hasAttendance={props.hasProduct} />,
    },
    {
        productCode: 'payroll',
        workspaceKey: 'payroll',
        label: 'Payroll Workspace',
        icon: Wallet,
        description: 'Kelola payroll profile, komponen gaji, dan payroll run tenant payroll.',
        render: (props) => <CompanyPayrollPanel T={props.T} isDesktop={props.isDesktop} companyContextId={props.companyId} />,
    },
];

export function getRegisteredProductWorkspace(productCode?: string | null, workspaceKey?: string | null): ProductWorkspaceDefinition | null {
    if (!productCode && !workspaceKey) {
        return null;
    }

    return REGISTRY.find(item => item.productCode === productCode || item.workspaceKey === workspaceKey) ?? null;
}

export function getRegisteredProductWorkspaces() {
    return REGISTRY;
}
