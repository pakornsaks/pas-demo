import {
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Lock,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  X,
  XCircle,
} from "lucide-react";
import React, { useMemo, useState } from "react";

// ============================================================================
// Types & Schema Alignment (BRD 6.7, SDD 4.7 & 4.8)
// ============================================================================

export type AuditActionType = "CREATE" | "UPDATE" | "DELETE" | "UNMASK" | "EXECUTE_APPROVAL";

export type EntityType =
  | "product_versions"
  | "plan_versions"
  | "customer_pii"
  | "workflow_transitions"
  | "commissions"
  | "policies"
  | "approval_requests";

export interface AuditLogItem {
  log_id: string;
  entity_type: EntityType;
  entity_id: string;
  action: AuditActionType;
  actor_id: string;
  actor_name: string;
  actor_email: string;
  actor_role: string;
  ip_address: string;
  timestamp: string;
  old_values: Record<string, any> | null;
  new_values: Record<string, any>;
  metadata?: {
    justification_reason?: string;
    correlation_id?: string;
    checker_id?: string;
    target_lob?: string;
  };
}

export interface ApprovalLogItem {
  log_id: string;
  request_id: string;
  target_entity: string;
  target_id: string;
  maker_name: string;
  maker_id: string;
  action: "APPROVED" | "REJECTED";
  checker_name: string;
  checker_id: string;
  comments: string;
  timestamp: string;
  proposed_changes: Record<string, any>;
}

// ============================================================================
// Mock Data (Derived directly from SDD scenarios & BRD workflows)
// ============================================================================

const MOCK_AUDIT_LOGS: AuditLogItem[] = [
  {
    log_id: "AUD-8821-2026",
    entity_type: "customer_pii",
    entity_id: "cust-uuid-4488-9921",
    action: "UNMASK",
    actor_id: "usr-0091",
    actor_name: "Anong Luksamee",
    actor_email: "anong.l@broker-portal.co.th",
    actor_role: "Operations Specialist",
    ip_address: "192.168.1.50",
    timestamp: "2026-10-13 14:20:15",
    old_values: null,
    new_values: {
      id_card_number: "1-1004-XXXX-88-9",
      phone_number: "+66 89 XXX 4567",
    },
    metadata: {
      justification_reason: "Inbound phone support: Customer identity verification for policy endorsement",
      correlation_id: "req-corr-9941a",
    },
  },
  {
    log_id: "AUD-8820-2026",
    entity_type: "commissions",
    entity_id: "comm-uuid-9901-1122",
    action: "EXECUTE_APPROVAL",
    actor_id: "usr-0012",
    actor_name: "Pakornsak Supamongkonchaikul",
    actor_email: "pakornsak@broker-portal.co.th",
    actor_role: "Finance Manager (Checker)",
    ip_address: "10.0.4.12",
    timestamp: "2026-10-13 11:45:00",
    old_values: {
      frozen_commission_rate: 15.0,
      settlement_mode: "NET",
      status: "AVAILABLE",
    },
    new_values: {
      frozen_commission_rate: 18.0,
      settlement_mode: "NET",
      status: "SETTLED",
    },
    metadata: {
      checker_id: "usr-0012",
      correlation_id: "req-corr-8820f",
    },
  },
  {
    log_id: "AUD-8819-2026",
    entity_type: "product_versions",
    entity_id: "prd-uuid-vol-motor-v2",
    action: "UPDATE",
    actor_id: "usr-0044",
    actor_name: "Somchai Prasert",
    actor_email: "somchai.p@broker-portal.co.th",
    actor_role: "Product Specialist (Maker)",
    ip_address: "10.0.12.88",
    timestamp: "2026-10-13 09:30:22",
    old_values: {
      version: "v1.0",
      status: "ACTIVE",
      base_premium: 14500.0,
      oic_vehicle_code: "1.10",
      deductible_default: 3000.0,
    },
    new_values: {
      version: "v2.0-DRAFT",
      status: "PENDING_APPROVAL",
      base_premium: 15200.0,
      oic_vehicle_code: "1.10",
      deductible_default: 2000.0,
    },
    metadata: {
      target_lob: "Voluntary Motor Type 1",
    },
  },
  {
    log_id: "AUD-8818-2026",
    entity_type: "workflow_transitions",
    entity_id: "trans-rule-492",
    action: "UPDATE",
    actor_id: "usr-0001",
    actor_name: "Kitti Wattana",
    actor_email: "kitti.w@broker-portal.co.th",
    actor_role: "System Administrator",
    ip_address: "10.0.0.5",
    timestamp: "2026-10-12 16:15:40",
    old_values: {
      from_state_code: "PENDING_REVIEW",
      to_state_code: "APPROVED_WAITING_PAYMENT",
      condition_logic: { refund_limit: 5000 },
    },
    new_values: {
      from_state_code: "PENDING_REVIEW",
      to_state_code: "APPROVED_WAITING_PAYMENT",
      condition_logic: { refund_limit: 10000, required_role: "Finance Manager" },
    },
  },
  {
    log_id: "AUD-8817-2026",
    entity_type: "policies",
    entity_id: "pol-uuid-2026-9901",
    action: "CREATE",
    actor_id: "usr-system-worker",
    actor_name: "PAS Lifecycle Worker",
    actor_email: "system.worker@internal.pas",
    actor_role: "System Automated Job",
    ip_address: "127.0.0.1",
    timestamp: "2026-10-12 00:01:10",
    old_values: null,
    new_values: {
      policy_number: "VRY-MOT-2026-00491",
      status: "ACTIVE",
      fulfillment_type: "PAS_GENERATED",
      total_premium: 18500.0,
      cmi_linked: true,
    },
  },
];

