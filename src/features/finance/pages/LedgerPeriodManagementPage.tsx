import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileCheck2,
  FileSpreadsheet,
  Filter,
  History,
  Lock,
  Search,
  ShieldCheck,
  Unlock,
  X,
} from "lucide-react";
import React, { useMemo, useState } from "react";

// --- TypeScript Interfaces & Models ---

export type PeriodStatus = "OPEN" | "PENDING_APPROVAL" | "CLOSED" | "LOCKED_AUDIT";

export interface PreCloseCheckItem {
  id: string;
  category: "BORDEREAU" | "AGENT_WALLET" | "SUSPENSE" | "TAX_INVOICE" | "INSTALLMENTS";
  name: string;
  description: string;
  status: "PASSED" | "WARNING" | "FAILED";
  unresolvedCount: number;
  unresolvedAmount?: number;
}

export interface FinancialPeriod {
  periodId: string; // e.g., "FP-2026-10"
  periodCode: string; // "2026-10"
  fiscalYear: number; // 2026 (BE 2569)
  fiscalMonth: number; // 10
  startDate: string;
  endDate: string;
  status: PeriodStatus;
  totalGrossPremium: number;
  totalBrokerCommission: number;
  totalInsurerRemittance: number;
  makerId?: string;
  makerName?: string;
  makerStagedAt?: string;
  checkerId?: string;
  checkerName?: string;
  closedAt?: string;
  approvalRequestId?: string;
  reconciliationScore: number; // 0 - 100%
  checks: PreCloseCheckItem[];
}

export interface ApprovalRequestPayload {
  requestId: string;
  periodCode: string;
  makerId: string;
  makerName: string;
  proposedAction: "CLOSE_PERIOD" | "REOPEN_FOR_AUDIT";
  stagedAt: string;
  justificationNotes: string;
  preCloseSnapshots: {
    totalGrossPremium: number;
    unsettledBordereauCount: number;
    unallocatedSuspenseAmount: number;
  };
}

// Mock Logged-in Actor Context (Simulating JWT claims)
interface CurrentUserContext {
  userId: string;
  name: string;
  email: string;
  roles: string[];
  scopes: string[];
}

const CURRENT_USER: CurrentUserContext = {
  userId: "usr-fin-mgr-002",
  name: "Kanya Somchai (Finance Manager)",
  email: "kanya.s@broker.co.th",
  roles: ["FINANCE_MANAGER", "CHECKER"],
  scopes: ["finance:read", "finance:approve", "finance:auditor"],
};

// --- Mock Initial Master Data (sys_financial_periods) ---

