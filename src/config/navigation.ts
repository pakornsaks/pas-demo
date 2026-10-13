import {
  CheckCheck,
  Cpu,
  Database,
  FileSpreadsheet,
  LayoutDashboard,
  Receipt,
  ShieldAlert,
  Users2,
  Workflow,
} from 'lucide-react';
import type { NavSection } from '../types/navigation';

export const BACKOFFICE_NAVIGATION: NavSection[] = [
  {
    sectionTitle: 'Operations & Execution',
    items: [
      {
        id: 'workspaces',
        title: 'Dashboards',
        icon: LayoutDashboard,
        children: [
          {
            id: 'telesales-cockpit',
            title: 'Telesales Cockpit',
            href: '/dashboards/telesales',
          },
          {
            id: 'underwriter-workbench',
            title: 'Underwriter Workbench',
            href: '/dashboards/underwriter',
            badge: 'SLA Active',
          },
          {
            id: 'collections-dashboard',
            title: 'Collection & Installments',
            href: '/dashboards/collections',
          },
        ],
      },
      {
        id: 'policy-lifecycle',
        title: 'Policy Lifecycle',
        icon: ShieldAlert,
        children: [
          {
            id: 'application-search',
            title: 'Application Search',
            href: '/policies/search',
          },
          {
            id: 'policy-directory',
            title: 'Policy Directory',
            href: '/policies/directory1',
          },
          {
            id: 'endorsements',
            title: 'Endorsements (MTA)',
            href: '/policies/endorsements',
          },
          {
            id: 'renewals-mgmt',
            title: 'Renewals Management',
            href: '/policies/renewals',
          },
          {
            id: 'cancellations-refunds',
            title: 'Cancellations & Refunds',
            href: '/policies/cancellations',
          },
          // {
          //   id: 'bulk-ingestion',
          //   title: 'Bulk Ingestion',
          //   href: '/policies/bulk-ingestion',
          // },
        ],
      },
      {
        id: 'product-factory',
        title: 'Product Factory & Rules',
        icon: Cpu,
        children: [
          {
            id: 'product-catalog',
            title: 'Product Catalog',
            href: '/products/catalog',
          },
          {
            id: 'plan-tier-config',
            title: 'Plan & Tier Configuration',
            href: '/products/plans',
          },
          {
            id: 'benefits-builder',
            title: 'Benefits Builder',
            href: '/products/benefits',
          },
          {
            id: 'rules-canvas',
            title: 'Pricing & UW Rules Canvas',
            href: '/products/rules',
          },
          {
            id: 'dynamic-schema-builder',
            title: 'Dynamic Schema Builder',
            href: '/products/schemas',
          },
          {
            id: 'campaigns-promos',
            title: 'Campaign & Promo Codes',
            href: '/products/promos',
          },
          {
            id: 'product-versioning',
            title: 'Versioning & Publishing',
            href: '/products/versioning',
          },
        ],
      },
    ],
  },
  {
    sectionTitle: 'Finance & Distribution',
    items: [
      {
        id: 'finance-settlements',
        title: 'Financial Ledger',
        icon: Receipt,
        children: [
          {
            id: 'general-ledger',
            title: 'Transactions & General Ledger',
            href: '/finance/ledger',
          },
          {
            id: 'bordereau-engine',
            title: 'Insurer Settlements (Bordereau)',
            href: '/finance/bordereau',
          },
          {
            id: 'commission-receivables',
            title: 'Commission Receivables',
            href: '/finance/commission-receivables',
          },
          {
            id: 'agent-wallets',
            title: 'Agent Wallets & Payouts',
            href: '/finance/wallets',
          },
          {
            id: 'suspense-reconciliation',
            title: 'Suspense & Reconciliation',
            href: '/finance/reconciliation',
          },
          {
            id: 'tax-document-center',
            title: 'Tax Document Center',
            href: '/finance/tax-documents',
          },
          {
            id: 'ledger-period-mgmt',
            title: 'Ledger Period Management',
            href: '/finance/period-close',
          },
        ],
      },
      {
        id: 'crm-hierarchy',
        title: 'CRM & Sales Hierarchy',
        icon: Users2,
        children: [
          {
            id: 'customer-360',
            title: 'Customer 360° Directory',
            href: '/crm/customers',
          },
          {
            id: 'pdpa-center',
            title: 'Data Privacy (PDPA) Center',
            href: '/crm/pdpa',
          },
          {
            id: 'broker-master',
            title: 'Broker Directory & Licensing',
            href: '/crm/brokers',
          },
          {
            id: 'agent-directory',
            title: 'Agent & Sales Force Directory',
            href: '/crm/agents',
          },
          {
            id: 'channel-hierarchy',
            title: 'Partner & Channel Hierarchy',
            href: '/crm/channels',
          },
        ],
      },
    ],
  },
  {
    sectionTitle: 'Compliance & Governance',
    items: [
      {
        id: 'governance-approvals',
        title: 'Governance & Approvals',
        icon: CheckCheck,
        children: [
          {
            id: 'approvals-inbox',
            title: 'Approvals Inbox (My Approvals)',
            href: '/governance/approvals',
            badge: 'Pending',
          },
          {
            id: 'diff-viewer',
            title: 'Diff Viewer',
            href: '/governance/diff-viewer',
          },
          {
            id: 'audit-trail',
            title: 'Audit Trail',
            href: '/governance/audit-trail',
          },
        ],
      },
      {
        id: 'reports-compliance',
        title: 'Reports & Compliance',
        icon: FileSpreadsheet,
        children: [
          {
            id: 'oic-reporting',
            title: 'OIC Regulatory Reporting',
            href: '/reports/oic',
          },
          {
            id: 'tax-remittance-reports',
            title: 'Tax & Remittance Reports',
            href: '/reports/tax',
          },
          {
            id: 'operational-accounting-reports',
            title: 'Operational Accounting Reports',
            href: '/reports/accounting',
          },
          {
            id: 'analytics-performance',
            title: 'Analytics & Performance',
            href: '/reports/analytics',
          },
        ],
      },
    ],
  },
  {
    sectionTitle: 'Platform & Foundation',
    items: [
      {
        id: 'workflow-admin',
        title: 'Workflow & Administration',
        icon: Workflow,
        children: [
          {
            id: 'workflow-visualizer',
            title: 'Workflow Visualizer & Canvas',
            href: '/admin/workflows',
          },
          {
            id: 'transition-rules',
            title: 'Transition Rules Configurator',
            href: '/admin/transition-rules',
          },
          {
            id: 'access-control-rbac',
            title: 'Access Control & RBAC',
            href: '/admin/rbac',
          },
          {
            id: 'operational-settings-sla',
            title: 'Operational Settings & SLAs',
            href: '/admin/settings',
          },
          {
            id: 'integration-hub-dlq',
            title: 'Integration Hub & DLQ',
            href: '/admin/integrations',
          },
          {
            id: 'template-registry',
            title: 'Document Template Registry',
            href: '/admin/templates',
          },
        ],
      },
      {
        id: 'master-data',
        title: 'Master Data Management',
        icon: Database,
        children: [
          {
            id: 'insurer-master',
            title: 'Insurer & Carrier Directory',
            href: '/master-data/insurers',
          },
          {
            id: 'broker-operations-configurator',
            title: 'Broker Operations & Settlement',
            href: '/master-data/broker-settings',
          },
          {
            id: 'vehicle-master',
            title: 'Vehicle Master',
            href: '/master-data/vehicles',
          },
          {
            id: 'geographical-risk-mapping',
            title: 'Geographical & Risk Mapping',
            href: '/master-data/geography',
          },
          {
            id: 'occupancy-classes',
            title: 'Occupancy & UW Classes',
            href: '/master-data/occupations',
          },
          {
            id: 'network-providers',
            title: 'Network Providers Directory',
            href: '/master-data/network-providers',
          },
        ],
      },
    ],
  },
];