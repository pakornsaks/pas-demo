import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  Filter,
  Layers,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import React, { useState } from "react";

// --- Types & Interfaces ---

interface KpiData {
  title: string;
  value: string;
  subtext: string;
  change: string;
  isPositive: boolean;
  breakdown?: { label: string; amount: string }[];
}

interface LobPerformance {
  lobCode: "MOTOR" | "HEALTH" | "TRAVEL" | "FIRE" | "PA" | "LIFE" | "CUSTOM";
  name: string;
  gwp: number;
  policyCount: number;
  retentionRate: number;
  lossRatioTarget: string;
}

interface ChannelMetric {
  channelId: string;
  channelName: string;
  type: "WEBSITE_STP" | "TELESALES_DIRECT" | "SUB_AGENT_NETWORK";
  policiesSold: number;
  grossPremium: number;
  commissionPaid: number;
  sharePercent: number;
}

interface OperationalQueueAlert {
  id: string;
  referenceNumber: string;
  customerNameMasked: string;
  lob: string;
  status: "PENDING_REVIEW" | "WAITING_PAYMENT" | "INSTALLMENT_OVERDUE";
  elapsedHours: number;
  amount: number;
  riskNote: string;
}

interface ComplianceReportItem {
  id: string;
  reportCode: string;
  reportName: string;
  regulationTarget: string;
  targetMonth: string;
  status: "GENERATED" | "PROCESSING" | "FAILED";
  fileSize: string;
  generatedAt: string;
  s3Url?: string;
}

// --- Component Definition ---

export const AnalyticsPerformancePage: React.FC = () => {
  // State
  const [dateRange, setDateRange] = useState<"MTD" | "QTD" | "YTD" | "CUSTOM">("MTD");
  const [selectedChannel, setSelectedChannel] = useState<string>("ALL");
  const [selectedLOB, setSelectedLOB] = useState<string>("ALL");
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Financial KPIs aligned with BRD Gross/Net + Stamp Duty (0.4%) + VAT (7%) Ledger
  const kpiMetrics: KpiData[] = [
    {
      title: "Gross Written Premium (GWP)",
      value: "฿42,850,420.00",
      subtext: "Net: ฿39,890,200 | Tax: ฿2,960,220",
      change: "+14.2% vs last month",
      isPositive: true,
      breakdown: [
        { label: "Net Premium", amount: "฿39,890,200.00" },
        { label: "Stamp Duty (0.4%)", amount: "฿159,560.80" },
        { label: "VAT (7%)", amount: "฿2,800,659.20" },
      ],
    },
    {
      title: "Active Policies In-Force",
      value: "18,492",
      subtext: "1,248 new policies this month",
      change: "+8.6% growth",
      isPositive: true,
    },
    {
      title: "Broker Net Settlement",
      value: "฿5,142,050.00",
      subtext: "Commission Recv. vs Insurer Payable",
      change: "+5.1% margin",
      isPositive: true,
      breakdown: [
        { label: "Comm. Receivable", amount: "฿6,856,067.20" },
        { label: "3% WHT Deducted", amount: "-฿205,682.02" },
        { label: "Sub-Agent Outflow", amount: "-฿1,508,335.18" },
      ],
    },
    {
      title: "Installment & Overdue Exposure",
      value: "฿894,320.00",
      subtext: "42 Warning Queue flags active",
      change: "-2.4% risk reduction",
      isPositive: true,
    },
  ];

  // LOB Performance Data (SCD Type 2 snapshot aggregations)
  const lobData: LobPerformance[] = [
    {
      lobCode: "MOTOR",
      name: "Motor & CMI (Compulsory)",
      gwp: 24500000,
      policyCount: 11200,
      retentionRate: 84.5,
      lossRatioTarget: "58.2%",
    },
    {
      lobCode: "HEALTH",
      name: "Health Insurance",
      gwp: 9800000,
      policyCount: 3840,
      retentionRate: 78.1,
      lossRatioTarget: "64.0%",
    },
    {
      lobCode: "PA",
      name: "Personal Accident (PA)",
      gwp: 3600000,
      policyCount: 2100,
      retentionRate: 72.3,
      lossRatioTarget: "42.5%",
    },
    {
      lobCode: "FIRE",
      name: "Property / Fire",
      gwp: 2450420,
      policyCount: 650,
      retentionRate: 91.0,
      lossRatioTarget: "31.8%",
    },
    {
      lobCode: "TRAVEL",
      name: "Travel (Single & Group)",
      gwp: 1400000,
      policyCount: 520,
      retentionRate: 46.2,
      lossRatioTarget: "24.1%",
    },
    {
      lobCode: "CUSTOM",
      name: "Specialty / Bespoke lines",
      gwp: 1100000,
      policyCount: 182,
      retentionRate: 88.0,
      lossRatioTarget: "39.0%",
    },
  ];

  // Multi-Channel Analytics (Direct vs STP vs Sub-Agents)
  const channelData: ChannelMetric[] = [
    {
      channelId: "CH-01",
      channelName: "Online Web STP (Self-Service)",
      type: "WEBSITE_STP",
      policiesSold: 9840,
      grossPremium: 21500000,
      commissionPaid: 0,
      sharePercent: 50.17,
    },
    {
      channelId: "CH-02",
      channelName: "Telesales Direct Force",
      type: "TELESALES_DIRECT",
      policiesSold: 5620,
      grossPremium: 14200000,
      commissionPaid: 1420000,
      sharePercent: 33.14,
    },
    {
      channelId: "CH-03",
      channelName: "Affiliate & Sub-Agent Downlines",
      type: "SUB_AGENT_NETWORK",
      policiesSold: 3032,
      grossPremium: 7150420,
      commissionPaid: 1072563,
      sharePercent: 16.69,
    },
  ];

  // Daily Operations Health / Bottleneck SLA Queues (BRD Section 7.7)
  const queueAlerts: OperationalQueueAlert[] = [
    {
      id: "1",
      referenceNumber: "APP-2026-8812",
      customerNameMasked: "1-1004-XXXX-88-9 (Somchai)",
      lob: "HEALTH",
      status: "PENDING_REVIEW",
      elapsedHours: 31,
      amount: 24500,
      riskNote: "BMI > 30 (Referral Rule Breached)",
    },
    {
      id: "2",
      referenceNumber: "APP-2026-8845",
      customerNameMasked: "3-1020-XXXX-12-4 (Wandee)",
      lob: "MOTOR",
      status: "WAITING_PAYMENT",
      elapsedHours: 52,
      amount: 18200,
      riskNote: "Approaching 48h Auto-Cancel Offset",
    },
    {
      id: "3",
      referenceNumber: "APP-2026-8901",
      customerNameMasked: "5-9941-XXXX-00-1 (Kittisak)",
      lob: "CUSTOM",
      status: "PENDING_REVIEW",
      elapsedHours: 26,
      amount: 150000,
      riskNote: "Marine Cargo bespoke underwriting",
    },
    {
      id: "4",
      referenceNumber: "POL-2026-4412",
      customerNameMasked: "1-1002-XXXX-45-7 (Anan)",
      lob: "MOTOR",
      status: "INSTALLMENT_OVERDUE",
      elapsedHours: 72,
      amount: 3200,
      riskNote: "Cycle 2 overdue (Exhaustion warning)",
    },
  ];

  // OIC Mandatory Regulatory & Tax Reports (BRD REP-01 through REP-08)
  const complianceReports: ComplianceReportItem[] = [
    {
      id: "REP-01",
      reportCode: "ผ.ล. 1 (Por.Lor. 1)",
      reportName: "OIC Flattened Transactional Sales Ledger",
      regulationTarget: "OIC Thailand (Monthly Statutory Submission)",
      targetMonth: "October 2026",
      status: "GENERATED",
      fileSize: "14.8 MB (PGP Encrypted)",
      generatedAt: "13 Oct 2026, 04:00 AM (Read-Replica)",
    },
    {
      id: "REP-02",
      reportCode: "50 Tawi (หนังสือรับรอง)",
      reportName: "Withholding Tax 3% Sub-Agent Certificates",
      regulationTarget: "Revenue Department (TRD Compliance)",
      targetMonth: "September 2026",
      status: "GENERATED",
      fileSize: "4.2 MB (ZIP / Signed PDFs)",
      generatedAt: "01 Oct 2026, 00:15 AM",
    },
    {
      id: "REP-03",
      reportCode: "INS-PAY-04",
      reportName: "Broker Remittance to Insurer (Pay-Date Filter)",
      regulationTarget: "Finance Clearing (Bordereau Reconciliation)",
      targetMonth: "October 2026",
      status: "PROCESSING",
      fileSize: "Pending aggregation",
      generatedAt: "Running on Read-Replica Pool",
    },
    {
      id: "REP-04",
      reportCode: "AGING-UNPAID",
      reportName: "Unpaid Policy Aging & Clawback Provision Ledger",
      regulationTarget: "Internal Audit & Underwriting Governance",
      targetMonth: "October 2026",
      status: "GENERATED",
      fileSize: "1.8 MB (CSV Flat File)",
      generatedAt: "12 Oct 2026, 23:59 PM",
    },
  ];

  const handleTriggerExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert("Report export successfully scheduled via Background Pub/Sub Worker.");
    }, 1200);
  };

  return (
    /* Top wrapper cancels out parent padding-top (-mt-6) for a clean, flush administrative header */
    <div className="-mt-6 -mx-6 min-h-full bg-zinc-50/50 pb-12 text-zinc-900">
      {/* Flush Page Header */}
      <div className="bg-white border-b border-zinc-200 px-6 py-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center p-1.5 rounded-md bg-blue-50 text-blue-700">
                <TrendingUp className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900">Analytics & Sales Performance</h1>
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                Read-Replica Connected
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Centralized business intelligence, OIC Por.Lor. 1 regulatory compliance monitoring, and daily operational
              health queues.
            </p>
          </div>

          {/* Global Header Actions & Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Date Range Selector */}
            <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-1 text-xs font-medium text-zinc-600">
              {(["MTD", "QTD", "YTD"] as const).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    dateRange === range ? "bg-white text-zinc-900 font-semibold shadow-sm" : "hover:text-zinc-900"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleTriggerExport}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-zinc-300 bg-white text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 transition-colors disabled:opacity-60"
            >
              <Download className="w-3.5 h-3.5" />
              {isExporting ? "Packaging..." : "Export BI Datasets"}
            </button>
          </div>
        </div>

        {/* Dynamic Filters Bar */}
        <div className="mt-4 pt-4 border-t border-zinc-100 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-500 mr-1 font-medium">
            <Filter className="w-3.5 h-3.5" />
            Filters:
          </div>

          {/* Sales Channel Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="channel-filter" className="text-zinc-600 font-medium">
              Channel:
            </label>
            <select
              id="channel-filter"
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="bg-zinc-50 border border-zinc-200 rounded-md px-2.5 py-1 text-zinc-800 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ALL">All Sales Channels</option>
              <option value="WEBSITE_STP">Website (Online STP)</option>
              <option value="TELESALES_DIRECT">Direct Telesales</option>
              <option value="SUB_AGENT_NETWORK">Sub-Agent Network</option>
            </select>
          </div>

          {/* LOB Category Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="lob-filter" className="text-zinc-600 font-medium">
              Line of Business:
            </label>
            <select
              id="lob-filter"
              value={selectedLOB}
              onChange={(e) => setSelectedLOB(e.target.value)}
              className="bg-zinc-50 border border-zinc-200 rounded-md px-2.5 py-1 text-zinc-800 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ALL">All Insurance Lines (LOB)</option>
              <option value="MOTOR">Motor & CMI</option>
              <option value="HEALTH">Health</option>
              <option value="TRAVEL">Travel</option>
              <option value="PA">Personal Accident (PA)</option>
              <option value="FIRE">Fire & Property</option>
              <option value="CUSTOM">Custom & Specialty Lines</option>
            </select>
          </div>

          <div className="ml-auto text-[11px] text-zinc-400">
            Last Materialized View Refresh: <strong>Today, 04:00 AM (ICT)</strong>
          </div>
        </div>
      </div>

      {/* Main Body Content Container */}
      <div className="px-6 pt-6 space-y-6">
        {/* Row 1: Core Financial & Operational KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiMetrics.map((kpi, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-medium text-zinc-500">
                  <span>{kpi.title}</span>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      kpi.isPositive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {kpi.change}
                  </span>
                </div>
                <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">{kpi.value}</div>
                <p className="mt-1 text-xs text-zinc-500">{kpi.subtext}</p>
              </div>

              {kpi.breakdown && (
                <div className="mt-3.5 pt-3 border-t border-zinc-100 space-y-1">
                  {kpi.breakdown.map((item, bIdx) => (
                    <div key={bIdx} className="flex items-center justify-between text-[11px] text-zinc-600">
                      <span>{item.label}</span>
                      <span className="font-mono font-medium text-zinc-800">{item.amount}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Row 2: Sales Performance by LOB & Multi-Channel Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LOB Performance Grid (2 Columns) */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 shadow-sm p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <h2 className="text-sm font-bold text-zinc-900">Portfolio Distribution by Line of Business (LOB)</h2>
                </div>
                <span className="text-xs text-zinc-500 font-mono">SCD Type 2 Active Snapshots</span>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-500 font-medium bg-zinc-50/75">
                      <th className="py-2.5 px-3">LOB Category</th>
                      <th className="py-2.5 px-3 text-right">Gross Written (THB)</th>
                      <th className="py-2.5 px-3 text-center">Policies</th>
                      <th className="py-2.5 px-3 text-center">Retention (90d)</th>
                      <th className="py-2.5 px-3 text-right">Target Loss Ratio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {lobData.map((lob) => (
                      <tr key={lob.lobCode} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="py-3 px-3 font-medium text-zinc-900 flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              lob.lobCode === "MOTOR"
                                ? "bg-blue-500"
                                : lob.lobCode === "HEALTH"
                                  ? "bg-emerald-500"
                                  : lob.lobCode === "PA"
                                    ? "bg-amber-500"
                                    : lob.lobCode === "FIRE"
                                      ? "bg-orange-500"
                                      : lob.lobCode === "TRAVEL"
                                        ? "bg-cyan-500"
                                        : "bg-purple-500"
                            }`}
                          />
                          {lob.name}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-medium text-zinc-800">
                          ฿{lob.gwp.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-center text-zinc-600">{lob.policyCount.toLocaleString()}</td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                              lob.retentionRate >= 80
                                ? "bg-emerald-50 text-emerald-700"
                                : lob.retentionRate >= 60
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {lob.retentionRate}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-zinc-600">{lob.lossRatioTarget}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
              <span>* Compulsory Motor Insurance (Por Ror Bor) is calculated via OIC Vehicle Code 1.10 schedule.</span>
              <span className="font-medium text-blue-600 cursor-pointer hover:underline">
                View LOB Underwriting Rules
              </span>
            </div>
          </div>

          {/* Channel Performance Breakdown (1 Column) */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-sm font-bold text-zinc-900">Channel Mix & Settlement</h2>
                </div>
                <span className="text-[11px] text-zinc-400">Share %</span>
              </div>

              <div className="mt-4 space-y-4">
                {channelData.map((ch) => (
                  <div key={ch.channelId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-800">{ch.channelName}</span>
                      <span className="font-mono font-bold text-zinc-900">{ch.sharePercent}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${
                          ch.type === "WEBSITE_STP"
                            ? "bg-blue-500"
                            : ch.type === "TELESALES_DIRECT"
                              ? "bg-indigo-500"
                              : "bg-emerald-500"
                        }`}
                        style={{ width: `${ch.sharePercent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-0.5">
                      <span>Policies: {ch.policiesSold.toLocaleString()}</span>
                      <span className="font-mono">
                        ฿{ch.grossPremium.toLocaleString("en-US", { maximumFractionDigits: 0 })} GWP
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs">
              <div className="flex items-center justify-between font-medium text-zinc-700">
                <span>Sub-Agent Downline Commission</span>
                <span className="font-mono font-semibold text-zinc-900">฿1,072,563.00</span>
              </div>
              <p className="mt-1 text-[11px] text-zinc-500 leading-relaxed">
                Subject to 3% Withholding Tax (WHT) deduction under Revenue Code before wallet payout.
              </p>
            </div>
          </div>
        </div>

        {/* Row 3: Daily Operations Health & SLA Queue Alerts (BRD 7.7.3) */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-zinc-100">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold text-zinc-900">Daily Operations Health & Underwriting SLA Queue</h2>
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">
                Monitors operational bottlenecks: applications in PENDING_REVIEW &gt; 24h and WAITING_PAYMENT &gt; 48h.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                <Clock className="w-3.5 h-3.5 mr-1" />4 Attention Required
              </span>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500 font-medium bg-zinc-50/75">
                  <th className="py-2.5 px-3">Reference No.</th>
                  <th className="py-2.5 px-3">Customer ID (PDPA Masked)</th>
                  <th className="py-2.5 px-3">LOB</th>
                  <th className="py-2.5 px-3">Current Status</th>
                  <th className="py-2.5 px-3 text-center">Elapsed SLA</th>
                  <th className="py-2.5 px-3 text-right">Gross Premium</th>
                  <th className="py-2.5 px-3">Trigger / Risk Condition</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {queueAlerts.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-blue-600">{item.referenceNumber}</td>
                    <td className="py-3 px-3 text-zinc-700 font-mono">{item.customerNameMasked}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 text-zinc-800">
                        {item.lob}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                          item.status === "PENDING_REVIEW"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : item.status === "WAITING_PAYMENT"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-medium text-rose-600">{item.elapsedHours}h</td>
                    <td className="py-3 px-3 text-right font-mono text-zinc-900 font-medium">
                      ฿{item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-zinc-600">{item.riskNote}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        className="inline-flex items-center px-2.5 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-medium transition-colors"
                      >
                        Triage Case
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Row 4: Mandatory Regulatory & Financial Compliance Reports (OIC Por.Lor. 1 / 50 Tawi) */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-zinc-100">
            <div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-zinc-900">
                  OIC Regulatory Submissions & Financial Export Engine
                </h2>
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">
                Offloaded asynchronously to dedicated Read-Replica Materialized Views to protect live transactional
                latency (&lt;500ms).
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Compile New Regulatory Snapshot
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {complianceReports.map((report) => (
              <div
                key={report.id}
                className="p-4 rounded-lg border border-zinc-200 bg-zinc-50/50 hover:bg-white transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-200 text-zinc-800 font-mono">
                        {report.reportCode}
                      </span>
                      <h3 className="mt-1 text-sm font-semibold text-zinc-900">{report.reportName}</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">{report.regulationTarget}</p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                        report.status === "GENERATED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : report.status === "PROCESSING"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {report.status === "GENERATED" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {report.status}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-zinc-500 pt-3 border-t border-zinc-200/60">
                    <span>
                      Target Month: <strong>{report.targetMonth}</strong>
                    </span>
                    <span className="font-mono text-[11px]">{report.fileSize}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-400">Generated: {report.generatedAt}</div>
                </div>

                <div className="mt-4 pt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={report.status !== "GENERATED"}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition-colors disabled:opacity-40"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Flat File
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPerformancePage;
