-- Role-based permission table
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL,
  resource TEXT NOT NULL,
  can_access BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role, resource)
);

-- Enable RLS
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read (needed to check own permissions)
CREATE POLICY "allow_read_role_permissions"
  ON role_permissions FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admin can modify
CREATE POLICY "allow_admin_insert_role_permissions"
  ON role_permissions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "allow_admin_update_role_permissions"
  ON role_permissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "allow_admin_delete_role_permissions"
  ON role_permissions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- Seed default permissions
INSERT INTO role_permissions (role, resource, can_access) VALUES
  -- admin: full access
  ('admin', 'dashboard', true),
  ('admin', 'complaint_list', true),
  ('admin', 'complaint_form', true),
  ('admin', 'master_data', true),
  ('admin', 'user_management', true),
  ('admin', 'role_permissions', true),
  -- supervisor
  ('supervisor', 'dashboard', true),
  ('supervisor', 'complaint_list', true),
  ('supervisor', 'complaint_form', true),
  ('supervisor', 'master_data', false),
  ('supervisor', 'user_management', false),
  ('supervisor', 'role_permissions', false),
  -- executive
  ('executive', 'dashboard', true),
  ('executive', 'complaint_list', true),
  ('executive', 'complaint_form', false),
  ('executive', 'master_data', false),
  ('executive', 'user_management', false),
  ('executive', 'role_permissions', false),
  -- staff
  ('staff', 'dashboard', true),
  ('staff', 'complaint_list', true),
  ('staff', 'complaint_form', true),
  ('staff', 'master_data', false),
  ('staff', 'user_management', false),
  ('staff', 'role_permissions', false)
ON CONFLICT (role, resource) DO NOTHING;
