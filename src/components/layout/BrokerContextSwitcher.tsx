import React from "react";
import type { SelectBrokerResponse } from "../../types/brokerContext";

export const BrokerContextSwitcher: React.FC = () => {
  const rawContext = sessionStorage.getItem("pas_active_broker_context");
  const activeContext: SelectBrokerResponse["active_context"] | null = rawContext ? JSON.parse(rawContext) : null;

  if (!activeContext) return null;

  return (
    <div className="inline-flex items-center gap-3 bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${activeContext.is_global_view ? "bg-indigo-600" : "bg-emerald-500"}`} />
        <div className="text-left">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">
            Active Broker Scope
          </div>
          <div className="text-xs font-bold text-slate-800 leading-tight mt-0.5">
            {activeContext.broker_code} • {activeContext.broker_name_en}
          </div>
        </div>
      </div>
    </div>
  );
};
