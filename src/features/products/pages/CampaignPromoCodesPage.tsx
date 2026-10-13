import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  Edit2,
  Filter,
  Info,
  Plus,
  Search,
  Sparkles,
  Tag,
  TrendingUp,
  X,
  XCircle,
} from "lucide-react";
import React, { useMemo, useState } from "react";

// ============================================================================
// TypeScript Interfaces & Domain Models (BRD Module 6 & 8.5)
// ============================================================================

export type DiscountType = "FIXED_AMOUNT" | "PERCENTAGE";
export type PromoStatus = "ACTIVE" | "SCHEDULED" | "EXPIRED" | "DEPLETED" | "PAUSED";

export interface PromoCodeItem {
  id: string;
  code: string;
  campaignName: string;
  description: string;
  discountType: DiscountType;
  discountValue: number; // e.g. 500 (THB) or 10 (%)
  maxDiscountCap?: number; // Cap for percentage discounts (THB)
  minPremium: number; // e.g. 5000 THB
  maxRedemptions: number; // Global usage cap
  currentRedemptions: number;
  startDate: string; // ISO date YYYY-MM-DD
  endDate: string; // ISO date YYYY-MM-DD
  status: PromoStatus;
  productScope: string[]; // ['MOTOR', 'TRAVEL', 'HEALTH', 'ALL']
  channelScope: string[]; // ['WEBSITE', 'TELESALES', 'DIRECT_SALE']
  budgetCode: string;
  expenseModel: "CORPORATE_ABSORBED" | "AGENT_SACRIFICE";
  createdAt: string;
}

export interface SeasonalProduct {
  id: string;
  productCode: string;
  productName: string;
  insurerName: string;
  lob: "MOTOR" | "TRAVEL" | "HEALTH" | "FIRE" | "LIFE";
  salesStartDate: string;
  salesEndDate: string;
  status: "ACTIVE" | "SCHEDULED" | "EXPIRED";
  isPromoEligible: boolean;
}

// ============================================================================
// Mock Data (Aligned with BRD Specifications)
// ============================================================================

const INITIAL_PROMO_CODES: PromoCodeItem[] = [
  {
    id: "promo-001",
    code: "SUMMER2026",
    campaignName: "Songkran Festive Road-Trip Special",
    description: "Flat ฿500 discount for Motor Voluntary Type 1 & 2+ packages.",
    discountType: "FIXED_AMOUNT",
    discountValue: 500,
    minPremium: 7500,
    maxRedemptions: 1500,
    currentRedemptions: 842,
    startDate: "2026-03-15",
    endDate: "2026-05-15",
    status: "ACTIVE",
    productScope: ["MOTOR"],
    channelScope: ["WEBSITE", "TELESALES"],
    budgetCode: "MKT-2026-Q2-MOTOR",
    expenseModel: "CORPORATE_ABSORBED",
    createdAt: "2026-03-01",
  },
  {
    id: "promo-002",
    code: "TRAVELSAFE15",
    campaignName: "MSIG Global Travel 15% Kickoff",
    description: "15% instant savings on MSIG Travel Easy single and annual policies.",
    discountType: "PERCENTAGE",
    discountValue: 15,
    maxDiscountCap: 1200,
    minPremium: 1000,
    maxRedemptions: 3000,
    currentRedemptions: 1940,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    status: "ACTIVE",
    productScope: ["TRAVEL"],
    channelScope: ["WEBSITE"],
    budgetCode: "MKT-2026-ANNUAL-TRV",
    expenseModel: "CORPORATE_ABSORBED",
    createdAt: "2025-12-20",
  },
  {
    id: "promo-003",
    code: "HEALTHBOOST",
    campaignName: "New Year Health Wellness Launch",
    description: "Special ฿1,000 corporate rebate on approved health insurance tiers.",
    discountType: "FIXED_AMOUNT",
    discountValue: 1000,
    minPremium: 15000,
    maxRedemptions: 500,
    currentRedemptions: 500,
    startDate: "2026-01-01",
    endDate: "2026-02-28",
    status: "DEPLETED",
    productScope: ["HEALTH"],
    channelScope: ["WEBSITE", "TELESALES", "DIRECT_SALE"],
    budgetCode: "MKT-2026-Q1-HLTH",
    expenseModel: "CORPORATE_ABSORBED",
    createdAt: "2025-12-15",
  },
  {
    id: "promo-004",
    code: "MIDYEAR2026",
    campaignName: "Mid-Year Flash Campaign",
    description: "10% off across all consumer personal accident and fire policies.",
    discountType: "PERCENTAGE",
    discountValue: 10,
    maxDiscountCap: 2000,
    minPremium: 3000,
    maxRedemptions: 2000,
    currentRedemptions: 0,
    startDate: "2026-06-01",
    endDate: "2026-06-30",
    status: "SCHEDULED",
    productScope: ["FIRE", "TRAVEL"],
    channelScope: ["WEBSITE", "TELESALES"],
    budgetCode: "MKT-2026-Q2-MID",
    expenseModel: "CORPORATE_ABSORBED",
    createdAt: "2026-04-10",
  },
  {
    id: "promo-005",
    code: "WELCOME200",
    campaignName: "First-time Buyer Onboarding Voucher",
    description: "฿200 voucher for newly registered leads converting to policyholders.",
    discountType: "FIXED_AMOUNT",
    discountValue: 200,
    minPremium: 2000,
    maxRedemptions: 5000,
    currentRedemptions: 4310,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    status: "ACTIVE",
    productScope: ["ALL"],
    channelScope: ["WEBSITE"],
    budgetCode: "MKT-2026-GROWTH",
    expenseModel: "CORPORATE_ABSORBED",
    createdAt: "2026-01-01",
  },
];

const INITIAL_SEASONAL_PRODUCTS: SeasonalProduct[] = [
  {
    id: "prod-001",
    productCode: "MSIG-TRV-2026",
    productName: "MSIG Travel Easy Worldwide",
    insurerName: "MSIG Insurance",
    lob: "TRAVEL",
    salesStartDate: "2026-01-01",
    salesEndDate: "2026-12-31",
    status: "ACTIVE",
    isPromoEligible: true,
  },
  {
    id: "prod-002",
    productCode: "VIRIYAH-M1-GOLD",
    productName: "Viriyah Motor Type 1 Premium",
    insurerName: "Viriyah Insurance",
    lob: "MOTOR",
    salesStartDate: "2026-01-01",
    salesEndDate: "2026-10-31",
    status: "ACTIVE",
    isPromoEligible: true,
  },
  {
    id: "prod-003",
    productCode: "AIA-NY-SPECIAL",
    productName: "New Year Special Medical Cover",
    insurerName: "AIA Thailand",
    lob: "HEALTH",
    salesStartDate: "2026-01-01",
    salesEndDate: "2026-01-31",
    status: "EXPIRED",
    isPromoEligible: false,
  },
  {
    id: "prod-004",
    productCode: "BKI-SONGKRAN-PA",
    productName: "Bangkok Insurance Safe Holiday PA",
    insurerName: "Bangkok Insurance",
    lob: "TRAVEL",
    salesStartDate: "2026-04-01",
    salesEndDate: "2026-05-15",
    status: "ACTIVE",
    isPromoEligible: true,
  },
  {
    id: "prod-005",
    productCode: "DIP-MIDYEAR-PROP",
    productName: "Dhipaya All Risks Residential Fire",
    insurerName: "Dhipaya Insurance",
    lob: "FIRE",
    salesStartDate: "2026-06-01",
    salesEndDate: "2026-08-31",
    status: "SCHEDULED",
    isPromoEligible: true,
  },
];

// ============================================================================
// Main Component
// ============================================================================

export const CampaignPromoCodesPage: React.FC = () => {
  // Navigation & Sub-tab View State
  const [activeTab, setActiveTab] = useState<"PROMO_CODES" | "SEASONAL_GANTT" | "SANDBOX_VALIDATE">("PROMO_CODES");

  // Promo Codes State
  const [promoCodes, setPromoCodes] = useState<PromoCodeItem[]>(INITIAL_PROMO_CODES);
  const [seasonalProducts] = useState<SeasonalProduct[]>(INITIAL_SEASONAL_PRODUCTS);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedLob, setSelectedLob] = useState<string>("ALL");

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Validation Sandbox State (POST /quotes/validate-promo simulator)
  const [testCodeInput, setTestCodeInput] = useState("SUMMER2026");
  const [testPremiumInput, setTestPremiumInput] = useState("12000");
  const [testLobInput, setTestLobInput] = useState("MOTOR");
  const [testChannelInput, setTestChannelInput] = useState("WEBSITE");
  const [testValidationResult, setTestValidationResult] = useState<{
    isValid: boolean;
    discountAmount: number;
    finalPremium: number;
    message: string;
    details?: any;
  } | null>(null);

  // New Promo Code Form State
  const [newPromoForm, setNewPromoForm] = useState<Partial<PromoCodeItem>>({
    code: "",
    campaignName: "",
    description: "",
    discountType: "FIXED_AMOUNT",
    discountValue: 500,
    minPremium: 3000,
    maxRedemptions: 1000,
    maxDiscountCap: 1500,
    startDate: "2026-06-01",
    endDate: "2026-08-31",
    productScope: ["MOTOR"],
    channelScope: ["WEBSITE", "TELESALES"],
    budgetCode: "MKT-2026-Q3-PROMO",
    expenseModel: "CORPORATE_ABSORBED",
  });

  // Copy Code Helper
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filtered Codes
  const filteredPromoCodes = useMemo(() => {
    return promoCodes.filter((item) => {
      const matchesSearch =
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.campaignName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.budgetCode.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatus === "ALL" || item.status === selectedStatus;
      const matchesType = selectedType === "ALL" || item.discountType === selectedType;
      const matchesLob =
        selectedLob === "ALL" || item.productScope.includes("ALL") || item.productScope.includes(selectedLob);

      return matchesSearch && matchesStatus && matchesType && matchesLob;
    });
  }, [promoCodes, searchQuery, selectedStatus, selectedType, selectedLob]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalActive = promoCodes.filter((c) => c.status === "ACTIVE").length;
    const totalRedemptions = promoCodes.reduce((acc, c) => acc + c.currentRedemptions, 0);
    const estimatedAbsorption = promoCodes.reduce((acc, c) => {
      if (c.discountType === "FIXED_AMOUNT") {
        return acc + c.discountValue * c.currentRedemptions;
      }
      return acc + (c.maxDiscountCap || 800) * 0.7 * c.currentRedemptions;
    }, 0);
    const scheduled = promoCodes.filter((c) => c.status === "SCHEDULED").length;

    return { totalActive, totalRedemptions, estimatedAbsorption, scheduled };
  }, [promoCodes]);

  // Handle Create Submit
  const handleCreatePromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoForm.code || !newPromoForm.campaignName) return;

    const newCodeItem: PromoCodeItem = {
      id: `promo-${Date.now()}`,
      code: newPromoForm.code.toUpperCase().trim(),
      campaignName: newPromoForm.campaignName,
      description: newPromoForm.description || "",
      discountType: newPromoForm.discountType || "FIXED_AMOUNT",
      discountValue: Number(newPromoForm.discountValue) || 0,
      maxDiscountCap: newPromoForm.maxDiscountCap ? Number(newPromoForm.maxDiscountCap) : undefined,
      minPremium: Number(newPromoForm.minPremium) || 0,
      maxRedemptions: Number(newPromoForm.maxRedemptions) || 100,
      currentRedemptions: 0,
      startDate: newPromoForm.startDate || "2026-06-01",
      endDate: newPromoForm.endDate || "2026-08-31",
      status: "ACTIVE",
      productScope: newPromoForm.productScope || ["ALL"],
      channelScope: newPromoForm.channelScope || ["WEBSITE"],
      budgetCode: newPromoForm.budgetCode || "MKT-GEN",
      expenseModel: "CORPORATE_ABSORBED",
      createdAt: new Date().toISOString().split("T")[0],
    };

    setPromoCodes([newCodeItem, ...promoCodes]);
    setIsCreateModalOpen(false);
    setNewPromoForm({
      code: "",
      campaignName: "",
      description: "",
      discountType: "FIXED_AMOUNT",
      discountValue: 500,
      minPremium: 3000,
      maxRedemptions: 1000,
      startDate: "2026-06-01",
      endDate: "2026-08-31",
      productScope: ["MOTOR"],
      channelScope: ["WEBSITE"],
    });
  };

  // Run Sandbox Pre-Calculation Validator
  const handleRunValidationTester = () => {
    const codeObj = promoCodes.find((c) => c.code === testCodeInput.toUpperCase().trim());
    const premium = parseFloat(testPremiumInput) || 0;

    if (!codeObj) {
      setTestValidationResult({
        isValid: false,
        discountAmount: 0,
        finalPremium: premium,
        message: "ERR_INVALID_CODE: Promo code does not exist in master catalog.",
      });
      return;
    }

    if (codeObj.status !== "ACTIVE") {
      setTestValidationResult({
        isValid: false,
        discountAmount: 0,
        finalPremium: premium,
        message: `ERR_CODE_INACTIVE: Promo code is currently in ${codeObj.status} state.`,
      });
      return;
    }

    if (premium < codeObj.minPremium) {
      setTestValidationResult({
        isValid: false,
        discountAmount: 0,
        finalPremium: premium,
        message: `ERR_MIN_PREMIUM_NOT_MET: Minimum base premium must be at least ฿${codeObj.minPremium.toLocaleString()}. Current is ฿${premium.toLocaleString()}.`,
      });
      return;
    }

    if (!codeObj.productScope.includes("ALL") && !codeObj.productScope.includes(testLobInput)) {
      setTestValidationResult({
        isValid: false,
        discountAmount: 0,
        finalPremium: premium,
        message: `ERR_PRODUCT_SCOPE_MISMATCH: Code is restricted to [${codeObj.productScope.join(", ")}]. Selected LOB is [${testLobInput}].`,
      });
      return;
    }

    if (!codeObj.channelScope.includes(testChannelInput)) {
      setTestValidationResult({
        isValid: false,
        discountAmount: 0,
        finalPremium: premium,
        message: `ERR_CHANNEL_UNAUTHORIZED: Code is not applicable to [${testChannelInput}] channel. Allowed: [${codeObj.channelScope.join(", ")}].`,
      });
      return;
    }

    if (codeObj.currentRedemptions >= codeObj.maxRedemptions) {
      setTestValidationResult({
        isValid: false,
        discountAmount: 0,
        finalPremium: premium,
        message: "ERR_REDEMPTION_LIMIT_EXCEEDED: Global redemption threshold has been depleted.",
      });
      return;
    }

    // Success calculation
    let calculatedDiscount = 0;
    if (codeObj.discountType === "FIXED_AMOUNT") {
      calculatedDiscount = Math.min(codeObj.discountValue, premium);
    } else {
      calculatedDiscount = (premium * codeObj.discountValue) / 100;
      if (codeObj.maxDiscountCap) {
        calculatedDiscount = Math.min(calculatedDiscount, codeObj.maxDiscountCap);
      }
    }

    const netPayable = Math.max(0, premium - calculatedDiscount);

    setTestValidationResult({
      isValid: true,
      discountAmount: calculatedDiscount,
      finalPremium: netPayable,
      message: "SUCCESS: Promo code successfully applied. Broker marketing ledger will absorb discount.",
      details: {
        code: codeObj.code,
        discountType: codeObj.discountType,
        ruleTriggered:
          codeObj.discountType === "FIXED_AMOUNT"
            ? `Fixed ฿${codeObj.discountValue}`
            : `${codeObj.discountValue}% (Capped ฿${codeObj.maxDiscountCap || "N/A"})`,
        brokerExpenseAbsorbed: calculatedDiscount,
        agentCommissionBasis: "FULL_PREMIUM_PROTECTED (Before discount)",
      },
    });
  };

  return (
    // Note: -mt-6 -mx-6 pt-0 ensures no redundant top padding against the AdminLayout container
    <div className="-mt-6 -mx-6 pt-0 px-6 pb-12 min-h-screen bg-zinc-50 text-zinc-900">
      {/* ==================================================================== */}
      {/* Top Banner / Navigation Header */}
      {/* ==================================================================== */}
      <div className="bg-white border-b border-zinc-200 -mx-6 px-6 pt-6 pb-5 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">
              <Sparkles className="w-4 h-4" />
              Module 6.3 • Campaign & Discount Governance
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Campaigns & Promo Codes</h1>
            <p className="text-sm text-zinc-500 mt-1 max-w-2xl">
              Configure corporate discount codes (Type A marketing expenses), enforce redemption caps, and coordinate
              time-boxed seasonal visibility across external sales channels.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Promo Code
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="max-w-7xl mx-auto flex items-center gap-2 mt-6 border-b border-zinc-200">
          <button
            onClick={() => setActiveTab("PROMO_CODES")}
            className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "PROMO_CODES"
                ? "border-indigo-600 text-indigo-600 font-semibold"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Tag className="w-4 h-4" />
            Promo Codes & Discounts
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-zinc-100 text-zinc-700 font-normal">
              {promoCodes.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("SEASONAL_GANTT")}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "SEASONAL_GANTT"
                ? "border-indigo-600 text-indigo-600 font-semibold"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Seasonal Visibility Scheduler (Screen 8.5.2)
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 font-normal">
              Live APIs
            </span>
          </button>

          <button
            onClick={() => setActiveTab("SANDBOX_VALIDATE")}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "SANDBOX_VALIDATE"
                ? "border-indigo-600 text-indigo-600 font-semibold"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Pre-Calc API Simulator (POST /validate-promo)
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-6">
        {/* ================================================================== */}
        {/* KPI Summary Cards */}
        {/* ================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">Active Codes</span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Tag className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-zinc-900">{metrics.totalActive}</span>
              <span className="text-xs text-emerald-600 font-medium">Valid on Storefronts</span>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">Total Redemptions</span>
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-zinc-900">{metrics.totalRedemptions.toLocaleString()}</span>
              <span className="text-xs text-zinc-500 font-medium">orders checked out</span>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Broker Expense Absorbed
              </span>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-zinc-900">฿{metrics.estimatedAbsorption.toLocaleString()}</span>
              <span className="text-xs text-zinc-500 font-medium">Type A Budget</span>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">Scheduled / Future</span>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-zinc-900">{metrics.scheduled}</span>
              <span className="text-xs text-blue-600 font-medium">Awaiting Start Date</span>
            </div>
          </div>
        </div>

        {/* Regulatory & Domain Reminder Card (BRD Section 7.1 & 7.4) */}
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <p className="font-semibold text-sm">
              Architecture Notice: Corporate Promo Codes (Type A) vs. Sub-Agent Flex (Type B)
            </p>
            <p className="text-amber-800">
              Per <strong>BRD Section 7.1.2 &amp; 7.4.5</strong>, public promo codes listed here apply strictly to{" "}
              <strong>Online STP (Website)</strong> and <strong>Telesales</strong> channels. The broker absorbs the
              discount as a marketing expense, and agent commissions are protected against the full gross price.
              External Sub-Agents <em>cannot</em> redeem corporate promo codes; they must instead utilize{" "}
              <strong>Commission Sacrifice (Agent Flex)</strong> to discount client quotations.
            </p>
          </div>
        </div>

        {/* ================================================================== */}
        {/* TAB 1: PROMO CODES LIST VIEW (SCREEN 8.5.1) */}
        {/* ================================================================== */}
        {activeTab === "PROMO_CODES" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search code, campaign, budget..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 mr-1">
                  <Filter className="w-3.5 h-3.5" />
                  Filters:
                </div>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="DEPLETED">Depleted</option>
                  <option value="EXPIRED">Expired</option>
                </select>

                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Types</option>
                  <option value="FIXED_AMOUNT">Fixed THB (-฿500)</option>
                  <option value="PERCENTAGE">Percentage (-10%)</option>
                </select>

                <select
                  value={selectedLob}
                  onChange={(e) => setSelectedLob(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Products (LOB)</option>
                  <option value="MOTOR">Motor Insurance</option>
                  <option value="TRAVEL">Travel Insurance</option>
                  <option value="HEALTH">Health &amp; PA</option>
                  <option value="FIRE">Fire &amp; Property</option>
                </select>

                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedStatus("ALL");
                    setSelectedType("ALL");
                    setSelectedLob("ALL");
                  }}
                  className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Promo Codes Table */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/80 border-b border-zinc-200 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Code &amp; Campaign</th>
                      <th className="py-3 px-4">Discount Structure</th>
                      <th className="py-3 px-4">Constraints (Min. / Scope)</th>
                      <th className="py-3 px-4">Redemption Progress</th>
                      <th className="py-3 px-4">Validity Timeline</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 text-xs">
                    {filteredPromoCodes.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-zinc-500">
                          <Tag className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                          No promotional codes found matching current filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredPromoCodes.map((item) => {
                        const usageRatio = (item.currentRedemptions / item.maxRedemptions) * 100;
                        return (
                          <tr key={item.id} className="hover:bg-zinc-50/70 transition-colors">
                            {/* Code & Campaign Info */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded tracking-wide">
                                  {item.code}
                                </span>
                                <button
                                  onClick={() => handleCopyCode(item.code)}
                                  title="Copy promo code"
                                  className="text-zinc-400 hover:text-zinc-600 transition-colors"
                                >
                                  {copiedCode === item.code ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                              <div className="font-medium text-zinc-900 mt-1">{item.campaignName}</div>
                              <div className="text-[11px] text-zinc-500 line-clamp-1">{item.description}</div>
                              <div className="text-[10px] text-zinc-400 mt-0.5">Budget: {item.budgetCode}</div>
                            </td>

                            {/* Discount Type & Value */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5 font-semibold text-zinc-900">
                                {item.discountType === "FIXED_AMOUNT" ? (
                                  <>
                                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs font-bold">
                                      -฿{item.discountValue.toLocaleString()}
                                    </span>
                                    <span className="text-[11px] text-zinc-500">Fixed</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs font-bold">
                                      -{item.discountValue}%
                                    </span>
                                    <span className="text-[11px] text-zinc-500">
                                      {item.maxDiscountCap
                                        ? `Cap: ฿${item.maxDiscountCap.toLocaleString()}`
                                        : "Uncapped"}
                                    </span>
                                  </>
                                )}
                              </div>
                              <div className="text-[11px] text-zinc-500 mt-1">
                                {item.expenseModel === "CORPORATE_ABSORBED"
                                  ? "Corporate Marketing Expense"
                                  : "Agent Flex"}
                              </div>
                            </td>

                            {/* Constraints & Product Scope */}
                            <td className="py-3.5 px-4 space-y-1">
                              <div className="text-zinc-700">
                                <span className="font-medium">Min. Premium:</span> ฿{item.minPremium.toLocaleString()}
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {item.productScope.map((sc) => (
                                  <span
                                    key={sc}
                                    className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-zinc-100 text-zinc-600 border border-zinc-200"
                                  >
                                    {sc}
                                  </span>
                                ))}
                              </div>
                              <div className="text-[10px] text-zinc-400">Channels: {item.channelScope.join(", ")}</div>
                            </td>

                            {/* Redemptions Progress Bar */}
                            <td className="py-3.5 px-4">
                              <div className="flex justify-between items-center text-[11px] mb-1 font-medium text-zinc-700">
                                <span>{item.currentRedemptions.toLocaleString()} used</span>
                                <span className="text-zinc-500">max {item.maxRedemptions.toLocaleString()}</span>
                              </div>
                              <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    usageRatio >= 100
                                      ? "bg-rose-500"
                                      : usageRatio > 75
                                        ? "bg-amber-500"
                                        : "bg-indigo-600"
                                  }`}
                                  style={{ width: `${Math.min(100, usageRatio)}%` }}
                                />
                              </div>
                              <div className="text-[10px] text-zinc-400 mt-1 text-right">
                                {usageRatio.toFixed(1)}% depleted
                              </div>
                            </td>

                            {/* Validity Window */}
                            <td className="py-3.5 px-4">
                              <div className="text-zinc-800 font-medium flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                                {item.startDate}
                              </div>
                              <div className="text-zinc-500 text-[11px] pl-4">to {item.endDate}</div>
                            </td>

                            {/* Status Badge */}
                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                                  item.status === "ACTIVE"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : item.status === "SCHEDULED"
                                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                                      : item.status === "DEPLETED"
                                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                                        : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                                }`}
                              >
                                {item.status === "ACTIVE" && <CheckCircle2 className="w-3 h-3" />}
                                {item.status === "SCHEDULED" && <Clock className="w-3 h-3" />}
                                {item.status === "DEPLETED" && <AlertTriangle className="w-3 h-3" />}
                                {item.status === "EXPIRED" && <XCircle className="w-3 h-3" />}
                                {item.status}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  title="Edit Promo Parameters"
                                  className="p-1 text-zinc-400 hover:text-indigo-600 hover:bg-zinc-100 rounded transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  title="Toggle Status / Pause"
                                  onClick={() => {
                                    setPromoCodes(
                                      promoCodes.map((p) =>
                                        p.id === item.id
                                          ? { ...p, status: p.status === "ACTIVE" ? "PAUSED" : "ACTIVE" }
                                          : p,
                                      ),
                                    );
                                  }}
                                  className="p-1 text-zinc-400 hover:text-amber-600 hover:bg-zinc-100 rounded transition-colors"
                                >
                                  <Clock className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
                <span>
                  Showing <strong>{filteredPromoCodes.length}</strong> of <strong>{promoCodes.length}</strong> campaigns
                </span>
                <span className="text-[11px] text-zinc-400">
                  Enforces Maker-Checker logic on discount value changes &gt; 25% (GOV-02)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 2: SEASONAL VISIBILITY SCHEDULER (SCREEN 8.5.2) */}
        {/* ================================================================== */}
        {activeTab === "SEASONAL_GANTT" && (
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200">
              <div>
                <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  Product Catalog Seasonal Visibility Engine (Screen 8.5.2)
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Visualizes <code>sales_start_date</code> and <code>sales_end_date</code> bounds stored in
                  <code>product_versions</code> and <code>plan_versions</code>. Live storefront APIs automatically hide
                  products when expired without manual DB deletion.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-zinc-700">Timeline Year:</span>
                <span className="px-2.5 py-1 rounded bg-zinc-100 border border-zinc-200 font-mono font-bold text-zinc-800">
                  2026 (Live Calendar)
                </span>
              </div>
            </div>

            {/* Gantt / Timeline Grid Visualizer */}
            <div className="space-y-4">
              {/* Month Header Bar */}
              <div className="grid grid-cols-12 gap-1 text-[11px] font-semibold text-zinc-500 text-center uppercase bg-zinc-50 py-2 px-3 rounded-lg border border-zinc-200">
                <div>Jan</div>
                <div>Feb</div>
                <div>Mar</div>
                <div>Apr</div>
                <div>May</div>
                <div>Jun</div>
                <div>Jul</div>
                <div>Aug</div>
                <div>Sep</div>
                <div>Oct</div>
                <div>Nov</div>
                <div>Dec</div>
              </div>

              {/* Rows */}
              <div className="space-y-3">
                {seasonalProducts.map((prod) => {
                  // Approximate month index from dates (for visualization)
                  const startMonth = parseInt(prod.salesStartDate.split("-")[1], 10) - 1;
                  const endMonth = parseInt(prod.salesEndDate.split("-")[1], 10) - 1;
                  const span = Math.max(1, endMonth - startMonth + 1);

                  return (
                    <div
                      key={prod.id}
                      className="p-3 bg-zinc-50/60 hover:bg-zinc-50 rounded-xl border border-zinc-200 transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-zinc-800">{prod.productCode}</span>
                          <span className="text-zinc-600 font-medium">• {prod.productName}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-200 text-zinc-700">
                            {prod.lob}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-zinc-500 text-[11px]">
                          <span>
                            Carrier: <strong>{prod.insurerName}</strong>
                          </span>
                          <span>
                            Window: {prod.salesStartDate} &rarr; {prod.salesEndDate}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              prod.status === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-800"
                                : prod.status === "SCHEDULED"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-zinc-200 text-zinc-600"
                            }`}
                          >
                            {prod.status}
                          </span>
                        </div>
                      </div>

                      {/* Bar Representation */}
                      <div className="grid grid-cols-12 gap-1 h-6 bg-white border border-zinc-200 rounded p-0.5 relative">
                        <div
                          className={`h-full rounded text-[10px] font-medium flex items-center px-2 text-white shadow-xs ${
                            prod.status === "ACTIVE"
                              ? "bg-gradient-to-r from-emerald-500 to-teal-600"
                              : prod.status === "SCHEDULED"
                                ? "bg-gradient-to-r from-blue-500 to-indigo-600"
                                : "bg-zinc-400"
                          }`}
                          style={{
                            gridColumnStart: startMonth + 1,
                            gridColumnEnd: `span ${span}`,
                          }}
                        >
                          <span className="truncate">
                            {prod.isPromoEligible ? "Promo Eligible ✓" : "Standard Pricing"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explanatory footer */}
            <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-zinc-900">Automation Rule (BRD 7.1.1): </span>
                When a seasonal product’s <code>effective_end_date</code> passes midnight Bangkok time (+07:00), the
                core API automatically stops returning the product version to the frontend, eliminating the risk of
                selling out-of-season coverage.
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 3: PRE-CALCULATION & VALIDATION SANDBOX (BRD 3.3.3) */}
        {/* ================================================================== */}
        {activeTab === "SANDBOX_VALIDATE" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Input Box */}
            <div className="lg:col-span-6 bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
              <div className="border-b border-zinc-200 pb-3">
                <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  Promo Pre-Calculation Sandbox
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Tests payload against the <code>POST /quotes/validate-promo</code> API endpoint contract to verify
                  mathematical deduction and eligibility constraints before checkout.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Promo Code Identifier</label>
                  <input
                    type="text"
                    value={testCodeInput}
                    onChange={(e) => setTestCodeInput(e.target.value)}
                    placeholder="e.g. SUMMER2026"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg font-mono font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Base Premium Amount (THB)</label>
                  <input
                    type="number"
                    value={testPremiumInput}
                    onChange={(e) => setTestPremiumInput(e.target.value)}
                    placeholder="12000"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">Line of Business (LOB)</label>
                    <select
                      value={testLobInput}
                      onChange={(e) => setTestLobInput(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="MOTOR">Motor Insurance</option>
                      <option value="TRAVEL">Travel Insurance</option>
                      <option value="HEALTH">Health Insurance</option>
                      <option value="FIRE">Fire &amp; Property</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">Requesting Channel</label>
                    <select
                      value={testChannelInput}
                      onChange={(e) => setTestChannelInput(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="WEBSITE">Website (Online STP)</option>
                      <option value="TELESALES">Telesales (Inbound/Outbound)</option>
                      <option value="DIRECT_SALE">Direct Sale (Walk-in)</option>
                      <option value="SUB_AGENT">Sub-Agent (External)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleRunValidationTester}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Simulate Validation Request
                  </button>
                </div>
              </div>
            </div>

            {/* Validation Outcome Display */}
            <div className="lg:col-span-6 bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="border-b border-zinc-200 pb-3 flex items-center justify-between">
                  <h3 className="text-base font-bold text-zinc-900">API Response Simulation</h3>
                  <span className="text-[11px] font-mono text-zinc-400">Status 200 OK</span>
                </div>

                {testValidationResult ? (
                  <div className="mt-4 space-y-4">
                    <div
                      className={`p-4 rounded-xl border flex items-start gap-3 ${
                        testValidationResult.isValid
                          ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                          : "bg-rose-50 border-rose-200 text-rose-900"
                      }`}
                    >
                      {testValidationResult.isValid ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div className="text-xs">
                        <div className="font-bold text-sm">
                          {testValidationResult.isValid ? "Validation Succeeded" : "Validation Breached"}
                        </div>
                        <p className="mt-0.5 opacity-90">{testValidationResult.message}</p>
                      </div>
                    </div>

                    {testValidationResult.isValid && (
                      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-zinc-200">
                          <span className="text-zinc-500">Gross Initial Premium:</span>
                          <span className="font-semibold text-zinc-800">
                            ฿{parseFloat(testPremiumInput || "0").toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-zinc-200 text-emerald-700">
                          <span className="font-medium">Applied Promotional Deduction:</span>
                          <span className="font-bold">-฿{testValidationResult.discountAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-1 text-sm font-bold text-zinc-900 pt-1">
                          <span>Net Customer Payable:</span>
                          <span>฿{testValidationResult.finalPremium.toLocaleString()}</span>
                        </div>

                        {testValidationResult.details && (
                          <div className="mt-3 pt-3 border-t border-zinc-200 text-[11px] text-zinc-500 space-y-1">
                            <div>Rule Executed: {testValidationResult.details.ruleTriggered}</div>
                            <div>Commission Basis: {testValidationResult.details.agentCommissionBasis}</div>
                            <div>Cost Allocation: Type A Broker Marketing Reserve</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-12 text-center text-zinc-400 text-xs">
                    <Info className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                    Configure parameters on the left and click "Simulate Validation Request" to test discount logic.
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-200 text-[11px] text-zinc-400">
                Matches JSON response envelope specified in BRD Section 3.1.4.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* CREATE PROMO CODE MODAL (SCREEN 8.5.1) */}
      {/* ==================================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-zinc-900">Create Promotional Campaign Code</h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg hover:bg-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreatePromoCode} className="p-6 space-y-4 text-xs">
              {/* Row 1: Code and Campaign Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Promo Code (Uppercase)*</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AUTUMN500"
                    value={newPromoForm.code || ""}
                    onChange={(e) => setNewPromoForm({ ...newPromoForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg font-mono font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Campaign Title*</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Autumn Road Trip Discount"
                    value={newPromoForm.campaignName || ""}
                    onChange={(e) => setNewPromoForm({ ...newPromoForm, campaignName: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Row 2: Description */}
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Terms summary displayed to customer / agents..."
                  value={newPromoForm.description || ""}
                  onChange={(e) => setNewPromoForm({ ...newPromoForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Row 3: Discount Type and Value */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Discount Type</label>
                  <select
                    value={newPromoForm.discountType}
                    onChange={(e) =>
                      setNewPromoForm({
                        ...newPromoForm,
                        discountType: e.target.value as DiscountType,
                      })
                    }
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="FIXED_AMOUNT">Fixed Amount (THB)</option>
                    <option value="PERCENTAGE">Percentage (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Value {newPromoForm.discountType === "FIXED_AMOUNT" ? "(THB)" : "(%)"}*
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newPromoForm.discountValue || ""}
                    onChange={(e) => setNewPromoForm({ ...newPromoForm, discountValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Max Cap (THB) {newPromoForm.discountType === "PERCENTAGE" ? "*" : "(Optional)"}
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1500"
                    value={newPromoForm.maxDiscountCap || ""}
                    onChange={(e) => setNewPromoForm({ ...newPromoForm, maxDiscountCap: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Row 4: Minimum Premium & Usage Limit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Minimum Premium Required (THB)</label>
                  <input
                    type="number"
                    min={0}
                    value={newPromoForm.minPremium || ""}
                    onChange={(e) => setNewPromoForm({ ...newPromoForm, minPremium: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Total Max Redemptions Cap*</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newPromoForm.maxRedemptions || ""}
                    onChange={(e) => setNewPromoForm({ ...newPromoForm, maxRedemptions: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Row 5: Validity Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newPromoForm.startDate || ""}
                    onChange={(e) => setNewPromoForm({ ...newPromoForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={newPromoForm.endDate || ""}
                    onChange={(e) => setNewPromoForm({ ...newPromoForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Row 6: Scope Restrictions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Applicable Product Scope</label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {["MOTOR", "TRAVEL", "HEALTH", "FIRE", "ALL"].map((lob) => {
                      const isSelected = newPromoForm.productScope?.includes(lob);
                      return (
                        <button
                          key={lob}
                          type="button"
                          onClick={() => {
                            if (lob === "ALL") {
                              setNewPromoForm({ ...newPromoForm, productScope: ["ALL"] });
                            } else {
                              const current = (newPromoForm.productScope || []).filter((x) => x !== "ALL");
                              const next = isSelected ? current.filter((x) => x !== lob) : [...current, lob];
                              setNewPromoForm({ ...newPromoForm, productScope: next.length ? next : ["ALL"] });
                            }
                          }}
                          className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
                            isSelected
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
                          }`}
                        >
                          {lob}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Allowed Sales Channels</label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {["WEBSITE", "TELESALES", "DIRECT_SALE"].map((ch) => {
                      const isSelected = newPromoForm.channelScope?.includes(ch);
                      return (
                        <button
                          key={ch}
                          type="button"
                          onClick={() => {
                            const current = newPromoForm.channelScope || [];
                            const next = isSelected ? current.filter((x) => x !== ch) : [...current, ch];
                            setNewPromoForm({ ...newPromoForm, channelScope: next });
                          }}
                          className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
                            isSelected
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
                          }`}
                        >
                          {ch}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Marketing Budget Attribution Note */}
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-zinc-600 text-[11px] flex items-center justify-between">
                <span>
                  Expense Classification: <strong>Corporate Marketing Overhead (Type A)</strong>
                </span>
                <span className="text-zinc-400">Agent Commission Basis: 100% Protected</span>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-zinc-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-zinc-600 hover:text-zinc-800 text-xs font-semibold hover:bg-zinc-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Save &amp; Activate Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignPromoCodesPage;
