import React, { useState } from "react";

// ============================================================================
// Types & Schema Interfaces (SDD Section 4.8 / BRD 7.9)
// ============================================================================

export type ApprovalStatus = "PENDING_APPROVAL" | "EXECUTED" | "REJECTED";
export type EntityType = "PRODUCT" | "PLAN" | "UNDERWRITING_RULE" | "COMMISSION_TIER" | "VEHICLE";
export type DiffChangeType = "ADDED" | "REMOVED" | "MODIFIED" | "UNCHANGED";

export interface DiffField {
  id: string;
  fieldLabel: string;
  fieldKey: string;
  oldValue: string | number | boolean | null;
  newValue: string | number | boolean | null;
  changeType: DiffChangeType;
  category: "CORE" | "PRICING" | "SETTLEMENT" | "UNDERWRITING";
}

export interface BenefitDiffItem {
  id: string;
  benefitName: string;
  groupName: string;
  oldCoverage: string | null;
  newCoverage: string | null;
  changeType: DiffChangeType;
}

export interface ApprovalRequestDetail {
  requestId: string;
  entityType: EntityType;
  entityName: string;
  parentEntityName?: string;
  insurerName: string;
  lob: "MOTOR" | "TRAVEL" | "HEALTH" | "PA" | "FIRE" | "CUSTOM";
  activeVersionId: string;
  draftVersionId: string;
  requestedBy: {
    uuid: string;
    fullName: string;
    email: string;
    role: string;
  };
  submittedAt: string;
  slaDeadlineHours: number;
  status: ApprovalStatus;
  requestNotes: string;
  diffSummary: {
    added: number;
    removed: number;
    modified: number;
  };
}

// ============================================================================
// Mock Data (Representing Product Version Forking v1.0 -> v2.0)
// ============================================================================

const MOCK_APPROVAL_TICKET: ApprovalRequestDetail = {
  requestId: "REQ-2026-8891-MC",
  entityType: "PRODUCT",
  entityName: "MSIG Travel Easy - Worldwide Deluxe Plan",
  parentEntityName: "MSIG Travel Easy (Package ID: PRD-TRV-001)",
  insurerName: "MSIG Insurance (Thailand) PCL",
  lob: "TRAVEL",
  activeVersionId: "v1.0 (Live Production)",
  draftVersionId: "v2.0 (Draft Revision #3)",
  requestedBy: {
    uuid: "usr-maker-8841-uuid",
    fullName: "Pakornsak Supamongkonchaikul",
    email: "pakornsak@singhabroker.co.th",
    role: "Product Specialist (Maker)",
  },
  submittedAt: "2026-10-13 14:32:00",
  slaDeadlineHours: 48,
  status: "PENDING_APPROVAL",
  requestNotes:
    "Updated Q4 2026 travel premium rates, increased medical evacuation limit, and adjusted Commission Class tier from Silver to Gold per new insurer contract agreement.",
  diffSummary: {
    added: 2,
    removed: 1,
    modified: 4,
  },
};

const MOCK_CORE_DIFFS: DiffField[] = [
  {
    id: "1",
    fieldLabel: "Plan Display Name",
    fieldKey: "plan_name",
    oldValue: "Worldwide Deluxe Plan",
    newValue: "Worldwide Deluxe Plan (Plus)",
    changeType: "MODIFIED",
    category: "CORE",
  },
  {
    id: "2",
    fieldLabel: "Base Net Premium (THB)",
    fieldKey: "base_premium",
    oldValue: "850.00",
    newValue: "950.00",
    changeType: "MODIFIED",
    category: "PRICING",
  },
  {
    id: "3",
    fieldLabel: "Commission Tier",
    fieldKey: "commission_tier",
    oldValue: "Silver (12.0%)",
    newValue: "Gold (15.0%)",
    changeType: "MODIFIED",
    category: "PRICING",
  },
  {
    id: "4",
    fieldLabel: "Settlement Payee Type",
    fieldKey: "payee_type",
    oldValue: "INSURER",
    newValue: "BROKER",
    changeType: "MODIFIED",
    category: "SETTLEMENT",
  },
  {
    id: "5",
    fieldLabel: "Max Applicant Age Limit",
    fieldKey: "max_age_limit",
    oldValue: "70 Years",
    newValue: "75 Years",
    changeType: "MODIFIED",
    category: "UNDERWRITING",
  },
  {
    id: "6",
    fieldLabel: "Red Plate Issuance Allowed",
    fieldKey: "allow_red_plate",
    oldValue: "NO",
    newValue: "NO",
    changeType: "UNCHANGED",
    category: "UNDERWRITING",
  },
  {
    id: "7",
    fieldLabel: "Emergency Overseas Cash Benefit",
    fieldKey: "overseas_emergency_cash",
    oldValue: null,
    newValue: "15,000 THB / Incident",
    changeType: "ADDED",
    category: "PRICING",
  },
];

const MOCK_BENEFIT_DIFFS: BenefitDiffItem[] = [
  {
    id: "b1",
    benefitName: "Medical Expenses (Accident & Sickness)",
    groupName: "Section 1: Medical & Assistance",
    oldCoverage: "1,500,000 THB",
    newCoverage: "2,000,000 THB",
    changeType: "MODIFIED",
  },
  {
    id: "b2",
    benefitName: "Emergency Medical Evacuation & Repatriation",
    groupName: "Section 1: Medical & Assistance",
    oldCoverage: "1,000,000 THB",
    newCoverage: "2,000,000 THB",
    changeType: "MODIFIED",
  },
  {
    id: "b3",
    benefitName: "Trip Cancellation & Curtailment",
    groupName: "Section 2: Travel Inconvenience",
    oldCoverage: null,
    newCoverage: "50,000 THB",
    changeType: "ADDED",
  },
  {
    id: "b4",
    benefitName: "Baggage Loss & Personal Effects",
    groupName: "Section 2: Travel Inconvenience",
    oldCoverage: "20,000 THB (Max 2,000/item)",
    newCoverage: "35,000 THB (Max 3,500/item)",
    changeType: "MODIFIED",
  },
  {
    id: "b5",
    benefitName: "Amateur Winter Sports Exclusion Waiver",
    groupName: "Section 3: Special Riders",
    oldCoverage: "Included (Zero Deductible)",
    newCoverage: null,
    changeType: "REMOVED",
  },
];

const MOCK_OLD_JSON = `{
  "payee_type": "INSURER",
  "base_premium": 850.00,
  "max_age": 70,
  "commission_rate": 0.12,
  "underwriting_rules": {
    "yellow_channel_triggers": [
      { "field": "age", "op": ">", "value": 70 },
      { "field": "pre_existing_heart_condition", "op": "==", "value": true }
    ]
  }
}`;

const MOCK_NEW_JSON = `{
  "payee_type": "BROKER",
  "base_premium": 950.00,
  "max_age": 75,
  "commission_rate": 0.15,
  "underwriting_rules": {
    "yellow_channel_triggers": [
      { "field": "age", "op": ">", "value": 75 },
      { "field": "pre_existing_heart_condition", "op": "==", "value": true }
    ],
    "auto_approve_schengen_visa": true
  }
}`;

// ============================================================================
// Main Page Component
// ============================================================================

export const DiffViewerPage: React.FC = () => {
  // Navigation / View Tabs
  const [activeTab, setActiveTab] = useState<"VISUAL" | "BENEFITS" | "RAW_JSON">("VISUAL");
  const [selectedTreeNode, setSelectedTreeNode] = useState<string>("plan_rates");

  // Simulated Logged-In User State (Test Segregation of Duties Maker vs Checker)
  const [currentActor, setCurrentActor] = useState<{ uuid: string; name: string; role: string }>({
    uuid: "usr-checker-9921-uuid", // Different from maker -> ALLOWED to approve
    name: "Supaporn (Senior Underwriting Manager)",
    role: "Checker",
  });

  // Action Modals
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [showApproveModal, setShowApproveModal] = useState<boolean>(false);
  const [rejectionComments, setRejectionComments] = useState<string>("");
  const [activationOption, setActivationOption] = useState<"IMMEDIATE" | "SCHEDULED">("IMMEDIATE");
  const [scheduledDate, setScheduledDate] = useState<string>("2026-11-01");

  // Decision State
  const [decisionState, setDecisionState] = useState<"IDLE" | "EXECUTING" | "COMPLETED">("IDLE");
  const [finalResult, setFinalResult] = useState<{ status: "APPROVED" | "REJECTED"; message: string } | null>(null);

  // Maker-Checker Segregation of Duties Check
  const isMakerViewingOwnRequest = currentActor.uuid === MOCK_APPROVAL_TICKET.requestedBy.uuid;

  // Handlers
  const handleApprove = () => {
    setDecisionState("EXECUTING");
    setTimeout(() => {
      setDecisionState("COMPLETED");
      setShowApproveModal(false);
      setFinalResult({
        status: "APPROVED",
        message:
          activationOption === "IMMEDIATE"
            ? "Version v1.0 capped (ARCHIVED). Version v2.0 promoted to ACTIVE in production."
            : `Scheduled activation queued for ${scheduledDate} 00:00:00 UTC.`,
      });
    }, 700);
  };

  const handleReject = () => {
    if (!rejectionComments.trim()) return;
    setDecisionState("EXECUTING");
    setTimeout(() => {
      setDecisionState("COMPLETED");
      setShowRejectModal(false);
      setFinalResult({
        status: "REJECTED",
        message: "Draft rejected. Modification unlocked for maker resubmission with recorded feedback.",
      });
    }, 700);
  };

  return (
    // "-mt-6 -mx-6": Offsets parent <main className="p-6"> to ensure zero padding on top container
    <div className="-mt-6 -mx-6 min-h-[calc(100vh-3.5rem)] flex flex-col bg-zinc-50 text-zinc-900 font-sans antialiased">
      {/* ====================================================================== */}
      {/* 1. TOP DOCKED HEADER BAR (Flush with backoffice header)                */}
      {/* ====================================================================== */}
      <div className="bg-white border-b border-zinc-200 px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 transition-colors"
            title="Return to Approvals Inbox"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200 uppercase tracking-wide">
                Ticket #{MOCK_APPROVAL_TICKET.requestId}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                {MOCK_APPROVAL_TICKET.entityType} VERSIONING
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                PENDING CHECKER REVIEW
              </span>
            </div>
            <h1 className="text-lg font-bold text-zinc-900 mt-1 flex items-center gap-2">
              Reviewing Changes: {MOCK_APPROVAL_TICKET.entityName}
            </h1>
          </div>
        </div>

        {/* Actor Switcher for Testing Segregation of Duties */}
        <div className="flex items-center gap-3 bg-zinc-50 p-2 rounded-lg border border-zinc-200">
          <div className="text-right">
            <div className="text-[11px] text-zinc-500 font-medium">Logged in as (Checker Gate Simulation):</div>
            <div className="text-xs font-bold text-zinc-800">{currentActor.name}</div>
          </div>
          <button
            onClick={() => {
              if (currentActor.role === "Checker") {
                setCurrentActor({
                  uuid: "usr-maker-8841-uuid", // Match maker
                  name: "Pakornsak (Product Maker)",
                  role: "Maker",
                });
              } else {
                setCurrentActor({
                  uuid: "usr-checker-9921-uuid",
                  name: "Supaporn (Senior Underwriting Manager)",
                  role: "Checker",
                });
              }
            }}
            className="text-xs px-2.5 py-1.5 rounded bg-white hover:bg-zinc-100 border border-zinc-300 font-semibold text-zinc-700 transition shadow-xs"
          >
            Switch to {currentActor.role === "Checker" ? "Maker" : "Checker"}
          </button>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* 2. MAKER-CHECKER SEGREGATION OF DUTIES ALERT (If Maker Views)          */}
      {/* ====================================================================== */}
      {isMakerViewingOwnRequest && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <div className="text-xs font-bold text-amber-900">
              Segregation of Duties Enforcement (BRD 7.9 & SDD 5.14)
            </div>
            <div className="text-xs text-amber-800 mt-0.5">
              You created this change ticket (Maker ID:{" "}
              <code className="font-mono">{MOCK_APPROVAL_TICKET.requestedBy.uuid}</code>). You are structurally blocked
              from approving or rejecting your own submission. A different authorized Checker must validate this
              payload.
            </div>
          </div>
        </div>
      )}

      {/* Decision Result Banner (If already decided) */}
      {finalResult && (
        <div
          className={`border-b px-6 py-3.5 flex items-center justify-between ${
            finalResult.status === "APPROVED"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-current"></span>
            Action Executed: {finalResult.status} — {finalResult.message}
          </div>
          <button onClick={() => setFinalResult(null)} className="text-xs font-bold underline hover:opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 3. METADATA SUMMARY CARD (Context & SLA Tracker)                        */}
      {/* ====================================================================== */}
      <div className="bg-white border-b border-zinc-200 px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-xs">
          <div>
            <span className="text-zinc-500 block font-medium">Insurer / Partner</span>
            <span className="font-semibold text-zinc-900 truncate block mt-0.5">
              {MOCK_APPROVAL_TICKET.insurerName}
            </span>
          </div>
          <div>
            <span className="text-zinc-500 block font-medium">Line of Business (LOB)</span>
            <span className="font-semibold text-zinc-900 block mt-0.5">{MOCK_APPROVAL_TICKET.lob} INSURANCE</span>
          </div>
          <div>
            <span className="text-zinc-500 block font-medium">Current Active Version</span>
            <span className="font-mono text-zinc-700 block mt-0.5">{MOCK_APPROVAL_TICKET.activeVersionId}</span>
          </div>
          <div>
            <span className="text-zinc-500 block font-medium">Target Draft Version</span>
            <span className="font-mono text-emerald-700 font-semibold block mt-0.5">
              {MOCK_APPROVAL_TICKET.draftVersionId}
            </span>
          </div>
          <div>
            <span className="text-zinc-500 block font-medium">Submitted By</span>
            <span className="font-semibold text-zinc-900 block mt-0.5">
              {MOCK_APPROVAL_TICKET.requestedBy.fullName}
            </span>
          </div>
          <div>
            <span className="text-zinc-500 block font-medium">SLA Resolution Timer</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 mt-0.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              18h 24m remaining
            </span>
          </div>
        </div>

        {/* Change Request Justification Notes */}
        <div className="mt-3 pt-3 border-t border-zinc-100 flex items-start gap-2 text-xs">
          <span className="font-bold text-zinc-600 shrink-0">Maker Justification Note:</span>
          <p className="text-zinc-700 italic">{MOCK_APPROVAL_TICKET.requestNotes}</p>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* 4. MAIN CONTENT AREA: HIERARCHY TREE + DIFF COMPARISON ENGINE           */}
      {/* ====================================================================== */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Pane: Hierarchy Navigation Tree (BRD Screen 8.2.5 requirement) */}
        <aside className="w-full md:w-64 bg-white border-r border-zinc-200 flex flex-col shrink-0">
          <div className="p-3 border-b border-zinc-200 bg-zinc-50/50">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Entity Tree Navigation</span>
          </div>
          <div className="p-2 space-y-1 text-xs overflow-y-auto flex-1">
            <div className="font-semibold text-zinc-800 px-2 py-1.5 flex items-center gap-1.5 rounded bg-zinc-100/70">
              <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              MSIG Travel Easy (Header)
            </div>

            {/* Tree Children */}
            <div className="pl-4 space-y-1">
              <button
                onClick={() => {
                  setSelectedTreeNode("plan_rates");
                  setActiveTab("VISUAL");
                }}
                className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between transition ${
                  selectedTreeNode === "plan_rates"
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                <span className="truncate">Worldwide Deluxe (Plan)</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                  {MOCK_APPROVAL_TICKET.diffSummary.modified} Δ
                </span>
              </button>

              <div className="pl-3 space-y-1">
                <button
                  onClick={() => {
                    setSelectedTreeNode("plan_benefits");
                    setActiveTab("BENEFITS");
                  }}
                  className={`w-full text-left px-2 py-1 rounded flex items-center justify-between transition ${
                    selectedTreeNode === "plan_benefits"
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-zinc-500 hover:bg-zinc-100"
                  }`}
                >
                  <span className="truncate">• Plan Coverages (5)</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                    Diffs
                  </span>
                </button>

                <button
                  onClick={() => {
                    setSelectedTreeNode("plan_schema");
                    setActiveTab("RAW_JSON");
                  }}
                  className={`w-full text-left px-2 py-1 rounded flex items-center justify-between transition ${
                    selectedTreeNode === "plan_schema"
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-zinc-500 hover:bg-zinc-100"
                  }`}
                >
                  <span className="truncate">• JSON Logic & URE</span>
                  <span className="text-[10px] text-zinc-400 font-mono">JSONB</span>
                </button>
              </div>

              <div className="text-zinc-400 px-2 py-1 italic flex items-center justify-between opacity-60">
                <span className="truncate">Asia Basic (Plan)</span>
                <span className="text-[10px]">No Changes</span>
              </div>
            </div>
          </div>

          {/* Quick Stats at bottom of Tree */}
          <div className="p-3 border-t border-zinc-200 bg-zinc-50 text-xs">
            <span className="text-zinc-500 font-medium block mb-1">Delta Summary:</span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                +{MOCK_APPROVAL_TICKET.diffSummary.added} Added
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[11px]">
                ~{MOCK_APPROVAL_TICKET.diffSummary.modified} Changed
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[11px]">
                -{MOCK_APPROVAL_TICKET.diffSummary.removed} Removed
              </span>
            </div>
          </div>
        </aside>

        {/* Right Pane: Split-Screen Diff View */}
        <section className="flex-1 flex flex-col min-w-0 bg-white">
          {/* View Mode Tabs */}
          <div className="border-b border-zinc-200 px-6 py-2.5 flex items-center justify-between bg-zinc-50/70">
            <div className="flex items-center gap-1 bg-zinc-200/60 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("VISUAL")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  activeTab === "VISUAL" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Plan Parameters Diff
              </button>
              <button
                onClick={() => setActiveTab("BENEFITS")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  activeTab === "BENEFITS" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Benefit Coverages Matrix
              </button>
              <button
                onClick={() => setActiveTab("RAW_JSON")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  activeTab === "RAW_JSON" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Raw JSON Schema Diff
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-200 border border-rose-300"></span> Old / Active (v1.0)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-200 border border-emerald-300"></span> New / Proposed
                (v2.0)
              </span>
            </div>
          </div>

          {/* Diff Container Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* ---------------------------------------------------------------- */}
            {/* TAB 1: VISUAL PARAMETERS SIDE-BY-SIDE DIFF                      */}
            {/* ---------------------------------------------------------------- */}
            {activeTab === "VISUAL" && (
              <div className="border border-zinc-200 rounded-lg overflow-hidden shadow-xs">
                {/* Column Headers */}
                <div className="grid grid-cols-12 bg-zinc-100 border-b border-zinc-200 text-xs font-bold text-zinc-700 py-2.5 px-4">
                  <div className="col-span-4">Configuration Field / Attribute</div>
                  <div className="col-span-4 text-zinc-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
                    Current Active Record ({MOCK_APPROVAL_TICKET.activeVersionId})
                  </div>
                  <div className="col-span-4 text-emerald-800 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Proposed Draft ({MOCK_APPROVAL_TICKET.draftVersionId})
                  </div>
                </div>

                {/* Diff Rows */}
                <div className="divide-y divide-zinc-200 text-xs">
                  {MOCK_CORE_DIFFS.map((item) => {
                    const isChanged = item.changeType === "MODIFIED";
                    const isAdded = item.changeType === "ADDED";

                    return (
                      <div
                        key={item.id}
                        className={`grid grid-cols-12 items-center px-4 py-3 transition-colors ${
                          isChanged
                            ? "bg-amber-50/40 hover:bg-amber-50/70"
                            : isAdded
                              ? "bg-emerald-50/40 hover:bg-emerald-50/70"
                              : "hover:bg-zinc-50"
                        }`}
                      >
                        {/* Field Info */}
                        <div className="col-span-4 pr-3">
                          <span className="font-semibold text-zinc-900 block">{item.fieldLabel}</span>
                          <span className="font-mono text-[10px] text-zinc-400 block">{item.fieldKey}</span>
                        </div>

                        {/* Old Value */}
                        <div className="col-span-4 pr-3">
                          {item.oldValue === null ? (
                            <span className="text-zinc-400 italic font-mono text-[11px]">— Not Defined —</span>
                          ) : isChanged ? (
                            <span className="inline-block px-2 py-1 rounded bg-rose-100 text-rose-800 border border-rose-200 font-medium line-through">
                              {String(item.oldValue)}
                            </span>
                          ) : (
                            <span className="text-zinc-600 font-medium">{String(item.oldValue)}</span>
                          )}
                        </div>

                        {/* New Value */}
                        <div className="col-span-4">
                          {isAdded ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold">
                              <svg
                                className="w-3.5 h-3.5 text-emerald-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              {String(item.newValue)}
                            </span>
                          ) : isChanged ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold">
                              {String(item.newValue)}
                              <span className="text-[10px] px-1 rounded bg-amber-200 text-amber-800 font-semibold uppercase">
                                Mod
                              </span>
                            </span>
                          ) : (
                            <span className="text-zinc-700 font-medium">{String(item.newValue)}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* TAB 2: BENEFIT COVERAGE MATRIX DIFF                             */}
            {/* ---------------------------------------------------------------- */}
            {activeTab === "BENEFITS" && (
              <div className="border border-zinc-200 rounded-lg overflow-hidden shadow-xs">
                <div className="grid grid-cols-12 bg-zinc-100 border-b border-zinc-200 text-xs font-bold text-zinc-700 py-2.5 px-4">
                  <div className="col-span-4">Benefit Coverage Name / Category</div>
                  <div className="col-span-4 text-zinc-600">Active Limit (v1.0)</div>
                  <div className="col-span-4 text-emerald-800">Proposed Draft Limit (v2.0)</div>
                </div>

                <div className="divide-y divide-zinc-200 text-xs">
                  {MOCK_BENEFIT_DIFFS.map((benefit) => {
                    return (
                      <div
                        key={benefit.id}
                        className={`grid grid-cols-12 items-center px-4 py-3 ${
                          benefit.changeType === "MODIFIED"
                            ? "bg-amber-50/40"
                            : benefit.changeType === "ADDED"
                              ? "bg-emerald-50/40"
                              : "bg-rose-50/40"
                        }`}
                      >
                        <div className="col-span-4 pr-3">
                          <span className="font-semibold text-zinc-900 block">{benefit.benefitName}</span>
                          <span className="text-[11px] text-zinc-500 block">{benefit.groupName}</span>
                        </div>

                        <div className="col-span-4 pr-3">
                          {benefit.oldCoverage ? (
                            <span
                              className={`px-2 py-1 rounded font-medium ${
                                benefit.changeType === "MODIFIED"
                                  ? "bg-rose-100 text-rose-800 border border-rose-200 line-through"
                                  : benefit.changeType === "REMOVED"
                                    ? "bg-rose-100 text-rose-800 border border-rose-200 font-bold"
                                    : "text-zinc-600"
                              }`}
                            >
                              {benefit.oldCoverage}
                            </span>
                          ) : (
                            <span className="text-zinc-400 italic">— None —</span>
                          )}
                        </div>

                        <div className="col-span-4">
                          {benefit.newCoverage ? (
                            <span
                              className={`inline-block px-2 py-1 rounded font-bold ${
                                benefit.changeType === "ADDED"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                              }`}
                            >
                              {benefit.newCoverage}
                            </span>
                          ) : (
                            <span className="text-rose-700 font-bold bg-rose-100 px-2 py-1 rounded border border-rose-200">
                              [Removed from Plan]
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* TAB 3: RAW JSON PAYLOAD & UNDERWRITING ENGINE DIFF               */}
            {/* ---------------------------------------------------------------- */}
            {activeTab === "RAW_JSON" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="border border-zinc-200 rounded-lg overflow-hidden">
                  <div className="bg-zinc-100 px-4 py-2 border-b border-zinc-200 text-xs font-bold text-zinc-700 flex items-center justify-between">
                    <span>ACTIVE SNAPSHOT (JSON v1.0)</span>
                    <span className="text-zinc-400 font-mono text-[10px]">Read-Only</span>
                  </div>
                  <pre className="p-4 bg-zinc-50 text-zinc-800 font-mono text-xs overflow-x-auto h-96 leading-relaxed">
                    {MOCK_OLD_JSON}
                  </pre>
                </div>

                <div className="border border-emerald-200 rounded-lg overflow-hidden">
                  <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-200 text-xs font-bold text-emerald-800 flex items-center justify-between">
                    <span>PROPOSED DRAFT PAYLOAD (JSON v2.0)</span>
                    <span className="text-emerald-600 font-mono text-[10px]">Pending Approval</span>
                  </div>
                  <pre className="p-4 bg-emerald-50/20 text-zinc-900 font-mono text-xs overflow-x-auto h-96 leading-relaxed">
                    {MOCK_NEW_JSON}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* ================================================================== */}
          {/* 5. STICKY ACTION FOOTER (Checker Decision Controls)                */}
          {/* ================================================================== */}
          <footer className="border-t border-zinc-200 bg-white px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 shadow-lg">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <span>
                Maker-Checker enforced. Decisions write an immutable audit trail to{" "}
                <code className="font-mono text-zinc-700 font-semibold">approval_logs</code>.
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Reject Button */}
              <button
                disabled={isMakerViewingOwnRequest || decisionState === "EXECUTING"}
                onClick={() => setShowRejectModal(true)}
                className="px-4 py-2 rounded-md border border-rose-300 text-rose-700 hover:bg-rose-50 font-semibold text-xs transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              >
                Reject Changes
              </button>

              {/* Approve & Publish Button */}
              <button
                disabled={isMakerViewingOwnRequest || decisionState === "EXECUTING"}
                onClick={() => setShowApproveModal(true)}
                className="px-5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Approve & Deploy Version
              </button>
            </div>
          </footer>
        </section>
      </div>

      {/* ====================================================================== */}
      {/* 6. MODAL: REJECTION REASON (Enforcing Mandatory Comments)             */}
      {/* ====================================================================== */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl border border-zinc-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <span className="p-1.5 rounded-full bg-rose-100 text-rose-700">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>
              Reject Configuration Proposal
            </h3>
            <p className="text-xs text-zinc-600 mt-2">
              In accordance with BRD Section 7.9, a rejection requires formal written justification. This reason will be
              logged into the audit ledger and returned to the maker.
            </p>

            <div className="mt-4">
              <label className="text-xs font-bold text-zinc-700 block mb-1">Mandatory Rejection Comments:</label>
              <textarea
                rows={4}
                value={rejectionComments}
                onChange={(e) => setRejectionComments(e.target.value)}
                placeholder="Specify regulatory, pricing, or compliance deficiency (e.g., Commission rate exceeds 12% ceiling under OIC regulation)..."
                className="w-full text-xs p-3 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 bg-zinc-50"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded"
              >
                Cancel
              </button>
              <button
                disabled={!rejectionComments.trim() || decisionState === "EXECUTING"}
                onClick={handleReject}
                className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded transition disabled:opacity-50"
              >
                {decisionState === "EXECUTING" ? "Logging Rejection..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 7. MODAL: APPROVAL & SCD TYPE 2 ACTIVATION STRATEGY                    */}
      {/* ====================================================================== */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl border border-zinc-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <span className="p-1.5 rounded-full bg-emerald-100 text-emerald-700">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              Confirm Approval (Clone & Swap Execution)
            </h3>

            <div className="mt-3 bg-zinc-50 p-3 rounded-md border border-zinc-200 text-xs space-y-1.5">
              <div className="font-semibold text-zinc-800">Automated Database Execution (SDD 5.14):</div>
              <ul className="list-disc list-inside text-zinc-600 space-y-0.5">
                <li>
                  Active version <code className="font-mono text-zinc-800 font-bold">v1.0</code> will be capped with{" "}
                  <code className="font-mono">ARCHIVED</code> status.
                </li>
                <li>
                  Draft version <code className="font-mono text-emerald-800 font-bold">v2.0</code> will transition to{" "}
                  <code className="font-mono">ACTIVE</code>.
                </li>
                <li>
                  Checker signature (<code className="font-mono">{currentActor.name}</code>) permanently stamped in{" "}
                  <code className="font-mono">approval_logs</code>.
                </li>
              </ul>
            </div>

            {/* Effective Date Strategy Selector */}
            <div className="mt-4 space-y-3">
              <label className="text-xs font-bold text-zinc-800 block">Deployment Timing (OIC Effective Date):</label>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <label
                  className={`p-3 rounded-md border cursor-pointer flex flex-col gap-1 ${
                    activationOption === "IMMEDIATE"
                      ? "border-emerald-500 bg-emerald-50/50 text-emerald-900 font-bold"
                      : "border-zinc-200 hover:bg-zinc-50 text-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="activationTiming"
                      checked={activationOption === "IMMEDIATE"}
                      onChange={() => setActivationOption("IMMEDIATE")}
                    />
                    Immediate Swap
                  </div>
                  <span className="text-[11px] font-normal text-zinc-500 pl-5">Live APIs serve v2.0 immediately.</span>
                </label>

                <label
                  className={`p-3 rounded-md border cursor-pointer flex flex-col gap-1 ${
                    activationOption === "SCHEDULED"
                      ? "border-emerald-500 bg-emerald-50/50 text-emerald-900 font-bold"
                      : "border-zinc-200 hover:bg-zinc-50 text-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="activationTiming"
                      checked={activationOption === "SCHEDULED"}
                      onChange={() => setActivationOption("SCHEDULED")}
                    />
                    Scheduled Future Date
                  </div>
                  <span className="text-[11px] font-normal text-zinc-500 pl-5">
                    Flips automatically via nightly CRON job.
                  </span>
                </label>
              </div>

              {activationOption === "SCHEDULED" && (
                <div className="mt-2">
                  <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
                    Scheduled Effective Date (UTC):
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="text-xs p-2 border border-zinc-300 rounded w-full bg-white"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded"
              >
                Back
              </button>
              <button
                disabled={decisionState === "EXECUTING"}
                onClick={handleApprove}
                className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition shadow-sm"
              >
                {decisionState === "EXECUTING" ? "Executing Swap..." : "Confirm Approval & Commit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiffViewerPage;
