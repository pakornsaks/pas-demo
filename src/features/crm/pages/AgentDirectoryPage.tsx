import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  GitBranch,
  Layers,
  Plus,
  Search,
  ShieldCheck,
  Users,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import React, { useMemo, useState } from "react";

// ============================================================================
// Types & Domain Entities (PAS DB Schema Aligned)
// ============================================================================

export type CommissionTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
export type ChannelType = "TELESALES" | "DIRECT_SALE" | "SUB_AGENT";
export type LicenseStatus = "ACTIVE" | "EXPIRING_SOON" | "EXPIRED";

export interface AgentHierarchySummary {
  parentAgentId?: string;
  parentAgentName?: string;
  downlineCount: number;
}

export interface AgentVersionRecord {
  versionId: string;
  commissionTier: CommissionTier;
  agentNameTh: string;
  agentNameEn: string;
  oicLicenseNumber: string;
  oicLicenseExpiry: string;
  effectiveStartDate: string;
  effectiveEndDate: string | null;
}

export interface AgentListItem {
  agentId: string;
  agentCode: string;
  agentNameTh: string;
  agentNameEn: string;
  brokerCode: string;
  brokerName: string;
  channel: ChannelType;
  commissionTier: CommissionTier;
  oicLicenseNumber: string;
  oicLicenseExpiry: string;
  licenseStatus: LicenseStatus;
  daysToExpiry: number;
  hierarchy: AgentHierarchySummary;
  wallet: {
    pendingBalanceThb: number;
    availableBalanceThb: number;
  };
  isActive: boolean;
  activeVersionId: string;
}

// ============================================================================
// Mock Data (Derived from Thai Insurance Master Data & SCD Type 2 Records)
// ============================================================================

const MOCK_AGENTS: AgentListItem[] = [
  {
    agentId: "agt-uuid-001",
    agentCode: "AGT-88019",
    agentNameTh: "สมชาย สุขเกษม",
    agentNameEn: "Somchai Sukkasem",
    brokerCode: "BRK-9SINGHA",
    brokerName: "9 Singha Broker Co., Ltd.",
    channel: "SUB_AGENT",
    commissionTier: "GOLD",
    oicLicenseNumber: "6104001923",
    oicLicenseExpiry: "2026-11-30",
    licenseStatus: "EXPIRING_SOON",
    daysToExpiry: 48,
    hierarchy: {
      downlineCount: 12,
    },
    wallet: {
      pendingBalanceThb: 15400.0,
      availableBalanceThb: 68500.0,
    },
    isActive: true,
    activeVersionId: "ver-agt-001-v2",
  },
  {
    agentId: "agt-uuid-002",
    agentCode: "AGT-88020",
    agentNameTh: "วรัญญา พรหมมินทร์",
    agentNameEn: "Waranya Prommin",
    brokerCode: "BRK-9SINGHA",
    brokerName: "9 Singha Broker Co., Ltd.",
    channel: "TELESALES",
    commissionTier: "PLATINUM",
    oicLicenseNumber: "6202008819",
    oicLicenseExpiry: "2027-08-15",
    licenseStatus: "ACTIVE",
    daysToExpiry: 306,
    hierarchy: {
      downlineCount: 0,
    },
    wallet: {
      pendingBalanceThb: 4200.0,
      availableBalanceThb: 31200.0,
    },
    isActive: true,
    activeVersionId: "ver-agt-002-v1",
  },
  {
    agentId: "agt-uuid-003",
    agentCode: "AGT-88021",
    agentNameTh: "กิตติศักดิ์ เจริญยนต์",
    agentNameEn: "Kittisak Charoenyon",
    brokerCode: "BRK-AUTOLEAD",
    brokerName: "AutoLead Dealership Network",
    channel: "SUB_AGENT",
    commissionTier: "SILVER",
    oicLicenseNumber: "5901004911",
    oicLicenseExpiry: "2026-09-15",
    licenseStatus: "EXPIRED",
    daysToExpiry: -28,
    hierarchy: {
      parentAgentId: "agt-uuid-001",
      parentAgentName: "Somchai Sukkasem (AGT-88019)",
      downlineCount: 0,
    },
    wallet: {
      pendingBalanceThb: 0.0,
      availableBalanceThb: 12400.0,
    },
    isActive: false,
    activeVersionId: "ver-agt-003-v1",
  },
  {
    agentId: "agt-uuid-004",
    agentCode: "AGT-88022",
    agentNameTh: "นภัสสร รัตนโชติ",
    agentNameEn: "Napatsorn Rattanachot",
    brokerCode: "BRK-9SINGHA",
    brokerName: "9 Singha Broker Co., Ltd.",
    channel: "DIRECT_SALE",
    commissionTier: "GOLD",
    oicLicenseNumber: "6403011299",
    oicLicenseExpiry: "2027-04-20",
    licenseStatus: "ACTIVE",
    daysToExpiry: 189,
    hierarchy: {
      downlineCount: 3,
    },
    wallet: {
      pendingBalanceThb: 8750.0,
      availableBalanceThb: 54100.0,
    },
    isActive: true,
    activeVersionId: "ver-agt-004-v3",
  },
  {
    agentId: "agt-uuid-005",
    agentCode: "AGT-88023",
    agentNameTh: "ธนวัฒน์ พรประเสริฐ",
    agentNameEn: "Thanawat Pornprasert",
    brokerCode: "BRK-9SINGHA",
    brokerName: "9 Singha Broker Co., Ltd.",
    channel: "SUB_AGENT",
    commissionTier: "BRONZE",
    oicLicenseNumber: "6501007731",
    oicLicenseExpiry: "2026-10-31",
    licenseStatus: "EXPIRING_SOON",
    daysToExpiry: 18,
    hierarchy: {
      parentAgentId: "agt-uuid-001",
      parentAgentName: "Somchai Sukkasem (AGT-88019)",
      downlineCount: 0,
    },
    wallet: {
      pendingBalanceThb: 3200.0,
      availableBalanceThb: 9800.0,
    },
    isActive: true,
    activeVersionId: "ver-agt-005-v1",
  },
];

export const AgentDirectoryPage: React.FC = () => {
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const [licenseFilter, setLicenseFilter] = useState<string>("ALL");
  const [channelFilter, setChannelFilter] = useState<string>("ALL");

  // Drawer / Modals
  const [selectedAgent, setSelectedAgent] = useState<AgentListItem | null>(null);
  const [isMakerCheckerModalOpen, setIsMakerCheckerModalOpen] = useState(false);
  const [proposedTier, setProposedTier] = useState<CommissionTier>("GOLD");
  const [tierChangeReason, setTierChangeReason] = useState("");
  const [isSuccessToast, setIsSuccessToast] = useState(false);

  // Filtered List
  const filteredAgents = useMemo(() => {
    return MOCK_AGENTS.filter((agent) => {
      const matchesSearch =
        agent.agentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.agentNameTh.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.agentNameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.oicLicenseNumber.includes(searchQuery);

      const matchesTier = tierFilter === "ALL" || agent.commissionTier === tierFilter;
      const matchesLicense = licenseFilter === "ALL" || agent.licenseStatus === licenseFilter;
      const matchesChannel = channelFilter === "ALL" || agent.channel === channelFilter;

      return matchesSearch && matchesTier && matchesLicense && matchesChannel;
    });
  }, [searchQuery, tierFilter, licenseFilter, channelFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      totalAgents: MOCK_AGENTS.length,
      activeLicenses: MOCK_AGENTS.filter((a) => a.licenseStatus === "ACTIVE").length,
      expiringSoon: MOCK_AGENTS.filter((a) => a.licenseStatus === "EXPIRING_SOON").length,
      totalAvailableBalance: MOCK_AGENTS.reduce((acc, a) => acc + a.wallet.availableBalanceThb, 0),
    };
  }, []);

  const handleOpenMakerTierChange = (agent: AgentListItem) => {
    setSelectedAgent(agent);
    setProposedTier(agent.commissionTier);
    setTierChangeReason("");
    setIsMakerCheckerModalOpen(true);
  };

  const handleSubmitMakerApproval = (e: React.FormEvent) => {
    e.preventDefault();
    setIsMakerCheckerModalOpen(false);
    setIsSuccessToast(true);
    setTimeout(() => setIsSuccessToast(false), 4000);
  };

  return (
    <div className="pt-0 space-y-6 max-w-full">
      {/* Toast Notification */}
      {isSuccessToast && (
        <div className="fixed top-4 right-6 z-50 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg shadow-md transition-all">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">Maker Request Staged:</span> Tier update ticket created in{" "}
            <code>approval_requests</code> for Supervisor sign-off.
          </div>
        </div>
      )}

      {/* Page Title & Operational Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">Agent & Sales Force</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Master repository for internal sales channels, brokers, sub-agents, and OIC licensing compliance.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 shadow-sm transition-colors"
          >
            <Download className="w-4 h-4 text-zinc-500" />
            Export OIC Roster (CSV)
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Onboard New Agent
          </button>
        </div>
      </div>

      {/* KPI Metric Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Sales Force</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1">{stats.totalAgents}</p>
            <span className="text-xs text-zinc-500 mt-1 block">Registered in Master Table</span>
          </div>
          <div className="p-3 bg-zinc-100 rounded-lg text-zinc-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">OIC License Active</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.activeLicenses}</p>
            <span className="text-xs text-emerald-700 font-medium mt-1 block">Full Selling Privileges</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">OIC Expiry Alert</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.expiringSoon}</p>
            <span className="text-xs text-amber-700 font-medium mt-1 block">&lt; 60 Days Renewal Window</span>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Withdrawable Balance</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1">
              ฿{stats.totalAvailableBalance.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </p>
            <span className="text-xs text-zinc-500 mt-1 block">Across All Agent Wallets</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search & Comprehensive Filters */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Agent Code, Name (TH/EN), OIC License Number..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-600">
              <Filter className="w-3.5 h-3.5 text-zinc-400" />
              <span>Filters</span>
            </div>

            {/* Tier Filter */}
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              <option value="ALL">All Tiers</option>
              <option value="PLATINUM">Platinum</option>
              <option value="GOLD">Gold</option>
              <option value="SILVER">Silver</option>
              <option value="BRONZE">Bronze</option>
            </select>

            {/* License Filter */}
            <select
              value={licenseFilter}
              onChange={(e) => setLicenseFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              <option value="ALL">All License Statuses</option>
              <option value="ACTIVE">Active (Valid)</option>
              <option value="EXPIRING_SOON">Expiring Soon (&lt;60d)</option>
              <option value="EXPIRED">Expired</option>
            </select>

            {/* Channel Filter */}
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              <option value="ALL">All Sales Channels</option>
              <option value="SUB_AGENT">Sub-Agent Network</option>
              <option value="TELESALES">Telesales (Inbound/Outbound)</option>
              <option value="DIRECT_SALE">Direct Sale (Walk-in)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Agents Data Grid */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Agent Identity</th>
                <th className="py-3.5 px-4">Channel & Hierarchy</th>
                <th className="py-3.5 px-4">Commission Tier</th>
                <th className="py-3.5 px-4">OIC License Status</th>
                <th className="py-3.5 px-4">Wallet Balance (THB)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-sm">
              {filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    <Users className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                    No agents found matching the selected search criteria.
                  </td>
                </tr>
              ) : (
                filteredAgents.map((agent) => (
                  <tr key={agent.agentId} className="hover:bg-zinc-50/80 transition-colors">
                    {/* Identity */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-900 flex items-center gap-2">
                        <span>{agent.agentNameEn}</span>
                        <span className="text-xs font-mono font-normal text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
                          {agent.agentCode}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">{agent.agentNameTh}</div>
                      <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-zinc-400" />
                        <span>{agent.brokerName}</span>
                      </div>
                    </td>

                    {/* Channel & Hierarchy */}
                    <td className="py-3.5 px-4">
                      <div className="inline-block text-xs font-medium text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded">
                        {agent.channel.replace("_", " ")}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-600">
                        <GitBranch className="w-3.5 h-3.5 text-zinc-400" />
                        {agent.hierarchy.downlineCount > 0 ? (
                          <span className="font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                            Master ({agent.hierarchy.downlineCount} Downlines)
                          </span>
                        ) : agent.hierarchy.parentAgentName ? (
                          <span
                            className="text-zinc-500 truncate max-w-[160px]"
                            title={agent.hierarchy.parentAgentName}
                          >
                            Sub of: {agent.hierarchy.parentAgentName}
                          </span>
                        ) : (
                          <span className="text-zinc-400">Direct Agent</span>
                        )}
                      </div>
                    </td>

                    {/* Commission Tier */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          agent.commissionTier === "PLATINUM"
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : agent.commissionTier === "GOLD"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : agent.commissionTier === "SILVER"
                                ? "bg-zinc-100 text-zinc-700 border border-zinc-300"
                                : "bg-orange-100 text-orange-800 border border-orange-200"
                        }`}
                      >
                        {agent.commissionTier}
                      </span>
                    </td>

                    {/* OIC License */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs text-zinc-800">Lic: {agent.oicLicenseNumber}</div>
                      <div className="mt-1 flex items-center gap-1.5">
                        {agent.licenseStatus === "ACTIVE" && (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Valid ({agent.oicLicenseExpiry})
                          </span>
                        )}
                        {agent.licenseStatus === "EXPIRING_SOON" && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-700 font-medium">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Expiring in {agent.daysToExpiry}d
                          </span>
                        )}
                        {agent.licenseStatus === "EXPIRED" && (
                          <span className="inline-flex items-center gap-1 text-xs text-rose-700 font-medium">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            Expired ({agent.oicLicenseExpiry})
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Wallet */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-900">
                        ฿{agent.wallet.availableBalanceThb.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        Pending: ฿{agent.wallet.pendingBalanceThb.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </div>
                    </td>

                    {/* Active Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block w-2.5 h-2.5 rounded-full ${agent.isActive ? "bg-emerald-500 ring-2 ring-emerald-100" : "bg-zinc-300"}`}
                        title={agent.isActive ? "Active System User" : "Inactive / Suspended"}
                      />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedAgent(agent)}
                          className="px-2.5 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleOpenMakerTierChange(agent)}
                          className="px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                          title="Stage Maker-Checker Tier Update"
                        >
                          Modify Tier
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination Overview */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs text-zinc-500">
          <span>
            Showing <strong className="text-zinc-700">{filteredAgents.length}</strong> of{" "}
            <strong className="text-zinc-700">{MOCK_AGENTS.length}</strong> sales entities
          </span>
          <div className="flex items-center gap-2">
            <button
              className="px-2.5 py-1 bg-white border border-zinc-300 rounded text-zinc-600 disabled:opacity-50"
              disabled
            >
              Previous
            </button>
            <span className="px-2 py-1 font-medium text-zinc-700">1</span>
            <button
              className="px-2.5 py-1 bg-white border border-zinc-300 rounded text-zinc-600 disabled:opacity-50"
              disabled
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 360° Agent Detail Modal & SCD Type 2 Snapshot Drawer                      */}
      {/* ========================================================================= */}
      {selectedAgent && !isMakerCheckerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Header */}
              <div className="h-14 px-6 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Agent 360° Profile
                  </span>
                  <span className="text-xs bg-zinc-200 text-zinc-700 px-2 py-0.5 rounded font-mono">
                    {selectedAgent.agentCode}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Body */}
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">{selectedAgent.agentNameEn}</h2>
                  <p className="text-sm text-zinc-500">{selectedAgent.agentNameTh}</p>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                    <p className="text-xs text-zinc-500">Parent Broker Entity</p>
                    <p className="text-sm font-semibold text-zinc-800 mt-0.5">{selectedAgent.brokerName}</p>
                    <p className="text-xs font-mono text-zinc-400">{selectedAgent.brokerCode}</p>
                  </div>
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                    <p className="text-xs text-zinc-500">Sales Channel Origin</p>
                    <p className="text-sm font-semibold text-zinc-800 mt-0.5">
                      {selectedAgent.channel.replace("_", " ")}
                    </p>
                    <p className="text-xs text-zinc-400">Channel ID: 4</p>
                  </div>
                </div>

                {/* Regulatory License Details */}
                <div className="border border-zinc-200 rounded-lg p-4 bg-zinc-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-zinc-600 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      OIC Thailand Regulatory Credentials
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${
                        selectedAgent.licenseStatus === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-800"
                          : selectedAgent.licenseStatus === "EXPIRING_SOON"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {selectedAgent.licenseStatus}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-zinc-500">OIC License No:</span>
                      <p className="font-mono font-medium text-zinc-900 mt-0.5">{selectedAgent.oicLicenseNumber}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500">Expiry Date:</span>
                      <p className="font-medium text-zinc-900 mt-0.5">{selectedAgent.oicLicenseExpiry}</p>
                    </div>
                  </div>
                </div>

                {/* Ledger & Sub-Agent Wallet Snapshot */}
                <div className="border border-zinc-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-zinc-600 flex items-center gap-1.5">
                      <Wallet className="w-4 h-4 text-blue-600" />
                      Sub-Agent Double-Entry Wallet
                    </span>
                    <span className="text-xs font-medium text-zinc-500">3% WHT Deducted at Source</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                      <span className="text-xs text-blue-700 font-medium">Available (Liquid)</span>
                      <p className="text-lg font-bold text-blue-900 mt-0.5">
                        ฿
                        {selectedAgent.wallet.availableBalanceThb.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                      <span className="text-xs text-zinc-500">Pending (Free-Look Hold)</span>
                      <p className="text-lg font-bold text-zinc-700 mt-0.5">
                        ฿{selectedAgent.wallet.pendingBalanceThb.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* SCD Type 2 Snapshot Versioning History */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-zinc-600 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-zinc-500" />
                      Historical Version Ledger (SCD Type 2)
                    </span>
                    <span className="text-xs text-zinc-400">Immutable Audit Trail</span>
                  </div>
                  <div className="border border-zinc-200 rounded-lg divide-y divide-zinc-200 text-xs">
                    <div className="p-3 bg-zinc-50 flex items-center justify-between">
                      <div>
                        <span className="font-mono font-semibold text-zinc-800">
                          {selectedAgent.activeVersionId} (Current Active)
                        </span>
                        <p className="text-zinc-500 mt-0.5">Tier: {selectedAgent.commissionTier}</p>
                      </div>
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                        Live in Production
                      </span>
                    </div>
                    <div className="p-3 flex items-center justify-between text-zinc-500">
                      <div>
                        <span className="font-mono text-zinc-600">ver-agt-001-v1 (Archived)</span>
                        <p className="mt-0.5">Tier: SILVER | Active until 2026-01-15</p>
                      </div>
                      <span className="text-zinc-400">Expired</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedAgent(null)}
                className="px-4 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50"
              >
                Close View
              </button>
              <button
                type="button"
                onClick={() => handleOpenMakerTierChange(selectedAgent)}
                className="px-4 py-2 text-xs font-semibold text-white bg-zinc-900 rounded-lg hover:bg-zinc-800"
              >
                Request Tier Promotion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Maker-Checker Tier Override Modal (Module 9 Governance Compliant)          */}
      {/* ========================================================================= */}
      {isMakerCheckerModalOpen && selectedAgent && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-zinc-700" />
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                  Maker-Checker Ticket: Modify Commission Tier
                </h3>
              </div>
              <button
                onClick={() => setIsMakerCheckerModalOpen(false)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitMakerApproval} className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-lg leading-relaxed">
                <strong>Segregation of Duties Enforcement:</strong> Direct updates to live commission tiers are blocked.
                This modification stages a snapshot clone in <code>agent_versions</code> and routes an approval ticket
                to the Supervisor Inbox.
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                <div>
                  <span className="text-zinc-500">Agent Name:</span>
                  <p className="font-semibold text-zinc-900 mt-0.5">{selectedAgent.agentNameEn}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Current Active Tier:</span>
                  <p className="font-bold text-zinc-900 mt-0.5">{selectedAgent.commissionTier}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Proposed New Commission Tier
                </label>
                <select
                  value={proposedTier}
                  onChange={(e) => setProposedTier(e.target.value as CommissionTier)}
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  <option value="BRONZE">Bronze (Base: 8%)</option>
                  <option value="SILVER">Silver (Base: 12%)</option>
                  <option value="GOLD">Gold (Base: 15% + Override)</option>
                  <option value="PLATINUM">Platinum (Executive: 18%)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Business Justification & Audit Notes
                </label>
                <textarea
                  rows={3}
                  required
                  value={tierChangeReason}
                  onChange={(e) => setTierChangeReason(e.target.value)}
                  placeholder="State performance milestone, volume achievement, or contract revision..."
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsMakerCheckerModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors shadow-sm"
                >
                  Stage Maker Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDirectoryPage;
