import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Copy,
  CreditCard,
  DollarSign,
  HelpCircle,
  Layers,
  Percent,
  Plus,
  ShieldCheck,
  Sliders,
  Trash2,
} from "lucide-react";
import React, { useState } from "react";

// ==========================================
// TYPE DEFINITIONS & SCHEMAS (SDD Module 1 & Database 4.4)
// ==========================================

export type VersionStatus = "DRAFT" | "ACTIVE" | "SCHEDULED" | "ARCHIVED";
export type PayeeType = "BROKER" | "INSURER" | "THIRD_PARTY";
export type PaymentTiming = "BEFORE_ISSUANCE" | "AFTER_ISSUANCE";
export type DeductType = "FIXED_AMOUNT" | "PERCENTAGE" | "PER_CLAIM" | "PER_YEAR";

export interface InstallmentConfig {
  duration_months: number;
  interest_rate_percent: number;
  first_month_percent: number;
  supported_banks: string[];
}

export interface PaymentConfig {
  payee_type: PayeeType;
  third_party_id?: number | null;
  insurer_bank_account?: string;
  allowed_payment_methods: ("CASH" | "CREDIT_CARD")[];
  allowed_payment_terms: ("SINGLE" | "INSTALLMENT")[];
  payment_timing: PaymentTiming;
  insurer_credit_term_id?: number;
  installment_config: InstallmentConfig;
}

export interface AgentFlexConfig {
  base_insurer_commission_percent: number;
  is_flex_allowed: boolean;
  max_commission_sacrifice_percent: number;
}

export interface PlanBenefitVersion {
  benefit_id: string;
  benefit_code: string;
  coverage_group: string;
  coverage_name: string;
  limit_type: "FIXED_AMOUNT" | "DYNAMIC_REDBOOK";
  limit_amount: number;
}

export interface ReferRequirementItem {
  field_id: string;
  type: "FILE_UPLOAD" | "TEXT_INPUT" | "BOOLEAN";
  label: string;
  required: boolean;
}

export interface PlanRuleOverride {
  rule_id: string;
  target_field: string;
  operator: string;
  threshold_value: string;
  enforcement_action: "REJECT" | "REFER" | "LOADING";
  loading_percent?: number;
}

export interface PlanVersion {
  plan_id: string;
  version_id: string;
  plan_code: string;
  name: string;
  status: VersionStatus;
  base_premium: number;
  deductible_amount: number;
  deduct_type: DeductType;
  mandatory_excess_amount: number;
  is_promo_code_eligible: boolean;

  // Inheritance Overrides (NULL = Inherit from Product Level)
  inherit_settlement_rules: boolean;
  override_payee_type?: PayeeType;
  override_payment_timing?: PaymentTiming;
  override_base_commission_percent?: number;

  payment_config: PaymentConfig;
  agent_flex_config: AgentFlexConfig;
  coverages: PlanBenefitVersion[];
  refer_template_requirements: ReferRequirementItem[];
  rule_overrides: PlanRuleOverride[];

  effective_start_date: string;
  effective_end_date?: string;
}

// ==========================================
// INITIAL MOCK DATA (Viriyah Motor Type 1)
// ==========================================

