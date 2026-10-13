import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Database,
  Download,
  Eye,
  EyeOff,
  FileText,
  Filter,
  Lock,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import React, { useMemo, useState } from "react";

// ============================================================================
// Types & Schema Alignment (BRD Section 7.7 & SDD Section 5.16)
// ============================================================================

export type RegulatoryReportType = "POR_LOR_1" | "TRD_50_TAWI" | "BROKER_PAYABLE";
export type ReportStatus = "PROCESSING" | "GENERATED" | "FAILED";
export type LobCategory = "ALL" | "MOTOR" | "HEALTH" | "FIRE" | "TRAVEL" | "PA";

export interface OicFlattenedRecord {
  policy_id: string;
  policy_number: string;
  encrypted_national_id: string; // Stored AES-256 encrypted at rest
  masked_id_card: string; // E.g., "1-1004-XXXXX-88-9" for PDPA UI display
  stripped_id_card: string; // Regex stripped of dashes for OIC flat export
  customer_full_name: string;
  lob_code: LobCategory;
  oic_vehicle_type_code?: string; // E.g., 1.10 Sedan, 1.20 Pickup
  sum_insured: number;
  net_premium: number;
  stamp_duty: number; // 0.4% stamp duty
  vat_amount: number; // 7.0% VAT
  gross_premium: number; // Net + Stamp + VAT
  buddhist_effective_date: string; // DD/MM/2569 (BE conversion: CE + 543)
  validation_status: "VALID" | "WARNING";
}

export interface ComplianceReportJob {
  report_id: string;
  report_type: RegulatoryReportType;
  target_month: string; // YYYY-MM
  target_buddhist_year: number; // E.g., 2569
  requested_by_name: string;
  s3_encrypted_url?: string;
  status: ReportStatus;
  record_count: number;
  total_gross_premium: number;
  created_at: string;
  pgp_fingerprint: string;
}

// ============================================================================
// Mock Data (Derived from PostgreSQL Materialized View `oic_por_lor_1_mview`)
// ============================================================================

const MOCK_FLATTENED_ROWS: OicFlattenedRecord[] = [
  {
    policy_id: "POL-2026-0001",
    policy_number: "VIR-26-990812",
    encrypted_national_id: "enc_ae29b41...",
    masked_id_card: "1-1004-XXXXX-12-3",
    stripped_id_card: "1100499823123",
    customer_full_name: "สมชาย สุขเกษม",
    lob_code: "MOTOR",
    oic_vehicle_type_code: "1.10",
    sum_insured: 650000.0,
    net_premium: 16000.0,
    stamp_duty: 64.0, // 16000 * 0.004
    vat_amount: 1124.48, // (16000 + 64) * 0.07
    gross_premium: 17188.48,
    buddhist_effective_date: "04/06/2569",
    validation_status: "VALID",
  },
  {
    policy_id: "POL-2026-0002",
    policy_number: "BKI-26-118492",
    encrypted_national_id: "enc_f7a81c2...",
    masked_id_card: "3-1020-XXXXX-45-1",
    stripped_id_card: "3102058493451",
    customer_full_name: "กานดา วงศ์สุวรรณ",
    lob_code: "HEALTH",
    sum_insured: 1500000.0,
    net_premium: 24500.0,
    stamp_duty: 98.0,
    vat_amount: 1721.86,
    gross_premium: 26319.86,
    buddhist_effective_date: "10/06/2569",
    validation_status: "VALID",
  },
  {
    policy_id: "POL-2026-0003",
    policy_number: "MTI-26-440219",
    encrypted_national_id: "enc_b4991aa...",
    masked_id_card: "1-4501-XXXXX-99-0",
    stripped_id_card: "1450183921990",
    customer_full_name: "ชาญชัย ประเสริฐสุข",
    lob_code: "MOTOR",
    oic_vehicle_type_code: "1.20",
    sum_insured: 420000.0,
    net_premium: 12200.0,
    stamp_duty: 48.8,
    vat_amount: 857.42,
    gross_premium: 13106.22,
    buddhist_effective_date: "14/06/2569",
    validation_status: "VALID",
  },
  {
    policy_id: "POL-2026-0004",
    policy_number: "MSIG-26-88310",
    encrypted_national_id: "enc_839da4e...",
    masked_id_card: "5-1002-XXXXX-71-4",
    stripped_id_card: "5100299482714",
    customer_full_name: "แพรวา รัตนโกสินทร์",
    lob_code: "TRAVEL",
    sum_insured: 2000000.0,
    net_premium: 1850.0,
    stamp_duty: 7.4,
    vat_amount: 130.02,
    gross_premium: 1987.42,
    buddhist_effective_date: "18/06/2569",
    validation_status: "VALID",
  },
  {
    policy_id: "POL-2026-0005",
    policy_number: "AIA-26-559102",
    encrypted_national_id: "enc_9cba320...",
    masked_id_card: "1-1008-XXXXX-33-8",
    stripped_id_card: "1100877621338",
    customer_full_name: "ธีรเดช เจริญผล",
    lob_code: "FIRE",
    sum_insured: 3500000.0,
    net_premium: 8900.0,
    stamp_duty: 35.6,
    vat_amount: 625.49,
    gross_premium: 9561.09,
    buddhist_effective_date: "22/06/2569",
    validation_status: "VALID",
  },
];