const MOCK_APPROVAL_LOGS: ApprovalLogItem[] = [
  {
    log_id: "APV-LOG-1002",
    request_id: "REQ-8888-4444",
    target_entity: "product_versions",
    target_id: "prd-uuid-vol-motor-v2",
    maker_name: "Somchai Prasert",
    maker_id: "usr-0044",
    action: "APPROVED",
    checker_name: "Pakornsak Supamongkonchaikul",
    checker_id: "usr-0012",
    comments: "Verified against Q4 OIC revised rate tables. Effective immediate start.",
    timestamp: "2026-10-13 14:00:22",
    proposed_changes: {
      base_premium: { old: 14500.0, new: 15200.0 },
      deductible_default: { old: 3000.0, new: 2000.0 },
    },
  },
  {
    log_id: "APV-LOG-1001",
    request_id: "REQ-8887-1100",
    target_entity: "commissions",
    target_id: "comm-override-agt-09",
    maker_name: "Tawan Somboon",
    maker_id: "usr-0077",
    action: "REJECTED",
    checker_name: "Pakornsak Supamongkonchaikul",
    checker_id: "usr-0012",
    comments: "Requested rate exceeds maximum authorized broker margin tier for non-fleet agents.",
    timestamp: "2026-10-12 11:20:00",
    proposed_changes: {
      agent_commission_percent: { old: 12.0, new: 22.5 },
    },
  },
];

// ============================================================================
// Helper Subcomponents
// ============================================================================

const ActionBadge: React.FC<{ action: AuditActionType }> = ({ action }) => {
  const configs: Record<AuditActionType, { bg: string; text: string; border: string }> = {
    CREATE: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    UPDATE: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    DELETE: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
    UNMASK: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-300" },
    EXECUTE_APPROVAL: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  };

  const style = configs[action] || { bg: "bg-zinc-50", text: "text-zinc-700", border: "border-zinc-200" };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}
    >
      {action === "UNMASK" && <Lock className="w-3 h-3 mr-1 text-amber-600" />}
      {action}
    </span>
  );
};

const EntityBadge: React.FC<{ entity: EntityType | string }> = ({ entity }) => {
  return (
    <span className="font-mono text-xs px-2 py-0.5 bg-zinc-100 text-zinc-700 border border-zinc-200 rounded">
      {entity}
    </span>
  );
};

// ============================================================================
// Main Page Component
// ============================================================================

export const AuditTrailPage: React.FC = () => {
  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<"system_audit" | "maker_checker">("system_audit");

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<string>("ALL");
  const [selectedAction, setSelectedAction] = useState<string>("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Inspector Modal State
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogItem | null>(null);
  const [selectedApprovalLog, setSelectedApprovalLog] = useState<ApprovalLogItem | null>(null);

  // Handlers
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Filtered System Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return MOCK_AUDIT_LOGS.filter((item) => {
      const matchSearch =
        item.log_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.entity_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.actor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ip_address.includes(searchTerm);

      const matchEntity = selectedEntity === "ALL" || item.entity_type === selectedEntity;
      const matchAction = selectedAction === "ALL" || item.action === selectedAction;

      return matchSearch && matchEntity && matchAction;
    });
  }, [searchTerm, selectedEntity, selectedAction]);

  return (
    // Top negative margins cleanly cancel parent's padding for a seamless flush header
    <div className="-mt-6 -mx-6 min-h-full bg-zinc-50 flex flex-col antialiased">
      {/* =====================================================================
          1. Header Banner & Context Navigation (Flush to top)
         ===================================================================== */}
      <div className="bg-white border-b border-zinc-200 px-6 py-4 shrink-0 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-zinc-800" />
              Audit Trail & Compliance Ledger
            </h1>
            <p className="text-sm text-zinc-600 mt-0.5">
              Strictly write-only, immutable transaction tracking compliant with Thai PDPA, OIC regulations, and
              Maker-Checker segregation.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-3 py-2 border border-zinc-300 rounded-md shadow-sm text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50 transition"
              title="Refresh ledger feed"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 text-zinc-500 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => alert("Exporting compliance CSV extract (OIC Auditable Format)...")}
              className="inline-flex items-center px-3.5 py-2 border border-zinc-800 rounded-md shadow-sm text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 transition"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export OIC Log
            </button>
          </div>
        </div>

        {/* ===================================================================
            2. Tab Switcher
           =================================================================== */}
        <div className="flex border-b border-zinc-200 mt-6 -mb-4 space-x-8">
          <button
            onClick={() => setActiveTab("system_audit")}
            className={`pb-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "system_audit"
                ? "border-zinc-900 text-zinc-900 font-semibold"
                : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <FileText className="w-4 h-4" />
            System Audit Logs (<span className="font-mono text-xs">{MOCK_AUDIT_LOGS.length}</span>)
          </button>
          <button
            onClick={() => setActiveTab("maker_checker")}
            className={`pb-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "maker_checker"
                ? "border-zinc-900 text-zinc-900 font-semibold"
                : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Maker-Checker Decision Trail (<span className="font-mono text-xs">{MOCK_APPROVAL_LOGS.length}</span>)
          </button>
        </div>
      </div>

      {/* =====================================================================
          3. Sub-Header Filter Bar
         ===================================================================== */}
      <div className="p-6 pb-2">
        <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search Log ID, Entity ID, Actor, or IP Address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-zinc-300 rounded-md bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-800 focus:border-zinc-800"
              />
            </div>

            {/* Entity Selector */}
            <div>
              <select
                value={selectedEntity}
                onChange={(e) => setSelectedEntity(e.target.value)}
                className="w-full py-2 px-3 text-sm border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-800 focus:border-zinc-800"
              >
                <option value="ALL">All Target Entities</option>
                <option value="product_versions">product_versions</option>
                <option value="customer_pii">customer_pii (PDPA)</option>
                <option value="commissions">commissions</option>
                <option value="workflow_transitions">workflow_transitions</option>
                <option value="policies">policies</option>
              </select>
            </div>

            {/* Action Selector */}
            <div>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full py-2 px-3 text-sm border border-zinc-300 rounded-md bg-white text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-800 focus:border-zinc-800"
              >
                <option value="ALL">All Actions</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="UNMASK">UNMASK (PDPA Access)</option>
                <option value="EXECUTE_APPROVAL">EXECUTE_APPROVAL</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100 text-xs text-zinc-500">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-zinc-700">Audit Rule Applied:</span>
              <span className="bg-zinc-100 px-2 py-0.5 rounded text-zinc-600">
                SCD Type 2 Snapshot Immutability Enabled
              </span>
              <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                AES-256 PII Unmask Logging Mandatory
              </span>
            </div>
            <span>
              Showing {activeTab === "system_audit" ? filteredAuditLogs.length : MOCK_APPROVAL_LOGS.length} records
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          4. Main Content Table
         ===================================================================== */}
      <div className="px-6 pb-6 flex-1">
        <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
          {activeTab === "system_audit" ? (
            /* System Audit Log Table */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Log ID & Timestamp</th>
                    <th className="py-3 px-4">Entity Context</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Actor & Role</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4 text-right">Inspection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-zinc-800">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-500">
                        <FileText className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
                        No audit records match the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => (
                      <tr key={log.log_id} className="hover:bg-zinc-50 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs">
                          <div className="font-semibold text-zinc-900">{log.log_id}</div>
                          <div className="text-zinc-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {log.timestamp}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <EntityBadge entity={log.entity_type} />
                          </div>
                          <div className="font-mono text-xs text-zinc-500 truncate max-w-[200px]" title={log.entity_id}>
                            ID: {log.entity_id}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <ActionBadge action={log.action} />
                          {log.action === "UNMASK" && log.metadata?.justification_reason && (
                            <div className="text-[11px] text-amber-700 italic mt-1 line-clamp-1 max-w-[240px]">
                              "{log.metadata.justification_reason}"
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-xs font-medium text-zinc-900">{log.actor_name}</div>
                          <div className="text-[11px] text-zinc-500">{log.actor_role}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-zinc-600">{log.ip_address}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedAuditLog(log)}
                            className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded shadow-sm hover:bg-zinc-100 transition"
                          >
                            <Eye className="w-3 h-3 mr-1 text-zinc-500" />
                            View Diff
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* Maker-Checker Decisions Table */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Approval Log ID</th>
                    <th className="py-3 px-4">Target Entity</th>
                    <th className="py-3 px-4">Decision</th>
                    <th className="py-3 px-4">Maker (Requester)</th>
                    <th className="py-3 px-4">Checker (Approver)</th>
                    <th className="py-3 px-4">Checker Comments</th>
                    <th className="py-3 px-4 text-right">Inspection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-zinc-800">
                  {MOCK_APPROVAL_LOGS.map((item) => (
                    <tr key={item.log_id} className="hover:bg-zinc-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs">
                        <div className="font-semibold text-zinc-900">{item.log_id}</div>
                        <div className="text-zinc-500">{item.timestamp}</div>
                      </td>
                      <td className="py-3 px-4">
                        <EntityBadge entity={item.target_entity} />
                        <div className="font-mono text-xs text-zinc-500 mt-1 truncate max-w-[180px]">
                          Req: {item.request_id}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {item.action === "APPROVED" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                            APPROVED
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3 mr-1 text-rose-600" />
                            REJECTED
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs font-medium text-zinc-900">{item.maker_name}</div>
                        <div className="text-[11px] font-mono text-zinc-500">ID: {item.maker_id}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs font-medium text-zinc-900">{item.checker_name}</div>
                        <div className="text-[11px] font-mono text-zinc-500">ID: {item.checker_id}</div>
                      </td>
                      <td className="py-3 px-4 max-w-[280px]">
                        <p className="text-xs text-zinc-700 truncate" title={item.comments}>
                          {item.comments}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedApprovalLog(item)}
                          className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded shadow-sm hover:bg-zinc-100 transition"
                        >
                          <Eye className="w-3 h-3 mr-1 text-zinc-500" />
                          Inspect Payload
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer / Pagination */}
          <div className="mt-auto px-4 py-3 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-600">
            <div>
              Showing <span className="font-semibold text-zinc-900">1</span> to{" "}
              <span className="font-semibold text-zinc-900">
                {activeTab === "system_audit" ? filteredAuditLogs.length : MOCK_APPROVAL_LOGS.length}
              </span>{" "}
              of <span className="font-semibold text-zinc-900">{activeTab === "system_audit" ? 5 : 2}</span> entries
            </div>
            <div className="flex items-center space-x-2">
              <button
                disabled
                className="px-2.5 py-1 border border-zinc-200 bg-white rounded text-zinc-400 cursor-not-allowed"
              >
                Previous
              </button>
              <button className="px-2.5 py-1 border border-zinc-800 bg-zinc-900 text-white rounded font-medium">
                1
              </button>
              <button
                disabled
                className="px-2.5 py-1 border border-zinc-200 bg-white rounded text-zinc-400 cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          5. Visual Diff & PII Inspector Modal (Old vs. New Snapshot)
         ===================================================================== */}
      {selectedAuditLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-zinc-500">AUDIT LOG INSPECTOR</span>
                  <ActionBadge action={selectedAuditLog.action} />
                </div>
                <h2 className="text-lg font-bold text-zinc-900 mt-0.5">Log Entry: {selectedAuditLog.log_id}</h2>
              </div>
              <button
                onClick={() => setSelectedAuditLog(null)}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-md transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Metadata Overview Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-zinc-50 border border-zinc-200 rounded-lg text-xs">
                <div>
                  <div className="text-zinc-500 font-medium">Entity Type</div>
                  <div className="font-mono font-semibold text-zinc-900 mt-0.5">{selectedAuditLog.entity_type}</div>
                </div>
                <div>
                  <div className="text-zinc-500 font-medium">Entity UUID</div>
                  <div className="font-mono text-zinc-700 truncate mt-0.5" title={selectedAuditLog.entity_id}>
                    {selectedAuditLog.entity_id}
                  </div>
                </div>
                <div>
                  <div className="text-zinc-500 font-medium">Actor</div>
                  <div className="text-zinc-900 font-medium mt-0.5">{selectedAuditLog.actor_name}</div>
                  <div className="text-zinc-500 text-[10px]">{selectedAuditLog.actor_role}</div>
                </div>
                <div>
                  <div className="text-zinc-500 font-medium">Network Origin</div>
                  <div className="font-mono text-zinc-700 mt-0.5">{selectedAuditLog.ip_address}</div>
                  <div className="text-zinc-500 text-[10px]">{selectedAuditLog.timestamp}</div>
                </div>
              </div>

              {/* Special Alert for PDPA Unmasking Event */}
              {selectedAuditLog.action === "UNMASK" && selectedAuditLog.metadata?.justification_reason && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wider">
                    <Lock className="w-3.5 h-3.5" />
                    PDPA Statutory Compliance Audit Entry
                  </div>
                  <p className="text-sm text-amber-900 mt-1 font-medium">
                    {selectedAuditLog.metadata.justification_reason}
                  </p>
                  <p className="text-xs text-amber-700 mt-2">
                    Note: Unmasking events are cryptographically recorded in accordance with Thai PDPA regulations and
                    OIC guidelines.
                  </p>
                </div>
              )}

              {/* Side-by-Side Diff Viewer */}
              <div>
                <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                  Payload State Comparison (Snapshot Versioning SCD Type 2)[cite: 2]
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Old Values */}
                  <div className="border border-red-200 rounded-lg overflow-hidden bg-red-50/20">
                    <div className="bg-red-50 px-3 py-1.5 border-b border-red-200 text-xs font-semibold text-red-700 flex items-center justify-between">
                      <span>BEFORE STATE (Old Values)</span>
                      {selectedAuditLog.old_values === null && (
                        <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                          NULL (Insertion)
                        </span>
                      )}
                    </div>
                    <pre className="p-3 text-xs font-mono text-zinc-800 overflow-x-auto whitespace-pre-wrap">
                      {selectedAuditLog.old_values
                        ? JSON.stringify(selectedAuditLog.old_values, null, 2)
                        : "// No previous record (New row created)"}
                    </pre>
                  </div>

                  {/* Right: New Values */}
                  <div className="border border-emerald-200 rounded-lg overflow-hidden bg-emerald-50/20">
                    <div className="bg-emerald-50 px-3 py-1.5 border-b border-emerald-200 text-xs font-semibold text-emerald-700 flex items-center justify-between">
                      <span>AFTER STATE (New Values)</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">APPLIED</span>
                    </div>
                    <pre className="p-3 text-xs font-mono text-zinc-800 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(selectedAuditLog.new_values, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-zinc-50 border-t border-zinc-200 flex justify-end">
              <button
                onClick={() => setSelectedAuditLog(null)}
                className="px-4 py-2 border border-zinc-300 rounded text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-100 transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          6. Maker-Checker Inspection Modal
         ===================================================================== */}
      {selectedApprovalLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div>
                <span className="text-xs font-mono font-semibold text-zinc-500">MAKER-CHECKER DECISION RECORD</span>
                <h2 className="text-lg font-bold text-zinc-900 mt-0.5">{selectedApprovalLog.log_id}</h2>
              </div>
              <button onClick={() => setSelectedApprovalLog(null)} className="text-zinc-400 hover:text-zinc-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg grid grid-cols-2 gap-4">
                <div>
                  <span className="text-zinc-500">Maker (Requested By):</span>
                  <div className="font-semibold text-zinc-900 mt-0.5">{selectedApprovalLog.maker_name}</div>
                  <div className="font-mono text-zinc-500">{selectedApprovalLog.maker_id}</div>
                </div>
                <div>
                  <span className="text-zinc-500">Checker (Decided By):</span>
                  <div className="font-semibold text-zinc-900 mt-0.5">{selectedApprovalLog.checker_name}</div>
                  <div className="font-mono text-zinc-500">{selectedApprovalLog.checker_id}</div>
                </div>
              </div>

              <div>
                <span className="font-bold text-zinc-700">Checker Formal Justification:</span>
                <p className="mt-1 p-3 bg-zinc-100 rounded text-zinc-900 italic border border-zinc-200">
                  "{selectedApprovalLog.comments}"
                </p>
              </div>

              <div>
                <span className="font-bold text-zinc-700">Proposed Changes Staged:</span>
                <pre className="mt-1 p-3 bg-zinc-900 text-zinc-100 rounded font-mono text-xs overflow-x-auto">
                  {JSON.stringify(selectedApprovalLog.proposed_changes, null, 2)}
                </pre>
              </div>
            </div>

            <div className="px-6 py-3 bg-zinc-50 border-t border-zinc-200 flex justify-end">
              <button
                onClick={() => setSelectedApprovalLog(null)}
                className="px-4 py-2 border border-zinc-300 rounded text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-100 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditTrailPage;
