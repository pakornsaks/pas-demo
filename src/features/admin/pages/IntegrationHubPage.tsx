import React, { useMemo, useState } from "react";

// --- TYPES & INTERFACES (Aligned with SDD Section 3.4.5 & 3.7) ---
export type DLQStatus = "FAILED" | "RETRYING" | "RESOLVED" | "DISCARDED";
export type CircuitBreakerState = "CLOSED" | "HALF_OPEN" | "OPEN";
export type BatchType = "SFTP_CSV" | "SFTP_XML" | "EMAIL_PDF_ATTACHMENT";

export interface IntegrationLogEntry {
  logId: string;
  correlationId: string;
  policyId?: string;
  applicationId?: string;
  targetSystem:
    | "VIRIYAH_CORE_API"
    | "AIA_B2B_GATEWAY"
    | "MUANG_THAI_REST"
    | "MSIG_LEGACY_SOAP"
    | "DOCGEN_S3_WORKER"
    | "SALES_CHANNEL_CRM";
  endpoint: string;
  httpMethod: "POST" | "PUT" | "PATCH" | "GET";
  httpStatus: number;
  status: DLQStatus;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  lastAttemptAt: string;
  errorMessage: string;
  requestPayload: Record<string, unknown>;
  responsePayload: Record<string, unknown>;
}

export interface InsurerAdapterHealth {
  insurerId: string;
  insurerName: string;
  channelType: "REST_API" | "SOAP_XML" | "SFTP_BATCH" | "EMAIL_PDF";
  endpoint: string;
  circuitState: CircuitBreakerState;
  p95LatencyMs: number;
  failureRatePercent: number;
  lastSyncTimestamp: string;
  activeQueueDepth: number;
}

export interface WebhookSubscription {
  subscriptionId: string;
  channelId: string;
  channelName: string;
  targetUrl: string;
  eventTypes: string[];
  isActive: boolean;
  successRate: number;
  lastDispatchedAt: string;
}

// --- MOCK INITIAL DATA ---
const INITIAL_DLQ_LOGS: IntegrationLogEntry[] = [
  {
    logId: "log-88f2-911a",
    correlationId: "corr-c99e8400-e29b-41d4",
    policyId: "POL-2026-004812",
    applicationId: "APP-2026-0981",
    targetSystem: "VIRIYAH_CORE_API",
    endpoint: "/api/v2/underwriting/policy-issuance",
    httpMethod: "POST",
    httpStatus: 504,
    status: "FAILED",
    retryCount: 3,
    maxRetries: 5,
    createdAt: "2026-10-13T09:14:22Z",
    lastAttemptAt: "2026-10-13T10:02:11Z",
    errorMessage: "Gateway Timeout: Downstream core system did not return ACK within 30000ms",
    requestPayload: {
      application_id: "APP-2026-0981",
      gross_premium: 24500.0,
      chassis_number: "MRH-FE1-99281726",
      customer: { legal_name: "Somchai Prasert", tax_id: "1-1004-99881-22-1" },
      plan_code: "VIRIYAH_M1_PLATINUM",
    },
    responsePayload: { error: "Gateway Timeout", status_code: 504, timestamp: "2026-10-13T10:02:11Z" },
  },
  {
    logId: "log-33a1-77b9",
    correlationId: "corr-550e8400-e29b-41d4",
    policyId: "POL-2026-003310",
    targetSystem: "DOCGEN_S3_WORKER",
    endpoint: "pubsub://topics/document.generate",
    httpMethod: "POST",
    httpStatus: 500,
    status: "FAILED",
    retryCount: 2,
    maxRetries: 5,
    createdAt: "2026-10-13T08:30:15Z",
    lastAttemptAt: "2026-10-13T08:35:00Z",
    errorMessage: "S3 PutObject failure: docx-to-pdf conversion worker memory exhausted (OOM)",
    requestPayload: { policy_id: "POL-2026-003310", template_id: "TMPL-MOTOR-WORD-2026" },
    responsePayload: { error: "Worker thread terminated with SIGKILL (Exit code 137)" },
  },
  {
    logId: "log-99e4-1212",
    correlationId: "corr-aa12984-4411-99ff",
    policyId: "POL-2026-002209",
    applicationId: "APP-2026-0442",
    targetSystem: "SALES_CHANNEL_CRM",
    endpoint: "https://sales-crm.broker.co.th/api/v1/webhooks/pas-events",
    httpMethod: "POST",
    httpStatus: 422,
    status: "FAILED",
    retryCount: 1,
    maxRetries: 3,
    createdAt: "2026-10-13T07:12:00Z",
    lastAttemptAt: "2026-10-13T07:15:20Z",
    errorMessage: "HTTP 422: Unprocessable Entity - Webhook receiver rejected malformed schema",
    requestPayload: {
      event_id: "EVT-88219-4441",
      event_type: "OFFER_RATED",
      data: { application_id: "APP-2026-0442", new_gross_premium: 25000.0, loading_reason: "20% BMI Loading" },
    },
    responsePayload: { code: "INVALID_SIGNATURE", message: "HMAC verification failed" },
  },
  {
    logId: "log-77f1-0012",
    correlationId: "corr-bb33221-1122-3344",
    policyId: "POL-2026-001199",
    targetSystem: "MSIG_LEGACY_SOAP",
    endpoint: "https://b2b.msig.co.th/services/PolicyRegistrationV1",
    httpMethod: "POST",
    httpStatus: 503,
    status: "RESOLVED",
    retryCount: 4,
    maxRetries: 5,
    createdAt: "2026-10-12T14:20:00Z",
    lastAttemptAt: "2026-10-12T15:10:00Z",
    errorMessage: "Service Unavailable: Carrier database maintenance scheduled",
    requestPayload: { Envelope: { Body: { IssueRequest: { PolicyNo: "POL-2026-001199" } } } },
    responsePayload: { status: "OK", reference: "MSIG-ACK-99210" },
  },
];

const INITIAL_ADAPTERS: InsurerAdapterHealth[] = [
  {
    insurerId: "INS-001-VIR",
    insurerName: "Viriyah Insurance (Adapter REST)",
    channelType: "REST_API",
    endpoint: "https://core.viriyah.co.th/api/v2",
    circuitState: "HALF_OPEN",
    p95LatencyMs: 640,
    failureRatePercent: 8.2,
    lastSyncTimestamp: "2026-10-13T10:14:00Z",
    activeQueueDepth: 14,
  },
  {
    insurerId: "INS-002-AIA",
    insurerName: "AIA Thailand (Adapter B2B)",
    channelType: "REST_API",
    endpoint: "https://partner-gateway.aia.co.th/v1/pas",
    circuitState: "CLOSED",
    p95LatencyMs: 220,
    failureRatePercent: 0.1,
    lastSyncTimestamp: "2026-10-13T10:16:30Z",
    activeQueueDepth: 0,
  },
  {
    insurerId: "INS-003-MTI",
    insurerName: "Muang Thai Insurance (MTI Adapter)",
    channelType: "REST_API",
    endpoint: "https://api.muangthai.co.th/e-policy",
    circuitState: "CLOSED",
    p95LatencyMs: 310,
    failureRatePercent: 0.4,
    lastSyncTimestamp: "2026-10-13T10:15:10Z",
    activeQueueDepth: 2,
  },
  {
    insurerId: "INS-004-MSI",
    insurerName: "MSIG Thailand (Adapter Legacy XML/SOAP)",
    channelType: "SOAP_XML",
    endpoint: "https://b2b.msig.co.th/services/soap",
    circuitState: "OPEN",
    p95LatencyMs: 1450,
    failureRatePercent: 24.5,
    lastSyncTimestamp: "2026-10-13T09:40:00Z",
    activeQueueDepth: 42,
  },
];

const INITIAL_WEBHOOKS: WebhookSubscription[] = [
  {
    subscriptionId: "SUB-CRM-001",
    channelId: "CH-DIRECT-WEB",
    channelName: "Direct Sales Portal (E-Commerce)",
    targetUrl: "https://sales-crm.broker.co.th/api/v1/webhooks/pas-events",
    eventTypes: ["OFFER_RATED", "POLICY_ISSUED", "PAYMENT_FAILED"],
    isActive: true,
    successRate: 99.4,
    lastDispatchedAt: "2026-10-13T10:12:00Z",
  },
  {
    subscriptionId: "SUB-CRM-002",
    channelId: "CH-TELE-001",
    channelName: "Telesales Backoffice Pipeline",
    targetUrl: "https://telesales.internal.broker/api/v1/inbound-events",
    eventTypes: ["INFO_REQUIRED", "QUOTATION_EXPIRED", "RENEWAL_READY"],
    isActive: true,
    successRate: 98.1,
    lastDispatchedAt: "2026-10-13T09:55:00Z",
  },
];

export const IntegrationHubPage: React.FC = () => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"dlq" | "adapters" | "webhooks">("dlq");

  // State management
  const [logs, setLogs] = useState<IntegrationLogEntry[]>(INITIAL_DLQ_LOGS);
  const [adapters] = useState<InsurerAdapterHealth[]>(INITIAL_ADAPTERS);
  const [webhooks] = useState<WebhookSubscription[]>(INITIAL_WEBHOOKS);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [systemFilter, setSystemFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Selected Log for Inspector Modal
  const [selectedLog, setSelectedLog] = useState<IntegrationLogEntry | null>(null);

  // Retrying State tracking (ID list)
  const [retryingIds, setRetryingIds] = useState<string[]>([]);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Batch Trigger Modal State
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchForm, setBatchForm] = useState({
    insurerId: "INS-001-VIR",
    batchType: "SFTP_CSV" as BatchType,
    dataScope: "APPROVED_APPLICATIONS",
    cutoffTimestamp: "2026-10-13T23:59",
  });

  // Filtered DLQ Records
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchStatus = statusFilter === "ALL" || log.status === statusFilter;
      const matchSystem = systemFilter === "ALL" || log.targetSystem === systemFilter;
      const matchSearch =
        searchQuery.trim() === "" ||
        log.logId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.correlationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.policyId && log.policyId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (log.applicationId && log.applicationId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        log.errorMessage.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSystem && matchSearch;
    });
  }, [logs, statusFilter, systemFilter, searchQuery]);

  // DLQ KPI Calculations
  const kpiStats = useMemo(() => {
    const totalFailed = logs.filter((l) => l.status === "FAILED").length;
    const totalResolved = logs.filter((l) => l.status === "RESOLVED").length;
    const criticalBreaches = logs.filter((l) => l.status === "FAILED" && l.retryCount >= 3).length;
    const avgLatency = Math.round(adapters.reduce((acc, curr) => acc + curr.p95LatencyMs, 0) / adapters.length);
    return { totalFailed, totalResolved, criticalBreaches, avgLatency };
  }, [logs, adapters]);

  // Notification helper
  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  // Re-dispatch / Retry Handler (POST /admin/integration-logs/{id}/retry)
  const handleRetryPayload = async (logId: string) => {
    setRetryingIds((prev) => [...prev, logId]);
    showNotification(`Dispatched atomic retry job for log: ${logId}...`);

    setTimeout(() => {
      setLogs((prev) =>
        prev.map((item) => {
          if (item.logId === logId) {
            return {
              ...item,
              status: "RESOLVED",
              retryCount: item.retryCount + 1,
              httpStatus: 200,
              lastAttemptAt: new Date().toISOString(),
              errorMessage: "Successfully acknowledged by remote endpoint on manual retry",
            };
          }
          return item;
        }),
      );
      setRetryingIds((prev) => prev.filter((id) => id !== logId));
      if (selectedLog && selectedLog.logId === logId) {
        setSelectedLog((prev) =>
          prev
            ? {
                ...prev,
                status: "RESOLVED",
                retryCount: prev.retryCount + 1,
                httpStatus: 200,
                lastAttemptAt: new Date().toISOString(),
                errorMessage: "Successfully acknowledged by remote endpoint on manual retry",
              }
            : null,
        );
      }
      showNotification(`Log ${logId} successfully re-synchronized with carrier adapter.`, "success");
    }, 1200);
  };

  // Discard / Quarantine Handler
  const handleDiscardPayload = (logId: string) => {
    setLogs((prev) => prev.map((item) => (item.logId === logId ? { ...item, status: "DISCARDED" } : item)));
    showNotification(`Log ${logId} permanently discarded and quarantined.`, "error");
  };

  // Batch SFTP Trigger (POST /admin/integrations/batch/trigger)
  const handleExecuteBatch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowBatchModal(false);
    showNotification(
      `Job JOB-BATCH-${Math.floor(1000 + Math.random() * 9000)} initiated for ${batchForm.insurerId} via ${batchForm.batchType}.`,
      "success",
    );
  };

  return (
    /* The negative top/horizontal margins offset the parent layout's <main className="p-6"> */
    <div className="-mt-6 -mx-6 bg-zinc-50 min-h-full font-sans text-zinc-900 pb-12 antialiased">
      {/* Toast Notification */}
      {feedbackToast && (
        <div
          className={`fixed top-4 right-6 z-50 px-4 py-3 rounded-md shadow-lg border text-sm font-medium transition-all ${
            feedbackToast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
              : "bg-rose-50 text-rose-800 border-rose-300"
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-current"></span>
            <span>{feedbackToast.message}</span>
          </div>
        </div>
      )}

      {/* COMMAND HEADER (No top padding) */}
      <div className="bg-white border-b border-zinc-200 px-6 py-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              <span>Backoffice Operations</span>
              <span>/</span>
              <span>Adapter Framework</span>
              <span>/</span>
              <span className="text-zinc-800">Dead Letter Queue</span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Integration Hub & DLQ Failsafe</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Monitor carrier adapter telemetry, isolate failed B2B transactions, and re-dispatch quarantined payloads.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => setShowBatchModal(true)}
              className="inline-flex items-center px-3.5 py-2 border border-zinc-300 rounded-md text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-50 hover:border-zinc-400 transition"
            >
              <svg className="w-4 h-4 mr-1.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Trigger Legacy Batch (SFTP)
            </button>
            <button
              onClick={() => showNotification("Refreshed active connection streams.")}
              className="inline-flex items-center px-3.5 py-2 border border-transparent rounded-md text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 shadow-sm transition"
            >
              <svg className="w-4 h-4 mr-1.5 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Sync Adapter Status
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-200 mt-6 space-x-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab("dlq")}
            className={`pb-3 relative transition-colors ${
              activeTab === "dlq"
                ? "text-zinc-900 border-b-2 border-zinc-900 font-semibold"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Dead Letter Queue (DLQ)
            {kpiStats.totalFailed > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                {kpiStats.totalFailed}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("adapters")}
            className={`pb-3 relative transition-colors ${
              activeTab === "adapters"
                ? "text-zinc-900 border-b-2 border-zinc-900 font-semibold"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Carrier Adapters & Circuit Breakers
          </button>
          <button
            onClick={() => setActiveTab("webhooks")}
            className={`pb-3 relative transition-colors ${
              activeTab === "webhooks"
                ? "text-zinc-900 border-b-2 border-zinc-900 font-semibold"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Outbound Webhook Subscriptions
          </button>
        </div>
      </div>

      {/* METRICS & OVERVIEW CARDS */}
      <div className="px-6 mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase">Quarantined Errors (DLQ)</span>
              <span className="p-1.5 bg-rose-50 text-rose-600 rounded">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </span>
            </div>
            <div className="text-2xl font-bold text-zinc-900 mt-2">{kpiStats.totalFailed}</div>
            <div className="text-xs text-rose-600 font-medium mt-1 flex items-center">
              <span>{kpiStats.criticalBreaches} cases exceeded max retry (3+)</span>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase">Successful Recoveries</span>
              <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </span>
            </div>
            <div className="text-2xl font-bold text-zinc-900 mt-2">{kpiStats.totalResolved}</div>
            <div className="text-xs text-zinc-500 font-medium mt-1">Re-dispatched via idempotency key</div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase">Avg B2B Latency (P95)</span>
              <span className="p-1.5 bg-sky-50 text-sky-600 rounded">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
            </div>
            <div className="text-2xl font-bold text-zinc-900 mt-2">{kpiStats.avgLatency} ms</div>
            <div className="text-xs text-zinc-500 font-medium mt-1">SLA Target: &lt; 500 ms</div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase">Circuit Breakers</span>
              <span className="p-1.5 bg-amber-50 text-amber-600 rounded">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                </svg>
              </span>
            </div>
            <div className="text-2xl font-bold text-zinc-900 mt-2">1 OPEN</div>
            <div className="text-xs text-amber-600 font-medium mt-1">MSIG Thailand trip active</div>
          </div>
        </div>
      </div>

      {/* TAB CONTENT: DEAD LETTER QUEUE (DLQ) */}
      {activeTab === "dlq" && (
        <div className="px-6 mt-6">
          {/* Filters Bar */}
          <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-xs mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">Search Identifier</label>
                <input
                  type="text"
                  placeholder="Correlation ID, Policy ID, Log UUID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-800 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">Target System</label>
                <select
                  value={systemFilter}
                  onChange={(e) => setSystemFilter(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-800 bg-white"
                >
                  <option value="ALL">All Systems</option>
                  <option value="VIRIYAH_CORE_API">Viriyah Core API</option>
                  <option value="AIA_B2B_GATEWAY">AIA B2B Gateway</option>
                  <option value="MUANG_THAI_REST">Muang Thai REST</option>
                  <option value="MSIG_LEGACY_SOAP">MSIG SOAP</option>
                  <option value="DOCGEN_S3_WORKER">DocGen S3 Worker</option>
                  <option value="SALES_CHANNEL_CRM">Sales Channel Webhook</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">Resolution Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-800 bg-white"
                >
                  <option value="ALL">All States</option>
                  <option value="FAILED">FAILED (Quarantined)</option>
                  <option value="RESOLVED">RESOLVED (Acknowledged)</option>
                  <option value="DISCARDED">DISCARDED</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSystemFilter("ALL");
                    setStatusFilter("ALL");
                  }}
                  className="w-full text-xs font-semibold py-2 px-3 border border-zinc-300 rounded-md text-zinc-600 hover:bg-zinc-50"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>

          {/* DLQ Data Table */}
          <div className="bg-white border border-zinc-200 rounded-lg shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-200 flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-700 uppercase tracking-wide">
                Quarantined Payloads ({filteredLogs.length})
              </span>
              <span className="text-xs text-zinc-500">
                Immutable table target:{" "}
                <code className="text-zinc-700 bg-zinc-100 px-1 py-0.5 rounded">integration_logs</code>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 text-zinc-600 border-b border-zinc-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Log ID / Timestamp</th>
                    <th className="py-3 px-4">Target Adapter</th>
                    <th className="py-3 px-4">Endpoint / Method</th>
                    <th className="py-3 px-4">HTTP Status</th>
                    <th className="py-3 px-4">Error Reason</th>
                    <th className="py-3 px-4">Retries</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-zinc-700">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-zinc-400">
                        No quarantined logs found matching search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const isRetrying = retryingIds.includes(log.logId);
                      return (
                        <tr key={log.logId} className="hover:bg-zinc-50 transition-colors">
                          <td className="py-3 px-4 font-mono">
                            <div className="font-semibold text-zinc-900">{log.logId}</div>
                            <div className="text-[10px] text-zinc-400">{new Date(log.createdAt).toLocaleString()}</div>
                            {log.policyId && (
                              <div className="text-[10px] text-indigo-600 font-medium">{log.policyId}</div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-medium">
                            <span className="px-2 py-0.5 bg-zinc-100 rounded text-zinc-800 text-[11px]">
                              {log.targetSystem}
                            </span>
                          </td>
                          <td className="py-3 px-4 max-w-xs truncate font-mono text-[11px]">
                            <span className="font-bold text-zinc-500 mr-1">{log.httpMethod}</span>
                            {log.endpoint}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                                log.httpStatus >= 500
                                  ? "bg-rose-100 text-rose-800"
                                  : log.httpStatus >= 400
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {log.httpStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 max-w-sm truncate text-zinc-600" title={log.errorMessage}>
                            {log.errorMessage}
                          </td>
                          <td className="py-3 px-4 font-semibold text-zinc-600">
                            {log.retryCount} / {log.maxRetries}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                log.status === "FAILED"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : log.status === "RESOLVED"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-zinc-100 text-zinc-600"
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-1 shrink-0">
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="px-2 py-1 border border-zinc-300 rounded text-[11px] font-medium text-zinc-700 hover:bg-zinc-100"
                            >
                              Inspect
                            </button>
                            {log.status === "FAILED" && (
                              <button
                                disabled={isRetrying}
                                onClick={() => handleRetryPayload(log.logId)}
                                className="px-2 py-1 bg-zinc-900 text-white rounded text-[11px] font-medium hover:bg-zinc-800 disabled:opacity-50"
                              >
                                {isRetrying ? "Retrying..." : "Re-dispatch"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: CARRIER ADAPTERS & CIRCUIT BREAKERS */}
      {activeTab === "adapters" && (
        <div className="px-6 mt-6">
          <div className="bg-white border border-zinc-200 rounded-lg shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Partner Carrier Adapters (Phase 1)</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Decoupled translation layers mapping canonical PAS JSON to partner specific REST/SOAP formats.
                </p>
              </div>
              <span className="text-xs bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded font-medium">
                Resilience: Circuit Breaker Protected
              </span>
            </div>

            <div className="divide-y divide-zinc-200">
              {adapters.map((item) => (
                <div
                  key={item.insurerId}
                  className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-zinc-900">{item.insurerName}</span>
                      <span className="text-xs font-mono text-zinc-400">({item.insurerId})</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-100 font-semibold text-zinc-700">
                        {item.channelType}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-zinc-500 mt-1">{item.endpoint}</div>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-zinc-500">
                      <span>
                        P95 Latency: <strong className="text-zinc-800">{item.p95LatencyMs} ms</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Error Rate:{" "}
                        <strong className={item.failureRatePercent > 5 ? "text-rose-600" : "text-zinc-800"}>
                          {item.failureRatePercent}%
                        </strong>
                      </span>
                      <span>•</span>
                      <span>Last Ping: {new Date(item.lastSyncTimestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  {/* Circuit State & Actions */}
                  <div className="flex items-center space-x-4 w-full lg:w-auto justify-between lg:justify-end">
                    <div className="text-right">
                      <div className="text-[10px] text-zinc-400 uppercase font-semibold">Circuit State</div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          item.circuitState === "CLOSED"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.circuitState === "HALF_OPEN"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {item.circuitState}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-zinc-400 uppercase font-semibold">Queue Lag</div>
                      <div className="text-sm font-bold text-zinc-800">{item.activeQueueDepth} pkts</div>
                    </div>

                    <button
                      onClick={() => showNotification(`Simulated synthetic probe dispatched to ${item.insurerName}`)}
                      className="px-3 py-1.5 border border-zinc-300 rounded text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                    >
                      Health Probe
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: WEBHOOK SUBSCRIPTIONS */}
      {activeTab === "webhooks" && (
        <div className="px-6 mt-6">
          <div className="bg-white border border-zinc-200 rounded-lg shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Registered Sales Channel Webhooks</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Outbound Pub/Sub dispatchers streaming PAS lifecycle events (OFFER_RATED, POLICY_ISSUED) to frontends.
                </p>
              </div>
              <button
                onClick={() => showNotification("Open Webhook Registration dialog")}
                className="px-3 py-1.5 bg-zinc-900 text-white rounded text-xs font-semibold hover:bg-zinc-800"
              >
                + Register New Endpoint
              </button>
            </div>

            <div className="divide-y divide-zinc-200 text-xs">
              {webhooks.map((sub) => (
                <div
                  key={sub.subscriptionId}
                  className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-zinc-900 text-sm">{sub.channelName}</span>
                      <span className="font-mono text-zinc-400">({sub.channelId})</span>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold rounded text-[10px]">
                        ACTIVE
                      </span>
                    </div>
                    <div className="font-mono text-zinc-600 mt-1 text-[11px] bg-zinc-50 px-2 py-1 rounded border border-zinc-200 inline-block">
                      {sub.targetUrl}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {sub.eventTypes.map((evt) => (
                        <span key={evt} className="px-2 py-0.5 bg-zinc-100 text-zinc-700 font-mono text-[10px] rounded">
                          {evt}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-right">
                    <div>
                      <div className="text-[10px] text-zinc-400 uppercase font-semibold">Delivery Rate</div>
                      <div className="text-sm font-bold text-emerald-600">{sub.successRate}%</div>
                    </div>
                    <button
                      onClick={() => showNotification(`Test payload dispatched to ${sub.targetUrl}`)}
                      className="px-3 py-1.5 border border-zinc-300 rounded text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                    >
                      Send Test Ping
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* INSPECT & RETRY DRAWER / MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-zinc-300">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div>
                <div className="text-xs font-bold text-zinc-500 uppercase">DLQ Payload Inspector</div>
                <h2 className="text-base font-bold text-zinc-900 font-mono">{selectedLog.logId}</h2>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-zinc-400 hover:text-zinc-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-zinc-50 border border-zinc-200 rounded">
                <div>
                  <span className="text-zinc-400 block text-[10px] font-semibold uppercase">Correlation ID</span>
                  <span className="font-mono text-zinc-800 break-all">{selectedLog.correlationId}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] font-semibold uppercase">Target System</span>
                  <span className="font-semibold text-zinc-800">{selectedLog.targetSystem}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] font-semibold uppercase">HTTP Status Code</span>
                  <span className="font-bold text-rose-600">{selectedLog.httpStatus}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] font-semibold uppercase">Retry Counter</span>
                  <span className="font-semibold text-zinc-800">
                    {selectedLog.retryCount} / {selectedLog.maxRetries}
                  </span>
                </div>
              </div>

              {/* Error Banner */}
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800">
                <span className="font-bold block mb-0.5">Failure Diagnostic:</span>
                <span className="font-mono">{selectedLog.errorMessage}</span>
              </div>

              {/* JSON Payloads Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-bold text-zinc-700 block mb-1">Request Payload (JSON)</span>
                  <pre className="p-3 bg-zinc-900 text-zinc-100 rounded text-[11px] font-mono overflow-x-auto h-60">
                    {JSON.stringify(selectedLog.requestPayload, null, 2)}
                  </pre>
                </div>
                <div>
                  <span className="font-bold text-zinc-700 block mb-1">Downstream Response (JSON)</span>
                  <pre className="p-3 bg-zinc-900 text-zinc-100 rounded text-[11px] font-mono overflow-x-auto h-60">
                    {JSON.stringify(selectedLog.responsePayload, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <button
                onClick={() => handleDiscardPayload(selectedLog.logId)}
                className="px-3 py-1.5 border border-rose-300 text-rose-700 rounded text-xs font-semibold hover:bg-rose-50"
              >
                Acknowledge & Discard
              </button>

              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-3 py-1.5 border border-zinc-300 text-zinc-700 rounded text-xs font-semibold hover:bg-zinc-100"
                >
                  Close
                </button>
                {selectedLog.status === "FAILED" && (
                  <button
                    onClick={() => handleRetryPayload(selectedLog.logId)}
                    className="px-4 py-1.5 bg-zinc-900 text-white rounded text-xs font-semibold hover:bg-zinc-800"
                  >
                    Re-dispatch Payload
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TRIGGER BATCH MODAL */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-zinc-300 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900">Trigger Legacy Batch Sync</h3>
              <button onClick={() => setShowBatchModal(false)} className="text-zinc-400 hover:text-zinc-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleExecuteBatch} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Target Insurer</label>
                <select
                  value={batchForm.insurerId}
                  onChange={(e) => setBatchForm({ ...batchForm, insurerId: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded focus:ring-1 focus:ring-zinc-800 bg-white"
                >
                  <option value="INS-001-VIR">Viriyah Insurance</option>
                  <option value="INS-004-MSI">MSIG Thailand</option>
                  <option value="INS-003-MTI">Muang Thai Insurance</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Batch Transport Protocol</label>
                <select
                  value={batchForm.batchType}
                  onChange={(e) => setBatchForm({ ...batchForm, batchType: e.target.value as BatchType })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded focus:ring-1 focus:ring-zinc-800 bg-white"
                >
                  <option value="SFTP_CSV">SFTP CSV Upload</option>
                  <option value="SFTP_XML">SFTP XML Bordereau</option>
                  <option value="EMAIL_PDF_ATTACHMENT">Automated Email with PDF Attachments</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Data Scope</label>
                <select
                  value={batchForm.dataScope}
                  onChange={(e) => setBatchForm({ ...batchForm, dataScope: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded focus:ring-1 focus:ring-zinc-800 bg-white"
                >
                  <option value="APPROVED_APPLICATIONS">Approved Applications (New Business)</option>
                  <option value="CANCELLATIONS">Cancelled Policies (Clawbacks)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Cutoff Timestamp</label>
                <input
                  type="datetime-local"
                  value={batchForm.cutoffTimestamp}
                  onChange={(e) => setBatchForm({ ...batchForm, cutoffTimestamp: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded focus:ring-1 focus:ring-zinc-800 bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-3 py-2 border border-zinc-300 rounded text-zinc-700 font-semibold hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-zinc-900 text-white rounded font-semibold hover:bg-zinc-800"
                >
                  Dispatch Batch Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationHubPage;
