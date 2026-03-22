-- Add closed_case_month and closed_case_year columns to complaints
ALTER TABLE complaints
  ADD COLUMN IF NOT EXISTS closed_case_month integer,
  ADD COLUMN IF NOT EXISTS closed_case_year  integer;

-- Backfill existing records from complaint_date
UPDATE complaints
SET
  closed_case_month = EXTRACT(MONTH FROM complaint_date::date),
  closed_case_year  = EXTRACT(YEAR  FROM complaint_date::date)
WHERE complaint_date IS NOT NULL
  AND (closed_case_month IS NULL OR closed_case_year IS NULL);
