-- ============================================================
-- Migration: keywords for auto-guessing expense type from cost detail text
-- keywords = comma-separated, matched case-insensitively; longest match wins
-- Date: 2026-11-08
-- ============================================================

ALTER TABLE expense_types ADD COLUMN IF NOT EXISTS keywords TEXT;

UPDATE expense_types SET keywords = v.kw
FROM (VALUES
  ('ค่าปรับสินค้า', 'ค่าปรับ, ปรับสินค้า, โดนปรับ, penalty, fine'),
  ('ค่า SMS', 'sms, เอสเอ็มเอส, ข้อความ'),
  ('ค่าสูญเสียโอกาสการขาย', 'สูญเสียโอกาส, เสียโอกาส, โอกาสการขาย, ยอดขาย, ขายไม่ได้, lost sale'),
  ('ค่าส่งตัวอย่าง', 'ส่งตัวอย่าง, ค่าขนส่ง, ขนส่ง, ไปรษณีย์, ems, kerry, flash, เคอรี่, แฟลช, shipping, courier'),
  ('ค่าตัวอย่าง', 'ตัวอย่าง, sample'),
  ('ค่ากระเช้า', 'กระเช้า, ของขวัญ, ของฝาก, gift')
) AS v(name, kw)
WHERE expense_types.name = v.name AND expense_types.keywords IS NULL;
