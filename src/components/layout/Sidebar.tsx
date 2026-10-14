import { usePasAuth } from "@/features/auth/context/PasAuthContext";
import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

export interface NavItem {
  label: string;
  to: string;
  badge?: string;
  badgeTone?: "blue" | "amber" | "emerald" | "rose";
  brdRef?: string;
}

export interface NavSubGroup {
  groupId: string;
  groupTitle: string;
  icon: React.ReactNode;
  items: NavItem[];
}

export interface NavPillar {
  pillarId: string;
  pillarTitle: string;
  subGroups: NavSubGroup[];
}

// Inline SVG Icons for each domain group (Zero external icon dependencies required)
const GroupIcons = {
  dashboards: (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    </svg>
  ),
  policies: (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
  products: (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      />
    </svg>
  ),
  finance: (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  crm: (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  ),
  sales: (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  ),
  governance: (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  ),
  reports: (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
  admin: (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  masterData: (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
      />
    </svg>
  ),
};

// Complete Navigation Tree matching every Route in your App.tsx
export const SIDEBAR_NAVIGATION: NavPillar[] = [
  {
    pillarId: "operations",
    pillarTitle: "Operations & Execution",
    subGroups: [
      {
        groupId: "dashboards",
        groupTitle: "Dashboards",
        icon: GroupIcons.dashboards,
        items: [
          {
            label: "Underwriter Workbench",
            to: "/dashboards/underwriter",
            badge: "SLA",
            badgeTone: "amber",
            brdRef: "8.7.2",
          },
          { label: "Collections & Installments", to: "/dashboards/collections", brdRef: "8.7.4" },
        ],
      },
      {
        groupId: "policies",
        groupTitle: "Policy Lifecycle",
        icon: GroupIcons.policies,
        items: [
          { label: "Quotation Search", to: "/policies/quotations", brdRef: "8.3.1" },
          { label: "Application Search", to: "/policies/applications", brdRef: "8.3.1" },
          { label: "Policy Directory", to: "/policies/directory", brdRef: "8.3.1" },
          { label: "Endorsement", to: "/policies/endorsements", badge: "SCD2", badgeTone: "blue" },
          { label: "Renewals Management", to: "/policies/renewals" },
          { label: "Cancellations & Refunds", to: "/policies/cancellations" },
        ],
      },
      {
        groupId: "products",
        groupTitle: "Product Factory & Rules",
        icon: GroupIcons.products,
        items: [
          { label: "Product Catalog", to: "/products/catalog", brdRef: "8.2.1" },
          { label: "Pricing & UW Rules", to: "/products/rules", brdRef: "8.4.1" },
          { label: "Campaign & Promo Codes", to: "/products/promos", brdRef: "8.5.1" },
          { label: "Versioning & Publishing", to: "/products/versioning", brdRef: "8.2.5" },
        ],
      },
    ],
  },
  {
    pillarId: "finance",
    pillarTitle: "Finance & Accounting",
    subGroups: [
      {
        groupId: "finance-ledger",
        groupTitle: "Financial Ledger",
        icon: GroupIcons.finance,
        items: [
          { label: "Transactions Ledger", to: "/finance/ledger", brdRef: "8.7.3" },
          { label: "Insurer Bordereau", to: "/finance/bordereau" },
          { label: "Commission Receivables", to: "/finance/commission-receivables" },
          { label: "Agent Wallets", to: "/finance/wallets" },
          { label: "Suspense Reconciliation", to: "/finance/reconciliation" },
          { label: "Tax Documents (50 Tawi)", to: "/finance/tax-documents" },
          { label: "Ledger Period Close", to: "/finance/period-close" },
        ],
      },
      {
        groupId: "crm",
        groupTitle: "CRM",
        icon: GroupIcons.crm,
        items: [
          { label: "Customer 360°", to: "/crm/customers" },
          { label: "PDPA Privacy Center", to: "/crm/pdpa", badge: "PDPA", badgeTone: "emerald" },
        ],
      },
      {
        groupId: "sales",
        groupTitle: "Sales Hierarchy",
        icon: GroupIcons.sales,
        items: [
          { label: "Brokers", to: "/sales/brokers" },
          { label: "Agents & Sales Force", to: "/sales/agents" },
          { label: "Partners & Channels", to: "/sales/channels" },
          { label: "Commission Tier", to: "/sales/commision-tier" },
        ],
      },
    ],
  },
  {
    pillarId: "governance",
    pillarTitle: "Compliance & Governance",
    subGroups: [
      {
        groupId: "governance-approvals",
        groupTitle: "Governance & Approvals",
        icon: GroupIcons.governance,
        items: [
          {
            label: "Approval Inbox",
            to: "/governance/approvals",
            badge: "Checker",
            badgeTone: "rose",
            brdRef: "8.9.1",
          },
          { label: "Visual Diff Viewer", to: "/governance/diff-viewer", brdRef: "8.9.2" },
          { label: "Immutable Audit Trail", to: "/governance/audit-trail" },
        ],
      },
      {
        groupId: "reports",
        groupTitle: "Reports & Compliance",
        icon: GroupIcons.reports,
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
        groupId: "master-data",
        groupTitle: "Master Data",
        icon: GroupIcons.masterData,
        items: [
          { label: "Insurers", to: "/master-data/insurers" },
          { label: "Vehicles", to: "/master-data/vehicles", brdRef: "8.1.2" },
          { label: "Geography & Risk", to: "/master-data/geography" },
          { label: "Occupancy & Risk", to: "/master-data/occupations" },
          { label: "Network Providers", to: "/master-data/network-providers" },
        ],
      },
      {
        groupId: "admin-workflow",
        groupTitle: "Workflow & Admin",
        icon: GroupIcons.admin,
        items: [
          { label: "Workflow Visualizer", to: "/admin/workflows", brdRef: "8.8.1" },
          { label: "Transition Rules Config", to: "/admin/transition-rules", brdRef: "8.8.2" },
          { label: "RBAC Access Control", to: "/admin/rbac", brdRef: "8.6.1" },
          { label: "Operational Settings", to: "/admin/settings" },
          { label: "Broker SLA & Settlements", to: "/master-data/broker-settings", brdRef: "8.1.3" },
          { label: "Integration Hub", to: "/admin/integrations" },
          { label: "Document Templates", to: "/admin/templates" },
        ],
      },
    ],
  },
];

const BADGE_TONE_CLASSES: Record<NonNullable<NavItem["badgeTone"]>, string> = {
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rose: "bg-rose-50 text-rose-700 border-rose-200",
};

export interface SidebarProps {
  /** Controls whether the sidebar is collapsed into a narrow icon rail */
  isCollapsed?: boolean;
  /** Optional callback to toggle collapse state from inside the sidebar */
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed = false, onToggleCollapse }) => {
  const { activeContext, clearBrokerContextForSwitch } = usePasAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [menuFilter, setMenuFilter] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    dashboards: true,
    policies: true,
    products: false,
    "finance-ledger": false,
    crm: false,
    "governance-approvals": true,
    reports: false,
    "admin-workflow": false,
    "master-data": false,
  });

  // Automatically expand the subgroup that contains the current active route
  useEffect(() => {
    for (const pillar of SIDEBAR_NAVIGATION) {
      for (const group of pillar.subGroups) {
        if (group.items.some((item) => location.pathname.startsWith(item.to))) {
          setOpenGroups((prev) => ({ ...prev, [group.groupId]: true }));
        }
      }
    }
  }, [location.pathname]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Switch Broker handler: clears the bound broker_id and routes to /select-broker
  const handleSwitchBroker = () => {
    clearBrokerContextForSwitch();
    navigate("/select-broker", { replace: true });
  };

  // Filter navigation tree by search input
  const filteredNavigation = useMemo(() => {
    const query = menuFilter.trim().toLowerCase();
    if (!query) return SIDEBAR_NAVIGATION;

    return SIDEBAR_NAVIGATION.map((pillar) => ({
      ...pillar,
      subGroups: pillar.subGroups
        .map((group) => ({
          ...group,
          items: group.items.filter(
            (item) =>
              item.label.toLowerCase().includes(query) ||
              group.groupTitle.toLowerCase().includes(query) ||
              (item.brdRef && item.brdRef.toLowerCase().includes(query)),
          ),
        }))
        .filter((group) => group.items.length > 0),
    })).filter((pillar) => pillar.subGroups.length > 0);
  }, [menuFilter]);

  const hasPiiUnmaskScope = activeContext?.scopes?.includes("pii:unmask") ?? false;

  // ===========================================================================
  // COLLAPSED ICON-RAIL MODE
  // ===========================================================================
  if (isCollapsed) {
    return (
      <aside className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-4 shrink-0 select-none h-[calc(100vh-4rem)] sticky top-16 justify-between">
        <div className="space-y-4 flex flex-col items-center w-full">
          {/* Active Broker Indicator Button */}
          <button
            type="button"
            onClick={handleSwitchBroker}
            title={`Active Broker: ${activeContext?.broker_name_en ?? "Unbound"} (Click to Switch)`}
            className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-mono text-[10px] font-bold flex items-center justify-center hover:bg-blue-100 transition-colors"
          >
            {activeContext?.is_global_view ? "ALL" : (activeContext?.broker_code?.slice(0, 3) ?? "BRK")}
          </button>

          <div className="w-8 border-t border-slate-200" />

          {/* Group Rail Icons */}
          <div className="space-y-1.5 w-full px-2">
            {SIDEBAR_NAVIGATION.flatMap((p) => p.subGroups).map((group) => {
              const isGroupActive = group.items.some((item) => location.pathname.startsWith(item.to));
              return (
                <button
                  key={group.groupId}
                  type="button"
                  title={group.groupTitle}
                  onClick={() => {
                    if (onToggleCollapse) onToggleCollapse();
                    setOpenGroups((prev) => ({ ...prev, [group.groupId]: true }));
                  }}
                  className={`w-full h-9 rounded-lg flex items-center justify-center transition-colors ${
                    isGroupActive
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {group.icon}
                </button>
              );
            })}
          </div>
        </div>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Expand Sidebar"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            →
          </button>
        )}
      </aside>
    );
  }

  // ===========================================================================
  // EXPANDED FULL SIDEBAR MODE
  // ===========================================================================
  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 select-none sticky top-16">
      {/* 1. Quick Menu Filter Search Box */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <input
            type="text"
            value={menuFilter}
            onChange={(e) => setMenuFilter(e.target.value)}
            placeholder="Filter 37 menu screens..."
            className="w-full pl-3 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          {menuFilter && (
            <button
              type="button"
              onClick={() => setMenuFilter("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 2. Scrollable Navigation Pillars & Accordion Sub-Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
        {filteredNavigation.map((pillar) => (
          <div key={pillar.pillarId}>
            <div className="px-2.5 mb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              {pillar.pillarTitle}
            </div>

            <div className="space-y-1">
              {pillar.subGroups.map((group) => {
                const isGroupOpen = Boolean(menuFilter.trim()) || Boolean(openGroups[group.groupId]);
                const hasActiveChild = group.items.some((item) => location.pathname.startsWith(item.to));

                return (
                  <div key={group.groupId} className="space-y-0.5">
                    {/* Sub-Group Header Button */}
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.groupId)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        hasActiveChild
                          ? "text-blue-900 bg-blue-50/50"
                          : "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className={hasActiveChild ? "text-blue-600" : "text-slate-400"}>{group.icon}</span>
                        <span className="truncate">{group.groupTitle}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 ml-2">{isGroupOpen ? "▾" : "▸"}</span>
                    </button>

                    {/* Nested Route Links */}
                    {isGroupOpen && (
                      <nav className="pl-3.5 ml-3 border-l border-slate-200 space-y-0.5 py-0.5">
                        {group.items.map((item) => (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                              `flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                                isActive
                                  ? "bg-blue-600 text-white font-semibold shadow-2xs"
                                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
                              }`
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <span className="truncate">{item.label}</span>
                                {item.badge && (
                                  <span
                                    className={`ml-2 px-1.5 py-0.2 text-[10px] font-bold rounded border ${
                                      isActive
                                        ? "bg-white/20 text-white border-white/30"
                                        : BADGE_TONE_CLASSES[item.badgeTone || "blue"]
                                    }`}
                                  >
                                    {item.badge}
                                  </span>
                                )}
                              </>
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

        {filteredNavigation.length === 0 && (
          <div className="py-8 px-4 text-center">
            <p className="text-xs text-slate-500">No menu screens match "{menuFilter}"</p>
            <button
              type="button"
              onClick={() => setMenuFilter("")}
              className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
            >
              Clear filter
            </button>
          </div>
        )}
      </div>

      {/* 3. Sidebar Governance & PDPA Compliance Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5 truncate">
          <span className={`w-2 h-2 rounded-full shrink-0 ${hasPiiUnmaskScope ? "bg-amber-500" : "bg-emerald-500"}`} />
          <span className="truncate font-medium text-slate-700">
            {hasPiiUnmaskScope ? "PII Unmask Active" : "PDPA Masked"}
          </span>
        </div>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-1.5 py-0.5 rounded hover:bg-slate-200/60 transition-colors"
            title="Collapse Sidebar"
          >
            ⇤ Hide
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
