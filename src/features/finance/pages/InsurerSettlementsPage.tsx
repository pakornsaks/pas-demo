import React, { useState, useMemo } from 'react';
import {
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  Download,
  Send,
  ShieldCheck,
  Eye,
  RefreshCw,
  Clock,
  DollarSign,
  ChevronRight,
  X,
  FileCheck2,
  AlertCircle,
  HelpCircle,
  Check,
  Ban
} from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS (Alinged with PAS SDD Section 4.7, 4.8 & 5.13)
// ============================================================================

export type SettlementMode = 'NET' | 'GROSS';
export type ReconcileStatus = 'PENDING' | 'RECONCILED' | 'DISPUTED';
export type BordereauStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'SETTLED' | 'REJECTED';

export interface InsurerPayableLineItem {
  transaction_id: string;
  gateway_ref_id: string;
  policy_id: string;
  policy_number: string;
  reference_number: string;
  customer_name_masked: string;
  lob_code: 'MOTOR' | 'HEALTH' | 'FIRE' | 'TRAVEL';
  collection_timestamp: string;
  gross_premium: number;
  base_commission_percent: number;
  broker_commission_amount: number;
  vat_on_commission: number; // 7% VAT
  wht_on_commission: number; // 3% WHT
  net_payable_to_insurer: number;
  settlement_mode: SettlementMode;
  reconciliation_status: ReconcileStatus;
  dispute_reason?: string;
  is_paid_to_insurer: boolean;
}

export interface CommissionReceivableLineItem {
  receivable_id: string;
  policy_id: string;
  policy_number: string;
  customer_name_masked: string;
  lob_code: string;
  effective_date: string;
  gross_premium_collected_by_insurer: number;
  commission_percent: number;
  gross_commission_amount: number;
  statutory_wht_3_percent: number;
  net_receivable_amount: number;
  is_commission_received: boolean;
  insurer_settlement_ref?: string;
}

export interface BordereauBatch {
  settlement_id: string;
  insurer_id: string;
  insurer_name: string;
  cutoff_period: string;
  policy_count: number;
  gross_collected_amount: number;
  commission_deducted: number;
  net_payable_amount: number;
  status: BordereauStatus;
  maker_id: string;
  maker_name: string;
  checker_id?: string;
  checker_name?: string;
  bank_reference_code?: string;
  s3_bordereau_csv_url: string;
  created_at: string;
  settled_at?: string;
}

export interface InsurerSetting {
  insurer_id: string;
  name_en: string;
  name_th: string;
  lob_support: string[];
  monthly_pay_date: number; // e.g., 15 for 15th of month
  default_settlement_mode: SettlementMode;
  corporate_bank_account: string;
  bank_name: string;
}

// ============================================================================
// MOCK DATA (Phase 1 Carriers: Viriyah, AIA, Muang Thai, MSIG)
// ============================================================================

const MOCK_INSURERS: InsurerSetting[] = [
  {
    insurer_id: 'ins-viriyah-01',
    name_en: 'Viriyah Insurance PCL',
    name_th: 'บมจ.วิริยะประกันภัย',
    lob_support: ['MOTOR', 'FIRE', 'TRAVEL'],
    monthly_pay_date: 15,
    default_settlement_mode: 'NET',
    corporate_bank_account: '001-2-99812-4 (Kasikornbank)',
    bank_name: 'KBANK'
  },
  {
    insurer_id: 'ins-aia-02',
    name_en: 'AIA Thailand',
    name_th: 'เอไอเอ ประเทศไทย',
    lob_support: ['HEALTH', 'LIFE', 'PA'],
    monthly_pay_date: 20,
    default_settlement_mode: 'GROSS',
    corporate_bank_account: '142-3-88219-0 (Bangkok Bank)',
    bank_name: 'BBL'
  },
  {
    insurer_id: 'ins-muangthai-03',
    name_en: 'Muang Thai Life Assurance',
    name_th: 'บมจ.เมืองไทยประกันชีวิต',
    lob_support: ['HEALTH', 'LIFE'],
    monthly_pay_date: 25,
    default_settlement_mode: 'NET',
    corporate_bank_account: '045-8-12948-2 (Kasikornbank)',
    bank_name: 'KBANK'
  },
  {
    insurer_id: 'ins-msig-04',
    name_en: 'MSIG Insurance (Thailand)',
    name_th: 'บมจ.เอ็ม เอส ไอ จี ประกันภัย',
    lob_support: ['MOTOR', 'TRAVEL', 'FIRE'],
    monthly_pay_date: 15,
    default_settlement_mode: 'NET',
    corporate_bank_account: '018-9-77162-8 (SCB Bank)',
    bank_name: 'SCB'
  }
];

const INITIAL_PAYABLES: InsurerPayableLineItem[] = [
  {
    transaction_id: 'tx-2026-9011',
    gateway_ref_id: '2C2P-9918231',
    policy_id: 'pol-uuid-001',
    policy_number: 'VIR-26-M-99182',
    reference_number: 'TMP-2026-0091',
    customer_name_masked: 'Somchai J***',
    lob_code: 'MOTOR',
    collection_timestamp: '2026-10-02 14:22:10',
    gross_premium: 18500.0,
    base_commission_percent: 18.0,
    broker_commission_amount: 3330.0,
    vat_on_commission: 233.1,
    wht_on_commission: 99.9,
    net_payable_to_insurer: 15403.2,
    settlement_mode: 'NET',
    reconciliation_status: 'RECONCILED',
    is_paid_to_insurer: false
  },
  {
    transaction_id: 'tx-2026-9012',
    gateway_ref_id: 'OMISE-5519283',
    policy_id: 'pol-uuid-002',
    policy_number: 'VIR-26-M-99185',
    reference_number: 'TMP-2026-0092',
    customer_name_masked: 'Napasorn T***',
    lob_code: 'MOTOR',
    collection_timestamp: '2026-10-03 09:12:44',
    gross_premium: 22000.0,
    base_commission_percent: 18.0,
    broker_commission_amount: 3960.0,
    vat_on_commission: 277.2,
    wht_on_commission: 118.8,
    net_payable_to_insurer: 18319.2,
    settlement_mode: 'NET',
    reconciliation_status: 'RECONCILED',
    is_paid_to_insurer: false
  },
  {
    transaction_id: 'tx-2026-9013',
    gateway_ref_id: '2C2P-9918455',
    policy_id: 'pol-uuid-003',
    policy_number: 'VIR-26-F-11002',
    reference_number: 'TMP-2026-0095',
    customer_name_masked: 'Ananda P***',
    lob_code: 'FIRE',
    collection_timestamp: '2026-10-04 16:45:00',
    gross_premium: 8500.0,
    base_commission_percent: 22.0,
    broker_commission_amount: 1870.0,
    vat_on_commission: 130.9,
    wht_on_commission: 56.1,
    net_payable_to_insurer: 6764.8,
    settlement_mode: 'NET',
    reconciliation_status: 'PENDING',
    is_paid_to_insurer: false
  },
  {
    transaction_id: 'tx-2026-9014',
    gateway_ref_id: 'OMISE-5520011',
    policy_id: 'pol-uuid-004',
    policy_number: 'VIR-26-M-99201',
    reference_number: 'TMP-2026-0104',
    customer_name_masked: 'Kittisak W***',
    lob_code: 'MOTOR',
    collection_timestamp: '2026-10-05 11:30:19',
    gross_premium: 14200.0,
    base_commission_percent: 18.0,
    broker_commission_amount: 2556.0,
    vat_on_commission: 178.92,
    wht_on_commission: 76.68,
    net_payable_to_insurer: 11821.64,
    settlement_mode: 'NET',
    reconciliation_status: 'DISPUTED',
    dispute_reason: 'PREMIUM_MISMATCH (Carrier claims 15,000 THB Base)',
    is_paid_to_insurer: false
  },
  {
    transaction_id: 'tx-2026-9015',
    gateway_ref_id: '2C2P-9919011',
    policy_id: 'pol-uuid-005',
    policy_number: 'VIR-26-T-88214',
    reference_number: 'TMP-2026-0112',
    customer_name_masked: 'Chayut S***',
    lob_code: 'TRAVEL',
    collection_timestamp: '2026-10-06 18:20:00',
    gross_premium: 3200.0,
    base_commission_percent: 25.0,
    broker_commission_amount: 800.0,
    vat_on_commission: 56.0,
    wht_on_commission: 24.0,
    net_payable_to_insurer: 2456.0,
    settlement_mode: 'NET',
    reconciliation_status: 'RECONCILED',
    is_paid_to_insurer: false
  }
];

const INITIAL_RECEIVABLES: CommissionReceivableLineItem[] = [
  {
    receivable_id: 'rcv-aia-101',
    policy_id: 'pol-aia-901',
    policy_number: 'AIA-HLT-2026-0041',
    customer_name_masked: 'Wichai R***',
    lob_code: 'HEALTH',
    effective_date: '2026-10-01',
    gross_premium_collected_by_insurer: 45000.0,
    commission_percent: 15.0,
    gross_commission_amount: 6750.0,
    statutory_wht_3_percent: 202.5,
    net_receivable_amount: 6547.5,
    is_commission_received: false
  },
  {
    receivable_id: 'rcv-aia-102',
    policy_id: 'pol-aia-902',
    policy_number: 'AIA-LIF-2026-0089',
    customer_name_masked: 'Kamonrat M***',
    lob_code: 'LIFE',
    effective_date: '2026-10-03',
    gross_premium_collected_by_insurer: 80000.0,
    commission_percent: 20.0,
    gross_commission_amount: 16000.0,
    statutory_wht_3_percent: 480.0,
    net_receivable_amount: 15520.0,
    is_commission_received: true,
    insurer_settlement_ref: 'AIA-EOM-SEP-9918'
  }
];

const INITIAL_BATCHES: BordereauBatch[] = [
  {
    settlement_id: 'stl-uuid-8891',
    insurer_id: 'ins-viriyah-01',
    insurer_name: 'Viriyah Insurance PCL',
    cutoff_period: 'September 2026 (Round 2: 16th-30th)',
    policy_count: 142,
    gross_collected_amount: 2840000.0,
    commission_deducted: 511200.0,
    net_payable_amount: 2364580.0,
    status: 'SETTLED',
    maker_id: 'usr-fin-001',
    maker_name: 'Ploy Supaporn (Maker)',
    checker_id: 'usr-mgr-009',
    checker_name: 'Thanawat R. (Checker)',
    bank_reference_code: 'KBANK-TR-88219482',
    s3_bordereau_csv_url: 'https://s3.ap-southeast-1.amazonaws.com/broker-vault/settlements/VIRIYAH_BORDEREAU_SEP_2026.csv',
    created_at: '2026-09-30 17:00:00',
    settled_at: '2026-10-01 10:15:32'
  },
  {
    settlement_id: 'stl-uuid-8892',
    insurer_id: 'ins-msig-04',
    insurer_name: 'MSIG Insurance (Thailand)',
    cutoff_period: 'September 2026 (Round 2: 16th-30th)',
    policy_count: 58,
    gross_collected_amount: 890000.0,
    commission_deducted: 195800.0,
    net_payable_amount: 706852.0,
    status: 'PENDING_APPROVAL',
    maker_id: 'usr-fin-001',
    maker_name: 'Ploy Supaporn (Maker)',
    bank_reference_code: 'SCB-PENDING-TRACE-ID',
    s3_bordereau_csv_url: 'https://s3.ap-southeast-1.amazonaws.com/broker-vault/settlements/MSIG_BORDEREAU_SEP_2026.csv',
    created_at: '2026-10-01 09:30:00'
  }
];

