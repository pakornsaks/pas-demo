import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { SIDEBAR_NAVIGATION } from "../components/layout/Sidebar";
import { usePasAuth } from "../features/auth/context/PasAuthContext";

export function AdminLayout() {
  const { activeContext, clearBrokerContextForSwitch, logout } = usePasAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Resolve active breadcrumb
  const activeRouteMeta = useMemo(() => {
    for (const pillar of SIDEBAR_NAVIGATION) {
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

  const handleSwitchBroker = () => {
    clearBrokerContextForSwitch();
    navigate("/select-broker", { replace: true });
  };

  const handleSignOut = () => {
    logout();
    navigate("/select-broker", { replace: true });
  };

  const toggleSubGroup = (groupTitle: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupTitle]: !prev[groupTitle],
    }));
  };

  const hasPiiUnmaskScope = activeContext?.scopes?.includes("pii:unmask") ?? false;

  return (
    <div className="h-screen w-full overflow-hidden bg-slate-100 text-slate-800 flex flex-col">
      {/* =====================================================================
          TOP COMMAND BAR (Fixed 56px Height, Never Scrolls Off)
      ===================================================================== */}
      <header className="h-14 shrink-0 bg-slate-900 text-white border-b border-slate-800 px-4 flex items-center justify-between z-30">
        {/* Left: Sidebar Toggle & Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Toggle Navigation Sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 font-bold text-xs flex items-center justify-center shadow-inner shrink-0">
              PAS
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-xs font-bold tracking-tight">Unified Broker Platform</div>
              <div className="text-[10px] text-slate-400">Policy Administration System</div>
            </div>
          </div>
        </div>

        {/* Right: PDPA Status & Active Broker Switcher */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border ${
              hasPiiUnmaskScope
                ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${hasPiiUnmaskScope ? "bg-amber-400" : "bg-emerald-400"}`} />
            {hasPiiUnmaskScope ? "PII Unmask Authorized" : "PDPA Masked Mode"}
          </div>

          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                activeContext?.is_global_view ? "bg-indigo-400" : "bg-emerald-400"
              }`}
            />
            <div className="text-left hidden sm:block">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold leading-none">
                {activeContext?.is_global_view ? "Global Scope" : "Active Broker"}
              </div>
              <div className="text-xs font-bold text-white leading-tight max-w-[170px] truncate">
                {activeContext?.broker_code ?? "UNBOUND"} • {activeContext?.broker_name_en ?? "Select Broker"}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSwitchBroker}
              className="text-[11px] font-semibold bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded transition-colors shrink-0"
            >
              Switch Broker
            </button>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="text-xs font-medium text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-500/40 px-2.5 py-1 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* =====================================================================
          BODY CONTAINER (Locked Flex-1 with min-h-0 so both panes scroll independently)
      ===================================================================== */}
      <div className="flex-1 min-h-0 min-w-0 flex overflow-hidden">
        {/* Left Sidebar (Independent vertical scroll) */}
        {!isSidebarCollapsed && (
          <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 select-none h-full overflow-y-auto">
            {/* Navigation Tree */}
            <div className="px-2.5 p-6 space-y-4">
              {SIDEBAR_NAVIGATION.map((pillar) => (
                <div key={pillar.pillarId}>
                  <div className="px-2 mb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    {pillar.pillarTitle}
                  </div>

                  <div className="space-y-1">
                    {pillar.subGroups.map((group) => {
                      const isCollapsed = Boolean(collapsedGroups[group.groupTitle]);
                      return (
                        <div key={group.groupTitle} className="space-y-0.5">
                          <button
                            type="button"
                            onClick={() => toggleSubGroup(group.groupTitle)}
                            className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors"
                          >
                            <span className="truncate">{group.groupTitle}</span>
                            <span className="text-[10px] text-slate-400">{isCollapsed ? "+" : "−"}</span>
                          </button>

                          {!isCollapsed && (
                            <nav className="pl-2 space-y-0.5 border-l border-slate-200 ml-2">
                              {group.items.map((item) => (
                                <NavLink
                                  key={item.to}
                                  to={item.to}
                                  className={({ isActive }) =>
                                    `flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors ${
                                      isActive
                                        ? "bg-blue-50 text-blue-700 font-semibold border border-blue-200/60"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
                                    }`
                                  }
                                >
                                  <span className="truncate">{item.label}</span>
                                  {item.badge && (
                                    <span className="ml-1.5 px-1.5 py-0.2 text-[10px] font-bold bg-blue-100 text-blue-800 rounded shrink-0">
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

        {/* Right Main Content Column (Sub-header + Scrollable Outlet) */}
        <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
          {/* Breadcrumb Sub-Header (Fixed, shrink-0) */}
          <div className="shrink-0 bg-white border-b border-slate-200 px-5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <span>{activeRouteMeta.pillarTitle}</span>
              <span>/</span>
              <span>{activeRouteMeta.groupTitle}</span>
              <span>/</span>
              <span className="font-bold text-slate-900">{activeRouteMeta.pageLabel}</span>
            </div>
          </div>

          {/* Scrollable Page Outlet (min-h-0 + overflow-y-auto guarantees full scrolling) */}
          <main className="flex-1 min-h-0 min-w-0 overflow-y-auto p-4 lg:p-5">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
