import {
  ArrowRightCircle,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  FileText,
  Filter,
  Layers,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  User,
  XCircle,
} from "lucide-react";
import React, { useMemo, useState } from "react";

// ============================================================================
// TYPES & INTERFACES (Aligned with SDD Section 4.3, 4.4, 4.5 & BRD 4.4.1)
// ============================================================================

export type QuotationStatus = "DRAFT" | "ACTIVE" | "EXPIRED";
export type LOBCode = "MOTOR" | "CMI" | "HEALTH" | "TRAVEL" | "PA" | "FIRE" | "LIFE" | "CUSTOM";
export type SalesChannelId = 1 | 2 | 3 | 4; // 1: Telesales, 2: Direct, 3: Website, 4: Sub-agent
export type DataCompleteness = "PARTIAL" | "VERIFIED" | "GUEST";

export interface InstallmentCycle {
  cycle_number: number;
  due_date: string;
  expected_amount: number;
  percentage: number;
}

export interface QuotationVersionSnapshot {
  version_id: string;
  version_number: number;
  quotation_id: string;
  product_version_id: string;
  plan_code: string;
  plan_name: string;
  base_premium: number;
  tax_amount: number; // Stamp Duty + VAT
  gross_premium: number;
  installment_array: InstallmentCycle[];
  valid_until: string; // ISO 8601
  status: QuotationStatus;
  created_at: string;
  created_by: string;
  risk_summary: Record<string, string | number | boolean>;
}

export interface QuotationRecord {
  quotation_id: string; // UUID
  quotation_ref: string; // Display ID e.g. QT-2026-0001
  customer_id: string | null; // Nullable if Guest
  customer_name: string;
  customer_phone_masked: string;
  customer_phone_unmasked: string;
  customer_id_card_masked: string;
  customer_id_card_unmasked: string;
  data_completeness: DataCompleteness;
  channel_id: SalesChannelId;
  insurer_name: string;
  lob_code: LOBCode;
  product_code: string;
  product_name: string;
  created_at: string;
  linked_application_id?: string | null;
  linked_application_status?: string | null;
  versions: QuotationVersionSnapshot[]; // Ordered latest first (v2, v1)
}

// ============================================================================
// MOCK DATA (Aligned with SDD Schema & Thailand Broker Context)
// ============================================================================

const INITIAL_QUOTATIONS: QuotationRecord[] = [
  {
    quotation_id: "550e8400-e29b-41d4-a716-446655440101",
    quotation_ref: "QT-2026-8841",
    customer_id: "cust-uuid-9001",
    customer_name: "Somchai Jaidee",
    customer_phone_masked: "081-XXX-4592",
    customer_phone_unmasked: "081-892-4592",
    customer_id_card_masked: "1-1004-XXXX-88-9",
    customer_id_card_unmasked: "1-1004-00921-88-9",
    data_completeness: "VERIFIED",
    channel_id: 1, // Telesales
    insurer_name: "Viriyah Insurance",
    lob_code: "MOTOR",
    product_code: "VIR-MOT-TYPE1-EV",
    product_name: "Motor Type 1 EV Prestige",
    created_at: "2026-10-10T09:15:00Z",
    linked_application_id: null,
    linked_application_status: null,
    versions: [
      {
        version_id: "qver-uuid-202",
        version_number: 2,
        quotation_id: "550e8400-e29b-41d4-a716-446655440101",
        product_version_id: "pver-uuid-88",
        plan_code: "PLN-GOLD-DEDUCT-0",
        plan_name: "Gold Package (Dealer Garage - No Deductible + Flood)",
        base_premium: 22500.0,
        tax_amount: 1665.25,
        gross_premium: 24165.25,
        valid_until: "2026-11-10T23:59:59Z",
        status: "ACTIVE",
        created_at: "2026-10-10T09:42:00Z",
        created_by: "agent-uuid-104 (K. Nattapong)",
        risk_summary: {
          Brand: "BYD",
          Model: "Seal AWD Performance",
          Year: 2025,
          "OIC Group": "Group 2 (EV)",
          "Battery Capacity": "82.5 kWh",
          "Sum Insured": "1,250,000 THB (80% Redbook)",
          "Named Drivers": "2 Drivers (Youngest DOB: 1991-04-12)",
        },
        installment_array: [
          { cycle_number: 1, due_date: "2026-10-15", expected_amount: 8459.25, percentage: 35 },
          { cycle_number: 2, due_date: "2026-11-15", expected_amount: 7853.0, percentage: 32.5 },
          { cycle_number: 3, due_date: "2026-12-15", expected_amount: 7853.0, percentage: 32.5 },
        ],
      },
      {
        version_id: "qver-uuid-201",
        version_number: 1,
        quotation_id: "550e8400-e29b-41d4-a716-446655440101",
        product_version_id: "pver-uuid-88",
        plan_code: "PLN-SILVER-DEDUCT-3K",
        plan_name: "Silver Package (Network Garage - 3,000 Deductible)",
        base_premium: 18500.0,
        tax_amount: 1369.5,
        gross_premium: 19869.5,
        valid_until: "2026-10-10T09:42:00Z",
        status: "EXPIRED",
        created_at: "2026-10-10T09:15:00Z",
        created_by: "agent-uuid-104 (K. Nattapong)",
        risk_summary: {
          Brand: "BYD",
          Model: "Seal AWD Performance",
          Year: 2025,
          "Sum Insured": "1,250,000 THB",
          Deductible: "3,000 THB",
        },
        installment_array: [{ cycle_number: 1, due_date: "2026-10-15", expected_amount: 19869.5, percentage: 100 }],
      },
    ],
  },
  {
    quotation_id: "550e8400-e29b-41d4-a716-446655440102",
    quotation_ref: "QT-2026-8839",
    customer_id: "cust-uuid-9002",
    customer_name: "Wipawee Charoenphon",
    customer_phone_masked: "089-XXX-1120",
    customer_phone_unmasked: "089-441-1120",
    customer_id_card_masked: "3-1012-XXXX-41-2",
    customer_id_card_unmasked: "3-1012-00419-41-2",
    data_completeness: "VERIFIED",
    channel_id: 3, // Website
    insurer_name: "AIA Thailand",
    lob_code: "HEALTH",
    product_code: "AIA-HLT-INFINITE",
    product_name: "AIA Health Happy Infinite",
    created_at: "2026-10-12T14:20:00Z",
    linked_application_id: "APP-2026-0099",
    linked_application_status: "PENDING_REVIEW",
    versions: [
      {
        version_id: "qver-uuid-301",
        version_number: 1,
        quotation_id: "550e8400-e29b-41d4-a716-446655440102",
        product_version_id: "pver-uuid-92",
        plan_code: "PLN-HLT-5M",
        plan_name: "Max Limit 5,000,000 THB / Year (IPD + OPD)",
        base_premium: 34200.0,
        tax_amount: 136.8,
        gross_premium: 34336.8,
        valid_until: "2026-11-12T23:59:59Z",
        status: "ACTIVE",
        created_at: "2026-10-12T14:20:00Z",
        created_by: "SYSTEM (Web Checkout)",
        risk_summary: {
          "Entry Age": "42 Years (ATTAINED_AGE)",
          "Height / Weight": "165 cm / 88 kg",
          BMI: "32.3 (Yellow Channel Refer Triggered)",
          Smoker: false,
          "Pre-existing": "Mild Hypertension (2024)",
        },
        installment_array: [{ cycle_number: 1, due_date: "2026-10-12", expected_amount: 34336.8, percentage: 100 }],
      },
    ],
  },
  {
    quotation_id: "550e8400-e29b-41d4-a716-446655440103",
    quotation_ref: "QT-2026-8710",
    customer_id: "cust-uuid-9003",
    customer_name: "AnanTech Logistics Co., Ltd.",
    customer_phone_masked: "02-XXX-8890",
    customer_phone_unmasked: "02-654-8890",
    customer_id_card_masked: "0-1055-XXXX-99-1",
    customer_id_card_unmasked: "0-1055-64012-99-1",
    data_completeness: "PARTIAL",
    channel_id: 2, // Direct
    insurer_name: "MSIG Insurance",
    lob_code: "CUSTOM",
    product_code: "MSIG-CUS-MARINE-01",
    product_name: "Bespoke Marine Cargo Open Cover",
    created_at: "2026-10-13T16:05:00Z",
    linked_application_id: null,
    linked_application_status: null,
    versions: [
      {
        version_id: "qver-uuid-401",
        version_number: 1,
        quotation_id: "550e8400-e29b-41d4-a716-446655440103",
        product_version_id: "pver-uuid-105",
        plan_code: "PLN-CUS-MARINE",
        plan_name: "Custom Risk Slip - ICC (A) All Risks",
        base_premium: 85000.0,
        tax_amount: 6290.0,
        gross_premium: 91290.0,
        valid_until: "2026-10-28T23:59:59Z",
        status: "DRAFT",
        created_at: "2026-10-13T16:05:00Z",
        created_by: "admin-uuid-012 (K. Siriwan - Ops)",
        risk_summary: {
          "Vessel Name": "MV Pacific Star V.204",
          "Port of Loading": "Laem Chabang, Thailand",
          "Port of Discharge": "Rotterdam, Netherlands",
          Commodity: "Precision Automotive Electronics",
          "URE Bypass": "100% Mandatory Referral (LOB = CUSTOM)",
        },
        installment_array: [{ cycle_number: 1, due_date: "2026-10-20", expected_amount: 91290.0, percentage: 100 }],
      },
    ],
  },
  {
    quotation_id: "550e8400-e29b-41d4-a716-446655440104",
    quotation_ref: "QT-2026-7902",
    customer_id: null,
    customer_name: "Guest Prospect (Quick Quote)",
    customer_phone_masked: "092-XXX-7712",
    customer_phone_unmasked: "092-331-7712",
    customer_id_card_masked: "Not Provided (v1 Lead)",
    customer_id_card_unmasked: "Not Provided (v1 Lead)",
    data_completeness: "GUEST",
    channel_id: 4, // Sub-Agent
    insurer_name: "Muang Thai Insurance",
    lob_code: "MOTOR",
    product_code: "MTI-MOT-2PLUS",
    product_name: "Motor 2+ Super Save",
    created_at: "2026-09-01T11:00:00Z",
    linked_application_id: null,
    linked_application_status: null,
    versions: [
      {
        version_id: "qver-uuid-501",
        version_number: 1,
        quotation_id: "550e8400-e29b-41d4-a716-446655440104",
        product_version_id: "pver-uuid-55",
        plan_code: "PLN-2PLUS-100K",
        plan_name: "2+ Sum Insured 100,000 THB (No Deductible)",
        base_premium: 6400.0,
        tax_amount: 473.6,
        gross_premium: 6873.6,
        valid_until: "2026-10-01T23:59:59Z",
        status: "EXPIRED",
        created_at: "2026-09-01T11:00:00Z",
        created_by: "subagent-uuid-882 (AGT-Gold-09)",
        risk_summary: {
          Brand: "Toyota",
          Model: "Hilux Revo 2.4 Entry",
          Year: 2019,
          "OIC Code": "3.20 (Pickup Commercial)",
          "Sum Insured": "100,000 THB",
        },
        installment_array: [{ cycle_number: 1, due_date: "2026-09-05", expected_amount: 6873.6, percentage: 100 }],
      },
    ],
  },
  {
    quotation_id: "550e8400-e29b-41d4-a716-446655440105",
    quotation_ref: "QT-2026-8845",
    customer_id: "cust-uuid-9005",
    customer_name: "Prasert Sukkasem",
    customer_phone_masked: "086-XXX-9001",
    customer_phone_unmasked: "086-512-9001",
    customer_id_card_masked: "1-5099-XXXX-12-4",
    customer_id_card_unmasked: "1-5099-00218-12-4",
    data_completeness: "VERIFIED",
    channel_id: 3, // Website
    insurer_name: "MSIG Insurance",
    lob_code: "TRAVEL",
    product_code: "MSIG-TRV-SCHENGEN",
    product_name: "Travel Easy Outbound (Visa Compliant)",
    created_at: "2026-10-14T08:30:00Z",
    linked_application_id: null,
    linked_application_status: null,
    versions: [
      {
        version_id: "qver-uuid-601",
        version_number: 1,
        quotation_id: "550e8400-e29b-41d4-a716-446655440105",
        product_version_id: "pver-uuid-31",
        plan_code: "PLN-TRV-ELITE",
        plan_name: "Schengen Elite (Medical 2,000,000 THB)",
        base_premium: 1450.0,
        tax_amount: 6.0,
        gross_premium: 1456.0,
        valid_until: "2026-10-21T23:59:59Z",
        status: "ACTIVE",
        created_at: "2026-10-14T08:30:00Z",
        created_by: "SYSTEM (Web Checkout)",
        risk_summary: {
          "Trip Type": "SINGLE_TRIP (14 Days)",
          Destinations: "FRA, CHE, ITA",
          "Travel Dates": "2026-11-01 to 2026-11-14",
          "Insured Members": "2 Persons (Group Travel Ratio Applied)",
        },
        installment_array: [{ cycle_number: 1, due_date: "2026-10-14", expected_amount: 1456.0, percentage: 100 }],
      },
    ],
  },
];

