// Seed data extracted from Excel: ฐานข้อมูล_Complaint_NSL_Foods_สาขา_2-2.xlsx
// Empty values are replaced with "ไม่ระบุ" per user request

export const companiesData = [
  { name: 'NSL', code: 'NSL' },
];

export const branchesData = [
  { name: 'Branch2', code: 'Branch2', companyName: 'NSL' },
];

export const productGroupsData = [
  { name: 'PMA01', code: 'PMA01' },
  { name: 'PMA02', code: 'PMA02' },
  { name: 'PMA03', code: 'PMA03' },
  { name: 'PMA07', code: 'PMA07' },
  { name: 'PMA08', code: 'PMA08' },
  { name: 'PMA21', code: 'PMA21' },
  { name: 'BAW', code: 'BAW' },
  { name: 'Brand', code: 'Brand' },
  { name: 'Retort', code: 'Retort' },
  { name: 'CDC มหาชัย', code: 'CDC_MAHACHAI' },
  { name: 'CDC บางบัวทอง', code: 'CDC_BANGBUATHONG' },
  { name: 'CDC สุวรรณภูมิ', code: 'CDC_SUVARNABHUMI' },
  { name: 'CDC เชียงใหม่', code: 'CDC_CHIANGMAI' },
  { name: 'CDC นครสวรรค์', code: 'CDC_NAKHONSAWAN' },
  { name: 'CDC นครราชสีมา', code: 'CDC_NAKHONRATCHASIMA' },
  { name: 'CDC ขอนแก่น', code: 'CDC_KHONKAEN' },
  { name: 'CDC ชลบุรี', code: 'CDC_CHONBURI' },
  { name: 'CDC ภูเก็ต', code: 'CDC_PHUKET' },
  { name: 'CDC หาดใหญ่', code: 'CDC_HATYAI' },
  { name: 'CDC สุราษฎร์ธานี', code: 'CDC_SURATTHANI' },
];

export const categoriesData = [
  { name: 'Food Quality', code: 'FQ', productGroupName: 'ไม่ระบุ' },
  { name: 'Food Safety', code: 'FS', productGroupName: 'ไม่ระบุ' },
  { name: 'Food Service', code: 'FSV', productGroupName: 'ไม่ระบุ' },
  { name: 'Food Law', code: 'FL', productGroupName: 'ไม่ระบุ' },
];

export const problemTypesData = [
  { name: 'ด้านคุณภาพสินค้า', code: 'QUALITY' },
  { name: 'ด้านสิ่งแปลกปลอม', code: 'FOREIGN_MATTER' },
  { name: 'ด้านการขนส่ง', code: 'TRANSPORT' },
  { name: 'ด้านบรรจุภัณฑ์', code: 'PACKAGING' },
  { name: 'ด้านจุลินทรีย์', code: 'MICROBE' },
  { name: 'ด้าน Document', code: 'DOCUMENT' },
  { name: 'ด้าน GHPs', code: 'GHPS' },
  { name: 'ด้านกระบวนการ', code: 'PROCESS' },
  { name: 'ผลวิเคราะห์ประจำปี', code: 'ANNUAL_ANALYSIS' },
];

