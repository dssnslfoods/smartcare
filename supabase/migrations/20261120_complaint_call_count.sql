-- ============================================================
-- Call Count — Phase 1 (Business Requirement 18/11/2026)
-- 1 complaint (เลขที่เอกสาร) = 1 Case; call_count = จำนวนครั้งที่แจ้งปัญหาภายใต้ Case นั้น
-- ============================================================

-- 1) Columns
ALTER TABLE complaints
  ADD COLUMN IF NOT EXISTS call_count integer NOT NULL DEFAULT 1;

ALTER TABLE complaints DROP CONSTRAINT IF EXISTS complaints_call_count_positive;
ALTER TABLE complaints
  ADD CONSTRAINT complaints_call_count_positive CHECK (call_count >= 1);

-- Who/when last confirmed the call count. Added WITHOUT a default first so the
-- existing (legacy) rows stay NULL = "ยังไม่ได้ตรวจ" and QA can track backfill progress.
ALTER TABLE complaints
  ADD COLUMN IF NOT EXISTS call_count_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS call_count_reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- New complaints: the recorder enters the call count, so it counts as reviewed.
ALTER TABLE complaints ALTER COLUMN call_count_reviewed_at SET DEFAULT now();
ALTER TABLE complaints ALTER COLUMN call_count_reviewed_by SET DEFAULT auth.uid();

CREATE INDEX IF NOT EXISTS complaints_call_count_unreviewed_idx
  ON complaints (complaint_date DESC) WHERE call_count_reviewed_at IS NULL;

-- 2) Permission resource for the backfill page (also governs editing call_count after save)
INSERT INTO role_permissions (role, resource, can_access) VALUES
  ('admin', 'call_count_adjust', true),
  ('supervisor', 'call_count_adjust', true),
  ('executive', 'call_count_adjust', false),
  ('staff', 'call_count_adjust', false)
ON CONFLICT (role, resource) DO NOTHING;

-- 3) Guard: only admin or roles granted 'call_count_adjust' may change call_count
--    (or its review stamp) on an existing complaint. complaints RLS is wide open,
--    so this is enforced here rather than only in the UI.
CREATE OR REPLACE FUNCTION public.can_adjust_call_count()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    LEFT JOIN role_permissions rp
      ON rp.role = ur.role::text AND rp.resource = 'call_count_adjust'
    WHERE ur.user_id = auth.uid()
      AND ur.is_active
      AND (ur.role::text = 'admin' OR rp.can_access)
  );
$$;

CREATE OR REPLACE FUNCTION public.complaints_guard_call_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.call_count IS DISTINCT FROM OLD.call_count
     OR NEW.call_count_reviewed_at IS DISTINCT FROM OLD.call_count_reviewed_at
     OR NEW.call_count_reviewed_by IS DISTINCT FROM OLD.call_count_reviewed_by THEN
    -- Allowed: service_role / direct DB sessions (scripts, SQL editor), or permitted users.
    IF NOT (auth.role() = 'service_role'
            OR session_user <> 'authenticator'
            OR public.can_adjust_call_count()) THEN
      RAISE EXCEPTION 'ไม่มีสิทธิ์แก้ไขจำนวน Call (เฉพาะหัวหน้างาน/ผู้ดูแลระบบ)'
        USING ERRCODE = '42501';
    END IF;
    -- Any change to the count is a review; stamp it server-side.
    IF NEW.call_count IS DISTINCT FROM OLD.call_count THEN
      NEW.call_count_reviewed_at := now();
      NEW.call_count_reviewed_by := auth.uid();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS complaints_guard_call_count ON complaints;
CREATE TRIGGER complaints_guard_call_count
  BEFORE UPDATE ON complaints
  FOR EACH ROW EXECUTE FUNCTION public.complaints_guard_call_count();
