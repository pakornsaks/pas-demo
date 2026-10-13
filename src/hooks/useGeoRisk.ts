import { useCallback, useEffect, useState } from "react";

// ==========================================
// 1. Type Definitions & Constants
// ==========================================
export type RiskZoneType =
  | "STANDARD"                 // พื้นที่ทั่วไป ไม่มีประวัติหรือความเสี่ยงภัยธรรมชาติสูงเป็นพิเศษ
  | "FLOOD_ZONE_A"             // พื้นที่เสี่ยงอุทกภัยระดับสูง (พื้นที่น้ำท่วมซ้ำซาก / พื้นที่รับน้ำ)
  | "FLOOD_ZONE_B"             // พื้นที่เสี่ยงอุทกภัยระดับปานกลาง
  | "EARTHQUAKE_ZONE"          // พื้นที่เสี่ยงภัยแผ่นดินไหว (แนวรอยเลื่อน)
  | "HIGH_FIRE_RISK"           // พื้นที่เสี่ยงอัคคีภัยสูง (ชุมชนแออัด / โซนผังเมืองอาคารไม้)
  | "LANDSLIDE_RISK"           // พื้นที่เสี่ยงดินโคลนถล่ม / ดินสไลด์ (พื้นที่ลาดชันเชิงเขา)
  | "COASTAL_STORM_RISK"       // พื้นที่เสี่ยงพายุชายฝั่ง มรสุม และคลื่นลมแรง
  | "FLASH_FLOOD_RISK"         // พื้นที่เสี่ยงน้ำป่าไหลหลาก
  | "INDUSTRIAL_HAZARD_ZONE";  // เขตอุตสาหกรรมที่มีความเสี่ยงมลพิษหรือสารเคมีอันตราย

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
// ข้อมูลจำลอง GeoRiskRecord เพิ่มเติมครอบคลุมพื้นที่และความเสี่ยงหลากหลายประเภท (อ้างอิงฟิลด์ geo_city และ Underwriting Risk Zone)[cite: 1, 2]
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
  {
    id: 10106,
    province_name_th: "กรุงเทพมหานคร",
    province_name_en: "Bangkok",
    district_name_th: "คลองเตย",
    district_name_en: "Khlong Toei",
    postal_code: "10110",
    risk_zone: "HIGH_FIRE_RISK",
    updated_at: "2026-03-25",
  },
  {
    id: 10107,
    province_name_th: "นนทบุรี",
    province_name_en: "Nonthaburi",
    district_name_th: "ปากเกร็ด",
    district_name_en: "Pak Kret",
    postal_code: "11120",
    risk_zone: "STANDARD",
    updated_at: "2026-03-28",
  },
  {
    id: 10108,
    province_name_th: "อุบลราชธานี",
    province_name_en: "Ubon Ratchathani",
    district_name_th: "วารินชำราบ",
    district_name_en: "Warin Chamrap",
    postal_code: "34190",
    risk_zone: "FLOOD_ZONE_A",
    updated_at: "2026-04-02",
  },
  {
    id: 10109,
    province_name_th: "สงขลา",
    province_name_en: "Songkhla",
    district_name_th: "หาดใหญ่",
    district_name_en: "Hat Yai",
    postal_code: "90110",
    risk_zone: "FLOOD_ZONE_B",
    updated_at: "2026-04-05",
  },
  {
    id: 10110,
    province_name_th: "เชียงราย",
    province_name_en: "Chiang Rai",
    district_name_th: "แม่สาย",
    district_name_en: "Mae Sai",
    postal_code: "57130",
    risk_zone: "EARTHQUAKE_ZONE",
    updated_at: "2026-04-10",
  },
  {
    id: 10111,
    province_name_th: "แม่ฮ่องสอน",
    province_name_en: "Mae Hong Son",
    district_name_th: "ปาย",
    district_name_en: "Pai",
    postal_code: "58130",
    risk_zone: "LANDSLIDE_RISK",
    updated_at: "2026-04-12",
  },
  {
    id: 10112,
    province_name_th: "ระยอง",
    province_name_en: "Rayong",
    district_name_th: "เมืองระยอง",
    district_name_en: "Mueang Rayong",
    postal_code: "21150",
    risk_zone: "INDUSTRIAL_HAZARD_ZONE",
    updated_at: "2026-04-15",
  },
  {
    id: 10113,
    province_name_th: "ชลบุรี",
    province_name_en: "Chonburi",
    district_name_th: "ศรีราชา",
    district_name_en: "Si Racha",
    postal_code: "20110",
    risk_zone: "INDUSTRIAL_HAZARD_ZONE",
    updated_at: "2026-04-18",
  },
  {
    id: 10114,
    province_name_th: "ภูเก็ต",
    province_name_en: "Phuket",
    district_name_th: "ถลาง",
    district_name_en: "Thalang",
    postal_code: "83110",
    risk_zone: "COASTAL_STORM_RISK",
    updated_at: "2026-04-20",
  },
  {
    id: 10115,
    province_name_th: "สุราษฎร์ธานี",
    province_name_en: "Surat Thani",
    district_name_th: "เกาะสมุย",
    district_name_en: "Ko Samui",
    postal_code: "84140",
    risk_zone: "COASTAL_STORM_RISK",
    updated_at: "2026-04-22",
  },
  {
    id: 10116,
    province_name_th: "นครราชสีมา",
    province_name_en: "Nakhon Ratchasima",
    district_name_th: "ปากช่อง",
    district_name_en: "Pak Chong",
    postal_code: "30130",
    risk_zone: "FLASH_FLOOD_RISK",
    updated_at: "2026-04-25",
  },
  {
    id: 10117,
    province_name_th: "กาญจนบุรี",
    province_name_en: "Kanchanaburi",
    district_name_th: "ทองผาภูมิ",
    district_name_en: "Thong Pha Phum",
    postal_code: "71180",
    risk_zone: "LANDSLIDE_RISK",
    updated_at: "2026-04-28",
  },
  {
    id: 10118,
    province_name_th: "ขอนแก่น",
    province_name_en: "Khon Kaen",
    district_name_th: "เมืองขอนแก่น",
    district_name_en: "Mueang Khon Kaen",
    postal_code: "40000",
    risk_zone: "STANDARD",
    updated_at: "2026-05-02",
  },
];

// ฟังก์ชันจำลองการยิง Network Request (หน่วงเวลา 800ms)
const fetchGeoRiskApi = (): Promise<GeoRiskRecord[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // จำลอง Success (เปลี่ยนเป็น reject(new Error(...)) ได้หากต้องการทดสอบ Error)
      resolve(MOCK_API_DATA);
    }, 0);
  });
};

export function useGeoRisk() {
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