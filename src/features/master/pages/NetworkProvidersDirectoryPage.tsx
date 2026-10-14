import React, { useMemo, useState } from "react";

// ============================================================================
// Types & Interfaces (Mapped strictly to SDD 3.2.3 E & 4.2 DDL)
// ============================================================================

export type ProviderType = "GARAGE" | "HOSPITAL" | "CLINIC";
export type GarageRepairType = "STANDARD_GARAGE" | "DEALER_GARAGE";
export type NetworkStatus = "ACTIVE" | "INACTIVE";

export interface InsurerLookup {
  insurer_id: string;
  name_en: string;
  name_th: string;
}

export interface ProvinceLookup {
  province_id: number;
  name_en: string;
  name_th: string;
}

export interface NetworkProviderRecord {
  provider_id: string; // UUID anchor
  provider_code: string; // e.g., "PRV-99182"
  name_th: string;
  name_en: string;
  provider_type: ProviderType;
  garage_repair_type?: GarageRepairType; // Enum: STANDARD_GARAGE, DEALER_GARAGE
  contact_number: string;
  address: string;
  province_id: number;
  province_name_en: string;
  province_name_th: string;
  latitude: number;
  longitude: number;
  tax_id: string;
  associated_insurers: string[]; // insurer_id foreign keys via insurer_network_providers
  status: NetworkStatus;
  effective_start_date: string;
}

// ============================================================================
// Reference Seed Data
// ============================================================================

const INSURERS_SEED: InsurerLookup[] = [
  { insurer_id: "ins-viriyah-001", name_en: "Viriyah Insurance", name_th: "วิริยะประกันภัย" },
  { insurer_id: "ins-aia-002", name_en: "AIA Thailand", name_th: "เอไอเอ ประเทศไทย" },
  { insurer_id: "ins-mti-003", name_en: "Muang Thai Insurance", name_th: "เมืองไทยประกันภัย" },
  { insurer_id: "ins-msig-004", name_en: "MSIG Insurance", name_th: "เอ็ม เอส ไอ จี ประกันภัย" },
];

const PROVINCES_SEED: ProvinceLookup[] = [
  { province_id: 1, name_en: "Bangkok", name_th: "กรุงเทพมหานคร" },
  { province_id: 2, name_en: "Chiang Mai", name_th: "เชียงใหม่" },
  { province_id: 3, name_en: "Chonburi", name_th: "ชลบุรี" },
  { province_id: 4, name_en: "Phuket", name_th: "ภูเก็ต" },
  { province_id: 5, name_en: "Khon Kaen", name_th: "ขอนแก่น" },
];

const PROVIDERS_SEED: NetworkProviderRecord[] = [
  {
    provider_id: "6b6c0e44-42ea-4c91-9e58-45a9be46bb01",
    provider_code: "PRV-99182",
    name_th: "อู่สมชายเจริญยนต์",
    name_en: "Somchai Charoen Yon Garage",
    provider_type: "GARAGE",
    garage_repair_type: "STANDARD_GARAGE",
    contact_number: "02-111-2222",
    address: "123 Sukhumvit Rd, Khlong Toei, Bangkok 10110",
    province_id: 1,
    province_name_en: "Bangkok",
    province_name_th: "กรุงเทพมหานคร",
    latitude: 13.7189,
    longitude: 100.5694,
    tax_id: "0105551234567",
    associated_insurers: ["ins-viriyah-001", "ins-mti-003", "ins-msig-004"],
    status: "ACTIVE",
    effective_start_date: "2026-01-01T00:00:00Z",
  },
  {
    provider_id: "8a3014a9-cf56-4d1d-91b4-ff73ef5e632d",
    provider_code: "PRV-99183",
    name_th: "ศูนย์บริการสยามออโต้ บอดี้แอนด์เพนต์",
    name_en: "Siam Auto Body & Paint Center (Dealer)",
    provider_type: "GARAGE",
    garage_repair_type: "DEALER_GARAGE",
    contact_number: "02-789-9900",
    address: "456 Rama 9 Rd, Huai Khwang, Bangkok 10310",
    province_id: 1,
    province_name_en: "Bangkok",
    province_name_th: "กรุงเทพมหานคร",
    latitude: 13.7541,
    longitude: 100.5784,
    tax_id: "0105557654321",
    associated_insurers: ["ins-viriyah-001", "ins-msig-004"],
    status: "ACTIVE",
    effective_start_date: "2026-01-01T00:00:00Z",
  },
  {
    provider_id: "bc68700d-58d7-463d-8e40-9a572a1d35a8",
    provider_code: "PRV-88201",
    name_th: "โรงพยาบาลกรุงเทพ สยามเมดิคอล",
    name_en: "Bangkok Siam Medical Hospital",
    provider_type: "HOSPITAL",
    contact_number: "02-310-3000",
    address: "2 Soi Soonvijai 7, New Petchburi Rd, Bang Kapi, Bangkok 10310",
    province_id: 1,
    province_name_en: "Bangkok",
    province_name_th: "กรุงเทพมหานคร",
    latitude: 13.7483,
    longitude: 100.5835,
    tax_id: "0107536000211",
    associated_insurers: ["ins-aia-002", "ins-mti-003"],
    status: "ACTIVE",
    effective_start_date: "2026-01-15T00:00:00Z",
  },
  {
    provider_id: "dd73b3e2-82ab-4131-89ce-28153b92cb14",
    provider_code: "PRV-88202",
    name_th: "เชียงใหม่ ลานนา คลินิกเวชกรรม",
    name_en: "Chiang Mai Lanna Medical Clinic",
    provider_type: "CLINIC",
    contact_number: "053-211-155",
    address: "88 Huay Kaew Rd, Chang Phueak, Mueang, Chiang Mai 50300",
    province_id: 2,
    province_name_en: "Chiang Mai",
    province_name_th: "เชียงใหม่",
    latitude: 18.8025,
    longitude: 98.9669,
    tax_id: "0505558901234",
    associated_insurers: ["ins-aia-002", "ins-viriyah-001"],
    status: "ACTIVE",
    effective_start_date: "2026-02-01T00:00:00Z",
  },
  {
    provider_id: "ff114e92-38ea-4861-bf9a-32e6504a7421",
    provider_code: "PRV-99340",
    name_th: "อู่ชลบุรีเซอร์วิสการช่าง",
    name_en: "Chonburi Service Kanchang Garage",
    provider_type: "GARAGE",
    garage_repair_type: "STANDARD_GARAGE",
    contact_number: "038-288-444",
    address: "99/1 Sukhumvit Rd, Saen Suk, Mueang, Chonburi 20130",
    province_id: 3,
    province_name_en: "Chonburi",
    province_name_th: "ชลบุรี",
    latitude: 13.2842,
    longitude: 100.9256,
    tax_id: "0205559871122",
    associated_insurers: ["ins-mti-003"],
    status: "INACTIVE",
    effective_start_date: "2026-01-01T00:00:00Z",
  },
];

export const NetworkProvidersDirectoryPage: React.FC = () => {
  // Query Filter States (matching GET /reference/network-providers parameters)
  const [selectedInsurer, setSelectedInsurer] = useState<string>("ALL");
  const [selectedProviderType, setSelectedProviderType] = useState<string>("ALL");
  const [selectedGarageRepairType, setSelectedGarageRepairType] = useState<string>("ALL");
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>("ALL");
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  // Inspection / Mapping Modal
  const [selectedProvider, setSelectedProvider] = useState<NetworkProviderRecord | null>(null);

  // Filter Pipeline
  const filteredRecords = useMemo(() => {
    return PROVIDERS_SEED.filter((item) => {
      // Insurer mapping check
      if (selectedInsurer !== "ALL" && !item.associated_insurers.includes(selectedInsurer)) {
        return false;
      }
      // Provider Type
      if (selectedProviderType !== "ALL" && item.provider_type !== selectedProviderType) {
        return false;
      }
      // Garage Repair Sub-type (Standard vs Dealer)
      if (
        selectedProviderType === "GARAGE" &&
        selectedGarageRepairType !== "ALL" &&
        item.garage_repair_type !== selectedGarageRepairType
      ) {
        return false;
      }
      // Province filter
      if (selectedProvinceId !== "ALL" && item.province_id !== Number(selectedProvinceId)) {
        return false;
      }
      // Keyword Search (Code, Name TH, Name EN, Tax ID)
      if (searchKeyword.trim() !== "") {
        const query = searchKeyword.toLowerCase();
        const matchesCode = item.provider_code.toLowerCase().includes(query);
        const matchesEn = item.name_en.toLowerCase().includes(query);
        const matchesTh = item.name_th.toLowerCase().includes(query);
        const matchesTax = item.tax_id.toLowerCase().includes(query);
        if (!matchesCode && !matchesEn && !matchesTh && !matchesTax) {
          return false;
        }
      }
      return true;
    });
  }, [selectedInsurer, selectedProviderType, selectedGarageRepairType, selectedProvinceId, searchKeyword]);

  // Aggregate Metrics
  const stats = useMemo(() => {
    return {
      total: PROVIDERS_SEED.length,
      garages: PROVIDERS_SEED.filter((p) => p.provider_type === "GARAGE").length,
      hospitals: PROVIDERS_SEED.filter((p) => p.provider_type === "HOSPITAL").length,
      clinics: PROVIDERS_SEED.filter((p) => p.provider_type === "CLINIC").length,
      active: PROVIDERS_SEED.filter((p) => p.status === "ACTIVE").length,
    };
  }, []);

  const getTypeBadgeClass = (type: ProviderType) => {
    switch (type) {
      case "GARAGE":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "HOSPITAL":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "CLINIC":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="min-h-screen text-slate-800">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              MODULE 1 & 6: MASTER DATA
            </span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              SCD TYPE 2
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">Network Providers Directory</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Directory and insurer affiliation registry for Garages, Hospitals, and Clinics (`GET
            /reference/network-providers`).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert("Trigger batch synchronization with Insurer SFTP / API provider files.")}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-sm"
          >
            Sync Partner Networks
          </button>
          <button
            onClick={() => alert("Add Provider workflow triggers Maker-Checker approval request.")}
            className="px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-sm"
          >
            + Register Provider
          </button>
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 my-6">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Registered</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{stats.active} Active in Master Data</div>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-blue-600 uppercase tracking-wider">Garages (Motor)</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.garages}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Standard & Dealer facilities</div>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-rose-600 uppercase tracking-wider">Hospitals (Health)</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.hospitals}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Emergency & Inpatient centres</div>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-purple-600 uppercase tracking-wider">Clinics (Outpatient)</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.clinics}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Regional OPD Network</div>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm col-span-2 md:col-span-1">
          <div className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Insurer Coverage</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">4 Partners</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Viriyah, AIA, MTI, MSIG</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Insurer Filter (Mandatory parameter in Core API) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Underwriting Insurer</label>
            <select
              className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedInsurer}
              onChange={(e) => setSelectedInsurer(e.target.value)}
            >
              <option value="ALL">All Insurers (Aggregated)</option>
              {INSURERS_SEED.map((ins) => (
                <option key={ins.insurer_id} value={ins.insurer_id}>
                  {ins.name_en} ({ins.name_th})
                </option>
              ))}
            </select>
          </div>

          {/* Provider Type Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Facility Type</label>
            <select
              className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedProviderType}
              onChange={(e) => {
                setSelectedProviderType(e.target.value);
                if (e.target.value !== "GARAGE") setSelectedGarageRepairType("ALL");
              }}
            >
              <option value="ALL">All Provider Types</option>
              <option value="GARAGE">GARAGE (Auto Repairs)</option>
              <option value="HOSPITAL">HOSPITAL (Inpatient Care)</option>
              <option value="CLINIC">CLINIC (Outpatient / OPD)</option>
            </select>
          </div>

          {/* Garage Repair Type Sub-filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Garage Sub-Category</label>
            <select
              disabled={selectedProviderType !== "GARAGE"}
              className={`w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                selectedProviderType !== "GARAGE" ? "opacity-50 cursor-not-allowed" : ""
              }`}
              value={selectedGarageRepairType}
              onChange={(e) => setSelectedGarageRepairType(e.target.value)}
            >
              <option value="ALL">All Garage Categories</option>
              <option value="STANDARD_GARAGE">Standard (อู่นอกห้าง)</option>
              <option value="DEALER_GARAGE">Dealer Center (อู่ห้าง / ศูนย์)</option>
            </select>
          </div>

          {/* Province Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Province (geo_city)</label>
            <select
              className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedProvinceId}
              onChange={(e) => setSelectedProvinceId(e.target.value)}
            >
              <option value="ALL">All Provinces</option>
              {PROVINCES_SEED.map((prov) => (
                <option key={prov.province_id} value={prov.province_id}>
                  {prov.name_en} ({prov.name_th})
                </option>
              ))}
            </select>
          </div>

          {/* Keyword Search */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Keyword / Tax ID</label>
            <input
              type="text"
              placeholder="Search code, name, tax ID..."
              className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>
        </div>

        {/* Active Filters Summary */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div>
            Showing <span className="font-semibold text-slate-900">{filteredRecords.length}</span> matching provider
            records
          </div>
          {(selectedInsurer !== "ALL" ||
            selectedProviderType !== "ALL" ||
            selectedGarageRepairType !== "ALL" ||
            selectedProvinceId !== "ALL" ||
            searchKeyword !== "") && (
            <button
              onClick={() => {
                setSelectedInsurer("ALL");
                setSelectedProviderType("ALL");
                setSelectedGarageRepairType("ALL");
                setSelectedProvinceId("ALL");
                setSearchKeyword("");
              }}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Directory Table View */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Provider Code & Type</th>
                <th className="py-3 px-4">Facility Name (TH / EN)</th>
                <th className="py-3 px-4">Province & Address</th>
                <th className="py-3 px-4">Contact & Coordinates</th>
                <th className="py-3 px-4">Approved Insurers</th>
                <th className="py-3 px-4">Tax ID / Billing</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <p className="font-medium">No network facilities matched the specified search parameters.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Check selected Insurer partner or Province mapping.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => (
                  <tr key={item.provider_id} className="hover:bg-slate-50 transition">
                    {/* Code & Type */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">{item.provider_code}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] border font-medium ${getTypeBadgeClass(
                            item.provider_type,
                          )}`}
                        >
                          {item.provider_type}
                        </span>
                        {item.garage_repair_type && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
                            {item.garage_repair_type === "DEALER_GARAGE" ? "DEALER" : "STANDARD"}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Names */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900 line-clamp-1">{item.name_th}</div>
                      <div className="text-slate-500 text-[11px] line-clamp-1">{item.name_en}</div>
                    </td>

                    {/* Address & Province */}
                    <td className="py-3 px-4 max-w-sm">
                      <div className="font-medium text-slate-800">
                        {item.province_name_en} <span className="text-slate-400">({item.province_name_th})</span>
                      </div>
                      <div className="text-slate-500 text-[11px] truncate mt-0.5">{item.address}</div>
                    </td>

                    {/* Contact & Geo */}
                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-800">
                        <a href={`tel:${item.contact_number}`} className="hover:text-indigo-600">
                          {item.contact_number}
                        </a>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        <a
                          href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          📍 {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                        </a>
                      </div>
                    </td>

                    {/* Approved Insurers (insurer_network_providers) */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {item.associated_insurers.map((id) => {
                          const ins = INSURERS_SEED.find((x) => x.insurer_id === id);
                          return (
                            <span
                              key={id}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200"
                              title={ins?.name_th}
                            >
                              {ins?.name_en.split(" ")[0]}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    {/* Tax ID */}
                    <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">{item.tax_id}</td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          item.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedProvider(item)}
                        className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Facility Inspection & Detail Drawer / Modal */}
      {selectedProvider && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <span className="text-[11px] font-mono font-bold text-indigo-600 uppercase">
                  {selectedProvider.provider_code}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedProvider.name_en}</h3>
                <p className="text-xs text-slate-500">{selectedProvider.name_th}</p>
              </div>
              <button
                onClick={() => setSelectedProvider(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-semibold block">Category</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {selectedProvider.provider_type}
                    {selectedProvider.garage_repair_type && ` (${selectedProvider.garage_repair_type})`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-semibold block">Corporate Tax ID</span>
                  <span className="font-mono text-slate-800 text-sm">{selectedProvider.tax_id}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 uppercase text-[10px] font-semibold block">Full Address</span>
                <p className="text-slate-800 mt-0.5">{selectedProvider.address}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-semibold block">Direct Telephone</span>
                  <span className="font-mono font-medium text-slate-800">{selectedProvider.contact_number}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-semibold block">
                    Coordinates (Lat, Long)
                  </span>
                  <span className="font-mono text-slate-800">
                    {selectedProvider.latitude}, {selectedProvider.longitude}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 uppercase text-[10px] font-semibold block mb-2">
                  Mapped Insurer Networks (`insurer_network_providers`)
                </span>
                <div className="space-y-1.5">
                  {INSURERS_SEED.map((ins) => {
                    const isAffiliated = selectedProvider.associated_insurers.includes(ins.insurer_id);
                    return (
                      <div
                        key={ins.insurer_id}
                        className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200"
                      >
                        <span className="font-medium text-slate-700">
                          {ins.name_en} <span className="text-slate-400">({ins.name_th})</span>
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isAffiliated
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          {isAffiliated ? "CONTRACTED" : "NOT LINKED"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-400">
                Record Versioning Anchor:{" "}
                <span className="font-mono text-slate-600">{selectedProvider.provider_id}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedProvider(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-white text-xs font-medium"
              >
                Close
              </button>
              <button
                onClick={() =>
                  alert("Stage change: creates DRAFT version in network_provider_versions via Maker-Checker.")
                }
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium"
              >
                Edit Provider Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkProvidersDirectoryPage;
