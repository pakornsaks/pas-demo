import React, { useState } from 'react';
import {
  GripVertical,
  Plus,
  Trash2,
  Save,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  Layers,
  Copy,
} from 'lucide-react';

export interface PlanBenefitRow {
  id: string;
  benefit_id: string;
  benefit_code: string;
  coverage_name: string;
  group_name: string;
  limit_amount: number;
  limit_display_unit: string; // e.g. "THB / Person", "THB / Occurrence", "Actual Cost"
  display_order: number;
  is_custom_clause?: boolean;
}

export interface PlanMetadata {
  product_id: string;
  product_name: string;
  lob_code: 'MOTOR' | 'HEALTH' | 'PA' | 'FIRE' | 'TRAVEL' | 'CUSTOM';
  plan_id: string;
  plan_name: string;
  plan_code: string;
  version: string;
  version_status: 'DRAFT' | 'ACTIVE' | 'SCHEDULED';
  base_premium: number;
}

const BENEFIT_GROUPS = [
  'Third Party Liability',
  'Own Damage & Vehicle Protection',
  'Personal Accident & Medical Expense',
  'Additional Perils & Natural Disasters',
  'Special Endorsement Clauses',
];

const INITIAL_BENEFITS: PlanBenefitRow[] = [
  {
    id: 'row-1',
    benefit_id: 'ben-001',
    benefit_code: 'BEN-TPL-BI-PERS',
    coverage_name: 'Third Party Bodily Injury or Death (Per Person)',
    group_name: 'Third Party Liability',
    limit_amount: 500000,
    limit_display_unit: 'THB / Person',
    display_order: 1,
  },
  {
    id: 'row-2',
    benefit_id: 'ben-002',
    benefit_code: 'BEN-TPL-BI-OCCUR',
    coverage_name: 'Third Party Bodily Injury or Death (Per Occurrence)',
    group_name: 'Third Party Liability',
    limit_amount: 10000000,
    limit_display_unit: 'THB / Occurrence',
    display_order: 2,
  },
  {
    id: 'row-3',
    benefit_id: 'ben-003',
    benefit_code: 'BEN-TPL-PROP',
    coverage_name: 'Third Party Property Damage (Per Occurrence)',
    group_name: 'Third Party Liability',
    limit_amount: 2500000,
    limit_display_unit: 'THB / Occurrence',
    display_order: 3,
  },
  {
    id: 'row-4',
    benefit_id: 'ben-004',
    benefit_code: 'BEN-OD-SUM-INS',
    coverage_name: 'Own Damage (Vehicle Sum Insured)',
    group_name: 'Own Damage & Vehicle Protection',
    limit_amount: 680000,
    limit_display_unit: 'THB (Redbook 80%)',
    display_order: 4,
  },
  {
    id: 'row-5',
    benefit_id: 'ben-005',
    benefit_code: 'BEN-OD-FIRE-THEFT',
    coverage_name: 'Fire, Theft & Total Loss Protection',
    group_name: 'Own Damage & Vehicle Protection',
    limit_amount: 680000,
    limit_display_unit: 'THB / Vehicle',
    display_order: 5,
  },
  {
    id: 'row-6',
    benefit_id: 'ben-006',
    benefit_code: 'BEN-PA-DRIVER',
    coverage_name: 'Personal Accident Coverage (Driver & 4 Passengers)',
    group_name: 'Personal Accident & Medical Expense',
    limit_amount: 100000,
    limit_display_unit: 'THB / Person',
    display_order: 6,
  },
  {
    id: 'row-7',
    benefit_id: 'ben-007',
    benefit_code: 'BEN-MED-EXP',
    coverage_name: 'Medical Expense for Driver & Passengers',
    group_name: 'Personal Accident & Medical Expense',
    limit_amount: 100000,
    limit_display_unit: 'THB / Person',
    display_order: 7,
  },
];

export const BenefitsBuilderPage: React.FC = () => {
  const [benefits, setBenefits] = useState<PlanBenefitRow[]>(INITIAL_BENEFITS);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isSavedAlert, setIsSavedAlert] = useState<boolean>(false);

  const planInfo: PlanMetadata = {
    product_id: 'PRD-MTR-V1',
    product_name: 'Viriyah Motor Voluntary Type 1',
    lob_code: 'MOTOR',
    plan_id: 'PLN-GOLD-2026',
    plan_name: 'Gold Comprehensive Plan',
    plan_code: 'P00001-GOLD',
    version: 'v2.1',
    version_status: 'DRAFT',
    base_premium: 16500.0,
  };

  // Reordering handlers (Drag & Drop)
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const reorderedList = [...benefits];
    const itemToMove = reorderedList[draggedIndex];
    reorderedList.splice(draggedIndex, 1);
    reorderedList.splice(index, 0, itemToMove);

    // Re-index display_order sequence
    const updatedList = reorderedList.map((item, idx) => ({
      ...item,
      display_order: idx + 1,
    }));

    setDraggedIndex(index);
    setBenefits(updatedList);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Row operations
  const handleAddBenefit = () => {
    const newId = `row-${Date.now()}`;
    const newBenefit: PlanBenefitRow = {
      id: newId,
      benefit_id: `ben-${Date.now().toString().slice(-4)}`,
      benefit_code: `BEN-NEW-${benefits.length + 1}`,
      coverage_name: 'New Coverage Limit',
      group_name: selectedGroupFilter !== 'ALL' ? selectedGroupFilter : BENEFIT_GROUPS[0],
      limit_amount: 100000,
      limit_display_unit: 'THB',
      display_order: benefits.length + 1,
    };
    setBenefits([...benefits, newBenefit]);
  };

  const handleDeleteBenefit = (id: string) => {
    const updated = benefits
      .filter((b) => b.id !== id)
      .map((b, idx) => ({ ...b, display_order: idx + 1 }));
    setBenefits(updated);
  };

  const handleDuplicateBenefit = (item: PlanBenefitRow) => {
    const duplicate: PlanBenefitRow = {
      ...item,
      id: `row-${Date.now()}`,
      benefit_id: `ben-${Date.now().toString().slice(-4)}`,
      benefit_code: `${item.benefit_code}-COPY`,
      coverage_name: `${item.coverage_name} (Copy)`,
      display_order: benefits.length + 1,
    };
    setBenefits([...benefits, duplicate]);
  };

  const handleFieldChange = (
    id: string,
    field: keyof PlanBenefitRow,
    value: string | number
  ) => {
    setBenefits((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSaveDraft = () => {
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 3500);
  };

  // Filtered dataset
  const filteredBenefits = benefits.filter((b) => {
    const matchesGroup =
      selectedGroupFilter === 'ALL' || b.group_name === selectedGroupFilter;
    const matchesSearch =
      b.coverage_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.benefit_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.group_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {isSavedAlert && (
        <div className="fixed top-16 right-8 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg shadow-sm text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Plan benefits snapshot saved successfully into Draft version.</span>
        </div>
      )}

      {/* Top Header / Breadcrumbs & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
            <span>{planInfo.product_name}</span>
            <span>/</span>
            <span>{planInfo.plan_name}</span>
            <span>/</span>
            <span className="text-zinc-900 font-bold">Benefits Builder</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
              Benefits Builder & Comparison Grid
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
              {planInfo.version_status} ({planInfo.version})
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Configure coverage limits, benefit naming, groups, and drag handles to control the display order returned by the Sales Channel API.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg shadow-sm hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            <Download className="w-3.5 h-3.5 text-zinc-600" />
            Export Schema
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg shadow-sm hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-600" />
            Import CSV
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-zinc-900 rounded-lg shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1"
          >
            <Save className="w-3.5 h-3.5" />
            Save Benefits Draft
          </button>
        </div>
      </div>

      {/* Snapshot / Plan Summary Card */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
        <div>
          <span className="text-zinc-500 block mb-0.5 font-medium">Product Code</span>
          <span className="font-semibold text-zinc-800">{planInfo.product_id}</span>
        </div>
        <div>
          <span className="text-zinc-500 block mb-0.5 font-medium">Plan Package Code</span>
          <span className="font-mono font-medium text-zinc-800">{planInfo.plan_code}</span>
        </div>
        <div>
          <span className="text-zinc-500 block mb-0.5 font-medium">Line of Business</span>
          <span className="font-semibold text-zinc-800">{planInfo.lob_code}</span>
        </div>
        <div>
          <span className="text-zinc-500 block mb-0.5 font-medium">Base Gross Premium</span>
          <span className="font-semibold text-zinc-900">
            {planInfo.base_premium.toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}{' '}
            THB
          </span>
        </div>
        <div>
          <span className="text-zinc-500 block mb-0.5 font-medium">Total Active Rows</span>
          <span className="font-semibold text-zinc-800">{benefits.length} Benefits</span>
        </div>
      </div>

      {/* Search and Category Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 border border-zinc-200 rounded-xl shadow-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by benefit name or code (e.g. BEN-TPL)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-zinc-600 font-medium">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
            <span>Group Filter:</span>
          </div>
          <select
            value={selectedGroupFilter}
            onChange={(e) => setSelectedGroupFilter(e.target.value)}
            className="text-xs bg-zinc-50 border border-zinc-200 text-zinc-800 rounded-lg py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-medium"
          >
            <option value="ALL">All Categories ({benefits.length})</option>
            {BENEFIT_GROUPS.map((grp) => (
              <option key={grp} value={grp}>
                {grp} ({benefits.filter((b) => b.group_name === grp).length})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleAddBenefit}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Benefit
          </button>
        </div>
      </div>

      {/* Excel-Style Comparison Grid Table */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-50/75 border-b border-zinc-200 text-zinc-600 font-medium select-none">
                <th className="py-3 px-3 w-10 text-center">
                  <ArrowUpDown className="w-3.5 h-3.5 mx-auto text-zinc-400" />
                </th>
                <th className="py-3 px-2 w-16 text-center">Order</th>
                <th className="py-3 px-3 w-40">Benefit Code</th>
                <th className="py-3 px-4">Coverage Description & Terms</th>
                <th className="py-3 px-4 w-56">Category / Group</th>
                <th className="py-3 px-4 w-44 text-right">Sum Insured / Limit</th>
                <th className="py-3 px-4 w-36">Display Unit</th>
                <th className="py-3 px-3 w-24 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredBenefits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    <Layers className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
                    <p className="font-medium text-zinc-700">No benefits matching criteria</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Clear your search filter or click "Add Benefit" to begin configuration.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredBenefits.map((item, index) => {
                  const isDragging = draggedIndex === index;
                  return (
                    <tr
                      key={item.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`hover:bg-zinc-50/80 transition-colors group ${
                        isDragging ? 'opacity-40 bg-zinc-100' : ''
                      }`}
                    >
                      {/* Drag Handle */}
                      <td className="py-2.5 px-3 text-center cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-700">
                        <GripVertical className="w-4 h-4 mx-auto" />
                      </td>

                      {/* Display Order Sequence Index */}
                      <td className="py-2.5 px-2 text-center font-mono font-medium text-zinc-500">
                        <span className="inline-block px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 text-2xs">
                          #{item.display_order}
                        </span>
                      </td>

                      {/* Benefit Code */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={item.benefit_code}
                          onChange={(e) =>
                            handleFieldChange(item.id, 'benefit_code', e.target.value)
                          }
                          className="w-full font-mono text-zinc-800 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-zinc-300 focus:border-zinc-400 rounded px-1.5 py-1 focus:outline-none"
                        />
                      </td>

                      {/* Coverage Description */}
                      <td className="py-2.5 px-4">
                        <input
                          type="text"
                          value={item.coverage_name}
                          onChange={(e) =>
                            handleFieldChange(item.id, 'coverage_name', e.target.value)
                          }
                          className="w-full font-medium text-zinc-900 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-zinc-300 focus:border-zinc-400 rounded px-2 py-1 focus:outline-none"
                        />
                      </td>

                      {/* Benefit Group / Category */}
                      <td className="py-2.5 px-4">
                        <select
                          value={item.group_name}
                          onChange={(e) =>
                            handleFieldChange(item.id, 'group_name', e.target.value)
                          }
                          className="w-full text-xs text-zinc-700 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-zinc-300 focus:border-zinc-400 rounded px-1.5 py-1 focus:outline-none"
                        >
                          {BENEFIT_GROUPS.map((grp) => (
                            <option key={grp} value={grp}>
                              {grp}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Numeric Limit Amount */}
                      <td className="py-2.5 px-4 text-right">
                        <input
                          type="number"
                          step="1000"
                          value={item.limit_amount}
                          onChange={(e) =>
                            handleFieldChange(
                              item.id,
                              'limit_amount',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full text-right font-mono font-medium text-zinc-900 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-zinc-300 focus:border-zinc-400 rounded px-2 py-1 focus:outline-none"
                        />
                      </td>

                      {/* Display Unit / Note */}
                      <td className="py-2.5 px-4">
                        <input
                          type="text"
                          value={item.limit_display_unit}
                          onChange={(e) =>
                            handleFieldChange(item.id, 'limit_display_unit', e.target.value)
                          }
                          className="w-full text-xs text-zinc-600 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-zinc-300 focus:border-zinc-400 rounded px-1.5 py-1 focus:outline-none"
                        />
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            title="Duplicate row"
                            onClick={() => handleDuplicateBenefit(item)}
                            className="p-1 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Remove benefit"
                            onClick={() => handleDeleteBenefit(item.id)}
                            className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Instructions & Summary */}
        <div className="bg-zinc-50 border-t border-zinc-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              SCD Type 2 Snapshot Protection active. Re-ordering or editing edits the{' '}
              <strong className="text-zinc-700">DRAFT</strong> version only.
            </span>
          </div>
          <div className="flex items-center gap-4 text-zinc-600 font-medium">
            <span>Showing {filteredBenefits.length} of {benefits.length} items</span>
            <button
              type="button"
              onClick={handleAddBenefit}
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              + Add Another Line
            </button>
          </div>
        </div>
      </div>

      {/* Maker-Checker Workflow & Governance Notice */}
      <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-xs text-blue-900">
        <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-blue-950">
            Governance & Approval Workflow (Maker-Checker Module)
          </p>
          <p className="text-blue-800 leading-relaxed">
            All modifications applied to this comparison matrix will update the table{' '}
            <code className="bg-blue-100 text-blue-900 px-1 py-0.5 rounded font-mono">
              plan_benefit_versions
            </code>
            . Once you save this draft, submit the parent Product draft to trigger the Unified Approver
            Inbox. Live consumer APIs will continue serving the existing Active snapshot until signed off.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BenefitsBuilderPage;