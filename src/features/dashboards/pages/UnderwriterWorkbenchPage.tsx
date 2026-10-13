import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  Filter,
  Eye,
  EyeOff,
  UserCheck,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Sliders,
  FileCheck2,
} from 'lucide-react';

// ==========================================
// Types & Data Contracts (SDD Module 3.4)
// ==========================================

export type SlaStatus = 'OK' | 'WARNING' | 'BREACHED';
export type QueueType = 'ALL' | 'WAITING_INSURER' | 'MANUAL_ACTION' | 'COMPLETED';
export type RoutingChannel = 'API' | 'SFTP' | 'EMAIL';
export type LobType = 'MOTOR' | 'HEALTH' | 'PA' | 'TRAVEL' | 'FIRE' | 'LIFE' | 'CUSTOM';
export type DecisionType = 'APPROVED' | 'REJECTED' | 'COUNTER_OFFER';

export interface UnderwritingQueueItem {
  application_id: string;
  quotation_id: string;
  customer_id: string;
  customer_name: string;
  id_card_masked: string;
  phone_masked: string;
  lob: LobType;
  product_name: string;
  plan_name: string;
  insurer_name: string;
  routing_channel: RoutingChannel;
  submitted_at: string;
  hours_elapsed: number;
  sla_alert_level: SlaStatus;
  status: 'PENDING_REVIEW' | 'INFO_REQUIRED' | 'QUOTATION_RATED' | 'APPROVED_WAITING_PAYMENT' | 'REJECTED';
  assigned_to: string | null;
  base_premium: number;
  referral_reasons: string[];
  evidence_documents: { name: string; url: string; type: string }[];
  risk_details: Record<string, any>;
}

export interface AdjudicationFormState {
  decision: DecisionType;
  loading_percent: number;
  loading_amount: number;
  deductible_override: number;
  policy_exclusions: string;
  underwriter_notes: string;
}

// ==========================================
// Mock Initial Data (Aligned with BRD/SDD)
// ==========================================

const MOCK_APPLICATIONS: UnderwritingQueueItem[] = [
  {
    application_id: 'APP-2026-0099',
    quotation_id: 'QT-2026-8812',
    customer_id: 'cust-uuid-001',
    customer_name: 'Somchai Jaidee',
    id_card_masked: '1-1004-XXXX-88-9',
    phone_masked: '081-XXX-8899',
    lob: 'HEALTH',
    product_name: 'Health Ultra Shield',
    plan_name: 'Gold Package v1',
    insurer_name: 'Viriyah Insurance',
    routing_channel: 'EMAIL',
    submitted_at: '2026-10-12T04:30:00Z',
    hours_elapsed: 30.5,
    sla_alert_level: 'BREACHED',
    status: 'PENDING_REVIEW',
    assigned_to: null,
    base_premium: 24500.0,
    referral_reasons: [
      'BMI Threshold Breached: BMI = 32.4 (Limit: 30.0)',
      'Pre-existing Medical History: Hypertension reported in 2023',
    ],
    evidence_documents: [
      { name: 'Medical_Checkup_Report_2025.pdf', url: 'https://s3.broker.com/med-01.pdf', type: 'PDF' },
      { name: 'Doctor_Prescription_Card.jpg', url: 'https://s3.broker.com/rx-01.jpg', type: 'IMAGE' },
    ],
    risk_details: {
      height_cm: 172,
      weight_kg: 96,
      bmi_value: 32.4,
      is_smoker: false,
      consumes_alcohol: true,
      pre_existing_conditions: 'Essential hypertension on oral medication',
    },
  },
  {
    application_id: 'APP-2026-0104',
    quotation_id: 'QT-2026-9041',
    customer_id: 'cust-uuid-002',
    customer_name: 'Apinya Srisawat',
    id_card_masked: '3-1009-XXXX-44-1',
    phone_masked: '089-XXX-1234',
    lob: 'MOTOR',
    product_name: 'Motor Type 1 Comprehensive',
    plan_name: 'Master Auto Diamond',
    insurer_name: 'Muang Thai Insurance',
    routing_channel: 'WAITING_INSURER' as any,
    submitted_at: '2026-10-12T14:15:00Z',
    hours_elapsed: 20.8,
    sla_alert_level: 'WARNING',
    status: 'PENDING_REVIEW',
    assigned_to: 'admin-uuid-curr-user',
    base_premium: 18200.0,
    referral_reasons: [
      'Vehicle Age > 10 Years: Manufacture Year 2014 (Toyota Camry 2.0G)',
      'High Sum Insured Boundary Check: Requested sum matches 95% market value',
    ],
    evidence_documents: [
      { name: 'Vehicle_Inspection_4_Corners.pdf', url: 'https://s3.broker.com/car-4corners.pdf', type: 'PDF' },
      { name: 'Vehicle_Registration_Book.pdf', url: 'https://s3.broker.com/reg-book.pdf', type: 'PDF' },
    ],
    risk_details: {
      make: 'Toyota',
      model: 'Camry 2.0 G',
      year: 2014,
      chassis_number: 'MR2AA22K8E0123456',
      redbook_suggested_sum: 420000,
      requested_sum_insured: 450000,
    },
  },
  {
    application_id: 'APP-2026-0112',
    quotation_id: 'QT-2026-9930',
    customer_id: 'cust-uuid-003',
    customer_name: 'TechLogistics Global Co., Ltd.',
    id_card_masked: '0-1055-XXXX-11-2',
    phone_masked: '02-XXX-9900',
    lob: 'CUSTOM',
    product_name: 'Cyber Security Enterprise Defense',
    plan_name: 'Bespoke Corporate Tier',
    insurer_name: 'MSIG Insurance',
    routing_channel: 'EMAIL',
    submitted_at: '2026-10-13T02:00:00Z',
    hours_elapsed: 9.2,
    sla_alert_level: 'OK',
    status: 'PENDING_REVIEW',
    assigned_to: null,
    base_premium: 85000.0,
    referral_reasons: [
      '100% Mandatory Referral: LOB = CUSTOM (Dynamic Schema Builder Bypass)',
      'High Revenue Exposure: Annual turnover > 100M THB',
    ],
    evidence_documents: [
      { name: 'Cyber_Risk_Audit_Report.pdf', url: 'https://s3.broker.com/cyber-audit.pdf', type: 'PDF' },
      { name: 'ISO27001_Certificate.pdf', url: 'https://s3.broker.com/iso27001.pdf', type: 'PDF' },
    ],
    risk_details: {
      company_annual_revenue: 150000000,
      number_of_servers: 85,
      has_firewall: true,
      has_endpoint_detection: true,
      has_prior_cyber_breach: false,
    },
  },
  {
    application_id: 'APP-2026-0082',
    quotation_id: 'QT-2026-7711',
    customer_id: 'cust-uuid-004',
    customer_name: 'Kittisak Vongvat',
    id_card_masked: '1-1002-XXXX-77-3',
    phone_masked: '085-XXX-7766',
    lob: 'PA',
    product_name: 'Personal Accident Plus',
    plan_name: 'Pro Active Plan',
    insurer_name: 'AIA Insurance',
    routing_channel: 'API',
    submitted_at: '2026-10-11T10:00:00Z',
    hours_elapsed: 49.0,
    sla_alert_level: 'BREACHED',
    status: 'QUOTATION_RATED',
    assigned_to: 'admin-uuid-curr-user',
    base_premium: 4200.0,
    referral_reasons: ['Occupation Risk Class 3 (Field Engineer)', 'High Motorcycle Risk Flagged'],
    evidence_documents: [{ name: 'Job_Scope_Verification.pdf', url: 'https://s3.broker.com/job.pdf', type: 'PDF' }],
    risk_details: {
      occupation_class: 3,
      job_title: 'Offshore Telecommunications Field Engineer',
      has_motorcycle_risk: true,
    },
  },
];

// ==========================================
// Main Underwriter Workbench Component
// ==========================================

export const UnderwriterWorkbenchPage: React.FC = () => {
  const currentUserId = 'admin-uuid-curr-user';

  // State Management
  const [applications, setApplications] = useState<UnderwritingQueueItem[]>(MOCK_APPLICATIONS);
  const [activeQueueTab, setActiveQueueTab] = useState<QueueType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLob, setSelectedLob] = useState<string>('ALL');
  const [selectedSla, setSelectedSla] = useState<string>('ALL');
  const [selectedApp, setSelectedApp] = useState<UnderwritingQueueItem | null>(null);

  // PDPA Unmasking Modal State
  const [isUnmaskModalOpen, setIsUnmaskModalOpen] = useState(false);
  const [unmaskReason, setUnmaskReason] = useState('');
  const [unmaskedCustomerPii, setUnmaskedCustomerPii] = useState<{ id_card: string; phone: string } | null>(null);

  // Adjudication Form State
  const [adjudication, setAdjudication] = useState<AdjudicationFormState>({
    decision: 'COUNTER_OFFER',
    loading_percent: 15,
    loading_amount: 0,
    deductible_override: 0,
    policy_exclusions: '',
    underwriter_notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // SLA Color & Label Helpers
  const getSlaBadge = (sla: SlaStatus, hours: number) => {
    switch (sla) {
      case 'BREACHED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <Clock className="w-3 h-3 text-rose-600" />
            {hours.toFixed(1)}h (Breached &gt;24h)
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            {hours.toFixed(1)}h (Warning)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Clock className="w-3 h-3 text-emerald-600" />
            {hours.toFixed(1)}h (On Track)
          </span>
        );
    }
  };

  const getLobBadge = (lob: LobType) => {
    const colors: Record<LobType, string> = {
      MOTOR: 'bg-blue-50 text-blue-700 border-blue-200',
      HEALTH: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      PA: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      TRAVEL: 'bg-sky-50 text-sky-700 border-sky-200',
      FIRE: 'bg-amber-50 text-amber-700 border-amber-200',
      LIFE: 'bg-purple-50 text-purple-700 border-purple-200',
      CUSTOM: 'bg-rose-50 text-rose-700 border-rose-200',
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${colors[lob] || 'bg-zinc-100 text-zinc-700 border-zinc-200'}`}>
        {lob}
      </span>
    );
  };

  // KPI Calculations
  const metrics = useMemo(() => {
    return {
      totalPending: applications.filter((a) => a.status === 'PENDING_REVIEW').length,
      breachedCount: applications.filter((a) => a.sla_alert_level === 'BREACHED').length,
      emailQueueCount: applications.filter((a) => a.routing_channel === 'EMAIL' && a.status === 'PENDING_REVIEW').length,
      assignedToMe: applications.filter((a) => a.assigned_to === currentUserId).length,
    };
  }, [applications]);

  // Filtered List
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // Tab Filtering
      if (activeQueueTab === 'WAITING_INSURER' && (app.routing_channel === 'EMAIL' || app.status !== 'PENDING_REVIEW')) return false;
      if (activeQueueTab === 'MANUAL_ACTION' && (app.routing_channel !== 'EMAIL' || app.status !== 'PENDING_REVIEW')) return false;
      if (activeQueueTab === 'COMPLETED' && (app.status === 'PENDING_REVIEW' || app.status === 'INFO_REQUIRED')) return false;

      // Dropdown Filters
      if (selectedLob !== 'ALL' && app.lob !== selectedLob) return false;
      if (selectedSla !== 'ALL' && app.sla_alert_level !== selectedSla) return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchAppId = app.application_id.toLowerCase().includes(query);
        const matchCustomer = app.customer_name.toLowerCase().includes(query);
        const matchInsurer = app.insurer_name.toLowerCase().includes(query);
        const matchPlan = app.plan_name.toLowerCase().includes(query);
        return matchAppId || matchCustomer || matchInsurer || matchPlan;
      }
      return true;
    });
  }, [applications, activeQueueTab, selectedLob, selectedSla, searchQuery]);

  // Handlers
  const handleClaimTicket = (applicationId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setApplications((prev) =>
      prev.map((item) => (item.application_id === applicationId ? { ...item, assigned_to: currentUserId } : item))
    );
    if (selectedApp && selectedApp.application_id === applicationId) {
      setSelectedApp((prev) => (prev ? { ...prev, assigned_to: currentUserId } : null));
    }
  };

  const handleOpenAdjudicationDrawer = (app: UnderwritingQueueItem) => {
    setSelectedApp(app);
    setUnmaskedCustomerPii(null);
    setAdjudication({
      decision: 'COUNTER_OFFER',
      loading_percent: app.lob === 'HEALTH' ? 20 : 10,
      loading_amount: app.lob === 'PA' ? 500 : 0,
      deductible_override: 0,
      policy_exclusions: app.lob === 'HEALTH' ? 'Excluding treatments related to hypertension and cardiovascular complications.' : '',
      underwriter_notes: '',
    });
  };

  const handleExecuteUnmaskPii = () => {
    if (!unmaskReason.trim()) return;
    // Simulating audit_logs injection per SDD Module 3.4.4
    setUnmaskedCustomerPii({
      id_card: '1-1004-88491-88-9',
      phone: '081-882-8899',
    });
    setIsUnmaskModalOpen(false);
    setUnmaskReason('');
  };

  const handleAdjudicationSubmit = () => {
    if (!selectedApp) return;
    if (!adjudication.underwriter_notes.trim()) {
      alert('Internal justification notes are strictly mandatory for Underwriter decisions.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      let nextStatus: UnderwritingQueueItem['status'] = 'QUOTATION_RATED';
      if (adjudication.decision === 'APPROVED') nextStatus = 'APPROVED_WAITING_PAYMENT';
      if (adjudication.decision === 'REJECTED') nextStatus = 'REJECTED';

      setApplications((prev) =>
        prev.map((item) =>
          item.application_id === selectedApp.application_id
            ? {
                ...item,
                status: nextStatus,
                assigned_to: currentUserId,
              }
            : item
        )
      );

      setActionSuccessMessage(
        `Application ${selectedApp.application_id} updated to ${nextStatus}. Webhook event fired to Sales Channel.`
      );
      setIsSubmitting(false);
      setSelectedApp(null);

      setTimeout(() => setActionSuccessMessage(null), 5000);
    }, 600);
  };

  // Live Premium Recalculation Preview
  const calculatedRevisedPremium = useMemo(() => {
    if (!selectedApp) return 0;
    const base = selectedApp.base_premium;
    const loadingPercVal = (base * (adjudication.loading_percent || 0)) / 100;
    const fixedLoading = Number(adjudication.loading_amount) || 0;
    return base + loadingPercVal + fixedLoading;
  }, [selectedApp, adjudication.loading_percent, adjudication.loading_amount]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Stat Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Underwriter Workbench</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Triaged Yellow Channel referrals, Insurer SLA countdowns, and manual rating adjustments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setApplications([...MOCK_APPLICATIONS])}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
            Refresh Queues
          </button>
        </div>
      </div>

      {actionSuccessMessage && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button onClick={() => setActionSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Pending Review</span>
            <div className="text-2xl font-bold text-zinc-900 mt-1">{metrics.totalPending}</div>
            <span className="text-xs text-zinc-400">Awaiting adjudication</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">SLA Breached (&gt;24h)</span>
            <div className="text-2xl font-bold text-rose-600 mt-1">{metrics.breachedCount}</div>
            <span className="text-xs text-rose-500 font-medium">Requires immediate escalation</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Email Action Queue</span>
            <div className="text-2xl font-bold text-amber-600 mt-1">{metrics.emailQueueCount}</div>
            <span className="text-xs text-zinc-400">Manual digitization needed</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Assigned to Me</span>
            <div className="text-2xl font-bold text-indigo-600 mt-1">{metrics.assignedToMe}</div>
            <span className="text-xs text-zinc-400">In my active workbench</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Main Workbench Queue Card */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        {/* Queue Navigation Tabs */}
        <div className="border-b border-zinc-200 px-4 pt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveQueueTab('ALL')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition ${
              activeQueueTab === 'ALL'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            All Referrals ({applications.length})
          </button>
          <button
            onClick={() => setActiveQueueTab('WAITING_INSURER')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition ${
              activeQueueTab === 'WAITING_INSURER'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            Queue A: Waiting for Insurer (SLA)
          </button>
          <button
            onClick={() => setActiveQueueTab('MANUAL_ACTION')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition ${
              activeQueueTab === 'MANUAL_ACTION'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            Queue B: Manual Action Required (Email)
          </button>
          <button
            onClick={() => setActiveQueueTab('COMPLETED')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition ${
              activeQueueTab === 'COMPLETED'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            Queue C: Adjudicated / Completed
          </button>
        </div>

        {/* Filters and Controls */}
        <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by App ID, Customer, Insurer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-400 text-zinc-800"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </div>

            <select
              value={selectedLob}
              onChange={(e) => setSelectedLob(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            >
              <option value="ALL">All LOBs</option>
              <option value="MOTOR">Motor</option>
              <option value="HEALTH">Health</option>
              <option value="PA">PA</option>
              <option value="TRAVEL">Travel</option>
              <option value="FIRE">Fire</option>
              <option value="LIFE">Life</option>
              <option value="CUSTOM">Custom / Cyber</option>
            </select>

            <select
              value={selectedSla}
              onChange={(e) => setSelectedSla(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            >
              <option value="ALL">All SLA Statuses</option>
              <option value="OK">On Track (OK)</option>
              <option value="WARNING">Warning</option>
              <option value="BREACHED">Breached (&gt;24h)</option>
            </select>
          </div>
        </div>

        {/* Data Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-100/70 text-zinc-600 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Application & Plan</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Insurer & Channel</th>
                <th className="py-3 px-4">Referral Reason</th>
                <th className="py-3 px-4">SLA Countdown</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-400 italic">
                    No applications matching current filters in this queue.
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => (
                  <tr
                    key={app.application_id}
                    onClick={() => handleOpenAdjudicationDrawer(app)}
                    className="hover:bg-zinc-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getLobBadge(app.lob)}
                        <span className="font-semibold text-zinc-900 group-hover:text-blue-600 transition">
                          {app.application_id}
                        </span>
                      </div>
                      <div className="text-zinc-500 mt-0.5">{app.plan_name}</div>
                      <div className="text-[11px] text-zinc-400">Base: ฿{app.base_premium.toLocaleString()}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-zinc-800">{app.customer_name}</div>
                      <div className="text-zinc-400 text-[11px] font-mono">{app.id_card_masked}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-zinc-800 font-medium">{app.insurer_name}</div>
                      <div className="mt-0.5">
                        <span
                          className={`inline-block px-1.5 py-0.5 text-[10px] rounded font-semibold uppercase ${
                            app.routing_channel === 'EMAIL'
                              ? 'bg-amber-100 text-amber-800'
                              : app.routing_channel === 'API'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-zinc-200 text-zinc-800'
                          }`}
                        >
                          Channel: {app.routing_channel}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <ul className="space-y-1">
                        {app.referral_reasons.map((reason, idx) => (
                          <li key={idx} className="flex items-start gap-1 text-zinc-600">
                            <span className="text-amber-500 font-bold shrink-0">•</span>
                            <span className="truncate">{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">{getSlaBadge(app.sla_alert_level, app.hours_elapsed)}</td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {app.assigned_to ? (
                        <span className="inline-flex items-center gap-1 text-indigo-700 font-medium bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          <UserCheck className="w-3 h-3" />
                          {app.assigned_to === currentUserId ? 'You' : 'Staff'}
                        </span>
                      ) : (
                        <button
                          onClick={(e) => handleClaimTicket(app.application_id, e)}
                          className="px-2 py-1 text-[11px] font-semibold text-zinc-700 bg-white border border-zinc-300 rounded hover:bg-zinc-100 transition shadow-xs"
                        >
                          Claim Ticket
                        </button>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAdjudicationDrawer(app);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition shadow-xs"
                      >
                        Review
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. Detailed Adjudication Drawer / Modal (Slide-over)                      */}
      {/* ========================================================================= */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-zinc-900/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-zinc-200 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-2">
                {getLobBadge(selectedApp.lob)}
                <div>
                  <h2 className="text-base font-bold text-zinc-900">{selectedApp.application_id}</h2>
                  <p className="text-xs text-zinc-500">{selectedApp.product_name} • {selectedApp.plan_name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-zinc-800">
              {/* Customer Info & PDPA Unmask Action */}
              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-900 text-sm">Applicant KYC (Single Customer Record)</span>
                  <button
                    onClick={() => setIsUnmaskModalOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                  >
                    {unmaskedCustomerPii ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {unmaskedCustomerPii ? 'PII Unmasked (Audited)' : 'Reveal PII (PDPA Audit)'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-zinc-600">
                  <div>
                    <span className="text-zinc-400 block text-[11px]">Customer Full Name</span>
                    <span className="font-medium text-zinc-900">{selectedApp.customer_name}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[11px]">Thai Citizen ID / Tax ID</span>
                    <span className="font-mono font-medium text-zinc-900">
                      {unmaskedCustomerPii ? unmaskedCustomerPii.id_card : selectedApp.id_card_masked}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[11px]">Primary Contact</span>
                    <span className="font-mono font-medium text-zinc-900">
                      {unmaskedCustomerPii ? unmaskedCustomerPii.phone : selectedApp.phone_masked}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[11px]">Target Insurer</span>
                    <span className="font-medium text-zinc-900">{selectedApp.insurer_name}</span>
                  </div>
                </div>
              </div>

              {/* Referral Risk Breaches (Why it flagged Yellow) */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-zinc-900 text-sm">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span>Rule Engine Breaches (Yellow Channel)</span>
                </div>
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-2">
                  {selectedApp.referral_reasons.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-amber-900 font-medium">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Extension & Biometric Snapshot */}
              <div className="space-y-2">
                <span className="font-bold text-zinc-900 text-sm block">Line-of-Business Risk Parameters</span>
                <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 font-mono text-[11px] space-y-1.5">
                  {Object.entries(selectedApp.risk_details).map(([key, val]) => (
                    <div key={key} className="flex justify-between py-0.5 border-b border-zinc-200/60 last:border-0">
                      <span className="text-zinc-500">{key}:</span>
                      <span className="text-zinc-800 font-semibold">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Uploaded Evidence Vault Documents */}
              <div className="space-y-2">
                <span className="font-bold text-zinc-900 text-sm block">Uploaded Customer Evidence (S3 Vault)</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedApp.evidence_documents.map((doc, idx) => (
                    <a
                      key={idx}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-white border border-zinc-200 rounded-lg hover:border-zinc-300 hover:shadow-xs flex items-center justify-between transition group"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileCheck2 className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="truncate text-zinc-700 font-medium">{doc.name}</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>

              <hr className="border-zinc-200" />

              {/* Decision Recording Tools (Digitization & Counter Offer) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-900 text-sm">Underwriting Decision & Counter-Offer</span>
                  <span className="text-[11px] text-zinc-400">Updates State Machine & Recalculates Quoted Offer</span>
                </div>

                {/* Outcome Selector */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjudication({ ...adjudication, decision: 'APPROVED' })}
                    className={`py-2 px-3 rounded-lg border font-semibold flex flex-col items-center justify-center gap-1 transition ${
                      adjudication.decision === 'APPROVED'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-200'
                        : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Approve Standard</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjudication({ ...adjudication, decision: 'COUNTER_OFFER' })}
                    className={`py-2 px-3 rounded-lg border font-semibold flex flex-col items-center justify-center gap-1 transition ${
                      adjudication.decision === 'COUNTER_OFFER'
                        ? 'bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-200'
                        : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    <Sliders className="w-4 h-4 text-blue-600" />
                    <span>Counter-Offer (Rated)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjudication({ ...adjudication, decision: 'REJECTED' })}
                    className={`py-2 px-3 rounded-lg border font-semibold flex flex-col items-center justify-center gap-1 transition ${
                      adjudication.decision === 'REJECTED'
                        ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-200'
                        : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Decline Application</span>
                  </button>
                </div>

                {/* Counter-Offer Pricing Tools (Only when COUNTER_OFFER) */}
                {adjudication.decision === 'COUNTER_OFFER' && (
                  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-4 animate-in fade-in">
                    <div className="font-semibold text-zinc-900 flex items-center justify-between">
                      <span>Pricing & Risk Loading Adjustments</span>
                      <span className="text-blue-600 font-mono font-bold">
                        Quoted: ฿{selectedApp.base_premium.toLocaleString()} → Revised: ฿
                        {calculatedRevisedPremium.toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-zinc-600 mb-1 font-medium">Loading Multiplier (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={adjudication.loading_percent}
                          onChange={(e) =>
                            setAdjudication({ ...adjudication, loading_percent: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-800"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-600 mb-1 font-medium">Fixed Loading Fee (THB)</label>
                        <input
                          type="number"
                          min="0"
                          value={adjudication.loading_amount}
                          onChange={(e) =>
                            setAdjudication({ ...adjudication, loading_amount: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-800"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-600 mb-1 font-medium">Deductible Override (THB)</label>
                        <input
                          type="number"
                          min="0"
                          value={adjudication.deductible_override}
                          onChange={(e) =>
                            setAdjudication({ ...adjudication, deductible_override: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-800"
                        />
                      </div>
                    </div>

                    {/* Exclusion Manager Clause */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-zinc-700 font-medium">Exclusion Clause (Injected in Red on Schedule)</label>
                        <span className="text-[10px] text-rose-600 font-semibold uppercase">Schedule Red-Text</span>
                      </div>
                      <textarea
                        rows={2}
                        value={adjudication.policy_exclusions}
                        onChange={(e) => setAdjudication({ ...adjudication, policy_exclusions: e.target.value })}
                        placeholder="e.g. Excluding right knee surgical treatments or pre-existing ligament injuries."
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-800"
                      />
                    </div>
                  </div>
                )}

                {/* Mandatory Underwriter Notes (Audit Trail) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-zinc-700 font-medium">Underwriter Audit Justification (Mandatory)</label>
                    <span className="text-[10px] text-zinc-400 font-mono">Logged to audit_logs</span>
                  </div>
                  <textarea
                    rows={2}
                    value={adjudication.underwriter_notes}
                    onChange={(e) => setAdjudication({ ...adjudication, underwriter_notes: e.target.value })}
                    placeholder="Provide specific underwriting rationale for auditing (e.g. Approved via email from Viriyah UW with 20% loading for high BMI)."
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-800"
                  />
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleAdjudicationSubmit}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Adjudication...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Underwriter Decision</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. PDPA Unmask Justification Modal (SEC-03 & BRD 7.11 Compliance)        */}
      {/* ========================================================================= */}
      {isUnmaskModalOpen && (
        <div className="fixed inset-0 z-60 bg-zinc-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 border border-zinc-200 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-zinc-900">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-sm">PDPA Mandatory Access Verification</h3>
            </div>

            <p className="text-xs text-zinc-600">
              In accordance with Thai PDPA &amp; OIC guidelines, decrypting customer PII (ID Card, Phone) generates an
              immutable row in <code className="bg-zinc-100 px-1 py-0.5 rounded font-mono text-[11px]">audit_logs</code> capturing
              your Admin UUID, IP address, and justification.
            </p>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Business Reason for Unmasking
              </label>
              <textarea
                rows={3}
                value={unmaskReason}
                onChange={(e) => setUnmaskReason(e.target.value)}
                placeholder="e.g. Verifying national ID card against Viriyah Insurer batch portal match."
                className="w-full p-2 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsUnmaskModalOpen(false);
                  setUnmaskReason('');
                }}
                className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!unmaskReason.trim()}
                onClick={handleExecuteUnmaskPii}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                Authorize &amp; Decrypt PII
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnderwriterWorkbenchPage;