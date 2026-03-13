export interface CompanyData {
  company: string;
  branch: string;
  kpi: {
    total_calls: number;
    total_records: number;
    closed: number;
    not_closed: number;
    close_rate: number;
    avg_response_days: number;
    median_response_days: number;
  };
  monthly_trend: { year: number; month: string; calls: number; records: number }[];
  status: Record<string, number>;
  category: Record<string, number>;
  problem_type: Record<string, number>;
  sub_problem: Record<string, number>;
  group: Record<string, number>;
  caller: Record<string, number>;
  close_rate_by_type: Record<string, { total: number; closed: number; rate: number }>;
  response_by_category: Record<string, { avg: number; median: number; max: number }>;
  response_distribution: Record<string, number>;
  group_problem_matrix: { group: string; problem: string; count: number }[];
  monthly_status: { year: number; month: string; status: string; count: number }[];
  monthly_category: { month: string; recall: number; foodSafety: number; foodQuality: number; foodLaw: number; foodService: number }[];
}

const nslBranch2: CompanyData = {
  company: "NSL Foods",
  branch: "สาขา 2",
  kpi: {
    total_calls: 464, total_records: 432, closed: 228, not_closed: 180,
    close_rate: 55.9, avg_response_days: 5.6, median_response_days: 4.0
  },
  monthly_trend: [
    { year: 2025, month: "01_January", calls: 17, records: 17 },
    { year: 2025, month: "02_February", calls: 44, records: 26 },
    { year: 2025, month: "03_March", calls: 33, records: 33 },
    { year: 2025, month: "04_April", calls: 51, records: 51 },
    { year: 2025, month: "05_May", calls: 29, records: 29 },
    { year: 2025, month: "06_June", calls: 19, records: 19 },
    { year: 2025, month: "07_July", calls: 40, records: 39 },
    { year: 2025, month: "08_August", calls: 34, records: 34 },
    { year: 2025, month: "09_September", calls: 32, records: 30 },
    { year: 2025, month: "10_October", calls: 46, records: 38 },
    { year: 2025, month: "11_November", calls: 20, records: 19 },
    { year: 2025, month: "12_December", calls: 26, records: 26 },
    { year: 2026, month: "01_January", calls: 31, records: 31 },
    { year: 2026, month: "02_February", calls: 32, records: 32 },
    { year: 2026, month: "03_March", calls: 10, records: 8 },
  ],
  status: { "ปิดผู้ผลิต": 228, "ไม่ปิดผู้ผลิต": 180, "ปิดเป็น RD": 2 },
  category: { "Food Quality": 278, "Food Service": 77, "Food Safety": 76, "Food Law": 1 },
  problem_type: {
    "ด้านสิ่งแปลกปลอม": 186, "ด้านคุณภาพสินค้า": 159,
    "ด้านการขนส่ง": 77, "ด้านบรรจุภัณฑ์": 7, "ด้านจุลินทรีย์": 3
  },
  sub_problem: {
    "PHY - ปริมาณสินค้าไม่ได้มาตรฐาน": 79, "เส้นผม/เส้นขน": 60,
    "ส่งขาด": 47, "BIO - เปรี้ยว": 38, "คราบดำ/เศษดำ/เขม่าดำ/จุดดำ": 35,
    "พลาสติกอ่อน": 25, "BIO - เชื้อรา": 12, "ส่งผิด": 8,
    "ส่งเกิน": 7, "แมลง/ชิ้นส่วนแมลง": 7, "BIO - ลูกค้าเจ็บป่วย": 7,
    "สินค้าโค่นล้ม/ชำรุด": 7, "พลาสติกแข็ง": 6, "กระดูกแข็ง": 5, "เศษโลหะ": 5
  },
  group: {
    "PMA07": 195, "PMA03": 76, "PMA08": 37, "CDC นครสวรรค์": 23,
    "PMA01": 18, "CDC ขอนแก่น": 18, "CDC นครราชสีมา": 13,
    "CDC ชลบุรี": 8, "BAW": 8, "PMA02": 7
  },
  caller: {
    "QA CPALL (คุณบอย)": 208, "จัดซื้อ CPALL": 77, "QA CPALL (คุณโบว์)": 48,
    "QA CPALL (คุณเหมียว)": 35, "QA CPALL (คุณหญิง)": 27, "ลูกค้า": 14,
    "QA CPALL (คุณจอย)": 7, "BAW": 5, "QA CPALL (คุณเดือน)": 5
  },
  close_rate_by_type: {
    "ด้านคุณภาพสินค้า": { total: 159, closed: 28, rate: 17.6 },
    "ด้านสิ่งแปลกปลอม": { total: 186, closed: 118, rate: 63.4 },
    "ด้านจุลินทรีย์": { total: 3, closed: 3, rate: 100.0 },
    "ด้านการขนส่ง": { total: 77, closed: 76, rate: 98.7 },
    "ด้านบรรจุภัณฑ์": { total: 7, closed: 3, rate: 42.9 }
  },
  response_by_category: {
    "Food Safety": { avg: 5.0, median: 4.0, max: 27 },
    "Food Quality": { avg: 6.3, median: 4.0, max: 368 },
    "Food Service": { avg: 3.5, median: 3.0, max: 12 },
    "Food Law": { avg: 4.0, median: 4.0, max: 4 }
  },
  response_distribution: {
    "0-1วัน": 38, "2-3วัน": 124, "4-5วัน": 90,
    "6-7วัน": 65, "8-14วัน": 69, "15-30วัน": 5, "30+วัน": 2
  },
  group_problem_matrix: [
    { group: "BAW", problem: "ด้านคุณภาพสินค้า", count: 4 },
    { group: "BAW", problem: "ด้านบรรจุภัณฑ์", count: 2 },
    { group: "BAW", problem: "ด้านสิ่งแปลกปลอม", count: 2 },
    { group: "PMA01", problem: "ด้านคุณภาพสินค้า", count: 7 },
    { group: "PMA01", problem: "ด้านสิ่งแปลกปลอม", count: 11 },
    { group: "PMA02", problem: "ด้านคุณภาพสินค้า", count: 4 },
    { group: "PMA02", problem: "ด้านจุลินทรีย์", count: 1 },
    { group: "PMA02", problem: "ด้านสิ่งแปลกปลอม", count: 2 },
    { group: "PMA03", problem: "ด้านคุณภาพสินค้า", count: 28 },
    { group: "PMA03", problem: "ด้านบรรจุภัณฑ์", count: 3 },
    { group: "PMA03", problem: "ด้านสิ่งแปลกปลอม", count: 45 },
    { group: "PMA07", problem: "ด้านคุณภาพสินค้า", count: 86 },
    { group: "PMA07", problem: "ด้านจุลินทรีย์", count: 2 },
    { group: "PMA07", problem: "ด้านบรรจุภัณฑ์", count: 1 },
    { group: "PMA07", problem: "ด้านสิ่งแปลกปลอม", count: 106 },
    { group: "PMA08", problem: "ด้านคุณภาพสินค้า", count: 23 },
    { group: "PMA08", problem: "ด้านสิ่งแปลกปลอม", count: 14 },
    { group: "CDC นครสวรรค์", problem: "ด้านการขนส่ง", count: 23 },
    { group: "CDC ขอนแก่น", problem: "ด้านการขนส่ง", count: 18 },
    { group: "CDC นครราชสีมา", problem: "ด้านการขนส่ง", count: 13 },
    { group: "CDC ชลบุรี", problem: "ด้านการขนส่ง", count: 8 },
  ],
  monthly_status: [
    { year: 2025, month: "01_January", status: "ปิดผู้ผลิต", count: 8 },
    { year: 2025, month: "01_January", status: "ไม่ปิดผู้ผลิต", count: 9 },
    { year: 2025, month: "02_February", status: "ปิดผู้ผลิต", count: 14 },
    { year: 2025, month: "02_February", status: "ปิดเป็น RD", count: 1 },
    { year: 2025, month: "02_February", status: "ไม่ปิดผู้ผลิต", count: 11 },
    { year: 2025, month: "03_March", status: "ปิดผู้ผลิต", count: 12 },
    { year: 2025, month: "03_March", status: "ไม่ปิดผู้ผลิต", count: 21 },
    { year: 2025, month: "04_April", status: "ปิดผู้ผลิต", count: 26 },
    { year: 2025, month: "04_April", status: "ไม่ปิดผู้ผลิต", count: 25 },
    { year: 2025, month: "05_May", status: "ปิดผู้ผลิต", count: 12 },
    { year: 2025, month: "05_May", status: "ไม่ปิดผู้ผลิต", count: 17 },
    { year: 2025, month: "06_June", status: "ปิดผู้ผลิต", count: 9 },
    { year: 2025, month: "06_June", status: "ไม่ปิดผู้ผลิต", count: 10 },
    { year: 2025, month: "07_July", status: "ปิดผู้ผลิต", count: 19 },
    { year: 2025, month: "07_July", status: "ไม่ปิดผู้ผลิต", count: 20 },
    { year: 2025, month: "08_August", status: "ปิดผู้ผลิต", count: 23 },
    { year: 2025, month: "08_August", status: "ไม่ปิดผู้ผลิต", count: 11 },
    { year: 2025, month: "09_September", status: "ปิดผู้ผลิต", count: 18 },
    { year: 2025, month: "09_September", status: "ไม่ปิดผู้ผลิต", count: 12 },
    { year: 2025, month: "10_October", status: "ปิดผู้ผลิต", count: 28 },
    { year: 2025, month: "10_October", status: "ปิดเป็น RD", count: 1 },
    { year: 2025, month: "10_October", status: "ไม่ปิดผู้ผลิต", count: 9 },
    { year: 2025, month: "11_November", status: "ปิดผู้ผลิต", count: 8 },
    { year: 2025, month: "11_November", status: "ไม่ปิดผู้ผลิต", count: 11 },
    { year: 2025, month: "12_December", status: "ปิดผู้ผลิต", count: 14 },
    { year: 2025, month: "12_December", status: "ไม่ปิดผู้ผลิต", count: 12 },
    { year: 2026, month: "01_January", status: "ปิดผู้ผลิต", count: 19 },
    { year: 2026, month: "01_January", status: "ไม่ปิดผู้ผลิต", count: 12 },
    { year: 2026, month: "02_February", status: "ปิดผู้ผลิต", count: 14 },
    { year: 2026, month: "03_March", status: "ปิดผู้ผลิต", count: 4 },
  ]
};

const nslBranch1: CompanyData = {
  ...nslBranch2,
  branch: "สาขา 1",
  kpi: {
    total_calls: 312, total_records: 298, closed: 195, not_closed: 103,
    close_rate: 62.5, avg_response_days: 4.2, median_response_days: 3.0
  },
};

const nslBranch3: CompanyData = {
  ...nslBranch2,
  branch: "สาขา 3",
  kpi: {
    total_calls: 189, total_records: 175, closed: 88, not_closed: 87,
    close_rate: 46.6, avg_response_days: 7.1, median_response_days: 5.5
  },
};

export const companies = [
  { id: "nsl", name: "NSL Foods", branches: ["ALL", "สาขา 1", "สาขา 2", "สาขา 3"] },
];

export const statusOptions = ["ปิดผู้ผลิต", "ไม่ปิดผู้ผลิต", "คาดปิดผู้ผลิต", "คาดไม่ปิดผู้ผลิต"];
export const channelOptions = ["ALL", "โทรศัพท์", "อีเมล", "Line"];
export const categoryOptions = ["ALL", "Recall", "Complaint Food Safety", "Complaint Food Quality", "Complaint Food Law", "Complaint Service"];

export const allData: Record<string, CompanyData> = {
  "nsl_ALL": nslBranch2,
  "nsl_สาขา 1": nslBranch1,
  "nsl_สาขา 2": nslBranch2,
  "nsl_สาขา 3": nslBranch3,
};

export function getData(companyId: string, branch: string): CompanyData {
  return allData[`${companyId}_${branch}`] || allData[`${companyId}_ALL`];
}
