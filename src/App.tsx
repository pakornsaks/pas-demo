import "./App.css";

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AccessControlRbacPage from "./features/admin/pages/AccessControlRbacPage";
import DocumentTemplateRegistryPage from "./features/admin/pages/DocumentTemplateRegistryPage";
import IntegrationHubPage from "./features/admin/pages/IntegrationHubPage";
import OperationalSettingsSLAsPage from "./features/admin/pages/OperationalSettingsSLAsPage";
import TransitionRulesConfiguratorPage from "./features/admin/pages/TransitionRulesConfiguratorPage";
import WorkflowVisualizerPage from "./features/admin/pages/WorkflowVisualizerPage";
import AgentSalesForceDirectoryPage from "./features/crm/pages/AgentDirectoryPage";
import BrokerDirectoryPage from "./features/crm/pages/BrokerDirectoryPage";
import CustomerDirectoryPage from "./features/crm/pages/CustomerDirectoryPage";
import DataPrivacyCenterPage from "./features/crm/pages/DataPrivacyCenterPage";
import PartnerChannelHierarchyPage from "./features/crm/pages/PartnerChannelHierarchyPage";
import CollectionInstallmentsPage from "./features/dashboards/pages/CollectionInstallmentsPage";
import TelesalesCockpitPage from "./features/dashboards/pages/TelesalesCockpitPage";
import UnderwriterWorkbenchPage from "./features/dashboards/pages/UnderwriterWorkbenchPage";
import AgentWalletsPayoutsPage from "./features/finance/pages/AgentWalletsPayoutsPage";
import CommissionReceivablesPage from "./features/finance/pages/CommissionReceivablesPage";
import InsurerSettlementsPage from "./features/finance/pages/InsurerSettlementsPage";
import LedgerPeriodManagementPage from "./features/finance/pages/LedgerPeriodManagementPage";
import SuspenseReconciliationPage from "./features/finance/pages/SuspenseReconciliationPage";
import TaxDocumentCenterPage from "./features/finance/pages/TaxDocumentCenterPage";
import TransactionsLedgerPage from "./features/finance/pages/TransactionsLedgerPage";
import ApprovalsPage from "./features/governance/pages/ApprovalsPage";
import AuditTrailPage from "./features/governance/pages/AuditTrailPage";
import DiffViewerPage from "./features/governance/pages/DiffViewerPage";
import BrokerSettingsPage from "./features/master/pages/BrokerSettingsPage";
import GeographyPage from "./features/master/pages/GeographyPage";
import IssuerPage from "./features/master/pages/IssuerPage";
import NetworkProvidersDirectoryPage from "./features/master/pages/NetworkProvidersDirectoryPage";
import OccupancyUWClassesPage from "./features/master/pages/OccupancyUWClassesPage";
import VehicleHierarchyPage from "./features/master/pages/VehicleHierarchyPage";
import ApplicationSearchPage from "./features/policy/pages/ApplicationSearchPage";
import BulkIngestionPage from "./features/policy/pages/BulkIngestionPage";
import CancellationsRefundsPage from "./features/policy/pages/CancellationsRefundsPage";
import PolicyDirectoryPage from "./features/policy/pages/PolicyDirectoryPage";
import PolicyEndorsementPage from "./features/policy/pages/PolicyEndorsementPage";
import RenewalsManagementPage from "./features/policy/pages/RenewalsManagementPage";
import BenefitsBuilderPage from "./features/products/pages/BenefitsBuilderPage";
import CampaignPromoCodesPage from "./features/products/pages/CampaignPromoCodesPage";
import DynamicSchemaBuilderPage from "./features/products/pages/DynamicSchemaBuilder";
import PlanTierConfigurationPage from "./features/products/pages/PlanTierConfigurationPage";
import PricingUWRulesCanvasPage from "./features/products/pages/PricingUWRulesCanvasPage";
import ProductPlanConfigPage from "./features/products/pages/ProductConfigPage";
import VersioningPublishingPage from "./features/products/pages/VersioningPublishingPage";
import AnalyticsPerformancePage from "./features/reports/pages/AnalyticsPerformancePage";
import OICRegulatoryReportsPage from "./features/reports/pages/OICRegulatoryReportsPage";
import OperationalAccountingReportPage from "./features/reports/pages/OperationalAccountingReportPage";
import TaxRemittanceReportsPage from "./features/reports/pages/TaxRemittanceReportsPage";
import { AdminLayout } from "./layouts/AdminLayout";

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
          <Route path="/products/schemas" element={<DynamicSchemaBuilderPage />} />
          <Route path="/products/rules" element={<PricingUWRulesCanvasPage />} />
          <Route path="/products/promos" element={<CampaignPromoCodesPage />} />
          <Route path="/products/versioning" element={<VersioningPublishingPage />} />

          {/* =====================================================================
              Finance & Distribution
          ===================================================================== */}
          {/* Financial Ledger */}
          <Route path="/finance/ledger" element={<TransactionsLedgerPage />} />
          <Route path="/finance/bordereau" element={<InsurerSettlementsPage />} />
          <Route path="/finance/commission-receivables" element={<CommissionReceivablesPage />} />
          <Route path="/finance/wallets" element={<AgentWalletsPayoutsPage />} />
          <Route path="/finance/reconciliation" element={<SuspenseReconciliationPage />} />
          <Route path="/finance/tax-documents" element={<TaxDocumentCenterPage />} />
          <Route path="/finance/period-close" element={<LedgerPeriodManagementPage />} />

          {/* CRM & Sales Hierarchy */}
          <Route path="/crm/customers" element={<CustomerDirectoryPage />} />
          <Route path="/crm/pdpa" element={<DataPrivacyCenterPage />} />
          <Route path="/crm/brokers" element={<BrokerDirectoryPage />} />
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
          <Route path="/reports/accounting" element={<OperationalAccountingReportPage />} />
          <Route path="/reports/analytics" element={<AnalyticsPerformancePage />} />

          {/* =====================================================================
              Platform & Foundation
          ===================================================================== */}
          {/* Workflow & Administration */}
          <Route path="/admin/workflows" element={<WorkflowVisualizerPage />} />
          <Route path="/admin/transition-rules" element={<TransitionRulesConfiguratorPage />} />
          <Route path="/admin/rbac" element={<AccessControlRbacPage />} />
          <Route path="/admin/settings" element={<OperationalSettingsSLAsPage />} />
          <Route path="/admin/integrations" element={<IntegrationHubPage />} />
          <Route path="/admin/templates" element={<DocumentTemplateRegistryPage />} />

          {/* Master Data Management */}
          <Route path="/master-data/insurers" element={<IssuerPage />} />
          <Route path="/master-data/broker-settings" element={<BrokerSettingsPage />} />
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
