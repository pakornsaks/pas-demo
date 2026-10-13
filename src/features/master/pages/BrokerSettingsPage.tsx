import React, { useState, useMemo } from "react";
import {
  Building2,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Sliders,
  DollarSign,
  FileCheck,
  History,
  Info,
  X,
  Layers,
} from "lucide-react";

// ============================================================================
// TYPES & DATA STRUCTURES (Aligned with BRD & SDD Section 4.3)
// ============================================================================

export type LOBCode =
  | "MOTOR"
  | "FIRE"
  | "HEALTH"
  | "PA"
  | "LIFE"
  | "TRAVEL"
  | "CUSTOM";

export interface LicenseDetails {
  licenseNumber: string;
  issuedBy: string; // Typically "OIC (Office of Insurance Commission Thailand)"
  issueDate: string;
  expiryDate: string;
  licenseType: "DIRECT_BROKER" | "REINSURANCE_BROKER" | "GENERAL_AND_LIFE";
  status: "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "SUSPENDED";
}

export interface BrokerInsurerSetting {
  insurerId: string;
  insurerName: string;
  monthlyPayDate: number; // 1-31 (BRD 8.1.3 & SDD 4.3)
  settlementMode: "NET" | "GROSS"; // SDD 3.6
}

export interface BrokerChannelSetting {
  channelId: number;
  channelName: "Telesales" | "Direct sale" | "Website" | "Sub agent";
  warningDaysBefore: number; // e.g., 3 days SMS/Email alert
  autoCancelOffset: number; // e.g., 0 for Telesales, 30 for Sub agent
}

export interface BrokerVersionHistory {
  versionId: string;
  versionNumber: number;
  effectiveStartDate: string;
  effectiveEndDate: string | null;
  changeReason: string;
  updatedBy: string;
  status: "ACTIVE" | "ARCHIVED";
}

export interface BrokerRecord {
  brokerId: string;
  brokerCode: string;
  brokerNameTh: string;
  brokerNameEn: string;
  partnerId: string | null;
  partnerName: string | null;
  currentVersionId: string;
  licenseDetails: LicenseDetails;
  authorizedLobs: LOBCode[];
  effectiveStartDate: string;
  effectiveEndDate: string | null;
  insurerSettings: BrokerInsurerSetting[];
  channelSettings: BrokerChannelSetting[];
  versionHistory: BrokerVersionHistory[];
}

// ============================================================================
// MOCK DATA (Reference SDD 4.3 Single Identity Architecture)
// ============================================================================

