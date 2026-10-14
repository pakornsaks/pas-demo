import React, { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { usePasAuth } from "../features/auth/context/PasAuthContext";

interface NavItem {
  label: string;
  to: string;
  badge?: string;
}

interface NavSubGroup {
  groupTitle: string;
  items: NavItem[];
}

interface NavPillar {
  pillarId: string;
  pillarTitle: string;
  subGroups: NavSubGroup[];
}

// Complete Navigation Tree matching every Route in your App.tsx
const NAVIGATION_TREE: NavPillar[] = [
  {
    pillarId: "operations",
    pillarTitle: "Operations & Execution",
    subGroups: [
      {
        groupTitle: "Dashboards",
        items: [
          { label: "Telesales Cockpit", to: "/dashboards/telesales" },
          { label: "Underwriter Workbench", to: "/dashboards/underwriter", badge: "SLA" },
          { label: "Collections & Installments", to: "/dashboards/collections" },
        ],
      },
      {
        groupTitle: "Policy Lifecycle",
        items: [
          { label: "Application Search", to: "/policies/search" },
          { label: "Policy Directory", to: "/policies/directory1" },
          { label: "Endorsements (Clone & Swap)", to: "/policies/endorsements" },
          { label: "Renewals (90-Day Queue)", to: "/policies/renewals" },
          { label: "Cancellations & Refunds", to: "/policies/cancellations" },
          { label: "Bulk Offline Ingestion", to: "/policies/bulk-ingestion" },
        ],
      },
      {
        groupTitle: "Product Factory & Rules",
        items: [
          { label: "Product Catalog", to: "/products/catalog" },
          { label: "Plan & Tier Configuration", to: "/products/plans" },
          { label: "Pricing & UW Rules (URE)", to: "/products/rules" },
          { label: "Dynamic Schema Builder", to: "/products/schemas" },
          { label: "Campaign & Promo Codes", to: "/products/promos" },
          { label: "Versioning & Publishing", to: "/products/versioning" },
        ],
      },
    ],
  },
  {
    pillarId: "finance",
    pillarTitle: "Finance & Distribution",
    subGroups: [
      {
        groupTitle: "Financial Ledger",
        items: [
          { label: "Transactions Ledger", to: "/finance/ledger" },
          { label: "Insurer Bordereau Settlements", to: "/finance/bordereau" },
          { label: "Commission Receivables", to: "/finance/commission-receivables" },
          { label: "Agent Wallets & Payouts", to: "/finance/wallets" },
          { label: "Suspense Reconciliation", to: "/finance/reconciliation" },
          { label: "Tax Document Center (50 Tawi)", to: "/finance/tax-documents" },
          { label: "Ledger Period Close", to: "/finance/period-close" },
        ],
      },
      {
        groupTitle: "CRM & Sales Hierarchy",
        items: [
          { label: "Customer Golden Record", to: "/crm/customers" },
          { label: "PDPA Data Privacy Center", to: "/crm/pdpa" },
          { label: "Broker Directory", to: "/crm/brokers" },
          { label: "Agent Sales Force", to: "/crm/agents" },
          { label: "Partner & Channel Hierarchy", to: "/crm/channels" },
        ],
      },
    ],
  },
  {
    pillarId: "governance",
    pillarTitle: "Compliance & Governance",
    subGroups: [
      {
        groupTitle: "Maker-Checker Governance",
        items: [
          { label: "Approval Inbox", to: "/governance/approvals", badge: "Maker-Checker" },
          { label: "Visual Diff Viewer", to: "/governance/diff-viewer" },
          { label: "Immutable Audit Trail", to: "/governance/audit-trail" },
        ],
      },
      {
        groupTitle: "Reports & Compliance",
        items: [
          { label: "OIC Regulatory Reports", to: "/reports/oic" },
          { label: "Tax Remittance Reports", to: "/reports/tax" },
          { label: "Operational Accounting", to: "/reports/accounting" },
          { label: "Analytics & Performance", to: "/reports/analytics" },
        ],
      },
    ],
  },
  {
    pillarId: "platform",
    pillarTitle: "Platform & Foundation",
    subGroups: [
      {
        groupTitle: "Workflow & Administration",
        items: [
          { label: "Workflow State Visualizer", to: "/admin/workflows" },
          { label: "Transition Rules Config", to: "/admin/transition-rules" },
          { label: "RBAC Permission Matrix", to: "/admin/rbac" },
          { label: "Operational Settings", to: "/admin/settings" },
          { label: "Integration & Webhook Hub", to: "/admin/integrations" },
          { label: "Document Template Registry", to: "/admin/templates" },
        ],
      },
      {
        groupTitle: "Master Data Management",
        items: [
          { label: "Insurer Carrier Directory", to: "/master-data/insurers" },
          { label: "Broker Settlement & SLA Settings", to: "/master-data/broker-settings" },
          { label: "Vehicle Hierarchy (Redbook)", to: "/master-data/vehicles" },
          { label: "Geography & District Risk", to: "/master-data/geography" },
          { label: "Occupancy & UW Classes", to: "/master-data/occupations" },
          { label: "Network Providers Directory", to: "/master-data/network-providers" },
        ],
      },
    ],
  },
];

export function AdminLayout() {
  const { activeContext, clearBrokerContextForSwitch, logout } = usePasAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Resolve current page breadcrumb from location.pathname
  const activeRouteMeta = useMemo(() => {
    for (const pillar of NAVIGATION_TREE) {
      for (const group of pillar.subGroups) {
        const match = group.items.find((item) => location.pathname.startsWith(item.to));
        if (match) {
          return {
            pillarTitle: pillar.pillarTitle,
            groupTitle: group.groupTitle,
            pageLabel: match.label,
          };
        }
      }
    }
    return {
      pillarTitle: "Back-Office Console",
      groupTitle: "Workspace",
      pageLabel: "Overview",
    };
  }, [location.pathname]);

  // Handler to switch active broker (clears bound broker_id and routes to /select-broker)
  const handleSwitchBroker = () => {
    clearBrokerContextForSwitch();
    navigate("/select-broker", { replace: true });
  };

  // Handler for full sign-out
  const handleSignOut = () => {
    logout();
    navigate("/select-broker", { replace: true });
  };

  // Global Operations Search (GET /admin/applications by Policy No, ID Card, or Legal Name)
  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearchQuery.trim()) return;
    navigate(`/policies/search?q=${encodeURIComponent(globalSearchQuery.trim())}`);
  };

  const toggleSubGroup = (groupTitle: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupTitle]: !prev[groupTitle],
    }));
  };

  const hasPiiUnmaskScope = activeContext?.scopes?.includes("pii:unmask") ?? false;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col">
      {/* =====================================================================
          TOP COMMAND BAR (Global Header, Search, PDPA Status & Broker Switcher)
      ===================================================================== */}
      <header className="h-16 bg-slate-900 text-white border-b border-slate-800 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        {/* Left: Sidebar Toggle & Platform Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Toggle Navigation Sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 font-bold text-xs flex items-center justify-center shadow-inner">
              PAS
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold tracking-tight leading-none">Unified Broker Platform</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Back-Office Command Center</div>
            </div>
          </div>
        </div>

        {/* Center: Global Operations Search (Policy No / Masked ID Card / Customer Name) */}
        <form onSubmit={handleGlobalSearchSubmit} className="hidden md:flex items-center max-w-md w-full mx-4">
          <div className="relative w-full">
            <input
              type="text"
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              placeholder="Search Policy No, Application ID, Customer Name, or ID Card..."
              className="w-full bg-slate-800/90 text-white placeholder-slate-400 text-xs rounded-lg pl-3.5 pr-16 py-2 border border-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold bg-slate-700 hover:bg-blue-600 text-slate-200 hover:text-white px-2.5 py-1 rounded transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Right: PDPA Masking Badge, Active Broker Switcher, User Roles & Logout */}
        <div className="flex items-center gap-3">
          {/* PDPA Egress Masking Status Indicator */}
          <div
            className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border ${
              hasPiiUnmaskScope
                ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
            }`}
            title="PDPA Compliance: PII is AES-256 encrypted and masked by default (1-1004-XXXX-88-9)"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${hasPiiUnmaskScope ? "bg-amber-400" : "bg-emerald-400"}`} />
            {hasPiiUnmaskScope ? "PII Unmask Authorized" : "PDPA Masked Mode"}
          </div>

          {/* Active Broker Context Pill + Switch Broker Button */}
          <div className="flex items-center gap-2.5 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${activeContext?.is_global_view ? "bg-indigo-400" : "bg-emerald-400"}`}
              />
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold leading-none">
                  {activeContext?.is_global_view ? "Global Scope" : "Active Broker"}
                </div>
                <div className="text-xs font-bold text-white leading-tight mt-0.5 max-w-[160px] truncate">
                  {activeContext?.broker_code ?? "UNBOUND"} • {activeContext?.broker_name_en ?? "Select Broker"}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSwitchBroker}
              className="text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded transition-colors shrink-0 shadow-2xs"
            >
              Switch Broker
            </button>
          </div>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={handleSignOut}
            className="text-xs font-medium text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-500/40 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* =====================================================================
          BODY CONTAINER (Left Sidebar Navigation + Main Outlet Workspace)
      ===================================================================== */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        {!isSidebarCollapsed && (
          <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 select-none overflow-y-auto h-[calc(100vh-4rem)] sticky top-16">
            {/* Sidebar Broker Quick-Card */}
            <div className="p-3.5 m-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Bound Session Context
                </span>
                <button
                  type="button"
                  onClick={handleSwitchBroker}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Change →
                </button>
              </div>
              <div className="text-xs font-bold text-slate-900 mt-1 truncate">
                {activeContext?.broker_name_en ?? "No Broker Selected"}
              </div>
              <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-200/80 text-[11px] text-slate-500">
                <span className="font-mono">{activeContext?.broker_code ?? "N/A"}</span>
                <span className="truncate max-w-[120px]">{activeContext?.roles?.join(", ") || "Staff"}</span>
              </div>
            </div>

            {/* Sidebar Navigation Pillars & Subgroups */}
            <div className="px-3 pb-8 space-y-5">
              {NAVIGATION_TREE.map((pillar) => (
                <div key={pillar.pillarId}>
                  <div className="px-2.5 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    {pillar.pillarTitle}
                  </div>

                  <div className="space-y-2">
                    {pillar.subGroups.map((group) => {
                      const isCollapsed = Boolean(collapsedGroups[group.groupTitle]);
                      return (
                        <div key={group.groupTitle} className="space-y-0.5">
                          <button
                            type="button"
                            onClick={() => toggleSubGroup(group.groupTitle)}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors"
                          >
                            <span>{group.groupTitle}</span>
                            <span className="text-[10px] text-slate-400">{isCollapsed ? "+" : "−"}</span>
                          </button>

                          {!isCollapsed && (
                            <nav className="pl-2 space-y-0.5 border-l border-slate-200 ml-2.5">
                              {group.items.map((item) => (
                                <NavLink
                                  key={item.to}
                                  to={item.to}
                                  className={({ isActive }) =>
                                    `flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                                      isActive
                                        ? "bg-blue-50 text-blue-700 font-semibold border border-blue-200/60"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
                                    }`
                                  }
                                >
                                  <span className="truncate">{item.label}</span>
                                  {item.badge && (
                                    <span className="ml-2 px-1.5 py-0.2 text-[10px] font-bold bg-blue-100 text-blue-800 rounded">
                                      {item.badge}
                                    </span>
                                  )}
                                </NavLink>
                              ))}
                            </nav>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* Main Operational Workspace */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Sub-Header Breadcrumb & RLS Context Bar */}
          <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <span>{activeRouteMeta.pillarTitle}</span>
              <span>/</span>
              <span>{activeRouteMeta.groupTitle}</span>
              <span>/</span>
              <span className="font-bold text-slate-900">{activeRouteMeta.pageLabel}</span>
            </div>
          </div>

          {/* Nested Route Outlet */}
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
