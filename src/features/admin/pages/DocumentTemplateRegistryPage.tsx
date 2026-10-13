import {
  AlertCircle,
  Archive,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  Download,
  Eye,
  FileText,
  Filter,
  Layers,
  Plus,
  Search,
  UploadCloud,
  X,
} from "lucide-react";
import React, { useMemo, useState } from "react";

// ============================================================================
// Types & Schema Alignment (DDL 4.5: document_templates & policy_versions)
// ============================================================================

export type TemplateStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export interface DocumentTemplate {
  template_id: string;
  product_version_id: string;
  product_code: string;
  product_name: string;
  lob_code: "MOTOR" | "HEALTH" | "TRAVEL" | "FIRE" | "LIFE" | "CUSTOM";
  template_name: string;
  version_number: number;
  s3_docx_url: string;
  status: TemplateStatus;
  effective_start_date: string;
  created_at: string;
  created_by_name: string;
  file_size_kb: number;
  sample_tags: string[];
}

interface TemplateFormData {
  template_name: string;
  product_version_id: string;
  status: TemplateStatus;
  effective_start_date: string;
  fileName: string;
}

// ============================================================================
// Mock Data (Reflecting Unified Insurance Broker Platform Products & LOBs)
// ============================================================================

const MOCK_TEMPLATES: DocumentTemplate[] = [
  {
    template_id: "d9b73461-12c4-42b7-a36a-f1f41d9be001",
    product_version_id: "a1122334-0001-4455-8899-aabbccddeeff",
    product_code: "MOT-VIR-T1-2026",
    product_name: "Viriyah Motor Type 1 Comprehensive",
    lob_code: "MOTOR",
    template_name: "Motor Policy Schedule & Tax Invoice Layout",
    version_number: 3,
    s3_docx_url: "s3://pas-templates-vault/motor/v3/viriyah_type1_schedule_2026.docx",
    status: "ACTIVE",
    effective_start_date: "2026-01-01T00:00:00Z",
    created_at: "2025-12-15T10:30:00Z",
    created_by_name: "Pakornsak S. (Maker)",
    file_size_kb: 482,
    sample_tags: [
      "{{ policy_number }}",
      "{{ customer.legal_name_th }}",
      "{{ vehicle.chassis_number }}",
      "{{ vehicle.sum_insured }}",
      "{{ premium.gross_premium }}",
    ],
  },
  {
    template_id: "f87a3290-78a2-4a55-bc99-1a2b3c4d5e02",
    product_version_id: "b2233445-0002-5566-9900-bbccddeeff00",
    product_code: "TRV-MSIG-EASY-2026",
    product_name: "MSIG Travel Easy Worldwide",
    lob_code: "TRAVEL",
    template_name: "Travel Policy Certificate (Visa Approved)",
    version_number: 1,
    s3_docx_url: "s3://pas-templates-vault/travel/v1/msig_schengen_visa_cert.docx",
    status: "ACTIVE",
    effective_start_date: "2026-02-01T00:00:00Z",
    created_at: "2026-01-20T14:15:00Z",
    created_by_name: "Sarawut T. (Ops)",
    file_size_kb: 315,
    sample_tags: [
      "{{ policy_number }}",
      "{{#policy_travel_members}}",
      "{{ passport_number }}",
      "{{ trip_start_date }}",
      "{{/policy_travel_members}}",
    ],
  },
  {
    template_id: "e45b8812-349c-4819-90b1-3c4d5e6f7a03",
    product_version_id: "c3344556-0003-6677-0011-ccddeeff0011",
    product_code: "HEA-AIA-SUPER-2026",
    product_name: "AIA Health Super Coverage Plus",
    lob_code: "HEALTH",
    template_name: "Health Schedule & Red Exclusion Endorsement",
    version_number: 2,
    s3_docx_url: "s3://pas-templates-vault/health/v2/aia_health_schedule_excl.docx",
    status: "ACTIVE",
    effective_start_date: "2026-03-01T00:00:00Z",
    created_at: "2026-02-10T09:45:00Z",
    created_by_name: "Nattaporn W. (UW)",
    file_size_kb: 620,
    sample_tags: [
      "{{ customer.legal_name_th }}",
      "{{ bmi_value }}",
      "{{ policy_exclusions }}",
      "{{ plan.deductible_amount }}",
    ],
  },
  {
    template_id: "c12d4567-89ab-4cde-0123-456789abcdef",
    product_version_id: "d4455667-0004-7788-1122-ddeeff001122",
    product_code: "CUS-MAR-CARGO-2026",
    product_name: "Marine Cargo Custom Transit Policy",
    lob_code: "CUSTOM",
    template_name: "Dynamic Marine Risk Slip & Marine Open Cover",
    version_number: 1,
    s3_docx_url: "s3://pas-templates-vault/custom/v1/marine_cargo_open_cover.docx",
    status: "DRAFT",
    effective_start_date: "2026-04-01T00:00:00Z",
    created_at: "2026-03-12T16:00:00Z",
    created_by_name: "Pakornsak S. (Maker)",
    file_size_kb: 240,
    sample_tags: [
      "{{ custom_risk_data.vessel_name }}",
      "{{ custom_risk_data.voyage_route }}",
      "{{ custom_risk_data.cargo_type }}",
      "{{ loading_amount }}",
    ],
  },
  {
    template_id: "b9988776-6543-4321-fedc-ba9876543210",
    product_version_id: "a1122334-0001-4455-8899-aabbccddeeff",
    product_code: "MOT-VIR-T1-2025",
    product_name: "Viriyah Motor Type 1 Comprehensive (Legacy 2025)",
    lob_code: "MOTOR",
    template_name: "Motor Policy Schedule & Tax Invoice Layout (2025)",
    version_number: 2,
    s3_docx_url: "s3://pas-templates-vault/motor/v2/viriyah_type1_schedule_2025_archived.docx",
    status: "ARCHIVED",
    effective_start_date: "2025-01-01T00:00:00Z",
    created_at: "2024-12-20T11:00:00Z",
    created_by_name: "System Migration Job",
    file_size_kb: 450,
    sample_tags: ["{{ policy_number }}", "{{ customer.legal_name_th }}", "{{ premium.gross_premium }}"],
  },
];

const AVAILABLE_PRODUCT_VERSIONS = [
  { id: "a1122334-0001-4455-8899-aabbccddeeff", code: "MOT-VIR-T1-2026", name: "Viriyah Motor Type 1", lob: "MOTOR" },
  { id: "b2233445-0002-5566-9900-bbccddeeff00", code: "TRV-MSIG-EASY-2026", name: "MSIG Travel Easy", lob: "TRAVEL" },
  { id: "c3344556-0003-6677-0011-ccddeeff0011", code: "HEA-AIA-SUPER-2026", name: "AIA Health Super", lob: "HEALTH" },
  {
    id: "d4455667-0004-7788-1122-ddeeff001122",
    code: "CUS-MAR-CARGO-2026",
    name: "Marine Cargo Custom",
    lob: "CUSTOM",
  },
  {
    id: "e5566778-0005-8899-2233-eeff00112233",
    code: "FIR-MUM-HOME-2026",
    name: "Muang Thai Fire Residential",
    lob: "FIRE",
  },
];

export const DocumentTemplateRegistry: React.FC = () => {
  const [templates, setTemplates] = useState<DocumentTemplate[]>(MOCK_TEMPLATES);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLob, setSelectedLob] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [inspectTemplate, setInspectTemplate] = useState<DocumentTemplate | null>(null);

  // Upload Form State
  const [formData, setFormData] = useState<TemplateFormData>({
    template_name: "",
    product_version_id: AVAILABLE_PRODUCT_VERSIONS[0].id,
    status: "ACTIVE",
    effective_start_date: new Date().toISOString().split("T")[0],
    fileName: "",
  });

  // Filtered list
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      const matchesSearch =
        tpl.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tpl.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tpl.s3_docx_url.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLob = selectedLob === "ALL" || tpl.lob_code === selectedLob;
      const matchesStatus = selectedStatus === "ALL" || tpl.status === selectedStatus;

      return matchesSearch && matchesLob && matchesStatus;
    });
  }, [templates, searchTerm, selectedLob, selectedStatus]);

  // Aggregate metrics
  const stats = useMemo(() => {
    const total = templates.length;
    const active = templates.filter((t) => t.status === "ACTIVE").length;
    const draft = templates.filter((t) => t.status === "DRAFT").length;
    const archived = templates.filter((t) => t.status === "ARCHIVED").length;
    return { total, active, draft, archived };
  }, [templates]);

  // Handle Form Submit
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.template_name || !formData.fileName) {
      alert("Please fill out all required fields and select a .docx layout template.");
      return;
    }

    const matchedProduct = AVAILABLE_PRODUCT_VERSIONS.find((p) => p.id === formData.product_version_id);

    const newTemplate: DocumentTemplate = {
      template_id: crypto.randomUUID(),
      product_version_id: formData.product_version_id,
      product_code: matchedProduct?.code || "GEN-PROD-2026",
      product_name: matchedProduct?.name || "General Insurance Product",
      lob_code: (matchedProduct?.lob as DocumentTemplate["lob_code"]) || "CUSTOM",
      template_name: formData.template_name,
      version_number: 1,
      s3_docx_url: `s3://pas-templates-vault/${(matchedProduct?.lob || "general").toLowerCase()}/v1/${formData.fileName}`,
      status: formData.status,
      effective_start_date: new Date(formData.effective_start_date).toISOString(),
      created_at: new Date().toISOString(),
      created_by_name: "Current Operator",
      file_size_kb: Math.floor(Math.random() * 300) + 180,
      sample_tags: [
        "{{ policy_number }}",
        "{{ customer.legal_name_th }}",
        "{{ premium.gross_premium }}",
        "{{ effective_start_date }}",
      ],
    };

    setTemplates([newTemplate, ...templates]);
    setIsUploadModalOpen(false);
    setFormData({
      template_name: "",
      product_version_id: AVAILABLE_PRODUCT_VERSIONS[0].id,
      status: "ACTIVE",
      effective_start_date: new Date().toISOString().split("T")[0],
      fileName: "",
    });
  };

  const handleStatusToggle = (id: string, newStatus: TemplateStatus) => {
    setTemplates((prev) => prev.map((t) => (t.template_id === id ? { ...t, status: newStatus } : t)));
  };

  return (
    // Top container has pt-0 as specified to avoid extra padding inside AdminLayout's <main className="p-6">
    <div className="pt-0 space-y-6 w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">Document Template Registry</h1>
          </div>
          <p className="text-xs text-zinc-500 mt-1 max-w-2xl">
            Central repository mapping legal Microsoft Word (.docx) layouts to immutable product version snapshots.
            Offloaded to background Pub/Sub DocGen workers for asynchronous PDF e-policy issuance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
          >
            <Plus className="w-4 h-4" />
            Register New Template
          </button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500">Total Registered</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1">{stats.total}</p>
          </div>
          <span className="p-2.5 rounded-xl bg-zinc-100 text-zinc-600">
            <Layers className="w-5 h-5" />
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500">Live Active Layouts</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.active}</p>
          </div>
          <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500">Pending Drafts</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.draft}</p>
          </div>
          <span className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <Clock className="w-5 h-5" />
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500">Historical Archived</p>
            <p className="text-2xl font-bold text-zinc-500 mt-1">{stats.archived}</p>
          </div>
          <span className="p-2.5 rounded-xl bg-zinc-100 text-zinc-500 border border-zinc-200">
            <Archive className="w-5 h-5" />
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by template name, product code, or S3 key..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs text-zinc-900 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-zinc-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium shrink-0">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            Filters:
          </div>

          {/* LOB Selector */}
          <select
            value={selectedLob}
            onChange={(e) => setSelectedLob(e.target.value)}
            className="text-xs text-zinc-800 border border-zinc-200 bg-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All LOBs</option>
            <option value="MOTOR">Motor</option>
            <option value="HEALTH">Health</option>
            <option value="TRAVEL">Travel</option>
            <option value="FIRE">Fire</option>
            <option value="CUSTOM">Custom LOB</option>
          </select>

          {/* Status Selector */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs text-zinc-800 border border-zinc-200 bg-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DRAFT">DRAFT</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>

          {(searchTerm || selectedLob !== "ALL" || selectedStatus !== "ALL") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedLob("ALL");
                setSelectedStatus("ALL");
              }}
              className="p-1 text-xs text-zinc-400 hover:text-zinc-600 rounded"
              title="Clear filters"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Registry Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/75 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                <th className="py-3 px-4">Template Specification</th>
                <th className="py-3 px-4">Bound Product Snapshot</th>
                <th className="py-3 px-4">S3 Vault Location</th>
                <th className="py-3 px-4">Version & Timing</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-xs text-zinc-700">
              {filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-zinc-300 stroke-1" />
                    No document templates found matching the current search and filters.
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((template) => (
                  <tr key={template.template_id} className="hover:bg-zinc-50/60 transition-colors">
                    {/* Template Name & Details */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-900">{template.template_name}</div>
                      <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                        UUID: {template.template_id.substring(0, 18)}...
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                          {template.lob_code}
                        </span>
                        <span className="text-[11px] text-zinc-400">{template.file_size_kb} KB (.docx)</span>
                      </div>
                    </td>

                    {/* Linked Product & Version */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-zinc-900">{template.product_name}</div>
                      <div className="text-[11px] font-mono text-indigo-600 mt-0.5">{template.product_code}</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">
                        ver_id: {template.product_version_id.substring(0, 13)}...
                      </div>
                    </td>

                    {/* S3 URI */}
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div
                        className="max-w-[220px] truncate text-zinc-600 bg-zinc-100/70 px-2 py-1 rounded border border-zinc-200/80"
                        title={template.s3_docx_url}
                      >
                        {template.s3_docx_url}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-1">By {template.created_by_name}</div>
                    </td>

                    {/* Version & Timing */}
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-800">
                        v{template.version_number}.0
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-1">
                        Start: {new Date(template.effective_start_date).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          template.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : template.status === "DRAFT"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-zinc-100 text-zinc-500 border border-zinc-200"
                        }`}
                      >
                        {template.status}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setInspectTemplate(template)}
                          className="p-1.5 text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Inspect Template Tags & Bindings"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <a
                          href="#download"
                          onClick={(e) => {
                            e.preventDefault();
                            alert(`Initiating IAM Pre-Signed download URL for: ${template.s3_docx_url}`);
                          }}
                          className="p-1.5 text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Download Word (.docx) Template"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        {template.status === "ACTIVE" ? (
                          <button
                            onClick={() => handleStatusToggle(template.template_id, "ARCHIVED")}
                            className="p-1.5 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
                            title="Archive Template"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusToggle(template.template_id, "ACTIVE")}
                            className="p-1.5 text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Promote to Active"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Audit Context */}
        <div className="py-3 px-4 bg-zinc-50 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-500 gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>DocGen Async Worker Pool Operational (Sub-5s SLA fulfillment)</span>
          </div>
          <div>
            Showing {filteredTemplates.length} of {templates.length} Registered Document Blueprints
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODAL: Register New Document Template (.docx Upload)                 */}
      {/* ===================================================================== */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50/50">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                  <UploadCloud className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Upload Legal Document Blueprint</h3>
                  <p className="text-[11px] text-zinc-500">
                    Attach Microsoft Word (.docx) layout with Jinja2 placeholder bindings.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Template Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Muang Thai Comprehensive Schedule 2026"
                  value={formData.template_name}
                  onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Bound Product Version <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.product_version_id}
                    onChange={(e) => setFormData({ ...formData, product_version_id: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    {AVAILABLE_PRODUCT_VERSIONS.map((pv) => (
                      <option key={pv.id} value={pv.id}>
                        [{pv.lob}] {pv.code} - {pv.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Initial Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as TemplateStatus })}
                    className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="ACTIVE">ACTIVE (Ready for Issuance)</option>
                    <option value="DRAFT">DRAFT (Testing Only)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Effective Start Date</label>
                <input
                  type="date"
                  value={formData.effective_start_date}
                  onChange={(e) => setFormData({ ...formData, effective_start_date: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Drag and Drop Zone */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Layout File (.docx only) <span className="text-rose-500">*</span>
                </label>
                <div className="border-2 border-dashed border-zinc-200 hover:border-indigo-400 rounded-xl p-5 text-center transition-colors bg-zinc-50/50">
                  <FileText className="w-8 h-8 mx-auto text-zinc-400 mb-2 stroke-1" />
                  <p className="text-xs text-zinc-700 font-medium">
                    {formData.fileName ? (
                      <span className="text-indigo-600 font-bold">{formData.fileName}</span>
                    ) : (
                      "Click to select file or drag Word template here"
                    )}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-1">Supports Microsoft Word .docx templates up to 25MB.</p>
                  <input
                    type="file"
                    accept=".docx"
                    className="hidden"
                    id="template-file-upload"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFormData({ ...formData, fileName: e.target.files[0].name });
                      }
                    }}
                  />
                  <label
                    htmlFor="template-file-upload"
                    className="mt-3 inline-block px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg cursor-pointer hover:bg-zinc-100 shadow-xs"
                  >
                    Browse Files
                  </label>
                </div>
              </div>

              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] text-amber-800 leading-relaxed">
                  <strong>Copy-on-Write Immutability:</strong> Uploading modifications creates a new incremental version
                  record. Prior template versions are preserved in S3 for retroactive 10-year OIC claims auditing.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-800 rounded-lg hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                >
                  Save & Push to S3 Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL / DRAWER: Inspect Template Details & Syntax Tags                 */}
      {/* ===================================================================== */}
      {inspectTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                  <Code2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">
                    Template Inspection: {inspectTemplate.template_name}
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Jinja2 & Docxtemplater Tag Bindings for {inspectTemplate.product_code}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectTemplate(null)}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Metadata Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold tracking-wider">
                    Template ID
                  </span>
                  <span className="font-mono text-zinc-800 break-all">{inspectTemplate.template_id}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold tracking-wider">
                    S3 Storage Anchor
                  </span>
                  <span className="font-mono text-zinc-800 break-all">{inspectTemplate.s3_docx_url}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold tracking-wider">
                    Bound Product Version
                  </span>
                  <span className="font-mono text-indigo-600">{inspectTemplate.product_code}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold tracking-wider">
                    Temporal Start Date
                  </span>
                  <span className="text-zinc-800">
                    {new Date(inspectTemplate.effective_start_date).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Tag Binding Reference */}
              <div>
                <h4 className="text-xs font-bold text-zinc-900 mb-2 flex items-center justify-between">
                  <span>Detected Placeholder Variables</span>
                  <span className="text-[10px] text-zinc-500 font-normal">
                    Resolved against JSON payload during issuance
                  </span>
                </h4>
                <div className="bg-zinc-900 text-zinc-100 rounded-xl p-4 font-mono text-xs space-y-1.5 overflow-x-auto">
                  {inspectTemplate.sample_tags.map((tag, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-indigo-400 font-bold">{tag}</span>
                      <span className="text-zinc-500">→</span>
                      <span className="text-emerald-400 text-[11px]">
                        Hydrated via {inspectTemplate.lob_code.toLowerCase()}_versions aggregate
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Document Worker Architecture Note */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3.5 text-xs text-indigo-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-indigo-900">
                  <ChevronRight className="w-3.5 h-3.5" />
                  Execution Flow (Flow 5.15)
                </div>
                <p className="text-[11px] text-indigo-800 leading-relaxed">
                  Upon policy instantiation with fulfillment_type = <code>PAS_GENERATED</code>, the system broadcasts to
                  Pub/Sub <code>document.generate</code>. The async worker pod pulls this template from S3, hydrates
                  placeholder tags with risk snapshots, compiles an AES-256 encrypted PDF via headless LibreOffice, and
                  saves it to the Vault.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setInspectTemplate(null)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentTemplateRegistry;
