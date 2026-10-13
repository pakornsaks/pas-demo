import {
  Car,
  Check,
  ChevronRight,
  FileSpreadsheet,
  Fuel,
  Info,
  Layers,
  Plus,
  Search,
  Star,
  UploadCloud,
  X,
  Zap,
} from "lucide-react";
import React, { useMemo, useState } from "react";

// ==========================================
// 1. DOMAIN INTERFACES & SCHEMAS (SDD 4.2 & 8.1.2)
// ==========================================

export type OICVehicleTypeCode = "1.10" | "1.20" | "1.30" | "1.40" | "2.10";

export interface VehicleBrand {
  brand_id: number;
  version_id: string;
  name_en: string;
  name_th: string;
  logo_url?: string;
  is_popular: boolean; // Drives API priority sorting (Screen 8.1.2)
  model_count: number;
  effective_start_date: string;
  effective_end_date: string | null;
}

export interface VehicleModel {
  model_id: number;
  brand_id: number;
  brand_name_en: string;
  version_id: string;
  name_en: string;
  oic_vehicle_type_code: OICVehicleTypeCode; // Drives CMI pricing (e.g. 1.10 Sedan, 1.20 Pickup)
  commercial_allowed: boolean; // Commercial use toggle (Screen 8.1.2)
  submodel_count: number;
  effective_start_date: string;
}

export interface VehicleSubmodel {
  submodel_id: number;
  model_id: number;
  model_name_en: string;
  brand_name_en: string;
  version_id: string;
  name: string; // e.g. "Extended Range 60.48 kWh" or "1.8 E"
  manufacture_year: number;
  engine_cc: number | null;
  battery_kwh: number | null; // For EV ratings (SDD Module 1)
  motor_wattage_kw?: number | null;
  seat_capacity: number;
  oic_car_group: number; // e.g. Class 1 to 5
  redbook_min_value: number; // Sum Insured boundary
  redbook_max_value: number; // Sum Insured boundary
  status: "ACTIVE" | "DRAFT" | "PENDING_APPROVAL"; // Maker-Checker / SCD Type 2
  effective_start_date: string;
}

// ==========================================
// 2. MOCK REFERENCE DATA (THAI MOTOR LOB)
// ==========================================

const INITIAL_BRANDS: VehicleBrand[] = [
  {
    brand_id: 1,
    version_id: "b-ver-001",
    name_en: "Toyota",
    name_th: "โตโยต้า",
    logo_url: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=64&h=64&fit=crop&q=80",
    is_popular: true,
    model_count: 8,
    effective_start_date: "2024-01-01",
    effective_end_date: null,
  },
  {
    brand_id: 2,
    version_id: "b-ver-002",
    name_en: "Honda",
    name_th: "ฮอนด้า",
    logo_url: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=64&h=64&fit=crop&q=80",
    is_popular: true,
    model_count: 6,
    effective_start_date: "2024-01-01",
    effective_end_date: null,
  },
  {
    brand_id: 3,
    version_id: "b-ver-003",
    name_en: "BYD",
    name_th: "บีวายดี",
    logo_url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=64&h=64&fit=crop&q=80",
    is_popular: true,
    model_count: 3,
    effective_start_date: "2024-01-01",
    effective_end_date: null,
  },
  {
    brand_id: 4,
    version_id: "b-ver-004",
    name_en: "Isuzu",
    name_th: "อีซูซุ",
    logo_url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=64&h=64&fit=crop&q=80",
    is_popular: false,
    model_count: 4,
    effective_start_date: "2024-01-01",
    effective_end_date: null,
  },
];

