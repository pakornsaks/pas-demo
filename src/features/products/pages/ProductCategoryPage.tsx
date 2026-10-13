import {
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  FileCode2,
  Filter,
  Layers,
  Percent,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// ============================================================================
// Types & API Contracts (Aligned with PAS Data Architecture Section 4.4 & 6.3)
// ============================================================================

export type LOBCode = "MOTOR" | "CMI" | "HEALTH" | "TRAVEL" | "PA" | "FIRE" | "LIFE" | "CUSTOM";

export type VersionStatus = "DRAFT" | "ACTIVE" | "SCHEDULED" | "ARCHIVED";
export type PayeeType = "BROKER" | "INSURER" | "THIRD_PARTY";
export type PaymentTiming = "BEFORE_ISSUANCE" | "AFTER_ISSUANCE";

export interface ProductCatalogItem {
  product_id: string;
  insurer_id: string;
  insurer_name: string;
  lob_code: LOBCode;
  active_version: {
    version_id: string;
    product_code: string;
    marketing_name: string;
    version_number: string;
    status: VersionStatus;
    payee_type: PayeeType;
    payment_timing: PaymentTiming;
    base_insurer_commission_percent: number;
    effective_start_date: string;
    effective_end_date: string | null;
    total_plans_count: number;
    has_draft_in_progress: boolean;
  };
}

// Initial seed catalog reflecting PAS multi-line support
const INITIAL_PRODUCTS: ProductCatalogItem[] = [
  {
    product_id: "prd-cyber-001",
    insurer_id: "ins-dhipaya-01",
    insurer_name: "Dhipaya Insurance PCL",
    lob_code: "CUSTOM",
    active_version: {
      version_id: "550e8400-e29b-41d4-a716-446655440000",
      product_code: "CBR-CORP-2026",
      marketing_name: "Enterprise Cyber Security Shield",
      version_number: "v2.1",
      status: "DRAFT",
      payee_type: "BROKER",
      payment_timing: "BEFORE_ISSUANCE",
      base_insurer_commission_percent: 22.0,
      effective_start_date: "2026-06-01",
      effective_end_date: null,
      total_plans_count: 2,
      has_draft_in_progress: true,
    },
  },
  {
    product_id: "prd-motor-001",
    insurer_id: "ins-viriyah-01",
    insurer_name: "Viriyah Insurance PCL",
    lob_code: "MOTOR",
    active_version: {
      version_id: "771e8400-e29b-41d4-a716-446655440001",
      product_code: "VRY-MTR-T1-2026",
      marketing_name: "Motor Type 1 Comprehensive Pro",
      version_number: "v1.4",
      status: "ACTIVE",
      payee_type: "INSURER",
      payment_timing: "BEFORE_ISSUANCE",
      base_insurer_commission_percent: 18.0,
      effective_start_date: "2026-01-01",
      effective_end_date: "2026-12-31",
      total_plans_count: 4,
      has_draft_in_progress: false,
    },
  },
  {
    product_id: "prd-marine-002",
    insurer_id: "ins-msig-01",
    insurer_name: "MSIG Insurance (Thailand)",
    lob_code: "CUSTOM",
    active_version: {
      version_id: "882e8400-e29b-41d4-a716-446655440002",
      product_code: "MAR-CARGO-ALLRISK",
      marketing_name: "Marine Cargo International Transit",
      version_number: "v1.0",
      status: "ACTIVE",
      payee_type: "BROKER",
      payment_timing: "AFTER_ISSUANCE",
      base_insurer_commission_percent: 15.0,
      effective_start_date: "2026-02-15",
      effective_end_date: null,
      total_plans_count: 1,
      has_draft_in_progress: false,
    },
  },
  {
    product_id: "prd-health-003",
    insurer_id: "ins-bdms-01",
    insurer_name: "Allianz Ayudhya General",
    lob_code: "HEALTH",
    active_version: {
      version_id: "993e8400-e29b-41d4-a716-446655440003",
      product_code: "ALZ-HLT-ULTIMA",
      marketing_name: "First Class Ultra Care Health",
      version_number: "v3.0",
      status: "ACTIVE",
      payee_type: "BROKER",
      payment_timing: "BEFORE_ISSUANCE",
      base_insurer_commission_percent: 20.0,
      effective_start_date: "2026-01-01",
      effective_end_date: null,
      total_plans_count: 3,
      has_draft_in_progress: false,
    },
  },
];

const INSURER_OPTIONS = [
  { id: "ins-viriyah-01", name: "Viriyah Insurance PCL" },
  { id: "ins-dhipaya-01", name: "Dhipaya Insurance PCL" },
  { id: "ins-msig-01", name: "MSIG Insurance (Thailand)" },
  { id: "ins-bdms-01", name: "Allianz Ayudhya General" },
  { id: "ins-bki-01", name: "Bangkok Insurance PCL" },
];

const LOB_OPTIONS: { code: LOBCode; label: string; isCustom?: boolean }[] = [
  { code: "MOTOR", label: "Voluntary Motor" },
  { code: "CMI", label: "Compulsory Motor (CMI)" },
  { code: "HEALTH", label: "Health Insurance" },
  { code: "TRAVEL", label: "Travel Insurance" },
  { code: "PA", label: "Personal Accident (PA)" },
  { code: "FIRE", label: "Property & Fire" },
  { code: "LIFE", label: "Life & Endowment" },
  { code: "CUSTOM", label: "Custom Line / Bespoke", isCustom: true },
];

export const ProductCatalogPage: React.FC = () => {
  const navigate = useNavigate();

  // State Management
  const [products, setProducts] = useState<ProductCatalogItem[]>(INITIAL_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLobFilter, setSelectedLobFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");

  // Modal State for New Product Creation
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFormData, setNewFormData] = useState({
    insurer_id: INSURER_OPTIONS[0].id,
    lob_code: "CUSTOM" as LOBCode,
    product_code: "",
    marketing_name: "",
    payee_type: "BROKER" as PayeeType,
    payment_timing: "BEFORE_ISSUANCE" as PaymentTiming,
    base_insurer_commission_percent: 18.0,
    effective_start_date: new Date().toISOString().split("T")[0],
    effective_end_date: "",
  });

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchesSearch =
        item.active_version.marketing_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.active_version.product_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.insurer_name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesLob = selectedLobFilter === "ALL" || item.lob_code === selectedLobFilter;
      const matchesStatus = selectedStatusFilter === "ALL" || item.active_version.status === selectedStatusFilter;

      return matchesSearch && matchesLob && matchesStatus;
    });
  }, [products, searchQuery, selectedLobFilter, selectedStatusFilter]);

  // Clone New Version handler (SCD Type 2 Copy-on-Write)
  const handleCloneVersion = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.product_id === productId) {
          const currentVer = parseFloat(p.active_version.version_number.replace("v", ""));
          const nextVer = `v${(currentVer + 0.1).toFixed(1)}`;
          return {
            ...p,
            active_version: {
              ...p.active_version,
              version_number: nextVer,
              status: "DRAFT",
              has_draft_in_progress: true,
            },
          };
        }
        return p;
      }),
    );
    alert("Cloned product into isolated DRAFT version. Live production API remains unaffected.");
  };

  // Submit Handler for New Product Form
  const handleCreateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const insurer = INSURER_OPTIONS.find((i) => i.id === newFormData.insurer_id);
    const newProductId = `prd-${Date.now()}`;
    const newVersionId = `ver-${Date.now()}`;

    const newProduct: ProductCatalogItem = {
      product_id: newProductId,
      insurer_id: newFormData.insurer_id,
      insurer_name: insurer?.name || "Selected Carrier",
      lob_code: newFormData.lob_code,
      active_version: {
        version_id: newVersionId,
        product_code: newFormData.product_code.toUpperCase().trim(),
        marketing_name: newFormData.marketing_name.trim(),
        version_number: "v1.0",
        status: "DRAFT",
        payee_type: newFormData.payee_type,
        payment_timing: newFormData.payment_timing,
        base_insurer_commission_percent: Number(newFormData.base_insurer_commission_percent),
        effective_start_date: newFormData.effective_start_date,
        effective_end_date: newFormData.effective_end_date || null,
        total_plans_count: 0,
        has_draft_in_progress: true,
      },
    };

    setProducts((prev) => [newProduct, ...prev]);
    setIsCreateModalOpen(false);

    // If CUSTOM LOB, prompt redirect directly to the Dynamic Schema Builder
    if (newFormData.lob_code === "CUSTOM") {
      const shouldNavigate = window.confirm(
        "Custom Line of Business created successfully in DRAFT!\n\nWould you like to open the Dynamic Schema Builder now to configure its custom risk fields?",
      );
      if (shouldNavigate) {
        navigate("/products/schemas");
      }
    }
  };

  return (
    <div className="min-h-full">
      {/* 1. Flush Top Sub-Header (Cancels parent main p-6 top/sides padding) */}
      <div className="-mt-6 -mx-6 bg-white border-b border-zinc-200 px-6 py-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              <span>Operations & Execution</span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              <span>Product Factory & Rules</span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-zinc-900 font-bold">Product Catalog</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Product Master Catalog</h1>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                Screen 8.2.1
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1 max-w-3xl leading-relaxed">
              Centralized catalog defining parent product packages, settlement payee parameters, carrier commission
              rates, and time-boxed versions served across external sales channels.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setNewFormData({
                  insurer_id: INSURER_OPTIONS[0].id,
                  lob_code: "CUSTOM",
                  product_code: "",
                  marketing_name: "",
                  payee_type: "BROKER",
                  payment_timing: "BEFORE_ISSUANCE",
                  base_insurer_commission_percent: 18.0,
                  effective_start_date: new Date().toISOString().split("T")[0],
                  effective_end_date: "",
                });
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md transition-colors shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />+ New Custom LOB
            </button>
            <button
              type="button"
              onClick={() => {
                setNewFormData({
                  insurer_id: INSURER_OPTIONS[0].id,
                  lob_code: "MOTOR",
                  product_code: "",
                  marketing_name: "",
                  payee_type: "BROKER",
                  payment_timing: "BEFORE_ISSUANCE",
                  base_insurer_commission_percent: 18.0,
                  effective_start_date: new Date().toISOString().split("T")[0],
                  effective_end_date: "",
                });
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Product
            </button>
          </div>
        </div>

        {/* Catalog KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-4 border-t border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-zinc-500 font-medium">Total Products</div>
              <div className="text-base font-bold text-zinc-900">{products.length}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-zinc-500 font-medium">Active Production</div>
              <div className="text-base font-bold text-zinc-900">
                {products.filter((p) => p.active_version.status === "ACTIVE").length}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-zinc-500 font-medium">Staged Drafts</div>
              <div className="text-base font-bold text-zinc-900">
                {products.filter((p) => p.active_version.has_draft_in_progress).length}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <FileCode2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-zinc-500 font-medium">Custom Schemas</div>
              <div className="text-base font-bold text-zinc-900">
                {products.filter((p) => p.lob_code === "CUSTOM").length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white border border-zinc-200 rounded-lg p-3.5 shadow-xs mb-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by marketing name, product code (e.g. CBR-CORP), or insurer..."
            className="w-full pl-9 pr-3 py-1.5 text-xs text-zinc-800 bg-zinc-50/50 border border-zinc-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <span>Line of Business:</span>
          </div>
          <select
            value={selectedLobFilter}
            onChange={(e) => setSelectedLobFilter(e.target.value)}
            className="text-xs border border-zinc-200 rounded-md px-2.5 py-1.5 bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All LOBs</option>
            {LOB_OPTIONS.map((lob) => (
              <option key={lob.code} value={lob.code}>
                {lob.label}
              </option>
            ))}
          </select>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="text-xs border border-zinc-200 rounded-md px-2.5 py-1.5 bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DRAFT">DRAFT</option>
            <option value="SCHEDULED">SCHEDULED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>
      </div>

      {/* 3. Product Catalog Grid Table */}
      <div className="bg-white border border-zinc-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">Line of Business</th>
                <th className="py-3 px-4">Insurer / Carrier</th>
                <th className="py-3 px-4">Settlement & Commission</th>
                <th className="py-3 px-4">Effective Window</th>
                <th className="py-3 px-4">Status & Version</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-zinc-500">
                    No products found matching the active search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isCustom = p.lob_code === "CUSTOM";
                  const ver = p.active_version;

                  return (
                    <tr key={p.product_id} className="hover:bg-zinc-50/70 transition-colors">
                      {/* Product Name & Code */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                            {ver.marketing_name}
                            {isCustom && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                100% UW Referral
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-zinc-500 text-[11px] flex items-center gap-2">
                            <span>Code: {ver.product_code}</span>
                            <span>•</span>
                            <span className="text-zinc-600">{ver.total_plans_count} Plans linked</span>
                          </div>
                        </div>
                      </td>

                      {/* LOB */}
                      <td className="py-3.5 px-4">
                        {isCustom ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 font-mono">
                            <FileCode2 className="w-3 h-3 text-purple-600" />
                            CUSTOM
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-800 border border-zinc-200 font-mono">
                            {p.lob_code}
                          </span>
                        )}
                      </td>

                      {/* Insurer */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-zinc-700">
                          <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{p.insurer_name}</span>
                        </div>
                      </td>

                      {/* Settlement & Commission */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="text-zinc-800 font-medium flex items-center gap-1">
                            <Percent className="w-3 h-3 text-zinc-400" />
                            <span>{ver.base_insurer_commission_percent.toFixed(1)}% Insurer Comm</span>
                          </div>
                          <div className="text-[11px] text-zinc-500 font-mono">
                            {ver.payee_type} ({ver.payment_timing === "BEFORE_ISSUANCE" ? "Pre-Issue" : "Post-Issue"})
                          </div>
                        </div>
                      </td>

                      {/* Effective Dates */}
                      <td className="py-3.5 px-4">
                        <div className="text-zinc-700 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span>{ver.effective_start_date}</span>
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          to {ver.effective_end_date ? ver.effective_end_date : "Open-Ended"}
                        </div>
                      </td>

                      {/* Status & Version */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                              ver.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : ver.status === "DRAFT"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : ver.status === "SCHEDULED"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-zinc-100 text-zinc-600 border-zinc-200"
                            }`}
                          >
                            {ver.status}
                          </span>
                          <span className="text-zinc-600 font-mono text-[11px] font-medium">{ver.version_number}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isCustom && (
                            <button
                              type="button"
                              onClick={() => navigate("/products/schemas")}
                              title="Configure Dynamic JSON Risk Schema"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded transition-colors"
                            >
                              <FileCode2 className="w-3 h-3 text-purple-600" />
                              Risk Schema
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => navigate("/products/plans")}
                            title="Configure Package Tiers & Benefits"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-100 border border-zinc-200 rounded transition-colors"
                          >
                            Plans ({ver.total_plans_count})
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCloneVersion(p.product_id)}
                            title="Clone New Version (SCD Type 2 Copy-on-Write)"
                            className="p-1 text-zinc-500 hover:text-blue-600 rounded hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
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
      </div>

      {/* 4. Modal: Create New Product (Includes Custom LOB Option) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-zinc-200 shadow-xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Create New Product (Header Snapshot)</h3>
                  <p className="text-xs text-zinc-500">
                    Initializes a new insurance blueprint under product_versions in DRAFT status.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Insurer Selector */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Underwriting Insurer <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newFormData.insurer_id}
                    onChange={(e) => setNewFormData({ ...newFormData, insurer_id: e.target.value })}
                    className="w-full text-xs px-2.5 py-2 border border-zinc-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {INSURER_OPTIONS.map((ins) => (
                      <option key={ins.id} value={ins.id}>
                        {ins.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Line of Business */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Line of Business (LOB) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newFormData.lob_code}
                    onChange={(e) =>
                      setNewFormData({
                        ...newFormData,
                        lob_code: e.target.value as LOBCode,
                      })
                    }
                    className="w-full text-xs px-2.5 py-2 border border-zinc-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  >
                    {LOB_OPTIONS.map((lob) => (
                      <option key={lob.code} value={lob.code}>
                        {lob.label} {lob.isCustom ? "⭐ (Bespoke Schema)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Informational Banner for Custom LOB */}
              {newFormData.lob_code === "CUSTOM" && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-md flex items-start gap-2.5 text-xs text-purple-900 leading-relaxed">
                  <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Custom Line of Business Selected:</strong>
                    <p className="text-[11px] text-purple-700 mt-0.5">
                      This product uses schema-less JSON storage (<code>custom_risk_data</code>) and triggers 100%
                      mandatory underwriting referral bypass (<code>PENDING_REVIEW</code>). After creation, configure
                      its fields via the <strong>Dynamic Schema Builder</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Product Code & Marketing Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Product Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CBR-CORP-2026"
                    value={newFormData.product_code}
                    onChange={(e) => setNewFormData({ ...newFormData, product_code: e.target.value })}
                    className="w-full text-xs font-mono uppercase px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Marketing / Commercial Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Enterprise Cyber Security Shield"
                    value={newFormData.marketing_name}
                    onChange={(e) => setNewFormData({ ...newFormData, marketing_name: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Settlement Configuration */}
              <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-md space-y-3">
                <div className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  Settlement & Routing Rules (Inheritable by Plans)
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Payee Type</label>
                    <select
                      value={newFormData.payee_type}
                      onChange={(e) =>
                        setNewFormData({
                          ...newFormData,
                          payee_type: e.target.value as PayeeType,
                        })
                      }
                      className="w-full text-xs px-2.5 py-1.5 border border-zinc-300 rounded bg-white"
                    >
                      <option value="BROKER">Customer pays BROKER</option>
                      <option value="INSURER">Customer pays INSURER</option>
                      <option value="THIRD_PARTY">Customer pays THIRD PARTY</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Payment Timing</label>
                    <select
                      value={newFormData.payment_timing}
                      onChange={(e) =>
                        setNewFormData({
                          ...newFormData,
                          payment_timing: e.target.value as PaymentTiming,
                        })
                      }
                      className="w-full text-xs px-2.5 py-1.5 border border-zinc-300 rounded bg-white"
                    >
                      <option value="BEFORE_ISSUANCE">BEFORE_ISSUANCE</option>
                      <option value="AFTER_ISSUANCE">AFTER_ISSUANCE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Base Insurer Comm (%) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      value={newFormData.base_insurer_commission_percent}
                      onChange={(e) =>
                        setNewFormData({
                          ...newFormData,
                          base_insurer_commission_percent: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full text-xs px-3 py-1.5 border border-zinc-300 rounded bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Time-Boxing Effective Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Effective Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newFormData.effective_start_date}
                    onChange={(e) => setNewFormData({ ...newFormData, effective_start_date: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-zinc-300 rounded-md focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Effective End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={newFormData.effective_end_date}
                    onChange={(e) => setNewFormData({ ...newFormData, effective_end_date: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-zinc-300 rounded-md focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
                >
                  Create DRAFT Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCatalogPage;
