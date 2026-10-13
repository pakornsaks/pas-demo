import React, { useState, useRef, useId } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Download,
  Search,
  Filter,
  Eye,
  X,
  FileText,
  Clock,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  Layers,
  Database
} from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS (Aligined with SDD Section 5.6 & Database Architecture)
// ============================================================================

export type BatchJobStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'COMPLETED_WITH_ERRORS'
  | 'FAILED';

export interface BatchJobError {
  id: string;
  rowNumber: number;
  fieldName: string;
  errorReason: string;
  // Masked according to Thai PDPA (SEC-03 / Flow 5.6)
  maskedRawData: Record<string, any>;
}

export interface BatchJob {
  id: string;
  insurerId: string;
  insurerName: string;
  productLob: 'MOTOR' | 'HEALTH' | 'TRAVEL' | 'PA' | 'FIRE' | 'LIFE';
  fileName: string;
  fileSizeBytes: number;
  status: BatchJobStatus;
  totalRows: number;
  successCount: number;
  errorCount: number;
  s3FileUrl: string;
  createdAt: string;
  completedAt?: string;
  createdBy: string;
  errors?: BatchJobError[];
}

export interface InsurerOption {
  id: string;
  name: string;
  code: string;
}

// ============================================================================
// MOCK DATA (Simulating Backoffice Database State)
// ============================================================================

const INSURERS: InsurerOption[] = [
  { id: 'ins-001', name: 'Viriyah Insurance', code: 'VIRIYAH' },
  { id: 'ins-002', name: 'MSIG Insurance Thailand', code: 'MSIG' },
  { id: 'ins-003', name: 'Dhipaya Insurance', code: 'DHIPAYA' },
  { id: 'ins-004', name: 'Muang Thai Insurance', code: 'MTI' },
  { id: 'ins-005', name: 'Bangkok Insurance', code: 'BKI' }
];

const INITIAL_BATCH_JOBS: BatchJob[] = [
  {
    id: 'BATCH-2026-0891',
    insurerId: 'ins-001',
    insurerName: 'Viriyah Insurance',
    productLob: 'MOTOR',
    fileName: 'viriyah_offline_renewals_q3_2025.xlsx',
    fileSizeBytes: 4210000,
    status: 'COMPLETED_WITH_ERRORS',
    totalRows: 1250,
    successCount: 1242,
    errorCount: 8,
    s3FileUrl: 's3://pas-import-vault/2026/06/batch_0891.xlsx',
    createdAt: '2026-06-15 09:20:11',
    completedAt: '2026-06-15 09:23:44',
    createdBy: 'operations.admin@broker.co.th',
    errors: [
      {
        id: 'err-1',
        rowNumber: 42,
        fieldName: 'chassis_number',
        errorReason: 'Chassis VIN must be exactly 17 alphanumeric characters.',
        maskedRawData: {
          customer_name: 'Somchai Jaidee',
          national_id: '***-**-8812',
          phone_number: '+66-81-***-4491',
          license_plate: '1กข 9988',
          chassis_number: 'MRH123456789'
        }
      },
      {
        id: 'err-2',
        rowNumber: 118,
        fieldName: 'effective_start_date',
        errorReason: 'Historical policy effective end date cannot precede start date.',
        maskedRawData: {
          customer_name: 'Nattapong Kittisak',
          national_id: '***-**-3341',
          phone_number: '+66-89-***-1122',
          license_plate: '3กค 1122',
          chassis_number: 'MNT12345678901234'
        }
      }
    ]
  },
  {
    id: 'BATCH-2026-0892',
    insurerId: 'ins-002',
    insurerName: 'MSIG Insurance Thailand',
    productLob: 'TRAVEL',
    fileName: 'msig_group_travel_migration_final.csv',
    fileSizeBytes: 1845000,
    status: 'COMPLETED',
    totalRows: 820,
    successCount: 820,
    errorCount: 0,
    s3FileUrl: 's3://pas-import-vault/2026/06/batch_0892.csv',
    createdAt: '2026-06-15 11:05:00',
    completedAt: '2026-06-15 11:06:12',
    createdBy: 'migration.lead@broker.co.th'
  },
  {
    id: 'BATCH-2026-0893',
    insurerId: 'ins-003',
    insurerName: 'Dhipaya Insurance',
    productLob: 'FIRE',
    fileName: 'dhipaya_commercial_property_list.csv',
    fileSizeBytes: 934000,
    status: 'PROCESSING',
    totalRows: 500,
    successCount: 310,
    errorCount: 2,
    s3FileUrl: 's3://pas-import-vault/2026/06/batch_0893.csv',
    createdAt: '2026-06-15 11:42:19',
    createdBy: 'operations.admin@broker.co.th'
  }
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const BulkIngestionPage: React.FC = () => {
  // Form State
  const [selectedInsurer, setSelectedInsurer] = useState<string>(INSURERS[0].id);
  const [selectedLob, setSelectedLob] = useState<BatchJob['productLob']>('MOTOR');
  const [stageRenewalApplications, setStageRenewalApplications] = useState<boolean>(true);
  const [dryRunMode, setDryRunMode] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Table & Filter State
  const [jobs, setJobs] = useState<BatchJob[]>(INITIAL_BATCH_JOBS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Drawer / Modal State
  const [selectedJobForErrors, setSelectedJobForErrors] = useState<BatchJob | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileUploadInputId = useId();

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const isExtensionValid = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!isExtensionValid) {
      alert('Invalid file format. Please upload a standard CSV or Excel (.xlsx) file.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      alert('File size exceeds the 25MB limit.');
      return;
    }

    setUploadedFile(file);
  };

  // Submit Ingestion Job (Simulates POST /api/v1/admin/imports/policies)
  const handleSubmitJob = () => {
    if (!uploadedFile) return;

    setIsUploading(true);
    setUploadProgress(15);

    // Simulate S3 Vault streaming and Pub/Sub dispatch
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          setTimeout(() => {
            const insurerObj = INSURERS.find((i) => i.id === selectedInsurer);
            const newJob: BatchJob = {
              id: `BATCH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
              insurerId: selectedInsurer,
              insurerName: insurerObj?.name || 'Insurer',
              productLob: selectedLob,
              fileName: uploadedFile.name,
              fileSizeBytes: uploadedFile.size,
              status: dryRunMode ? 'COMPLETED' : 'PROCESSING',
              totalRows: 450,
              successCount: dryRunMode ? 450 : 12,
              errorCount: 0,
              s3FileUrl: `s3://pas-import-vault/2026/06/${uploadedFile.name}`,
              createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
              createdBy: 'operations.admin@broker.co.th'
            };

            setJobs([newJob, ...jobs]);
            setIsUploading(false);
            setUploadProgress(0);
            setUploadedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }, 600);
          return 100;
        }
        return prev + 25;
      });
    }, 250);
  };

  // Filter Jobs
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.insurerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || job.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: BatchJobStatus) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Completed
          </span>
        );
      case 'COMPLETED_WITH_ERRORS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Partial Success
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />
            Processing (Worker)
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            Queued
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            Failed
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ==================================================================== */}
      {/* SECTION 1: HEADER & BREADCRUMB */}
      {/* ==================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
            <span>Policy Lifecycle</span>
            <span>/</span>
            <span className="text-blue-600">Bulk Ingestion & Migration</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Bulk Policy Ingestion & Migration
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Ingest external legacy policies, trigger the JIT Renewal Bridge, and stage renewal applications via async workers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg shadow-sm hover:bg-zinc-50 transition"
          >
            <Download className="w-4 h-4 text-zinc-500" />
            Download CSV Templates
          </button>
          <button
            onClick={() => setJobs([...jobs])}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition"
            title="Refresh Job Queue"
          >
            <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
            Refresh
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SECTION 2: SYSTEM STATS & COMPLIANCE BANNER */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-zinc-500">Total Migrated Policies</div>
            <div className="text-xl font-bold text-zinc-900 mt-0.5">2,512</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-zinc-500">JIT Renewals Staged</div>
            <div className="text-xl font-bold text-zinc-900 mt-0.5">2,062</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-zinc-500">URE Rejected Records</div>
            <div className="text-xl font-bold text-zinc-900 mt-0.5">10</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-zinc-500">PDPA Storage Shield</div>
            <div className="text-sm font-semibold text-emerald-600 mt-0.5 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              AES-256 Active
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SECTION 3: INGESTION STAGING WIZARD (CARD) */}
      {/* ==================================================================== */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">
              New File Ingestion Staging
            </h2>
          </div>
          <span className="text-xs text-zinc-500">
            Target Endpoint: <code className="bg-zinc-200/60 px-1 py-0.5 rounded text-zinc-700">POST /admin/imports/policies</code>
          </span>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Insurer Selector */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">
                1. Select Underwriting Carrier
              </label>
              <div className="relative">
                <select
                  value={selectedInsurer}
                  onChange={(e) => setSelectedInsurer(e.target.value)}
                  className="w-full text-sm bg-white border border-zinc-300 rounded-lg px-3.5 py-2.5 text-zinc-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {INSURERS.map((ins) => (
                    <option key={ins.id} value={ins.id}>
                      {ins.name} ({ins.code})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
              <p className="text-[11px] text-zinc-400 mt-1.5">
                Inherits provider rules and active commission baseline.
              </p>
            </div>

            {/* Line of Business Selector */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">
                2. Target Line of Business (LOB)
              </label>
              <div className="relative">
                <select
                  value={selectedLob}
                  onChange={(e) => setSelectedLob(e.target.value as BatchJob['productLob'])}
                  className="w-full text-sm bg-white border border-zinc-300 rounded-lg px-3.5 py-2.5 text-zinc-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="MOTOR">Motor & Compulsory (CMI)</option>
                  <option value="HEALTH">Health & Medical Expense</option>
                  <option value="TRAVEL">Group / Individual Travel</option>
                  <option value="PA">Personal Accident (PA)</option>
                  <option value="FIRE">Fire & Commercial Property</option>
                  <option value="LIFE">Life & Long-term Savings</option>
                </select>
                <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
              <p className="text-[11px] text-zinc-400 mt-1.5">
                Applies specific validation schema (e.g. 17-char VIN for Motor).
              </p>
            </div>

            {/* Operational Policies Config */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">
                3. Lifecycle Automation Toggles
              </label>
              <div className="space-y-2.5 bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                <label className="flex items-center gap-2.5 text-xs text-zinc-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stageRenewalApplications}
                    onChange={(e) => setStageRenewalApplications(e.target.checked)}
                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>
                    Auto-stage <strong className="text-zinc-900">JIT Renewals</strong> (Stage 7)
                  </span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-zinc-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dryRunMode}
                    onChange={(e) => setDryRunMode(e.target.checked)}
                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>
                    Dry Run only (Validate URE without DB commit)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Drag & Drop File Zone */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">
              4. Upload Policy Schedule File
            </label>
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                uploadedFile
                  ? 'border-blue-400 bg-blue-50/20'
                  : 'border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50/50'
              }`}
            >
              <input
                id={fileUploadInputId}
                ref={fileInputRef}
                type="file"
                accept=".csv, .xlsx, .xls"
                className="hidden"
                onChange={handleFileChange}
              />

              {uploadedFile ? (
                <div className="flex items-center justify-center gap-4">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                    <FileSpreadsheet className="w-8 h-8" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-zinc-800">{uploadedFile.name}</p>
                    <p className="text-xs text-zinc-500">
                      {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for S3 streaming
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-1 hover:bg-zinc-200 rounded-full text-zinc-400 hover:text-zinc-600 ml-4"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-zinc-100 text-zinc-500 rounded-full flex items-center justify-center mx-auto">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-700">
                      Click to upload or drag and drop spreadsheet
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Accepts standard .CSV, .XLSX (Max file size: 25MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Progress Indicator */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-zinc-600">
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                  Streaming to IAM-Protected S3 Vault & Enqueuing Pub/Sub Worker...
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Execution Bar */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <ShieldAlert className="w-4 h-4 text-zinc-400" />
              <span>
                PII data is AES-256 encrypted at ingestion. Partial success pattern active.
              </span>
            </div>

            <button
              onClick={handleSubmitJob}
              disabled={!uploadedFile || isUploading}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold tracking-wide uppercase transition ${
                !uploadedFile || isUploading
                  ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
              }`}
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Initializing Batch Worker...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  Dispatch Ingestion Job
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SECTION 4: BATCH INGESTION HISTORY & QUEUE MONITOR */}
      {/* ==================================================================== */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-zinc-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Ingestion Execution Ledger</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Live asynchronous status of external carrier lists and legacy migrations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search Batch ID, File, Carrier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs bg-zinc-50 border border-zinc-300 rounded-lg pl-9 pr-3.5 py-2 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64"
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-zinc-50 border border-zinc-300 rounded-lg pl-3 pr-8 py-2 text-zinc-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="PROCESSING">Processing</option>
                <option value="COMPLETED">Completed</option>
                <option value="COMPLETED_WITH_ERRORS">Partial Success</option>
                <option value="FAILED">Failed</option>
              </select>
              <Filter className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <th className="py-3 px-4">Batch ID / Timestamp</th>
                <th className="py-3 px-4">Carrier & LOB</th>
                <th className="py-3 px-4">File Name</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Success / Total</th>
                <th className="py-3 px-4 text-center">Errors</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-xs text-zinc-700">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-400">
                    No ingestion jobs found matching the specified filters.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-medium text-zinc-900">{job.id}</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">{job.createdAt}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-900">{job.insurerName}</div>
                      <div className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                        {job.productLob}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-zinc-800 font-medium truncate max-w-xs" title={job.fileName}>
                        {job.fileName}
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        {(job.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB • {job.createdBy}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(job.status)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-semibold text-zinc-900">{job.successCount}</span>
                      <span className="text-zinc-400"> / {job.totalRows}</span>
                      {job.status === 'PROCESSING' && (
                        <div className="w-16 bg-zinc-100 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{
                              width: `${(job.successCount / job.totalRows) * 100}%`
                            }}
                          />
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {job.errorCount > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          {job.errorCount} failed
                        </span>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      {job.errorCount > 0 ? (
                        <button
                          onClick={() => setSelectedJobForErrors(job)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-300 rounded hover:bg-amber-100 transition"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-600" />
                          Inspect Errors
                        </button>
                      ) : (
                        <button
                          disabled
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-zinc-400 bg-zinc-50 border border-zinc-200 rounded cursor-not-allowed"
                        >
                          Clean Run
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
          <span>Showing {filteredJobs.length} active and completed migration batch records</span>
          <span className="text-zinc-400">Worker Heartbeat: OK (P95 Latency &lt; 250ms)</span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* DRAWER / MODAL 1: ERROR INSPECTOR DRAWER (PDPA COMPLIANT) */}
      {/* ==================================================================== */}
      {selectedJobForErrors && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-zinc-900/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-zinc-200">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    {selectedJobForErrors.id}
                  </span>
                  <span className="text-xs text-zinc-400">•</span>
                  <span className="text-xs font-semibold text-zinc-700">
                    Row-Level Dead Letter Queue
                  </span>
                </div>
                <h3 className="text-base font-bold text-zinc-900 mt-1">
                  Validation Exceptions ({selectedJobForErrors.errors?.length || 0} Breaches)
                </h3>
              </div>
              <button
                onClick={() => setSelectedJobForErrors(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PDPA Compliance Note */}
            <div className="bg-amber-50 px-6 py-3 border-b border-amber-200 flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">
                <strong>Thai PDPA Compliance Notice:</strong> Personally Identifiable Information
                (National ID, Phone) has been mathematically masked prior to persistence in the{' '}
                <code className="bg-amber-100 px-1 py-0.5 rounded">batch_job_errors</code> ledger.
              </div>
            </div>

            {/* Error Rows List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedJobForErrors.errors?.map((err) => (
                <div
                  key={err.id}
                  className="bg-white border border-zinc-200 rounded-lg p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                    <span className="text-xs font-bold text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded">
                      Row #{err.rowNumber}
                    </span>
                    <span className="text-xs font-mono text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 font-semibold">
                      Field: {err.fieldName}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-zinc-900">Failure Reason:</p>
                    <p className="text-xs text-rose-700 mt-0.5 bg-rose-50/50 p-2 rounded border border-rose-100">
                      {err.errorReason}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                      Scrubbed Row Data (PDPA Masked)
                    </p>
                    <pre className="text-[11px] bg-zinc-50 text-zinc-800 p-2.5 rounded border border-zinc-200 font-mono overflow-x-auto">
                      {JSON.stringify(err.maskedRawData, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>

            {/* Drawer Actions */}
            <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <span className="text-xs text-zinc-500">
                Fix records in CSV and re-upload with identical headers.
              </span>
              <button
                onClick={() => {
                  alert('Generating "Fix & Re-upload" CSV containing only failed rows...');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-zinc-800 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-100 shadow-xs transition"
              >
                <Download className="w-3.5 h-3.5 text-zinc-600" />
                Export Fix & Re-upload Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: STANDARDIZED CSV TEMPLATES MODAL */}
      {/* ==================================================================== */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 max-w-xl w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">
                  Standard Ingestion Templates (BRD 8.1)
                </h3>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-zinc-600">
                To guarantee zero column mismatches and maintain Underwriting Rules Engine (URE)
                stability, download the pre-formatted Excel or CSV schema template for your specific
                Line of Business.
              </p>

              <div className="space-y-3">
                <div className="p-3 border border-zinc-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-700 rounded">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900">
                        Motor & CMI Ingestion Template (v2.4)
                      </h4>
                      <p className="text-[11px] text-zinc-500">
                        Includes: Chassis (VIN), Red Plate flag, OIC Vehicle Code, Redbook Sum Insured.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => alert('Downloading motor_ingestion_template_v2.4.xlsx')}
                    className="p-2 text-zinc-500 hover:text-blue-600 hover:bg-white rounded border border-transparent hover:border-zinc-200"
                    title="Download Template"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 border border-zinc-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-700 rounded">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900">
                        Health & Medical Ingestion Template (v1.9)
                      </h4>
                      <p className="text-[11px] text-zinc-500">
                        Includes: Height/Weight, Smoker toggle, Pre-existing exclusion codes.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => alert('Downloading health_ingestion_template_v1.9.xlsx')}
                    className="p-2 text-zinc-500 hover:text-emerald-600 hover:bg-white rounded border border-transparent hover:border-zinc-200"
                    title="Download Template"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 border border-zinc-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 text-purple-700 rounded">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900">
                        Fire & Property Ingestion Template (v1.2)
                      </h4>
                      <p className="text-[11px] text-zinc-500">
                        Includes: Building Class (1-3), Property Type, Building/Content Sum Insured split.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => alert('Downloading fire_ingestion_template_v1.2.xlsx')}
                    className="p-2 text-zinc-500 hover:text-purple-600 hover:bg-white rounded border border-transparent hover:border-zinc-200"
                    title="Download Template"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-zinc-50 border-t border-zinc-200 flex justify-end">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkIngestionPage;