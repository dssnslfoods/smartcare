import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type AppRole = "admin" | "supervisor" | "executive" | "staff";

export type Resource =
  | "dashboard"
  | "complaint_list"
  | "complaint_form"
  | "close_case_adjust"
  | "master_data"
  | "user_management"
  | "role_permissions";

export interface UserProfile {
  company_id: string | null;
  branch_id: string | null;
  full_name: string | null;
  department: string | null;
}

interface RolePermission {
  resource: Resource;
  can_access: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  userProfile: UserProfile | null;
  permissions: RolePermission[];
  loading: boolean;
  hasPermission: (resource: Resource) => boolean;
  refreshPermissions: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchRoleAndProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role, company_id, branch_id, full_name, department, is_active")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) {
        console.warn("Failed to fetch role:", error.message);
        setRole(null);
        setUserProfile(null);
        return null;
      }
      const fetchedRole = (data?.role as AppRole) || null;
      
      if (data && data.is_active === false) {
        toast.error("บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ");
        await supabase.auth.signOut();
        return null;
      }

      setRole(fetchedRole);
      setUserProfile(data ? {
        company_id: data.company_id,
        branch_id: data.branch_id,
        full_name: data.full_name,
        department: data.department,
      } : null);
      return fetchedRole;
    } catch (err) {
      console.warn("fetchRoleAndProfile error:", err);
      setRole(null);
      setUserProfile(null);
      return null;
    }
  }

  async function fetchPermissions(currentRole: AppRole) {
    try {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("resource, can_access")
        .eq("role", currentRole);
      if (error) {
        console.warn("Failed to fetch permissions:", error.message);
        setPermissions([]);
        return;
      }
      setPermissions((data || []) as RolePermission[]);
    } catch (err) {
      console.warn("fetchPermissions error:", err);
      setPermissions([]);
    }
  }

  async function initUser(userId: string) {
    const fetchedRole = await fetchRoleAndProfile(userId);
    if (fetchedRole) {
      await fetchPermissions(fetchedRole);
    }
  }

  const refreshPermissions = useCallback(async () => {
    if (role) {
      await fetchPermissions(role);
    }
  }, [role]);

  const hasPermission = useCallback((resource: Resource): boolean => {
    if (role === "admin") return true;
    return permissions.some(p => p.resource === resource && p.can_access);
  }, [role, permissions]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          initUser(session.user.id).finally(() => setLoading(false));
        } else {
          setRole(null);
          setUserProfile(null);
          setPermissions([]);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await initUser(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setRole(null);
    setUserProfile(null);
    setPermissions([]);
  }

  return (
    <AuthContext.Provider value={{
      session, user, role, userProfile, permissions, loading,
      hasPermission, refreshPermissions, signIn, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
