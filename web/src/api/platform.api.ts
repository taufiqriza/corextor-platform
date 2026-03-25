import type { AxiosRequestConfig } from 'axios';
import { api } from './client';
import type { LoginResponse, MeResponse } from '@/types/auth.types';
import type {
    AttendanceActionPayload,
    AttendanceAdminReportPayload,
    AttendanceMode,
    CompanyEmployeeReportPayload,
    AttendanceContextPayload,
    AttendanceHistoryPayload,
    MyEmployeeReportPayload,
} from '@/types/attendance.types';
import type {
    PayrollComponent,
    PayrollDashboardPayload,
    PayrollDirectoryMember,
    PayrollProfile,
    PayrollRunDetail,
    PayrollRunListPayload,
    PayrollSchedule,
} from '@/types/payroll.types';

export const platformApi = {
    // Auth — Admin (email + password)
    login: (email: string, password: string) =>
        api.post<LoginResponse>('/platform/v1/auth/login/email', { email, password }),

    // Auth — Employee (PIN-only, auto-detect company)
    loginWithPin: (pin: string) =>
        api.post<LoginResponse>('/attendance/v1/auth/login/pin', { pin }),

    me: () => api.get<MeResponse>('/platform/v1/me'),
    updateMe: (data: { name: string; email: string }) =>
        api.put<MeResponse>('/platform/v1/me', data),
    changePassword: (data: { current_password: string; new_password: string; new_password_confirmation: string }) =>
        api.put('/platform/v1/me/password', data),

    logout: () => api.post('/platform/v1/auth/logout'),

    // Companies
    getCompanies: (page = 1) =>
        api.get(`/platform/v1/companies?page=${page}`),

    createCompany: (data: { name: string; code: string }) =>
        api.post('/platform/v1/companies', data),

    getCompany: (id: number) =>
        api.get(`/platform/v1/companies/${id}`),

    getCompanyMembers: (companyId: number) =>
        api.get(`/platform/v1/companies/${companyId}/members`),

    addCompanyMember: (companyId: number, data: { email: string; name?: string; role: string }) =>
        api.post<{
            status: string;
            message: string;
            data: {
                id: number;
                company_id: number;
                user_id: number;
                role: string;
                status: string;
                user?: { id: number; name: string; email: string };
                credentials?: { email: string; temporary_password: string } | null;
            };
        }>(`/platform/v1/companies/${companyId}/members`, data),

    updateCompanyMember: (companyId: number, membershipId: number, data: { role?: string; status?: string }) =>
        api.put(`/platform/v1/companies/${companyId}/members/${membershipId}`, data),

    removeCompanyMember: (companyId: number, membershipId: number) =>
        api.delete(`/platform/v1/companies/${companyId}/members/${membershipId}`),

    // Subscriptions
    getCompanySubscriptions: (companyId: number) =>
        api.get(`/platform/v1/companies/${companyId}/subscriptions`),

    addSubscription: (companyId: number, data: { product_code: string; plan_code: string; starts_at: string }) =>
        api.post(`/platform/v1/companies/${companyId}/subscriptions`, data),
    updateCompanySubscription: (
        companyId: number,
        subscriptionId: number,
        data: { plan_code: string; starts_at?: string; status?: string },
    ) => api.put(`/platform/v1/companies/${companyId}/subscriptions/${subscriptionId}`, data),

    getMySubscriptions: () =>
        api.get('/platform/v1/company/subscriptions'),

    // Products
    getProducts: () => api.get('/platform/v1/products'),
    getProductOverview: () => api.get('/platform/v1/products/overview'),
    getPlans: (params?: { include_versions?: boolean; latest_only?: boolean; product_code?: string }) =>
        api.get('/platform/v1/plans', { params }),
    updatePlan: (planId: number, data: { name?: string; price?: number; billing_cycle?: string; status?: string; effective_from?: string; version_notes?: string }) =>
        api.put(`/platform/v1/plans/${planId}`, data),

    // Invoices
    getInvoices: (params?: { company_id?: number; status?: string }) =>
        api.get('/platform/v1/invoices', { params }),

    getInvoice: (id: number) =>
        api.get(`/platform/v1/invoices/${id}`),

    createInvoice: (data: {
        company_id: number;
        subscription_id?: number;
        due_at?: string;
        items: { description: string; quantity?: number; unit_price: number; product_id?: number }[];
    }) => api.post('/platform/v1/invoices', data),

    markInvoicePaid: (id: number) =>
        api.put(`/platform/v1/invoices/${id}/pay`),

    cancelInvoice: (id: number) =>
        api.put(`/platform/v1/invoices/${id}/cancel`),

    getMyInvoices: () =>
        api.get('/platform/v1/company/invoices'),

    // Company self-service (for company_admin)
    getMyProfile: () =>
        api.get('/platform/v1/company/profile'),

    updateMyProfile: (data: { name?: string; address?: string; phone?: string; email?: string; industry?: string }) =>
        api.put('/platform/v1/company/profile', data),

    getMyMembers: () =>
        api.get('/platform/v1/company/members'),

    updateMyMember: (membershipId: number, data: { role?: string }) =>
        api.put(`/platform/v1/company/members/${membershipId}`, data),

    // Team (internal Corextor staff)
    getTeam: () => api.get('/platform/v1/team'),

    inviteTeamMember: (data: { name: string; email: string; platform_role: string }) =>
        api.post<{
            status: string;
            message: string;
            data: {
                id: number;
                name: string;
                email: string;
                platform_role: string;
                status: string;
                credentials?: { email: string; temporary_password: string } | null;
            };
        }>('/platform/v1/team/invite', data),

    updateTeamMember: (userId: number, data: { platform_role?: string; status?: string; name?: string }) =>
        api.put(`/platform/v1/team/${userId}`, data),

    removeTeamMember: (userId: number) =>
        api.delete(`/platform/v1/team/${userId}`),
};

export const attendanceApi = {
    // Branches
    getBranches: (companyContextId?: number) => api.get('/attendance/v1/branches', withCompanyContext(companyContextId)),
    createBranch: (data: { name: string; location?: string; latitude?: number; longitude?: number; radius_meters?: number }, companyContextId?: number) =>
        api.post('/attendance/v1/branches', data, withCompanyContext(companyContextId)),
    updateBranch: (id: number, data: { name?: string; location?: string; latitude?: number; longitude?: number; radius_meters?: number; status?: string }, companyContextId?: number) =>
        api.put(`/attendance/v1/branches/${id}`, data, withCompanyContext(companyContextId)),
    deleteBranch: (id: number, companyContextId?: number) =>
        api.delete(`/attendance/v1/branches/${id}`, withCompanyContext(companyContextId)),

    // Users
    getUsers: (companyContextId?: number) => api.get('/attendance/v1/users', withCompanyContext(companyContextId)),
    createUser: (data: { platform_user_id?: number; email?: string; name?: string; role?: 'employee'; branch_id: number; pin: string }, companyContextId?: number) =>
        api.post('/attendance/v1/users', data, withCompanyContext(companyContextId)),
    updateUser: (id: number, data: { branch_id?: number; status?: string }, companyContextId?: number) =>
        api.put(`/attendance/v1/users/${id}`, data, withCompanyContext(companyContextId)),
    deleteUser: (id: number, companyContextId?: number) =>
        api.delete(`/attendance/v1/users/${id}`, withCompanyContext(companyContextId)),
    resetPin: (id: number, pin: string, companyContextId?: number) =>
        api.post(`/attendance/v1/users/${id}/reset-pin`, { pin }, withCompanyContext(companyContextId)),

    // Employee operations
    getContext: (companyContextId?: number) =>
        api.get<{ status: string; message: string; data: AttendanceContextPayload }>('/attendance/v1/attendance/context', withCompanyContext(companyContextId)),
    checkIn: (data?: AttendanceActionPayload) =>
        api.post('/attendance/v1/attendance/check-in', buildAttendanceFormData(data), {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }),
    checkOut: (data?: AttendanceActionPayload) =>
        api.post('/attendance/v1/attendance/check-out', buildAttendanceFormData(data), {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }),
    getHistory: (params?: { from?: string; to?: string; per_page?: number; page?: number }) =>
        api.get<{ status: string; message: string; data: AttendanceHistoryPayload }>('/attendance/v1/attendance/history', { params }),
    changeMyPin: (data: { current_pin: string; new_pin: string; new_pin_confirmation: string }) =>
        api.post('/attendance/v1/attendance/profile/change-pin', data),
    getMyReports: (params?: { from?: string; to?: string; per_page?: number; page?: number }) =>
        api.get<{ status: string; message: string; data: MyEmployeeReportPayload }>('/attendance/v1/reports', { params }),
    submitReport: (formData: FormData) =>
        api.post('/attendance/v1/reports', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }),
    getCompanyReports: (params?: { from?: string; to?: string; per_page?: number; page?: number }, companyContextId?: number) =>
        api.get<{ status: string; message: string; data: CompanyEmployeeReportPayload }>('/attendance/v1/reports/company', withCompanyContext(companyContextId, { params })),
    downloadReportAttachment: (reportId: number, attachmentIndex: number, companyContextId?: number) =>
        api.get(`/attendance/v1/reports/${reportId}/attachments/${attachmentIndex}`, {
            ...withCompanyContext(companyContextId),
            responseType: 'blob',
        }),
    getAttendanceSelfie: (recordId: number, moment: 'check_in' | 'check_out', companyContextId?: number) =>
        api.get(`/attendance/v1/attendance/${recordId}/selfie/${moment}`, {
            ...withCompanyContext(companyContextId),
            responseType: 'blob',
        }),

    // Admin report
    getReport: (params?: { from?: string; to?: string; branch_id?: number; attendance_mode?: AttendanceMode; per_page?: number; page?: number }, companyContextId?: number) =>
        api.get<{ status: string; message: string; data: AttendanceAdminReportPayload }>('/attendance/v1/attendance/report', withCompanyContext(companyContextId, { params })),
    correctAttendance: (id: number, data: { time_in?: string; time_out?: string; note?: string }, companyContextId?: number) =>
        api.put(`/attendance/v1/attendance/${id}/correct`, data, withCompanyContext(companyContextId)),
    getLogs: (companyContextId?: number) => api.get('/attendance/v1/attendance/logs', withCompanyContext(companyContextId)),
};

export const payrollApi = {
    getDashboard: (companyContextId?: number) =>
        api.get<{ status: string; message: string; data: PayrollDashboardPayload }>('/payroll/v1/dashboard', withCompanyContext(companyContextId)),
    getDirectory: (companyContextId?: number) =>
        api.get<{ status: string; message: string; data: PayrollDirectoryMember[] }>('/payroll/v1/directory', withCompanyContext(companyContextId)),
    getSchedules: (companyContextId?: number) =>
        api.get<{ status: string; message: string; data: PayrollSchedule[] }>('/payroll/v1/schedules', withCompanyContext(companyContextId)),
    createSchedule: (data: { name: string; cutoff_day?: number | null; payout_day?: number | null; status?: 'active' | 'inactive' }, companyContextId?: number) =>
        api.post('/payroll/v1/schedules', data, withCompanyContext(companyContextId)),
    updateSchedule: (id: number, data: { name?: string; cutoff_day?: number | null; payout_day?: number | null; status?: 'active' | 'inactive' }, companyContextId?: number) =>
        api.put(`/payroll/v1/schedules/${id}`, data, withCompanyContext(companyContextId)),
    getComponents: (companyContextId?: number) =>
        api.get<{ status: string; message: string; data: PayrollComponent[] }>('/payroll/v1/components', withCompanyContext(companyContextId)),
    createComponent: (data: {
        name: string;
        type: 'earning' | 'deduction';
        amount_type?: 'fixed' | 'manual';
        default_amount?: number;
        is_recurring?: boolean;
        taxable?: boolean;
        sort_order?: number;
        status?: 'active' | 'inactive';
    }, companyContextId?: number) => api.post('/payroll/v1/components', data, withCompanyContext(companyContextId)),
    updateComponent: (id: number, data: {
        name?: string;
        amount_type?: 'fixed' | 'manual';
        default_amount?: number;
        is_recurring?: boolean;
        taxable?: boolean;
        sort_order?: number;
        status?: 'active' | 'inactive';
    }, companyContextId?: number) => api.put(`/payroll/v1/components/${id}`, data, withCompanyContext(companyContextId)),
    getProfiles: (companyContextId?: number) =>
        api.get<{ status: string; message: string; data: PayrollProfile[] }>('/payroll/v1/profiles', withCompanyContext(companyContextId)),
    createProfile: (data: {
        platform_user_id: number;
        pay_schedule_id?: number | null;
        employment_type?: 'monthly' | 'daily' | 'contract';
        base_salary: number;
        bank_name?: string | null;
        bank_account_name?: string | null;
        bank_account_number?: string | null;
        notes?: string | null;
        status?: 'active' | 'inactive';
        components?: Array<{ payroll_component_id: number; amount?: number; status?: 'active' | 'inactive' }>;
    }, companyContextId?: number) => api.post('/payroll/v1/profiles', data, withCompanyContext(companyContextId)),
    updateProfile: (id: number, data: {
        platform_user_id?: number;
        pay_schedule_id?: number | null;
        employment_type?: 'monthly' | 'daily' | 'contract';
        base_salary?: number;
        bank_name?: string | null;
        bank_account_name?: string | null;
        bank_account_number?: string | null;
        notes?: string | null;
        status?: 'active' | 'inactive';
        components?: Array<{ payroll_component_id: number; amount?: number; status?: 'active' | 'inactive' }>;
    }, companyContextId?: number) => api.put(`/payroll/v1/profiles/${id}`, data, withCompanyContext(companyContextId)),
    getRuns: (params?: { status?: 'draft' | 'finalized' | 'paid' | 'cancelled'; per_page?: number; page?: number }, companyContextId?: number) =>
        api.get<{ status: string; message: string; data: PayrollRunListPayload }>('/payroll/v1/runs', withCompanyContext(companyContextId, { params })),
    createRun: (data: { pay_schedule_id?: number | null; period_start: string; period_end: string; payout_date?: string | null }, companyContextId?: number) =>
        api.post('/payroll/v1/runs', data, withCompanyContext(companyContextId)),
    getRun: (id: number, companyContextId?: number) =>
        api.get<{ status: string; message: string; data: PayrollRunDetail }>(`/payroll/v1/runs/${id}`, withCompanyContext(companyContextId)),
    finalizeRun: (id: number, companyContextId?: number) =>
        api.post(`/payroll/v1/runs/${id}/finalize`, {}, withCompanyContext(companyContextId)),
};

function buildAttendanceFormData(data?: AttendanceActionPayload): FormData {
    const formData = new FormData();

    if (!data) return formData;

    if (data.attendance_mode) formData.append('attendance_mode', data.attendance_mode);
    if (typeof data.latitude === 'number') formData.append('latitude', String(data.latitude));
    if (typeof data.longitude === 'number') formData.append('longitude', String(data.longitude));
    if (typeof data.accuracy === 'number') formData.append('accuracy', String(data.accuracy));
    if (data.selfie) formData.append('selfie', data.selfie);

    return formData;
}

function withCompanyContext(
    companyContextId?: number,
    config: AxiosRequestConfig = {},
): AxiosRequestConfig {
    if (!companyContextId) {
        return config;
    }

    return {
        ...config,
        headers: {
            ...(config.headers ?? {}),
            'X-Company-Context': String(companyContextId),
        },
    };
}