const INITIAL_PLANS: PlanVersion[] = [
  {
    plan_id: "pl-001",
    version_id: "ver-pl-001-v2",
    plan_code: "P00001-GOLD",
    name: "Gold Tier - Garage Repair",
    status: "ACTIVE",
    base_premium: 18500.0,
    deductible_amount: 3000.0,
    deduct_type: "FIXED_AMOUNT",
    mandatory_excess_amount: 0.0,
    is_promo_code_eligible: true,
    inherit_settlement_rules: false,
    override_payee_type: "INSURER",
    override_payment_timing: "AFTER_ISSUANCE",
    override_base_commission_percent: 18.0,
    payment_config: {
      payee_type: "INSURER",
      third_party_id: null,
      insurer_bank_account: "Viriyah Insurance (KBANK 012-3-45678-9)",
      allowed_payment_methods: ["CASH", "CREDIT_CARD"],
      allowed_payment_terms: ["SINGLE", "INSTALLMENT"],
      payment_timing: "AFTER_ISSUANCE",
      insurer_credit_term_id: 8,
      installment_config: {
        duration_months: 10,
        interest_rate_percent: 0.0,
        first_month_percent: 35.0,
        supported_banks: ["KBANK", "SCB", "KTC", "BBL"],
      },
    },
    agent_flex_config: {
      base_insurer_commission_percent: 18.0,
      is_flex_allowed: true,
      max_commission_sacrifice_percent: 5.0,
    },
    coverages: [
      {
        benefit_id: "ben-01",
        benefit_code: "TP_BODILY_INJURY",
        coverage_group: "Third Party Liability",
        coverage_name: "Third Party Bodily Injury / Death",
        limit_type: "FIXED_AMOUNT",
        limit_amount: 1000000.0,
      },
      {
        benefit_id: "ben-02",
        benefit_code: "TP_PROP_DAMAGE",
        coverage_group: "Third Party Liability",
        coverage_name: "Third Party Property Damage",
        limit_type: "FIXED_AMOUNT",
        limit_amount: 2500000.0,
      },
      {
        benefit_id: "ben-03",
        benefit_code: "OWN_DAMAGE",
        coverage_group: "Vehicle Protection",
        coverage_name: "Own Damage (Vehicle Market Value)",
        limit_type: "DYNAMIC_REDBOOK",
        limit_amount: 0.0,
      },
      {
        benefit_id: "ben-04",
        benefit_code: "PA_DRIVER_PASSENGER",
        coverage_group: "Personal Accident & Medical",
        coverage_name: "Personal Accident (Driver & 5 Passengers)",
        limit_type: "FIXED_AMOUNT",
        limit_amount: 100000.0,
      },
    ],
    refer_template_requirements: [
      {
        field_id: "photo_4_corners",
        type: "FILE_UPLOAD",
        label: "Inspection: 4-Corner Vehicle Photos",
        required: true,
      },
      {
        field_id: "modified_engine_declaration",
        type: "TEXT_INPUT",
        label: "Engine Modification & Boost Details",
        required: false,
      },
    ],
    rule_overrides: [
      {
        rule_id: "rule-ov-01",
        target_field: "vehicle_age_years",
        operator: ">",
        threshold_value: "10",
        enforcement_action: "REFER",
      },
    ],
    effective_start_date: "2026-01-01T00:00:00Z",
    effective_end_date: "2026-12-31T23:59:59Z",
  },
  {
    plan_id: "pl-002",
    version_id: "ver-pl-002-v1",
    plan_code: "P00001-SILVER",
    name: "Silver Tier - Economy Repair",
    status: "ACTIVE",
    base_premium: 14200.0,
    deductible_amount: 5000.0,
    deduct_type: "FIXED_AMOUNT",
    mandatory_excess_amount: 1000.0,
    is_promo_code_eligible: true,
    inherit_settlement_rules: true,
    payment_config: {
      payee_type: "BROKER",
      allowed_payment_methods: ["CASH", "CREDIT_CARD"],
      allowed_payment_terms: ["SINGLE"],
      payment_timing: "BEFORE_ISSUANCE",
      installment_config: {
        duration_months: 3,
        interest_rate_percent: 0.0,
        first_month_percent: 34.0,
        supported_banks: ["KBANK", "BBL"],
      },
    },
    agent_flex_config: {
      base_insurer_commission_percent: 15.0,
      is_flex_allowed: false,
      max_commission_sacrifice_percent: 0.0,
    },
    coverages: [
      {
        benefit_id: "ben-05",
        benefit_code: "TP_BODILY_INJURY",
        coverage_group: "Third Party Liability",
        coverage_name: "Third Party Bodily Injury / Death",
        limit_type: "FIXED_AMOUNT",
        limit_amount: 500000.0,
      },
    ],
    refer_template_requirements: [],
    rule_overrides: [],
    effective_start_date: "2026-01-01T00:00:00Z",
  },
];

