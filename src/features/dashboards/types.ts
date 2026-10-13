// ==========================================
// 1. TYPE DEFINITIONS & SCHEMAS (telesalesCockpit.types.ts)
// PAS Screen 8.7.1 - Internal Telesales Cockpit
// ==========================================

/**
 * Universal Audit Columns
 * Mapped to Section 4.1 Data Architecture Invariants
 */
export interface UniversalAuditColumns {
  readonly created_by: string | null; // UUIDv4 of actor or NULL for automated background jobs
  readonly created_at: string; // ISO 8601 Timestamp string
}

/**
 * Slowly Changing Dimension Type 2 (SCD Type 2) Base Envelope
 * Controls copy-on-write temporal snapshots across PAS entities
 */
export interface SCDType2Entity extends UniversalAuditColumns {
  readonly version_id: string; // UUIDv4
  readonly effective_start_date: string; // ISO 8601 Timestamp
  readonly effective_end_date: string | null; // NULL indicates current active snapshot
}

// ==============================================================================
// DOMAIN ENUMS & LITERAL UNIONS
// ==============================================================================

/**
 * Enforced Sales Origins (sales_channels table)
 * Channel ID 1 is internal Telesales
 */
export type SalesChannelCode = 1 | 2 | 3 | 4;

export const SalesChannelId = {
  TELESALES: 1,
  DIRECT_SALE: 2,
  WEBSITE: 3,
  SUB_AGENT: 4,
} as const;

/**
 * Lines of Business supported across PAS extension tables
 */
export type LineOfBusiness =
  | 'MOTOR'
  | 'CMI'
  | 'HEALTH'
  | 'PA'
  | 'TRAVEL'
  | 'FIRE'
  | 'LIFE'
  | 'CUSTOM';

/**
 * Customer Profile Data Completeness
 * customer_versions.data_completeness
 */
export type CustomerDataCompleteness = 'PARTIAL' | 'VERIFIED';

/**
 * Application Lifecycle States
 * applications.status (workflow_states)
 */
export type ApplicationWorkflowStatus =
  | 'PENDING_REVIEW'
  | 'INFO_REQUIRED'
  | 'QUOTATION_RATED'
  | 'APPROVED_WAITING_PAYMENT'
  | 'REJECTED'
  | 'CONVERTED'
  | 'WITHDRAWN_BY_CUSTOMER';

/**
 * Policy Lifecycle States
 * policies.status
 */
export type PolicyStatus =
  | 'PENDING_OFFICIAL_NUMBER'
  | 'ACTIVE'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'SUSPENDED';

/**
 * Contract Cancellation Reason Codes
 * policies.cancellation_reason_code
 */
export type CancellationReasonCode =
  | 'CUSTOMER_REQUEST'
  | 'INSURER_MANDATED'
  | 'INSTALLMENT_EXHAUSTION';

/**
 * Policy Fulfillment Options
 * policy_versions.fulfillment_type
 */
export type FulfillmentType =
  | 'PAS_GENERATED'
  | 'INSURER_GENERATED'
  | 'PAPER_MAIL';

/**
 * Payment Methods & Settlement Timing
 */
export type PaymentMethod =
  | 'CASH'
  | 'CREDIT_CARD_FULL'
  | 'CREDIT_CARD_INSTALLMENT'
  | 'PROMPTPAY_QR';

export type PayeeType = 'BROKER' | 'INSURER' | 'THIRD_PARTY';

export type PaymentTiming = 'BEFORE_ISSUANCE' | 'AFTER_ISSUANCE';

/**
 * Sub-Agent & Commission Ledger Enums
 * commissions table
 */
export type CommissionTransactionType = 'COMMISSION_IN' | 'CLAWBACK' | 'PAYOUT';
export type CommissionSettlementMode = 'NET' | 'GROSS';
export type CommissionStatus = 'PENDING' | 'AVAILABLE' | 'SETTLED';

/**
 * PDPA PII Audit Actions
 * audit_logs.action
 */
export type AuditLogAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'UNMASK';

export type PiiUnmaskReasonCode =
  | 'CUSTOMER_VERIFICATION_CALL'
  | 'PAYMENT_ASSISTANCE'
  | 'DOCUMENT_DELIVERY_ISSUE'
  | 'CUSTOMER_REQUEST_DIRECT';

// ==============================================================================
// CORE PAS DATABASE ENTITY INTERFACES
// ==============================================================================

/**
 * Customer Identity Golden Record Snapshot
 * customer_versions table
 */
export interface CustomerVersionSnapshot extends SCDType2Entity {
  readonly customer_id: string; // UUIDv4 anchor
  readonly data_completeness: CustomerDataCompleteness;
  readonly legal_name_th: string;
  readonly legal_name_en: string;
  readonly phone_number: string; // AES-256 encrypted at rest, masked by default via Gateway
  readonly id_card_number: string | null; // AES-256 encrypted at rest, masked by default
  readonly address_th?: Record<string, unknown> | null;
  readonly address_en?: Record<string, unknown> | null;
  readonly risk_level?: string | null; // AML/PEP risk
  readonly pdpa_consent_version: string | null;
  readonly pdpa_consent_time: string | null;
  readonly pdpa_consent_channel: string | null;
}

/**
 * Application Transactional Header
 * applications table
 */
export interface ApplicationTransactionHeader extends UniversalAuditColumns {
  readonly application_id: string;
  readonly quotation_id: string;
  readonly customer_id: string;
  readonly channel_id: typeof SalesChannelId;
  readonly renewal_of_policy_id: string | null;
  readonly payee_type: PayeeType;
  readonly payment_method: PaymentMethod;
  readonly kyc_data: Record<string, unknown>;
  readonly is_payment_locked: boolean;
  readonly status: ApplicationWorkflowStatus;
  readonly decline_reason?: string | null;
  readonly decline_timestamp?: string | null;
  readonly loading_percent?: number | null;
  readonly loading_amount?: number | null;
  readonly underwriter_notes?: string | null;
  readonly policy_exclusions?: string | null;
}

/**
 * Policy Master Contract Container
 * policies table
 */
export interface PolicyMasterContract extends UniversalAuditColumns {
  readonly policy_id: string;
  readonly application_id: string;
  readonly customer_id: string;
  readonly channel_id: typeof SalesChannelId;
  readonly reference_number: string | null; // e.g., TMP-2026-001
  readonly policy_number: string | null; // Official Insurer Policy Number
  readonly tracking_flags: {
    readonly is_insurer_confirmed?: boolean;
    readonly is_digital_sent_to_customer?: boolean;
    readonly is_inform_insurer_cancel?: boolean;
    readonly [flag: string]: boolean | undefined;
  };
  readonly scheduled_cancellation_date: string | null; // For installment exhaustion logic
  readonly cancellation_reason: string | null;
  readonly cancellation_reason_code: CancellationReasonCode | null;
  readonly cancellation_effective_date: string | null;
  readonly status: PolicyStatus;
}

/**
 * Broker Channel Operational Governance Settings
 * broker_channel_settings table
 */
export interface BrokerChannelSettings {
  readonly broker_id: string;
  readonly channel_id: typeof SalesChannelId;
  readonly warning_days_before: number; // e.g., 3 days for SMS/outbound triggers
  readonly auto_cancel_offset: number; // 0 for Telesales, 30 for Sub-agent
}

// ==============================================================================
// TELESALES COCKPIT (SCREEN 8.7.1) VIEW-MODEL SCHEMAS
// ==============================================================================

/**
 * Logged-in Telesales Agent State
 */
export interface TelesalesAgentIdentity {
  readonly agent_id: string;
  readonly agent_code: string;
  readonly full_name: string;
  readonly email: string;
  readonly channel_id: typeof SalesChannelId.TELESALES;
  readonly channel_name: 'Tele sales';
  readonly commission_tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  readonly base_commission_percent: number; // e.g., 18.00%
  readonly rbac_scopes: readonly string[]; // e.g., ['quote:create', 'customer:create', 'pii:unmask']
}

/**
 * Real-Time KPI Cards Data
 */
export interface TelesalesKpiMetrics {
  readonly total_gross_premium_mtd: number;
  readonly total_net_premium_mtd: number;
  readonly target_gross_premium_mtd: number;
  readonly mtd_target_achievement_ratio: number;
  readonly earned_commission_gross_mtd: number;
  readonly withholding_tax_deduction_mtd: number; // 3% statutory WHT
  readonly earned_commission_net_mtd: number;
  readonly pending_payment_count: number;
  readonly pending_payment_gross_volume: number;
  readonly urgent_renewals_count: number; // < 14 days remaining
}

/**
 * Queue Tab 1: Renewals Due in 30 Days
 */
export interface RenewalQueueItem {
  readonly queue_id: string;
  readonly policy_id: string;
  readonly policy_number: string;
  readonly renewal_application_id?: string | null;
  readonly customer_id: string;
  readonly customer_name: string;
  readonly phone_masked: string;
  readonly phone_raw: string;
  readonly national_id_masked: string;
  readonly national_id_raw: string;
  readonly lob_code: LineOfBusiness;
  readonly product_name: string;
  readonly insurer_name: string;
  readonly vehicle_license_plate?: string | null;
  readonly vehicle_province_name?: string | null;
  readonly expiring_date: string; // ISO Date (YYYY-MM-DD)
  readonly days_until_expiry: number;
  readonly last_year_gross_premium: number;
  readonly estimated_renewal_premium: number;
  readonly is_unmasked: boolean;
}

/**
 * Queue Tab 2: Incomplete Leads (Dropped-off carts / Partial KYC)
 */
export interface IncompleteLeadQueueItem {
  readonly lead_id: string;
  readonly customer_id: string;
  readonly customer_name: string;
  readonly phone_masked: string;
  readonly phone_raw: string;
  readonly lob_code: LineOfBusiness;
  readonly product_name: string;
  readonly data_completeness: CustomerDataCompleteness;
  readonly missing_kyc_fields: readonly string[];
  readonly last_quoted_gross_premium: number;
  readonly created_at_relative: string;
  readonly quotation_valid_until: string;
  readonly is_unmasked: boolean;
}

/**
 * Queue Tab 3: Pending Payments & Underwriting Referrals
 */
export interface PendingPaymentQueueItem {
  readonly application_id: string;
  readonly customer_name: string;
  readonly phone_masked: string;
  readonly product_name: string;
  readonly gross_payable_amount: number;
  readonly effective_date: string;
  readonly hours_until_auto_cancellation: number; // Evaluated against auto_cancel_offset = 0
  readonly is_payment_locked: boolean;
  readonly underwriting_status: ApplicationWorkflowStatus;
  readonly referral_reasons?: readonly string[];
}

/**
 * Agent Flex / Commission Sacrifice Calculator Payload
 * BRD Clause: Telesales agents can sacrifice commission to yield net customer discounts
 */
export interface AgentFlexCalculationState {
  readonly base_gross_premium: number;
  readonly agent_base_commission_percent: number;
  readonly flex_sacrifice_percent: number; // Range: 0.00% to max allowed tier limit (e.g., 5.00%)
  readonly customer_discount_amount: number;
  readonly final_customer_payable_premium: number;
  readonly agent_net_commission_percent: number;
  readonly agent_net_commission_amount: number;
}

/**
 * PDPA PII Unmask Audit Event Request
 * Maps to POST /admin/customers/{id}/unmask & audit_logs table
 */
export interface PiiUnmaskAuditRequest {
  readonly customer_id: string;
  readonly actor_user_id: string;
  readonly reason_code: PiiUnmaskReasonCode;
  readonly reason_justification?: string;
  readonly client_ip_address: string;
  readonly timestamp: string;
}

/**
 * Interaction Timeline Entry (Customer 360 Log)
 */
export interface CustomerInteractionLogEntry {
  readonly log_id: string;
  readonly event_type:
    | 'QUOTATION_CALCULATED'
    | 'SMS_PAYMENT_LINK_DISPATCHED'
    | 'OUTBOUND_CALL_ATTEMPT'
    | 'POLICY_RENEWED'
    | 'PII_ACCESSED';
  readonly description: string;
  readonly actor_name: string;
  readonly created_at: string;
}