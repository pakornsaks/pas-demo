import React, { useMemo, useState } from "react";

// --- Types & Interfaces ตามสเปก PAS Master Data ---
export interface VehicleBrand {
  brand_id: number;
  name_en: string;
  name_th: string;
  logo_url?: string;
}

export interface VehicleModel {
  model_id: number;
  brand_id: number;
  name_en: string;
  oic_vehicle_type_code: string; // เช่น 1.10 สำหรับเก๋ง, 1.20 สำหรับกระบะ
}

export interface VehicleSubModel {
  submodel_id: number;
  model_id: number;
  name: string;
  manufacture_year: number;
  oic_car_group: number;
  engine_cc?: number;
  battery_kwh?: number;
  redbook_min_value: number;
  redbook_max_value: number;
}

// --- ข้อมูลจำลอง (Mock Data) อิงจากสเปก SDD ---
const MOCK_BRANDS: VehicleBrand[] = [
  { brand_id: 1, name_en: "Toyota", name_th: "โตโยต้า" },
  { brand_id: 2, name_en: "Honda", name_th: "ฮอนด้า" },
  { brand_id: 3, name_en: "BYD", name_th: "บีวายดี" },
];

const MOCK_MODELS: VehicleModel[] = [
  { model_id: 101, brand_id: 1, name_en: "Camry", oic_vehicle_type_code: "1.10" },
  { model_id: 102, brand_id: 1, name_en: "Hilux Revo", oic_vehicle_type_code: "1.20" },
  { model_id: 201, brand_id: 2, name_en: "Civic", oic_vehicle_type_code: "1.10" },
  { model_id: 301, brand_id: 3, name_en: "Atto 3", oic_vehicle_type_code: "1.10" },
];

const MOCK_SUBMODELS: VehicleSubModel[] = [
  {
    submodel_id: 1001,
    model_id: 101,
    name: "2.0 G Luxury",
    manufacture_year: 2024,
    oic_car_group: 2,
    engine_cc: 1998,
    redbook_min_value: 1250000,
    redbook_max_value: 1450000,
  },
  {
    submodel_id: 1002,
    model_id: 101,
    name: "2.5 HEV Premium",
    manufacture_year: 2024,
    oic_car_group: 2,
    engine_cc: 2487,
    redbook_min_value: 1550000,
    redbook_max_value: 1780000,
  },
  {
    submodel_id: 1003,
    model_id: 101,
    name: "2.0 G",
    manufacture_year: 2023,
    oic_car_group: 2,
    engine_cc: 1998,
    redbook_min_value: 1100000,
    redbook_max_value: 1280000,
  },
  {
    submodel_id: 3001,
    model_id: 301,
    name: "Extended Range 60.48 kWh",
    manufacture_year: 2024,
    oic_car_group: 3,
    battery_kwh: 60.48,
    redbook_min_value: 850000,
    redbook_max_value: 999000,
  },
];

interface VehicleHierarchyPageProps {
  title?: string;
}

export default function VehicleHierarchyPage({
  title = "จัดเก็บโครงสร้างรถยนต์อย่างเป็นระบบตามลำดับขั้น (Brand → Model → Sub-model/Year)",
}: VehicleHierarchyPageProps) {
  // Cascading Selection States
  const [selectedBrandId, setSelectedBrandId] = useState<number | "">("");
  const [selectedModelId, setSelectedModelId] = useState<number | "">("");
  const [selectedYear, setSelectedYear] = useState<number | "">("");
  const [selectedSubModelId, setSelectedSubModelId] = useState<number | "">("");

  // Handler เมื่อเปลี่ยนยี่ห้อ (Brand) -> รีเซ็ตระดับถัดไปทั้งหมด
  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const brandId = e.target.value ? Number(e.target.value) : "";
    setSelectedBrandId(brandId);
    setSelectedModelId("");
    setSelectedYear("");
    setSelectedSubModelId("");
  };

  // Handler เมื่อเปลี่ยนรุ่น (Model) -> รีเซ็ตปีและรุ่นย่อย
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const modelId = e.target.value ? Number(e.target.value) : "";
    setSelectedModelId(modelId);
    setSelectedYear("");
    setSelectedSubModelId("");
  };

  // Handler เมื่อเปลี่ยนปี (Manufacture Year) -> รีเซ็ตรุ่นย่อย
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = e.target.value ? Number(e.target.value) : "";
    setSelectedYear(year);
    setSelectedSubModelId("");
  };

  // ตัวกรอง Model ตาม Brand ที่เลือก
  const availableModels = useMemo(() => {
    if (!selectedBrandId) return [];
    return MOCK_MODELS.filter((m) => m.brand_id === selectedBrandId);
  }, [selectedBrandId]);

  // ตัวกรอง Year ตาม Model ที่เลือก
  const availableYears = useMemo(() => {
    if (!selectedModelId) return [];
    const years = MOCK_SUBMODELS.filter((s) => s.model_id === selectedModelId).map((s) => s.manufacture_year);
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [selectedModelId]);

  // ตัวกรอง Sub-model ตาม Model และ Year ที่เลือก
  const availableSubModels = useMemo(() => {
    if (!selectedModelId || !selectedYear) return [];
    return MOCK_SUBMODELS.filter((s) => s.model_id === selectedModelId && s.manufacture_year === selectedYear);
  }, [selectedModelId, selectedYear]);

  // รายละเอียดของ Sub-model ที่เลือก
  const activeSubModel = useMemo(() => {
    return MOCK_SUBMODELS.find((s) => s.submodel_id === selectedSubModelId) || null;
  }, [selectedSubModelId]);

  const activeModel = useMemo(() => {
    return MOCK_MODELS.find((m) => m.model_id === selectedModelId) || null;
  }, [selectedModelId]);

  return (
    <div className="space-y-6">
      {/* ส่วนหัวหน้าจอตามรูปแบบ PlaceholderView */}
      <div className="p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          <span>Master Data Management</span>
          <span>•</span>
          <span>Redbook Cascading Lookup</span>
        </div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">{title}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          การจัดเก็บและเลือกข้อมูลแบบลำดับขั้น (Hierarchical Cascading Structure) ช่วยป้องกันข้อผิดพลาดจากการกรอกข้อมูล
          (Typo) พร้อมล็อกรหัสพิกัด คปภ. (OIC Code) และมูลค่าตลาดกลาง Redbook โดยอัตโนมัติ
        </p>
      </div>

      {/* ส่วนเลือกข้อมูลแบบ Cascading (Cascading Selector Form) */}
      <div className="p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-4">
          Cascading Vehicle Selector (ขั้นตอนการเลือกรถยนต์)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* ขั้นที่ 1: Brand */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              1. ยี่ห้อรถยนต์ (Brand)
            </label>
            <select
              value={selectedBrandId}
              onChange={handleBrandChange}
              className="w-full text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md p-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- เลือกยี่ห้อ --</option>
              {MOCK_BRANDS.map((brand) => (
                <option key={brand.brand_id} value={brand.brand_id}>
                  {brand.name_en} ({brand.name_th})
                </option>
              ))}
            </select>
          </div>

          {/* ขั้นที่ 2: Model */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              2. รุ่นรถยนต์ (Model)
            </label>
            <select
              value={selectedModelId}
              onChange={handleModelChange}
              disabled={!selectedBrandId}
              className="w-full text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md p-2.5 text-zinc-900 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- เลือกรุ่น --</option>
              {availableModels.map((model) => (
                <option key={model.model_id} value={model.model_id}>
                  {model.name_en}
                </option>
              ))}
            </select>
          </div>

          {/* ขั้นที่ 3: Year */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              3. ปีที่ผลิต (Year)
            </label>
            <select
              value={selectedYear}
              onChange={handleYearChange}
              disabled={!selectedModelId}
              className="w-full text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md p-2.5 text-zinc-900 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- เลือกปี --</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* ขั้นที่ 4: Sub-model */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              4. รุ่นย่อย / เกรด (Sub-model)
            </label>
            <select
              value={selectedSubModelId}
              onChange={(e) => setSelectedSubModelId(e.target.value ? Number(e.target.value) : "")}
              disabled={!selectedYear}
              className="w-full text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md p-2.5 text-zinc-900 dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- เลือกรุ่นย่อย --</option>
              {availableSubModels.map((sub) => (
                <option key={sub.submodel_id} value={sub.submodel_id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* แสดงผลการล็อกข้อมูลอัตโนมัติ (Resolved Master Data Payload) */}
        {activeSubModel && activeModel && (
          <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 mb-2">
              ✓ ข้อมูลที่เชื่อมโยงอัตโนมัติ (Auto-Resolved Technical Data)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-zinc-700 dark:text-zinc-300">
              <div>
                <span className="text-zinc-500 dark:text-zinc-400 block">OIC Vehicle Type:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {activeModel.oic_vehicle_type_code} (เก๋ง/กระบะ)
                </span>
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-400 block">OIC Car Group:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  กลุ่ม {activeSubModel.oic_car_group}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-400 block">
                  {activeSubModel.battery_kwh ? "ขนาดแบตเตอรี่:" : "ขนาดเครื่องยนต์:"}
                </span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {activeSubModel.battery_kwh
                    ? `${activeSubModel.battery_kwh} kWh (EV)`
                    : `${activeSubModel.engine_cc?.toLocaleString()} CC`}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-400 block">Redbook Market Value:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  ฿{activeSubModel.redbook_min_value.toLocaleString()} - ฿
                  {activeSubModel.redbook_max_value.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* คำอธิบายสถาปัตยกรรมฐานข้อมูล (Database Schema Reference) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Level 1: Brand</div>
          <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-1">vehicle_brand</h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            เป็น Master Anchor คงที่ของแบรนด์ผู้ผลิต เก็บประวัติการเปลี่ยนแปลงชื่อและโลโก้ผ่านตาราง{" "}
            <code className="text-blue-500">vehicle_brand_version</code> (SCD Type 2)
          </p>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Level 2: Model</div>
          <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-1">vehicle_model</h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            กลุ่มตระกูลรถยนต์ เชื่อมโยงกับรหัส <code className="text-blue-500">oic_vehicle_type_code</code> (เช่น 1.10)
            ใน <code className="text-blue-500">vehicle_model_version</code> เพื่อใช้คำนวณเบี้ย พ.ร.บ.
          </p>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Level 3: Sub-model & Year</div>
          <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-1">vehicle_submodel</h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            ระดับย่อยที่สุด (Trim/Grade/Year) บันทึกมูลค่าตลาดกลาง <code className="text-blue-500">redbook_value</code>{" "}
            และขนาดเครื่องยนต์/แบตเตอรี่ใน <code className="text-blue-500">vehicle_submodel_version</code>{" "}
            เพื่อใช้กำหนดกรอบทุนประกัน
          </p>
        </div>
      </div>
    </div>
  );
}