export const PlanTierConfigurationPage: React.FC = () => {
  const [plans, setPlans] = useState<PlanVersion[]>(INITIAL_PLANS);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("pl-001");
  const [activeTab, setActiveTab] = useState<"BASICS" | "SETTLEMENT" | "BENEFITS" | "RULES">("BASICS");
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  const currentPlan = plans.find((p) => p.plan_id === selectedPlanId) || plans[0];

  // Helper to update current plan state
  const handleUpdateCurrentPlan = (updatedFields: Partial<PlanVersion>) => {
    setPlans((prev) =>
      prev.map((plan) =>
        plan.plan_id === currentPlan.plan_id
          ? {
              ...plan,
              ...updatedFields,
              // If an active record is touched, flag as DRAFT for Copy-On-Write (BRD PROD-01)
              status: plan.status === "ACTIVE" ? "DRAFT" : plan.status,
            }
          : plan,
      ),
    );
  };

  // Add new coverage row
  const handleAddCoverageRow = () => {
    const newCoverage: PlanBenefitVersion = {
      benefit_id: `ben-${Date.now()}`,
      benefit_code: "NEW_COVERAGE",
      coverage_group: "Custom Add-on",
      coverage_name: "Supplemental Medical / Bail Bond",
      limit_type: "FIXED_AMOUNT",
      limit_amount: 100000,
    };
    handleUpdateCurrentPlan({
      coverages: [...currentPlan.coverages, newCoverage],
    });
  };

  // Remove coverage row
  const handleRemoveCoverage = (benefitId: string) => {
    handleUpdateCurrentPlan({
      coverages: currentPlan.coverages.filter((c) => c.benefit_id !== benefitId),
    });
  };

  // Maker-Checker Submission trigger (BRD 7.9)
  const handleSubmitMakerChecker = () => {
    setSaveSuccessNotice(
      `Ticket generated for Plan [${currentPlan.plan_code}]. Cloned as DRAFT version for Checker review.`,
    );
    setTimeout(() => setSaveSuccessNotice(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* ==================================================== */}
      {/* 1. BREADCRUMBS & CONTEXT HEADER                      */}
      {/* ==================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
            <span>Product Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
            <span className="text-zinc-700">Viriyah Motor Type 1 (P-MTR-001)</span>
            <ArrowRight className="w-3.5 h-3.5" />
            <span className="text-blue-600">Plans & Tiers</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Plan & Tier Configuration</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Configure coverage packages, settlement overrides, pricing deductibles, and comparison grids.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const newPlanId = `pl-${Date.now()}`;
              const cloned: PlanVersion = {
                ...currentPlan,
                plan_id: newPlanId,
                plan_code: `${currentPlan.plan_code}-COPY`,
                name: `${currentPlan.name} (Copy)`,
                status: "DRAFT",
                version_id: `ver-${newPlanId}-v1`,
              };
              setPlans([...plans, cloned]);
              setSelectedPlanId(newPlanId);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-zinc-300 text-xs font-medium rounded-md text-zinc-700 bg-white hover:bg-zinc-50 transition-colors shadow-sm"
          >
            <Copy className="w-3.5 h-3.5" />
            Clone Tier
          </button>

          <button
            type="button"
            onClick={handleSubmitMakerChecker}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-xs font-medium rounded-md text-white hover:bg-blue-700 shadow-sm transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            Submit For Approval (Maker-Checker)
          </button>
        </div>
      </div>

      {/* Alert Notice */}
      {saveSuccessNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-800 text-xs font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessNotice}</span>
        </div>
      )}

      {/* Copy-on-Write Version Alert Banner (BRD PROD-01 & SCD Type 2) */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-3.5 flex items-start justify-between gap-3 text-xs text-amber-900">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold text-amber-950">Snapshot Versioning Immutability (SCD Type 2 Enabled):</span>{" "}
            Active plan configurations are locked. Saving modifications creates a localized{" "}
            <span className="font-mono bg-amber-100/80 px-1 py-0.5 rounded text-amber-950">DRAFT</span> version,
            safeguarding current live sales and quotation endpoints until explicit Checker sign-off.
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-zinc-500 text-[11px] font-mono">Version ID: {currentPlan.version_id}</span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              currentPlan.status === "ACTIVE"
                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                : "bg-amber-100 text-amber-800 border border-amber-200"
            }`}
          >
            {currentPlan.status}
          </span>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. PLAN SELECTOR PILLS                                */}
      {/* ==================================================== */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          {plans.map((p) => {
            const isSelected = p.plan_id === selectedPlanId;
            return (
              <button
                key={p.plan_id}
                type="button"
                onClick={() => setSelectedPlanId(p.plan_id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-all ${
                  isSelected
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border border-zinc-200"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{p.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isSelected ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {p.plan_code}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => {
              const newId = `pl-${Date.now()}`;
              const brandNewPlan: PlanVersion = {
                plan_id: newId,
                version_id: `ver-${newId}-v1`,
                plan_code: `P00001-TIER${plans.length + 1}`,
                name: `New Tier ${plans.length + 1}`,
                status: "DRAFT",
                base_premium: 10000,
                deductible_amount: 0,
                deduct_type: "FIXED_AMOUNT",
                mandatory_excess_amount: 0,
                is_promo_code_eligible: false,
                inherit_settlement_rules: true,
                payment_config: {
                  payee_type: "BROKER",
                  allowed_payment_methods: ["CASH", "CREDIT_CARD"],
                  allowed_payment_terms: ["SINGLE"],
                  payment_timing: "BEFORE_ISSUANCE",
                  installment_config: {
                    duration_months: 3,
                    interest_rate_percent: 0,
                    first_month_percent: 34,
                    supported_banks: [],
                  },
                },
                agent_flex_config: {
                  base_insurer_commission_percent: 15,
                  is_flex_allowed: false,
                  max_commission_sacrifice_percent: 0,
                },
                coverages: [],
                refer_template_requirements: [],
                rule_overrides: [],
                effective_start_date: new Date().toISOString(),
              };
              setPlans([...plans, brandNewPlan]);
              setSelectedPlanId(newId);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md text-blue-600 hover:bg-blue-50 border border-dashed border-blue-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add New Tier
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 3. SUB-MODULE TABS                                   */}
      {/* ==================================================== */}
      <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-zinc-200 bg-zinc-50/60 px-4 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("BASICS")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === "BASICS"
                ? "border-blue-600 text-blue-600 bg-white rounded-t-md"
                : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Pricing & Deductibles
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SETTLEMENT")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === "SETTLEMENT"
                ? "border-blue-600 text-blue-600 bg-white rounded-t-md"
                : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Settlement & Commission Routing
            {!currentPlan.inherit_settlement_rules && (
              <span className="w-2 h-2 rounded-full bg-blue-500" title="Overridden" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("BENEFITS")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === "BENEFITS"
                ? "border-blue-600 text-blue-600 bg-white rounded-t-md"
                : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Benefits & Comparison Grid ({currentPlan.coverages.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("RULES")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === "RULES"
                ? "border-blue-600 text-blue-600 bg-white rounded-t-md"
                : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Underwriting & Referral Requirements ({currentPlan.refer_template_requirements.length})
          </button>
        </div>

        <div className="p-6">
          {/* ==================================================== */}
          {/* TAB 1: TIER BASICS & PRICING                         */}
          {/* ==================================================== */}
          {activeTab === "BASICS" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Plan Code (Immutable identifier)
                  </label>
                  <input
                    type="text"
                    value={currentPlan.plan_code}
                    onChange={(e) => handleUpdateCurrentPlan({ plan_code: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md text-xs font-mono bg-zinc-50 text-zinc-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">E.g., P00001-GOLD for Viriyah Catalog</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Marketing Tier Name
                  </label>
                  <input
                    type="text"
                    value={currentPlan.name}
                    onChange={(e) => handleUpdateCurrentPlan({ name: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">Displayed on consumer-facing checkout grid</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Base Gross Premium (THB)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 text-xs">฿</span>
                    <input
                      type="number"
                      value={currentPlan.base_premium}
                      onChange={(e) => handleUpdateCurrentPlan({ base_premium: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-7 pr-3 py-2 border border-zinc-300 rounded-md text-xs text-zinc-900 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">Net premium before Stamp (0.4%) & VAT (7%)</p>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200">
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-zinc-500" />
                  Deductible & Out-of-Pocket Liability
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">Deductible Type</label>
                    <select
                      value={currentPlan.deduct_type}
                      onChange={(e) => handleUpdateCurrentPlan({ deduct_type: e.target.value as DeductType })}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md text-xs text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="FIXED_AMOUNT">FIXED_AMOUNT (e.g. 3,000 THB)</option>
                      <option value="PERCENTAGE">PERCENTAGE (% of claim)</option>
                      <option value="PER_CLAIM">PER_CLAIM</option>
                      <option value="PER_YEAR">PER_YEAR</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">Deductible Amount (THB)</label>
                    <input
                      type="number"
                      value={currentPlan.deductible_amount}
                      onChange={(e) => handleUpdateCurrentPlan({ deductible_amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <p className="text-[11px] text-zinc-500 mt-1">Voluntary excess agreed by customer</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                      Mandatory Excess Amount (THB)
                    </label>
                    <input
                      type="number"
                      value={currentPlan.mandatory_excess_amount}
                      onChange={(e) =>
                        handleUpdateCurrentPlan({ mandatory_excess_amount: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <p className="text-[11px] text-zinc-500 mt-1">Regulatory non-waivable liability</p>
                  </div>
                </div>
              </div>

              {/* Time Boxing & Promos */}
              <div className="pt-4 border-t border-zinc-200">
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-zinc-500" />
                  Time-Boxing & Campaign Eligibility (BRD PROD-02)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">Effective Start Date (UTC)</label>
                    <input
                      type="datetime-local"
                      value={currentPlan.effective_start_date.substring(0, 16)}
                      onChange={(e) =>
                        handleUpdateCurrentPlan({
                          effective_start_date: new Date(e.target.value).toISOString(),
                        })
                      }
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                      Effective End Date (Time-Box Expiry)
                    </label>
                    <input
                      type="datetime-local"
                      value={currentPlan.effective_end_date ? currentPlan.effective_end_date.substring(0, 16) : ""}
                      onChange={(e) =>
                        handleUpdateCurrentPlan({
                          effective_end_date: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="pt-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentPlan.is_promo_code_eligible}
                        onChange={(e) => handleUpdateCurrentPlan({ is_promo_code_eligible: e.target.checked })}
                        className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-medium text-zinc-800">Eligible for Campaign Promo Codes</span>
                    </label>
                    <p className="text-[11px] text-zinc-500 mt-1 pl-6">
                      Allows frontend checkout to evaluate active discount codes on this tier.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: SETTLEMENT & COMMISSION ROUTING               */}
          {/* ==================================================== */}
          {activeTab === "SETTLEMENT" && (
            <div className="space-y-6">
              {/* Inheritance Master Toggle */}
              <div
                className={`p-4 rounded-lg border transition-colors ${
                  currentPlan.inherit_settlement_rules ? "bg-zinc-50 border-zinc-200" : "bg-blue-50/70 border-blue-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-blue-600" />
                      Configuration Inheritance Directive (BRD PROD-12 & PROD-15)
                    </h3>
                    <p className="text-xs text-zinc-600 mt-0.5">
                      By default, tiers inherit Payee routing, payment timing, credit rounds, and commissions from the
                      parent product.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-700">
                      {currentPlan.inherit_settlement_rules ? "Inherited from Product" : "Tier Override Active"}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateCurrentPlan({
                          inherit_settlement_rules: !currentPlan.inherit_settlement_rules,
                        })
                      }
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        !currentPlan.inherit_settlement_rules ? "bg-blue-600" : "bg-zinc-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          !currentPlan.inherit_settlement_rules ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Payee Routing */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Payee Type
                  </label>
                  <select
                    disabled={currentPlan.inherit_settlement_rules}
                    value={
                      currentPlan.inherit_settlement_rules
                        ? currentPlan.payment_config.payee_type
                        : currentPlan.override_payee_type || currentPlan.payment_config.payee_type
                    }
                    onChange={(e) =>
                      handleUpdateCurrentPlan({
                        override_payee_type: e.target.value as PayeeType,
                      })
                    }
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md text-xs text-zinc-900 bg-white disabled:bg-zinc-100 disabled:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="BROKER">Customer pays Broker</option>
                    <option value="INSURER">Customer pays Insurer directly</option>
                    <option value="THIRD_PARTY">Customer pays Third-Party Payee</option>
                  </select>
                  <p className="text-[11px] text-zinc-500 mt-1">Recipient of gross checkout funds</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Payment Timing
                  </label>
                  <select
                    disabled={currentPlan.inherit_settlement_rules}
                    value={
                      currentPlan.inherit_settlement_rules
                        ? currentPlan.payment_config.payment_timing
                        : currentPlan.override_payment_timing || currentPlan.payment_config.payment_timing
                    }
                    onChange={(e) =>
                      handleUpdateCurrentPlan({
                        override_payment_timing: e.target.value as PaymentTiming,
                      })
                    }
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md text-xs text-zinc-900 bg-white disabled:bg-zinc-100 disabled:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="BEFORE_ISSUANCE">Before Issuance (STP Straight Through)</option>
                    <option value="AFTER_ISSUANCE">After Issuance (Credit Round Settlement)</option>
                  </select>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Governs whether payment is required to activate policy
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Insurer Credit Round (If After Issuance)
                  </label>
                  <input
                    type="number"
                    disabled={currentPlan.inherit_settlement_rules}
                    value={currentPlan.payment_config.insurer_credit_term_id || 8}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md text-xs text-zinc-900 bg-white disabled:bg-zinc-100 disabled:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">E.g. Round 8: Billing round 1st-15th</p>
                </div>
              </div>

              {/* Insurer Direct Cash Bank Details */}
              {(currentPlan.override_payee_type === "INSURER" ||
                (currentPlan.inherit_settlement_rules && currentPlan.payment_config.payee_type === "INSURER")) && (
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-md">
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                    Insurer Bank Account (Mandatory for Direct Cash)
                  </label>
                  <input
                    type="text"
                    disabled={currentPlan.inherit_settlement_rules}
                    value={currentPlan.payment_config.insurer_bank_account || ""}
                    placeholder="E.g., Bank Name, Branch, Account No."
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md text-xs text-zinc-900 bg-white disabled:bg-zinc-100 disabled:text-zinc-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Printed on Payment Advice slips when Payee = Insurer (BRD PROD-12).
                  </p>
                </div>
              )}

              {/* Installment Plan Configurator (BRD PROD-13 & LIF-03) */}
              <div className="pt-4 border-t border-zinc-200">
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-zinc-500" />
                  Installment Matrix & Decimal Absorption Configurator
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-zinc-50/70 p-4 rounded-lg border border-zinc-200">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">Duration (Months)</label>
                    <input
                      type="number"
                      value={currentPlan.payment_config.installment_config.duration_months}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        handleUpdateCurrentPlan({
                          payment_config: {
                            ...currentPlan.payment_config,
                            installment_config: {
                              ...currentPlan.payment_config.installment_config,
                              duration_months: val,
                            },
                          },
                        });
                      }}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md text-xs text-zinc-900 bg-white"
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">Cycles (3, 6, 10)</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">Interest Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={currentPlan.payment_config.installment_config.interest_rate_percent}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        handleUpdateCurrentPlan({
                          payment_config: {
                            ...currentPlan.payment_config,
                            installment_config: {
                              ...currentPlan.payment_config.installment_config,
                              interest_rate_percent: val,
                            },
                          },
                        });
                      }}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md text-xs text-zinc-900 bg-white"
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">E.g., 0.00% for promo</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">1st Cycle Allocation (%)</label>
                    <input
                      type="number"
                      value={currentPlan.payment_config.installment_config.first_month_percent}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        handleUpdateCurrentPlan({
                          payment_config: {
                            ...currentPlan.payment_config,
                            installment_config: {
                              ...currentPlan.payment_config.installment_config,
                              first_month_percent: val,
                            },
                          },
                        });
                      }}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md text-xs text-zinc-900 bg-white"
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">
                      Cycle 1 absorbs decimals; rest strictly .00 (LIF-03)
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">Supported Gateway Banks</label>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {["KBANK", "SCB", "KTC", "BBL", "BAY"].map((bank) => (
                        <span
                          key={bank}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-white border border-zinc-200 text-zinc-700"
                        >
                          {bank}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Commission & Agent Flex Rules (BRD PROD-15) */}
              <div className="pt-4 border-t border-zinc-200">
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-zinc-500" />
                  Base Commission & Agent Flex Sacrifice Rules
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                      Base Insurer Commission (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        disabled={currentPlan.inherit_settlement_rules}
                        value={
                          currentPlan.inherit_settlement_rules
                            ? currentPlan.agent_flex_config.base_insurer_commission_percent
                            : currentPlan.override_base_commission_percent ||
                              currentPlan.agent_flex_config.base_insurer_commission_percent
                        }
                        onChange={(e) =>
                          handleUpdateCurrentPlan({
                            override_base_commission_percent: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 border border-zinc-300 rounded-md text-xs text-zinc-900 bg-white disabled:bg-zinc-100 disabled:text-zinc-500 focus:outline-none"
                      />
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 text-xs">%</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">Carried to downstream financial ledger</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                      Allow Agent Commission "Flex"
                    </label>
                    <select
                      value={currentPlan.agent_flex_config.is_flex_allowed ? "YES" : "NO"}
                      onChange={(e) =>
                        handleUpdateCurrentPlan({
                          agent_flex_config: {
                            ...currentPlan.agent_flex_config,
                            is_flex_allowed: e.target.value === "YES",
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md text-xs text-zinc-900 bg-white focus:outline-none"
                    >
                      <option value="YES">Enabled (Agent can sacrifice fee for client discount)</option>
                      <option value="NO">Disabled (Fixed base rate)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                      Max Allowed Sacrifice (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        disabled={!currentPlan.agent_flex_config.is_flex_allowed}
                        value={currentPlan.agent_flex_config.max_commission_sacrifice_percent}
                        onChange={(e) =>
                          handleUpdateCurrentPlan({
                            agent_flex_config: {
                              ...currentPlan.agent_flex_config,
                              max_commission_sacrifice_percent: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-zinc-300 rounded-md text-xs text-zinc-900 bg-white disabled:bg-zinc-100 disabled:text-zinc-400 focus:outline-none"
                      />
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 text-xs">%</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">Max discount agent can extend to client</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 3: BENEFITS & COMPARISON GRID (Screen 8.2.3)     */}
          {/* ==================================================== */}
          {activeTab === "BENEFITS" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                    Plan Benefits & Limits (Headless Comparison Grid Builder)
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Granular coverage rows served via{" "}
                    <code className="font-mono text-zinc-700">GET /products/{"{id}"}/plans</code> to power
                    customer-facing comparison tables.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddCoverageRow}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-900 text-white rounded text-xs font-medium hover:bg-zinc-800 transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Coverage Row
                </button>
              </div>

              <div className="border border-zinc-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Coverage Group</th>
                      <th className="py-2.5 px-3">Benefit Code</th>
                      <th className="py-2.5 px-3">Coverage Name</th>
                      <th className="py-2.5 px-3">Limit Calculation</th>
                      <th className="py-2.5 px-3 text-right">Sum Insured / Limit</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 text-xs">
                    {currentPlan.coverages.map((cov, index) => (
                      <tr key={cov.benefit_id} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={cov.coverage_group}
                            onChange={(e) => {
                              const updated = [...currentPlan.coverages];
                              updated[index].coverage_group = e.target.value;
                              handleUpdateCurrentPlan({ coverages: updated });
                            }}
                            className="w-full px-2 py-1 border border-zinc-200 rounded text-xs text-zinc-800 bg-white"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={cov.benefit_code}
                            onChange={(e) => {
                              const updated = [...currentPlan.coverages];
                              updated[index].benefit_code = e.target.value;
                              handleUpdateCurrentPlan({ coverages: updated });
                            }}
                            className="w-full px-2 py-1 border border-zinc-200 rounded font-mono text-[11px] text-zinc-800 bg-white"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={cov.coverage_name}
                            onChange={(e) => {
                              const updated = [...currentPlan.coverages];
                              updated[index].coverage_name = e.target.value;
                              handleUpdateCurrentPlan({ coverages: updated });
                            }}
                            className="w-full px-2 py-1 border border-zinc-200 rounded text-xs text-zinc-900 bg-white"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={cov.limit_type}
                            onChange={(e) => {
                              const updated = [...currentPlan.coverages];
                              updated[index].limit_type = e.target.value as "FIXED_AMOUNT" | "DYNAMIC_REDBOOK";
                              handleUpdateCurrentPlan({ coverages: updated });
                            }}
                            className="w-full px-2 py-1 border border-zinc-200 rounded text-xs text-zinc-800 bg-white"
                          >
                            <option value="FIXED_AMOUNT">Fixed THB Limit</option>
                            <option value="DYNAMIC_REDBOOK">Dynamic Redbook Value (Sum Insured)</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {cov.limit_type === "DYNAMIC_REDBOOK" ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono bg-blue-50 text-blue-700 border border-blue-200">
                              Redbook 80% Market Value
                            </span>
                          ) : (
                            <input
                              type="number"
                              value={cov.limit_amount}
                              onChange={(e) => {
                                const updated = [...currentPlan.coverages];
                                updated[index].limit_amount = parseFloat(e.target.value) || 0;
                                handleUpdateCurrentPlan({ coverages: updated });
                              }}
                              className="w-28 text-right px-2 py-1 border border-zinc-200 rounded text-xs font-mono font-medium text-zinc-900 bg-white"
                            />
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveCoverage(cov.benefit_id)}
                            className="p-1 text-zinc-400 hover:text-red-600 transition-colors"
                            title="Delete Row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {currentPlan.coverages.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-zinc-400 text-xs">
                          No benefit rows configured for this tier. Click "Add Coverage Row" to populate comparison
                          grid.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 4: UNDERWRITING & REFERRAL TEMPLATES             */}
          {/* ==================================================== */}
          {activeTab === "RULES" && (
            <div className="space-y-6">
              {/* Plan Level Underwriting Overrides (BRD PROD-05) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-zinc-500" />
                      Plan-Level Underwriting Rule Overrides (Child-First Logic)
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Evaluated first by URE. Overrides global product limits (e.g., allowing older vehicle age on Gold
                      plan).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newRule: PlanRuleOverride = {
                        rule_id: `rule-ov-${Date.now()}`,
                        target_field: "driver_age",
                        operator: "<",
                        threshold_value: "25",
                        enforcement_action: "LOADING",
                        loading_percent: 15.0,
                      };
                      handleUpdateCurrentPlan({
                        rule_overrides: [...currentPlan.rule_overrides, newRule],
                      });
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-zinc-300 rounded text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Plan Rule Override
                  </button>
                </div>

                <div className="space-y-2">
                  {currentPlan.rule_overrides.map((rule, idx) => (
                    <div
                      key={rule.rule_id}
                      className="flex items-center justify-between p-3 rounded-md bg-blue-50/50 border border-blue-200 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-medium text-blue-900 bg-blue-100 px-2 py-0.5 rounded text-[11px]">
                          IF {rule.target_field} {rule.operator} {rule.threshold_value}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                        <span
                          className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                            rule.enforcement_action === "REJECT"
                              ? "bg-red-100 text-red-700"
                              : rule.enforcement_action === "REFER"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-indigo-100 text-indigo-700"
                          }`}
                        >
                          THEN {rule.enforcement_action}
                        </span>
                        {rule.loading_percent && (
                          <span className="text-zinc-600 font-mono text-[11px]">
                            (+{rule.loading_percent}% Loading)
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = currentPlan.rule_overrides.filter((_, i) => i !== idx);
                          handleUpdateCurrentPlan({ rule_overrides: updated });
                        }}
                        className="text-zinc-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {currentPlan.rule_overrides.length === 0 && (
                    <div className="p-4 rounded-md border border-dashed border-zinc-300 text-center text-xs text-zinc-400">
                      No plan-specific rule overrides. Currently inheriting all global rules from parent product.
                    </div>
                  )}
                </div>
              </div>

              {/* Referral Requirements Template (BRD Section 6.3 - refer_template) */}
              <div className="pt-4 border-t border-zinc-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-zinc-500" />
                      Referral Question & Document Requirements (refer_template)
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Returned to external Sales Channel when an application is tripped into{" "}
                      <code className="font-mono text-zinc-700">PENDING_REVIEW</code> status (Yellow Channel).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newReq: ReferRequirementItem = {
                        field_id: `req_${Date.now()}`,
                        type: "FILE_UPLOAD",
                        label: "Additional Supporting Document",
                        required: true,
                      };
                      handleUpdateCurrentPlan({
                        refer_template_requirements: [...currentPlan.refer_template_requirements, newReq],
                      });
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-zinc-300 rounded text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Requirement Item
                  </button>
                </div>

                <div className="border border-zinc-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-200 text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Field Key (API JSON)</th>
                        <th className="py-2.5 px-3">Input Type</th>
                        <th className="py-2.5 px-3">Display Label (Prompt for Customer / Agent)</th>
                        <th className="py-2.5 px-3 text-center">Mandatory</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 text-xs">
                      {currentPlan.refer_template_requirements.map((req, idx) => (
                        <tr key={req.field_id} className="hover:bg-zinc-50/70 transition-colors">
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={req.field_id}
                              onChange={(e) => {
                                const updated = [...currentPlan.refer_template_requirements];
                                updated[idx].field_id = e.target.value;
                                handleUpdateCurrentPlan({ refer_template_requirements: updated });
                              }}
                              className="w-full px-2 py-1 border border-zinc-200 rounded font-mono text-[11px] text-zinc-800 bg-white"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <select
                              value={req.type}
                              onChange={(e) => {
                                const updated = [...currentPlan.refer_template_requirements];
                                updated[idx].type = e.target.value as "FILE_UPLOAD" | "TEXT_INPUT" | "BOOLEAN";
                                handleUpdateCurrentPlan({ refer_template_requirements: updated });
                              }}
                              className="w-full px-2 py-1 border border-zinc-200 rounded text-xs text-zinc-800 bg-white"
                            >
                              <option value="FILE_UPLOAD">FILE_UPLOAD (Image / PDF)</option>
                              <option value="TEXT_INPUT">TEXT_INPUT (Explanation Area)</option>
                              <option value="BOOLEAN">BOOLEAN (Yes/No Confirmation)</option>
                            </select>
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={req.label}
                              onChange={(e) => {
                                const updated = [...currentPlan.refer_template_requirements];
                                updated[idx].label = e.target.value;
                                handleUpdateCurrentPlan({ refer_template_requirements: updated });
                              }}
                              className="w-full px-2 py-1 border border-zinc-200 rounded text-xs text-zinc-900 bg-white"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={req.required}
                              onChange={(e) => {
                                const updated = [...currentPlan.refer_template_requirements];
                                updated[idx].required = e.target.checked;
                                handleUpdateCurrentPlan({ refer_template_requirements: updated });
                              }}
                              className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = currentPlan.refer_template_requirements.filter((_, i) => i !== idx);
                                handleUpdateCurrentPlan({ refer_template_requirements: updated });
                              }}
                              className="p-1 text-zinc-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {currentPlan.refer_template_requirements.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-zinc-400 text-xs">
                            No referral questions configured. Clean applications auto-proceed to payment without Yellow
                            Channel pause.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanTierConfigurationPage;
