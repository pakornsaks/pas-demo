import { ChevronRight } from "lucide-react";
import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import type { NavItem, NavSection, SubNavItem } from "../../types/navigation";

interface SidebarProps {
  sections: NavSection[];
}

export const Sidebar: React.FC<SidebarProps> = ({ sections }) => {
  const location = useLocation();

  // Initialize open state: expand accordion if the current route matches a child
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    sections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children) {
          const isChildActive = item.children.some((child) => location.pathname.startsWith(child.href));
          initialState[item.id] = isChildActive;
        }
      });
    });
    return initialState;
  });

  const toggleSubmenu = (id: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderBadge = (badge?: string | number) => {
    if (!badge) return null;
    return (
      <span className="ml-auto inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
        {badge}
      </span>
    );
  };

  const renderSingleLink = (item: NavItem) => {
    const Icon = item.icon;
    return (
      <li key={item.id}>
        <NavLink
          to={item.href || "#"}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            }`
          }
        >
          <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{item.title}</span>
          {renderBadge(item.badge)}
        </NavLink>
      </li>
    );
  };

  const renderSubmenuItem = (child: SubNavItem) => (
    <li key={child.id}>
      <NavLink
        to={child.href}
        className={({ isActive }) =>
          `flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            isActive
              ? "text-zinc-950 font-semibold dark:text-white bg-zinc-100/70 dark:bg-zinc-800/60"
              : "text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
          }`
        }
      >
        <span className="truncate">{child.title}</span>
        {renderBadge(child.badge)}
      </NavLink>
    </li>
  );

  const renderCollapsibleMenu = (item: NavItem) => {
    const Icon = item.icon;
    const isOpen = Boolean(openSubmenus[item.id]);
    const submenuId = `submenu-${item.id}`;

    return (
      <li key={item.id} className="space-y-1">
        <button
          type="button"
          onClick={() => toggleSubmenu(item.id)}
          aria-expanded={isOpen}
          aria-controls={submenuId}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors"
        >
          <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="flex-1 text-left truncate">{item.title}</span>
          {renderBadge(item.badge)}
          <ChevronRight
            className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
            aria-hidden="true"
          />
        </button>

        {isOpen && (
          <ul id={submenuId} className="pl-4 ml-4 border-l border-zinc-200 dark:border-zinc-800 space-y-1">
            {item.children?.map(renderSubmenuItem)}
          </ul>
        )}
      </li>
    );
  };

  return (
    <aside
      className="w-72 h-screen border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col shrink-0"
      aria-label="Backoffice Sidebar"
    >
      {/* Brand Header */}
      <div className="h-14 flex items-center px-5 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-950 font-bold text-xs">
            ▲
          </div>
          <span className="font-semibold text-sm tracking-tight text-zinc-950 dark:text-white">PAS Demo</span>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {section.sectionTitle && (
              <h2 className="px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
                {section.sectionTitle}
              </h2>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => (item.children ? renderCollapsibleMenu(item) : renderSingleLink(item)))}
            </ul>
          </div>
        ))}
      </nav>

      {/* User / Session Profile */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-medium text-zinc-700 dark:text-zinc-300">
          AD
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">Admin User</p>
          <p className="text-[11px] text-zinc-500 truncate">admin@company.com</p>
        </div>
      </div>
    </aside>
  );
};
