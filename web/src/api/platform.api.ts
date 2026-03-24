import { api } from './client';
import type { LoginResponse, MeResponse } from '@/types/auth.types';

export const platformApi = {
    // Auth — Admin (email + password)
    login: (email: string, password: string) =>
        api.post<LoginResponse>('/platform/v1/auth/login/email', { email, password }),

    // Auth — Employee (PIN-only, auto-detect company)
    loginWithPin: (pin: string) =>
        api.post<LoginResponse>('/attendance/v1/auth/login/pin', { pin }),

    me: () => api.get<MeResponse>('/platform/v1/me'),

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
        api.post(`/platform/v1/companies/${companyId}/members`, data),

    updateCompanyMember: (companyId: number, membershipId: number, data: { role?: string; status?: string }) =>
        api.put(`/platform/v1/companies/${companyId}/members/${membershipId}`, data),

    removeCompanyMember: (companyId: number, membershipId: number) =>
        api.delete(`/platform/v1/companies/${companyId}/members/${membershipId}`),

    // Subscriptions
    getCompanySubscriptions: (companyId: number) =>
        api.get(`/platform/v1/companies/${companyId}/subscriptions`),

    addSubscription: (companyId: number, data: { product_code: string; plan_code: string; starts_at: string }) =>
        api.post(`/platform/v1/companies/${companyId}/subscriptions`, data),

    getMySubscriptions: () =>
        api.get('/platform/v1/company/subscriptions'),

    // Products
    getProducts: () => api.get('/platform/v1/products'),
    getProductOverview: () => api.get('/platform/v1/products/overview'),
    getPlans: () => api.get('/platform/v1/plans'),

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

    // Team (internal Corextor staff)
    getTeam: () => api.get('/platform/v1/team'),

    inviteTeamMember: (data: { name: string; email: string; platform_role: string }) =>
        api.post('/platform/v1/team/invite', data),

    updateTeamMember: (userId: number, data: { platform_role?: string; status?: string; name?: string }) =>
        api.put(`/platform/v1/team/${userId}`, data),

    removeTeamMember: (userId: number) =>
        api.delete(`/platform/v1/team/${userId}`),
};

export const attendanceApi = {
    // Branches
    getBranches: () => api.get('/attendance/v1/branches'),
    createBranch: (data: { name: string; location?: string }) =>
        api.post('/attendance/v1/branches', data),
    updateBranch: (id: number, data: { name: string; location?: string }) =>
        api.put(`/attendance/v1/branches/${id}`, data),
    deleteBranch: (id: number) =>
        api.delete(`/attendance/v1/branches/${id}`),

    // Users
    getUsers: () => api.get('/attendance/v1/users'),
    createUser: (data: { platform_user_id: number; branch_id: number; pin: string }) =>
        api.post('/attendance/v1/users', data),
    resetPin: (id: number, pin: string) =>
        api.post(`/attendance/v1/users/${id}/reset-pin`, { pin }),

    // Employee operations
    checkIn: () => api.post('/attendance/v1/attendance/check-in'),
    checkOut: () => api.post('/attendance/v1/attendance/check-out'),
    getHistory: (params?: { from?: string; to?: string }) =>
        api.get('/attendance/v1/attendance/history', { params }),

    // Admin report
    getReport: (params?: { from?: string; to?: string; branch_id?: number }) =>
        api.get('/attendance/v1/attendance/report', { params }),
    correctAttendance: (id: number, data: { time_in?: string; time_out?: string; note?: string }) =>
        api.put(`/attendance/v1/attendance/${id}/correct`, data),
    getLogs: () => api.get('/attendance/v1/attendance/logs'),
};
