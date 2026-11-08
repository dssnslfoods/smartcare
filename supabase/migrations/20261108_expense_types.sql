-- ============================================================
-- Migration: Expense types master data (ประเภทค่าใช้จ่าย)
-- cost_items JSONB now also carries {expense_type_id, expense_type_name}
-- Date: 2026-11-08
-- ============================================================

CREATE TABLE IF NOT EXISTS expense_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT,
  sort_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Helper: admin or supervisor (security definer to avoid user_roles RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin_or_supervisor()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'supervisor')
  );
$$;

ALTER TABLE expense_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "expense_types_read" ON expense_types;
DROP POLICY IF EXISTS "expense_types_insert" ON expense_types;
DROP POLICY IF EXISTS "expense_types_update" ON expense_types;
DROP POLICY IF EXISTS "expense_types_delete" ON expense_types;

CREATE POLICY "expense_types_read" ON expense_types
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "expense_types_insert" ON expense_types
  FOR INSERT WITH CHECK (public.is_admin_or_supervisor());
CREATE POLICY "expense_types_update" ON expense_types
  FOR UPDATE USING (public.is_admin_or_supervisor()) WITH CHECK (public.is_admin_or_supervisor());
CREATE POLICY "expense_types_delete" ON expense_types
  FOR DELETE USING (public.is_admin_or_supervisor());

-- Seed from "Master list ประเภทค่าใช้จ่าย Complaint.docx"
INSERT INTO expense_types (name, code, sort_order) VALUES
  ('ค่าปรับสินค้า', 'product_penalty', 1),
  ('ค่า SMS', 'sms', 2),
  ('ค่าสูญเสียโอกาสการขาย', 'lost_sales', 3),
  ('ค่าส่งตัวอย่าง', 'sample_shipping', 4),
  ('ค่าตัวอย่าง', 'sample', 5),
  ('ค่ากระเช้า', 'gift_basket', 6)
ON CONFLICT (name) DO NOTHING;
