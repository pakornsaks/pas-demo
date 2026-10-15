import { useMemo } from "react";
import { SIDEBAR_NAVIGATION } from "./Sidebar";

export const Breadcrumb: React.FC = () => {
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
