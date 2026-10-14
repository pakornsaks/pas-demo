import React, { useMemo, useState } from "react";

// ============================================================================
// Types & Domain Schemas (Mapped to SDD 4.4 & BRD 7.1/7.9)
// ============================================================================

export type VersionStatus = "ACTIVE" | "DRAFT" | "SCHEDULED" | "ARCHIVED";
export type PayeeType = "BROKER" | "INSURER" | "THIRD_PARTY";
export type PaymentTiming = "BEFORE_ISSUANCE" | "AFTER_ISSUANCE";

export interface ProductVersionConfig {
  versionId: string;
  productId: string;
  productCode: string;
  name: string;
  lobCode: "MOTOR" | "HEALTH" | "TRAVEL" | "FIRE" | "PA" | "LIFE" | "CUSTOM";
  versionNumber: string;
  status: VersionStatus;
  payeeType: PayeeType;
  baseInsurerCommissionPercent: number;
  paymentTiming: PaymentTiming;
  allowedPaymentMethods: string[];
  allowedPaymentTerms: string[];
  installmentConfig: {
    durationMonths: number;
    firstMonthPercent: number;
  };
  effectiveStartDate: string;
  effectiveEndDate: string | null;
  createdBy: string;
  createdAt: string;
  publishedBy?: string;
  changeSummary?: string;
}

export interface DiffField {
  label: string;
  key: string;
  oldVal: string | number | boolean;
  newVal: string | number | boolean;
  isModified: boolean;
}

// ============================================================================
// Mock Data (Representing database snapshots from PostgreSQL product_versions)
// ============================================================================

const MOCK_VERSIONS: ProductVersionConfig[] = [
  {
    versionId: "ver-8899-motor-v2.1",
    productId: "prod-001",
    productCode: "VIRIYAH-MOTOR-T1-2026",
    name: "Viriyah Comprehensive Type 1 (EV & ICE)",
    lobCode: "MOTOR",
    versionNumber: "v2.1",
    status: "DRAFT",
    payeeType: "BROKER",
    baseInsurerCommissionPercent: 18.5,
    paymentTiming: "BEFORE_ISSUANCE",
    allowedPaymentMethods: ["CREDIT_CARD", "PROMPTPAY", "INSTALLMENT"],
    allowedPaymentTerms: ["SINGLE", "INSTALLMENT_3M", "INSTALLMENT_6M"],
    installmentConfig: { durationMonths: 6, firstMonthPercent: 30.0 },
    effectiveStartDate: "2026-11-01T00:00:00Z",
    effectiveEndDate: null,
    createdBy: "usr-maker-operations@broker.com",
    createdAt: "2026-10-12T09:30:00Z",
    changeSummary: "Updated commission rates for Q4 and activated 6-month installment schedules",
  },
  {
    versionId: "ver-7711-motor-v2.0",
    productId: "prod-001",
    productCode: "VIRIYAH-MOTOR-T1-2026",
    name: "Viriyah Comprehensive Type 1",
    lobCode: "MOTOR",
    versionNumber: "v2.0",
    status: "ACTIVE",
    payeeType: "BROKER",
    baseInsurerCommissionPercent: 16.0,
    paymentTiming: "BEFORE_ISSUANCE",
    allowedPaymentMethods: ["CREDIT_CARD", "PROMPTPAY"],
    allowedPaymentTerms: ["SINGLE", "INSTALLMENT_3M"],
    installmentConfig: { durationMonths: 3, firstMonthPercent: 35.0 },
    effectiveStartDate: "2026-01-01T00:00:00Z",
    effectiveEndDate: null,
    createdBy: "usr-admin-system@broker.com",
    createdAt: "2025-12-15T14:20:00Z",
    publishedBy: "usr-checker-underwriting@broker.com",
    changeSummary: "Baseline fiscal product version for 2026",
  },
  {
    versionId: "ver-5500-motor-v1.0",
    productId: "prod-001",
    productCode: "VIRIYAH-MOTOR-T1-2025",
    name: "Viriyah Comprehensive Type 1 Legacy",
    lobCode: "MOTOR",
    versionNumber: "v1.0",
    status: "ARCHIVED",
    payeeType: "INSURER",
    baseInsurerCommissionPercent: 15.0,
    paymentTiming: "AFTER_ISSUANCE",
    allowedPaymentMethods: ["CREDIT_CARD"],
    allowedPaymentTerms: ["SINGLE"],
    installmentConfig: { durationMonths: 0, firstMonthPercent: 100.0 },
    effectiveStartDate: "2025-01-01T00:00:00Z",
    effectiveEndDate: "2025-12-31T23:59:59Z",
    createdBy: "usr-legacy-etl@broker.com",
    createdAt: "2024-12-20T10:00:00Z",
    publishedBy: "usr-checker-compliance@broker.com",
    changeSummary: "Superseded by 2026 master rates",
  },
  {
    versionId: "ver-9901-health-v1.2",
    productId: "prod-002",
    productCode: "AIA-HEALTH-PRESTIGE-2026",
    name: "AIA Care First Ultra Health Package",
    lobCode: "HEALTH",
    versionNumber: "v1.2",
    status: "SCHEDULED",
    payeeType: "INSURER",
    baseInsurerCommissionPercent: 22.0,
    paymentTiming: "BEFORE_ISSUANCE",
    allowedPaymentMethods: ["CREDIT_CARD", "DIRECT_DEBIT"],
    allowedPaymentTerms: ["SINGLE", "ANNUAL_RENEWAL"],
    installmentConfig: { durationMonths: 12, firstMonthPercent: 8.33 },
    effectiveStartDate: "2026-12-01T00:00:00Z",
    effectiveEndDate: null,
    createdBy: "usr-maker-actuary@broker.com",
    createdAt: "2026-10-10T16:45:00Z",
    publishedBy: "usr-checker-governance@broker.com",
    changeSummary: "Scheduled Year-End Tax Deduction campaign edition",
  },
];

// ============================================================================
// Main Page Component
// ============================================================================

export const VersioningPublishingPage: React.FC = () => {
  const [versions, setVersions] = useState<ProductVersionConfig[]>(MOCK_VERSIONS);
  const [selectedLob, setSelectedLob] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals & Panels State
  const [activeDiffModal, setActiveDiffModal] = useState<{
    draft: ProductVersionConfig;
    active: ProductVersionConfig | null;
  } | null>(null);

  const [publishingModalDraft, setPublishingModalDraft] = useState<ProductVersionConfig | null>(null);
  const [publishMode, setPublishMode] = useState<"IMMEDIATE" | "SCHEDULED">("IMMEDIATE");
  const [scheduledDate, setScheduledDate] = useState<string>("2026-11-01");
  const [submissionComments, setSubmissionComments] = useState<string>("");
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Filtered List
  const filteredVersions = useMemo(() => {
    return versions.filter((ver) => {
      const matchLob = selectedLob === "ALL" || ver.lobCode === selectedLob;
      const matchStatus = selectedStatus === "ALL" || ver.status === selectedStatus;
      const matchSearch =
        ver.productCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ver.versionNumber.toLowerCase().includes(searchQuery.toLowerCase());
      return matchLob && matchStatus && matchSearch;
    });
  }, [versions, selectedLob, selectedStatus, searchQuery]);

  // Clone & Fork action (SCD Type 2 - Copy-on-Write)
  const handleCloneNewDraft = (activeVer: ProductVersionConfig) => {
    const existingDraft = versions.find((v) => v.productId === activeVer.productId && v.status === "DRAFT");
    if (existingDraft) {
      alert(
        `A Draft version (${existingDraft.versionNumber}) already exists for ${activeVer.productCode}. Please review or delete the existing draft first.`,
      );
      return;
    }

    const versionNumParts = activeVer.versionNumber.replace("v", "").split(".");
    const nextSubVersion = `v${versionNumParts[0]}.${parseInt(versionNumParts[1] || "0", 10) + 1}`;

    const newDraft: ProductVersionConfig = {
      ...activeVer,
      versionId: `ver-${Date.now().toString().slice(-4)}-${activeVer.lobCode.toLowerCase()}-${nextSubVersion}`,
      versionNumber: nextSubVersion,
      status: "DRAFT",
      effectiveStartDate: new Date().toISOString(),
      effectiveEndDate: null,
      createdBy: "current-admin-user@broker.com",
      createdAt: new Date().toISOString(),
      publishedBy: undefined,
      changeSummary: `Cloned from ${activeVer.versionNumber} for tariff adjustment.`,
    };

    setVersions([newDraft, ...versions]);
    setActionSuccessMsg(`Successfully created Draft snapshot ${newDraft.versionNumber} for ${newDraft.productCode}`);
    setTimeout(() => setActionSuccessMsg(null), 5000);
  };

  // Submit Draft to Maker-Checker Approval Pipeline
  const handleConfirmPublishingRequest = () => {
    if (!publishingModalDraft) return;

    if (!submissionComments.trim()) {
      alert("Please provide justification notes for the Maker-Checker governance audit trail.");
      return;
    }

    // In a live PAS engine: Calls POST /admin/approvals/request (Flow 5.14)
    setVersions((prev) =>
      prev.map((v) => {
        if (v.versionId === publishingModalDraft.versionId) {
          return {
            ...v,
            status: publishMode === "IMMEDIATE" ? "ACTIVE" : "SCHEDULED",
            effectiveStartDate: publishMode === "IMMEDIATE" ? new Date().toISOString() : `${scheduledDate}T00:00:00Z`,
            changeSummary: submissionComments,
          };
        }
        // If immediate publish, retire previous active version
        if (publishMode === "IMMEDIATE" && v.productId === publishingModalDraft.productId && v.status === "ACTIVE") {
          return {
            ...v,
            status: "ARCHIVED",
            effectiveEndDate: new Date().toISOString(),
          };
        }
        return v;
      }),
    );

    setActionSuccessMsg(
      `Version ${publishingModalDraft.versionNumber} successfully submitted to Approval Inbox. (Maker-Checker Gatekeeper Enforced)`,
    );
    setPublishingModalDraft(null);
    setSubmissionComments("");
    setTimeout(() => setActionSuccessMsg(null), 6000);
  };

  // Generate Field-by-Field Diff Comparison
  const getDiffBreakdown = (draft: ProductVersionConfig, active: ProductVersionConfig | null): DiffField[] => {
    if (!active) {
      return [
        { label: "Code", key: "productCode", oldVal: "None", newVal: draft.productCode, isModified: true },
        { label: "Version", key: "versionNumber", oldVal: "None", newVal: draft.versionNumber, isModified: true },
        {
          label: "Commission %",
          key: "baseInsurerCommissionPercent",
          oldVal: "0.00%",
          newVal: `${draft.baseInsurerCommissionPercent}%`,
          isModified: true,
        },
        { label: "Payee Settlement", key: "payeeType", oldVal: "None", newVal: draft.payeeType, isModified: true },
      ];
    }

    return [
      {
        label: "Product Code",
        key: "productCode",
        oldVal: active.productCode,
        newVal: draft.productCode,
        isModified: active.productCode !== draft.productCode,
      },
      {
        label: "Version Number",
        key: "versionNumber",
        oldVal: active.versionNumber,
        newVal: draft.versionNumber,
        isModified: active.versionNumber !== draft.versionNumber,
      },
      {
        label: "Insurer Commission Rate",
        key: "baseInsurerCommissionPercent",
        oldVal: `${active.baseInsurerCommissionPercent.toFixed(2)}%`,
        newVal: `${draft.baseInsurerCommissionPercent.toFixed(2)}%`,
        isModified: active.baseInsurerCommissionPercent !== draft.baseInsurerCommissionPercent,
      },
      {
        label: "Payee Type (Settlement)",
        key: "payeeType",
        oldVal: active.payeeType,
        newVal: draft.payeeType,
        isModified: active.payeeType !== draft.payeeType,
      },
      {
        label: "Payment Timing Gate",
        key: "paymentTiming",
        oldVal: active.paymentTiming,
        newVal: draft.paymentTiming,
        isModified: active.paymentTiming !== draft.paymentTiming,
      },
      {
        label: "Allowed Payment Methods",
        key: "allowedPaymentMethods",
        oldVal: active.allowedPaymentMethods.join(", "),
        newVal: draft.allowedPaymentMethods.join(", "),
        isModified: active.allowedPaymentMethods.join(",") !== draft.allowedPaymentMethods.join(","),
      },
      {
        label: "Installment Terms",
        key: "installmentConfig",
        oldVal: `${active.installmentConfig.durationMonths} Mos (${active.installmentConfig.firstMonthPercent}% upfront)`,
        newVal: `${draft.installmentConfig.durationMonths} Mos (${draft.installmentConfig.firstMonthPercent}% upfront)`,
        isModified:
          active.installmentConfig.durationMonths !== draft.installmentConfig.durationMonths ||
          active.installmentConfig.firstMonthPercent !== draft.installmentConfig.firstMonthPercent,
      },
    ];
  };

  return (
    <div className="min-h-full bg-zinc-50 text-zinc-900 -mt-6 -mx-6 pb-12 antialiased">
      {/* =========================================================================
          Top Header Bar (No top padding, sits flush against header boundary)
         ========================================================================= */}
      <div className="bg-white border-b border-zinc-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight mt-1">Versioning &amp; Publishing Codes</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Manage product codes, rate snapshots, tariff timelines, and Maker-Checker deployment gates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-zinc-100 rounded-lg p-1 border border-zinc-200 text-xs">
              <span className="px-2.5 py-1 font-medium text-zinc-600">Active Versions:</span>
              <span className="px-2 py-0.5 rounded bg-white text-zinc-900 font-semibold shadow-xs">
                {versions.filter((v) => v.status === "ACTIVE").length}
              </span>
              <span className="px-2.5 py-1 font-medium text-amber-700 ml-1">Draft Staged:</span>
              <span className="px-2 py-0.5 rounded bg-white text-amber-800 font-semibold shadow-xs">
                {versions.filter((v) => v.status === "DRAFT").length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          Main Content Container
         ========================================================================= */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        {/* Banner Alert for Action Notifications */}
        {actionSuccessMsg && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-xs font-medium text-emerald-900">{actionSuccessMsg}</span>
            </div>
            <button
              onClick={() => setActionSuccessMsg(null)}
              className="text-xs text-emerald-600 hover:text-emerald-800 font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search by Product Code, Package Name, or Version (e.g. VIRIYAH, v2.1)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* Select Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-zinc-500">LOB:</label>
                <select
                  value={selectedLob}
                  onChange={(e) => setSelectedLob(e.target.value)}
                  className="text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-700 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
                >
                  <option value="ALL">All Categories</option>
                  <option value="MOTOR">Motor &amp; CMI</option>
                  <option value="HEALTH">Health</option>
                  <option value="TRAVEL">Travel</option>
                  <option value="FIRE">Fire &amp; Property</option>
                  <option value="PA">Personal Accident</option>
                  <option value="LIFE">Life Insurance</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-zinc-500">Lifecycle:</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-700 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active (Live in Sales)</option>
                  <option value="DRAFT">Draft (Staged)</option>
                  <option value="SCHEDULED">Scheduled (Future)</option>
                  <option value="ARCHIVED">Archived (Locked)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Master Data Table */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
          <div className="px-6 py-3.5 border-b border-zinc-200 bg-zinc-50/70 flex items-center justify-between">
            <h2 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
              Snapshot Catalog Records ({filteredVersions.length})
            </h2>
            <span className="text-xs text-zinc-500">Double-Entry audit logging enabled for all mutations</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-100/60 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Product Code &amp; Title</th>
                  <th className="py-3 px-4">Line of Business</th>
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Commission</th>
                  <th className="py-3 px-4">Effective Window</th>
                  <th className="py-3 px-4 text-right">Governance Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-xs font-normal">
                {filteredVersions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-600">
                      No product catalog versions found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredVersions.map((item) => {
                    const isDraft = item.status === "DRAFT";
                    const isActive = item.status === "ACTIVE";
                    const parentActive = versions.find((v) => v.productId === item.productId && v.status === "ACTIVE");

                    return (
                      <tr key={item.versionId} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-zinc-900">
                          <div className="font-semibold text-zinc-900">{item.name}</div>
                          <div className="font-mono text-[11px] text-zinc-500 mt-0.5">{item.productCode}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                            {item.lobCode}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                            {item.versionNumber}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {item.status === "ACTIVE" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              ACTIVE
                            </span>
                          )}
                          {item.status === "DRAFT" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              DRAFT
                            </span>
                          )}
                          {item.status === "SCHEDULED" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              SCHEDULED
                            </span>
                          )}
                          {item.status === "ARCHIVED" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-500 border border-zinc-200">
                              ARCHIVED
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-medium text-zinc-800">
                          {item.baseInsurerCommissionPercent.toFixed(2)}%
                        </td>

                        <td className="py-3.5 px-4 text-zinc-600">
                          <div>
                            <span className="text-zinc-600">From: </span>
                            {new Date(item.effectiveStartDate).toLocaleDateString()}
                          </div>
                          <div className="text-[11px] text-zinc-600">
                            <span className="text-zinc-600">Until: </span>
                            {item.effectiveEndDate
                              ? new Date(item.effectiveEndDate).toLocaleDateString()
                              : "Open (Indefinite)"}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Inspect Changes / Diff Button */}
                            <button
                              onClick={() =>
                                setActiveDiffModal({
                                  draft: item,
                                  active: isActive ? null : parentActive || null,
                                })
                              }
                              className="px-2.5 py-1 text-[11px] font-medium text-zinc-700 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 shadow-xs transition-colors"
                            >
                              Diff View
                            </button>

                            {/* Clone New Version (Only for Active versions) */}
                            {isActive && (
                              <button
                                onClick={() => handleCloneNewDraft(item)}
                                className="px-2.5 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors shadow-xs"
                                title="Executes Copy-on-Write fork into a draft version"
                              >
                                Clone Draft
                              </button>
                            )}

                            {/* Submit for Approval (Only for Drafts) */}
                            {isDraft && (
                              <button
                                onClick={() => setPublishingModalDraft(item)}
                                className="px-3 py-1 text-[11px] font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-xs transition-colors flex items-center gap-1"
                              >
                                <span>Publish</span>
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                                  />
                                </svg>
                              </button>
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

        {/* Informational Governance Footer Card */}
        <div className="mt-8 bg-blue-50/60 rounded-xl border border-blue-200/80 p-5">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-700 shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wide">
                Strict Segregation of Duties (Maker-Checker Directive)
              </h3>
              <p className="text-xs text-blue-900/80 mt-1 leading-relaxed">
                Publishing any modified code, commission rate, or tariff creates a record in the{" "}
                <code className="font-mono bg-blue-100/70 px-1 py-0.5 rounded text-blue-900">approval_requests</code>{" "}
                staging ledger. The user UUID initiating the draft publication cannot execute the final checker
                verification. Active product versions remain immutable under OIC Thailand auditing guidelines (SCD Type
                2).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          Diff Viewer Modal (Side-by-Side: Active vs. Draft)
         ========================================================================= */}
      {activeDiffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Configuration Diff Viewer (Snapshot Comparison)</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Inspecting differences for {activeDiffModal.draft.productCode}
                </p>
              </div>
              <button
                onClick={() => setActiveDiffModal(null)}
                className="p-1.5 text-zinc-600 hover:text-zinc-700 rounded-lg hover:bg-zinc-200/50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-zinc-100 rounded-lg border border-zinc-200">
                  <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Left Panel: Baseline (Active Version)
                  </span>
                  <div className="text-xs font-semibold text-zinc-800 mt-1">
                    {activeDiffModal.active
                      ? `${activeDiffModal.active.versionNumber} (${activeDiffModal.active.status})`
                      : "None (Initial Release)"}
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
                    Right Panel: Staged Version (Target)
                  </span>
                  <div className="text-xs font-semibold text-blue-900 mt-1">
                    {activeDiffModal.draft.versionNumber} ({activeDiffModal.draft.status})
                  </div>
                </div>
              </div>

              {/* Diff Fields List */}
              <div className="border border-zinc-200 rounded-lg overflow-hidden divide-y divide-zinc-200">
                {getDiffBreakdown(activeDiffModal.draft, activeDiffModal.active).map((diff) => (
                  <div
                    key={diff.key}
                    className={`p-3 text-xs flex items-center justify-between ${
                      diff.isModified ? "bg-amber-50/40" : "bg-white"
                    }`}
                  >
                    <div className="w-1/3">
                      <span className="font-semibold text-zinc-700">{diff.label}</span>
                      <span className="block font-mono text-[10px] text-zinc-600">{diff.key}</span>
                    </div>

                    <div className="w-1/3 pr-2 font-mono text-zinc-600">
                      <span className={diff.isModified ? "bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded" : ""}>
                        {String(diff.oldVal)}
                      </span>
                    </div>

                    <div className="w-1/3 pl-2 font-mono text-zinc-900 font-medium">
                      <span
                        className={
                          diff.isModified ? "bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold" : ""
                        }
                      >
                        {String(diff.newVal)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {activeDiffModal.draft.changeSummary && (
                <div className="mt-4 p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-xs">
                  <span className="font-semibold text-zinc-700">Release Notes / Justification:</span>
                  <p className="text-zinc-600 mt-0.5">{activeDiffModal.draft.changeSummary}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-3.5 border-t border-zinc-200 bg-zinc-50 flex items-center justify-end">
              <button
                onClick={() => setActiveDiffModal(null)}
                className="px-4 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 shadow-xs"
              >
                Close Diff Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          Publishing Staging Modal (Maker-Checker Gatekeeper Modal)
         ========================================================================= */}
      {publishingModalDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">
                  Publish Version: {publishingModalDraft.versionNumber}
                </h3>
                <p className="text-xs text-zinc-500">{publishingModalDraft.productCode}</p>
              </div>
              <button
                onClick={() => setPublishingModalDraft(null)}
                className="p-1.5 text-zinc-600 hover:text-zinc-700 rounded-lg hover:bg-zinc-200/50"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-zinc-800 block mb-1">1. Select Effective Deployment Mode</label>
                <div className="grid grid-cols-2 gap-3 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setPublishMode("IMMEDIATE")}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      publishMode === "IMMEDIATE"
                        ? "bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 text-blue-900"
                        : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    <div className="font-bold">Case A: Immediate</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      Swaps ACTIVE timeline instantly upon checker signoff
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPublishMode("SCHEDULED")}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      publishMode === "SCHEDULED"
                        ? "bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 text-blue-900"
                        : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    <div className="font-bold">Case B: Scheduled</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">Nightly batch job flips state on target date</div>
                  </button>
                </div>
              </div>

              {publishMode === "SCHEDULED" && (
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">
                    Effective Target Date (OIC Filing Window)
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full text-xs p-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-zinc-900"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-zinc-800 block mb-1">
                  2. Actuarial / Operational Justification (Audit Trail)
                </label>
                <textarea
                  rows={3}
                  placeholder="Detail the justification for altering tariffs, commissions, or payment settings..."
                  value={submissionComments}
                  onChange={(e) => setSubmissionComments(e.target.value)}
                  className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-zinc-900 placeholder-zinc-600"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <strong>Attention:</strong> This request will be routed to{" "}
                <code className="font-mono bg-amber-100 px-1 rounded">approval_requests</code>. In accordance with
                Segregation of Duties (BRD 7.9), you will not be able to approve your own submission.
              </div>
            </div>

            <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPublishingModalDraft(null)}
                className="px-4 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPublishingRequest}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-xs"
              >
                Submit to Checker Inbox
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VersioningPublishingPage;
