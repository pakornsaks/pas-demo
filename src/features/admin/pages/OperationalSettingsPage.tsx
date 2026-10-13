import {
  AlertTriangle,
  Bell,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
  Sliders,
} from "lucide-react";
import React, { useState } from "react";

// ==========================================
// Type Definitions (Aligned with BRD & SDD)
// ==========================================

export interface BrokerChannelSetting {
  id: string;
  channelId: number;
  channelName: string;
  channelCode: "TELESALES" | "DIRECT_SALE" | "WEBSITE" | "SUB_AGENT";
  description: string;
  warningDaysBeforeDue: number; // e.g. 3 days before installment/due date
  autoCancelOffsetDays: number; // 0 = cancels on effective date, 30 = 30 days after
  allowGracePeriodFollowUp: boolean;
  notifyAgentOnCancel: boolean;
  isActive: boolean;
  updatedAt: string;
}

export interface InsurerSettlementSetting {
  id: string;
  insurerId: string;
  insurerName: string;
  settlementMode: "NET" | "GROSS"; // Deduct Before vs. Deduct After
  monthlyPayDate: number; // e.g., 15th of the month
  creditTermDays: number;
  minBatchThreshold: number;
  isActive: boolean;
}

export interface OperationalSlaConfig {
  uwInsurerWarningHours: number; // e.g. 24 hours -> Yellow alert
  uwInsurerBreachHours: number; // e.g. 48 hours -> Red alert
  quoteValidityDays: number; // Default 30 days before EXPIRED status
  paymentTimeoutHours: number; // Timeout for APPROVED_WAITING_PAYMENT (e.g., 48 hours)
  renewalTriggerDays: number; // Pre-expiration scan (BRD 90-day trigger)
  makerCheckerAutoExpiryHours: number;
}

// Initial Mock Data derived from PAS Specifications
const INITIAL_CHANNEL_SETTINGS: BrokerChannelSetting[] = [
  {
    id: "bcs-001",
    channelId: 1,
    channelName: "Telesales",
    channelCode: "TELESALES",
    description: "Internal outbound and inbound telesales agents",
    warningDaysBeforeDue: 3,
    autoCancelOffsetDays: 0, // Cancels strictly on Effective Date
    allowGracePeriodFollowUp: true,
    notifyAgentOnCancel: true,
    isActive: true,
    updatedAt: "2026-05-15 10:30",
  },
  {
    id: "bcs-002",
    channelId: 2,
    channelName: "Direct Sale",
    channelCode: "DIRECT_SALE",
    description: "Face-to-face walk-in and branch direct counters",
    warningDaysBeforeDue: 5,
    autoCancelOffsetDays: 3,
    allowGracePeriodFollowUp: true,
    notifyAgentOnCancel: false,
    isActive: true,
    updatedAt: "2026-05-18 14:10",
  },
  {
    id: "bcs-003",
    channelId: 3,
    channelName: "Website (Online STP)",
    channelCode: "WEBSITE",
    description: "Direct straight-through customer checkout platform",
    warningDaysBeforeDue: 2,
    autoCancelOffsetDays: 2,
    allowGracePeriodFollowUp: false,
    notifyAgentOnCancel: false,
    isActive: true,
    updatedAt: "2026-05-20 09:00",
  },
  {
    id: "bcs-004",
    channelId: 4,
    channelName: "Sub-agent Network",
    channelCode: "SUB_AGENT",
    description: "External affiliate broker network and downlines",
    warningDaysBeforeDue: 7,
    autoCancelOffsetDays: 30, // 30-day extended credit buffer
    allowGracePeriodFollowUp: true,
    notifyAgentOnCancel: true,
    isActive: true,
    updatedAt: "2026-05-22 16:45",
  },
];

const INITIAL_INSURER_SETTINGS: InsurerSettlementSetting[] = [
  {
    id: "bis-001",
    insurerId: "INS-01",
    insurerName: "Viriyah Insurance",
    settlementMode: "NET",
    monthlyPayDate: 15,
    creditTermDays: 30,
    minBatchThreshold: 10000,
    isActive: true,
  },
  {
    id: "bis-002",
    insurerId: "INS-02",
    insurerName: "AIA Thailand",
    settlementMode: "GROSS",
    monthlyPayDate: 25,
    creditTermDays: 45,
    minBatchThreshold: 25000,
    isActive: true,
  },
  {
    id: "bis-003",
    insurerId: "INS-03",
    insurerName: "Muang Thai Insurance",
    settlementMode: "NET",
    monthlyPayDate: 20,
    creditTermDays: 30,
    minBatchThreshold: 15000,
    isActive: true,
  },
  {
    id: "bis-004",
    insurerId: "INS-04",
    insurerName: "MSIG Insurance",
    settlementMode: "NET",
    monthlyPayDate: 28,
    creditTermDays: 30,
    minBatchThreshold: 10000,
    isActive: true,
  },
];

const INITIAL_SLA_CONFIG: OperationalSlaConfig = {
  uwInsurerWarningHours: 24,
  uwInsurerBreachHours: 48,
  quoteValidityDays: 30,
  paymentTimeoutHours: 48,
  renewalTriggerDays: 90,
  makerCheckerAutoExpiryHours: 72,
};

export const OperationalSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"channels" | "insurers" | "queues">("channels");
  const [channelSettings, setChannelSettings] = useState<BrokerChannelSetting[]>(INITIAL_CHANNEL_SETTINGS);
  const [insurerSettings, setInsurerSettings] = useState<InsurerSettlementSetting[]>(INITIAL_INSURER_SETTINGS);
  const [slaConfig, setSlaConfig] = useState<OperationalSlaConfig>(INITIAL_SLA_CONFIG);
  const [isDirty, setIsDirty] = useState(false);
  const [showMakerCheckerModal, setShowMakerCheckerModal] = useState(false);
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);

  // Field change handler for Broker Channel Settings
  const handleChannelChange = (id: string, field: keyof BrokerChannelSetting, value: number | boolean | string) => {
    setChannelSettings((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
    setIsDirty(true);
  };

  // Field change handler for Insurer Settlement Settings
  const handleInsurerChange = (id: string, field: keyof InsurerSettlementSetting, value: string | number) => {
    setInsurerSettings((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
    setIsDirty(true);
  };

  // Field change handler for System SLAs
  const handleSlaChange = (field: keyof OperationalSlaConfig, value: number) => {
    setSlaConfig((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleReset = () => {
    setChannelSettings(INITIAL_CHANNEL_SETTINGS);
    setInsurerSettings(INITIAL_INSURER_SETTINGS);
    setSlaConfig(INITIAL_SLA_CONFIG);
    setIsDirty(false);
  };

  const handleStageRequest = () => {
    setShowMakerCheckerModal(false);
    setIsDirty(false);
    setSavedSuccessMessage(
      "Operational SLA configuration draft staged successfully (Ticket #REQ-SLA-2026). Awaiting Checker authorization.",
    );
    setTimeout(() => setSavedSuccessMessage(null), 6000);
  };

  return (
    // Note: Top container has no padding (pt-0) as requested
    <div className="pt-0 space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
            <span>Administration</span>
            <span>/</span>
            <span className="text-zinc-800">Operational Governance</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Operational Settings & SLAs</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Manage channel auto-cancellation offset windows, payment reminder schedules, insurer settlements, and system
            SLAs.
          </p>
        </div>

        {/* Action Buttons with Maker-Checker Guard */}
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <button
            type="button"
            onClick={handleReset}
            disabled={!isDirty}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg shadow-sm hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
            Discard Changes
          </button>
          <button
            type="button"
            onClick={() => setShowMakerCheckerModal(true)}
            disabled={!isDirty}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <Save className="w-3.5 h-3.5 text-zinc-200" />
            Stage for Approval (Maker)
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {savedSuccessMessage && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Staged Under Maker-Checker Protocol:</span> {savedSuccessMessage}
          </div>
        </div>
      )}

      {/* Segregation of Duties Info Callout */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 flex items-start gap-3 text-amber-900 text-xs">
        <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-amber-950">Governance Constraint (BRD 5.3 & 7.9):</span> Modifying
          operational offsets or SLA triggers modifies asynchronous background CRON jobs (00:01 daily sweeps). Changes
          require secondary review by an authorized Checker before deploying to the live database.
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-zinc-200 gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab("channels")}
          className={`pb-3 relative transition flex items-center gap-2 ${
            activeTab === "channels"
              ? "text-zinc-900 font-semibold border-b-2 border-zinc-900"
              : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <Sliders className="w-4 h-4" />
          Channel Auto-Cancel & SLAs
          <span className="ml-1.5 px-2 py-0.5 text-[11px] bg-zinc-100 text-zinc-600 rounded-full font-medium">
            4 Channels
          </span>
        </button>

        <button
          onClick={() => setActiveTab("insurers")}
          className={`pb-3 relative transition flex items-center gap-2 ${
            activeTab === "insurers"
              ? "text-zinc-900 font-semibold border-b-2 border-zinc-900"
              : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Insurer Settlement Rules
          <span className="ml-1.5 px-2 py-0.5 text-[11px] bg-zinc-100 text-zinc-600 rounded-full font-medium">
            4 Carriers
          </span>
        </button>

        <button
          onClick={() => setActiveTab("queues")}
          className={`pb-3 relative transition flex items-center gap-2 ${
            activeTab === "queues"
              ? "text-zinc-900 font-semibold border-b-2 border-zinc-900"
              : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <Clock className="w-4 h-4" />
          Underwriting & Core System SLAs
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: Channel Auto-Cancel & SLA Rules (broker_channel_settings)          */}
      {/* ========================================================================= */}
      {activeTab === "channels" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/70 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900">Sales Channel Operational Configurations</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Controls payment due alerts and systematic cancellation offset dates per sales channel origin.
                </p>
              </div>
              <span className="text-xs text-zinc-500 bg-white border border-zinc-200 px-2.5 py-1 rounded-md font-mono">
                Entity: broker_channel_settings
              </span>
            </div>

            <div className="divide-y divide-zinc-200">
              {channelSettings.map((channel) => (
                <div key={channel.id} className="p-6 hover:bg-zinc-50/40 transition">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    {/* Channel Description */}
                    <div className="lg:w-1/3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase bg-zinc-100 text-zinc-700 rounded border border-zinc-200">
                          ID: {channel.channelId}
                        </span>
                        <h3 className="text-sm font-semibold text-zinc-900">{channel.channelName}</h3>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{channel.description}</p>

                      <div className="mt-3 flex items-center gap-2 text-xs">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            channel.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              channel.isActive ? "bg-emerald-500" : "bg-zinc-400"
                            }`}
                          />
                          {channel.isActive ? "Worker Active" : "Suspended"}
                        </span>
                        <span className="text-zinc-400">|</span>
                        <span className="text-zinc-400 text-[11px]">Last synced: {channel.updatedAt}</span>
                      </div>
                    </div>

                    {/* Channel Config Inputs */}
                    <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Warning Days Before Due */}
                      <div className="bg-zinc-50/60 p-4 rounded-lg border border-zinc-200/80">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                            <Bell className="w-3.5 h-3.5 text-zinc-500" />
                            Warning Days Before Due
                          </label>
                          <span className="text-[11px] text-zinc-500 font-mono">warning_days_before_due</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="0"
                            max="30"
                            value={channel.warningDaysBeforeDue}
                            onChange={(e) =>
                              handleChannelChange(
                                channel.id,
                                "warningDaysBeforeDue",
                                Math.max(0, parseInt(e.target.value) || 0),
                              )
                            }
                            className="w-24 px-3 py-1.5 text-sm font-medium bg-white border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                          />
                          <span className="text-xs text-zinc-600 font-medium">Days</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-2 leading-tight">
                          Dispatches automated SMS/Email reminder webhooks X days prior to due date.
                        </p>
                      </div>

                      {/* Auto-Cancel Offset Days */}
                      <div className="bg-zinc-50/60 p-4 rounded-lg border border-zinc-200/80">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            Auto-Cancel Grace Offset
                          </label>
                          <span className="text-[11px] text-zinc-500 font-mono">auto_cancel_offset_days</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="0"
                            max="90"
                            value={channel.autoCancelOffsetDays}
                            onChange={(e) =>
                              handleChannelChange(
                                channel.id,
                                "autoCancelOffsetDays",
                                Math.max(0, parseInt(e.target.value) || 0),
                              )
                            }
                            className="w-24 px-3 py-1.5 text-sm font-medium bg-white border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                          />
                          <span className="text-xs text-zinc-600 font-medium">Days</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-2 leading-tight">
                          {channel.autoCancelOffsetDays === 0
                            ? "Value 0: Strict termination on Policy Effective Date."
                            : `Cancels unpaid policy exactly ${channel.autoCancelOffsetDays} days after Effective Date.`}
                        </p>
                      </div>

                      {/* Operational Toggles */}
                      <div className="sm:col-span-2 pt-1 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer text-zinc-700">
                          <input
                            type="checkbox"
                            checked={channel.allowGracePeriodFollowUp}
                            onChange={(e) =>
                              handleChannelChange(channel.id, "allowGracePeriodFollowUp", e.target.checked)
                            }
                            className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                          />
                          <span>Show "Send Follow-up" action on Ops Queue during grace window</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-zinc-700">
                          <input
                            type="checkbox"
                            checked={channel.notifyAgentOnCancel}
                            onChange={(e) => handleChannelChange(channel.id, "notifyAgentOnCancel", e.target.checked)}
                            className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                          />
                          <span>Trigger instant webhook callback to Agent Portal on auto-cancel</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SLA Timeline Simulation Engine */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-600" />
                <h3 className="text-sm font-semibold text-zinc-900">Dynamic Execution Timeline Visualizer</h3>
              </div>
              <span className="text-xs text-zinc-500">Based on Sub-Agent (30d) vs. Telesales (0d)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="border border-blue-200 bg-blue-50/40 p-3.5 rounded-lg">
                <span className="font-semibold text-blue-900 block mb-1">1. Pre-Warning Trigger</span>
                <p className="text-blue-800 text-[11px] leading-relaxed">
                  Nightly cron scans pending payments where{" "}
                  <code className="font-mono">due_date - current_date = warning_days</code>. Fires{" "}
                  <code className="font-mono font-semibold">EVENT: INSTALLMENT_DUE_WARNING</code>.
                </p>
              </div>

              <div className="border border-zinc-200 bg-zinc-50/60 p-3.5 rounded-lg">
                <span className="font-semibold text-zinc-900 block mb-1">2. Payment Due Date</span>
                <p className="text-zinc-600 text-[11px] leading-relaxed">
                  Contract enters grace period. Marked as{" "}
                  <code className="font-mono text-amber-700 font-semibold">OVERDUE</code> on the Internal Collection
                  Dashboard.
                </p>
              </div>

              <div className="border border-amber-200 bg-amber-50/50 p-3.5 rounded-lg">
                <span className="font-semibold text-amber-900 block mb-1">3. Follow-Up Window</span>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  Ops team can trigger manual outreach hooks. The policy remains in{" "}
                  <code className="font-mono">SUSPENDED</code> state.
                </p>
              </div>

              <div className="border border-rose-200 bg-rose-50/50 p-3.5 rounded-lg">
                <span className="font-semibold text-rose-900 block mb-1">4. Termination Execution</span>
                <p className="text-rose-800 text-[11px] leading-relaxed">
                  Offset days breached. Status transitions permanently to{" "}
                  <code className="font-mono font-semibold">CANCELLED</code> with clawback calculation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: Insurer Settlement Rules (broker_insurer_settings)                 */}
      {/* ========================================================================= */}
      {activeTab === "insurers" && (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/70 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Carrier Settlement & Remittance Schedules</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Configure Net vs. Gross settlement routing and monthly premium remittance cut-off dates.
              </p>
            </div>
            <span className="text-xs text-zinc-500 bg-white border border-zinc-200 px-2.5 py-1 rounded-md font-mono">
              Entity: broker_insurer_settings
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/50 text-zinc-600 font-medium">
                  <th className="py-3 px-6">Insurer Partner</th>
                  <th className="py-3 px-6">Settlement Mode</th>
                  <th className="py-3 px-6">Monthly Remittance Date</th>
                  <th className="py-3 px-6">Credit Term Window</th>
                  <th className="py-3 px-6">Batch Threshold (THB)</th>
                  <th className="py-3 px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-zinc-800">
                {insurerSettings.map((insurer) => (
                  <tr key={insurer.id} className="hover:bg-zinc-50/40 transition">
                    <td className="py-4 px-6 font-semibold text-zinc-900">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-zinc-400" />
                        <div>
                          <div>{insurer.insurerName}</div>
                          <span className="text-[11px] font-mono text-zinc-400 font-normal">{insurer.insurerId}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <select
                        value={insurer.settlementMode}
                        onChange={(e) =>
                          handleInsurerChange(insurer.id, "settlementMode", e.target.value as "NET" | "GROSS")
                        }
                        className="px-2.5 py-1.5 bg-white border border-zinc-300 rounded-md text-xs font-medium focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                      >
                        <option value="NET">NET (Deduct Commission Before)</option>
                        <option value="GROSS">GROSS (Remit 100%, Claim Later)</option>
                      </select>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-zinc-600">Every</span>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={insurer.monthlyPayDate}
                          onChange={(e) =>
                            handleInsurerChange(
                              insurer.id,
                              "monthlyPayDate",
                              Math.max(1, Math.min(31, parseInt(e.target.value) || 1)),
                            )
                          }
                          className="w-16 px-2 py-1 text-center bg-white border border-zinc-300 rounded-md text-xs font-semibold focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                        />
                        <span className="text-zinc-600">of month</span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max="90"
                          value={insurer.creditTermDays}
                          onChange={(e) =>
                            handleInsurerChange(insurer.id, "creditTermDays", parseInt(e.target.value) || 0)
                          }
                          className="w-16 px-2 py-1 text-center bg-white border border-zinc-300 rounded-md text-xs font-medium focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                        />
                        <span className="text-zinc-500">Days</span>
                      </div>
                    </td>

                    <td className="py-4 px-6 font-mono font-medium">
                      <input
                        type="number"
                        step="5000"
                        value={insurer.minBatchThreshold}
                        onChange={(e) =>
                          handleInsurerChange(insurer.id, "minBatchThreshold", parseInt(e.target.value) || 0)
                        }
                        className="w-24 px-2 py-1 bg-white border border-zinc-300 rounded-md text-xs font-mono focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                      />
                    </td>

                    <td className="py-4 px-6 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          insurer.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                        }`}
                      >
                        {insurer.isActive ? "Active Schedule" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: Underwriting & Core System SLAs                                     */}
      {/* ========================================================================= */}
      {activeTab === "queues" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Underwriting Referral SLA */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-semibold text-zinc-900">Underwriting & Referral Queue SLAs (Module 2)</h3>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Controls color-coded warning alert thresholds on the Underwriting Control Tower for cases stuck in{" "}
              <code className="font-mono text-zinc-700 bg-zinc-100 px-1 py-0.5 rounded">PENDING_REVIEW</code>.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-zinc-700 block mb-1">
                  Yellow Alert Level (Insurer Delay Warning)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="72"
                    value={slaConfig.uwInsurerWarningHours}
                    onChange={(e) => handleSlaChange("uwInsurerWarningHours", parseInt(e.target.value) || 0)}
                    className="w-28 px-3 py-1.5 bg-white border border-zinc-300 rounded-md text-xs font-semibold focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                  <span className="text-zinc-600 font-medium">Hours Elapsed</span>
                </div>
                <span className="text-[11px] text-zinc-400 mt-1 block">
                  Triggers yellow badge when elapsed time &gt; 24h.
                </span>
              </div>

              <div>
                <label className="font-semibold text-zinc-700 block mb-1">Red Alert Level (Insurer SLA Breach)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={slaConfig.uwInsurerBreachHours}
                    onChange={(e) => handleSlaChange("uwInsurerBreachHours", parseInt(e.target.value) || 0)}
                    className="w-28 px-3 py-1.5 bg-white border border-zinc-300 rounded-md text-xs font-semibold focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                  <span className="text-zinc-600 font-medium">Hours Elapsed</span>
                </div>
                <span className="text-[11px] text-zinc-400 mt-1 block">
                  Elevates case to RED_BREACHED and notifies Operations supervisor.
                </span>
              </div>
            </div>
          </div>

          {/* Core Lifecycle Expiry SLAs */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
              <AlertTriangle className="w-4 h-4 text-zinc-700" />
              <h3 className="text-sm font-semibold text-zinc-900">Core State Machine Lifecycle Timeouts (Module 3)</h3>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Dictates batch job cleanup parameters and pre-issuance payment timeout boundaries.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-zinc-700 block mb-1">Payment Gateway Wait Window</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={slaConfig.paymentTimeoutHours}
                    onChange={(e) => handleSlaChange("paymentTimeoutHours", parseInt(e.target.value) || 0)}
                    className="w-28 px-3 py-1.5 bg-white border border-zinc-300 rounded-md text-xs font-semibold focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                  <span className="text-zinc-600 font-medium">Hours</span>
                </div>
                <span className="text-[11px] text-zinc-400 mt-1 block">
                  Applications in APPROVED_WAITING_PAYMENT auto-cancel if unpaid after 48h.
                </span>
              </div>

              <div>
                <label className="font-semibold text-zinc-700 block mb-1">
                  Automated Retention Trigger (90-Day Policy Scan)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="30"
                    max="120"
                    value={slaConfig.renewalTriggerDays}
                    onChange={(e) => handleSlaChange("renewalTriggerDays", parseInt(e.target.value) || 0)}
                    className="w-28 px-3 py-1.5 bg-white border border-zinc-300 rounded-md text-xs font-semibold focus:ring-1 focus:ring-zinc-900 focus:outline-none"
                  />
                  <span className="text-zinc-600 font-medium">Days Before Expiry</span>
                </div>
                <span className="text-[11px] text-zinc-400 mt-1 block">
                  Nightly worker creates renewal draft quotes and dispatches RENEWAL_READY webhook.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Maker-Checker Staging Confirmation Modal                                  */}
      {/* ========================================================================= */}
      {showMakerCheckerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
              <div className="p-2 bg-zinc-100 rounded-lg text-zinc-800">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-900">Submit Configuration to Maker-Checker</h4>
                <p className="text-xs text-zinc-500">Separation of Duties Verification</p>
              </div>
            </div>

            <div className="my-4 text-xs text-zinc-600 space-y-3">
              <p>You are staging modified operational offsets and SLA rules for the active broker platform.</p>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Staging Target:</span>
                  <span className="font-semibold text-zinc-800">broker_channel_settings</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Governance Policy:</span>
                  <span className="font-semibold text-zinc-800">maker_id != checker_id</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Audit Logging:</span>
                  <span className="font-semibold text-emerald-700">AES-256 Encrypted (Immutable)</span>
                </div>
              </div>
              <p className="text-[11px] text-zinc-400">
                Once staged, live API workers will continue running current configuration until an authorized Checker
                signs off on this change.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setShowMakerCheckerModal(false)}
                className="px-3.5 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStageRequest}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-sm transition"
              >
                <Send className="w-3.5 h-3.5 text-zinc-200" />
                Confirm & Create Approval Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationalSettingsPage;
