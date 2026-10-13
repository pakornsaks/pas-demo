import React, { useMemo, useState } from "react";

// ============================================================================
// Types & Schema Interfaces (Aligned to SDD 4.8 / PostgreSQL Tables)
// ============================================================================

export type ModuleContext = "APPLICATION" | "POLICY" | "PRODUCT" | "CLAIM";

export interface WorkflowState {
  state_code: string;
  module_context: ModuleContext;
  is_terminal: boolean;
  label: string;
  description: string;
  x: number;
  y: number;
  category: "initial" | "intermediate" | "terminal" | "review";
}

export interface ConditionRule {
  field: string;
  operator: "<=" | ">=" | "<" | ">" | "==" | "!=";
  value: string | number;
}

export interface ConditionLogic {
  rules: ConditionRule[];
  combinator: "AND" | "OR";
}

export interface WorkflowPermission {
  role_id: number;
  condition_logic: ConditionLogic | null;
}

export interface WorkflowTransition {
  transition_id: number;
  from_state_code: string;
  to_state_code: string;
  module_context: ModuleContext;
  description?: string;
  permissions: WorkflowPermission[];
}

export interface Role {
  role_id: number;
  role_name: string;
  description: string;
}

// ============================================================================
// Master Reference Data
// ============================================================================

const AVAILABLE_ROLES: Role[] = [
  { role_id: 1, role_name: "Super Admin", description: "Complete system access" },
  { role_id: 2, role_name: "Underwriter", description: "Handles risk assessment & loadings" },
  { role_id: 3, role_name: "Senior Underwriter", description: "High-risk and exception sign-off" },
  { role_id: 4, role_name: "Finance Manager", description: "Manages refund thresholds & settlements" },
  { role_id: 5, role_name: "Operations Officer", description: "Handles case triage & data ingestion" },
  { role_id: 6, role_name: "Telesales Agent", description: "Quote and lead creation" },
];

const INITIAL_STATES: WorkflowState[] = [
  // Application Lifecycle States
  {
    state_code: "DRAFT",
    module_context: "APPLICATION",
    is_terminal: false,
    label: "Draft Application",
    description: "Initial customer application creation",
    x: 60,
    y: 80,
    category: "initial",
  },
  {
    state_code: "PENDING_REVIEW",
    module_context: "APPLICATION",
    is_terminal: false,
    label: "Pending Review",
    description: "Yellow Channel: Referred to Underwriting",
    x: 290,
    y: 80,
    category: "review",
  },
  {
    state_code: "QUOTATION_RATED",
    module_context: "APPLICATION",
    is_terminal: false,
    label: "Quotation Rated",
    description: "Underwriter loaded counter-offer issued",
    x: 290,
    y: 240,
    category: "intermediate",
  },
  {
    state_code: "APPROVED_WAITING_PAYMENT",
    module_context: "APPLICATION",
    is_terminal: false,
    label: "Wait Payment",
    description: "Green Channel: Ready for checkout & gateway",
    x: 540,
    y: 80,
    category: "intermediate",
  },
  {
    state_code: "CONVERTED",
    module_context: "APPLICATION",
    is_terminal: true,
    label: "Converted to Policy",
    description: "Cycle 1 paid, policy header instantiated",
    x: 790,
    y: 80,
    category: "terminal",
  },
  {
    state_code: "REJECTED",
    module_context: "APPLICATION",
    is_terminal: true,
    label: "Rejected",
    description: "Red Channel: Application declined",
    x: 290,
    y: 390,
    category: "terminal",
  },
  {
    state_code: "WITHDRAWN_BY_CUSTOMER",
    module_context: "APPLICATION",
    is_terminal: true,
    label: "Customer Withdrawn",
    description: "Customer declined counter-offer or dropped out",
    x: 540,
    y: 240,
    category: "terminal",
  },

  // Policy Lifecycle States
  {
    state_code: "PENDING_OFFICIAL_NUMBER",
    module_context: "POLICY",
    is_terminal: false,
    label: "Pending Number",
    description: "Temporary cover note active; awaiting insurer callback",
    x: 60,
    y: 120,
    category: "initial",
  },
  {
    state_code: "ACTIVE",
    module_context: "POLICY",
    is_terminal: false,
    label: "Active Policy",
    description: "Official policy issued and legally in force",
    x: 320,
    y: 120,
    category: "intermediate",
  },
  {
    state_code: "SUSPENDED",
    module_context: "POLICY",
    is_terminal: false,
    label: "Suspended",
    description: "Temporarily blocked for compliance/payment review",
    x: 320,
    y: 290,
    category: "review",
  },
  {
    state_code: "CANCELLED",
    module_context: "POLICY",
    is_terminal: true,
    label: "Cancelled",
    description: "Policy cancelled prematurely; refund/clawback logged",
    x: 580,
    y: 290,
    category: "terminal",
  },
  {
    state_code: "EXPIRED",
    module_context: "POLICY",
    is_terminal: true,
    label: "Expired",
    description: "Contract elapsed without renewal at end of term",
    x: 580,
    y: 120,
    category: "terminal",
  },
];

const INITIAL_TRANSITIONS: WorkflowTransition[] = [
  // Application Transitions
  {
    transition_id: 101,
    from_state_code: "DRAFT",
    to_state_code: "PENDING_REVIEW",
    module_context: "APPLICATION",
    description: "Auto-referral triggered by URE rules breach",
    permissions: [
      { role_id: 1, condition_logic: null },
      { role_id: 5, condition_logic: null },
    ],
  },
  {
    transition_id: 102,
    from_state_code: "DRAFT",
    to_state_code: "APPROVED_WAITING_PAYMENT",
    module_context: "APPLICATION",
    description: "Preferred Green Channel auto-approval",
    permissions: [
      { role_id: 1, condition_logic: null },
      { role_id: 5, condition_logic: null },
      { role_id: 6, condition_logic: null },
    ],
  },
  {
    transition_id: 103,
    from_state_code: "PENDING_REVIEW",
    to_state_code: "QUOTATION_RATED",
    module_context: "APPLICATION",
    description: "Underwriter injects loading & exclusions",
    permissions: [
      {
        role_id: 2,
        condition_logic: {
          combinator: "AND",
          rules: [{ field: "loading_amount", operator: "<=", value: 15000 }],
        },
      },
      { role_id: 3, condition_logic: null },
    ],
  },
  {
    transition_id: 104,
    from_state_code: "PENDING_REVIEW",
    to_state_code: "REJECTED",
    module_context: "APPLICATION",
    description: "Decline application due to extreme risk profile",
    permissions: [
      { role_id: 2, condition_logic: null },
      { role_id: 3, condition_logic: null },
    ],
  },
  {
    transition_id: 105,
    from_state_code: "QUOTATION_RATED",
    to_state_code: "APPROVED_WAITING_PAYMENT",
    module_context: "APPLICATION",
    description: "Customer accepts rated loading & exclusion offer",
    permissions: [
      { role_id: 1, condition_logic: null },
      { role_id: 5, condition_logic: null },
      { role_id: 6, condition_logic: null },
    ],
  },
  {
    transition_id: 106,
    from_state_code: "QUOTATION_RATED",
    to_state_code: "WITHDRAWN_BY_CUSTOMER",
    module_context: "APPLICATION",
    description: "Customer declines counter-offer",
    permissions: [
      { role_id: 1, condition_logic: null },
      { role_id: 6, condition_logic: null },
    ],
  },
  {
    transition_id: 107,
    from_state_code: "APPROVED_WAITING_PAYMENT",
    to_state_code: "CONVERTED",
    module_context: "APPLICATION",
    description: "Payment collected, instantiating policy header",
    permissions: [
      { role_id: 1, condition_logic: null },
      { role_id: 4, condition_logic: null },
      { role_id: 5, condition_logic: null },
    ],
  },

  // Policy Transitions
  {
    transition_id: 201,
    from_state_code: "PENDING_OFFICIAL_NUMBER",
    to_state_code: "ACTIVE",
    module_context: "POLICY",
    description: "Official Policy No received from Insurer Host-to-Host",
    permissions: [
      { role_id: 1, condition_logic: null },
      { role_id: 5, condition_logic: null },
    ],
  },
  {
    transition_id: 202,
    from_state_code: "ACTIVE",
    to_state_code: "EXPIRED",
    module_context: "POLICY",
    description: "Nightly batch marks contract expired past end-date",
    permissions: [{ role_id: 1, condition_logic: null }],
  },
  {
    transition_id: 203,
    from_state_code: "ACTIVE",
    to_state_code: "CANCELLED",
    module_context: "POLICY",
    description: "Mid-term policy termination and refund calculation",
    permissions: [
      {
        role_id: 5,
        condition_logic: {
          combinator: "AND",
          rules: [{ field: "refund_amount", operator: "<=", value: 5000 }],
        },
      },
      { role_id: 4, condition_logic: null },
    ],
  },
  {
    transition_id: 204,
    from_state_code: "ACTIVE",
    to_state_code: "SUSPENDED",
    module_context: "POLICY",
    description: "Lock policy during compliance or overdue dispute",
    permissions: [
      { role_id: 1, condition_logic: null },
      { role_id: 4, condition_logic: null },
    ],
  },
  {
    transition_id: 205,
    from_state_code: "SUSPENDED",
    to_state_code: "ACTIVE",
    module_context: "POLICY",
    description: "Reinstate policy after resolving suspension reason",
    permissions: [
      { role_id: 1, condition_logic: null },
      { role_id: 4, condition_logic: null },
    ],
  },
];

// ============================================================================
// Main Component
// ============================================================================

export const TransitionRulesConfigurator: React.FC = () => {
  // Navigation & Context State
  const [selectedContext, setSelectedContext] = useState<ModuleContext>("APPLICATION");
  const [transitions, setTransitions] = useState<WorkflowTransition[]>(INITIAL_TRANSITIONS);
  const [activeTransitionId, setActiveTransitionId] = useState<number | null>(103);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "info"; message: string } | null>(null);

  // New Transition Form State
  const [newFromState, setNewFromState] = useState("");
  const [newToState, setNewToState] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // Maker-Checker Staging Reason Modal State
  const [isMakerCheckerOpen, setIsMakerCheckerOpen] = useState(false);
  const [makerReason, setMakerReason] = useState("");

  // Filtered States & Transitions
  const filteredStates = useMemo(() => {
    return INITIAL_STATES.filter((s) => s.module_context === selectedContext);
  }, [selectedContext]);

  const filteredTransitions = useMemo(() => {
    return transitions.filter((t) => {
      const matchesContext = t.module_context === selectedContext;
      const matchesSearch =
        t.from_state_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.to_state_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesContext && matchesSearch;
    });
  }, [transitions, selectedContext, searchQuery]);

  const activeTransition = useMemo(() => {
    return transitions.find((t) => t.transition_id === activeTransitionId) || null;
  }, [transitions, activeTransitionId]);

  // Handle saving modified permissions (Stages Maker-Checker Request)
  const handleStageMakerRequest = () => {
    if (!makerReason.trim()) {
      alert("A justification note is required to stage a Maker-Checker change.");
      return;
    }

    setNotification({
      type: "success",
      message: `Change request staged successfully (Ticket Ref: WF-REQ-${Math.floor(1000 + Math.random() * 9000)}). Live rules remain frozen until Checker sign-off.`,
    });
    setIsMakerCheckerOpen(false);
    setMakerReason("");

    setTimeout(() => {
      setNotification(null);
    }, 6000);
  };

  // Toggle Role for the active transition
  const handleToggleRole = (roleId: number) => {
    if (!activeTransitionId) return;

    setTransitions((prev) =>
      prev.map((t) => {
        if (t.transition_id !== activeTransitionId) return t;

        const exists = t.permissions.some((p) => p.role_id === roleId);
        let updatedPermissions: WorkflowPermission[];

        if (exists) {
          updatedPermissions = t.permissions.filter((p) => p.role_id !== roleId);
        } else {
          updatedPermissions = [...t.permissions, { role_id: roleId, condition_logic: null }];
        }

        return { ...t, permissions: updatedPermissions };
      }),
    );
  };

  // Update Condition Logic for a specific role
  const handleUpdateCondition = (roleId: number, condition: ConditionLogic | null) => {
    if (!activeTransitionId) return;

    setTransitions((prev) =>
      prev.map((t) => {
        if (t.transition_id !== activeTransitionId) return t;

        const updatedPermissions = t.permissions.map((p) => {
          if (p.role_id === roleId) {
            return { ...p, condition_logic: condition };
          }
          return p;
        });

        return { ...t, permissions: updatedPermissions };
      }),
    );
  };

  // Create New Transition
  const handleCreateTransition = () => {
    if (!newFromState || !newToState) {
      alert("Please select both From and To states.");
      return;
    }

    if (newFromState === newToState) {
      alert("Source and Destination states cannot be the same for this workflow pathway.");
      return;
    }

    const exists = transitions.some(
      (t) =>
        t.module_context === selectedContext && t.from_state_code === newFromState && t.to_state_code === newToState,
    );

    if (exists) {
      alert("This transition pathway already exists in this module.");
      return;
    }

    const newId = Math.max(...transitions.map((t) => t.transition_id), 300) + 1;
    const newRecord: WorkflowTransition = {
      transition_id: newId,
      from_state_code: newFromState,
      to_state_code: newToState,
      module_context: selectedContext,
      description: newDescription || `Pathway from ${newFromState} to ${newToState}`,
      permissions: [{ role_id: 1, condition_logic: null }], // Super Admin by default
    };

    setTransitions((prev) => [...prev, newRecord]);
    setActiveTransitionId(newId);
    setShowAddModal(false);
    setNewFromState("");
    setNewToState("");
    setNewDescription("");

    setNotification({
      type: "info",
      message: `Created pathway [${newRecord.from_state_code} → ${newRecord.to_state_code}]. Configure roles in the panel.`,
    });
  };

  return (
    // Note: -mt-6 -mx-6 negates the parent container's padding to satisfy the "no padding on top container" requirement
    <div className="-mt-6 -mx-6 bg-zinc-50 min-h-[calc(100vh-3.5rem)] flex flex-col antialiased text-zinc-900">
      {/* ==================================================================== */}
      {/* Top Config Header & Breadcrumb Bar (Flush to top, Light Theme)       */}
      {/* ==================================================================== */}
      <div className="bg-white border-b border-zinc-200 px-6 py-4 shadow-sm shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
              <span>Backoffice Governance</span>
              <span>/</span>
              <span>Module 10 (Dynamic Workflow)</span>
              <span>/</span>
              <span className="text-blue-600">State Transition Rules</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
              Transition Rules Configurator
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                Maker-Checker Enforced
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-3.5 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add State Transition
            </button>

            <button
              onClick={() => setIsMakerCheckerOpen(true)}
              disabled={!activeTransition}
              className="inline-flex items-center px-4 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors shadow-sm focus:outline-none disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-1.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
              Submit Proposed Changes
            </button>
          </div>
        </div>

        {/* Module Context Filter Tabs */}
        <div className="flex items-center justify-between border-t border-zinc-100 mt-4 pt-3">
          <div className="flex space-x-2">
            {(["APPLICATION", "POLICY", "PRODUCT", "CLAIM"] as ModuleContext[]).map((context) => {
              const active = selectedContext === context;
              const count = transitions.filter((t) => t.module_context === context).length;
              return (
                <button
                  key={context}
                  onClick={() => {
                    setSelectedContext(context);
                    const firstMatch = transitions.find((t) => t.module_context === context);
                    setActiveTransitionId(firstMatch ? firstMatch.transition_id : null);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-2 ${
                    active ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                  }`}
                >
                  <span>{context}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      active ? "bg-zinc-700 text-zinc-200" : "bg-zinc-200 text-zinc-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search transitions, states..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <svg
              className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Floating System Notification */}
      {notification && (
        <div className="mx-6 mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-lg flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-blue-500 hover:text-blue-700">
            &times;
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* Main Split Body: Interactive Flow Canvas + Permissions Panel         */}
      {/* ==================================================================== */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Visualizer Canvas & Pathway Explorer (Screen 8.8.1) */}
        <div className="flex-1 flex flex-col overflow-y-auto border-r border-zinc-200 bg-zinc-50/70 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-zinc-800">State Machine Lifecycle Canvas</h2>
              <p className="text-xs text-zinc-500">
                Click any pathway arrow or list card to configure Role-Based Access Control and JSON thresholds.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Initial
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Review / Refer
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-600"></span> In Progress
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Terminal
              </span>
            </div>
          </div>

          {/* Graphical Flow Representation Preview Container */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 mb-6 relative overflow-x-auto min-h-[360px]">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-4 flex items-center justify-between">
              <span>Entity State Graph: {selectedContext}</span>
              <span>PostgreSQL: workflow_transitions</span>
            </div>

            {/* Render Nodes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {filteredStates.map((state) => {
                const isSelectedAsFrom = activeTransition?.from_state_code === state.state_code;
                const isSelectedAsTo = activeTransition?.to_state_code === state.state_code;

                let badgeColor = "bg-zinc-100 text-zinc-700 border-zinc-200";
                if (state.category === "initial") badgeColor = "bg-blue-50 text-blue-700 border-blue-200";
                if (state.category === "review") badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
                if (state.category === "terminal") badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";

                return (
                  <div
                    key={state.state_code}
                    className={`p-3.5 rounded-lg border transition-all ${
                      isSelectedAsFrom
                        ? "border-blue-500 bg-blue-50/30 ring-2 ring-blue-100"
                        : isSelectedAsTo
                          ? "border-indigo-500 bg-indigo-50/30 ring-2 ring-indigo-100"
                          : "border-zinc-200 bg-white hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${badgeColor}`}
                      >
                        {state.state_code}
                      </span>
                      {state.is_terminal && (
                        <span className="text-[10px] text-zinc-400 font-medium bg-zinc-100 px-1 rounded">Terminal</span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-zinc-800">{state.label}</div>
                    <div className="text-[11px] text-zinc-500 mt-1 line-clamp-2">{state.description}</div>
                  </div>
                );
              })}
            </div>

            {/* Active Transition Indicator Banner */}
            {activeTransition && (
              <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-zinc-500">Selected Pathway:</span>
                  <div className="inline-flex items-center gap-2 bg-zinc-100 px-3 py-1 rounded-md font-mono text-zinc-800 border border-zinc-200">
                    <span className="font-bold text-blue-600">{activeTransition.from_state_code}</span>
                    <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    <span className="font-bold text-indigo-600">{activeTransition.to_state_code}</span>
                  </div>
                  <span className="text-zinc-400">|</span>
                  <span className="text-zinc-500">{activeTransition.description}</span>
                </div>

                <span className="text-[11px] font-mono text-zinc-400">
                  transition_id: #{activeTransition.transition_id}
                </span>
              </div>
            )}
          </div>

          {/* Configured Transitions Data Grid */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-zinc-200 bg-zinc-50/50 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                Mapped Transition Rules ({filteredTransitions.length})
              </h3>
              <span className="text-[11px] text-zinc-500">API Gateway Validation: Section 7.10</span>
            </div>

            <div className="divide-y divide-zinc-200">
              {filteredTransitions.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500">
                  No state transitions mapped for this context. Click <strong>Add State Transition</strong> to create
                  one.
                </div>
              ) : (
                filteredTransitions.map((trans) => {
                  const isSelected = trans.transition_id === activeTransitionId;
                  const roleCount = trans.permissions.length;
                  const hasConditions = trans.permissions.some((p) => p.condition_logic !== null);

                  return (
                    <div
                      key={trans.transition_id}
                      onClick={() => setActiveTransitionId(trans.transition_id)}
                      className={`p-4 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isSelected ? "bg-blue-50/40 border-l-4 border-l-blue-600" : "hover:bg-zinc-50"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-zinc-900 font-mono">{trans.from_state_code}</span>
                          <svg
                            className="w-3.5 h-3.5 text-zinc-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span className="text-xs font-bold text-zinc-900 font-mono">{trans.to_state_code}</span>
                          <span className="text-[10px] text-zinc-400 font-mono ml-2">#{trans.transition_id}</span>
                        </div>
                        <p className="text-xs text-zinc-500">{trans.description}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Authorized Roles Badges */}
                        <div className="flex -space-x-1 overflow-hidden">
                          {trans.permissions.map((perm) => {
                            const role = AVAILABLE_ROLES.find((r) => r.role_id === perm.role_id);
                            return (
                              <span
                                key={perm.role_id}
                                title={role?.role_name}
                                className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-full"
                              >
                                {role?.role_name}
                              </span>
                            );
                          })}
                        </div>

                        {hasConditions && (
                          <span className="px-2 py-0.5 text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded">
                            JSON Logic Applied
                          </span>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTransitionId(trans.transition_id);
                          }}
                          className="px-2.5 py-1 text-xs font-medium text-zinc-600 bg-white border border-zinc-300 rounded hover:bg-zinc-100"
                        >
                          Configure
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* Right Side: Slide-Out Permissions Panel (Screen 8.8.2)              */}
        {/* ==================================================================== */}
        <div className="w-96 md:w-[480px] bg-white border-l border-zinc-200 flex flex-col shrink-0 overflow-y-auto">
          {activeTransition ? (
            <div className="flex flex-col h-full">
              {/* Panel Header */}
              <div className="p-5 border-b border-zinc-200 bg-zinc-50/50">
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-1">
                  Screen 8.8.2: Transition Permissions Panel
                </div>
                <h2 className="text-base font-bold text-zinc-900">Configuring Transition:</h2>
                <div className="mt-2 p-2.5 bg-white border border-zinc-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-800">
                    <span className="text-blue-600">{activeTransition.from_state_code}</span>
                    <span className="text-zinc-400">→</span>
                    <span className="text-indigo-600">{activeTransition.to_state_code}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">ID #{activeTransition.transition_id}</span>
                </div>
                <p className="text-xs text-zinc-500 mt-2">
                  Changes made here populate the <code className="text-zinc-700 font-mono">workflow_permissions</code>{" "}
                  table and require Maker-Checker sign-off.
                </p>
              </div>

              {/* Panel Body: Authorized Roles Section */}
              <div className="p-5 flex-1 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                      1. Authorized RBAC Roles
                    </label>
                    <span className="text-[11px] text-zinc-400">Table: workflow_permissions.role_id</span>
                  </div>
                  <p className="text-xs text-zinc-500 mb-3">
                    Select the internal user roles allowed to execute this state change via API or Portal.
                  </p>

                  <div className="space-y-2">
                    {AVAILABLE_ROLES.map((role) => {
                      const isAssigned = activeTransition.permissions.some((p) => p.role_id === role.role_id);

                      return (
                        <div
                          key={role.role_id}
                          onClick={() => handleToggleRole(role.role_id)}
                          className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                            isAssigned
                              ? "bg-blue-50/50 border-blue-200 text-zinc-900"
                              : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isAssigned}
                            onChange={() => {}} // handled by parent div
                            className="mt-0.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-zinc-900 flex items-center justify-between">
                              <span>{role.role_name}</span>
                              <span className="text-[10px] font-mono text-zinc-400">role_id: {role.role_id}</span>
                            </div>
                            <div className="text-[11px] text-zinc-500 mt-0.5">{role.description}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Condition Builder Section (JSON Logic Editor) */}
                <div className="pt-4 border-t border-zinc-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                      2. Dynamic Condition Builder (JSON Logic)
                    </label>
                    <span className="text-[11px] text-zinc-400">workflow_permissions.condition_logic</span>
                  </div>
                  <p className="text-xs text-zinc-500 mb-3">
                    Restrict transition execution based on payload constraints (e.g. Refund &gt; 5,000 THB requires
                    Finance Manager).
                  </p>

                  {/* Render Condition Logic per assigned role */}
                  {activeTransition.permissions.length === 0 ? (
                    <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-500 text-center">
                      No roles assigned. Assign at least one role above to configure conditions.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeTransition.permissions.map((perm) => {
                        const role = AVAILABLE_ROLES.find((r) => r.role_id === perm.role_id);
                        const hasRules = perm.condition_logic && perm.condition_logic.rules.length > 0;

                        return (
                          <div key={perm.role_id} className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2.5">
                              <span className="text-xs font-bold text-zinc-800">
                                Rules for: <span className="text-blue-600">{role?.role_name}</span>
                              </span>
                              <button
                                onClick={() => {
                                  if (hasRules) {
                                    handleUpdateCondition(perm.role_id, null);
                                  } else {
                                    handleUpdateCondition(perm.role_id, {
                                      combinator: "AND",
                                      rules: [{ field: "refund_amount", operator: "<=", value: 5000 }],
                                    });
                                  }
                                }}
                                className="text-[11px] text-blue-600 hover:underline font-medium"
                              >
                                {hasRules ? "Remove Threshold" : "+ Add JSON Rule"}
                              </button>
                            </div>

                            {hasRules && perm.condition_logic ? (
                              <div className="space-y-2 mt-2">
                                {perm.condition_logic.rules.map((rule, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={rule.field}
                                      placeholder="Field (e.g. refund_amount)"
                                      onChange={(e) => {
                                        const newRules = [...perm.condition_logic!.rules];
                                        newRules[idx].field = e.target.value;
                                        handleUpdateCondition(perm.role_id, {
                                          ...perm.condition_logic!,
                                          rules: newRules,
                                        });
                                      }}
                                      className="flex-1 text-xs p-1.5 bg-white border border-zinc-300 rounded font-mono"
                                    />
                                    <select
                                      value={rule.operator}
                                      onChange={(e) => {
                                        const newRules = [...perm.condition_logic!.rules];
                                        newRules[idx].operator = e.target.value as any;
                                        handleUpdateCondition(perm.role_id, {
                                          ...perm.condition_logic!,
                                          rules: newRules,
                                        });
                                      }}
                                      className="text-xs p-1.5 bg-white border border-zinc-300 rounded font-mono"
                                    >
                                      <option value="<=">&le;</option>
                                      <option value=">=">&ge;</option>
                                      <option value="<">&lt;</option>
                                      <option value=">">&gt;</option>
                                      <option value="==">==</option>
                                      <option value="!=">!=</option>
                                    </select>
                                    <input
                                      type="text"
                                      value={rule.value}
                                      placeholder="Value"
                                      onChange={(e) => {
                                        const newRules = [...perm.condition_logic!.rules];
                                        newRules[idx].value = e.target.value;
                                        handleUpdateCondition(perm.role_id, {
                                          ...perm.condition_logic!,
                                          rules: newRules,
                                        });
                                      }}
                                      className="w-24 text-xs p-1.5 bg-white border border-zinc-300 rounded font-mono"
                                    />
                                  </div>
                                ))}

                                {/* JSON Payload Preview */}
                                <div className="mt-2 p-2 bg-zinc-900 text-zinc-100 rounded text-[10px] font-mono overflow-x-auto">
                                  {JSON.stringify(perm.condition_logic, null, 2)}
                                </div>
                              </div>
                            ) : (
                              <p className="text-[11px] text-zinc-500 italic">
                                Unrestricted access. Role can execute this transition without financial thresholds.
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Panel Footer Action Buttons */}
              <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between">
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this transition mapping?")) {
                      setTransitions((prev) => prev.filter((t) => t.transition_id !== activeTransitionId));
                      setActiveTransitionId(null);
                    }
                  }}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Delete Pathway
                </button>

                <button
                  onClick={() => setIsMakerCheckerOpen(true)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
                >
                  Save Transition Rules
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-zinc-500 flex flex-col items-center justify-center h-full">
              <svg className="w-8 h-8 text-zinc-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                />
              </svg>
              Select a transition from the left panel to configure RBAC roles and dynamic rules.
            </div>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* Modal: Add State Transition Pathway                                  */}
      {/* ==================================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xl max-w-md w-full p-6 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-900">Define New Workflow Transition</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-zinc-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Module Context</label>
                <input
                  type="text"
                  disabled
                  value={selectedContext}
                  className="w-full p-2 bg-zinc-100 border border-zinc-200 rounded font-mono text-zinc-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">From State Code</label>
                  <select
                    value={newFromState}
                    onChange={(e) => setNewFromState(e.target.value)}
                    className="w-full p-2 bg-white border border-zinc-300 rounded font-mono focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Select Source --</option>
                    {filteredStates.map((s) => (
                      <option key={s.state_code} value={s.state_code}>
                        {s.state_code}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">To State Code</label>
                  <select
                    value={newToState}
                    onChange={(e) => setNewToState(e.target.value)}
                    className="w-full p-2 bg-white border border-zinc-300 rounded font-mono focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Select Target --</option>
                    {filteredStates.map((s) => (
                      <option key={s.state_code} value={s.state_code}>
                        {s.state_code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Operational Description</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g. Underwriter approves referral loading..."
                  className="w-full p-2 bg-white border border-zinc-300 rounded focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 text-xs text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTransition}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm"
              >
                Add Pathway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* Modal: Maker-Checker Governance Justification Prompt (BRD 7.9)       */}
      {/* ==================================================================== */}
      {isMakerCheckerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xl max-w-lg w-full p-6 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                  Maker-Checker Governance Interception
                </span>
                <h3 className="text-sm font-bold text-zinc-900">Stage Transition Rule Modification</h3>
              </div>
              <button
                onClick={() => setIsMakerCheckerOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 leading-relaxed">
                <strong>Segregation of Duties Enforced (BRD BO-08):</strong> Direct write operations to core workflow
                transition paths are intercepted. Your submitted changes will be staged in{" "}
                <code className="font-mono text-amber-950">approval_requests</code> for another Admin/Manager (Checker)
                to review.
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Mandatory Change Reasoning / Audit Justification <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={makerReason}
                  onChange={(e) => setMakerReason(e.target.value)}
                  placeholder="Explain why this transition rule or threshold requires adjustment (e.g., OIC compliance update, new underwriter tier)..."
                  className="w-full p-2.5 bg-white border border-zinc-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                <div className="text-[11px] font-semibold text-zinc-600 mb-1">Staging Payload Target:</div>
                <div className="text-[10px] font-mono text-zinc-700 space-y-0.5">
                  <div>target_entity: 'workflow_transitions'</div>
                  <div>transition_id: {activeTransition?.transition_id}</div>
                  <div>
                    pathway: {activeTransition?.from_state_code} &rarr; {activeTransition?.to_state_code}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
              <button
                onClick={() => setIsMakerCheckerOpen(false)}
                className="px-3.5 py-1.5 text-xs text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleStageMakerRequest}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
              >
                Confirm & Stage Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransitionRulesConfigurator;
