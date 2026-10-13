import { useEffect, useMemo, useState } from "react";
import { useGeoRiskData, type GeoRiskRecord, type RiskZoneType } from "../../../hooks/useGeoRiskData";

const RISK_BADGES: Record<RiskZoneType, { label: string; badgeClass: string; impact: string }> = {
  STANDARD: {
    label: "Standard / Low Risk",
    badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
    impact: "Auto-Approve (Normal Rate)",
  },
  FLOOD_ZONE_A: {
    label: "Flood Zone A",
    badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
    impact: "Referral / +15% Water Loading",
  },
  FLOOD_ZONE_B: {
    label: "Flood Zone B",
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
    impact: "Referral / +8% Water Loading",
  },
  EARTHQUAKE_ZONE: {
    label: "Earthquake Zone",
    badgeClass: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300",
    impact: "Structural Audit / Add Rider",
  },
  HIGH_FIRE_RISK: {
    label: "High Fire Risk",
    badgeClass: "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300",
    impact: "Industrial Survey Mandatory",
  },
};

// ==========================================
// 3. Main Component
// ==========================================
export default function GeoRiskMappingPage() {
  const { data: remoteData, isLoading, error, refetch } = useGeoRiskData();

  // Local state สำหรับจัดการข้อมูลและการแก้ไข
  const [geoRecords, setGeoRecords] = useState<GeoRiskRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRisk, setFilterRisk] = useState<string>("ALL");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tempRisk, setTempRisk] = useState<RiskZoneType>("STANDARD");

  // ซิงค์ข้อมูลจาก Hook เข้า Local State เมื่อ Fetch เสร็จสิ้น
  useEffect(() => {
    if (remoteData) {
      setGeoRecords(remoteData);
    }
  }, [remoteData]);

  // Filter records ตามคำค้นหาและโซนความเสี่ยง
  const filteredRecords = useMemo(() => {
    return geoRecords.filter((rec) => {
      const matchSearch =
        rec.province_name_th.includes(searchTerm) ||
        rec.province_name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.district_name_th.includes(searchTerm) ||
        rec.district_name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.postal_code.includes(searchTerm);

      const matchRisk = filterRisk === "ALL" || rec.risk_zone === filterRisk;
      return matchSearch && matchRisk;
    });
  }, [geoRecords, searchTerm, filterRisk]);

  const handleStartEdit = (record: GeoRiskRecord) => {
    setEditingId(record.id);
    setTempRisk(record.risk_zone);
  };

  const handleSaveRisk = (id: number) => {
    setGeoRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              risk_zone: tempRisk,
              updated_at: new Date().toISOString().split("T")[0],
            }
          : r,
      ),
    );
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Container */}
      <div className="p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          <span>Master Data Management</span>
          <span>•</span>
          <span>Screen 8.1.1 (geo_city)</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Geographical & Risk Mapping Manager</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              ระบบจัดเก็บฐานข้อมูลรหัสไปรษณีย์ไทยเพื่อแบ่งเขตความเสี่ยง (Risk Zoning) สำหรับกฎพิจารณาภัย (Fire & Motor
              URE Rules)
            </p>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg flex items-center justify-between text-xs text-red-700 dark:text-red-300">
          <span>{error}</span>
          <button onClick={refetch} className="font-semibold underline hover:no-underline">
            ลองใหม่อีกครั้ง
          </button>
        </div>
      )}

      {/* Control / Filter Bar */}
      <div className="p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="w-full md:w-1/3">
          <input
            type="text"
            placeholder="ค้นหาตามจังหวัด, อำเภอ, หรือรหัสไปรษณีย์..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <label className="text-xs text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap">
            กรองตามระดับความเสี่ยง:
          </label>
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            disabled={isLoading}
            className="px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="ALL">ทุกลำดับเขต (All Risk Types)</option>
            <option value="STANDARD">Standard / Low Risk</option>
            <option value="FLOOD_ZONE_A">Flood Zone A</option>
            <option value="FLOOD_ZONE_B">Flood Zone B</option>
            <option value="EARTHQUAKE_ZONE">Earthquake Zone</option>
            <option value="HIGH_FIRE_RISK">High Fire Risk</option>
          </select>
        </div>
      </div>

      {/* Table Data Grid */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">จังหวัด (Province)</th>
                <th className="py-3 px-4">อำเภอ/เขต (District)</th>
                <th className="py-3 px-4">รหัสไปรษณีย์</th>
                <th className="py-3 px-4">พิกัดภัยพิบัติ (Risk Zone)</th>
                <th className="py-3 px-4">ผลการพิจารณาเบี้ย (Underwriting Rule)</th>
                <th className="py-3 px-4">แก้ไขล่าสุด</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-800 dark:text-zinc-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>กำลังโหลดข้อมูลพิกัดความเสี่ยงจาก API...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-400">
                    ไม่พบข้อมูลพื้นที่ทางภูมิศาสตร์ที่ตรงกับเงื่อนไขค้นหา
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => {
                  const isEditing = editingId === item.id;
                  const currentBadge = RISK_BADGES[item.risk_zone];

                  return (
                    <tr key={item.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-zinc-500">{item.id}</td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{item.province_name_th}</span>
                        <span className="block text-zinc-400 text-[11px]">{item.province_name_en}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span>{item.district_name_th}</span>
                        <span className="block text-zinc-400 text-[11px]">{item.district_name_en}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium">{item.postal_code}</td>
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <select
                            value={tempRisk}
                            onChange={(e) => setTempRisk(e.target.value as RiskZoneType)}
                            className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs rounded p-1 text-zinc-900 dark:text-zinc-100"
                          >
                            <option value="STANDARD">Normal / Low Risk</option>
                            <option value="FLOOD_ZONE_A">Flood Zone A</option>
                            <option value="FLOOD_ZONE_B">Flood Zone B</option>
                            <option value="EARTHQUAKE_ZONE">Earthquake Fault Line</option>
                            <option value="HIGH_FIRE_RISK">Industrial Fire Hazard</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${currentBadge.badgeClass}`}
                          >
                            {currentBadge.label}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{currentBadge.impact}</td>
                      <td className="py-3 px-4 text-zinc-400 text-[11px]">{item.updated_at}</td>
                      <td className="py-3 px-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleSaveRisk(item.id)}
                              className="px-2 py-1 text-xs font-semibold bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              บันทึก
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                            >
                              ยกเลิก
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Edit Risk
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Bar */}
        <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between text-xs text-zinc-500">
          <span>
            แสดง {filteredRecords.length} จากทั้งหมด {geoRecords.length} เขตพื้นที่
          </span>
          <span className="text-[11px] font-mono text-zinc-400">Reference: geo_city table</span>
        </div>
      </div>
    </div>
  );
}
