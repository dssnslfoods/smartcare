-- ============================================================
-- Migration: Create statuses and priorities master data tables
-- Date: 2026-03-15
-- ============================================================

-- Create statuses table
CREATE TABLE IF NOT EXISTS statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create priorities table
CREATE TABLE IF NOT EXISTS priorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default statuses
INSERT INTO statuses (name, code) VALUES
  ('ปิดผู้ผลิต', 'closed_manufacturer'),
  ('ไม่ปิดผู้ผลิต', 'not_closed_manufacturer'),
  ('ปิดเป็น RD', 'closed_rd'),
  ('คาดปิดผู้ผลิต', 'expected_closed_manufacturer'),
  ('คาดไม่ปิดผู้ผลิต', 'expected_not_closed_manufacturer')
ON CONFLICT (name) DO NOTHING;

-- Insert default priorities
INSERT INTO priorities (name, code) VALUES
  ('ต่ำ', 'low'),
  ('กลาง', 'medium'),
  ('สูง', 'high'),
  ('วิกฤต', 'critical')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE priorities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "allow_read_statuses" ON statuses FOR SELECT USING (true);
CREATE POLICY "allow_insert_statuses" ON statuses FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update_statuses" ON statuses FOR UPDATE USING (true);
CREATE POLICY "allow_delete_statuses" ON statuses FOR DELETE USING (true);

CREATE POLICY "allow_read_priorities" ON priorities FOR SELECT USING (true);
CREATE POLICY "allow_insert_priorities" ON priorities FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update_priorities" ON priorities FOR UPDATE USING (true);
CREATE POLICY "allow_delete_priorities" ON priorities FOR DELETE USING (true);
