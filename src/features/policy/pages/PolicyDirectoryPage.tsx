import React, { useState, useMemo } from 'react';
import {
  Search,
  Eye,
  EyeOff,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Car,
  Heart,
  Plane,
  Shield,
  Flame,
  UserCheck,
  Briefcase,
  ChevronRight,
  X,
  RefreshCw,
} from 'lucide-react';

// ============================================================================
// Types & Domain Models (BRD 6.4, 6.5 & SDD 4.5, 4.6)
// ============================================================================

export type LineOfBusiness = 'MOTOR' | 'HEALTH' | 'TRAVEL' | 'PA' | 'FIRE' | 'LIFE' | 'CUSTOM';

export type PolicyStatus =
  | 'ACTIVE'
  | 'PENDING_OFFICIAL_NUMBER'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'SUSPENDED';

export type SalesChannel = 'Tele sales' | 'Direct sale' | 'Website' | 'Sub agent';

export interface TrackingFlags {
  is_paid: boolean;
  is_broker_sent_to_insurer: boolean;
  is_insurer_confirmed: boolean;
  is_broker_got_hard_copy: boolean;
  is_digital_sent_to_customer: boolean;
  is_real_hard_copy_sent: boolean;
}

export interface DynamicExtensionData {
  motor?: {
    license_plate: string;
    province: string;
    chassis_number: string;
    oic_code: string;
    sum_insured: number;
  };
  health?: {
    height_cm: number;
    weight_kg: number;
    bmi: number;
    is_smoker: boolean;
    pre_existing_conditions?: string;
  };
  travel?: {
    trip_duration_type: 'SINGLE_TRIP' | 'ANNUAL_MULTI_TRIP';
    destination_countries: string[];
    travelers_count: number;
  };
  pa?: {
    occupation_class: number;
    has_motorcycle_risk: boolean;
  };
  fire?: {
    property_type: 'RESIDENTIAL' | 'COMMERCIAL' | 'CONDO';
    building_class: string;
  };
  life?: {
    policy_term_years: number;
    payment_term_years: number;
  };
  custom?: Record<string, any>;
}

export interface PolicyRecord {
  policy_id: string;
  policy_number: string | null;
  reference_number: string;
  lob_code: LineOfBusiness;
  product_name: string;
  plan_name: string;
  insurer_name: string;
  channel_name: SalesChannel;
  customer_id: string;
  customer_name: string;
  id_card_masked: string;
  id_card_unmasked: string;
  is_id_unmasked?: boolean;
  net_premium: number;
  stamp_duty: number;
  vat: number;
  gross_premium: number;
  effective_start_date: string;
  effective_end_date: string;
  status: PolicyStatus;
  tracking_flags: TrackingFlags;
  extension_data: DynamicExtensionData;
  created_at: string;
}

// ============================================================================
// Mock Data (Representing SCD Type 2 Headers & Extensions)
// ============================================================================

const MOCK_POLICIES: PolicyRecord[] = [
  {
    policy_id: 'pol-550e8400-e29b-41d4-a716-446655440001',
    policy_number: 'VIR-MOT-2026-9812',
    reference_number: 'TMP-2026-0001',
    lob_code: 'MOTOR',
    product_name: 'Viriyah Motor Type 1 Direct',
    plan_name: 'Gold Package (No Deductible)',
    insurer_name: 'Viriyah Insurance',
    channel_name: 'Direct sale',
    customer_id: 'cust-uuid-1001',
    customer_name: 'Somchai Jaidee',
    id_card_masked: '1-1004-XXXX-88-9',
    id_card_unmasked: '1-1004-58291-88-9',
    net_premium: 16800.0,
    stamp_duty: 67.2,
    vat: 1180.7,
    gross_premium: 18047.9,
    effective_start_date: '2026-03-01',
    effective_end_date: '2027-03-01',
    status: 'ACTIVE',
    tracking_flags: {
      is_paid: true,
      is_broker_sent_to_insurer: true,
      is_insurer_confirmed: true,
      is_broker_got_hard_copy: true,
      is_digital_sent_to_customer: true,
      is_real_hard_copy_sent: false,
    },
    extension_data: {
      motor: {
        license_plate: '9กข 4821',
        province: 'Bangkok',
        chassis_number: 'MRHFD2660HP102938',
        oic_code: '1.10',
        sum_insured: 650000,
      },
    },
    created_at: '2026-02-28 10:14:22',
  },
  {
    policy_id: 'pol-550e8400-e29b-41d4-a716-446655440002',
    policy_number: null,
    reference_number: 'TMP-2026-0002',
    lob_code: 'HEALTH',
    product_name: 'AIA Health Happy Plus',
    plan_name: 'Diamond Plan 5M',
    insurer_name: 'AIA Thailand',
    channel_name: 'Tele sales',
    customer_id: 'cust-uuid-1002',
    customer_name: 'Wandee Kittisuk',
    id_card_masked: '3-1008-XXXX-12-4',
    id_card_unmasked: '3-1008-98432-12-4',
    net_premium: 24000.0,
    stamp_duty: 96.0,
    vat: 1686.72,
    gross_premium: 25782.72,
    effective_start_date: '2026-03-15',
    effective_end_date: '2027-03-15',
    status: 'PENDING_OFFICIAL_NUMBER',
    tracking_flags: {
      is_paid: true,
      is_broker_sent_to_insurer: true,
      is_insurer_confirmed: false,
      is_broker_got_hard_copy: false,
      is_digital_sent_to_customer: false,
      is_real_hard_copy_sent: false,
    },
    extension_data: {
      health: {
        height_cm: 165,
        weight_kg: 58,
        bmi: 21.3,
        is_smoker: false,
        pre_existing_conditions: 'None declared',
      },
    },
    created_at: '2026-03-01 14:32:05',
  },
  {
    policy_id: 'pol-550e8400-e29b-41d4-a716-446655440003',
    policy_number: 'MSIG-TRV-2026-0114',
    reference_number: 'TMP-2026-0003',
    lob_code: 'TRAVEL',
    product_name: 'MSIG Travel Easy Worldwide',
    plan_name: 'Worldwide Premier Family',
    insurer_name: 'MSIG Insurance',
    channel_name: 'Website',
    customer_id: 'cust-uuid-1003',
    customer_name: 'Kitti Raksasub',
    id_card_masked: '1-1020-XXXX-77-1',
    id_card_unmasked: '1-1020-00123-77-1',
    net_premium: 1250.0,
    stamp_duty: 5.0,
    vat: 87.85,
    gross_premium: 1342.85,
    effective_start_date: '2026-04-10',
    effective_end_date: '2026-04-20',
    status: 'ACTIVE',
    tracking_flags: {
      is_paid: true,
      is_broker_sent_to_insurer: true,
      is_insurer_confirmed: true,
      is_broker_got_hard_copy: false,
      is_digital_sent_to_customer: true,
      is_real_hard_copy_sent: false,
    },
    extension_data: {
      travel: {
        trip_duration_type: 'SINGLE_TRIP',
        destination_countries: ['JP', 'KR'],
        travelers_count: 3,
      },
    },
    created_at: '2026-03-02 09:20:11',
  },
  {
    policy_id: 'pol-550e8400-e29b-41d4-a716-446655440004',
    policy_number: 'MTI-FIRE-2026-7782',
    reference_number: 'TMP-2026-0004',
    lob_code: 'FIRE',
    product_name: 'Muang Thai Home Guard',
    plan_name: 'Home Complete All-Risks',
    insurer_name: 'Muang Thai Insurance',
    channel_name: 'Sub agent',
    customer_id: 'cust-uuid-1004',
    customer_name: 'Anan Charoenporn',
    id_card_masked: '5-1002-XXXX-33-0',
    id_card_unmasked: '5-1002-44321-33-0',
    net_premium: 4500.0,
    stamp_duty: 18.0,
    vat: 316.26,
    gross_premium: 4834.26,
    effective_start_date: '2026-01-01',
    effective_end_date: '2027-01-01',
    status: 'ACTIVE',
    tracking_flags: {
      is_paid: true,
      is_broker_sent_to_insurer: true,
      is_insurer_confirmed: true,
      is_broker_got_hard_copy: true,
      is_digital_sent_to_customer: true,
      is_real_hard_copy_sent: true,
    },
    extension_data: {
      fire: {
        property_type: 'RESIDENTIAL',
        building_class: 'Class 1 (Concrete)',
      },
    },
    created_at: '2025-12-28 16:45:00',
  },
  {
    policy_id: 'pol-550e8400-e29b-41d4-a716-446655440005',
    policy_number: 'MTI-PA-2026-5541',
    reference_number: 'TMP-2026-0005',
    lob_code: 'PA',
    product_name: 'Muang Thai Sabai PA',
    plan_name: 'PA Care Plan 2',
    insurer_name: 'Muang Thai Insurance',
    channel_name: 'Website',
    customer_id: 'cust-uuid-1005',
    customer_name: 'Nattapong Songkran',
    id_card_masked: '1-1003-XXXX-99-8',
    id_card_unmasked: '1-1003-88219-99-8',
    net_premium: 2100.0,
    stamp_duty: 8.4,
    vat: 147.59,
    gross_premium: 2255.99,
    effective_start_date: '2026-02-15',
    effective_end_date: '2027-02-15',
    status: 'CANCELLED',
    tracking_flags: {
      is_paid: true,
      is_broker_sent_to_insurer: true,
      is_insurer_confirmed: true,
      is_broker_got_hard_copy: false,
      is_digital_sent_to_customer: true,
      is_real_hard_copy_sent: false,
    },
    extension_data: {
      pa: {
        occupation_class: 2,
        has_motorcycle_risk: true,
      },
    },
    created_at: '2026-02-10 11:15:30',
  },
];

// ============================================================================
// Helper Components & Badges
// ============================================================================

const LOBBadge: React.FC<{ lob: LineOfBusiness }> = ({ lob }) => {
  const configs: Record<LineOfBusiness, { label: string; icon: React.ReactNode; color: string }> = {
    MOTOR: { label: 'Motor', icon: <Car className="w-3 h-3" />, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    HEALTH: { label: 'Health', icon: <Heart className="w-3 h-3" />, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    TRAVEL: { label: 'Travel', icon: <Plane className="w-3 h-3" />, color: 'bg-purple-50 text-purple-700 border-purple-200' },
    PA: { label: 'PA', icon: <Shield className="w-3 h-3" />, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    FIRE: { label: 'Fire', icon: <Flame className="w-3 h-3" />, color: 'bg-rose-50 text-rose-700 border-rose-200' },
    LIFE: { label: 'Life', icon: <UserCheck className="w-3 h-3" />, color: 'bg-teal-50 text-teal-700 border-teal-200' },
    CUSTOM: { label: 'Custom', icon: <Briefcase className="w-3 h-3" />, color: 'bg-zinc-100 text-zinc-700 border-zinc-300' },
  };

  const item = configs[lob];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${item.color}`}>
      {item.icon}
      {item.label}
    </span>
  );
};

const StatusBadge: React.FC<{ status: PolicyStatus }> = ({ status }) => {
  const map: Record<PolicyStatus, { label: string; style: string; icon: React.ReactNode }> = {
    ACTIVE: {
      label: 'Active',
      style: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
    },
    PENDING_OFFICIAL_NUMBER: {
      label: 'Pending Insurer No.',
      style: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: <Clock className="w-3 h-3 text-amber-600" />,
    },
    CANCELLED: {
      label: 'Cancelled',
      style: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: <AlertCircle className="w-3 h-3 text-rose-600" />,
    },
    EXPIRED: {
      label: 'Expired',
      style: 'bg-zinc-100 text-zinc-600 border-zinc-200',
      icon: <Clock className="w-3 h-3 text-zinc-400" />,
    },
    SUSPENDED: {
      label: 'Suspended',
      style: 'bg-red-50 text-red-700 border-red-200',
      icon: <AlertCircle className="w-3 h-3 text-red-600" />,
    },
  };

  const current = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${current.style}`}>
      {current.icon}
      {current.label}
    </span>
  );
};

// ============================================================================
// Main Unified Policy Directory Page
// ============================================================================

export const PolicyDirectoryPage: React.FC = () => {
  const [policies, setPolicies] = useState<PolicyRecord[]>(MOCK_POLICIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLOB, setSelectedLOB] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');
  const [selectedInsurer, setSelectedInsurer] = useState<string>('ALL');

  // Inspection Drawer & Modal States
  const [activePolicy, setActivePolicy] = useState<PolicyRecord | null>(null);
  const [pdpaModalTarget, setPdpaModalTarget] = useState<PolicyRecord | null>(null);
  const [pdpaReason, setPdpaReason] = useState<string>('');

  // Unmask individual ID card toggle with simulated audit logging
  const handleConfirmUnmask = () => {
    if (!pdpaModalTarget) return;

    setPolicies((prev) =>
      prev.map((p) =>
        p.policy_id === pdpaModalTarget.policy_id
          ? { ...p, is_id_unmasked: true }
          : p
      )
    );

    if (activePolicy && activePolicy.policy_id === pdpaModalTarget.policy_id) {
      setActivePolicy((prev) => (prev ? { ...prev, is_id_unmasked: true } : null));
    }

    setPdpaModalTarget(null);
    setPdpaReason('');
  };

  const handleToggleChecklistFlag = (policyId: string, flagKey: keyof TrackingFlags) => {
    setPolicies((prev) =>
      prev.map((p) => {
        if (p.policy_id === policyId) {
          const updatedFlags = { ...p.tracking_flags, [flagKey]: !p.tracking_flags[flagKey] };
          const updatedRecord = { ...p, tracking_flags: updatedFlags };
          if (activePolicy?.policy_id === policyId) {
            setActivePolicy(updatedRecord);
          }
          return updatedRecord;
        }
        return p;
      })
    );
  };

  // Filter Pipeline
  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (p.policy_number && p.policy_number.toLowerCase().includes(q)) ||
        p.reference_number.toLowerCase().includes(q) ||
        p.customer_name.toLowerCase().includes(q) ||
        p.id_card_masked.includes(q) ||
        p.id_card_unmasked.includes(q);

      const matchesLOB = selectedLOB === 'ALL' || p.lob_code === selectedLOB;
      const matchesStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
      const matchesChannel = selectedChannel === 'ALL' || p.channel_name === selectedChannel;
      const matchesInsurer = selectedInsurer === 'ALL' || p.insurer_name === selectedInsurer;

      return matchesSearch && matchesLOB && matchesStatus && matchesChannel && matchesInsurer;
    });
  }, [policies, searchQuery, selectedLOB, selectedStatus, selectedChannel, selectedInsurer]);

  // Statistics KPI counts
  const stats = useMemo(() => {
    const total = policies.length;
    const active = policies.filter((p) => p.status === 'ACTIVE').length;
    const pendingOfficial = policies.filter((p) => p.status === 'PENDING_OFFICIAL_NUMBER').length;
    const missingConfirm = policies.filter((p) => !p.tracking_flags.is_insurer_confirmed).length;
    return { total, active, pendingOfficial, missingConfirm };
  }, [policies]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Summary Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
            Unified Policy Directory
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            System of record for cross-LOB insurance contracts, fulfillment checklists, and PDPA-governed customer records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPolicies([...MOCK_POLICIES])}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md shadow-sm hover:bg-zinc-50 focus:outline-none"
          >
            <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
            Refresh Directory
          </button>
        </div>
      </div>

      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Staged Policies</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm">
          <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Active In-Force</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.active}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm">
          <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Awaiting Policy No.</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{stats.pendingOfficial}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm">
          <p className="text-xs font-medium text-rose-600 uppercase tracking-wider">Unconfirmed by Insurer</p>
          <p className="text-2xl font-bold text-rose-700 mt-1">{stats.missingConfirm}</p>
        </div>
      </div>

      {/* 2. Control Toolbar (Search, Filter, LOB Tabs) */}
      <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by Policy No, Ref No, Insured Name, ID Card..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-800 focus:border-zinc-800 placeholder-zinc-400 text-zinc-900"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedLOB}
              onChange={(e) => setSelectedLOB(e.target.value)}
              aria-label="Filter by Line of Business"
              className="px-2.5 py-1.5 text-xs bg-white border border-zinc-300 rounded-md font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-800"
            >
              <option value="ALL">All LOBs</option>
              <option value="MOTOR">Motor</option>
              <option value="HEALTH">Health</option>
              <option value="TRAVEL">Travel</option>
              <option value="FIRE">Fire</option>
              <option value="PA">PA</option>
              <option value="LIFE">Life</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter by Policy Status"
              className="px-2.5 py-1.5 text-xs bg-white border border-zinc-300 rounded-md font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-800"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_OFFICIAL_NUMBER">Pending Insurer No.</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="EXPIRED">Expired</option>
            </select>

            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              aria-label="Filter by Sales Channel"
              className="px-2.5 py-1.5 text-xs bg-white border border-zinc-300 rounded-md font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-800"
            >
              <option value="ALL">All Channels</option>
              <option value="Direct sale">Direct sale</option>
              <option value="Tele sales">Tele sales</option>
              <option value="Website">Website</option>
              <option value="Sub agent">Sub agent</option>
            </select>

            <select
              value={selectedInsurer}
              onChange={(e) => setSelectedInsurer(e.target.value)}
              aria-label="Filter by Insurer"
              className="px-2.5 py-1.5 text-xs bg-white border border-zinc-300 rounded-md font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-800"
            >
              <option value="ALL">All Insurers</option>
              <option value="Viriyah Insurance">Viriyah</option>
              <option value="AIA Thailand">AIA</option>
              <option value="MSIG Insurance">MSIG</option>
              <option value="Muang Thai Insurance">Muang Thai</option>
            </select>

            {(searchQuery || selectedLOB !== 'ALL' || selectedStatus !== 'ALL' || selectedChannel !== 'ALL' || selectedInsurer !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedLOB('ALL');
                  setSelectedStatus('ALL');
                  setSelectedChannel('ALL');
                  setSelectedInsurer('ALL');
                }}
                className="text-xs text-zinc-500 hover:text-zinc-900 underline px-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Main Data Grid */}
      <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-700 border-collapse">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Policy / Ref No.</th>
                <th className="py-3 px-4">LOB & Product</th>
                <th className="py-3 px-4">Insured Customer (PDPA)</th>
                <th className="py-3 px-4">Sales Channel</th>
                <th className="py-3 px-4 text-right">Gross Premium</th>
                <th className="py-3 px-4">Effective Dates</th>
                <th className="py-3 px-4">Ops Checklist (6/6)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredPolicies.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-400">
                    No matching policies found.
                  </td>
                </tr>
              ) : (
                filteredPolicies.map((p) => {
                  const checklistCount = Object.values(p.tracking_flags).filter(Boolean).length;
                  return (
                    <tr
                      key={p.policy_id}
                      className="hover:bg-zinc-50/75 transition-colors cursor-pointer"
                      onClick={() => setActivePolicy(p)}
                    >
                      {/* Policy / Ref No */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-900">
                          {p.policy_number ? (
                            <span>{p.policy_number}</span>
                          ) : (
                            <span className="italic text-amber-600">Pending Assignment</span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono">
                          Ref: {p.reference_number}
                        </div>
                      </td>

                      {/* LOB & Product */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 mb-1">
                          <LOBBadge lob={p.lob_code} />
                          <span className="text-[11px] text-zinc-500 font-medium">
                            {p.insurer_name}
                          </span>
                        </div>
                        <div className="font-medium text-zinc-800 line-clamp-1 max-w-[180px]">
                          {p.product_name}
                        </div>
                      </td>

                      {/* Customer & PDPA */}
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="font-medium text-zinc-900">{p.customer_name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-zinc-500 text-[11px]">
                            {p.is_id_unmasked ? p.id_card_unmasked : p.id_card_masked}
                          </span>
                          <button
                            onClick={() => {
                              if (!p.is_id_unmasked) {
                                setPdpaModalTarget(p);
                              } else {
                                setPolicies((prev) =>
                                  prev.map((item) =>
                                    item.policy_id === p.policy_id
                                      ? { ...item, is_id_unmasked: false }
                                      : item
                                  )
                                );
                              }
                            }}
                            title={p.is_id_unmasked ? 'Mask PII' : 'Unmask PII (PDPA Audit Event)'}
                            className="text-zinc-400 hover:text-zinc-700 p-0.5"
                          >
                            {p.is_id_unmasked ? (
                              <EyeOff className="w-3.5 h-3.5 text-zinc-600" />
                            ) : (
                              <Eye className="w-3.5 h-3.5 text-zinc-400" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Channel */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded text-[11px] font-medium border border-zinc-200">
                          {p.channel_name}
                        </span>
                      </td>

                      {/* Premium */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-semibold text-zinc-900">
                          ฿{p.gross_premium.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          Net: ฿{p.net_premium.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      </td>

                      {/* Effective Dates */}
                      <td className="py-3 px-4 text-[11px]">
                        <div className="text-zinc-700 font-medium">{p.effective_start_date}</div>
                        <div className="text-zinc-400">to {p.effective_end_date}</div>
                      </td>

                      {/* Ops Checklist Progress */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-zinc-100 h-1.5 rounded-full overflow-hidden w-16">
                            <div
                              className={`h-full ${
                                checklistCount === 6
                                  ? 'bg-emerald-500'
                                  : checklistCount >= 3
                                  ? 'bg-amber-500'
                                  : 'bg-zinc-300'
                              }`}
                              style={{ width: `${(checklistCount / 6) * 100}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-zinc-600">
                            {checklistCount}/6
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <StatusBadge status={p.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setActivePolicy(p)}
                          className="inline-flex items-center justify-center p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                          title="Inspect Policy"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. Inspection Detail Slide-over Panel (Screen 8.3.1 / 8.3.2)          */}
      {/* ==================================================================== */}
      {activePolicy && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-zinc-900/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-zinc-200 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="h-16 border-b border-zinc-200 px-6 flex items-center justify-between shrink-0 bg-zinc-50/50">
              <div className="flex items-center gap-3">
                <LOBBadge lob={activePolicy.lob_code} />
                <div>
                  <h2 className="text-sm font-bold text-zinc-900">
                    {activePolicy.policy_number || activePolicy.reference_number}
                  </h2>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    ID: {activePolicy.policy_id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActivePolicy(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-md hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Unified Policy Header Operational Card (Screen 8.3.1) */}
              <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                    Policy Header & Settlement
                  </span>
                  <StatusBadge status={activePolicy.status} />
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-zinc-500">Insurer:</span>
                    <p className="font-semibold text-zinc-900">{activePolicy.insurer_name}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Sales Channel:</span>
                    <p className="font-semibold text-zinc-900">{activePolicy.channel_name}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Plan:</span>
                    <p className="font-semibold text-zinc-900">{activePolicy.plan_name}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Term Window:</span>
                    <p className="font-semibold text-zinc-900">
                      {activePolicy.effective_start_date} ~ {activePolicy.effective_end_date}
                    </p>
                  </div>
                </div>

                {/* Por.Lor. 1 Premium Flattening Breakdown (BRD REP-02) */}
                <div className="pt-3 border-t border-zinc-200/80 grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded border border-zinc-200">
                    <span className="text-[10px] text-zinc-500 block uppercase">Net</span>
                    <span className="font-mono font-medium text-zinc-800">
                      ฿{activePolicy.net_premium.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded border border-zinc-200">
                    <span className="text-[10px] text-zinc-500 block uppercase">Stamp (0.4%)</span>
                    <span className="font-mono font-medium text-zinc-800">
                      ฿{activePolicy.stamp_duty.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded border border-zinc-200">
                    <span className="text-[10px] text-zinc-500 block uppercase">VAT (7%)</span>
                    <span className="font-mono font-medium text-zinc-800">
                      ฿{activePolicy.vat.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-emerald-50 p-2 rounded border border-emerald-200">
                    <span className="text-[10px] text-emerald-700 block uppercase font-bold">Gross Total</span>
                    <span className="font-mono font-bold text-emerald-900">
                      ฿{activePolicy.gross_premium.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer KYC & PDPA Vault Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-zinc-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Customer KYC & Identification</span>
                  <span className="text-[10px] font-normal text-zinc-400">Encrypted AES-256</span>
                </h3>
                <div className="p-4 bg-white rounded-lg border border-zinc-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-zinc-100">
                    <span className="text-zinc-500">Legal Insured Name</span>
                    <span className="font-medium text-zinc-900">{activePolicy.customer_name}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-zinc-500">Thai National ID / Passport</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-zinc-800 font-medium">
                        {activePolicy.is_id_unmasked
                          ? activePolicy.id_card_unmasked
                          : activePolicy.id_card_masked}
                      </span>
                      <button
                        onClick={() => {
                          if (!activePolicy.is_id_unmasked) {
                            setPdpaModalTarget(activePolicy);
                          } else {
                            setActivePolicy({ ...activePolicy, is_id_unmasked: false });
                          }
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                      >
                        {activePolicy.is_id_unmasked ? 'Mask' : 'Request Unmask'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Operational Checklist Flags (BRD BO-07: 6 checkboxes) */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                  Operational Checklist & Fulfillment Flags (BRD BO-07)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'is_paid', label: '1. Is Paid?' },
                    { key: 'is_broker_sent_to_insurer', label: '2. Sent to Insurer yet?' },
                    { key: 'is_insurer_confirmed', label: '3. Insurer confirmed policy yet?' },
                    { key: 'is_broker_got_hard_copy', label: '4. Got Hard Copy from Insurer?' },
                    { key: 'is_digital_sent_to_customer', label: '5. Sent Digital Policy to customer?' },
                    { key: 'is_real_hard_copy_sent', label: '6. Dispatched Real Hard Copy?' },
                  ].map((flag) => {
                    const checked = activePolicy.tracking_flags[flag.key as keyof TrackingFlags];
                    return (
                      <label
                        key={flag.key}
                        className={`flex items-center gap-2.5 p-2.5 rounded-md border cursor-pointer select-none transition-all ${
                          checked
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900 font-medium'
                            : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            handleToggleChecklistFlag(
                              activePolicy.policy_id,
                              flag.key as keyof TrackingFlags
                            )
                          }
                          className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                        />
                        <span>{flag.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic LOB Extension Tab (Screen 8.3.2) */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                  Line of Business Extension ({activePolicy.lob_code})
                </h3>
                <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200 text-xs">
                  {/* Motor Tab Preview */}
                  {activePolicy.lob_code === 'MOTOR' && activePolicy.extension_data.motor && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-zinc-500">License Plate</span>
                        <p className="font-semibold text-zinc-900">
                          {activePolicy.extension_data.motor.license_plate} (
                          {activePolicy.extension_data.motor.province})
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-500">Chassis No (VIN)</span>
                        <p className="font-mono font-semibold text-zinc-900">
                          {activePolicy.extension_data.motor.chassis_number}
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-500">OIC Vehicle Code</span>
                        <p className="font-semibold text-zinc-900">
                          {activePolicy.extension_data.motor.oic_code} (Sedan/Passenger)
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-500">Vehicle Sum Insured</span>
                        <p className="font-semibold text-emerald-700">
                          ฿{activePolicy.extension_data.motor.sum_insured.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Health Tab Preview */}
                  {activePolicy.lob_code === 'HEALTH' && activePolicy.extension_data.health && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-zinc-500">Biometrics</span>
                        <p className="font-semibold text-zinc-900">
                          {activePolicy.extension_data.health.height_cm} cm /{' '}
                          {activePolicy.extension_data.health.weight_kg} kg (BMI:{' '}
                          {activePolicy.extension_data.health.bmi})
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-500">Smoker Profile</span>
                        <p className="font-semibold text-zinc-900">
                          {activePolicy.extension_data.health.is_smoker ? 'Yes' : 'Non-smoker'}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-zinc-500">Pre-existing Condition Declarations</span>
                        <p className="font-medium text-zinc-800 bg-white p-2 rounded border border-zinc-200 mt-1">
                          {activePolicy.extension_data.health.pre_existing_conditions}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Travel Tab Preview */}
                  {activePolicy.lob_code === 'TRAVEL' && activePolicy.extension_data.travel && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-zinc-500">Trip Format</span>
                        <p className="font-semibold text-zinc-900">
                          {activePolicy.extension_data.travel.trip_duration_type}
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-500">Destination ISO Codes</span>
                        <p className="font-semibold text-zinc-900">
                          {activePolicy.extension_data.travel.destination_countries.join(', ')}
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-500">Total Insured Travelers</span>
                        <p className="font-semibold text-zinc-900">
                          {activePolicy.extension_data.travel.travelers_count} Persons
                        </p>
                      </div>
                    </div>
                  )}

                  {/* PA Tab Preview */}
                  {activePolicy.lob_code === 'PA' && activePolicy.extension_data.pa && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-zinc-500">Occupation Risk Class</span>
                        <p className="font-semibold text-zinc-900">
                          Class {activePolicy.extension_data.pa.occupation_class}
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-500">Motorcycle Rider Loading</span>
                        <p className="font-semibold text-zinc-900">
                          {activePolicy.extension_data.pa.has_motorcycle_risk ? 'Included' : 'Excluded'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Fire Tab Preview */}
                  {activePolicy.lob_code === 'FIRE' && activePolicy.extension_data.fire && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-zinc-500">Property Type</span>
                        <p className="font-semibold text-zinc-900">
                          {activePolicy.extension_data.fire.property_type}
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-500">Building Class</span>
                        <p className="font-semibold text-zinc-900">
                          {activePolicy.extension_data.fire.building_class}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions & Document Downloads */}
              <div className="pt-4 border-t border-zinc-200 flex items-center justify-between">
                <div className="flex gap-2">
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50">
                    <Download className="w-3.5 h-3.5 text-zinc-500" />
                    Download E-Schedule (PDF)
                  </button>
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50">
                    <FileText className="w-3.5 h-3.5 text-zinc-500" />
                    Audit Versions (SCD-2)
                  </button>
                </div>

                <button
                  onClick={() => setActivePolicy(null)}
                  className="px-4 py-1.5 text-xs font-medium bg-zinc-900 text-white rounded-md hover:bg-zinc-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. PDPA Security Modal (Audit Log Trigger - BRD SEC-03 / SDD 3.5.10)   */}
      {/* ==================================================================== */}
      {pdpaModalTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-zinc-200 shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2 bg-amber-50 rounded-full border border-amber-200">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">
                  PDPA PII Unmask Authorization
                </h3>
                <p className="text-xs text-zinc-500">
                  Scope required: <code className="text-amber-700 font-mono">pii:unmask</code>
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              In accordance with Thai PDPA and PAS governance regulations, revealing National ID
              Numbers generates an unalterable record in the <span className="font-mono text-zinc-800">audit_logs</span> table,
              storing your User ID, Timestamp, and IP Address.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">
                Operational Reason for Access <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                placeholder="e.g., Customer inquiry resolution, OIC inspection audit check..."
                value={pdpaReason}
                onChange={(e) => setPdpaReason(e.target.value)}
                className="w-full text-xs p-2.5 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-800 text-zinc-900 placeholder-zinc-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setPdpaModalTarget(null);
                  setPdpaReason('');
                }}
                className="px-3 py-1.5 text-xs font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!pdpaReason.trim()}
                onClick={handleConfirmUnmask}
                className="px-4 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                Authorize & Unmask
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PolicyDirectoryPage;