const INITIAL_PERIODS: FinancialPeriod[] = [
  {
    periodId: "FP-2026-10",
    periodCode: "2026-10",
    fiscalYear: 2026,
    fiscalMonth: 10,
    startDate: "2026-10-01",
    endDate: "2026-10-31",
    status: "OPEN",
    totalGrossPremium: 42850000.0,
    totalBrokerCommission: 7713000.0,
    totalInsurerRemittance: 35137000.0,
    reconciliationScore: 82,
    checks: [
      {
        id: "chk-01",
        category: "BORDEREAU",
        name: "Insurer Payable Settlement",
        description: "Verify all PREMIUM_IN items mapped to insurer_settlement_id",
        status: "WARNING",
        unresolvedCount: 3,
        unresolvedAmount: 145000.0,
      },
      {
        id: "chk-02",
        category: "AGENT_WALLET",
        name: "Clawbacks & Negative Wallets",
        description: "Ensure clawback deductions are invoiced as Debit Notes",
        status: "PASSED",
        unresolvedCount: 0,
        unresolvedAmount: 0.0,
      },
      {
        id: "chk-03",
        category: "SUSPENSE",
        name: "Suspense Accounts Balance",
        description: "Zero satang tolerance for unallocated incoming wires",
        status: "WARNING",
        unresolvedCount: 2,
        unresolvedAmount: 12400.0,
      },
      {
        id: "chk-04",
        category: "TAX_INVOICE",
        name: "TRD Continuous Sequence Check",
        description: "Check for gaps in nextval(tax_invoice_seq)",
        status: "PASSED",
        unresolvedCount: 0,
      },
      {
        id: "chk-05",
        category: "INSTALLMENTS",
        name: "Installment Warning Queue",
        description: "Confirm overdue cycles flagged without hanging locks",
        status: "PASSED",
        unresolvedCount: 0,
      },
    ],
  },
  {
    periodId: "FP-2026-09",
    periodCode: "2026-09",
    fiscalYear: 2026,
    fiscalMonth: 9,
    startDate: "2026-09-01",
    endDate: "2026-09-30",
    status: "PENDING_APPROVAL",
    totalGrossPremium: 68120000.0,
    totalBrokerCommission: 12261600.0,
    totalInsurerRemittance: 55858400.0,
    makerId: "usr-fin-adm-001",
    makerName: "Wichai Thana (Finance Admin - Maker)",
    makerStagedAt: "2026-10-10 18:24:10",
    approvalRequestId: "req-appr-77291",
    reconciliationScore: 100,
    checks: [
      {
        id: "chk-01",
        category: "BORDEREAU",
        name: "Insurer Payable Settlement",
        description: "All 4 Carrier Bordereaux reconciled and draft settled",
        status: "PASSED",
        unresolvedCount: 0,
        unresolvedAmount: 0.0,
      },
      {
        id: "chk-02",
        category: "AGENT_WALLET",
        name: "Clawbacks & Negative Wallets",
        description: "End-of-month negative payouts fully balanced to zero",
        status: "PASSED",
        unresolvedCount: 0,
        unresolvedAmount: 0.0,
      },
      {
        id: "chk-03",
        category: "SUSPENSE",
        name: "Suspense Accounts Balance",
        description: "Suspense cleared and mapped to application IDs",
        status: "PASSED",
        unresolvedCount: 0,
        unresolvedAmount: 0.0,
      },
      {
        id: "chk-04",
        category: "TAX_INVOICE",
        name: "TRD Continuous Sequence Check",
        description: "Verified 12,410 tax documents without sequence disruption",
        status: "PASSED",
        unresolvedCount: 0,
      },
      {
        id: "chk-05",
        category: "INSTALLMENTS",
        name: "Installment Warning Queue",
        description: "Overdue notices dispatched; exhausted contracts terminated",
        status: "PASSED",
        unresolvedCount: 0,
      },
    ],
  },
  {
    periodId: "FP-2026-08",
    periodCode: "2026-08",
    fiscalYear: 2026,
    fiscalMonth: 8,
    startDate: "2026-08-01",
    endDate: "2026-08-31",
    status: "CLOSED",
    totalGrossPremium: 59340000.0,
    totalBrokerCommission: 10681200.0,
    totalInsurerRemittance: 48658800.0,
    makerId: "usr-fin-adm-001",
    makerName: "Wichai Thana",
    checkerId: "usr-fin-mgr-002",
    checkerName: "Kanya Somchai",
    closedAt: "2026-09-08 14:10:00",
    reconciliationScore: 100,
    checks: [],
  },
  {
    periodId: "FP-2026-07",
    periodCode: "2026-07",
    fiscalYear: 2026,
    fiscalMonth: 7,
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    status: "CLOSED",
    totalGrossPremium: 54100000.0,
    totalBrokerCommission: 9738000.0,
    totalInsurerRemittance: 44362000.0,
    makerId: "usr-fin-adm-001",
    makerName: "Wichai Thana",
    checkerId: "usr-fin-mgr-002",
    checkerName: "Kanya Somchai",
    closedAt: "2026-08-06 17:45:12",
    reconciliationScore: 100,
    checks: [],
  },
];

