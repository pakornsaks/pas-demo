import {
  AlertCircle,
  ArrowDownRight,
  Calendar,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  Layers,
  Plus,
  Search,
  ShieldCheck,
  TrendingUp,
  X,
} from "lucide-react";
import React, { useMemo, useState } from "react";

// ============================================================================
// TYPES & ENUMS (Aligned with SDD Section 3.6 & Module 5)
// ============================================================================

export type TaxDocType =
  | "TAX_INVOICE_RECEIPT" // TRD Customer Tax Invoice & Receipt
  | "TAX_CREDIT_NOTE" // TRD Credit Note (CN) for VAT Reversal
  | "WHT_50_TAWI" // 50 Tawi (3% WHT on Agent Commission)
  | "OIC_POR_LOR_1"; // Flattened OIC Compliance Tax Register

export type TaxDocStatus = "ISSUED" | "PENDING_APPROVAL" | "CANCELLED" | "VOIDED";

export interface TaxDocumentItem {
  id: string;
  documentNumber: string; // Continuous atomic TRD sequence e.g., TAX-2026-00491
  documentType: TaxDocType;
  referencePolicyNumber: string; // Master policy reference
  originalInvoiceNumber?: string; // Populated if Credit Note
  taxIdMasked: string; // Default masked (e.g., 1-1004-XXXX-88-9)
  taxIdPlain: string; // Unmasked value stored in memory
  partyName: string; // Customer legal name or Agent Name
  entityType: "INDIVIDUAL" | "CORPORATE";
  insurerName: string; // Viriyah, MSIG, AIA, Muang Thai
  netPremium: number; // Net premium base
  stampDuty: number; // 0.4% Stamp Duty
  vatAmount: number; // 7.0% VAT Output
  grossTotal: number; // Final billing or credit value
  whtDeduction?: number; // 3.0% Withholding Tax (for 50 Tawi / Commissions)
  issuedDate: string;
  status: TaxDocStatus;
  s3VaultUrl: string; // Pre-signed S3 download URL
}

// ============================================================================
// MOCK DATA ACCORDING TO BRD & SDD SCHEMA
// ============================================================================

const MOCK_TAX_DOCUMENTS: TaxDocumentItem[] = [
  {
    id: "doc-uuid-001",
    documentNumber: "TAX-2026-000841",
    documentType: "TAX_INVOICE_RECEIPT",
    referencePolicyNumber: "VIR-26-994821",
    taxIdMasked: "1-1004-XXXX-88-9",
    taxIdPlain: "1-1004-58291-88-9",
    partyName: "Somchai Jaidee",
    entityType: "INDIVIDUAL",
    insurerName: "Viriyah Insurance",
    netPremium: 18000.0,
    stampDuty: 72.0, // 0.4%
    vatAmount: 1260.0, // 7.0%
    grossTotal: 19332.0,
    issuedDate: "2026-10-12 14:32:01",
    status: "ISSUED",
    s3VaultUrl: "https://s3.ap-southeast-1.amazonaws.com/pas-epolicy-vault/tax/TAX-2026-000841.pdf",
  },
  {
    id: "doc-uuid-002",
    documentNumber: "CN-2026-000104",
    documentType: "TAX_CREDIT_NOTE",
    referencePolicyNumber: "MSIG-26-441029",
    originalInvoiceNumber: "TAX-2026-000789",
    taxIdMasked: "0-1055-XXXX-12-1",
    taxIdPlain: "0-1055-49012-12-1",
    partyName: "Siam Logistics Co., Ltd.",
    entityType: "CORPORATE",
    insurerName: "MSIG Insurance",
    netPremium: -8500.0,
    stampDuty: -34.0,
    vatAmount: -595.0,
    grossTotal: -9129.0,
    issuedDate: "2026-10-12 11:18:40",
    status: "ISSUED",
    s3VaultUrl: "https://s3.ap-southeast-1.amazonaws.com/pas-epolicy-vault/tax/CN-2026-000104.pdf",
  },
  {
    id: "doc-uuid-003",
    documentNumber: "50TW-2026-003310",
    documentType: "WHT_50_TAWI",
    referencePolicyNumber: "MTI-26-881290",
    taxIdMasked: "3-1006-XXXX-44-2",
    taxIdPlain: "3-1006-77821-44-2",
    partyName: "Nipon Channarong (Sub-Agent)",
    entityType: "INDIVIDUAL",
    insurerName: "Muang Thai Insurance",
    netPremium: 0,
    stampDuty: 0,
    vatAmount: 0,
    grossTotal: 2500.0, // Gross commission
    whtDeduction: 75.0, // 3% WHT
    issuedDate: "2026-10-11 16:45:10",
    status: "ISSUED",
    s3VaultUrl: "https://s3.ap-southeast-1.amazonaws.com/pas-epolicy-vault/tax/50TW-2026-003310.pdf",
  },
  {
    id: "doc-uuid-004",
    documentNumber: "TAX-2026-000842",
    documentType: "TAX_INVOICE_RECEIPT",
    referencePolicyNumber: "AIA-26-771923",
    taxIdMasked: "1-1002-XXXX-71-3",
    taxIdPlain: "1-1002-99014-71-3",
    partyName: "Kanchana Wongsuwan",
    entityType: "INDIVIDUAL",
    insurerName: "AIA Thailand",
    netPremium: 45000.0,
    stampDuty: 180.0,
    vatAmount: 3150.0,
    grossTotal: 48330.0,
    issuedDate: "2026-10-10 09:20:15",
    status: "ISSUED",
    s3VaultUrl: "https://s3.ap-southeast-1.amazonaws.com/pas-epolicy-vault/tax/TAX-2026-000842.pdf",
  },
  {
    id: "doc-uuid-005",
    documentNumber: "CN-2026-000105",
    documentType: "TAX_CREDIT_NOTE",
    referencePolicyNumber: "VIR-26-990123",
    originalInvoiceNumber: "TAX-2026-000812",
    taxIdMasked: "1-1009-XXXX-65-8",
    taxIdPlain: "1-1009-33821-65-8",
    partyName: "Teerapat Kongkam",
    entityType: "INDIVIDUAL",
    insurerName: "Viriyah Insurance",
    netPremium: -12000.0,
    stampDuty: -48.0,
    vatAmount: -840.0,
    grossTotal: -12888.0,
    issuedDate: "2026-10-09 17:05:00",
    status: "PENDING_APPROVAL", // Staged in Maker-Checker queue
    s3VaultUrl: "",
  },
];

export const TaxDocumentCenter: React.FC = () => {
  // Navigation & Filtering State
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedInsurer, setSelectedInsurer] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<string>("2026-10");

  // PDPA Masking State (Tracks IDs unmasked during session)
  const [unmaskedDocs, setUnmaskedDocs] = useState<Record<string, boolean>>({});

  // Modals
  const [isGenerateInvoiceModal, setIsGenerateInvoiceModal] = useState<boolean>(false);
  const [isCreditNoteModal, setIsCreditNoteModal] = useState<boolean>(false);
  const [isAsyncReportModal, setIsAsyncReportModal] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    text: string;
    type: "success" | "info" | "warning";
  } | null>(null);

  // Filtered Documents
  const filteredDocuments = useMemo(() => {
    return MOCK_TAX_DOCUMENTS.filter((doc) => {
      // Tab filter
      if (activeTab === "TAX_INVOICE" && doc.documentType !== "TAX_INVOICE_RECEIPT") return false;
      if (activeTab === "CREDIT_NOTE" && doc.documentType !== "TAX_CREDIT_NOTE") return false;
      if (activeTab === "50_TAWI" && doc.documentType !== "WHT_50_TAWI") return false;

      // Insurer filter
      if (selectedInsurer !== "ALL" && doc.insurerName !== selectedInsurer) return false;

      // Status filter
      if (selectedStatus !== "ALL" && doc.status !== selectedStatus) return false;

      // Text query
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchNum = doc.documentNumber.toLowerCase().includes(query);
        const matchPol = doc.referencePolicyNumber.toLowerCase().includes(query);
        const matchName = doc.partyName.toLowerCase().includes(query);
        const matchTaxId = (unmaskedDocs[doc.id] ? doc.taxIdPlain : doc.taxIdMasked).toLowerCase().includes(query);
        if (!matchNum && !matchPol && !matchName && !matchTaxId) return false;
      }

      return true;
    });
  }, [activeTab, selectedInsurer, selectedStatus, searchQuery, unmaskedDocs]);

  // Financial KPI Aggregates
  const stats = useMemo(() => {
    const totalVat = MOCK_TAX_DOCUMENTS.reduce((acc, curr) => acc + curr.vatAmount, 0);
    const totalStamp = MOCK_TAX_DOCUMENTS.reduce((acc, curr) => acc + curr.stampDuty, 0);
    const totalWht = MOCK_TAX_DOCUMENTS.reduce((acc, curr) => acc + (curr.whtDeduction || 0), 0);
    const activeInvoices = MOCK_TAX_DOCUMENTS.filter((d) => d.documentType === "TAX_INVOICE_RECEIPT").length;
    const pendingCreditNotes = MOCK_TAX_DOCUMENTS.filter(
      (d) => d.documentType === "TAX_CREDIT_NOTE" && d.status === "PENDING_APPROVAL",
    ).length;

    return {
      totalVat,
      totalStamp,
      totalWht,
      activeInvoices,
      pendingCreditNotes,
    };
  }, []);

  // PDPA Audit Unmask Handler
  const toggleUnmaskTaxId = (docId: string, docNumber: string) => {
    const current = !!unmaskedDocs[docId];
    if (!current) {
      // Log audit trail event (POST /policies/{id}/unmask-pii)
      console.info(
        `[PDPA AUDIT LOG] Unmasked Tax ID for Document: ${docNumber}. Actor: CURRENT_ADMIN_UUID. Timestamp: ${new Date().toISOString()}`,
      );
      setNotification({
        text: `PDPA Audit Logged: Revealed Tax Identity for ${docNumber}`,
        type: "info",
      });
    }
    setUnmaskedDocs((prev) => ({ ...prev, [docId]: !current }));
  };

  const handleDownload = (doc: TaxDocumentItem) => {
    if (doc.status === "PENDING_APPROVAL") {
      setNotification({
        text: `Cannot download ${doc.documentNumber}: Awaiting Maker-Checker sign-off.`,
        type: "warning",
      });
      return;
    }
    setNotification({
      text: `Fetching pre-signed S3 download URL for ${doc.documentNumber} (valid 15m)...`,
      type: "success",
    });
  };

  return (
    // Note: -mt-6 -mx-6 eliminates the parent container's top and side padding flush with backoffice header
    <div className="-mt-6 -mx-6 min-h-full flex flex-col bg-zinc-50 text-zinc-900 font-sans antialiased">
      {/* ==================================================================== */}
      {/* TOP HEADER BAR (Flush to AdminLayout header, no top padding)          */}
      {/* ==================================================================== */}
      <div className="bg-white border-b border-zinc-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              TRD & OIC Tax Module
            </span>
            <span className="text-xs text-zinc-400">|</span>
            <span className="text-xs font-mono text-zinc-500">Atomic Sequential Generator: ACTIVE</span>
          </div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight mt-1">Tax Document & Compliance Center</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage Revenue Department tax invoices, credit notes, 50 Tawi withholding certificates, and monthly ledger
            filings.
          </p>
        </div>

        {/* Global Header Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsAsyncReportModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md border border-zinc-300 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Tax Export (Por.Lor. 1 / 50 Tawi)
          </button>

          <button
            onClick={() => setIsCreditNoteModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-md border border-amber-300 transition-colors"
          >
            <ArrowDownRight className="w-4 h-4 text-amber-600" />
            Issue Credit Note (CN)
          </button>

          <button
            onClick={() => setIsGenerateInvoiceModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white rounded-md shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Generate Tax Invoice
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* NOTIFICATION TOAST BAR                                               */}
      {/* ==================================================================== */}
      {notification && (
        <div className="mx-6 mt-4 p-3 rounded-md bg-zinc-900 text-white text-xs flex items-center justify-between shadow-sm animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* METRIC KPI CARDS (Financial Ledger Summary)                          */}
      {/* ==================================================================== */}
      <div className="px-6 pt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Output VAT */}
        <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Output VAT (7.0%)</span>
            <span className="p-1.5 rounded-md bg-blue-50 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-zinc-900 tracking-tight font-mono">
              ฿
              {stats.totalVat.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Net statutory liability to TRD</p>
          </div>
        </div>

        {/* 3% WHT Deduction */}
        <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Agent WHT (3.0%)</span>
            <span className="p-1.5 rounded-md bg-purple-50 text-purple-600">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-zinc-900 tracking-tight font-mono">
              ฿
              {stats.totalWht.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Withholding tax remittance pool</p>
          </div>
        </div>

        {/* Stamp Duty 0.4% */}
        <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Stamp Duty (0.4%)</span>
            <span className="p-1.5 rounded-md bg-amber-50 text-amber-600">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-zinc-900 tracking-tight font-mono">
              ฿
              {stats.totalStamp.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Statutory policy duty allocation</p>
          </div>
        </div>

        {/* Pending Reversals / Credit Notes */}
        <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Maker-Checker Queue</span>
            <span className="p-1.5 rounded-md bg-rose-50 text-rose-600">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-zinc-900 tracking-tight font-mono">
              {stats.pendingCreditNotes}{" "}
              <span className="text-xs font-normal text-zinc-500 font-sans">Pending CNs</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Awaiting checker sign-off for ledger posting</p>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* FILTER CONTROLS & TAB NAVIGATION                                     */}
      {/* ==================================================================== */}
      <div className="px-6 pt-6">
        <div className="bg-white rounded-lg border border-zinc-200 shadow-sm">
          {/* Tab Selection */}
          <div className="flex items-center border-b border-zinc-200 px-4 pt-2 overflow-x-auto">
            {[
              { id: "ALL", label: "All Documents" },
              {
                id: "TAX_INVOICE",
                label: "Tax Invoices & Receipts (ใบกำกับภาษี)",
              },
              { id: "CREDIT_NOTE", label: "Credit Notes (ใบลดหนี้)" },
              { id: "50_TAWI", label: "50 Tawi Certificates (50 ทวิ)" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-zinc-900 text-zinc-900"
                    : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filter Bar */}
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
            {/* Search Input */}
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search Tax Doc #, Policy #, Name, Tax ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-zinc-300 bg-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
              />
            </div>

            {/* Insurer Selector */}
            <div>
              <select
                value={selectedInsurer}
                onChange={(e) => setSelectedInsurer(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-300 bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                <option value="ALL">All Partner Insurers</option>
                <option value="Viriyah Insurance">Viriyah Insurance</option>
                <option value="Muang Thai Insurance">Muang Thai Insurance</option>
                <option value="MSIG Insurance">MSIG Insurance</option>
                <option value="AIA Thailand">AIA Thailand</option>
              </select>
            </div>

            {/* Status Selector */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-300 bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                <option value="ALL">All Document Statuses</option>
                <option value="ISSUED">ISSUED (Locked)</option>
                <option value="PENDING_APPROVAL">PENDING_APPROVAL (Checker)</option>
                <option value="CANCELLED">CANCELLED (Reversed)</option>
              </select>
            </div>

            {/* Tax Period Month Filter */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
              <input
                type="month"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-300 bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MAIN DATA TABLE                                                      */}
      {/* ==================================================================== */}
      <div className="px-6 py-4 flex-1">
        <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase font-semibold text-[11px] tracking-wider">
                  <th className="py-3 px-4">Document / Type</th>
                  <th className="py-3 px-4">Policy Reference</th>
                  <th className="py-3 px-4">Customer / Tax Identity (PDPA)</th>
                  <th className="py-3 px-4">Insurer</th>
                  <th className="py-3 px-4 text-right">Net Premium</th>
                  <th className="py-3 px-4 text-right">VAT (7%)</th>
                  <th className="py-3 px-4 text-right">Stamp Duty</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-zinc-400">
                      No tax documents found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc) => {
                    const isUnmasked = !!unmaskedDocs[doc.id];
                    const isCreditNote = doc.documentType === "TAX_CREDIT_NOTE";
                    const is50Tawi = doc.documentType === "WHT_50_TAWI";

                    return (
                      <tr key={doc.id} className="hover:bg-zinc-50/80 transition-colors">
                        {/* Doc Number & Badge */}
                        <td className="py-3.5 px-4 font-mono font-medium">
                          <div className="flex items-center gap-1.5">
                            <FileText
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isCreditNote ? "text-amber-600" : is50Tawi ? "text-purple-600" : "text-zinc-600"
                              }`}
                            />
                            <span className="text-zinc-900 font-semibold">{doc.documentNumber}</span>
                          </div>
                          <span
                            className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold border ${
                              isCreditNote
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : is50Tawi
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {doc.documentType.replace(/_/g, " ")}
                          </span>
                        </td>

                        {/* Reference Policy / Original Invoice */}
                        <td className="py-3.5 px-4 font-mono">
                          <div className="text-zinc-900">{doc.referencePolicyNumber}</div>
                          {doc.originalInvoiceNumber && (
                            <div className="text-[10px] text-zinc-500 font-sans mt-0.5">
                              Reversing: <span className="font-mono text-zinc-700">{doc.originalInvoiceNumber}</span>
                            </div>
                          )}
                          <div className="text-[10px] text-zinc-400 font-sans">{doc.issuedDate}</div>
                        </td>

                        {/* Name & PDPA Masked Tax ID */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-zinc-900 flex items-center gap-1.5">
                            <span>{doc.partyName}</span>
                            <span className="px-1 py-0.2 rounded text-[9px] bg-zinc-100 text-zinc-600 font-normal">
                              {doc.entityType}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-[11px] text-zinc-600">
                              {isUnmasked ? doc.taxIdPlain : doc.taxIdMasked}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleUnmaskTaxId(doc.id, doc.documentNumber)}
                              className="text-zinc-400 hover:text-zinc-700 focus:outline-none"
                              title={isUnmasked ? "Mask PII" : "Audit Unmask PII"}
                            >
                              {isUnmasked ? (
                                <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Insurer */}
                        <td className="py-3.5 px-4 text-zinc-700">{doc.insurerName}</td>

                        {/* Net Premium */}
                        <td className="py-3.5 px-4 text-right font-mono text-zinc-700">
                          {doc.netPremium !== 0
                            ? `฿${doc.netPremium.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                            : "—"}
                        </td>

                        {/* VAT (7%) */}
                        <td className="py-3.5 px-4 text-right font-mono">
                          <span className={doc.vatAmount < 0 ? "text-amber-700 font-semibold" : "text-zinc-700"}>
                            {doc.vatAmount !== 0
                              ? `฿${doc.vatAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                              : "—"}
                          </span>
                        </td>

                        {/* Stamp Duty */}
                        <td className="py-3.5 px-4 text-right font-mono text-zinc-700">
                          {doc.stampDuty !== 0
                            ? `฿${doc.stampDuty.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                            : "—"}
                        </td>

                        {/* Total Amount / Gross */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-zinc-900">
                          <span className={isCreditNote ? "text-rose-600" : ""}>
                            ฿
                            {doc.grossTotal.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                          {doc.whtDeduction && doc.whtDeduction > 0 && (
                            <div className="text-[10px] text-purple-700 font-normal">
                              WHT: -฿{doc.whtDeduction.toFixed(2)}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                              doc.status === "ISSUED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : doc.status === "PENDING_APPROVAL"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                            }`}
                          >
                            {doc.status === "ISSUED" && <CheckCircle2 className="w-3 h-3" />}
                            {doc.status === "PENDING_APPROVAL" && <AlertCircle className="w-3 h-3" />}
                            {doc.status}
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleDownload(doc)}
                              className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded border border-zinc-200 transition-colors"
                              title="Download PDF Schedule"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            {doc.status === "PENDING_APPROVAL" && (
                              <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                Maker Ticket
                              </span>
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

          {/* Table Footer / Pagination Metadata */}
          <div className="border-t border-zinc-200 px-4 py-3 bg-zinc-50 flex items-center justify-between text-xs text-zinc-500">
            <div>
              Showing <span className="font-semibold text-zinc-800">{filteredDocuments.length}</span> documents for tax
              period <span className="font-mono text-zinc-800">{dateFilter}</span>
            </div>
            <div className="text-[11px] text-zinc-400">
              TRD Locked Sequence Generator Engine v2.0 • Copy-On-Write Storage
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MODAL 1: GENERATE ON-DEMAND TAX INVOICE (POST /admin/finance/tax-invoices/{id}) */}
      {/* ==================================================================== */}
      {isGenerateInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-zinc-300 shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-900" />
                <h3 className="text-sm font-bold text-zinc-900">Generate Continuous Tax Invoice</h3>
              </div>
              <button onClick={() => setIsGenerateInvoiceModal(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <p className="text-zinc-600">
                Generates an immutable Thai Revenue Department (TRD) Tax Invoice & Official Receipt using the locked
                database sequence.
              </p>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Target Policy Number or UUID</label>
                <input
                  type="text"
                  placeholder="e.g., VIR-26-994821 or pol-uuid-xxxx"
                  className="w-full px-3 py-2 border border-zinc-300 rounded text-xs focus:ring-1 focus:ring-zinc-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Tax Calculation Validation</label>
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-zinc-600">
                    <span>Statutory VAT Rate:</span>
                    <span className="font-semibold text-zinc-900">7.0%</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>Stamp Duty Rate:</span>
                    <span className="font-semibold text-zinc-900">0.4%</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>Next Atomic Sequence:</span>
                    <span className="font-semibold text-emerald-700">TAX-2026-000843</span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-800 text-[11px]">
                <strong>TRD Invariant:</strong> Once generated, sequences cannot be deleted. Any cancellation must
                proceed through a legal Tax Credit Note (CN).
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-zinc-100 pt-3">
              <button
                type="button"
                onClick={() => setIsGenerateInvoiceModal(false)}
                className="px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-800 border border-zinc-300 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsGenerateInvoiceModal(false);
                  setNotification({
                    text: "Successfully generated Tax Invoice TAX-2026-000843 via locked sequence generator.",
                    type: "success",
                  });
                }}
                className="px-3.5 py-1.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white rounded"
              >
                Execute Issuance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: ISSUE TAX CREDIT NOTE (POST /admin/finance/tax-credit-notes) */}
      {/* ==================================================================== */}
      {isCreditNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-zinc-300 shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div className="flex items-center gap-2">
                <ArrowDownRight className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-zinc-900">Generate Legal Credit Note (CN)</h3>
              </div>
              <button onClick={() => setIsCreditNoteModal(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <p className="text-zinc-600">
                Satisfies OIC & TRD Cancellation Protocols. Reverses output VAT liability for cancelled or refunded
                policies.
              </p>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Original Invoice Number</label>
                <input
                  type="text"
                  placeholder="e.g., TAX-2026-000841"
                  className="w-full px-3 py-2 border border-zinc-300 rounded text-xs focus:ring-1 focus:ring-zinc-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Cancellation Reason Code</label>
                <select className="w-full px-3 py-2 border border-zinc-300 rounded text-xs bg-white text-zinc-800">
                  <option value="CUSTOMER_REQUEST">CUSTOMER_REQUEST (Handler A)</option>
                  <option value="INSURER_MANDATED">INSURER_MANDATED (Handler B)</option>
                  <option value="INSTALLMENT_EXHAUSTION">INSTALLMENT_EXHAUSTION (Handler D)</option>
                  <option value="INCORRECT_POLICY_DETAILS">INCORRECT_POLICY_DETAILS (Correction)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Approved Insurer Refund Amount (THB)</label>
                <input
                  type="number"
                  placeholder="e.g., 18000.00"
                  className="w-full px-3 py-2 border border-zinc-300 rounded text-xs font-mono"
                />
              </div>

              <div className="p-2.5 bg-zinc-100 border border-zinc-200 rounded text-[11px] text-zinc-600">
                <strong>Governance Notice:</strong> High-value Credit Notes require Maker-Checker sign-off. This request
                will be staged into <code className="font-mono text-zinc-800">approval_requests</code>.
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-zinc-100 pt-3">
              <button
                type="button"
                onClick={() => setIsCreditNoteModal(false)}
                className="px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-800 border border-zinc-300 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreditNoteModal(false);
                  setNotification({
                    text: "Credit note request staged into Maker-Checker inbox (BRD 7.9).",
                    type: "info",
                  });
                }}
                className="px-3.5 py-1.5 text-xs font-medium bg-amber-700 hover:bg-amber-800 text-white rounded"
              >
                Stage for Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: REGULATORY ASYNC TAX EXPORT (POST /admin/reports/generate)   */}
      {/* ==================================================================== */}
      {isAsyncReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-zinc-300 shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-zinc-900">Statutory Tax & Regulatory Export</h3>
              </div>
              <button onClick={() => setIsAsyncReportModal(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <p className="text-zinc-600">
                Offloads heavy compliance data extraction to the Read-Replica worker pool with public-key PGP encryption
                (SDD 5.16).
              </p>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Statutory Report Type</label>
                <select className="w-full px-3 py-2 border border-zinc-300 rounded text-xs bg-white text-zinc-800">
                  <option value="TRD_50_TAWI">TRD 50 Tawi (Withholding Tax Payout CSV & PDF)</option>
                  <option value="OIC_POR_LOR_1">OIC Por.Lor. 1 (Unified Premium & Tax Ledger)</option>
                  <option value="VAT_OUTPUT_REGISTER">TRD Output Tax Register (รายงานภาษีขาย)</option>
                  <option value="BROKER_PAYABLE_TAX">Insurer Bordereau Tax Settlement File</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Tax Filing Month</label>
                <input
                  type="month"
                  defaultValue="2026-10"
                  className="w-full px-3 py-2 border border-zinc-300 rounded text-xs"
                />
              </div>

              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded text-[11px] text-zinc-600 space-y-1">
                <div className="font-semibold text-zinc-800">Automated Transformations Applied:</div>
                <ul className="list-disc list-inside text-zinc-500 space-y-0.5">
                  <li>Strips dashes from Thai Citizen & Corporate IDs</li>
                  <li>In-memory AES-256 decryption on isolated worker threads</li>
                  <li>Direct streaming to AWS S3 Compliance Vault</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-zinc-100 pt-3">
              <button
                type="button"
                onClick={() => setIsAsyncReportModal(false)}
                className="px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-800 border border-zinc-300 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAsyncReportModal(false);
                  setNotification({
                    text: "Dispatched async reporting job JOB-TAX-8812 to background Pub/Sub queue.",
                    type: "success",
                  });
                }}
                className="px-3.5 py-1.5 text-xs font-medium bg-emerald-700 hover:bg-emerald-800 text-white rounded"
              >
                Dispatch Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxDocumentCenter;