const INITIAL_JOBS: ComplianceReportJob[] = [
  {
    report_id: "REP-OIC-202606-001",
    report_type: "POR_LOR_1",
    target_month: "2026-06",
    target_buddhist_year: 2569,
    requested_by_name: "Pakornsak S. (Compliance)",
    s3_encrypted_url: "s3://pas-compliance-vault/oic/2026-06/por_lor_1_256906.csv.pgp",
    status: "GENERATED",
    record_count: 1482,
    total_gross_premium: 24890120.45,
    created_at: "2026-07-01 02:15:30",
    pgp_fingerprint: "4A2F 9E81 B230 D4E1 90A3",
  },
  {
    report_id: "REP-TRD-202605-004",
    report_type: "TRD_50_TAWI",
    target_month: "2026-05",
    target_buddhist_year: 2569,
    requested_by_name: "Somying R. (Finance)",
    s3_encrypted_url: "s3://pas-compliance-vault/trd/2026-05/50_tawi_batch_final.csv.pgp",
    status: "GENERATED",
    record_count: 215,
    total_gross_premium: 1420550.0,
    created_at: "2026-06-05 18:40:12",
    pgp_fingerprint: "7C11 88FA 90B2 3381 FF12",
  },
  {
    report_id: "REP-OIC-202605-002",
    report_type: "POR_LOR_1",
    target_month: "2026-05",
    target_buddhist_year: 2569,
    requested_by_name: "Pakornsak S. (Compliance)",
    s3_encrypted_url: "s3://pas-compliance-vault/oic/2026-05/por_lor_1_256905.csv.pgp",
    status: "GENERATED",
    record_count: 1390,
    total_gross_premium: 22105430.12,
    created_at: "2026-06-01 02:12:00",
    pgp_fingerprint: "3B98 12EA F409 11A8 87C4",
  },
];

// ============================================================================
// Main Page Component
// ============================================================================

export const OicRegulatoryReportingPage: React.FC = () => {
  // Navigation & View States
  const [activeTab, setActiveTab] = useState<"POR_LOR_1" | "VAULT_HISTORY" | "50_TAWI">("POR_LOR_1");
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-06");
  const [selectedLob, setSelectedLob] = useState<LobCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // PDPA Masking State (Principle of Least Privilege)
  const [isPiiRevealed, setIsPiiRevealed] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [reportsQueue, setReportsQueue] = useState<ComplianceReportJob[]>(INITIAL_JOBS);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  // Compute Buddhist Era details
  const buddhistYear = useMemo(() => {
    const year = parseInt(selectedMonth.split("-")[0], 10);
    return isNaN(year) ? 2569 : year + 543;
  }, [selectedMonth]);

  // Filtered dataset for preview grid
  const filteredRecords = useMemo(() => {
    return MOCK_FLATTENED_ROWS.filter((row) => {
      const matchLob = selectedLob === "ALL" || row.lob_code === selectedLob;
      const matchSearch =
        row.policy_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.customer_full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.stripped_id_card.includes(searchQuery);
      return matchLob && matchSearch;
    });
  }, [selectedLob, searchQuery]);

  // Aggregate stats for KPI cards
  const stats = useMemo(() => {
    const totalRecords = filteredRecords.length;
    const netSum = filteredRecords.reduce((acc, r) => acc + r.net_premium, 0);
    const stampSum = filteredRecords.reduce((acc, r) => acc + r.stamp_duty, 0);
    const vatSum = filteredRecords.reduce((acc, r) => acc + r.vat_amount, 0);
    const grossSum = filteredRecords.reduce((acc, r) => acc + r.gross_premium, 0);
    return { totalRecords, netSum, stampSum, vatSum, grossSum };
  }, [filteredRecords]);

  // Handle Async Trigger of Report Generation (POST /admin/reports/generate)
  const handleTriggerAsyncGeneration = () => {
    setIsGenerating(true);

    setTimeout(() => {
      const newJobId = `REP-OIC-${selectedMonth.replace("-", "")}-${Math.floor(100 + Math.random() * 900)}`;
      const newJob: ComplianceReportJob = {
        report_id: newJobId,
        report_type: "POR_LOR_1",
        target_month: selectedMonth,
        target_buddhist_year: buddhistYear,
        requested_by_name: "Compliance Officer (Current Session)",
        s3_encrypted_url: `s3://pas-compliance-vault/oic/${selectedMonth}/por_lor_1_${buddhistYear}${selectedMonth.split("-")[1]}.csv.pgp`,
        status: "GENERATED",
        record_count: filteredRecords.length,
        total_gross_premium: stats.grossSum,
        created_at: new Date().toISOString().replace("T", " ").substring(0, 19),
        pgp_fingerprint: "9E41 BC22 109F 55A3 DD81",
      };

      setReportsQueue((prev) => [newJob, ...prev]);
      setIsGenerating(false);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 5000);
    }, 1400);
  };

  return (
    // Note: Root container has NO TOP PADDING ("pt-0") as requested
    <div className="w-full pt-0 space-y-6 text-zinc-900">
      {/* ==================================================================== */}
      {/* 1. Header Banner & Statutory Sub-header */}
      {/* ==================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-zinc-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">OIC Regulatory Reporting</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              คปภ. Compliant
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Mandatory Flat-File Exporter for Office of Insurance Commission Thailand (Por.Lor. 1 / ผ.ล. 1) & TRD 50 Tawi
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsPiiRevealed(!isPiiRevealed)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              isPiiRevealed
                ? "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
                : "bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50"
            }`}
            title="Toggles National ID Masking with Audit Trail"
          >
            {isPiiRevealed ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                Mask PDPA PII
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-zinc-500" />
                Audit Unmask PII
              </>
            )}
          </button>

          <button
            onClick={handleTriggerAsyncGeneration}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors shadow-sm"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-300" />
                Dispatching Pub/Sub Job...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Generate Flat File (ผ.ล. 1)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {showSuccessToast && (
        <div className="flex items-center justify-between p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Async Compilation Initiated:</strong> Worker queried Read-Replica materialized view, stripped
              dashes, applied PGP encryption, and uploaded output to S3 vault.
            </span>
          </div>
          <button
            onClick={() => setActiveTab("VAULT_HISTORY")}
            className="font-semibold underline text-emerald-800 hover:text-emerald-950 ml-4 shrink-0"
          >
            View in Vault
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. Statutory Metric Cards (KPI Dashboard) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="p-4 rounded-lg bg-white border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span>Reporting Period (B.E.)</span>
            <Calendar className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-zinc-900">{selectedMonth}</span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              พ.ศ. {buddhistYear}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Converted (+543 yrs) for OIC Gateway</p>
        </div>

        {/* KPI 2 */}
        <div className="p-4 rounded-lg bg-white border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span>Flattened Contract Volume</span>
            <FileText className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="mt-2 text-xl font-bold text-zinc-900">{stats.totalRecords.toLocaleString()} Policies</div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Aggregated via <code className="font-mono text-zinc-700">oic_por_lor_1_mview</code>
          </p>
        </div>

        {/* KPI 3 */}
        <div className="p-4 rounded-lg bg-white border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span>Statutory Tax Breakdown</span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase">Stamp 0.4% | VAT 7%</span>
          </div>
          <div className="mt-2 text-xl font-bold text-zinc-900">
            ฿
            {(stats.stampSum + stats.vatSum).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-1">
            <span>Stamp: ฿{stats.stampSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <span>VAT: ฿{stats.vatSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-4 rounded-lg bg-white border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span>Total Gross Premium</span>
            <Lock className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="mt-2 text-xl font-bold text-zinc-900">
            ฿{stats.grossSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> PGP 4096-bit Public Encrypted
          </p>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. Navigation Tabs */}
      {/* ==================================================================== */}
      <div className="border-b border-zinc-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab("POR_LOR_1")}
            className={`pb-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "POR_LOR_1"
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Por.Lor. 1 Flattened Grid (ผ.ล. 1)
          </button>

          <button
            onClick={() => setActiveTab("VAULT_HISTORY")}
            className={`pb-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "VAULT_HISTORY"
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Encrypted Vault Archive & DLQ ({reportsQueue.length})
          </button>

          <button
            onClick={() => setActiveTab("50_TAWI")}
            className={`pb-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "50_TAWI"
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            50 Tawi (50 ทวิ) Withholding Tax Engine
          </button>
        </nav>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: POR.LOR. 1 (ผ.ล. 1) REAL-TIME DATA GRID */}
      {/* ==================================================================== */}
      {activeTab === "POR_LOR_1" && (
        <div className="space-y-4">
          {/* Controls Bar: Filters & Search */}
          <div className="p-3.5 rounded-lg bg-white border border-zinc-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Target Month Picker */}
              <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-300 rounded-md px-2.5 py-1 text-xs">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-zinc-500 font-medium">Month:</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-zinc-900 font-medium focus:outline-none cursor-pointer"
                />
              </div>

              {/* LOB Selector */}
              <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-300 rounded-md px-2.5 py-1 text-xs">
                <Filter className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-zinc-500 font-medium">LOB:</span>
                <select
                  value={selectedLob}
                  onChange={(e) => setSelectedLob(e.target.value as LobCategory)}
                  className="bg-transparent text-zinc-900 font-medium focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Lines of Business</option>
                  <option value="MOTOR">Motor (รถยนต์ 1.10 / 1.20)</option>
                  <option value="HEALTH">Health (สุขภาพ)</option>
                  <option value="FIRE">Fire & Property (อัคคีภัย)</option>
                  <option value="TRAVEL">Travel (การเดินทาง)</option>
                </select>
              </div>
            </div>

            {/* Keyword Search */}
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Policy #, Name, or Tax ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-300 text-xs rounded-md pl-8 pr-3 py-1.5 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
          </div>

          {/* Architecture Decoupling Note */}
          <div className="px-3 py-2 rounded-md bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-600 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span>
                <strong>Read-Replica Engine Active:</strong> Query sourced from replica node view{" "}
                <code className="text-zinc-800 font-mono">oic_por_lor_1_mview</code> to maintain &lt;500ms checkout
                latency on master DB.
              </span>
            </span>
            <span className="text-zinc-400 hidden sm:inline">Refreshed 02:00:00 UTC</span>
          </div>

          {/* Main Flat Data Table */}
          <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">Effective (B.E.)</th>
                    <th className="py-2.5 px-3">Policy Number</th>
                    <th className="py-2.5 px-3">Insured Full Name</th>
                    <th className="py-2.5 px-3">Citizen ID (Tax ID)</th>
                    <th className="py-2.5 px-3">LOB / Code</th>
                    <th className="py-2.5 px-3 text-right">Sum Insured</th>
                    <th className="py-2.5 px-3 text-right">Net Premium</th>
                    <th className="py-2.5 px-3 text-right">Stamp Duty (0.4%)</th>
                    <th className="py-2.5 px-3 text-right">VAT (7%)</th>
                    <th className="py-2.5 px-3 text-right">Gross Premium</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/70 font-mono text-[11px]">
                  {filteredRecords.map((row) => (
                    <tr key={row.policy_id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-zinc-900">{row.buddhist_effective_date}</td>
                      <td className="py-2.5 px-3 font-semibold text-zinc-900">{row.policy_number}</td>
                      <td className="py-2.5 px-3 font-sans text-zinc-800">{row.customer_full_name}</td>
                      <td className="py-2.5 px-3">
                        {isPiiRevealed ? (
                          <span className="text-amber-800 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">
                            {row.stripped_id_card}
                          </span>
                        ) : (
                          <span className="text-zinc-500 font-sans">{row.masked_id_card}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-800">
                          {row.lob_code}
                          {row.oic_vehicle_type_code && ` (${row.oic_vehicle_type_code})`}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-zinc-700">
                        ฿{row.sum_insured.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right text-zinc-800">
                        ฿{row.net_premium.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right text-zinc-500">
                        ฿{row.stamp_duty.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right text-zinc-500">
                        ฿{row.vat_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-zinc-900">
                        ฿{row.gross_premium.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Passed
                        </span>
                      </td>
                    </tr>
                  ))}

                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-zinc-400 font-sans">
                        No policy records found for current criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
                {/* Summary Row */}
                {filteredRecords.length > 0 && (
                  <tfoot>
                    <tr className="bg-zinc-50 border-t-2 border-zinc-300 font-semibold text-zinc-900 text-xs">
                      <td colSpan={6} className="py-2.5 px-3 font-sans">
                        Batch Summary ({filteredRecords.length} records)
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        ฿{stats.netSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        ฿{stats.stampSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        ฿{stats.vatSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                        ฿{stats.grossSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: ENCRYPTED VAULT ARCHIVE & AUDIT LOGS */}
      {/* ==================================================================== */}
      {activeTab === "VAULT_HISTORY" && (
        <div className="space-y-4">
          <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900 mb-1">
              Statutory Storage Vault (AWS S3 & PGP Public Encrypted)
            </h2>
            <p className="text-xs text-zinc-500 mb-4">
              All compliance flat-files are retained for a minimum of 10 years per OIC & Thai Revenue Department
              regulations.
            </p>

            <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-md overflow-hidden">
              {reportsQueue.map((job) => (
                <div
                  key={job.report_id}
                  className="p-3.5 bg-white hover:bg-zinc-50 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-zinc-900">{job.report_id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                        {job.report_type}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        พ.ศ. {job.target_buddhist_year}
                      </span>
                    </div>
                    <div className="text-zinc-500 text-[11px] font-mono">S3: {job.s3_encrypted_url}</div>
                    <div className="text-zinc-400 text-[11px] flex items-center gap-3">
                      <span>Records: {job.record_count.toLocaleString()}</span>
                      <span>Total: ฿{job.total_gross_premium.toLocaleString()}</span>
                      <span>Requested by: {job.requested_by_name}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="text-[11px] font-mono text-zinc-500">PGP: {job.pgp_fingerprint}</div>
                      <div className="text-[10px] text-zinc-400">{job.created_at}</div>
                    </div>
                    <button
                      onClick={() => alert(`Pre-signed S3 download generated for ${job.s3_encrypted_url}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 font-medium text-xs shadow-sm transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-zinc-500" />
                      Download .pgp
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: 50 TAWI (50 ทวิ) WITHHOLDING TAX ENGINE */}
      {/* ==================================================================== */}
      {activeTab === "50_TAWI" && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-white border border-zinc-200 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900">
                  Section 50 Tawi (หนังสือรับรองการหักภาษี ณ ที่จ่าย)
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Thai Revenue Code compliance for agent broker commissions. The system automatically calculates 3%
                  Withholding Tax (WHT) and generates both individual PDFs and consolidation CSVs.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                WHT Rate: 3.00%
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3.5 rounded border border-zinc-200 bg-zinc-50/50">
                <span className="text-xs text-zinc-500">Scheduled Tax Batch</span>
                <div className="text-base font-bold text-zinc-900 mt-1">Monthly Cycle (End of Month)</div>
                <p className="text-[11px] text-zinc-500 mt-1">Next lock: 30 June 2026</p>
              </div>

              <div className="p-3.5 rounded border border-zinc-200 bg-zinc-50/50">
                <span className="text-xs text-zinc-500">Agent Commission Pool</span>
                <div className="text-base font-bold text-zinc-900 mt-1">฿4,280,100.00</div>
                <p className="text-[11px] text-zinc-500 mt-1">Across 342 active sub-brokers</p>
              </div>

              <div className="p-3.5 rounded border border-zinc-200 bg-zinc-50/50">
                <span className="text-xs text-zinc-500">3% WHT Deducted (Remittance to TRD)</span>
                <div className="text-base font-bold text-emerald-700 mt-1">฿128,403.00</div>
                <p className="text-[11px] text-zinc-500 mt-1">Ready for P.N.D. 53 upload</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                onClick={() => alert("Exporting Revenue Department Consolidated CSV for P.N.D. 53...")}
                className="px-3 py-1.5 text-xs font-semibold rounded-md border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
              >
                Export TRD Batch CSV
              </button>
              <button
                onClick={() => alert("Batch PDF Generation Triggered in background workers...")}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-md bg-zinc-900 text-white hover:bg-zinc-800"
              >
                Batch Generate 50 Tawi Certificates (PDF)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. Statutory Regulations & Legal Footnote */}
      {/* ==================================================================== */}
      <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/60 text-[11px] text-zinc-500 space-y-1">
        <div className="flex items-center gap-1.5 font-semibold text-zinc-700">
          <AlertCircle className="w-3.5 h-3.5 text-zinc-600" />
          <span>Statutory Data Governance & Legal Mandate (คปภ. / OIC Thailand)</span>
        </div>
        <p>
          Reports compiled in this module are generated under Section 7.7 of the Broker Specification. Flat-file outputs
          conform strictly to the OIC standard table mapping (stripping dash separators from citizen IDs, calculating
          exact 0.4% stamp duties and 7% VAT, and formatting dates into the Buddhist Era calendar). PII decrypt routines
          are logged permanently to the immutable <code className="font-mono text-zinc-700">audit_logs</code> table
          under Thai PDPA mandates.
        </p>
      </div>
    </div>
  );
};

export default OicRegulatoryReportingPage;
