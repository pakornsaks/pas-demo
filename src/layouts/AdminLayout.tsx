import { useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import AppHeader from "../components/layout/AppHeader";
import Sidebar, { SIDEBAR_NAVIGATION } from "../components/layout/Sidebar";

const Breadcrumb: React.FC = () => {
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

  return (
    <div className="shrink-0 bg-white border-b border-slate-200 px-5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
      <div className="flex items-center gap-2 text-slate-500">
        <span>{activeRouteMeta.pillarTitle}</span>
        <span>/</span>
        <span>{activeRouteMeta.groupTitle}</span>
        <span>/</span>
        <span className="font-bold text-slate-900">{activeRouteMeta.pageLabel}</span>
      </div>
    </div>
  );
};

export function AdminLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="h-screen w-full overflow-hidden bg-slate-100 text-slate-800 flex flex-col">
      {/* =====================================================================
          TOP COMMAND BAR (Fixed 48px Height, Never Scrolls Off)
      ===================================================================== */}
      <AppHeader onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)} />

      {/* =====================================================================
          BODY CONTAINER (Locked Flex-1 with min-h-0 so both panes scroll independently)
      ===================================================================== */}
      <div className="flex-1 min-h-0 min-w-0 flex overflow-hidden">
        {/* Left Sidebar (Independent vertical scroll) */}
        {!isSidebarCollapsed && <Sidebar />}

        {/* Right Main Content Column (Sub-header + Scrollable Outlet) */}
        <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
          {/* Breadcrumb Sub-Header (Fixed, shrink-0) */}
          <Breadcrumb />
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
