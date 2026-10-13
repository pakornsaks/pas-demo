// ============================================================================
// Types & Enums (Mapped to BRD 6.1, 7.1 and SDD 4.2 DDL)
// ============================================================================

export type RiskClassLevel = 1 | 2 | 3 | 4;

export interface OccupancyGroup {
  group_id: RiskClassLevel;
  name_en: string;
  name_th: string;
  description: string;
  default_enforcement_action: "STANDARD" | "LOADED" | "REFER" | "DECLINE";
}

export interface OccupancyRecord {
  id: number;
  group_id: RiskClassLevel;
  name_en: string;
  name_th: string;
  created_at: string;
  created_by?: string;
}

export const INITIAL_OCCUPANCIES: OccupancyRecord[] = [
  // ==========================================
  // Class 1: Professional & Administrative (group_id: 1)
  // ==========================================
  { id: 1, group_id: 1, name_en: "Software Engineer", name_th: "วิศวกรซอฟต์แวร์", created_at: "2026-01-15T09:30:00Z" },
  { id: 2, group_id: 1, name_en: "Accountant", name_th: "พนักงานบัญชี", created_at: "2026-01-15T10:00:00Z" },
  {
    id: 7,
    group_id: 1,
    name_en: "Physician / Medical Doctor",
    name_th: "แพทย์ / แพทย์เวชปฏิบัติ",
    created_at: "2026-01-16T08:30:00Z",
  },
  {
    id: 8,
    group_id: 1,
    name_en: "Lawyer / Legal Consultant",
    name_th: "ทนายความ / ที่ปรึกษากฎหมาย",
    created_at: "2026-01-16T11:00:00Z",
  },
  {
    id: 9,
    group_id: 1,
    name_en: "Teacher / Lecturer",
    name_th: "ครู / อาจารย์ผู้สอน",
    created_at: "2026-01-17T09:15:00Z",
  },
  { id: 10, group_id: 1, name_en: "Graphic Designer", name_th: "นักออกแบบกราฟิก", created_at: "2026-01-18T13:45:00Z" },
  {
    id: 11,
    group_id: 1,
    name_en: "HR Specialist",
    name_th: "เจ้าหน้าที่ฝ่ายทรัพยากรบุคคล",
    created_at: "2026-01-20T10:20:00Z",
  },
  {
    id: 12,
    group_id: 1,
    name_en: "Bank Officer / Financial Analyst",
    name_th: "เจ้าหน้าที่ธนาคาร / นักวิเคราะห์การเงิน",
    created_at: "2026-01-22T14:00:00Z",
  },
  {
    id: 13,
    group_id: 1,
    name_en: "Civil Engineer (Office/Design)",
    name_th: "วิศวกรโยธา (งานออกแบบ/สำนักงาน)",
    created_at: "2026-01-25T09:00:00Z",
  },

  // ==========================================
  // Class 2: Supervisory & Light Manual (group_id: 2)
  // ==========================================
  { id: 3, group_id: 2, name_en: "Site Supervisor", name_th: "หัวหน้าคุมไซต์งาน", created_at: "2026-02-01T14:20:00Z" },
  {
    id: 14,
    group_id: 2,
    name_en: "Civil Engineer (Field Inspection)",
    name_th: "วิศวกรโยธาควบคุมงานภาคสนาม",
    created_at: "2026-02-02T09:00:00Z",
  },
  { id: 15, group_id: 2, name_en: "Registered Nurse", name_th: "พยาบาลวิชาชีพ", created_at: "2026-02-03T11:30:00Z" },
  {
    id: 16,
    group_id: 2,
    name_en: "Chef / Head Cook",
    name_th: "หัวหน้าพ่อครัว / เชฟ",
    created_at: "2026-02-04T15:10:00Z",
  },
  {
    id: 17,
    group_id: 2,
    name_en: "Field Photographer / Videographer",
    name_th: "ช่างภาพ / ช่างวิดีโอภาคสนาม",
    created_at: "2026-02-05T10:00:00Z",
  },
  {
    id: 18,
    group_id: 2,
    name_en: "Interior Decorator",
    name_th: "มัณฑนากร / ช่างตกแต่งภายใน",
    created_at: "2026-02-06T13:20:00Z",
  },
  {
    id: 19,
    group_id: 2,
    name_en: "Warehouse Supervisor",
    name_th: "หัวหน้างานคลังสินค้า",
    created_at: "2026-02-08T08:45:00Z",
  },
  {
    id: 20,
    group_id: 2,
    name_en: "Electrician (Residential / Low Voltage)",
    name_th: "ช่างไฟฟ้าภายในอาคาร",
    created_at: "2026-02-09T16:00:00Z",
  },

  // ==========================================
  // Class 3: Skilled Manual Labor (group_id: 3)
  // ==========================================
  {
    id: 4,
    group_id: 3,
    name_en: "Automotive Mechanic",
    name_th: "ช่างซ่อมบำรุงรถยนต์",
    created_at: "2026-02-10T11:15:00Z",
  },
  {
    id: 21,
    group_id: 3,
    name_en: "Delivery Driver / Motorcycle Messenger",
    name_th: "พนักงานขับรถส่งของ / ไรเดอร์จักรยานยนต์",
    created_at: "2026-02-11T09:30:00Z",
  },
  { id: 22, group_id: 3, name_en: "Construction Worker", name_th: "คนงานก่อสร้าง", created_at: "2026-02-12T10:15:00Z" },
  {
    id: 23,
    group_id: 3,
    name_en: "Heavy Truck Driver",
    name_th: "พนักงานขับรถบรรทุกขนาดใหญ่",
    created_at: "2026-02-15T14:40:00Z",
  },
  {
    id: 24,
    group_id: 3,
    name_en: "Industrial Welder",
    name_th: "ช่างเชื่อมโลหะอุตสาหกรรม",
    created_at: "2026-02-18T11:00:00Z",
  },
  {
    id: 25,
    group_id: 3,
    name_en: "Factory Machine Operator",
    name_th: "พนักงานควบคุมเครื่องจักรโรงงาน",
    created_at: "2026-02-20T08:20:00Z",
  },
  {
    id: 26,
    group_id: 3,
    name_en: "Industrial Plumber",
    name_th: "ช่างท่อและประปาอุตสาหกรรม",
    created_at: "2026-02-22T15:50:00Z",
  },
  {
    id: 27,
    group_id: 3,
    name_en: "Security Guard",
    name_th: "เจ้าหน้าที่รักษาความปลอดภัย",
    created_at: "2026-02-25T13:10:00Z",
  },
  {
    id: 28,
    group_id: 3,
    name_en: "Carpenter / Woodworker",
    name_th: "ช่างไม้ / ช่างเฟอร์นิเจอร์",
    created_at: "2026-02-26T10:05:00Z",
  },

  // ==========================================
  // Class 4: High Risk / Heavy Manual (group_id: 4)
  // ==========================================
  { id: 5, group_id: 4, name_en: "Deep Sea Diver", name_th: "นักประดาน้ำลึก", created_at: "2026-03-01T08:00:00Z" },
  {
    id: 6,
    group_id: 4,
    name_en: "High-Voltage Lineman",
    name_th: "ช่างไฟฟ้าแรงสูง",
    created_at: "2026-03-05T16:45:00Z",
  },
  {
    id: 29,
    group_id: 4,
    name_en: "Offshore Oil Rig Worker",
    name_th: "พนักงานแท่นขุดเจาะน้ำมันนอกชายฝั่ง",
    created_at: "2026-03-06T09:10:00Z",
  },
  {
    id: 30,
    group_id: 4,
    name_en: "High-Rise Window Cleaner",
    name_th: "พนักงานทำความสะอาดกระจกอาคารสูง",
    created_at: "2026-03-07T11:45:00Z",
  },
  { id: 31, group_id: 4, name_en: "Firefighter", name_th: "เจ้าหน้าที่ดับเพลิง", created_at: "2026-03-08T14:20:00Z" },
  {
    id: 32,
    group_id: 4,
    name_en: "Underground Mining Worker",
    name_th: "คนงานเหมืองแร่ใต้ดิน",
    created_at: "2026-03-09T08:30:00Z",
  },
  {
    id: 33,
    group_id: 4,
    name_en: "Demolition & Explosives Worker",
    name_th: "พนักงานรื้อถอนอาคารและวัตถุระเบิด",
    created_at: "2026-03-10T16:00:00Z",
  },
  { id: 34, group_id: 4, name_en: "Stunt Performer", name_th: "นักแสดงผาดโผน", created_at: "2026-03-11T13:15:00Z" },
  {
    id: 35,
    group_id: 4,
    name_en: "Commercial Deep Sea Fisherman",
    name_th: "ลูกเรือประมงทะเลลึก",
    created_at: "2026-03-12T07:40:00Z",
  },
];
