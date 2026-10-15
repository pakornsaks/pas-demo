import {
  ArrowUpRight,
  Award,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Copy,
  FileCheck2,
  Filter,
  Info,
  Percent,
  Plus,
  Search,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";
import React, { useState } from "react";

// ============================================================================
// Types & Domain Schemas (Aligned with agent_versions SCD Type 2 schema)
// ============================================================================
export type TierLevel = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

export interface CommissionTierConfig {
  tier_id: string;
  tier_code: TierLevel;
  tier_name: string;
  min_nwp_monthly_thb: number;
  override_commission_rate: number;
  max_agent_flex_rate: number;
  wht_rate_percent: number;
  active_agents_count: number;
  version_id: string;
  version_number: string;
  effective_start_date: string;
  effective_end_date: string | null;
  status: "ACTIVE" | "PENDING_APPROVAL" | "ARCHIVED";
}

export interface AgentTierRecord {
  agent_id: string;
  agent_code: string;
  agent_name_th: string;
  agent_name_en: string;
  broker_code: string;
  partner_name: string | null;
  current_tier: TierLevel;
  oic_license_no: string;
  oic_license_expiry: string;
  effective_tier_start_date: string; // SCD Type 2 effective_start_date
  effective_tier_end_date: string | null; // SCD Type 2 effective_end_date
  ytd_nwp_thb: number;
  status: "ACTIVE" | "EXPIRED" | "SUSPENDED";
}

export interface MakerCheckerDraft {
  request_id: string;
  entity_type: "COMMISSION_TIER" | "AGENT_TIER_ASSIGNMENT";
  target_id: string;
  target_name: string;
  proposed_changes: Record<string, any>;
  requested_by: string;
  created_at: string;
  status: "PENDING_APPROVAL";
}

// ============================================================================
// Initial Mock Data
// ============================================================================
const INITIAL_TIERS: CommissionTierConfig[] = [
  {
    tier_id: "tier-001",
    tier_code: "BRONZE",
    tier_name: "Bronze Standard",
    min_nwp_monthly_thb: 0,
    override_commission_rate: 0.0,
    max_agent_flex_rate: 2.0,
    wht_rate_percent: 3.0,
    active_agents_count: 142,
    version_id: "ver-b-01",
    version_number: "v1.0",
    effective_start_date: "2026-01-01",
    effective_end_date: null,
    status: "ACTIVE",
  },
  {
    tier_id: "tier-002",
    tier_code: "SILVER",
    tier_name: "Silver Growth",
    min_nwp_monthly_thb: 250000,
    override_commission_rate: 1.5,
    max_agent_flex_rate: 3.5,
    wht_rate_percent: 3.0,
    active_agents_count: 86,
    version_id: "ver-s-02",
    version_number: "v2.1",
    effective_start_date: "2026-02-15",
    effective_end_date: null,
    status: "ACTIVE",
  },
  {
    tier_id: "tier-003",
    tier_code: "GOLD",
    tier_name: "Gold Premier",
    min_nwp_monthly_thb: 750000,
    override_commission_rate: 2.5,
    max_agent_flex_rate: 5.0,
    wht_rate_percent: 3.0,
    active_agents_count: 34,
    version_id: "ver-g-03",
    version_number: "v3.0",
    effective_start_date: "2026-01-01",
    effective_end_date: null,
    status: "ACTIVE",
  },
  {
    tier_id: "tier-004",
    tier_code: "PLATINUM",
    tier_name: "Platinum Elite",
    min_nwp_monthly_thb: 2000000,
    override_commission_rate: 4.0,
    max_agent_flex_rate: 7.0,
    wht_rate_percent: 3.0,
    active_agents_count: 12,
    version_id: "ver-p-01",
    version_number: "v1.2",
    effective_start_date: "2026-03-01",
    effective_end_date: null,
    status: "ACTIVE",
  },
];

const INITIAL_AGENTS: AgentTierRecord[] = [
  {
    agent_id: "agt-9918",
    agent_code: "AGT-9918",
    agent_name_th: "สมชาย ว่องไวธุรกิจ",
    agent_name_en: "Somchai Vongvai",
    broker_code: "BRK-BKK-01",
    partner_name: "Honda Mega Direct",
    current_tier: "GOLD",
    oic_license_no: "6504018829",
    oic_license_expiry: "2026-12-31",
    effective_tier_start_date: "2026-02-01",
    effective_tier_end_date: null, // NULL in SCD Type 2 denotes currently active snapshot
    ytd_nwp_thb: 980500,
    status: "ACTIVE",
  },
  {
    agent_id: "agt-9920",
    agent_code: "AGT-9920",
    agent_name_th: "กัญญารัตน์ สว่างจิตต์",
    agent_name_en: "Kanyarat Sawangjit",
    broker_code: "BRK-BKK-01",
    partner_name: null,
    current_tier: "PLATINUM",
    oic_license_no: "6304001928",
    oic_license_expiry: "2027-04-15",
    effective_tier_start_date: "2026-03-01",
    effective_tier_end_date: null,
    ytd_nwp_thb: 2420000,
    status: "ACTIVE",
  },
  {
    agent_id: "agt-9925",
    agent_code: "AGT-9925",
    agent_name_th: "อนุสรณ์ รุ่งโรจน์พาณิชย์",
    agent_name_en: "Anusorn Rungroj",
    broker_code: "BRK-CNX-02",
    partner_name: "Chiang Mai Auto Alliance",
    current_tier: "SILVER",
    oic_license_no: "6404982173",
    oic_license_expiry: "2026-07-30",
    effective_tier_start_date: "2026-01-15",
    effective_tier_end_date: "2026-12-31", // Explicit campaign validity boundary
    ytd_nwp_thb: 485000,
    status: "ACTIVE",
  },
  {
    agent_id: "agt-9931",
    agent_code: "AGT-9931",
    agent_name_th: "นลินี มั่นคงพัฒนา",
    agent_name_en: "Nalinee Mankhong",
    broker_code: "BRK-BKK-02",
    partner_name: null,
    current_tier: "BRONZE",
    oic_license_no: "6604109823",
    oic_license_expiry: "2026-11-20",
    effective_tier_start_date: "2026-01-01",
    effective_tier_end_date: null,
    ytd_nwp_thb: 140000,
    status: "ACTIVE",
  },
  {
    agent_id: "agt-9944",
    agent_code: "AGT-9944",
    agent_name_th: "ทวีศักดิ์ เลิศสุวรรณ",
    agent_name_en: "Taweesak Lertsuwan",
    broker_code: "BRK-HYI-01",
    partner_name: "Hat Yai Finance Broker",
    current_tier: "SILVER",
    oic_license_no: "6204009112",
    oic_license_expiry: "2026-05-18",
    effective_tier_start_date: "2026-02-15",
    effective_tier_end_date: "2026-06-30",
    ytd_nwp_thb: 390000,
    status: "ACTIVE",
  },
];

const INITIAL_REQUESTS: MakerCheckerDraft[] = [
  {
    request_id: "REQ-2026-0118",
    entity_type: "COMMISSION_TIER",
    target_id: "tier-003",
    target_name: "Gold Premier (Override Rate Adjust)",
    proposed_changes: {
      override_commission_rate: "+2.75% (was +2.50%)",
      min_nwp_monthly_thb: "800,000 THB (was 750,000 THB)",
    },
    requested_by: "pakornsak.s@broker.co.th (Finance Maker)",
    created_at: "2026-10-14 16:32",
    status: "PENDING_APPROVAL",
  },
  {
    request_id: "REQ-2026-0119",
    entity_type: "AGENT_TIER_ASSIGNMENT",
    target_id: "agt-9918",
    target_name: "Somchai Vongvai (Promote to Platinum)",
    proposed_changes: {
      new_tier: "PLATINUM",
      prior_tier: "GOLD",
      reason: "Exceeded 2.0M NWP criteria for Q3 2026",
    },
    requested_by: "nareerat.m@broker.co.th (Sales Ops)",
    created_at: "2026-10-15 08:45",
    status: "PENDING_APPROVAL",
  },
];

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(val);

const getTierBadge = (tier: TierLevel) => {
  switch (tier) {
    case "PLATINUM":
      return "bg-purple-50 text-purple-700 border-purple-200 ring-purple-500/20";
    case "GOLD":
      return "bg-amber-50 text-amber-800 border-amber-200 ring-amber-500/20";
    case "SILVER":
      return "bg-slate-100 text-slate-700 border-slate-300 ring-slate-400/20";
    case "BRONZE":
    default:
      return "bg-orange-50 text-orange-800 border-orange-200 ring-orange-500/20";
  }
};

function CommissionTierAgentPage() {
  const [activeTab, setActiveTab] = useState<"tiers" | "agents" | "approvals">("agents");
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const [tiers] = useState<CommissionTierConfig[]>(INITIAL_TIERS);
  const [agents] = useState<AgentTierRecord[]>(INITIAL_AGENTS);
  const [pendingRequests, setPendingRequests] = useState<MakerCheckerDraft[]>(INITIAL_REQUESTS);

  // Modal States
  const [isCloneDraftModalOpen, setIsCloneDraftModalOpen] = useState(false);
  const [selectedTierForDraft, setSelectedTierForDraft] = useState<CommissionTierConfig | null>(null);
  const [draftOverrideRate, setDraftOverrideRate] = useState<number>(0);
  const [draftMinNwp, setDraftMinNwp] = useState<number>(0);
  const [draftFlexRate, setDraftFlexRate] = useState<number>(0);
  const [makerReason, setMakerReason] = useState("");

  const [isAgentReassignModalOpen, setIsAgentReassignModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentTierRecord | null>(null);
  const [targetTier, setTargetTier] = useState<TierLevel>("GOLD");
  const [reassignReason, setReassignReason] = useState("");

  const [notification, setNotification] = useState<{ type: "success" | "info"; msg: string } | null>(null);

  const showToast = (msg: string, type: "success" | "info" = "success") => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenDraftModal = (tier: CommissionTierConfig) => {
    setSelectedTierForDraft(tier);
    setDraftOverrideRate(tier.override_commission_rate);
    setDraftMinNwp(tier.min_nwp_monthly_thb);
    setDraftFlexRate(tier.max_agent_flex_rate);
    setMakerReason("");
    setIsCloneDraftModalOpen(true);
  };

  const handleOpenReassignModal = (agent: AgentTierRecord) => {
    setSelectedAgent(agent);
    setTargetTier(agent.current_tier);
    setReassignReason("");
    setIsAgentReassignModalOpen(true);
  };

  const handleSubmitDraftProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTierForDraft) return;

    const newReq: MakerCheckerDraft = {
      request_id: `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      entity_type: "COMMISSION_TIER",
      target_id: selectedTierForDraft.tier_id,
      target_name: `${selectedTierForDraft.tier_name} (Copy-on-Write Version Clone)`,
      proposed_changes: {
        override_commission_rate: `+${draftOverrideRate}% (was +${selectedTierForDraft.override_commission_rate}%)`,
        min_nwp_monthly_thb: `${formatCurrency(draftMinNwp)} (was ${formatCurrency(selectedTierForDraft.min_nwp_monthly_thb)})`,
        max_agent_flex_rate: `Up to ${draftFlexRate}%`,
        justification: makerReason || "Quarterly benchmark adjustment",
      },
      requested_by: "current_user@broker.co.th (Maker)",
      created_at: new Date().toISOString().replace("T", " ").substring(0, 16),
      status: "PENDING_APPROVAL",
    };

    setPendingRequests([newReq, ...pendingRequests]);
    setIsCloneDraftModalOpen(false);
    showToast(`Draft staged as ${newReq.request_id}. Pending Manager Checker sign-off.`);
  };

  const handleSubmitAgentReassign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) return;

    const newReq: MakerCheckerDraft = {
      request_id: `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      entity_type: "AGENT_TIER_ASSIGNMENT",
      target_id: selectedAgent.agent_id,
      target_name: `${selectedAgent.agent_name_en} (${selectedAgent.agent_code})`,
      proposed_changes: {
        new_tier: targetTier,
        prior_tier: selectedAgent.current_tier,
        justification: reassignReason || "Performance tier adjustment",
      },
      requested_by: "current_user@broker.co.th (Maker)",
      created_at: new Date().toISOString().replace("T", " ").substring(0, 16),
      status: "PENDING_APPROVAL",
    };

    setPendingRequests([newReq, ...pendingRequests]);
    setIsAgentReassignModalOpen(false);
    showToast(`Agent re-tier ticket ${newReq.request_id} submitted to Maker-Checker queue.`);
  };

  const filteredAgents = agents.filter((ag) => {
    const matchesTier = tierFilter === "ALL" || ag.current_tier === tierFilter;
    const q = searchQuery.toLowerCase();
    return (
      matchesTier &&
      (ag.agent_code.toLowerCase().includes(q) ||
        ag.agent_name_en.toLowerCase().includes(q) ||
        ag.agent_name_th.includes(q) ||
        ag.broker_code.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-16 right-6 z-50 flex items-center gap-3 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-xl transition-all">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span>{notification.msg}</span>
          <button onClick={() => setNotification(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Commission Tiers &amp; Agent Overrides
            </h1>
            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">
              SCD Type 2 Enabled
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Configure agent performance tiers, override commission rates (OOV), and validity date boundaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("approvals")}
            className="relative inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            <span>Maker-Checker Queue</span>
            {pendingRequests.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => handleOpenDraftModal(tiers[2])}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white shadow-xs hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Clone New Draft Tier</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Configured Tiers</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">4 Active</span>
            <span className="text-xs text-slate-500">Bronze to Platinum</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Dual-layer: Base Product % + OOV Tier %</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Enrolled Agents</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">274 Agents</span>
            <span className="text-xs font-medium text-emerald-600">100% OIC Verified</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Explicit SCD Type 2 temporal timeline</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Statutory Tax Rule</span>
            <div className="rounded-lg bg-sky-50 p-2 text-sky-600">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">3.00% WHT</span>
            <span className="text-xs text-sky-600">Thai Revenue Code</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Deducted prior to Sub-Agent wallet payout</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Maker-Checker Approvals</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{pendingRequests.length} Pending</span>
            <span className="text-xs text-amber-600">Segregation of Duties</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Makers cannot self-approve tier mutations</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab("tiers")}
            className={`flex items-center gap-2 border-b-2 py-3 text-xs font-semibold transition-all ${
              activeTab === "tiers"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            <Award className="h-4 w-4" />
            <span>Tier Structures &amp; Overrides</span>
          </button>
          <button
            onClick={() => setActiveTab("agents")}
            className={`flex items-center gap-2 border-b-2 py-3 text-xs font-semibold transition-all ${
              activeTab === "agents"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Agent Tier Directory</span>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] text-slate-700">{agents.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("approvals")}
            className={`flex items-center gap-2 border-b-2 py-3 text-xs font-semibold transition-all ${
              activeTab === "approvals"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            <span>Maker-Checker Requests</span>
            {pendingRequests.length > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* ===================================================================
          TAB 1: TIER CONFIGURATION MATRIX
      =================================================================== */}
      {activeTab === "tiers" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-3 sm:px-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Master Commission Tier Matrix</h2>
                <p className="text-xs text-slate-500">
                  Defines volume qualifications, Override (OOV) bonus, and agent commission sacrifice bounds.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                  Live in Product Factory Engine
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Tier Code &amp; Level</th>
                    <th className="py-3 px-4">Monthly NWP Target</th>
                    <th className="py-3 px-4">Override Rate (OOV)</th>
                    <th className="py-3 px-4">Max Flex / Sacrifice</th>
                    <th className="py-3 px-4">WHT (50 Tawi)</th>
                    <th className="py-3 px-4">Enrolled Agents</th>
                    <th className="py-3 px-4">Version &amp; Timeline</th>
                    <th className="py-3 px-4 text-right">Governance Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                  {tiers.map((tier) => (
                    <tr key={tier.tier_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-medium">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold border ${getTierBadge(
                              tier.tier_code,
                            )}`}
                          >
                            {tier.tier_code}
                          </span>
                          <span className="text-xs font-medium text-slate-900">{tier.tier_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {tier.min_nwp_monthly_thb === 0
                            ? "No Threshold (Base)"
                            : formatCurrency(tier.min_nwp_monthly_thb)}
                        </div>
                        <span className="text-[11px] text-slate-400">Calendar month NWP</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded text-xs border border-blue-200">
                          <ArrowUpRight className="h-3 w-3" />
                          <span>+{tier.override_commission_rate.toFixed(2)}%</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Stacked on product base</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">Up to {tier.max_agent_flex_rate.toFixed(1)}%</div>
                        <span className="text-[11px] text-slate-400">Agent discount allowance</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center rounded bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700 border border-sky-200">
                          3.00%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-slate-400" />
                          <span>{tier.active_agents_count} agents</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-xs text-slate-800">{tier.version_number}</div>
                        <span className="text-[11px] text-slate-400">Effective: {tier.effective_start_date}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenDraftModal(tier)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-colors"
                        >
                          <Copy className="h-3.5 w-3.5 text-slate-500" />
                          <span>Clone Draft</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-200 bg-slate-50/50 p-4 text-xs text-slate-600 flex items-start gap-2.5">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-slate-800">Immutable Commission Snapshotting: </span>
                When a policy is issued, the PAS locks the agent&apos;s active tier and override percentage into the{" "}
                <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] font-mono text-slate-800">
                  commissions
                </code>{" "}
                ledger. Promoting an agent at a later date never retroactively changes past policy commissions or 50
                Tawi tax reports.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          TAB 2: AGENT TIER DIRECTORY (INCLUDES TIER START & END DATES)
      =================================================================== */}
      {activeTab === "agents" && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Agent Code, Thai Name, English Name, or Broker..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 shadow-2xs focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-600">Filter Tier:</span>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Tiers ({agents.length})</option>
                <option value="BRONZE">Bronze</option>
                <option value="SILVER">Silver</option>
                <option value="GOLD">Gold</option>
                <option value="PLATINUM">Platinum</option>
              </select>
            </div>
          </div>

          {/* Directory Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Agent Identity</th>
                    <th className="py-3 px-4">Parent Broker / Affiliate</th>
                    <th className="py-3 px-4">Current Commission Tier</th>
                    <th className="py-3 px-4">YTD Net Written Premium</th>
                    <th className="py-3 px-4">OIC License Status</th>
                    <th className="py-3 px-4">Tier Start Date</th>
                    {/* NEW COLUMN: Tier End Date */}
                    <th className="py-3 px-4">Tier End Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                  {filteredAgents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No agents matched the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAgents.map((ag) => (
                      <tr key={ag.agent_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-xs font-bold text-blue-700">{ag.agent_code}</div>
                          <div className="font-medium text-slate-900">{ag.agent_name_en}</div>
                          <div className="text-[11px] text-slate-500">{ag.agent_name_th}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-800">{ag.broker_code}</div>
                          <div className="text-[11px] text-slate-400">{ag.partner_name || "Direct Agency"}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold border ${getTierBadge(
                              ag.current_tier,
                            )}`}
                          >
                            {ag.current_tier}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{formatCurrency(ag.ytd_nwp_thb)}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-xs text-slate-700">{ag.oic_license_no}</div>
                          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Expires {ag.oic_license_expiry}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 font-mono">{ag.effective_tier_start_date}</td>
                        {/* Rendered Tier End Date Cell */}
                        <td className="py-3.5 px-4 text-xs">
                          {ag.effective_tier_end_date ? (
                            <div className="flex items-center gap-1.5 text-slate-700 font-mono">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              <span>{ag.effective_tier_end_date}</span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                              Active (No Expiry)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenReassignModal(ag)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-blue-600 shadow-2xs hover:bg-blue-50/60 hover:border-blue-200 transition-colors"
                          >
                            <span>Reassign Tier</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-200 bg-slate-50/50 p-4 text-xs text-slate-600 flex items-start gap-2.5">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-slate-800">SCD Type 2 Timeline Management: </span>
                An agent&apos;s tier record maps to{" "}
                <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] font-mono text-slate-800">
                  agent_versions
                </code>
                [cite: 2]. A value of <strong className="text-emerald-700">Active (No Expiry)</strong> indicates the
                standard state where{" "}
                <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] font-mono text-slate-800">
                  effective_end_date IS NULL
                </code>
                , which remains active indefinitely until an authorized Maker-Checker reclassification caps the
                timeline[cite: 1, 2].
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          TAB 3: MAKER-CHECKER APPROVAL QUEUE
      =================================================================== */}
      {activeTab === "approvals" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 text-xs text-amber-900 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">BRD Strict Segregation of Duties Mandate: </span>
              Under internal governance rules, a Maker who drafts an override modification or tier promotion cannot
              approve it[cite: 1, 2]. Checker authorization writes immutable records to{" "}
              <code className="bg-amber-100 font-mono text-[11px] px-1 py-0.5 rounded">approval_logs</code>[cite: 1, 2].
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
              <h2 className="text-sm font-semibold text-slate-800">Pending Maker-Checker Staging Tickets</h2>
            </div>

            <div className="divide-y divide-slate-100">
              {pendingRequests.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No approval tickets currently pending.</div>
              ) : (
                pendingRequests.map((req) => (
                  <div
                    key={req.request_id}
                    className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-700">{req.request_id}</span>
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                          {req.entity_type}
                        </span>
                        <span className="text-xs text-slate-400">• {req.created_at}</span>
                      </div>
                      <div className="text-sm font-semibold text-slate-900">{req.target_name}</div>

                      <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 text-xs font-mono text-slate-700 space-y-1">
                        {Object.entries(req.proposed_changes).map(([k, v]) => (
                          <div key={k} className="flex gap-2">
                            <span className="text-slate-400 capitalize">{k.replace(/_/g, " ")}:</span>
                            <span className="font-semibold text-slate-800">{String(v)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="text-[11px] text-slate-500">
                        Requested by: <span className="font-medium text-slate-700">{req.requested_by}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setPendingRequests(pendingRequests.filter((r) => r.request_id !== req.request_id));
                          showToast(`Draft ticket ${req.request_id} rejected and logged in approval_logs.`, "info");
                        }}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          setPendingRequests(pendingRequests.filter((r) => r.request_id !== req.request_id));
                          showToast(`Ticket ${req.request_id} approved. New SCD Type 2 record activated.`);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 shadow-xs transition-colors"
                      >
                        <FileCheck2 className="h-4 w-4" />
                        <span>Approve &amp; Activate</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: CLONE & EDIT TIER DRAFT
      =================================================================== */}
      {isCloneDraftModalOpen && selectedTierForDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Clone Draft: {selectedTierForDraft.tier_name}</h3>
                <p className="text-xs text-slate-500">
                  Creates an immutable pending draft version without affecting live quoting.
                </p>
              </div>
              <button
                onClick={() => setIsCloneDraftModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDraftProposal} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700">Override Commission Rate (OOV %)</label>
                <div className="mt-1 relative rounded-md shadow-2xs">
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="15"
                    value={draftOverrideRate}
                    onChange={(e) => setDraftOverrideRate(parseFloat(e.target.value))}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-xs text-slate-400">%</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Monthly Net Written Premium (NWP) Threshold (THB)
                </label>
                <input
                  type="number"
                  step="50000"
                  min="0"
                  value={draftMinNwp}
                  onChange={(e) => setDraftMinNwp(parseInt(e.target.value) || 0)}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Max Agent Flex / Sacrifice Rate (%)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="10"
                  value={draftFlexRate}
                  onChange={(e) => setDraftFlexRate(parseFloat(e.target.value))}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Maker Business Justification</label>
                <textarea
                  rows={2}
                  value={makerReason}
                  onChange={(e) => setMakerReason(e.target.value)}
                  placeholder="Explain why this tier rate or threshold is being amended..."
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCloneDraftModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 shadow-xs"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Submit Draft to Checker</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: REASSIGN AGENT TIER
      =================================================================== */}
      {isAgentReassignModalOpen && selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Promote / Reassign Agent Tier</h3>
                <p className="text-xs text-slate-500">
                  {selectedAgent.agent_code} — {selectedAgent.agent_name_en}
                </p>
              </div>
              <button
                onClick={() => setIsAgentReassignModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAgentReassign} className="mt-4 space-y-4">
              <div className="rounded-lg bg-slate-50 p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Assigned Tier:</span>
                  <span className="font-bold text-slate-800">{selectedAgent.current_tier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tier Start Date:</span>
                  <span className="font-medium text-slate-800 font-mono">
                    {selectedAgent.effective_tier_start_date}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tier End Date:</span>
                  <span className="font-medium text-slate-800 font-mono">
                    {selectedAgent.effective_tier_end_date || "Active (No Expiry)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">YTD Volume (NWP):</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(selectedAgent.ytd_nwp_thb)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Target Commission Tier</label>
                <select
                  value={targetTier}
                  onChange={(e) => setTargetTier(e.target.value as TierLevel)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                >
                  <option value="BRONZE">BRONZE (+0.0% Override)</option>
                  <option value="SILVER">SILVER (+1.5% Override)</option>
                  <option value="GOLD">GOLD (+2.5% Override)</option>
                  <option value="PLATINUM">PLATINUM (+4.0% Override)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Maker Reassignment Reason</label>
                <textarea
                  rows={2}
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="State performance qualification justification..."
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAgentReassignModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 shadow-xs"
                >
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CommissionTierAgentPage;