// Current logged in user context (Simulation for Segregation of Duties)
const CURRENT_USER = {
  id: 'usr-fin-001',
  name: 'Ploy Supaporn',
  role: 'FINANCE_MAKER' // Change to 'FINANCE_CHECKER' or 'FINANCE_MANAGER' to test Checker action
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const InsurerSettlementsPage: React.FC = () => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'payables' | 'receivables' | 'batches' | 'rules'>('payables');

  // Filters state
  const [selectedInsurerId, setSelectedInsurerId] = useState<string>('ins-viriyah-01');
  const [settlementModeFilter, setSettlementModeFilter] = useState<'ALL' | 'NET' | 'GROSS'>('ALL');
  const [reconcileFilter, setReconcileFilter] = useState<'ALL' | ReconcileStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Payables data & selection state
  const [payables, setPayables] = useState<InsurerPayableLineItem[]>(INITIAL_PAYABLES);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);
  
  // Receivables data state
  const [receivables, setReceivables] = useState<CommissionReceivableLineItem[]>(INITIAL_RECEIVABLES);

  // Bordereau Batches state
  const [batches, setBatches] = useState<BordereauBatch[]>(INITIAL_BATCHES);

  // Modals state
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [isCheckerModalOpen, setIsCheckerModalOpen] = useState(false);
  const [activeBatchForReview, setActiveBatchForReview] = useState<BordereauBatch | null>(null);
  const [bankTraceInput, setBankTraceInput] = useState('');
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeTargetTx, setDisputeTargetTx] = useState<InsurerPayableLineItem | null>(null);
  const [disputeReasonCode, setDisputeReasonCode] = useState('PREMIUM_MISMATCH');
  const [disputeCustomNote, setDisputeCustomNote] = useState('');

  // Selected Insurer Object
  const currentInsurer = useMemo(() => {
    return MOCK_INSURERS.find((ins) => ins.insurer_id === selectedInsurerId) || MOCK_INSURERS[0];
  }, [selectedInsurerId]);

  // Filtered Payables
  const filteredPayables = useMemo(() => {
    return payables.filter((item) => {
      const matchSearch =
        item.policy_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.gateway_ref_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.customer_name_masked.toLowerCase().includes(searchQuery.toLowerCase());

      const matchMode = settlementModeFilter === 'ALL' || item.settlement_mode === settlementModeFilter;
      const matchReconcile = reconcileFilter === 'ALL' || item.reconciliation_status === reconcileFilter;

      return matchSearch && matchMode && matchReconcile;
    });
  }, [payables, searchQuery, settlementModeFilter, reconcileFilter]);

  // Totals & KPI Metrics for Payables
  const payableMetrics = useMemo(() => {
    const gross = filteredPayables.reduce((acc, cur) => acc + cur.gross_premium, 0);
    const comm = filteredPayables.reduce((acc, cur) => acc + cur.broker_commission_amount, 0);
    const netPayable = filteredPayables.reduce((acc, cur) => acc + cur.net_payable_to_insurer, 0);
    const reconciledCount = filteredPayables.filter((i) => i.reconciliation_status === 'RECONCILED').length;
    const pendingCount = filteredPayables.filter((i) => i.reconciliation_status === 'PENDING').length;
    const disputedCount = filteredPayables.filter((i) => i.reconciliation_status === 'DISPUTED').length;

    return { gross, comm, netPayable, reconciledCount, pendingCount, disputedCount };
  }, [filteredPayables]);

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTransactionIds(filteredPayables.map((item) => item.transaction_id));
    } else {
      setSelectedTransactionIds([]);
    }
  };

  const handleToggleSelect = (txId: string) => {
    setSelectedTransactionIds((prev) =>
      prev.includes(txId) ? prev.filter((id) => id !== txId) : [...prev, txId]
    );
  };

  // Bulk Reconcile Action (`PATCH /admin/ledger/insurer-payables/{insurer_id}/reconcile`)
  const handleBulkReconcile = (status: ReconcileStatus) => {
    if (selectedTransactionIds.length === 0) return;
    setPayables((prev) =>
      prev.map((item) =>
        selectedTransactionIds.includes(item.transaction_id)
          ? { ...item, reconciliation_status: status, dispute_reason: undefined }
          : item
      )
    );
    setSelectedTransactionIds([]);
  };

  // Open Dispute Modal
  const handleOpenDispute = (tx: InsurerPayableLineItem) => {
    setDisputeTargetTx(tx);
    setDisputeReasonCode('PREMIUM_MISMATCH');
    setDisputeCustomNote('');
    setDisputeModalOpen(true);
  };

  // Confirm Dispute
  const handleConfirmDispute = () => {
    if (!disputeTargetTx) return;
    setPayables((prev) =>
      prev.map((item) =>
        item.transaction_id === disputeTargetTx.transaction_id
          ? {
              ...item,
              reconciliation_status: 'DISPUTED',
              dispute_reason: `${disputeReasonCode}${disputeCustomNote ? `: ${disputeCustomNote}` : ''}`
            }
          : item
      )
    );
    setDisputeModalOpen(false);
    setDisputeTargetTx(null);
  };

  // Stage Maker Bordereau Settlement Request (`POST /admin/ledger/insurer-payables/{insurer_id}/settle/request`)
  const handleStageSettlementRequest = () => {
    const readyItems = payables.filter((p) => p.reconciliation_status === 'RECONCILED');
    if (readyItems.length === 0) {
      alert('No reconciled line items available to stage settlement.');
      return;
    }

    const gross = readyItems.reduce((acc, cur) => acc + cur.gross_premium, 0);
    const comm = readyItems.reduce((acc, cur) => acc + cur.broker_commission_amount, 0);
    const net = readyItems.reduce((acc, cur) => acc + cur.net_payable_to_insurer, 0);

    const newBatch: BordereauBatch = {
      settlement_id: `stl-uuid-${Date.now().toString().slice(-4)}`,
      insurer_id: currentInsurer.insurer_id,
      insurer_name: currentInsurer.name_en,
      cutoff_period: `October 2026 (Round 1: 1st-${currentInsurer.monthly_pay_date}th)`,
      policy_count: readyItems.length,
      gross_collected_amount: gross,
      commission_deducted: comm,
      net_payable_amount: net,
      status: 'PENDING_APPROVAL',
      maker_id: CURRENT_USER.id,
      maker_name: CURRENT_USER.name,
      s3_bordereau_csv_url: `https://s3.ap-southeast-1.amazonaws.com/broker-vault/settlements/${currentInsurer.name_en.toUpperCase()}_BORDEREAU_OCT_2026.csv`,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    setBatches([newBatch, ...batches]);
    // Tag the local items as staged/cleared
    setPayables((prev) => prev.filter((p) => p.reconciliation_status !== 'RECONCILED'));
    setIsStageModalOpen(false);
    setActiveTab('batches');
  };

  // Checker Execute Approval (`POST /admin/approvals/{request_id}/execute`)
  const handleCheckerApprove = () => {
    if (!activeBatchForReview) return;
    if (!bankTraceInput.trim()) {
      alert('Please enter the corporate Bank Trace ID / BAHTNET Reference Code.');
      return;
    }

    // ACID Swap simulation
    setBatches((prev) =>
      prev.map((b) =>
        b.settlement_id === activeBatchForReview.settlement_id
          ? {
              ...b,
              status: 'SETTLED',
              checker_id: 'usr-mgr-777',
              checker_name: 'Pattara Audit (Checker)',
              bank_reference_code: bankTraceInput,
              settled_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
            }
          : b
      )
    );

    setIsCheckerModalOpen(false);
    setActiveBatchForReview(null);
    setBankTraceInput('');
  };

  // Toggle Policy Finance Flag (`PATCH /admin/ledger/policies/{policy_id}/finance-flags`)
  const handleToggleReceivablePaid = (receivableId: string) => {
    setReceivables((prev) =>
      prev.map((r) =>
        r.receivable_id === receivableId
          ? { ...r, is_commission_received: !r.is_commission_received }
          : r
      )
    );
  };

  return (
    <div className="pt-0 space-y-6 text-zinc-900">
      {/* ---------------------------------------------------------------------- */}
      {/* 1. HEADER SECTION (No top padding on container, clear status) */}
      {/* ---------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Insurer Settlements & Bordereau
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              OIC Trust Account
            </span>
          </div>
          <p className="text-sm text-zinc-500 mt-1">
            End-of-Month (EOM) Broker Remittances, Statement of Account (SOA), Double-Entry Trust Ledger & Commission Receivables
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const csvContent =
                'data:text/csv;charset=utf-8,Transaction ID,Policy No,Customer,Gross,Commission,Net Payable\n' +
                payables.map((p) => `${p.transaction_id},${p.policy_number},${p.customer_name_masked},${p.gross_premium},${p.broker_commission_amount},${p.net_payable_to_insurer}`).join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', `bordereau_${selectedInsurerId}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg shadow-sm hover:bg-zinc-50 transition-colors"
          >
            <Download className="w-4 h-4 text-zinc-500" />
            Export Bordereau (CSV)
          </button>

          <button
            onClick={() => setIsStageModalOpen(true)}
            disabled={payableMetrics.reconciledCount === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            Stage Settlement (Maker)
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 2. INSURER SELECTION BAR & TABS */}
      {/* ---------------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Carrier Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider shrink-0 mr-1">
            Insurer:
          </span>
          {MOCK_INSURERS.map((ins) => {
            const isSelected = ins.insurer_id === selectedInsurerId;
            return (
              <button
                key={ins.insurer_id}
                onClick={() => setSelectedInsurerId(ins.insurer_id)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold shadow-xs'
                    : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                <Building2 className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600' : 'text-zinc-400'}`} />
                {ins.name_en}
                <span className="text-[10px] text-zinc-400">({ins.monthly_pay_date}th)</span>
              </button>
            );
          })}
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border border-zinc-200 bg-white p-1 rounded-lg shadow-xs">
          <button
            onClick={() => setActiveTab('payables')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'payables'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Insurer Payables (Scenario A)
          </button>
          <button
            onClick={() => setActiveTab('receivables')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'receivables'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Commission Receivables (Scenario B)
          </button>
          <button
            onClick={() => setActiveTab('batches')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all relative ${
              activeTab === 'batches'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Bordereau Batches & Checker
            {batches.some((b) => b.status === 'PENDING_APPROVAL') && (
              <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-amber-400"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'rules'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Settlement Rules
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 3. TAB CONTENT */}
      {/* ---------------------------------------------------------------------- */}

      {/* ==================================================================== */}
      {/* TAB 1: INSURER PAYABLES (Bordereau Aggregate & Reconciliation) */}
      {/* ==================================================================== */}
      {activeTab === 'payables' && (
        <div className="space-y-6">
          {/* KPI Widget Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase">Gross Premiums Collected</span>
                <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
                ฿{payableMetrics.gross.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className="mt-1 text-xs text-zinc-500 flex items-center gap-1">
                <span>Trust Account Inbound (`PREMIUM_IN`)</span>
              </p>
            </div>

            <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase">Broker Commission Retained</span>
                <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <ArrowDownLeft className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-600">
                ฿{payableMetrics.comm.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Net deduction before remittance
              </p>
            </div>

            <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase">Net Remittance to Insurer</span>
                <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-indigo-600">
                ฿{payableMetrics.netPayable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Due: Every {currentInsurer.monthly_pay_date}th of month
              </p>
            </div>

            <div className="p-4 bg-white border border-zinc-200 rounded-xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase">Line-Item Reconciliation</span>
                <span className="p-1.5 bg-zinc-100 text-zinc-600 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-zinc-900">{payableMetrics.reconciledCount}</span>
                <span className="text-xs font-medium text-emerald-600">Ready</span>
                <span className="text-zinc-300">|</span>
                <span className="text-sm font-semibold text-amber-600">{payableMetrics.pendingCount}</span>
                <span className="text-xs text-zinc-500">Pending</span>
                <span className="text-zinc-300">|</span>
                <span className="text-sm font-semibold text-rose-600">{payableMetrics.disputedCount}</span>
                <span className="text-xs text-zinc-500">Dispute</span>
              </div>
              <div className="w-full bg-zinc-100 h-1.5 rounded-full mt-3 overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full"
                  style={{
                    width: `${filteredPayables.length ? (payableMetrics.reconciledCount / filteredPayables.length) * 100 : 0}%`
                  }}
                />
                <div
                  className="bg-amber-400 h-full"
                  style={{
                    width: `${filteredPayables.length ? (payableMetrics.pendingCount / filteredPayables.length) * 100 : 0}%`
                  }}
                />
                <div
                  className="bg-rose-500 h-full"
                  style={{
                    width: `${filteredPayables.length ? (payableMetrics.disputedCount / filteredPayables.length) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white border border-zinc-200 rounded-xl shadow-xs">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Policy No, 2C2P Ref, Customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              {/* Status Filter */}
              <select
                value={reconcileFilter}
                onChange={(e) => setReconcileFilter(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Reconcile Statuses</option>
                <option value="RECONCILED">Reconciled Only</option>
                <option value="PENDING">Pending Review</option>
                <option value="DISPUTED">Disputed Items</option>
              </select>

              {/* Settlement Mode Filter */}
              <select
                value={settlementModeFilter}
                onChange={(e) => setSettlementModeFilter(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Settlement Modes</option>
                <option value="NET">Net (Deduct Before)</option>
                <option value="GROSS">Gross (Deduct After)</option>
              </select>
            </div>

            {/* Bulk Action Controls */}
            {selectedTransactionIds.length > 0 && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
                <span className="text-xs font-semibold text-blue-700">
                  {selectedTransactionIds.length} selected
                </span>
                <button
                  onClick={() => handleBulkReconcile('RECONCILED')}
                  className="px-2 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors"
                >
                  Mark Reconciled
                </button>
                <button
                  onClick={() => handleBulkReconcile('DISPUTED')}
                  className="px-2 py-1 text-[11px] font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors"
                >
                  Mark Disputed
                </button>
                <button
                  onClick={() => setSelectedTransactionIds([])}
                  className="text-xs text-zinc-500 hover:text-zinc-700 px-1"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Interactive Data Table */}
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={
                          filteredPayables.length > 0 &&
                          selectedTransactionIds.length === filteredPayables.length
                        }
                        className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="p-3">Policy & Gateway Ref</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">LOB</th>
                    <th className="p-3 text-right">Gross Premium</th>
                    <th className="p-3 text-right">Comm. Rate</th>
                    <th className="p-3 text-right">Commission (THB)</th>
                    <th className="p-3 text-right font-bold text-zinc-800">Net Payable</th>
                    <th className="p-3 text-center">Reconciliation</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {filteredPayables.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-zinc-400">
                        <FileCheck2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        No payable records matching current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPayables.map((item) => {
                      const isSelected = selectedTransactionIds.includes(item.transaction_id);
                      return (
                        <tr
                          key={item.transaction_id}
                          className={`hover:bg-zinc-50/80 transition-colors ${
                            isSelected ? 'bg-blue-50/30' : ''
                          }`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(item.transaction_id)}
                              className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>

                          <td className="p-3">
                            <div className="font-semibold text-zinc-900">{item.policy_number}</div>
                            <div className="text-[11px] text-zinc-400 font-mono">
                              {item.gateway_ref_id}
                            </div>
                            <div className="text-[10px] text-zinc-400">
                              {item.collection_timestamp}
                            </div>
                          </td>

                          <td className="p-3 font-medium text-zinc-700">
                            {item.customer_name_masked}
                          </td>

                          <td className="p-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                item.lob_code === 'MOTOR'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : item.lob_code === 'FIRE'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : item.lob_code === 'HEALTH'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}
                            >
                              {item.lob_code}
                            </span>
                          </td>

                          <td className="p-3 text-right font-medium text-zinc-900">
                            ฿{item.gross_premium.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>

                          <td className="p-3 text-right text-zinc-600">
                            {item.base_commission_percent.toFixed(1)}%
                          </td>

                          <td className="p-3 text-right text-emerald-600 font-medium">
                            ฿{item.broker_commission_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>

                          <td className="p-3 text-right font-bold text-zinc-900 bg-zinc-50/50">
                            ฿{item.net_payable_to_insurer.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>

                          <td className="p-3 text-center">
                            {item.reconciliation_status === 'RECONCILED' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Check className="w-3 h-3" /> Reconciled
                              </span>
                            )}
                            {item.reconciliation_status === 'PENDING' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-3 h-3" /> Pending
                              </span>
                            )}
                            {item.reconciliation_status === 'DISPUTED' && (
                              <span
                                title={item.dispute_reason}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200 cursor-help"
                              >
                                <AlertTriangle className="w-3 h-3" /> Disputed
                              </span>
                            )}
                          </td>

                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {item.reconciliation_status !== 'RECONCILED' && (
                                <button
                                  onClick={() => {
                                    setPayables((prev) =>
                                      prev.map((p) =>
                                        p.transaction_id === item.transaction_id
                                          ? { ...p, reconciliation_status: 'RECONCILED', dispute_reason: undefined }
                                          : p
                                      )
                                    );
                                  }}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                  title="Mark as Reconciled"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              {item.reconciliation_status !== 'DISPUTED' && (
                                <button
                                  onClick={() => handleOpenDispute(item)}
                                  className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                                  title="Mark as Disputed"
                                >
                                  <AlertCircle className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Summary */}
            <div className="p-3 bg-zinc-50 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-2">
              <div>
                Showing <strong>{filteredPayables.length}</strong> items for <strong>{currentInsurer.name_en}</strong>
              </div>
              <div className="flex items-center gap-4">
                <span>
                  Reconciled Ready Total:{' '}
                  <strong className="text-emerald-700 font-semibold">
                    ฿
                    {payables
                      .filter((p) => p.reconciliation_status === 'RECONCILED')
                      .reduce((sum, cur) => sum + cur.net_payable_to_insurer, 0)
                      .toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: COMMISSION RECEIVABLES (Insurer Collects – Scenario B) */}
      {/* ==================================================================== */}
      {activeTab === 'receivables' && (
        <div className="space-y-6">
          {/* Informational Banner */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 space-y-1">
              <p className="font-semibold">Scenario B: Direct Carrier Collection (`payee_type = INSURER`)</p>
              <p>
                When a customer pays the insurance company directly, the Insurer is legally required to remit the Broker’s commission. Under Thai Revenue Department (TRD) statutory mandates, the Insurer auto-deducts <strong>3% Withholding Tax (WHT)</strong>, which must balance against the <strong>Prepaid WHT Asset GL</strong>.
              </p>
            </div>
          </div>

          {/* Receivables Table */}
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Inward Commission Ledger</h3>
                <p className="text-xs text-zinc-500">Track and settle inward broker commission payments owed by carriers</p>
              </div>
              <span className="text-xs font-semibold text-zinc-500">
                Total Unsettled:{' '}
                <span className="text-blue-600 font-bold">
                  ฿
                  {receivables
                    .filter((r) => !r.is_commission_received)
                    .reduce((sum, cur) => sum + cur.net_receivable_amount, 0)
                    .toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3">Policy No & Insurer</th>
                    <th className="p-3">Insured Name</th>
                    <th className="p-3">Effective Date</th>
                    <th className="p-3 text-right">Premium Kept by Insurer</th>
                    <th className="p-3 text-right">Comm %</th>
                    <th className="p-3 text-right">Gross Commission</th>
                    <th className="p-3 text-right text-rose-600">3% WHT Deducted</th>
                    <th className="p-3 text-right font-bold text-zinc-900">Net Receivable</th>
                    <th className="p-3 text-center">Settlement Status</th>
                    <th className="p-3 text-right">Offline Reconcile Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {receivables.map((r) => (
                    <tr key={r.receivable_id} className="hover:bg-zinc-50/80">
                      <td className="p-3 font-semibold text-zinc-900">
                        {r.policy_number}
                        <div className="text-[11px] text-zinc-400 font-normal">AIA Thailand</div>
                      </td>
                      <td className="p-3 text-zinc-700">{r.customer_name_masked}</td>
                      <td className="p-3 text-zinc-500">{r.effective_date}</td>
                      <td className="p-3 text-right font-medium text-zinc-900">
                        ฿{r.gross_premium_collected_by_insurer.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right text-zinc-600">{r.commission_percent.toFixed(1)}%</td>
                      <td className="p-3 text-right font-semibold text-emerald-600">
                        ฿{r.gross_commission_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-mono text-rose-600">
                        -฿{r.statutory_wht_3_percent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-bold text-blue-700 bg-zinc-50/50">
                        ฿{r.net_receivable_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-center">
                        {r.is_commission_received ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Received & Booked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" /> Pending Inward Wire
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleToggleReceivablePaid(r.receivable_id)}
                          className={`px-3 py-1 text-[11px] font-semibold rounded-md border transition-all ${
                            r.is_commission_received
                              ? 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200'
                              : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          {r.is_commission_received ? 'Unmark Received' : 'Record Inward Receipt'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: BORDEREAU BATCHES & MAKER-CHECKER WORKFLOW */}
      {/* ==================================================================== */}
      {activeTab === 'batches' && (
        <div className="space-y-6">
          {/* Segregation of Duties Banner */}
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <div>
                <span className="text-xs font-bold text-zinc-900">Governance: Maker-Checker Segregation</span>
                <p className="text-xs text-zinc-500">
                  Logged in as: <strong>{CURRENT_USER.name}</strong> ({CURRENT_USER.role}). By OIC audit policy, Maker (`maker_id`) cannot approve their own staged settlement.
                </p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 bg-white border border-zinc-200 rounded font-mono text-zinc-600">
              User ID: {CURRENT_USER.id}
            </span>
          </div>

          {/* Batches Table */}
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Staged & Executed Bordereau Statements</h3>
                <p className="text-xs text-zinc-500">Historical remittance archives with Bank Trace IDs and S3 cryptographically signed CSV audits</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3">Settlement ID</th>
                    <th className="p-3">Insurer & Billing Period</th>
                    <th className="p-3 text-center">Policies</th>
                    <th className="p-3 text-right">Gross Collected</th>
                    <th className="p-3 text-right">Commission Retained</th>
                    <th className="p-3 text-right font-bold text-zinc-900">Net Remittance</th>
                    <th className="p-3 text-center">Governance Status</th>
                    <th className="p-3">Maker / Checker Audit</th>
                    <th className="p-3">Bank Wire Ref</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {batches.map((batch) => {
                    const isMakerCurrentUser = batch.maker_id === CURRENT_USER.id;
                    return (
                      <tr key={batch.settlement_id} className="hover:bg-zinc-50/80">
                        <td className="p-3 font-mono font-semibold text-zinc-900">
                          {batch.settlement_id}
                        </td>

                        <td className="p-3">
                          <div className="font-semibold text-zinc-900">{batch.insurer_name}</div>
                          <div className="text-[11px] text-zinc-400">{batch.cutoff_period}</div>
                        </td>

                        <td className="p-3 text-center font-medium text-zinc-700">
                          {batch.policy_count}
                        </td>

                        <td className="p-3 text-right font-medium text-zinc-900">
                          ฿{batch.gross_collected_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="p-3 text-right text-emerald-600 font-medium">
                          ฿{batch.commission_deducted.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="p-3 text-right font-bold text-zinc-900 bg-zinc-50/50">
                          ฿{batch.net_payable_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="p-3 text-center">
                          {batch.status === 'SETTLED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> SETTLED
                            </span>
                          ) : batch.status === 'PENDING_APPROVAL' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3" /> PENDING CHECKER
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
                              {batch.status}
                            </span>
                          )}
                        </td>

                        <td className="p-3">
                          <div className="text-zinc-700">
                            <strong>M:</strong> {batch.maker_name}
                          </div>
                          {batch.checker_name ? (
                            <div className="text-emerald-700">
                              <strong>C:</strong> {batch.checker_name}
                            </div>
                          ) : (
                            <div className="text-amber-600 text-[11px]">Awaiting Checker Sign-off</div>
                          )}
                        </td>

                        <td className="p-3 font-mono text-[11px] text-zinc-600">
                          {batch.bank_reference_code || '-'}
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={batch.s3_bordereau_csv_url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-zinc-500 hover:text-blue-600 hover:bg-zinc-100 rounded transition-colors"
                              title="Download Signed Bordereau CSV"
                            >
                              <FileSpreadsheet className="w-4 h-4" />
                            </a>

                            {batch.status === 'PENDING_APPROVAL' && (
                              <button
                                onClick={() => {
                                  setActiveBatchForReview(batch);
                                  setIsCheckerModalOpen(true);
                                }}
                                className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                              >
                                Review & Sign
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: SETTLEMENT RULES & PAY DATES (broker_insurer_settings) */}
      {/* ==================================================================== */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-zinc-200">
              <h3 className="text-sm font-bold text-zinc-900">Broker-to-Insurer Settlement Settings</h3>
              <p className="text-xs text-zinc-500">
                Configured credit terms, remittance modes (Net vs. Gross), and legal cutoff dates (`broker_insurer_settings`)
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3">Insurer ID & Name</th>
                    <th className="p-3">Supported LOBs</th>
                    <th className="p-3">Settlement Mode</th>
                    <th className="p-3 text-center">Monthly Pay Date</th>
                    <th className="p-3">Designated Bank Account</th>
                    <th className="p-3 text-right">Configuration Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {MOCK_INSURERS.map((ins) => (
                    <tr key={ins.insurer_id} className="hover:bg-zinc-50/80">
                      <td className="p-3">
                        <div className="font-semibold text-zinc-900">{ins.name_en}</div>
                        <div className="text-[11px] text-zinc-400">{ins.name_th}</div>
                      </td>

                      <td className="p-3">
                        <div className="flex gap-1 flex-wrap">
                          {ins.lob_support.map((lob) => (
                            <span
                              key={lob}
                              className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 text-zinc-700"
                            >
                              {lob}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            ins.default_settlement_mode === 'NET'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}
                        >
                          {ins.default_settlement_mode === 'NET' ? 'NET (Deduct Before)' : 'GROSS (Deduct After)'}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 font-semibold text-zinc-900 bg-zinc-100 px-2 py-1 rounded">
                          <Calendar className="w-3 h-3 text-zinc-500" /> Every {ins.monthly_pay_date}th
                        </span>
                      </td>

                      <td className="p-3 font-mono text-zinc-700">
                        {ins.corporate_bank_account}
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => alert(`Settings for ${ins.name_en} are managed under Maker-Checker RBAC approval flow.`)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                        >
                          Edit Terms
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 1: STAGE SETTLEMENT REQUEST (Maker Workflow) */}
      {/* ==================================================================== */}
      {isStageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-zinc-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Stage Insurer Bordereau (Maker)</h3>
                <p className="text-xs text-zinc-500">
                  {currentInsurer.name_en} • Cutoff Date: {currentInsurer.monthly_pay_date}th of Month
                </p>
              </div>
              <button
                onClick={() => setIsStageModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                <span className="font-semibold text-blue-900">Summary of Reconciled Payables:</span>
                <div className="flex justify-between text-zinc-700">
                  <span>Reconciled Policy Count:</span>
                  <span className="font-bold text-zinc-900">{payableMetrics.reconciledCount} policies</span>
                </div>
                <div className="flex justify-between text-zinc-700">
                  <span>Total Gross Inbound Premium:</span>
                  <span className="font-semibold">
                    ฿
                    {payables
                      .filter((p) => p.reconciliation_status === 'RECONCILED')
                      .reduce((sum, cur) => sum + cur.gross_premium, 0)
                      .toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-700">
                  <span>Broker Commission Deducted:</span>
                  <span className="font-semibold text-emerald-700">
                    -฿
                    {payables
                      .filter((p) => p.reconciliation_status === 'RECONCILED')
                      .reduce((sum, cur) => sum + cur.broker_commission_amount, 0)
                      .toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="border-t border-blue-200 pt-2 flex justify-between font-bold text-sm text-blue-950">
                  <span>Net Wire Remittance:</span>
                  <span>
                    ฿
                    {payables
                      .filter((p) => p.reconciliation_status === 'RECONCILED')
                      .reduce((sum, cur) => sum + cur.net_payable_to_insurer, 0)
                      .toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Insurer Target Wire Account:
                </label>
                <input
                  type="text"
                  readOnly
                  value={currentInsurer.corporate_bank_account}
                  className="w-full p-2 bg-zinc-100 border border-zinc-200 rounded-lg font-mono text-zinc-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Maker Initiation Note:
                </label>
                <textarea
                  rows={2}
                  defaultValue="Bordereau generated for EOM schedule. All line items verified against 2C2P / Omise gateway logs."
                  className="w-full p-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <p className="text-[11px] text-zinc-500">
                Clicking <strong>Stage Settlement</strong> will serialize this payload into <code>approval_requests</code> with status <code>PENDING_APPROVAL</code> and lock these line items from future sweeps.
              </p>
            </div>

            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsStageModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900"
              >
                Cancel
              </button>
              <button
                onClick={handleStageSettlementRequest}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
              >
                Confirm & Stage Request (Maker)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: CHECKER REVIEW & APPROVAL (ACID Finalization) */}
      {/* ==================================================================== */}
      {isCheckerModalOpen && activeBatchForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-zinc-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Checker Governance Execution</h3>
                <p className="text-xs text-zinc-500">
                  Batch: {activeBatchForReview.settlement_id} • Insurer: {activeBatchForReview.insurer_name}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsCheckerModalOpen(false);
                  setActiveBatchForReview(null);
                }}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Segregation rule alert */}
              {activeBatchForReview.maker_id === CURRENT_USER.id ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Segregation of Duties Violation Guard:</span>
                    <p className="mt-0.5">
                      You are the original Maker (<code>{activeBatchForReview.maker_name}</code>) of this request. In production, another Finance Manager with <code>finance:approve</code> role must sign off.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-emerald-800">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Authorized Checker Verification:</span>
                    <p className="mt-0.5">
                      You are authorized to verify the external bank wire trace code and execute ACID general ledger balance.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-1.5 p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Cutoff Period:</span>
                  <span className="font-semibold text-zinc-900">{activeBatchForReview.cutoff_period}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Total Policy Count:</span>
                  <span className="font-semibold text-zinc-900">{activeBatchForReview.policy_count} items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Net Remittance Amount:</span>
                  <span className="font-bold text-zinc-900 text-sm">
                    ฿{activeBatchForReview.net_payable_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-800 mb-1">
                  Bank Trace ID / BAHTNET Transfer Reference <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., KBANK-TR-99482716 or SCB-CORP-001928"
                  value={bankTraceInput}
                  onChange={(e) => setBankTraceInput(e.target.value)}
                  className="w-full p-2.5 bg-white border border-zinc-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                />
                <span className="text-[11px] text-zinc-400 mt-1 block">
                  Mandatory proof of wire from Corporate Banking portal before ledger closure.
                </span>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setIsCheckerModalOpen(false);
                  setActiveBatchForReview(null);
                }}
                className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900"
              >
                Close
              </button>
              <button
                onClick={handleCheckerApprove}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                Approve & Execute ACID Swap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: LINE ITEM DISPUTE MODAL */}
      {/* ==================================================================== */}
      {disputeModalOpen && disputeTargetTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-zinc-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Flag Transaction Dispute</h3>
                <p className="text-xs text-zinc-500">{disputeTargetTx.policy_number}</p>
              </div>
              <button
                onClick={() => setDisputeModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Dispute Reason Code</label>
                <select
                  value={disputeReasonCode}
                  onChange={(e) => setDisputeReasonCode(e.target.value)}
                  className="w-full p-2 border border-zinc-200 rounded-lg text-xs"
                >
                  <option value="PREMIUM_MISMATCH">PREMIUM_MISMATCH (Gross amount differs from carrier schedule)</option>
                  <option value="COMMISSION_DISCREPANCY">COMMISSION_DISCREPANCY (Disputed rate tier)</option>
                  <option value="CANCELLATION_IN_FLIGHT">CANCELLATION_IN_FLIGHT (Pending Endorsement / Refund)</option>
                  <option value="DUPLICATE_PAYMENT">DUPLICATE_PAYMENT (Gateway duplicate)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Operational Audit Note</label>
                <textarea
                  rows={3}
                  value={disputeCustomNote}
                  onChange={(e) => setDisputeCustomNote(e.target.value)}
                  placeholder="Enter specific discrepancy detail for insurer ops team..."
                  className="w-full p-2 border border-zinc-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setDisputeModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDispute}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
              >
                Mark as Disputed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsurerSettlementsPage;