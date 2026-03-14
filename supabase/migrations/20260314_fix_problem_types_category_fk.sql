-- ============================================================
-- Migration: Fix problem_types.category_id FK → categories.id
-- Date: 2026-03-14
-- ============================================================

-- 1. Add category_id column if it doesn't exist yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'problem_types' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE problem_types ADD COLUMN category_id UUID;
  END IF;
END $$;

-- 2. Drop existing FK constraint on category_id if any (avoid duplicate)
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT tc.constraint_name INTO constraint_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
  WHERE tc.table_name = 'problem_types'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'category_id';

  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE problem_types DROP CONSTRAINT ' || constraint_name;
  END IF;
END $$;

-- 3. Add proper FK constraint: problem_types.category_id → categories.id
ALTER TABLE problem_types
  ADD CONSTRAINT fk_problem_types_category_id
  FOREIGN KEY (category_id)
  REFERENCES categories(id)
  ON DELETE SET NULL;

-- 4. Verify result
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name  AS ref_table,
  ccu.column_name AS ref_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'problem_types'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'category_id';