// ============================================================================
// HELPER mappings
// ============================================================================

const CHANNEL_MAP: Record<SalesChannelId, { label: string; badge: string }> = {
  1: { label: "Telesales", badge: "bg-purple-50 text-purple-700 border-purple-200" },
  2: { label: "Direct Sales", badge: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  3: { label: "Website (Online)", badge: "bg-sky-50 text-sky-700 border-sky-200" },
  4: { label: "Sub-Agent Portal", badge: "bg-amber-50 text-amber-700 border-amber-200" },
};

const STATUS_BADGE_MAP: Record<QuotationStatus, { label: string; style: string; icon: React.ReactNode }> = {
  ACTIVE: {
    label: "ACTIVE",
    style: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
  },
  DRAFT: {
    label: "DRAFT",
    style: "bg-amber-50 text-amber-700 border-amber-200",
    icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
  },
  EXPIRED: {
    label: "EXPIRED",
    style: "bg-rose-50 text-rose-700 border-rose-200",
    icon: <XCircle className="w-3.5 h-3.5 text-rose-600" />,
  },
};

const formatTHB = (val: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
  }).format(val);

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export function QuotationSearchPage() {
  const [quotations, setQuotations] = useState<QuotationRecord[]>(INITIAL_QUOTATIONS);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLob, setSelectedLob] = useState<string>("ALL");
  const [selectedInsurer, setSelectedInsurer] = useState<string>("ALL");
  const [selectedChannel, setSelectedChannel] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Selection & Drawer State
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(INITIAL_QUOTATIONS[0].quotation_id);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState<number>(0);

  // PDPA Unmasking Audit State (SDD 3.4.5.B.6)
  const [unmaskedCustomerIds, setUnmaskedCustomerIds] = useState<Record<string, boolean>>({});
  const [pdpaModalTarget, setPdpaModalTarget] = useState<QuotationRecord | null>(null);
  const [pdpaJustification, setPdpaJustification] = useState<string>("");

  // Toast Notification Banner
  const [actionBanner, setActionBanner] = useState<{
    type: "success" | "info" | "warning";
    message: string;
  } | null>(null);

  // Derived Filtered List
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      const latestVer = q.versions[0];
      const matchesQuery =
        searchQuery.trim() === "" ||
        q.quotation_ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.quotation_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.customer_phone_masked.includes(searchQuery);

      const matchesLob = selectedLob === "ALL" || q.lob_code === selectedLob;
      const matchesInsurer = selectedInsurer === "ALL" || q.insurer_name === selectedInsurer;
      const matchesChannel = selectedChannel === "ALL" || String(q.channel_id) === selectedChannel;
      const matchesStatus = selectedStatus === "ALL" || latestVer.status === selectedStatus;

      return matchesQuery && matchesLob && matchesInsurer && matchesChannel && matchesStatus;
    });
  }, [quotations, searchQuery, selectedLob, selectedInsurer, selectedChannel, selectedStatus]);

  // Active Quotation & Active Snapshot Version
  const activeQuotation = useMemo(
    () => quotations.find((q) => q.quotation_id === selectedQuotationId) || null,
    [quotations, selectedQuotationId],
  );

  const activeVersion = useMemo(() => {
    if (!activeQuotation) return null;
    return activeQuotation.versions[selectedVersionIndex] || activeQuotation.versions[0];
  }, [activeQuotation, selectedVersionIndex]);

  // Summary KPIs
  const kpiMetrics = useMemo(() => {
    let activeCount = 0;
    let draftCount = 0;
    let expiredCount = 0;
    let activePipelineValue = 0;

    quotations.forEach((q) => {
      const latest = q.versions[0];
      if (latest.status === "ACTIVE") {
        activeCount++;
        activePipelineValue += latest.gross_premium;
      } else if (latest.status === "DRAFT") {
        draftCount++;
      } else if (latest.status === "EXPIRED") {
        expiredCount++;
      }
    });

    return {
      total: quotations.length,
      activeCount,
      draftCount,
      expiredCount,
      activePipelineValue,
    };
  }, [quotations]);

  // Handlers
  const handleSelectQuotation = (q: QuotationRecord) => {
    setSelectedQuotationId(q.quotation_id);
    setSelectedVersionIndex(0);
  };

  // Lifecycle Action: Recalculate / Clone New Snapshot Version (LIF-01)
  const handleRecalculateNewVersion = (quote: QuotationRecord) => {
    const latest = quote.versions[0];
    const nextVerNum = latest.version_number + 1;
    const newValidUntil = new Date();
    newValidUntil.setDate(newValidUntil.getDate() + 30);

    const newSnapshot: QuotationVersionSnapshot = {
      ...latest,
      version_id: `qver-uuid-${Math.floor(1000 + Math.random() * 9000)}`,
      version_number: nextVerNum,
      status: "ACTIVE",
      valid_until: newValidUntil.toISOString(),
      created_at: new Date().toISOString(),
      created_by: "admin-uuid-current (Ops Console Re-Quote)",
    };

    setQuotations((prev) =>
      prev.map((item) =>
        item.quotation_id === quote.quotation_id
          ? {
              ...item,
              versions: [
                newSnapshot,
                ...item.versions.map((v) => ({
                  ...v,
                  status: "EXPIRED" as QuotationStatus,
                })),
              ],
            }
          : item,
      ),
    );
    setSelectedVersionIndex(0);
    setActionBanner({
      type: "success",
      message: `[LIF-01] Cloned immutable Quotation Snapshot v${nextVerNum} for ${quote.quotation_ref} via POST /api/v1/quotations/${quote.quotation_ref}/recalculate. Prior version capped.`,
    });
  };

  // Lifecycle Action: Convert to Application (SDD 3.3.8 POST /applications)
  const handleConvertToApplication = (quote: QuotationRecord) => {
    const latest = quote.versions[0];
    if (latest.status === "EXPIRED") {
      setActionBanner({
        type: "warning",
        message: `[422 QUOTE_EXPIRED] Cannot convert ${quote.quotation_ref} because valid_until has passed. Please generate a Re-Quote (New Version) first.`,
      });
      return;
    }

    const generatedAppId = `APP-2026-0${Math.floor(100 + Math.random() * 899)}`;
    const targetState = quote.lob_code === "CUSTOM" ? "PENDING_REVIEW" : "APPROVED_WAITING_PAYMENT";

    setQuotations((prev) =>
      prev.map((item) =>
        item.quotation_id === quote.quotation_id
          ? {
              ...item,
              linked_application_id: generatedAppId,
              linked_application_status: targetState,
            }
          : item,
      ),
    );

    setActionBanner({
      type: "info",
      message: `[SDD 3.3.8] Executed POST /applications for ${quote.quotation_ref}. Created ${generatedAppId} → Triaged by URE to ${targetState}.`,
    });
  };

  // PDPA Unmasking Execution (SDD 3.4.5.B.6)
  const handleConfirmPdpaUnmask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdpaModalTarget || !pdpaJustification.trim()) return;

    setUnmaskedCustomerIds((prev) => ({
      ...prev,
      [pdpaModalTarget.quotation_id]: true,
    }));

    setActionBanner({
      type: "info",
      message: `[PDPA Audit Logged] POST /admin/customers/${
        pdpaModalTarget.customer_id || "guest"
      }/unmask recorded to immutable audit_logs. Reason: "${pdpaJustification}"`,
    });

    setPdpaModalTarget(null);
    setPdpaJustification("");
  };

  return (
    <div className="space-y-4">
      {/* =====================================================================
          1. PAGE HEADER & ARCHITECTURAL CONTEXT BAR
      ===================================================================== */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">Quotation Search & Pricing Snapshot Explorer</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Inspect immutable quotation headers (<code className="text-slate-700 font-mono">quotations</code>) and SCD
            Type 2 pricing snapshots (<code className="text-slate-700 font-mono">quotation_versions</code>), verify
            installment math, or trigger re-quotes and application handoffs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedLob("ALL");
              setSelectedInsurer("ALL");
              setSelectedChannel("ALL");
              setSelectedStatus("ALL");
              setActionBanner(null);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            Reset Filters
          </button>
          <button
            type="button"
            onClick={() =>
              setActionBanner({
                type: "info",
                message: "Exported current filtered quotation snapshot view to CSV (Read-Replica Offloaded).",
              })
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>
        </div>
      </div>

      {/* =====================================================================
          2. REAL-TIME SYSTEM FEEDBACK BANNER
      ===================================================================== */}
      {actionBanner && (
        <div
          className={`px-4 py-2.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            actionBanner.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : actionBanner.type === "warning"
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{actionBanner.message}</span>
          </div>
          <button
            onClick={() => setActionBanner(null)}
            className="text-[11px] font-bold underline opacity-75 hover:opacity-100 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* =====================================================================
          3. KPI SUMMARY STRIP
      ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Quotations</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{kpiMetrics.total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across all 4 supported sales channels</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Active Quotes (Valid)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{kpiMetrics.activeCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Pipeline Gross:{" "}
            <span className="font-semibold text-slate-700">{formatTHB(kpiMetrics.activePipelineValue)}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Draft / Custom Rating</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-700 mt-1">{kpiMetrics.draftCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Pre-binding / Bespoke Specialty Lines</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Expired (Batch Capped)</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-rose-700 mt-1">{kpiMetrics.expiredCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Requires Re-Quote (<code className="font-mono">valid_until &lt; NOW()</code>)
          </div>
        </div>
      </div>

      {/* =====================================================================
          4. MULTI-CRITERIA FILTER BAR
      ===================================================================== */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Quote Ref (QT-2026...), Customer, Product, Phone..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500"
            />
          </div>

          {/* LOB Filter */}
          <div>
            <select
              value={selectedLob}
              onChange={(e) => setSelectedLob(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500"
            >
              <option value="ALL">All Lines of Business (LOB)</option>
              <option value="MOTOR">MOTOR (Voluntary)</option>
              <option value="CMI">CMI (Por Ror Bor)</option>
              <option value="HEALTH">HEALTH</option>
              <option value="TRAVEL">TRAVEL</option>
              <option value="PA">PA (Personal Accident)</option>
              <option value="FIRE">FIRE (Property)</option>
              <option value="LIFE">LIFE</option>
              <option value="CUSTOM">CUSTOM (Specialty Lines)</option>
            </select>
          </div>

          {/* Insurer Filter (Phase 1 Max 4 Insurers per SDD 2.1.4) */}
          <div>
            <select
              value={selectedInsurer}
              onChange={(e) => setSelectedInsurer(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500"
            >
              <option value="ALL">All Phase-1 Insurers</option>
              <option value="Viriyah Insurance">Viriyah Insurance</option>
              <option value="AIA Thailand">AIA Thailand</option>
              <option value="Muang Thai Insurance">Muang Thai Insurance</option>
              <option value="MSIG Insurance">MSIG Insurance</option>
            </select>
          </div>

          {/* Sales Channel Filter (SDD 4.2 sales_channels) */}
          <div>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500"
            >
              <option value="ALL">All Sales Channels</option>
              <option value="1">1 - Telesales</option>
              <option value="2">2 - Direct Sales</option>
              <option value="3">3 - Website (Online)</option>
              <option value="4">4 - Sub-Agent Portal</option>
            </select>
          </div>

          {/* Quotation State Filter (BRD 4.4.1) */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500"
            >
              <option value="ALL">All Quotation States</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="DRAFT">DRAFT</option>
              <option value="EXPIRED">EXPIRED</option>
            </select>
          </div>
        </div>
      </div>

      {/* =====================================================================
          5. MASTER-DETAIL WORKSPACE (TABLE LEFT + SNAPSHOT INSPECTOR RIGHT)
      ===================================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* LEFT PANE: QUOTATION RESULTS TABLE (7 Cols) */}
        <div className="xl:col-span-7 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-bold text-slate-800">Quotation Headers ({filteredQuotations.length})</span>
            </div>
            <span className="text-[11px] text-slate-500">
              Click any row to inspect SCD Type 2 versions & installment schedule
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3.5">Quotation Ref</th>
                  <th className="py-2.5 px-3">Customer / KYC</th>
                  <th className="py-2.5 px-3">LOB & Product</th>
                  <th className="py-2.5 px-3 text-right">Gross Premium</th>
                  <th className="py-2.5 px-3">Valid Until</th>
                  <th className="py-2.5 px-3.5">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredQuotations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      No quotation records match your current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredQuotations.map((q) => {
                    const latestVer = q.versions[0];
                    const isSelected = q.quotation_id === selectedQuotationId;
                    const statusMeta = STATUS_BADGE_MAP[latestVer.status];
                    const channelMeta = CHANNEL_MAP[q.channel_id];
                    const isUnmasked = !!unmaskedCustomerIds[q.quotation_id];

                    return (
                      <tr
                        key={q.quotation_id}
                        onClick={() => handleSelectQuotation(q)}
                        className={`cursor-pointer transition ${
                          isSelected ? "bg-blue-50/70 hover:bg-blue-50" : "hover:bg-slate-50"
                        }`}
                      >
                        {/* Quotation Ref + Version Count */}
                        <td className="py-3 px-3.5 align-top">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 font-mono">{q.quotation_ref}</span>
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 rounded">
                              v{latestVer.version_number}
                            </span>
                          </div>
                          <div className="mt-1">
                            <span
                              className={`inline-block px-1.5 py-0.2 text-[10px] font-medium border rounded ${channelMeta.badge}`}
                            >
                              {channelMeta.label}
                            </span>
                          </div>
                        </td>

                        {/* Customer / Golden Record Link */}
                        <td className="py-3 px-3 align-top">
                          <div className="font-semibold text-slate-800">{q.customer_name}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {isUnmasked ? q.customer_phone_unmasked : q.customer_phone_masked}
                          </div>
                          <div className="mt-1 flex items-center gap-1">
                            <span
                              className={`px-1.5 py-0.2 text-[10px] font-medium rounded ${
                                q.data_completeness === "VERIFIED"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : q.data_completeness === "PARTIAL"
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {q.data_completeness}
                            </span>
                          </div>
                        </td>

                        {/* Product & Insurer */}
                        <td className="py-3 px-3 align-top">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.2 text-[10px] font-bold bg-slate-800 text-white rounded">
                              {q.lob_code}
                            </span>
                            <span className="text-[11px] font-medium text-slate-600 truncate max-w-[140px]">
                              {q.insurer_name}
                            </span>
                          </div>
                          <div className="font-medium text-slate-800 mt-1">{q.product_name}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[190px]">{latestVer.plan_name}</div>
                        </td>

                        {/* Gross Premium */}
                        <td className="py-3 px-3 align-top text-right">
                          <div className="font-bold text-slate-900">{formatTHB(latestVer.gross_premium)}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {latestVer.installment_array.length > 1
                              ? `${latestVer.installment_array.length} Cycles`
                              : "Single Pay"}
                          </div>
                        </td>

                        {/* Valid Until */}
                        <td className="py-3 px-3 align-top">
                          <div className="text-slate-700 font-medium">
                            {new Date(latestVer.valid_until).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">23:59 ICT</div>
                        </td>

                        {/* Status + Linked App */}
                        <td className="py-3 px-3.5 align-top">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold border rounded-full ${statusMeta.style}`}
                          >
                            {statusMeta.icon}
                            {statusMeta.label}
                          </span>
                          {q.linked_application_id && (
                            <div className="mt-1 text-[10px] font-mono text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded inline-block">
                              → {q.linked_application_id}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT PANE: QUOTATION VERSION & MATH INSPECTOR (5 Cols) */}
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          {!activeQuotation || !activeVersion ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Select a quotation record on the left to inspect its version history and pricing breakdown.
            </div>
          ) : (
            <div>
              {/* Inspector Header */}
              <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 font-mono">{activeQuotation.quotation_ref}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold border rounded-full ${
                        STATUS_BADGE_MAP[activeVersion.status].style
                      }`}
                    >
                      {STATUS_BADGE_MAP[activeVersion.status].icon}
                      {activeVersion.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Header UUID: {activeQuotation.quotation_id}
                  </div>
                </div>

                {/* Version Selector Pills (SCD Type 2) */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
                  <Layers className="w-3.5 h-3.5 text-slate-400 ml-1 mr-0.5" />
                  {activeQuotation.versions.map((ver, idx) => (
                    <button
                      key={ver.version_id}
                      onClick={() => setSelectedVersionIndex(idx)}
                      className={`px-2 py-0.5 text-[11px] font-bold rounded transition ${
                        idx === selectedVersionIndex ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      v{ver.version_number}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* 1. Customer Identity & PDPA Shield */}
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>Customer Identity (Golden Record)</span>
                    </div>
                    {activeQuotation.customer_id && (
                      <button
                        type="button"
                        onClick={() => {
                          if (unmaskedCustomerIds[activeQuotation.quotation_id]) {
                            setUnmaskedCustomerIds((prev) => ({
                              ...prev,
                              [activeQuotation.quotation_id]: false,
                            }));
                          } else {
                            setPdpaModalTarget(activeQuotation);
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition"
                      >
                        {unmaskedCustomerIds[activeQuotation.quotation_id] ? (
                          <>
                            <EyeOff className="w-3 h-3" /> Mask PII
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" /> Reveal PII (PDPA Log)
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Legal Name</span>
                      <span className="font-semibold text-slate-800">{activeQuotation.customer_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Customer UUID</span>
                      <span className="font-mono text-[11px] text-slate-700">
                        {activeQuotation.customer_id || "NULL (Guest Quote)"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Phone Number</span>
                      <span className="font-mono text-slate-800">
                        {unmaskedCustomerIds[activeQuotation.quotation_id]
                          ? activeQuotation.customer_phone_unmasked
                          : activeQuotation.customer_phone_masked}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">National ID / Tax ID</span>
                      <span className="font-mono text-slate-800">
                        {unmaskedCustomerIds[activeQuotation.quotation_id]
                          ? activeQuotation.customer_id_card_unmasked
                          : activeQuotation.customer_id_card_masked}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Snapshot Pricing Breakdown (quotation_versions) */}
                <div className="border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">
                      Snapshot v{activeVersion.version_number} Pricing Breakdown
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">{activeVersion.version_id}</span>
                  </div>

                  <div className="text-xs text-slate-600 mb-2.5">
                    <span className="font-semibold text-slate-800">{activeVersion.plan_name}</span>{" "}
                    <span className="font-mono text-[11px] text-slate-400">({activeVersion.plan_code})</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 text-xs">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-semibold block">
                        Base (Net) Premium
                      </span>
                      <span className="font-semibold text-slate-800">{formatTHB(activeVersion.base_premium)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-semibold block">Tax & Stamp Duty</span>
                      <span className="font-semibold text-slate-800">{formatTHB(activeVersion.tax_amount)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-blue-600 font-bold block">Gross Payable</span>
                      <span className="font-bold text-blue-700">{formatTHB(activeVersion.gross_premium)}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Installment Schedule (LIF-03: 1st cycle absorbs decimals, rest .00) */}
                <div className="border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        Installment Schedule (<code className="font-mono">installment_array</code>)
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                      BRD LIF-03 Compliant
                    </span>
                  </div>

                  <div className="overflow-hidden border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="py-1.5 px-2.5">Cycle</th>
                          <th className="py-1.5 px-2.5">Due Date</th>
                          <th className="py-1.5 px-2.5">Share</th>
                          <th className="py-1.5 px-2.5 text-right">Expected Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {activeVersion.installment_array.map((cyc) => (
                          <tr key={cyc.cycle_number}>
                            <td className="py-1.5 px-2.5 font-semibold text-slate-800">Cycle #{cyc.cycle_number}</td>
                            <td className="py-1.5 px-2.5 text-slate-600">{cyc.due_date}</td>
                            <td className="py-1.5 px-2.5 text-slate-500">{cyc.percentage}%</td>
                            <td className="py-1.5 px-2.5 text-right font-mono font-semibold text-slate-900">
                              {formatTHB(cyc.expected_amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. Polymorphic Risk Attributes Summary */}
                <div className="border border-slate-200 rounded-lg p-3">
                  <div className="text-xs font-bold text-slate-800 mb-2">
                    Captured Risk Parameters ({activeQuotation.lob_code} Extension)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {Object.entries(activeVersion.risk_summary).map(([k, v]) => (
                      <div key={k} className="bg-slate-50 border border-slate-200/70 rounded px-2.5 py-1.5">
                        <span className="text-[10px] text-slate-400 block">{k}</span>
                        <span className="font-medium text-slate-800">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Audit & Validity Metadata */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span>
                      Created By (<code className="font-mono">created_by</code>):
                    </span>
                    <span className="font-medium text-slate-700">{activeVersion.created_by}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      Snapshot Created (<code className="font-mono">created_at</code>):
                    </span>
                    <span className="font-mono text-slate-700">{activeVersion.created_at}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      Valid Until (<code className="font-mono">valid_until</code>):
                    </span>
                    <span className="font-mono font-semibold text-slate-800">{activeVersion.valid_until}</span>
                  </div>
                </div>

                {/* 6. Lifecycle Action Buttons */}
                <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleRecalculateNewVersion(activeQuotation)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    Re-Quote / Clone New Version (v{activeQuotation.versions[0].version_number + 1})
                  </button>

                  <button
                    type="button"
                    onClick={() => handleConvertToApplication(activeQuotation)}
                    disabled={!!activeQuotation.linked_application_id}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition ${
                      activeQuotation.linked_application_id
                        ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
                    }`}
                  >
                    <ArrowRightCircle className="w-3.5 h-3.5" />
                    {activeQuotation.linked_application_id
                      ? `Linked to ${activeQuotation.linked_application_id}`
                      : "Convert to Application"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          6. PDPA UNMASKING AUDIT MODAL (SDD 3.4.5.B.6 / SEC-03)
      ===================================================================== */}
      {pdpaModalTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-5 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-600">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">PDPA PII Unmasking Audit Required</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Per SDD Section 3.4.5.B.6 (
                  <code className="font-mono">POST /admin/customers/&#123;uuid&#125;/unmask</code>), revealing encrypted
                  National ID and Phone Number writes an immutable <code className="font-mono">UNMASK</code> entry to{" "}
                  <code className="font-mono">audit_logs</code>.
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmPdpaUnmask} className="space-y-3">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                <div className="text-slate-500">Target Quotation / Customer:</div>
                <div className="font-bold text-slate-800 mt-0.5">
                  {pdpaModalTarget.quotation_ref} — {pdpaModalTarget.customer_name}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mandatory Operational Justification *
                </label>
                <textarea
                  required
                  rows={3}
                  value={pdpaJustification}
                  onChange={(e) => setPdpaJustification(e.target.value)}
                  placeholder="e.g., Customer called Telesales support to verify KYC details before converting quotation QT-2026-8841..."
                  className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPdpaModalTarget(null);
                    setPdpaJustification("");
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Log Audit & Reveal PII
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuotationSearchPage;
