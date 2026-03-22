-- Sample complaints data covering all columns
-- Companies: Bake a Wish (e106915f), NSL (6e3a28f2)
-- Branches: HQ (5533ced3), Branch 1 (7362245a), Branch 2 (5790bd3e)

INSERT INTO complaints (
  complaint_number, complaint_date,
  company_id, branch_id, product_group_id,
  category_id, problem_type_id, problem_sub_type_id,
  caller_id, root_cause_id,
  description, status, priority,
  resolution, resolved_at,
  action_items, cost_items,
  closed_case_month, closed_case_year
) VALUES

-- 1. Jan 2025 – Critical – ปิดผู้ผลิต – Bake a Wish
(
  'QAS.2025.01/001', '2025-01-10',
  'e106915f-a748-4e81-a492-28b565ed2f9d', '5533ced3-2bf1-41ae-b193-30167d1added', '22ea2331-4471-402f-a77f-5d1050bc3d36',
  'ff61ef40-8d8d-46e4-94e5-0ca6bd5fdbf8', '07fed574-8bb7-4e3d-af57-2dd8d32f2aa0', '8658f6df-c497-4952-9b69-420e4a154c77',
  '1f735cd6-5d1d-41e5-9131-43044161a2dd', 'e5789dd8-5eab-4d95-8967-dccda8a2be27',
  'พบสิ่งแปลกปลอมในสินค้า PMA01 ล็อต 250110A วัตถุสีดำลักษณะแข็งขนาด 2 มม.',
  'ปิดผู้ผลิต', 'critical',
  'ตรวจสอบและ Recall ล็อตดังกล่าว ปรับปรุงกระบวนการกรองวัตถุดิบ',
  '2025-01-20',
  '[{"measure":"ทบทวนและปรับปรุงขั้นตอนการตรวจสอบวัตถุดิบ","responsible":"QA Manager","due_date":"2025-01-20"},{"measure":"ติดตั้ง Metal Detector จุดใหม่","responsible":"Engineering","due_date":"2025-02-10"}]',
  '[{"item_name":"ค่าใช้จ่าย Recall สินค้า","amount":"45000"},{"item_name":"ค่าทดสอบแล็บ","amount":"8500"}]',
  1, 2025
),

-- 2. Feb 2025 – High – รอดำเนินการ – NSL
(
  'QAS.2025.02/001', '2025-02-05',
  '6e3a28f2-83a1-471b-8bcd-1ef91e95507d', '7362245a-cd80-4c5c-b2ac-3d462f3cd2d2', '032a7892-1744-4fff-a617-cb5973783853',
  '6f69b15a-b282-4a80-8ba0-74a3d896f352', 'b482e4b5-8372-4a63-98e5-592524e31feb', '039faf3c-ac6f-4294-a74e-acf4d6f66f13',
  '17ede5d1-3c83-406e-abb9-8b90b98c0714', '808832fa-951d-4054-94ad-b56a303d10c4',
  'สินค้า PMA03 มีเนื้อสัมผัสผิดปกติ แข็งเกินไป ลูกค้าร้องเรียนจำนวน 3 ราย',
  'รอดำเนินการ', 'high',
  NULL, NULL,
  '[{"measure":"วิเคราะห์หาสาเหตุการผิดปกติของเนื้อสัมผัส","responsible":"R&D Team","due_date":"2025-02-20"}]',
  '[{"item_name":"ค่าวิเคราะห์ตัวอย่าง","amount":"12000"}]',
  2, 2025
),

-- 3. Mar 2025 – Medium – ปิดผู้ผลิต – Bake a Wish
(
  'QAS.2025.03/001', '2025-03-15',
  'e106915f-a748-4e81-a492-28b565ed2f9d', '5790bd3e-b28b-4930-8b8b-3eb4de5246e1', 'f00b96a1-b10e-4299-986b-46deb449fa56',
  'ff61ef40-8d8d-46e4-94e5-0ca6bd5fdbf8', '07fed574-8bb7-4e3d-af57-2dd8d32f2aa0', '329c4639-772c-49d4-8304-c8b1c98bc850',
  '29cc5f04-71e8-4ef7-862f-92181322888d', 'a91b816e-e90b-4b3d-89f8-f80dbead8046',
  'สีของสินค้า PMA07 ล็อต 250315B ไม่ตรงตาม Standard สีผิดปกติมีโทนเหลืองเข้มกว่ากำหนด',
  'ปิดผู้ผลิต', 'medium',
  'ปรับสูตรและ Process ควบคุมอุณหภูมิการผลิต',
  '2025-03-28',
  '[{"measure":"ปรับ Process อุณหภูมิการอบ","responsible":"Production","due_date":"2025-03-28"},{"measure":"จัดทำ Work Instruction ใหม่","responsible":"QA","due_date":"2025-04-05"}]',
  '[{"item_name":"ค่าทดสอบสี Colorimetry","amount":"5500"},{"item_name":"ค่าผลิตซ้ำล็อตที่เสีย","amount":"22000"}]',
  3, 2025
),

-- 4. Apr 2025 – Low – ปิดผู้ผลิต – NSL
(
  'QAS.2025.04/001', '2025-04-08',
  '6e3a28f2-83a1-471b-8bcd-1ef91e95507d', '5533ced3-2bf1-41ae-b193-30167d1added', 'b443726c-b66f-4f27-841a-50621012192e',
  '08344d9c-bbaa-46ce-8b29-c25c9be3a96f', '72b49ef5-aed3-4c46-92c9-e5ec0397c694', NULL,
  '12c2aca8-2a46-472e-b34f-9d2ede5984bf', '5a2bacde-fbc4-4243-961f-c1eb85b91989',
  'กระบวนการจัดส่งสินค้า PMA08 ล่าช้ากว่ากำหนด 2 วัน ลูกค้าได้รับสินค้าไม่ตรงเวลา',
  'ปิดผู้ผลิต', 'low',
  'ปรับปรุง Delivery Schedule และแจ้งลูกค้าล่วงหน้า',
  '2025-04-15',
  '[{"measure":"จัดทำ Delivery Plan ใหม่","responsible":"Logistics","due_date":"2025-04-15"}]',
  '[]',
  4, 2025
),

-- 5. May 2025 – Critical – ไม่ปิดผู้ผลิต – Bake a Wish
(
  'QAS.2025.05/001', '2025-05-20',
  'e106915f-a748-4e81-a492-28b565ed2f9d', '7362245a-cd80-4c5c-b2ac-3d462f3cd2d2', '9a6d61df-41d5-4ac9-b4f9-0523974ec699',
  'd31a5a59-8d09-4b92-9657-4f54faf68df0', 'a3d3fb11-fb0d-4cdf-acf9-ec85c7f80087', NULL,
  '5b7422db-f341-4ce6-b32c-a4b344e3cfbc', 'cd4aac06-3c06-41ee-81c3-be6cd96598ff',
  'พบปัญหา GHPs ในพื้นที่ผลิต PMA21 มีการรั่วซึมของน้ำจากหลังคา อาจส่งผลต่อความปลอดภัยของอาหาร',
  'ไม่ปิดผู้ผลิต', 'critical',
  NULL, NULL,
  '[{"measure":"ซ่อมแซมหลังคาพื้นที่ผลิต","responsible":"Facility","due_date":"2025-06-01"},{"measure":"ตรวจสอบผลิตภัณฑ์ที่อาจปนเปื้อน","responsible":"QA","due_date":"2025-05-25"},{"measure":"จัดทำรายงาน Non-Conformance","responsible":"QA Manager","due_date":"2025-05-30"}]',
  '[{"item_name":"ค่าซ่อมแซมหลังคา","amount":"85000"},{"item_name":"ค่าตรวจวิเคราะห์ Microbiological","amount":"18000"}]',
  5, 2025
),

-- 6. Jun 2025 – High – ปิดผู้ผลิต – NSL
(
  'QAS.2025.06/001', '2025-06-12',
  '6e3a28f2-83a1-471b-8bcd-1ef91e95507d', '5790bd3e-b28b-4930-8b8b-3eb4de5246e1', '22ea2331-4471-402f-a77f-5d1050bc3d36',
  'ff61ef40-8d8d-46e4-94e5-0ca6bd5fdbf8', '07fed574-8bb7-4e3d-af57-2dd8d32f2aa0', 'cc5443a5-ba3c-48db-91f9-a6ada6c7c122',
  '1f735cd6-5d1d-41e5-9131-43044161a2dd', 'e5789dd8-5eab-4d95-8967-dccda8a2be27',
  'สีสินค้า PMA01 เข้มเกินมาตรฐาน ลูกค้าปฏิเสธรับสินค้า 5 ล็อต',
  'ปิดผู้ผลิต', 'high',
  'ตรวจสอบและปรับ Process อุณหภูมิ Retort',
  '2025-06-25',
  '[{"measure":"ปรับ Retort Profile","responsible":"Production Manager","due_date":"2025-06-25"},{"measure":"ทดสอบ Pilot Scale ก่อน Mass Production","responsible":"R&D","due_date":"2025-07-01"}]',
  '[{"item_name":"ค่าทดสอบ Pilot","amount":"15000"},{"item_name":"ค่าสินค้าที่ถูกปฏิเสธ","amount":"120000"}]',
  6, 2025
),

-- 7. Jul 2025 – Medium – รอดำเนินการ – Bake a Wish
(
  'QAS.2025.07/001', '2025-07-03',
  'e106915f-a748-4e81-a492-28b565ed2f9d', '5533ced3-2bf1-41ae-b193-30167d1added', 'f00b96a1-b10e-4299-986b-46deb449fa56',
  '8f6c8c86-bf27-4eb4-ac86-68216fc91746', '07fed574-8bb7-4e3d-af57-2dd8d32f2aa0', '971794b0-6128-46e7-b236-5a3c6b68b6c1',
  '17ede5d1-3c83-406e-abb9-8b90b98c0714', 'a91b816e-e90b-4b3d-89f8-f80dbead8046',
  'สินค้า PMA07 สีอ่อนผิดปกติ มีการ Recall เชิงป้องกัน 2 ล็อต',
  'รอดำเนินการ', 'medium',
  NULL, NULL,
  '[{"measure":"ตรวจสอบ Raw Material ล็อตที่ใช้ผลิต","responsible":"QA","due_date":"2025-07-15"},{"measure":"ประเมินความเสี่ยงสินค้าในตลาด","responsible":"QA Manager","due_date":"2025-07-18"}]',
  '[{"item_name":"ค่า Recall ขนส่งกลับ","amount":"32000"},{"item_name":"ค่าวิเคราะห์วัตถุดิบ","amount":"9800"}]',
  7, 2025
),

-- 8. Aug 2025 – High – ปิดผู้ผลิต – NSL
(
  'QAS.2025.08/001', '2025-08-18',
  '6e3a28f2-83a1-471b-8bcd-1ef91e95507d', '7362245a-cd80-4c5c-b2ac-3d462f3cd2d2', 'b443726c-b66f-4f27-841a-50621012192e',
  '6f69b15a-b282-4a80-8ba0-74a3d896f352', 'b482e4b5-8372-4a63-98e5-592524e31feb', '8658f6df-c497-4952-9b69-420e4a154c77',
  '29cc5f04-71e8-4ef7-862f-92181322888d', '808832fa-951d-4054-94ad-b56a303d10c4',
  'พบโลหะแปลกปลอมใน PMA08 ขนาด 3 มม. ตรวจพบจากระบบ Metal Detector ที่ปลายสาย',
  'ปิดผู้ผลิต', 'high',
  'ตรวจสอบ Machine ทุกจุด พบ Blade แตกหักในเครื่องตัด เปลี่ยนอะไหล่และ Calibrate ใหม่',
  '2025-08-30',
  '[{"measure":"ตรวจสอบและเปลี่ยน Blade เครื่องตัด","responsible":"Engineering","due_date":"2025-08-22"},{"measure":"Calibrate Metal Detector ทุกจุด","responsible":"Engineering","due_date":"2025-08-25"},{"measure":"Hold และตรวจสอบสินค้าทั้งล็อต","responsible":"QA","due_date":"2025-08-20"}]',
  '[{"item_name":"ค่าอะไหล่ Blade","amount":"7500"},{"item_name":"ค่า Calibration","amount":"4200"},{"item_name":"ค่าแรง Hold สินค้า","amount":"3000"}]',
  8, 2025
),

-- 9. Sep 2025 – Low – ปิดผู้ผลิต – Bake a Wish
(
  'QAS.2025.09/001', '2025-09-22',
  'e106915f-a748-4e81-a492-28b565ed2f9d', '5790bd3e-b28b-4930-8b8b-3eb4de5246e1', '9a6d61df-41d5-4ac9-b4f9-0523974ec699',
  '08344d9c-bbaa-46ce-8b29-c25c9be3a96f', '5de61399-7f25-4747-bcfa-3bba464b7661', NULL,
  '12c2aca8-2a46-472e-b34f-9d2ede5984bf', '5a2bacde-fbc4-4243-961f-c1eb85b91989',
  'สินค้า PMA21 ถูกจัดส่งผิดสาขา ส่งไป Branch 1 แต่ Order ระบุ Branch 2',
  'ปิดผู้ผลิต', 'low',
  'แก้ไข Shipping Document และจัดส่งใหม่ภายใน 24 ชั่วโมง',
  '2025-09-23',
  '[{"measure":"ทบทวนขั้นตอนการตรวจสอบ Shipping Order","responsible":"Logistics","due_date":"2025-09-30"}]',
  '[]',
  9, 2025
),

-- 10. Oct 2025 – Critical – ไม่ปิดผู้ผลิต – NSL
(
  'QAS.2025.10/001', '2025-10-07',
  '6e3a28f2-83a1-471b-8bcd-1ef91e95507d', '5533ced3-2bf1-41ae-b193-30167d1added', '22ea2331-4471-402f-a77f-5d1050bc3d36',
  'd31a5a59-8d09-4b92-9657-4f54faf68df0', 'a3d3fb11-fb0d-4cdf-acf9-ec85c7f80087', NULL,
  '5b7422db-f341-4ce6-b32c-a4b344e3cfbc', 'cd4aac06-3c06-41ee-81c3-be6cd96598ff',
  'พบการปนเปื้อนข้ามสายการผลิต สินค้า PMA01 มีส่วนผสมของ Allergen ที่ไม่ได้ระบุบนฉลาก',
  'ไม่ปิดผู้ผลิต', 'critical',
  NULL, NULL,
  '[{"measure":"Recall สินค้าทันที","responsible":"QA Director","due_date":"2025-10-10"},{"measure":"แจ้งหน่วยงานกำกับดูแล","responsible":"Regulatory","due_date":"2025-10-10"},{"measure":"ทบทวน Allergen Control Program","responsible":"QA Manager","due_date":"2025-10-31"}]',
  '[{"item_name":"ค่าใช้จ่าย Recall","amount":"250000"},{"item_name":"ค่าที่ปรึกษากฎหมาย","amount":"50000"},{"item_name":"ค่าทดสอบ Allergen","amount":"25000"}]',
  10, 2025
),

-- 11. Nov 2025 – High – ปิดผู้ผลิต – Bake a Wish
(
  'QAS.2025.11/001', '2025-11-14',
  'e106915f-a748-4e81-a492-28b565ed2f9d', '7362245a-cd80-4c5c-b2ac-3d462f3cd2d2', '032a7892-1744-4fff-a617-cb5973783853',
  'ff61ef40-8d8d-46e4-94e5-0ca6bd5fdbf8', '07fed574-8bb7-4e3d-af57-2dd8d32f2aa0', '039faf3c-ac6f-4294-a74e-acf4d6f66f13',
  '1f735cd6-5d1d-41e5-9131-43044161a2dd', 'e5789dd8-5eab-4d95-8967-dccda8a2be27',
  'สินค้า PMA03 เนื้อสัมผัสนิ่มผิดปกติ ไม่ผ่าน Texture Profile Analysis',
  'ปิดผู้ผลิต', 'high',
  'ปรับ Water Activity และ Moisture Content ของสูตร',
  '2025-11-28',
  '[{"measure":"ปรับ Formulation ลด Moisture","responsible":"R&D","due_date":"2025-11-25"},{"measure":"ทดสอบ Shelf Life ใหม่","responsible":"QA","due_date":"2025-12-15"}]',
  '[{"item_name":"ค่าทดสอบ Texture","amount":"8000"},{"item_name":"ค่า Pilot Batch","amount":"18000"}]',
  11, 2025
),

-- 12. Dec 2025 – Medium – รอดำเนินการ – NSL
(
  'QAS.2025.12/001', '2025-12-02',
  '6e3a28f2-83a1-471b-8bcd-1ef91e95507d', '5790bd3e-b28b-4930-8b8b-3eb4de5246e1', 'f00b96a1-b10e-4299-986b-46deb449fa56',
  '6f69b15a-b282-4a80-8ba0-74a3d896f352', '72b49ef5-aed3-4c46-92c9-e5ec0397c694', NULL,
  '17ede5d1-3c83-406e-abb9-8b90b98c0714', '5a2bacde-fbc4-4243-961f-c1eb85b91989',
  'กระบวนการ CIP ไม่ครบถ้วน พบค่า ATP สูงกว่า Limit หลัง Cleaning สาย PMA07',
  'รอดำเนินการ', 'medium',
  NULL, NULL,
  '[{"measure":"ทบทวน CIP Program และ Chemical Concentration","responsible":"Sanitation","due_date":"2025-12-20"},{"measure":"ฝึกอบรม Operator ขั้นตอน Sanitation","responsible":"QA","due_date":"2025-12-25"}]',
  '[{"item_name":"ค่า ATP Testing Kit","amount":"3500"},{"item_name":"ค่าฝึกอบรม","amount":"6000"}]',
  12, 2025
),

-- 13. Jan 2026 – High – ปิดผู้ผลิต – Bake a Wish
(
  'QAS.2026.01/001', '2026-01-09',
  'e106915f-a748-4e81-a492-28b565ed2f9d', '5533ced3-2bf1-41ae-b193-30167d1added', 'b443726c-b66f-4f27-841a-50621012192e',
  'ff61ef40-8d8d-46e4-94e5-0ca6bd5fdbf8', 'b482e4b5-8372-4a63-98e5-592524e31feb', '329c4639-772c-49d4-8304-c8b1c98bc850',
  '29cc5f04-71e8-4ef7-862f-92181322888d', '808832fa-951d-4054-94ad-b56a303d10c4',
  'พบพลาสติกชิ้นเล็กสีขาวใน PMA08 ล็อต 260109 ลูกค้าแจ้งตรวจพบขณะบริโภค',
  'ปิดผู้ผลิต', 'high',
  'ตรวจสอบพบต้นตอจากฝาปิดเครื่อง Filling แตกร้าว เปลี่ยนอุปกรณ์และ Hold สินค้า',
  '2026-01-20',
  '[{"measure":"เปลี่ยนฝาปิดเครื่อง Filling","responsible":"Engineering","due_date":"2026-01-12"},{"measure":"ตรวจสอบสินค้า Hold ด้วย X-Ray","responsible":"QA","due_date":"2026-01-15"}]',
  '[{"item_name":"ค่าอะไหล่เครื่อง Filling","amount":"28000"},{"item_name":"ค่า X-Ray Inspection","amount":"15000"}]',
  1, 2026
),

-- 14. Feb 2026 – Low – ปิดผู้ผลิต – NSL
(
  'QAS.2026.02/001', '2026-02-17',
  '6e3a28f2-83a1-471b-8bcd-1ef91e95507d', '7362245a-cd80-4c5c-b2ac-3d462f3cd2d2', '9a6d61df-41d5-4ac9-b4f9-0523974ec699',
  '08344d9c-bbaa-46ce-8b29-c25c9be3a96f', '5de61399-7f25-4747-bcfa-3bba464b7661', NULL,
  '12c2aca8-2a46-472e-b34f-9d2ede5984bf', 'cd4aac06-3c06-41ee-81c3-be6cd96598ff',
  'อุณหภูมิห้องเย็นขนส่ง PMA21 สูงกว่ากำหนด +2°C ถึง +8°C พบที่ +11°C นาน 2 ชั่วโมง',
  'ปิดผู้ผลิต', 'low',
  'ซ่อมแซมระบบทำความเย็นรถขนส่ง และเพิ่มการ Monitor อุณหภูมิระหว่างขนส่ง',
  '2026-02-20',
  '[{"measure":"ตรวจสอบและซ่อมแซมระบบ Refrigeration รถขนส่ง","responsible":"Fleet","due_date":"2026-02-20"},{"measure":"เพิ่ม Data Logger บนรถขนส่งทุกคัน","responsible":"Logistics","due_date":"2026-03-01"}]',
  '[{"item_name":"ค่าซ่อม Refrigeration","amount":"35000"},{"item_name":"ค่า Data Logger","amount":"12000"}]',
  2, 2026
),

-- 15. Mar 2026 – Critical – รอดำเนินการ – Bake a Wish
(
  'QAS.2026.03/001', '2026-03-05',
  'e106915f-a748-4e81-a492-28b565ed2f9d', '5790bd3e-b28b-4930-8b8b-3eb4de5246e1', '22ea2331-4471-402f-a77f-5d1050bc3d36',
  'd31a5a59-8d09-4b92-9657-4f54faf68df0', 'a3d3fb11-fb0d-4cdf-acf9-ec85c7f80087', NULL,
  '5b7422db-f341-4ce6-b32c-a4b344e3cfbc', 'e5789dd8-5eab-4d95-8967-dccda8a2be27',
  'ฉลากสินค้า PMA01 ระบุวันหมดอายุผิด พิมพ์ EXP 2026-03 แต่ควรเป็น 2026-09 จำนวน 10,000 หน่วย',
  'รอดำเนินการ', 'critical',
  NULL, NULL,
  '[{"measure":"Recall สินค้าและติดฉลากใหม่","responsible":"QA Director","due_date":"2026-03-12"},{"measure":"ตรวจสอบและแก้ไข Label Template ในระบบ","responsible":"IT/QA","due_date":"2026-03-10"},{"measure":"ตรวจสอบ Label ที่ผลิตในช่วงเดียวกัน","responsible":"QA","due_date":"2026-03-08"}]',
  '[{"item_name":"ค่าติดฉลากใหม่","amount":"42000"},{"item_name":"ค่าขนส่ง Recall","amount":"18000"},{"item_name":"ค่าตรวจสอบพิเศษ","amount":"5000"}]',
  3, 2026
);
