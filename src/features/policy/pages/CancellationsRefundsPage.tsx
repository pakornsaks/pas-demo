import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShieldAlert,
  Eye,
  EyeOff,
  Building2,
  CheckSquare,
  Square,
  TrendingDown,
  Info
} from 'lucide-react';

// ==========================================
// TYPES & INTERFACES (Mapped to PAS Data Schema)
// ==========================================

export type CancellationCaseType = 
  | 'CASE_A' // Customer Paid, Broker holds funds
  | 'CASE_B' // Customer Paid, Broker already sent to Insurer (5-Step manual)
  | 'CASE_C' // Customer is Unpaid
  | 'CASE_D'; // Installment (Partially Paid)

export type CancellationReasonCode = 
  | 'CUSTOMER_REQUEST'
  | 'NON_PAYMENT'
  | 'INSURER_MANDATED'
  | 'INSTALLMENT_EXHAUSTION';

export interface TrackingFlags {
  is_inform_insurer_cancel: boolean;
  is_insurer_confirmed_cancel: boolean;
  is_money_returned_to_customer: boolean;
  is_paid_to_insurer: boolean;
}

export interface PolicyRecord {
  policy_id: string;
  policy_number: string;
  reference_number: string;
  customer_id: string;
  customer_name: string;
  national_id_masked: string;
  national_id_raw: string;
  insurer_name: string;
  product_name: string;
  line_of_business: 'MOTOR' | 'HEALTH' | 'TRAVEL' | 'FIRE';
  gross_premium: number;
  paid_amount: number;
  agent_id: string;
  agent_name: string;
  original_commission_amount: number;
  commission_rate_percent: number;
  status: 'ACTIVE' | 'CANCELLED' | 'SUSPENDED';
  cancellation_case: CancellationCaseType;
  payment_method: 'CASH' | 'CREDIT_CARD_FULL' | 'INSTALLMENT';
  effective_start_date: string;
  expiry_date: string;
  tracking_flags: TrackingFlags;
  scheduled_cancellation_date?: string;
  refund_amount?: number;
  clawback_amount?: number;
}

export interface ApprovalRequest {
  request_id: string;
  policy_id: string;
  policy_number: string;
  customer_name: string;
  cancellation_case: CancellationCaseType;
  proposed_refund_amount: number;
  calculated_clawback_net: number;
  requested_by_user_id: string;
  requested_by_name: string;
  reason_code: CancellationReasonCode;
  created_at: string;
  status: 'PENDING_APPROVAL' | 'EXECUTED' | 'REJECTED';
}

// Current logged-in user in Backoffice
const CURRENT_ADMIN_USER = {
  id: 'usr-admin-002',
  name: 'Karn (Finance Checker)',
  role: 'FINANCE_MANAGER',
};

// ==========================================
// MOCK DATA
// ==========================================

const INITIAL_POLICIES: PolicyRecord[] = [
  {
    policy_id: 'pol-001',
    policy_number: 'VIR-2026-09121',
    reference_number: 'TMP-2026-0041',
    customer_id: 'cust-101',
    customer_name: 'Somchai Prasert',
    national_id_masked: '1-1004-XXXX-88-9',
    national_id_raw: '1-1004-58291-88-9',
    insurer_name: 'Viriyah Insurance',
    product_name: 'Motor Type 1 Comprehensive',
    line_of_business: 'MOTOR',
    gross_premium: 24000,
    paid_amount: 24000,
    agent_id: 'agt-88',
    agent_name: 'Chatchai Broker Group',
    original_commission_amount: 4320, // 18%
    commission_rate_percent: 18,
    status: 'ACTIVE',
    cancellation_case: 'CASE_A',
    payment_method: 'CREDIT_CARD_FULL',
    effective_start_date: '2026-01-10',
    expiry_date: '2027-01-10',
    tracking_flags: {
      is_inform_insurer_cancel: false,
      is_insurer_confirmed_cancel: false,
      is_money_returned_to_customer: false,
      is_paid_to_insurer: false,
    },
  },
  {
    policy_id: 'pol-002',
    policy_number: 'BKI-2026-55823',
    reference_number: 'TMP-2026-0082',
    customer_id: 'cust-102',
    customer_name: 'Wandee Siriporn',
    national_id_masked: '3-1002-XXXX-11-2',
    national_id_raw: '3-1002-99321-11-2',
    insurer_name: 'Bangkok Insurance',
    product_name: 'Health Shield Elite',
    line_of_business: 'HEALTH',
    gross_premium: 36000,
    paid_amount: 36000,
    agent_id: 'agt-12',
    agent_name: 'Sirirat Telesales',
    original_commission_amount: 5400, // 15%
    commission_rate_percent: 15,
    status: 'ACTIVE',
    cancellation_case: 'CASE_B',
    payment_method: 'CASH',
    effective_start_date: '2026-02-01',
    expiry_date: '2027-02-01',
    tracking_flags: {
      is_inform_insurer_cancel: true,
      is_insurer_confirmed_cancel: false,
      is_money_returned_to_customer: false,
      is_paid_to_insurer: true,
    },
  },
  {
    policy_id: 'pol-003',
    policy_number: 'TMP-2026-0914',
    reference_number: 'TMP-2026-0914',
    customer_id: 'cust-103',
    customer_name: 'Anan Charoenrat',
    national_id_masked: '1-4401-XXXX-44-0',
    national_id_raw: '1-4401-87654-44-0',
    insurer_name: 'Muang Thai Insurance',
    product_name: 'Personal Accident Plus',
    line_of_business: 'MOTOR',
    gross_premium: 4500,
    paid_amount: 0,
    agent_id: 'agt-99',
    agent_name: 'Direct Online Channel',
    original_commission_amount: 450,
    commission_rate_percent: 10,
    status: 'ACTIVE',
    cancellation_case: 'CASE_C',
    payment_method: 'CASH',
    effective_start_date: '2026-03-01',
    expiry_date: '2027-03-01',
    tracking_flags: {
      is_inform_insurer_cancel: false,
      is_insurer_confirmed_cancel: false,
      is_money_returned_to_customer: false,
      is_paid_to_insurer: false,
    },
  },
  {
    policy_id: 'pol-004',
    policy_number: 'TIP-2026-44019',
    reference_number: 'TMP-2026-0309',
    customer_id: 'cust-104',
    customer_name: 'Nataporn Srisuk',
    national_id_masked: '1-1009-XXXX-65-3',
    national_id_raw: '1-1009-12345-65-3',
    insurer_name: 'Dhipaya Insurance',
    product_name: 'Commercial Fire & Asset',
    line_of_business: 'FIRE',
    gross_premium: 18000,
    paid_amount: 6000, // 1st cycle paid of 3-month installment
    agent_id: 'agt-88',
    agent_name: 'Chatchai Broker Group',
    original_commission_amount: 2700,
    commission_rate_percent: 15,
    status: 'ACTIVE',
    cancellation_case: 'CASE_D',
    payment_method: 'INSTALLMENT',
    effective_start_date: '2026-01-15',
    expiry_date: '2027-01-15',
    tracking_flags: {
      is_inform_insurer_cancel: false,
      is_insurer_confirmed_cancel: false,
      is_money_returned_to_customer: false,
      is_paid_to_insurer: false,
    },
  },
];

const INITIAL_APPROVAL_REQUESTS: ApprovalRequest[] = [
  {
    request_id: 'req-001',
    policy_id: 'pol-002',
    policy_number: 'BKI-2026-55823',
    customer_name: 'Wandee Siriporn',
    cancellation_case: 'CASE_B',
    proposed_refund_amount: 18000,
    calculated_clawback_net: 2619, // Gross 2700 - 3% WHT (81) = 2619
    requested_by_user_id: 'usr-ops-001',
    requested_by_name: 'Pakornsak (Ops Maker)',
    reason_code: 'CUSTOMER_REQUEST',
    created_at: '2026-03-12 14:20',
    status: 'PENDING_APPROVAL',
  },
];

const CancellationsRefundsPage: React.FC = () => {
  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<'ACTIVE_POLICIES' | 'APPROVAL_HUB' | 'CANCELLATION_LEDGER'>('ACTIVE_POLICIES');
  
  // Data state
  const [policies, setPolicies] = useState<PolicyRecord[]>(INITIAL_POLICIES);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>(INITIAL_APPROVAL_REQUESTS);
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [caseFilter, setCaseFilter] = useState<string>('ALL');
  
  // PDPA unmasked items tracker
  const [unmaskedCustomerIds, setUnmaskedCustomerIds] = useState<Record<string, boolean>>({});

  // Action Modal State (Screen 8.3.3)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyRecord | null>(null);
  
  // Modal Inputs
  const [cancelReason, setCancelReason] = useState<CancellationReasonCode>('CUSTOMER_REQUEST');
  const [refundAmountInput, setRefundAmountInput] = useState<string>('0');
  const [isExhaustionSelected, setIsExhaustionSelected] = useState<boolean>(false);
  const [modalFlags, setModalFlags] = useState({
    informInsurer: false,
    insurerConfirmed: false,
    moneyReturned: false,
  });

  // Segregation of Duties error banner state
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Toggle PDPA Unmask
  const toggleUnmaskPII = (customerId: string) => {
    setUnmaskedCustomerIds(prev => ({
      ...prev,
      [customerId]: !prev[customerId],
    }));
    showToast(`PDPA Notice: Unmask event logged in audit_logs for Customer ID ${customerId}`);
  };

  // Open Cancellation Modal (Screen 8.3.3)
  const handleOpenCancelModal = (policy: PolicyRecord) => {
    setSelectedPolicy(policy);
    setCancelReason('CUSTOMER_REQUEST');
    setIsExhaustionSelected(false);
    
    // Auto-calculate suggested Pro-Rata refund (simplified standard formula)
    const suggestedRefund = policy.cancellation_case === 'CASE_C' 
      ? 0 
      : Math.round((policy.paid_amount * 0.6) * 100) / 100;

    setRefundAmountInput(suggestedRefund.toString());
    setModalFlags({
      informInsurer: policy.tracking_flags.is_inform_insurer_cancel,
      insurerConfirmed: policy.tracking_flags.is_insurer_confirmed_cancel,
      moneyReturned: policy.tracking_flags.is_money_returned_to_customer,
    });
    setIsModalOpen(true);
  };

  // Clawback calculation based on Section 7.3 Stage 8 & 7.4
  // Formula: Clawback Amount = (Refunded Premium / Original Premium) * Original Commission
  const clawbackCalculations = useMemo(() => {
    if (!selectedPolicy) return { grossClawback: 0, whtAmount: 0, netClawback: 0 };
    
    // If Exhaustion Cancel (Case D Option 2): Clawback is 0
    if (isExhaustionSelected) {
      return { grossClawback: 0, whtAmount: 0, netClawback: 0 };
    }

    const parsedRefund = parseFloat(refundAmountInput) || 0;
    if (parsedRefund <= 0 || selectedPolicy.gross_premium <= 0) {
      return { grossClawback: 0, whtAmount: 0, netClawback: 0 };
    }

    const refundRatio = Math.min(parsedRefund / selectedPolicy.gross_premium, 1);
    const grossClawback = Math.round((refundRatio * selectedPolicy.original_commission_amount) * 100) / 100;
    const whtAmount = Math.round((grossClawback * 0.03) * 100) / 100; // 3% Thai Withholding Tax reversal
    const netClawback = Math.round((grossClawback - whtAmount) * 100) / 100;

    return { grossClawback, whtAmount, netClawback };
  }, [selectedPolicy, refundAmountInput, isExhaustionSelected]);

  // Execute Cancellation or Stage in Maker-Checker
  const handleSubmitCancellation = () => {
    if (!selectedPolicy) return;

    const refundAmt = isExhaustionSelected ? 0 : (parseFloat(refundAmountInput) || 0);

    // If refund > 0 or Case B, route through Maker-Checker approval_requests
    if (refundAmt > 0 || selectedPolicy.cancellation_case === 'CASE_B') {
      const newRequest: ApprovalRequest = {
        request_id: `req-${Date.now()}`,
        policy_id: selectedPolicy.policy_id,
        policy_number: selectedPolicy.policy_number,
        customer_name: selectedPolicy.customer_name,
        cancellation_case: selectedPolicy.cancellation_case,
        proposed_refund_amount: refundAmt,
        calculated_clawback_net: clawbackCalculations.netClawback,
        requested_by_user_id: CURRENT_ADMIN_USER.id,
        requested_by_name: CURRENT_ADMIN_USER.name,
        reason_code: isExhaustionSelected ? 'INSTALLMENT_EXHAUSTION' : cancelReason,
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'PENDING_APPROVAL',
      };

      setApprovalRequests([newRequest, ...approvalRequests]);
      setIsModalOpen(false);
      showToast(`Maker-Checker Ticket Staged: Cancellation Request #${newRequest.request_id} created for manager verification.`);
      setActiveTab('APPROVAL_HUB');
      return;
    }

    // Direct termination for Unpaid (Case C) or 0 Refund cases
    setPolicies(prev =>
      prev.map(p => {
        if (p.policy_id === selectedPolicy.policy_id) {
          return {
            ...p,
            status: 'CANCELLED',
            refund_amount: 0,
            clawback_amount: 0,
            scheduled_cancellation_date: isExhaustionSelected ? '2026-05-15 (Exhausted)' : new Date().toISOString().split('T')[0],
          };
        }
        return p;
      })
    );

    setIsModalOpen(false);
    showToast(`Policy ${selectedPolicy.policy_number} has been cancelled directly (0 THB refund).`);
  };

  // Checker Approves Request
  const handleApproveRequest = (request: ApprovalRequest) => {
    setApprovalError(null);

    // Enforce BRD Segregation of Duties (GOV-02, BO-08)
    if (request.requested_by_user_id === CURRENT_ADMIN_USER.id) {
      setApprovalError(
        `Segregation of Duties Violation (BO-08): You created this request (${request.requested_by_name}) and cannot approve your own submission.`
      );
      return;
    }

    // Process Approval & Balance Ledger
    setApprovalRequests(prev =>
      prev.map(r => (r.request_id === request.request_id ? { ...r, status: 'EXECUTED' } : r))
    );

    setPolicies(prev =>
      prev.map(p => {
        if (p.policy_id === request.policy_id) {
          return {
            ...p,
            status: 'CANCELLED',
            refund_amount: request.proposed_refund_amount,
            clawback_amount: request.calculated_clawback_net,
          };
        }
        return p;
      })
    );

    showToast(`Approved! Request #${request.request_id} executed. REFUND_OUT & CLAWBACK recorded in ledger.`);
  };

  // Filtered Policies
  const filteredPolicies = useMemo(() => {
    return policies.filter(p => {
      const matchesSearch =
        p.policy_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.reference_number.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCase = caseFilter === 'ALL' || p.cancellation_case === caseFilter;

      if (activeTab === 'CANCELLATION_LEDGER') {
        return matchesSearch && matchesCase && p.status === 'CANCELLED';
      }
      return matchesSearch && matchesCase && p.status === 'ACTIVE';
    });
  }, [policies, searchQuery, caseFilter, activeTab]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 flex items-center gap-3 bg-zinc-900 text-white px-4 py-3 rounded-lg shadow-lg border border-zinc-700 text-sm animate-fade-in">
          <Info className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Cancellations & Refunds Workspace</h1>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
              PAS Core Engine v2.0
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Governs the 4 lifecycle cancellation cases, manual refund overrides, agent clawbacks, and Maker-Checker segregation.
          </p>
        </div>

        {/* Current Operator Badge */}
        <div className="flex items-center gap-3 bg-zinc-100 border border-zinc-200 px-3.5 py-2 rounded-lg text-xs">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <div>
            <span className="text-zinc-500">Active Operator: </span>
            <strong className="text-zinc-800">{CURRENT_ADMIN_USER.name}</strong>
            <span className="text-zinc-400 ml-1">({CURRENT_ADMIN_USER.role})</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-zinc-200 gap-6">
        <button
          onClick={() => setActiveTab('ACTIVE_POLICIES')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'ACTIVE_POLICIES'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <span>Active Contracts Queue</span>
          <span className="bg-zinc-100 text-zinc-600 text-xs px-2 py-0.5 rounded-full border border-zinc-200 font-semibold">
            {policies.filter(p => p.status === 'ACTIVE').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('APPROVAL_HUB')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'APPROVAL_HUB'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <span>Maker-Checker Approval Hub</span>
          {approvalRequests.filter(r => r.status === 'PENDING_APPROVAL').length > 0 && (
            <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full border border-amber-300 font-bold">
              {approvalRequests.filter(r => r.status === 'PENDING_APPROVAL').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('CANCELLATION_LEDGER')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'CANCELLATION_LEDGER'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <span>Cancelled Policies Ledger</span>
          <span className="bg-zinc-100 text-zinc-600 text-xs px-2 py-0.5 rounded-full border border-zinc-200 font-semibold">
            {policies.filter(p => p.status === 'CANCELLED').length}
          </span>
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'APPROVAL_HUB' ? (
        /* ========================================================= */
        /* TAB 2: MAKER-CHECKER APPROVAL HUB                         */
        /* ========================================================= */
        <div className="space-y-4">
          {approvalError && (
            <div className="bg-rose-50 border border-rose-300 text-rose-800 p-4 rounded-lg flex items-start gap-3 text-sm">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Segregation of Duties Enforcement (BO-08 / Sec 5.3):</strong>
                <p className="mt-0.5">{approvalError}</p>
              </div>
            </div>
          )}

          <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-800">Pending Cancellation & Refund Approvals</h2>
                <p className="text-xs text-zinc-500">Requires Finance Manager check before REFUND_OUT and CLAWBACK hit the ledger.</p>
              </div>
              <span className="text-xs font-mono text-zinc-500 bg-white border border-zinc-200 px-2.5 py-1 rounded">
                Target: approval_requests
              </span>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-100/70 text-zinc-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Ticket ID</th>
                  <th className="py-3 px-4">Policy No.</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Handler Case</th>
                  <th className="py-3 px-4 text-right">Proposed Refund</th>
                  <th className="py-3 px-4 text-right">Agent Clawback (Net)</th>
                  <th className="py-3 px-4">Maker (Requested By)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {approvalRequests.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-zinc-400">
                      No pending approval requests in the queue.
                    </td>
                  </tr>
                ) : (
                  approvalRequests.map(req => (
                    <tr key={req.request_id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-zinc-700">{req.request_id}</td>
                      <td className="py-3.5 px-4 font-medium text-indigo-600">{req.policy_number}</td>
                      <td className="py-3.5 px-4 text-zinc-800">{req.customer_name}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          {req.cancellation_case}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-zinc-900">
                        THB {req.proposed_refund_amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-rose-600">
                        -THB {req.calculated_clawback_net.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-600">
                        <div>{req.requested_by_name}</div>
                        <span className="text-[10px] text-zinc-400 font-mono">{req.requested_by_user_id}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {req.status === 'PENDING_APPROVAL' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" /> Pending Review
                          </span>
                        )}
                        {req.status === 'EXECUTED' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Executed
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {req.status === 'PENDING_APPROVAL' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApproveRequest(req)}
                              className="px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition font-medium shadow-xs"
                            >
                              Approve & Swap
                            </button>
                            <button
                              onClick={() => {
                                setApprovalRequests(prev =>
                                  prev.map(r => (r.request_id === req.request_id ? { ...r, status: 'REJECTED' } : r))
                                );
                                showToast(`Request #${req.request_id} was rejected.`);
                              }}
                              className="px-2.5 py-1 bg-zinc-100 text-zinc-700 border border-zinc-200 rounded hover:bg-zinc-200 transition"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ========================================================= */
        /* TAB 1 & 3: POLICIES GRID (ACTIVE & CANCELLED)              */
        /* ========================================================= */
        <div className="space-y-4">
          {/* Action & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-zinc-200 shadow-2xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search policy no, customer, or reference ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-800"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-xs text-zinc-500 font-medium">Cancellation Case:</span>
              <select
                value={caseFilter}
                onChange={e => setCaseFilter(e.target.value)}
                className="text-xs bg-zinc-50 border border-zinc-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-800 font-medium"
              >
                <option value="ALL">All Handlers</option>
                <option value="CASE_A">Case A: Paid (Held by Broker)</option>
                <option value="CASE_B">Case B: Paid (Sent to Insurer)</option>
                <option value="CASE_C">Case C: Unpaid Contract</option>
                <option value="CASE_D">Case D: Installment Plan</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-100/70 text-zinc-600 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Policy Reference</th>
                    <th className="py-3 px-4">Customer (PDPA Protected)</th>
                    <th className="py-3 px-4">Product / Carrier</th>
                    <th className="py-3 px-4">Cancellation Rule Case</th>
                    <th className="py-3 px-4 text-right">Gross Premium</th>
                    <th className="py-3 px-4 text-right">Paid Amount</th>
                    <th className="py-3 px-4">Agent & Commission</th>
                    <th className="py-3 px-4">Fulfillment Flags</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {filteredPolicies.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-zinc-400">
                        No policies match the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPolicies.map(pol => {
                      const isUnmasked = !!unmaskedCustomerIds[pol.customer_id];
                      return (
                        <tr key={pol.policy_id} className="hover:bg-zinc-50/70 transition-colors">
                          {/* Policy Reference */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-zinc-900">{pol.policy_number}</div>
                            <div className="text-[11px] text-zinc-400 font-mono">{pol.reference_number}</div>
                          </td>

                          {/* Customer with PDPA Masking */}
                          <td className="py-3 px-4">
                            <div className="font-medium text-zinc-800">{pol.customer_name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-zinc-500 text-[11px]">
                                {isUnmasked ? pol.national_id_raw : pol.national_id_masked}
                              </span>
                              <button
                                onClick={() => toggleUnmaskPII(pol.customer_id)}
                                title={isUnmasked ? "Mask PII" : "Unmask PII (Audit Logged)"}
                                className="text-zinc-400 hover:text-indigo-600 transition"
                              >
                                {isUnmasked ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            </div>
                          </td>

                          {/* Product */}
                          <td className="py-3 px-4">
                            <div className="font-medium text-zinc-800">{pol.product_name}</div>
                            <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-zinc-400" />
                              {pol.insurer_name}
                            </div>
                          </td>

                          {/* Case Badge */}
                          <td className="py-3 px-4">
                            {pol.cancellation_case === 'CASE_A' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                Case A: Held by Broker
                              </span>
                            )}
                            {pol.cancellation_case === 'CASE_B' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                Case B: Sent to Carrier
                              </span>
                            )}
                            {pol.cancellation_case === 'CASE_C' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                                Case C: Unpaid (Offset)
                              </span>
                            )}
                            {pol.cancellation_case === 'CASE_D' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                Case D: Installment
                              </span>
                            )}
                          </td>

                          {/* Financials */}
                          <td className="py-3 px-4 text-right font-mono font-medium text-zinc-800">
                            THB {pol.gross_premium.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-zinc-900">
                            THB {pol.paid_amount.toLocaleString()}
                          </td>

                          {/* Agent */}
                          <td className="py-3 px-4">
                            <div className="text-zinc-800 font-medium">{pol.agent_name}</div>
                            <div className="text-[11px] text-zinc-400 font-mono">
                              Comm: THB {pol.original_commission_amount.toLocaleString()} ({pol.commission_rate_percent}%)
                            </div>
                          </td>

                          {/* Flags */}
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-1 text-[10px]">
                              <span className={`inline-flex items-center gap-1 ${pol.tracking_flags.is_inform_insurer_cancel ? 'text-emerald-700 font-medium' : 'text-zinc-400'}`}>
                                {pol.tracking_flags.is_inform_insurer_cancel ? <CheckSquare className="w-3 h-3 text-emerald-600" /> : <Square className="w-3 h-3" />}
                                Carrier Informed
                              </span>
                              <span className={`inline-flex items-center gap-1 ${pol.tracking_flags.is_insurer_confirmed_cancel ? 'text-emerald-700 font-medium' : 'text-zinc-400'}`}>
                                {pol.tracking_flags.is_insurer_confirmed_cancel ? <CheckSquare className="w-3 h-3 text-emerald-600" /> : <Square className="w-3 h-3" />}
                                Carrier Confirmed
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 text-center">
                            {pol.status === 'ACTIVE' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                ACTIVE
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                CANCELLED
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            {pol.status === 'ACTIVE' ? (
                              <button
                                onClick={() => handleOpenCancelModal(pol)}
                                className="px-3 py-1 bg-white border border-rose-300 text-rose-700 font-medium rounded hover:bg-rose-50 transition shadow-2xs"
                              >
                                Cancel Policy
                              </button>
                            ) : (
                              <div className="text-[11px] font-mono text-zinc-500">
                                Refund: THB {pol.refund_amount?.toLocaleString() || 0}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 8.3.3: CANCELLATION & REFUND ACTION MODAL                         */}
      {/* ========================================================================= */}
      {isModalOpen && selectedPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-zinc-200 w-full max-w-2xl overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Initiate Policy Cancellation & Refund</h3>
                <p className="text-xs text-zinc-500">
                  {selectedPolicy.policy_number} • {selectedPolicy.customer_name} ({selectedPolicy.product_name})
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs text-zinc-800 max-h-[75vh] overflow-y-auto">
              {/* Case Context Warning Banner */}
              <div className="p-3.5 rounded-lg border flex items-start gap-3 bg-zinc-50 border-zinc-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-zinc-900 flex items-center gap-2">
                    <span>Identified Scenario: {selectedPolicy.cancellation_case}</span>
                    <span className="font-mono text-[11px] font-normal text-zinc-500">
                      (Total Paid: THB {selectedPolicy.paid_amount.toLocaleString()})
                    </span>
                  </div>
                  <p className="text-zinc-600 mt-0.5 leading-relaxed">
                    {selectedPolicy.cancellation_case === 'CASE_A' &&
                      'Customer paid, Broker holds money. Refund is handled directly by Broker and hidden from the Insurer Payable ledger.'}
                    {selectedPolicy.cancellation_case === 'CASE_B' &&
                      'Customer paid, Broker already remitted funds to Insurer. You must coordinate with the Insurer, capture the approved refund amount, and execute the 5-step checklist.'}
                    {selectedPolicy.cancellation_case === 'CASE_C' &&
                      'Customer has not paid. Policy contract will be immediately terminated. No refund or commission clawback is incurred.'}
                    {selectedPolicy.cancellation_case === 'CASE_D' &&
                      'Installment policy. You may either issue an immediate manual refund or toggle "Cancel when paid money is exhausted".'}
                  </p>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Reason Selection */}
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Cancellation Reason</label>
                  <select
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value as CancellationReasonCode)}
                    className="w-full bg-white border border-zinc-200 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="CUSTOMER_REQUEST">Customer Direct Request</option>
                    <option value="NON_PAYMENT">Non-Payment / Default</option>
                    <option value="INSURER_MANDATED">Carrier Mandated Termination</option>
                    <option value="INSTALLMENT_EXHAUSTION">Installment Pro-Rata Exhaustion</option>
                  </select>
                </div>

                {/* Refund Input */}
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Approved Refund Amount (THB)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-zinc-400 font-mono">฿</span>
                    <input
                      type="number"
                      disabled={isExhaustionSelected || selectedPolicy.cancellation_case === 'CASE_C'}
                      value={isExhaustionSelected ? '0' : refundAmountInput}
                      onChange={e => setRefundAmountInput(e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 border border-zinc-200 rounded font-mono text-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1 block">
                    Max refundable: THB {selectedPolicy.paid_amount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Installment Exhaustion Option (Case D Special Feature) */}
              {selectedPolicy.cancellation_case === 'CASE_D' && (
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isExhaustionSelected}
                      onChange={e => setIsExhaustionSelected(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="font-semibold text-amber-900 block">
                        Cancel when paid money is exhausted (Option 2)
                      </span>
                      <span className="text-zinc-600 text-[11px] block">
                        The contract stays ACTIVE until the pro-rata value reaches 0 THB. Refund will be 0 THB and Agent Clawback will be 0 THB.
                      </span>
                    </div>
                  </label>
                </div>
              )}

              {/* 5-Step Checklist Flags for Case B */}
              {selectedPolicy.cancellation_case === 'CASE_B' && (
                <div className="border border-zinc-200 rounded-lg p-4 bg-zinc-50/50 space-y-2.5">
                  <span className="font-bold text-zinc-800 block text-[11px] uppercase tracking-wider">
                    5-Step Manual Operational Flags (Case B Protocol)
                  </span>

                  <label className="flex items-center gap-2 text-zinc-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modalFlags.informInsurer}
                      onChange={e => setModalFlags({ ...modalFlags, informInsurer: e.target.checked })}
                      className="w-3.5 h-3.5 rounded text-indigo-600 border-zinc-300"
                    />
                    <span>Flag 1: Inform Insurer of cancellation intent</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modalFlags.insurerConfirmed}
                      onChange={e => setModalFlags({ ...modalFlags, insurerConfirmed: e.target.checked })}
                      className="w-3.5 h-3.5 rounded text-indigo-600 border-zinc-300"
                    />
                    <span>Flag 2: Insurer Confirmed Cancel & verified fiat refund amount</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modalFlags.moneyReturned}
                      onChange={e => setModalFlags({ ...modalFlags, moneyReturned: e.target.checked })}
                      className="w-3.5 h-3.5 rounded text-indigo-600 border-zinc-300"
                    />
                    <span>Flag 3: Money Returned to Customer (Finance Wire Completed)</span>
                  </label>
                </div>
              )}

              {/* Real-Time Clawback Calculation Card */}
              <div className="p-4 bg-zinc-100 rounded-lg border border-zinc-200 space-y-2">
                <div className="flex items-center justify-between text-zinc-700">
                  <span className="font-semibold flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                    Agent Commission Clawback Breakdown
                  </span>
                  <span className="font-mono text-xs font-bold text-rose-600">
                    -THB {clawbackCalculations.netClawback.toLocaleString()} (Net Debit)
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-200 text-[11px] text-zinc-600 font-mono">
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Gross Clawback:</span>
                    THB {clawbackCalculations.grossClawback.toLocaleString()}
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">3% WHT Offset:</span>
                    THB {clawbackCalculations.whtAmount.toLocaleString()}
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Affected Agent:</span>
                    <span className="text-zinc-800">{selectedPolicy.agent_name}</span>
                  </div>
                </div>
              </div>

              {/* Maker-Checker Notice */}
              <div className="text-[11px] text-zinc-500 bg-blue-50 border border-blue-200 p-2.5 rounded text-blue-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Submitting this action will stage a record in <code className="font-bold">approval_requests</code>. A separate Finance Manager must confirm execution.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-zinc-200 bg-zinc-50 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 border border-zinc-300 rounded text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitCancellation}
                className="px-4 py-1.5 bg-rose-600 text-white rounded text-xs font-semibold hover:bg-rose-700 transition shadow-xs flex items-center gap-1.5"
              >
                <span>Stage Cancellation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CancellationsRefundsPage;