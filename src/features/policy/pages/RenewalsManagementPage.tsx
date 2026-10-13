import {
  AlertCircle,
  Building,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Filter,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  TrendingUp,
  UploadCloud,
  X,
} from "lucide-react";
import React, { useId, useState } from "react";

// --- Type Definitions aligned with PAS Architecture & Data Dictionary ---

export type PricingStrategy = "ATTAINED_AGE" | "ISSUE_AGE";

export type RenewalStatus =
  | "RENEWAL_OFFER_READY"
  | "APPROVED_WAITING_PAYMENT"
  | "INFO_REQUIRED"
  | "CONVERTED_TO_POLICY"
  | "EXPIRED";

export interface RenewalItem {
  id: string;
  policyId: string;
  policyNumber: string;
  referenceNumber?: string;
  customerName: string;
  customerMaskedId: string;
  lob: "MOTOR" | "HEALTH" | "TRAVEL" | "PA" | "LIFE" | "FIRE";
  insurerName: string;
  currentGrossPremium: number;
  renewalGrossPremium: number;
  pricingStrategy: PricingStrategy;
  expiryDate: string; // ISO format
  daysUntilExpiry: number;
  status: RenewalStatus;
  channelName: string;
  autoBatchGenerated: boolean;
}

export interface RenewalMetrics {
  totalUpcoming: number;
  offersReady: number;
  waitingPayment: number;
  conversionRate: number;
}

// --- Mock Data ---

const INITIAL_RENEWALS: RenewalItem[] = [
  {
    id: "app-ren-2026-001",
    policyId: "pol-uuid-101",
    policyNumber: "V-102948-M",
    customerName: "Somchai Jaidee",
    customerMaskedId: "1-1004-XXXX-88-9",
    lob: "MOTOR",
    insurerName: "Viriyah Insurance",
    currentGrossPremium: 18500.0,
    renewalGrossPremium: 17200.0, // NCD applied via ATTAINED_AGE
    pricingStrategy: "ATTAINED_AGE",
    expiryDate: "2026-11-15",
    daysUntilExpiry: 33,
    status: "RENEWAL_OFFER_READY",
    channelName: "Direct Web",
    autoBatchGenerated: true,
  },
  {
    id: "app-ren-2026-002",
    policyId: "pol-uuid-102",
    policyNumber: "AIA-L-99823",
    customerName: "Kanya Ratanawong",
    customerMaskedId: "3-1020-XXXX-11-2",
    lob: "LIFE",
    insurerName: "AIA Thailand",
    currentGrossPremium: 42000.0,
    renewalGrossPremium: 42000.0, // Fixed premium via ISSUE_AGE
    pricingStrategy: "ISSUE_AGE",
    expiryDate: "2026-11-28",
    daysUntilExpiry: 46,
    status: "APPROVED_WAITING_PAYMENT",
    channelName: "Telesales",
    autoBatchGenerated: true,
  },
  {
    id: "app-ren-2026-003",
    policyId: "pol-uuid-103",
    policyNumber: "MT-H-55421",
    customerName: "Arun Prasert",
    customerMaskedId: "1-5099-XXXX-45-7",
    lob: "HEALTH",
    insurerName: "Muang Thai Insurance",
    currentGrossPremium: 28000.0,
    renewalGrossPremium: 31500.0,
    pricingStrategy: "ATTAINED_AGE",
    expiryDate: "2026-12-05",
    daysUntilExpiry: 53,
    status: "INFO_REQUIRED",
    channelName: "Sub-agent",
    autoBatchGenerated: false,
  },
  {
    id: "app-ren-2026-004",
    policyId: "pol-uuid-104",
    policyNumber: "BKI-M-88310",
    customerName: "Thanaporn Srisuk",
    customerMaskedId: "5-2001-XXXX-99-0",
    lob: "MOTOR",
    insurerName: "Bangkok Insurance",
    currentGrossPremium: 15400.0,
    renewalGrossPremium: 14800.0,
    pricingStrategy: "ATTAINED_AGE",
    expiryDate: "2026-10-25",
    daysUntilExpiry: 12,
    status: "CONVERTED_TO_POLICY",
    channelName: "Direct Web",
    autoBatchGenerated: true,
  },
];

export const RenewalsManagementPage: React.FC = () => {
  const [renewals, setRenewals] = useState<RenewalItem[]>(INITIAL_RENEWALS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLOB, setSelectedLOB] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);
  const [selectedPolicyForAction, setSelectedPolicyForAction] = useState<RenewalItem | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const searchInputId = useId();
  const lobFilterId = useId();
  const statusFilterId = useId();

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Filter renewals
  const filteredRenewals = renewals.filter((item) => {
    const matchesSearch =
      item.policyNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.insurerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLOB = selectedLOB === "ALL" || item.lob === selectedLOB;
    const matchesStatus = selectedStatus === "ALL" || item.status === selectedStatus;
    return matchesSearch && matchesLOB && matchesStatus;
  });

  // Calculate Metrics
  const metrics: RenewalMetrics = {
    totalUpcoming: renewals.length,
    offersReady: renewals.filter((r) => r.status === "RENEWAL_OFFER_READY").length,
    waitingPayment: renewals.filter((r) => r.status === "APPROVED_WAITING_PAYMENT").length,
    conversionRate: Math.round(
      (renewals.filter((r) => r.status === "CONVERTED_TO_POLICY").length / renewals.length) * 100,
    ),
  };

  const handleManualTriggerQuote = (item: RenewalItem) => {
    setRenewals((prev) =>
      prev.map((r) =>
        r.id === item.id
          ? {
              ...r,
              status: "RENEWAL_OFFER_READY",
              renewalGrossPremium:
                r.pricingStrategy === "ATTAINED_AGE" ? r.currentGrossPremium * 0.95 : r.currentGrossPremium,
            }
          : r,
      ),
    );
    showNotification(`POST /policies/${item.policyId}/renew: Offer calculated and staged.`);
    setSelectedPolicyForAction(null);
  };

  const handleFireWebhook = (item: RenewalItem) => {
    showNotification(`Fired Webhook EVENT: RENEWAL_READY for Application ${item.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          role="alert"
          aria-live="polite"
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg text-sm transition-all ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
            Policy Lifecycle Management (Stage 7)
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Renewals Management</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Monitor automated 90-day expiry triggers, pricing strategy recalculations, and bulk renewal lists.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 transition shadow-sm"
          >
            <UploadCloud className="w-4 h-4 text-zinc-500" />
            Bulk CSV Ingestion
          </button>
          <button
            onClick={() => setIsTriggerModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Trigger 90-Day Batch
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Policies in 90-Day Window
            </span>
            <div className="text-2xl font-bold text-zinc-900 mt-1">{metrics.totalUpcoming}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Offers Ready (Calculated)
            </span>
            <div className="text-2xl font-bold text-blue-600 mt-1">{metrics.offersReady}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Waiting Payment</span>
            <div className="text-2xl font-bold text-amber-600 mt-1">{metrics.waitingPayment}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Current Retention Rate</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{metrics.conversionRate}%</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <label htmlFor={searchInputId} className="sr-only">
            Search by Policy, Customer, or Insurer
          </label>
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id={searchInputId}
            type="text"
            placeholder="Search by Policy, Customer, or Insurer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-400" />
            <label htmlFor={lobFilterId} className="sr-only">
              Filter by Line of Business
            </label>
            <select
              id={lobFilterId}
              value={selectedLOB}
              onChange={(e) => setSelectedLOB(e.target.value)}
              className="text-xs font-medium bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All LOBs</option>
              <option value="MOTOR">Motor</option>
              <option value="HEALTH">Health</option>
              <option value="LIFE">Life</option>
              <option value="FIRE">Fire</option>
              <option value="TRAVEL">Travel</option>
            </select>
          </div>

          <label htmlFor={statusFilterId} className="sr-only">
            Filter by Status
          </label>
          <select
            id={statusFilterId}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs font-medium bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="RENEWAL_OFFER_READY">Offer Ready</option>
            <option value="APPROVED_WAITING_PAYMENT">Waiting Payment</option>
            <option value="INFO_REQUIRED">Info Required</option>
            <option value="CONVERTED_TO_POLICY">Converted</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/75 border-b border-zinc-200 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                <th className="py-3 px-4">Policy / Customer</th>
                <th className="py-3 px-4">Line & Insurer</th>
                <th className="py-3 px-4">Pricing Strategy</th>
                <th className="py-3 px-4 text-right">Premium Comparison</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Lifecycle State</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-sm">
              {filteredRenewals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    <FileText className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                    No renewal records match your active criteria.
                  </td>
                </tr>
              ) : (
                filteredRenewals.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/50 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-900">{item.policyNumber}</div>
                      <div className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                        <span>{item.customerName}</span>
                        <span className="text-zinc-300">|</span>
                        <span className="font-mono text-[11px] text-zinc-400">{item.customerMaskedId}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-800">
                        {item.lob}
                      </span>
                      <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                        <Building className="w-3 h-3 text-zinc-400" />
                        {item.insurerName}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-mono font-medium ${
                            item.pricingStrategy === "ATTAINED_AGE"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-purple-50 text-purple-700 border border-purple-200"
                          }`}
                        >
                          {item.pricingStrategy}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        {item.pricingStrategy === "ATTAINED_AGE" ? "Recalculates via URE" : "Fixed entry pricing"}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="text-xs text-zinc-400 line-through">
                        ฿{item.currentGrossPremium.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="font-semibold text-zinc-900">
                        ฿{item.renewalGrossPremium.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-xs font-medium text-zinc-800 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                        {item.expiryDate}
                      </div>
                      <span
                        className={`text-[11px] font-medium ${
                          item.daysUntilExpiry <= 30 ? "text-rose-600" : "text-zinc-500"
                        }`}
                      >
                        {item.daysUntilExpiry} days remaining
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          item.status === "RENEWAL_OFFER_READY"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : item.status === "APPROVED_WAITING_PAYMENT"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : item.status === "CONVERTED_TO_POLICY"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-zinc-100 text-zinc-700 border border-zinc-200"
                        }`}
                      >
                        {item.status === "RENEWAL_OFFER_READY" && <TrendingUp className="w-3 h-3" />}
                        {item.status === "APPROVED_WAITING_PAYMENT" && <Clock className="w-3 h-3" />}
                        {item.status === "CONVERTED_TO_POLICY" && <Check className="w-3 h-3" />}
                        {item.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {item.status === "INFO_REQUIRED" && (
                          <button
                            onClick={() => handleManualTriggerQuote(item)}
                            className="px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded border border-indigo-200 transition"
                            title="Recalculate Premium"
                          >
                            Recalculate
                          </button>
                        )}
                        {item.status === "RENEWAL_OFFER_READY" && (
                          <button
                            onClick={() => handleFireWebhook(item)}
                            className="p-1.5 text-zinc-600 hover:text-indigo-600 hover:bg-zinc-100 rounded transition"
                            title="Broadcast EVENT: RENEWAL_READY webhook"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedPolicyForAction(item)}
                          className="p-1.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Bulk CSV Ingestion (BRD 7.3 Stage 7 & Flow 5.3) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-zinc-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <h2 className="text-base font-bold text-zinc-900">
                Bulk Renewal List Ingestion (POST /admin/imports/policies)
              </h2>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-zinc-500">
                Upload external carrier spreadsheets for migrated or offline policies. The system parses rows, upserts
                Golden Record customers, creates historical master policies, and stages renewal applications.
              </p>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-600 mb-1">
                  Target Insurer (Carrier)
                </label>
                <select className="w-full text-sm bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="1">Viriyah Insurance</option>
                  <option value="2">AIA Thailand</option>
                  <option value="3">Muang Thai Insurance</option>
                  <option value="4">Bangkok Insurance</option>
                </select>
              </div>

              <div className="border-2 border-dashed border-zinc-300 rounded-xl p-6 text-center hover:bg-zinc-50 transition cursor-pointer">
                <UploadCloud className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                <span className="text-xs font-medium text-zinc-700 block">
                  Click to select CSV/Excel template or drag and drop
                </span>
                <span className="text-[11px] text-zinc-400">Headers validated against PAS Migration Schema</span>
              </div>
            </div>

            <div className="px-6 py-3 bg-zinc-50 border-t border-zinc-200 flex justify-end gap-2">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-md transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  showNotification("Batch job staged: Workers assigned to legacy ingestion queue.");
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition"
              >
                Start Background Ingestion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: 90-Day Automation Trigger Simulator */}
      {isTriggerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-zinc-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <h2 className="text-base font-bold text-zinc-900">Trigger 90-Day Nightly Cron Scan</h2>
              <button
                onClick={() => setIsTriggerModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <strong>Worker Simulation:</strong> Scans active contracts expiring within 90 days. Applies{" "}
                  <code className="font-mono text-amber-900">ATTAINED_AGE</code> or{" "}
                  <code className="font-mono text-amber-900">ISSUE_AGE</code> rules and broadcasts{" "}
                  <code className="font-mono text-amber-900">EVENT_RENEWAL_READY</code>.
                </div>
              </div>
              <p className="text-xs text-zinc-600">
                Executing this manually verifies that the underwriting engine correctly parses vehicle depreciation, NCD
                steps, and age-bracket loadings.
              </p>
            </div>

            <div className="px-6 py-3 bg-zinc-50 border-t border-zinc-200 flex justify-end gap-2">
              <button
                onClick={() => setIsTriggerModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-md transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsTriggerModalOpen(false);
                  showNotification("Batch complete: 14 policies processed, 14 draft applications staged.");
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition"
              >
                Run Batch Scan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Renewal Inspection Drawer */}
      {selectedPolicyForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-zinc-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div>
                <h2 className="text-base font-bold text-zinc-900">Renewal Lineage Details</h2>
                <span className="text-xs font-mono text-zinc-500">{selectedPolicyForAction.id}</span>
              </div>
              <button
                onClick={() => setSelectedPolicyForAction(null)}
                className="text-zinc-400 hover:text-zinc-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-zinc-400 block">Parent Master Policy</span>
                  <span className="font-semibold text-zinc-800">{selectedPolicyForAction.policyNumber}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block">Insured Individual</span>
                  <span className="font-semibold text-zinc-800">{selectedPolicyForAction.customerName}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block">Pricing Formula</span>
                  <span className="font-semibold text-zinc-800">{selectedPolicyForAction.pricingStrategy}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block">Current Status</span>
                  <span className="font-semibold text-zinc-800">{selectedPolicyForAction.status}</span>
                </div>
              </div>

              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                <div className="text-xs font-semibold text-zinc-700 mb-2">Financial Calculation Audit</div>
                <div className="flex justify-between text-xs py-1 border-b border-zinc-200">
                  <span className="text-zinc-500">Expiring Gross Premium</span>
                  <span className="font-medium">฿{selectedPolicyForAction.currentGrossPremium.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs py-1">
                  <span className="text-zinc-500">Staged Renewal Premium</span>
                  <span className="font-bold text-indigo-600">
                    ฿{selectedPolicyForAction.renewalGrossPremium.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-zinc-50 border-t border-zinc-200 flex justify-end">
              <button
                onClick={() => setSelectedPolicyForAction(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-zinc-800 hover:bg-zinc-900 rounded-md transition"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RenewalsManagementPage;