export const LedgerPeriodManagementPage: React.FC = () => {
  const [periods, setPeriods] = useState<FinancialPeriod[]>(INITIAL_PERIODS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modals & Panels
  const [selectedPeriodForChecks, setSelectedPeriodForChecks] = useState<FinancialPeriod | null>(null);
  const [stageCloseModalPeriod, setStageCloseModalPeriod] = useState<FinancialPeriod | null>(null);
  const [checkerReviewPeriod, setCheckerReviewPeriod] = useState<FinancialPeriod | null>(null);
  const [reopenModalPeriod, setReopenModalPeriod] = useState<FinancialPeriod | null>(null);

  // Form States
  const [makerNotes, setMakerNotes] = useState("");
  const [checkerComments, setCheckerComments] = useState("");
  const [auditReopenReason, setAuditReopenReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filtered Periods List
  const filteredPeriods = useMemo(() => {
    return periods.filter((p) => {
      const matchesSearch =
        p.periodCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.periodId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [periods, searchQuery, statusFilter]);

  // Active / Current Open Period
  const activePeriod = periods.find((p) => p.status === "OPEN");
  const pendingClosePeriod = periods.find((p) => p.status === "PENDING_APPROVAL");

  // --- Handlers ---

  // Maker Action: Stage Period Close
  const handleInitiateCloseSubmit = () => {
    if (!stageCloseModalPeriod) return;
    setActionError(null);

    // Validation: All pre-close checks must pass or have manager acknowledgment
    const hasFailures = stageCloseModalPeriod.checks.some((c) => c.status === "FAILED");
    if (hasFailures) {
      setActionError("Cannot stage close request with FAILED checks. Please resolve critical discrepancies.");
      return;
    }

    if (!makerNotes.trim()) {
      setActionError("Mandatory justification notes required for EOM close initiation.");
      return;
    }

    // Update state to PENDING_APPROVAL (simulating POST /admin/ledger/periods/close Maker interception)
    const updated = periods.map((p) => {
      if (p.periodId === stageCloseModalPeriod.periodId) {
        return {
          ...p,
          status: "PENDING_APPROVAL" as PeriodStatus,
          makerId: CURRENT_USER.userId,
          makerName: CURRENT_USER.name,
          makerStagedAt: new Date().toISOString().replace("T", " ").substring(0, 19),
          approvalRequestId: `req-appr-${Math.floor(10000 + Math.random() * 90000)}`,
        };
      }
      return p;
    });

    setPeriods(updated);
    setStageCloseModalPeriod(null);
    setMakerNotes("");
    setActionSuccess(`Period ${stageCloseModalPeriod.periodCode} staged for Checker approval.`);
  };

  // Checker Action: Execute Approval
  const handleCheckerDecision = (decision: "APPROVED" | "REJECTED") => {
    if (!checkerReviewPeriod) return;
    setActionError(null);

    // Segregation of Duties Check: maker_id != checker_id
    if (checkerReviewPeriod.makerId === CURRENT_USER.userId) {
      setActionError("403 Forbidden: Segregation of Duties breach. You cannot approve a period close that you staged.");
      return;
    }

    if (decision === "REJECTED" && !checkerComments.trim()) {
      setActionError("Checker comments are mandatory when rejecting a ledger period close ticket.");
      return;
    }

    const updated = periods.map((p) => {
      if (p.periodId === checkerReviewPeriod.periodId) {
        if (decision === "APPROVED") {
          return {
            ...p,
            status: "CLOSED" as PeriodStatus,
            checkerId: CURRENT_USER.userId,
            checkerName: CURRENT_USER.name,
            closedAt: new Date().toISOString().replace("T", " ").substring(0, 19),
          };
        } else {
          return {
            ...p,
            status: "OPEN" as PeriodStatus,
            makerId: undefined,
            makerName: undefined,
            makerStagedAt: undefined,
            approvalRequestId: undefined,
          };
        }
      }
      return p;
    });

    setPeriods(updated);
    setCheckerReviewPeriod(null);
    setCheckerComments("");
    setActionSuccess(
      decision === "APPROVED"
        ? `Period ${checkerReviewPeriod.periodCode} permanently LOCKED and CLOSED. Double-entry balance immutable.`
        : `Close ticket for ${checkerReviewPeriod.periodCode} rejected and reverted to OPEN.`,
    );
  };

  // Auditor Action: Reopen for EOFY Adjustment
  const handleReopenAuditSubmit = () => {
    if (!reopenModalPeriod) return;
    setActionError(null);

    // Scope check: finance:auditor
    if (!CURRENT_USER.scopes.includes("finance:auditor")) {
      setActionError("403 Forbidden: Requires finance:auditor scope to modify historical closed periods.");
      return;
    }

    if (!auditReopenReason.trim()) {
      setActionError("Mandatory auditor ticket code and OIC rationale required.");
      return;
    }

    const updated = periods.map((p) => {
      if (p.periodId === reopenModalPeriod.periodId) {
        return {
          ...p,
          status: "LOCKED_AUDIT" as PeriodStatus,
        };
      }
      return p;
    });

    setPeriods(updated);
    setReopenModalPeriod(null);
    setAuditReopenReason("");
    setActionSuccess(`Period ${reopenModalPeriod.periodCode} unlocked in restricted AUDIT mode.`);
  };

  return (
    <div className="space-y-6 pt-0 text-zinc-900">
      {/* Feedback Banner */}
      {actionSuccess && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-700 hover:text-rose-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header & Actor Badges */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">Financial Ledger Period Management</h1>
            <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600 font-mono">
              sys_financial_periods
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Enforce chronological immutability, Maker-Checker segregation, and month-end ledger close (OIC/TRD
            Compliance).
          </p>
        </div>

        {/* Current Active Actor Identity Pill */}
        <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          <div className="text-right">
            <p className="text-xs font-semibold text-zinc-800 leading-none">{CURRENT_USER.name}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">Scopes: {CURRENT_USER.scopes.join(", ")}</p>
          </div>
        </div>
      </div>

      {/* KPI Cards: Operational & Governance Status */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Open Period */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Active Period</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Unlock className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-zinc-900 font-mono">
              {activePeriod ? activePeriod.periodCode : "None Open"}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
              <span>Ending in:</span>
              <span className="font-medium text-zinc-700">18 Days</span>
              <span className="text-zinc-300">|</span>
              <span className="text-emerald-700 font-medium">Accepting mutations</span>
            </div>
          </div>
        </div>

        {/* Pending Maker-Checker Close */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Checker Inbox</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-zinc-900 font-mono">
              {pendingClosePeriod ? pendingClosePeriod.periodCode : "0 Pending"}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              {pendingClosePeriod ? (
                <span className="text-amber-700 font-medium">Awaiting Manager Sign-off</span>
              ) : (
                <span>All staged requests cleared</span>
              )}
            </div>
          </div>
        </div>

        {/* Trust Account Remittance Volume */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Current Month Volume</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <FileSpreadsheet className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-zinc-900 font-mono">
              ฿
              {(activePeriod?.totalGrossPremium ?? 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              Net Commission: ฿
              {(activePeriod?.totalBrokerCommission ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Reconciliation Readiness */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Pre-Close Health</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
              <FileCheck2 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-zinc-900 font-mono">
                {activePeriod ? `${activePeriod.reconciliationScore}%` : "N/A"}
              </span>
              <span className="text-xs font-medium text-amber-600">
                {activePeriod?.checks.filter((c) => c.status !== "PASSED").length} warnings
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${activePeriod?.reconciliationScore ?? 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Period Registry Grid */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        {/* Table Filters & Toolbar */}
        <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between bg-zinc-50/50">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search period code (e.g. 2026-10)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-zinc-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-700 focus:border-zinc-400 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open (Accepting Writes)</option>
                <option value="PENDING_APPROVAL">Pending Checker Approval</option>
                <option value="CLOSED">Closed & Locked</option>
                <option value="LOCKED_AUDIT">Restricted Audit</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (activePeriod) setSelectedPeriodForChecks(activePeriod);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 shadow-sm"
            >
              <FileCheck2 className="h-3.5 w-3.5 text-zinc-500" />
              Inspect Current Checks
            </button>
          </div>
        </div>

        {/* Periods Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-600">
            <thead className="bg-zinc-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-200">
              <tr>
                <th className="px-4 py-3">Period / Range</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Gross Premium</th>
                <th className="px-4 py-3 text-right">Insurer Remittance</th>
                <th className="px-4 py-3 text-center">Pre-Close Checks</th>
                <th className="px-4 py-3">Governance / Audit Trail</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredPeriods.map((period) => {
                const isPending = period.status === "PENDING_APPROVAL";
                const isOpen = period.status === "OPEN";
                const isClosed = period.status === "CLOSED";
                const isAudit = period.status === "LOCKED_AUDIT";

                return (
                  <tr key={period.periodId} className="hover:bg-zinc-50/75 transition-colors">
                    {/* Period Identifier */}
                    <td className="px-4 py-3.5">
                      <div className="font-mono font-semibold text-zinc-900">{period.periodCode}</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        {period.startDate} to {period.endDate}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3.5">
                      {isOpen && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 font-medium text-emerald-700 text-[11px]">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          OPEN (Active)
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 font-medium text-amber-700 text-[11px]">
                          <Clock className="h-3 w-3 text-amber-600 animate-spin" />
                          PENDING CHECKER
                        </span>
                      )}
                      {isClosed && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-0.5 font-medium text-zinc-700 text-[11px]">
                          <Lock className="h-3 w-3 text-zinc-500" />
                          CLOSED (Locked)
                        </span>
                      )}
                      {isAudit && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-0.5 font-medium text-purple-700 text-[11px]">
                          <ShieldCheck className="h-3 w-3 text-purple-600" />
                          AUDIT REOPEN
                        </span>
                      )}
                    </td>

                    {/* Gross Premium */}
                    <td className="px-4 py-3.5 text-right font-mono text-zinc-900 font-medium">
                      ฿
                      {period.totalGrossPremium.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </td>

                    {/* Remittance */}
                    <td className="px-4 py-3.5 text-right font-mono text-zinc-700">
                      ฿
                      {period.totalInsurerRemittance.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </td>

                    {/* Pre-close Reconciliation Score */}
                    <td className="px-4 py-3.5 text-center">
                      {period.checks.length > 0 ? (
                        <button
                          onClick={() => setSelectedPeriodForChecks(period)}
                          className="inline-flex items-center gap-1 rounded bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 text-[11px] font-medium text-zinc-700"
                        >
                          {period.reconciliationScore}% Ready
                          <ChevronRight className="h-3 w-3 text-zinc-500" />
                        </button>
                      ) : (
                        <span className="text-zinc-400 text-[11px]">Validated & Archived</span>
                      )}
                    </td>

                    {/* Governance Info */}
                    <td className="px-4 py-3.5 text-[11px]">
                      {isPending && (
                        <div>
                          <div className="font-medium text-zinc-800">Maker: {period.makerName}</div>
                          <div className="text-zinc-400 font-mono mt-0.5">{period.makerStagedAt}</div>
                        </div>
                      )}
                      {isClosed && (
                        <div>
                          <div className="text-zinc-700">Checker: {period.checkerName}</div>
                          <div className="text-zinc-400 font-mono mt-0.5">{period.closedAt}</div>
                        </div>
                      )}
                      {isOpen && <span className="text-zinc-400 italic">No staged closure ticket</span>}
                      {isAudit && <span className="text-purple-700 font-medium">Auditor scope authorized</span>}
                    </td>

                    {/* Dynamic Action Buttons */}
                    <td className="px-4 py-3.5 text-right">
                      {isOpen && (
                        <button
                          onClick={() => {
                            setActionError(null);
                            setStageCloseModalPeriod(period);
                          }}
                          className="inline-flex items-center gap-1 rounded-md bg-zinc-900 hover:bg-zinc-800 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-sm"
                        >
                          <Lock className="h-3 w-3" />
                          Initiate Close
                        </button>
                      )}

                      {isPending && (
                        <button
                          onClick={() => {
                            setActionError(null);
                            setCheckerReviewPeriod(period);
                          }}
                          className="inline-flex items-center gap-1 rounded-md bg-amber-600 hover:bg-amber-700 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-sm"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          Checker Review
                        </button>
                      )}

                      {isClosed && (
                        <button
                          onClick={() => {
                            setActionError(null);
                            setReopenModalPeriod(period);
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-600"
                        >
                          <History className="h-3 w-3 text-zinc-400" />
                          Auditor Reopen
                        </button>
                      )}

                      {isAudit && <span className="text-purple-600 text-[11px] font-mono">EDITING_AUDIT</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL 1: Pre-Close Health Checklist Inspection --- */}
      {selectedPeriodForChecks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-xl border border-zinc-200 bg-white p-6 shadow-xl animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Pre-Close Health Check & Audit Gates</h3>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">
                  Period: {selectedPeriodForChecks.periodCode} ({selectedPeriodForChecks.startDate} to{" "}
                  {selectedPeriodForChecks.endDate})
                </p>
              </div>
              <button
                onClick={() => setSelectedPeriodForChecks(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto pr-1">
              {selectedPeriodForChecks.checks.map((chk) => (
                <div
                  key={chk.id}
                  className="flex items-start justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3.5 text-xs"
                >
                  <div className="flex items-start gap-3">
                    {chk.status === "PASSED" && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />}
                    {chk.status === "WARNING" && <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />}
                    {chk.status === "FAILED" && <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />}
                    <div>
                      <div className="font-semibold text-zinc-900">{chk.name}</div>
                      <p className="text-zinc-500 text-[11px] mt-0.5">{chk.description}</p>
                      {chk.unresolvedAmount !== undefined && chk.unresolvedAmount > 0 && (
                        <p className="text-amber-700 font-mono font-medium text-[11px] mt-1">
                          Outstanding Variance: ฿{chk.unresolvedAmount.toLocaleString()} ({chk.unresolvedCount} items)
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`rounded px-2 py-0.5 font-mono text-[10px] font-semibold ${
                      chk.status === "PASSED"
                        ? "bg-emerald-100 text-emerald-800"
                        : chk.status === "WARNING"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {chk.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-zinc-200 pt-4">
              <button
                onClick={() => setSelectedPeriodForChecks(null)}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: Maker Initiation Modal (Stage Period Close) --- */}
      {stageCloseModalPeriod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-xl border border-zinc-200 bg-white p-6 shadow-xl animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Stage Month-End Close (Maker Submission)</h3>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">
                  Target: {stageCloseModalPeriod.periodCode} (sys_financial_periods)
                </p>
              </div>
              <button
                onClick={() => setStageCloseModalPeriod(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Maker-Checker Protocol Interception (BRD 7.9)
                </div>
                <p className="mt-1 text-[11px] leading-relaxed">
                  Submitting this form does not immediately lock the ledger. It stages a request into{" "}
                  <code className="font-mono font-bold text-amber-950">approval_requests</code>. A separate Finance
                  Checker with <code className="font-mono font-bold text-amber-950">approval:execute</code> scopes must
                  verify the Bordereau reconciliations before the database prevents subsequent mutations.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Reconciliation Summary & Justification Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g., Bordereaux for Viriyah, AIA, and Muang Thai verified against bank batch traces. Suspense allocation cleared to 0 satang."
                  value={makerNotes}
                  onChange={(e) => setMakerNotes(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 p-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none font-sans"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-zinc-200 pt-4">
              <button
                onClick={() => setStageCloseModalPeriod(null)}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={handleInitiateCloseSubmit}
                className="rounded-lg bg-zinc-900 hover:bg-zinc-800 px-4 py-2 text-xs font-semibold text-white shadow-sm"
              >
                Submit to Checker Queue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: Checker Review & Execution Modal (The Segregation Gate) --- */}
      {checkerReviewPeriod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-xl border border-zinc-200 bg-white p-6 shadow-xl animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Execute Ledger Close (Checker Sign-off)</h3>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">
                  Approval Request: {checkerReviewPeriod.approvalRequestId} | Period: {checkerReviewPeriod.periodCode}
                </p>
              </div>
              <button
                onClick={() => setCheckerReviewPeriod(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Segregation Gate Visual Warning */}
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-500">Maker Identity (Submitter):</span>
                  <span className="font-mono font-medium text-zinc-800">{checkerReviewPeriod.makerName}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] mt-1.5">
                  <span className="text-zinc-500">Checker Identity (You):</span>
                  <span className="font-mono font-semibold text-blue-700">{CURRENT_USER.name}</span>
                </div>
                <div className="mt-2 border-t border-zinc-200 pt-2 flex items-center gap-1.5 text-[10px] text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span>Segregation Rule Verified: Maker and Checker UUIDs are distinct.</span>
                </div>
              </div>

              {/* Diff / Financial Breakdown Overview */}
              <div className="rounded-lg border border-zinc-200 p-3 space-y-2 bg-white text-xs">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Double-Entry Close Summary
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Gross Premium Collected:</span>
                  <span className="font-mono font-medium text-zinc-900">
                    ฿{checkerReviewPeriod.totalGrossPremium.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Insurer Trust Remittance (Outbound):</span>
                  <span className="font-mono font-medium text-zinc-900">
                    ฿{checkerReviewPeriod.totalInsurerRemittance.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Retained Broker Commission:</span>
                  <span className="font-mono font-medium text-emerald-600">
                    ฿{checkerReviewPeriod.totalBrokerCommission.toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Checker Execution Comments <span className="text-zinc-400 font-normal">(Mandatory on rejection)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Bank trace codes verified. Approved immutable close."
                  value={checkerComments}
                  onChange={(e) => setCheckerComments(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 p-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-between border-t border-zinc-200 pt-4">
              <button
                onClick={() => handleCheckerDecision("REJECTED")}
                className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
              >
                Reject to Maker
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setCheckerReviewPeriod(null)}
                  className="rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCheckerDecision("APPROVED")}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-sm"
                >
                  Confirm & Execute Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 4: Auditor Reopen Modal (Restricted Override) --- */}
      {reopenModalPeriod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-xl animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Auditor Post-Close Reopen Request</h3>
                <p className="text-xs text-purple-700 font-mono mt-0.5">
                  Target Period: {reopenModalPeriod.periodCode} (finance:auditor scope)
                </p>
              </div>
              <button
                onClick={() => setReopenModalPeriod(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-zinc-600 leading-relaxed">
                Modifying a historically locked financial calendar month is strictly governed by Thai Revenue Department
                (TRD) and OIC compliance. All subsequent entries will be tagged as retroactive audit journal rows.
              </p>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Audit Order Number / Regulatory Authority Reference <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., OIC-AUDIT-2026-Q3-019"
                  value={auditReopenReason}
                  onChange={(e) => setAuditReopenReason(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 p-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-zinc-200 pt-4">
              <button
                onClick={() => setReopenModalPeriod(null)}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReopenAuditSubmit}
                className="rounded-lg bg-purple-700 hover:bg-purple-800 px-4 py-2 text-xs font-semibold text-white shadow-sm"
              >
                Authorize Restricted Reopen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LedgerPeriodManagementPage;
