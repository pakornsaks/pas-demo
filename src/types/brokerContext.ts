// Standard Lines of Business (LOB) defined in SDD Module 1
export type LobCode =
    | 'MOTOR'
    | 'CMI'
    | 'TRAVEL'
    | 'HEALTH'
    | 'PA'
    | 'FIRE'
    | 'LIFE'
    | 'CUSTOM';

// Standard Back-Office RBAC Roles defined in BRD Section 6.8 & 7.11
export type SystemRole =
    | 'Super Admin'
    | 'Underwriter'
    | 'Finance Officer'
    | 'Telesales Agent'
    | 'Operations Officer'
    | 'Approver (Manager)';

// Standardized API Response Envelope per SDD Section 3.1.4
export interface ApiResponseEnvelope<T> {
    data: T;
    meta: {
        timestamp: string;
        transaction_id: string;
        api_version: string;
    };
}

// Standardized API Error Envelope per SDD Section 3.1.4
export interface ApiErrorEnvelope {
    errors: Array<{
        code: string;
        field?: string;
        message: string;
    }>;
    meta?: {
        timestamp: string;
        transaction_id: string;
    };
}

export interface OicLicenseDetails {
    oic_license_no: string;
    status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
    expiry_date: string; // ISO 8601 Date
}

// Represents hydrated data from `brokers` + active `broker_versions`
export interface BrokerOption {
    broker_id: string; // UUIDv4
    broker_code: string;
    broker_name_th: string;
    broker_name_en: string;
    is_default: boolean;
    license_details: OicLicenseDetails;
    authorized_lobs: LobCode[];
    active_insurer_partners_count?: number;
}

export interface AvailableBrokersPayload {
    admin_user: {
        admin_user_id: string;
        full_name: string;
        email: string;
        roles: SystemRole[];
    };
    allow_global_view: boolean;
    available_brokers: BrokerOption[];
}

export interface SelectBrokerRequest {
    broker_id: string | null;
    is_global_view: boolean;
}

export interface SelectBrokerResponse {
    access_token: string;
    active_context: {
        broker_id: string | null;
        broker_code: string;
        broker_name_en: string;
        is_global_view: boolean;
        roles: SystemRole[];
        scopes: string[]; // e.g., ['application:review', 'policy:read', 'pii:unmask']
    };
    redirect_to: string;
}