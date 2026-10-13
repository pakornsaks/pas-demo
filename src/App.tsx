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
import BenefitsBuilderPage from './features/products/pages/BenefitsBuilderPage';
import PricingUWRulesCanvasPage from './features/products/pages/PricingUWRulesCanvasPage';
import OICRegulatoryReportsPage from './features/reports/pages/OICRegulatoryReportsPage';
import TaxRemittanceReportsPage from './features/reports/pages/TaxRemittanceReportsPage';
import AnalyticsPerformancePage from './features/reports/pages/AnalyticsPerformancePage';
import OperationalAccountingPage from './features/reports/pages/OperationalAccountingPage';
import VersioningPublishingPage from './features/products/pages/VersioningPublishingPage';
import PromoCodesPage from './features/products/pages/PromoCodesPage';
import TransactionsGeneralLedgerPage from './features/finance/pages/TransactionsGeneralLedgerPage';
import InsurerSettlementsPage from './features/finance/pages/InsurerSettlementsPage';
import CommissionReceivablesPage from './features/finance/pages/CommissionReceivablesPage';
import AgentWalletsPayoutsPage from './features/finance/pages/AgentWalletsPayoutsPage';
import SuspenseReconciliationPage from './features/finance/pages/SuspenseReconciliationPage';
import TaxDocumentCenterPage from './features/finance/pages/TaxDocumentCenterPage';
import LedgerPeriodManagementPage from './features/finance/pages/LedgerPeriodManagementPage';
import CustomerDirectoryPage from './features/crm/pages/CustomerDirectoryPage';
import DataPrivacyCenterPage from './features/crm/pages/DataPrivacyCenterPage';
import AgentSalesForceDirectoryPage from './features/crm/pages/AgentSalesForceDirectoryPage';
import PartnerChannelHierarchyPage from './features/crm/pages/PartnerChannelHierarchyPage';
import ApprovalsPage from './features/governance/pages/ApprovalsPage';
import DiffViewerPage from './features/governance/pages/DiffViewerPage';
import AuditTrailPage from './features/governance/pages/AuditTrailPage';
import WorkflowVisualizerCanvasPage from './features/admin/pages/WorkflowVisualizerCanvasPage';
import TransitionRulesConfiguratorPage from './features/admin/pages/TransitionRulesConfiguratorPage';
import AccessControlRbacPage from './features/admin/pages/AccessControlRbacPage';
import IntegrationHubPage from './features/admin/pages/IntegrationHubPage';
import DocumentTemplateRegistryPage from './features/admin/pages/DocumentTemplateRegistryPage';
import OperationalSettingsSLAsPage from './features/admin/pages/OperationalSettingsSLAsPage';

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
          {/* =====================================================================
              Operations & Execution
          ===================================================================== */}
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
          <Route path="/products/benefits" element={<BenefitsBuilderPage />} />
          <Route path="/products/schemas" element={<PricingUWRulesCanvasPage />} />
          <Route path="/products/rules" element={<PricingUWRulesCanvasPage />} />
          <Route path="/products/promos" element={<PromoCodesPage />} />
          <Route path="/products/versioning" element={<VersioningPublishingPage />} />

          {/* =====================================================================
              Finance & Distribution
          ===================================================================== */}
          {/* Financial Ledger */}
          <Route path="/finance/ledger" element={<TransactionsGeneralLedgerPage />} />
          <Route path="/finance/bordereau" element={<InsurerSettlementsPage />} />
          <Route path="/finance/commission-receivables" element={<CommissionReceivablesPage />} />
          <Route path="/finance/wallets" element={<AgentWalletsPayoutsPage />} />
          <Route path="/finance/reconciliation" element={<SuspenseReconciliationPage />} />
          <Route path="/finance/tax-documents" element={<TaxDocumentCenterPage />} />
          <Route path="/finance/period-close" element={<LedgerPeriodManagementPage />} />

          {/* CRM & Sales Hierarchy */}
          <Route path="/crm/customers" element={<CustomerDirectoryPage />} />
          <Route path="/crm/pdpa" element={<DataPrivacyCenterPage />} />
          <Route path="/crm/agents" element={<AgentSalesForceDirectoryPage />} />
          <Route path="/crm/channels" element={<PartnerChannelHierarchyPage />} />

          {/* =====================================================================
              Compliance & Governance
          ===================================================================== */}
          {/* Governance & Approvals */}
          <Route path="/governance/approvals" element={<ApprovalsPage />} />
          <Route path="/governance/diff-viewer" element={<DiffViewerPage />} />
          <Route path="/governance/audit-trail" element={<AuditTrailPage />} />

          {/* Reports & Compliance */}
          <Route path="/reports/oic" element={<OICRegulatoryReportsPage />} />
          <Route path="/reports/tax" element={<TaxRemittanceReportsPage />} />
          <Route path="/reports/accounting" element={<OperationalAccountingPage />} />
          <Route path="/reports/analytics" element={<AnalyticsPerformancePage />} />

          {/* =====================================================================
              Platform & Foundation
          ===================================================================== */}
          {/* Workflow & Administration */}
          <Route path="/admin/workflows" element={<WorkflowVisualizerCanvasPage />} />
          <Route path="/admin/transition-rules" element={<TransitionRulesConfiguratorPage />} />
          <Route path="/admin/rbac" element={<AccessControlRbacPage />} />
          <Route path="/admin/settings" element={<OperationalSettingsSLAsPage />} />
          <Route path="/admin/integrations" element={<IntegrationHubPage />} />
          <Route path="/admin/templates" element={<DocumentTemplateRegistryPage />} />

          {/* Master Data Management */}
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