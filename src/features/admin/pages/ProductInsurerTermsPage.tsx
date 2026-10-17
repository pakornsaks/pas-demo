import {
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  GitBranch,
  Layers,
  Percent,
  Plus,
  Save,
  Sliders,
  Sparkles,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

interface InsurerOVTier {
  id: string;
  tierName: string;
  minGwpThresholdThb: number;
  maxGwpThresholdThb: number | null;
  ovPercent: number;
  bonusPercent: number;
  effectiveFrom: string;
  effectiveTo: string;
}

interface PlanCommercialOverride {
  planId: string;
  planCode: string;
  planName: string;
  status: "ACTIVE" | "DRAFT" | "INHERITED";
  inheritFromProduct: boolean;
  baseCommissionPercent: number;
  insurerOvPercent: number;
  payeeType: "BROKER" | "INSURER" | "THIRD_PARTY";
  paymentTiming: "BEFORE_ISSUANCE" | "AFTER_ISSUANCE";
  lastModifiedBy: string;
}

export default function ProductInsurerTermsPage() {
  // Navigation & Product Scope State
  const [selectedInsurer, setSelectedInsurer] = useState("INS-VIRIYAH-001");
  const [selectedLob, setSelectedLob] = useState("MOTOR");
  const [selectedProduct, setSelectedProduct] = useState("PROD-MTR-V1-GOLD");
  const [activeTab, setActiveTab] = useState<"product_terms" | "ov_tiers" | "plan_overrides">("product_terms");

  // Governance & Versioning State (Copy-on-Write)
  const [productVersion, setProductVersion] = useState({
    versionId: "ver-8821a-2026",
    versionCode: "v2.1",
    status: "DRAFT", // 'ACTIVE' | 'DRAFT' | 'PENDING_APPROVAL'
    effectiveStartDate: "2026-07-01T00:00:00Z",
    effectiveEndDate: "2026-12-31T23:59:59Z",
    isLocked: false,
  });

  // Product Level Commercial Terms
  const [productTerms, setProductTerms] = useState({
    baseInsurerCommissionPercent: 18.0,
    baseInsurerOvPercent: 3.5,
    ovCalculationBasis: "GROSS_PREMIUM", // 'NET_PREMIUM' | 'GROSS_PREMIUM'
    settlementMode: "NET", // 'NET' (Deduct before) | 'GROSS' (Refund after)
    payeeType: "BROKER",
    paymentTiming: "AFTER_ISSUANCE",
    insurerCreditTermRound: "Round 1 (1st - 15th)",
    whtDeductionPercent: 3.0,
    allowPlanOverrides: true,
  });

  // Insurer Overriding Commission (OV) Volume Tiers
  const [ovTiers, setOvTiers] = useState<InsurerOVTier[]>([
    {
      id: "ov-1",
      tierName: "Tier 1: Standard Broker Base",
      minGwpThresholdThb: 0,
      maxGwpThresholdThb: 5000000,
      ovPercent: 2.0,
      bonusPercent: 0.0,
      effectiveFrom: "2026-01-01",
      effectiveTo: "2026-12-31",
    },
    {
      id: "ov-2",
      tierName: "Tier 2: Growth Volume Accelerator",
      minGwpThresholdThb: 5000001,
      maxGwpThresholdThb: 20000000,
      ovPercent: 3.5,
      bonusPercent: 0.5,
      effectiveFrom: "2026-01-01",
      effectiveTo: "2026-12-31",
    },
    {
      id: "ov-3",
      tierName: "Tier 3: Strategic Master Bordereau",
      minGwpThresholdThb: 20000001,
      maxGwpThresholdThb: null,
      ovPercent: 5.0,
      bonusPercent: 1.0,
      effectiveFrom: "2026-01-01",
      effectiveTo: "2026-12-31",
    },
  ]);

  // Plan-Level Overrides List
  const [planOverrides, setPlanOverrides] = useState<PlanCommercialOverride[]>([
    {
      planId: "PLAN-001",
      planCode: "PLN-GOLD-SEDAN",
      planName: "Sedan Standard Gold Care",
      status: "INHERITED",
      inheritFromProduct: true,
      baseCommissionPercent: 18.0,
      insurerOvPercent: 3.5,
      payeeType: "BROKER",
      paymentTiming: "AFTER_ISSUANCE",
      lastModifiedBy: "SYSTEM (Inherited)",
    },
    {
      planId: "PLAN-002",
      planCode: "PLN-EV-EXCLUSIVE",
      planName: "EV Exclusive Luxury Protection",
      status: "DRAFT",
      inheritFromProduct: false,
      baseCommissionPercent: 20.5,
      insurerOvPercent: 4.5,
      payeeType: "BROKER",
      paymentTiming: "AFTER_ISSUANCE",
      lastModifiedBy: "Somchai (Actuary)",
    },
    {
      planId: "PLAN-003",
      planCode: "PLN-GARAGE-FLEET",
      planName: "Commercial Fleet Tier B",
      status: "INHERITED",
      inheritFromProduct: true,
      baseCommissionPercent: 18.0,
      insurerOvPercent: 3.5,
      payeeType: "BROKER",
      paymentTiming: "AFTER_ISSUANCE",
      lastModifiedBy: "SYSTEM (Inherited)",
    },
  ]);

  const handleTogglePlanInheritance = (planId: string) => {
    setPlanOverrides((prev) =>
      prev.map((plan) => {
        if (plan.planId === planId) {
          const willInherit = !plan.inheritFromProduct;
          return {
            ...plan,
            inheritFromProduct: willInherit,
            status: willInherit ? "INHERITED" : "DRAFT",
            baseCommissionPercent: willInherit ? productTerms.baseInsurerCommissionPercent : plan.baseCommissionPercent,
            insurerOvPercent: willInherit ? productTerms.baseInsurerOvPercent : plan.insurerOvPercent,
            lastModifiedBy: willInherit ? "SYSTEM (Inherited)" : "Current User (Draft Override)",
          };
        }
        return plan;
      }),
    );
  };

  const handleUpdatePlanOverride = (
    planId: string,
    field: "baseCommissionPercent" | "insurerOvPercent",
    value: number,
  ) => {
    setPlanOverrides((prev) => prev.map((plan) => (plan.planId === planId ? { ...plan, [field]: value } : plan)));
  };

  const calculateCombinedTakeRate = (base: number, ov: number) => {
    return (base + ov).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Top Breadcrumb & Control Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                Commercials & Overriding Commission (OV)
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Insurer ↔ Broker
                </span>
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
                <span className="text-xs font-medium text-slate-600 pl-2">Version:</span>
                <span className="bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded text-xs border border-amber-300 flex items-center gap-1">
                  <GitBranch className="w-3 h-3" />
                  {productVersion.versionCode} ({productVersion.status})
                </span>
              </div>

              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition"
              >
                <GitBranch className="w-4 h-4 text-slate-500" />
                Clone New Draft
              </button>

              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition"
              >
                <Save className="w-4 h-4" />
                Submit to Checker
              </button>
            </div>
          </div>

          {/* Context Selector Bar */}
          <div className="py-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Issuer</label>
              <div className="relative">
                <select
                  value={selectedInsurer}
                  onChange={(e) => setSelectedInsurer(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md py-1.5 pl-3 pr-8 text-sm font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="INS-VIRIYAH-001">Viriyah Insurance PCL (VIRIYAH)</option>
                  <option value="INS-MTI-002">Muang Thai Insurance (MTI)</option>
                  <option value="INS-MSIG-003">MSIG Insurance Thailand</option>
                  <option value="INS-AIA-004">AIA Thailand (Health/Life)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Line of Business (LOB)</label>
              <select
                value={selectedLob}
                onChange={(e) => setSelectedLob(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-md py-1.5 pl-3 pr-8 text-sm font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="MOTOR">Motor Insurance (Voluntary & CMI)</option>
                <option value="HEALTH">Health & Medical Expense</option>
                <option value="FIRE">Fire & Commercial Property</option>
                <option value="TRAVEL">Travel Insurance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Product Package</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-md py-1.5 pl-3 pr-8 text-sm font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="PROD-MTR-V1-GOLD">Type 1 Comprehensive Motor Protect 2026</option>
                <option value="PROD-MTR-V2-PLUS">Type 2+ Essential Highway Shield</option>
                <option value="PROD-MTR-EV-PRO">Type 1 Electric Vehicle Premium Care</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Metric Quick View Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Base Commission</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{productTerms.baseInsurerCommissionPercent}%</p>
              <span className="text-xs text-slate-500">Fixed rate on Net Premium</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Percent className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Insurer Overriding (OV)</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">+{productTerms.baseInsurerOvPercent}%</p>
              <span className="text-xs text-emerald-600 font-medium">Bordereau volume override</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Broker Take Rate</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">
                {calculateCombinedTakeRate(
                  productTerms.baseInsurerCommissionPercent,
                  productTerms.baseInsurerOvPercent,
                )}
                %
              </p>
              <span className="text-xs text-slate-500">Revenue retained from insurer</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Settlement Protocol</p>
              <p className="text-xl font-bold text-slate-800 mt-1">{productTerms.settlementMode} Remittance</p>
              <span className="text-xs text-slate-500">3% WHT Deducted at source</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 mb-6 bg-white rounded-t-xl px-4 pt-3 flex space-x-8">
          <button
            onClick={() => setActiveTab("product_terms")}
            className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === "product_terms"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Sliders className="w-4 h-4" />
            Product Master Commercials
          </button>

          <button
            onClick={() => setActiveTab("ov_tiers")}
            className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === "ov_tiers"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Insurer Volume OV Tiers
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">
              {ovTiers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("plan_overrides")}
            className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === "plan_overrides"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Layers className="w-4 h-4" />
            Plan-Level Overrides & Tiers
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800">
              {planOverrides.filter((p) => !p.inheritFromProduct).length} Active
            </span>
          </button>
        </div>

        {/* TAB 1: PRODUCT MASTER COMMERCIAL TERMS */}
        {activeTab === "product_terms" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900 mb-1 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                Agreed Insurer Commission & Overriding Engine
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Governs the primary commercial percentages agreed in the insurer contract for this product version.
                These figures feed directly into downstream bordereau reconciliations and the Commission Receivable
                ledger.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Base Insurer Commission (%) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <input
                      type="number"
                      step="0.01"
                      value={productTerms.baseInsurerCommissionPercent}
                      onChange={(e) =>
                        setProductTerms({
                          ...productTerms,
                          baseInsurerCommissionPercent: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg py-2 pl-3 pr-10 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 font-bold">
                      %
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Maps to <code className="bg-slate-100 px-1 py-0.5 rounded">base_insurer_commission_percent</code>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Insurer Overriding Commission (OV %) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <input
                      type="number"
                      step="0.01"
                      value={productTerms.baseInsurerOvPercent}
                      onChange={(e) =>
                        setProductTerms({
                          ...productTerms,
                          baseInsurerOvPercent: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg py-2 pl-3 pr-10 text-emerald-700 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 font-bold">
                      %
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Brokerage wholesale volume incentive</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">OV Calculation Basis</label>
                  <select
                    value={productTerms.ovCalculationBasis}
                    onChange={(e) => setProductTerms({ ...productTerms, ovCalculationBasis: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="GROSS_PREMIUM">Net Premium + Stamp (Pre-VAT)</option>
                    <option value="NET_PREMIUM">Net Premium Pure Risk</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-500">Defines premium multiplier for override calculations</p>
                </div>
              </div>

              <div className="my-6 border-t border-slate-200" />

              <h3 className="text-sm font-semibold text-slate-800 mb-4">Insurer Settlement & Timing Rules</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Settlement Method</label>
                  <select
                    value={productTerms.settlementMode}
                    onChange={(e) => setProductTerms({ ...productTerms, settlementMode: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="NET">NET Settlement (Broker deducts commission before remitting)</option>
                    <option value="GROSS">GROSS Settlement (Remit 100% premium; Insurer refunds comm.)</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-500">Affects Broker Payable to Insurer Statement</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Premium Routing (Payee Type)</label>
                  <select
                    value={productTerms.payeeType}
                    onChange={(e) =>
                      setProductTerms({
                        ...productTerms,
                        payeeType: e.target.value as "BROKER" | "INSURER" | "THIRD_PARTY",
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="BROKER">Customer pays Broker (Broker Collects)</option>
                    <option value="INSURER">Customer pays Insurer Direct (Cash/QR)</option>
                    <option value="THIRD_PARTY">Customer pays Third-Party Payee</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-500">Maps to product_versions.payee_type</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Insurer Credit Term & Billing Round
                  </label>
                  <input
                    type="text"
                    value={productTerms.insurerCreditTermRound}
                    readOnly
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-600 text-sm cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-slate-500">Inherited from Master Data (broker_insurer_settings)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INSURER VOLUME OV TIERS */}
        {activeTab === "ov_tiers" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Insurer-to-Broker Volume Overriding Tiers (Bordereau Incentives)
                </h2>
                <p className="text-sm text-slate-500">
                  Configures retroactive and threshold-based OV bonuses granted by {selectedInsurer} based on cumulative
                  Gross Written Premium (GWP).
                </p>
              </div>

              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Volume Tier
              </button>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                    <th className="py-3 px-4">Tier Bracket</th>
                    <th className="py-3 px-4">Min GWP (THB)</th>
                    <th className="py-3 px-4">Max GWP (THB)</th>
                    <th className="py-3 px-4 text-emerald-700">Base OV Rate</th>
                    <th className="py-3 px-4 text-indigo-700">Growth Bonus</th>
                    <th className="py-3 px-4">Effective Validity</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {ovTiers.map((tier) => (
                    <tr key={tier.id} className="hover:bg-slate-50/75">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{tier.tierName}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {tier.minGwpThresholdThb.toLocaleString()} ฿
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {tier.maxGwpThresholdThb ? `${tier.maxGwpThresholdThb.toLocaleString()} ฿` : "Uncapped (Max)"}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-700">+{tier.ovPercent.toFixed(2)}%</td>
                      <td className="py-3.5 px-4 font-semibold text-indigo-700">+{tier.bonusPercent.toFixed(2)}%</td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {tier.effectiveFrom} to {tier.effectiveTo}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          className="text-slate-400 hover:text-rose-600 transition p-1"
                          title="Remove tier"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  Volume calculation evaluates active issued policies within the calendar year settlement period.
                </span>
              </div>
              <span className="font-semibold text-slate-700">Ref: SDD Section 4.4 &amp; 5.9</span>
            </div>
          </div>
        )}

        {/* TAB 3: PLAN-LEVEL COMMERCIAL OVERRIDES */}
        {activeTab === "plan_overrides" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-600" />
                    Plan-Level Commercial Terms & Overrides (plan_versions)
                  </h2>
                  <p className="text-sm text-slate-500">
                    Child-First logic: Specific packages or plans can override the parent product&apos;s base commission
                    and insurer OV rate.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Default Behavior:</span>
                  <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-1 rounded">
                    Inherit Parent Config
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {planOverrides.map((plan) => (
                  <div
                    key={plan.planId}
                    className={`border rounded-xl p-5 transition ${
                      plan.inheritFromProduct
                        ? "border-slate-200 bg-white"
                        : "border-indigo-200 bg-indigo-50/20 shadow-sm"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {plan.planCode}
                          </span>
                          <h3 className="font-bold text-slate-900 text-base">{plan.planName}</h3>
                          {plan.inheritFromProduct ? (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              Inherited from Product
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Custom Plan Override
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Audit Anchor: Last modified by {plan.lastModifiedBy}
                        </p>
                      </div>

                      {/* Inheritance Toggle Button */}
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-medium text-slate-600">Inherit Commercials:</label>
                        <button
                          type="button"
                          onClick={() => handleTogglePlanInheritance(plan.planId)}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            plan.inheritFromProduct ? "bg-indigo-600" : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              plan.inheritFromProduct ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Form Controls */}
                    <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Base Commission Override */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Base Insurer Commission (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            disabled={plan.inheritFromProduct}
                            value={plan.baseCommissionPercent}
                            onChange={(e) =>
                              handleUpdatePlanOverride(
                                plan.planId,
                                "baseCommissionPercent",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className={`w-full rounded-lg py-1.5 pl-3 pr-8 text-sm font-semibold focus:outline-none ${
                              plan.inheritFromProduct
                                ? "bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed"
                                : "bg-white text-slate-900 border border-indigo-300 focus:ring-1 focus:ring-indigo-500"
                            }`}
                          />
                          <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 font-bold">
                            %
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {plan.inheritFromProduct ? "Inheriting 18.00%" : "override_base_commission_percent"}
                        </span>
                      </div>

                      {/* Insurer OV Override */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Insurer OV Rate (%)</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            disabled={plan.inheritFromProduct}
                            value={plan.insurerOvPercent}
                            onChange={(e) =>
                              handleUpdatePlanOverride(plan.planId, "insurerOvPercent", parseFloat(e.target.value) || 0)
                            }
                            className={`w-full rounded-lg py-1.5 pl-3 pr-8 text-sm font-semibold focus:outline-none ${
                              plan.inheritFromProduct
                                ? "bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed"
                                : "bg-white text-emerald-700 border border-emerald-300 focus:ring-1 focus:ring-emerald-500"
                            }`}
                          />
                          <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 font-bold">
                            %
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {plan.inheritFromProduct ? "Inheriting 3.50%" : "Custom insurer tier"}
                        </span>
                      </div>

                      {/* Total Broker Take-Rate */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Net Broker Earning Rate</label>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 flex items-center justify-between">
                          <span className="text-xs text-slate-500">Gross Retained:</span>
                          <span className="font-bold text-sm text-indigo-700">
                            {calculateCombinedTakeRate(plan.baseCommissionPercent, plan.insurerOvPercent)}%
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">Base Comm + Insurer OV</span>
                      </div>

                      {/* Settlement Payee Override */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Payee Routing</label>
                        <select
                          disabled={plan.inheritFromProduct}
                          value={plan.payeeType}
                          className={`w-full rounded-lg py-1.5 px-2 text-xs font-medium focus:outline-none ${
                            plan.inheritFromProduct
                              ? "bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed"
                              : "bg-white text-slate-800 border border-slate-300 focus:ring-1 focus:ring-indigo-500"
                          }`}
                        >
                          <option value="BROKER">BROKER (Default)</option>
                          <option value="INSURER">INSURER DIRECT</option>
                          <option value="THIRD_PARTY">THIRD_PARTY</option>
                        </select>
                        <span className="text-[11px] text-slate-400">override_payee_type</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions & Audit Stamps */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Effective Date: 2026-07-01 00:00:00 UTC
            </span>
            <span>•</span>
            <span>Module: Operations &amp; Execution / Product Factory</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="px-4 py-2 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-lg font-medium transition"
            >
              Discard Changes
            </button>
            <button
              type="button"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              Save Commercial Settings
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
