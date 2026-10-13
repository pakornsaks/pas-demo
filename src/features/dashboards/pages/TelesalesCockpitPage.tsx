import React, { useMemo, useState } from "react";
import {
  SalesChannelId,
  type IncompleteLeadQueueItem,
  type PendingPaymentQueueItem,
  type PiiUnmaskReasonCode,
  type RenewalQueueItem,
  type TelesalesAgentIdentity,
  type TelesalesKpiMetrics,
} from "../types";

// ==========================================
// MOCK DATA INITIALIZATION
// ==========================================

const CURRENT_AGENT: TelesalesAgentIdentity = {
  agent_id: "agt-uuid-0091",
  agent_code: "TS-BKK-0881",
  full_name: "นันทพร สว่างจิตต์",
  email: "nantaporn.s@9singha.co.th",
  channel_id: SalesChannelId.TELESALES,
  channel_name: "Tele sales",
  commission_tier: "GOLD",
  base_commission_percent: 18.0,
  rbac_scopes: ["quote:create", "customer:create", "pii:unmask"],
};

const MOCK_RENEWALS: RenewalQueueItem[] = [
  {
    queue_id: "ren-1",
    policy_id: "pol-uuid-883921",
    policy_number: "VIR-25-883921",
    renewal_application_id: "APP-REN-2026-0041",
    customer_id: "cust-uuid-101",
    customer_name: "สมชาย ใจดีเจริญ",
    phone_masked: "081-XXX-4592",
    phone_raw: "081-923-4592",
    national_id_masked: "1-1004-XXXX-88-1",
    national_id_raw: "1-1004-0029-88-1",
    lob_code: "MOTOR",
    product_name: "วิริยะประกันภัย รถยนต์ชั้น 1 ซ่อมอู่",
    insurer_name: "วิริยะประกันภัย",
    vehicle_license_plate: "1กข-9921",
    vehicle_province_name: "กรุงเทพมหานคร",
    expiring_date: "2026-11-02",
    days_until_expiry: 18,
    last_year_gross_premium: 17500.0,
    estimated_renewal_premium: 16900.0,
    is_unmasked: false,
  },
  {
    queue_id: "ren-2",
    policy_id: "pol-uuid-334190",
    policy_number: "MTI-25-334190",
    customer_id: "cust-uuid-102",
    customer_name: "ประภาวัลย์ ศิริพงษ์",
    phone_masked: "089-XXX-1188",
    phone_raw: "089-441-1188",
    national_id_masked: "3-1005-XXXX-12-9",
    national_id_raw: "3-1005-4491-12-9",
    lob_code: "MOTOR",
    product_name: "เมืองไทย ประกันภัย 2+ คุ้มครองน้ำท่วม",
    insurer_name: "เมืองไทยประกันภัย",
    vehicle_license_plate: "7กฮ-3044",
    vehicle_province_name: "เชียงใหม่",
    expiring_date: "2026-10-25",
    days_until_expiry: 10,
    last_year_gross_premium: 7900.0,
    estimated_renewal_premium: 7900.0,
    is_unmasked: false,
  },
  {
    queue_id: "ren-3",
    policy_id: "pol-uuid-994102",
    policy_number: "AIA-25-994102",
    customer_id: "cust-uuid-103",
    customer_name: "ธวัชชัย รัตนประสิทธิ์",
    phone_masked: "062-XXX-7731",
    phone_raw: "062-883-7731",
    national_id_masked: "1-1020-XXXX-55-3",
    national_id_raw: "1-1020-9941-55-3",
    lob_code: "HEALTH",
    product_name: "AIA Health Happy เหมาจ่าย 5 ล้าน",
    insurer_name: "เอไอเอ ประเทศไทย",
    expiring_date: "2026-10-18",
    days_until_expiry: 3,
    last_year_gross_premium: 28400.0,
    estimated_renewal_premium: 29800.0,
    is_unmasked: false,
  },
];

