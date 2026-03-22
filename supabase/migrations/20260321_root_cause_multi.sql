-- Add root_cause_ids array column for multi-select root causes
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS root_cause_ids text[] DEFAULT '{}';

-- Backfill from existing root_cause_id (single) → root_cause_ids (array)
UPDATE complaints
SET root_cause_ids = ARRAY[root_cause_id::text]
WHERE root_cause_id IS NOT NULL
  AND (root_cause_ids IS NULL OR root_cause_ids = '{}');

-- Add some multi-cause sample data (first 10 complaints get 2-3 causes)
-- We'll pick from existing root_causes table
DO $$
DECLARE
  rc_ids text[];
  comp record;
  counter int := 0;
BEGIN
  -- Get all root cause IDs
  SELECT array_agg(id::text ORDER BY sort_order) INTO rc_ids FROM root_causes;

  IF rc_ids IS NULL OR array_length(rc_ids, 1) < 2 THEN
    RAISE NOTICE 'Not enough root causes to create multi-select samples';
    RETURN;
  END IF;

  -- Update first batch: 2 causes each (Man + Method, Machine + Material, etc.)
  FOR comp IN
    SELECT id FROM complaints ORDER BY created_at LIMIT 15
  LOOP
    counter := counter + 1;
    CASE (counter % 5)
      WHEN 0 THEN -- Man + Method
        UPDATE complaints SET root_cause_ids = ARRAY[rc_ids[1], rc_ids[4]]
        WHERE id = comp.id;
      WHEN 1 THEN -- Machine + Material + Environment
        UPDATE complaints SET root_cause_ids = ARRAY[rc_ids[2], rc_ids[3], rc_ids[5]]
        WHERE id = comp.id;
      WHEN 2 THEN -- Man + Machine
        UPDATE complaints SET root_cause_ids = ARRAY[rc_ids[1], rc_ids[2]]
        WHERE id = comp.id;
      WHEN 3 THEN -- Method + Environment
        UPDATE complaints SET root_cause_ids = ARRAY[rc_ids[4], rc_ids[5]]
        WHERE id = comp.id;
      WHEN 4 THEN -- Man + Material + Method
        UPDATE complaints SET root_cause_ids = ARRAY[rc_ids[1], rc_ids[3], rc_ids[4]]
        WHERE id = comp.id;
    END CASE;
  END LOOP;
END $$;
