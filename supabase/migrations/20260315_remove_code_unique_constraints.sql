-- ============================================================
-- Migration: Remove unique constraint from code columns
-- Reason: code is not a primary key, duplicates should be allowed
-- Date: 2026-03-15
-- ============================================================

-- Drop unique constraint from product_groups.code
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT tc.constraint_name INTO constraint_name
  FROM information_schema.table_constraints tc
  WHERE tc.table_name = 'product_groups'
    AND tc.constraint_type = 'UNIQUE'
    AND tc.constraint_name LIKE '%code%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE product_groups DROP CONSTRAINT ' || constraint_name;
    RAISE NOTICE 'Dropped constraint: %', constraint_name;
  END IF;
END $$;

-- Drop unique constraint from companies.code (if exists)
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT tc.constraint_name INTO constraint_name
  FROM information_schema.table_constraints tc
  WHERE tc.table_name = 'companies'
    AND tc.constraint_type = 'UNIQUE'
    AND tc.constraint_name LIKE '%code%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE companies DROP CONSTRAINT ' || constraint_name;
    RAISE NOTICE 'Dropped constraint: %', constraint_name;
  END IF;
END $$;

-- Drop unique constraint from branches.code (if exists)
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT tc.constraint_name INTO constraint_name
  FROM information_schema.table_constraints tc
  WHERE tc.table_name = 'branches'
    AND tc.constraint_type = 'UNIQUE'
    AND tc.constraint_name LIKE '%code%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE branches DROP CONSTRAINT ' || constraint_name;
    RAISE NOTICE 'Dropped constraint: %', constraint_name;
  END IF;
END $$;

-- Drop unique constraint from categories.code (if exists)
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT tc.constraint_name INTO constraint_name
  FROM information_schema.table_constraints tc
  WHERE tc.table_name = 'categories'
    AND tc.constraint_type = 'UNIQUE'
    AND tc.constraint_name LIKE '%code%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE categories DROP CONSTRAINT ' || constraint_name;
    RAISE NOTICE 'Dropped constraint: %', constraint_name;
  END IF;
END $$;

-- Drop unique constraint from problem_types.code (if exists)
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT tc.constraint_name INTO constraint_name
  FROM information_schema.table_constraints tc
  WHERE tc.table_name = 'problem_types'
    AND tc.constraint_type = 'UNIQUE'
    AND tc.constraint_name LIKE '%code%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE problem_types DROP CONSTRAINT ' || constraint_name;
    RAISE NOTICE 'Dropped constraint: %', constraint_name;
  END IF;
END $$;

-- Verify result: check remaining indexes on code columns
SELECT table_name, constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name IN ('companies', 'branches', 'product_groups', 'categories', 'problem_types')
  AND constraint_name LIKE '%code%'
ORDER BY table_name, constraint_name;
