-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "allow_admin_all_user_roles" ON user_roles;

-- Create a helper function checking if the current user is an admin
-- using security definer to bypass RLS and avoid recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- Create specific policies for admins, using the new function
CREATE POLICY "allow_admin_insert_user_roles" ON user_roles
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "allow_admin_update_user_roles" ON user_roles
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "allow_admin_delete_user_roles" ON user_roles
  FOR DELETE
  USING (public.is_admin());
