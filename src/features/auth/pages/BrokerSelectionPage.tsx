import {
  AlertCircle,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  MessageSquare,
  MoreVertical,
  Plus,
  Search,
  User,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// ============================================================================
// Data Contracts & Types (Aligned with SDD Section 4.3 & BRD Section 6.2)
// ============================================================================

export type LOBType = "MOTOR" | "HEALTH" | "FIRE" | "TRAVEL" | "PA" | "LIFE" | "CUSTOM";

export type BrokerStatus = "ACTIVE" | "INACTIVE" | "PENDING_RENEWAL";

export interface BrokerRecord {
  broker_id: string; // UUID from brokers table
  broker_code: string; // Permanent license code (e.g. BRK-001)
  partner_id?: string | null;
  partner_name?: string; // e.g. "Direct Affiliate", "Siam Commercial Bank"
  broker_name_en: string;
  broker_name_th: string;
  logo_url?: string;
  status: BrokerStatus;
  license_details: {
    oic_license_no: string;
    expiry_date: string; // ISO Date String
  };
  authorized_lobs: LOBType[]; // from broker_versions.authorized_lobs
  monthly_pay_date: number; // 1-31 from broker_insurer_settings
  revenue_mtd_thb: number; // Aggregated from transactions
  active_policies_count: number;
  city: string;
  country: string;
}

// ============================================================================
// Mock Data (Representing database snapshot from brokers & broker_versions)
// ============================================================================

const MOCK_BROKERS: BrokerRecord[] = [
  {
    broker_id: "550e8400-e29b-41d4-a716-446655440001",
    broker_code: "BRK-9SINGHA-HQ",
    partner_id: "part-01",
    partner_name: "9 Singha Group",
    broker_name_en: "9 Singha Insurance Broker Co., Ltd.",
    broker_name_th: "บริษัท ไนน์ สิงห์ อินชัวรันส์ โบรคเกอร์ จำกัด (มหาชน)",
    status: "ACTIVE",
    license_details: {
      oic_license_no: "OIC-B-2024/9912",
      expiry_date: "2028-12-31",
    },
    authorized_lobs: ["MOTOR", "HEALTH", "FIRE", "LIFE", "PA"],
    monthly_pay_date: 15,
    revenue_mtd_thb: 3845000,
    active_policies_count: 1420,
    city: "Bangkok",
    country: "Thailand",
  },
  {
    broker_id: "550e8400-e29b-41d4-a716-446655440002",
    broker_code: "BRK-VRY-ALLIANCE",
    partner_id: "part-02",
    partner_name: "Viriyah Alliance Partner",
    broker_name_en: "Siam Motor & General Brokerage",
    broker_name_th: "สยาม มอเตอร์ แอนด์ เจเนอรัล โบรคเกอร์",
    status: "ACTIVE",
    license_details: {
      oic_license_no: "OIC-B-2023/4521",
      expiry_date: "2027-06-30",
    },
    authorized_lobs: ["MOTOR", "TRAVEL", "PA"],
    monthly_pay_date: 20,
    revenue_mtd_thb: 1920000,
    active_policies_count: 830,
    city: "Nonthaburi",
    country: "Thailand",
  },
  {
    broker_id: "550e8400-e29b-41d4-a716-446655440003",
    broker_code: "BRK-HLTH-CARE",
    partner_id: "part-03",
    partner_name: "BDMS Health Group",
    broker_name_en: "Aegis Life & Health Solutions",
    broker_name_th: "เอจิส ไลฟ์ แอนด์ เฮลธ์ โซลูชั่นส์",
    status: "PENDING_RENEWAL",
    license_details: {
      oic_license_no: "OIC-B-2021/1109",
      expiry_date: "2026-11-01",
    },
    authorized_lobs: ["HEALTH", "LIFE"],
    monthly_pay_date: 25,
    revenue_mtd_thb: 740000,
    active_policies_count: 310,
    city: "Chiang Mai",
    country: "Thailand",
  },
  {
    broker_id: "550e8400-e29b-41d4-a716-446655440004",
    broker_code: "BRK-DIRECT-WEB",
    partner_id: null,
    partner_name: "Direct Online Sales",
    broker_name_en: "FinTech Direct Digital Broker",
    broker_name_th: "ฟินเทค ไดเร็ค ดิจิทัล โบรคเกอร์",
    status: "ACTIVE",
    license_details: {
      oic_license_no: "OIC-B-2025/0043",
      expiry_date: "2029-01-15",
    },
    authorized_lobs: ["MOTOR", "TRAVEL", "PA", "CUSTOM"],
    monthly_pay_date: 10,
    revenue_mtd_thb: 5210000,
    active_policies_count: 2640,
    city: "Bangkok",
    country: "Thailand",
  },
  {
    broker_id: "550e8400-e29b-41d4-a716-446655440005",
    broker_code: "BRK-SOUTH-CORP",
    partner_id: "part-04",
    partner_name: "Southern Logistics Network",
    broker_name_en: "Andaman Marine & Commercial Agency",
    broker_name_th: "อันดามัน มารีน แอนด์ คอมเมอร์เชียล เอเจนซี",
    status: "INACTIVE",
    license_details: {
      oic_license_no: "OIC-B-2019/8821",
      expiry_date: "2024-12-31",
    },
    authorized_lobs: ["FIRE", "CUSTOM"],
    monthly_pay_date: 28,
    revenue_mtd_thb: 0,
    active_policies_count: 42,
    city: "Phuket",
    country: "Thailand",
  },
];

// ============================================================================
// Props Definition
// ============================================================================

interface BrokerSelectionPageProps {
  currentBrokerId?: string;
  onCreateBroker?: () => void;
}

export const BrokerSelectionPage: React.FC<BrokerSelectionPageProps> = ({ currentBrokerId, onCreateBroker }) => {
  const navigate = useNavigate();
  // --------------------------------------------------------------------------
  // Component State
  // --------------------------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [lobFilter, setLobFilter] = useState<string>("ALL");
  const [partnerFilter, setPartnerFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<"name" | "revenue" | "policies">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // Unique Partners for Filter Dropdown
  // --------------------------------------------------------------------------
  const partnerOptions = useMemo(() => {
    const list = Array.from(new Set(MOCK_BROKERS.map((b) => b.partner_name).filter(Boolean)));
    return list as string[];
  }, []);

  // --------------------------------------------------------------------------
  // Filter & Sort Logic
  // --------------------------------------------------------------------------
  const filteredBrokers = useMemo(() => {
    return MOCK_BROKERS.filter((broker) => {
      // Search match
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        broker.broker_name_en.toLowerCase().includes(query) ||
        broker.broker_name_th.toLowerCase().includes(query) ||
        broker.broker_code.toLowerCase().includes(query) ||
        broker.license_details.oic_license_no.toLowerCase().includes(query);

      // Status filter
      const matchesStatus = statusFilter === "ALL" || broker.status === statusFilter;

      // LOB filter
      const matchesLob = lobFilter === "ALL" || broker.authorized_lobs.includes(lobFilter as LOBType);

      // Partner filter
      const matchesPartner = partnerFilter === "ALL" || broker.partner_name === partnerFilter;

      return matchesSearch && matchesStatus && matchesLob && matchesPartner;
    }).sort((a, b) => {
      if (sortField === "name") {
        const cmp = a.broker_name_en.localeCompare(b.broker_name_en);
        return sortOrder === "asc" ? cmp : -cmp;
      }
      if (sortField === "revenue") {
        return sortOrder === "asc" ? a.revenue_mtd_thb - b.revenue_mtd_thb : b.revenue_mtd_thb - a.revenue_mtd_thb;
      }
      if (sortField === "policies") {
        return sortOrder === "asc"
          ? a.active_policies_count - b.active_policies_count
          : b.active_policies_count - a.active_policies_count;
      }
      return 0;
    });
  }, [searchQuery, statusFilter, lobFilter, partnerFilter, sortField, sortOrder]);

  // Pagination slicing
  const totalPages = Math.max(1, Math.ceil(filteredBrokers.length / pageSize));
  const paginatedBrokers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBrokers.slice(start, start + pageSize);
  }, [filteredBrokers, currentPage, pageSize]);

  // Handle Sort Toggle
  const toggleSort = (field: "name" | "revenue" | "policies") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleSelectBroker = async (_broker: BrokerRecord) => {
    navigate("/reports/analytics");
  };

  // Helper: Status Pill
  const renderStatusPill = (status: BrokerStatus) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 mr-1.5 bg-emerald-500 rounded-full"></span>
            Active
          </span>
        );
      case "PENDING_RENEWAL":
        return (
          <span className="inline-flex items-center text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3 mr-1 text-amber-500" />
            Renewal Due
          </span>
        );
      case "INACTIVE":
        return (
          <span className="inline-flex items-center text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3 mr-1 text-gray-400" />
            Inactive
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen text-slate-800 font-sans antialiased">
      {/* ==================================================================== */}
      {/* 1. TOP NAVIGATION BAR (Agoda Partner Portal Style)                   */}
      {/* ==================================================================== */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
          {/* Left Brand & Active Entity Switcher */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              {/* Logo / Emblem */}
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                P
              </div>
              <div className="leading-tight">
                <span className="font-bold text-slate-900 tracking-tight text-lg">
                  Unified<span className="text-blue-600">PAS</span>
                </span>
                <span className="text-[10px] block font-medium uppercase tracking-wider text-slate-400">
                  Broker Portal
                </span>
              </div>
            </div>

            <div className="h-6 w-px bg-gray-200" />

            {/* Entity Context Quick Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center space-x-2.5 px-3 py-1.5 rounded-full border border-gray-300 hover:border-gray-400 bg-white text-sm font-medium text-slate-700 transition"
              >
                <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <span>All Brokers</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center space-x-4">
            <button
              title="Support & Messages"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-gray-100 rounded-full transition"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <button
              title="User Account"
              className="flex items-center space-x-2 p-1.5 rounded-full text-slate-700 hover:bg-gray-100 transition"
            >
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                <User className="w-5 h-5" />
              </div>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-[1440px] mx-auto px-6 flex space-x-8 text-sm font-medium">
          <button className="py-3 border-b-2 border-blue-600 text-blue-600 font-semibold">Brokers</button>
          <button className="py-3 border-b-2 border-transparent text-slate-600 hover:text-slate-900 transition flex items-center">
            Analytics
            <span className="ml-1.5 w-2 h-2 rounded-full bg-red-500 inline-block" />
          </button>
          <button className="py-3 border-b-2 border-transparent text-slate-600 hover:text-slate-900 transition">
            Admin
          </button>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 2. PAGE HEADER (Title & Main CTA)                                   */}
      {/* ==================================================================== */}
      <main className="max-w-[1440px] mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-gray-200 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Brokers</h1>
            <p className="text-sm text-slate-500 mt-1">
              Select or configure licensed selling entities, OIC authority scopes, and settlement settings.
            </p>
          </div>

          <button
            onClick={onCreateBroker}
            type="button"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg shadow-sm transition gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>List a broker</span>
          </button>
        </div>

        {/* ================================================================== */}
        {/* 3. SEARCH & FILTERS BAR                                           */}
        {/* ================================================================== */}
        <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Rounded Search Bar */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by broker name, code, or OIC license..."
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-300 rounded-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-xs"
            />
          </div>

          {/* Filter Dropdown Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">Filters:</span>

            {/* Status Filter */}
            <div className="relative">
              <select
                aria-label="Filter by Status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-gray-300 hover:border-gray-400 rounded-full px-4 py-2 pr-8 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition shadow-xs"
              >
                <option value="ALL">Status: All</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING_RENEWAL">Renewal Due</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Authorized Line of Business Filter */}
            <div className="relative">
              <select
                aria-label="Filter by Line of Business"
                value={lobFilter}
                onChange={(e) => {
                  setLobFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-gray-300 hover:border-gray-400 rounded-full px-4 py-2 pr-8 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition shadow-xs"
              >
                <option value="ALL">All LOBs</option>
                <option value="MOTOR">Motor Insurance</option>
                <option value="HEALTH">Health</option>
                <option value="LIFE">Life</option>
                <option value="FIRE">Fire</option>
                <option value="PA">Personal Accident (PA)</option>
                <option value="TRAVEL">Travel</option>
                <option value="CUSTOM">Custom / Specialty</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Corporate Partner Filter */}
            <div className="relative">
              <select
                aria-label="Filter by Corporate Partner"
                value={partnerFilter}
                onChange={(e) => {
                  setPartnerFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-gray-300 hover:border-gray-400 rounded-full px-4 py-2 pr-8 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition shadow-xs"
              >
                <option value="ALL">All Partners</option>
                {partnerOptions.map((partner) => (
                  <option key={partner} value={partner}>
                    {partner}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* 4. DATA TABLE / BROKER LIST                                       */}
        {/* ================================================================== */}
        <div className="mt-6 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th
                    scope="col"
                    onClick={() => toggleSort("name")}
                    className="py-3.5 px-6 cursor-pointer hover:text-slate-800 transition select-none"
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>Broker Name & Credentials</span>
                      <span className="text-slate-400 font-normal">⇅</span>
                    </div>
                  </th>
                  <th scope="col" className="py-3.5 px-6">
                    Authorized LOBs
                  </th>
                  <th scope="col" className="py-3.5 px-6 text-center">
                    Pay Date
                  </th>
                  <th
                    scope="col"
                    onClick={() => toggleSort("revenue")}
                    className="py-3.5 px-6 text-right cursor-pointer hover:text-slate-800 transition select-none"
                  >
                    <div className="flex items-center justify-end space-x-1.5">
                      <span>Revenue (MTD)</span>
                      <span className="text-slate-400 font-normal">⇅</span>
                    </div>
                  </th>
                  <th
                    scope="col"
                    onClick={() => toggleSort("policies")}
                    className="py-3.5 px-6 text-right cursor-pointer hover:text-slate-800 transition select-none"
                  >
                    <div className="flex items-center justify-end space-x-1.5">
                      <span>Active Policies</span>
                      <span className="text-slate-400 font-normal">⇅</span>
                    </div>
                  </th>
                  <th scope="col" className="py-3.5 px-6 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 text-sm">
                {paginatedBrokers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Building2 className="w-12 h-12 mx-auto stroke-1 text-slate-300 mb-3" />
                      <p className="font-semibold text-slate-600">No brokers found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Try modifying search keywords or removing selected filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedBrokers.map((broker) => {
                    const isSelected = broker.broker_id === currentBrokerId;

                    return (
                      <tr
                        key={broker.broker_id}
                        className={`hover:bg-slate-50/80 transition-colors group ${isSelected ? "bg-blue-50/40" : ""}`}
                      >
                        {/* 1. Name & Primary Info */}
                        <td className="py-4 px-6">
                          <div className="flex items-start space-x-4">
                            {/* Entity Icon / Thumbnail */}
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 border border-gray-200 flex-shrink-0 flex items-center justify-center text-slate-600 shadow-xs">
                              {broker.logo_url ? (
                                <img
                                  src={broker.logo_url}
                                  alt={broker.broker_name_en}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <Building2 className="w-6 h-6 text-slate-400" />
                              )}
                            </div>

                            {/* Name and Subtext */}
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                                  {broker.broker_name_en}
                                </span>
                                {renderStatusPill(broker.status)}
                              </div>

                              <p className="text-xs text-slate-500 font-light">{broker.broker_name_th}</p>

                              <div className="flex items-center text-xs text-slate-400 space-x-2 pt-0.5">
                                <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {broker.broker_code}
                                </span>
                                <span>•</span>
                                <span>Lic: {broker.license_details.oic_license_no}</span>
                                <span>•</span>
                                <span>
                                  {broker.city}, {broker.country}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Authorized LOBs */}
                        <td className="py-4 px-6">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {broker.authorized_lobs.map((lob) => (
                              <span
                                key={lob}
                                className="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-600"
                              >
                                {lob}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* 3. Monthly Pay Date */}
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                            {broker.monthly_pay_date}
                          </span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">th of month</span>
                        </td>

                        {/* 4. Revenue (MTD) */}
                        <td className="py-4 px-6 text-right font-medium text-slate-800">
                          {broker.revenue_mtd_thb > 0 ? (
                            <div>
                              <span>฿{broker.revenue_mtd_thb.toLocaleString()}</span>
                              <span className="block text-[10px] text-slate-400">THB Gross</span>
                            </div>
                          ) : (
                            <span className="text-slate-300">N/A</span>
                          )}
                        </td>

                        {/* 5. Active Policies */}
                        <td className="py-4 px-6 text-right font-medium text-slate-800">
                          {broker.active_policies_count.toLocaleString()}
                          <span className="block text-[10px] text-slate-400">Policies</span>
                        </td>

                        {/* 6. Context Select / Actions Menu */}
                        <td className="py-4 px-6 text-right relative">
                          <div className="inline-flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleSelectBroker(broker)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                isSelected
                                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                  : "bg-white border border-gray-300 hover:border-blue-500 text-slate-700 hover:text-blue-600 shadow-xs"
                              }`}
                            >
                              {isSelected ? "Active" : "Select"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setActiveMenuId(activeMenuId === broker.broker_id ? null : broker.broker_id)
                              }
                              className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-gray-100 transition"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Options */}
                            {activeMenuId === broker.broker_id && (
                              <div
                                onMouseLeave={() => setActiveMenuId(null)}
                                className="absolute right-6 top-12 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 text-left"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleSelectBroker(broker);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-gray-50 flex items-center justify-between"
                                >
                                  <span>Switch to Workspace</span>
                                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                </button>
                                <button
                                  type="button"
                                  className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-gray-50"
                                >
                                  View Settlement Rules
                                </button>
                                <button
                                  type="button"
                                  className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-gray-50"
                                >
                                  Edit License Credentials
                                </button>
                                <div className="border-t border-gray-100 my-1" />
                                <button type="button" className="w-full px-4 py-2 text-xs text-red-600 hover:bg-red-50">
                                  Deactivate Broker
                                </button>
                              </div>
                            )}
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

        {/* ================================================================== */}
        {/* 5. PAGINATION FOOTER (Agoda Style)                                */}
        {/* ================================================================== */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          {/* Per Page Selector */}
          <div className="flex items-center space-x-2">
            <span>Show</span>
            <div className="relative">
              <select
                aria-label="Items per page"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-gray-300 rounded px-2.5 py-1 pr-6 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <span>entries per page</span>
          </div>

          {/* Page Indicators */}
          <div className="flex items-center space-x-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded border border-gray-300 bg-white text-slate-600 disabled:opacity-40 hover:bg-gray-50 transition shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 rounded text-xs font-semibold transition ${
                  currentPage === page
                    ? "border-2 border-blue-600 text-blue-600 bg-blue-50/50"
                    : "border border-gray-300 bg-white text-slate-600 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded border border-gray-300 bg-white text-slate-600 disabled:opacity-40 hover:bg-gray-50 transition shadow-xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BrokerSelectionPage;
