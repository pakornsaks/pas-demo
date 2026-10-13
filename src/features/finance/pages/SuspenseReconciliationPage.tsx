import {
  AlertCircle,
  ArrowRightLeft,
  Building2,
  Check,
  CheckCircle2,
  Coins,
  FileSpreadsheet,
  Filter,
  Search,
  X,
} from "lucide-react";
import React, { useState } from "react";

interface SuspenseFund {
  suspense_id: string;
  source_bank: string;
  bank_reference: string;
  unallocated_amount: number;
  received_date: string;
  payer_identifier: string;
  status: "PENDING_MAPPING" | "PARTIALLY_ALLOCATED" | "RESOLVED";
}

interface InsurerPayableLine {
  transaction_id: string;
  policy_number: string;
  customer_name: string;
  insurer_name: string;
  gross_premium: number;
  expected_remittance: number;
  reconciliation_status: "PENDING" | "RECONCILED" | "DISPUTED";
  dispute_reason?: string;
  is_paid_to_insurer: boolean;
  is_commission_received: boolean;
}

const MOCK_SUSPENSE_FUNDS: SuspenseFund[] = [
  {
    suspense_id: "sus-8821-bkk",
    source_bank: "KBANK Corporate Direct",
    bank_reference: "TRF-2026-990141",
    unallocated_amount: 14850.25,
    received_date: "2026-10-12 09:30",
    payer_identifier: "PromptPay Direct / Ref: Unmatched Tax ID",
    status: "PENDING_MAPPING",
  },
  {
    suspense_id: "sus-8822-bkk",
    source_bank: "SCB Auto-Collect",
    bank_reference: "SCB-88319-X01",
    unallocated_amount: 3200.0,
    received_date: "2026-10-13 14:15",
    payer_identifier: "BBL NetBank Counter Transfer",
    status: "PENDING_MAPPING",
  },
];

const MOCK_PAYABLE_LINES: InsurerPayableLine[] = [
  {
    transaction_id: "tx-vir-001",
    policy_number: "POL-2026-00812",
    customer_name: "Somchai Prasert",
    insurer_name: "Viriyah Insurance",
    gross_premium: 15000.0,
    expected_remittance: 13200.0,
    reconciliation_status: "PENDING",
    is_paid_to_insurer: false,
    is_commission_received: false,
  },
  {
    transaction_id: "tx-vir-002",
    policy_number: "POL-2026-00819",
    customer_name: "Anong Srisawat",
    insurer_name: "Viriyah Insurance",
    gross_premium: 8900.0,
    expected_remittance: 7832.0,
    reconciliation_status: "RECONCILED",
    is_paid_to_insurer: true,
    is_commission_received: true,
  },
  {
    transaction_id: "tx-dhip-003",
    policy_number: "POL-2026-00944",
    customer_name: "Wichai Thongdee",
    insurer_name: "Dhipaya Insurance",
    gross_premium: 24500.0,
    expected_remittance: 21560.0,
    reconciliation_status: "DISPUTED",
    dispute_reason: "PREMIUM_MISMATCH (Carrier claims 25,000 THB)",
    is_paid_to_insurer: false,
    is_commission_received: false,
  },
];

