import React, { useMemo, useState } from "react";

// ============================================================================
// Types & Schema Interfaces (PAS SDD Section 4.7 & 4.8 Aligned)
// ============================================================================

export type TransactionType = "PREMIUM_IN" | "REFUND_OUT" | "OUTBOUND_INSURER_PAYOUT";

export type CommissionType = "COMMISSION_IN" | "CLAWBACK" | "PAYOUT";

export type SettlementMode = "NET" | "GROSS";

export type LedgerStatus = "PENDING" | "AVAILABLE" | "SETTLED" | "FLAGGED_MISMATCH";

export interface TransactionRecord {
  transaction_id: string;
  policy_id: string;
  policy_number: string;
  installment_id?: string;
  cycle_number?: number;
  gateway_ref_id: string;
  transaction_type: TransactionType;
  amount: number;
  transaction_fee: number; // Deductions taken by third_party_payees / Gateway MDR
  net_received: number;
  timestamp: string;
  payee_type: "BROKER" | "INSURER" | "THIRD_PARTY";
  insurer_name: string;
  customer_name: string;
  reconciliation_status: "RECONCILED" | "UNMATCHED" | "DISPUTED";
}

export interface CommissionRecord {
  commission_id: string;
  agent_id: string;
  agent_name: string;
  policy_id: string;
  policy_number: string;
  transaction_id: string;
  transaction_type: CommissionType;
  frozen_commission_rate: number;
  gross_commission_amount: number;
  wht_tax_amount: number; // Mandatory 3% Thai Revenue Department WHT deduction
  net_commission_amount: number;
  settlement_mode: SettlementMode;
  status: LedgerStatus;
  timestamp: string;
}

export interface GeneralLedgerEntry {
  entry_id: string;
  reference_no: string;
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  currency: string;
  created_at: string;
  description: string;
}

// ============================================================================
// Mock Data (Aligned with BRD Section 6.6, 7.4, 7.7)
// ============================================================================

const MOCK_TRANSACTIONS: TransactionRecord[] = [
  {
    transaction_id: "tx-88210-991",
    policy_id: "pol-9081-33",
    policy_number: "VTH-2026-M-00812",
    installment_id: "inst-01",
    cycle_number: 1,
    gateway_ref_id: "chrg_omise_8819201a",
    transaction_type: "PREMIUM_IN",
    amount: 18500.0,
    transaction_fee: 425.5, // MDR 2.3%
    net_received: 18074.5,
    timestamp: "2026-10-12 14:22:10",
    payee_type: "BROKER",
    insurer_name: "Viriyah Insurance",
    customer_name: "Somchai Prasert",
    reconciliation_status: "RECONCILED",
  },
  {
    transaction_id: "tx-88210-992",
    policy_id: "pol-9082-11",
    policy_number: "MSIG-2026-T-00419",
    gateway_ref_id: "chrg_2c2p_7730198b",
    transaction_type: "PREMIUM_IN",
    amount: 3200.0,
    transaction_fee: 80.0,
    net_received: 3120.0,
    timestamp: "2026-10-12 15:05:44",
    payee_type: "BROKER",
    insurer_name: "MSIG Insurance Thailand",
    customer_name: "Kanya Wattana",
    reconciliation_status: "RECONCILED",
  },
  {
    transaction_id: "tx-88210-993",
    policy_id: "pol-7102-44",
    policy_number: "BKI-2026-C-90114",
    gateway_ref_id: "rfnd_bank_wire_0029",
    transaction_type: "REFUND_OUT",
    amount: -6500.0,
    transaction_fee: 0.0,
    net_received: -6500.0,
    timestamp: "2026-10-11 11:18:02",
    payee_type: "BROKER",
    insurer_name: "Bangkok Insurance",
    customer_name: "Anan Sookjai",
    reconciliation_status: "RECONCILED",
  },
  {
    transaction_id: "tx-88210-994",
    policy_id: "pol-6612-88",
    policy_number: "VTH-2026-M-00755",
    gateway_ref_id: "KBANK-BOR-202610-01",
    transaction_type: "OUTBOUND_INSURER_PAYOUT",
    amount: -450000.0,
    transaction_fee: 0.0,
    net_received: -450000.0,
    timestamp: "2026-10-10 17:30:00",
    payee_type: "INSURER",
    insurer_name: "Viriyah Insurance",
    customer_name: "EOM Bordereau Bulk Remittance",
    reconciliation_status: "RECONCILED",
  },
];

const MOCK_COMMISSIONS: CommissionRecord[] = [
  {
    commission_id: "com-1101",
    agent_id: "AGT-9918",
    agent_name: "Wichai Thanakit (Direct)",
    policy_id: "pol-9081-33",
    policy_number: "VTH-2026-M-00812",
    transaction_id: "tx-88210-991",
    transaction_type: "COMMISSION_IN",
    frozen_commission_rate: 18.0,
    gross_commission_amount: 3330.0,
    wht_tax_amount: 99.9, // 3% of 3330
    net_commission_amount: 3230.1,
    settlement_mode: "NET",
    status: "AVAILABLE",
    timestamp: "2026-10-12 14:22:15",
  },
  {
    commission_id: "com-1102",
    agent_id: "AGT-4402",
    agent_name: "Siam Affiliate Brokers Ltd.",
    policy_id: "pol-7102-44",
    policy_number: "BKI-2026-C-90114",
    transaction_id: "tx-88210-993",
    transaction_type: "CLAWBACK",
    frozen_commission_rate: 15.0,
    gross_commission_amount: -975.0,
    wht_tax_amount: 29.25, // Reversed tax entry
    net_commission_amount: -945.75,
    settlement_mode: "GROSS",
    status: "SETTLED",
    timestamp: "2026-10-11 11:18:10",
  },
  {
    commission_id: "com-1103",
    agent_id: "AGT-9918",
    agent_name: "Wichai Thanakit (Direct)",
    policy_id: "pol-6612-88",
    policy_number: "VTH-2026-M-00611",
    transaction_id: "tx-88210-804",
    transaction_type: "PAYOUT",
    frozen_commission_rate: 0.0,
    gross_commission_amount: -45000.0,
    wht_tax_amount: 0.0,
    net_commission_amount: -45000.0,
    settlement_mode: "NET",
    status: "SETTLED",
    timestamp: "2026-10-09 16:00:00",
  },
];

const MOCK_JOURNAL_DETAILS: Record<string, GeneralLedgerEntry[]> = {
  "tx-88210-991": [
    {
      entry_id: "gl-01",
      reference_no: "JV-2026-10-001",
      account_code: "110100",
      account_name: "Trust Bank Account (Broker Receipt)",
      debit: 18074.5,
      credit: 0.0,
      currency: "THB",
      created_at: "2026-10-12 14:22:10",
      description: "Omise Gross Collection net of gateway MDR fee",
    },
    {
      entry_id: "gl-02",
      reference_no: "JV-2026-10-001",
      account_code: "520100",
      account_name: "Payment Processing Fee (MDR Expense)",
      debit: 425.5,
      credit: 0.0,
      currency: "THB",
      created_at: "2026-10-12 14:22:10",
      description: "Third-party gateway transaction fee deduction",
    },
    {
      entry_id: "gl-03",
      reference_no: "JV-2026-10-001",
      account_code: "210200",
      account_name: "Insurer Premium Payable (Viriyah)",
      debit: 0.0,
      credit: 15170.0,
      currency: "THB",
      created_at: "2026-10-12 14:22:10",
      description: "Net payable scheduled for End-of-Month Bordereau",
    },
    {
      entry_id: "gl-04",
      reference_no: "JV-2026-10-001",
      account_code: "210300",
      account_name: "Sub-Agent Wallet Liability (Payable)",
      debit: 0.0,
      credit: 3230.1,
      currency: "THB",
      created_at: "2026-10-12 14:22:10",
      description: "Net commission allocated to AGT-9918 wallet",
    },
    {
      entry_id: "gl-05",
      reference_no: "JV-2026-10-001",
      account_code: "210400",
      account_name: "Prepaid Withholding Tax (PND 3 Liability)",
      debit: 0.0,
      credit: 99.9,
      currency: "THB",
      created_at: "2026-10-12 14:22:10",
      description: "3% statutory withholding tax held for Revenue Dept (TRD)",
    },
  ],
};

// ============================================================================
// Main Component
// ============================================================================

export const TransactionsLedgerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"transactions" | "commissions" | "double_entry">("transactions");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedSettlementMode, setSelectedSettlementMode] = useState<string>("ALL");
  const [selectedTxForModal, setSelectedTxForModal] = useState<TransactionRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // KPI Calculations
  const kpiData = useMemo(() => {
    const totalPremiumIn = MOCK_TRANSACTIONS.filter((t) => t.transaction_type === "PREMIUM_IN").reduce(
      (sum, t) => sum + t.amount,
      0,
    );

    const totalRefunds = MOCK_TRANSACTIONS.filter((t) => t.transaction_type === "REFUND_OUT").reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0,
    );

    const totalGatewayFees = MOCK_TRANSACTIONS.reduce((sum, t) => sum + t.transaction_fee, 0);

    const totalAvailableCommission = MOCK_COMMISSIONS.filter((c) => c.status === "AVAILABLE").reduce(
      (sum, c) => sum + c.net_commission_amount,
      0,
    );

    const totalWhtHeld = MOCK_COMMISSIONS.reduce((sum, c) => sum + c.wht_tax_amount, 0);

    return {
      totalPremiumIn,
      totalRefunds,
      totalGatewayFees,
      totalAvailableCommission,
      totalWhtHeld,
    };
  }, []);

  const formatTHB = (val: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 2,
    }).format(val);
  };

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return MOCK_TRANSACTIONS.filter((t) => {
      const matchSearch =
        t.policy_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.gateway_ref_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.insurer_name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = selectedType === "ALL" || t.transaction_type === selectedType;
      return matchSearch && matchType;
    });
  }, [searchTerm, selectedType]);

  // Filtered Commissions
  const filteredCommissions = useMemo(() => {
    return MOCK_COMMISSIONS.filter((c) => {
      const matchSearch =
        c.policy_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.agent_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.agent_name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = selectedType === "ALL" || c.transaction_type === selectedType;
      const matchMode = selectedSettlementMode === "ALL" || c.settlement_mode === selectedSettlementMode;
      return matchSearch && matchType && matchMode;
    });
  }, [searchTerm, selectedType, selectedSettlementMode]);

  return (
    // Note: User constraint: "no padding on top container"
    // Using negative top margin to cancel default layout padding, with pt-0 and clean light theme
    <div className="-mt-6 -mx-6 pt-0 bg-zinc-50 min-h-screen text-zinc-900 antialiased flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-6 z-50 bg-zinc-900 text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-medium flex items-center space-x-2 border border-zinc-700 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sticky Top Header Banner (Flush with Layout Header) */}
      <div className="bg-white border-b border-zinc-200 px-6 py-4 shrink-0 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Transactions & General Ledger</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                Ledger Engine Active (Append-Only)
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              System of Record for Inbound Premiums, 3% TRD WHT Calculations, Sub-Agent Wallets & Double-Entry Bordereau
              Settlements.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => showNotification("Running 50 Tawi Tax batch extraction (3% WHT)...")}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded hover:bg-zinc-50 focus:outline-hidden transition-colors"
            >
              <svg className="w-3.5 h-3.5 mr-1.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export 50 Tawi (TRD)
            </button>
            <button
              onClick={() => showNotification("OIC Por.Lor. 1 batch report scheduled on Read-Replica DB.")}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded hover:bg-zinc-50 focus:outline-hidden transition-colors"
            >
              <svg className="w-3.5 h-3.5 mr-1.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              OIC Por.Lor. 1
            </button>
            <button
              onClick={() => showNotification("Maker Request Staged: End of Month Ledger Close submitted.")}
              className="inline-flex items-center px-3.5 py-1.5 text-xs font-semibold text-white bg-zinc-900 rounded hover:bg-zinc-800 focus:outline-hidden shadow-xs transition-colors"
            >
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              EOM Close Period
            </button>
          </div>
        </div>

        {/* Tab Switching Navigation */}
        <div className="flex border-b border-zinc-200 mt-4 space-x-6">
          <button
            onClick={() => {
              setActiveTab("transactions");
              setSelectedType("ALL");
            }}
            className={`pb-2.5 text-xs font-semibold tracking-wide border-b-2 transition-colors ${
              activeTab === "transactions"
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Inbound & Outbound Transactions ({MOCK_TRANSACTIONS.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("commissions");
              setSelectedType("ALL");
            }}
            className={`pb-2.5 text-xs font-semibold tracking-wide border-b-2 transition-colors ${
              activeTab === "commissions"
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Sub-Agent Commission Ledger ({MOCK_COMMISSIONS.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("double_entry");
            }}
            className={`pb-2.5 text-xs font-semibold tracking-wide border-b-2 transition-colors ${
              activeTab === "double_entry"
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Chart of Accounts & Double-Entry Journal
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 space-y-6">
        {/* KPI Financial Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-2xs">
            <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">
              Gross Premium Inbound
            </span>
            <div className="text-lg font-bold text-zinc-900 mt-1">{formatTHB(kpiData.totalPremiumIn)}</div>
            <div className="flex items-center text-[11px] text-emerald-600 mt-1 font-medium">
              <span>● Real-time Gateway Receipts</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-2xs">
            <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">
              Gateway & MDR Fees
            </span>
            <div className="text-lg font-bold text-amber-600 mt-1">{formatTHB(kpiData.totalGatewayFees)}</div>
            <div className="flex items-center text-[11px] text-zinc-500 mt-1">
              <span>Third-party payee deductions</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-2xs">
            <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">
              Customer Refunds Out
            </span>
            <div className="text-lg font-bold text-rose-600 mt-1">{formatTHB(kpiData.totalRefunds)}</div>
            <div className="flex items-center text-[11px] text-zinc-500 mt-1">
              <span>Approved cancellations</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-2xs">
            <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">
              Withdrawable Agent Wallets
            </span>
            <div className="text-lg font-bold text-zinc-900 mt-1">{formatTHB(kpiData.totalAvailableCommission)}</div>
            <div className="flex items-center text-[11px] text-blue-600 mt-1 font-medium">
              <span>Status: AVAILABLE (Past free-look)</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-2xs">
            <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">
              3% WHT Liability (TRD)
            </span>
            <div className="text-lg font-bold text-indigo-700 mt-1">{formatTHB(kpiData.totalWhtHeld)}</div>
            <div className="flex items-center text-[11px] text-zinc-500 mt-1">
              <span>Withheld on agent payouts</span>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1 flex flex-wrap items-center gap-3">
            {/* Search Box */}
            <div className="relative min-w-[240px]">
              <input
                type="text"
                placeholder="Search Policy No, Gateway Ref, Agent, Insurer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded text-xs text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:bg-white"
              />
              <svg
                className="w-4 h-4 text-zinc-400 absolute left-2.5 top-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Filter by Type */}
            {activeTab === "transactions" && (
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded text-xs text-zinc-800 focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
              >
                <option value="ALL">All Transaction Types</option>
                <option value="PREMIUM_IN">PREMIUM_IN (Receipts)</option>
                <option value="REFUND_OUT">REFUND_OUT (Refunds)</option>
                <option value="OUTBOUND_INSURER_PAYOUT">OUTBOUND_INSURER_PAYOUT (Bordereau)</option>
              </select>
            )}

            {activeTab === "commissions" && (
              <>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded text-xs text-zinc-800 focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
                >
                  <option value="ALL">All Commission Types</option>
                  <option value="COMMISSION_IN">COMMISSION_IN</option>
                  <option value="CLAWBACK">CLAWBACK (Negative)</option>
                  <option value="PAYOUT">PAYOUT</option>
                </select>

                <select
                  value={selectedSettlementMode}
                  onChange={(e) => setSelectedSettlementMode(e.target.value)}
                  className="px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded text-xs text-zinc-800 focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
                >
                  <option value="ALL">All Settlement Modes</option>
                  <option value="NET">NET (Deduct Before Remit)</option>
                  <option value="GROSS">GROSS (Pay After Remit)</option>
                </select>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2 text-xs text-zinc-500">
            <span>
              Period: <strong>October 2026</strong>
            </span>
            <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
            <span>
              Accounting Cycle: <strong>Day 12 of 31</strong>
            </span>
          </div>
        </div>

        {/* TAB 1: Transactions Ledger */}
        {activeTab === "transactions" && (
          <div className="bg-white rounded-lg border border-zinc-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
              <span className="text-xs font-semibold text-zinc-800 tracking-wider uppercase">
                Money Movement Ledger (transactions table)
              </span>
              <span className="text-xs text-zinc-500">Showing {filteredTransactions.length} recorded entries</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-700 divide-y divide-zinc-200">
                <thead className="bg-zinc-100/75 text-zinc-600 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Timestamp / Tx ID</th>
                    <th className="px-4 py-3">Policy & Customer</th>
                    <th className="px-4 py-3">Gateway Reference</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 text-right">Gross Amount</th>
                    <th className="px-4 py-3 text-right">Third-Party Fee</th>
                    <th className="px-4 py-3 text-right">Net Received</th>
                    <th className="px-4 py-3">Insurer</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white font-normal">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.transaction_id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-mono text-zinc-900 font-medium">{tx.timestamp}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">{tx.transaction_id}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-900">{tx.policy_number}</div>
                        <div className="text-[11px] text-zinc-500">{tx.customer_name}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-zinc-600">{tx.gateway_ref_id}</td>
                      <td className="px-4 py-3">
                        {tx.transaction_type === "PREMIUM_IN" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            PREMIUM_IN
                          </span>
                        )}
                        {tx.transaction_type === "REFUND_OUT" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            REFUND_OUT
                          </span>
                        )}
                        {tx.transaction_type === "OUTBOUND_INSURER_PAYOUT" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            OUTBOUND_PAYOUT
                          </span>
                        )}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-semibold font-mono ${
                          tx.amount < 0 ? "text-rose-600" : "text-zinc-900"
                        }`}
                      >
                        {formatTHB(tx.amount)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-500">
                        {tx.transaction_fee > 0 ? `-${formatTHB(tx.transaction_fee)}` : "฿0.00"}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-bold font-mono ${
                          tx.net_received < 0 ? "text-rose-600" : "text-emerald-700"
                        }`}
                      >
                        {formatTHB(tx.net_received)}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{tx.insurer_name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 text-zinc-800 border border-zinc-200">
                          {tx.reconciliation_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedTxForModal(tx)}
                          className="px-2.5 py-1 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded hover:bg-zinc-50 hover:border-zinc-400 transition-colors shadow-2xs"
                        >
                          View Journal
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-6 py-8 text-center text-xs text-zinc-500">
                        No transactions found matching the applied filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Sub-Agent Commission Ledger */}
        {activeTab === "commissions" && (
          <div className="bg-white rounded-lg border border-zinc-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
              <span className="text-xs font-semibold text-zinc-800 tracking-wider uppercase">
                Sub-Agent Wallet & Commission Ledger (commissions table)
              </span>
              <span className="text-xs text-zinc-500">Formula: Net Commission = Gross - 3% WHT (Section 6.6)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-700 divide-y divide-zinc-200">
                <thead className="bg-zinc-100/75 text-zinc-600 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Agent ID & Name</th>
                    <th className="px-4 py-3">Policy Number</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 text-center">Frozen Rate</th>
                    <th className="px-4 py-3 text-right">Gross Comm.</th>
                    <th className="px-4 py-3 text-right">3% WHT (TRD)</th>
                    <th className="px-4 py-3 text-right">Net Payable</th>
                    <th className="px-4 py-3 text-center">Settlement Mode</th>
                    <th className="px-4 py-3 text-center">Wallet Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white font-normal">
                  {filteredCommissions.map((comm) => {
                    const isClawback = comm.transaction_type === "CLAWBACK";
                    return (
                      <tr
                        key={comm.commission_id}
                        // BRD Screen 8.7.3 Mandate: Clawback rows shown in Red
                        className={`transition-colors ${
                          isClawback
                            ? "bg-rose-50/60 hover:bg-rose-100/50 text-rose-950 font-medium"
                            : "hover:bg-zinc-50/80"
                        }`}
                      >
                        <td className="px-4 py-3 font-mono text-[11px]">{comm.timestamp}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-zinc-900">{comm.agent_name}</div>
                          <div className="text-[10px] text-zinc-500 font-mono">{comm.agent_id}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-zinc-800">{comm.policy_number}</td>
                        <td className="px-4 py-3">
                          {isClawback ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-200 text-rose-900 border border-rose-300">
                              CLAWBACK
                            </span>
                          ) : comm.transaction_type === "PAYOUT" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-200 text-zinc-800">
                              PAYOUT
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              COMMISSION_IN
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-medium">
                          {comm.frozen_commission_rate > 0 ? `${comm.frozen_commission_rate}%` : "—"}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-mono font-semibold ${
                            isClawback ? "text-rose-700" : "text-zinc-900"
                          }`}
                        >
                          {formatTHB(comm.gross_commission_amount)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-indigo-700">
                          {comm.wht_tax_amount !== 0 ? `-${formatTHB(comm.wht_tax_amount)}` : "฿0.00"}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-mono font-bold ${
                            isClawback ? "text-rose-700" : "text-emerald-700"
                          }`}
                        >
                          {formatTHB(comm.net_commission_amount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                              comm.settlement_mode === "NET"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-purple-50 text-purple-700 border border-purple-200"
                            }`}
                          >
                            {comm.settlement_mode}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              comm.status === "AVAILABLE"
                                ? "bg-emerald-100 text-emerald-800"
                                : comm.status === "SETTLED"
                                  ? "bg-zinc-100 text-zinc-700"
                                  : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {comm.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Chart of Accounts & Double-Entry Journal Mapping */}
        {activeTab === "double_entry" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-zinc-200 shadow-2xs overflow-hidden">
              <div className="px-5 py-3 border-b border-zinc-200 bg-zinc-50/50 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                    Standard Chart of Accounts (CoA Mapping)
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    OIC Trust Account & TRD statutory general ledger mapping definitions
                  </p>
                </div>
                <span className="text-xs font-mono text-zinc-400">PostgreSQL Append-Only</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-700 divide-y divide-zinc-200">
                  <thead className="bg-zinc-100/75 text-zinc-600 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Account Code</th>
                      <th className="px-4 py-3">Account Name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Normal Balance</th>
                      <th className="px-4 py-3">Description / Regulatory Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 bg-white">
                    <tr>
                      <td className="px-4 py-3 font-mono font-bold text-zinc-900">110100</td>
                      <td className="px-4 py-3 font-medium text-zinc-900">OIC Trust Bank Account</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px]">Asset</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-zinc-700">Debit</td>
                      <td className="px-4 py-3 text-zinc-500">
                        Dedicated ring-fenced bank account for client premium receipts.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono font-bold text-zinc-900">210200</td>
                      <td className="px-4 py-3 font-medium text-zinc-900">Insurer Premium Payable</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px]">Liability</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-zinc-700">Credit</td>
                      <td className="px-4 py-3 text-zinc-500">
                        Collected premiums due to carriers (settled via monthly Bordereau).
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono font-bold text-zinc-900">210300</td>
                      <td className="px-4 py-3 font-medium text-zinc-900">Sub-Agent Wallet Payable</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px]">Liability</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-zinc-700">Credit</td>
                      <td className="px-4 py-3 text-zinc-500">
                        Commission held in trust until free-look period expiration.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono font-bold text-zinc-900">210400</td>
                      <td className="px-4 py-3 font-medium text-zinc-900">Withholding Tax (P.N.D. 3)</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px]">Liability</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-zinc-700">Credit</td>
                      <td className="px-4 py-3 text-zinc-500">
                        3% tax withheld from agent earnings remitted monthly to TRD.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono font-bold text-zinc-900">520100</td>
                      <td className="px-4 py-3 font-medium text-zinc-900">Payment Gateway MDR Fee</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px]">Expense</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-zinc-700">Debit</td>
                      <td className="px-4 py-3 text-zinc-500">
                        Transaction fees charged by Omise / 2C2P for card/QR acquiring.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Double-Entry Journal Modal */}
      {selectedTxForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 max-w-2xl w-full overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Double-Entry General Ledger Voucher</h3>
                <span className="text-xs font-mono text-zinc-500">
                  Ref: {selectedTxForModal.gateway_ref_id} ({selectedTxForModal.policy_number})
                </span>
              </div>
              <button
                onClick={() => setSelectedTxForModal(null)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-2 bg-zinc-50 p-3 rounded-lg border border-zinc-200 text-xs">
                <div>
                  <span className="text-zinc-500 block text-[10px]">Insurer</span>
                  <span className="font-semibold text-zinc-800">{selectedTxForModal.insurer_name}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Gross Inbound</span>
                  <span className="font-semibold text-zinc-900 font-mono">{formatTHB(selectedTxForModal.amount)}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Third-Party Fee</span>
                  <span className="font-semibold text-amber-700 font-mono">
                    -{formatTHB(selectedTxForModal.transaction_fee)}
                  </span>
                </div>
              </div>

              <div className="border border-zinc-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs divide-y divide-zinc-200">
                  <thead className="bg-zinc-100 font-semibold text-zinc-700 text-[11px]">
                    <tr>
                      <th className="px-3 py-2">Account</th>
                      <th className="px-3 py-2">Description</th>
                      <th className="px-3 py-2 text-right">Debit (THB)</th>
                      <th className="px-3 py-2 text-right">Credit (THB)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 font-mono">
                    {(MOCK_JOURNAL_DETAILS[selectedTxForModal.transaction_id] || []).map((line) => (
                      <tr key={line.entry_id} className="hover:bg-zinc-50">
                        <td className="px-3 py-2 text-zinc-900">
                          <span className="font-bold">{line.account_code}</span>
                          <span className="text-zinc-500 block font-sans text-[10px]">{line.account_name}</span>
                        </td>
                        <td className="px-3 py-2 font-sans text-[11px] text-zinc-600">{line.description}</td>
                        <td className="px-3 py-2 text-right font-semibold text-zinc-900">
                          {line.debit > 0 ? formatTHB(line.debit) : "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-zinc-900">
                          {line.credit > 0 ? formatTHB(line.credit) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-zinc-50 font-mono font-bold text-zinc-900 border-t border-zinc-200">
                    <tr>
                      <td colSpan={2} className="px-3 py-2 text-right font-sans uppercase text-[11px]">
                        Balanced Total:
                      </td>
                      <td className="px-3 py-2 text-right text-emerald-700">{formatTHB(selectedTxForModal.amount)}</td>
                      <td className="px-3 py-2 text-right text-emerald-700">{formatTHB(selectedTxForModal.amount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="px-6 py-3 bg-zinc-50 border-t border-zinc-200 flex justify-end">
              <button
                onClick={() => setSelectedTxForModal(null)}
                className="px-4 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 rounded hover:bg-zinc-100 transition-colors"
              >
                Close Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsLedgerPage;
