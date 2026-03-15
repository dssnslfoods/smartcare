-- ============================================================
-- Migration: Add full RLS policies for complaints table
-- Date: 2026-03-15
-- ============================================================

-- Enable RLS on complaints (in case not already enabled)
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "allow_read_complaints" ON complaints;
DROP POLICY IF EXISTS "allow_insert_complaints" ON complaints;
DROP POLICY IF EXISTS "allow_update_complaints" ON complaints;
DROP POLICY IF EXISTS "allow_delete_complaints" ON complaints;

-- Recreate with full access
CREATE POLICY "allow_read_complaints"   ON complaints FOR SELECT USING (true);
CREATE POLICY "allow_insert_complaints" ON complaints FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update_complaints" ON complaints FOR UPDATE USING (true);
CREATE POLICY "allow_delete_complaints" ON complaints FOR DELETE USING (true);
