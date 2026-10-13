import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  CheckCircle2,
  Clock,
  Building2,
  AlertCircle,
  FileCheck2,
  ArrowUpRight,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert,
  Wallet,
  Check,
  X,
  Calendar,
  FileSpreadsheet
} from 'lucide-react';

// ==========================================
// 1. Data Contracts & Interfaces
// ==========================================

export type ReceivableStatus = 'PENDING' | 'RECEIVED' | 'DISPUTED';
export type SettlementMode = 'GROSS' | 'DIRECT_INSURER';
export type PayeeType = 'INSURER' | 'BROKER';

export interface CommissionReceivable {
  policy_id: string;
  policy_number: string;
  quotation_id: string;
  channel_name: string;
  customer_name: string;
  insurer_id: string;
  insurer_name: string;
  product_name: string;
  plan_name: string;
  gross_premium: number;
  commission_rate: number;
  gross_commission: number;
  wht_tax_deducted: number; // 3% WHT deducted by Insurer per Thai Revenue Department
  net_receivable: number;   // Gross - 3% WHT
  payee_type: PayeeType;
  settlement_mode: SettlementMode;
  is_commission_received: boolean;
  received_at: string | null;
  bank_reference?: string;
  effective_date: string;
  due_date: string;
  status: ReceivableStatus;
}

// ==========================================
// 2. Mock Data (Thai Insurance Environment)
// ==========================================

const INITIAL_RECEIVABLES: CommissionReceivable[] = [
  {
    policy_id: 'pol-001',
    policy_number: 'V-2026-90412',
    quotation_id: 'QT-2026-0019',
    channel_name: 'Website (Direct STP)',
    customer_name: 'Somchai Jaidee',
    insurer_id: 'ins-viriyah',
    insurer_name: 'Viriyah Insurance (วิริยะประกันภัย)',
    product_name: 'Motor Type 1 Comprehensive',
    plan_name: 'Gold Package (EV Coverage)',
    gross_premium: 22000.0,
    commission_rate: 18.0,
    gross_commission: 3960.0,
    wht_tax_deducted: 118.8,
    net_receivable: 3841.2,
    payee_type: 'INSURER',
    settlement_mode: 'DIRECT_INSURER',
    is_commission_received: false,
    received_at: null,
    effective_date: '2026-05-15',
    due_date: '2026-06-15',
    status: 'PENDING',
  },
  {
    policy_id: 'pol-002',
    policy_number: 'MSIG-2026-44120',
    quotation_id: 'QT-2026-0045',
    channel_name: 'Telesales',
    customer_name: 'Kanya Phonchai',
    insurer_id: 'ins-msig',
    insurer_name: 'MSIG Insurance Thailand',
    product_name: 'Travel Easy Worldwide',
    plan_name: 'Premier Global Tier 1',
    gross_premium: 4500.0,
    commission_rate: 22.0,
    gross_commission: 990.0,
    wht_tax_deducted: 29.7,
    net_receivable: 960.3,
    payee_type: 'BROKER',
    settlement_mode: 'GROSS',
    is_commission_received: false,
    received_at: null,
    effective_date: '2026-05-18',
    due_date: '2026-06-15',
    status: 'PENDING',
  },
  {
    policy_id: 'pol-003',
    policy_number: 'TIP-2026-11983',
    quotation_id: 'QT-2026-0082',
    channel_name: 'Sub-agent Network',
    customer_name: 'Apinya Srisawat',
    insurer_id: 'ins-dhipaya',
    insurer_name: 'Dhipaya Insurance (ทิพยประกันภัย)',
    product_name: 'Fire & Home Shield',
    plan_name: 'Executive Residence',
    gross_premium: 14000.0,
    commission_rate: 20.0,
    gross_commission: 2800.0,
    wht_tax_deducted: 84.0,
    net_receivable: 2716.0,
    payee_type: 'INSURER',
    settlement_mode: 'DIRECT_INSURER',
    is_commission_received: true,
    received_at: '2026-06-02T10:14:00Z',
    bank_reference: 'KBANK-INWARD-99120',
    effective_date: '2026-04-20',
    due_date: '2026-05-20',
    status: 'RECEIVED',
  },
  {
    policy_id: 'pol-004',
    policy_number: 'BKI-2026-88301',
    quotation_id: 'QT-2026-0104',
    channel_name: 'Direct Walk-in',
    customer_name: 'Chatchai Charoen',
    insurer_id: 'ins-bangkok',
    insurer_name: 'Bangkok Insurance (กรุงเทพประกันภัย)',
    product_name: 'Personal Accident Ultra',
    plan_name: 'Silver Family Shield',
    gross_premium: 8500.0,
    commission_rate: 15.0,
    gross_commission: 1275.0,
    wht_tax_deducted: 38.25,
    net_receivable: 1236.75,
    payee_type: 'INSURER',
    settlement_mode: 'DIRECT_INSURER',
    is_commission_received: false,
    received_at: null,
    effective_date: '2026-05-22',
    due_date: '2026-06-22',
    status: 'PENDING',
  },
  {
    policy_id: 'pol-005',
    policy_number: 'V-2026-90881',
    quotation_id: 'QT-2026-0155',
    channel_name: 'Telesales',
    customer_name: 'Nattapong Wattana',
    insurer_id: 'ins-viriyah',
    insurer_name: 'Viriyah Insurance (วิริยะประกันภัย)',
    product_name: 'Motor Voluntary Type 2+',
    plan_name: 'Standard Sedan',
    gross_premium: 12500.0,
    commission_rate: 17.5,
    gross_commission: 2187.5,
    wht_tax_deducted: 65.63,
    net_receivable: 2121.87,
    payee_type: 'BROKER',
    settlement_mode: 'GROSS',
    is_commission_received: true,
    received_at: '2026-06-03T14:40:00Z',
    bank_reference: 'SCB-INWARD-88712',
    effective_date: '2026-05-01',
    due_date: '2026-06-01',
    status: 'RECEIVED',
  },
];

const INSURERS_LIST = [
  { id: 'ALL', name: 'All Insurers (ทุกลุ่มบริษัทประกัน)' },
  { id: 'ins-viriyah', name: 'Viriyah Insurance (วิริยะประกันภัย)' },
  { id: 'ins-msig', name: 'MSIG Insurance Thailand' },
  { id: 'ins-dhipaya', name: 'Dhipaya Insurance (ทิพยประกันภัย)' },
  { id: 'ins-bangkok', name: 'Bangkok Insurance (กรุงเทพประกันภัย)' },
];

export const CommissionReceivablesPage: React.FC = () => {
  // ==========================================
  // 3. State Management
  // ==========================================
  const [data, setData] = useState<CommissionReceivable[]>(INITIAL_RECEIVABLES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInsurer, setSelectedInsurer] = useState('ALL');
  const [selectedStatusTab, setSelectedStatusTab] = useState<'ALL' | 'PENDING' | 'RECEIVED'>('ALL');
  const [selectedSettlementMode, setSelectedSettlementMode] = useState<string>('ALL');
  const [selectedPolicyIds, setSelectedPolicyIds] = useState<string[]>([]);
  
  // Modals & Drawers
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [settlementBankRef, setSettlementBankRef] = useState('');
  const [settlementNotes, setSettlementNotes] = useState('');
  const [inspectItem, setInspectItem] = useState<CommissionReceivable | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // ==========================================
  // 4. Filter Logic
  // ==========================================
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        item.policy_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.quotation_id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchInsurer = selectedInsurer === 'ALL' || item.insurer_id === selectedInsurer;
      const matchStatus =
        selectedStatusTab === 'ALL' ||
        (selectedStatusTab === 'PENDING' && !item.is_commission_received) ||
        (selectedStatusTab === 'RECEIVED' && item.is_commission_received);

      const matchMode =
        selectedSettlementMode === 'ALL' || item.settlement_mode === selectedSettlementMode;

      return matchSearch && matchInsurer && matchStatus && matchMode;
    });
  }, [data, searchQuery, selectedInsurer, selectedStatusTab, selectedSettlementMode]);

  // ==========================================
  // 5. Financial Aggregates & Ledger KPIs
  // ==========================================
  const metrics = useMemo(() => {
    const totalGross = data.reduce((acc, curr) => acc + curr.gross_commission, 0);
    const pendingItems = data.filter((item) => !item.is_commission_received);
    const pendingGross = pendingItems.reduce((acc, curr) => acc + curr.gross_commission, 0);
    const pendingNet = pendingItems.reduce((acc, curr) => acc + curr.net_receivable, 0);
    const pendingWHT = pendingItems.reduce((acc, curr) => acc + curr.wht_tax_deducted, 0);

    const receivedItems = data.filter((item) => item.is_commission_received);
    const receivedGross = receivedItems.reduce((acc, curr) => acc + curr.gross_commission, 0);
    const totalWHTAsset = data.reduce((acc, curr) => acc + curr.wht_tax_deducted, 0);

    return {
      totalGross,
      pendingGross,
      pendingNet,
      pendingWHT,
      pendingCount: pendingItems.length,
      receivedGross,
      receivedCount: receivedItems.length,
      totalWHTAsset,
    };
  }, [data]);

  // Selected Items for Bulk Settlement
  const selectedItems = useMemo(() => {
    return data.filter((d) => selectedPolicyIds.includes(d.policy_id));
  }, [data, selectedPolicyIds]);

  const selectedSummary = useMemo(() => {
    const gross = selectedItems.reduce((acc, curr) => acc + curr.gross_commission, 0);
    const wht = selectedItems.reduce((acc, curr) => acc + curr.wht_tax_deducted, 0);
    const net = selectedItems.reduce((acc, curr) => acc + curr.net_receivable, 0);
    return { gross, wht, net, count: selectedItems.length };
  }, [selectedItems]);

  // ==========================================
  // 6. Action Handlers (FIN-05 & Settlement)
  // ==========================================

  // Toggle Single Policy Manual Flag (FIN-05: Get Commission from Insurer Yet?)
  const handleToggleCommissionFlag = (policyId: string) => {
    setData((prev) =>
      prev.map((item) => {
        if (item.policy_id === policyId) {
          const nextReceived = !item.is_commission_received;
          return {
            ...item,
            is_commission_received: nextReceived,
            status: nextReceived ? 'RECEIVED' : 'PENDING',
            received_at: nextReceived ? new Date().toISOString() : null,
            bank_reference: nextReceived ? (item.bank_reference || 'MANUAL-OPS-CONFIRMED') : undefined,
          };
        }
        return item;
      })
    );

    const target = data.find((d) => d.policy_id === policyId);
    showNotification(
      `Flag updated for ${target?.policy_number}: ${!target?.is_commission_received ? 'Marked as Received' : 'Reverted to Pending'}`,
      'info'
    );
  };

  // Bulk Selection Checkboxes
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedPolicyIds(filteredData.map((d) => d.policy_id));
    } else {
      setSelectedPolicyIds([]);
    }
  };

  const handleSelectOne = (policyId: string) => {
    setSelectedPolicyIds((prev) =>
      prev.includes(policyId) ? prev.filter((id) => id !== policyId) : [...prev, policyId]
    );
  };

  // Execute Insurer Receivable Settlement (POST /admin/ledger/insurer-receivables/{insurer_id}/settle)
  const handleConfirmBatchSettle = () => {
    if (!settlementBankRef.trim()) {
      alert('Please enter bank deposit reference code.');
      return;
    }

    const now = new Date().toISOString();
    setData((prev) =>
      prev.map((item) => {
        if (selectedPolicyIds.includes(item.policy_id)) {
          return {
            ...item,
            is_commission_received: true,
            status: 'RECEIVED',
            received_at: now,
            bank_reference: settlementBankRef,
          };
        }
        return item;
      })
    );

    showNotification(
      `Successfully reconciled ${selectedPolicyIds.length} receivable entries. Total Net Inward: ฿${selectedSummary.net.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    );

    setSelectedPolicyIds([]);
    setIsSettleModalOpen(false);
    setSettlementBankRef('');
    setSettlementNotes('');
  };

  return (
    // Note: The parent <main> has "p-6". We use -mt-6 -mx-6 pt-0 to strictly remove padding on the top container.
    <div className="-mt-6 -mx-6 flex flex-col min-h-full bg-zinc-50 text-zinc-900 antialiased font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-6 z-50 flex items-center gap-3 bg-white border border-emerald-300 text-emerald-900 px-4 py-3 rounded-lg shadow-xl shadow-zinc-200/50 transition-all">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-medium">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-zinc-400 hover:text-zinc-700 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ==========================================
          Header Section (Flush to top border)
          ========================================== */}
      <div className="bg-white border-b border-zinc-200 px-6 py-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              <span>Finance & Operations</span>
              <span>/</span>
              <span>Ledger & Reconciliation</span>
              <span>/</span>
              <span className="text-blue-600">REP-04 Compliance</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Commission Receivables Ledger
            </h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Track outstanding broker commission owed by insurers under Gross Settlement (Deduct After) and Direct-to-Carrier payment collections.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => showNotification('Exporting official Por.Lor. / Receivable CSV Statement...', 'info')}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition shadow-sm"
            >
              <Download className="w-4 h-4 text-zinc-500" />
              <span>Export CSV</span>
            </button>

            <button
              disabled={selectedPolicyIds.length === 0}
              onClick={() => setIsSettleModalOpen(true)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition ${
                selectedPolicyIds.length > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Batch Settle ({selectedPolicyIds.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==========================================
          KPI Summary Cards
          ========================================== */}
      <div className="px-6 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Gross Receivable */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Commission Earned</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-zinc-900">
              ฿{metrics.totalGross.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5">
              <span>Across {data.length} issued policies</span>
            </div>
          </div>
        </div>

        {/* Card 2: Pending Inward (Action Required) */}
        <div className="bg-white p-5 rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-800 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending from Insurers</span>
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-900">
              ฿{metrics.pendingGross.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-amber-700 font-medium mt-1 flex items-center justify-between">
              <span>{metrics.pendingCount} policies uncollected</span>
              <span>Net: ฿{metrics.pendingNet.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Received / Reconciled */}
        <div className="bg-white p-5 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-800 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Reconciled / Collected</span>
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-900">
              ฿{metrics.receivedGross.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-emerald-700 font-medium mt-1">
              <span>{metrics.receivedCount} policies credited to Trust Ledger</span>
            </div>
          </div>
        </div>

        {/* Card 4: Prepaid WHT (3% Asset GL) */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Prepaid WHT (3% Asset)</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-950">
              ฿{metrics.totalWHTAsset.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              <span>Thai Revenue Code 50 Tawi Asset</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          Filters & Query Controls
          ========================================== */}
      <div className="px-6 mb-4">
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Policy No, Quotation ID, Insured Name..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Insurer Selector */}
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-zinc-400" />
              <select
                value={selectedInsurer}
                onChange={(e) => setSelectedInsurer(e.target.value)}
                className="text-sm bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {INSURERS_LIST.map((ins) => (
                  <option key={ins.id} value={ins.id}>
                    {ins.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Settlement Mode Selector */}
            <select
              value={selectedSettlementMode}
              onChange={(e) => setSelectedSettlementMode(e.target.value)}
              className="text-sm bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Settlement Modes</option>
              <option value="DIRECT_INSURER">Direct Insurer Collection (Scenario B)</option>
              <option value="GROSS">Gross Settlement (Deduct After)</option>
            </select>

            {/* Status Tabs */}
            <div className="inline-flex rounded-lg border border-zinc-200 p-0.5 bg-zinc-100">
              <button
                onClick={() => setSelectedStatusTab('ALL')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                  selectedStatusTab === 'ALL'
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                All ({data.length})
              </button>
              <button
                onClick={() => setSelectedStatusTab('PENDING')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                  selectedStatusTab === 'PENDING'
                    ? 'bg-white text-amber-700 shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Pending ({metrics.pendingCount})
              </button>
              <button
                onClick={() => setSelectedStatusTab('RECEIVED')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                  selectedStatusTab === 'RECEIVED'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Received ({metrics.receivedCount})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          Data Grid / Interactive Table
          ========================================== */}
      <div className="px-6 flex-1 pb-10">
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-zinc-100/75 border-b border-zinc-200 text-zinc-600 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredData.length > 0 &&
                        selectedPolicyIds.length === filteredData.length
                      }
                      onChange={handleSelectAll}
                      className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Policy & Product</th>
                  <th className="py-3.5 px-4">Insurer</th>
                  <th className="py-3.5 px-4">Customer & Origin</th>
                  <th className="py-3.5 px-4 text-right">Gross Premium</th>
                  <th className="py-3.5 px-4 text-right">Comm % / Gross</th>
                  <th className="py-3.5 px-4 text-right">WHT (3%)</th>
                  <th className="py-3.5 px-4 text-right font-bold text-zinc-800">Net Receivable</th>
                  <th className="py-3.5 px-4 text-center">FIN-05 Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-zinc-500">
                      <AlertCircle className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                      <p className="font-medium text-base text-zinc-700">No receivable records found</p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Try modifying your search or changing the insurer filter.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => {
                    const isSelected = selectedPolicyIds.includes(item.policy_id);
                    return (
                      <tr
                        key={item.policy_id}
                        className={`hover:bg-zinc-50/80 transition-colors ${
                          isSelected ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-4 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectOne(item.policy_id)}
                            className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                          />
                        </td>

                        {/* Policy & Product */}
                        <td className="py-4 px-4">
                          <div className="font-semibold text-zinc-900 font-mono text-xs">
                            {item.policy_number}
                          </div>
                          <div className="text-xs font-medium text-zinc-600 mt-0.5">
                            {item.product_name}
                          </div>
                          <div className="text-[11px] text-zinc-400">
                            {item.plan_name}
                          </div>
                        </td>

                        {/* Insurer */}
                        <td className="py-4 px-4">
                          <div className="text-xs font-semibold text-zinc-800">
                            {item.insurer_name}
                          </div>
                          <span
                            className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mt-1 ${
                              item.settlement_mode === 'DIRECT_INSURER'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {item.settlement_mode === 'DIRECT_INSURER'
                              ? 'Direct to Carrier'
                              : 'Gross Remit (SOA)'}
                          </span>
                        </td>

                        {/* Customer */}
                        <td className="py-4 px-4">
                          <div className="text-xs font-medium text-zinc-900">
                            {item.customer_name}
                          </div>
                          <div className="text-[11px] text-zinc-500 mt-0.5">
                            {item.channel_name}
                          </div>
                        </td>

                        {/* Gross Premium */}
                        <td className="py-4 px-4 text-right font-mono text-xs text-zinc-700">
                          ฿{item.gross_premium.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Commission Rate & Gross Commission */}
                        <td className="py-4 px-4 text-right">
                          <div className="font-semibold text-xs font-mono text-zinc-900">
                            ฿{item.gross_commission.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[11px] text-zinc-500">
                            ({item.commission_rate}%)
                          </div>
                        </td>

                        {/* WHT 3% */}
                        <td className="py-4 px-4 text-right font-mono text-xs text-purple-700">
                          -฿{item.wht_tax_deducted.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Net Receivable */}
                        <td className="py-4 px-4 text-right font-mono text-xs font-bold text-zinc-900">
                          ฿{item.net_receivable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>

                        {/* FIN-05 Manual Tracking Toggle */}
                        <td className="py-4 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <button
                              onClick={() => handleToggleCommissionFlag(item.policy_id)}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                                item.is_commission_received ? 'bg-emerald-600' : 'bg-zinc-300'
                              }`}
                              title="FIN-05: Click to toggle Get Commission From Insurer Yet?"
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  item.is_commission_received ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                            <span
                              className={`text-[10px] font-semibold uppercase tracking-wider ${
                                item.is_commission_received
                                  ? 'text-emerald-700'
                                  : 'text-amber-600'
                              }`}
                            >
                              {item.is_commission_received ? 'Received' : 'Pending'}
                            </span>
                          </div>
                        </td>

                        {/* Action Column */}
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => setInspectItem(item)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition px-2 py-1 rounded hover:bg-blue-50"
                          >
                            <span>Ledger</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Summary Bar */}
          <div className="bg-zinc-50 border-t border-zinc-200 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-600 gap-2">
            <div>
              Showing <span className="font-semibold text-zinc-900">{filteredData.length}</span> of{' '}
              <span className="font-semibold text-zinc-900">{data.length}</span> policy receivables
            </div>

            <div className="flex items-center gap-4 font-mono">
              <span>
                Total Filtered Net:{' '}
                <strong className="text-zinc-900 font-bold">
                  ฿{filteredData.reduce((acc, c) => acc + c.net_receivable, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          Batch Settlement Modal (Maker-Checker / Settle Action)
          POST /admin/ledger/insurer-receivables/{insurer_id}/settle
          ========================================== */}
      {isSettleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-zinc-900 text-base">
                  Reconcile Insurer Receivable Settlement
                </h3>
              </div>
              <button
                onClick={() => setIsSettleModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 leading-relaxed">
                <strong>TRD Statutory Accounting Note:</strong> This inward settlement automatically books
                the calculated <strong>3% Withholding Tax</strong> to the <em>Prepaid WHT Asset GL</em> and
                offsets the carrier accounts receivable.
              </div>

              {/* Settlement Summary Breakdown */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>Selected Policies:</span>
                  <span className="font-semibold text-zinc-900">{selectedSummary.count} records</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Gross Commission Incurred:</span>
                  <span className="font-mono font-medium text-zinc-800">
                    ฿{selectedSummary.gross.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-purple-700">
                  <span>Deducted Withholding Tax (3% WHT):</span>
                  <span className="font-mono font-medium">
                    -฿{selectedSummary.wht.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="border-t border-zinc-200 pt-2 flex justify-between text-sm font-bold text-zinc-900">
                  <span>Net Inward Settlement (Baht):</span>
                  <span className="font-mono text-blue-600">
                    ฿{selectedSummary.net.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Input: Bank Reference Code */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Bank Reference / Inward Remittance ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={settlementBankRef}
                  onChange={(e) => setSettlementBankRef(e.target.value)}
                  placeholder="e.g. KBANK-TRACE-2026-9901"
                  className="w-full text-sm px-3.5 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Input: Notes */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Reconciliation Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={settlementNotes}
                  onChange={(e) => setSettlementNotes(e.target.value)}
                  placeholder="e.g. Cleared via Viriyah EOM Bordereau Wire"
                  className="w-full text-sm px-3.5 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-zinc-200 bg-zinc-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsSettleModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBatchSettle}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
              >
                Confirm Settlement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          Inspection Slide-over Drawer (Audit & GL)
          ========================================== */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-zinc-200 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Ledger Snapshot
                </div>
                <h3 className="font-bold text-zinc-900 text-lg">
                  {inspectItem.policy_number}
                </h3>
              </div>
              <button
                onClick={() => setInspectItem(null)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6 text-sm">
              {/* Status Banner */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  inspectItem.is_commission_received
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {inspectItem.is_commission_received ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-600" />
                  )}
                  <div>
                    <div className="font-bold text-xs uppercase">
                      {inspectItem.is_commission_received ? 'Settled & Received' : 'Pending From Insurer'}
                    </div>
                    <div className="text-xs opacity-80">
                      {inspectItem.received_at
                        ? `Reconciled: ${new Date(inspectItem.received_at).toLocaleDateString()}`
                        : `Payment due: ${inspectItem.due_date}`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Policy & Product Spec */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Contract Attribution
                </h4>
                <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Customer:</span>
                    <span className="font-semibold text-zinc-900">{inspectItem.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Insurer:</span>
                    <span className="font-semibold text-zinc-900">{inspectItem.insurer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Product Line:</span>
                    <span className="font-medium text-zinc-800">{inspectItem.product_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Sales Origin:</span>
                    <span className="text-zinc-700">{inspectItem.channel_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Quotation ID:</span>
                    <span className="font-mono text-zinc-600">{inspectItem.quotation_id}</span>
                  </div>
                </div>
              </div>

              {/* Double-Entry Journal Calculation */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Accounting & Tax Matrix
                </h4>
                <div className="border border-zinc-200 rounded-lg divide-y divide-zinc-200 text-xs">
                  <div className="p-3 flex justify-between bg-zinc-50/50">
                    <span className="text-zinc-600">Gross Contract Premium</span>
                    <span className="font-mono font-medium text-zinc-900">
                      ฿{inspectItem.gross_premium.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-zinc-600">Base Commission Rate</span>
                    <span className="font-mono font-medium text-zinc-900">
                      {inspectItem.commission_rate}%
                    </span>
                  </div>
                  <div className="p-3 flex justify-between bg-blue-50/30">
                    <span className="font-semibold text-blue-900">Gross Receivable Commission</span>
                    <span className="font-mono font-bold text-blue-700">
                      ฿{inspectItem.gross_commission.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-purple-700">Withholding Tax (3% WHT Deducted)</span>
                    <span className="font-mono font-medium text-purple-700">
                      -฿{inspectItem.wht_tax_deducted.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="p-3 flex justify-between bg-emerald-50/40 text-sm font-bold text-emerald-950">
                    <span>Net Baht Inward Expected</span>
                    <span className="font-mono text-emerald-700">
                      ฿{inspectItem.net_receivable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bank Reference Trace */}
              {inspectItem.bank_reference && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Bank Reference Audit
                  </h4>
                  <div className="p-3 rounded-lg bg-zinc-100 border border-zinc-200 text-xs font-mono text-zinc-800">
                    {inspectItem.bank_reference}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center gap-3">
              <button
                onClick={() => {
                  handleToggleCommissionFlag(inspectItem.policy_id);
                  setInspectItem(null);
                }}
                className={`w-full py-2.5 px-4 text-xs font-semibold rounded-lg shadow-sm transition ${
                  inspectItem.is_commission_received
                    ? 'bg-zinc-200 text-zinc-800 hover:bg-zinc-300'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {inspectItem.is_commission_received ? 'Revert to Pending' : 'Mark as Received (FIN-05)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommissionReceivablesPage;