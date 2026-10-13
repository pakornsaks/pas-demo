import {
  Activity,
  AlertTriangle,
  Building2,
  Calendar,
  ChevronRight,
  CreditCard,
  Filter,
  FolderSync,
  Mail,
  Network,
  Plus,
  Search,
  Server,
  ShieldCheck,
  X,
} from "lucide-react";
import React, { useMemo, useState } from "react";

// ============================================================================
// Data Types & Contracts (Aligned with BRD & SDD Schemas)
// ============================================================================

export type IntegrationChannel = "API" | "SFTP" | "EMAIL";
export type SettlementMode = "NET" | "GROSS";
export type InsurerStatus = "ACTIVE" | "MAINTENANCE" | "INACTIVE";

export interface InsurerEndpoints {
  issuePolicyUrl?: string;
  underwritingDecisionWebhook?: string;
  requestInfoWebhook?: string;
  sftpHost?: string;
  underwritingEmail?: string;
}

export interface InsurerRecord {
  insurerId: string;
  versionId: string;
  code: string;
  nameEn: string;
  nameTh: string;
  logoUrl?: string;
  status: InsurerStatus;
  referralChannel: IntegrationChannel;
  settlementMode: SettlementMode;
  monthlyPayDate: number; // 1-31 from broker_insurer_settings
  authorizedLobs: string[]; // Motor, Health, Fire, Travel, PA, Life, Custom
  endpoints: InsurerEndpoints;
  networkSummary: {
    garages: number;
    hospitals: number;
    clinics: number;
  };
  latencyMs: number;
  uptimePercent: number;
  lastSyncAt: string;
  contactAddress: {
    building: string;
    province: string;
    phone: string;
  };
}

// ============================================================================
// Initial Mock Data (Reflecting Phase 1 Carriers: BRD / SDD Scope)
// ============================================================================

const INITIAL_INSURERS: InsurerRecord[] = [
  {
    insurerId: "ins-vry-001",
    versionId: "ver-vry-2026-v1",
    code: "VIRIYAH",
    nameEn: "Viriyah Insurance PCL",
    nameTh: "บริษัท วิริยะประกันภัย จำกัด (มหาชน)",
    status: "ACTIVE",
    referralChannel: "API",
    settlementMode: "NET",
    monthlyPayDate: 15,
    authorizedLobs: ["MOTOR", "FIRE", "PA"],
    endpoints: {
      issuePolicyUrl: "https://api.viriyah.co.th/v2/direct/policy-issue",
      underwritingDecisionWebhook: "/webhooks/insurers/ins-vry-001/underwriting-decision",
      requestInfoWebhook: "/webhooks/insurers/ins-vry-001/request-info",
    },
    networkSummary: {
      garages: 485,
      hospitals: 120,
      clinics: 45,
    },
    latencyMs: 340,
    uptimePercent: 99.8,
    lastSyncAt: "2026-10-13 19:42:10",
    contactAddress: {
      building: "Viriyah Tower, 121/7-12 Ratchadapisek Rd, Dindaeng",
      province: "Bangkok 10400",
      phone: "02-123-4567",
    },
  },
  {
    insurerId: "ins-aia-002",
    versionId: "ver-aia-2026-v2",
    code: "AIA",
    nameEn: "AIA Thailand",
    nameTh: "บริษัท เอไอเอ จำกัด (ประเทศไทย)",
    status: "ACTIVE",
    referralChannel: "API",
    settlementMode: "GROSS",
    monthlyPayDate: 25,
    authorizedLobs: ["LIFE", "HEALTH", "PA"],
    endpoints: {
      issuePolicyUrl: "https://b2b.aia.co.th/gateway/core/v1/issuance",
      underwritingDecisionWebhook: "/webhooks/insurers/ins-aia-002/underwriting-decision",
      requestInfoWebhook: "/webhooks/insurers/ins-aia-002/request-info",
    },
    networkSummary: {
      garages: 0,
      hospitals: 310,
      clinics: 180,
    },
    latencyMs: 410,
    uptimePercent: 99.4,
    lastSyncAt: "2026-10-13 19:35:20",
    contactAddress: {
      building: "AIA Sathorn Tower, 11/1 South Sathorn Road, Yannawa",
      province: "Bangkok 10120",
      phone: "02-789-0123",
    },
  },
  {
    insurerId: "ins-mti-003",
    versionId: "ver-mti-2026-v1",
    code: "MUANGTHAI",
    nameEn: "Muang Thai Insurance PCL",
    nameTh: "บริษัท เมืองไทยประกันภัย จำกัด (มหาชน)",
    status: "ACTIVE",
    referralChannel: "SFTP",
    settlementMode: "NET",
    monthlyPayDate: 20,
    authorizedLobs: ["MOTOR", "TRAVEL", "HEALTH", "FIRE"],
    endpoints: {
      sftpHost: "sftp.muangthaiinsurance.com:2222/inbound/applications",
    },
    networkSummary: {
      garages: 320,
      hospitals: 195,
      clinics: 62,
    },
    latencyMs: 1250,
    uptimePercent: 98.9,
    lastSyncAt: "2026-10-13 18:00:00",
    contactAddress: {
      building: "Muang Thai Complex, 252 Ratchadaphisek Rd, Huai Khwang",
      province: "Bangkok 10310",
      phone: "02-665-4000",
    },
  },
  {
    insurerId: "ins-msig-004",
    versionId: "ver-msig-2026-v1",
    code: "MSIG",
    nameEn: "MSIG Insurance (Thailand) PCL",
    nameTh: "บริษัท เอ็ม เอส ไอ จี ประกันภัย (ประเทศไทย) จำกัด (มหาชน)",
    status: "ACTIVE",
    referralChannel: "EMAIL",
    settlementMode: "NET",
    monthlyPayDate: 28,
    authorizedLobs: ["TRAVEL", "MOTOR", "CUSTOM"],
    endpoints: {
      underwritingEmail: "underwriting.broker@th.msig-asia.com",
    },
    networkSummary: {
      garages: 210,
      hospitals: 140,
      clinics: 35,
    },
    latencyMs: 0,
    uptimePercent: 100.0,
    lastSyncAt: "2026-10-13 17:15:00",
    contactAddress: {
      building: "MSIG Building, 1909 New Petchburi Rd, Bangkapi, Huai Khwang",
      province: "Bangkok 10310",
      phone: "02-499-8800",
    },
  },
];

export const InsurerCarrierDirectoryPage: React.FC = () => {
  const [insurers] = useState<InsurerRecord[]>(INITIAL_INSURERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("ALL");
  const [settlementFilter, setSettlementFilter] = useState<string>("ALL");
  const [selectedInsurer, setSelectedInsurer] = useState<InsurerRecord | null>(null);
  const [isMakerCheckerNoticeOpen, setIsMakerCheckerNoticeOpen] = useState(false);

  // Filtered List
  const filteredInsurers = useMemo(() => {
    return insurers.filter((ins) => {
      const matchesSearch =
        ins.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ins.nameTh.includes(searchQuery) ||
        ins.code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesChannel = channelFilter === "ALL" || ins.referralChannel === channelFilter;

      const matchesSettlement = settlementFilter === "ALL" || ins.settlementMode === settlementFilter;

      return matchesSearch && matchesChannel && matchesSettlement;
    });
  }, [insurers, searchQuery, channelFilter, settlementFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = insurers.length;
    const apiCount = insurers.filter((i) => i.referralChannel === "API").length;
    const totalGarages = insurers.reduce((acc, i) => acc + i.networkSummary.garages, 0);
    const totalHospitals = insurers.reduce((acc, i) => acc + i.networkSummary.hospitals, 0);
    return { total, apiCount, totalGarages, totalHospitals };
  }, [insurers]);

  return (
    <div className="-mt-6 -mx-6 bg-zinc-50 min-h-screen text-zinc-900 pb-12">
      {/* ==================================================================== */}
      {/* TOP HEADER BAR (Flush with Backoffice Layout)                        */}
      {/* ==================================================================== */}
      <header className="bg-white border-b border-zinc-200 px-6 py-4 sticky top-0 z-20 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                Master Data Management
              </span>
              <span className="text-xs text-zinc-400">•</span>
              <span className="text-xs text-zinc-500 font-medium">B2B Integration Layer</span>
            </div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight mt-1 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Insurer & Carrier Directory
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMakerCheckerNoticeOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
            >
              <Plus className="w-4 h-4" />
              Add Partner Insurer
            </button>
          </div>
        </div>
      </header>

      <div className="px-6 mt-6 max-w-7xl mx-auto space-y-6">
        {/* ==================================================================== */}
        {/* STATS OVERVIEW CARDS                                                 */}
        {/* ==================================================================== */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
              <span>Carriers Enrolled</span>
              <Building2 className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-zinc-900 mt-2">{metrics.total}</p>
            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              100% Phase 1 Target Live
            </p>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
              <span>Real-Time Host-to-Host</span>
              <Server className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-zinc-900 mt-2">
              {metrics.apiCount} / {metrics.total}
            </p>
            <p className="text-xs text-zinc-500 mt-1">REST Adapters (Host-to-Host)</p>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
              <span>Garages Mapped</span>
              <Network className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-zinc-900 mt-2">{metrics.totalGarages}</p>
            <p className="text-xs text-zinc-500 mt-1">Standard & Dealer Garages</p>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
              <span>Hospitals & Clinics</span>
              <Activity className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-bold text-zinc-900 mt-2">{metrics.totalHospitals}</p>
            <p className="text-xs text-zinc-500 mt-1">Cashless OPD/IPD Network</p>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* FILTER & SEARCH BAR                                                  */}
        {/* ==================================================================== */}
        <section className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search carrier by name (EN/TH) or carrier code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-xs font-medium text-zinc-500">Channel:</span>
            </div>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-2 text-zinc-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="ALL">All Channels</option>
              <option value="API">REST API</option>
              <option value="SFTP">SFTP Batch</option>
              <option value="EMAIL">Email Fallback</option>
            </select>

            <span className="text-zinc-300">|</span>

            <span className="text-xs font-medium text-zinc-500">Settlement:</span>
            <select
              value={settlementFilter}
              onChange={(e) => setSettlementFilter(e.target.value)}
              className="text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-2 text-zinc-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="ALL">All Modes</option>
              <option value="NET">NET (Deduct Before)</option>
              <option value="GROSS">GROSS (Deduct After)</option>
            </select>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* CARRIER DIRECTORY TABLE                                              */}
        {/* ==================================================================== */}
        <section className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Carrier Name & Code</th>
                  <th className="py-3 px-4">Adapter / Channel</th>
                  <th className="py-3 px-4">Settlement Rules</th>
                  <th className="py-3 px-4">Lines of Business</th>
                  <th className="py-3 px-4">Network Providers</th>
                  <th className="py-3 px-4">Status & Health</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {filteredInsurers.length > 0 ? (
                  filteredInsurers.map((insurer) => (
                    <tr key={insurer.insurerId} className="hover:bg-zinc-50/70 transition-colors group">
                      {/* Carrier info */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-xs text-zinc-700 shrink-0 uppercase tracking-wider">
                            {insurer.code.slice(0, 3)}
                          </div>
                          <div>
                            <div className="font-semibold text-zinc-900 group-hover:text-indigo-600 transition-colors">
                              {insurer.nameEn}
                            </div>
                            <div className="text-zinc-500 text-[11px] leading-tight">{insurer.nameTh}</div>
                            <div className="text-[10px] text-zinc-400 mt-1 font-mono">ID: {insurer.insurerId}</div>
                          </div>
                        </div>
                      </td>

                      {/* Adapter Channel */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-1.5">
                          {insurer.referralChannel === "API" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Server className="w-3 h-3" />
                              REST API
                            </span>
                          )}
                          {insurer.referralChannel === "SFTP" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              <FolderSync className="w-3 h-3" />
                              SFTP Batch
                            </span>
                          )}
                          {insurer.referralChannel === "EMAIL" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              <Mail className="w-3 h-3" />
                              Email Fallback
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-1">
                          {insurer.referralChannel === "API" && <span>Avg. Latency: {insurer.latencyMs} ms</span>}
                          {insurer.referralChannel === "SFTP" && <span>Nightly 00:00 Bordereau</span>}
                          {insurer.referralChannel === "EMAIL" && <span>Ops Queue Adjudication</span>}
                        </div>
                      </td>

                      {/* Settlement Rules */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                            <span className="font-semibold text-zinc-900">
                              {insurer.settlementMode === "NET" ? "Net (Deduct Before)" : "Gross (Deduct After)"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-zinc-500 text-[11px]">
                            <Calendar className="w-3 h-3 text-zinc-400" />
                            <span>Remit on: Every {insurer.monthlyPayDate}th</span>
                          </div>
                        </div>
                      </td>

                      {/* LOBs */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex flex-wrap gap-1 max-w-[170px]">
                          {insurer.authorizedLobs.map((lob) => (
                            <span
                              key={lob}
                              className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200 uppercase"
                            >
                              {lob}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Network Providers */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="text-zinc-600 space-y-0.5 text-[11px]">
                          <div>
                            <span className="font-medium text-zinc-800">{insurer.networkSummary.garages}</span> Garages
                          </div>
                          <div>
                            <span className="font-medium text-zinc-800">{insurer.networkSummary.hospitals}</span>{" "}
                            Hospitals
                          </div>
                          <div className="text-zinc-400 text-[10px]">{insurer.networkSummary.clinics} Clinics</div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="font-medium text-emerald-700">Active</span>
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-1">SLA: {insurer.uptimePercent}%</div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <button
                          onClick={() => setSelectedInsurer(insurer)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/80 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg border border-indigo-200 transition-colors"
                        >
                          Configure
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-zinc-400">
                      No insurance carriers found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Directory Table Footer */}
          <div className="bg-zinc-50 border-t border-zinc-200 px-4 py-2.5 flex items-center justify-between text-xs text-zinc-500">
            <span>
              Showing <strong>{filteredInsurers.length}</strong> of <strong>{insurers.length}</strong> integrated
              carriers
            </span>
            <span className="text-[11px] text-zinc-400">
              OIC Thailand Compliance Anchor: SCD Type 2 Snapshot Versioning Enabled
            </span>
          </div>
        </section>
      </div>

      {/* ==================================================================== */}
      {/* DRAWER / MODAL: CARRIER CONFIGURATION & SETTLEMENT SETTINGS          */}
      {/* ==================================================================== */}
      {selectedInsurer && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-zinc-900/40 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-zinc-200 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white border border-zinc-200 flex items-center justify-center font-bold text-sm text-zinc-800 shadow-2xs">
                  {selectedInsurer.code.slice(0, 3)}
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-900">{selectedInsurer.nameEn}</h2>
                  <p className="text-xs text-zinc-500 font-mono">Immutable ID: {selectedInsurer.insurerId}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInsurer(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-zinc-700">
              {/* Snapshot Audit Tag */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-indigo-900 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold">Snapshot Version: </span>
                  <span className="font-mono text-[11px]">{selectedInsurer.versionId}</span>
                  <p className="text-[11px] text-indigo-700 mt-0.5">
                    Modifying operational configs or credentials clones a new SCD Type 2 record. Live sales traffic
                    remains unaffected until approved.
                  </p>
                </div>
              </div>

              {/* Section 1: Financial & Settlement Config */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-zinc-500" />
                  Broker Settlement Schedule (broker_insurer_settings)
                </h3>
                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center py-1 border-b border-zinc-200/60">
                    <span className="text-zinc-500">Settlement Mode:</span>
                    <span className="font-semibold text-zinc-900 bg-white px-2 py-0.5 rounded border border-zinc-200">
                      {selectedInsurer.settlementMode} (
                      {selectedInsurer.settlementMode === "NET" ? "Deduct Before Remit" : "Deduct After Remit"})
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-zinc-200/60">
                    <span className="text-zinc-500">Monthly Remittance Date:</span>
                    <span className="font-semibold text-zinc-900">
                      Every {selectedInsurer.monthlyPayDate}th of month
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-zinc-500">Broker Payable Report Group:</span>
                    <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                      Batch Schedule Group {selectedInsurer.monthlyPayDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Integration Adapter Endpoints */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-zinc-500" />
                  Adapter Configuration (Integration Layer)
                </h3>
                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Channel Mode:</span>
                    <span className="font-bold text-indigo-600">{selectedInsurer.referralChannel}</span>
                  </div>

                  {selectedInsurer.endpoints.issuePolicyUrl && (
                    <div>
                      <span className="text-zinc-500 block mb-1">Host-to-Host Issuance (POST /issue):</span>
                      <code className="text-[11px] block bg-zinc-100 p-2 rounded border border-zinc-200 break-all text-zinc-800">
                        {selectedInsurer.endpoints.issuePolicyUrl}
                      </code>
                    </div>
                  )}

                  {selectedInsurer.endpoints.underwritingDecisionWebhook && (
                    <div>
                      <span className="text-zinc-500 block mb-1">Inbound Decision Webhook:</span>
                      <code className="text-[11px] block bg-zinc-100 p-2 rounded border border-zinc-200 break-all text-zinc-800">
                        {selectedInsurer.endpoints.underwritingDecisionWebhook}
                      </code>
                    </div>
                  )}

                  {selectedInsurer.endpoints.sftpHost && (
                    <div>
                      <span className="text-zinc-500 block mb-1">SFTP Inbound Gateway:</span>
                      <code className="text-[11px] block bg-zinc-100 p-2 rounded border border-zinc-200 break-all text-zinc-800">
                        {selectedInsurer.endpoints.sftpHost}
                      </code>
                    </div>
                  )}

                  {selectedInsurer.endpoints.underwritingEmail && (
                    <div>
                      <span className="text-zinc-500 block mb-1">Underwriting Referral Alias:</span>
                      <code className="text-[11px] block bg-zinc-100 p-2 rounded border border-zinc-200 break-all text-zinc-800">
                        {selectedInsurer.endpoints.underwritingEmail}
                      </code>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Registered Office & Contact */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                  Official Headquarters (contact_addresses)
                </h3>
                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 space-y-1 text-zinc-600">
                  <p className="font-medium text-zinc-900">{selectedInsurer.contactAddress.building}</p>
                  <p>{selectedInsurer.contactAddress.province}</p>
                  <p className="text-[11px] text-zinc-500 pt-1">Phone: {selectedInsurer.contactAddress.phone}</p>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-zinc-200 bg-white flex items-center justify-between">
              <span className="text-[11px] text-zinc-400">Last Sync: {selectedInsurer.lastSyncAt}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedInsurer(null)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-medium text-xs transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => setIsMakerCheckerNoticeOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs transition-colors"
                >
                  Edit Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MAKER-CHECKER WORKFLOW NOTIFICATION MODAL                            */}
      {/* ==================================================================== */}
      {isMakerCheckerNoticeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-zinc-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-zinc-900">Maker-Checker Governance Active</h3>
              <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                Per OIC compliance and strict Segregation of Duties (Maker-Checker), alterations to Carrier Credentials,
                Settlement Mode, or Remittance Dates cannot be applied directly.
              </p>
            </div>

            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs text-zinc-600 space-y-1">
              <div className="font-semibold text-zinc-800">Workflow Sequence:</div>
              <div>
                1. Create changes as a new <code>DRAFT</code> version.
              </div>
              <div>
                2. System generates an <code>approval_requests</code> ticket.
              </div>
              <div>3. Finance Manager / IT Architect reviews diff and authorizes.</div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsMakerCheckerNoticeOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  setIsMakerCheckerNoticeOpen(false);
                  alert("Staged changes cloned to new DRAFT version. Approval request queued.");
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
              >
                Proceed to Draft Staging
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsurerCarrierDirectoryPage;
