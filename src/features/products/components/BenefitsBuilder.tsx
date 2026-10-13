import { AlertCircle, ArrowUpDown, Copy, Filter, GripVertical, Layers, Search, Trash2 } from "lucide-react";
import React, { useState } from "react";

export interface PlanBenefitRow {
  id: string;
  benefit_id: string;
  benefit_code: string;
  coverage_name: string;
  group_name: string;
  limit_amount: number;
  limit_display_unit: string;
  display_order: number;
  is_custom_clause?: boolean;
}

export interface BenefitsBuilderProps {
  planVersionId?: string;
  planCode?: string;
  initialData?: PlanBenefitRow[];
  isReadOnly?: boolean;
  onChange?: (benefits: PlanBenefitRow[]) => void;
  onExportSchema?: () => void;
  onImportCsv?: () => void;
}

const BENEFIT_GROUPS = [
  "Third Party Liability",
  "Vehicle Protection",
  "Personal Accident & Medical",
  "Additional Perils & Natural Disasters",
  "Special Endorsement Clauses",
];

const DEFAULT_BENEFITS: PlanBenefitRow[] = [
  {
    id: "row-1",
    benefit_id: "ben-001",
    benefit_code: "TP_BODILY_INJURY",
    coverage_name: "Third Party Bodily Injury / Death",
    group_name: "Third Party Liability",
    limit_amount: 1000000,
    limit_display_unit: "THB / Person",
    display_order: 1,
  },
  {
    id: "row-2",
    benefit_id: "ben-002",
    benefit_code: "TP_PROP_DAMAGE",
    coverage_name: "Third Party Property Damage",
    group_name: "Third Party Liability",
    limit_amount: 2500000,
    limit_display_unit: "THB / Occurrence",
    display_order: 2,
  },
  {
    id: "row-3",
    benefit_id: "ben-003",
    benefit_code: "OWN_DAMAGE",
    coverage_name: "Own Damage (Vehicle Market Value)",
    group_name: "Vehicle Protection",
    limit_amount: 680000,
    limit_display_unit: "Redbook 80% Market Value",
    display_order: 3,
  },
  {
    id: "row-4",
    benefit_id: "ben-004",
    benefit_code: "PA_DRIVER_PASSENGER",
    coverage_name: "Personal Accident (Driver & 5 Passengers)",
    group_name: "Personal Accident & Medical",
    limit_amount: 100000,
    limit_display_unit: "THB / Person",
    display_order: 4,
  },
];

