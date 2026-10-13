import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileCheck2,
  FileSpreadsheet,
  Receipt,
  RefreshCw,
  Search,
  ShieldAlert,
} from "lucide-react";
import React, { useMemo, useState } from "react";

// --- Type Definitions aligned with PAS SDD & BRD Schemas ---

export type SettlementMode = "NET" | "GROSS";

export type TransactionType =
  | "PREMIUM_IN"
  | "REFUND_OUT"
  | "COMMISSION_IN"
  | "CLAWBACK"
  | "PAYOUT"
  | "OUTBOUND_INSURER_PAYOUT";

export interface AccountingKPIs {
  totalSoldPoliciesCount: number;
  totalMoneyKeptByBrokerThb: number;
  totalBrokerPayableThb: number;
  totalCommissionReceivableThb: number;
  totalOverdueAmountThb: number;
  totalWhtAccumulatedThb: number;
}

export interface BordereauPayableItem {
  id: string;
  policyNumber: string;
  referenceNumber: string;
  insurerId: string;
  insurerName: string;
  customerName: string;
  issueDate: string;
  monthlyPayDate: number; // e.g., 15th from broker_insurer_settings
  grossPremium: number;
  netPremium: number;
  stampDuty: number; // 0.4%
  vatAmount: number; // 7%
  brokerCommissionRate: number; // e.g. 18%
  brokerCommissionAmount: number;
  settlementMode: SettlementMode;
  payableToInsurer: number; // Net deduction or Gross remittance
  isReconciled: boolean;
  isPaidToInsurer: boolean;
  status: "PENDING_RECONCILIATION" | "STAGED" | "SETTLED";
}

export interface CommissionReceivableItem {
  id: string;
  policyNumber: string;
  insurerName: string;
  customerName: string;
  effectiveDate: string;
  grossPremium: number;
  commissionRate: number;
  grossCommissionAmount: number;
  whtDeducted: number; // 3% WHT
  netReceivableAmount: number;
  isCommissionReceived: boolean;
  receivedDate?: string;
  status: "PENDING" | "RECEIVED" | "DISPUTED";
}

export interface UnpaidInstallmentAgingItem {
  id: string;
  policyNumber: string;
  customerName: string;
  customerPhone: string;
  insurerName: string;
  cycleNumber: number;
  totalCycles: number;
  dueDate: string;
  daysOverdue: number;
  expectedAmount: number;
  paidAmount: number;
  status: "PENDING" | "OVERDUE" | "INSTALLMENT_EXHAUSTION_WARNING";
  channel: string;
}

export interface LedgerTransactionItem {
  transactionId: string;
  timestamp: string;
  policyNumber: string;
  gatewayRefId: string;
  transactionType: TransactionType;
  amount: number;
  transactionFee: number;
  netAmount: number;
  settlementMode: SettlementMode;
  actor: string;
}

// --- Sample Datasets ---

const MOCK_KPIS: AccountingKPIs = {
  totalSoldPoliciesCount: 1248,
  totalMoneyKeptByBrokerThb: 14850200.0,
  totalBrokerPayableThb: 11245600.5,
  totalCommissionReceivableThb: 1856400.0,
  totalOverdueAmountThb: 428750.0,
  totalWhtAccumulatedThb: 168450.25,
};

const MOCK_BORDEREAU: BordereauPayableItem[] = [
  {
    id: "pay-001",
    policyNumber: "V-MTR-2026-90412",
    referenceNumber: "TMP-2026-00192",
    insurerId: "INS-VIRIYAH",
    insurerName: "Viriyah Insurance",
    customerName: "Chaiwat Prasertphon",
    issueDate: "2026-10-02",
    monthlyPayDate: 15,
    grossPremium: 18500.0,
    netPremium: 17234.82,
    stampDuty: 68.94,
    vatAmount: 1196.24,
    brokerCommissionRate: 18.0,
    brokerCommissionAmount: 3102.27,
    settlementMode: "NET",
    payableToInsurer: 15397.73,
    isReconciled: true,
    isPaidToInsurer: false,
    status: "STAGED",
  },
  {
    id: "pay-002",
    policyNumber: "M-HLT-2026-11849",
    referenceNumber: "TMP-2026-00331",
    insurerId: "INS-MTL",
    insurerName: "Muang Thai Life & Health",
    customerName: "Siriporn Wannarat",
    issueDate: "2026-10-05",
    monthlyPayDate: 25,
    grossPremium: 24000.0,
    netPremium: 22359.77,
    stampDuty: 89.44,
    vatAmount: 1550.79,
    brokerCommissionRate: 15.0,
    brokerCommissionAmount: 3353.97,
    settlementMode: "GROSS",
    payableToInsurer: 24000.0,
    isReconciled: false,
    isPaidToInsurer: false,
    status: "PENDING_RECONCILIATION",
  },
  {
    id: "pay-003",
    policyNumber: "A-TRV-2026-55319",
    referenceNumber: "TMP-2026-00448",
    insurerId: "INS-ALLIANZ",
    insurerName: "Allianz Ayudhya",
    customerName: "Thanaporn Sirisuk",
    issueDate: "2026-10-08",
    monthlyPayDate: 15,
    grossPremium: 3200.0,
    netPremium: 2981.3,
    stampDuty: 11.93,
    vatAmount: 206.77,
    brokerCommissionRate: 20.0,
    brokerCommissionAmount: 596.26,
    settlementMode: "NET",
    payableToInsurer: 2603.74,
    isReconciled: true,
    isPaidToInsurer: true,
    status: "SETTLED",
  },
];

const MOCK_COMMISSION_RECEIVABLE: CommissionReceivableItem[] = [
  {
    id: "rec-001",
    policyNumber: "B-FIR-2026-44019",
    insurerName: "Bangkok Insurance",
    customerName: "Siam Retail Holdings Co., Ltd.",
    effectiveDate: "2026-09-28",
    grossPremium: 68500.0,
    commissionRate: 14.0,
    grossCommissionAmount: 9590.0,
    whtDeducted: 287.7, // 3% WHT
    netReceivableAmount: 9302.3,
    isCommissionReceived: false,
    status: "PENDING",
  },
  {
    id: "rec-002",
    policyNumber: "T-MTR-2026-88410",
    insurerName: "Thaisri Insurance",
    customerName: "Krit Pongpanich",
    effectiveDate: "2026-10-01",
    grossPremium: 12500.0,
    commissionRate: 18.0,
    grossCommissionAmount: 2250.0,
    whtDeducted: 67.5,
    netReceivableAmount: 2182.5,
    isCommissionReceived: true,
    receivedDate: "2026-10-10",
    status: "RECEIVED",
  },
];

const MOCK_UNPAID_AGING: UnpaidInstallmentAgingItem[] = [
  {
    id: "inst-001",
    policyNumber: "V-MTR-2026-77312",
    customerName: "Nipon Suksom",
    customerPhone: "081-992-XXXX",
    insurerName: "Viriyah Insurance",
    cycleNumber: 2,
    totalCycles: 6,
    dueDate: "2026-10-01",
    daysOverdue: 12,
    expectedAmount: 3250.0,
    paidAmount: 0.0,
    status: "OVERDUE",
    channel: "Telesales",
  },
  {
    id: "inst-002",
    policyNumber: "M-HLT-2026-90218",
    customerName: "Araya Wongsuwan",
    customerPhone: "089-441-XXXX",
    insurerName: "Muang Thai Life",
    cycleNumber: 3,
    totalCycles: 10,
    dueDate: "2026-09-22",
    daysOverdue: 21,
    expectedAmount: 2100.0,
    paidAmount: 0.0,
    status: "INSTALLMENT_EXHAUSTION_WARNING",
    channel: "Website Direct",
  },
];

const MOCK_LEDGER: LedgerTransactionItem[] = [
  {
    transactionId: "TX-20261012-001",
    timestamp: "2026-10-12 14:22:10",
    policyNumber: "V-MTR-2026-90412",
    gatewayRefId: "2C2P-899120491",
    transactionType: "PREMIUM_IN",
    amount: 18500.0,
    transactionFee: 370.0,
    netAmount: 18130.0,
    settlementMode: "NET",
    actor: "system:gateway",
  },
  {
    transactionId: "TX-20261011-084",
    timestamp: "2026-10-11 11:05:44",
    policyNumber: "V-MTR-2026-10294",
    gatewayRefId: "KBANK-REF-3392",
    transactionType: "REFUND_OUT",
    amount: -4500.0,
    transactionFee: 0.0,
    netAmount: -4500.0,
    settlementMode: "NET",
    actor: "admin:finance_maker",
  },
  {
    transactionId: "TX-20261010-022",
    timestamp: "2026-10-10 16:40:15",
    policyNumber: "V-MTR-2026-10294",
    gatewayRefId: "CLAW-AGT-8819",
    transactionType: "CLAWBACK",
    amount: -810.0,
    transactionFee: 0.0,
    netAmount: -810.0,
    settlementMode: "NET",
    actor: "system:clawback_worker",
  },
  {
    transactionId: "TX-20261009-119",
    timestamp: "2026-10-09 09:30:00",
    policyNumber: "A-TRV-2026-55319",
    gatewayRefId: "OMISE-CHG-9921",
    transactionType: "PREMIUM_IN",
    amount: 3200.0,
    transactionFee: 64.0,
    netAmount: 3136.0,
    settlementMode: "NET",
    actor: "system:gateway",
  },
];

export const OperationalAccountingReportPage: React.FC = () => {
  // Navigation tabs conforming to Section 7.7 and Screen 8.7.3/8.7.4
  const [activeTab, setActiveTab] = useState<"bordereau" | "commission_receivable" | "unpaid_aging" | "ledger">(
    "bordereau",
  );

  // Filter States
  const [selectedInsurer, setSelectedInsurer] = useState<string>("ALL");
  const [selectedSettlementMode, setSelectedSettlementMode] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-10");
  const [payDateFilter, setPayDateFilter] = useState<string>("ALL");

  // Local Table States for interactive operational toggles (FIN-05)
  const [bordereauData, setBordereauData] = useState<BordereauPayableItem[]>(MOCK_BORDEREAU);
  const [receivableData, setReceivableData] = useState<CommissionReceivableItem[]>(MOCK_COMMISSION_RECEIVABLE);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Toggle Reconciled Status (FIN-05 Maker Checkpoint)
  const handleToggleReconciliation = (id: string) => {
    setBordereauData((prev) => prev.map((row) => (row.id === id ? { ...row, isReconciled: !row.isReconciled } : row)));
  };

  // Toggle Insurer Paid Flag (FIN-05 Offline Reconciliation Checkbox)
  const handleTogglePaidToInsurer = (id: string) => {
    setBordereauData((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              isPaidToInsurer: !row.isPaidToInsurer,
              status: !row.isPaidToInsurer ? "SETTLED" : "STAGED",
            }
          : row,
      ),
    );
  };

  // Toggle Commission Received Flag
  const handleToggleCommissionReceived = (id: string) => {
    setReceivableData((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              isCommissionReceived: !row.isCommissionReceived,
              status: !row.isCommissionReceived ? "RECEIVED" : "PENDING",
              receivedDate: !row.isCommissionReceived ? "2026-10-13" : undefined,
            }
          : row,
      ),
    );
  };

  // Filtered Bordereau items
  const filteredBordereau = useMemo(() => {
    return bordereauData.filter((item) => {
      const matchInsurer = selectedInsurer === "ALL" || item.insurerId === selectedInsurer;
      const matchMode = selectedSettlementMode === "ALL" || item.settlementMode === selectedSettlementMode;
      const matchPayDate = payDateFilter === "ALL" || item.monthlyPayDate.toString() === payDateFilter;
      const matchSearch =
        item.policyNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase());
      return matchInsurer && matchMode && matchPayDate && matchSearch;
    });
  }, [bordereauData, selectedInsurer, selectedSettlementMode, payDateFilter, searchQuery]);

  // Export Trigger Handler (SDD 3.6.5 POST /admin/reports/generate)
  const handleTriggerReportGeneration = (format: "CSV" | "PDF" | "OIC_POR_LOR_1") => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert(
        `Job dispatched to async background Pub/Sub worker! Format: ${format}. Output will be encrypted and linked in S3 vault when ready.`,
      );
    }, 900);
  };

  return (
    // Note: "-mt-6 -mx-6 px-6 pt-0" removes top padding from the parent layout container
    <div className="-mt-6 -mx-6 px-6 pt-0 pb-12 bg-zinc-50 min-h-screen text-zinc-900 font-sans">
      {/* 1. Header Toolbar (Flush to top, zero extra container padding) */}
      <div className="bg-white border-b border-zinc-200 -mx-6 px-6 pt-5 pb-5 mb-6 sticky top-0 z-20 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                Finance & Accounting
              </span>
              <span className="text-xs text-zinc-400">|</span>
              <span className="text-xs font-mono text-zinc-500">PostgreSQL Read-Replica Sync: 100% OK</span>
            </div>
            <h1 className="text-xl font-bold text-zinc-900 mt-1">Operational Accounting & Reconciliation Report</h1>
            <p className="text-xs text-zinc-500">
              Double-entry settlement ledger, insurer bordereau remittances, and OIC/TRD compliance tracking.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center border border-zinc-300 rounded-md bg-white px-2.5 py-1.5 shadow-2xs">
              <Calendar className="w-4 h-4 text-zinc-400 mr-2" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-xs font-medium text-zinc-700 bg-transparent border-0 focus:outline-hidden"
              />
            </div>

            <button
              onClick={() => handleTriggerReportGeneration("CSV")}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-zinc-300 rounded-md bg-white text-xs font-medium text-zinc-700 hover:bg-zinc-50 shadow-2xs transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Export Bordereau (CSV)
            </button>

            <button
              onClick={() => handleTriggerReportGeneration("OIC_POR_LOR_1")}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-zinc-300 rounded-md bg-white text-xs font-medium text-zinc-700 hover:bg-zinc-50 shadow-2xs transition-colors"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
              OIC Por.Lor. 1 (ผ.ล. 1)
            </button>

            <button
              onClick={() => alert("Initiating Month-End Ledger Close staged ticket...")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white rounded-md text-xs font-medium hover:bg-zinc-800 shadow-2xs transition-colors"
            >
              <Receipt className="w-3.5 h-3.5" />
              Close Month-End Period
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top-Level Accounting KPI Summary Cards (Screen 8.7.4 & SDD 2.3.5) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-2xs">
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">
            Sold Policies Count
          </span>
          <div className="text-xl font-bold text-zinc-900 mt-1">
            {MOCK_KPIS.totalSoldPoliciesCount.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium inline-flex items-center mt-1">
            <ArrowUpRight className="w-3 h-3 mr-0.5" /> Active in Period
          </span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-2xs">
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">
            Money Kept by Broker
          </span>
          <div className="text-xl font-bold text-zinc-900 mt-1">
            ฿{MOCK_KPIS.totalMoneyKeptByBrokerThb.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-zinc-500 mt-1 block">Trust Account Liquidity</span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-2xs">
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">
            Broker Payable to Insurer
          </span>
          <div className="text-xl font-bold text-blue-600 mt-1">
            ฿{MOCK_KPIS.totalBrokerPayableThb.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-zinc-500 mt-1 block">Net/Gross Remittance</span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-2xs">
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">
            Commission Receivable
          </span>
          <div className="text-xl font-bold text-emerald-600 mt-1">
            ฿{MOCK_KPIS.totalCommissionReceivableThb.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-zinc-500 mt-1 block">Due from Direct Carriers</span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-2xs">
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">
            Total Overdue Amount
          </span>
          <div className="text-xl font-bold text-red-600 mt-1">
            ฿{MOCK_KPIS.totalOverdueAmountThb.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-red-500 font-medium inline-flex items-center mt-1">
            <ShieldAlert className="w-3 h-3 mr-0.5" /> Warning Queue
          </span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-2xs">
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">3% WHT Deducted</span>
          <div className="text-xl font-bold text-zinc-900 mt-1">
            ฿{MOCK_KPIS.totalWhtAccumulatedThb.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-zinc-500 mt-1 block">50 Tawi Certified Ledger</span>
        </div>
      </div>

      {/* 3. Section Navigation Tabs */}
      <div className="flex border-b border-zinc-200 mb-6 bg-white rounded-t-lg px-2 pt-2 shadow-2xs">
        <button
          onClick={() => setActiveTab("bordereau")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "bordereau"
              ? "border-zinc-900 text-zinc-900"
              : "border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Insurer Payable & Bordereau Reconciliation
        </button>

        <button
          onClick={() => setActiveTab("commission_receivable")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "commission_receivable"
              ? "border-zinc-900 text-zinc-900"
              : "border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          Commission Receivable Report (Scenario B)
        </button>

        <button
          onClick={() => setActiveTab("unpaid_aging")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "unpaid_aging"
              ? "border-zinc-900 text-zinc-900"
              : "border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          <Clock className="w-4 h-4" />
          Unpaid Policy & Installment Aging Queue
        </button>

        <button
          onClick={() => setActiveTab("ledger")}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "ledger"
              ? "border-zinc-900 text-zinc-900"
              : "border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          <Receipt className="w-4 h-4" />
          Double-Entry Transaction Ledger
        </button>
      </div>

      {/* 4. Filter & Query Control Bar */}
      <div className="bg-white border border-zinc-200 rounded-lg p-3.5 mb-6 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Universal Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search Policy / Ref / Customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs border border-zinc-300 rounded-md bg-white focus:outline-hidden focus:ring-1 focus:ring-zinc-900 w-60"
            />
          </div>

          {/* Insurer Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-500 font-medium">Insurer:</span>
            <select
              value={selectedInsurer}
              onChange={(e) => setSelectedInsurer(e.target.value)}
              className="text-xs border border-zinc-300 rounded-md bg-white px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
            >
              <option value="ALL">All Insurers</option>
              <option value="INS-VIRIYAH">Viriyah Insurance</option>
              <option value="INS-MTL">Muang Thai Life</option>
              <option value="INS-ALLIANZ">Allianz Ayudhya</option>
            </select>
          </div>

          {/* Settlement Mode Filter (BRD 7.4 Net vs Gross) */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-500 font-medium">Mode:</span>
            <select
              value={selectedSettlementMode}
              onChange={(e) => setSelectedSettlementMode(e.target.value)}
              className="text-xs border border-zinc-300 rounded-md bg-white px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
            >
              <option value="ALL">All Modes</option>
              <option value="NET">NET (Deduct Before)</option>
              <option value="GROSS">GROSS (Deduct After)</option>
            </select>
          </div>

          {/* Broker x Insurer Monthly Pay Date Filter */}
          {activeTab === "bordereau" && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-500 font-medium">Pay Date:</span>
              <select
                value={payDateFilter}
                onChange={(e) => setPayDateFilter(e.target.value)}
                className="text-xs border border-zinc-300 rounded-md bg-white px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
              >
                <option value="ALL">All Pay Dates</option>
                <option value="15">15th of Month</option>
                <option value="25">25th of Month</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedInsurer("ALL");
              setSelectedSettlementMode("ALL");
              setPayDateFilter("ALL");
            }}
            className="text-xs text-zinc-500 hover:text-zinc-800 flex items-center gap-1 px-2 py-1"
          >
            <RefreshCw className="w-3 h-3" /> Reset Filters
          </button>
        </div>
      </div>

      {/* 5. Tab Content Views */}

      {/* TAB 1: Insurer Payable & Bordereau Reconciliation */}
      {activeTab === "bordereau" && (
        <div className="space-y-4">
          <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-2xs">
            <div className="px-5 py-3 border-b border-zinc-200 bg-zinc-50/60 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-zinc-900">Insurer Payable Settlement Batch (EOM Bordereau)</h2>
                <p className="text-xs text-zinc-500">
                  Calculates exact remittances from broker trust account to insurers. Deducts broker commission on NET
                  settlement contracts.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-600 font-medium">Showing {filteredBordereau.length} records</span>
                <button
                  onClick={() => alert("Stage Settlement Request (Maker Ticket) created for Checker approval.")}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-2xs transition-colors"
                >
                  Stage Batch Settlement (Maker)
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100/70 border-b border-zinc-200 text-zinc-600 uppercase font-semibold text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Reconciled?</th>
                    <th className="py-3 px-4">Policy / Ref No.</th>
                    <th className="py-3 px-4">Insurer / Pay Date</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4 text-right">Gross Premium</th>
                    <th className="py-3 px-4 text-right">Stamp (0.4%)</th>
                    <th className="py-3 px-4 text-right">VAT (7%)</th>
                    <th className="py-3 px-4 text-center">Settlement Mode</th>
                    <th className="py-3 px-4 text-right">Retained Comm.</th>
                    <th className="py-3 px-4 text-right bg-blue-50/50 text-blue-900 font-bold">Payable to Insurer</th>
                    <th className="py-3 px-4 text-center">Paid to Insurer?</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white text-zinc-700">
                  {filteredBordereau.map((row) => (
                    <tr key={row.id} className="hover:bg-zinc-50/80 transition-colors">
                      {/* Checkbox: Maker Reconciled Flag */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={row.isReconciled}
                          onChange={() => handleToggleReconciliation(row.id)}
                          className="rounded border-zinc-300 text-zinc-900 focus:ring-0 cursor-pointer h-4 w-4"
                        />
                      </td>

                      <td className="py-3 px-4 font-mono font-medium text-zinc-900">
                        <div>{row.policyNumber}</div>
                        <div className="text-[10px] text-zinc-400">{row.referenceNumber}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-zinc-900">{row.insurerName}</div>
                        <div className="text-[10px] text-zinc-500">Cycle Pay Date: {row.monthlyPayDate}th</div>
                      </td>

                      <td className="py-3 px-4">{row.customerName}</td>

                      <td className="py-3 px-4 text-right font-mono">
                        ฿{row.grossPremium.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-zinc-500">฿{row.stampDuty.toFixed(2)}</td>

                      <td className="py-3 px-4 text-right font-mono text-zinc-500">฿{row.vatAmount.toFixed(2)}</td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                            row.settlementMode === "NET" ? "bg-purple-100 text-purple-800" : "bg-zinc-100 text-zinc-800"
                          }`}
                        >
                          {row.settlementMode}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-emerald-700 font-medium">
                        ฿{row.brokerCommissionAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        <span className="block text-[10px] text-zinc-400">({row.brokerCommissionRate}%)</span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-blue-700 bg-blue-50/30">
                        ฿{row.payableToInsurer.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>

                      {/* Manual Tracking Flag: is_paid_to_insurer (FIN-05) */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleTogglePaidToInsurer(row.id)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                            row.isPaidToInsurer
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                              : "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200"
                          }`}
                        >
                          {row.isPaidToInsurer ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Remitted
                            </>
                          ) : (
                            "Pending"
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium ${
                            row.status === "SETTLED"
                              ? "bg-emerald-100 text-emerald-800"
                              : row.status === "STAGED"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-zinc-100 text-zinc-700"
                          }`}
                        >
                          {row.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bordereau Batch Footer Summary */}
            <div className="bg-zinc-50 border-t border-zinc-200 px-6 py-3 flex flex-col md:flex-row md:items-center md:justify-between text-xs text-zinc-600 gap-3">
              <div className="flex items-center gap-6">
                <div>
                  <span className="font-semibold text-zinc-800">Total Selected Gross:</span>{" "}
                  <span className="font-mono">
                    ฿
                    {filteredBordereau
                      .reduce((acc, cur) => acc + cur.grossPremium, 0)
                      .toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-zinc-800">Total Retained Commission:</span>{" "}
                  <span className="font-mono text-emerald-700">
                    ฿
                    {filteredBordereau
                      .reduce((acc, cur) => acc + cur.brokerCommissionAmount, 0)
                      .toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-blue-900">Total Net Remittance:</span>{" "}
                  <span className="font-mono font-bold text-blue-700">
                    ฿
                    {filteredBordereau
                      .reduce((acc, cur) => acc + cur.payableToInsurer, 0)
                      .toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-zinc-500">
                OIC Trust Account Segregation: Verified against Rule BRD 7.4.3
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Commission Receivable Report (Insurer Collects / Scenario B) */}
      {activeTab === "commission_receivable" && (
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-2xs">
          <div className="px-5 py-3 border-b border-zinc-200 bg-zinc-50/60 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-zinc-900">
                Commission Receivable Ledger (Insurer Collects Direct)
              </h2>
              <p className="text-xs text-zinc-500">
                Monitors "Do we get commission from insurer yet?" with statutory 3% WHT deductions.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-100/70 border-b border-zinc-200 text-zinc-600 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Policy No</th>
                  <th className="py-3 px-4">Insurer</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Effective Date</th>
                  <th className="py-3 px-4 text-right">Gross Premium</th>
                  <th className="py-3 px-4 text-right">Gross Comm</th>
                  <th className="py-3 px-4 text-right">3% WHT Deducted</th>
                  <th className="py-3 px-4 text-right font-bold text-emerald-800">Net Receivable</th>
                  <th className="py-3 px-4 text-center">Comm. Received? (FIN-05)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white text-zinc-700">
                {receivableData.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-zinc-900">{row.policyNumber}</td>
                    <td className="py-3 px-4 font-medium text-zinc-800">{row.insurerName}</td>
                    <td className="py-3 px-4">{row.customerName}</td>
                    <td className="py-3 px-4 text-zinc-500">{row.effectiveDate}</td>
                    <td className="py-3 px-4 text-right font-mono">
                      ฿{row.grossPremium.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      ฿{row.grossCommissionAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      <span className="text-[10px] text-zinc-400 block">({row.commissionRate}%)</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-red-600">-฿{row.whtDeducted.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 bg-emerald-50/20">
                      ฿{row.netReceivableAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleCommissionReceived(row.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border ${
                          row.isCommissionReceived
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200"
                        }`}
                      >
                        {row.isCommissionReceived ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Received
                          </>
                        ) : (
                          "Tick Received"
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                          row.status === "RECEIVED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Unpaid Policy & Installment Aging Queue */}
      {activeTab === "unpaid_aging" && (
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-2xs">
          <div className="px-5 py-3 border-b border-zinc-200 bg-zinc-50/60 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Unpaid Policy Aging & Installment Warning Queue</h2>
              <p className="text-xs text-zinc-500">
                Receivables tracking (policy_installments). Prevents premature policy cancellation and monitors
                automated SMS/Email thresholds.
              </p>
            </div>
            <button
              onClick={() => alert("Batch reminder notifications sent to channel agents.")}
              className="px-3 py-1.5 bg-zinc-900 text-white rounded text-xs font-medium hover:bg-zinc-800"
            >
              Trigger Follow-up Notifications
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-100/70 border-b border-zinc-200 text-zinc-600 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Policy No</th>
                  <th className="py-3 px-4">Customer & Contact</th>
                  <th className="py-3 px-4">Insurer</th>
                  <th className="py-3 px-4 text-center">Cycle</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-center">Aging (Overdue)</th>
                  <th className="py-3 px-4 text-right">Expected Amount</th>
                  <th className="py-3 px-4 text-center">Sales Channel</th>
                  <th className="py-3 px-4 text-center">Alert Level</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white text-zinc-700">
                {MOCK_UNPAID_AGING.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-zinc-900">{row.policyNumber}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-zinc-900">{row.customerName}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">{row.customerPhone}</div>
                    </td>
                    <td className="py-3 px-4">{row.insurerName}</td>
                    <td className="py-3 px-4 text-center font-mono">
                      {row.cycleNumber} / {row.totalCycles}
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-600">{row.dueDate}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold text-red-600">+{row.daysOverdue} Days</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-zinc-900">
                      ฿{row.expectedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center text-zinc-600">{row.channel}</td>
                    <td className="py-3 px-4 text-center">
                      {row.status === "INSTALLMENT_EXHAUSTION_WARNING" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                          <ShieldAlert className="w-3 h-3 text-red-600" /> Exhaustion Warning
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                          Overdue Notice
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => alert(`Reviewing application installment flags for ${row.policyNumber}`)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
                      >
                        Details <ChevronRight className="w-3 h-3 ml-0.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Append-Only Double-Entry Transaction Ledger */}
      {activeTab === "ledger" && (
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-2xs">
          <div className="px-5 py-3 border-b border-zinc-200 bg-zinc-50/60 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Append-Only General Transactions Ledger</h2>
              <p className="text-xs text-zinc-500">
                Immutable audit of all inbound and outbound funds. In-place updates and deletions are physically blocked
                per BRD 6.6 & SDD 3.6.
              </p>
            </div>
            <span className="text-[11px] font-mono bg-zinc-100 px-2.5 py-1 rounded text-zinc-600 border border-zinc-200">
              Double-Entry Invariant: Balanced
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-100/70 border-b border-zinc-200 text-zinc-600 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Transaction ID / Timestamp</th>
                  <th className="py-3 px-4">Policy Number</th>
                  <th className="py-3 px-4">Gateway Reference</th>
                  <th className="py-3 px-4">Transaction Type</th>
                  <th className="py-3 px-4 text-center">Settlement Mode</th>
                  <th className="py-3 px-4 text-right">Gross Amount</th>
                  <th className="py-3 px-4 text-right">Fee Deduction</th>
                  <th className="py-3 px-4 text-right font-bold">Net Fiat Balance</th>
                  <th className="py-3 px-4 text-center">Audit Identity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white text-zinc-700">
                {MOCK_LEDGER.map((tx) => {
                  const isNegative = tx.amount < 0 || tx.transactionType === "CLAWBACK";
                  return (
                    <tr
                      key={tx.transactionId}
                      className={
                        tx.transactionType === "CLAWBACK"
                          ? "bg-red-50/40 hover:bg-red-50/70 transition-colors"
                          : "hover:bg-zinc-50 transition-colors"
                      }
                    >
                      <td className="py-3 px-4">
                        <div className="font-mono font-medium text-zinc-900">{tx.transactionId}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">{tx.timestamp}</div>
                      </td>

                      <td className="py-3 px-4 font-mono font-medium text-zinc-800">{tx.policyNumber}</td>

                      <td className="py-3 px-4 font-mono text-zinc-500">{tx.gatewayRefId}</td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.transactionType === "PREMIUM_IN"
                              ? "bg-emerald-100 text-emerald-800"
                              : tx.transactionType === "CLAWBACK"
                                ? "bg-red-100 text-red-800"
                                : tx.transactionType === "REFUND_OUT"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-zinc-100 text-zinc-800"
                          }`}
                        >
                          {tx.transactionType}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-[11px] text-zinc-600">{tx.settlementMode}</td>

                      <td
                        className={`py-3 px-4 text-right font-mono font-semibold ${
                          isNegative ? "text-red-600" : "text-zinc-900"
                        }`}
                      >
                        {isNegative ? "" : "+"}฿{tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-zinc-500">
                        {tx.transactionFee > 0 ? `-฿${tx.transactionFee.toFixed(2)}` : "฿0.00"}
                      </td>

                      <td
                        className={`py-3 px-4 text-right font-mono font-bold ${
                          isNegative ? "text-red-700 bg-red-50/50" : "text-emerald-700"
                        }`}
                      >
                        {isNegative ? "" : "+"}฿{tx.netAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-[10px] text-zinc-500">{tx.actor}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationalAccountingReportPage;
