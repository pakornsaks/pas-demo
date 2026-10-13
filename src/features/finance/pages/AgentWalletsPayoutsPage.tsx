import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Building,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileText,
  Filter,
  PlusCircle,
  RotateCcw,
  Search,
  ShieldAlert,
  Wallet,
  X,
} from "lucide-react";
import React, { useMemo, useState } from "react";

// ==========================================
// TypeScript Interfaces (PAS SDD 3.6.5 & 4.7)
// ==========================================

export type TransactionType = "COMMISSION_IN" | "CLAWBACK" | "PAYOUT";
export type CommissionStatus = "AVAILABLE" | "PENDING" | "SETTLED";
export type SettlementMode = "NET" | "GROSS";

export interface AgentSummary {
  agent_id: string;
  agent_code: string;
  agent_name: string;
  commission_tier: "Bronze" | "Silver" | "Gold" | "Platinum";
  oic_license_no: string;
  tax_id: string;
  settlement_bank: string;
  account_number_masked: string;
}

export interface WalletBalances {
  pending_balance: number;
  available_balance: number;
  settled_balance_ytd: number;
  negative_debt_balance: number;
}

export interface CommissionLedgerLine {
  transaction_id: string;
  policy_id: string;
  policy_number: string;
  transaction_type: TransactionType;
  frozen_commission_rate: number;
  gross_commission_amount: number;
  wht_tax_amount: number; // Mandatory 3% WHT deduction
  net_commission_amount: number;
  settlement_mode: SettlementMode;
  status: CommissionStatus;
  timestamp: string;
  notes?: string;
}

export interface PayoutRequestForm {
  payout_amount: string;
  finance_notes: string;
  agent_tax_invoice_number: string;
}

// ==========================================
// Mock Data (Thai Insurance Broker Context)
// ==========================================

const MOCK_AGENTS: AgentSummary[] = [
  {
    agent_id: "AGT-9918",
    agent_code: "SUB-BKK-001",
    agent_name: "Somchai Prasert (Siam Brokerage Network)",
    commission_tier: "Gold",
    oic_license_no: "OIC-6601-9921",
    tax_id: "1-1004-XXXXX-88-1",
    settlement_bank: "Kasikornbank (KBANK)",
    account_number_masked: "042-X-XXXXX-9",
  },
  {
    agent_id: "AGT-8820",
    agent_code: "SUB-CNX-042",
    agent_name: "Apinya Wongsuwan (Lanna Insurance Care)",
    commission_tier: "Silver",
    oic_license_no: "OIC-6503-4412",
    tax_id: "3-5099-XXXXX-12-0",
    settlement_bank: "Siam Commercial Bank (SCB)",
    account_number_masked: "118-X-XXXXX-4",
  },
];

const INITIAL_BALANCES: Record<string, WalletBalances> = {
  "AGT-9918": {
    pending_balance: 15450.0,
    available_balance: 48500.0,
    settled_balance_ytd: 242000.0,
    negative_debt_balance: 0.0,
  },
  "AGT-8820": {
    pending_balance: 2400.0,
    available_balance: 0.0,
    settled_balance_ytd: 98000.0,
    negative_debt_balance: 3450.0, // Sub-zero clawback state requiring Debit Note
  },
};

const INITIAL_LEDGER: CommissionLedgerLine[] = [
  {
    transaction_id: "tx-uuid-9901",
    policy_id: "pol-vir-001",
    policy_number: "VIR-2026-99182",
    transaction_type: "COMMISSION_IN",
    frozen_commission_rate: 18.0,
    gross_commission_amount: 3600.0,
    wht_tax_amount: -108.0,
    net_commission_amount: 3492.0,
    settlement_mode: "NET",
    status: "AVAILABLE",
    timestamp: "2026-10-12 14:32:00",
    notes: "Motor Type 1 Clearance (Cycle 1 Paid)",
  },
  {
    transaction_id: "tx-uuid-9902",
    policy_id: "pol-msig-044",
    policy_number: "MSIG-2026-00441",
    transaction_type: "COMMISSION_IN",
    frozen_commission_rate: 15.0,
    gross_commission_amount: 1500.0,
    wht_tax_amount: -45.0,
    net_commission_amount: 1455.0,
    settlement_mode: "GROSS",
    status: "PENDING",
    timestamp: "2026-10-11 11:20:15",
    notes: "30-Day Free-Look Grace Period Active",
  },
  {
    transaction_id: "tx-uuid-9903",
    policy_id: "pol-aia-109",
    policy_number: "AIA-2026-10029",
    transaction_type: "CLAWBACK",
    frozen_commission_rate: 18.0,
    gross_commission_amount: -1200.0,
    wht_tax_amount: 36.0,
    net_commission_amount: -1164.0,
    settlement_mode: "NET",
    status: "AVAILABLE",
    timestamp: "2026-10-10 09:15:00",
    notes: "Customer Mid-Term Cancellation (Pro-rata Refund)",
  },
  {
    transaction_id: "tx-uuid-9904",
    policy_id: "pol-vir-881",
    policy_number: "VIR-2026-88129",
    transaction_type: "COMMISSION_IN",
    frozen_commission_rate: 18.0,
    gross_commission_amount: 4500.0,
    wht_tax_amount: -135.0,
    net_commission_amount: 4365.0,
    settlement_mode: "NET",
    status: "AVAILABLE",
    timestamp: "2026-10-08 16:40:00",
    notes: "Commercial Fleet Policy Conversion",
  },
  {
    transaction_id: "tx-uuid-9800",
    policy_id: "pol-payout-sep",
    policy_number: "BATCH-SEP-2026",
    transaction_type: "PAYOUT",
    frozen_commission_rate: 0.0,
    gross_commission_amount: 0.0,
    wht_tax_amount: 0.0,
    net_commission_amount: -45000.0,
    settlement_mode: "NET",
    status: "SETTLED",
    timestamp: "2026-09-30 18:00:00",
    notes: "September EOM Commission Bank Wire (KBANK-9982)",
  },
];

export const AgentWalletsPayoutsPage: React.FC = () => {
  // State Management
  const [selectedAgentId, setSelectedAgentId] = useState<string>("AGT-9918");
  const [ledgerLines, _setLedgerLines] = useState<CommissionLedgerLine[]>(INITIAL_LEDGER);
  const [balances, setBalances] = useState<Record<string, WalletBalances>>(INITIAL_BALANCES);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  // Modals
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState<boolean>(false);
  const [isDebitRecoveryOpen, setIsDebitRecoveryOpen] = useState<boolean>(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Form States
  const [payoutForm, setPayoutForm] = useState<PayoutRequestForm>({
    payout_amount: "",
    finance_notes: "",
    agent_tax_invoice_number: "",
  });

  const [recoveryAmount, setRecoveryAmount] = useState<string>("");
  const [recoveryBankRef, setRecoveryBankRef] = useState<string>("");

  const currentAgent = useMemo(
    () => MOCK_AGENTS.find((a) => a.agent_id === selectedAgentId) || MOCK_AGENTS[0],
    [selectedAgentId],
  );

  const currentBalance = balances[currentAgent.agent_id] || {
    pending_balance: 0,
    available_balance: 0,
    settled_balance_ytd: 0,
    negative_debt_balance: 0,
  };

  // Filtered Ledger Lines
  const filteredLedger = useMemo(() => {
    return ledgerLines.filter((item) => {
      const matchesSearch =
        item.policy_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      const matchesType = typeFilter === "ALL" || item.transaction_type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [ledgerLines, searchTerm, statusFilter, typeFilter]);

  // Handle Stage Payout (Maker Action)
  const handleStagePayout = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(payoutForm.payout_amount);

    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid payout amount.");
      return;
    }

    if (amount > currentBalance.available_balance) {
      alert("Payout amount cannot exceed current Available Balance.");
      return;
    }

    // PAS Core Specification: Stages request into approval_requests table (status: PENDING_APPROVAL)
    setActionSuccessMessage(
      `Maker Request staged successfully for ฿${amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
      })}. Payout routed to Maker-Checker Inbox for Finance Manager authorization.`,
    );

    setIsPayoutModalOpen(false);
    setPayoutForm({ payout_amount: "", finance_notes: "", agent_tax_invoice_number: "" });

    setTimeout(() => setActionSuccessMessage(null), 6000);
  };

  // Handle Debt Recovery / Negative Balance Reset
  const handleRecordDebtRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(recoveryAmount);
    if (isNaN(amount) || amount <= 0) return;

    setBalances((prev) => ({
      ...prev,
      [currentAgent.agent_id]: {
        ...prev[currentAgent.agent_id],
        negative_debt_balance: Math.max(0, prev[currentAgent.agent_id].negative_debt_balance - amount),
      },
    }));

    setActionSuccessMessage(
      `Debt recovery payment of ฿${amount.toLocaleString("en-US")} booked against Debit Note. General ledger updated.`,
    );
    setIsDebitRecoveryOpen(false);
    setRecoveryAmount("");
    setRecoveryBankRef("");

    setTimeout(() => setActionSuccessMessage(null), 6000);
  };

  return (
    <div className="pt-0 space-y-6 text-zinc-900 bg-zinc-50 min-h-full">
      {/* Top Banner Alert (Maker-Checker / Debt Notice) */}
      {actionSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center space-x-3 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 text-sm font-semibold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {currentBalance.negative_debt_balance > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-900 px-4 py-3 rounded-lg flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3 text-sm">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <span className="font-semibold">Negative Wallet Balance Warning (BRD 7.4.4): </span>
              Agent holds an unrecovered clawback liability of{" "}
              <span className="font-bold">
                ฿
                {currentBalance.negative_debt_balance.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </span>
              . An official Broker Debit Note should be generated.
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsDebitRecoveryOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm transition-colors"
            >
              Recover Debt
            </button>
          </div>
        </div>
      )}

      {/* Header Context Section */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 shrink-0">
              <Wallet className="w-6 h-6 text-zinc-800" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-zinc-900">Agent Commission Ledger & Payouts</h1>
                <span className="text-xs bg-zinc-100 text-zinc-700 font-medium px-2 py-0.5 rounded border border-zinc-200">
                  Sub-Broker Ledger
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Real-time double-entry commission snapshotting, 3% statutory WHT deductions, and Maker-Checker
                settlements.
              </p>
            </div>
          </div>

          {/* Agent Picker & Global Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-1.5 shadow-sm">
              <span className="text-xs text-zinc-500 font-medium mr-2">Agent:</span>
              <select
                aria-label="Agent"
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-zinc-800 focus:outline-none cursor-pointer"
              >
                {MOCK_AGENTS.map((agent) => (
                  <option key={agent.agent_id} value={agent.agent_id}>
                    {agent.agent_code} - {agent.agent_name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsPayoutModalOpen(true)}
              disabled={currentBalance.available_balance <= 0}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all ${
                currentBalance.available_balance > 0
                  ? "bg-zinc-900 hover:bg-zinc-800 text-white cursor-pointer"
                  : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Stage Payout (Maker)</span>
            </button>

            <button
              onClick={() => alert("Exporting consolidated TRD 50-Tawi & Ledger CSV...")}
              className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-700 rounded-lg text-xs font-medium shadow-sm transition-colors"
            >
              <Download className="w-4 h-4 text-zinc-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Selected Agent Quick Details */}
        <div className="mt-4 pt-4 border-t border-zinc-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-zinc-400 block font-medium">OIC License No.</span>
            <span className="text-zinc-800 font-semibold">{currentAgent.oic_license_no}</span>
          </div>
          <div>
            <span className="text-zinc-400 block font-medium">Commission Tier</span>
            <span className="inline-block px-2 py-0.5 mt-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              {currentAgent.commission_tier} Tier
            </span>
          </div>
          <div>
            <span className="text-zinc-400 block font-medium">Tax Identification (PDPA Masked)</span>
            <span className="text-zinc-800 font-mono font-medium">{currentAgent.tax_id}</span>
          </div>
          <div>
            <span className="text-zinc-400 block font-medium">Settlement Target</span>
            <span className="text-zinc-800 truncate block">
              {currentAgent.settlement_bank} ({currentAgent.account_number_masked})
            </span>
          </div>
        </div>
      </div>

      {/* KPI Balances Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Liquidity */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Available for Payout</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-zinc-900 tracking-tight">
              ฿
              {currentBalance.available_balance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1 flex items-center space-x-1">
              <span>Ready for Maker Staging</span>
            </div>
          </div>
        </div>

        {/* Pending Clearance (Free Look Period) */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Clearance</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-zinc-900 tracking-tight">
              ฿
              {currentBalance.pending_balance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">Free-look inspection window</div>
          </div>
        </div>

        {/* Settled YTD */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Settled YTD (Wire Paid)</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-zinc-900 tracking-tight">
              ฿
              {currentBalance.settled_balance_ytd.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">Disbursed via bank transfer</div>
          </div>
        </div>

        {/* Clawback / Negative Debt */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Negative Debt Liability</span>
            <span className="p-2 bg-red-50 text-red-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div
              className={`text-2xl font-bold tracking-tight ${currentBalance.negative_debt_balance > 0 ? "text-red-600" : "text-zinc-900"}`}
            >
              ฿
              {currentBalance.negative_debt_balance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">Outstanding clawback invoice</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Policy No, Tx ID, or Notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <div className="flex items-center space-x-1.5 text-xs text-zinc-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Type:</span>
            <select
              aria-label="Filter by Transaction Type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-xs text-zinc-800 focus:outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="COMMISSION_IN">Commission In</option>
              <option value="CLAWBACK">Clawback</option>
              <option value="PAYOUT">Payout</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-zinc-500 ml-2">
            <span>Status:</span>
            <select
              aria-label="Filter by Commission Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-xs text-zinc-800 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="PENDING">Pending</option>
              <option value="SETTLED">Settled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Primary Financial Ledger Table */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-zinc-200 bg-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-zinc-500" />
            <h2 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
              Immutable Sub-Agent Double-Entry Ledger
            </h2>
          </div>
          <span className="text-[11px] text-zinc-400">Showing {filteredLedger.length} transaction rows</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4">Timestamp & Tx ID</th>
                <th className="py-3 px-4">Policy Ref</th>
                <th className="py-3 px-4">Transaction Type</th>
                <th className="py-3 px-4 text-center">Frozen Rate</th>
                <th className="py-3 px-4 text-right">Gross (THB)</th>
                <th className="py-3 px-4 text-right">WHT (3%)</th>
                <th className="py-3 px-4 text-right">Net Commission</th>
                <th className="py-3 px-4 text-center">Mode</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-sans">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-zinc-400">
                    No ledger entries match current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLedger.map((line) => {
                  const isNegative = line.net_commission_amount < 0;
                  const isClawback = line.transaction_type === "CLAWBACK";
                  const isPayout = line.transaction_type === "PAYOUT";

                  return (
                    <tr
                      key={line.transaction_id}
                      className={`hover:bg-zinc-50/60 transition-colors ${isClawback ? "bg-red-50/30" : ""}`}
                    >
                      {/* Timestamp & Tx ID */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-zinc-800">{line.timestamp}</div>
                        <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{line.transaction_id}</div>
                      </td>

                      {/* Policy Ref */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-900">{line.policy_number}</div>
                        {line.notes && (
                          <div className="text-[10px] text-zinc-500 truncate max-w-xs mt-0.5">{line.notes}</div>
                        )}
                      </td>

                      {/* Transaction Type */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide border ${
                            isClawback
                              ? "bg-red-50 text-red-700 border-red-200"
                              : isPayout
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {isClawback && <ArrowDownLeft className="w-3 h-3 mr-0.5" />}
                          {isPayout && <ArrowUpRight className="w-3 h-3 mr-0.5" />}
                          {!isClawback && !isPayout && <CheckCircle2 className="w-3 h-3 mr-0.5" />}
                          <span>{line.transaction_type}</span>
                        </span>
                      </td>

                      {/* Frozen Commission Rate */}
                      <td className="py-3 px-4 text-center font-mono text-zinc-700">
                        {line.frozen_commission_rate > 0 ? `${line.frozen_commission_rate.toFixed(1)}%` : "-"}
                      </td>

                      {/* Gross Commission Amount */}
                      <td className="py-3 px-4 text-right font-mono text-zinc-800">
                        {line.gross_commission_amount !== 0
                          ? line.gross_commission_amount.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })
                          : "-"}
                      </td>

                      {/* WHT (3% Thai Revenue Code) */}
                      <td className="py-3 px-4 text-right font-mono text-zinc-600">
                        {line.wht_tax_amount !== 0
                          ? line.wht_tax_amount.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })
                          : "-"}
                      </td>

                      {/* Net Commission */}
                      <td
                        className={`py-3 px-4 text-right font-mono font-bold ${isNegative ? "text-red-600" : "text-zinc-900"}`}
                      >
                        {isNegative ? "" : "+"}
                        {line.net_commission_amount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </td>

                      {/* Settlement Mode (NET vs GROSS) */}
                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                          {line.settlement_mode}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            line.status === "AVAILABLE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : line.status === "PENDING"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-zinc-100 text-zinc-600 border-zinc-200"
                          }`}
                        >
                          {line.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Audit Footer Info */}
        <div className="p-3 bg-zinc-50 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-500 gap-2">
          <div className="flex items-center space-x-1.5">
            <Building className="w-3.5 h-3.5 text-zinc-400" />
            <span>
              All entries reflect immutable double-entry constraints. Updates or deletions are strictly prohibited.
            </span>
          </div>
          <div className="text-zinc-400">TRD WHT 50-Tawi Remittance Ledger compliant</div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* Modal: Stage Agent Payout (Maker Action - SDD 3.6.5 & 5.12) */}
      {/* ======================================================== */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in">
          <div className="bg-white border border-zinc-200 rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center space-x-2">
                <Wallet className="w-5 h-5 text-zinc-800" />
                <h3 className="text-sm font-bold text-zinc-900">Stage Agent Payout (Maker Request)</h3>
              </div>
              <button onClick={() => setIsPayoutModalOpen(false)} className="text-zinc-400 hover:text-zinc-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStagePayout} className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-lg flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Maker-Checker Segregation of Duties: </span>
                  Submitting this form stages an approval request into{" "}
                  <code className="font-mono bg-amber-100/70 px-1 py-0.5 rounded text-[11px]">approval_requests</code>.
                  It will not disburse fiat until approved by a Finance Checker.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Target Sub-Agent</label>
                <div className="text-xs bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-zinc-800 font-medium">
                  {currentAgent.agent_name} ({currentAgent.agent_code})
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-zinc-700">Payout Amount (THB)</label>
                  <span className="text-[11px] text-zinc-500">
                    Max Available:{" "}
                    <button
                      type="button"
                      onClick={() =>
                        setPayoutForm((prev) => ({
                          ...prev,
                          payout_amount: currentBalance.available_balance.toString(),
                        }))
                      }
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      ฿
                      {currentBalance.available_balance.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </button>
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-zinc-400 font-semibold">฿</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={payoutForm.payout_amount}
                    onChange={(e) => setPayoutForm({ ...payoutForm, payout_amount: e.target.value })}
                    className="w-full pl-8 pr-4 py-2 text-xs bg-white border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Agent Tax Invoice / Receipt No. (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. TAX-INV-2026-991"
                  value={payoutForm.agent_tax_invoice_number}
                  onChange={(e) =>
                    setPayoutForm({
                      ...payoutForm,
                      agent_tax_invoice_number: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-800 font-mono"
                />
                <span className="text-[10px] text-zinc-400 mt-0.5 block">
                  Required for Corporate Entity sub-brokers issuing tax receipts.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Finance Notes & Audit Justification
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g., End of Month standard settlement for verified policies."
                  value={payoutForm.finance_notes}
                  onChange={(e) => setPayoutForm({ ...payoutForm, finance_notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-800"
                />
              </div>

              <div className="pt-3 border-t border-zinc-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-sm transition-colors"
                >
                  Submit Maker Payout Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* Modal: Debt Recovery Payment (Debit Note Clearance)     */}
      {/* ======================================================== */}
      {isDebitRecoveryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white border border-zinc-200 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-5 h-5 text-red-600" />
                <h3 className="text-sm font-bold text-zinc-900">Execute Agent Debt Recovery</h3>
              </div>
              <button onClick={() => setIsDebitRecoveryOpen(false)} className="text-zinc-400 hover:text-zinc-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordDebtRecovery} className="p-6 space-y-4">
              <p className="text-xs text-zinc-600">
                Record inward bank transfer from agent to clear negative clawback balance associated with an issued
                Debit Note (BRD 7.4.4).
              </p>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Recovery Amount (THB)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={recoveryAmount}
                  onChange={(e) => setRecoveryAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Inward Bank Reference ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KBANK-IN-20261012-99"
                  value={recoveryBankRef}
                  onChange={(e) => setRecoveryBankRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-800 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-zinc-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsDebitRecoveryOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm"
                >
                  Confirm Debt Recovery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentWalletsPayoutsPage;