const INITIAL_MODELS: VehicleModel[] = [
  {
    model_id: 101,
    brand_id: 1,
    brand_name_en: "Toyota",
    version_id: "m-ver-101",
    name_en: "Camry",
    oic_vehicle_type_code: "1.10",
    commercial_allowed: false,
    submodel_count: 3,
    effective_start_date: "2024-01-01",
  },
  {
    model_id: 102,
    brand_id: 1,
    brand_name_en: "Toyota",
    version_id: "m-ver-102",
    name_en: "Hilux Revo",
    oic_vehicle_type_code: "1.20",
    commercial_allowed: true,
    submodel_count: 5,
    effective_start_date: "2024-01-01",
  },
  {
    model_id: 201,
    brand_id: 2,
    brand_name_en: "Honda",
    version_id: "m-ver-201",
    name_en: "Civic",
    oic_vehicle_type_code: "1.10",
    commercial_allowed: false,
    submodel_count: 4,
    effective_start_date: "2024-01-01",
  },
  {
    model_id: 301,
    brand_id: 3,
    brand_name_en: "BYD",
    version_id: "m-ver-301",
    name_en: "Atto 3",
    oic_vehicle_type_code: "1.10",
    commercial_allowed: false,
    submodel_count: 2,
    effective_start_date: "2024-01-01",
  },
];

const INITIAL_SUBMODELS: VehicleSubmodel[] = [
  {
    submodel_id: 1001,
    model_id: 101,
    model_name_en: "Camry",
    brand_name_en: "Toyota",
    version_id: "sm-ver-1001",
    name: "2.5 HEV Premium Luxury",
    manufacture_year: 2024,
    engine_cc: 2487,
    battery_kwh: 1.6,
    motor_wattage_kw: 131,
    seat_capacity: 5,
    oic_car_group: 2,
    redbook_min_value: 1550000,
    redbook_max_value: 1789000,
    status: "ACTIVE",
    effective_start_date: "2024-01-01",
  },
  {
    submodel_id: 1002,
    model_id: 101,
    model_name_en: "Camry",
    brand_name_en: "Toyota",
    version_id: "sm-ver-1002",
    name: "2.0 G AT",
    manufacture_year: 2023,
    engine_cc: 1998,
    battery_kwh: null,
    seat_capacity: 5,
    oic_car_group: 3,
    redbook_min_value: 1100000,
    redbook_max_value: 1250000,
    status: "ACTIVE",
    effective_start_date: "2024-01-01",
  },
  {
    submodel_id: 3001,
    model_id: 301,
    model_name_en: "Atto 3",
    brand_name_en: "BYD",
    version_id: "888e8400-e29b-41d4-a716-446655443333",
    name: "Extended Range 60.48 kWh",
    manufacture_year: 2024,
    engine_cc: null,
    battery_kwh: 60.48,
    motor_wattage_kw: 150,
    seat_capacity: 5,
    oic_car_group: 3,
    redbook_min_value: 850000,
    redbook_max_value: 999000,
    status: "ACTIVE",
    effective_start_date: "2024-01-01",
  },
  {
    submodel_id: 3002,
    model_id: 301,
    model_name_en: "Atto 3",
    brand_name_en: "BYD",
    version_id: "sm-ver-3002",
    name: "Standard Range 49.92 kWh",
    manufacture_year: 2024,
    engine_cc: null,
    battery_kwh: 49.92,
    motor_wattage_kw: 150,
    seat_capacity: 5,
    oic_car_group: 3,
    redbook_min_value: 750000,
    redbook_max_value: 899000,
    status: "DRAFT",
    effective_start_date: "2026-06-01",
  },
];

// OIC Type mapping reference (BRD Section 6.1)
const OIC_TYPES: Record<OICVehicleTypeCode, { label: string; desc: string }> = {
  "1.10": { label: "1.10 - Sedan / Passenger Car", desc: "Personal use <= 7 seats" },
  "1.20": { label: "1.20 - Pickup / Light Truck", desc: "Gross weight <= 3 tons" },
  "1.30": { label: "1.30 - Van / Passenger Van", desc: "Over 7 seats personal" },
  "1.40": { label: "1.40 - Commercial Heavy Truck", desc: "Commercial freight carrier" },
  "2.10": { label: "2.10 - Motorcycle Personal", desc: "Standard non-commercial bike" },
};

export const VehicleHierarchyPage: React.FC = () => {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<"hierarchy" | "brands" | "models" | "submodels">("hierarchy");

  // Search & Filtering States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(1); // Default Toyota
  const [selectedModelId, setSelectedModelId] = useState<number | null>(101); // Default Camry
  const [yearFilter, setYearFilter] = useState<number | "ALL">("ALL");

  // Master Data State
  const [brands, setBrands] = useState<VehicleBrand[]>(INITIAL_BRANDS);
  const [models, setModels] = useState<VehicleModel[]>(INITIAL_MODELS);
  const [submodels, setSubmodels] = useState<VehicleSubmodel[]>(INITIAL_SUBMODELS);

  // Modals
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Brand Modal
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [newBrandNameEn, setNewBrandNameEn] = useState("");
  const [newBrandNameTh, setNewBrandNameTh] = useState("");

  // Submodel Modal
  const [isSubmodelModalOpen, setIsSubmodelModalOpen] = useState(false);
  const [newSubmodelName, setNewSubmodelName] = useState("");
  const [newYear, setNewYear] = useState<number>(2024);
  const [newRedbookMin, setNewRedbookMin] = useState<number>(800000);
  const [newRedbookMax, setNewRedbookMax] = useState<number>(950000);
  const [newEngineCc, setNewEngineCc] = useState<string>("");
  const [newBatteryKwh, setNewBatteryKwh] = useState<string>("");
  const [newCarGroup, setNewCarGroup] = useState<number>(3);

  // Toggle Popular Brand Flag
  const togglePopularBrand = (brandId: number) => {
    setBrands((prev) => prev.map((b) => (b.brand_id === brandId ? { ...b, is_popular: !b.is_popular } : b)));
  };

  // Toggle Commercial Allowed for Model
  const toggleCommercial = (modelId: number) => {
    setModels((prev) =>
      prev.map((m) => (m.model_id === modelId ? { ...m, commercial_allowed: !m.commercial_allowed } : m)),
    );
  };

  // Change OIC Type for Model
  const updateOicType = (modelId: number, newCode: OICVehicleTypeCode) => {
    setModels((prev) => prev.map((m) => (m.model_id === modelId ? { ...m, oic_vehicle_type_code: newCode } : m)));
  };

  // Filtered sets based on cascading selections
  const currentBrandModels = useMemo(() => {
    if (!selectedBrandId) return [];
    return models.filter((m) => m.brand_id === selectedBrandId);
  }, [models, selectedBrandId]);

  const currentModelSubmodels = useMemo(() => {
    return submodels.filter((sm) => {
      const matchesModel = selectedModelId ? sm.model_id === selectedModelId : true;
      const matchesYear = yearFilter === "ALL" ? true : sm.manufacture_year === yearFilter;
      const matchesSearch =
        searchQuery.trim() === ""
          ? true
          : sm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sm.brand_name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sm.model_name_en.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesModel && matchesYear && matchesSearch;
    });
  }, [submodels, selectedModelId, yearFilter, searchQuery]);

  // Handle CSV Simulation
  const handleSimulateCsvUpload = () => {
    if (!csvFile) return;
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setIsCsvModalOpen(false);
        setCsvFile(null);
      }, 1400);
    }, 1200);
  };

  const handleAddBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandNameEn.trim()) return;
    const newBrand: VehicleBrand = {
      brand_id: Date.now(),
      version_id: `b-ver-${Date.now()}`,
      name_en: newBrandNameEn,
      name_th: newBrandNameTh || newBrandNameEn,
      is_popular: false,
      model_count: 0,
      effective_start_date: new Date().toISOString().split("T")[0],
      effective_end_date: null,
    };
    setBrands([newBrand, ...brands]);
    setIsBrandModalOpen(false);
    setNewBrandNameEn("");
    setNewBrandNameTh("");
  };

  const handleAddSubmodel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubmodelName.trim() || !selectedModelId) return;
    const currentModel = models.find((m) => m.model_id === selectedModelId);
    const newRecord: VehicleSubmodel = {
      submodel_id: Date.now(),
      model_id: selectedModelId,
      model_name_en: currentModel?.name_en || "Model",
      brand_name_en: currentModel?.brand_name_en || "Brand",
      version_id: `sm-ver-${Date.now()}`,
      name: newSubmodelName,
      manufacture_year: Number(newYear),
      engine_cc: newEngineCc ? Number(newEngineCc) : null,
      battery_kwh: newBatteryKwh ? Number(newBatteryKwh) : null,
      seat_capacity: 5,
      oic_car_group: Number(newCarGroup),
      redbook_min_value: Number(newRedbookMin),
      redbook_max_value: Number(newRedbookMax),
      status: "DRAFT", // Staged for Maker-Checker
      effective_start_date: new Date().toISOString().split("T")[0],
    };
    setSubmodels([newRecord, ...submodels]);
    setIsSubmodelModalOpen(false);
    setNewSubmodelName("");
    setNewEngineCc("");
    setNewBatteryKwh("");
  };

  return (
    // Note: pt-0 ensures no redundant top padding within the layout container
    <div className="w-full pt-0 space-y-6 text-zinc-900">
      {/* ======================================================== */}
      {/* 1. PAGE HEADER & BREADCRUMB */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
            <span>Master Data</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-zinc-600">Vehicle Hierarchy & Redbook</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mt-1 flex items-center gap-2.5">
            <Car className="w-6 h-6 text-zinc-800" />
            Vehicle Master Data
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage the 3-level Redbook valuation catalog, OIC vehicle type mapping, and EV battery ratings.
          </p>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg shadow-sm hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Import Redbook CSV
          </button>

          <button
            onClick={() => setIsSubmodelModalOpen(true)}
            disabled={!selectedModelId}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-zinc-900 rounded-lg shadow-sm hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Trim / Submodel
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. TAB CONTROLS & OVERVIEW METRICS */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-2">
        <nav className="flex space-x-1 sm:space-x-2">
          {[
            { id: "hierarchy", label: "Cascading Explorer", icon: Layers },
            { id: "brands", label: "Level 1: Brands", icon: Star },
            { id: "models", label: "Level 2: Models & OIC", icon: Car },
            { id: "submodels", label: "Level 3: Submodels & Values", icon: Zap },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-all ${
                  isActive
                    ? "bg-zinc-100 text-zinc-900 font-semibold"
                    : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-zinc-900" : "text-zinc-400"}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Quick Search across master database */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search make, model, trim..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 placeholder:text-zinc-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. VIEW MODE A: CASCADING 3-PANE EXPLORER (CORE WORKFLOW) */}
      {/* ======================================================== */}
      {activeTab === "hierarchy" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* PANE 1: BRANDS (LEVEL 1) */}
          <div className="lg:col-span-3 bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[680px]">
            <div className="p-3.5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-700 text-[11px] font-bold flex items-center justify-center">
                  1
                </span>
                <span className="text-xs font-bold text-zinc-800 uppercase tracking-wide">Vehicle Brands</span>
              </div>
              <button
                onClick={() => setIsBrandModalOpen(true)}
                className="text-xs text-zinc-700 hover:text-zinc-900 font-medium inline-flex items-center gap-1"
                title="Add New Brand"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            <div className="divide-y divide-zinc-100 overflow-y-auto flex-1">
              {brands.map((brand) => {
                const isSelected = selectedBrandId === brand.brand_id;
                return (
                  <div
                    key={brand.brand_id}
                    onClick={() => {
                      setSelectedBrandId(brand.brand_id);
                      const firstModel = models.find((m) => m.brand_id === brand.brand_id);
                      setSelectedModelId(firstModel ? firstModel.model_id : null);
                    }}
                    className={`p-3 cursor-pointer flex items-center justify-between group transition-colors ${
                      isSelected ? "bg-zinc-100/90 font-medium" : "hover:bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-xs text-zinc-700 shrink-0 overflow-hidden">
                        {brand.logo_url ? (
                          <img
                            src={brand.logo_url}
                            alt={brand.name_en}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          brand.name_en.slice(0, 2)
                        )}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                          {brand.name_en}
                          {brand.is_popular && <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />}
                        </div>
                        <div className="text-[11px] text-zinc-500 truncate">{brand.name_th}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-zinc-400 bg-zinc-200/60 px-1.5 py-0.5 rounded">
                        {models.filter((m) => m.brand_id === brand.brand_id).length} models
                      </span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${
                          isSelected ? "transform translate-x-0.5 text-zinc-800" : ""
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PANE 2: MODELS & OIC MAPPING (LEVEL 2) */}
          <div className="lg:col-span-4 bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[680px]">
            <div className="p-3.5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-700 text-[11px] font-bold flex items-center justify-center">
                  2
                </span>
                <span className="text-xs font-bold text-zinc-800 uppercase tracking-wide">Models & OIC Mapping</span>
              </div>
              <span className="text-[11px] text-zinc-500 font-normal">
                {brands.find((b) => b.brand_id === selectedBrandId)?.name_en || "Select Brand"}
              </span>
            </div>

            <div className="divide-y divide-zinc-100 overflow-y-auto flex-1">
              {currentBrandModels.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-400">No models registered under this brand.</div>
              ) : (
                currentBrandModels.map((model) => {
                  const isSelected = selectedModelId === model.model_id;
                  return (
                    <div
                      key={model.model_id}
                      onClick={() => setSelectedModelId(model.model_id)}
                      className={`p-3.5 cursor-pointer transition-colors ${
                        isSelected ? "bg-zinc-100/90" : "hover:bg-zinc-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-zinc-900">{model.name_en}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-200 text-zinc-800 border border-zinc-300">
                            OIC {model.oic_vehicle_type_code}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCommercial(model.model_id);
                            }}
                            className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                              model.commercial_allowed
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-zinc-100 text-zinc-600 border-zinc-200"
                            }`}
                          >
                            {model.commercial_allowed ? "Commercial OK" : "Personal Only"}
                          </button>
                        </div>

                        <span className="text-[11px] text-zinc-400">
                          {submodels.filter((s) => s.model_id === model.model_id).length} Trims
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* PANE 3: SUB-MODELS & REDBOOK VALUE BOUNDARIES (LEVEL 3) */}
          <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[680px]">
            <div className="p-3.5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-700 text-[11px] font-bold flex items-center justify-center">
                  3
                </span>
                <div>
                  <span className="text-xs font-bold text-zinc-800 uppercase tracking-wide">
                    Redbook Trims & Sum Insured
                  </span>
                </div>
              </div>

              {/* Year filter dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-zinc-400">Year:</span>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
                  className="text-xs bg-white border border-zinc-300 rounded px-2 py-1 focus:ring-1 focus:ring-zinc-900"
                >
                  <option value="ALL">All Years</option>
                  <option value={2024}>2024</option>
                  <option value={2023}>2023</option>
                  <option value={2022}>2022</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-zinc-50 border-b border-zinc-200 text-xs text-zinc-600 flex items-center justify-between">
              <span>
                Active Submodel Version:{" "}
                <strong className="text-zinc-900">
                  {models.find((m) => m.model_id === selectedModelId)?.name_en || "-"}
                </strong>
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">{currentModelSubmodels.length} Trims Listed</span>
            </div>

            <div className="divide-y divide-zinc-100 overflow-y-auto flex-1">
              {currentModelSubmodels.length === 0 ? (
                <div className="p-12 text-center text-xs text-zinc-400 flex flex-col items-center gap-2">
                  <Car className="w-8 h-8 text-zinc-300 stroke-1" />
                  No submodels found matching current filter criteria.
                </div>
              ) : (
                currentModelSubmodels.map((trim) => (
                  <div key={trim.submodel_id} className="p-4 hover:bg-zinc-50/70 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-zinc-900">{trim.name}</h4>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              trim.status === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {trim.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-500 flex items-center gap-2 mt-0.5">
                          <span>Year {trim.manufacture_year}</span>
                          <span>•</span>
                          <span>OIC Group {trim.oic_car_group}</span>
                          <span>•</span>
                          <span>{trim.seat_capacity} Seats</span>
                        </div>
                      </div>

                      {/* Engine vs EV Battery Pill */}
                      <div className="shrink-0">
                        {trim.battery_kwh ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <Zap className="w-3 h-3 text-emerald-600" />
                            {trim.battery_kwh} kWh
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-700 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-full">
                            <Fuel className="w-3 h-3 text-zinc-500" />
                            {trim.engine_cc} cc
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Redbook Range Box (Used for Underwriting Boundary Rules) */}
                    <div className="mt-3 p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-zinc-400 block tracking-wider">
                          Redbook Market Value Boundary
                        </span>
                        <span className="text-xs font-bold text-zinc-900">
                          THB {trim.redbook_min_value.toLocaleString()} – THB {trim.redbook_max_value.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-400 block">SCD Type 2 Version</span>
                        <span className="text-[10px] font-mono text-zinc-500">{trim.version_id.slice(0, 10)}...</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. VIEW MODE B: LEVEL 1 - BRAND MANAGER TABLE */}
      {/* ======================================================== */}
      {activeTab === "brands" && (
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-zinc-200 bg-zinc-50/60 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wide">
                Vehicle Brand Master (Level 1)
              </h3>
              <p className="text-[11px] text-zinc-500">
                Brands flagged as "Popular" are weighted higher in frontend headless selection drop-downs.
              </p>
            </div>
            <button
              onClick={() => setIsBrandModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Brand
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-100/50 text-[11px] text-zinc-500 font-medium uppercase tracking-wider">
                  <th className="py-3 px-4">Brand ID</th>
                  <th className="py-3 px-4">Manufacturer Name</th>
                  <th className="py-3 px-4">Thai Localization</th>
                  <th className="py-3 px-4 text-center">Popular Tier</th>
                  <th className="py-3 px-4">Models Configured</th>
                  <th className="py-3 px-4">Effective Since</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {brands.map((brand) => (
                  <tr key={brand.brand_id} className="hover:bg-zinc-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-zinc-500">#{brand.brand_id}</td>
                    <td className="py-3 px-4 font-semibold text-zinc-900 flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-[10px]">
                        {brand.name_en.slice(0, 2)}
                      </div>
                      {brand.name_en}
                    </td>
                    <td className="py-3 px-4 text-zinc-600">{brand.name_th}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => togglePopularBrand(brand.brand_id)}
                        className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border transition-all ${
                          brand.is_popular
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-zinc-50 text-zinc-500 border-zinc-200"
                        }`}
                      >
                        <Star className={`w-3 h-3 ${brand.is_popular ? "fill-amber-500 text-amber-500" : ""}`} />
                        {brand.is_popular ? "Popular" : "Standard"}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-zinc-600">
                      {models.filter((m) => m.brand_id === brand.brand_id).length} models
                    </td>
                    <td className="py-3 px-4 text-zinc-500">{brand.effective_start_date}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedBrandId(brand.brand_id);
                          setActiveTab("models");
                        }}
                        className="text-xs text-zinc-600 hover:text-zinc-900 font-medium inline-flex items-center gap-1"
                      >
                        Manage Models
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. VIEW MODE C: LEVEL 2 - MODEL MANAGER & OIC MAPPER */}
      {/* ======================================================== */}
      {activeTab === "models" && (
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-zinc-200 bg-zinc-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wide">
                Vehicle Model & OIC Category Mapper (Level 2)
              </h3>
              <p className="text-[11px] text-zinc-500">
                Maps each model to compulsory OIC vehicle type codes (e.g. 1.10 for Sedans, 1.20 for Pickups).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedBrandId || ""}
                onChange={(e) => setSelectedBrandId(Number(e.target.value))}
                className="text-xs bg-white border border-zinc-300 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-zinc-900 font-medium"
              >
                {brands.map((b) => (
                  <option key={b.brand_id} value={b.brand_id}>
                    Filter Make: {b.name_en}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-100/50 text-[11px] text-zinc-500 font-medium uppercase tracking-wider">
                  <th className="py-3 px-4">Model ID</th>
                  <th className="py-3 px-4">Brand</th>
                  <th className="py-3 px-4">Model Family</th>
                  <th className="py-3 px-4">OIC Vehicle Type Code</th>
                  <th className="py-3 px-4 text-center">Commercial Use</th>
                  <th className="py-3 px-4">Submodel Variations</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {models
                  .filter((m) => (selectedBrandId ? m.brand_id === selectedBrandId : true))
                  .map((model) => (
                    <tr key={model.model_id} className="hover:bg-zinc-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-zinc-500">#{model.model_id}</td>
                      <td className="py-3 px-4 font-medium text-zinc-700">{model.brand_name_en}</td>
                      <td className="py-3 px-4 font-bold text-zinc-900">{model.name_en}</td>
                      <td className="py-3 px-4">
                        <select
                          value={model.oic_vehicle_type_code}
                          onChange={(e) => updateOicType(model.model_id, e.target.value as OICVehicleTypeCode)}
                          className="text-xs font-semibold bg-zinc-50 border border-zinc-300 rounded px-2 py-1 text-zinc-800 focus:ring-1 focus:ring-zinc-900"
                        >
                          {(Object.keys(OIC_TYPES) as OICVehicleTypeCode[]).map((code) => (
                            <option key={code} value={code}>
                              {OIC_TYPES[code].label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleCommercial(model.model_id)}
                          className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full border transition-all ${
                            model.commercial_allowed
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-zinc-100 text-zinc-600 border-zinc-200"
                          }`}
                        >
                          {model.commercial_allowed ? "Allowed" : "Prohibited"}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-zinc-600">
                        {submodels.filter((s) => s.model_id === model.model_id).length} submodels
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedModelId(model.model_id);
                            setActiveTab("hierarchy");
                          }}
                          className="text-xs text-zinc-600 hover:text-zinc-900 font-medium inline-flex items-center gap-1"
                        >
                          View Hierarchy
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. VIEW MODE D: LEVEL 3 - ALL SUBMODELS & VALUATIONS */}
      {/* ======================================================== */}
      {activeTab === "submodels" && (
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-zinc-200 bg-zinc-50/60 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wide">
                Vehicle Submodels & Redbook Valuation Limits (Level 3)
              </h3>
              <p className="text-[11px] text-zinc-500">
                Determines the exact sum insured boundaries for motor policy underwriting and quotation engines.
              </p>
            </div>
            <button
              onClick={() => setIsSubmodelModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Submodel
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-100/50 text-[11px] text-zinc-500 font-medium uppercase tracking-wider">
                  <th className="py-3 px-4">Trim Name</th>
                  <th className="py-3 px-4">Make / Model</th>
                  <th className="py-3 px-4">Year</th>
                  <th className="py-3 px-4">Power / Powertrain</th>
                  <th className="py-3 px-4">OIC Group</th>
                  <th className="py-3 px-4">Redbook Min Value</th>
                  <th className="py-3 px-4">Redbook Max Value</th>
                  <th className="py-3 px-4">SCD Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {submodels.map((trim) => (
                  <tr key={trim.submodel_id} className="hover:bg-zinc-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-zinc-900">{trim.name}</td>
                    <td className="py-3 px-4 text-zinc-700">
                      {trim.brand_name_en} {trim.model_name_en}
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-600">{trim.manufacture_year}</td>
                    <td className="py-3 px-4">
                      {trim.battery_kwh ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <Zap className="w-3 h-3 text-emerald-600" />
                          {trim.battery_kwh} kWh (EV)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-700 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-full">
                          <Fuel className="w-3 h-3 text-zinc-500" />
                          {trim.engine_cc} cc
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-600">Class {trim.oic_car_group}</td>
                    <td className="py-3 px-4 font-semibold text-zinc-800">
                      THB {trim.redbook_min_value.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-zinc-800">
                      THB {trim.redbook_max_value.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          trim.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {trim.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. MODAL: IMPORT REDBOOK CSV WIZARD (SCREEN 8.1.2) */}
      {/* ======================================================== */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-xl max-w-lg w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsCsvModalOpen(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900">Import Redbook Valuation CSV</h3>
                <p className="text-xs text-zinc-500">
                  Bulk updates vehicle market values and sum insured boundaries via standard template.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Drop Area */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) setCsvFile(e.dataTransfer.files[0]);
                }}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                  csvFile ? "border-emerald-500 bg-emerald-50/20" : "border-zinc-300 hover:border-zinc-400 bg-zinc-50"
                }`}
                onClick={() => document.getElementById("redbook-csv-input")?.click()}
              >
                <input
                  id="redbook-csv-input"
                  type="file"
                  accept=".csv,.xlsx"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setCsvFile(e.target.files[0]);
                  }}
                />

                <UploadCloud className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                {csvFile ? (
                  <div className="text-xs">
                    <span className="font-semibold text-emerald-700">{csvFile.name}</span>
                    <span className="block text-zinc-400 text-[10px] mt-0.5">
                      {(csvFile.size / 1024).toFixed(1)} KB • Ready for validation
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-zinc-600">
                    <span className="font-semibold text-zinc-900">Click to upload</span> or drag and drop
                    <span className="block text-[11px] text-zinc-400 mt-1">
                      Standard format: redbook_valuation_template_v2.csv
                    </span>
                  </div>
                )}
              </div>

              {/* Notice on SCD Type 2 */}
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-[11px] text-zinc-600 flex items-start gap-2">
                <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Copy-on-Write (SCD Type 2):</strong> Existing values will not be overridden in-place. New
                  temporal version snapshots will be staged with approval flags.
                </span>
              </div>

              {/* Progress & Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCsvModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSimulateCsvUpload}
                  disabled={!csvFile || isUploading || uploadSuccess}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                >
                  {isUploading ? (
                    "Processing Rows..."
                  ) : uploadSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Uploaded Successfully
                    </>
                  ) : (
                    "Validate & Ingest"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. MODAL: ADD BRAND (LEVEL 1) */}
      {/* ======================================================== */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsBrandModalOpen(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-zinc-900 mb-1">Add Vehicle Manufacturer</h3>
            <p className="text-xs text-zinc-500 mb-4">
              Registers a new Level 1 vehicle brand container in the master dictionary.
            </p>

            <form onSubmit={handleAddBrand} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-zinc-700 mb-1">
                  Brand Name (English) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newBrandNameEn}
                  onChange={(e) => setNewBrandNameEn(e.target.value)}
                  placeholder="e.g. Mazda"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Brand Name (Thai)</label>
                <input
                  type="text"
                  value={newBrandNameTh}
                  onChange={(e) => setNewBrandNameTh(e.target.value)}
                  placeholder="e.g. มาสด้า"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBrandModalOpen(false)}
                  className="px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800"
                >
                  Save Brand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 9. MODAL: ADD SUBMODEL / TRIM (LEVEL 3) */}
      {/* ======================================================== */}
      {isSubmodelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-xl max-w-lg w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsSubmodelModalOpen(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-zinc-900 mb-1">Add Submodel & Valuation</h3>
            <p className="text-xs text-zinc-500 mb-4">
              Configuring submodel trim for:{" "}
              <strong className="text-zinc-900">{models.find((m) => m.model_id === selectedModelId)?.name_en}</strong>
            </p>

            <form onSubmit={handleAddSubmodel} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-zinc-700 mb-1">
                  Submodel / Trim Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newSubmodelName}
                  onChange={(e) => setNewSubmodelName(e.target.value)}
                  placeholder="e.g. 1.8 E CVT or Standard Range"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Manufacture Year</label>
                  <input
                    type="number"
                    value={newYear}
                    onChange={(e) => setNewYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">OIC Car Group</label>
                  <select
                    value={newCarGroup}
                    onChange={(e) => setNewCarGroup(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                  >
                    <option value={1}>Group 1 (Luxury / Imported)</option>
                    <option value={2}>Group 2 (Large Sedan / SUV)</option>
                    <option value={3}>Group 3 (Mid Sedan / Compact EV)</option>
                    <option value={4}>Group 4 (Eco Car / Small)</option>
                    <option value={5}>Group 5 (Commercial Pickup)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Engine CC (ICE)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1798"
                    value={newEngineCc}
                    onChange={(e) => setNewEngineCc(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Battery kWh (EV)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 60.48"
                    value={newBatteryKwh}
                    onChange={(e) => setNewBatteryKwh(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Redbook Min Value (THB)</label>
                  <input
                    type="number"
                    value={newRedbookMin}
                    onChange={(e) => setNewRedbookMin(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Redbook Max Value (THB)</label>
                  <input
                    type="number"
                    value={newRedbookMax}
                    onChange={(e) => setNewRedbookMax(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubmodelModalOpen(false)}
                  className="px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800"
                >
                  Create Version Snapshot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleHierarchyPage;
