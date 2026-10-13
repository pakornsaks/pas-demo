import React, { useState, useId } from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Send,
  Ban,
  TrendingDown,
  Layers,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';

// --- Types based on PAS Schema & Requirements ---

export type InstallmentStatus = 'PENDING' | 'PAID' | 'OVERDUE';
export type PolicyStatus = 'ACTIVE' | 'PENDING_OFFICIAL_NUMBER' | 'SUSPENDED' | 'CANCELLED';

export interface OverduePolicyItem {
  policyId: string;
  policyNumber: string;
  customerName: string;
  phone: string;
  channelName: string;
  cycleNumber: number;
  expectedAmount: number;
  dueDate: string;
  daysOverdue: number;
  autoCancelOffsetDays: number;
}

export interface InstallmentWarningItem {
  installmentId: string;
  policyId: string;
  policyNumber: string;
  customerName: string;
  channelName: string;
  cycleNumber: number;
  expectedAmount: number;
  dueDate: string;
  daysUntilDue: number;
  warningStatus: 'REMINDER_QUEUED' | 'REMINDER_SENT' | 'PENDING_ACTION';
}

export interface CancelledPolicyItem {
  policyId: string;
  policyNumber: string;
  customerName: string;
  cancellationDate: string;
  reasonCode: 'CUSTOMER_REQUEST' | 'NON_PAYMENT' | 'INSTALLMENT_EXHAUSTION';
  paidPremium: number;
  refundAmount: number;
  clawbackAmount: number;
  isExhausted: boolean;
}

// --- Mock Data ---

const MOCK_METRICS = {
  totalSoldPolicies: 1420,
  totalMoneyKeptByBroker: 12450800.0, // THB
  totalOverdueAmount: 384500.0, // THB
  totalUpcomingDueAmount: 892000.0, // THB
};

const MOCK_OVERDUE_POLICIES: OverduePolicyItem[] = [
  {
    policyId: 'POL-2026-9011',
    policyNumber: 'V-MTR-883192',
    customerName: 'Somchai Prasert',
    phone: '081-456-7890',
    channelName: 'Telesales',
    cycleNumber: 2,
    expectedAmount: 2500.0,
    dueDate: '2026-03-25',
    daysOverdue: 19,
    autoCancelOffsetDays: 0,
  },
  {
    policyId: 'POL-2026-9045',
    policyNumber: 'TMP-2026-0045',
    customerName: 'Anong Rattana',
    phone: '089-112-3344',
    channelName: 'Sub agent',
    cycleNumber: 3,
    expectedAmount: 3200.0,
    dueDate: '2026-04-02',
    daysOverdue: 11,
    autoCancelOffsetDays: 30,
  },
  {
    policyId: 'POL-2026-9102',
    policyNumber: 'TI-TRV-102941',
    customerName: 'Kittisak Wong',
    phone: '082-789-9901',
    channelName: 'Website',
    cycleNumber: 2,
    expectedAmount: 1850.0,
    dueDate: '2026-04-05',
    daysOverdue: 8,
    autoCancelOffsetDays: 7,
  },
];

const MOCK_WARNING_QUEUE: InstallmentWarningItem[] = [
  {
    installmentId: 'INST-1029',
    policyId: 'POL-2026-9881',
    policyNumber: 'BKI-FIR-556102',
    customerName: 'Siriporn Bunnak',
    channelName: 'Website',
    cycleNumber: 2,
    expectedAmount: 4500.0,
    dueDate: '2026-04-16',
    daysUntilDue: 3,
    warningStatus: 'REMINDER_QUEUED',
  },
  {
    installmentId: 'INST-1030',
    policyId: 'POL-2026-9904',
    customerName: 'Natthaphol Chot',
    policyNumber: 'V-MTR-990142',
    channelName: 'Direct sale',
    cycleNumber: 2,
    expectedAmount: 2800.0,
    dueDate: '2026-04-15',
    daysUntilDue: 2,
    warningStatus: 'REMINDER_SENT',
  },
  {
    installmentId: 'INST-1031',
    policyId: 'POL-2026-9930',
    customerName: 'Wichai Thanakorn',
    policyNumber: 'BKI-MTR-440192',
    channelName: 'Sub agent',
    cycleNumber: 3,
    expectedAmount: 3400.0,
    dueDate: '2026-04-14',
    daysUntilDue: 1,
    warningStatus: 'PENDING_ACTION',
  },
];

const MOCK_CANCELLED_POLICIES: CancelledPolicyItem[] = [
  {
    policyId: 'POL-2026-8700',
    policyNumber: 'V-MTR-776211',
    customerName: 'Kornkanok Suk',
    cancellationDate: '2026-04-10',
    reasonCode: 'INSTALLMENT_EXHAUSTION',
    paidPremium: 5250.0,
    refundAmount: 0.0,
    clawbackAmount: 0.0,
    isExhausted: true,
  },
  {
    policyId: 'POL-2026-8512',
    policyNumber: 'TI-MTR-102451',
    customerName: 'Prasit Charoen',
    cancellationDate: '2026-04-08',
    reasonCode: 'CUSTOMER_REQUEST',
    paidPremium: 15000.0,
    refundAmount: 6250.0,
    clawbackAmount: 1125.0,
    isExhausted: false,
  },
  {
    policyId: 'POL-2026-8401',
    policyNumber: 'MS-TRV-998124',
    customerName: 'Mayura Thep',
    cancellationDate: '2026-04-02',
    reasonCode: 'NON_PAYMENT',
    paidPremium: 4200.0,
    refundAmount: 0.0,
    clawbackAmount: 756.0,
    isExhausted: false,
  },
];

export const CollectionInstallmentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overdue' | 'warning' | 'cancelled'>('overdue');
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [selectedPolicy, setSelectedPolicy] = useState<OverduePolicyItem | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelOption, setCancelOption] = useState<'IMMEDIATE' | 'EXHAUSTION'>('EXHAUSTION');
  const [refundAmount, setRefundAmount] = useState<string>('0.00');
  const searchInputId = useId();
  const channelFilterId = useId();
  const refundAmountInputId = useId();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const handleSendFollowUp = (policyNumber: string) => {
    alert(`Triggered SMS & Email follow-up reminder for policy: ${policyNumber}`);
  };

  const handleOpenCancelModal = (policy: OverduePolicyItem) => {
    setSelectedPolicy(policy);
    setIsCancelModalOpen(true);
  };

  const handleExecuteCancellation = () => {
    if (!selectedPolicy) return;
    if (cancelOption === 'EXHAUSTION') {
      alert(`Policy ${selectedPolicy.policyNumber} set to "Cancel When Exhausted". Pro-rata scheduled cancellation queued with 0.00 THB refund.`);
    } else {
      alert(`Policy ${selectedPolicy.policyNumber} cancelled immediately with refund amount: THB ${refundAmount}. Clawback workflow staged.`);
    }
    setIsCancelModalOpen(false);
    setSelectedPolicy(null);
  };

  return (
    <div className="space-y-6">
      {/* Title & Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            Collection & Installment Dashboard
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            BRD 8.7.4 & Module 4 — Monitor premium cash positions, aging receivables, and installment default triage.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Ledger Sync Active
          </span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Total Sold Policies */}
        <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Total Sold Policies</span>
            <div className="p-1.5 bg-zinc-100 rounded text-zinc-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-zinc-900">
              {MOCK_METRICS.totalSoldPolicies.toLocaleString()}
            </span>
            <span className="text-xs text-zinc-500">units</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Active + Converted Contracts</p>
        </div>

        {/* KPI 2: Money Kept by Broker */}
        <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Money Kept by Broker</span>
            <div className="p-1.5 bg-blue-50 rounded text-blue-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
            {formatCurrency(MOCK_METRICS.totalMoneyKeptByBroker)}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Trust Account aggregate holding</p>
        </div>

        {/* KPI 3: Overdue Amount */}
        <div className="bg-white border border-red-200 rounded-lg p-4 shadow-sm bg-gradient-to-br from-white to-red-50/30">
          <div className="flex items-center justify-between text-red-600 text-xs font-medium">
            <span>Total Overdue Amount</span>
            <div className="p-1.5 bg-red-100 rounded text-red-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-red-600">
            {formatCurrency(MOCK_METRICS.totalOverdueAmount)}
          </div>
          <p className="text-[11px] text-red-500 font-medium mt-1">Requires immediate collections triage</p>
        </div>

        {/* KPI 4: Upcoming Due */}
        <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium">
            <span>Upcoming Due Amount</span>
            <div className="p-1.5 bg-amber-50 rounded text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
            {formatCurrency(MOCK_METRICS.totalUpcomingDueAmount)}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Due within next 7 days</p>
        </div>
      </div>

      {/* Main Operational Card */}
      <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-200 px-6 pt-3 bg-zinc-50/50">
          <button
            onClick={() => setActiveTab('overdue')}
            className={`flex items-center gap-2 pb-3 px-1 text-xs font-semibold border-b-2 transition-colors mr-6 ${
              activeTab === 'overdue'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Overdue Policies Queue
            <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-red-100 text-red-700 font-bold">
              {MOCK_OVERDUE_POLICIES.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('warning')}
            className={`flex items-center gap-2 pb-3 px-1 text-xs font-semibold border-b-2 transition-colors mr-6 ${
              activeTab === 'warning'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            Installment Warning Queue
            <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-zinc-200 text-zinc-800">
              {MOCK_WARNING_QUEUE.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('cancelled')}
            className={`flex items-center gap-2 pb-3 px-1 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'cancelled'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            Cancelled Policies Ledger
            <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-zinc-200 text-zinc-800">
              {MOCK_CANCELLED_POLICIES.length}
            </span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 border-b border-zinc-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <label htmlFor={searchInputId} className="sr-only">Search</label>
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              id={searchInputId}
              type="text"
              placeholder="Search policy, customer, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label htmlFor={channelFilterId} className="sr-only">Filter by channel</label>
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-zinc-400" />
              <select
                id={channelFilterId}
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="text-xs bg-zinc-50 border border-zinc-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                <option value="ALL">All Sales Channels</option>
                <option value="Telesales">Telesales</option>
                <option value="Direct sale">Direct sale</option>
                <option value="Website">Website</option>
                <option value="Sub agent">Sub agent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {/* TAB 1: OVERDUE QUEUE */}
          {activeTab === 'overdue' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Policy No.</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4 text-center">Cycle</th>
                  <th className="py-3 px-4">Expected Amount</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Aging / Offset</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-xs">
                {MOCK_OVERDUE_POLICIES.map((item) => (
                  <tr key={item.policyId} className="hover:bg-red-50/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-zinc-900">{item.policyNumber}</div>
                      <div className="text-[10px] text-zinc-400">{item.policyId}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-zinc-800">{item.customerName}</div>
                      <div className="text-[10px] text-zinc-500">{item.phone}</div>
                    </td>
                    <td className="py-3 px-4 text-zinc-600">{item.channelName}</td>
                    <td className="py-3 px-4 text-center font-medium">#{item.cycleNumber}</td>
                    <td className="py-3 px-4 font-semibold text-red-600">
                      {formatCurrency(item.expectedAmount)}
                    </td>
                    <td className="py-3 px-4 text-zinc-600">{item.dueDate}</td>
                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1 text-red-600 font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {item.daysOverdue} days past due
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">
                        Grace offset: {item.autoCancelOffsetDays}d
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleSendFollowUp(item.policyNumber)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        Send Follow-up
                      </button>
                      <button
                        onClick={() => handleOpenCancelModal(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded transition-colors"
                      >
                        <Ban className="w-3 h-3" />
                        Triage Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TAB 2: WARNING QUEUE */}
          {activeTab === 'warning' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Policy No.</th>
                  <th className="py-3 px-4">Insured Customer</th>
                  <th className="py-3 px-4">Channel Origin</th>
                  <th className="py-3 px-4 text-center">Cycle</th>
                  <th className="py-3 px-4">Installment Due</th>
                  <th className="py-3 px-4">Scheduled Date</th>
                  <th className="py-3 px-4">Warning Trigger</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-xs">
                {MOCK_WARNING_QUEUE.map((item) => (
                  <tr key={item.installmentId} className="hover:bg-zinc-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-zinc-900">{item.policyNumber}</div>
                      <div className="text-[10px] text-zinc-400">{item.installmentId}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-zinc-800">{item.customerName}</td>
                    <td className="py-3 px-4 text-zinc-600">{item.channelName}</td>
                    <td className="py-3 px-4 text-center font-medium">#{item.cycleNumber}</td>
                    <td className="py-3 px-4 font-semibold text-zinc-900">
                      {formatCurrency(item.expectedAmount)}
                    </td>
                    <td className="py-3 px-4 text-zinc-600">{item.dueDate}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        Due in {item.daysUntilDue} day{item.daysUntilDue > 1 ? 's' : ''}
                      </span>
                      <div className="text-[10px] text-zinc-400">
                        {item.warningStatus === 'REMINDER_SENT' ? 'Reminder dispatched' : 'Scheduled SMS queued'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleSendFollowUp(item.policyNumber)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        Send Reminder
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TAB 3: CANCELLED POLICIES LEDGER */}
          {activeTab === 'cancelled' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Policy No.</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Termination Date</th>
                  <th className="py-3 px-4">Reason / Protocol</th>
                  <th className="py-3 px-4">Paid Premium</th>
                  <th className="py-3 px-4">Refund to Client</th>
                  <th className="py-3 px-4">Agent Clawback</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-xs">
                {MOCK_CANCELLED_POLICIES.map((item) => (
                  <tr key={item.policyId} className="hover:bg-zinc-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-zinc-900">{item.policyNumber}</td>
                    <td className="py-3 px-4 text-zinc-800">{item.customerName}</td>
                    <td className="py-3 px-4 text-zinc-600">{item.cancellationDate}</td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-zinc-700">{item.reasonCode}</span>
                      {item.isExhausted && (
                        <span className="block text-[10px] text-purple-700 font-semibold">
                          Pro-Rata Exhaustion (No Refund)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-700">{formatCurrency(item.paidPremium)}</td>
                    <td className="py-3 px-4 font-medium text-zinc-900">
                      {formatCurrency(item.refundAmount)}
                    </td>
                    <td className="py-3 px-4 text-red-600 font-medium">
                      {item.clawbackAmount > 0 ? `-${formatCurrency(item.clawbackAmount)}` : '0.00 THB'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                        <CheckCircle2 className="w-3 h-3 text-zinc-500" />
                        Settled
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Triage Cancellation Modal (Handlers C & D) */}
      {isCancelModalOpen && selectedPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl border border-zinc-200 max-w-lg w-full p-6 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-2 text-red-600">
                <Ban className="w-5 h-5" />
                <h3 className="font-bold text-sm text-zinc-900">Installment Cancellation Triage</h3>
              </div>
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="bg-zinc-50 p-3 rounded border border-zinc-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Target Policy:</span>
                  <span className="font-semibold text-zinc-800">{selectedPolicy.policyNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Insured:</span>
                  <span className="font-semibold text-zinc-800">{selectedPolicy.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Overdue Cycle:</span>
                  <span className="font-semibold text-red-600">
                    Cycle #{selectedPolicy.cycleNumber} ({formatCurrency(selectedPolicy.expectedAmount)})
                  </span>
                </div>
              </div>

              {/* Handler Selection */}
              <div>
                <label className="block font-semibold text-zinc-700 mb-2">
                  Select Cancellation Handling Method (BRD 7.3 Case D):
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 p-3 border rounded cursor-pointer hover:bg-zinc-50 transition-colors border-zinc-200">
                    <input
                      type="radio"
                      name="cancelProtocol"
                      checked={cancelOption === 'EXHAUSTION'}
                      onChange={() => setCancelOption('EXHAUSTION')}
                      className="mt-0.5 text-zinc-900 focus:ring-zinc-900"
                    />
                    <div>
                      <div className="font-semibold text-zinc-900">
                        Cancel When Money Is Exhausted (Recommended)
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        Coverage stays active until pro-rata value of collected installments reaches 0. No customer refund, Agent Clawback = 0.00 THB.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 border rounded cursor-pointer hover:bg-zinc-50 transition-colors border-zinc-200">
                    <input
                      type="radio"
                      name="cancelProtocol"
                      checked={cancelOption === 'IMMEDIATE'}
                      onChange={() => setCancelOption('IMMEDIATE')}
                      className="mt-0.5 text-zinc-900 focus:ring-zinc-900"
                    />
                    <div>
                      <div className="font-semibold text-zinc-900">
                        Cancel Immediately & Refund (Manual Override)
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        Terminates coverage immediately. Operations inputs fiat refund amount; automatically schedules commission clawback.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {cancelOption === 'IMMEDIATE' && (
                <div className="p-3 bg-red-50/50 border border-red-200 rounded">
                  <label htmlFor={refundAmountInputId} className="block font-medium text-red-900 mb-1">
                    Manual Customer Refund Amount (THB):
                  </label>
                  <input
                    id={refundAmountInputId}
                    type="number"
                    step="0.01"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-red-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-red-600"
                  />
                  <span className="text-[10px] text-red-600 mt-1 block">
                    Requires Maker-Checker approval before general ledger debit.
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-800 bg-white border border-zinc-300 rounded hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteCancellation}
                className="px-4 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded shadow-sm"
              >
                Confirm Cancellation Protocol
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionInstallmentsPage;