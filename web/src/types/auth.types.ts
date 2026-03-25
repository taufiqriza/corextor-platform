export interface AuthUser {
    id: number;
    name: string;
    email: string;
    avatar_url?: string | null;
    role: string;
    current_company_id: number | null;
    active_products: string[];
    attendance_user_id?: number;
    branch_id?: number;
    company?: {
        id: number;
        code: string;
        name: string;
        status: string;
        logo_url?: string | null;
    };
}

export interface MePayload {
    user: Omit<AuthUser, 'company'> & {
        company?: AuthUser['company'];
    };
    company: AuthUser['company'] | null;
}

export interface LoginResponse {
    status: string;
    message: string;
    data: {
        token: string;
        token_type: string;
        expires_in: number;
        user: AuthUser;
    };
}

export interface MeResponse {
    status: string;
    data: MePayload;
}
