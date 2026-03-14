import { Link, useLocation } from "react-router-dom";
import { BarChart3, List, ClipboardPlus, Database, Activity, LogOut, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: BarChart3 },
  { path: "/complaints", label: "รายการ Complaint", icon: List },
  { path: "/complaints/new", label: "บันทึกใหม่", icon: ClipboardPlus },
  { path: "/master-data", label: "Master Data", icon: Database, roles: ["admin"] as string[] },
  { path: "/users", label: "จัดการผู้ใช้", icon: Users, roles: ["admin"] as string[] },
];

const ROLE_LABELS: Record<string, string> = {
  admin: "ผู้ดูแลระบบ",
  supervisor: "หัวหน้างาน",
  executive: "ผู้บริหาร",
  staff: "เจ้าหน้าที่",
};

export default function TopNavBar() {
  const location = useLocation();
  const { user, role, signOut } = useAuth();

  const visibleItems = NAV_ITEMS.filter(item => {
    if (!item.roles) return true;
    return role && item.roles.includes(role);
  });

  return (
    <header className="glass-navbar sticky top-0 z-50">
      <div className="max-w-[1440px] mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo / Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
               style={{ background: "linear-gradient(135deg, hsl(210 100% 60%), hsl(270 80% 65%))" }}>
            <Activity className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold tracking-wide text-foreground group-hover:text-primary transition-colors">
            CMS
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {visibleItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/15 text-primary shadow-[0_0_12px_hsl(210_100%_60%/0.15)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User info & Logout */}
        <div className="flex items-center gap-3">
          {role && (
            <Badge variant="secondary" className="text-[10px] font-semibold tracking-wide uppercase">
              {ROLE_LABELS[role] || role}
            </Badge>
          )}
          <span className="text-[11px] text-muted-foreground hidden md:inline truncate max-w-[150px]">
            {user?.email}
          </span>
          <Button variant="ghost" size="sm" onClick={signOut} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