export const SuspenseReconciliationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"suspense" | "insurer-recon">("suspense");
  const [suspenseList, setSuspenseList] = useState<SuspenseFund[]>(MOCK_SUSPENSE_FUNDS);
  const [payableLines, setPayableLines] = useState<InsurerPayableLine[]>(MOCK_PAYABLE_LINES);

  // Modal State for Suspense Fund Mapping
  const [selectedSuspense, setSelectedSuspense] = useState<SuspenseFund | null>(null);
  const [targetApplicationId, setTargetApplicationId] = useState("");
  const [allocateAmount, setAllocateAmount] = useState("");
  const [writeOffSatang, setWriteOffSatang] = useState(false);

  // Quick Inline Flags Update (Manual Operations Flags)
  const togglePayableFlag = (txId: string, field: "is_paid_to_insurer" | "is_commission_received") => {
    setPayableLines((prev) =>
      prev.map((item) => (item.transaction_id === txId ? { ...item, [field]: !item[field] } : item)),
    );
  };

  const handleUpdateReconStatus = (txId: string, status: "RECONCILED" | "DISPUTED", reason?: string) => {
    setPayableLines((prev) =>
      prev.map((item) =>
        item.transaction_id === txId
          ? {
              ...item,
              reconciliation_status: status,
              dispute_reason: reason ?? item.dispute_reason,
            }
          : item,
      ),
    );
  };

  const handleExecuteSuspenseAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSuspense) return;

    // Simulate allocation completion
    setSuspenseList((prev) =>
      prev.map((s) => (s.suspense_id === selectedSuspense.suspense_id ? { ...s, status: "RESOLVED" } : s)),
    );
    setSelectedSuspense(null);
    setTargetApplicationId("");
    setAllocateAmount("");
    setWriteOffSatang(false);
  };

  return (
    // -mt-6 -mx-6 neutralizes the parent container padding, light theme strictly applied
    <div className="-mt-6 -mx-6 bg-slate-50 min-h-full text-slate-800">
      {/* Top Banner & Control Strip */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                MODULE 5: FINANCE & RECONCILIATION
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">Suspense Funds & Settlement Reconciliation</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Dual-entry suspense pool allocation, Satang round-off handling, and Insurer Bordereau reconciliation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("suspense")}
              className={`px-4 py-2 text-xs font-medium rounded-lg border transition-all ${
                activeTab === "suspense"
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5" />
                Suspense Ledger ({suspenseList.filter((s) => s.status !== "RESOLVED").length})
              </span>
            </button>
            <button
              onClick={() => setActiveTab("insurer-recon")}
              className={`px-4 py-2 text-xs font-medium rounded-lg border transition-all ${
                activeTab === "insurer-recon"
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Bordereau Payables Reconcile
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Unallocated Suspense Pool</span>
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              ฿
              {suspenseList
                .filter((s) => s.status !== "RESOLVED")
                .reduce((acc, curr) => acc + curr.unallocated_amount, 0)
                .toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Requires manual policy linking</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Pending Payables to Insurers</span>
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              ฿
              {payableLines
                .filter((p) => p.reconciliation_status === "PENDING")
                .reduce((acc, curr) => acc + curr.expected_remittance, 0)
                .toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Trust Account EOM Bordereau buffer</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Disputed Line Items</span>
              <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-rose-600 mt-2">
              {payableLines.filter((p) => p.reconciliation_status === "DISPUTED").length} Lines
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Flagged for premium discrepancies</div>
          </div>
        </div>

        {/* TAB 1: SUSPENSE ALLOCATION WORKSPACE */}
        {activeTab === "suspense" && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Unmatched Suspense Inflows</h3>
                <p className="text-xs text-slate-500">
                  Transactions deposited without identifiable Quotation/Policy IDs in bank feeds.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search bank reference..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-6">Suspense ID</th>
                    <th className="py-3 px-6">Bank / Trace Ref</th>
                    <th className="py-3 px-6">Payer Stated Info</th>
                    <th className="py-3 px-6">Amount (THB)</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {suspenseList.map((fund) => (
                    <tr key={fund.suspense_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-6 font-mono font-medium text-slate-900">{fund.suspense_id}</td>
                      <td className="py-3.5 px-6">
                        <div className="font-medium text-slate-800">{fund.source_bank}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{fund.bank_reference}</div>
                      </td>
                      <td className="py-3.5 px-6 text-slate-600">
                        <div>{fund.payer_identifier}</div>
                        <div className="text-[11px] text-slate-400">{fund.received_date}</div>
                      </td>
                      <td className="py-3.5 px-6 font-semibold text-slate-900 font-mono">
                        ฿
                        {fund.unallocated_amount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${
                            fund.status === "RESOLVED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {fund.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        {fund.status !== "RESOLVED" ? (
                          <button
                            onClick={() => {
                              setSelectedSuspense(fund);
                              setAllocateAmount(fund.unallocated_amount.toString());
                            }}
                            className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-medium rounded-lg text-xs transition-colors"
                          >
                            Allocate Fund
                          </button>
                        ) : (
                          <span className="text-emerald-600 font-medium inline-flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Allocated
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: INSURER BORDEREAU RECONCILIATION */}
        {activeTab === "insurer-recon" && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Pre-Settlement Bordereau Line Items</h3>
                <p className="text-xs text-slate-500">
                  Verify individual transaction collections against partner insurer accounts.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 flex items-center gap-1.5">
                  <Filter className="w-3 h-3 text-slate-400" /> Filter Insurer
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-6">Policy / TX Ref</th>
                    <th className="py-3 px-6">Insurer & Insured</th>
                    <th className="py-3 px-6">Gross Premium</th>
                    <th className="py-3 px-6">Net Remittance</th>
                    <th className="py-3 px-6">Manual Ops Flags</th>
                    <th className="py-3 px-6">Reconciliation</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {payableLines.map((line) => (
                    <tr key={line.transaction_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-6 font-mono">
                        <div className="font-semibold text-slate-900">{line.policy_number}</div>
                        <div className="text-[11px] text-slate-400">{line.transaction_id}</div>
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="font-medium text-slate-800">{line.insurer_name}</div>
                        <div className="text-[11px] text-slate-500">{line.customer_name}</div>
                      </td>
                      <td className="py-3.5 px-6 font-mono text-slate-800">
                        ฿
                        {line.gross_premium.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3.5 px-6 font-mono font-semibold text-slate-900">
                        ฿
                        {line.expected_remittance.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="flex flex-col gap-1 text-[11px]">
                          <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900">
                            <input
                              type="checkbox"
                              checked={line.is_paid_to_insurer}
                              onChange={() => togglePayableFlag(line.transaction_id, "is_paid_to_insurer")}
                              className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-0"
                            />
                            Paid to Insurer
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900">
                            <input
                              type="checkbox"
                              checked={line.is_commission_received}
                              onChange={() => togglePayableFlag(line.transaction_id, "is_commission_received")}
                              className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-0"
                            />
                            Commission Recv'd
                          </label>
                        </div>
                      </td>
                      <td className="py-3.5 px-6">
                        <div>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              line.reconciliation_status === "RECONCILED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : line.reconciliation_status === "DISPUTED"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {line.reconciliation_status}
                          </span>
                          {line.dispute_reason && (
                            <p className="text-[10px] text-rose-600 font-medium mt-1">{line.dispute_reason}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {line.reconciliation_status !== "RECONCILED" && (
                            <button
                              onClick={() => handleUpdateReconStatus(line.transaction_id, "RECONCILED")}
                              title="Mark as Reconciled"
                              className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          {line.reconciliation_status !== "DISPUTED" && (
                            <button
                              onClick={() => {
                                const reason = prompt("Enter dispute reason (e.g., PREMIUM_MISMATCH):");
                                if (reason) handleUpdateReconStatus(line.transaction_id, "DISPUTED", reason);
                              }}
                              title="Flag Dispute"
                              className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ALLOCATE SUSPENSE FUNDS */}
      {selectedSuspense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Map Suspense Receipt</h3>
                <p className="text-xs text-slate-500">Link unallocated money to an Application or Policy ID</p>
              </div>
              <button onClick={() => setSelectedSuspense(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteSuspenseAllocation} className="p-6 space-y-4">
              <div>
                <span className="text-xs text-slate-500 font-medium">Selected Suspense ID</span>
                <p className="text-xs font-mono font-bold text-slate-800">{selectedSuspense.suspense_id}</p>
                <div className="mt-1 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] p-2 rounded">
                  Balance: ฿
                  {selectedSuspense.unallocated_amount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Application / Policy UUID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., app-uuid-123 or POL-2026-..."
                  value={targetApplicationId}
                  onChange={(e) => setTargetApplicationId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount to Allocate (THB)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={allocateAmount}
                  onChange={(e) => setAllocateAmount(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={writeOffSatang}
                    onChange={(e) => setWriteOffSatang(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800">Auto Write-Off Satang Discrepancy</span>
                    <p className="text-[10px] text-slate-500">
                      Satisfies Module 5 rule: Automatically adjusts fractional Satang rounding to Suspense Loss GL.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedSuspense(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Commit Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuspenseReconciliationPage;