const MOCK_INCOMPLETE_LEADS: IncompleteLeadQueueItem[] = [
  {
    lead_id: "LEAD-2026-904",
    customer_id: "cust-uuid-201",
    customer_name: "กิตติศักดิ์ บุญชู",
    phone_masked: "095-XXX-2281",
    phone_raw: "095-712-2281",
    lob_code: "MOTOR",
    product_name: "กรุงเทพประกันภัย ประเภท 1 Care",
    data_completeness: "PARTIAL",
    missing_kyc_fields: ["สำเนาเล่มทะเบียนรถ (หน้า 16)", "เลขบัตรประชาชน 13 หลัก"],
    last_quoted_gross_premium: 18900.0,
    created_at_relative: "10 นาทีที่แล้ว",
    quotation_valid_until: "2026-11-12T23:59:59Z",
    is_unmasked: false,
  },
  {
    lead_id: "LEAD-2026-889",
    customer_id: "cust-uuid-202",
    customer_name: "วรัญญา รักษ์สกุล",
    phone_masked: "086-XXX-9940",
    phone_raw: "086-339-9940",
    lob_code: "HEALTH",
    product_name: "ไทยวิวัฒน์ Health Ultra แผน 2",
    data_completeness: "PARTIAL",
    missing_kyc_fields: ["ประวัติสุขภาพและน้ำหนัก/ส่วนสูง (BMI)"],
    last_quoted_gross_premium: 12500.0,
    created_at_relative: "45 นาทีที่แล้ว",
    quotation_valid_until: "2026-11-12T23:59:59Z",
    is_unmasked: false,
  },
];

const MOCK_PENDING_PAYMENTS: PendingPaymentQueueItem[] = [
  {
    application_id: "APP-2026-0412",
    customer_name: "ชัยวัฒน์ มงคลศิลป์",
    phone_masked: "084-XXX-8812",
    product_name: "วิริยะประกันภัย รถยนต์ชั้น 1 ซ่อมห้าง",
    gross_payable_amount: 21400.0,
    effective_date: "2026-10-15",
    hours_until_auto_cancellation: 36,
    is_payment_locked: false,
    underwriting_status: "APPROVED_WAITING_PAYMENT",
  },
  {
    application_id: "APP-2026-0399",
    customer_name: "อนันต์ ทวีโชค",
    phone_masked: "082-XXX-0101",
    product_name: "AIA ประกันสุขภาพ ค่ารักษาเหมาจ่าย",
    gross_payable_amount: 34200.0,
    effective_date: "2026-10-20",
    hours_until_auto_cancellation: 120,
    is_payment_locked: true,
    underwriting_status: "PENDING_REVIEW",
    referral_reasons: ["ดัชนีมวลกายเกินเกณฑ์ (BMI > 30)", "ประวัติโรคความดันโลหิตสูง"],
  },
];

// ==========================================
// COMPONENT: TELESALES COCKPIT
// ==========================================

