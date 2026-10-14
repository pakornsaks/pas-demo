import {
  AlertCircle,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  Info,
  Network,
  Percent,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Users,
  X,
} from "lucide-react";
import React, { useState } from "react";

// ==========================================
// Types & Schema Alignment
// ==========================================

export type SalesChannelId = 1 | 2 | 3 | 4;

export interface SalesChannelMeta {
  id: SalesChannelId;
  name: string;
  code: string;
  discountMechanism: "Promo Codes" | "Commission Sacrifice (Flex)" | "Direct Campaign";
  description: string;
}

export interface BrokerChannelSetting {
  channelId: SalesChannelId;
  channelName: string;
  warningDaysBeforeDue: number; // Triggers SMS/Email reminders
  autoCancelOffsetDays: number; // Days after effective date to auto-cancel
  isPaymentLockedOnRefer: boolean;
  status: "ACTIVE" | "INACTIVE";
}

export interface AgentNode {
  agentId: string;
  agentCode: string;
  nameEn: string;
  nameTh: string;
  role: "BROKER" | "PARTNER" | "MASTER_AGENT" | "SUB_AGENT";
  commissionTier: "BRONZE" | "SILVER" | "GOLD" | "CORPORATE";
  oicLicenseNumber: string;
  oicLicenseExpiry: string; // ISO date
  isOicValid: boolean;
  parentAgentId?: string | null;
  downlineCount: number;
  mtdPremiumNwp: number; // Net Written Premium in THB
  rlsScope: "FULL_BROKER" | "PARTNER_WIDE" | "DOWNLINE_PORTFOLIO" | "OWN_CUSTOMERS_ONLY";
  children?: AgentNode[];
}

export interface BrokerInsurerSetting {
  insurerId: string;
  insurerName: string;
  settlementMode: "NET" | "GROSS";
  monthlyPayDate: number; // Day of month (e.g. 15)
  creditTermDays: number;
  status: "ACTIVE" | "PENDING_APPROVAL";
}

// ==========================================
// Mock Data (BRD & SDD Seed Reference)
// ==========================================

const SALES_CHANNELS: SalesChannelMeta[] = [
  {
    id: 1,
    name: "Tele sales",
    code: "TELESALES",
    discountMechanism: "Promo Codes",
    description: "Internal Outbound / Inbound calling desk. Cancels immediately on effective date if unpaid.",
  },
  {
    id: 2,
    name: "Direct sale",
    code: "DIRECT",
    discountMechanism: "Direct Campaign",
    description: "Walk-in & face-to-face direct sales representatives.",
  },
  {
    id: 3,
    name: "Website",
    code: "ONLINE_STP",
    discountMechanism: "Promo Codes",
    description: "B2C Straight Through Processing storefront consuming headless public APIs.",
  },
  {
    id: 4,
    name: "Sub agent",
    code: "SUB_AGENT",
    discountMechanism: "Commission Sacrifice (Flex)",
    description: "External affiliate broker network with downline hierarchy & flex discounts.",
  },
];

const INITIAL_CHANNEL_SETTINGS: BrokerChannelSetting[] = [
  {
    channelId: 1,
    channelName: "Tele sales",
    warningDaysBeforeDue: 3,
    autoCancelOffsetDays: 0,
    isPaymentLockedOnRefer: true,
    status: "ACTIVE",
  },
  {
    channelId: 2,
    channelName: "Direct sale",
    warningDaysBeforeDue: 3,
    autoCancelOffsetDays: 7,
    isPaymentLockedOnRefer: true,
    status: "ACTIVE",
  },
  {
    channelId: 3,
    channelName: "Website",
    warningDaysBeforeDue: 2,
    autoCancelOffsetDays: 1,
    isPaymentLockedOnRefer: true,
    status: "ACTIVE",
  },
  {
    channelId: 4,
    channelName: "Sub agent",
    warningDaysBeforeDue: 5,
    autoCancelOffsetDays: 30,
    isPaymentLockedOnRefer: true,
    status: "ACTIVE",
  },
];

const HIERARCHY_TREE_DATA: AgentNode = {
  agentId: "brk-001",
  agentCode: "BRK-9SINGHA",
  nameEn: "9 Singha Broker Co., Ltd.",
  nameTh: "บริษัท 9 สิงห์ โบรคเกอร์ จำกัด",
  role: "BROKER",
  commissionTier: "CORPORATE",
  oicLicenseNumber: "W-0099/2565",
  oicLicenseExpiry: "2028-12-31",
  isOicValid: true,
  downlineCount: 42,
  mtdPremiumNwp: 14850000,
  rlsScope: "FULL_BROKER",
  children: [
    {
      agentId: "ptn-101",
      agentCode: "PTN-ALPHA-AUTO",
      nameEn: "Alpha Auto Dealership Group",
      nameTh: "อัลฟ่า ออโต้ กรุ๊ป (ดีลเลอร์)",
      role: "PARTNER",
      commissionTier: "CORPORATE",
      oicLicenseNumber: "CORP-8821-01",
      oicLicenseExpiry: "2027-06-30",
      isOicValid: true,
      downlineCount: 18,
      mtdPremiumNwp: 6420000,
      rlsScope: "PARTNER_WIDE",
      children: [
        {
          agentId: "agt-201",
          agentCode: "MA-201-BKK",
          nameEn: "Somchai Prasert (Lead BKK)",
          nameTh: "สมชาย ประเสริฐ",
          role: "MASTER_AGENT",
          commissionTier: "GOLD",
          oicLicenseNumber: "AG-6402-9988",
          oicLicenseExpiry: "2027-04-15",
          isOicValid: true,
          downlineCount: 8,
          mtdPremiumNwp: 3100000,
          rlsScope: "DOWNLINE_PORTFOLIO",
          children: [
            {
              agentId: "agt-301",
              agentCode: "SA-301-01",
              nameEn: "Kittisak V. (Sub Agent)",
              nameTh: "กิตติศักดิ์ วรวงศ์",
              role: "SUB_AGENT",
              commissionTier: "SILVER",
              oicLicenseNumber: "AG-6601-1122",
              oicLicenseExpiry: "2026-11-20",
              isOicValid: true,
              downlineCount: 0,
              mtdPremiumNwp: 840000,
              rlsScope: "OWN_CUSTOMERS_ONLY",
            },
            {
              agentId: "agt-302",
              agentCode: "SA-302-02",
              nameEn: "Nattapong K. (Junior Affiliate)",
              nameTh: "ณัฐพงษ์ เกียรติชัย",
              role: "SUB_AGENT",
              commissionTier: "BRONZE",
              oicLicenseNumber: "AG-6705-4433",
              oicLicenseExpiry: "2025-10-10",
              isOicValid: false, // Expired / Action required
              downlineCount: 0,
              mtdPremiumNwp: 195000,
              rlsScope: "OWN_CUSTOMERS_ONLY",
            },
          ],
        },
        {
          agentId: "agt-202",
          agentCode: "MA-202-NON",
          nameEn: "Piyawat S. (Lead Nonthaburi)",
          nameTh: "ปิยะวัฒน์ สมบูรณ์",
          role: "MASTER_AGENT",
          commissionTier: "SILVER",
          oicLicenseNumber: "AG-6508-7711",
          oicLicenseExpiry: "2026-12-31",
          isOicValid: true,
          downlineCount: 3,
          mtdPremiumNwp: 1250000,
          rlsScope: "DOWNLINE_PORTFOLIO",
          children: [
            {
              agentId: "agt-303",
              agentCode: "SA-303-01",
              nameEn: "Apinya Thani (Affiliate)",
              nameTh: "อภิญญา ธานี",
              role: "SUB_AGENT",
              commissionTier: "BRONZE",
              oicLicenseNumber: "AG-6709-0099",
              oicLicenseExpiry: "2027-09-01",
              isOicValid: true,
              downlineCount: 0,
              mtdPremiumNwp: 410000,
              rlsScope: "OWN_CUSTOMERS_ONLY",
            },
          ],
        },
      ],
    },
    {
      agentId: "ptn-102",
      agentCode: "PTN-SIAM-FIN",
      nameEn: "Siam Leasing & Financial Partner",
      nameTh: "สยาม ลิสซิ่ง แอนด์ ไฟแนนซ์",
      role: "PARTNER",
      commissionTier: "CORPORATE",
      oicLicenseNumber: "CORP-9912-34",
      oicLicenseExpiry: "2028-03-31",
      isOicValid: true,
      downlineCount: 12,
      mtdPremiumNwp: 4890000,
      rlsScope: "PARTNER_WIDE",
      children: [],
    },
  ],
};

const INITIAL_INSURER_SETTINGS: BrokerInsurerSetting[] = [
  {
    insurerId: "ins-001",
    insurerName: "Viriyah Insurance (วิริยะประกันภัย)",
    settlementMode: "NET",
    monthlyPayDate: 15,
    creditTermDays: 30,
    status: "ACTIVE",
  },
  {
    insurerId: "ins-002",
    insurerName: "Muang Thai Insurance (เมืองไทยประกันภัย)",
    settlementMode: "GROSS",
    monthlyPayDate: 25,
    creditTermDays: 45,
    status: "ACTIVE",
  },
  {
    insurerId: "ins-003",
    insurerName: "MSIG Insurance Thailand",
    settlementMode: "NET",
    monthlyPayDate: 20,
    creditTermDays: 30,
    status: "ACTIVE",
  },
  {
    insurerId: "ins-004",
    insurerName: "AIA Thailand (Health & Life)",
    settlementMode: "GROSS",
    monthlyPayDate: 28,
    creditTermDays: 15,
    status: "PENDING_APPROVAL",
  },
];

// ==========================================
// Main Component
// ==========================================

export const PartnerChannelHierarchyPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"HIERARCHY" | "CHANNEL_SLAS" | "INSURER_REMITTANCE">("HIERARCHY");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    "brk-001": true,
    "ptn-101": true,
    "agt-201": true,
  });
  const [selectedAgent, setSelectedAgent] = useState<AgentNode | null>(HIERARCHY_TREE_DATA);
  const [channelSettings, _setChannelSettings] = useState<BrokerChannelSetting[]>(INITIAL_CHANNEL_SETTINGS);
  const [insurerSettings, _setInsurerSettings] = useState<BrokerInsurerSetting[]>(INITIAL_INSURER_SETTINGS);
  const [isMakerCheckerNoticeOpen, setIsMakerCheckerNoticeOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<string>("GOLD");

  const toggleNode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(val);
  };

  // Helper for tier badges
  const renderTierBadge = (tier: AgentNode["commissionTier"]) => {
    switch (tier) {
      case "GOLD":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            Gold Tier
          </span>
        );
      case "SILVER":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            Silver Tier
          </span>
        );
      case "BRONZE":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-800 border border-orange-200">
            Bronze Tier
          </span>
        );
      case "CORPORATE":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Corporate Master
          </span>
        );
    }
  };

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: AgentNode, depth = 0) => {
    const isExpanded = !!expandedNodes[node.agentId];
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedAgent?.agentId === node.agentId;

    // // Filter match test
    // const matchesSearch =
    //   !searchQuery ||
    //   node.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    //   node.agentCode.toLowerCase().includes(searchQuery.toLowerCase());

    return (
      <div key={node.agentId} className="select-none">
        <div
          onClick={() => setSelectedAgent(node)}
          className={`flex items-center justify-between py-2.5 px-3 rounded-lg border transition-all cursor-pointer mb-1.5 ${
            isSelected
              ? "bg-blue-50/80 border-blue-400 text-blue-950 shadow-sm"
              : "bg-white border-zinc-200 hover:bg-zinc-50/90 text-zinc-800"
          }`}
          style={{ marginLeft: `${depth * 24}px` }}
        >
          <div className="flex items-center space-x-3 min-w-0">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleNode(node.agentId, e)}
                className="w-5 h-5 flex items-center justify-center rounded text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/60"
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            ) : (
              <span className="w-5 h-5 flex items-center justify-center text-zinc-300">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
              </span>
            )}

            <div className="p-1.5 rounded-md bg-zinc-100 text-zinc-700 shrink-0">
              {node.role === "BROKER" && <Building2 size={16} className="text-indigo-600" />}
              {node.role === "PARTNER" && <Briefcase size={16} className="text-blue-600" />}
              {node.role === "MASTER_AGENT" && <Network size={16} className="text-amber-600" />}
              {node.role === "SUB_AGENT" && <Users size={16} className="text-emerald-600" />}
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm truncate">{node.nameEn}</span>
                <span className="text-xs px-1.5 py-0.2 bg-zinc-100 text-zinc-600 rounded font-mono border border-zinc-200">
                  {node.agentCode}
                </span>
                {!node.isOicValid && (
                  <span className="inline-flex items-center text-xs text-rose-600 font-medium bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                    <AlertCircle size={12} className="mr-1" /> OIC Expired
                  </span>
                )}
              </div>
              <div className="text-xs text-zinc-500 truncate mt-0.5">{node.nameTh}</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0 ml-4">
            {renderTierBadge(node.commissionTier)}
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-zinc-900">{formatCurrency(node.mtdPremiumNwp)}</div>
              <div className="text-[11px] text-zinc-400">MTD NWP</div>
            </div>
            {hasChildren && (
              <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full font-medium">
                {node.children?.length} direct
              </span>
            )}
          </div>
        </div>

        {/* Child recursion */}
        {hasChildren && isExpanded && (
          <div className="border-l-2 border-zinc-200 ml-4 pl-1">
            {node.children!.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    // Compensate top layout padding: -mt-6 -mx-6 mb-0 ensures zero gap with layout header
    <div className="-mt-6 -mx-6 bg-zinc-50 min-h-screen text-zinc-900 pb-12">
      {/* ============================================================== */}
      {/* Top Banner & Header (Flush with the Backoffice Header)          */}
      {/* ============================================================== */}
      <div className="bg-white border-b border-zinc-200 px-6 py-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 mt-1">Partner & Channel Hierarchy</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Configure multi-tier sales trees, Row-Level Security downlines, and Channel SLA auto-cancellation offsets.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setIsMakerCheckerNoticeOpen(true)}
              className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 shadow-xs transition"
            >
              <RefreshCw size={14} className="text-zinc-500" />
              <span>Sync RLS Downlines</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition"
            >
              <Plus size={15} />
              <span>Register Partner / Agent</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-8 mt-6 border-b border-zinc-200 -mb-5 max-w-7xl mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab("HIERARCHY")}
            className={`pb-3.5 text-sm font-semibold flex items-center space-x-2 border-b-2 transition ${
              activeTab === "HIERARCHY"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Network size={16} />
            <span>Downline Network & RLS Tree</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("CHANNEL_SLAS")}
            className={`pb-3.5 text-sm font-semibold flex items-center space-x-2 border-b-2 transition ${
              activeTab === "CHANNEL_SLAS"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Sliders size={16} />
            <span>Sales Channels & Auto-Cancel SLAs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("INSURER_REMITTANCE")}
            className={`pb-3.5 text-sm font-semibold flex items-center space-x-2 border-b-2 transition ${
              activeTab === "INSURER_REMITTANCE"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Calendar size={16} />
            <span>Broker-Insurer Remittance Matrix</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* Content Area                                                    */}
      {/* ============================================================== */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        {/* TAB 1: Downline Network & RLS Tree */}
        {activeTab === "HIERARCHY" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Tree Navigation Left (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-zinc-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search by Agent Code, Legal Name or License..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-zinc-900 placeholder-zinc-400"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-zinc-500 font-medium">Auto-Expand:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedNodes({
                          "brk-001": true,
                          "ptn-101": true,
                          "ptn-102": true,
                          "agt-201": true,
                          "agt-202": true,
                        })
                      }
                      className="px-2.5 py-1 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded transition"
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedNodes({ "brk-001": true })}
                      className="px-2.5 py-1 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded transition"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Tree View Container */}
                <div className="border border-zinc-100 rounded-lg p-2 bg-zinc-50/50 max-h-[680px] overflow-y-auto">
                  {renderTreeNode(HIERARCHY_TREE_DATA)}
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 mr-1.5" /> Broker Master
                    </span>
                    <span className="flex items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-1.5" /> Corporate Partner
                    </span>
                    <span className="flex items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-1.5" /> Master Agent
                    </span>
                    <span className="flex items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5" /> Sub Agent
                    </span>
                  </div>
                  <span className="font-mono text-[11px]">SCD Type 2 Enabled</span>
                </div>
              </div>
            </div>

            {/* Inspector Panel Right (5 Cols) */}
            <div className="lg:col-span-5 space-y-5">
              {selectedAgent ? (
                <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-5 sticky top-6">
                  <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
                    <div>
                      <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {selectedAgent.agentCode}
                      </span>
                      <h2 className="text-lg font-bold text-zinc-900 mt-2">{selectedAgent.nameEn}</h2>
                      <p className="text-xs text-zinc-500">{selectedAgent.nameTh}</p>
                    </div>
                    {renderTierBadge(selectedAgent.commissionTier)}
                  </div>

                  {/* RLS Scoping Indicator */}
                  <div className="mt-4 p-3 rounded-lg bg-zinc-50 border border-zinc-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-zinc-700 flex items-center">
                        <ShieldCheck size={14} className="text-emerald-600 mr-1.5" />
                        Row-Level Security (RLS) Filter
                      </span>
                      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white text-zinc-700 border border-zinc-200">
                        {selectedAgent.rlsScope}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {selectedAgent.rlsScope === "OWN_CUSTOMERS_ONLY" &&
                        "Strict Isolation: API gates allow access strictly to quotes and policies created with this specific agent_code."}
                      {selectedAgent.rlsScope === "DOWNLINE_PORTFOLIO" &&
                        "Downline Rollup: Granted automated aggregation over all nested child sub-agents in agent_hierarchy."}
                      {selectedAgent.rlsScope === "PARTNER_WIDE" &&
                        "Corporate Affiliate: Can access leads originating from affiliated car dealers and financing desks."}
                      {selectedAgent.rlsScope === "FULL_BROKER" &&
                        "Master Ledger Level: Unrestricted access across all operational lines."}
                    </p>
                  </div>

                  {/* Attributes Grid */}
                  <div className="mt-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between py-2 border-b border-zinc-100">
                      <span className="text-zinc-500 flex items-center">
                        <ShieldAlert size={14} className="text-zinc-400 mr-1.5" />
                        OIC License Number
                      </span>
                      <span className="font-semibold text-zinc-800 font-mono">{selectedAgent.oicLicenseNumber}</span>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-zinc-100">
                      <span className="text-zinc-500 flex items-center">
                        <Calendar size={14} className="text-zinc-400 mr-1.5" />
                        OIC Expiry Date
                      </span>
                      <div className="text-right">
                        <span
                          className={`font-semibold ${selectedAgent.isOicValid ? "text-zinc-800" : "text-rose-600"}`}
                        >
                          {selectedAgent.oicLicenseExpiry}
                        </span>
                        {!selectedAgent.isOicValid && (
                          <div className="text-[10px] text-rose-500 font-medium">Sales Token Blocked</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-zinc-100">
                      <span className="text-zinc-500 flex items-center">
                        <Users size={14} className="text-zinc-400 mr-1.5" />
                        Direct Downline Network
                      </span>
                      <span className="font-semibold text-zinc-800">{selectedAgent.downlineCount} Sub-Brokers</span>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-zinc-100">
                      <span className="text-zinc-500 flex items-center">
                        <DollarSign size={14} className="text-zinc-400 mr-1.5" />
                        Month-to-Date NWP Sold
                      </span>
                      <span className="font-bold text-zinc-900 text-sm">
                        {formatCurrency(selectedAgent.mtdPremiumNwp)}
                      </span>
                    </div>
                  </div>

                  {/* Maker-Checker Tier Override Simulator */}
                  <div className="mt-5 pt-4 border-t border-zinc-200">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-zinc-800">Modify Commission Tier (Maker-Checker)</label>
                      <span className="text-[10px] text-zinc-400">Clone-and-Swap (SCD Type 2)</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <select
                        aria-label="Commission Tier"
                        value={editingTier}
                        onChange={(e) => setEditingTier(e.target.value)}
                        className="flex-1 bg-zinc-50 border border-zinc-300 text-zinc-800 text-xs rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                      >
                        <option value="BRONZE">BRONZE (Base 10% Motor, 15% Non-Motor)</option>
                        <option value="SILVER">SILVER (Base + 2% Override)</option>
                        <option value="GOLD">GOLD (Base + 4% Override + Flex Rights)</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => setIsMakerCheckerNoticeOpen(true)}
                        className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold shadow-xs"
                      >
                        Stage Change
                      </button>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-2">
                      Modifying tiers generates an <code>approval_requests</code> Maker ticket. Rates do not alter
                      retroactively for issued policies.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-zinc-200 p-8 text-center text-zinc-400">
                  <Network size={36} className="mx-auto mb-2 text-zinc-300" />
                  <p className="text-sm font-medium">Select a partner or agent node to inspect properties</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Sales Channels & Auto-Cancel SLAs */}
        {activeTab === "CHANNEL_SLAS" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-zinc-200 bg-zinc-50/50">
                <h2 className="text-base font-bold text-zinc-900">
                  Supported Sales Channels & Operational SLA Configurator
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Governs <code>broker_channel_settings</code>. These parameters dictate background CRON workers for SMS
                  payment pre-warnings and systemic auto-cancellation offsets.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-100/70 border-b border-zinc-200 text-zinc-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Channel Origin</th>
                      <th className="py-3 px-4">Channel ID</th>
                      <th className="py-3 px-4">Payment Pre-Warning</th>
                      <th className="py-3 px-4">Auto-Cancel Grace Period</th>
                      <th className="py-3 px-4">Discount Mechanism</th>
                      <th className="py-3 px-4">URE Refer Policy</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {channelSettings.map((channel) => {
                      const meta = SALES_CHANNELS.find((c) => c.id === channel.channelId);
                      return (
                        <tr key={channel.channelId} className="hover:bg-zinc-50/80 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-zinc-900 text-sm">{channel.channelName}</div>
                            <div className="text-[11px] text-zinc-500 font-mono">{meta?.code}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-zinc-600">#{channel.channelId}</td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-zinc-800 text-sm">
                                {channel.warningDaysBeforeDue} days
                              </span>
                              <span className="text-[11px] text-zinc-400">before due date</span>
                            </div>
                            <div className="text-[10px] text-zinc-500">Triggers SMS / Line webhook</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md font-semibold text-xs bg-zinc-100 text-zinc-800 border border-zinc-300">
                              <Clock size={13} className="text-zinc-500" />
                              <span>
                                {channel.autoCancelOffsetDays === 0
                                  ? "0 days (Effective Date)"
                                  : `+${channel.autoCancelOffsetDays} days post-effective`}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                                meta?.discountMechanism === "Commission Sacrifice (Flex)"
                                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}
                            >
                              <Percent size={12} className="mr-1" />
                              {meta?.discountMechanism}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-medium">
                              <code>is_payment_locked: true</code>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setIsMakerCheckerNoticeOpen(true)}
                              className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                            >
                              Configure SLA
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Architectural Clarification Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                    <Info size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">Sub-Agent Commission Flex Logic</h3>
                    <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                      Affiliates and Sub-Agents cannot utilize public promo codes. Instead, they operate via{" "}
                      <strong>Commission Sacrifice</strong>, surrendering up to their Tier threshold to reduce the Net
                      Premium for the policyholder.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">Headless API Enactment</h3>
                    <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                      Every quotation request must pass the <code>channel_id</code> claim inside the JWT token. PAS
                      binds this immutable origin to prevent commission hijacking across external clients.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Broker-Insurer Remittance Matrix */}
        {activeTab === "INSURER_REMITTANCE" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-zinc-900">
                    Broker-Insurer Settlement & Payable Schedule (Bordereau)
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Governed by <code>broker_insurer_settings</code>. Drives the End-of-Month Outbound Remittance
                    Workers and fiat wire transfers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMakerCheckerNoticeOpen(true)}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-xs transition shrink-0"
                >
                  Map Carrier Agreement
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-100/70 border-b border-zinc-200 text-zinc-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Insurance Company (Carrier)</th>
                      <th className="py-3 px-4">Remittance Mode</th>
                      <th className="py-3 px-4">EOM Pay Date</th>
                      <th className="py-3 px-4">Credit Term</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Settings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {insurerSettings.map((item) => (
                      <tr key={item.insurerId} className="hover:bg-zinc-50/80 transition">
                        <td className="py-3.5 px-4 font-bold text-zinc-900 text-sm">{item.insurerName}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                              item.settlementMode === "NET"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-purple-50 text-purple-800 border border-purple-200"
                            }`}
                          >
                            {item.settlementMode === "NET" ? "Net Settle (Deduct First)" : "Gross Settle (Full Remit)"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-1 font-semibold text-zinc-800">
                            <Calendar size={13} className="text-zinc-400" />
                            <span>Every {item.monthlyPayDate}th of month</span>
                          </div>
                          <div className="text-[10px] text-zinc-400">Nightly Bordereau cut-off</div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-zinc-700">{item.creditTermDays} Days</td>
                        <td className="py-3.5 px-4">
                          {item.status === "ACTIVE" ? (
                            <span className="inline-flex items-center text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium border border-emerald-200">
                              <CheckCircle2 size={12} className="mr-1" /> Active Schedule
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium border border-amber-200">
                              <Clock size={12} className="mr-1" /> Maker-Checker Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setIsMakerCheckerNoticeOpen(true)}
                            className="px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition"
                          >
                            Edit Schedule
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* Maker-Checker Governance Interception Modal                   */}
      {/* ============================================================== */}
      {isMakerCheckerNoticeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center space-x-2 text-zinc-900 font-bold text-sm">
                <ShieldAlert size={18} className="text-amber-600" />
                <span>Segregation of Duties Enforced</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMakerCheckerNoticeOpen(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-zinc-600">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
                <p className="font-semibold text-xs">Direct Database Writes Blocked</p>
                <p className="mt-1 text-[11px] leading-relaxed">
                  Per Section 7.9 and 7.10 of the Governance Model, altering Commission Tiers, RLS parent linkages, or
                  Channel SLAs automatically stages a new record in <code>approval_requests</code>.
                </p>
              </div>

              <div className="space-y-2 border-t border-zinc-100 pt-3">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Maker ID (Current Actor):</span>
                  <span className="font-mono font-semibold text-zinc-800">usr_ops_maker_9921</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Checker Required Role:</span>
                  <span className="font-semibold text-indigo-700">Finance Manager / Underwriting Head</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">State Snapshot Pattern:</span>
                  <span className="font-mono text-zinc-800">SCD Type 2 (Clone &amp; Swap)</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsMakerCheckerNoticeOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert("Change submitted to the Approver Inbox (REQ-2026-CH-0042).");
                  setIsMakerCheckerNoticeOpen(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-xs"
              >
                Submit Ticket to Approvals Inbox
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerChannelHierarchyPage;
