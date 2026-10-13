import {
  AlertCircle,
  Building2,
  Car,
  Check,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Flame,
  HeartPulse,
  Lock,
  Plane,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import React, { useMemo, useState } from "react";

// --- Types & Interfaces (Matching PAS Data Architecture) ---

export type DataCompleteness = "PARTIAL" | "VERIFIED";
export type RiskLevel = "LOW" | "MEDIUM" | "AML_PEP_REVIEW";
export type CustomerRole = "POLICYHOLDER" | "AGENT" | "BENEFICIARY";
export type LobType = "MOTOR" | "HEALTH" | "TRAVEL" | "PA" | "FIRE" | "LIFE" | "CUSTOM";

export interface PolicyPortfolioItem {
  policyId: string;
  policyNumber: string;
  lob: LobType;
  productName: string;
  insurerName: string;
  channelName: string;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  effectiveStartDate: string;
  effectiveEndDate: string;
  grossPremium: number;
  sumInsured: number;
}

export interface QuotationHistoryItem {
  quotationId: string;
  planName: string;
  grossPremium: number;
  status: "DRAFT" | "ACTIVE" | "QUOTATION_RATED" | "EXPIRED";
  validUntil: string;
  counterOfferNote?: string;
}

export interface CustomerVersionHistoryItem {
  versionId: string;
  versionNumber: number;
  dataCompleteness: DataCompleteness;
  legalNameTh: string;
  effectiveStartDate: string;
  effectiveEndDate: string | null;
  changeTrigger: string;
  changedBy: string;
}

export interface InteractionLogItem {
  id: string;
  eventType: string;
  description: string;
  channel: string;
  timestamp: string;
  actor: string;
}

export interface Customer360Record {
  customerId: string; // UUID Golden Record Anchor
  currentVersionId: string;
  legalNameTh: string;
  legalNameEn: string;
  maskedIdCard: string;
  unmaskedIdCard?: string;
  maskedPhone: string;
  unmaskedPhone?: string;
  email: string;
  dataCompleteness: DataCompleteness;
  riskLevel: RiskLevel;
  associatedRoles: CustomerRole[];
  agentCode?: string;
  dateOfBirth: string;
  occupation: string;
  addressTh: string;
  pdpaConsent: {
    version: string;
    consentedAt: string;
    channel: string;
    isEssentialGranted: boolean;
  };
  policies: PolicyPortfolioItem[];
  quotations: QuotationHistoryItem[];
  versions: CustomerVersionHistoryItem[];
  interactions: InteractionLogItem[];
}

// --- Mock Dataset (PAS Master Data Aligned) ---

const MOCK_CUSTOMERS: Customer360Record[] = [
  {
    customerId: "c99e8400-e29b-41d4-a716-446655449999",
    currentVersionId: "v-2026-99182",
    legalNameTh: "นาย สมชาย ใจดี",
    legalNameEn: "Mr. Somchai Jaidee",
    maskedIdCard: "1-1004-XXXX-88-9",
    unmaskedIdCard: "1100499998889",
    maskedPhone: "+66-89-XXX-1234",
    unmaskedPhone: "+66-89-123-1234",
    email: "somchai.j@example.com",
    dataCompleteness: "VERIFIED",
    riskLevel: "LOW",
    associatedRoles: ["POLICYHOLDER", "AGENT"],
    agentCode: "AG-88019",
    dateOfBirth: "1985-06-14",
    occupation: "Software Engineer (Class 1)",
    addressTh: "128/9 หมู่ 4 แขวงจตุจักร เขตจตุจักร กรุงเทพมหานคร 10900",
    pdpaConsent: {
      version: "policy_v_2026_01",
      consentedAt: "2026-01-15T09:30:00Z",
      channel: "WEBSITE_CHECKOUT",
      isEssentialGranted: true,
    },
    policies: [
      {
        policyId: "pol-001",
        policyNumber: "VIR-MOT-2026-00441",
        lob: "MOTOR",
        productName: "Viriyah Type 1 Single Rate",
        insurerName: "Viriyah Insurance",
        channelName: "Website (Online STP)",
        status: "ACTIVE",
        effectiveStartDate: "2026-02-01",
        effectiveEndDate: "2027-02-01",
        grossPremium: 18500.0,
        sumInsured: 650000.0,
      },
      {
        policyId: "pol-002",
        policyNumber: "AIA-HLT-2025-99812",
        lob: "HEALTH",
        productName: "AIA Health Happy Extra",
        insurerName: "AIA Thailand",
        channelName: "Telesales",
        status: "ACTIVE",
        effectiveStartDate: "2025-11-10",
        effectiveEndDate: "2026-11-10",
        grossPremium: 24200.0,
        sumInsured: 1000000.0,
      },
    ],
    quotations: [
      {
        quotationId: "QT-2026-0002",
        planName: "Cyber Shield SME Elite",
        grossPremium: 91290.0,
        status: "QUOTATION_RATED",
        validUntil: "2026-10-30",
        counterOfferNote: "Rated with +20% server risk loading by Senior Underwriter.",
      },
    ],
    versions: [
      {
        versionId: "ver-2",
        versionNumber: 2,
        dataCompleteness: "VERIFIED",
        legalNameTh: "นาย สมชาย ใจดี",
        effectiveStartDate: "2026-01-15 09:30:00",
        effectiveEndDate: null,
        changeTrigger: "KYC Checkout Validation (Thai ID card submitted)",
        changedBy: "System / Sales Channel API",
      },
      {
        versionId: "ver-1",
        versionNumber: 1,
        dataCompleteness: "PARTIAL",
        legalNameTh: "นาย สมชาย ใจดี",
        effectiveStartDate: "2025-10-12 14:10:00",
        effectiveEndDate: "2026-01-15 09:30:00",
        changeTrigger: "Quick Quote Lead Generation (Phone & Name only)",
        changedBy: "Telesales Agent (ID: TS-04)",
      },
    ],
    interactions: [
      {
        id: "evt-01",
        eventType: "OFFER_RATED",
        description: "Underwriter issued counter-offer with 20% loading on Cyber Risk.",
        channel: "Underwriting Engine",
        timestamp: "2026-10-10 11:20:00",
        actor: "UW_OFFICER_02",
      },
      {
        id: "evt-02",
        eventType: "POLICY_ISSUED",
        description: "Motor Type 1 Policy confirmed and official policy document registered.",
        channel: "System / Viriyah Host-to-Host API",
        timestamp: "2026-02-01 00:01:00",
        actor: "INTEGRATION_WORKER",
      },
      {
        id: "evt-03",
        eventType: "PDPA_CONSENT_OPT_IN",
        description: "Consented to Terms and Privacy Policy version policy_v_2026_01.",
        channel: "Website Gateway",
        timestamp: "2026-01-15 09:30:00",
        actor: "CUSTOMER_PORTAL",
      },
    ],
  },
  {
    customerId: "d11e8400-b11b-42d4-a716-112233445566",
    currentVersionId: "v-2026-11029",
    legalNameTh: "นางสาว พิมลวรรณ สุวรรณฉัตร",
    legalNameEn: "Ms. Pimonwan Suwannachat",
    maskedIdCard: "3-1008-XXXX-12-4",
    unmaskedIdCard: "3100877771234",
    maskedPhone: "+66-81-XXX-8899",
    unmaskedPhone: "+66-81-777-8899",
    email: "pimonwan.s@enterprise.co.th",
    dataCompleteness: "VERIFIED",
    riskLevel: "AML_PEP_REVIEW",
    associatedRoles: ["POLICYHOLDER", "BENEFICIARY"],
    dateOfBirth: "1979-11-23",
    occupation: "Director / Corporate Management (Class 1)",
    addressTh: "45/1 ถนนสุขุมวิท 21 แขวงคลองเตยเหนือ เขตวัฒนา กรุงเทพฯ 10110",
    pdpaConsent: {
      version: "policy_v_2026_01",
      consentedAt: "2026-03-20T11:00:00Z",
      channel: "DIRECT_SALE",
      isEssentialGranted: true,
    },
    policies: [
      {
        policyId: "pol-003",
        policyNumber: "BKI-FIR-2026-88192",
        lob: "FIRE",
        productName: "Bangkok Commercial Fire & Property",
        insurerName: "Bangkok Insurance",
        channelName: "Direct sale (Face-to-Face)",
        status: "ACTIVE",
        effectiveStartDate: "2026-04-01",
        effectiveEndDate: "2027-04-01",
        grossPremium: 45000.0,
        sumInsured: 15000000.0,
      },
    ],
    quotations: [],
    versions: [
      {
        versionId: "ver-10",
        versionNumber: 1,
        dataCompleteness: "VERIFIED",
        legalNameTh: "นางสาว พิมลวรรณ สุวรรณฉัตร",
        effectiveStartDate: "2026-03-20 11:00:00",
        effectiveEndDate: null,
        changeTrigger: "Direct Application Ingestion",
        changedBy: "Direct Sales Executive (DS-11)",
      },
    ],
    interactions: [
      {
        id: "evt-11",
        eventType: "AML_CHECK_TRIGGERED",
        description: "High net-worth direct property risk flagged for PEP/AML enhanced due diligence.",
        channel: "Compliance Rules Engine",
        timestamp: "2026-03-20 11:05:00",
        actor: "SYSTEM_COMPLIANCE_BOT",
      },
    ],
  },
  {
    customerId: "e33e8400-f33b-43d4-c916-778899001122",
    currentVersionId: "v-2026-00412",
    legalNameTh: "นาย ธนกฤต กิตติคุณ (Lead Mode)",
    legalNameEn: "Mr. Thanakrit Kittikun",
    maskedIdCard: "Uncollected (Lead Stage)",
    maskedPhone: "+66-95-XXX-7711",
    email: "thanakrit.k@tele.sample",
    dataCompleteness: "PARTIAL",
    riskLevel: "LOW",
    associatedRoles: ["POLICYHOLDER"],
    dateOfBirth: "1992-04-05",
    occupation: "Self-employed / Merchant",
    addressTh: "อำเภอเมือง จังหวัดนนทบุรี (Address incomplete)",
    pdpaConsent: {
      version: "policy_v_2026_01",
      consentedAt: "2026-09-02T16:45:00Z",
      channel: "TELESALES_CALL",
      isEssentialGranted: true,
    },
    policies: [],
    quotations: [
      {
        quotationId: "QT-2026-9041",
        planName: "MSIG Motor Type 2+ Eco Value",
        grossPremium: 7900.0,
        status: "ACTIVE",
        validUntil: "2026-11-01",
      },
    ],
    versions: [
      {
        versionId: "ver-01-lead",
        versionNumber: 1,
        dataCompleteness: "PARTIAL",
        legalNameTh: "นาย ธนกฤต กิตติคุณ (Lead Mode)",
        effectiveStartDate: "2026-09-02 16:45:00",
        effectiveEndDate: null,
        changeTrigger: "Inbound Telesales Campaign Inquiry",
        changedBy: "Telesales Agent (ID: TS-19)",
      },
    ],
    interactions: [
      {
        id: "evt-30",
        eventType: "QUOTATION_GENERATED",
        description: "Auto quotation generated for Toyota Yaris 2020.",
        channel: "Telesales",
        timestamp: "2026-09-02 16:48:00",
        actor: "TS-19",
      },
    ],
  },
];

export const CustomerDirectoryPage: React.FC = () => {
  // --- States ---
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompleteness, setSelectedCompleteness] = useState<string>("ALL");
  const [selectedRisk, setSelectedRisk] = useState<string>("ALL");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");

  // Drawer / Details Modal State
  const [activeCustomer, setActiveCustomer] = useState<Customer360Record | null>(null);
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "POLICIES" | "QUOTES" | "TIMELINE" | "VERSIONS">("OVERVIEW");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // PDPA PII Unmasking Modal State
  const [isUnmaskModalOpen, setIsUnmaskModalOpen] = useState(false);
  const [unmaskReason, setUnmaskReason] = useState("");
  const [unmaskedMap, setUnmaskedMap] = useState<Record<string, boolean>>({});

  // --- Handlers ---
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenUnmaskModal = () => {
    setUnmaskReason("");
    setIsUnmaskModalOpen(true);
  };

  const handleConfirmUnmask = () => {
    if (!unmaskReason.trim() || !activeCustomer) return;
    // Emulates calling POST /admin/customers/{uuid}/unmask with mandatory audit log
    setUnmaskedMap((prev) => ({
      ...prev,
      [activeCustomer.customerId]: true,
    }));
    setIsUnmaskModalOpen(false);
  };

  const isCurrentCustomerUnmasked = useMemo(() => {
    if (!activeCustomer) return false;
    return Boolean(unmaskedMap[activeCustomer.customerId]);
  }, [activeCustomer, unmaskedMap]);

  // --- Filter Logic ---
  const filteredCustomers = useMemo(() => {
    return MOCK_CUSTOMERS.filter((cust) => {
      const matchSearch =
        cust.legalNameTh.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cust.legalNameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cust.customerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cust.maskedPhone.includes(searchTerm) ||
        cust.maskedIdCard.includes(searchTerm);

      const matchCompleteness = selectedCompleteness === "ALL" || cust.dataCompleteness === selectedCompleteness;
      const matchRisk = selectedRisk === "ALL" || cust.riskLevel === selectedRisk;
      const matchRole = selectedRole === "ALL" || cust.associatedRoles.includes(selectedRole as CustomerRole);

      return matchSearch && matchCompleteness && matchRisk && matchRole;
    });
  }, [searchTerm, selectedCompleteness, selectedRisk, selectedRole]);

  // LOB Icon Helper
  const getLobBadge = (lob: LobType) => {
    switch (lob) {
      case "MOTOR":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Car className="w-3 h-3" /> Motor
          </span>
        );
      case "HEALTH":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <HeartPulse className="w-3 h-3" /> Health
          </span>
        );
      case "FIRE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
            <Flame className="w-3 h-3" /> Fire
          </span>
        );
      case "TRAVEL":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-cyan-50 text-cyan-700 border border-cyan-200">
            <Plane className="w-3 h-3" /> Travel
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
            <Building2 className="w-3 h-3" /> {lob}
          </span>
        );
    }
  };

  return (
    <div className="w-full text-zinc-900">
      {/* 
        NO PADDING ON TOP CONTAINER:
        Cancels out the AdminLayout <main className="p-6"> padding on top and sides
        to create a full-bleed Backoffice header docking seamlessly to layout header.
      */}
      <div className="-mt-6 -mx-6 bg-white border-b border-zinc-200 px-6 py-4 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium mb-1">
              <span>MDM & Single Identity</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-zinc-900 font-semibold">Customer 360° Directory</span>
            </div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Customer 360° Master Directory</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Golden Record registry, SCD Type 2 demographic versioning, and PDPA-governed customer interaction
              portfolio.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3">
            <div className="bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-lg text-left">
              <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider block">
                Golden Records
              </span>
              <span className="text-sm font-bold text-zinc-900">3 Profiles</span>
            </div>
            <div className="bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-lg text-left">
              <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider block">
                Verified KYC
              </span>
              <span className="text-sm font-bold text-emerald-600">66.7%</span>
            </div>
            <div className="bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-lg text-left">
              <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider block">
                PDPA Compliant
              </span>
              <span className="text-sm font-bold text-blue-600">100% Opt-in</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-4 pt-3 border-t border-zinc-100 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Legal Name (TH/EN), Thai ID Card, Phone, or UUID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white text-zinc-900 placeholder-zinc-400"
            />
          </div>

          {/* Completeness Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-zinc-500">Completeness:</span>
            <select
              value={selectedCompleteness}
              onChange={(e) => setSelectedCompleteness(e.target.value)}
              className="bg-white border border-zinc-200 text-zinc-800 text-xs py-1.5 px-2 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
            >
              <option value="ALL">All States</option>
              <option value="VERIFIED">VERIFIED (Full KYC)</option>
              <option value="PARTIAL">PARTIAL (Lead Mode)</option>
            </select>
          </div>

          {/* Risk Level Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-zinc-500">Risk AML:</span>
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="bg-white border border-zinc-200 text-zinc-800 text-xs py-1.5 px-2 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
            >
              <option value="ALL">All Risk Tiers</option>
              <option value="LOW">Low Risk</option>
              <option value="AML_PEP_REVIEW">AML/PEP Monitored</option>
            </select>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-zinc-500">Role:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-white border border-zinc-200 text-zinc-800 text-xs py-1.5 px-2 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
            >
              <option value="ALL">All Roles</option>
              <option value="POLICYHOLDER">Policyholder</option>
              <option value="AGENT">Agent (Seller)</option>
              <option value="BENEFICIARY">Beneficiary</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Customers Data Grid */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Customer Identity / Anchor</th>
                <th className="py-3 px-4">KYC State</th>
                <th className="py-3 px-4">Thai ID Card (Masked)</th>
                <th className="py-3 px-4">Phone / Contact</th>
                <th className="py-3 px-4">Roles & Risk</th>
                <th className="py-3 px-4">Active Policies</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-700">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-400">
                    No golden records found matching the specified parameters.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr
                    key={cust.customerId}
                    className="hover:bg-zinc-50/70 transition-colors cursor-pointer"
                    onClick={() => {
                      setActiveCustomer(cust);
                      setActiveTab("OVERVIEW");
                    }}
                  >
                    {/* Identity */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-zinc-900 text-sm">{cust.legalNameTh}</div>
                      <div className="text-zinc-500 text-[11px]">{cust.legalNameEn}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="font-mono text-[10px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                          {cust.customerId.slice(0, 13)}...
                        </span>
                        <button
                          title="Copy UUID"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(cust.customerId, cust.customerId);
                          }}
                          className="text-zinc-400 hover:text-zinc-700"
                        >
                          {copiedId === cust.customerId ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Data Completeness */}
                    <td className="py-3 px-4">
                      {cust.dataCompleteness === "VERIFIED" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" /> VERIFIED (v2)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle className="w-3 h-3" /> PARTIAL (Lead)
                        </span>
                      )}
                    </td>

                    {/* ID Card */}
                    <td className="py-3 px-4 font-mono text-zinc-600">
                      {unmaskedMap[cust.customerId] && cust.unmaskedIdCard ? cust.unmaskedIdCard : cust.maskedIdCard}
                    </td>

                    {/* Phone */}
                    <td className="py-3 px-4">
                      <div className="font-mono text-zinc-800">
                        {unmaskedMap[cust.customerId] && cust.unmaskedPhone ? cust.unmaskedPhone : cust.maskedPhone}
                      </div>
                      <div className="text-[11px] text-zinc-400">{cust.email}</div>
                    </td>

                    {/* Roles & Risk */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 mb-1">
                        {cust.associatedRoles.map((role) => (
                          <span
                            key={role}
                            className={`px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase ${
                              role === "AGENT"
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : "bg-zinc-100 text-zinc-700 border border-zinc-200"
                            }`}
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                      {cust.riskLevel === "AML_PEP_REVIEW" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          <ShieldAlert className="w-2.5 h-2.5" /> AML/PEP Review
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-400 font-medium">Standard AML</span>
                      )}
                    </td>

                    {/* Policy Count */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200">
                        {cust.policies.length} Contract{cust.policies.length !== 1 ? "s" : ""}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveCustomer(cust);
                          setActiveTab("OVERVIEW");
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-zinc-900 text-white rounded hover:bg-zinc-800 transition"
                      >
                        360° View
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- CUSTOMER 360° DRAWER / MODAL --- */}
      {activeCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col border-l border-zinc-200 overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-zinc-200 bg-zinc-50 shrink-0">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Golden Record UUID</span>
                    <span className="font-mono text-xs bg-zinc-200 px-2 py-0.5 rounded text-zinc-800">
                      {activeCustomer.customerId}
                    </span>
                    <button
                      onClick={() => handleCopy(activeCustomer.customerId, "drawer-id")}
                      className="text-zinc-500 hover:text-zinc-800"
                    >
                      {copiedId === "drawer-id" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <h2 className="text-xl font-bold text-zinc-900 mt-1">{activeCustomer.legalNameTh}</h2>
                  <p className="text-xs text-zinc-500">{activeCustomer.legalNameEn}</p>
                </div>

                <div className="flex items-center gap-2">
                  {/* PDPA Unmask Button */}
                  <button
                    onClick={handleOpenUnmaskModal}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition ${
                      isCurrentCustomerUnmasked
                        ? "bg-amber-50 text-amber-700 border-amber-300"
                        : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                    }`}
                  >
                    {isCurrentCustomerUnmasked ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                        PII Revealed (Audited)
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 text-zinc-500" />
                        Unmask PII (PDPA)
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveCustomer(null)}
                    className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Badges Strip */}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                {activeCustomer.dataCompleteness === "VERIFIED" ? (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs font-semibold">
                    KYC Verified
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-semibold">
                    Incomplete KYC (Lead)
                  </span>
                )}

                {activeCustomer.associatedRoles.map((role) => (
                  <span key={role} className="px-2 py-0.5 bg-zinc-200 text-zinc-800 rounded text-xs font-medium">
                    Role: {role}
                  </span>
                ))}

                {activeCustomer.agentCode && (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-mono font-medium">
                    Agent Code: {activeCustomer.agentCode}
                  </span>
                )}

                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-medium">
                  PDPA: {activeCustomer.pdpaConsent.version}
                </span>
              </div>

              {/* Navigation Tabs */}
              <div className="flex gap-4 mt-6 border-b border-zinc-200 text-xs font-medium">
                {[
                  { key: "OVERVIEW", label: "360° Profile & Demographics" },
                  { key: "POLICIES", label: `Policy Portfolio (${activeCustomer.policies.length})` },
                  { key: "QUOTES", label: `Quotes & Cart (${activeCustomer.quotations.length})` },
                  { key: "TIMELINE", label: `Interaction Timeline (${activeCustomer.interactions.length})` },
                  { key: "VERSIONS", label: `SCD Version History (v${activeCustomer.versions.length})` },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`pb-2 -mb-px transition font-semibold ${activeTab === tab.key ? "border-b-2 border-zinc-900 text-zinc-900" : "text-zinc-500 hover:text-zinc-800"}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/50 space-y-6">
              {/* TAB 1: OVERVIEW */}
              {activeTab === "OVERVIEW" && (
                <div className="space-y-6">
                  {/* Demographics Card */}
                  <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-zinc-500" />
                      Core Demographic KYC Data
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-zinc-500 block">Thai National ID / Tax ID</span>
                        <span className="font-mono font-semibold text-zinc-900">
                          {isCurrentCustomerUnmasked && activeCustomer.unmaskedIdCard
                            ? activeCustomer.unmaskedIdCard
                            : activeCustomer.maskedIdCard}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Phone Number (E.164)</span>
                        <span className="font-mono font-semibold text-zinc-900">
                          {isCurrentCustomerUnmasked && activeCustomer.unmaskedPhone
                            ? activeCustomer.unmaskedPhone
                            : activeCustomer.maskedPhone}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Date of Birth</span>
                        <span className="text-zinc-900 font-medium">{activeCustomer.dateOfBirth} (Age: 41)</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Occupation & URE Group</span>
                        <span className="text-zinc-900 font-medium">{activeCustomer.occupation}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-zinc-500 block">Registered Address (TH)</span>
                        <span className="text-zinc-800 font-medium">{activeCustomer.addressTh}</span>
                      </div>
                    </div>
                  </div>

                  {/* PDPA & Consent Snapshot */}
                  <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-zinc-500" />
                      PDPA Consent Profile & Legal Audit
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-zinc-500 block">Consent Policy Version</span>
                        <span className="font-mono font-medium text-zinc-900">
                          {activeCustomer.pdpaConsent.version}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Consent Timestamp</span>
                        <span className="text-zinc-900">
                          {new Date(activeCustomer.pdpaConsent.consentedAt).toLocaleString("th-TH")}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Consent Channel</span>
                        <span className="text-zinc-900 font-medium">{activeCustomer.pdpaConsent.channel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Portfolio Quick Summary Card */}
                  <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
                      Active Customer Exposure
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="p-3 bg-zinc-50 rounded border border-zinc-200">
                        <span className="text-zinc-500 block text-[11px]">Total Active Annual Premium</span>
                        <span className="text-base font-bold text-zinc-900">
                          ฿
                          {activeCustomer.policies
                            .filter((p) => p.status === "ACTIVE")
                            .reduce((sum, p) => sum + p.grossPremium, 0)
                            .toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="p-3 bg-zinc-50 rounded border border-zinc-200">
                        <span className="text-zinc-500 block text-[11px]">Total Active Sum Insured</span>
                        <span className="text-base font-bold text-zinc-900">
                          ฿
                          {activeCustomer.policies
                            .filter((p) => p.status === "ACTIVE")
                            .reduce((sum, p) => sum + p.sumInsured, 0)
                            .toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: POLICIES */}
              {activeTab === "POLICIES" && (
                <div className="space-y-4">
                  {activeCustomer.policies.length === 0 ? (
                    <div className="bg-white border border-zinc-200 rounded-lg p-8 text-center text-zinc-400 text-xs">
                      No policies found for this golden identity record.
                    </div>
                  ) : (
                    activeCustomer.policies.map((p) => (
                      <div
                        key={p.policyId}
                        className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getLobBadge(p.lob)}
                            <span className="font-mono font-bold text-xs text-zinc-900">{p.policyNumber}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              p.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-zinc-100 text-zinc-600"
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>

                        <div className="text-xs">
                          <div className="font-semibold text-zinc-800">{p.productName}</div>
                          <div className="text-zinc-500 text-[11px]">
                            Insurer: {p.insurerName} • Channel: {p.channelName}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-100 text-xs">
                          <div>
                            <span className="text-zinc-400 block text-[10px] uppercase">Effective Start</span>
                            <span className="text-zinc-800 font-medium">{p.effectiveStartDate}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-[10px] uppercase">Effective End</span>
                            <span className="text-zinc-800 font-medium">{p.effectiveEndDate}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-[10px] uppercase">Gross Premium</span>
                            <span className="text-zinc-900 font-semibold">฿{p.grossPremium.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-[10px] uppercase">Sum Insured</span>
                            <span className="text-zinc-900 font-semibold">฿{p.sumInsured.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: QUOTES */}
              {activeTab === "QUOTES" && (
                <div className="space-y-4">
                  {activeCustomer.quotations.length === 0 ? (
                    <div className="bg-white border border-zinc-200 rounded-lg p-8 text-center text-zinc-400 text-xs">
                      No active quotes or counter-offers on file.
                    </div>
                  ) : (
                    activeCustomer.quotations.map((q) => (
                      <div
                        key={q.quotationId}
                        className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-zinc-900">{q.quotationId}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              q.status === "QUOTATION_RATED"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {q.status}
                          </span>
                        </div>
                        <div className="font-medium text-zinc-800">{q.planName}</div>
                        <div className="text-zinc-500">
                          Valid Until: <span className="font-medium text-zinc-800">{q.validUntil}</span> • Gross:{" "}
                          <span className="font-bold text-zinc-900">฿{q.grossPremium.toLocaleString()}</span>
                        </div>
                        {q.counterOfferNote && (
                          <div className="p-2 bg-amber-50/70 border border-amber-200 rounded text-amber-800 text-[11px] mt-2">
                            <strong>Underwriter Note:</strong> {q.counterOfferNote}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: TIMELINE */}
              {activeTab === "TIMELINE" && (
                <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">
                    interaction_logs Audit Trail
                  </h3>
                  <div className="relative border-l border-zinc-200 ml-3 space-y-6">
                    {activeCustomer.interactions.map((event) => (
                      <div key={event.id} className="relative pl-6">
                        <span className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-zinc-900 border-2 border-white ring-2 ring-zinc-200" />
                        <div className="text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-zinc-900">{event.eventType}</span>
                            <span className="text-zinc-400 text-[11px] font-mono">{event.timestamp}</span>
                          </div>
                          <p className="text-zinc-600 mt-0.5">{event.description}</p>
                          <div className="text-[10px] text-zinc-400 mt-1">
                            Origin: {event.channel} • Actor: {event.actor}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: SCD VERSION HISTORY */}
              {activeTab === "VERSIONS" && (
                <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      customer_versions (SCD Type 2 Timeline)
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Chronological snapshots of demographic and identity verification records.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {activeCustomer.versions.map((ver) => (
                      <div key={ver.versionId} className="p-3 border border-zinc-200 rounded-md bg-zinc-50/50 text-xs">
                        <div className="flex items-center justify-between font-medium">
                          <span className="font-bold text-zinc-900">
                            Version {ver.versionNumber} ({ver.dataCompleteness})
                          </span>
                          <span className="font-mono text-[11px] text-zinc-500">
                            {ver.effectiveStartDate} → {ver.effectiveEndDate || "Present (Current)"}
                          </span>
                        </div>
                        <div className="text-zinc-600 mt-1">
                          <strong>Legal Name:</strong> {ver.legalNameTh}
                        </div>
                        <div className="text-zinc-500 text-[11px] mt-0.5">
                          <strong>Trigger:</strong> {ver.changeTrigger} • <strong>Actor:</strong> {ver.changedBy}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- PDPA PII UNMASKING AUDIT MODAL --- */}
      {isUnmaskModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-zinc-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-full border border-rose-100">
                <Lock className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">PDPA PII Unmasking Justification</h3>
                <span className="text-xs text-zinc-500">Thai PDPA Compliance (Section SEC-03)</span>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Revealing unmasked Thai National IDs and Phone Numbers triggers an irrefutable entry in the{" "}
              <code className="text-zinc-900 font-mono bg-zinc-100 px-1 py-0.5 rounded">audit_logs</code> table storing
              your User UUID, IP Address, and reasoning.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 block">
                Mandatory Justification Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="e.g., Inbound phone KYC identity confirmation or OIC dispute audit..."
                value={unmaskReason}
                onChange={(e) => setUnmaskReason(e.target.value)}
                className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 text-zinc-900 placeholder-zinc-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setIsUnmaskModalOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 rounded-md transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!unmaskReason.trim()}
                onClick={handleConfirmUnmask}
                className="px-3 py-1.5 text-xs font-semibold bg-zinc-900 text-white rounded-md hover:bg-zinc-800 disabled:opacity-40 transition"
              >
                Authorize & Log Unmask
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDirectoryPage;
