export interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: string;
    current_company_id: number | null;
    active_products: string[];
    company?: {
        id: number;
        code: string;
        name: string;
        status: string;
    };
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
    data: AuthUser;
}
