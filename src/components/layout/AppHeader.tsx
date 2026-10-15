import React from "react";
import { useNavigate } from "react-router-dom";
import { usePasAuth } from "../../features/auth/context/PasAuthContext";

export interface AppHeaderProps {
  onToggleSidebar?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onToggleSidebar }) => {
  const { activeContext, clearBrokerContextForSwitch, logout } = usePasAuth();
  const navigate = useNavigate();

  const isGlobalView = Boolean(activeContext?.is_global_view);
  const brokerDisplayName = activeContext?.broker_name_en || activeContext?.broker_code || "Select Broker";

  const handleSwitchBroker = () => {
    clearBrokerContextForSwitch();
    navigate("/select-broker", { replace: true });
  };

  const handleSignOut = () => {
    logout();
    navigate("/select-broker", { replace: true });
  };

  return (
    <header
      className={`h-12 shrink-0 bg-slate-900 text-white border-b border-slate-800 px-4 flex items-center justify-between z-30`}
    >
      {/* Left: Sidebar Toggle & Brand */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          title="Toggle Navigation Sidebar"
          aria-label="Toggle Navigation Sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 font-bold text-xs flex items-center justify-center shadow-inner shrink-0 select-none">
            PAS
          </div>
          <div className="hidden sm:block leading-tight select-none">
            <div className="text-xs font-bold tracking-tight">Unified Broker Platform</div>
            <div className="text-[10px] text-slate-400">Policy Administration System</div>
          </div>
        </div>
      </div>

      {/* Right: PDPA Status, Broker Switcher & Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Active Context / Broker Switcher */}
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1">
          <span className={`w-2 h-2 rounded-full shrink-0 ${isGlobalView ? "bg-indigo-400" : "bg-emerald-400"}`} />
          <div className="text-left hidden sm:block">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold leading-none">
              {isGlobalView ? "Global Scope" : "Active Broker"}
            </div>
            <div
              className="text-xs font-bold text-white leading-tight max-w-[170px] truncate"
              title={brokerDisplayName}
            >
              {brokerDisplayName}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSwitchBroker}
            className="text-[11px] font-semibold bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-2.5 py-1 rounded transition-colors shrink-0"
          >
            Switch Broker
          </button>
        </div>

        {/* Sign Out Action */}
        <button
          type="button"
          onClick={handleSignOut}
          className="text-xs font-medium text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-500/40 px-2.5 py-1 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/40"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
};

export default AppHeader;
