-- Backfill root_cause_id, action_items, cost_items for complaints that have NULL values
-- Uses modulo on row number to cycle through sample values

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY complaint_date) AS rn
  FROM complaints
  WHERE root_cause_id IS NULL
     OR action_items IS NULL
     OR cost_items IS NULL
)
UPDATE complaints c
SET
  root_cause_id = CASE (r.rn % 5)
    WHEN 0 THEN 'e5789dd8-5eab-4d95-8967-dccda8a2be27'::uuid  -- Man (คน)
    WHEN 1 THEN '808832fa-951d-4054-94ad-b56a303d10c4'::uuid  -- Machine (เครื่องจักร)
    WHEN 2 THEN 'a91b816e-e90b-4b3d-89f8-f80dbead8046'::uuid  -- Material (วัตถุดิบ)
    WHEN 3 THEN '5a2bacde-fbc4-4243-961f-c1eb85b91989'::uuid  -- Method (วิธีการทำงาน)
    WHEN 4 THEN 'cd4aac06-3c06-41ee-81c3-be6cd96598ff'::uuid  -- Environment (สภาพแวดล้อม)
  END,

  action_items = CASE (r.rn % 5)
    WHEN 0 THEN '[
      {"measure":"ทบทวนและปรับปรุงขั้นตอนการทำงานของพนักงาน","responsible":"QA Manager","due_date":"2025-06-30"},
      {"measure":"จัดอบรม GMP และ HACCP สำหรับพนักงานใหม่","responsible":"HR & QA","due_date":"2025-07-15"}
    ]'::jsonb
    WHEN 1 THEN '[
      {"measure":"ตรวจสอบและบำรุงรักษาเครื่องจักรตามแผน PM","responsible":"Engineering","due_date":"2025-06-25"},
      {"measure":"Calibrate อุปกรณ์วัดทุกจุดวิกฤต","responsible":"Engineering","due_date":"2025-07-01"}
    ]'::jsonb
    WHEN 2 THEN '[
      {"measure":"ตรวจสอบคุณภาพวัตถุดิบก่อนรับเข้า","responsible":"QA Incoming","due_date":"2025-06-20"},
      {"measure":"จัดทำ Supplier Audit Plan ประจำปี","responsible":"Procurement","due_date":"2025-08-01"}
    ]'::jsonb
    WHEN 3 THEN '[
      {"measure":"ทบทวนและปรับปรุง Work Instruction ให้เป็นปัจจุบัน","responsible":"QA","due_date":"2025-07-10"},
      {"measure":"ทำ Process Validation ขั้นตอนที่เกี่ยวข้อง","responsible":"R&D & QA","due_date":"2025-08-15"}
    ]'::jsonb
    WHEN 4 THEN '[
      {"measure":"ตรวจสอบและปรับปรุงระบบควบคุมสภาพแวดล้อมในโรงงาน","responsible":"Facility","due_date":"2025-07-05"},
      {"measure":"ติดตั้งระบบ Monitoring อุณหภูมิและความชื้น","responsible":"Engineering","due_date":"2025-08-01"}
    ]'::jsonb
  END,

  cost_items = CASE (r.rn % 5)
    WHEN 0 THEN '[
      {"item_name":"ค่าอบรมพนักงาน","amount":"12000"},
      {"item_name":"ค่าเอกสารและสื่อการสอน","amount":"3500"}
    ]'::jsonb
    WHEN 1 THEN '[
      {"item_name":"ค่าอะไหล่เครื่องจักร","amount":"28000"},
      {"item_name":"ค่าแรงช่างซ่อมบำรุง","amount":"8000"},
      {"item_name":"ค่า Calibration Service","amount":"5500"}
    ]'::jsonb
    WHEN 2 THEN '[
      {"item_name":"ค่าทดสอบวัตถุดิบแล็บ","amount":"15000"},
      {"item_name":"ค่า Supplier Audit","amount":"20000"}
    ]'::jsonb
    WHEN 3 THEN '[
      {"item_name":"ค่าจัดทำเอกสาร Work Instruction","amount":"4000"},
      {"item_name":"ค่า Process Validation","amount":"18000"}
    ]'::jsonb
    WHEN 4 THEN '[
      {"item_name":"ค่าระบบ Monitoring","amount":"45000"},
      {"item_name":"ค่าติดตั้งและ Commissioning","amount":"12000"}
    ]'::jsonb
  END

FROM ranked r
WHERE c.id = r.id;
