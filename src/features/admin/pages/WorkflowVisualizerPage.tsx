import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileCode,
  GitBranch,
  Info,
  Layers,
  RotateCcw,
  Save,
  Shield,
  Sliders,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import React, { useCallback, useMemo, useRef, useState } from "react";

// ============================================================================
// DATA MODELS & SCHEMA TYPES (BRD 6.7, 7.10 & SDD Section 4.8)
// ============================================================================

export type ModuleContext = "APPLICATION" | "POLICY";

export interface WorkflowState {
  state_code: string;
  module_context: ModuleContext;
  label: string;
  is_terminal: boolean;
  category: "INITIAL" | "PROCESSING" | "REVIEW" | "TERMINAL_SUCCESS" | "TERMINAL_FAIL";
  x: number;
  y: number;
  description: string;
}

export interface ConditionRule {
  field: string;
  operator: "<=" | ">=" | "==" | "!=" | "<" | ">";
  value: string | number;
}

export interface WorkflowTransition {
  transition_id: number;
  module_context: ModuleContext;
  from_state_code: string;
  to_state_code: string;
  description?: string;
  allowed_role_ids: number[];
  condition_logic: ConditionRule | null;
}

export interface Role {
  role_id: number;
  role_name: string;
  description: string;
}

// ============================================================================
// MOCK DATA: PAS STATE ENGINE DICTIONARY (Module 10 / DDL Specification)
// ============================================================================

const ROLES: Role[] = [
  { role_id: 1, role_name: "Super Admin", description: "Full root access to configuration" },
  { role_id: 2, role_name: "Underwriter", description: "Standard referral triage and counter-offers" },
  { role_id: 3, role_name: "Senior Underwriter", description: "Authorized for high-value risks and overrides" },
  { role_id: 4, role_name: "Finance Manager", description: "Mandatory approval for refunds and monetary movements" },
  { role_id: 5, role_name: "Operations Officer", description: "Frontline data collection and manual tracking" },
  { role_id: 6, role_name: "Agent", description: "External channel representative" },
];

const INITIAL_APPLICATION_STATES: WorkflowState[] = [
  {
    state_code: "DRAFT",
    module_context: "APPLICATION",
    label: "Draft Application",
    is_terminal: false,
    category: "INITIAL",
    x: 80,
    y: 240,
    description: "Initial intake captured from Sales Channel checkout",
  },
  {
    state_code: "PENDING_REVIEW",
    module_context: "APPLICATION",
    label: "Pending Review (Yellow)",
    is_terminal: false,
    category: "REVIEW",
    x: 360,
    y: 120,
    description: "Triggered when Underwriting Rule Engine detects risk breach",
  },
  {
    state_code: "QUOTATION_RATED",
    module_context: "APPLICATION",
    label: "Quotation Rated",
    is_terminal: false,
    category: "PROCESSING",
    x: 680,
    y: 120,
    description: "Underwriter applied loading/exclusion counter-offer",
  },
  {
    state_code: "APPROVED_WAITING_PAYMENT",
    module_context: "APPLICATION",
    label: "Approved (Waiting Payment)",
    is_terminal: false,
    category: "PROCESSING",
    x: 520,
    y: 360,
    description: "Passed underwriting rules, payment gateway unlocked",
  },
  {
    state_code: "CONVERTED",
    module_context: "APPLICATION",
    label: "Converted to Policy",
    is_terminal: true,
    category: "TERMINAL_SUCCESS",
    x: 920,
    y: 360,
    description: "First installment or full premium received, policy instantiated",
  },
  {
    state_code: "REJECTED",
    module_context: "APPLICATION",
    label: "Rejected (Red Channel)",
    is_terminal: true,
    category: "TERMINAL_FAIL",
    x: 360,
    y: 490,
    description: "Hard-stop rule breached or declined by underwriter",
  },
  {
    state_code: "WITHDRAWN_BY_CUSTOMER",
    module_context: "APPLICATION",
    label: "Withdrawn by Customer",
    is_terminal: true,
    category: "TERMINAL_FAIL",
    x: 920,
    y: 120,
    description: "Customer rejected the counter-offer pricing adjustment",
  },
];

const INITIAL_APPLICATION_TRANSITIONS: WorkflowTransition[] = [
  {
    transition_id: 101,
    module_context: "APPLICATION",
    from_state_code: "DRAFT",
    to_state_code: "APPROVED_WAITING_PAYMENT",
    description: "Green Channel (Auto-Approve): Passes all risk thresholds",
    allowed_role_ids: [1, 5],
    condition_logic: null,
  },
  {
    transition_id: 102,
    module_context: "APPLICATION",
    from_state_code: "DRAFT",
    to_state_code: "PENDING_REVIEW",
    description: "Yellow Channel: Referral rule breached (e.g. Car Age > 10 / BMI > 30)",
    allowed_role_ids: [1, 2, 5],
    condition_logic: null,
  },
  {
    transition_id: 103,
    module_context: "APPLICATION",
    from_state_code: "DRAFT",
    to_state_code: "REJECTED",
    description: "Red Channel: Hard stop breach (Blacklisted driver/asset)",
    allowed_role_ids: [1, 2],
    condition_logic: null,
  },
  {
    transition_id: 104,
    module_context: "APPLICATION",
    from_state_code: "PENDING_REVIEW",
    to_state_code: "QUOTATION_RATED",
    description: "Manual rating: Underwriter inputs loading percentage or exclusion",
    allowed_role_ids: [2, 3],
    condition_logic: { field: "loading_percent", operator: "<=", value: 30 },
  },
  {
    transition_id: 105,
    module_context: "APPLICATION",
    from_state_code: "PENDING_REVIEW",
    to_state_code: "APPROVED_WAITING_PAYMENT",
    description: "Standard Underwriter waiver without premium change",
    allowed_role_ids: [2, 3],
    condition_logic: null,
  },
  {
    transition_id: 106,
    module_context: "APPLICATION",
    from_state_code: "PENDING_REVIEW",
    to_state_code: "REJECTED",
    description: "Underwriter declines after evidence review",
    allowed_role_ids: [2, 3],
    condition_logic: null,
  },
  {
    transition_id: 107,
    module_context: "APPLICATION",
    from_state_code: "QUOTATION_RATED",
    to_state_code: "APPROVED_WAITING_PAYMENT",
    description: "Customer accepts adjusted counter-offer via API",
    allowed_role_ids: [1, 5, 6],
    condition_logic: null,
  },
  {
    transition_id: 108,
    module_context: "APPLICATION",
    from_state_code: "QUOTATION_RATED",
    to_state_code: "WITHDRAWN_BY_CUSTOMER",
    description: "Customer or agent rejects counter-offer",
    allowed_role_ids: [1, 5, 6],
    condition_logic: null,
  },
  {
    transition_id: 109,
    module_context: "APPLICATION",
    from_state_code: "APPROVED_WAITING_PAYMENT",
    to_state_code: "CONVERTED",
    description: "Payment gateway confirmation webhook executes issuance",
    allowed_role_ids: [1, 4, 5],
    condition_logic: null,
  },
];

const INITIAL_POLICY_STATES: WorkflowState[] = [
  {
    state_code: "PENDING_OFFICIAL_NUMBER",
    module_context: "POLICY",
    label: "Pending Official Number",
    is_terminal: false,
    category: "INITIAL",
    x: 100,
    y: 220,
    description: "Cover note issued with temporary ID (e.g. TMP-2026-001)",
  },
  {
    state_code: "ACTIVE",
    module_context: "POLICY",
    label: "Active Policy",
    is_terminal: false,
    category: "PROCESSING",
    x: 460,
    y: 220,
    description: "Official carrier policy number synchronized",
  },
  {
    state_code: "SUSPENDED",
    module_context: "POLICY",
    label: "Suspended (Default)",
    is_terminal: false,
    category: "REVIEW",
    x: 460,
    y: 420,
    description: "Installment payment overdue, pending customer grace period",
  },
  {
    state_code: "EXPIRED",
    module_context: "POLICY",
    label: "Expired",
    is_terminal: true,
    category: "TERMINAL_FAIL",
    x: 820,
    y: 120,
    description: "Passed 365-day validity date without renewal conversion",
  },
  {
    state_code: "CANCELLED",
    module_context: "POLICY",
    label: "Cancelled & Refunded",
    is_terminal: true,
    category: "TERMINAL_FAIL",
    x: 820,
    y: 320,
    description: "Terminated with refund calculation and agent clawback",
  },
];

const INITIAL_POLICY_TRANSITIONS: WorkflowTransition[] = [
  {
    transition_id: 201,
    module_context: "POLICY",
    from_state_code: "PENDING_OFFICIAL_NUMBER",
    to_state_code: "ACTIVE",
    description: "Official insurer number arrived via API webhook or SFTP batch",
    allowed_role_ids: [1, 5],
    condition_logic: null,
  },
  {
    transition_id: 202,
    module_context: "POLICY",
    from_state_code: "ACTIVE",
    to_state_code: "ACTIVE",
    description: "Endorsement (Clone & Swap): mid-term amendment to v2.0",
    allowed_role_ids: [1, 2, 5],
    condition_logic: null,
  },
  {
    transition_id: 203,
    module_context: "POLICY",
    from_state_code: "ACTIVE",
    to_state_code: "EXPIRED",
    description: "Nightly batch worker updates expired date",
    allowed_role_ids: [1],
    condition_logic: null,
  },
  {
    transition_id: 204,
    module_context: "POLICY",
    from_state_code: "ACTIVE",
    to_state_code: "CANCELLED",
    description: "Manual or automated cancellation with refund ledger entries",
    allowed_role_ids: [4],
    condition_logic: { field: "refund_amount", operator: "<=", value: 5000 },
  },
  {
    transition_id: 205,
    module_context: "POLICY",
    from_state_code: "ACTIVE",
    to_state_code: "SUSPENDED",
    description: "Second installment failure triggers 15-day warning freeze",
    allowed_role_ids: [1, 4],
    condition_logic: null,
  },
  {
    transition_id: 206,
    module_context: "POLICY",
    from_state_code: "SUSPENDED",
    to_state_code: "ACTIVE",
    description: "Late installment payment verified by finance ops",
    allowed_role_ids: [4, 5],
    condition_logic: null,
  },
  {
    transition_id: 207,
    module_context: "POLICY",
    from_state_code: "SUSPENDED",
    to_state_code: "CANCELLED",
    description: "Installment exhaustion: grace window elapsed",
    allowed_role_ids: [1, 4],
    condition_logic: null,
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const WorkflowVisualizerPage: React.FC = () => {
  // Navigation & Module Context
  const [activeModule, setActiveModule] = useState<ModuleContext>("APPLICATION");

  // State Management
  const [states, setStates] = useState<WorkflowState[]>(INITIAL_APPLICATION_STATES);
  const [transitions, setTransitions] = useState<WorkflowTransition[]>(INITIAL_APPLICATION_TRANSITIONS);

  // Canvas Interactions
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [startPanPos, setStartPanPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Node Dragging
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Selection & Right Drawer (Screen 8.8.2)
  const [selectedTransitionId, setSelectedTransitionId] = useState<number | null>(null);
  const [selectedStateCode, setSelectedStateCode] = useState<string | null>(null);
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState<boolean>(false);

  // Maker-Checker & Toast feedback
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Temporary drawer draft state for Screen 8.8.2
  const [drawerRoles, setDrawerRoles] = useState<number[]>([]);
  const [drawerCondition, setDrawerCondition] = useState<ConditionRule | null>(null);
  const [enableCondition, setEnableCondition] = useState<boolean>(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Switch Module handler
  const handleSwitchModule = (module: ModuleContext) => {
    setActiveModule(module);
    setSelectedTransitionId(null);
    setSelectedStateCode(null);
    setIsConfigDrawerOpen(false);
    setPan({ x: 0, y: 0 });
    setZoom(1);

    if (module === "APPLICATION") {
      setStates(INITIAL_APPLICATION_STATES);
      setTransitions(INITIAL_APPLICATION_TRANSITIONS);
    } else {
      setStates(INITIAL_POLICY_STATES);
      setTransitions(INITIAL_POLICY_TRANSITIONS);
    }
  };

  // Selected transition object
  const currentTransition = useMemo(() => {
    return transitions.find((t) => t.transition_id === selectedTransitionId) || null;
  }, [transitions, selectedTransitionId]);

  // Open Drawer for Transition
  const handleSelectTransition = (trans: WorkflowTransition) => {
    setSelectedTransitionId(trans.transition_id);
    setSelectedStateCode(null);
    setDrawerRoles([...trans.allowed_role_ids]);
    if (trans.condition_logic) {
      setEnableCondition(true);
      setDrawerCondition({ ...trans.condition_logic });
    } else {
      setEnableCondition(false);
      setDrawerCondition({ field: "refund_amount", operator: "<=", value: 5000 });
    }
    setIsConfigDrawerOpen(true);
  };

  // Canvas zoom actions
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 1.8));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.6));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".canvas-node")) return;
    setIsPanning(true);
    setStartPanPos({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setPan({
          x: e.clientX - startPanPos.x,
          y: e.clientY - startPanPos.y,
        });
      } else if (draggingNodeId) {
        setStates((prev) =>
          prev.map((s) => {
            if (s.state_code === draggingNodeId) {
              return {
                ...s,
                x: Math.max(20, (e.clientX - pan.x) / zoom - dragOffset.x),
                y: Math.max(20, (e.clientY - pan.y) / zoom - dragOffset.y),
              };
            }
            return s;
          }),
        );
      }
    },
    [isPanning, startPanPos, draggingNodeId, pan, zoom, dragOffset],
  );

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  // Start node drag
  const handleNodeDragStart = (e: React.MouseEvent, stateCode: string) => {
    e.stopPropagation();
    const node = states.find((s) => s.state_code === stateCode);
    if (!node) return;
    setDraggingNodeId(stateCode);
    setSelectedStateCode(stateCode);
    setDragOffset({
      x: (e.clientX - pan.x) / zoom - node.x,
      y: (e.clientY - pan.y) / zoom - node.y,
    });
  };

  // Save transition rules (Screen 8.8.2 Action)
  const handleSaveTransitionRules = () => {
    if (!selectedTransitionId) return;

    setTransitions((prev) =>
      prev.map((t) => {
        if (t.transition_id === selectedTransitionId) {
          return {
            ...t,
            allowed_role_ids: drawerRoles,
            condition_logic: enableCondition ? drawerCondition : null,
          };
        }
        return t;
      }),
    );

    setSaveSuccessNotice(
      `Transition ${currentTransition?.from_state_code} → ${currentTransition?.to_state_code} staged for Maker-Checker approval.`,
    );
    setTimeout(() => setSaveSuccessNotice(null), 4000);
    setIsConfigDrawerOpen(false);
  };

  // Helper: Node styling based on category
  const getNodeColorClasses = (category: WorkflowState["category"], isSelected: boolean) => {
    const baseBorder = isSelected ? "ring-2 ring-blue-600 ring-offset-2" : "";
    switch (category) {
      case "INITIAL":
        return `${baseBorder} bg-zinc-50 border-zinc-300 text-zinc-800 shadow-sm`;
      case "REVIEW":
        return `${baseBorder} bg-amber-50/70 border-amber-300 text-amber-900 shadow-sm`;
      case "PROCESSING":
        return `${baseBorder} bg-blue-50/70 border-blue-300 text-blue-900 shadow-sm`;
      case "TERMINAL_SUCCESS":
        return `${baseBorder} bg-emerald-50/70 border-emerald-300 text-emerald-900 shadow-sm`;
      case "TERMINAL_FAIL":
        return `${baseBorder} bg-rose-50/70 border-rose-300 text-rose-900 shadow-sm`;
      default:
        return `${baseBorder} bg-white border-zinc-300 text-zinc-800 shadow-sm`;
    }
  };

  // Render SVG Arrow Path between states
  const renderPath = (t: WorkflowTransition) => {
    const fromNode = states.find((s) => s.state_code === t.from_state_code);
    const toNode = states.find((s) => s.state_code === t.to_state_code);
    if (!fromNode || !toNode) return null;

    const nodeWidth = 200;
    const nodeHeight = 72;

    const isSelfLoop = fromNode.state_code === toNode.state_code;
    const isSelected = selectedTransitionId === t.transition_id;

    if (isSelfLoop) {
      // Loopback curve (e.g. Policy Endorsement Clone & Swap)
      const startX = fromNode.x + nodeWidth - 30;
      const startY = fromNode.y;
      const endX = fromNode.x + 30;
      const endY = fromNode.y;
      const pathD = `M ${startX} ${startY} C ${startX + 40} ${startY - 60}, ${endX - 40} ${endY - 60}, ${endX} ${endY}`;
      const midX = fromNode.x + nodeWidth / 2;
      const midY = fromNode.y - 48;

      return (
        <g key={t.transition_id} className="cursor-pointer group" onClick={() => handleSelectTransition(t)}>
          <path
            d={pathD}
            fill="none"
            stroke={isSelected ? "#2563eb" : "#94a3b8"}
            strokeWidth={isSelected ? 3 : 2}
            strokeDasharray={t.condition_logic ? "4 3" : "none"}
            markerEnd="url(#arrowhead)"
            className="transition-all duration-150 group-hover:stroke-blue-600 group-hover:stroke-[2.5]"
          />
          <foreignObject x={midX - 22} y={midY - 14} width={50} height={28}>
            <div
              className={`text-[10px] font-semibold flex items-center justify-center px-1.5 py-0.5 rounded-full border shadow-xs transition-colors ${
                isSelected
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-zinc-700 border-zinc-300 group-hover:border-blue-400 group-hover:text-blue-600"
              }`}
            >
              Loop
            </div>
          </foreignObject>
        </g>
      );
    }

    // Determine exit and entry coords
    const fromCenter = { x: fromNode.x + nodeWidth / 2, y: fromNode.y + nodeHeight / 2 };
    const toCenter = { x: toNode.x + nodeWidth / 2, y: toNode.y + nodeHeight / 2 };

    const dx = toCenter.x - fromCenter.x;
    const dy = toCenter.y - fromCenter.y;

    let startX = fromNode.x + nodeWidth;
    let startY = fromNode.y + nodeHeight / 2;
    let endX = toNode.x;
    let endY = toNode.y + nodeHeight / 2;

    if (Math.abs(dx) < 60) {
      if (dy > 0) {
        startX = fromNode.x + nodeWidth / 2;
        startY = fromNode.y + nodeHeight;
        endX = toNode.x + nodeWidth / 2;
        endY = toNode.y;
      } else {
        startX = fromNode.x + nodeWidth / 2;
        startY = fromNode.y;
        endX = toNode.x + nodeWidth / 2;
        endY = toNode.y + nodeHeight;
      }
    } else if (dx < 0) {
      startX = fromNode.x;
      startY = fromNode.y + nodeHeight / 2;
      endX = toNode.x + nodeWidth;
      endY = toNode.y + nodeHeight / 2;
    }

    const curvature = Math.max(Math.abs(dx) * 0.45, 40);
    const c1x = dx >= 0 ? startX + curvature : startX - curvature;
    const c1y = startY;
    const c2x = dx >= 0 ? endX - curvature : endX + curvature;
    const c2y = endY;

    const pathD = `M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`;
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    return (
      <g key={t.transition_id} className="cursor-pointer group" onClick={() => handleSelectTransition(t)}>
        {/* Invisible wider stroke for easy click targeting */}
        <path d={pathD} fill="none" stroke="transparent" strokeWidth={16} />
        <path
          d={pathD}
          fill="none"
          stroke={isSelected ? "#2563eb" : "#94a3b8"}
          strokeWidth={isSelected ? 3 : 2}
          strokeDasharray={t.condition_logic ? "4 3" : "none"}
          markerEnd="url(#arrowhead)"
          className="transition-all duration-150 group-hover:stroke-blue-600 group-hover:stroke-[2.5]"
        />
        {/* Badge on connection arrow showing RBAC & condition flags */}
        <foreignObject x={midX - 32} y={midY - 14} width={70} height={28}>
          <div
            className={`text-[10px] font-medium flex items-center justify-center gap-1 px-2 py-0.5 rounded-full border shadow-xs transition-all ${
              isSelected
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-zinc-700 border-zinc-200 group-hover:border-blue-400 group-hover:text-blue-600"
            }`}
          >
            <Shield className="w-2.5 h-2.5" />
            <span>{t.allowed_role_ids.length}</span>
            {t.condition_logic && <Sliders className="w-2.5 h-2.5 text-amber-500" />}
          </div>
        </foreignObject>
      </g>
    );
  };

  return (
    // Top container resets parent layout p-6 to eliminate top padding & fill viewport
    <div className="-m-6 h-[calc(100vh-3.5rem)] flex flex-col bg-white overflow-hidden text-zinc-900 select-none">
      {/* ==================================================================== */}
      {/* CANVAS SUB-HEADER & CONTROLS TOOLBAR */}
      {/* ==================================================================== */}
      <div className="h-14 border-b border-zinc-200 bg-white px-6 flex items-center justify-between shrink-0 z-20 shadow-xs">
        {/* Left: Module Switcher */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-zinc-900">Workflow & State Visualizer</h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                  No-Code Engine
                </span>
              </div>
              <p className="text-xs text-zinc-500">Module 10: State Machine & Maker-Checker Pathways</p>
            </div>
          </div>

          <div className="h-6 w-px bg-zinc-200 mx-2" />

          {/* Module Selector Pill */}
          <div className="inline-flex p-0.5 bg-zinc-100 rounded-lg border border-zinc-200 text-xs">
            <button
              onClick={() => handleSwitchModule("APPLICATION")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                activeModule === "APPLICATION"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              Application Lifecycle
            </button>
            <button
              onClick={() => handleSwitchModule("POLICY")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
                activeModule === "POLICY" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              Policy Lifecycle (Clone & Swap)
            </button>
          </div>
        </div>

        {/* Right: Zoom & Canvas Actions */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center bg-zinc-50 border border-zinc-200 rounded-lg p-0.5">
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-white rounded transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono font-medium px-2 text-zinc-600 w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-white rounded transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <div className="h-4 w-px bg-zinc-200 mx-0.5" />
            <button
              onClick={handleResetView}
              title="Reset View"
              className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-white rounded transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => {
              setSaveSuccessNotice("System State Dictionary synchronized with backend workflow_states table.");
              setTimeout(() => setSaveSuccessNotice(null), 3000);
            }}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verify State Integrity
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* NOTIFICATION BANNER */}
      {/* ==================================================================== */}
      {saveSuccessNotice && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 flex items-center justify-between text-xs text-emerald-800 shrink-0 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{saveSuccessNotice}</span>
          </div>
          <button onClick={() => setSaveSuccessNotice(null)} className="text-emerald-700 hover:text-emerald-950">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MAIN CANVAS BODY WITH DOT-GRID */}
      {/* ==================================================================== */}
      <div className="flex-1 relative flex overflow-hidden bg-zinc-50">
        <div
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="flex-1 h-full w-full relative overflow-hidden cursor-grab active:cursor-grabbing bg-[radial-gradient(#d4d4d8_1px,transparent_1px)] [background-size:20px_20px]"
        >
          {/* Zoomable / Pannable Workspace */}
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
            }}
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            {/* SVG Link Layer */}
            <svg className="absolute inset-0 w-[3000px] h-[3000px] overflow-visible pointer-events-auto">
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="3"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M0,0 L0,6 L7,3 z" fill="#94a3b8" />
                </marker>
              </defs>

              {transitions.map((t) => renderPath(t))}
            </svg>

            {/* Draggable State Nodes Layer */}
            {states.map((st) => {
              const isSelected = selectedStateCode === st.state_code;
              return (
                <div
                  key={st.state_code}
                  onMouseDown={(e) => handleNodeDragStart(e, st.state_code)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStateCode(st.state_code);
                  }}
                  style={{
                    left: `${st.x}px`,
                    top: `${st.y}px`,
                    width: "200px",
                  }}
                  className={`canvas-node absolute pointer-events-auto cursor-move rounded-xl border p-3 transition-shadow duration-150 ${getNodeColorClasses(
                    st.category,
                    isSelected,
                  )}`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          st.category === "INITIAL"
                            ? "bg-zinc-400"
                            : st.category === "REVIEW"
                              ? "bg-amber-500"
                              : st.category === "PROCESSING"
                                ? "bg-blue-500"
                                : st.category === "TERMINAL_SUCCESS"
                                  ? "bg-emerald-500"
                                  : "bg-rose-500"
                        }`}
                      />
                      <span className="text-xs font-bold truncate tracking-tight">{st.label}</span>
                    </div>

                    {st.is_terminal && (
                      <span className="text-[9px] uppercase font-semibold px-1 rounded bg-zinc-200/80 text-zinc-700">
                        Term
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] font-mono text-zinc-500 truncate mb-1.5">{st.state_code}</p>

                  <div className="text-[10px] text-zinc-600 line-clamp-1 border-t border-zinc-200/60 pt-1">
                    {st.description}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Floating Canvas Legend */}
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-xs border border-zinc-200 rounded-lg p-3 shadow-md text-xs z-10 pointer-events-auto max-w-xs">
            <p className="font-semibold text-zinc-800 mb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-zinc-500" />
              State Machine Legend
            </p>
            <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-[11px] text-zinc-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-400 border border-zinc-500" />
                <span>Initial State</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-600" />
                <span>Underwriting Review</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-blue-600" />
                <span>In-Flight / Active</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-600" />
                <span>Terminal Success</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-rose-600" />
                <span>Terminal / Rejected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 border-b-2 border-dashed border-zinc-500" />
                <span>Conditional Gate</span>
              </div>
            </div>
            <p className="text-[10px] text-zinc-400 mt-2 italic">
              Tip: Drag states to reposition. Click any transition arrow to configure RBAC roles.
            </p>
          </div>
        </div>

        {/* ================================================================== */}
        {/* SCREEN 8.8.2: TRANSITION PERMISSIONS PANEL (SLIDE-OVER DRAWER) */}
        {/* ================================================================== */}
        {isConfigDrawerOpen && currentTransition && (
          <div className="w-96 border-l border-zinc-200 bg-white flex flex-col shadow-xl z-30 shrink-0 animate-slideLeft">
            {/* Drawer Header */}
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                  Transition Configurator
                </span>
                <h3 className="text-sm font-bold text-zinc-900 mt-1">Screen 8.8.2: Pathway Rules</h3>
              </div>
              <button
                onClick={() => setIsConfigDrawerOpen(false)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
              {/* Transition Pathway Display */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">
                  Active State Pathway
                </span>
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-mono font-semibold px-2 py-1 rounded bg-white border border-zinc-300 text-zinc-800 text-xs">
                    {currentTransition.from_state_code}
                  </span>
                  <ArrowRight className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-mono font-semibold px-2 py-1 rounded bg-white border border-zinc-300 text-zinc-800 text-xs">
                    {currentTransition.to_state_code}
                  </span>
                </div>
                {currentTransition.description && (
                  <p className="text-[11px] text-zinc-600 mt-2 italic">{currentTransition.description}</p>
                )}
              </div>

              {/* Section 1: Authorized RBAC Roles */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-zinc-900 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    Authorized RBAC Roles
                  </label>
                  <span className="text-[10px] text-zinc-500">{drawerRoles.length} selected</span>
                </div>
                <p className="text-[11px] text-zinc-500 mb-2.5">
                  Only staff possessing tokens matching these roles may trigger this state change via API.
                </p>

                <div className="space-y-1.5 border border-zinc-200 rounded-lg p-2 max-h-48 overflow-y-auto">
                  {ROLES.map((role) => {
                    const isChecked = drawerRoles.includes(role.role_id);
                    return (
                      <label
                        key={role.role_id}
                        className={`flex items-start gap-2.5 p-2 rounded-md cursor-pointer transition-colors ${
                          isChecked ? "bg-blue-50/60 border border-blue-200" : "hover:bg-zinc-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setDrawerRoles((prev) => [...prev, role.role_id]);
                            } else {
                              setDrawerRoles((prev) => prev.filter((id) => id !== role.role_id));
                            }
                          }}
                          className="mt-0.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-zinc-800 text-xs leading-none">{role.role_name}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">{role.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Dynamic JSON Logic Condition Builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-zinc-900 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-600" />
                    Condition Logic (JSONB Gate)
                  </label>
                  <input
                    type="checkbox"
                    checked={enableCondition}
                    onChange={(e) => setEnableCondition(e.target.checked)}
                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mb-2">
                  Enforces threshold verification (e.g. Refunds &gt; 5000 THB require Manager authorization).
                </p>

                {enableCondition ? (
                  <div className="space-y-2 border border-amber-200 bg-amber-50/30 rounded-lg p-3">
                    <div>
                      <span className="text-[10px] font-semibold text-zinc-600">Payload Field</span>
                      <select
                        value={drawerCondition?.field || "refund_amount"}
                        onChange={(e) =>
                          setDrawerCondition((prev) => ({
                            field: e.target.value,
                            operator: prev?.operator || "<=",
                            value: prev?.value || 5000,
                          }))
                        }
                        className="w-full mt-1 border border-zinc-300 rounded-md px-2 py-1 text-xs bg-white text-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="refund_amount">refund_amount (THB)</option>
                        <option value="loading_percent">loading_percent (%)</option>
                        <option value="gross_premium">gross_premium (THB)</option>
                        <option value="vehicle_age_years">vehicle_age_years</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] font-semibold text-zinc-600">Operator</span>
                        <select
                          value={drawerCondition?.operator || "<="}
                          onChange={(e) =>
                            setDrawerCondition((prev) => ({
                              field: prev?.field || "refund_amount",
                              operator: e.target.value as any,
                              value: prev?.value || 5000,
                            }))
                          }
                          className="w-full mt-1 border border-zinc-300 rounded-md px-2 py-1 text-xs bg-white text-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                        >
                          <option value="<=">&lt;= (Less than or equal)</option>
                          <option value=">=">&gt;= (Greater than or equal)</option>
                          <option value="<">&lt; (Strictly less)</option>
                          <option value=">">&gt; (Strictly greater)</option>
                          <option value="==">== (Exact match)</option>
                          <option value="!=">!= (Not equal)</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold text-zinc-600">Threshold Value</span>
                        <input
                          type="number"
                          value={drawerCondition?.value ?? 5000}
                          onChange={(e) =>
                            setDrawerCondition((prev) => ({
                              field: prev?.field || "refund_amount",
                              operator: prev?.operator || "<=",
                              value: Number(e.target.value),
                            }))
                          }
                          className="w-full mt-1 border border-zinc-300 rounded-md px-2 py-1 text-xs bg-white text-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                        />
                      </div>
                    </div>

                    {/* Compiled JSON Preview */}
                    <div className="mt-2 pt-2 border-t border-amber-200/60">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-1">
                        <FileCode className="w-3 h-3 text-zinc-400" />
                        Compiled JSONB Logic
                      </span>
                      <pre className="bg-white border border-zinc-200 rounded p-1.5 text-[10px] font-mono text-zinc-700 mt-1 overflow-x-auto">
                        {JSON.stringify(drawerCondition, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-zinc-200 rounded-lg p-3 text-center text-zinc-400 text-xs">
                    No conditional threshold. Standard RBAC role assignment applies unconditionally.
                  </div>
                )}
              </div>

              {/* Maker-Checker Compliance Notice */}
              <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-2.5 flex items-start gap-2">
                <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-900 leading-relaxed">
                  <strong>Maker-Checker Policy:</strong> Saving modifications stages an entry into{" "}
                  <code className="font-mono text-xs">approval_requests</code>. A separate Checker UUID must authorize
                  it before runtime enforcement.
                </p>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center gap-2">
              <button
                onClick={() => setIsConfigDrawerOpen(false)}
                className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-700 hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTransitionRules}
                className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 text-xs font-semibold transition-colors shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                Save Transition Rules
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowVisualizerPage;
