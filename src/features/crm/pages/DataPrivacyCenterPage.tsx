import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  Lock,
  Search,
  UserX,
  FileText,
  History,
  AlertTriangle,
  Download,
  CheckCircle2,
  Clock,
  KeyRound,
  FileCheck,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

// --- Types & Data Contracts ---

export type ConsentStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';
export type ErasureEligibility = 'ELIGIBLE' | 'BLOCKED_ACTIVE_POLICY' | 'BLOCKED_OIC_10YR_RETENTION';

export interface CustomerPDPAProfile {
  customerId: string; // Golden Record UUID
  legalNameTh: string;
  legalNameEn: string;
  maskedIdCard: string;
  unmaskedIdCard?: string;
  maskedPhone: string;
  unmaskedPhone?: string;
  email: string;
  dataCompleteness: 'PARTIAL' | 'VERIFIED';
  consent: {
    essential: boolean;
    marketing: boolean;
    thirdPartyTransfer: boolean;
    policyVersion: string;
    timestamp: string;
    channel: string;
  };
  policiesCount: {
    active: number;
    expired: number;
    cancelled: number;
  };
  latestPolicyEndDate?: string;
}

export interface PDPAAuditLog {
  logId: string;
  timestamp: string;
  actorId: string;
  actorEmail: string;
  action: 'UNMASK_PII' | 'EXPORT_DATA' | 'ANONYMIZE_PII' | 'CONSENT_UPDATE';
  entityId: string;
  entityType: 'customer_pii' | 'consent_record';
  justificationReason: string;
  fieldsAffected: string[];
  ipAddress: string;
  status: 'SUCCESS' | 'DENIED';
}

export interface ErasureRequest {
  requestId: string;
  customerId: string;
  customerName: string;
  requestedDate: string;
  eligibility: ErasureEligibility;
  activePoliciesCount: number;
  retentionExpiryDate: string;
  status: 'PENDING_REVIEW' | 'REJECTED' | 'ANONYMIZED';
  anonymizedAt?: string;
}

export interface PrivacyPolicyVersion {
  versionId: string;
  code: string;
  effectiveFrom: string;
  publishedBy: string;
  status: 'ACTIVE' | 'SUPERSEDED' | 'DRAFT';
  consentedUsersCount: number;
}

// --- Mock Initial Data ---

const MOCK_CUSTOMERS: Record<string, CustomerPDPAProfile> = {
  'cust-550e8400-e29b-41d4-a716-446655440001': {
    customerId: 'cust-550e8400-e29b-41d4-a716-446655440001',
    legalNameTh: 'สมชาย ใจดี',
    legalNameEn: 'Somchai Jaidee',
    maskedIdCard: '1-1004-XXXX-88-9',
    unmaskedIdCard: '1-1004-98721-88-9',
    maskedPhone: '+66 89-XXX-1234',
    unmaskedPhone: '+66 89-543-1234',
    email: 'somchai.j@example.com',
    dataCompleteness: 'VERIFIED',
    consent: {
      essential: true,
      marketing: true,
      thirdPartyTransfer: false,
      policyVersion: 'policy_v_2026_01',
      timestamp: '2026-03-12 14:32:05',
      channel: 'MOBILE_APP_OTP',
    },
    policiesCount: {
      active: 2,
      expired: 1,
      cancelled: 0,
    },
    latestPolicyEndDate: '2027-03-11',
  },
  'cust-882f1200-e11a-42c1-b998-112233445566': {
    customerId: 'cust-882f1200-e11a-42c1-b998-112233445566',
    legalNameTh: 'กานดา สุวรรณโชติ',
    legalNameEn: 'Kanda Suwannachot',
    maskedIdCard: '3-1002-XXXX-44-1',
    unmaskedIdCard: '3-1002-00451-44-1',
    maskedPhone: '+66 81-XXX-9988',
    unmaskedPhone: '+66 81-778-9988',
    email: 'kanda.s@partnermail.th',
    dataCompleteness: 'VERIFIED',
    consent: {
      essential: true,
      marketing: false,
      thirdPartyTransfer: false,
      policyVersion: 'policy_v_2025_02',
      timestamp: '2025-11-04 09:12:44',
      channel: 'WEBSITE_CHECKOUT',
    },
    policiesCount: {
      active: 0,
      expired: 3,
      cancelled: 1,
    },
    latestPolicyEndDate: '2015-08-20', // Surpassed 10 years
  },
};

const MOCK_AUDIT_LOGS: PDPAAuditLog[] = [
  {
    logId: 'AUD-2026-9041',
    timestamp: '2026-10-13 14:22:10',
    actorId: 'adm-0044',
    actorEmail: 'underwriter.ops@broker.co.th',
    action: 'UNMASK_PII',
    entityId: 'cust-550e8400-e29b-41d4-a716-446655440001',
    entityType: 'customer_pii',
    justificationReason: 'Customer inbound phone verification for urgent claim registration',
    fieldsAffected: ['id_card_number', 'phone_number'],
    ipAddress: '192.168.1.104',
    status: 'SUCCESS',
  },
  {
    logId: 'AUD-2026-8910',
    timestamp: '2026-10-12 18:45:00',
    actorId: 'adm-0012',
    actorEmail: 'compliance.officer@broker.co.th',
    action: 'EXPORT_DATA',
    entityId: 'cust-882f1200-e11a-42c1-b998-112233445566',
    entityType: 'customer_pii',
    justificationReason: 'Data Subject Access Request (DSAR) customer export package',
    fieldsAffected: ['full_profile', 'policy_history', 'kyc_documents'],
    ipAddress: '192.168.1.55',
    status: 'SUCCESS',
  },
  {
    logId: 'AUD-2026-8802',
    timestamp: '2026-10-10 11:30:19',
    actorId: 'system-cron-cleaner',
    actorEmail: 'system@broker.internal',
    action: 'ANONYMIZE_PII',
    entityId: 'cust-12345678-0000-0000-0000-000000000099',
    entityType: 'customer_pii',
    justificationReason: 'Automated Right-to-Forget execution post-10-year statutory retention',
    fieldsAffected: ['id_card_number', 'phone_number', 'legal_name_th', 'address_th'],
    ipAddress: '10.0.4.12',
    status: 'SUCCESS',
  },
];

const MOCK_ERASURE_REQUESTS: ErasureRequest[] = [
  {
    requestId: 'DSAR-ERASE-2026-004',
    customerId: 'cust-550e8400-e29b-41d4-a716-446655440001',
    customerName: 'สมชาย ใจดี (Somchai Jaidee)',
    requestedDate: '2026-10-12',
    eligibility: 'BLOCKED_ACTIVE_POLICY',
    activePoliciesCount: 2,
    retentionExpiryDate: '2037-03-11',
    status: 'REJECTED',
  },
  {
    requestId: 'DSAR-ERASE-2026-002',
    customerId: 'cust-882f1200-e11a-42c1-b998-112233445566',
    customerName: 'กานดา สุวรรณโชติ (Kanda Suwannachot)',
    requestedDate: '2026-10-09',
    eligibility: 'ELIGIBLE',
    activePoliciesCount: 0,
    retentionExpiryDate: '2025-08-20',
    status: 'PENDING_REVIEW',
  },
];

const MOCK_POLICY_VERSIONS: PrivacyPolicyVersion[] = [
  {
    versionId: 'ver-pdpa-03',
    code: 'policy_v_2026_01',
    effectiveFrom: '2026-01-01',
    publishedBy: 'Compliance Legal Lead',
    status: 'ACTIVE',
    consentedUsersCount: 41250,
  },
  {
    versionId: 'ver-pdpa-02',
    code: 'policy_v_2025_02',
    effectiveFrom: '2025-06-01',
    publishedBy: 'Compliance Legal Lead',
    status: 'SUPERSEDED',
    consentedUsersCount: 18940,
  },
];

