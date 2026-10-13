import React, { useMemo, useState } from "react";
import {
  INITIAL_OCCUPANCIES,
  type OccupancyGroup,
  type OccupancyRecord,
  type RiskClassLevel,
} from "../constants/occupancy";

// Initial Metadata Seed matching SDD 4.2 occupancy_groups DDL
export const INITIAL_GROUPS: OccupancyGroup[] = [
  {
    group_id: 1,
    name_en: "Class 1 - Professional & Administrative",
    name_th: "กลุ่ม 1 - พนักงานออฟฟิศ/ผู้บริหาร",
    description: "Primarily indoor/office work with minimal physical hazard.",
    default_enforcement_action: "STANDARD",
  },
  {
    group_id: 2,
    name_en: "Class 2 - Supervisory & Light Manual",
    name_th: "กลุ่ม 2 - หัวหน้างาน/งานช่างฝีมือ",
    description: "Supervisory duties with occasional light manual work.",
    default_enforcement_action: "LOADED",
  },
  {
    group_id: 3,
    name_en: "Class 3 - Skilled Manual Labor",
    name_th: "กลุ่ม 3 - ช่างผู้ชำนาญการ/งานใช้แรงงาน",
    description: "Skilled or semi-skilled manual labor with moderate machinery use.",
    default_enforcement_action: "REFER",
  },
  {
    group_id: 4,
    name_en: "Class 4 - High Risk / Heavy Manual",
    name_th: "กลุ่ม 4 - งานความเสี่ยงสูง",
    description: "Heavy manual labor, highly hazardous environments, or dangerous machinery. Triggers hard decline.",
    default_enforcement_action: "DECLINE",
  },
];

export const OccupancyUWClassesPage: React.FC = () => {
  const [occupancies, setOccupancies] = useState<OccupancyRecord[]>(INITIAL_OCCUPANCIES);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<number | "ALL">("ALL");
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  // Modal State for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingOccupancy, setEditingOccupancy] = useState<OccupancyRecord | null>(null);
  const [formData, setFormData] = useState<{ group_id: RiskClassLevel; name_en: string; name_th: string }>({
    group_id: 1,
    name_en: "",
    name_th: "",
  });

  // Filtered Occupancies
  const filteredOccupancies = useMemo(() => {
    return occupancies.filter((item) => {
      const matchesGroup = selectedGroupFilter === "ALL" || item.group_id === selectedGroupFilter;
      const matchesSearch =
        item.name_en.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        item.name_th.toLowerCase().includes(searchKeyword.toLowerCase());
      return matchesGroup && matchesSearch;
    });
  }, [occupancies, selectedGroupFilter, searchKeyword]);

  const handleOpenAddModal = () => {
    setEditingOccupancy(null);
    setFormData({ group_id: 1, name_en: "", name_th: "" });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: OccupancyRecord) => {
    setEditingOccupancy(item);
    setFormData({
      group_id: item.group_id,
      name_en: item.name_en,
      name_th: item.name_th,
    });
    setIsModalOpen(true);
  };

  const handleSaveOccupancy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name_en.trim() || !formData.name_th.trim()) {
      alert("Please fill out both English and Thai profession names.");
      return;
    }

    if (editingOccupancy) {
      // Update existing
      setOccupancies((prev) => prev.map((o) => (o.id === editingOccupancy.id ? { ...o, ...formData } : o)));
    } else {
      // Insert new
      const newEntry: OccupancyRecord = {
        id: Date.now(),
        ...formData,
        created_at: new Date().toISOString(),
      };
      setOccupancies((prev) => [newEntry, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteOccupancy = (id: number) => {
    if (window.confirm("Are you sure you want to delete this profession lookup?")) {
      setOccupancies((prev) => prev.filter((o) => o.id !== id));
    }
  };

  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case "STANDARD":
        return "bg-green-100 text-green-800 border-green-300";
      case "LOADED":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "REFER":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "DECLINE":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Occupancy & Underwriting Risk Classes</h1>
        <p className="text-sm text-slate-500 mt-1">
          Master Data management for Personal Accident (PA), Health, and Life risk rating groups (URE Engine).
        </p>
      </div>

      {/* Class Tier Summary Cards (occupancy_groups) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {INITIAL_GROUPS.map((grp) => (
          <div
            key={grp.group_id}
            className={`p-4 rounded-xl border bg-white shadow-sm transition hover:shadow-md ${
              selectedGroupFilter === grp.group_id ? "ring-2 ring-indigo-500 border-indigo-500" : "border-slate-200"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-semibold text-sm text-slate-700">Class {grp.group_id}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getActionBadgeClass(
                  grp.default_enforcement_action,
                )}`}
              >
                {grp.default_enforcement_action}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">{grp.name_en}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{grp.name_th}</p>
            <p className="text-xs text-slate-600 mt-3 border-t pt-2 border-slate-100">{grp.description}</p>
          </div>
        ))}
      </div>

      {/* Control Bar: Filters & Action */}
      <div className="bg-white p-4 rounded-t-xl border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Group Filter */}
          <select
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedGroupFilter}
            onChange={(e) =>
              setSelectedGroupFilter(e.target.value === "ALL" ? "ALL" : (Number(e.target.value) as RiskClassLevel))
            }
          >
            <option value="ALL">All Risk Classes (1-4)</option>
            <option value="1">Class 1: Low Risk (Standard)</option>
            <option value="2">Class 2: Medium Risk (Higher)</option>
            <option value="3">Class 3: Skilled Labor (Referral)</option>
            <option value="4">Class 4: Hazardous (Hard Decline)</option>
          </select>

          {/* Search Box */}
          <input
            type="text"
            placeholder="Search profession (EN or TH)..."
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>

        <button
          onClick={handleOpenAddModal}
          className="w-full md:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          + Add Profession
        </button>
      </div>

      {/* Occupancy Data Grid */}
      <div className="bg-white border-x border-b border-slate-200 rounded-b-xl overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">ID</th>
              <th className="py-3 px-4">Profession Name (EN)</th>
              <th className="py-3 px-4">Profession Name (TH)</th>
              <th className="py-3 px-4">Risk Class</th>
              <th className="py-3 px-4">Underwriting Action</th>
              <th className="py-3 px-4">Created Date</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOccupancies.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400">
                  No occupancy records found matching the filter criteria.
                </td>
              </tr>
            ) : (
              filteredOccupancies.map((row) => {
                const groupMeta = INITIAL_GROUPS.find((g) => g.group_id === row.group_id);
                return (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-xs font-mono text-slate-500">{row.id}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{row.name_en}</td>
                    <td className="py-3 px-4 text-slate-600">{row.name_th}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">Class {row.group_id}</span>
                      <span className="text-xs text-slate-400 ml-1">({groupMeta?.name_en.split(" - ")[1]})</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${getActionBadgeClass(
                          groupMeta?.default_enforcement_action || "",
                        )}`}
                      >
                        {groupMeta?.default_enforcement_action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {new Date(row.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(row)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteOccupancy(row.id)}
                        className="text-xs font-semibold text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              {editingOccupancy ? "Edit Profession Mapping" : "Add New Profession"}
            </h2>
            <form onSubmit={handleSaveOccupancy} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Risk Category Class</label>
                <select
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.group_id}
                  onChange={(e) => setFormData({ ...formData, group_id: Number(e.target.value) as RiskClassLevel })}
                >
                  <option value={1}>Class 1: Low Risk (Professional / Clerical)</option>
                  <option value={2}>Class 2: Medium Risk (Supervisory / Light Manual)</option>
                  <option value={3}>Class 3: High Risk (Skilled Manual Labor)</option>
                  <option value={4}>Class 4: Hazardous (Hard Decline per URE)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Profession Name (English)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chemical Engineer"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Profession Name (Thai)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. วิศวกรเคมี"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.name_th}
                  onChange={(e) => setFormData({ ...formData, name_th: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OccupancyUWClassesPage;
