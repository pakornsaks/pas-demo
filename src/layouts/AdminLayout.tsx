import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import AppHeader from "../components/layout/AppHeader";
import Sidebar from "../components/layout/Sidebar";

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
