-- ============================================================
-- Migration: Replace callers.company_id FK with customer_company_name text
-- Date: 2026-03-14
-- ============================================================

-- 1. Add customer_company_name column (plain text, no FK)
ALTER TABLE callers ADD COLUMN IF NOT EXISTS customer_company_name TEXT;

-- 2. Migrate existing data: copy company name from companies table
UPDATE callers
SET customer_company_name = c.name
FROM companies c
WHERE callers.company_id = c.id
  AND callers.company_id IS NOT NULL
  AND callers.customer_company_name IS NULL;

-- 3. Drop FK constraint on company_id (if exists)
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT tc.constraint_name INTO constraint_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
  WHERE tc.table_name = 'callers'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'company_id';

  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE callers DROP CONSTRAINT ' || constraint_name;
  END IF;
END $$;

-- 4. Drop company_id column
ALTER TABLE callers DROP COLUMN IF EXISTS company_id;

-- 5. Verify result
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'callers'
ORDER BY ordinal_position;
