export interface AuthUser {
    id: number;
    name: string;
    role: string;
    current_company_id: number | null;
    active_products: string[];
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
