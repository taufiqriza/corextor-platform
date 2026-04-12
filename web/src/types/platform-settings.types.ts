export interface PlatformCompanySettings {
    company_name: string;
    company_email: string;
    company_phone: string;
    company_address: string;
    company_city: string;
    company_province: string;
    company_postal_code: string;
    company_country: string;
    company_website: string;
    support_whatsapp: string;
    support_email: string;
    platform_tagline: string;
    platform_summary: string;
    social_instagram: string;
    social_facebook: string;
    social_tiktok: string;
    social_youtube: string;
    social_linkedin: string;
}

export interface PlatformTripaySettings {
    mode: 'test' | 'live';
    base_url: string;
    configured_base_url: string;
    expected_base_url: string;
    is_base_url_aligned: boolean;
    merchant_code: string;
    bank_transfer_channel: string;
    ewallet_channel: string;
    webhook_url: string;
    recommended_webhook_url: string;
    has_api_key: boolean;
    has_private_key: boolean;
    api_key_masked: string | null;
    private_key_masked: string | null;
}

export interface PlatformSettingsPayload {
    company: PlatformCompanySettings;
    tripay: PlatformTripaySettings;
}

export type UpdatePlatformCompanySettingsPayload = Partial<PlatformCompanySettings>;

export interface UpdateTripaySettingsPayload {
    mode?: 'test' | 'live';
    base_url?: string;
    merchant_code?: string;
    api_key?: string;
    private_key?: string;
    clear_api_key?: boolean;
    clear_private_key?: boolean;
    webhook_url?: string;
    bank_transfer_channel?: string;
    ewallet_channel?: string;
}
