import './App.css'

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './layouts/AdminLayout';
import ProductPlanConfigPage from './features/products/pages/ProductConfigPage';
import VehicleHierarchyPage from './features/master/pages/VehicleHierarchyPage';
import GeographyPage from './features/master/pages/GeographyPage';
import OccupancyUWClassesPage from './features/master/pages/OccupancyUWClassesPage';
import NetworkProvidersDirectoryPage from './features/master/pages/NetworkProvidersDirectoryPage';
import ApplicationSearchPage from './features/policy/pages/ApplicationSearchPage';
import PolicyEndorsementPage from './features/policy/pages/PolicyEndorsementPage';
import TelesalesCockpitPage from './features/dashboards/pages/TelesalesCockpitPage';
import UnderwriterWorkbenchPage from './features/dashboards/pages/UnderwriterWorkbenchPage';
import CollectionInstallmentsPage from './features/dashboards/pages/CollectionInstallmentsPage';
import PolicyDirectoryPage from './features/policy/pages/PolicyDirectoryPage';
import RenewalsManagementPage from './features/policy/pages/RenewalsManagementPage';
import CancellationsRefundsPage from './features/policy/pages/CancellationsRefundsPage';
import BulkIngestionPage from './features/policy/pages/BulkIngestionPage';

function PlaceholderView({ title }: { title: string }) {
  return (
    <div className="p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm">
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="text-sm text-zinc-500 mt-1">This route is rendered via react-router-dom.</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/products/plans" element={<ProductPlanConfigPage />} />
          
          <Route path="/dashboards/telesales" element={<TelesalesCockpitPage />} />
          <Route path="/dashboards/underwriter" element={<UnderwriterWorkbenchPage />} />
          <Route path="/dashboards/collections" element={<CollectionInstallmentsPage />} />

          <Route path="/policies/search" element={<ApplicationSearchPage />} />
          <Route path="/policies/directory1" element={<PolicyDirectoryPage />} />
          <Route path="/policies/endorsements" element={<PolicyEndorsementPage />} />
          <Route path="/policies/renewals" element={<RenewalsManagementPage />} />
          <Route path="/policies/cancellations" element={<CancellationsRefundsPage />} />
          <Route path="/policies/bulk-ingestion" element={<BulkIngestionPage />} />

          <Route path="/master-data/vehicles" element={<VehicleHierarchyPage />} />
          <Route path="/master-data/geography" element={<GeographyPage />} />
          <Route path="/master-data/occupations" element={<OccupancyUWClassesPage />} />
          <Route path="/master-data/network-providers" element={<NetworkProvidersDirectoryPage />} />

          <Route path="dashboard" element={<PlaceholderView title="Dashboard" />} />
          <Route path="analytics" element={<PlaceholderView title="Analytics" />} />
          <Route path="users" element={<PlaceholderView title="All Users" />} />
          <Route path="users/roles" element={<PlaceholderView title="Roles & Permissions" />} />
          <Route path="users/audit" element={<PlaceholderView title="Audit Trail" />} />
          <Route path="orders" element={<PlaceholderView title="Orders" />} />
          <Route path="transactions" element={<PlaceholderView title="Transactions" />} />
          <Route path="security" element={<PlaceholderView title="Security" />} />
          <Route path="settings" element={<PlaceholderView title="Settings" />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}