export const DataPrivacyCenterPage: React.FC = () => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'LOOKUP' | 'ERASURE' | 'AUDIT' | 'GOVERNANCE'>('LOOKUP');

  // Search state
  const [searchQuery, setSearchQuery] = useState('cust-550e8400-e29b-41d4-a716-446655440001');
  const [activeCustomer, setActiveCustomer] = useState<CustomerPDPAProfile | null>(
    MOCK_CUSTOMERS['cust-550e8400-e29b-41d4-a716-446655440001']
  );
  const [isRevealed, setIsRevealed] = useState(false);
  const [showUnmaskModal, setShowUnmaskModal] = useState(false);
  const [unmaskReason, setUnmaskReason] = useState('');
  const [unmaskError, setUnmaskError] = useState('');

  // Erasure & Anonymize state
  const [erasureRequests, setErasureRequests] = useState<ErasureRequest[]>(MOCK_ERASURE_REQUESTS);
  const [selectedErasure, setSelectedErasure] = useState<ErasureRequest | null>(null);
  const [showAnonymizeModal, setShowAnonymizeModal] = useState(false);

  // Audit state
  const [auditLogs, setAuditLogs] = useState<PDPAAuditLog[]>(MOCK_AUDIT_LOGS);

  // --- Handlers ---

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsRevealed(false);
    const found = Object.values(MOCK_CUSTOMERS).find(
      (c) =>
        c.customerId.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        c.legalNameTh.includes(searchQuery.trim()) ||
        c.legalNameEn.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
    setActiveCustomer(found || null);
  };

  const handleConfirmUnmask = () => {
    if (!unmaskReason.trim() || unmaskReason.trim().length < 10) {
      setUnmaskError('A specific business justification (min 10 characters) is required for PDPA audit logs.');
      return;
    }

    if (!activeCustomer) return;

    // Simulate audit log injection
    const newLog: PDPAAuditLog = {
      logId: `AUD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actorId: 'adm-current-user',
      actorEmail: 'ops.manager@broker.co.th',
      action: 'UNMASK_PII',
      entityId: activeCustomer.customerId,
      entityType: 'customer_pii',
      justificationReason: unmaskReason,
      fieldsAffected: ['id_card_number', 'phone_number'],
      ipAddress: '192.168.1.118',
      status: 'SUCCESS',
    };

    setAuditLogs([newLog, ...auditLogs]);
    setIsRevealed(true);
    setShowUnmaskModal(false);
    setUnmaskReason('');
    setUnmaskError('');
  };

  const handleExecuteHardAnonymization = () => {
    if (!selectedErasure) return;

    setErasureRequests((prev) =>
      prev.map((req) =>
        req.requestId === selectedErasure.requestId
          ? {
              ...req,
              status: 'ANONYMIZED',
              anonymizedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            }
          : req
      )
    );

    // Write audit log
    const newLog: PDPAAuditLog = {
      logId: `AUD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actorId: 'adm-current-user',
      actorEmail: 'dpo.compliance@broker.co.th',
      action: 'ANONYMIZE_PII',
      entityId: selectedErasure.customerId,
      entityType: 'customer_pii',
      justificationReason: `Approved Right-to-Forget: 10-Year OIC Retention cleared (${selectedErasure.requestId})`,
      fieldsAffected: ['id_card_number', 'phone_number', 'legal_name_th', 'address_th'],
      ipAddress: '192.168.1.118',
      status: 'SUCCESS',
    };

    setAuditLogs([newLog, ...auditLogs]);
    setShowAnonymizeModal(false);
    setSelectedErasure(null);
  };

  return (
    <div className="pt-0 space-y-6">
      {/* Top Banner & Statutory Badges (Light Theme) */}
      <div className="border border-zinc-200 bg-white rounded-lg p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">
                Data Privacy (PDPA) Governance Center
              </h1>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Statutory PII Encryption, Subject Rights (DSAR), Unmask Audit Engine & OIC 10-Year Retention Enforcer
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-md font-medium">
              <Lock className="w-3.5 h-3.5 text-zinc-500" />
              AES-256 Envelope Encryption Active
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-medium">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              OIC 10-Year Policy Guard
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-medium">
              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
              RBAC Scope: pii:unmask
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-200 mt-6 gap-6">
          <button
            onClick={() => setActiveTab('LOOKUP')}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'LOOKUP'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Search className="w-4 h-4" />
            PII Masking & Customer Consent
          </button>
          <button
            onClick={() => setActiveTab('ERASURE')}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'ERASURE'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <UserX className="w-4 h-4" />
            Right to Erasure & Anonymization
            <span className="ml-1 px-1.5 py-0.2 bg-zinc-100 text-zinc-700 rounded text-xs">
              {erasureRequests.filter((r) => r.status === 'PENDING_REVIEW').length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'AUDIT'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <History className="w-4 h-4" />
            Immutable Audit Trail
          </button>
          <button
            onClick={() => setActiveTab('GOVERNANCE')}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'GOVERNANCE'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            Privacy Policy Registry
          </button>
        </div>
      </div>

      {/* TAB 1: PII MASKING & CONSENT LOOKUP */}
      {activeTab === 'LOOKUP' && (
        <div className="space-y-6">
          {/* Search Box */}
          <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Lookup customer by UUID, Legal Name (TH/EN), or Masked Reference..."
                  className="w-full pl-9 pr-4 py-2 border border-zinc-300 rounded-md text-sm text-zinc-900 bg-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                Search Customer
              </button>
            </form>
          </div>

          {activeCustomer ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Golden Identity Record & PII Decryption */}
              <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-lg p-5 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                  <div>
                    <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                      <span>{activeCustomer.legalNameTh}</span>
                      <span className="text-zinc-400 font-normal">({activeCustomer.legalNameEn})</span>
                    </h2>
                    <span className="text-xs font-mono text-zinc-500">UUID: {activeCustomer.customerId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800">
                      KYC: {activeCustomer.dataCompleteness}
                    </span>
                    {!isRevealed ? (
                      <button
                        onClick={() => setShowUnmaskModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-md transition-colors shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Reveal PII
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsRevealed(false)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium rounded-md transition-colors border border-zinc-200"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        Re-Mask
                      </button>
                    )}
                  </div>
                </div>

                {isRevealed && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Confidential PII Data Unmasked</p>
                      <p>
                        This view has been logged to the immutable audit ledger with your staff ID and timestamp. Real-time
                        access token valid for this session only.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                    <div className="flex justify-between items-center text-xs text-zinc-500 mb-1">
                      <span>Thai National ID Card (AES-256)</span>
                      <Lock className="w-3 h-3 text-zinc-400" />
                    </div>
                    <div className="font-mono text-zinc-900 font-medium">
                      {isRevealed ? activeCustomer.unmaskedIdCard : activeCustomer.maskedIdCard}
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                    <div className="flex justify-between items-center text-xs text-zinc-500 mb-1">
                      <span>Phone Number (E.164 Encrypted)</span>
                      <Lock className="w-3 h-3 text-zinc-400" />
                    </div>
                    <div className="font-mono text-zinc-900 font-medium">
                      {isRevealed ? activeCustomer.unmaskedPhone : activeCustomer.maskedPhone}
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                    <div className="text-xs text-zinc-500 mb-1">Primary Email</div>
                    <div className="text-zinc-900 font-medium">{activeCustomer.email}</div>
                  </div>

                  <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                    <div className="text-xs text-zinc-500 mb-1">Associated Policies Portfolio</div>
                    <div className="flex gap-3 text-xs mt-0.5">
                      <span className="text-emerald-700 font-medium">
                        {activeCustomer.policiesCount.active} Active
                      </span>
                      <span className="text-zinc-500">{activeCustomer.policiesCount.expired} Expired</span>
                      <span className="text-zinc-500">{activeCustomer.policiesCount.cancelled} Cancelled</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      alert(`Initiating DSAR Data Dossier generation for UUID ${activeCustomer.customerId}`);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 text-xs font-medium rounded-md transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export DSAR Personal Dossier (JSON/PDF)
                  </button>
                </div>
              </div>

              {/* Right Col: Consent & Privacy Version Status */}
              <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm space-y-4">
                <div className="border-b border-zinc-100 pb-3">
                  <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    PDPA Consent Profile
                  </h3>
                  <p className="text-xs text-zinc-500">Statutory Consent State & Policy Lineage</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 bg-zinc-50 border border-zinc-200 rounded-md text-xs">
                    <div>
                      <div className="font-medium text-zinc-800">Essential Policy Processing</div>
                      <div className="text-zinc-400">Underwriting, Issuance, OIC Por.Lor. 1</div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 font-medium rounded">
                      <CheckCircle2 className="w-3 h-3" /> Mandatory
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-zinc-50 border border-zinc-200 rounded-md text-xs">
                    <div>
                      <div className="font-medium text-zinc-800">Direct Marketing & Cross-sell</div>
                      <div className="text-zinc-400">Telesales reminders, promo campaigns</div>
                    </div>
                    {activeCustomer.consent.marketing ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-medium rounded">Opted In</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-zinc-200 text-zinc-700 font-medium rounded">Opted Out</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-zinc-50 border border-zinc-200 rounded-md text-xs">
                    <div>
                      <div className="font-medium text-zinc-800">Third-Party Affiliates</div>
                      <div className="text-zinc-400">Partner finance & rewards</div>
                    </div>
                    {activeCustomer.consent.thirdPartyTransfer ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-medium rounded">Opted In</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-zinc-200 text-zinc-700 font-medium rounded">Opted Out</span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 space-y-2 text-xs">
                  <div className="flex justify-between text-zinc-500">
                    <span>Agreed Policy Version:</span>
                    <span className="font-mono font-medium text-zinc-800">
                      {activeCustomer.consent.policyVersion}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-500">
                    <span>Consent Channel:</span>
                    <span className="font-medium text-zinc-800">{activeCustomer.consent.channel}</span>
                  </div>
                  <div className="flex justify-between text-zinc-500">
                    <span>Opt-in Timestamp:</span>
                    <span className="font-mono text-zinc-800">{activeCustomer.consent.timestamp}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-lg p-12 text-center text-zinc-500">
              <ShieldAlert className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
              <p className="text-sm">No customer record matched the search query.</p>
              <p className="text-xs text-zinc-400 mt-1">
                Enter an existing Customer UUID or Thai ID Card to inspect consent and decrypted attributes.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RIGHT TO ERASURE & ANONYMIZATION (BRD CRM-08 & 10-YR RETENTION) */}
      {activeTab === 'ERASURE' && (
        <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">
                Data Subject Right to Erasure (De-identification & Hard Anonymization)
              </h2>
              <p className="text-xs text-zinc-500">
                Enforcing Section 7.5: Rejects requests for customers with Active Policies or records within 10-Year OIC
                statutory retention.
              </p>
            </div>
            <span className="text-xs text-zinc-500">Rule: SCD Type 2 Non-Destructive Hash Overwrite</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600">
              <thead className="bg-zinc-100/75 text-zinc-700 uppercase font-semibold border-b border-zinc-200">
                <tr>
                  <th className="px-4 py-3">Request ID</th>
                  <th className="px-4 py-3">Customer Reference</th>
                  <th className="px-4 py-3">Requested Date</th>
                  <th className="px-4 py-3">Active Policies</th>
                  <th className="px-4 py-3">OIC 10-Yr Expiry</th>
                  <th className="px-4 py-3">Eligibility State</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {erasureRequests.map((req) => (
                  <tr key={req.requestId} className="hover:bg-zinc-50/75">
                    <td className="px-4 py-3 font-mono font-medium text-zinc-900">{req.requestId}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-800">{req.customerName}</div>
                      <div className="font-mono text-zinc-400 text-[11px]">{req.customerId}</div>
                    </td>
                    <td className="px-4 py-3">{req.requestedDate}</td>
                    <td className="px-4 py-3">
                      {req.activePoliciesCount > 0 ? (
                        <span className="text-red-600 font-semibold">{req.activePoliciesCount} Active</span>
                      ) : (
                        <span className="text-zinc-500">0 Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono">{req.retentionExpiryDate}</td>
                    <td className="px-4 py-3">
                      {req.eligibility === 'ELIGIBLE' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Eligible for Anonymization
                        </span>
                      )}
                      {req.eligibility === 'BLOCKED_ACTIVE_POLICY' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded font-medium">
                          <ShieldAlert className="w-3 h-3" /> Blocked: Active Coverage
                        </span>
                      )}
                      {req.eligibility === 'BLOCKED_OIC_10YR_RETENTION' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded font-medium">
                          <Clock className="w-3 h-3" /> Blocked: 10-Yr Audit Window
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {req.status === 'PENDING_REVIEW' && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded font-medium">Pending Review</span>
                      )}
                      {req.status === 'REJECTED' && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded font-medium">Legally Rejected</span>
                      )}
                      {req.status === 'ANONYMIZED' && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-medium">
                          Hard Anonymized
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {req.status === 'PENDING_REVIEW' && req.eligibility === 'ELIGIBLE' && (
                        <button
                          onClick={() => {
                            setSelectedErasure(req);
                            setShowAnonymizeModal(true);
                          }}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
                        >
                          Execute Anonymization
                        </button>
                      )}
                      {req.status === 'REJECTED' && (
                        <button
                          onClick={() =>
                            alert(
                              `Formal rejection letter issued to customer based on OIC Section 33 and PDPA legal obligation exemption.`
                            )
                          }
                          className="px-2.5 py-1 text-zinc-600 hover:text-zinc-900 border border-zinc-200 hover:bg-zinc-50 rounded text-xs transition-colors"
                        >
                          View Rejection Notice
                        </button>
                      )}
                      {req.status === 'ANONYMIZED' && (
                        <span className="text-[11px] text-zinc-400 font-mono">SHA-256 Overwritten</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: IMMUTABLE AUDIT TRAIL (PDPA & RBAC LOGS) */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Immutable PDPA Access & Mutation Audit Trail</h2>
              <p className="text-xs text-zinc-500">
                Write-Only postgres table (audit_logs). Captures every unmask request, DSAR dossier export, and anonymization.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => alert('Exporting signed audit snapshot...')}
                className="px-3 py-1.5 border border-zinc-300 hover:bg-white text-zinc-700 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export Audit Log (CSV)
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600">
              <thead className="bg-zinc-100/75 text-zinc-700 uppercase font-semibold border-b border-zinc-200">
                <tr>
                  <th className="px-4 py-3">Log ID / Timestamp</th>
                  <th className="px-4 py-3">Actor (Staff Account)</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target Entity</th>
                  <th className="px-4 py-3">Fields Accessed</th>
                  <th className="px-4 py-3">Justification Reason</th>
                  <th className="px-4 py-3">IP Address</th>
                  <th className="px-4 py-3">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 font-mono">
                {auditLogs.map((log) => (
                  <tr key={log.logId} className="hover:bg-zinc-50/75 font-sans">
                    <td className="px-4 py-3 font-mono">
                      <div className="font-semibold text-zinc-900">{log.logId}</div>
                      <div className="text-zinc-400 text-[11px]">{log.timestamp}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-800">{log.actorEmail}</div>
                      <div className="text-zinc-400 font-mono text-[11px]">{log.actorId}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          log.action === 'UNMASK_PII'
                            ? 'bg-amber-100 text-amber-800'
                            : log.action === 'ANONYMIZE_PII'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-zinc-600">
                      <div>{log.entityId}</div>
                      <span className="text-zinc-400">{log.entityType}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {log.fieldsAffected.map((f, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[10px] font-mono">
                            {f}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs text-zinc-700 italic">"{log.justificationReason}"</td>
                    <td className="px-4 py-3 font-mono text-zinc-500">{log.ipAddress}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-semibold text-[11px]">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PRIVACY POLICY & VERSION REGISTRY */}
      {activeTab === 'GOVERNANCE' && (
        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">Privacy Policy Version Governance</h2>
                <p className="text-xs text-zinc-500">
                  Manage Legal Notice version snapshots, published consent documents, and customer uptake rates.
                </p>
              </div>
              <button
                onClick={() => alert('Open Stage New Policy Version Modal')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors"
              >
                + Draft New Version
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MOCK_POLICY_VERSIONS.map((v) => (
                <div key={v.versionId} className="border border-zinc-200 rounded-lg p-4 bg-zinc-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-sm text-zinc-900">{v.code}</span>
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded ${
                        v.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-zinc-200 text-zinc-700'
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>

                  <div className="text-xs space-y-1.5 text-zinc-600">
                    <div className="flex justify-between">
                      <span>Effective Date:</span>
                      <span className="font-mono text-zinc-800">{v.effectiveFrom}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Published By:</span>
                      <span className="text-zinc-800">{v.publishedBy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Consented Users:</span>
                      <span className="font-semibold text-zinc-900">{v.consentedUsersCount.toLocaleString()} customers</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-200/60 flex justify-between items-center text-xs">
                    <a
                      href="#view-terms"
                      onClick={(e) => {
                        e.preventDefault();
                        alert(`Displaying legal clause text for ${v.code}`);
                      }}
                      className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      Inspect Legal Text <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      onClick={() => alert(`Downloading signed template for ${v.code}`)}
                      className="text-zinc-500 hover:text-zinc-800"
                    >
                      Download Notice (PDF)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: REVEAL / UNMASK PII CONFIRMATION --- */}
      {showUnmaskModal && activeCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-5 shadow-xl border border-zinc-200 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2 bg-amber-50 rounded-full">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">Authorize PII Decryption & Unmask</h3>
                <p className="text-xs text-zinc-500">Thai PDPA Section 27 Compliance Mandate</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Unmasking Personally Identifiable Information (Thai ID card and phone number) requires explicit RBAC scope{' '}
              <span className="font-mono bg-zinc-100 px-1 py-0.5 rounded text-zinc-800">pii:unmask</span> and records an
              immutable event in the compliance ledger.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">
                Business Justification Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={unmaskReason}
                onChange={(e) => {
                  setUnmaskReason(e.target.value);
                  if (unmaskError) setUnmaskError('');
                }}
                placeholder="e.g., Customer verbal identity verification for policy endorsement tmp-0091..."
                className="w-full text-xs p-2.5 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {unmaskError && <p className="text-[11px] text-red-600 font-medium">{unmaskError}</p>}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => {
                  setShowUnmaskModal(false);
                  setUnmaskReason('');
                  setUnmaskError('');
                }}
                className="px-3 py-1.5 border border-zinc-300 text-zinc-700 text-xs font-medium rounded-md hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUnmask}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors"
              >
                Authorize & Decrypt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: EXECUTE HARD ANONYMIZATION --- */}
      {showAnonymizeModal && selectedErasure && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-5 shadow-xl border border-zinc-200 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-50 rounded-full">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">Execute Hard Anonymization (Right to Forget)</h3>
                <p className="text-xs text-zinc-500">Permanent Overwrite of Identity Attributes</p>
              </div>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-md text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-zinc-500">Customer:</span>
                <span className="font-semibold text-zinc-800">{selectedErasure.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Customer UUID:</span>
                <span className="font-mono text-zinc-700">{selectedErasure.customerId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">10-Year OIC Legal Limit:</span>
                <span className="text-emerald-700 font-medium">Cleared (Last policy ended {selectedErasure.retentionExpiryDate})</span>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Per BRD CRM-08, database rows are <span className="font-semibold">not dropped</span> in order to preserve
              historical financial ledgers and statutory broker statistics. Instead, Thai ID cards, phones, and names
              will be permanently overwritten with irreversible cryptographic hash digests.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => {
                  setShowAnonymizeModal(false);
                  setSelectedErasure(null);
                }}
                className="px-3 py-1.5 border border-zinc-300 text-zinc-700 text-xs font-medium rounded-md hover:bg-zinc-50"
              >
                Abort
              </button>
              <button
                type="button"
                onClick={handleExecuteHardAnonymization}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md transition-colors"
              >
                Confirm Irreversible Anonymization
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataPrivacyCenterPage;