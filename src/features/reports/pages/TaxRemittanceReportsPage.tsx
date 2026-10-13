import React, { useMemo, useState } from "react";

// ============================================================================
// Types & Domain Models (Derived from PAS Regulatory & Finance Modules)
// ============================================================================

export type ReportType =
  | "OIC_POR_LOR_1"
  | "TRD_50_TAWI"
  | "BROKER_PAYABLE"
  | "COMMISSION_RECEIVABLE"
  | "TAX_INVOICE_REGISTER";

export type ReportStatus = "PROCESSING" | "GENERATED" | "FAILED";

export type SettlementMode = "NET" | "GROSS";

export interface ComplianceReportJob {
  report_id: string;
  report_type: ReportType;
  title: string;
  target_period: string; // e.g. "2026-10"
  requested_by_name: string;
  status: ReportStatus;
  output_format: "CSV" | "EXCEL" | "PDF" | "PGP_ZIP";
  s3_encrypted_url?: string;
  created_at: string;
  file_size?: string;
  record_count: number;
}

export interface PorLor1Row {
  policy_number: string;
  customer_full_name: string;
  national_id_masked: string;
  national_id_unmasked: string;
  product_type: "MOTOR" | "HEALTH" | "TRAVEL" | "PA";
  sum_insured: number;
  net_premium: number;
  stamp_duty: number; // 0.4%
  vat_amount: number; // 7.0%
  gross_premium: number;
  buddhist_effective_date: string; // DD/MM/2569 (BE conversion)
}

export interface FiftyTawiRow {
  agent_code: string;
  agent_name: string;
  tax_id: string;
  commission_tier: string;
  total_gross_payout: number;
  wht_rate: number; // 3.0%
  wht_deducted: number;
  net_payout: number;
  policy_count: number;
  status: "PENDING" | "CERT_ISSUED" | "FILED_TRD";
}

export interface RemittanceBordereauRow {
  insurer_id: string;
  insurer_name: string;
  settlement_mode: SettlementMode;
  monthly_pay_date: number; // e.g., 15th
  total_policies: number;
  collected_gross_premium: number;
  retained_commission: number;
  vat_on_commission: number; // 7%
  wht_receivable: number; // 3%
  net_payable_to_insurer: number;
  settlement_status: "DRAFT" | "PENDING_APPROVAL" | "SETTLED";
}

// ============================================================================
// Mock Data (Thai Insurance Domain Context: Oct 2026 / 2569 BE)
// ============================================================================

const INITIAL_REPORT_JOBS: ComplianceReportJob[] = [
  {
    report_id: "rep-8821-porlor1",
    report_type: "OIC_POR_LOR_1",
    title: "OIC Por.Lor. 1 Regulatory Flattened Sales (ผ.ล. 1)",
    target_period: "2026-09",
    requested_by_name: "Compliance Officer (K. Anan)",
    status: "GENERATED",
    output_format: "PGP_ZIP",
    s3_encrypted_url: "s3://pas-compliance-vault/2026/09/por_lor_1_2569_09_enc.pgp",
    created_at: "2026-10-01 02:30:15",
    file_size: "4.8 MB",
    record_count: 1420,
  },
  {
    report_id: "rep-8822-50tawi",
    report_type: "TRD_50_TAWI",
    title: "TRD Withholding Tax 3% Agent Certificates (50 ทวิ)",
    target_period: "2026-09",
    requested_by_name: "Finance Admin (K. Nattaporn)",
    status: "GENERATED",
    output_format: "PDF",
    s3_encrypted_url: "s3://pas-compliance-vault/2026/09/wht_50_tawi_batch_all.pdf",
    created_at: "2026-10-02 08:15:40",
    file_size: "12.4 MB",
    record_count: 185,
  },
  {
    report_id: "rep-8823-remittance",
    report_type: "BROKER_PAYABLE",
    title: "End-of-Month Carrier Remittance Bordereau (SOA)",
    target_period: "2026-09",
    requested_by_name: "Finance Admin (K. Nattaporn)",
    status: "GENERATED",
    output_format: "EXCEL",
    s3_encrypted_url: "s3://pas-compliance-vault/2026/09/insurer_bordereau_sep2026.xlsx",
    created_at: "2026-10-02 09:45:11",
    file_size: "1.2 MB",
    record_count: 94,
  },
  {
    report_id: "rep-8824-porlor1-cur",
    report_type: "OIC_POR_LOR_1",
    title: "OIC Por.Lor. 1 Mid-Month Audit Sample",
    target_period: "2026-10",
    requested_by_name: "Auditor (K. Somchai)",
    status: "PROCESSING",
    output_format: "CSV",
    created_at: "2026-10-13 14:10:00",
    record_count: 618,
  },
];

const MOCK_POR_LOR_1: PorLor1Row[] = [
  {
    policy_number: "VIRIYAH-MT-2569-0091",
    customer_full_name: "นายสมชาย วัฒนพาณิชย์",
    national_id_masked: "1-1004-XXXX-88-9",
    national_id_unmasked: "1100401828892",
    product_type: "MOTOR",
    sum_insured: 650000,
    net_premium: 16500.0,
    stamp_duty: 66.0,
    vat_amount: 1159.62,
    gross_premium: 17725.62,
    buddhist_effective_date: "04/10/2569",
  },
  {
    policy_number: "DHIP-HL-2569-0142",
    customer_full_name: "นางสาวกานดา เลิศรัตนชัย",
    national_id_masked: "3-1020-XXXX-12-4",
    national_id_unmasked: "3102000541249",
    product_type: "HEALTH",
    sum_insured: 1500000,
    net_premium: 24000.0,
    stamp_duty: 96.0,
    vat_amount: 1686.72,
    gross_premium: 25782.72,
    buddhist_effective_date: "08/10/2569",
  },
  {
    policy_number: "BKI-TRV-2569-8812",
    customer_full_name: "นายพงษ์ศักดิ์ เจริญสุข",
    national_id_masked: "1-1017-XXXX-45-1",
    national_id_unmasked: "1101700944510",
    product_type: "TRAVEL",
    sum_insured: 2000000,
    net_premium: 1200.0,
    stamp_duty: 4.8,
    vat_amount: 84.34,
    gross_premium: 1289.14,
    buddhist_effective_date: "10/10/2569",
  },
  {
    policy_number: "MTI-PA-2569-3401",
    customer_full_name: "นายเกียรติศักดิ์ ศรีวิชัย",
    national_id_masked: "5-5099-XXXX-33-8",
    national_id_unmasked: "5509900333381",
    product_type: "PA",
    sum_insured: 500000,
    net_premium: 3200.0,
    stamp_duty: 12.8,
    vat_amount: 224.9,
    gross_premium: 3437.7,
    buddhist_effective_date: "12/10/2569",
  },
];

const MOCK_50_TAWI: FiftyTawiRow[] = [
  {
    agent_code: "AGT-9918",
    agent_name: "นายธนกร รัตนวงศ์โสภณ",
    tax_id: "0105558012398",
    commission_tier: "PLATINUM (18%)",
    total_gross_payout: 48500.0,
    wht_rate: 3.0,
    wht_deducted: 1455.0,
    net_payout: 47045.0,
    policy_count: 24,
    status: "CERT_ISSUED",
  },
  {
    agent_code: "AGT-8402",
    agent_name: "นางวิไลพร พานิชภักดี",
    tax_id: "3100500918231",
    commission_tier: "GOLD (15%)",
    total_gross_payout: 31200.0,
    wht_rate: 3.0,
    wht_deducted: 936.0,
    net_payout: 30264.0,
    policy_count: 17,
    status: "CERT_ISSUED",
  },
  {
    agent_code: "AGT-6621",
    agent_name: "นายชวลิต ปัญญาวงศ์",
    tax_id: "1100200877124",
    commission_tier: "SILVER (12%)",
    total_gross_payout: 15400.0,
    wht_rate: 3.0,
    wht_deducted: 462.0,
    net_payout: 14938.0,
    policy_count: 9,
    status: "PENDING",
  },
];

const MOCK_REMITTANCE: RemittanceBordereauRow[] = [
  {
    insurer_id: "ins-viriyah",
    insurer_name: "Viriyah Insurance PCL (วิริยะประกันภัย)",
    settlement_mode: "NET",
    monthly_pay_date: 15,
    total_policies: 412,
    collected_gross_premium: 4820500.0,
    retained_commission: 867690.0,
    vat_on_commission: 60738.3,
    wht_receivable: 26030.7,
    net_payable_to_insurer: 3918040.0,
    settlement_status: "PENDING_APPROVAL",
  },
  {
    insurer_id: "ins-dhipaya",
    insurer_name: "Dhipaya Insurance PCL (ทิพยประกันภัย)",
    settlement_mode: "GROSS",
    monthly_pay_date: 20,
    total_policies: 285,
    collected_gross_premium: 3140000.0,
    retained_commission: 565200.0,
    vat_on_commission: 39564.0,
    wht_receivable: 16956.0,
    net_payable_to_insurer: 3140000.0, // Gross settlement remits 100%
    settlement_status: "DRAFT",
  },
  {
    insurer_id: "ins-bki",
    insurer_name: "Bangkok Insurance PCL (กรุงเทพประกันภัย)",
    settlement_mode: "NET",
    monthly_pay_date: 15,
    total_policies: 198,
    collected_gross_premium: 2450000.0,
    retained_commission: 441000.0,
    vat_on_commission: 30870.0,
    wht_receivable: 13230.0,
    net_payable_to_insurer: 1991360.0,
    settlement_status: "SETTLED",
  },
];

// ============================================================================
// Main Page Component
// ============================================================================

export const TaxRemittanceReportsPage: React.FC = () => {
  // Navigation / Tab state
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "POR_LOR_1" | "TAWI_50" | "BORDEREAU">("OVERVIEW");
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-10");
  const [reportJobs, setReportJobs] = useState<ComplianceReportJob[]>(INITIAL_REPORT_JOBS);

  // Security / PDPA Scope state
  const [isPiiUnmasked, setIsPiiUnmasked] = useState<boolean>(false);
  const [showGenerateModal, setShowGenerateModal] = useState<boolean>(false);
  const [modalReportType, setModalReportType] = useState<ReportType>("OIC_POR_LOR_1");
  const [modalFormat, setModalFormat] = useState<"CSV" | "EXCEL" | "PDF" | "PGP_ZIP">("PGP_ZIP");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Aggregated KPI Calculations
  const metrics = useMemo(() => {
    const totalNetPremium = MOCK_POR_LOR_1.reduce((sum, r) => sum + r.net_premium, 0);
    const totalStampDuty = MOCK_POR_LOR_1.reduce((sum, r) => sum + r.stamp_duty, 0);
    const totalVat = MOCK_POR_LOR_1.reduce((sum, r) => sum + r.vat_amount, 0);
    const totalGross = MOCK_POR_LOR_1.reduce((sum, r) => sum + r.gross_premium, 0);
    const totalWht50Tawi = MOCK_50_TAWI.reduce((sum, r) => sum + r.wht_deducted, 0);
    const totalCarrierRemittance = MOCK_REMITTANCE.reduce((sum, r) => sum + r.net_payable_to_insurer, 0);

    return {
      totalNetPremium,
      totalStampDuty,
      totalVat,
      totalGross,
      totalWht50Tawi,
      totalCarrierRemittance,
    };
  }, []);

  // Formatters
  const formatTHB = (val: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(val)
      .replace("THB", "฿");
  };

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const newJob: ComplianceReportJob = {
        report_id: `rep-${Math.floor(1000 + Math.random() * 9000)}`,
        report_type: modalReportType,
        title:
          modalReportType === "OIC_POR_LOR_1"
            ? "OIC Por.Lor. 1 Regulatory Report"
            : modalReportType === "TRD_50_TAWI"
              ? "TRD 50 Tawi Withholding Tax Batch"
              : modalReportType === "BROKER_PAYABLE"
                ? "Insurer Settlement Bordereau"
                : "Tax Register",
        target_period: selectedMonth,
        requested_by_name: "Current User (Finance Role)",
        status: "PROCESSING",
        output_format: modalFormat,
        created_at: new Date().toISOString().replace("T", " ").substring(0, 19),
        record_count: Math.floor(120 + Math.random() * 850),
      };

      setReportJobs((prev) => [newJob, ...prev]);
      setIsSubmitting(false);
      setShowGenerateModal(false);

      // Simulate asynchronous background worker completion (Pub/Sub worker)
      setTimeout(() => {
        setReportJobs((current) =>
          current.map((j) =>
            j.report_id === newJob.report_id
              ? {
                  ...j,
                  status: "GENERATED",
                  file_size: "3.4 MB",
                  s3_encrypted_url: `s3://pas-compliance-vault/${selectedMonth}/${j.report_type.toLowerCase()}_export.${j.output_format.toLowerCase()}`,
                }
              : j,
          ),
        );
      }, 3500);
    }, 600);
  };

  return (
    // Top container with NO padding on top: uses -mt-6 -mx-6 to sit flush against the backoffice header
    <div className="-mt-6 -mx-6 min-h-full bg-zinc-50 font-sans text-zinc-900 pb-12">
      {/* ====================================================================
          Top Sub-Header Banner (Flush to Top)
          ==================================================================== */}
      <div className="bg-white border-b border-zinc-200 px-8 py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                OIC & TRD COMPLIANCE SUITE
              </span>
              <span className="text-xs text-zinc-400">|</span>
              <span className="text-xs font-mono text-zinc-500">PostgreSQL Read-Replica Partition</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mt-1">Tax & Remittance Reports</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Mandatory Thai OIC (Por.Lor. 1), Revenue Department 3% WHT (50 Tawi), and EOM Carrier Settlement
              Bordereaux
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Target Period Selector */}
            <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 shadow-sm">
              <label htmlFor="period-month" className="text-xs font-medium text-zinc-500">
                Period:
              </label>
              <input
                id="period-month"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-semibold text-zinc-800 focus:outline-none cursor-pointer"
              />
            </div>

            {/* PII Toggle for PDPA */}
            <button
              onClick={() => setIsPiiUnmasked(!isPiiUnmasked)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors shadow-sm ${
                isPiiUnmasked
                  ? "bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-300"
                  : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
              }`}
              title="Audit Logged in audit_logs table (pii:unmask scope)"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isPiiUnmasked ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                  />
                )}
              </svg>
              <span>{isPiiUnmasked ? "Mask PII (National ID)" : "Unmask PII (Audit Logged)"}</span>
            </button>

            {/* Trigger Report Button */}
            <button
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Generate Compliance Report</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 mt-6 border-b border-zinc-200">
          <button
            onClick={() => setActiveTab("OVERVIEW")}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors ${
              activeTab === "OVERVIEW"
                ? "border-zinc-900 text-zinc-900 font-semibold"
                : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
            }`}
          >
            Overview & Generation Queue
          </button>
          <button
            onClick={() => setActiveTab("POR_LOR_1")}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
              activeTab === "POR_LOR_1"
                ? "border-zinc-900 text-zinc-900 font-semibold"
                : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
            }`}
          >
            <span>OIC Por.Lor. 1 (ผ.ล. 1)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-100 text-zinc-600 font-mono">
              {MOCK_POR_LOR_1.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("TAWI_50")}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
              activeTab === "TAWI_50"
                ? "border-zinc-900 text-zinc-900 font-semibold"
                : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
            }`}
          >
            <span>50 Tawi Agent Tax (3% WHT)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-100 text-zinc-600 font-mono">
              {MOCK_50_TAWI.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("BORDEREAU")}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
              activeTab === "BORDEREAU"
                ? "border-zinc-900 text-zinc-900 font-semibold"
                : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
            }`}
          >
            <span>Insurer Remittance Bordereau (SOA)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-100 text-zinc-600 font-mono">
              {MOCK_REMITTANCE.length}
            </span>
          </button>
        </div>
      </div>

      {/* ====================================================================
          Main Container
          ==================================================================== */}
      <div className="px-8 pt-6 max-w-7xl mx-auto space-y-6">
        {/* Top KPI Summary Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-medium uppercase tracking-wider">Net Written Premium (NWP)</span>
              <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-mono">REP-01</span>
            </div>
            <div className="text-xl font-bold text-zinc-900 mt-2 font-mono">{formatTHB(metrics.totalNetPremium)}</div>
            <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
              <span>Stamp Duty:</span>
              <span className="font-semibold text-zinc-700 font-mono">{formatTHB(metrics.totalStampDuty)} (0.4%)</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-medium uppercase tracking-wider">VAT Output (7.0%)</span>
              <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-mono">TRD-7</span>
            </div>
            <div className="text-xl font-bold text-zinc-900 mt-2 font-mono">{formatTHB(metrics.totalVat)}</div>
            <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
              <span>Gross Total:</span>
              <span className="font-semibold text-zinc-700 font-mono">{formatTHB(metrics.totalGross)}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-medium uppercase tracking-wider">Agent 3% WHT Deducted</span>
              <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-mono">50 TAWI</span>
            </div>
            <div className="text-xl font-bold text-amber-700 mt-2 font-mono">{formatTHB(metrics.totalWht50Tawi)}</div>
            <div className="text-[11px] text-zinc-500 mt-1 flex items-center justify-between">
              <span>TRD E-Filing Ready</span>
              <span className="text-emerald-600 font-medium">Batch Verified</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-xs font-medium uppercase tracking-wider">EOM Carrier Remittances</span>
              <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg text-xs font-mono">TRUST ACC</span>
            </div>
            <div className="text-xl font-bold text-zinc-900 mt-2 font-mono">
              {formatTHB(metrics.totalCarrierRemittance)}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1 flex items-center justify-between">
              <span>3 Primary Carriers</span>
              <span className="text-zinc-600 font-mono font-medium">Pay Dates: 15th / 20th</span>
            </div>
          </div>
        </div>

        {/* ====================================================================
            TAB 1: Overview & Generation Hub
            ==================================================================== */}
        {activeTab === "OVERVIEW" && (
          <div className="space-y-6">
            {/* Regulatory Quick-Action Generators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* OIC Por.Lor. 1 Card */}
              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      MANDATORY OIC REGULATION
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">REP-01 / REP-02</span>
                  </div>
                  <h3 className="font-semibold text-zinc-900 text-sm mt-3">
                    OIC Por.Lor. 1 (แบบ ผ.ล. 1) Flattened Export
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Auto-joins header, versions, and risk tables. Formats ID cards (strips dashes), applies Buddhist Era
                    dates (+543), and encrypts with OIC PGP Public Key.
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400">Freq: Monthly / On-Demand</span>
                  <button
                    onClick={() => {
                      setModalReportType("OIC_POR_LOR_1");
                      setModalFormat("PGP_ZIP");
                      setShowGenerateModal(true);
                    }}
                    className="text-xs font-semibold text-zinc-900 hover:text-black underline underline-offset-4"
                  >
                    Run OIC Flat-File →
                  </button>
                </div>
              </div>

              {/* 50 Tawi Card */}
              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-widest text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      TRD TAX CODE SECTION 50
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">REP-03 / FIN-06</span>
                  </div>
                  <h3 className="font-semibold text-zinc-900 text-sm mt-3">
                    50 Tawi (50 ทวิ) Withholding Certificates
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Aggregates agent commission earnings, calculates statutory 3% WHT deduction, generates individual
                    PDF certificates and Revenue Dept filing CSV.
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400">Target: All Sub-Agents</span>
                  <button
                    onClick={() => {
                      setModalReportType("TRD_50_TAWI");
                      setModalFormat("PDF");
                      setShowGenerateModal(true);
                    }}
                    className="text-xs font-semibold text-zinc-900 hover:text-black underline underline-offset-4"
                  >
                    Generate 50 Tawi Batch →
                  </button>
                </div>
              </div>

              {/* Remittance Card */}
              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-widest text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                      FINANCE BORDEREAU SOA
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">REP-05 / FIN-03</span>
                  </div>
                  <h3 className="font-semibold text-zinc-900 text-sm mt-3">Broker-to-Insurer Settlement Remittance</h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Bordereau reconciliation filtering by Broker x Insurer Pay Date (e.g. 15th). Applies NET (deduct
                    before) vs GROSS settlement rules.
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400">Ledger: Append-Only</span>
                  <button
                    onClick={() => {
                      setModalReportType("BROKER_PAYABLE");
                      setModalFormat("EXCEL");
                      setShowGenerateModal(true);
                    }}
                    className="text-xs font-semibold text-zinc-900 hover:text-black underline underline-offset-4"
                  >
                    Compile Bordereau →
                  </button>
                </div>
              </div>
            </div>

            {/* Asynchronous Generation Table (compliance_reports tracker) */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900">Compliance Generation & File Dispatch Archive</h2>
                  <p className="text-xs text-zinc-500">
                    Tracked in <code className="text-zinc-700 font-mono">compliance_reports</code> table; executed via
                    Pub/Sub async worker pod
                  </p>
                </div>
                <span className="text-xs font-mono bg-zinc-100 px-2 py-1 rounded text-zinc-600">
                  {reportJobs.length} Jobs Logged
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 text-zinc-600 border-b border-zinc-200 uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-6">Report Title / Job ID</th>
                      <th className="py-3 px-6">Period</th>
                      <th className="py-3 px-6">Requested By</th>
                      <th className="py-3 px-6">Format</th>
                      <th className="py-3 px-6">Records</th>
                      <th className="py-3 px-6">Status</th>
                      <th className="py-3 px-6 text-right">Action / Download</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 font-normal text-zinc-700">
                    {reportJobs.map((job) => (
                      <tr key={job.report_id} className="hover:bg-zinc-50 transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="font-medium text-zinc-900">{job.title}</div>
                          <div className="text-[11px] font-mono text-zinc-400 mt-0.5">{job.report_id}</div>
                        </td>
                        <td className="py-3.5 px-6 font-mono font-medium">{job.target_period}</td>
                        <td className="py-3.5 px-6">
                          <div className="text-zinc-800">{job.requested_by_name}</div>
                          <div className="text-[10px] text-zinc-400">{job.created_at}</div>
                        </td>
                        <td className="py-3.5 px-6">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-zinc-100 text-zinc-700 border border-zinc-200">
                            {job.output_format}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 font-mono">{job.record_count.toLocaleString()}</td>
                        <td className="py-3.5 px-6">
                          {job.status === "GENERATED" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                              GENERATED
                            </span>
                          )}
                          {job.status === "PROCESSING" && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                              <svg className="w-3 h-3 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                              </svg>
                              PROCESSING
                            </span>
                          )}
                          {job.status === "FAILED" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                              FAILED
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          {job.status === "GENERATED" ? (
                            <button
                              onClick={() =>
                                alert(`Generating Pre-signed S3 download URL from: ${job.s3_encrypted_url}`)
                              }
                              className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-zinc-100 border border-zinc-300 rounded text-xs font-semibold text-zinc-700 shadow-sm transition-colors"
                            >
                              <svg
                                className="w-3.5 h-3.5 text-zinc-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                              </svg>
                              <span>Download ({job.file_size})</span>
                            </button>
                          ) : (
                            <span className="text-zinc-400 italic text-[11px]">Worker in progress...</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 2: OIC Por.Lor. 1 Live Data Flattening Grid
            ==================================================================== */}
        {activeTab === "POR_LOR_1" && (
          <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden space-y-0">
            <div className="p-6 border-b border-zinc-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-zinc-900">
                    OIC Por.Lor. 1 Regulatory Sales Flattening (แบบ ผ.ล. 1)
                  </h2>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                    OIC Rule Compliant
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Flattened view uniting policies, versions, and vehicle/health/travel extensions. Exact 0.4% Stamp Duty
                  & 7% VAT separation.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-500">Dates converted to Buddhist Era (BE 2569)</span>
                <button
                  onClick={() => alert("Exporting flattened CSV formatted strictly per OIC specifications.")}
                  className="px-3 py-1.5 bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-medium rounded-lg shadow-sm"
                >
                  Export OIC CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 text-zinc-600 border-b border-zinc-200 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Policy Number</th>
                    <th className="py-3 px-4">Insured Customer Name</th>
                    <th className="py-3 px-4">Thai National ID / Tax ID</th>
                    <th className="py-3 px-4">LOB</th>
                    <th className="py-3 px-4 text-right">Sum Insured</th>
                    <th className="py-3 px-4 text-right">Net Premium</th>
                    <th className="py-3 px-4 text-right">Stamp Duty (0.4%)</th>
                    <th className="py-3 px-4 text-right">VAT (7%)</th>
                    <th className="py-3 px-4 text-right">Gross Premium</th>
                    <th className="py-3 px-4 text-center">Effective (BE)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-zinc-700">
                  {MOCK_POR_LOR_1.map((row) => (
                    <tr key={row.policy_number} className="hover:bg-zinc-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-zinc-900">{row.policy_number}</td>
                      <td className="py-3 px-4 font-medium text-zinc-800">{row.customer_full_name}</td>
                      <td className="py-3 px-4 font-mono">
                        {isPiiUnmasked ? (
                          <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-semibold">
                            {row.national_id_unmasked}
                          </span>
                        ) : (
                          <span className="text-zinc-500">{row.national_id_masked}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-700">
                          {row.product_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono">{formatTHB(row.sum_insured)}</td>
                      <td className="py-3 px-4 text-right font-mono font-medium">{formatTHB(row.net_premium)}</td>
                      <td className="py-3 px-4 text-right font-mono text-zinc-600">{formatTHB(row.stamp_duty)}</td>
                      <td className="py-3 px-4 text-right font-mono text-zinc-600">{formatTHB(row.vat_amount)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-zinc-900">
                        {formatTHB(row.gross_premium)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-medium text-zinc-600">
                        {row.buddhist_effective_date}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-zinc-50 border-t-2 border-zinc-300 font-semibold text-zinc-900">
                  <tr>
                    <td colSpan={5} className="py-3 px-4 uppercase text-right text-xs">
                      Total Aggregate:
                    </td>
                    <td className="py-3 px-4 text-right font-mono">{formatTHB(metrics.totalNetPremium)}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatTHB(metrics.totalStampDuty)}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatTHB(metrics.totalVat)}</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 font-bold">
                      {formatTHB(metrics.totalGross)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="p-4 bg-zinc-50 border-t border-zinc-200 text-xs text-zinc-500 flex items-center justify-between">
              <span>
                * Note: Per OIC regulation, National ID dashes are automatically stripped during final flat-file
                serialization.
              </span>
              <span className="font-mono text-zinc-400">
                Section 5.16 SDD Read-Replica Materialized View: oic_por_lor_1_mview
              </span>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 3: 50 Tawi (50 ทวิ) Agent Withholding Tax Grid
            ==================================================================== */}
        {activeTab === "TAWI_50" && (
          <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden space-y-0">
            <div className="p-6 border-b border-zinc-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-zinc-900">
                    Revenue Department 50 Tawi (หนังสือรับรองการหักภาษี ณ ที่จ่าย 50 ทวิ)
                  </h2>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 rounded">
                    3% WHT Deducted at Source
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Monthly agent payout reconciliation. Deducts 3% Withholding Tax from agent commissions and prepares
                  TRD Form P.N.D. 53/3 export.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => alert("Batch generating PDF certificates for all qualified agents")}
                  className="px-3 py-1.5 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-700 text-xs font-semibold rounded-lg shadow-sm"
                >
                  Bulk Print PDF Certificates
                </button>
                <button
                  onClick={() => alert("Generating TRD Revenue Dept e-filing CSV file")}
                  className="px-3 py-1.5 bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-semibold rounded-lg shadow-sm"
                >
                  Generate TRD CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 text-zinc-600 border-b border-zinc-200 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-6">Agent Code</th>
                    <th className="py-3 px-6">Agent Legal Name</th>
                    <th className="py-3 px-6">Tax ID</th>
                    <th className="py-3 px-6">Frozen Tier</th>
                    <th className="py-3 px-6 text-center">Policies</th>
                    <th className="py-3 px-6 text-right">Total Commission</th>
                    <th className="py-3 px-6 text-right">3% WHT Deducted</th>
                    <th className="py-3 px-6 text-right">Net Payout</th>
                    <th className="py-3 px-6 text-center">Status</th>
                    <th className="py-3 px-6 text-right">Certificate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-zinc-700">
                  {MOCK_50_TAWI.map((row) => (
                    <tr key={row.agent_code} className="hover:bg-zinc-50 transition-colors">
                      <td className="py-3 px-6 font-mono font-medium text-zinc-900">{row.agent_code}</td>
                      <td className="py-3 px-6 font-medium text-zinc-800">{row.agent_name}</td>
                      <td className="py-3 px-6 font-mono text-zinc-500">{row.tax_id}</td>
                      <td className="py-3 px-6">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-100 text-zinc-700">
                          {row.commission_tier}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center font-mono">{row.policy_count}</td>
                      <td className="py-3 px-6 text-right font-mono font-medium">
                        {formatTHB(row.total_gross_payout)}
                      </td>
                      <td className="py-3 px-6 text-right font-mono font-semibold text-amber-700">
                        -{formatTHB(row.wht_deducted)}
                      </td>
                      <td className="py-3 px-6 text-right font-mono font-bold text-zinc-900">
                        {formatTHB(row.net_payout)}
                      </td>
                      <td className="py-3 px-6 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            row.status === "CERT_ISSUED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <button
                          onClick={() =>
                            alert(`Opening 50 Tawi PDF Certificate for ${row.agent_name} (${row.agent_code})`)
                          }
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          View PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-zinc-50 border-t border-zinc-200 text-xs text-zinc-500">
              * Statutory requirement: Commission rates are frozen at time of policy issuance to prevent retroactive
              distortion upon agent tier promotion.
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 4: Broker-to-Insurer Settlement Remittance (Bordereau SOA)
            ==================================================================== */}
        {activeTab === "BORDEREAU" && (
          <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden space-y-0">
            <div className="p-6 border-b border-zinc-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-zinc-900">
                    Broker-to-Insurer Premium Remittance Bordereau (SOA)
                  </h2>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 rounded">
                    OIC Trust Account Reconciliation
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  End-of-Month statement for corporate bank wires. Driven by Broker x Insurer Settlement Settings (Net
                  vs Gross).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Filter by Pay Date:</span>
                <select className="bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-700">
                  <option value="ALL">All Settlement Dates</option>
                  <option value="15">15th of Month (Viriyah / BKI)</option>
                  <option value="20">20th of Month (Dhipaya)</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 text-zinc-600 border-b border-zinc-200 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-6">Insurer Partner</th>
                    <th className="py-3 px-6 text-center">Settlement Mode</th>
                    <th className="py-3 px-6 text-center">Monthly Pay Date</th>
                    <th className="py-3 px-6 text-center">Policies</th>
                    <th className="py-3 px-6 text-right">Gross Collected</th>
                    <th className="py-3 px-6 text-right">Retained Commission</th>
                    <th className="py-3 px-6 text-right">Net Payable to Insurer</th>
                    <th className="py-3 px-6 text-center">Settlement State</th>
                    <th className="py-3 px-6 text-right">Bordereau SOA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-zinc-700">
                  {MOCK_REMITTANCE.map((row) => (
                    <tr key={row.insurer_id} className="hover:bg-zinc-50 transition-colors">
                      <td className="py-3 px-6 font-semibold text-zinc-900">{row.insurer_name}</td>
                      <td className="py-3 px-6 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            row.settlement_mode === "NET"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-zinc-100 text-zinc-700"
                          }`}
                        >
                          {row.settlement_mode} ({row.settlement_mode === "NET" ? "Deduct Before" : "Deduct After"})
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center font-mono font-medium text-zinc-700">
                        {row.monthly_pay_date}th of month
                      </td>
                      <td className="py-3 px-6 text-center font-mono">{row.total_policies}</td>
                      <td className="py-3 px-6 text-right font-mono">{formatTHB(row.collected_gross_premium)}</td>
                      <td className="py-3 px-6 text-right font-mono text-emerald-700 font-medium">
                        {formatTHB(row.retained_commission)}
                      </td>
                      <td className="py-3 px-6 text-right font-mono font-bold text-zinc-900">
                        {formatTHB(row.net_payable_to_insurer)}
                      </td>
                      <td className="py-3 px-6 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            row.settlement_status === "SETTLED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : row.settlement_status === "PENDING_APPROVAL"
                                ? "bg-amber-50 text-amber-800 border border-amber-200"
                                : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {row.settlement_status}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <button
                          onClick={() =>
                            alert(`Exporting Bordereau Statement of Account (SOA) for ${row.insurer_name}`)
                          }
                          className="text-xs font-semibold text-zinc-900 hover:underline"
                        >
                          Export SOA
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-zinc-50 border-t border-zinc-200 text-xs text-zinc-500 flex items-center justify-between">
              <span>
                * Maker-Checker Rule: Finalizing wire remittance stages to `approval_requests` requiring segregation of
                duties before general ledger balancing.
              </span>
              <span className="font-mono text-zinc-400">Endpoint: POST /admin/ledger/insurer-payables/settle</span>
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================
          Modal: Trigger Asynchronous Report Generation
          ==================================================================== */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-zinc-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div>
                <h3 className="font-bold text-zinc-900 text-base">Generate Regulatory Compliance Report</h3>
                <p className="text-xs text-zinc-500">Asynchronous extraction from PostgreSQL Read-Replica cluster</p>
              </div>
              <button onClick={() => setShowGenerateModal(false)} className="text-zinc-400 hover:text-zinc-600 p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase mb-1">
                  Report Type (Statutory Code)
                </label>
                <select
                  value={modalReportType}
                  onChange={(e) => setModalReportType(e.target.value as ReportType)}
                  className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  <option value="OIC_POR_LOR_1">OIC Por.Lor. 1 (ผ.ล. 1) Flattened Sales Report</option>
                  <option value="TRD_50_TAWI">TRD 50 Tawi (หนังสือรับรองการหักภาษี ณ ที่จ่าย)</option>
                  <option value="BROKER_PAYABLE">Broker-to-Insurer Remittance Bordereau (SOA)</option>
                  <option value="COMMISSION_RECEIVABLE">Insurer Commission Receivable Report</option>
                  <option value="TAX_INVOICE_REGISTER">VAT Output & Tax Credit Note Register</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase mb-1">Target Period</label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase mb-1">
                    Export Output Format
                  </label>
                  <select
                    value={modalFormat}
                    onChange={(e) => setModalFormat(e.target.value as any)}
                    className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  >
                    <option value="PGP_ZIP">Encrypted PGP Flat-File (.zip)</option>
                    <option value="CSV">Standard Flat CSV (.csv)</option>
                    <option value="EXCEL">Microsoft Excel (.xlsx)</option>
                    <option value="PDF">Consolidated Legal PDF (.pdf)</option>
                  </select>
                </div>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-[11px] text-zinc-600 space-y-1">
                <div className="font-semibold text-zinc-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Architectural Performance Guard Enforced:
                </div>
                <p>
                  This execution publishes a message to Google Cloud Pub/Sub and delegates compilation to an isolated
                  Compliance Worker pod, preventing table locks on live checkout operations.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 border border-zinc-300 text-zinc-700 hover:bg-zinc-50 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      <span>Dispatching to Pub/Sub...</span>
                    </>
                  ) : (
                    <span>Dispatch Report Worker</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxRemittanceReportsPage;
