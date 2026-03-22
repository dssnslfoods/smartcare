-- ============================================================
-- Mock up multi root_cause_ids for testing
-- Distribution target:
--   ~10% of complaints → 2 root causes
--   ~8%  of complaints → 3 root causes
--   rest              → 1 root cause
-- ============================================================

DO $$
DECLARE
  rc_ids    text[];
  rc_len    int;
  total_rows int;
  cnt_two   int;
  cnt_three int;
  r1 text; r2 text; r3 text;
  comp record;
  counter int;
BEGIN
  -- Load all root cause IDs
  SELECT array_agg(id::text ORDER BY sort_order) INTO rc_ids FROM root_causes;
  rc_len := coalesce(array_length(rc_ids, 1), 0);

  IF rc_len < 3 THEN
    RAISE EXCEPTION 'Need at least 3 root causes. Found: %', rc_len;
  END IF;

  SELECT COUNT(*) INTO total_rows FROM complaints;
  cnt_two   := GREATEST(1, ROUND(total_rows * 0.10)::int);
  cnt_three := GREATEST(1, ROUND(total_rows * 0.08)::int);

  RAISE NOTICE 'Total: %, 2-cause: %, 3-cause: %', total_rows, cnt_two, cnt_three;

  -- ── Step 1: Reset all to single cause ──────────────────────
  UPDATE complaints
  SET root_cause_ids = CASE
    WHEN root_cause_id IS NOT NULL THEN ARRAY[root_cause_id::text]
    ELSE '{}'::text[]
  END;

  -- ── Step 2: Assign 2 root causes to 10% (random rows) ──────
  counter := 0;
  FOR comp IN
    SELECT id, root_cause_id::text AS rc1
    FROM complaints
    WHERE root_cause_id IS NOT NULL
    ORDER BY random()
    LIMIT cnt_two
  LOOP
    -- Pick a 2nd cause ≠ rc1
    SELECT x INTO r2
    FROM unnest(rc_ids) AS x
    WHERE x <> comp.rc1
    ORDER BY random()
    LIMIT 1;

    UPDATE complaints
    SET root_cause_ids = ARRAY[comp.rc1, r2]
    WHERE id = comp.id;

    counter := counter + 1;
  END LOOP;
  RAISE NOTICE 'Done: 2-cause = %', counter;

  -- ── Step 3: Assign 3 root causes to 8% (from remaining 1-cause rows) ──
  counter := 0;
  FOR comp IN
    SELECT id, root_cause_id::text AS rc1
    FROM complaints
    WHERE root_cause_id IS NOT NULL
      AND cardinality(root_cause_ids) = 1   -- not yet multi
    ORDER BY random()
    LIMIT cnt_three
  LOOP
    -- Pick 2nd and 3rd causes, both ≠ rc1 and ≠ each other
    SELECT x INTO r2
    FROM unnest(rc_ids) AS x
    WHERE x <> comp.rc1
    ORDER BY random() LIMIT 1;

    SELECT x INTO r3
    FROM unnest(rc_ids) AS x
    WHERE x <> comp.rc1 AND x <> r2
    ORDER BY random() LIMIT 1;

    UPDATE complaints
    SET root_cause_ids = ARRAY[comp.rc1, r2, r3]
    WHERE id = comp.id;

    counter := counter + 1;
  END LOOP;
  RAISE NOTICE 'Done: 3-cause = %', counter;

  -- Sync root_cause_id = first element of array
  UPDATE complaints
  SET root_cause_id = root_cause_ids[1]::uuid
  WHERE cardinality(root_cause_ids) > 0;

END $$;

-- ── Check distribution ──────────────────────────────────────
SELECT
  cardinality(root_cause_ids)                                   AS num_causes,
  COUNT(*)                                                      AS complaints,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) || '%'   AS pct
FROM complaints
GROUP BY 1
ORDER BY 1;
