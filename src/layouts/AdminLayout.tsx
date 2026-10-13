import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { BACKOFFICE_NAVIGATION } from '../config/navigation';

export const AdminLayout = () => {
  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 antialiased overflow-hidden">
      <Sidebar sections={BACKOFFICE_NAVIGATION} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 flex items-center justify-between shrink-0">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Backoffice Management
          </span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};