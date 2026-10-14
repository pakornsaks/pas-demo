import {
  AlertTriangle,
  Car,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  FileCheck2,
  FileText,
  HeartPulse,
  Lock,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Unlock,
  X,
  XCircle,
} from "lucide-react";
import React, { useMemo, useState, type SyntheticEvent } from "react";

// ============================================================================
// 1. DATA CONTRACTS & TYPES (Aligned with PAS SDD Section 3.3, 3.4 & DDL)
// ============================================================================

export type ApplicationStatus =
  | "PENDING_REVIEW"
  | "INFO_REQUIRED"
  | "QUOTATION_RATED"
  | "APPROVED_WAITING_PAYMENT"
  | "CONVERTED"
  | "REJECTED"
  | "WITHDRAWN_BY_CUSTOMER";

export type LineOfBusiness = "MOTOR" | "HEALTH" | "TRAVEL" | "PA" | "FIRE" | "LIFE" | "CUSTOM";

export type PayeeType = "BROKER" | "INSURER" | "THIRD_PARTY";
export type PaymentMethod = "CASH" | "CREDIT_CARD_FULL" | "INSTALLMENT";
export type FulfillmentType = "E_POLICY" | "PHYSICAL_MAIL";

export interface CustomerData {
  customer_id: string;
  legal_name: string;
  id_card_number_masked: string;
  phone_masked: string;
  unmasked_id_card?: string;
  unmasked_phone?: string;
  is_unmasked?: boolean;
}

export interface ApplicationRecord {
  application_id: string;
  quotation_id: string;
  policy_number?: string;
  customer: CustomerData;
  channel_id: number;
  channel_name: "Telesales" | "Direct Sale" | "Broker Website" | "Sub-Agent";
  lob_code: LineOfBusiness;
  product_name: string;
  gross_premium: number;
  payee_type: PayeeType;
  payment_method: PaymentMethod;
  fulfillment_type: FulfillmentType;
  is_payment_locked: boolean;
  status: ApplicationStatus;
  hours_elapsed: number;
  submitted_at: string;
  underwriter_notes?: string;
  loading_amount?: number;
  policy_exclusions?: string;
}

// Intake Form Payload for POST /applications
export interface IntakeFormData {
  quotation_id: string;
  customer_id: string;
  legal_name: string;
  id_card_number: string;
  phone_number: string;
  channel_id: number;
  payee_type: PayeeType;
  payment_method: PaymentMethod;
  fulfillment_type: FulfillmentType;
  target_effective_date: string;
  is_renewal: boolean;
  renewal_of_policy_id?: string;
  billing_address: {
    address_line: string;
    subdistrict: string;
    district: string;
    province: string;
    postal_code: string;
  };
  lob_code: LineOfBusiness;
  lob_extension_data: {
    license_plate_number?: string;
    chassis_number?: string;
    vehicle_model?: string;
    height_cm?: number;
    weight_kg?: number;
    has_pre_existing_condition?: boolean;
    custom_risk_payload?: string;
  };
}

// ============================================================================
// 2. MOCK REPOSITORY DATA (Representative of PostgreSQL Database)
// ============================================================================

const INITIAL_APPLICATIONS: ApplicationRecord[] = [
  {
    application_id: "APP-2026-0099",
    quotation_id: "QT-2026-8812",
    customer: {
      customer_id: "550e8400-e29b-41d4-a716-446655440001",
      legal_name: "Somchai Jaidee",
      id_card_number_masked: "1-1004-XXXX-88-9",
      phone_masked: "081-XXX-4921",
    },
    channel_id: 1,
    channel_name: "Telesales",
    lob_code: "MOTOR",
    product_name: "Viriyah Motor Type 1 EV Comprehensive",
    gross_premium: 24500.0,
    payee_type: "BROKER",
    payment_method: "INSTALLMENT",
    fulfillment_type: "E_POLICY",
    is_payment_locked: true,
    status: "PENDING_REVIEW",
    hours_elapsed: 26,
    submitted_at: "2026-10-11T09:15:00Z",
    underwriter_notes: "Vehicle age > 10 years referral trigger",
  },
  {
    application_id: "APP-2026-0104",
    quotation_id: "QT-2026-9043",
    customer: {
      customer_id: "550e8400-e29b-41d4-a716-446655440002",
      legal_name: "Kanya Wattanapruek",
      id_card_number_masked: "3-4011-XXXX-12-4",
      phone_masked: "089-XXX-9182",
    },
    channel_id: 3,
    channel_name: "Broker Website",
    lob_code: "HEALTH",
    product_name: "AIA Vitality Plus Gold Care",
    gross_premium: 18200.0,
    payee_type: "INSURER",
    payment_method: "CREDIT_CARD_FULL",
    fulfillment_type: "E_POLICY",
    is_payment_locked: false,
    status: "APPROVED_WAITING_PAYMENT",
    hours_elapsed: 3,
    submitted_at: "2026-10-12T11:45:00Z",
  },
  {
    application_id: "APP-2026-0078",
    quotation_id: "QT-2026-7731",
    policy_number: "TMP-2026-0001",
    customer: {
      customer_id: "550e8400-e29b-41d4-a716-446655440003",
      legal_name: "Nattapong Ruengsak",
      id_card_number_masked: "1-5099-XXXX-44-1",
      phone_masked: "062-XXX-7730",
    },
    channel_id: 4,
    channel_name: "Sub-Agent",
    lob_code: "CUSTOM",
    product_name: "MSIG Marine Cargo Bespoke Voyage",
    gross_premium: 45000.0,
    payee_type: "THIRD_PARTY",
    payment_method: "CASH",
    fulfillment_type: "PHYSICAL_MAIL",
    is_payment_locked: true,
    status: "QUOTATION_RATED",
    hours_elapsed: 48,
    submitted_at: "2026-10-10T14:20:00Z",
    loading_amount: 5000.0,
    policy_exclusions: "Excluding perishable deck freight without cold storage log.",
    underwriter_notes: "Underwriter applied 5,000 THB loading for high seas transshipment.",
  },
];

// ============================================================================
// 3. MAIN COMPONENT
// ============================================================================

export const ApplicationSearchAndIntakePage: React.FC = () => {
  // Application Data States
  const [applications, setApplications] = useState<ApplicationRecord[]>(INITIAL_APPLICATIONS);
  const [selectedApp, setSelectedApp] = useState<ApplicationRecord | null>(null);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [channelFilter, setChannelFilter] = useState<string>("ALL");
  const [lobFilter, setLobFilter] = useState<string>("ALL");

  // PDPA Unmasking Modal State
  const [unmaskTarget, setUnmaskTarget] = useState<ApplicationRecord | null>(null);
  const [unmaskJustification, setUnmaskJustification] = useState("");
  const [isSubmittingUnmask, setIsSubmittingUnmask] = useState(false);

  // New Application Intake Modal State
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);
  const [intakeStep, setIntakeStep] = useState<number>(1);
  const [intakeForm, setIntakeForm] = useState<IntakeFormData>({
    quotation_id: "",
    customer_id: "",
    legal_name: "",
    id_card_number: "",
    phone_number: "",
    channel_id: 1,
    payee_type: "BROKER",
    payment_method: "CREDIT_CARD_FULL",
    fulfillment_type: "E_POLICY",
    target_effective_date: new Date().toISOString().split("T")[0],
    is_renewal: false,
    billing_address: {
      address_line: "",
      subdistrict: "",
      district: "",
      province: "Bangkok",
      postal_code: "",
    },
    lob_code: "MOTOR",
    lob_extension_data: {
      license_plate_number: "",
      chassis_number: "",
      vehicle_model: "",
    },
  });

  // --------------------------------------------------------------------------
  // SEARCH & FILTER LOGIC
  // --------------------------------------------------------------------------
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchSearch =
        app.application_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.quotation_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.customer.legal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.customer.id_card_number_masked.includes(searchTerm) ||
        (app.policy_number && app.policy_number.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === "ALL" || app.status === statusFilter;
      const matchChannel = channelFilter === "ALL" || app.channel_id.toString() === channelFilter;
      const matchLob = lobFilter === "ALL" || app.lob_code === lobFilter;

      return matchSearch && matchStatus && matchChannel && matchLob;
    });
  }, [applications, searchTerm, statusFilter, channelFilter, lobFilter]);

  // --------------------------------------------------------------------------
  // PDPA UNMASKING HANDLER (POST /admin/customers/{uuid}/unmask)
  // --------------------------------------------------------------------------
  const handleUnmaskPII = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!unmaskTarget || !unmaskJustification.trim()) return;

    setIsSubmittingUnmask(true);

    try {
      // Simulation of async API call: POST /admin/customers/:id/unmask
      await new Promise((resolve) => setTimeout(resolve, 600));

      setApplications((prev) =>
        prev.map((item) => {
          if (item.application_id === unmaskTarget.application_id) {
            return {
              ...item,
              customer: {
                ...item.customer,
                id_card_number_masked: "1-1004-99823-88-9", // Revealed decrypted value
                phone_masked: "081-445-4921",
                is_unmasked: true,
              },
            };
          }
          return item;
        }),
      );

      setUnmaskTarget(null);
      setUnmaskJustification("");
    } finally {
      setIsSubmittingUnmask(false);
    }
  };

  // --------------------------------------------------------------------------
  // INTAKE SUBMISSION (POST /applications)
  // --------------------------------------------------------------------------
  const handleIntakeSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    const channelMap: Record<number, "Telesales" | "Direct Sale" | "Broker Website" | "Sub-Agent"> = {
      1: "Telesales",
      2: "Direct Sale",
      3: "Broker Website",
      4: "Sub-Agent",
    };

    const newApp: ApplicationRecord = {
      application_id: `APP-2026-0${Math.floor(100 + Math.random() * 900)}`,
      quotation_id: intakeForm.quotation_id || `QT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      customer: {
        customer_id: intakeForm.customer_id || "uuid-generated-cust-001",
        legal_name: intakeForm.legal_name,
        id_card_number_masked: intakeForm.id_card_number
          ? `${intakeForm.id_card_number.slice(0, 6)}XXXXX${intakeForm.id_card_number.slice(-2)}`
          : "1-1004-XXXX-99-0",
        phone_masked: intakeForm.phone_number
          ? `${intakeForm.phone_number.slice(0, 3)}-XXX-${intakeForm.phone_number.slice(-4)}`
          : "089-XXX-1234",
      },
      channel_id: intakeForm.channel_id,
      channel_name: channelMap[intakeForm.channel_id] || "Telesales",
      lob_code: intakeForm.lob_code,
      product_name:
        intakeForm.lob_code === "MOTOR"
          ? "Comprehensive Auto Gold"
          : intakeForm.lob_code === "HEALTH"
            ? "Health Prestige Elite"
            : "Specialty Risk Custom Slip",
      gross_premium: 16500.0,
      payee_type: intakeForm.payee_type,
      payment_method: intakeForm.payment_method,
      fulfillment_type: intakeForm.fulfillment_type,
      is_payment_locked: intakeForm.lob_code === "CUSTOM",
      status: intakeForm.lob_code === "CUSTOM" ? "PENDING_REVIEW" : "APPROVED_WAITING_PAYMENT",
      hours_elapsed: 0,
      submitted_at: new Date().toISOString(),
      underwriter_notes:
        intakeForm.lob_code === "CUSTOM"
          ? "Custom Lines 100% Mandatory Referral Rule triggered."
          : "Direct intake verification passed.",
    };

    setApplications([newApp, ...applications]);
    setIsIntakeModalOpen(false);
    setIntakeStep(1);
  };

  // Helper for Status Badge styling
  const renderStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case "APPROVED_WAITING_PAYMENT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approved - Waiting Payment
          </span>
        );
      case "PENDING_REVIEW":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pending Underwriter Review
          </span>
        );
      case "INFO_REQUIRED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <AlertTriangle className="w-3.5 h-3.5 text-blue-600" />
            Info Required (RFI)
          </span>
        );
      case "QUOTATION_RATED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <FileCheck2 className="w-3.5 h-3.5 text-purple-600" />
            Counter-Offer / Rated
          </span>
        );
      case "CONVERTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <PackageCheck className="w-3.5 h-3.5 text-teal-600" />
            Converted to Policy
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Declined / Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen text-slate-900">
      {/* -------------------------------------------------------------------- */}
      {/* HEADER SECTION */}
      {/* -------------------------------------------------------------------- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm font-bold">
                PAS
              </div>
              <div>
                <nav className="text-xs text-slate-500 font-medium">Policy Lifecycle &gt; Underwriting &amp; Ops</nav>
                <h1 className="text-lg font-bold text-slate-800">Application Search &amp; Intake</h1>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setIsIntakeModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-all focus:ring-2 focus:ring-indigo-500"
              >
                <Plus className="w-4 h-4" />
                New Application Intake
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------------- */}
      {/* CONTROL & SEARCH STRIP */}
      {/* -------------------------------------------------------------------- */}
      <main className="max-w-7xl mx-auto py-6 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="lg:col-span-5 relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by App ID, Quote ID, Customer Name, ID Card No..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
              />
            </div>

            {/* Status Filter */}
            <div className="lg:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Application States</option>
                <option value="PENDING_REVIEW">Pending Review</option>
                <option value="APPROVED_WAITING_PAYMENT">Approved - Wait Payment</option>
                <option value="QUOTATION_RATED">Quotation Rated (Counter-Offer)</option>
                <option value="INFO_REQUIRED">Info Required (RFI)</option>
                <option value="CONVERTED">Converted to Policy</option>
                <option value="REJECTED">Declined / Rejected</option>
              </select>
            </div>

            {/* Channel Filter */}
            <div className="lg:col-span-2">
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Channels</option>
                <option value="1">Telesales</option>
                <option value="2">Direct Sale</option>
                <option value="3">Website</option>
                <option value="4">Sub-Agent</option>
              </select>
            </div>

            {/* LOB Filter */}
            <div className="lg:col-span-2">
              <select
                value={lobFilter}
                onChange={(e) => setLobFilter(e.target.value)}
                className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All LOBs</option>
                <option value="MOTOR">Motor</option>
                <option value="HEALTH">Health</option>
                <option value="TRAVEL">Travel</option>
                <option value="PA">Personal Accident</option>
                <option value="FIRE">Fire</option>
                <option value="LIFE">Life</option>
                <option value="CUSTOM">Custom / Specialty</option>
              </select>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------------- */}
        {/* APPLICATIONS DATA GRID */}
        {/* -------------------------------------------------------------------- */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h2 className="font-semibold text-slate-800 text-sm">
                Application Intake Records ({filteredApplications.length})
              </h2>
            </div>
            <span className="text-xs text-slate-500">Auto-refreshed with Read-Replica sync</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-100/75 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Application Identifier</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">LOB &amp; Product</th>
                  <th className="px-6 py-3.5">Channel</th>
                  <th className="px-6 py-3.5">Gross Premium</th>
                  <th className="px-6 py-3.5">Status &amp; Lock</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      No applications found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map((app) => (
                    <tr key={app.application_id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Application Identifier */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{app.application_id}</div>
                        <div className="text-xs text-slate-400">Quote Ref: {app.quotation_id}</div>
                        {app.policy_number && (
                          <span className="inline-block mt-1 text-[11px] font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                            {app.policy_number}
                          </span>
                        )}
                      </td>

                      {/* Customer & PDPA */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{app.customer.legal_name}</div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                          <span>{app.customer.id_card_number_masked}</span>
                          {!app.customer.is_unmasked ? (
                            <button
                              type="button"
                              onClick={() => setUnmaskTarget(app)}
                              title="Audit unmask required"
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                              <EyeOff className="w-3 h-3" /> Unmasked
                            </span>
                          )}
                        </div>
                      </td>

                      {/* LOB & Product */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-0.5">
                          {app.lob_code === "MOTOR" && <Car className="w-3.5 h-3.5 text-blue-500" />}
                          {app.lob_code === "HEALTH" && <HeartPulse className="w-3.5 h-3.5 text-rose-500" />}
                          {app.lob_code === "CUSTOM" && <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />}
                          {app.lob_code}
                        </div>
                        <div className="text-xs text-slate-500 truncate max-w-xs" title={app.product_name}>
                          {app.product_name}
                        </div>
                      </td>

                      {/* Channel */}
                      <td className="px-6 py-4">
                        <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 font-medium">
                          {app.channel_name}
                        </span>
                      </td>

                      {/* Gross Premium */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800 font-mono">
                          {app.gross_premium.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {app.payee_type} &bull; {app.payment_method}
                        </div>
                      </td>

                      {/* Status & Concurrency Lock */}
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <div>{renderStatusBadge(app.status)}</div>
                          <div className="flex items-center gap-2">
                            {app.is_payment_locked ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-medium bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                <Lock className="w-3 h-3 text-amber-600" />
                                Payment Locked
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                <Unlock className="w-3 h-3 text-emerald-600" />
                                Checkout Unlocked
                              </span>
                            )}

                            {app.hours_elapsed >= 24 && app.status === "PENDING_REVIEW" && (
                              <span className="text-[11px] text-rose-600 font-semibold flex items-center gap-0.5">
                                <Clock className="w-3 h-3" /> {app.hours_elapsed}h SLA
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedApp(app)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all shadow-sm"
                        >
                          Workspace
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
      </main>

      {/* -------------------------------------------------------------------- */}
      {/* DRAWER: APPLICATION WORKSPACE INSPECTOR */}
      {/* -------------------------------------------------------------------- */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Header */}
              <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-500">
                    Application Workspace View
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">{selectedApp.application_id}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                {/* Status Callout */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 block">Current Triage State</span>
                    <div className="mt-1">{renderStatusBadge(selectedApp.status)}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Lock Gate</span>
                    <span className="text-xs font-semibold text-slate-700">
                      {selectedApp.is_payment_locked ? "Blocked (Payment Lock)" : "Open for Issuance"}
                    </span>
                  </div>
                </div>

                {/* Underwriting Audit Notice */}
                {selectedApp.underwriter_notes && (
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <div className="font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Underwriter Adjudication Notes
                    </div>
                    <p className="pl-5.5 text-amber-800">{selectedApp.underwriter_notes}</p>
                    {selectedApp.policy_exclusions && (
                      <div className="mt-2 pl-5.5 pt-2 border-t border-amber-200 font-semibold text-rose-700">
                        Exclusion Clause: {selectedApp.policy_exclusions}
                      </div>
                    )}
                  </div>
                )}

                {/* Golden Record Customer Info */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Customer KYC (Golden Record)
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-xs text-slate-400 block">Legal Insured Name</span>
                      <span className="font-medium text-slate-800">{selectedApp.customer.legal_name}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Customer UUID</span>
                      <span className="font-mono text-xs text-slate-600 truncate block">
                        {selectedApp.customer.customer_id}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">National ID Card</span>
                      <span className="font-mono text-slate-700">{selectedApp.customer.id_card_number_masked}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Telephone Number</span>
                      <span className="font-mono text-slate-700">{selectedApp.customer.phone_masked}</span>
                    </div>
                  </div>
                </div>

                {/* Pricing & Ledger Parameters */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Pricing &amp; Settlement Routing
                  </h4>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="text-xs text-slate-400 block">Payee Routing</span>
                      <span className="font-semibold text-slate-800">{selectedApp.payee_type}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="text-xs text-slate-400 block">Method</span>
                      <span className="font-semibold text-slate-800">{selectedApp.payment_method}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="text-xs text-slate-400 block">Fulfillment</span>
                      <span className="font-semibold text-slate-800">{selectedApp.fulfillment_type}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-50/50 rounded-lg border border-indigo-100 flex justify-between items-center">
                    <div>
                      <span className="text-xs text-indigo-700 font-medium block">Calculated Gross Premium</span>
                      <span className="text-xl font-bold font-mono text-indigo-950">
                        {selectedApp.gross_premium.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}{" "}
                      </span>
                    </div>
                    {selectedApp.loading_amount && selectedApp.loading_amount > 0 && (
                      <div className="text-right">
                        <span className="text-xs text-rose-600 font-medium block">Included Loading</span>
                        <span className="text-sm font-semibold text-rose-700">
                          +{selectedApp.loading_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Workspace Action Buttons */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="w-1/2 py-2.5 px-4 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Close Inspector
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(`Forwarding Application ${selectedApp.application_id} to Underwriter Adjudication.`);
                  setSelectedApp(null);
                }}
                className="w-1/2 py-2.5 px-4 bg-indigo-600 rounded-lg text-sm font-medium text-white hover:bg-indigo-700 shadow-sm"
              >
                Launch Underwriting Flow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL: PDPA AUDIT UNMASK (POST /admin/customers/{uuid}/unmask) */}
      {/* -------------------------------------------------------------------- */}
      {unmaskTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-rose-50/50">
              <div className="flex items-center gap-2 text-rose-700">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="font-semibold text-sm">Thai PDPA Governance Warning</h3>
              </div>
              <button
                type="button"
                onClick={() => setUnmaskTarget(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUnmaskPII} className="p-5 space-y-4 text-sm">
              <p className="text-xs text-slate-600 leading-relaxed">
                You are requesting to reveal unmasked Personal Identifiable Information (PII) for customer{" "}
                <strong>{unmaskTarget.customer.legal_name}</strong>. In accordance with OIC regulations, this event will
                be permanently written to the immutable <code>audit_logs</code> repository with your Operator UUID, IP
                address, and timestamp.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Operational Justification (Mandatory for Compliance)
                </label>
                <textarea
                  required
                  rows={3}
                  value={unmaskJustification}
                  onChange={(e) => setUnmaskJustification(e.target.value)}
                  placeholder="e.g. Identity verification for manual KYC mismatch referral"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUnmaskTarget(null)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUnmask}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  {isSubmittingUnmask ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                  Authorize &amp; Unmask
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL: APPLICATION INTAKE WIZARD (POST /applications) */}
      {/* -------------------------------------------------------------------- */}
      {isIntakeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8">
            {/* Modal Header & Stepper */}
            <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">Application Intake Gateway (POST /applications)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upgrade Quoted Pricing into Underwriting Application Ledger
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsIntakeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Indicators */}
            <div className="grid grid-cols-4 border-b border-slate-200 text-xs text-center font-medium">
              <div
                className={`py-2.5 border-b-2 ${
                  intakeStep === 1
                    ? "border-indigo-600 text-indigo-600 bg-white"
                    : "border-transparent text-slate-500 bg-slate-50"
                }`}
              >
                1. Quotation &amp; KYC
              </div>
              <div
                className={`py-2.5 border-b-2 ${
                  intakeStep === 2
                    ? "border-indigo-600 text-indigo-600 bg-white"
                    : "border-transparent text-slate-500 bg-slate-50"
                }`}
              >
                2. Settlement Routing
              </div>
              <div
                className={`py-2.5 border-b-2 ${
                  intakeStep === 3
                    ? "border-indigo-600 text-indigo-600 bg-white"
                    : "border-transparent text-slate-500 bg-slate-50"
                }`}
              >
                3. Tax &amp; Effective Date
              </div>
              <div
                className={`py-2.5 border-b-2 ${
                  intakeStep === 4
                    ? "border-indigo-600 text-indigo-600 bg-white"
                    : "border-transparent text-slate-500 bg-slate-50"
                }`}
              >
                4. LOB Polymorphic Data
              </div>
            </div>

            <form onSubmit={handleIntakeSubmit} className="p-6 space-y-4 text-sm">
              {/* STEP 1: QUOTATION & KYC IDENTIFIER */}
              {intakeStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Quotation ID (QT-XXXX) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="QT-2026-9812"
                        value={intakeForm.quotation_id}
                        onChange={(e) => setIntakeForm({ ...intakeForm, quotation_id: e.target.value })}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Sales Origin Channel *</label>
                      <select
                        value={intakeForm.channel_id}
                        onChange={(e) => setIntakeForm({ ...intakeForm, channel_id: Number(e.target.value) })}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        <option value={1}>1 - Telesales Internal</option>
                        <option value={2}>2 - Direct Sales Office</option>
                        <option value={3}>3 - Broker Web Direct</option>
                        <option value={4}>4 - Authorized Sub-Agent</option>
                      </select>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-3">
                    <span className="text-xs font-bold text-slate-800 uppercase block mb-2">
                      Customer Golden Record KYC
                    </span>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Full Legal Insured Name (TH/EN) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Somchai Jaidee"
                          value={intakeForm.legal_name}
                          onChange={(e) => setIntakeForm({ ...intakeForm, legal_name: e.target.value })}
                          className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            National ID / Tax Card Number *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="1100499823889"
                            value={intakeForm.id_card_number}
                            onChange={(e) => setIntakeForm({ ...intakeForm, id_card_number: e.target.value })}
                            className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Customer Telephone Contact *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="0814454921"
                            value={intakeForm.phone_number}
                            onChange={(e) => setIntakeForm({ ...intakeForm, phone_number: e.target.value })}
                            className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: SETTLEMENT & FULFILLMENT */}
              {intakeStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Payee Type Routing (BRD 6.4) *
                    </label>
                    <select
                      value={intakeForm.payee_type}
                      onChange={(e) => setIntakeForm({ ...intakeForm, payee_type: e.target.value as PayeeType })}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="BROKER">Customer Pays Broker (Direct Broker Collection)</option>
                      <option value="INSURER">Customer Pays Insurer Directly</option>
                      <option value="THIRD_PARTY">Customer Pays Third-Party Gateway</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method *</label>
                      <select
                        value={intakeForm.payment_method}
                        onChange={(e) =>
                          setIntakeForm({
                            ...intakeForm,
                            payment_method: e.target.value as PaymentMethod,
                          })
                        }
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="CREDIT_CARD_FULL">Credit Card Full Payment</option>
                        <option value="CASH">Cash / Bank Transfer</option>
                        <option value="INSTALLMENT">Multi-Cycle Installment</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Fulfillment Delivery Type *
                      </label>
                      <select
                        value={intakeForm.fulfillment_type}
                        onChange={(e) =>
                          setIntakeForm({
                            ...intakeForm,
                            fulfillment_type: e.target.value as FulfillmentType,
                          })
                        }
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="E_POLICY">E-Policy (PDF / S3 Encrypted)</option>
                        <option value="PHYSICAL_MAIL">Paper Mail (Real Hard Copy via Post)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={intakeForm.is_renewal}
                        onChange={(e) => setIntakeForm({ ...intakeForm, is_renewal: e.target.checked })}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-medium text-slate-700">
                        This is a Renewal Application (Links to Expiring Lineage Key)
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 3: EFFECTIVE DATE & TAX INVOICE ADDRESS */}
              {intakeStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target Effective Inception Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={intakeForm.target_effective_date}
                      onChange={(e) => setIntakeForm({ ...intakeForm, target_effective_date: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div className="border-t border-slate-200 pt-3 space-y-3">
                    <span className="text-xs font-bold text-slate-800 uppercase block">
                      TRD Tax Invoice Billing Address
                    </span>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">
                        Address Line (Building, Street, Road) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="88/1 Sukhumvit Rd Soi 21"
                        value={intakeForm.billing_address.address_line}
                        onChange={(e) =>
                          setIntakeForm({
                            ...intakeForm,
                            billing_address: {
                              ...intakeForm.billing_address,
                              address_line: e.target.value,
                            },
                          })
                        }
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Subdistrict / Tambon</label>
                        <input
                          type="text"
                          placeholder="Khlong Toei Nuea"
                          value={intakeForm.billing_address.subdistrict}
                          onChange={(e) =>
                            setIntakeForm({
                              ...intakeForm,
                              billing_address: {
                                ...intakeForm.billing_address,
                                subdistrict: e.target.value,
                              },
                            })
                          }
                          className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">District / Amphoe</label>
                        <input
                          type="text"
                          placeholder="Watthana"
                          value={intakeForm.billing_address.district}
                          onChange={(e) =>
                            setIntakeForm({
                              ...intakeForm,
                              billing_address: {
                                ...intakeForm.billing_address,
                                district: e.target.value,
                              },
                            })
                          }
                          className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Province</label>
                        <input
                          type="text"
                          placeholder="Bangkok"
                          value={intakeForm.billing_address.province}
                          onChange={(e) =>
                            setIntakeForm({
                              ...intakeForm,
                              billing_address: {
                                ...intakeForm.billing_address,
                                province: e.target.value,
                              },
                            })
                          }
                          className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Postal Code</label>
                        <input
                          type="text"
                          placeholder="10110"
                          value={intakeForm.billing_address.postal_code}
                          onChange={(e) =>
                            setIntakeForm({
                              ...intakeForm,
                              billing_address: {
                                ...intakeForm.billing_address,
                                postal_code: e.target.value,
                              },
                            })
                          }
                          className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: POLYMORPHIC LOB EXTENSION (Motor, Health, Custom) */}
              {intakeStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target Line of Business (LOB) *
                    </label>
                    <select
                      value={intakeForm.lob_code}
                      onChange={(e) =>
                        setIntakeForm({
                          ...intakeForm,
                          lob_code: e.target.value as LineOfBusiness,
                        })
                      }
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="MOTOR">Motor Insurance (policy_motor)</option>
                      <option value="HEALTH">Health Insurance (policy_health)</option>
                      <option value="CUSTOM">Custom &amp; Specialty Lines (policy_custom)</option>
                    </select>
                  </div>

                  {intakeForm.lob_code === "MOTOR" && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                      <span className="text-xs font-bold text-slate-700 block">Motor Risk Attributes</span>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-slate-600 mb-1">License Plate Number</label>
                          <input
                            type="text"
                            placeholder="1Kor-9988 Bangkok"
                            value={intakeForm.lob_extension_data.license_plate_number || ""}
                            onChange={(e) =>
                              setIntakeForm({
                                ...intakeForm,
                                lob_extension_data: {
                                  ...intakeForm.lob_extension_data,
                                  license_plate_number: e.target.value,
                                },
                              })
                            }
                            className="w-full text-xs p-2 border border-slate-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-600 mb-1">VIN / Chassis</label>
                          <input
                            type="text"
                            placeholder="MR0BA3BB20000000"
                            value={intakeForm.lob_extension_data.chassis_number || ""}
                            onChange={(e) =>
                              setIntakeForm({
                                ...intakeForm,
                                lob_extension_data: {
                                  ...intakeForm.lob_extension_data,
                                  chassis_number: e.target.value,
                                },
                              })
                            }
                            className="w-full text-xs p-2 border border-slate-300 rounded"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {intakeForm.lob_code === "HEALTH" && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                      <span className="text-xs font-bold text-slate-700 block">Health Risk Biometrics</span>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-slate-600 mb-1">Height (cm)</label>
                          <input
                            type="number"
                            placeholder="175"
                            value={intakeForm.lob_extension_data.height_cm || ""}
                            onChange={(e) =>
                              setIntakeForm({
                                ...intakeForm,
                                lob_extension_data: {
                                  ...intakeForm.lob_extension_data,
                                  height_cm: Number(e.target.value),
                                },
                              })
                            }
                            className="w-full text-xs p-2 border border-slate-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-600 mb-1">Weight (kg)</label>
                          <input
                            type="number"
                            placeholder="70"
                            value={intakeForm.lob_extension_data.weight_kg || ""}
                            onChange={(e) =>
                              setIntakeForm({
                                ...intakeForm,
                                lob_extension_data: {
                                  ...intakeForm.lob_extension_data,
                                  weight_kg: Number(e.target.value),
                                },
                              })
                            }
                            className="w-full text-xs p-2 border border-slate-300 rounded"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {intakeForm.lob_code === "CUSTOM" && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        100% Mandatory Referral Notification
                      </div>
                      <p className="text-xs text-amber-800">
                        Submitting a Custom/Specialty application bypasses auto-approve logic and forces the state into{" "}
                        <code>PENDING_REVIEW</code> with payment lock engaged[cite: 1, 2].
                      </p>
                      <textarea
                        rows={3}
                        placeholder='{"vessel_imo": "938201", "cargo_tonnage": 450, "voyage_origin": "Laem Chabang"}'
                        value={intakeForm.lob_extension_data.custom_risk_payload || ""}
                        onChange={(e) =>
                          setIntakeForm({
                            ...intakeForm,
                            lob_extension_data: {
                              ...intakeForm.lob_extension_data,
                              custom_risk_payload: e.target.value,
                            },
                          })
                        }
                        className="w-full text-xs p-2 font-mono border border-amber-300 rounded focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Stepper Navigation Buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                {intakeStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setIntakeStep((prev) => prev - 1)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Previous Step
                  </button>
                ) : (
                  <div />
                )}

                {intakeStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => setIntakeStep((prev) => prev + 1)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5"
                  >
                    <PackageCheck className="w-4 h-4" />
                    Submit Application &amp; Triage
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationSearchAndIntakePage;