export const BenefitsBuilder: React.FC<BenefitsBuilderProps> = ({
  initialData = DEFAULT_BENEFITS,
  isReadOnly = false,
  onChange,
}) => {
  const [benefits, setBenefits] = useState<PlanBenefitRow[]>(initialData);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const updateBenefits = (newBenefits: PlanBenefitRow[]) => {
    setBenefits(newBenefits);
    if (onChange) onChange(newBenefits);
  };

  // Drag-and-drop reordering
  const handleDragStart = (index: number) => {
    if (isReadOnly) return;
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    e.preventDefault();
    if (isReadOnly || draggedIndex === null || draggedIndex === index) return;

    const reordered = [...benefits];
    const [movedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(index, 0, movedItem);

    const updated = reordered.map((item, idx) => ({
      ...item,
      display_order: idx + 1,
    }));

    setDraggedIndex(index);
    updateBenefits(updated);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Row operations
  const handleAddBenefit = () => {
    if (isReadOnly) return;
    const newBenefit: PlanBenefitRow = {
      id: `row-${Date.now()}`,
      benefit_id: `ben-${Date.now().toString().slice(-4)}`,
      benefit_code: `BEN_NEW_${benefits.length + 1}`,
      coverage_name: "New Coverage Item",
      group_name: selectedGroupFilter !== "ALL" ? selectedGroupFilter : BENEFIT_GROUPS[0],
      limit_amount: 100000,
      limit_display_unit: "Fixed THB Limit",
      display_order: benefits.length + 1,
    };
    updateBenefits([...benefits, newBenefit]);
  };

  const handleDeleteBenefit = (id: string) => {
    if (isReadOnly) return;
    const filtered = benefits.filter((b) => b.id !== id).map((b, idx) => ({ ...b, display_order: idx + 1 }));
    updateBenefits(filtered);
  };

  const handleDuplicateBenefit = (item: PlanBenefitRow) => {
    if (isReadOnly) return;
    const duplicate: PlanBenefitRow = {
      ...item,
      id: `row-${Date.now()}`,
      benefit_id: `ben-${Date.now().toString().slice(-4)}`,
      benefit_code: `${item.benefit_code}_COPY`,
      coverage_name: `${item.coverage_name} (Copy)`,
      display_order: benefits.length + 1,
    };
    updateBenefits([...benefits, duplicate]);
  };

  const handleFieldChange = (id: string, field: keyof PlanBenefitRow, value: string | number) => {
    if (isReadOnly) return;
    const updated = benefits.map((item) => (item.id === id ? { ...item, [field]: value } : item));
    updateBenefits(updated);
  };

  // Filtering
  const filteredBenefits = benefits.filter((b) => {
    const matchesGroup = selectedGroupFilter === "ALL" || b.group_name === selectedGroupFilter;
    const matchesSearch =
      b.coverage_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.benefit_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.group_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-50/60 p-2.5 border border-zinc-200 rounded-lg">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by code or coverage name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-xs bg-white border border-zinc-300 rounded-md text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-zinc-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Group:</span>
          </div>
          <select
            value={selectedGroupFilter}
            onChange={(e) => setSelectedGroupFilter(e.target.value)}
            className="text-xs bg-white border border-zinc-300 text-zinc-800 rounded-md py-1 px-2.5 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          >
            <option value="ALL">All Groups ({benefits.length})</option>
            {BENEFIT_GROUPS.map((grp) => (
              <option key={grp} value={grp}>
                {grp} ({benefits.filter((b) => b.group_name === grp).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-600 font-medium select-none">
                <th className="py-2.5 px-2 w-8 text-center">
                  <ArrowUpDown className="w-3 h-3 mx-auto text-zinc-400" />
                </th>
                <th className="py-2.5 px-2 w-14 text-center">Order</th>
                <th className="py-2.5 px-3 w-44">Coverage Group</th>
                <th className="py-2.5 px-3 w-40">Benefit Code</th>
                <th className="py-2.5 px-3">Coverage Name & Terms</th>
                <th className="py-2.5 px-3 w-36 text-right">Sum Insured / Limit</th>
                <th className="py-2.5 px-3 w-44">Display Unit / Calculation</th>
                <th className="py-2.5 px-2 w-20 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredBenefits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-zinc-500">
                    <Layers className="w-7 h-7 mx-auto text-zinc-300 mb-1.5" />
                    <p className="font-medium text-zinc-700">No coverage rows found</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Adjust your filter or click "Add Coverage Row" to define plan terms.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredBenefits.map((item, index) => {
                  const isDragging = draggedIndex === index;
                  return (
                    <tr
                      key={item.id}
                      draggable={!isReadOnly}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`hover:bg-zinc-50/70 transition-colors group ${
                        isDragging ? "opacity-30 bg-zinc-100" : ""
                      }`}
                    >
                      {/* Drag Handle */}
                      <td className="py-2 px-2 text-center">
                        {!isReadOnly ? (
                          <div className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-700 inline-block">
                            <GripVertical className="w-3.5 h-3.5 mx-auto" />
                          </div>
                        ) : (
                          <span className="text-zinc-300">•</span>
                        )}
                      </td>

                      {/* Display Order Sequence Tag */}
                      <td className="py-2 px-2 text-center font-mono">
                        <span className="inline-block px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[11px] font-medium">
                          #{item.display_order}
                        </span>
                      </td>

                      {/* Coverage Group / Category */}
                      <td className="py-2 px-3">
                        <select
                          disabled={isReadOnly}
                          value={item.group_name}
                          onChange={(e) => handleFieldChange(item.id, "group_name", e.target.value)}
                          className="w-full text-xs text-zinc-800 bg-transparent hover:bg-zinc-50 focus:bg-white border border-transparent hover:border-zinc-300 focus:border-zinc-400 rounded px-1.5 py-1 focus:outline-none disabled:bg-transparent"
                        >
                          {BENEFIT_GROUPS.map((grp) => (
                            <option key={grp} value={grp}>
                              {grp}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Benefit Code */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={item.benefit_code}
                          onChange={(e) => handleFieldChange(item.id, "benefit_code", e.target.value)}
                          className="w-full font-mono text-xs text-zinc-800 bg-transparent hover:bg-zinc-50 focus:bg-white border border-transparent hover:border-zinc-300 focus:border-zinc-400 rounded px-1.5 py-1 focus:outline-none disabled:bg-transparent"
                        />
                      </td>

                      {/* Coverage Name */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={item.coverage_name}
                          onChange={(e) => handleFieldChange(item.id, "coverage_name", e.target.value)}
                          className="w-full font-medium text-xs text-zinc-900 bg-transparent hover:bg-zinc-50 focus:bg-white border border-transparent hover:border-zinc-300 focus:border-zinc-400 rounded px-1.5 py-1 focus:outline-none disabled:bg-transparent"
                        />
                      </td>

                      {/* Limit Amount */}
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          step="1000"
                          disabled={isReadOnly}
                          value={item.limit_amount}
                          onChange={(e) => handleFieldChange(item.id, "limit_amount", parseFloat(e.target.value) || 0)}
                          className="w-full text-right font-mono font-medium text-xs text-zinc-900 bg-transparent hover:bg-zinc-50 focus:bg-white border border-transparent hover:border-zinc-300 focus:border-zinc-400 rounded px-1.5 py-1 focus:outline-none disabled:bg-transparent"
                        />
                      </td>

                      {/* Display Unit / Limit Calculation Note */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={item.limit_display_unit}
                          onChange={(e) => handleFieldChange(item.id, "limit_display_unit", e.target.value)}
                          className="w-full text-xs text-zinc-600 bg-transparent hover:bg-zinc-50 focus:bg-white border border-transparent hover:border-zinc-300 focus:border-zinc-400 rounded px-1.5 py-1 focus:outline-none disabled:bg-transparent"
                        />
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-2 text-center">
                        {!isReadOnly && (
                          <div className="flex items-center justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
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
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Summary Footer */}
        <div className="bg-zinc-50 border-t border-zinc-200 px-3.5 py-2.5 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              SCD Type 2 Snapshot Protection: Reordering and modifications apply to{" "}
              <strong className="text-zinc-700">DRAFT</strong> only.
            </span>
          </div>
          <div className="flex items-center gap-3 text-zinc-600 font-medium">
            <span>
              Showing {filteredBenefits.length} of {benefits.length} items
            </span>
            {!isReadOnly && (
              <button
                type="button"
                onClick={handleAddBenefit}
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                + Add Another Line
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Governance & Approval Callout Banner */}
      <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-3.5 flex items-start gap-2.5 text-xs text-blue-900">
        <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-blue-950">Governance & Approval Workflow (Maker-Checker Module)</p>
          <p className="text-blue-800 leading-relaxed">
            All modifications applied to this comparison matrix will update the table{" "}
            <code className="bg-blue-100 text-blue-900 px-1 py-0.5 rounded font-mono text-[11px]">
              plan_benefit_versions
            </code>
            . Once saved, submit the parent Product draft to trigger the Unified Approver Inbox. Live consumer APIs will
            continue serving the existing Active snapshot until signed off.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BenefitsBuilder;
