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
import PlanTierConfigurationPage from './features/products/pages/PlanTierConfigurationPage';

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

           {/* Dashboards */}
          <Route path="/dashboards/telesales" element={<TelesalesCockpitPage />} />
          <Route path="/dashboards/underwriter" element={<UnderwriterWorkbenchPage />} />
          <Route path="/dashboards/collections" element={<CollectionInstallmentsPage />} />

          {/* Policy Lifecycle */}
          <Route path="/policies/search" element={<ApplicationSearchPage />} />
          <Route path="/policies/directory1" element={<PolicyDirectoryPage />} />
          <Route path="/policies/endorsements" element={<PolicyEndorsementPage />} />
          <Route path="/policies/renewals" element={<RenewalsManagementPage />} />
          <Route path="/policies/cancellations" element={<CancellationsRefundsPage />} />
          <Route path="/policies/bulk-ingestion" element={<BulkIngestionPage />} />

          {/* Product Factory & Rules */}
          <Route path="/products/catalog" element={<ProductPlanConfigPage />} />
          <Route path="/products/plans" element={<PlanTierConfigurationPage />} />
          <Route path="/products/benefits" element={<PlaceholderView title="products benefits" />} />
          <Route path="/products/schemas" element={<PlaceholderView title="products schemas" />} />
          <Route path="/products/rules" element={<PlaceholderView title="products rules" />} />
          <Route path="/products/promos" element={<PlaceholderView title="products promos" />} />
          <Route path="/products/versioning" element={<PlaceholderView title="products versioning" />} />

          {/* =====================================================================
              Finance & Distribution
          ===================================================================== */}
          {/* Financial Ledger */}
          <Route path="/finance/ledger" element={<PlaceholderView title="finance ledger" />} />
          <Route path="/finance/bordereau" element={<PlaceholderView title="finance bordereau" />} />
          <Route path="/finance/commission-receivables" element={<PlaceholderView title="finance commission receivables" />} />
          <Route path="/finance/wallets" element={<PlaceholderView title="finance wallets" />} />
          <Route path="/finance/reconciliation" element={<PlaceholderView title="finance reconciliation" />} />
          <Route path="/finance/tax-documents" element={<PlaceholderView title="finance tax documents" />} />
          <Route path="/finance/period-close" element={<PlaceholderView title="finance period close" />} />

          {/* CRM & Sales Hierarchy */}
          <Route path="/crm/customers" element={<PlaceholderView title="crm customers" />} />
          <Route path="/crm/pdpa" element={<PlaceholderView title="crm pdpa" />} />
          <Route path="/crm/agents" element={<PlaceholderView title="crm agents" />} />
          <Route path="/crm/channels" element={<PlaceholderView title="crm channels" />} />

          {/* =====================================================================
              Compliance & Governance
          ===================================================================== */}
          {/* Governance & Approvals */}
          <Route path="/governance/approvals" element={<PlaceholderView title="governance approvals" />} />
          <Route path="/governance/diff-viewer" element={<PlaceholderView title="governance diff viewer" />} />
          <Route path="/governance/audit-trail" element={<PlaceholderView title="governance audit trail" />} />

          {/* Reports & Compliance */}
          <Route path="/reports/oic" element={<PlaceholderView title="reports oic" />} />
          <Route path="/reports/tax" element={<PlaceholderView title="reports tax" />} />
          <Route path="/reports/accounting" element={<PlaceholderView title="reports accounting" />} />
          <Route path="/reports/analytics" element={<PlaceholderView title="reports analytics" />} />

          {/* =====================================================================
              Platform & Foundation
          ===================================================================== */}
          {/* Workflow & Administration */}
          <Route path="/admin/workflows" element={<PlaceholderView title="admin workflows" />} />
          <Route path="/admin/transition-rules" element={<PlaceholderView title="admin transition rules" />} />
          <Route path="/admin/rbac" element={<PlaceholderView title="admin rbac" />} />
          <Route path="/admin/settings" element={<PlaceholderView title="admin settings" />} />
          <Route path="/admin/integrations" element={<PlaceholderView title="admin integrations" />} />
          <Route path="/admin/templates" element={<PlaceholderView title="admin templates" />} />
          <Route path="/master-data/vehicles" element={<VehicleHierarchyPage />} />
          <Route path="/master-data/geography" element={<GeographyPage />} />
          <Route path="/master-data/occupations" element={<OccupancyUWClassesPage />} />
          <Route path="/master-data/network-providers" element={<NetworkProvidersDirectoryPage />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}