export const problemSubTypesData = [
  // ด้านคุณภาพสินค้า
  { name: 'PHY - เกินค่าการยอมรับ', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - เนื้อสัมผัส', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - สีผิดปกติ', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - สีเข้ม', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - สีอ่อน', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - สีไม่สม่ำเสมอ', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - กลิ่น-รส', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ขนาด', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - รูปร่าง', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - คุณลักษณไม่พึงประสงค์', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - เสียรูป', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - น้ำหนัก', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - จำนวน', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - รสชาติ', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (ไม่กระจาย)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (ผิวหน้าไม่สมบูรณ์)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (ติดเปลือก)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (เลอะบรรจุภัณฑ์)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (เลอะสินค้า)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (เป็นรู)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (แตก/หัก)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (ฉีก/ขาด)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (แหว่ง)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (เอียง)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (แยกชั้น)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (ซีลไม่สมบูรณ์)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (ซีลไม่ได้มาตรฐาน)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (บุบ)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (หด/ย่น)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (ผิดชนิด/ประเภท)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (ยุบ)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (แฉะ)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (เป็นรอย)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (ไม่ละลาย)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (โพรง)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (รั่ว)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (หลุด,ร่อน)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (บวม)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (ไอน้ำ)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (เหนียว,ทิ้งคราบ)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (ผิดด้าน)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (ภาพไม่ชัด)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (รอยต่อ)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (รอยด่าง)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (กลับด้าน)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (ปิดไม่สนิท)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (จับตัวเป็นก้อน)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (กรอม้วนไม่แน่น)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (เส้นสี)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (ภาพเลื่อน)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (ไม่สมบูรณ์)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (แฮมเรืองแสง)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (ไม่สุก)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ลักษณะปรากฎ (เมือก/ยาง)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - มีลักษณะไม่ขึ้นฟู', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - แยกชั้นลามิเนต', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ไม่มีสินค้า', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ไม่ถึงอายุรับเข้า', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - เกินอายุรับเข้า', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - เกินอายุนำมาใช้', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ย้อน Lot', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - อุณหภูมิวัตถุดิบ', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - อุณหภูมิรถขนส่ง', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'PHY - ปริมาณสินค้าไม่ได้มาตรฐาน', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'BIO - เชื้อรา', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'BIO - ยีสต์', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'BIO - เปรี้ยว', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'BIO - ลูกค้าเจ็บป่วย', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'CHM - Acid', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'CHM - ASH', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'CHM - Brix', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'CHM - Farinograph', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'CHM - Fat', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'CHM - FDM (Fai in dry matter)', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'CHM - L*, a*, b*', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'CHM - Moisture', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'CHM - pH', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'CHM - Protein', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'CHM - Refractive Index', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'CHM - Salt', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'CHM - Slip Melting Point', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'CHM - Specific gavity', problemTypeName: 'ด้านคุณภาพสินค้า' },
  { name: 'CHM - Viscosity', problemTypeName: 'ด้านคุณภาพสินค้า' },
  // ด้าน Document
  { name: 'Supplier ไม่ตรง', problemTypeName: 'ด้าน Document' },
  { name: 'ไม่มี SD ตรวจรับ', problemTypeName: 'ด้าน Document' },
  { name: 'SD ตรวจรับยังไม่ขึ้นทะเบียน', problemTypeName: 'ด้าน Document' },
  { name: 'SD ไม่ Update', problemTypeName: 'ด้าน Document' },
  { name: 'ไม่ตรง SD', problemTypeName: 'ด้าน Document' },
  { name: 'ไม่นำส่ง COA พร้อมวัตถุดิบ', problemTypeName: 'ด้าน Document' },
  { name: 'COA ผลเชื้อยังไม่รายงานผล', problemTypeName: 'ด้าน Document' },
  { name: 'COA ไม่ถูกต้อง', problemTypeName: 'ด้าน Document' },
  { name: 'ไม่มี COA', problemTypeName: 'ด้าน Document' },
  { name: 'ไม่ชัดเจน', problemTypeName: 'ด้าน Document' },
  // ด้านจุลินทรีย์
  { name: 'BIO - Bacillus cereus', problemTypeName: 'ด้านจุลินทรีย์' },
  { name: 'BIO - Listeria monocytogenes', problemTypeName: 'ด้านจุลินทรีย์' },
  { name: 'BIO - Salmonella spp.', problemTypeName: 'ด้านจุลินทรีย์' },
  { name: 'BIO - Yeast & Molds', problemTypeName: 'ด้านจุลินทรีย์' },
  // ด้านบรรจุภัณฑ์
  { name: 'ฉลาก', problemTypeName: 'ด้านบรรจุภัณฑ์' },
  { name: 'Code Date', problemTypeName: 'ด้านบรรจุภัณฑ์' },
  { name: 'บรรจุภัณฑ์หีบห่อ', problemTypeName: 'ด้านบรรจุภัณฑ์' },
  { name: 'กลิ่นไม่พึงประสงค์', problemTypeName: 'ด้านบรรจุภัณฑ์' },
  { name: 'แมลงติดกาวสติ๊กเกอร์', problemTypeName: 'ด้านบรรจุภัณฑ์' },
  { name: 'ซองเปล่า', problemTypeName: 'ด้านบรรจุภัณฑ์' },
  // ด้านกระบวนการ
  { name: 'การควบคุมทั่วไป', problemTypeName: 'ด้านกระบวนการ' },
  { name: 'จุด OPRP / CQP', problemTypeName: 'ด้านกระบวนการ' },
  { name: 'จุด CCP', problemTypeName: 'ด้านกระบวนการ' },
  // ด้าน GHPs
  { name: 'การควบคุมกระบวนการผลิต และการขนส่ง', problemTypeName: 'ด้าน GHPs' },
  { name: 'การทำความสะอาด อาคารสถานที่ อาคารผลิต เครื่องจักร เครื่องมือ และอุปกรณ์', problemTypeName: 'ด้าน GHPs' },
  { name: 'การบำรุงรักษา อาคารสถานที่ อาคารผลิต เครื่องจักร เครื่องมือ และอุปกรณ์', problemTypeName: 'ด้าน GHPs' },
  { name: 'การสอบเทียบเครื่องมือวัด', problemTypeName: 'ด้าน GHPs' },
  { name: 'การควบคุมแก้วและวัสดุแตกหักง่าย', problemTypeName: 'ด้าน GHPs' },
  { name: 'การควบคุมสัตว์พาหะนำโรค', problemTypeName: 'ด้าน GHPs' },
  { name: 'สุขลักษณะส่วนบุคคล', problemTypeName: 'ด้าน GHPs' },
  { name: 'การฝึกอบรมและการจัดการสุขภาพพนักงาน', problemTypeName: 'ด้าน GHPs' },
  { name: 'การจัดการข้อร้องเรียนจากลูกค้าและการเรียกคืนผลิตภัณฑ์', problemTypeName: 'ด้าน GHPs' },
  { name: 'ระบบบริหารคุณภาพ', problemTypeName: 'ด้าน GHPs' },
  { name: 'วางของมากับพื้นรถ', problemTypeName: 'ด้าน GHPs' },
  // ด้านการขนส่ง
  { name: 'การบริการ', problemTypeName: 'ด้านการขนส่ง' },
  { name: 'การตรงต่อเวลา', problemTypeName: 'ด้านการขนส่ง' },
  { name: 'ส่งขาด', problemTypeName: 'ด้านการขนส่ง' },
  { name: 'ส่งเกิน', problemTypeName: 'ด้านการขนส่ง' },
  { name: 'ส่งผิด', problemTypeName: 'ด้านการขนส่ง' },
  { name: 'สินค้าโค่นล้ม/ชำรุด', problemTypeName: 'ด้านการขนส่ง' },
  { name: 'ไม่ปฏิบัติตามกฎระเบียบ', problemTypeName: 'ด้านการขนส่ง' },
  { name: 'อุณหภูมิ', problemTypeName: 'ด้านการขนส่ง' },
  // ด้านสิ่งแปลกปลอม
  { name: 'เชือก/ด้าย', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'หนังยาง', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'เปลือก/ซัง', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'เปลือกไข่', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'เศษแก้ว/กระจก', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'เศษไม้', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'หิน', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'เศษโลหะ', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'เศษไดคัท', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'เศษกระดาษ/กล่อง', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'เส้นไหม', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'เส้นเอ็น', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'เส้นผม/เส้นขน', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'แมลง/ชิ้นส่วนแมลง', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'ขนไก่', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'เศษไหม้', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'คราบดำ/เศษดำ/เขม่าดำ/จุดดำ', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'กรวด/หิน/ดิน/ทราย', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'กระดูกแข็ง', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'กระดูกอ่อน', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'ก้าง', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'คลีบ/เกล็ด', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'ฝุ่น', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'เศษสีน้ำตาล', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'เศษสีส้ม', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'เศษสีน้ำเงิน', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'เศษสีขาว', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'เศษสีดำ', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'เศษสีม่วง', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'พลาสติกแข็ง', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'พลาสติกอ่อน', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'ขั้ว/ใบ', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'เศษผัก', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'หยากไย่', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'วัชพืช', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'ชื้นส่วนเทป', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'เศษเทปล่อน', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'เศษสินค้า', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'เศษถุงมือ', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'ก้าน/เส้นใยผัก', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'จากวัตถุดิบ', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'ก้อนแป้ง', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'เจลาติน', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'หมึกเคมี', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
  { name: 'เศษเล็บ', problemTypeName: 'ด้านสิ่งแปลกปลอม' },
];

export const callersData = [
  { name: 'QA CPALL (คุณบอย)' },
  { name: 'QA CPALL (คุณโบว์)' },
  { name: 'QA CPALL (คุณเหมียว)' },
  { name: 'QA CPALL (คุณจอย)' },
  { name: 'QA CPALL (คุณหญิง)' },
  { name: 'QA CPALL (คุณเดือน)' },
  { name: 'QA CPALL (คุณบิ๊ว)' },
  { name: 'QA CPALL (คุณต่อ)' },
  { name: 'จัดซื้อ CPALL' },
  { name: 'BAW' },
  { name: 'MK 7-11' },
  { name: 'MK Brand' },
  { name: 'ลูกค้า' },
];

// Helper to parse problem sub-type from the combined format "ด้านXXX_YYY"
function extractSubTypeName(combined: string): { typeName: string; subTypeName: string } {
  const parts = combined.split('_');
  if (parts.length >= 2) {
    return { typeName: parts[0], subTypeName: parts.slice(1).join('_') };
  }
  return { typeName: combined, subTypeName: 'ไม่ระบุ' };
}

// Raw complaint data from Page 4 of Excel
export interface RawComplaint {
  company: string;
  branch: string;
  status: string;
  callCount: number;
  year: number;
  month: string;
  issueDate: string;
  responseDate: string;
  docNumber: string;
  caller: string;
  group: string;
  category: string;
  problemType: string;
  problemSubType: string;
  description: string;
}

export const complaintsRawData: RawComplaint[] = [
  { company: 'NSL', branch: 'Branch2', status: 'ปิดผู้ผลิต', callCount: 1, year: 2025, month: '08_August', issueDate: '2025-08-20', responseDate: '2025-08-23', docNumber: 'QAS.2.2025.08/030', caller: 'QA CPALL (คุณบอย)', group: 'PMA07', category: 'Food Quality', problemType: 'ด้านคุณภาพสินค้า', problemSubType: 'ด้านคุณภาพสินค้า_PHY - จำนวน', description: 'แซนวิชเดนิชผักโขมแฮม ตราอีซี่โก MFG.160825 EXP.220825 พบปัญหาไม่มีฝาบนแป้งเดนิช' },
  { company: 'NSL', branch: 'Branch2', status: 'ปิดผู้ผลิต', callCount: 1, year: 2025, month: '08_August', issueDate: '2025-08-21', responseDate: '2025-08-25', docNumber: 'QAS.2.2025.08/031', caller: 'QA CPALL (คุณโบว์)', group: 'PMA01', category: 'Food Quality', problemType: 'ด้านคุณภาพสินค้า', problemSubType: 'ด้านคุณภาพสินค้า_PHY - สีเข้ม', description: 'ขนมปังเกลือแฮมชีส ตราอีซี่โก MFG.170825 EXP.240825 พบปัญหาขนมปังสีเข้ม' },
  { company: 'NSL', branch: 'Branch2', status: 'ปิดผู้ผลิต', callCount: 1, year: 2025, month: '08_August', issueDate: '2025-08-21', responseDate: '2025-09-06', docNumber: 'QAS.2.2025.08/032', caller: 'QA CPALL (คุณหญิง)', group: 'PMA03', category: 'Food Quality', problemType: 'ด้านสิ่งแปลกปลอม', problemSubType: 'ด้านสิ่งแปลกปลอม_เส้นผม/เส้นขน', description: 'เอแคลร์นมสด ตราอีซี่สวีท MFG.170825 EXP.240825 พบปัญหาสิ่งแปลกปลอม (เส้นผม)' },
  { company: 'NSL', branch: 'Branch2', status: 'ปิดผู้ผลิต', callCount: 1, year: 2025, month: '08_August', issueDate: '2025-08-23', responseDate: '2025-08-26', docNumber: 'QAS.2.2025.08/033', caller: 'MK 7-11', group: 'Brand', category: 'Food Quality', problemType: 'ด้านคุณภาพสินค้า', problemSubType: 'ด้านคุณภาพสินค้า_PHY - ลักษณะปรากฎ (แตก/หัก)', description: 'ข้าวแท่ง (ข้าวกะเพราไก่คลุก) MFG.050625 EXP.050925 พบปัญหาข้าวแท่งแตก' },
  { company: 'NSL', branch: 'Branch2', status: 'ปิดผู้ผลิต', callCount: 1, year: 2025, month: '08_August', issueDate: '2025-08-28', responseDate: '2025-09-01', docNumber: 'QAS.2.2025.08/034', caller: 'QA CPALL (คุณบอย)', group: 'PMA07', category: 'Food Quality', problemType: 'ด้านคุณภาพสินค้า', problemSubType: 'ด้านคุณภาพสินค้า_PHY - ปริมาณสินค้าไม่ได้มาตรฐาน', description: 'แซนวิชไส้ทาร์ตไข่ ตราอีซี่โก ไม่ทราบ Lot พบปัญหาปริมาณสินค้าไม่ได้มาตรฐาน (ไม่มีไส้ทาร์ตไข่)' },
  { company: 'NSL', branch: 'Branch2', status: 'ปิดผู้ผลิต', callCount: 1, year: 2025, month: '08_August', issueDate: '2025-09-01', responseDate: '2025-09-03', docNumber: 'QAS.2.2025.09/001', caller: 'QA CPALL (คุณหญิง)', group: 'PMA03', category: 'Food Quality', problemType: 'ด้านคุณภาพสินค้า', problemSubType: 'ด้านคุณภาพสินค้า_PHY - จำนวน', description: 'เอแคลร์นมสด ตราอีซี่สวีท-โกลด์ MFG.230825-A4 EXP.300825 พบปัญหาปริมาณสินค้าไม่ได้มาตรฐาน (ไม่ครบ 6 ลูก)' },
  { company: 'NSL', branch: 'Branch2', status: 'ไม่ปิดผู้ผลิต', callCount: 2, year: 2025, month: '09_September', issueDate: '2025-09-01', responseDate: '2025-09-03', docNumber: 'QAS.2.2025.09/002', caller: 'จัดซื้อ CPALL', group: 'PMA07', category: 'Food Quality', problemType: 'ด้านคุณภาพสินค้า', problemSubType: 'ด้านคุณภาพสินค้า_PHY - ปริมาณสินค้าไม่ได้มาตรฐาน', description: 'แซนวิชไส้กรอกชีส ตราอีซี่โก ไม่ทราบ Lot พบปัญหาปริมาณสินค้าไม่ได้มาตรฐาน (ไส้กรอกน้อย) 2 Call' },
  { company: 'NSL', branch: 'Branch2', status: 'ไม่ปิดผู้ผลิต', callCount: 1, year: 2025, month: '09_September', issueDate: '2025-09-03', responseDate: '2025-09-06', docNumber: 'QAS.2.2025.09/003', caller: 'QA CPALL (คุณบอย)', group: 'PMA07', category: 'Food Quality', problemType: 'ด้านสิ่งแปลกปลอม', problemSubType: 'ด้านสิ่งแปลกปลอม_แมลง/ชิ้นส่วนแมลง', description: 'กริลล์ชีส ตราอีซี่โก MFG.250825 EXP. 010925 พบปัญหาสิ่งแปลกปลอม (คล้ายลูกแมลงสาบ)' },
  { company: 'NSL', branch: 'Branch2', status: 'ไม่ปิดผู้ผลิต', callCount: 1, year: 2025, month: '09_September', issueDate: '2025-09-03', responseDate: '2025-09-06', docNumber: 'QAS.2.2025.09/004', caller: 'QA CPALL (คุณบอย)', group: 'PMA07', category: 'Food Safety', problemType: 'ด้านสิ่งแปลกปลอม', problemSubType: 'ด้านสิ่งแปลกปลอม_เศษโลหะ', description: 'แซนวิชแฮมชีส ตราอีซี่โก ไม่ทราบ Lot พบปัญหาสิ่งแปลกปลอม (ไส้แม็ค)' },
  { company: 'NSL', branch: 'Branch2', status: 'ไม่ปิดผู้ผลิต', callCount: 1, year: 2025, month: '09_September', issueDate: '2025-09-03', responseDate: '2025-09-05', docNumber: 'QAS.2.2025.09/005', caller: 'QA CPALL (คุณบอย)', group: 'PMA07', category: 'Food Quality', problemType: 'ด้านสิ่งแปลกปลอม', problemSubType: 'ด้านสิ่งแปลกปลอม_เส้นผม/เส้นขน', description: 'แซนวิชหมูหยองน้ำสลัด ตราอีซี่โก ไม่ทราบ Lot พบปัญหาสิ่งแปลกปลอม (เส้นผม)' },
  { company: 'NSL', branch: 'Branch2', status: 'ปิดผู้ผลิต', callCount: 1, year: 2025, month: '09_September', issueDate: '2025-09-05', responseDate: '2025-09-06', docNumber: 'QAS.2.2025.09/006', caller: 'จัดซื้อ CPALL', group: 'CDC นครราชสีมา', category: 'Food Service', problemType: 'ด้านการขนส่ง', problemSubType: 'ด้านการขนส่ง_ส่งขาด', description: 'CDC นครราชสีมา รอบวันที่ 05.09.25 PO.2 พบปัญหาสินค้าแซนวิชไส้กรอกชีส ตราอีซี่โก ส่งขาด 60 ชิ้น' },
  { company: 'NSL', branch: 'Branch2', status: 'ไม่ปิดผู้ผลิต', callCount: 1, year: 2025, month: '09_September', issueDate: '2025-09-08', responseDate: '2025-09-08', docNumber: 'QAS.2.2025.09/007', caller: 'ลูกค้า', group: 'PMA03', category: 'Food Quality', problemType: 'ด้านบรรจุภัณฑ์', problemSubType: 'ด้านบรรจุภัณฑ์_บรรจุภัณฑ์หีบห่อ', description: 'บงบงช็อกโกแลต ตราอีซี่สวีท-โกลด์ MFG.010925 EXP.080925 พบปัญหาบรรจุภัณฑ์แตก' },
  { company: 'NSL', branch: 'Branch2', status: 'ปิดผู้ผลิต', callCount: 1, year: 2025, month: '09_September', issueDate: '2025-09-11', responseDate: '2025-09-17', docNumber: 'QAS.2.2025.09/008', caller: 'จัดซื้อ CPALL', group: 'CDC มหาชัย', category: 'Food Service', problemType: 'ด้านการขนส่ง', problemSubType: 'ด้านการขนส่ง_อุณหภูมิ', description: 'CDC มหาชัย รอบส่งวันที่ 09.09.25 PO.4-5 พบปัญหาอุณหภูมิระหว่างการขนส่งสูงกว่ามาตรฐาน' },
  { company: 'NSL', branch: 'Branch2', status: 'ปิดผู้ผลิต', callCount: 1, year: 2025, month: '09_September', issueDate: '2025-09-11', responseDate: '2025-09-17', docNumber: 'QAS.2.2025.09/009', caller: 'QA CPALL (คุณเหมียว)', group: 'PMA08', category: 'Food Safety', problemType: 'ด้านสิ่งแปลกปลอม', problemSubType: 'ด้านสิ่งแปลกปลอม_กระดูกแข็ง', description: 'เบอร์เกอร์ไก่อบซอสบาร์บีคิว ตราอีซี่โก MFG.070925 EXP.150925 พบปัญหาสิ่งแปลกปลอม (กระดูก)' },
  { company: 'NSL', branch: 'Branch2', status: 'ไม่ปิดผู้ผลิต', callCount: 1, year: 2025, month: '09_September', issueDate: '2025-09-12', responseDate: '2025-09-19', docNumber: 'QAS.2.2025.09/010', caller: 'QA CPALL (คุณบอย)', group: 'PMA07', category: 'Food Quality', problemType: 'ด้านสิ่งแปลกปลอม', problemSubType: 'ด้านสิ่งแปลกปลอม_เส้นผม/เส้นขน', description: 'แซนวิชหมูหยองน้ำสลัด ตราอีซี่โก ไม่ทราบ Lot พบปัญหาสิ่งแปลกปลอม (เส้นผม)' },
  { company: 'NSL', branch: 'Branch2', status: 'ปิดผู้ผลิต', callCount: 1, year: 2025, month: '09_September', issueDate: '2025-09-12', responseDate: '2025-09-19', docNumber: 'QAS.2.2025.09/011', caller: 'QA CPALL (คุณบอย)', group: 'PMA07', category: 'Food Quality', problemType: 'ด้านสิ่งแปลกปลอม', problemSubType: 'ด้านสิ่งแปลกปลอม_เส้นผม/เส้นขน', description: 'แซนวิชเดนิชผักโขมชีส ตราอีซี่โก MFG.080925 EXP.140925 พบปัญหาสิ่งแปลกปลอม (เส้นผม)' },
  { company: 'NSL', branch: 'Branch2', status: 'ปิดผู้ผลิต', callCount: 2, year: 2025, month: '09_September', issueDate: '2025-09-12', responseDate: '2025-09-16', docNumber: 'QAS.2.2025.09/012', caller: 'จัดซื้อ CPALL', group: 'CDC มหาชัย', category: 'Food Quality', problemType: 'ด้านคุณภาพสินค้า', problemSubType: 'ด้านคุณภาพสินค้า_PHY - ลักษณะปรากฎ (ไอน้ำ)', description: 'CDC มหาชัย รอบส่งวันที่ 12.09.25 PO.5-6 และรอบส่งวันที่ 13.09.25 PO.1-2 พบปัญหาสินค้าไม่ได้มาตรฐาน (สินค้าเกิดฝ้า)' },
];

// Note: This is a subset - the full data continues. Due to the volume,
// the import page will handle all records.
