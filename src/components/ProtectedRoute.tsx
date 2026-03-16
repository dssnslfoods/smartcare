import { Navigate } from "react-router-dom";
import { useAuth, Resource } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
  resource?: Resource;
}

export default function ProtectedRoute({ children, resource }: Props) {
  const { session, hasPermission, loading } = useAuth();

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

  if (resource && !hasPermission(resource)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-foreground">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="text-muted-foreground">คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