const INITIAL_BROKERS: BrokerRecord[] = [
  {
    brokerId: "b001-9singha-hq",
    brokerCode: "BRK-TH-001",
    brokerNameTh: "บริษัท นายหน้าประกันภัย 9 สิงห์ จำกัด (สำนักงานใหญ่)",
    brokerNameEn: "9 Singha Brokerage Co., Ltd. (Headquarters)",
    partnerId: "ptn-alpha-corp",
    partnerName: "Alpha Financial Holdings Group",
    currentVersionId: "bv-001-v3",
    licenseDetails: {
      licenseNumber: "ว00012/2565",
      issuedBy: "สำนักงาน คปภ. (OIC Thailand)",
      issueDate: "2023-01-15",
      expiryDate: "2027-01-14",
      licenseType: "GENERAL_AND_LIFE",
      status: "ACTIVE",
    },
    authorizedLobs: [
      "MOTOR",
      "FIRE",
      "HEALTH",
      "PA",
      "LIFE",
      "TRAVEL",
      "CUSTOM",
    ],
    effectiveStartDate: "2023-01-15T00:00:00Z",
    effectiveEndDate: null,
    insurerSettings: [
      {
        insurerId: "ins-001",
        insurerName: "วิริยะประกันภัย (Viriyah)",
        monthlyPayDate: 15,
        settlementMode: "NET",
      },
      {
        insurerId: "ins-002",
        insurerName: "เมืองไทยประกันชีวิต (Muang Thai Life)",
        monthlyPayDate: 25,
        settlementMode: "GROSS",
      },
      {
        insurerId: "ins-003",
        insurerName: "เอไอเอ ประเทศไทย (AIA)",
        monthlyPayDate: 20,
        settlementMode: "NET",
      },
      {
        insurerId: "ins-004",
        insurerName: "เอ็มเอสไอจี ประกันภัย (MSIG)",
        monthlyPayDate: 10,
        settlementMode: "NET",
      },
    ],
    channelSettings: [
      {
        channelId: 1,
        channelName: "Telesales",
        warningDaysBefore: 3,
        autoCancelOffset: 0,
      },
      {
        channelId: 2,
        channelName: "Direct sale",
        warningDaysBefore: 5,
        autoCancelOffset: 7,
      },
      {
        channelId: 3,
        channelName: "Website",
        warningDaysBefore: 2,
        autoCancelOffset: 3,
      },
      {
        channelId: 4,
        channelName: "Sub agent",
        warningDaysBefore: 5,
        autoCancelOffset: 30,
      },
    ],
    versionHistory: [
      {
        versionId: "bv-001-v3",
        versionNumber: 3,
        effectiveStartDate: "2025-01-01",
        effectiveEndDate: null,
        changeReason:
          "Added Custom Specialty Lines authorization (OIC Phase 2)",
        updatedBy: "Pakornsak S. (Maker)",
        status: "ACTIVE",
      },
      {
        versionId: "bv-001-v2",
        versionNumber: 2,
        effectiveStartDate: "2024-01-15",
        effectiveEndDate: "2024-12-31",
        changeReason: "Annual OIC License Renewal & Remittance Day Adjustment",
        updatedBy: "Sompong T.",
        status: "ARCHIVED",
      },
      {
        versionId: "bv-001-v1",
        versionNumber: 1,
        effectiveStartDate: "2023-01-15",
        effectiveEndDate: "2024-01-14",
        changeReason: "Initial System Creation & Entity Provisioning",
        updatedBy: "System Migrator",
        status: "ARCHIVED",
      },
    ],
  },
  {
    brokerId: "b002-siam-auto",
    brokerCode: "BRK-TH-042",
    brokerNameTh: "สยาม ออโต้ โบรคเกอร์ จำกัด",
    brokerNameEn: "Siam Auto Brokerage Co., Ltd.",
    partnerId: "ptn-siam-motors",
    partnerName: "Siam Motor Leasing Group",
    currentVersionId: "bv-042-v1",
    licenseDetails: {
      licenseNumber: "ว00889/2566",
      issuedBy: "สำนักงาน คปภ. (OIC Thailand)",
      issueDate: "2024-04-01",
      expiryDate: "2026-11-15", // Expiring relatively soon
      licenseType: "DIRECT_BROKER",
      status: "EXPIRING_SOON",
    },
    authorizedLobs: ["MOTOR", "PA"],
    effectiveStartDate: "2024-04-01T00:00:00Z",
    effectiveEndDate: null,
    insurerSettings: [
      {
        insurerId: "ins-001",
        insurerName: "วิริยะประกันภัย (Viriyah)",
        monthlyPayDate: 20,
        settlementMode: "NET",
      },
      {
        insurerId: "ins-004",
        insurerName: "เอ็มเอสไอจี ประกันภัย (MSIG)",
        monthlyPayDate: 15,
        settlementMode: "NET",
      },
    ],
    channelSettings: [
      {
        channelId: 1,
        channelName: "Telesales",
        warningDaysBefore: 3,
        autoCancelOffset: 0,
      },
      {
        channelId: 4,
        channelName: "Sub agent",
        warningDaysBefore: 7,
        autoCancelOffset: 45,
      },
    ],
    versionHistory: [
      {
        versionId: "bv-042-v1",
        versionNumber: 1,
        effectiveStartDate: "2024-04-01",
        effectiveEndDate: null,
        changeReason: "New Entity Onboarding for Auto Dealership Affiliates",
        updatedBy: "Nattaporn W.",
        status: "ACTIVE",
      },
    ],
  },
  {
    brokerId: "b003-thai-health-net",
    brokerCode: "BRK-TH-099",
    brokerNameTh: "ไทย เฮลท์แคร์ อินชัวร์รันส์ โบรคเกอร์",
    brokerNameEn: "Thai Healthcare Insurance Broker Co., Ltd.",
    partnerId: null,
    partnerName: null,
    currentVersionId: "bv-099-v2",
    licenseDetails: {
      licenseNumber: "ว01234/2564",
      issuedBy: "สำนักงาน คปภ. (OIC Thailand)",
      issueDate: "2022-06-10",
      expiryDate: "2026-06-09",
      licenseType: "GENERAL_AND_LIFE",
      status: "EXPIRED",
    },
    authorizedLobs: ["HEALTH", "LIFE", "PA"],
    effectiveStartDate: "2024-06-10T00:00:00Z",
    effectiveEndDate: null,
    insurerSettings: [
      {
        insurerId: "ins-002",
        insurerName: "เมืองไทยประกันชีวิต (Muang Thai Life)",
        monthlyPayDate: 28,
        settlementMode: "GROSS",
      },
      {
        insurerId: "ins-003",
        insurerName: "เอไอเอ ประเทศไทย (AIA)",
        monthlyPayDate: 25,
        settlementMode: "GROSS",
      },
    ],
    channelSettings: [
      {
        channelId: 1,
        channelName: "Telesales",
        warningDaysBefore: 5,
        autoCancelOffset: 1,
      },
      {
        channelId: 3,
        channelName: "Website",
        warningDaysBefore: 3,
        autoCancelOffset: 3,
      },
    ],
    versionHistory: [
      {
        versionId: "bv-099-v2",
        versionNumber: 2,
        effectiveStartDate: "2024-06-10",
        effectiveEndDate: null,
        changeReason: "Updated Corporate Bank Details for Bordereau Payout",
        updatedBy: "Admin Checker",
        status: "ACTIVE",
      },
    ],
  },
];

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export const BrokerDirectoryPage: React.FC = () => {
  const [brokers, setBrokers] = useState<BrokerRecord[]>(INITIAL_BROKERS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedLob, setSelectedLob] = useState<string>("ALL");
  const [activeBroker, setActiveBroker] = useState<BrokerRecord | null>(null);
  const [drawerTab, setDrawerTab] = useState<
    "profile" | "lobs" | "insurers" | "channels" | "versions"
  >("profile");
  const [isNewBrokerModalOpen, setIsNewBrokerModalOpen] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Form State for Staging / Maker-Checker New Entity
  const [newBrokerForm, setNewBrokerForm] = useState({
    brokerCode: "",
    brokerNameTh: "",
    brokerNameEn: "",
    partnerName: "",
    licenseNumber: "",
    licenseType: "GENERAL_AND_LIFE" as LicenseDetails["licenseType"],
    issueDate: "",
    expiryDate: "",
    authorizedLobs: ["MOTOR"] as LOBCode[],
  });

  // Calculate Metrics for Header Summary
  const metrics = useMemo(() => {
    const total = brokers.length;
    const active = brokers.filter(
      (b) => b.licenseDetails.status === "ACTIVE",
    ).length;
    const expiringSoon = brokers.filter(
      (b) => b.licenseDetails.status === "EXPIRING_SOON",
    ).length;
    const expiredOrSuspended = brokers.filter(
      (b) =>
        b.licenseDetails.status === "EXPIRED" ||
        b.licenseDetails.status === "SUSPENDED",
    ).length;
    return { total, active, expiringSoon, expiredOrSuspended };
  }, [brokers]);

  // Filtered List
  const filteredBrokers = useMemo(() => {
    return brokers.filter((broker) => {
      const matchesSearch =
        broker.brokerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        broker.brokerNameTh.toLowerCase().includes(searchTerm.toLowerCase()) ||
        broker.brokerNameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        broker.licenseDetails.licenseNumber
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        selectedStatus === "ALL" ||
        broker.licenseDetails.status === selectedStatus;

      const matchesLob =
        selectedLob === "ALL" ||
        broker.authorizedLobs.includes(selectedLob as LOBCode);

      return matchesSearch && matchesStatus && matchesLob;
    });
  }, [brokers, searchTerm, selectedStatus, selectedLob]);

  // Handle Lob Toggle for New Broker Modal
  const toggleLobSelection = (lob: LOBCode) => {
    if (newBrokerForm.authorizedLobs.includes(lob)) {
      setNewBrokerForm({
        ...newBrokerForm,
        authorizedLobs: newBrokerForm.authorizedLobs.filter((l) => l !== lob),
      });
    } else {
      setNewBrokerForm({
        ...newBrokerForm,
        authorizedLobs: [...newBrokerForm.authorizedLobs, lob],
      });
    }
  };

  // Submit Maker-Checker New Broker Staging Request
  const handleStageBrokerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: BrokerRecord = {
      brokerId: `b-${Date.now()}`,
      brokerCode: newBrokerForm.brokerCode,
      brokerNameTh: newBrokerForm.brokerNameTh,
      brokerNameEn: newBrokerForm.brokerNameEn,
      partnerId: newBrokerForm.partnerName ? `ptn-${Date.now()}` : null,
      partnerName: newBrokerForm.partnerName || null,
      currentVersionId: `bv-${Date.now()}-v1`,
      licenseDetails: {
        licenseNumber: newBrokerForm.licenseNumber,
        issuedBy: "สำนักงาน คปภ. (OIC Thailand)",
        issueDate: newBrokerForm.issueDate || "2026-01-01",
        expiryDate: newBrokerForm.expiryDate || "2028-01-01",
        licenseType: newBrokerForm.licenseType,
        status: "ACTIVE",
      },
      authorizedLobs: newBrokerForm.authorizedLobs,
      effectiveStartDate: new Date().toISOString(),
      effectiveEndDate: null,
      insurerSettings: [
        {
          insurerId: "ins-001",
          insurerName: "วิริยะประกันภัย (Viriyah)",
          monthlyPayDate: 15,
          settlementMode: "NET",
        },
      ],
      channelSettings: [
        {
          channelId: 1,
          channelName: "Telesales",
          warningDaysBefore: 3,
          autoCancelOffset: 0,
        },
        {
          channelId: 2,
          channelName: "Direct sale",
          warningDaysBefore: 5,
          autoCancelOffset: 7,
        },
        {
          channelId: 3,
          channelName: "Website",
          warningDaysBefore: 3,
          autoCancelOffset: 3,
        },
        {
          channelId: 4,
          channelName: "Sub agent",
          warningDaysBefore: 5,
          autoCancelOffset: 30,
        },
      ],
      versionHistory: [
        {
          versionId: `bv-${Date.now()}-v1`,
          versionNumber: 1,
          effectiveStartDate: new Date().toISOString().split("T")[0],
          effectiveEndDate: null,
          changeReason: "Draft Entity Created (Pending Checker Approval)",
          updatedBy: "Current User (Maker)",
          status: "ACTIVE",
        },
      ],
    };

    setBrokers([newRecord, ...brokers]);
    setIsNewBrokerModalOpen(false);
    setActionSuccessMsg(
      `Broker [${newBrokerForm.brokerCode}] staged successfully in Draft state (Ticket AR-BRK-${Date.now().toString().slice(-4)} generated for Checker verification).`,
    );
    setTimeout(() => setActionSuccessMsg(null), 6000);
  };

  const getStatusBadge = (status: LicenseDetails["status"]) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active Licensed
          </span>
        );
      case "EXPIRING_SOON":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            Expiring Soon (&lt; 90d)
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-500" />
            License Expired
          </span>
        );
      case "SUSPENDED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 border border-zinc-300">
            Suspended by OIC
          </span>
        );
    }
  };

  return (
    // "no padding on top container": Use negative top and horizontal margins to cancel out the AdminLayout <main className="p-6"> padding on top
    <div className="-mt-6 -mx-6 bg-zinc-50 min-h-screen text-zinc-800 font-sans antialiased pb-12">
      {/* ==================================================================== */}
      {/* TOP HEADER CONTAINER (Flush to layout header, light themed)          */}
      {/* ==================================================================== */}
      <div className="bg-white border-b border-zinc-200 px-8 py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-blue-600 uppercase">
              <ShieldCheck className="w-4 h-4" />
              <span>OIC Regulatory Registry & Master Entities</span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mt-0.5">
              Broker Directory & Licensing
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Centralized repository for licensed corporate intermediaries, OIC
              license renewals, Authorized LOBs, and SCD Type 2 version audit
              trails.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsNewBrokerModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Broker</span>
            </button>
          </div>
        </div>

        {/* Global Alert Notification Banner */}
        {actionSuccessMsg && (
          <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{actionSuccessMsg}</span>
            </div>
            <button
              onClick={() => setActionSuccessMsg(null)}
              className="text-emerald-600 hover:text-emerald-900 ml-4 font-bold"
            >
              &times;
            </button>
          </div>
        )}

        {/* ================================================================== */}
        {/* METRICS CARDS SECTION                                              */}
        {/* ================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500">
                Total Registered Brokers
              </p>
              <p className="text-2xl font-bold text-zinc-900 mt-1">
                {metrics.total}
              </p>
              <span className="text-[11px] text-zinc-400 font-medium">
                Headless PAS Directory
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Building2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500">
                Active & Compliant
              </p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {metrics.active}
              </p>
              <span className="text-[11px] text-emerald-600 font-medium">
                Verified by OIC
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500">
                OIC Expiring Soon (&lt;90d)
              </p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {metrics.expiringSoon}
              </p>
              <span className="text-[11px] text-amber-600 font-medium">
                Action Required
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500">
                Expired / Blocked
              </p>
              <p className="text-2xl font-bold text-rose-600 mt-1">
                {metrics.expiredOrSuspended}
              </p>
              <span className="text-[11px] text-rose-500 font-medium">
                Checkout Sales Halted
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* FILTER & SEARCH TOOLBAR                                              */}
      {/* ==================================================================== */}
      <div className="px-8 mt-6">
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Broker Code, Corporate Name (TH/EN), OIC License #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-zinc-800 placeholder-zinc-400"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-zinc-500 shrink-0">
                Status:
              </span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="py-2 px-3 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Licensed</option>
                <option value="EXPIRING_SOON">Expiring Soon</option>
                <option value="EXPIRED">Expired</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>

            {/* LOB Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-zinc-500 shrink-0">
                LOB:
              </span>
              <select
                value={selectedLob}
                onChange={(e) => setSelectedLob(e.target.value)}
                className="py-2 px-3 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="ALL">All Lines of Business</option>
                <option value="MOTOR">Motor (Voluntary & CMI)</option>
                <option value="HEALTH">Health</option>
                <option value="LIFE">Life</option>
                <option value="FIRE">Fire & Property</option>
                <option value="PA">Personal Accident (PA)</option>
                <option value="TRAVEL">Travel</option>
                <option value="CUSTOM">Specialty / Custom</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-zinc-500 self-center">
            Showing{" "}
            <strong className="text-zinc-800">{filteredBrokers.length}</strong>{" "}
            of <strong className="text-zinc-800">{brokers.length}</strong>{" "}
            brokers
          </div>
        </div>

        {/* ================================================================== */}
        {/* BROKERS TABLE                                                      */}
        {/* ================================================================== */}
        <div className="mt-4 bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200 text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Broker Code & Identity</th>
                  <th className="py-3 px-4">Corporate Entity Name</th>
                  <th className="py-3 px-4">OIC License No. & Type</th>
                  <th className="py-3 px-4">License Expiry & SLA</th>
                  <th className="py-3 px-4">Authorized LOBs</th>
                  <th className="py-3 px-4">SCD v2 State</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-xs">
                {filteredBrokers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-400">
                      <div className="flex flex-col items-center justify-center">
                        <Building2 className="w-8 h-8 text-zinc-300 mb-2" />
                        <p className="text-sm font-medium text-zinc-600">
                          No broker entities match your filter criteria.
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Try clearing the search query or changing status
                          filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBrokers.map((broker) => (
                    <tr
                      key={broker.brokerId}
                      className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                      onClick={() => {
                        setActiveBroker(broker);
                        setDrawerTab("profile");
                      }}
                    >
                      {/* Broker Code */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center font-bold text-zinc-700 text-xs shrink-0 group-hover:bg-blue-100 group-hover:text-blue-700">
                            {broker.brokerCode.slice(-3)}
                          </div>
                          <div>
                            <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                              {broker.brokerCode}
                              {broker.partnerName && (
                                <span className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.2 rounded font-normal">
                                  Affiliated
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-400">
                              ID: {broker.brokerId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Corporate Name */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-zinc-900 truncate">
                          {broker.brokerNameTh}
                        </div>
                        <div className="text-[11px] text-zinc-500 truncate">
                          {broker.brokerNameEn}
                        </div>
                        {broker.partnerName && (
                          <div className="text-[10px] text-blue-600 flex items-center gap-1 mt-0.5">
                            <span>Partner:</span> {broker.partnerName}
                          </div>
                        )}
                      </td>

                      {/* OIC License Details */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-medium text-zinc-800">
                          {broker.licenseDetails.licenseNumber}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {broker.licenseDetails.licenseType ===
                          "GENERAL_AND_LIFE"
                            ? "General & Life Ins."
                            : "Direct Brokerage"}
                        </div>
                      </td>

                      {/* Expiry & Status */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          {getStatusBadge(broker.licenseDetails.status)}
                          <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-zinc-400" />
                            Valid until {broker.licenseDetails.expiryDate}
                          </span>
                        </div>
                      </td>

                      {/* Authorized LOBs */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {broker.authorizedLobs.map((lob) => (
                            <span
                              key={lob}
                              className="text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200"
                            >
                              {lob}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* SCD Version State */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-zinc-100 text-zinc-600">
                          <History className="w-3 h-3 text-zinc-400" />v
                          {broker.versionHistory[0].versionNumber}.0
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">
                          Since {broker.versionHistory[0].effectiveStartDate}
                        </div>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setActiveBroker(broker);
                              setDrawerTab("profile");
                            }}
                            className="p-1.5 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="View Configuration"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* BROKER DETAILS & CONFIGURATION SLIDE-OVER DRAWER                     */}
      {/* ==================================================================== */}
      {activeBroker && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-zinc-900/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-150">
          <div className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col border-l border-zinc-200 overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-zinc-200 bg-zinc-50 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                    {activeBroker.brokerCode}
                  </span>
                  {getStatusBadge(activeBroker.licenseDetails.status)}
                </div>
                <h2 className="text-lg font-bold text-zinc-900 mt-1">
                  {activeBroker.brokerNameTh}
                </h2>
                <p className="text-xs text-zinc-500">
                  {activeBroker.brokerNameEn}
                </p>
              </div>
              <button
                onClick={() => setActiveBroker(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-zinc-200 px-6 gap-6 bg-white shrink-0 text-xs font-medium">
              <button
                onClick={() => setDrawerTab("profile")}
                className={`py-3.5 border-b-2 flex items-center gap-1.5 transition-colors ${
                  drawerTab === "profile"
                    ? "border-blue-600 text-blue-600 font-semibold"
                    : "border-transparent text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                License & Identity
              </button>

              <button
                onClick={() => setDrawerTab("lobs")}
                className={`py-3.5 border-b-2 flex items-center gap-1.5 transition-colors ${
                  drawerTab === "lobs"
                    ? "border-blue-600 text-blue-600 font-semibold"
                    : "border-transparent text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <Layers className="w-4 h-4" />
                Authorized LOBs ({activeBroker.authorizedLobs.length})
              </button>

              <button
                onClick={() => setDrawerTab("insurers")}
                className={`py-3.5 border-b-2 flex items-center gap-1.5 transition-colors ${
                  drawerTab === "insurers"
                    ? "border-blue-600 text-blue-600 font-semibold"
                    : "border-transparent text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <DollarSign className="w-4 h-4" />
                Insurer Settlement Rules
              </button>

              <button
                onClick={() => setDrawerTab("channels")}
                className={`py-3.5 border-b-2 flex items-center gap-1.5 transition-colors ${
                  drawerTab === "channels"
                    ? "border-blue-600 text-blue-600 font-semibold"
                    : "border-transparent text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <Sliders className="w-4 h-4" />
                Sales Channel SLAs
              </button>

              <button
                onClick={() => setDrawerTab("versions")}
                className={`py-3.5 border-b-2 flex items-center gap-1.5 transition-colors ${
                  drawerTab === "versions"
                    ? "border-blue-600 text-blue-600 font-semibold"
                    : "border-transparent text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <History className="w-4 h-4" />
                SCD v2 Audits
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* TAB 1: Profile & OIC License */}
              {drawerTab === "profile" && (
                <div className="space-y-6">
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                    <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-blue-600" />
                      Official OIC License Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-zinc-500">
                          OIC License Number:
                        </span>
                        <p className="font-mono font-semibold text-zinc-900 mt-0.5">
                          {activeBroker.licenseDetails.licenseNumber}
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-500">
                          License Regulator:
                        </span>
                        <p className="font-medium text-zinc-900 mt-0.5">
                          {activeBroker.licenseDetails.issuedBy}
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-500">Issue Date:</span>
                        <p className="font-medium text-zinc-900 mt-0.5">
                          {activeBroker.licenseDetails.issueDate}
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-500">Expiry Date:</span>
                        <p className="font-semibold text-zinc-900 mt-0.5 flex items-center gap-1">
                          {activeBroker.licenseDetails.expiryDate}
                          {activeBroker.licenseDetails.status ===
                            "EXPIRING_SOON" && (
                            <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1 rounded">
                              RENEWAL DUE
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-500">Scope Type:</span>
                        <p className="font-medium text-zinc-900 mt-0.5">
                          {activeBroker.licenseDetails.licenseType.replace(
                            /_/g,
                            " ",
                          )}
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-500">PDPA Data Anchor:</span>
                        <p className="font-mono text-[11px] text-zinc-600 mt-0.5">
                          UUID: {activeBroker.brokerId}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Corporate Linkage */}
                  <div className="bg-white p-4 rounded-xl border border-zinc-200">
                    <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      Corporate & Partner Hierarchy
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-zinc-500">
                          Parent Corporate Partner:
                        </span>
                        <p className="font-medium text-zinc-900 mt-0.5">
                          {activeBroker.partnerName ||
                            "Independent Entity (No Corporate Parent)"}
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-500">Partner Link ID:</span>
                        <p className="font-mono text-[11px] text-zinc-600 mt-0.5">
                          {activeBroker.partnerId || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Authorized LOBs */}
              {drawerTab === "lobs" && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      Policies created for unauthorized lines of business are
                      rejected by the core Underwriting Rules Engine (URE)
                      during checkout validation.
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {(
                      [
                        {
                          id: "MOTOR",
                          label:
                            "Motor Insurance (Voluntary & CMI Por Ror Bor)",
                        },
                        {
                          id: "HEALTH",
                          label: "Health Insurance (Individual & Group)",
                        },
                        {
                          id: "LIFE",
                          label: "Life Insurance (Whole Life & Term)",
                        },
                        {
                          id: "FIRE",
                          label:
                            "Fire & Property All Risks (Residential/Commercial)",
                        },
                        { id: "PA", label: "Personal Accident (PA)" },
                        {
                          id: "TRAVEL",
                          label:
                            "Travel Insurance (Single & Annual Multi-Trip)",
                        },
                        {
                          id: "CUSTOM",
                          label: "Specialty / Custom Commercial Lines",
                        },
                      ] as { id: LOBCode; label: string }[]
                    ).map((lob) => {
                      const isAuth = activeBroker.authorizedLobs.includes(
                        lob.id,
                      );
                      return (
                        <div
                          key={lob.id}
                          className={`p-3.5 rounded-xl border flex items-center justify-between ${
                            isAuth
                              ? "bg-white border-emerald-300 shadow-sm"
                              : "bg-zinc-50 border-zinc-200 opacity-60"
                          }`}
                        >
                          <div>
                            <span className="font-bold text-zinc-900 block">
                              {lob.id}
                            </span>
                            <span className="text-[11px] text-zinc-500">
                              {lob.label}
                            </span>
                          </div>
                          {isAuth ? (
                            <span className="p-1 rounded-full bg-emerald-100 text-emerald-700">
                              <CheckCircle2 className="w-4 h-4" />
                            </span>
                          ) : (
                            <span className="p-1 rounded-full bg-zinc-200 text-zinc-400">
                              <XCircle className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: Insurer Settlement Rules (broker_insurer_settings) */}
              {drawerTab === "insurers" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                        Broker Payable Remittance Schedules
                      </h3>
                      <p className="text-[11px] text-zinc-500">
                        Mapped to{" "}
                        <code className="font-mono text-blue-600">
                          broker_insurer_settings
                        </code>{" "}
                        (BRD 8.1.3 Tab A)
                      </p>
                    </div>
                  </div>

                  <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-50 border-b border-zinc-200 font-semibold text-zinc-600 text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3">Insurance Carrier</th>
                          <th className="py-2.5 px-3">Monthly Pay Date</th>
                          <th className="py-2.5 px-3">Settlement Mode</th>
                          <th className="py-2.5 px-3 text-right">
                            EOM Remittance
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200">
                        {activeBroker.insurerSettings.map((setting) => (
                          <tr
                            key={setting.insurerId}
                            className="hover:bg-zinc-50"
                          >
                            <td className="py-3 px-3 font-medium text-zinc-900">
                              {setting.insurerName}
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-semibold text-zinc-800">
                                Every {setting.monthlyPayDate}th
                              </span>{" "}
                              of the month
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  setting.settlementMode === "NET"
                                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                                    : "bg-purple-50 text-purple-700 border border-purple-200"
                                }`}
                              >
                                {setting.settlementMode} (
                                {setting.settlementMode === "NET"
                                  ? "Deduct Before"
                                  : "Deduct After"}
                                )
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right text-zinc-500 font-mono text-[11px]">
                              Bordereau Auto
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: Sales Channel SLAs (broker_channel_settings) */}
              {drawerTab === "channels" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                      Channel SLA & Auto-Cancellation Configuration
                    </h3>
                    <p className="text-[11px] text-zinc-500">
                      Mapped to{" "}
                      <code className="font-mono text-blue-600">
                        broker_channel_settings
                      </code>{" "}
                      (BRD 8.1.3 Tab B)
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeBroker.channelSettings.map((channel) => (
                      <div
                        key={channel.channelId}
                        className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 text-xs"
                      >
                        <div className="flex items-center justify-between font-bold text-zinc-900 text-sm mb-3">
                          <span>{channel.channelName}</span>
                          <span className="text-[10px] font-mono font-normal bg-zinc-200 px-1.5 py-0.5 rounded text-zinc-700">
                            Channel #{channel.channelId}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-zinc-500">
                              Warning Days Before Due:
                            </span>
                            <span className="font-semibold text-zinc-900">
                              {channel.warningDaysBefore} Days
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500">
                              Auto-Cancel Offset:
                            </span>
                            <span className="font-semibold text-zinc-900">
                              {channel.autoCancelOffset === 0
                                ? "0 Days (Cancels on Effective Date)"
                                : `+${channel.autoCancelOffset} Days`}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: SCD Type 2 Audit Trail */}
              {drawerTab === "versions" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                      Immutable Historical Versions (SCD Type 2)
                    </h3>
                    <p className="text-[11px] text-zinc-500">
                      Snapshots frozen in{" "}
                      <code className="font-mono text-blue-600">
                        broker_versions
                      </code>{" "}
                      table to safeguard 10-year OIC compliance.
                    </p>
                  </div>

                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200">
                    {activeBroker.versionHistory.map((hist) => (
                      <div key={hist.versionId} className="relative">
                        <div
                          className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 bg-white ${
                            hist.status === "ACTIVE"
                              ? "border-emerald-500"
                              : "border-zinc-400"
                          }`}
                        />
                        <div className="bg-zinc-50 p-3.5 rounded-lg border border-zinc-200 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-zinc-900">
                              Version {hist.versionNumber}.0
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                hist.status === "ACTIVE"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-zinc-200 text-zinc-600"
                              }`}
                            >
                              {hist.status}
                            </span>
                          </div>
                          <p className="text-zinc-700 font-medium mt-1">
                            {hist.changeReason}
                          </p>
                          <div className="mt-2 pt-2 border-t border-zinc-200/60 flex items-center justify-between text-[11px] text-zinc-400">
                            <span>Author: {hist.updatedBy}</span>
                            <span>Effective: {hist.effectiveStartDate}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Audited for OIC Por.Lor. 1 Reporting</span>
              </div>
              <button
                onClick={() => {
                  setActionSuccessMsg(
                    `Cloned draft version staged for Maker-Checker review on Broker [${activeBroker.brokerCode}].`,
                  );
                  setActiveBroker(null);
                  setTimeout(() => setActionSuccessMsg(null), 6000);
                }}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
              >
                Create New Draft Version (Maker)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: REGISTER NEW BROKER (MAKER-CHECKER STAGING)                  */}
      {/* ==================================================================== */}
      {isNewBrokerModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">
                  Stage New Broker for Licensing Approval
                </h3>
                <p className="text-xs text-zinc-500">
                  Initializes permanent{" "}
                  <code className="font-mono text-blue-600">brokers</code>{" "}
                  anchor & version 1 snapshot.
                </p>
              </div>
              <button
                onClick={() => setIsNewBrokerModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleStageBrokerSubmit}
              className="p-6 space-y-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">
                    Broker Code (Permanent Key)*
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BRK-TH-105"
                    value={newBrokerForm.brokerCode}
                    onChange={(e) =>
                      setNewBrokerForm({
                        ...newBrokerForm,
                        brokerCode: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-1">
                    Corporate Partner (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Siam Commercial Bank"
                    value={newBrokerForm.partnerName}
                    onChange={(e) =>
                      setNewBrokerForm({
                        ...newBrokerForm,
                        partnerName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">
                  Broker Corporate Name (Thai)*
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. บริษัท นายหน้าประกันภัย สยามพัฒนา จำกัด"
                  value={newBrokerForm.brokerNameTh}
                  onChange={(e) =>
                    setNewBrokerForm({
                      ...newBrokerForm,
                      brokerNameTh: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">
                  Broker Corporate Name (English)*
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Siam Pattana Insurance Broker Co., Ltd."
                  value={newBrokerForm.brokerNameEn}
                  onChange={(e) =>
                    setNewBrokerForm({
                      ...newBrokerForm,
                      brokerNameEn: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2 border-t border-zinc-200">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">
                    OIC License No.*
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ว00999/2567"
                    value={newBrokerForm.licenseNumber}
                    onChange={(e) =>
                      setNewBrokerForm({
                        ...newBrokerForm,
                        licenseNumber: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-1">
                    Issue Date*
                  </label>
                  <input
                    type="date"
                    required
                    value={newBrokerForm.issueDate}
                    onChange={(e) =>
                      setNewBrokerForm({
                        ...newBrokerForm,
                        issueDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-1">
                    Expiry Date*
                  </label>
                  <input
                    type="date"
                    required
                    value={newBrokerForm.expiryDate}
                    onChange={(e) =>
                      setNewBrokerForm({
                        ...newBrokerForm,
                        expiryDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* LOB Selector */}
              <div>
                <label className="block font-medium text-zinc-700 mb-1.5">
                  Authorized Lines of Business (LOBs)*
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(
                    [
                      "MOTOR",
                      "FIRE",
                      "HEALTH",
                      "PA",
                      "LIFE",
                      "TRAVEL",
                      "CUSTOM",
                    ] as LOBCode[]
                  ).map((lob) => {
                    const checked = newBrokerForm.authorizedLobs.includes(lob);
                    return (
                      <button
                        type="button"
                        key={lob}
                        onClick={() => toggleLobSelection(lob)}
                        className={`py-1.5 px-2.5 rounded-lg border text-center font-medium transition-all ${
                          checked
                            ? "bg-blue-50 border-blue-400 text-blue-700 font-bold"
                            : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                        }`}
                      >
                        {lob}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Maker-Checker Policy:</strong> Creating this entity
                  will save it as a{" "}
                  <span className="font-mono">PENDING_APPROVAL</span> draft in{" "}
                  <code className="font-mono">approval_requests</code>. A
                  designated Compliance Checker must authorize this record
                  before sales APIs unlock.
                </span>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-zinc-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewBrokerModalOpen(false)}
                  className="px-4 py-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Submit for Approval (Maker)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrokerDirectoryPage;
