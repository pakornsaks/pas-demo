import React, { useMemo, useState } from "react";

// ============================================================================
// Types & Schemas (Mapped from SDD 4.8 & BRD 7.9, 8.9)
// ============================================================================

export type ApprovalStatus = "PENDING_APPROVAL" | "EXECUTED" | "REJECTED";

export type EntityType = "PRODUCT" | "PLAN" | "COMMISSION_TIER" | "WORKFLOW_TRANSITION" | "POLICY_CANCELLATION_REFUND";

export interface DiffField {
  fieldKey: string;
  fieldLabel: string;
  oldValue: string | number | boolean | null;
  newValue: string | number | boolean | null;
  type: "changed" | "added" | "removed";
}

export interface ApprovalRequestItem {
  request_id: string;
  entity_type: EntityType;
  entity_id: string;
  entity_name: string;
  parent_context?: {
    insurer_name?: string;
    lob?: string;
    product_name?: string;
  };
  draft_version_id: string;
  version_label: string; // e.g. "v1.0 → v2.0 DRAFT"
  requested_by: {
    admin_user_id: string;
    full_name: string;
    email: string;
    role: string;
  };
  submitted_at: string; // ISO 8601
  status: ApprovalStatus;
  request_notes: string;
  diff_data: DiffField[];
  raw_old_json: Record<string, unknown>;
  raw_new_json: Record<string, unknown>;
  is_high_risk: boolean;
}

// Current logged-in user simulation (Finance Manager / Checker)
const CURRENT_USER = {
  admin_user_id: "usr-checker-9901",
  full_name: "Pattarapol Sakorn",
  email: "pattarapol.s@brokerage.co.th",
  role: "Finance Manager / Approver",
};

// ============================================================================
// Mock Dataset (BRD Modules: Products, Commissions, Workflow, Refunds)
// ============================================================================

