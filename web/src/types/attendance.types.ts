export type AttendanceMode = 'office' | 'field';

export interface AttendanceBranch {
    id: number;
    name: string;
    location: string | null;
    latitude: number | null;
    longitude: number | null;
    radius_meters: number | null;
    status: string;
    has_geofence: boolean;
}

export interface AttendanceUserProfile {
    id: number;
    status: string;
    branch_id: number | null;
}

export interface AttendanceRecordItem {
    id: number;
    date: string;
    attendance_mode_in?: AttendanceMode | null;
    time_in: string | null;
    time_out: string | null;
    status: string;
    note?: string | null;
    employee_name?: string | null;
    employee_email?: string | null;
    branch_name?: string | null;
    branch?: {
        id: number;
        name: string;
        location?: string | null;
    } | null;
    check_in_location?: AttendanceLocationEvidence | null;
    check_out_location?: AttendanceLocationEvidence | null;
}

export interface AttendanceRules {
    requires_location_capture: boolean;
    requires_location_validation: boolean;
    requires_selfie_capture: boolean;
    radius_meters: number | null;
    available_check_in_modes: AttendanceMode[];
}

export interface AttendanceLocationEvidence {
    latitude: number;
    longitude: number;
    accuracy_meters: number | null;
    distance_meters: number | null;
    within_branch_radius: boolean | null;
    map_url: string;
    selfie_available: boolean;
}

export interface AttendanceContextPayload {
    company: {
        id: number;
        name: string;
        code: string;
        status: string;
        logo_url?: string | null;
    } | null;
    attendance_user: AttendanceUserProfile;
    branch: AttendanceBranch | null;
    today_record: AttendanceRecordItem | null;
    rules: AttendanceRules;
    server_time?: string;
}

export interface AttendanceHistoryPayload {
    current_page: number;
    data: AttendanceRecordItem[];
    per_page: number;
    total: number;
    last_page: number;
}

export interface AttendanceActionPayload {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    attendance_mode?: AttendanceMode;
    selfie?: File;
}

export interface EmployeeReportAttachment {
    name: string;
    mime_type?: string;
    size_bytes?: number;
    download_index?: number;
}

export interface EmployeeReportItem {
    id: number;
    attendance_user_id: number;
    platform_user_id: number;
    company_id: number;
    branch_id: number | null;
    report_date: string;
    title: string;
    description: string;
    status: string;
    created_at: string;
    attachments: EmployeeReportAttachment[];
    employee_name?: string | null;
    employee_email?: string | null;
    branch_name?: string | null;
}

export interface EmployeeReportPagination {
    current_page: number;
    data: EmployeeReportItem[];
    per_page: number;
    total: number;
    last_page: number;
}

export interface MyEmployeeReportPayload {
    stats: {
        total: number;
        today: number;
        with_attachments: number;
    };
    pagination: EmployeeReportPagination;
}

export interface CompanyEmployeeReportPayload {
    stats: {
        total: number;
        today: number;
        with_attachments: number;
        employees: number;
    };
    pagination: EmployeeReportPagination;
}

export interface AttendanceAdminReportItem extends AttendanceRecordItem {
    attendance_user_id: number;
    platform_user_id: number;
    company_id: number;
    branch_id: number | null;
}

export interface AttendanceAdminReportPagination {
    current_page: number;
    data: AttendanceAdminReportItem[];
    per_page: number;
    total: number;
    last_page: number;
}

export interface AttendanceAdminReportPayload {
    stats: {
        total: number;
        present: number;
        corrected: number;
        complete: number;
        ongoing: number;
        office: number;
        field: number;
    };
    pagination: AttendanceAdminReportPagination;
}
