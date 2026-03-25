export interface PayrollSchedule {
    id: number;
    company_id: number;
    code: string;
    name: string;
    pay_frequency: 'monthly';
    cutoff_day: number | null;
    payout_day: number | null;
    status: 'active' | 'inactive';
    created_at?: string;
    updated_at?: string;
}

export interface PayrollComponent {
    id: number;
    company_id: number;
    code: string;
    name: string;
    type: 'earning' | 'deduction';
    amount_type: 'fixed' | 'manual';
    default_amount: number;
    is_recurring: boolean;
    taxable: boolean;
    sort_order: number;
    status: 'active' | 'inactive';
    created_at?: string;
    updated_at?: string;
}

export interface PayrollDirectoryMember {
    membership_id: number;
    platform_user_id: number;
    name: string;
    email: string | null;
    role: string;
    status: string;
    has_payroll_profile: boolean;
}

export interface PayrollProfileComponentAssignment {
    id?: number;
    amount: number;
    status: 'active' | 'inactive';
    component: {
        id: number;
        code: string;
        name: string;
        type: 'earning' | 'deduction';
        amount_type: 'fixed' | 'manual';
        default_amount: number;
    } | null;
}

export interface PayrollProfile {
    id: number;
    company_id: number;
    platform_user_id: number;
    employment_type: 'monthly' | 'daily' | 'contract';
    base_salary: number;
    status: 'active' | 'inactive';
    notes: string | null;
    bank_name: string | null;
    bank_account_name: string | null;
    bank_account_number: string | null;
    created_at?: string;
    updated_at?: string;
    user: {
        id: number;
        name: string;
        email: string | null;
    };
    schedule: {
        id: number;
        name: string;
        cutoff_day: number | null;
        payout_day: number | null;
        status: string;
    } | null;
    components: PayrollProfileComponentAssignment[];
}

export interface PayrollDashboardPayload {
    stats: {
        schedules: number;
        active_schedules: number;
        components: number;
        profiles: number;
        active_profiles: number;
        runs: number;
        draft_runs: number;
    };
    integrations: {
        attendance: boolean;
    };
    latest_run: PayrollRunSummary | null;
}

export interface PayrollRunSummary {
    id: number;
    reference_code: string;
    status: 'draft' | 'finalized' | 'paid' | 'cancelled';
    period_start: string;
    period_end: string;
    payout_date: string | null;
    employees_count: number;
    earnings_total: number;
    deductions_total: number;
    net_total: number;
    created_at?: string;
    updated_at?: string;
    finalized_at?: string | null;
    items_count?: number;
    schedule: {
        id: number;
        name: string;
        cutoff_day: number | null;
        payout_day: number | null;
    } | null;
}

export interface PayrollRunItem {
    id: number;
    platform_user_id: number;
    payroll_employee_profile_id: number | null;
    employee_name: string;
    user: {
        name: string;
        email: string | null;
    };
    attendance_summary: {
        integrated?: boolean;
        source?: string;
        present_days?: number;
        office_days?: number;
        field_days?: number;
        complete_days?: number;
    };
    component_lines: Array<{
        code: string;
        name: string;
        type: 'earning' | 'deduction';
        amount: number;
    }>;
    earnings_total: number;
    deductions_total: number;
    net_total: number;
    status: 'draft' | 'finalized' | 'paid';
}

export interface PayrollRunDetail extends PayrollRunSummary {
    items: PayrollRunItem[];
}

export interface PayrollRunListPayload {
    stats: {
        total: number;
        draft: number;
        finalized: number;
        paid: number;
    };
    pagination: {
        current_page: number;
        per_page: number;
        last_page: number;
        total: number;
        data: PayrollRunSummary[];
    };
}
