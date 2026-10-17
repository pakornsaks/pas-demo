import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AccessControlPage from "./features/admin/pages/AccessControlPage";
import DocumentTemplateRegistryPage from "./features/admin/pages/DocumentTemplateRegistryPage";
import IntegrationHubPage from "./features/admin/pages/IntegrationHubPage";
import { OperationalSettingsPage } from "./features/admin/pages/OperationalSettingsPage";
import ProductInsurerTermsPage from "./features/admin/pages/ProductInsurerTermsPage";
import TransitionRulesConfiguratorPage from "./features/admin/pages/TransitionRulesConfiguratorPage";
import WorkflowVisualizerPage from "./features/admin/pages/WorkflowVisualizerPage";
import { PasAuthProvider } from "./features/auth/context/PasAuthContext";
import BrokerSelectionPage from "./features/auth/pages/BrokerSelectionPage";
import AgentSalesForceDirectoryPage from "./features/crm/pages/AgentDirectoryPage";
import CustomerDirectoryPage from "./features/crm/pages/CustomerDirectoryPage";
import PartnerChannelHierarchyPage from "./features/crm/pages/PartnerChannelHierarchyPage";
import CollectionInstallmentsPage from "./features/dashboards/pages/CollectionInstallmentsPage";
import HomePage from "./features/dashboards/pages/HomePage";
import TelesalesCockpitPage from "./features/dashboards/pages/TelesalesCockpitPage";
import UnderwriterWorkbenchPage from "./features/dashboards/pages/UnderwriterWorkbenchPage";
import AgentWalletsPayoutsPage from "./features/finance/pages/AgentWalletsPayoutsPage";
import CommissionReceivablesPage from "./features/finance/pages/CommissionReceivablesPage";
import InsurerSettlementsPage from "./features/finance/pages/InsurerSettlementsPage";
import LedgerPeriodManagementPage from "./features/finance/pages/LedgerPeriodManagementPage";
import SuspenseReconciliationPage from "./features/finance/pages/SuspenseReconciliationPage";
import TaxDocumentCenterPage from "./features/finance/pages/TaxDocumentCenterPage";
import TransactionsLedgerPage from "./features/finance/pages/TransactionsLedgerPage";
import ApprovalInboxPage from "./features/governance/pages/ApprovalInboxPage";
import AuditTrailPage from "./features/governance/pages/AuditTrailPage";
import DiffViewerPage from "./features/governance/pages/DiffViewerPage";
import BrokerSettingsPage from "./features/master/pages/BrokerSettingsPage";
import GeographyPage from "./features/master/pages/GeographyPage";
import InsurerCarrierDirectoryPage from "./features/master/pages/InsurerDirectoryPage";
import NetworkProvidersDirectoryPage from "./features/master/pages/NetworkProvidersDirectoryPage";
import OccupancyUWClassesPage from "./features/master/pages/OccupancyUWClassesPage";
import VehicleHierarchyPage from "./features/master/pages/VehicleHierarchyPage";
import ApplicationSearchPage from "./features/policy/pages/ApplicationSearchPage";
import CancellationsRefundsPage from "./features/policy/pages/CancellationsRefundsPage";
import PolicyDirectoryPage from "./features/policy/pages/PolicyDirectoryPage";
import PolicyEndorsementPage from "./features/policy/pages/PolicyEndorsementPage";
import QuotationSearchPage from "./features/policy/pages/QuotationSearchPage";
import RenewalsManagementPage from "./features/policy/pages/RenewalsManagementPage";
import CampaignPromoCodesPage from "./features/products/pages/CampaignPromoCodesPage";
import DynamicSchemaBuilderPage from "./features/products/pages/DynamicSchemaBuilder";
import PlanTierConfigurationPage from "./features/products/pages/PlanConfigurationPage";
import PricingUWRulesPage from "./features/products/pages/PricingUWRulesPage";
import ProductPlanConfigPage from "./features/products/pages/ProductCategoryPage";
import VersioningPublishingPage from "./features/products/pages/VersioningPublishingPage";
import AnalyticsPerformancePage from "./features/reports/pages/AnalyticsPerformancePage";
import OICRegulatoryReportsPage from "./features/reports/pages/OICRegulatoryReportsPage";
import OperationalAccountingReportPage from "./features/reports/pages/OperationalAccountingReportPage";
import TaxRemittanceReportsPage from "./features/reports/pages/TaxRemittanceReportsPage";
import CommisionTierPage from "./features/sales/pages/AgentCommissionTierPage";
import BrokerDirectoryPage from "./features/sales/pages/BrokerDirectoryPage";
import DataPrivacyCenterPage from "./features/sales/pages/DataPrivacyCenterPage";
import { AdminLayout } from "./layouts/AdminLayout";

export default function App() {
  return (
    <PasAuthProvider>
      <BrowserRouter>
        <Routes>
          {/* =====================================================================
              Pre-Application Gate: Broker Selection Portal (Outside AdminLayout)
          ===================================================================== */}
          <Route path="/select-broker" element={<BrokerSelectionPage />} />

          {/* =====================================================================
              Protected Application Routes (Requires Bound Broker Context)
          ===================================================================== */}
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<HomePage />} />

            {/* =================================================================
                  Operations & Execution
              ================================================================= */}
            {/* Dashboards */}
            <Route path="/dashboards/telesales" element={<TelesalesCockpitPage />} />
            <Route path="/dashboards/underwriter" element={<UnderwriterWorkbenchPage />} />
            <Route path="/dashboards/collections" element={<CollectionInstallmentsPage />} />

            {/* Policy Lifecycle */}
            <Route path="/policies/quotations" element={<QuotationSearchPage />} />
            <Route path="/policies/applications" element={<ApplicationSearchPage />} />
            <Route path="/policies/directory" element={<PolicyDirectoryPage />} />
            <Route path="/policies/endorsements" element={<PolicyEndorsementPage />} />
            <Route path="/policies/renewals" element={<RenewalsManagementPage />} />
            <Route path="/policies/cancellations" element={<CancellationsRefundsPage />} />

            {/* Product Factory & Rules */}
            <Route path="/products/catalog" element={<ProductPlanConfigPage />} />
            <Route path="/products/plans" element={<PlanTierConfigurationPage />} />
            <Route path="/products/rules" element={<PricingUWRulesPage />} />
            <Route path="/products/schemas" element={<DynamicSchemaBuilderPage />} />
            <Route path="/products/promos" element={<CampaignPromoCodesPage />} />
            <Route path="/products/versioning" element={<VersioningPublishingPage />} />

            {/* =================================================================
                  Finance & Accounting
              ================================================================= */}
            {/* Financial Ledger */}
            <Route path="/finance/transactions" element={<TransactionsLedgerPage />} />
            <Route path="/finance/insurer-settlements" element={<InsurerSettlementsPage />} />
            <Route path="/finance/commission-receivables" element={<CommissionReceivablesPage />} />
            <Route path="/finance/agent-commission" element={<AgentWalletsPayoutsPage />} />
            <Route path="/finance/reconciliation" element={<SuspenseReconciliationPage />} />
            <Route path="/finance/tax-documents" element={<TaxDocumentCenterPage />} />
            <Route path="/finance/period-close" element={<LedgerPeriodManagementPage />} />

            {/* CRM & Sales Hierarchy */}
            <Route path="/crm/customers" element={<CustomerDirectoryPage />} />
            <Route path="/crm/pdpa" element={<DataPrivacyCenterPage />} />

            {/* Sales Hierarchy */}
            <Route path="/sales/brokers" element={<BrokerDirectoryPage />} />
            <Route path="/sales/agents" element={<AgentSalesForceDirectoryPage />} />
            <Route path="/sales/channels" element={<PartnerChannelHierarchyPage />} />
            <Route path="/sales/commission-tier" element={<CommisionTierPage />} />

            {/* =================================================================
                  Compliance & Governance
              ================================================================= */}
            {/* Governance & Approvals */}
            <Route path="/governance/approvals" element={<ApprovalInboxPage />} />
            <Route path="/governance/diff-viewer" element={<DiffViewerPage />} />
            <Route path="/governance/audit-trail" element={<AuditTrailPage />} />

            {/* Reports & Compliance */}
            <Route path="/reports/oic" element={<OICRegulatoryReportsPage />} />
            <Route path="/reports/tax" element={<TaxRemittanceReportsPage />} />
            <Route path="/reports/accounting" element={<OperationalAccountingReportPage />} />
            <Route path="/reports/analytics" element={<AnalyticsPerformancePage />} />

            {/* =================================================================
                  Platform & Foundation
              ================================================================= */}
            {/* Workflow & Administration */}
            <Route path="/admin/workflows" element={<WorkflowVisualizerPage />} />
            <Route path="/admin/transition-rules" element={<TransitionRulesConfiguratorPage />} />
            <Route path="/admin/rbac" element={<AccessControlPage />} />
            <Route path="/admin/settings" element={<OperationalSettingsPage />} />
            <Route path="/admin/integrations" element={<IntegrationHubPage />} />
            <Route path="/admin/templates" element={<DocumentTemplateRegistryPage />} />

            {/* Master Data Management */}
            <Route path="/master/insurers" element={<InsurerCarrierDirectoryPage />} />
            <Route path="/master/commission-terms" element={<ProductInsurerTermsPage />} />
            <Route path="/master/broker-settings" element={<BrokerSettingsPage />} />
            <Route path="/master/vehicles" element={<VehicleHierarchyPage />} />
            <Route path="/master/geography" element={<GeographyPage />} />
            <Route path="/master/occupations" element={<OccupancyUWClassesPage />} />
            <Route path="/master/network-providers" element={<NetworkProvidersDirectoryPage />} />

            {/* Fallback inside authenticated layout */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </PasAuthProvider>
  );
}