const MOCK_APPROVAL_ITEMS: ApprovalRequestItem[] = [
  {
    request_id: "REQ-2026-0041",
    entity_type: "PRODUCT",
    entity_id: "prod-mot-0091",
    entity_name: "Toyota Camry Motor Compulsory (CMI 1.10)",
    parent_context: {
      insurer_name: "Viriyah Insurance PLC",
      lob: "Motor (Private Car)",
      product_name: "Comprehensive Motor CMI 2026",
    },
    draft_version_id: "ver-prod-draft-22",
    version_label: "v1.2 ACTIVE → v2.0 DRAFT",
    requested_by: {
      admin_user_id: "usr-maker-0012",
      full_name: "Chatchai Vongsuwan",
      email: "chatchai.v@brokerage.co.th",
      role: "Product Manager (Maker)",
    },
    submitted_at: new Date(Date.now() - 52 * 3600 * 1000).toISOString(), // 52h ago (>48h SLA breach)
    status: "PENDING_APPROVAL",
    request_notes: "Updated base rate tariff and OIC Redbook boundary bounds for Q3 2026.",
    is_high_risk: true,
    diff_data: [
      { fieldKey: "base_premium", fieldLabel: "Base Premium (THB)", oldValue: 15400, newValue: 16800, type: "changed" },
      {
        fieldKey: "sum_insured_min",
        fieldLabel: "Sum Insured Min Ratio",
        oldValue: "70%",
        newValue: "75%",
        type: "changed",
      },
      { fieldKey: "is_cmi_bundled", fieldLabel: "CMI Auto-Bundle", oldValue: false, newValue: true, type: "changed" },
      {
        fieldKey: "discount_cap",
        fieldLabel: "Agent Flex Discount Cap",
        oldValue: "12%",
        newValue: null,
        type: "removed",
      },
    ],
    raw_old_json: { base_premium: 15400, sum_insured_min: 0.7, is_cmi_bundled: false, discount_cap: 0.12 },
    raw_new_json: { base_premium: 16800, sum_insured_min: 0.75, is_cmi_bundled: true },
  },
  {
    request_id: "REQ-2026-0045",
    entity_type: "COMMISSION_TIER",
    entity_id: "tier-agt-silver",
    entity_name: "Sub-Agent Tier 2 (Silver Wallet Settlement)",
    parent_context: {
      insurer_name: "Bangkok Insurance (BKI)",
      lob: "Health & Personal Accident",
      product_name: "Care Plus Senior Care",
    },
    draft_version_id: "ver-comm-8812",
    version_label: "v2.1 ACTIVE → v2.2 DRAFT",
    requested_by: {
      admin_user_id: "usr-checker-9901", // Created by CURRENT_USER to test Maker-Checker validation gate!
      full_name: "Pattarapol Sakorn",
      email: "pattarapol.s@brokerage.co.th",
      role: "Finance Officer (Maker)",
    },
    submitted_at: new Date(Date.now() - 28 * 3600 * 1000).toISOString(), // 28h ago (Warning SLA)
    status: "PENDING_APPROVAL",
    request_notes: "Adjusted WHT withholding deduction threshold & base commission rate (+1.5%).",
    is_high_risk: false,
    diff_data: [
      {
        fieldKey: "base_commission_percent",
        fieldLabel: "Base Commission %",
        oldValue: "15.0%",
        newValue: "16.5%",
        type: "changed",
      },
      {
        fieldKey: "settlement_mode",
        fieldLabel: "Settlement Mode",
        oldValue: "GROSS",
        newValue: "NET",
        type: "changed",
      },
      {
        fieldKey: "clawback_grace_days",
        fieldLabel: "Clawback Grace Period",
        oldValue: "30 Days",
        newValue: "45 Days",
        type: "changed",
      },
    ],
    raw_old_json: { base_commission_percent: 15.0, settlement_mode: "GROSS", clawback_grace_days: 30 },
    raw_new_json: { base_commission_percent: 16.5, settlement_mode: "NET", clawback_grace_days: 45 },
  },
  {
    request_id: "REQ-2026-0048",
    entity_type: "POLICY_CANCELLATION_REFUND",
    entity_id: "pol-uuid-2026-0919",
    entity_name: "Policy #POL-2026-8812 (Insurer Refund Case B)",
    parent_context: {
      insurer_name: "Muang Thai Insurance",
      lob: "Travel Multi-Trip Worldwide",
      product_name: "Global Safe Traveler",
    },
    draft_version_id: "ver-pol-can-01",
    version_label: "ACTIVE → CANCELLED (Pro-Rata)",
    requested_by: {
      admin_user_id: "usr-ops-5541",
      full_name: "Siriporn Kittiwat",
      email: "siriporn.k@brokerage.co.th",
      role: "Operations Admin (Maker)",
    },
    submitted_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(), // 6h ago
    status: "PENDING_APPROVAL",
    request_notes: "Customer trip cancelled due to visa denial. Pro-rata refund approved by carrier via email.",
    is_high_risk: true,
    diff_data: [
      {
        fieldKey: "policy_status",
        fieldLabel: "Status Transition",
        oldValue: "ACTIVE",
        newValue: "CANCELLED",
        type: "changed",
      },
      {
        fieldKey: "insurer_refund_amount",
        fieldLabel: "Carrier Refund Fiat Amount",
        oldValue: "0.00 THB",
        newValue: "8,450.00 THB",
        type: "added",
      },
      {
        fieldKey: "agent_commission_clawback",
        fieldLabel: "Agent Clawback (Debit)",
        oldValue: "0.00 THB",
        newValue: "-1,267.50 THB",
        type: "added",
      },
    ],
    raw_old_json: { status: "ACTIVE", insurer_refund_amount: 0 },
    raw_new_json: { status: "CANCELLED", insurer_refund_amount: 8450.0, agent_clawback: -1267.5 },
  },
  {
    request_id: "REQ-2026-0050",
    entity_type: "WORKFLOW_TRANSITION",
    entity_id: "wf-trans-104",
    entity_name: "Application: PENDING_REVIEW → QUOTATION_RATED",
    parent_context: {
      insurer_name: "Universal Engine Core",
      lob: "Global PAS Workflow",
      product_name: "State Machine Permission Gate",
    },
    draft_version_id: "ver-wf-992",
    version_label: "Rule Matrix v4 → v5",
    requested_by: {
      admin_user_id: "usr-ops-5541",
      full_name: "Siriporn Kittiwat",
      email: "siriporn.k@brokerage.co.th",
      role: "Operations Admin (Maker)",
    },
    submitted_at: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    status: "PENDING_APPROVAL",
    request_notes: "Restrict transition permissions: Senior Underwriter role required if loading exceeds 20%.",
    is_high_risk: false,
    diff_data: [
      {
        fieldKey: "condition_logic",
        fieldLabel: "Condition JSON Logic",
        oldValue: '{"loading_max": 15}',
        newValue: '{"loading_max": 20, "role_req": "SR_UW"}',
        type: "changed",
      },
      {
        fieldKey: "allow_email_override",
        fieldLabel: "Allow Offline Email Bypass",
        oldValue: false,
        newValue: true,
        type: "changed",
      },
    ],
    raw_old_json: { loading_max: 15, allow_email_override: false },
    raw_new_json: { loading_max: 20, role_req: "SR_UW", allow_email_override: true },
  },
];

// ============================================================================
// Main Page Component
// ============================================================================

export const ApprovalInboxPage: React.FC = () => {
  const [items, setItems] = useState<ApprovalRequestItem[]>(MOCK_APPROVAL_ITEMS);
  const [selectedEntityFilter, setSelectedEntityFilter] = useState<string>("ALL");
  const [selectedStatusTab, setSelectedStatusTab] = useState<ApprovalStatus | "ALL">("PENDING_APPROVAL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Modal & Inspector States
  const [activeDiffItem, setActiveDiffItem] = useState<ApprovalRequestItem | null>(null);
  const [rejectModalItem, setRejectModalItem] = useState<ApprovalRequestItem | null>(null);
  const [rejectionComment, setRejectionComment] = useState("");
  const [actionFeedback, setActionFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Quick feedback helper
  const showFeedback = (message: string, type: "success" | "error" = "success") => {
    setActionFeedback({ message, type });
    setTimeout(() => setActionFeedback(null), 4500);
  };

  // --------------------------------------------------------------------------
  // SLA & Badge Calculations
  // --------------------------------------------------------------------------
  const getSlaMetrics = (submittedAtIso: string) => {
    const elapsedHours = Math.floor((Date.now() - new Date(submittedAtIso).getTime()) / (1000 * 60 * 60));
    if (elapsedHours >= 48) {
      return {
        label: `${elapsedHours}h elapsed (SLA Breached)`,
        level: "RED",
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
        dotClass: "bg-rose-500 animate-pulse",
      };
    }
    if (elapsedHours >= 24) {
      return {
        label: `${elapsedHours}h elapsed (Warning)`,
        level: "YELLOW",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
        dotClass: "bg-amber-500",
      };
    }
    return {
      label: `${elapsedHours}h elapsed`,
      level: "GREEN",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dotClass: "bg-emerald-500",
    };
  };

  const entityIcon = (type: EntityType) => {
    switch (type) {
      case "PRODUCT":
      case "PLAN":
        return (
          <span className="p-1.5 rounded-md bg-blue-50 text-blue-600 border border-blue-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </span>
        );
      case "COMMISSION_TIER":
        return (
          <span className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </span>
        );
      case "POLICY_CANCELLATION_REFUND":
        return (
          <span className="p-1.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
              />
            </svg>
          </span>
        );
      case "WORKFLOW_TRANSITION":
        return (
          <span className="p-1.5 rounded-md bg-purple-50 text-purple-600 border border-purple-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
          </span>
        );
    }
  };

  // --------------------------------------------------------------------------
  // Maker-Checker Decision Executions (SDD 3.5.5 & BRD BO-08)
  // --------------------------------------------------------------------------
  const executeDecision = (requestId: string, action: "APPROVED" | "REJECTED", comments: string) => {
    const targetItem = items.find((i) => i.request_id === requestId);
    if (!targetItem) return;

    // Hard Constraint Check: Maker != Checker
    if (action === "APPROVED" && targetItem.requested_by.admin_user_id === CURRENT_USER.admin_user_id) {
      showFeedback(
        "Segregation of Duties Breach: You cannot approve your own submission (BRD BO-08 / SDD 5.14).",
        "error",
      );
      return;
    }

    if (action === "REJECTED" && !comments.trim()) {
      showFeedback(
        "Rejection aborted: A mandatory justification reason is required for audit logs (BRD 7.9).",
        "error",
      );
      return;
    }

    // Execute state swap
    setItems((prev) =>
      prev.map((item) =>
        item.request_id === requestId ? { ...item, status: action === "APPROVED" ? "EXECUTED" : "REJECTED" } : item,
      ),
    );

    setActiveDiffItem(null);
    setRejectModalItem(null);
    setRejectionComment("");
    showFeedback(
      `Request ${requestId} successfully ${action === "APPROVED" ? "Approved & Deployed" : "Rejected"}. Written to immutable audit_logs.`,
    );
  };

  // Bulk Quick Approve (Low-risk non-self items)
  const handleBulkApprove = () => {
    const validItems = items.filter(
      (item) =>
        selectedItemIds.includes(item.request_id) &&
        item.status === "PENDING_APPROVAL" &&
        item.requested_by.admin_user_id !== CURRENT_USER.admin_user_id &&
        !item.is_high_risk,
    );

    if (validItems.length === 0) {
      showFeedback(
        "No eligible items selected. High-risk items or self-made requests cannot be bulk-approved.",
        "error",
      );
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        validItems.some((v) => v.request_id === item.request_id) ? { ...item, status: "EXECUTED" } : item,
      ),
    );
    setSelectedItemIds([]);
    showFeedback(`Bulk Approved ${validItems.length} low-risk configuration change(s).`);
  };

  // Filtered List
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesEntity = selectedEntityFilter === "ALL" || item.entity_type === selectedEntityFilter;
      const matchesStatus = selectedStatusTab === "ALL" || item.status === selectedStatusTab;
      const matchesSearch =
        item.entity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.request_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.requested_by.full_name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesEntity && matchesStatus && matchesSearch;
    });
  }, [items, selectedEntityFilter, selectedStatusTab, searchQuery]);

  // High-level KPI badges
  const pendingCount = items.filter((i) => i.status === "PENDING_APPROVAL").length;
  const slaBreachedCount = items.filter(
    (i) => i.status === "PENDING_APPROVAL" && getSlaMetrics(i.submitted_at).level === "RED",
  ).length;

  return (
    // Note: -mt-6 counters the parent <main className="p-6"> top padding to ensure
    // zero padding on the top container, aligning flush with the light header.
    <div className="-mt-6 -mx-6 flex flex-col min-h-[calc(100vh-3.5rem)] bg-zinc-50 font-sans text-zinc-900">
      {/* ==================================================================== */}
      {/* 1. Flush Top Page Header (No Top Padding) */}
      {/* ==================================================================== */}
      <header className="bg-white border-b border-zinc-200 px-6 py-4 sticky top-0 z-20 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                Maker-Checker Hub
              </span>
              <span className="text-zinc-300">/</span>
              <span className="text-xs font-medium text-zinc-500">Governance & Control</span>
            </div>
            <h1 className="text-xl font-bold text-zinc-900 mt-1 flex items-center gap-2.5">
              Approval Inbox
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
                {pendingCount} Pending Decisions
              </span>
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Dual-authorization queue enforcing Segregation of Duties (SCD Type 2 snapshot approvals).
            </p>
          </div>

          {/* Quick Context & Active User Info */}
          <div className="flex items-center gap-3">
            {slaBreachedCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>{slaBreachedCount} Request(s) Over 48h SLA</span>
              </div>
            )}

            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs">
              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                PS
              </div>
              <div>
                <p className="font-semibold text-zinc-800 leading-tight">{CURRENT_USER.full_name}</p>
                <p className="text-[10px] text-zinc-500 leading-tight">{CURRENT_USER.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Global Feedback Toast */}
        {actionFeedback && (
          <div
            className={`mt-3 px-4 py-2 rounded-lg text-xs font-medium flex items-center justify-between border ${
              actionFeedback.type === "error"
                ? "bg-rose-50 text-rose-800 border-rose-200"
                : "bg-emerald-50 text-emerald-800 border-emerald-200"
            }`}
          >
            <span>{actionFeedback.message}</span>
            <button
              onClick={() => setActionFeedback(null)}
              className="text-zinc-400 hover:text-zinc-700 ml-4 font-bold"
            >
              ×
            </button>
          </div>
        )}
      </header>

      {/* ==================================================================== */}
      {/* 2. Filter Bar & Quick Controls */}
      {/* ==================================================================== */}
      <div className="px-6 py-4 bg-white border-b border-zinc-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200 text-xs">
          {(["PENDING_APPROVAL", "EXECUTED", "REJECTED", "ALL"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setSelectedStatusTab(tab);
                setSelectedItemIds([]);
              }}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                selectedStatusTab === tab ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {tab === "PENDING_APPROVAL" && "Pending Reviews"}
              {tab === "EXECUTED" && "Approved (Executed)"}
              {tab === "REJECTED" && "Rejected"}
              {tab === "ALL" && "All History"}
            </button>
          ))}
        </div>

        {/* Filter Dropdown, Search & Bulk Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Entity Type Filter */}
          <select
            value={selectedEntityFilter}
            onChange={(e) => setSelectedEntityFilter(e.target.value)}
            className="text-xs bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
          >
            <option value="ALL">All Entity Scopes</option>
            <option value="PRODUCT">Products & Plans</option>
            <option value="COMMISSION_TIER">Commission & Wallets</option>
            <option value="POLICY_CANCELLATION_REFUND">Refunds & Cancellations</option>
            <option value="WORKFLOW_TRANSITION">Dynamic Workflow Transitions</option>
          </select>

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search ID, Maker or Target..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs bg-zinc-50 border border-zinc-200 rounded-lg pl-8 pr-3 py-1.5 text-zinc-800 placeholder-zinc-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-56"
            />
            <svg
              className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5"
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

          {/* Bulk Approve Action */}
          {selectedItemIds.length > 0 && selectedStatusTab === "PENDING_APPROVAL" && (
            <button
              onClick={handleBulkApprove}
              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-xs"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Quick Approve ({selectedItemIds.length})
            </button>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. Main Data Table */}
      {/* ==================================================================== */}
      <div className="p-6 flex-1 overflow-x-auto">
        <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                    checked={filteredItems.length > 0 && selectedItemIds.length === filteredItems.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItemIds(filteredItems.map((i) => i.request_id));
                      } else {
                        setSelectedItemIds([]);
                      }
                    }}
                  />
                </th>
                <th className="py-3 px-4">Entity & Scope</th>
                <th className="py-3 px-4">Target Details & Hierarchy</th>
                <th className="py-3 px-4">Version Delta</th>
                <th className="py-3 px-4">Maker (Requested By)</th>
                <th className="py-3 px-4">SLA Timer</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-700 font-normal">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400">
                    <div className="flex flex-col items-center justify-center">
                      <svg
                        className="w-10 h-10 text-zinc-300 mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <p className="font-medium text-zinc-500">No approval requests found matching filter</p>
                      <p className="text-[11px] text-zinc-400">
                        All configurations are currently in sync with production.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const sla = getSlaMetrics(item.submitted_at);
                  const isMaker = item.requested_by.admin_user_id === CURRENT_USER.admin_user_id;
                  const isSelected = selectedItemIds.includes(item.request_id);

                  return (
                    <tr
                      key={item.request_id}
                      className={`hover:bg-zinc-50/70 transition-colors ${isSelected ? "bg-indigo-50/30" : ""}`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItemIds((prev) => [...prev, item.request_id]);
                            } else {
                              setSelectedItemIds((prev) => prev.filter((id) => id !== item.request_id));
                            }
                          }}
                        />
                      </td>

                      {/* Entity & Scope */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {entityIcon(item.entity_type)}
                          <div>
                            <span className="font-semibold text-zinc-800 block">
                              {item.entity_type.replace(/_/g, " ")}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-400">{item.request_id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Target Item Name & Context */}
                      <td className="py-3 px-4">
                        <div className="max-w-xs">
                          <p className="font-medium text-zinc-900 truncate">{item.entity_name}</p>
                          {item.parent_context && (
                            <p className="text-[11px] text-zinc-500 truncate">
                              {item.parent_context.insurer_name} • {item.parent_context.lob}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Version Delta */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                          {item.version_label}
                        </span>
                      </td>

                      {/* Maker */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-zinc-800">{item.requested_by.full_name}</span>
                            {isMaker && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-semibold border border-amber-200">
                                You (Maker)
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-400 block">{item.requested_by.role}</span>
                        </div>
                      </td>

                      {/* SLA Timer */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${sla.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${sla.dotClass}`} />
                          {sla.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {item.status === "PENDING_APPROVAL" && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            Pending Review
                          </span>
                        )}
                        {item.status === "EXECUTED" && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Executed & Live
                          </span>
                        )}
                        {item.status === "REJECTED" && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            Rejected
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Diff Button */}
                          <button
                            onClick={() => setActiveDiffItem(item)}
                            className="px-2.5 py-1 rounded bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 font-medium transition flex items-center gap-1 shadow-2xs"
                          >
                            <svg
                              className="w-3.5 h-3.5 text-zinc-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            View Diff
                          </button>

                          {/* Quick Decision Buttons (Only if Pending) */}
                          {item.status === "PENDING_APPROVAL" && (
                            <>
                              <button
                                disabled={isMaker}
                                onClick={() =>
                                  executeDecision(item.request_id, "APPROVED", "Standard quick approval verification.")
                                }
                                title={
                                  isMaker
                                    ? "Cannot approve own request (Maker-Checker violation)"
                                    : "Approve & Activate"
                                }
                                className={`px-2 py-1 rounded font-medium border text-xs transition ${
                                  isMaker
                                    ? "bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                }`}
                              >
                                Approve
                              </button>

                              <button
                                onClick={() => setRejectModalItem(item)}
                                className="px-2 py-1 rounded font-medium border text-xs bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 transition"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. Side-by-Side "Diff Viewer" Modal (BRD Screen 8.9.2) */}
      {/* ==================================================================== */}
      {activeDiffItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/80 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-200 text-zinc-700">
                    {activeDiffItem.request_id}
                  </span>
                  <span className="text-xs text-zinc-500 font-medium">
                    Target: {activeDiffItem.entity_type} ({activeDiffItem.entity_id})
                  </span>
                </div>
                <h3 className="text-base font-bold text-zinc-900 mt-1">
                  Reviewing Change: {activeDiffItem.entity_name}
                </h3>
                {activeDiffItem.parent_context && (
                  <p className="text-xs text-zinc-500">
                    Insurer: <strong className="text-zinc-700">{activeDiffItem.parent_context.insurer_name}</strong> |
                    LOB: {activeDiffItem.parent_context.lob}
                  </p>
                )}
              </div>

              <button
                onClick={() => setActiveDiffItem(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Segregation of Duties Warning Banner */}
            {activeDiffItem.requested_by.admin_user_id === CURRENT_USER.admin_user_id && (
              <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-2 text-xs text-amber-800">
                <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span>
                  <strong>Maker-Checker Enforcement (BRD BO-08):</strong> You submitted this change draft. The system
                  physically prevents you from approving your own request. Another authorized manager must sign off.
                </span>
              </div>
            )}

            {/* Modal Body: Split Screen Diff (Old vs New) */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* Submission Notes */}
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-xs">
                <span className="font-semibold text-zinc-700 block mb-0.5">Maker Justification & Audit Notes:</span>
                <p className="text-zinc-600">{activeDiffItem.request_notes}</p>
                <div className="mt-2 text-[11px] text-zinc-400">
                  Requested by: <strong>{activeDiffItem.requested_by.full_name}</strong> (
                  {activeDiffItem.requested_by.role}) on {new Date(activeDiffItem.submitted_at).toLocaleString()}
                </div>
              </div>

              {/* Side-by-side Diff Container */}
              <div className="border border-zinc-200 rounded-xl overflow-hidden">
                <div className="grid grid-cols-2 bg-zinc-100 border-b border-zinc-200 text-xs font-semibold text-zinc-700">
                  <div className="p-3 border-r border-zinc-200 flex items-center justify-between">
                    <span>Active Version (Current Production)</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-zinc-200 text-zinc-600 rounded">
                      v1.0 (Old)
                    </span>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <span>Proposed Version (Staged Draft)</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded font-bold">
                      Draft Snapshot
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-zinc-200">
                  {activeDiffItem.diff_data.map((field) => (
                    <div key={field.fieldKey} className="grid grid-cols-2 text-xs">
                      {/* Left Panel: Old Values */}
                      <div className="p-3 bg-zinc-50/60 border-r border-zinc-200">
                        <span className="text-[11px] font-medium text-zinc-400 block mb-1">
                          {field.fieldLabel} ({field.fieldKey})
                        </span>
                        <div
                          className={`font-mono px-2 py-1 rounded inline-block text-xs ${
                            field.type === "removed"
                              ? "bg-rose-50 text-rose-700 border border-rose-200 line-through"
                              : field.type === "changed"
                                ? "bg-zinc-100 text-zinc-800"
                                : "text-zinc-400 italic"
                          }`}
                        >
                          {field.oldValue !== null ? String(field.oldValue) : "(None / Unset)"}
                        </div>
                      </div>

                      {/* Right Panel: New Values */}
                      <div
                        className={`p-3 ${
                          field.type === "added"
                            ? "bg-emerald-50/40"
                            : field.type === "changed"
                              ? "bg-amber-50/30"
                              : "bg-white"
                        }`}
                      >
                        <span className="text-[11px] font-medium text-zinc-400 block mb-1">New Value</span>
                        <div
                          className={`font-mono px-2 py-1 rounded inline-block text-xs font-semibold ${
                            field.type === "added"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : field.type === "changed"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "text-rose-500 line-through"
                          }`}
                        >
                          {field.newValue !== null ? String(field.newValue) : "(Removed)"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* JSON Payload Preview Accordion */}
              <details className="text-xs text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-lg p-3">
                <summary className="font-semibold text-zinc-700 cursor-pointer">
                  Inspect Raw JSON Payload (Copy-on-Write Delta)
                </summary>
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-zinc-200 font-mono text-[11px]">
                  <div>
                    <span className="text-zinc-400 block mb-1">Raw Old State:</span>
                    <pre className="p-2 bg-white rounded border border-zinc-200 overflow-x-auto">
                      {JSON.stringify(activeDiffItem.raw_old_json, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-1">Raw Proposed Delta:</span>
                    <pre className="p-2 bg-white rounded border border-zinc-200 overflow-x-auto text-indigo-700">
                      {JSON.stringify(activeDiffItem.raw_new_json, null, 2)}
                    </pre>
                  </div>
                </div>
              </details>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
              <button
                onClick={() => setActiveDiffItem(null)}
                className="px-4 py-2 rounded-lg border border-zinc-300 text-zinc-700 font-medium hover:bg-zinc-100 text-xs transition"
              >
                Close View
              </button>

              {activeDiffItem.status === "PENDING_APPROVAL" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setRejectModalItem(activeDiffItem);
                      setActiveDiffItem(null);
                    }}
                    className="px-4 py-2 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 font-semibold hover:bg-rose-100 text-xs transition"
                  >
                    Reject (Requires Reason)
                  </button>

                  <button
                    disabled={activeDiffItem.requested_by.admin_user_id === CURRENT_USER.admin_user_id}
                    onClick={() =>
                      executeDecision(
                        activeDiffItem.request_id,
                        "APPROVED",
                        "Checker verified and approved via Visual Diff.",
                      )
                    }
                    className={`px-5 py-2 rounded-lg font-semibold text-xs shadow-xs transition ${
                      activeDiffItem.requested_by.admin_user_id === CURRENT_USER.admin_user_id
                        ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                  >
                    Approve & Deploy (SCD Type 2 Swap)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. Rejection Reasoning Modal (Mandatory Comments BRD 7.9) */}
      {/* ==================================================================== */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-zinc-200 rounded-xl shadow-xl w-full max-w-md p-6">
            <h4 className="text-base font-bold text-zinc-900">Reject Change Request</h4>
            <p className="text-xs text-zinc-500 mt-1">
              Provide mandatory reasoning for rejecting <strong>{rejectModalItem.request_id}</strong>. This feedback is
              permanently saved in <code>approval_logs</code> for the original maker to address.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Rejection Reason (Mandatory)*</label>
              <textarea
                rows={3}
                placeholder="e.g., Base premium calculation violates Redbook minimum boundaries. Re-adjust before resubmission."
                value={rejectionComment}
                onChange={(e) => setRejectionComment(e.target.value)}
                className="w-full text-xs p-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 text-zinc-800"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setRejectModalItem(null);
                  setRejectionComment("");
                }}
                className="px-3.5 py-2 rounded-lg border border-zinc-300 text-zinc-700 font-medium hover:bg-zinc-100 text-xs transition"
              >
                Cancel
              </button>
              <button
                disabled={!rejectionComment.trim()}
                onClick={() => executeDecision(rejectModalItem.request_id, "REJECTED", rejectionComment)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  !rejectionComment.trim()
                    ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                    : "bg-rose-600 text-white hover:bg-rose-700"
                }`}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalInboxPage;
