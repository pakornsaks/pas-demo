import { useState, useEffect, useCallback } from "react";

// ==========================================
// 1. Type Definitions & Constants
// ==========================================
export type RiskZoneType =
  | "STANDARD"
  | "FLOOD_ZONE_A"
  | "FLOOD_ZONE_B"
  | "EARTHQUAKE_ZONE"
  | "HIGH_FIRE_RISK";

export interface GeoRiskRecord {
  id: number;
  province_name_th: string;
  province_name_en: string;
  district_name_th: string;
  district_name_en: string;
  postal_code: string;
  risk_zone: RiskZoneType;
  updated_at: string;
}

// ข้อมูลจำลองสำหรับส่งกลับจาก Mock API
const MOCK_API_DATA: GeoRiskRecord[] = [
  {
    id: 10101,
    province_name_th: "กรุงเทพมหานคร",
    province_name_en: "Bangkok",
    district_name_th: "พระนคร",
    district_name_en: "Phra Nakhon",
    postal_code: "10200",
    risk_zone: "STANDARD",
    updated_at: "2026-01-15",
  },
  {
    id: 10102,
    province_name_th: "พระนครศรีอยุธยา",
    province_name_en: "Phra Nakhon Si Ayutthaya",
    district_name_th: "บางปะอิน",
    district_name_en: "Bang Pa-in",
    postal_code: "13160",
    risk_zone: "FLOOD_ZONE_A",
    updated_at: "2026-02-10",
  },
  {
    id: 10103,
    province_name_th: "พระนครศรีอยุธยา",
    province_name_en: "Phra Nakhon Si Ayutthaya",
    district_name_th: "เสนา",
    district_name_en: "Sena",
    postal_code: "13110",
    risk_zone: "FLOOD_ZONE_B",
    updated_at: "2026-02-12",
  },
  {
    id: 10104,
    province_name_th: "เชียงใหม่",
    province_name_en: "Chiang Mai",
    district_name_th: "แม่ริม",
    district_name_en: "Mae Rim",
    postal_code: "50180",
    risk_zone: "EARTHQUAKE_ZONE",
    updated_at: "2026-03-01",
  },
  {
    id: 10105,
    province_name_th: "สมุทรปราการ",
    province_name_en: "Samut Prakan",
    district_name_th: "บางพลี",
    district_name_en: "Bang Phli",
    postal_code: "10540",
    risk_zone: "HIGH_FIRE_RISK",
    updated_at: "2026-03-20",
  },
];

// ฟังก์ชันจำลองการยิง Network Request (หน่วงเวลา 800ms)
const fetchGeoRiskApi = (): Promise<GeoRiskRecord[]> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // จำลอง Success (เปลี่ยนเป็น reject(new Error(...)) ได้หากต้องการทดสอบ Error)
      resolve(MOCK_API_DATA);
    }, 0);
  });
};

export function useGeoRiskData() {
  const [data, setData] = useState<GeoRiskRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchGeoRiskApi();
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}