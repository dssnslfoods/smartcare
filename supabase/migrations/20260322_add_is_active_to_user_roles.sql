-- Add is_active column to user_roles
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Enable RLS (if not already enabled)
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read roles (needed for AuthContext and showing users)
CREATE POLICY "allow_read_user_roles" ON user_roles FOR SELECT USING (true);

-- Allow only admins to insert/update/delete roles
CREATE POLICY "allow_admin_all_user_roles" ON user_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );
