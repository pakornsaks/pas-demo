import React, { useState } from 'react';
import {
  Type,
  Hash,
  ToggleLeft,
  ListFilter,
  Calendar,
  FileUp,
  AlignLeft,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Eye,
  Code2,
  Sliders,
  Send,
  Save,
  AlertCircle,
  CheckCircle2,
  Layers,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

// ============================================================================
// Types & API Contracts (Aligned with PAS SDD Section 3.2.3 & BRD Section 7.1)
// ============================================================================

export type FieldType = 'string' | 'number' | 'boolean' | 'select' | 'date' | 'file';

export type UIComponentType =
  | 'text_input'
  | 'number_input'
  | 'toggle'
  | 'select_dropdown'
  | 'datepicker'
  | 'file_upload'
  | 'textarea';

export type ConditionOperator = 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN';

export interface VisibilityRule {
  depends_on: string;
  condition: ConditionOperator;
  value: string | number | boolean;
}

export interface SchemaField {
  id: string; // Internal client UUID
  field: string; // Database key (custom_risk_data key)
  label: string;
  type: FieldType;
  ui_component: UIComponentType;
  is_required: boolean;
  placeholder?: string;
  description?: string;
  options?: string[]; // Used when type is 'select'
  min?: number;
  max?: number;
  pattern?: string;
  visibility_rules?: VisibilityRule;
}

export interface ProductSchemaEnvelope {
  product_version_id: string;
  product_code: string;
  marketing_name: string;
  lob_code: string;
  version_status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  required_risk_fields: Omit<SchemaField, 'id'>[];
}

// Pre-seeded with sample Custom LOB fields (e.g. Cyber Risk)
const INITIAL_FIELDS: SchemaField[] = [
  {
    id: 'f-1',
    field: 'company_annual_revenue',
    label: 'Company Annual Revenue (THB)',
    type: 'number',
    ui_component: 'number_input',
    is_required: true,
    placeholder: 'e.g. 50000000',
    description: 'Audited gross revenue for previous fiscal year.',
    min: 1000000,
  },
  {
    id: 'f-2',
    field: 'number_of_servers',
    label: 'Total Active Servers / Endpoints',
    type: 'number',
    ui_component: 'number_input',
    is_required: true,
    placeholder: 'e.g. 45',
    min: 1,
  },
  {
    id: 'f-3',
    field: 'has_firewall',
    label: 'Dedicated Hardware Firewall Installed',
    type: 'boolean',
    ui_component: 'toggle',
    is_required: true,
    description: 'Must have active UTM/Next-Gen Firewall license.',
  },
  {
    id: 'f-4',
    field: 'firewall_vendor',
    label: 'Firewall Hardware Vendor',
    type: 'string',
    ui_component: 'select_dropdown',
    is_required: false,
    options: ['Fortinet', 'Palo Alto Networks', 'Cisco', 'Sophos', 'Other'],
    visibility_rules: {
      depends_on: 'has_firewall',
      condition: 'EQUALS',
      value: true,
    },
  },
  {
    id: 'f-5',
    field: 'iso27001_certificate',
    label: 'ISO/IEC 27001 Audit Certificate',
    type: 'file',
    ui_component: 'file_upload',
    is_required: false,
    description: 'Attach valid PDF certificate for underwriting discount.',
  },
];

export const DynamicSchemaBuilderPage: React.FC = () => {
  // Product Versioning & Schema State
  const [productMeta] = useState({
    product_version_id: '550e8400-e29b-41d4-a716-446655440000',
    product_code: 'CBR-CORP-2026',
    marketing_name: 'Enterprise Cyber Security Shield',
    lob_code: 'CUSTOM',
    version: 'v2.1',
    status: 'DRAFT' as const,
  });

  const [fields, setFields] = useState<SchemaField[]>(INITIAL_FIELDS);
  const [selectedFieldId, setSelectedFieldId] = useState<string>(INITIAL_FIELDS[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'inspector' | 'preview' | 'json'>('inspector');
  const [testFormValues, setTestFormValues] = useState<Record<string, any>>({
    has_firewall: true,
    company_annual_revenue: 25000000,
  });

  // Maker-Checker Submission Dialog State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [makerNotes, setMakerNotes] = useState('');
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  // Field Management Helpers
  const handleAddField = (type: FieldType, ui_component: UIComponentType) => {
    const newId = `field_${Date.now()}`;
    const newField: SchemaField = {
      id: newId,
      field: `custom_risk_${fields.length + 1}`,
      label: `New ${type.toUpperCase()} Field`,
      type,
      ui_component,
      is_required: false,
      placeholder: '',
      description: '',
      options: type === 'select' ? ['Option 1', 'Option 2'] : undefined,
    };
    setFields((prev) => [...prev, newField]);
    setSelectedFieldId(newId);
    setActiveTab('inspector');
  };

  const handleUpdateField = (id: string, updates: Partial<SchemaField>) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const handleDeleteField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
    if (selectedFieldId === id) {
      const remaining = fields.filter((f) => f.id !== id);
      setSelectedFieldId(remaining[0]?.id || '');
    }
  };

  const handleDuplicateField = (fieldToDuplicate: SchemaField) => {
    const duplicated: SchemaField = {
      ...fieldToDuplicate,
      id: `field_${Date.now()}`,
      field: `${fieldToDuplicate.field}_copy`,
      label: `${fieldToDuplicate.label} (Copy)`,
    };
    setFields((prev) => [...prev, duplicated]);
    setSelectedFieldId(duplicated.id);
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;

    const reordered = [...fields];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    setFields(reordered);
  };

  // Visibility Rule Evaluator (for Headless Simulator)
  const isFieldVisibleInSimulator = (field: SchemaField): boolean => {
    if (!field.visibility_rules) return true;
    const { depends_on, condition, value } = field.visibility_rules;
    const parentValue = testFormValues[depends_on];

    if (condition === 'EQUALS') {
      return String(parentValue) === String(value);
    }
    if (condition === 'NOT_EQUALS') {
      return String(parentValue) !== String(value);
    }
    if (condition === 'GREATER_THAN') {
      return Number(parentValue) > Number(value);
    }
    if (condition === 'LESS_THAN') {
      return Number(parentValue) < Number(value);
    }
    return true;
  };

  // Compile JSON Schema Envelope (matches GET /products/{id}/schema)
  const compiledSchemaPayload: ProductSchemaEnvelope = {
    product_version_id: productMeta.product_version_id,
    product_code: productMeta.product_code,
    marketing_name: productMeta.marketing_name,
    lob_code: productMeta.lob_code,
    version_status: productMeta.status,
    required_risk_fields: fields.map(({ id, ...rest }) => rest),
  };

  const handleSubmitToChecker = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate POST /admin/approvals/request
    setSubmissionSuccess(true);
    setTimeout(() => {
      setShowSubmitModal(false);
      setSubmissionSuccess(false);
      setMakerNotes('');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Version Context */}
      <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              <span>Product Factory</span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              <span>Custom LOB</span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-zinc-800">Dynamic Schema Builder</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-zinc-900">{productMeta.marketing_name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                {productMeta.status} ({productMeta.version})
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-mono bg-zinc-100 text-zinc-600 border border-zinc-200">
                LOB: {productMeta.lob_code}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Configure dynamic risk capture keys stored into{' '}
              <code className="text-blue-600 font-mono">policy_custom.custom_risk_data</code> and
              served via Headless UI endpoints.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => alert('Draft schema snapshot saved locally.')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              Submit to Maker-Checker
            </button>
          </div>
        </div>

        {/* Governance Banner: PROD-06 Compliance */}
        <div className="mt-4 pt-3.5 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Rule Engine Guard:</strong> All custom policies bound to this schema will
              undergo <strong>100% Mandatory Referral</strong> (Status:{' '}
              <span className="font-mono text-zinc-700">PENDING_REVIEW</span>).
            </span>
          </div>
          <span className="font-mono text-zinc-400 text-[11px]">
            Target: product_versions.ui_schema
          </span>
        </div>
      </div>

      {/* 2. Main Builder Workspace (3 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Panel: Component Palette (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm">
            <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Risk Field Palette
            </h2>
            <p className="text-xs text-zinc-500 mb-4">
              Click to append headless risk attributes to this product blueprint.
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleAddField('string', 'text_input')}
                className="w-full flex items-center gap-3 p-2.5 rounded-md border border-zinc-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded bg-zinc-100 group-hover:bg-blue-100 flex items-center justify-center text-zinc-600 group-hover:text-blue-600">
                  <Type className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-800">Short Text</div>
                  <div className="text-[11px] text-zinc-500">Text input (names, codes, VINs)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAddField('number', 'number_input')}
                className="w-full flex items-center gap-3 p-2.5 rounded-md border border-zinc-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded bg-zinc-100 group-hover:bg-blue-100 flex items-center justify-center text-zinc-600 group-hover:text-blue-600">
                  <Hash className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-800">Numeric Value</div>
                  <div className="text-[11px] text-zinc-500">Revenue, counts, capacities</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAddField('boolean', 'toggle')}
                className="w-full flex items-center gap-3 p-2.5 rounded-md border border-zinc-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded bg-zinc-100 group-hover:bg-blue-100 flex items-center justify-center text-zinc-600 group-hover:text-blue-600">
                  <ToggleLeft className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-800">Boolean Switch</div>
                  <div className="text-[11px] text-zinc-500">Binary toggles & yes/no checks</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAddField('select', 'select_dropdown')}
                className="w-full flex items-center gap-3 p-2.5 rounded-md border border-zinc-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded bg-zinc-100 group-hover:bg-blue-100 flex items-center justify-center text-zinc-600 group-hover:text-blue-600">
                  <ListFilter className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-800">Select Dropdown</div>
                  <div className="text-[11px] text-zinc-500">Standardized category options</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAddField('date', 'datepicker')}
                className="w-full flex items-center gap-3 p-2.5 rounded-md border border-zinc-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded bg-zinc-100 group-hover:bg-blue-100 flex items-center justify-center text-zinc-600 group-hover:text-blue-600">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-800">Date Picker</div>
                  <div className="text-[11px] text-zinc-500">Cert dates, inspection dates</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAddField('file', 'file_upload')}
                className="w-full flex items-center gap-3 p-2.5 rounded-md border border-zinc-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded bg-zinc-100 group-hover:bg-blue-100 flex items-center justify-center text-zinc-600 group-hover:text-blue-600">
                  <FileUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-800">File Attachment</div>
                  <div className="text-[11px] text-zinc-500">S3 audit evidence documents</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAddField('string', 'textarea')}
                className="w-full flex items-center gap-3 p-2.5 rounded-md border border-zinc-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded bg-zinc-100 group-hover:bg-blue-100 flex items-center justify-center text-zinc-600 group-hover:text-blue-600">
                  <AlignLeft className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-800">Long Text Area</div>
                  <div className="text-[11px] text-zinc-500">Narratives & special clauses</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Center Panel: Schema Canvas / Field Sequence (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  Schema Fields Canvas
                </h2>
                <span className="text-xs text-zinc-500">
                  {fields.length} active risk properties registered
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleAddField('string', 'text_input')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Field
              </button>
            </div>

            {fields.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-zinc-200 rounded-lg text-center">
                <AlertCircle className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-zinc-700">No fields configured</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Click a component in the left palette to begin defining the payload schema.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {fields.map((f, index) => {
                  const isSelected = f.id === selectedFieldId;
                  return (
                    <div
                      key={f.id}
                      onClick={() => setSelectedFieldId(f.id)}
                      className={`group relative p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/30 ring-1 ring-blue-500/20 shadow-sm'
                          : 'border-zinc-200 bg-white hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-900 truncate">
                              {f.label}
                            </span>
                            {f.is_required ? (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                                REQUIRED
                              </span>
                            ) : (
                              <span className="text-[10px] text-zinc-400">OPTIONAL</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
                            <span className="bg-zinc-100 px-1 rounded text-zinc-700">
                              key: {f.field}
                            </span>
                            <span>•</span>
                            <span className="text-zinc-600">{f.ui_component}</span>
                          </div>
                          {f.visibility_rules && (
                            <div className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block font-mono">
                              Depends on: {f.visibility_rules.depends_on} =={' '}
                              {String(f.visibility_rules.value)}
                            </div>
                          )}
                        </div>

                        {/* Controls: Reorder & Actions */}
                        <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            title="Move Up"
                            disabled={index === 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveField(index, 'up');
                            }}
                            className="p-1 text-zinc-400 hover:text-zinc-700 disabled:opacity-30 rounded hover:bg-zinc-100"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Move Down"
                            disabled={index === fields.length - 1}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveField(index, 'down');
                            }}
                            className="p-1 text-zinc-400 hover:text-zinc-700 disabled:opacity-30 rounded hover:bg-zinc-100"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Duplicate"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateField(f);
                            }}
                            className="p-1 text-zinc-400 hover:text-zinc-700 rounded hover:bg-zinc-100"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteField(f.id);
                            }}
                            className="p-1 text-zinc-400 hover:text-rose-600 rounded hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Inspector, Preview & JSON (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
            {/* View Switcher Tabs */}
            <div className="flex border-b border-zinc-200 bg-zinc-50/70 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('inspector')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded ${
                  activeTab === 'inspector'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Inspector
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded ${
                  activeTab === 'preview'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Simulator
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('json')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded ${
                  activeTab === 'json'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                Contract
              </button>
            </div>

            <div className="p-4">
              {/* TAB 1: FIELD INSPECTOR */}
              {activeTab === 'inspector' && (
                <>
                  {selectedField ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1">
                          Field Key (DB JSON Key)
                        </label>
                        <input
                          type="text"
                          value={selectedField.field}
                          onChange={(e) =>
                            handleUpdateField(selectedField.id, {
                              field: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                            })
                          }
                          className="w-full text-xs font-mono px-3 py-2 border border-zinc-300 rounded-md bg-zinc-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <span className="text-[11px] text-zinc-400 mt-0.5 block">
                          Must be snake_case (e.g. company_annual_revenue)
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1">
                          Display Label
                        </label>
                        <input
                          type="text"
                          value={selectedField.label}
                          onChange={(e) =>
                            handleUpdateField(selectedField.id, { label: e.target.value })
                          }
                          className="w-full text-xs px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 mb-1">
                            Data Type
                          </label>
                          <select
                            value={selectedField.type}
                            onChange={(e) =>
                              handleUpdateField(selectedField.id, {
                                type: e.target.value as FieldType,
                              })
                            }
                            className="w-full text-xs px-2.5 py-2 border border-zinc-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="string">string</option>
                            <option value="number">number</option>
                            <option value="boolean">boolean</option>
                            <option value="select">select</option>
                            <option value="date">date</option>
                            <option value="file">file</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 mb-1">
                            UI Component
                          </label>
                          <select
                            value={selectedField.ui_component}
                            onChange={(e) =>
                              handleUpdateField(selectedField.id, {
                                ui_component: e.target.value as UIComponentType,
                              })
                            }
                            className="w-full text-xs px-2.5 py-2 border border-zinc-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="text_input">text_input</option>
                            <option value="number_input">number_input</option>
                            <option value="toggle">toggle</option>
                            <option value="select_dropdown">select_dropdown</option>
                            <option value="datepicker">datepicker</option>
                            <option value="file_upload">file_upload</option>
                            <option value="textarea">textarea</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          id="req_toggle"
                          type="checkbox"
                          checked={selectedField.is_required}
                          onChange={(e) =>
                            handleUpdateField(selectedField.id, { is_required: e.target.checked })
                          }
                          className="w-4 h-4 text-blue-600 rounded border-zinc-300 focus:ring-blue-500"
                        />
                        <label
                          htmlFor="req_toggle"
                          className="text-xs font-semibold text-zinc-800 cursor-pointer"
                        >
                          Mandatory Underwriting Risk Field
                        </label>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1">
                          Placeholder / Instruction
                        </label>
                        <input
                          type="text"
                          value={selectedField.placeholder || ''}
                          onChange={(e) =>
                            handleUpdateField(selectedField.id, { placeholder: e.target.value })
                          }
                          className="w-full text-xs px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {/* Dropdown Options Editor */}
                      {selectedField.type === 'select' && (
                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 mb-1">
                            Dropdown Options (Comma separated)
                          </label>
                          <input
                            type="text"
                            value={(selectedField.options || []).join(', ')}
                            onChange={(e) =>
                              handleUpdateField(selectedField.id, {
                                options: e.target.value.split(',').map((o) => o.trim()),
                              })
                            }
                            className="w-full text-xs px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      )}

                      {/* Visibility / Conditional Logic Section */}
                      <div className="pt-3 border-t border-zinc-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                            <ListFilter className="w-3.5 h-3.5 text-blue-600" />
                            Visibility Dependency Rule
                          </label>
                          {selectedField.visibility_rules ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateField(selectedField.id, { visibility_rules: undefined })
                              }
                              className="text-[11px] text-rose-600 hover:underline"
                            >
                              Remove Rule
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateField(selectedField.id, {
                                  visibility_rules: {
                                    depends_on:
                                      fields.find((f) => f.id !== selectedField.id)?.field || '',
                                    condition: 'EQUALS',
                                    value: true,
                                  },
                                })
                              }
                              className="text-[11px] text-blue-600 font-semibold hover:underline"
                            >
                              + Add Rule
                            </button>
                          )}
                        </div>

                        {selectedField.visibility_rules && (
                          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-md space-y-2.5">
                            <div>
                              <span className="text-[11px] text-zinc-500 block mb-1">
                                Depends on Field:
                              </span>
                              <select
                                value={selectedField.visibility_rules.depends_on}
                                onChange={(e) =>
                                  handleUpdateField(selectedField.id, {
                                    visibility_rules: {
                                      ...selectedField.visibility_rules!,
                                      depends_on: e.target.value,
                                    },
                                  })
                                }
                                className="w-full text-xs px-2.5 py-1.5 border border-zinc-300 rounded bg-white"
                              >
                                {fields
                                  .filter((f) => f.id !== selectedField.id)
                                  .map((f) => (
                                    <option key={f.id} value={f.field}>
                                      {f.label} ({f.field})
                                    </option>
                                  ))}
                              </select>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-[11px] text-zinc-500 block mb-1">
                                  Condition:
                                </span>
                                <select
                                  value={selectedField.visibility_rules.condition}
                                  onChange={(e) =>
                                    handleUpdateField(selectedField.id, {
                                      visibility_rules: {
                                        ...selectedField.visibility_rules!,
                                        condition: e.target.value as ConditionOperator,
                                      },
                                    })
                                  }
                                  className="w-full text-xs px-2 py-1.5 border border-zinc-300 rounded bg-white"
                                >
                                  <option value="EQUALS">EQUALS</option>
                                  <option value="NOT_EQUALS">NOT_EQUALS</option>
                                  <option value="GREATER_THAN">GREATER_THAN</option>
                                  <option value="LESS_THAN">LESS_THAN</option>
                                </select>
                              </div>
                              <div>
                                <span className="text-[11px] text-zinc-500 block mb-1">
                                  Expected Value:
                                </span>
                                <input
                                  type="text"
                                  value={String(selectedField.visibility_rules.value)}
                                  onChange={(e) => {
                                    let val: any = e.target.value;
                                    if (val === 'true') val = true;
                                    else if (val === 'false') val = false;
                                    handleUpdateField(selectedField.id, {
                                      visibility_rules: {
                                        ...selectedField.visibility_rules!,
                                        value: val,
                                      },
                                    });
                                  }}
                                  className="w-full text-xs px-2 py-1.5 border border-zinc-300 rounded bg-white"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-zinc-500">
                      Select a field from the canvas to edit its properties.
                    </div>
                  )}
                </>
              )}

              {/* TAB 2: LIVE SIMULATOR (HEADLESS UI PREVIEW) */}
              {activeTab === 'preview' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                    <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                      Sales Channel Form Test
                    </span>
                    <button
                      type="button"
                      onClick={() => setTestFormValues({})}
                      className="text-[11px] text-zinc-500 hover:text-zinc-800 underline"
                    >
                      Reset State
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500">
                    This interactive simulator mimics how external aggregators and web portals
                    render the schema in real-time.
                  </p>

                  <form className="space-y-3 pt-2">
                    {fields.map((f) => {
                      if (!isFieldVisibleInSimulator(f)) return null;

                      return (
                        <div key={f.id} className="space-y-1">
                          <label className="block text-xs font-medium text-zinc-800">
                            {f.label}{' '}
                            {f.is_required && <span className="text-rose-500 font-bold">*</span>}
                          </label>

                          {f.ui_component === 'text_input' && (
                            <input
                              type="text"
                              placeholder={f.placeholder}
                              value={testFormValues[f.field] || ''}
                              onChange={(e) =>
                                setTestFormValues({
                                  ...testFormValues,
                                  [f.field]: e.target.value,
                                })
                              }
                              className="w-full text-xs px-3 py-2 border border-zinc-300 rounded-md focus:ring-1 focus:ring-blue-500"
                            />
                          )}

                          {f.ui_component === 'number_input' && (
                            <input
                              type="number"
                              placeholder={f.placeholder}
                              value={testFormValues[f.field] || ''}
                              onChange={(e) =>
                                setTestFormValues({
                                  ...testFormValues,
                                  [f.field]: Number(e.target.value),
                                })
                              }
                              className="w-full text-xs px-3 py-2 border border-zinc-300 rounded-md focus:ring-1 focus:ring-blue-500"
                            />
                          )}

                          {f.ui_component === 'toggle' && (
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`sim_${f.field}`}
                                checked={Boolean(testFormValues[f.field])}
                                onChange={(e) =>
                                  setTestFormValues({
                                    ...testFormValues,
                                    [f.field]: e.target.checked,
                                  })
                                }
                                className="w-4 h-4 text-blue-600 rounded border-zinc-300 focus:ring-blue-500"
                              />
                              <label
                                htmlFor={`sim_${f.field}`}
                                className="text-xs text-zinc-600 cursor-pointer"
                              >
                                {testFormValues[f.field] ? 'Active / Enabled' : 'Disabled'}
                              </label>
                            </div>
                          )}

                          {f.ui_component === 'select_dropdown' && (
                            <select
                              value={testFormValues[f.field] || ''}
                              onChange={(e) =>
                                setTestFormValues({
                                  ...testFormValues,
                                  [f.field]: e.target.value,
                                })
                              }
                              className="w-full text-xs px-2.5 py-2 border border-zinc-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="">-- Choose option --</option>
                              {f.options?.map((opt, i) => (
                                <option key={i} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          )}

                          {f.ui_component === 'file_upload' && (
                            <div className="border border-dashed border-zinc-300 rounded p-2 text-center bg-zinc-50">
                              <FileUp className="w-4 h-4 text-zinc-400 mx-auto mb-1" />
                              <span className="text-[11px] text-zinc-500">
                                Simulated S3 Attachment Dropzone
                              </span>
                            </div>
                          )}

                          {f.ui_component === 'textarea' && (
                            <textarea
                              rows={2}
                              placeholder={f.placeholder}
                              value={testFormValues[f.field] || ''}
                              onChange={(e) =>
                                setTestFormValues({
                                  ...testFormValues,
                                  [f.field]: e.target.value,
                                })
                              }
                              className="w-full text-xs px-3 py-2 border border-zinc-300 rounded-md"
                            />
                          )}

                          {f.description && (
                            <span className="text-[10px] text-zinc-400 block">{f.description}</span>
                          )}
                        </div>
                      );
                    })}
                  </form>
                </div>
              )}

              {/* TAB 3: API CONTRACT JSON VIEW */}
              {activeTab === 'json' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                      GET /products/{'{id}'}/schema
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        navigator.clipboard.writeText(JSON.stringify(compiledSchemaPayload, null, 2))
                      }
                      className="text-[11px] text-blue-600 hover:underline font-mono"
                    >
                      Copy JSON
                    </button>
                  </div>
                  <pre className="p-3 bg-zinc-900 text-zinc-100 rounded-md text-[11px] font-mono overflow-x-auto max-h-[480px] leading-relaxed">
                    {JSON.stringify(compiledSchemaPayload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Maker-Checker Submission Modal (Module 9 Compliance) */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-zinc-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-zinc-900">
              <ShieldAlert className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold">Submit Schema to Maker-Checker Inbox</h3>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Per <strong>BRD GOV-01</strong>, schema changes cannot be published straight to live
              APIs. Submitting this ticket saves a pending record into{' '}
              <code className="text-blue-600 font-mono">approval_requests</code> for Supervisor
              review. The current active version remains intact until sign-off.
            </p>

            {submissionSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md flex items-center gap-3 text-emerald-800 text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <strong>Ticket Created Successfully!</strong>
                  <p>Payload staged under Approval Ticket #REQ-2026-9021.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitToChecker} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Maker Justification / Audit Notes <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={makerNotes}
                    onChange={(e) => setMakerNotes(e.target.value)}
                    placeholder="e.g. Added mandatory ISO-27001 certificate requirement and firewall vendor select dropdown for corporate underwriting compliance."
                    className="w-full text-xs p-3 border border-zinc-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="bg-zinc-50 p-3 rounded border border-zinc-200 text-xs text-zinc-500 space-y-1">
                  <div>
                    <strong>Target Entity:</strong> PRODUCT_SCHEMA
                  </div>
                  <div>
                    <strong>Target Version ID:</strong> {productMeta.product_version_id}
                  </div>
                  <div>
                    <strong>Impacted Fields:</strong> {fields.length} risk parameters
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="px-3.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
                  >
                    Dispatch Approval Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicSchemaBuilderPage;