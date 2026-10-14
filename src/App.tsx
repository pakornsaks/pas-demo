import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import AccessControlPage from "./features/admin/pages/AccessControlPage";
import DocumentTemplateRegistryPage from "./features/admin/pages/DocumentTemplateRegistryPage";
import IntegrationHubPage from "./features/admin/pages/IntegrationHubPage";
import { OperationalSettingsPage } from "./features/admin/pages/OperationalSettingsPage";
import TransitionRulesConfiguratorPage from "./features/admin/pages/TransitionRulesConfiguratorPage";
import WorkflowVisualizerPage from "./features/admin/pages/WorkflowVisualizerPage";
import { RequireBrokerContextGuard } from "./features/auth/components/RequireBrokerContextGuard";
import { PasAuthProvider, usePasAuth } from "./features/auth/context/PasAuthContext";
import BrokerSelectionPage from "./features/auth/pages/BrokerSelectionPage";
import AgentSalesForceDirectoryPage from "./features/crm/pages/AgentDirectoryPage";
import BrokerDirectoryPage from "./features/crm/pages/BrokerDirectoryPage";
import CommisionTierPage from "./features/crm/pages/CommisionTierPage";
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
import { AdminLayout } from "./layouts/AdminLayout";
import type { SelectBrokerResponse, SystemRole } from "./types/brokerContext";

/**
 * Resolves the default landing route based on the user's primary RBAC role
 * aligned with your existing route paths in App.tsx.
 */
const resolveDefaultDashboard = (roles: SystemRole[]): string => {
  if (roles.includes("Underwriter")) return "/dashboards/underwriter";
  if (roles.includes("Finance Officer")) return "/finance/ledger";
  if (roles.includes("Approver (Manager)")) return "/governance/approvals";
  return "/dashboards/telesales";
};

/**
 * Connects BrokerSelectionPage to React Router and PasAuthContext.
 * If a user already selected a broker, redirects them straight into the app.
 */
function BrokerSelectionRoute() {
  const { preSessionToken, hasBoundBrokerContext, activeContext, bindBrokerSession, logout } = usePasAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Destination requested before being intercepted by RequireBrokerContextGuard
  const intendedDestination = (location.state as { from?: { pathname?: string } })?.from?.pathname;

  if (hasBoundBrokerContext && activeContext) {
    const targetPath =
      intendedDestination && intendedDestination !== "/select-broker"
        ? intendedDestination
        : resolveDefaultDashboard(activeContext.roles);
    return <Navigate to={targetPath} replace />;
  }

  const handleContextSelected = (session: SelectBrokerResponse) => {
    bindBrokerSession(session);
    const targetPath =
      intendedDestination && intendedDestination !== "/select-broker"
        ? intendedDestination
        : resolveDefaultDashboard(session.active_context.roles);
    navigate(targetPath, { replace: true });
  };

  return (
    <BrokerSelectionPage
      preSessionToken={preSessionToken || "dev-pre-session-token"}
      onContextSelected={handleContextSelected}
      onLogout={() => {
        logout();
        navigate("/select-broker", { replace: true });
      }}
    />
  );
}

export default function App() {
  return (
    <PasAuthProvider>
      <BrowserRouter>
        <Routes>
          {/* =====================================================================
              Pre-Application Gate: Broker Selection Portal (Outside AdminLayout)
          ===================================================================== */}
          <Route path="/select-broker" element={<BrokerSelectionRoute />} />

          {/* =====================================================================
              Protected Application Routes (Requires Bound Broker Context)
          ===================================================================== */}
          <Route element={<RequireBrokerContextGuard />}>
            <Route path="/" element={<AdminLayout />}>
              <Route index element={<Navigate to="/dashboards/telesales" replace />} />

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

              {/* Sales Hierarchy */}
              <Route path="/sales/brokers" element={<BrokerDirectoryPage />} />
              <Route path="/sales/agents" element={<AgentSalesForceDirectoryPage />} />
              <Route path="/sales/channels" element={<PartnerChannelHierarchyPage />} />
              <Route path="/sales/comission-tier" element={<CommisionTierPage />} />

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
              <Route path="/master-data/insurers" element={<InsurerCarrierDirectoryPage />} />
              <Route path="/master-data/broker-settings" element={<BrokerSettingsPage />} />
              <Route path="/master-data/vehicles" element={<VehicleHierarchyPage />} />
              <Route path="/master-data/geography" element={<GeographyPage />} />
              <Route path="/master-data/occupations" element={<OccupancyUWClassesPage />} />
              <Route path="/master-data/network-providers" element={<NetworkProvidersDirectoryPage />} />

              {/* Fallback inside authenticated layout */}
              <Route path="*" element={<Navigate to="/dashboards/telesales" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </PasAuthProvider>
  );
}
