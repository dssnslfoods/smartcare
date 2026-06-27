import { Navigate, useLocation } from "react-router-dom";
import { useAuth, Resource, AppRole } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
  resource?: Resource;
  roles?: AppRole[];
}

const FALLBACK_ROUTES: { resource: Resource; path: string }[] = [
  { resource: "complaint_list", path: "/complaints" },
  { resource: "complaint_form", path: "/complaints/new" },
  { resource: "dashboard", path: "/" },
  { resource: "master_data", path: "/master-data" },
  { resource: "user_management", path: "/users" },
  { resource: "role_permissions", path: "/permissions" },
];

export default function ProtectedRoute({ children, resource, roles }: Props) {
  const { session, role, hasPermission, loading, mustChangePassword } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Force password change before accessing anything else
  if (mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  if (roles && (!role || !roles.includes(role))) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-foreground">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="text-muted-foreground">เฉพาะ Supervisor และ Admin เท่านั้น</p>
        </div>
      </div>
    );
  }

  if (resource && !hasPermission(resource)) {
    const fallback = FALLBACK_ROUTES.find(r => r.resource !== resource && hasPermission(r.resource));
    if (fallback) {
      return <Navigate to={fallback.path} replace />;
    }
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-foreground">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="text-muted-foreground">กรุณาติดต่อผู้ดูแลระบบ</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
