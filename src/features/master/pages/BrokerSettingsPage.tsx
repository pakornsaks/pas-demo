import {
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Filter,
  GitCommit,
  History,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import React, { useMemo, useState } from "react";

// ============================================================================
// TypeScript Interfaces & Data Contracts (SDD 4.3, 4.7, 4.8)
// ============================================================================

export type SettlementMode = "NET" | "GROSS";

export interface BrokerInsurerSetting {
  brokerId: string;
  insurerId: string;
  insurerCode: string;
  insurerNameTh: string;
  insurerNameEn: string;
  monthlyPayDate: number; // 1 - 31
  settlementMode: SettlementMode;
  lastUpdated: string;
  updatedBy: string;
  version: number;
}

export interface BrokerChannelSetting {
  brokerId: string;
  channelId: number; // 1: Telesales, 2: Direct, 3: Web, 4: Sub-agent
  channelName: string;
  warningDaysBeforeDue: number;
  autoCancelOffsetDays: number;
  lastUpdated: string;
  updatedBy: string;
  version: number;
}

export interface AuditTrailRecord {
  logId: string;
  timestamp: string;
  entityType: "broker_insurer_settings" | "broker_channel_settings" | "brokers";
  entityId: string;
  entityName: string;
  action: "UPDATE" | "CREATE" | "DELETE" | "MAKER_CHECKER_APPROVAL";
  actorId: string;
  actorName: string;
  actorRole: string;
  ipAddress: string;
  approvalRequestId?: string;
  checkerName?: string;
  checkerComment?: string;
  oldValues: Record<string, any> | null;
  newValues: Record<string, any>;
  changeSummary: string[];
}

// ============================================================================
// Mock Data (Aligned with BRD 6.1, 6.2 & 8.1.3)
// ============================================================================

const MOCK_INSURER_SETTINGS: BrokerInsurerSetting[] = [
  {
    brokerId: "brk-001",
    insurerId: "ins-01",
    insurerCode: "VIRIYAH",
    insurerNameTh: "วิริยะประกันภัย",
    insurerNameEn: "Viriyah Insurance PCL",
    monthlyPayDate: 15,
    settlementMode: "NET",
    lastUpdated: "2026-03-28 14:32:00",
    updatedBy: "Somsak Finance (Checker)",
    version: 4,
  },
  {
    brokerId: "brk-001",
    insurerId: "ins-02",
    insurerCode: "MSIG",
    insurerNameTh: "เอ็ม เอส ไอ จี ประกันภัย",
    insurerNameEn: "MSIG Insurance (Thailand)",
    monthlyPayDate: 25,
    settlementMode: "GROSS",
    lastUpdated: "2026-03-15 11:20:10",
    updatedBy: "Kanya Settlement (Checker)",
    version: 2,
  },
  {
    brokerId: "brk-001",
    insurerId: "ins-03",
    insurerCode: "DIPAYA",
    insurerNameTh: "ทิพยประกันภัย",
    insurerNameEn: "Dhipaya Insurance PCL",
    monthlyPayDate: 20,
    settlementMode: "NET",
    lastUpdated: "2026-02-10 09:14:45",
    updatedBy: "Somsak Finance (Checker)",
    version: 3,
  },
  {
    brokerId: "brk-001",
    insurerId: "ins-04",
    insurerCode: "BANGKOK",
    insurerNameTh: "กรุงเทพประกันภัย",
    insurerNameEn: "Bangkok Insurance PCL",
    monthlyPayDate: 28,
    settlementMode: "GROSS",
    lastUpdated: "2026-01-05 16:40:12",
    updatedBy: "System Migrator",
    version: 1,
  },
];

const MOCK_CHANNEL_SETTINGS: BrokerChannelSetting[] = [
  {
    brokerId: "brk-001",
    channelId: 1,
    channelName: "Tele sales",
    warningDaysBeforeDue: 3,
    autoCancelOffsetDays: 0, // Cancels on Effective Date
    lastUpdated: "2026-03-20 10:15:00",
    updatedBy: "Pakornsak Admin",
    version: 3,
  },
  {
    brokerId: "brk-001",
    channelId: 2,
    channelName: "Direct sale",
    warningDaysBeforeDue: 2,
    autoCancelOffsetDays: 3,
    lastUpdated: "2026-02-14 17:00:22",
    updatedBy: "Pakornsak Admin",
    version: 2,
  },
  {
    brokerId: "brk-001",
    channelId: 3,
    channelName: "Website (Online STP)",
    warningDaysBeforeDue: 1,
    autoCancelOffsetDays: 1,
    lastUpdated: "2026-03-01 08:45:11",
    updatedBy: "Ops Lead",
    version: 4,
  },
  {
    brokerId: "brk-001",
    channelId: 4,
    channelName: "Sub agent (Affiliate)",
    warningDaysBeforeDue: 7,
    autoCancelOffsetDays: 30, // 30 Days grace period
    lastUpdated: "2026-03-29 16:11:40",
    updatedBy: "Pakornsak Admin",
    version: 5,
  },
];

const MOCK_AUDIT_TRAIL: AuditTrailRecord[] = [
  {
    logId: "aud-8801",
    timestamp: "2026-03-29 16:11:40",
    entityType: "broker_channel_settings",
    entityId: "channel_id=4",
    entityName: "Sub agent Channel SLA",
    action: "UPDATE",
    actorId: "usr-4412",
    actorName: "Nipon Operations (Maker)",
    actorRole: "Ops Specialist",
    ipAddress: "192.168.1.104",
    approvalRequestId: "req-9904",
    checkerName: "Pakornsak Admin (Checker)",
    checkerComment: "Approved SLA grace period extension for affiliated broker networks.",
    oldValues: {
      channel_id: 4,
      warning_days_before: 5,
      auto_cancel_offset: 15,
    },
    newValues: {
      channel_id: 4,
      warning_days_before: 7,
      auto_cancel_offset: 30,
    },
    changeSummary: ["warning_days_before: 5 → 7 days", "auto_cancel_offset: 15 → 30 days"],
  },
  {
    logId: "aud-8802",
    timestamp: "2026-03-28 14:32:00",
    entityType: "broker_insurer_settings",
    entityId: "insurer_id=ins-01",
    entityName: "Viriyah Insurance Remittance Schedule",
    action: "MAKER_CHECKER_APPROVAL",
    actorId: "usr-3310",
    actorName: "Ploypailin Accounting (Maker)",
    actorRole: "Finance Officer",
    ipAddress: "192.168.1.88",
    approvalRequestId: "req-9882",
    checkerName: "Somsak Finance (Checker)",
    checkerComment: "Verified updated Bordereau settlement cycle schedule with Viriyah finance lead.",
    oldValues: {
      monthly_pay_date: 10,
      settlement_mode: "GROSS",
    },
    newValues: {
      monthly_pay_date: 15,
      settlement_mode: "NET",
    },
    changeSummary: ["monthly_pay_date: 10th → 15th of month", "settlement_mode: GROSS → NET (Deduct Before)"],
  },
  {
    logId: "aud-8803",
    timestamp: "2026-03-20 10:15:00",
    entityType: "broker_channel_settings",
    entityId: "channel_id=1",
    entityName: "Tele sales Policy Auto-Cancellation",
    action: "UPDATE",
    actorId: "usr-1102",
    actorName: "Kanya Settlement (Maker)",
    actorRole: "Operations Officer",
    ipAddress: "192.168.2.14",
    approvalRequestId: "req-9740",
    checkerName: "Pakornsak Admin (Checker)",
    checkerComment: "Enforced instant auto-cancellation on effective date for Telesales non-payments.",
    oldValues: {
      auto_cancel_offset: 5,
    },
    newValues: {
      auto_cancel_offset: 0,
    },
    changeSummary: ["auto_cancel_offset: 5 → 0 days (Cancels on Effective Date)"],
  },
  {
    logId: "aud-8804",
    timestamp: "2026-03-15 11:20:10",
    entityType: "broker_insurer_settings",
    entityId: "insurer_id=ins-02",
    entityName: "MSIG Insurance Remittance Schedule",
    action: "UPDATE",
    actorId: "usr-3310",
    actorName: "Ploypailin Accounting (Maker)",
    actorRole: "Finance Officer",
    ipAddress: "192.168.1.88",
    approvalRequestId: "req-9621",
    checkerName: "Kanya Settlement (Checker)",
    checkerComment: "Adjusted EOM Bordereau cutoff day per MSIG SLA.",
    oldValues: {
      monthly_pay_date: 20,
    },
    newValues: {
      monthly_pay_date: 25,
    },
    changeSummary: ["monthly_pay_date: 20th → 25th of month"],
  },
];

// ============================================================================
// Main Component
// ============================================================================

export const BrokerSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"trail" | "insurer_rules" | "channel_rules">("trail");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntityType, setSelectedEntityType] = useState<string>("ALL");
  const [selectedDiffLog, setSelectedDiffLog] = useState<AuditTrailRecord | null>(null);

  // Filtered Audit Trail
  const filteredAuditLogs = useMemo(() => {
    return MOCK_AUDIT_TRAIL.filter((log) => {
      const matchesSearch =
        log.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.checkerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.logId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.changeSummary.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesEntity = selectedEntityType === "ALL" || log.entityType === selectedEntityType;

      return matchesSearch && matchesEntity;
    });
  }, [searchQuery, selectedEntityType]);

  return (
    // Note: Container uses -mt-6 -mx-6 to cancel parent layout padding,
    // ensuring no padding on top container, docking flush with the Backoffice Header.
    <div className="-mt-6 -mx-6 bg-zinc-50 min-h-screen text-zinc-900 pb-12">
      {/* ==================================================================== */}
      {/* 1. Header Toolbar (Flush Light Theme Banner)                         */}
      {/* ==================================================================== */}
      <div className="bg-white border-b border-zinc-200 px-6 py-4 shadow-xs sticky top-0 z-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mt-1">
              <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
                Broker Operations & Settlement Audit Trail
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Immutable Log (SCD Type 2)
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Review configuration changes, Maker-Checker decision records, and chronological version snapshots for
              Broker entities.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => alert("Exporting Broker Settings Trail (OIC Compliance CSV format)...")}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg shadow-2xs hover:bg-zinc-50 hover:border-zinc-400 transition"
            >
              <Download className="w-3.5 h-3.5 text-zinc-500" />
              Export Audit Trail
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg shadow-xs hover:bg-blue-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-6 mt-4 border-b border-zinc-200">
          <button
            onClick={() => setActiveTab("trail")}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === "trail"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <History className="w-4 h-4" />
            Audit Trail & Version Timeline
            <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-zinc-100 text-zinc-600 rounded-full font-bold">
              {MOCK_AUDIT_TRAIL.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("insurer_rules")}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === "insurer_rules"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Active Insurer Settlement Rules
            <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-zinc-100 text-zinc-600 rounded-full font-bold">
              {MOCK_INSURER_SETTINGS.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("channel_rules")}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === "channel_rules"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Active Channel SLA & Auto-Cancel Rules
            <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-zinc-100 text-zinc-600 rounded-full font-bold">
              {MOCK_CHANNEL_SETTINGS.length}
            </span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. Main Tab Contents (Contained in px-6 py-5)                         */}
      {/* ==================================================================== */}
      <div className="px-6 py-5 space-y-6">
        {/* TAB 1: AUDIT TRAIL TIMELINE & DIFF VIEWER */}
        {activeTab === "trail" && (
          <div className="space-y-4">
            {/* Filter / Search Bar */}
            <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search logs, actors, or changed fields..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white text-zinc-800"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Target Entity:</span>
                </div>
                <select
                  value={selectedEntityType}
                  onChange={(e) => setSelectedEntityType(e.target.value)}
                  className="text-xs bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">All Entities</option>
                  <option value="broker_insurer_settings">Insurer Remittances (broker_insurer_settings)</option>
                  <option value="broker_channel_settings">Channel SLAs (broker_channel_settings)</option>
                  <option value="brokers">Broker Profiles (brokers)</option>
                </select>
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider font-semibold text-[11px]">
                      <th className="py-3 px-4">Audit ID & Timestamp</th>
                      <th className="py-3 px-4">Target Entity</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Maker / Operator</th>
                      <th className="py-3 px-4">Checker / Approver</th>
                      <th className="py-3 px-4">Changes Applied</th>
                      <th className="py-3 px-4 text-right">Inspection</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {filteredAuditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-zinc-500 text-xs">
                          No audit trail records matched the active filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredAuditLogs.map((log) => (
                        <tr key={log.logId} className="hover:bg-zinc-50/80 transition-colors">
                          {/* Audit ID & Timestamp */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="font-mono font-semibold text-blue-600 text-xs">{log.logId}</div>
                            <div className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-zinc-400" />
                              {log.timestamp}
                            </div>
                            <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">IP: {log.ipAddress}</div>
                          </td>

                          {/* Target Entity */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="font-medium text-zinc-900">{log.entityName}</div>
                            <div className="text-[11px] font-mono text-zinc-400">{log.entityType}</div>
                            <span className="inline-block mt-1 text-[10px] px-1.5 py-0.2 bg-zinc-100 text-zinc-600 rounded font-mono">
                              {log.entityId}
                            </span>
                          </td>

                          {/* Action Badge */}
                          <td className="py-3.5 px-4 align-top">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${
                                log.action === "MAKER_CHECKER_APPROVAL"
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : log.action === "UPDATE"
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              {log.action.replace(/_/g, " ")}
                            </span>
                          </td>

                          {/* Maker */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="font-medium text-zinc-800">{log.actorName}</div>
                            <div className="text-[10px] text-zinc-400">{log.actorRole}</div>
                          </td>

                          {/* Checker */}
                          <td className="py-3.5 px-4 align-top">
                            {log.checkerName ? (
                              <div>
                                <div className="font-medium text-zinc-800 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                  {log.checkerName}
                                </div>
                                <div className="text-[10px] text-zinc-400 italic line-clamp-1 max-w-[180px]">
                                  "{log.checkerComment}"
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-zinc-400 italic">Direct Sys Update</span>
                            )}
                          </td>

                          {/* Changes Applied */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="space-y-1">
                              {log.changeSummary.map((change, idx) => (
                                <div
                                  key={idx}
                                  className="text-[11px] text-zinc-700 font-mono bg-zinc-100/70 px-2 py-0.5 rounded border border-zinc-200/60 inline-block mr-1"
                                >
                                  {change}
                                </div>
                              ))}
                            </div>
                          </td>

                          {/* Inspection Action */}
                          <td className="py-3.5 px-4 align-top text-right">
                            <button
                              onClick={() => setSelectedDiffLog(log)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition"
                            >
                              <Eye className="w-3 h-3" />
                              Inspect Diff
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INSURER SETTLEMENT SCHEDULES (BRD 8.1.3 TAB A) */}
        {activeTab === "insurer_rules" && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <h2 className="text-sm font-bold text-zinc-900">
                  Insurer Remittance Schedules (<span className="font-mono text-blue-600">broker_insurer_settings</span>
                  )
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Governs the exact monthly date the Broker is legally mandated to remit collected premiums to each
                  Insurer (Drives EOM Bordereau & Broker Payable Reports).
                </p>
              </div>
              <span className="text-xs bg-zinc-100 text-zinc-700 font-medium px-3 py-1 rounded-lg border border-zinc-200">
                Broker Code: <strong className="text-zinc-900 font-mono">BRK-MAIN-001</strong>
              </span>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider font-semibold text-[11px]">
                    <th className="py-3 px-4">Insurer Entity</th>
                    <th className="py-3 px-4">Settlement Mode</th>
                    <th className="py-3 px-4">Monthly Remittance Day</th>
                    <th className="py-3 px-4">Snapshot Version</th>
                    <th className="py-3 px-4">Last Modified</th>
                    <th className="py-3 px-4 text-right">Governance Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {MOCK_INSURER_SETTINGS.map((rule) => (
                    <tr key={rule.insurerId} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-zinc-900">{rule.insurerNameTh}</div>
                        <div className="text-[11px] text-zinc-500">{rule.insurerNameEn}</div>
                        <span className="font-mono text-[10px] text-zinc-400">ID: {rule.insurerCode}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                            rule.settlementMode === "NET"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          }`}
                        >
                          {rule.settlementMode === "NET" ? "NET (Deduct Before)" : "GROSS (Deduct After)"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-zinc-800 text-sm">
                          {rule.monthlyPayDate}
                          <span className="text-xs text-zinc-400 font-normal">th of every month</span>
                        </div>
                        <span className="text-[10px] text-zinc-400">Auto-triggers EOM Bordereau compilation</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded border border-zinc-200">
                          <GitCommit className="w-3 h-3 text-zinc-500" />v{rule.version}.0
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-zinc-700 font-medium">{rule.updatedBy}</div>
                        <div className="text-[11px] text-zinc-400">{rule.lastUpdated}</div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setActiveTab("trail");
                            setSearchQuery(rule.insurerNameTh);
                          }}
                          className="px-2.5 py-1 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg shadow-2xs transition"
                        >
                          View Remittance Trail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CHANNEL SLA & AUTO-CANCEL RULES (BRD 8.1.3 TAB B) */}
        {activeTab === "channel_rules" && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <h2 className="text-sm font-bold text-zinc-900">
                  Channel SLA & Auto-Cancellation Configuration (
                  <span className="font-mono text-blue-600">broker_channel_settings</span>)
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Controls dynamic CRON worker logic for payment warning notifications and unpaid policy
                  auto-cancellations per sales origin.
                </p>
              </div>
              <span className="text-xs bg-zinc-100 text-zinc-700 font-medium px-3 py-1 rounded-lg border border-zinc-200">
                4 Fixed Channels Supported (BRD 6.1)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MOCK_CHANNEL_SETTINGS.map((channel) => (
                <div
                  key={channel.channelId}
                  className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs hover:border-zinc-300 transition"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                        {channel.channelId}
                      </span>
                      <h3 className="font-bold text-zinc-900 text-sm">{channel.channelName}</h3>
                    </div>
                    <span className="font-mono text-xs px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded">
                      v{channel.version}.0
                    </span>
                  </div>

                  <div className="mt-3.5 space-y-3">
                    <div className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
                      <div>
                        <div className="text-xs font-semibold text-zinc-800">Payment Warning Notification</div>
                        <div className="text-[10px] text-zinc-400">warning_days_before_due (CRON SMS/Email)</div>
                      </div>
                      <span className="text-xs font-bold text-blue-600 px-2 py-1 bg-white rounded border border-zinc-200 font-mono">
                        {channel.warningDaysBeforeDue} Days Before Due
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
                      <div>
                        <div className="text-xs font-semibold text-zinc-800">Unpaid Auto-Cancel Grace Offset</div>
                        <div className="text-[10px] text-zinc-400">auto_cancel_offset_days (LIF-08 Engine)</div>
                      </div>
                      <span className="text-xs font-bold text-amber-700 px-2 py-1 bg-white rounded border border-zinc-200 font-mono">
                        {channel.autoCancelOffsetDays === 0
                          ? "0 Days (On Effective Date)"
                          : `+${channel.autoCancelOffsetDays} Days After Effective`}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
                    <span>Updated by: {channel.updatedBy}</span>
                    <button
                      onClick={() => {
                        setActiveTab("trail");
                        setSearchQuery(channel.channelName);
                      }}
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      View Change History →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 3. Side-by-Side Diff Inspection Modal (BRD 7.9 & BO-09)              */}
      {/* ==================================================================== */}
      {selectedDiffLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-600">{selectedDiffLog.logId}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200">
                    {selectedDiffLog.action.replace(/_/g, " ")}
                  </span>
                </div>
                <h3 className="text-base font-bold text-zinc-900 mt-1">
                  Side-by-Side Inspection: {selectedDiffLog.entityName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDiffLog(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Maker / Checker Audit Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs">
                <div>
                  <div className="text-zinc-400 text-[11px] font-semibold uppercase">Proposed By (Maker)</div>
                  <div className="font-bold text-zinc-800 mt-0.5">{selectedDiffLog.actorName}</div>
                  <div className="text-zinc-500 text-[11px]">Role: {selectedDiffLog.actorRole}</div>
                  <div className="text-zinc-400 text-[10px] mt-1 font-mono">Time: {selectedDiffLog.timestamp}</div>
                </div>

                <div className="border-t md:border-t-0 md:border-l border-zinc-200 md:pl-4 pt-2 md:pt-0">
                  <div className="text-zinc-400 text-[11px] font-semibold uppercase">Approved By (Checker)</div>
                  <div className="font-bold text-zinc-800 mt-0.5">
                    {selectedDiffLog.checkerName || "Automated Pipeline / N/A"}
                  </div>
                  <div className="text-zinc-600 text-[11px] italic mt-0.5">
                    "{selectedDiffLog.checkerComment || "Standard rule execution without objection."}"
                  </div>
                </div>
              </div>

              {/* Side-by-Side Diff Panels */}
              <div>
                <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                  Payload Difference (SCD Type 2 Snapshot)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Old Values */}
                  <div className="bg-red-50/40 border border-red-200 rounded-xl p-3.5">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-red-100">
                      <span className="text-xs font-bold text-red-700">Previous Active State (Old)</span>
                      <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-mono">
                        ORIGINAL
                      </span>
                    </div>
                    <pre className="text-xs font-mono text-zinc-800 bg-white p-3 rounded-lg border border-red-100 overflow-x-auto">
                      {JSON.stringify(selectedDiffLog.oldValues, null, 2)}
                    </pre>
                  </div>

                  {/* Right: New Values */}
                  <div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-3.5">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-100">
                      <span className="text-xs font-bold text-emerald-700">Committed State (New)</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-mono">
                        NEW LIVE
                      </span>
                    </div>
                    <pre className="text-xs font-mono text-zinc-800 bg-white p-3 rounded-lg border border-emerald-100 overflow-x-auto">
                      {JSON.stringify(selectedDiffLog.newValues, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Diff Summary Bullet Points */}
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200/70">
                <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-blue-600" />
                  Key Modifications Applied:
                </div>
                <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-blue-800 font-mono">
                  {selectedDiffLog.changeSummary.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-zinc-200 bg-zinc-50 flex justify-end">
              <button
                onClick={() => setSelectedDiffLog(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-100 transition shadow-2xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrokerSettingsPage;