export const TelesalesCockpit: React.FC = () => {
  type QueueTab = "RENEWALS" | "LEADS" | "PENDING_PAYMENTS";

  const [activeTab, setActiveTab] = useState<QueueTab>("RENEWALS");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Unmask State & Audit Trail Simulation
  const [unmaskedCustomerIds, setUnmaskedCustomerIds] = useState<Record<string, boolean>>({});
  const [unmaskModalOpen, setUnmaskModalOpen] = useState(false);
  const [pendingUnmaskTarget, setPendingUnmaskTarget] = useState<{ id: string; name: string } | null>(null);
  const [unmaskReason, setUnmaskReason] = useState<PiiUnmaskReasonCode>("CUSTOMER_VERIFICATION_CALL");

  // Customer Selection & Commission Sacrifice State
  const [selectedRenewal, setSelectedRenewal] = useState<RenewalQueueItem | null>(MOCK_RENEWALS[0]);
  const [flexSacrificePercent, setFlexSacrificePercent] = useState<number>(2.0);

  // System Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // KPI Calculations
  const kpiMetrics: TelesalesKpiMetrics = useMemo(() => {
    const gross = 845200.0;
    const target = 1200000.0;
    const commGross = 142200.0;
    const wht = commGross * 0.03;
    return {
      total_gross_premium_mtd: gross,
      total_net_premium_mtd: 789906.54,
      target_gross_premium_mtd: target,
      mtd_target_achievement_ratio: gross / target,
      earned_commission_gross_mtd: commGross,
      withholding_tax_deduction_mtd: wht,
      earned_commission_net_mtd: commGross - wht,
      pending_payment_count: 6,
      pending_payment_gross_volume: 124900.0,
      urgent_renewals_count: MOCK_RENEWALS.filter((r) => r.days_until_expiry <= 14).length,
    };
  }, []);

  // Filtered Renewals based on Search Input
  const filteredRenewals = useMemo(() => {
    if (!searchQuery.trim()) return MOCK_RENEWALS;
    const q = searchQuery.toLowerCase();
    return MOCK_RENEWALS.filter(
      (r) =>
        r.customer_name.toLowerCase().includes(q) ||
        (r.vehicle_license_plate && r.vehicle_license_plate.toLowerCase().includes(q)) ||
        r.policy_number.toLowerCase().includes(q) ||
        r.phone_raw.includes(q),
    );
  }, [searchQuery]);

  // Handle PDPA PII Unmasking Flow
  const handleRequestUnmask = (id: string, name: string) => {
    setPendingUnmaskTarget({ id, name });
    setUnmaskModalOpen(true);
  };

  const confirmUnmask = () => {
    if (pendingUnmaskTarget) {
      setUnmaskedCustomerIds((prev) => ({ ...prev, [pendingUnmaskTarget.id]: true }));
      showToast(`[AUDIT LOG] บันทึกการเปิดเผย PII: ${pendingUnmaskTarget.name} ลง audit_logs สำเร็จ`);
      setUnmaskModalOpen(false);
      setPendingUnmaskTarget(null);
    }
  };

  // Commission Sacrifice Calculations
  const currentBasePrice = selectedRenewal ? selectedRenewal.last_year_gross_premium : 15000;
  const currentFlexDiscount = (currentBasePrice * flexSacrificePercent) / 100;
  const finalPayableAfterFlex = currentBasePrice - currentFlexDiscount;
  const agentNetCommissionRate = CURRENT_AGENT.base_commission_percent - flexSacrificePercent;

  return (
    <div className="w-full space-y-4 text-slate-800 font-sans antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-lg shadow-xl border border-slate-700 flex items-center space-x-2 transition">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. TOP HEADER CARD (ZERO OUTER PADDING)                   */}
      {/* ========================================================= */}
      <header className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-xs text-sm">
              TS
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">Telesales Cockpit</h1>
                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded border border-slate-200 font-mono">
                  Screen 8.7.1
                </span>
                <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded border border-emerald-200 flex items-center space-x-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>ONLINE (PAS CHANNEL ID: 1)</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                เจ้าหน้าที่: <strong className="text-slate-700">{CURRENT_AGENT.full_name}</strong> | รหัส:{" "}
                {CURRENT_AGENT.agent_code} | Tier: {CURRENT_AGENT.commission_tier} (
                {CURRENT_AGENT.base_commission_percent}%)
              </p>
            </div>
          </div>

          {/* Quick Search */}
          <div className="flex items-center space-x-2 flex-1 max-w-md">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="ค้นหาด่วน: เลขทะเบียน, เบอร์โทร, เลขบัตร ปชช. หรือเลขกรมธรรม์..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              <svg
                className="w-4 h-4 text-slate-400 absolute left-2.5 top-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={() => showToast(`ค้นหาข้อมูล "${searchQuery}" จากตาราง customers (Master Golden Record)`)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-xs whitespace-nowrap"
            >
              ค้นหา 360°
            </button>
          </div>
        </div>

        {/* Operational SLA Banner */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <span className="text-amber-600 font-semibold">⚡ Auto-Cancel Offset:</span>
              <span className="text-slate-600">0 วัน (ยกเลิกทันที ณ วันเริ่มคุ้มครองหากยังไม่ชำระ)</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center space-x-1">
              <span className="text-blue-600 font-semibold">🔔 แจ้งเตือนยอดชำระ:</span>
              <span className="text-slate-600">ก่อนครบกำหนด 3 วัน (broker_channel_settings)</span>
            </span>
          </div>
          <div className="text-slate-400 font-mono text-[11px]">Stateless JWT Auth • AES-256 PII Encrypted</div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. REAL-TIME KPI WIDGET CARDS (NO OUTER PADDING)          */}
      {/* ========================================================= */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Widget 1: Total Premium MTD */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Premium (MTD)</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-900 tracking-tight font-mono">
              ฿{kpiMetrics.total_gross_premium_mtd.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>
                Net: ฿{kpiMetrics.total_net_premium_mtd.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-blue-600 font-semibold">
                {(kpiMetrics.mtd_target_achievement_ratio * 100).toFixed(0)}% ของเป้า
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, kpiMetrics.mtd_target_achievement_ratio * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Widget 2: Commission Earned */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Commission Earned (สุทธิ)
            </span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-emerald-600 tracking-tight font-mono">
              ฿{kpiMetrics.earned_commission_net_mtd.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>
                Gross: ฿{kpiMetrics.earned_commission_gross_mtd.toLocaleString("th-TH", { minimumFractionDigits: 0 })}
              </span>
              <span className="text-amber-600 font-mono">
                หัก 3% WHT: -฿
                {kpiMetrics.withholding_tax_deduction_mtd.toLocaleString("th-TH", { minimumFractionDigits: 0 })}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-3">
              คำนวณตาม Tier {CURRENT_AGENT.commission_tier} พร้อมหัก Flex Sacrifice
            </div>
          </div>
        </div>

        {/* Widget 3: Pending Payment */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Payment (รอชำระ)
            </span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-md">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </span>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-amber-600 tracking-tight font-mono">
              {kpiMetrics.pending_payment_count} <span className="text-sm font-normal text-slate-500">เคส</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              ยอดเงินค้าง:{" "}
              <span className="text-slate-800 font-semibold font-mono">
                ฿{kpiMetrics.pending_payment_gross_volume.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="text-[11px] text-rose-600 font-medium mt-3">
              ⚠️ เสี่ยงยกเลิก Auto-Cancel (0 วัน) ภายใน 48 ชม.
            </div>
          </div>
        </div>

        {/* Widget 4: Renewals Due in 30 Days */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Renewals Due &lt; 30 Days
            </span>
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded-md">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </span>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-rose-600 tracking-tight font-mono">
              {MOCK_RENEWALS.length} <span className="text-sm font-normal text-slate-500">กรมธรรม์</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              ด่วนที่สุด (&lt; 14 วัน):{" "}
              <strong className="text-rose-600 font-semibold">{kpiMetrics.urgent_renewals_count} เคส</strong>
            </div>
            <div className="text-[11px] text-slate-400 mt-3">ดึงข้อมูลจาก Retention Batch Job (90 วันล่วงหน้า)</div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. MAIN WORKSPACE: QUEUES & CUSTOMER 360 (NO OUTER PADDING)*/}
      {/* ========================================================= */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Side (Col-span 2): Queues */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col">
          {/* Navigation Tabs */}
          <div className="border-b border-slate-200 bg-slate-50/70 px-4 pt-2.5 flex space-x-2">
            <button
              onClick={() => setActiveTab("RENEWALS")}
              className={`pb-2.5 px-3.5 text-xs font-semibold transition border-b-2 flex items-center space-x-2 ${
                activeTab === "RENEWALS"
                  ? "border-blue-600 text-blue-600 bg-white rounded-t-md"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>งานต่ออายุใน 30 วัน</span>
              <span className="bg-rose-100 text-rose-700 text-[11px] px-1.5 py-0.2 rounded-full font-bold">
                {MOCK_RENEWALS.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("LEADS")}
              className={`pb-2.5 px-3.5 text-xs font-semibold transition border-b-2 flex items-center space-x-2 ${
                activeTab === "LEADS"
                  ? "border-blue-600 text-blue-600 bg-white rounded-t-md"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>Incomplete Leads (รถหลุดตะกร้า)</span>
              <span className="bg-amber-100 text-amber-700 text-[11px] px-1.5 py-0.2 rounded-full font-bold">
                {MOCK_INCOMPLETE_LEADS.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("PENDING_PAYMENTS")}
              className={`pb-2.5 px-3.5 text-xs font-semibold transition border-b-2 flex items-center space-x-2 ${
                activeTab === "PENDING_PAYMENTS"
                  ? "border-blue-600 text-blue-600 bg-white rounded-t-md"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>ยอดรอชำระ &amp; รอพิจารณา UW</span>
              <span className="bg-slate-200 text-slate-700 text-[11px] px-1.5 py-0.2 rounded-full font-bold">
                {MOCK_PENDING_PAYMENTS.length}
              </span>
            </button>
          </div>

          {/* TAB 1: RENEWALS */}
          {activeTab === "RENEWALS" && (
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-4">ลูกค้า &amp; เลขกรมธรรม์เดิม</th>
                    <th className="py-2.5 px-4">ยานพาหนะ / แผนประกัน</th>
                    <th className="py-2.5 px-4">วันหมดอายุ / คงเหลือ</th>
                    <th className="py-2.5 px-4 text-right">เบี้ยเดิม (Gross)</th>
                    <th className="py-2.5 px-4 text-center">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRenewals.map((item) => {
                    const isUnmasked = !!unmaskedCustomerIds[item.queue_id];
                    const isSelected = selectedRenewal?.queue_id === item.queue_id;
                    return (
                      <tr
                        key={item.queue_id}
                        onClick={() => setSelectedRenewal(item)}
                        className={`transition cursor-pointer ${
                          isSelected ? "bg-blue-50/60 border-l-4 border-blue-600" : "hover:bg-slate-50/80"
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{item.customer_name}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center space-x-1">
                            <span>โทร: {isUnmasked ? item.phone_raw : item.phone_masked}</span>
                            {!isUnmasked && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRequestUnmask(item.queue_id, item.customer_name);
                                }}
                                className="text-blue-600 hover:underline text-[10px] font-semibold"
                              >
                                [เปิดดู]
                              </button>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">{item.policy_number}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{item.vehicle_license_plate || "-"}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">{item.product_name}</div>
                          <div className="text-[10px] text-slate-400">{item.insurer_name}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-700 font-mono">{item.expiring_date}</div>
                          <span
                            className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold mt-1 ${
                              item.days_until_expiry <= 7
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : item.days_until_expiry <= 15
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            เหลือ {item.days_until_expiry} วัน
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="font-bold text-slate-900 font-mono">
                            ฿{item.last_year_gross_premium.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] text-emerald-600 font-medium">คอมมิชชัน ~18%</div>
                        </td>
                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() =>
                                showToast(
                                  `สร้างใบเสนอราคาต่ออายุ (POST /policies/${item.policy_number}/renew) เรียบร้อย`,
                                )
                              }
                              className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] px-2.5 py-1 rounded-md shadow-xs font-medium transition"
                            >
                              คำนวณเบี้ย
                            </button>
                            <button
                              onClick={() => showToast(`ส่ง SMS ลิงก์ต่ออายุไปยัง ${item.phone_masked}`)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-md transition border border-slate-200"
                              title="ส่ง SMS ลิงก์ต่ออายุ"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: INCOMPLETE LEADS */}
          {activeTab === "LEADS" && (
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-4">Lead ID &amp; ลูกค้า</th>
                    <th className="py-2.5 px-4">แผนประกันที่ค้าง</th>
                    <th className="py-2.5 px-4">สถานะ KYC &amp; ข้อมูลที่ขาด</th>
                    <th className="py-2.5 px-4 text-right">ยอดเบี้ยที่คำนวณไว้</th>
                    <th className="py-2.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MOCK_INCOMPLETE_LEADS.map((lead) => {
                    const isUnmasked = !!unmaskedCustomerIds[lead.lead_id];
                    return (
                      <tr key={lead.lead_id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{lead.customer_name}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center space-x-1">
                            <span>โทร: {isUnmasked ? lead.phone_raw : lead.phone_masked}</span>
                            {!isUnmasked && (
                              <button
                                onClick={() => handleRequestUnmask(lead.lead_id, lead.customer_name)}
                                className="text-blue-600 hover:underline text-[10px] font-semibold"
                              >
                                [เปิดดู]
                              </button>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">{lead.lead_id}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            {lead.lob_code}
                          </span>
                          <div className="text-[11px] text-slate-700 mt-1">{lead.product_name}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-2 py-0.5 rounded font-mono font-medium">
                            {lead.data_completeness}
                          </span>
                          <div className="text-[11px] text-rose-600 mt-1">
                            รอเก็บ: {lead.missing_kyc_fields.join(", ")}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="font-bold text-slate-900 font-mono">
                            ฿{lead.last_quoted_gross_premium.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] text-slate-400">{lead.created_at_relative}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => showToast(`ดึงตะกร้า ${lead.lead_id} เพื่อเข้าสู่ขั้นตอนยืนยัน KYC`)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] px-3 py-1 rounded-md shadow-xs font-medium transition"
                          >
                            โทรปิดการขาย (Resume)
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: PENDING PAYMENTS */}
          {activeTab === "PENDING_PAYMENTS" && (
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-4">Application ID &amp; ลูกค้า</th>
                    <th className="py-2.5 px-4">แผนประกัน &amp; ยอดค้าง</th>
                    <th className="py-2.5 px-4">Underwriting Status</th>
                    <th className="py-2.5 px-4">Auto-Cancel SLA (0-Day Offset)</th>
                    <th className="py-2.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MOCK_PENDING_PAYMENTS.map((item) => (
                    <tr key={item.application_id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{item.customer_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{item.phone_masked}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{item.application_id}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-[11px] text-slate-700">{item.product_name}</div>
                        <div className="font-bold text-amber-600 font-mono mt-0.5">
                          ฿{item.gross_payable_amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {item.is_payment_locked ? (
                          <div>
                            <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] px-2 py-0.5 rounded font-medium inline-flex items-center space-x-1">
                              <span>🔒 Payment Locked</span>
                            </span>
                            <div className="text-[10px] text-amber-700 mt-1">ติดเงื่อนไข Underwriter พิจารณา</div>
                          </div>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-0.5 rounded font-medium">
                            ✓ ผ่านการพิจารณา พร้อมชำระ
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-700">{item.effective_date}</div>
                        <div className="text-[11px] text-rose-600 font-semibold mt-0.5">
                          ยกเลิกอัตโนมัติใน {item.hours_until_auto_cancellation} ชม.
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          disabled={item.is_payment_locked}
                          onClick={() => showToast(`ส่ง SMS ลิงก์ชำระเงินให้ ${item.customer_name} สำเร็จ`)}
                          className={`text-[11px] px-3 py-1 rounded-md font-medium shadow-xs transition ${
                            item.is_payment_locked
                              ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                        >
                          ส่งลิงก์ชำระด่วน
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Side (Col-span 1): Customer 360 & Flex Calculator */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-xs flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>Customer 360° &amp; Quick Quote</span>
              </h2>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-mono">
                Unified Header
              </span>
            </div>

            {selectedRenewal ? (
              <div className="mt-4 space-y-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">ชื่อผู้เอาประกัน:</span>
                    <strong className="text-slate-900">{selectedRenewal.customer_name}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">เลขบัตรประชาชน:</span>
                    <div className="flex items-center space-x-1.5 font-mono">
                      <span className="text-slate-800">
                        {unmaskedCustomerIds[selectedRenewal.queue_id]
                          ? selectedRenewal.national_id_raw
                          : selectedRenewal.national_id_masked}
                      </span>
                      {!unmaskedCustomerIds[selectedRenewal.queue_id] && (
                        <button
                          onClick={() => handleRequestUnmask(selectedRenewal.queue_id, selectedRenewal.customer_name)}
                          className="text-[10px] text-blue-600 hover:underline font-semibold"
                        >
                          [Reveal]
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">เบอร์โทรศัพท์:</span>
                    <span className="font-mono text-slate-800">
                      {unmaskedCustomerIds[selectedRenewal.queue_id]
                        ? selectedRenewal.phone_raw
                        : selectedRenewal.phone_masked}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">ทะเบียนรถ:</span>
                    <span className="font-semibold text-slate-800">{selectedRenewal.vehicle_license_plate || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">PDPA Consent:</span>
                    <span className="text-emerald-700 font-semibold">✓ ยินยอม (v_2026_01)</span>
                  </div>
                </div>

                {/* Agent Commission Sacrifice ("Flex") */}
                <div className="bg-blue-50/40 p-3.5 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                      🎯 Agent Flex Sacrifice
                    </span>
                    <span className="text-[11px] text-blue-700 font-mono font-medium">สละค่าคอมฯ เพื่อส่วนลด</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Telesales ปรับลดคอมมิชชันของตนเองเพื่อมอบเป็นส่วนลดสุทธิให้ลูกค้าได้ (จำกัดสูงสุด 5%)
                  </p>

                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 font-medium">อัตราลดคอมมิชชัน:</span>
                      <span className="font-bold text-blue-700">{flexSacrificePercent.toFixed(1)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="0.5"
                      value={flexSacrificePercent}
                      onChange={(e) => setFlexSacrificePercent(parseFloat(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-0.5 font-mono">
                      <span>0.0% (ราคาเต็ม)</span>
                      <span>5.0% (ลดสูงสุด)</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-blue-200 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>เบี้ยเดิมต่ออายุ (Gross):</span>
                      <span className="font-mono text-slate-800">
                        ฿{currentBasePrice.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-rose-600">
                      <span>ส่วนลด Flex ให้ลูกค้า:</span>
                      <span className="font-mono font-semibold">
                        -฿{currentFlexDiscount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-bold text-sm pt-1 border-t border-blue-200">
                      <span>เบี้ยสุทธิที่ลูกค้าชำระ:</span>
                      <span className="text-emerald-700 font-mono">
                        ฿{finalPayableAfterFlex.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 text-right mt-1">
                      คอมมิชชันคงเหลือของเจ้าหน้าที่:{" "}
                      <strong className="text-blue-700 font-bold">{agentNetCommissionRate.toFixed(1)}%</strong>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">เลือกเคสจากรายการด้านซ้ายเพื่อดูข้อมูล</div>
            )}
          </div>

          {/* Action Footer */}
          <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
            <button
              disabled={!selectedRenewal}
              onClick={() =>
                showToast(`ส่งใบเสนอราคา Flex ทาง SMS สำเร็จ ยอดชำระ ฿${finalPayableAfterFlex.toLocaleString("th-TH")}`)
              }
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg shadow-xs transition text-xs flex items-center justify-center space-x-1.5 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              <span>ส่งข้อเสนอ Flex &amp; ลิงก์ชำระเงิน</span>
            </button>
            <button
              onClick={() => showToast("เปิดหน้าต่างบันทึกประวัติการโทร (Interaction Log)")}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs py-2 rounded-lg border border-slate-200 transition font-medium"
            >
              + บันทึกผลการโทร (Call Interaction)
            </button>
          </div>
        </div>
      </main>

      {/* ========================================================= */}
      {/* 4. MODAL: PDPA PII UNMASK DIALOG                          */}
      {/* ========================================================= */}
      {unmaskModalOpen && pendingUnmaskTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center space-x-3 text-amber-600 mb-3">
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h3 className="text-base font-bold text-slate-900">PDPA Compliance: ขอเปิดเผยข้อมูล PII</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              คุณกำลังขอดูข้อมูลอ่อนไหว (เลขประจำตัวประชาชน / เบอร์โทรศัพท์) ของผู้เอาประกัน:{" "}
              <strong className="text-slate-900">{pendingUnmaskTarget.name}</strong>
            </p>
            <p className="text-[11px] text-slate-500 mt-2 bg-slate-50 p-2.5 rounded border border-slate-200">
              การกระทำนี้จะถูกบันทึกอย่างถาวรลงใน{" "}
              <code className="text-blue-700 font-semibold font-mono">audit_logs</code> พร้อม User UUID, IP Address, และ
              Timestamp
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เหตุผลในการขอเปิดเผยข้อมูล (Mandatory Justification):
              </label>
              <select
                value={unmaskReason}
                onChange={(e) => setUnmaskReason(e.target.value as PiiUnmaskReasonCode)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="CUSTOMER_VERIFICATION_CALL">โทรยืนยันตัวตนเพื่อปิดการขาย (Outbound Call)</option>
                <option value="PAYMENT_ASSISTANCE">ช่วยเหลือลูกค้ากรณีชำระเงินไม่ผ่าน</option>
                <option value="DOCUMENT_DELIVERY_ISSUE">ตรวจสอบข้อมูลจัดส่งเอกสารกรมธรรม์</option>
                <option value="CUSTOMER_REQUEST_DIRECT">ลูกค้าร้องขอตรวจสอบรายละเอียดทางโทรศัพท์</option>
              </select>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setUnmaskModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-lg transition font-medium border border-slate-200"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmUnmask}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition shadow-xs"
              >
                ยืนยันการเปิดดูข้อมูล (Log Audit)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TelesalesCockpit;
