import { Link, useLocation } from "react-router-dom";
import { BarChart3, List, ClipboardPlus, Database, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: BarChart3 },
  { path: "/complaints", label: "รายการ Complaint", icon: List },
  { path: "/complaints/new", label: "บันทึกใหม่", icon: ClipboardPlus },
  { path: "/master-data", label: "Master Data", icon: Database },
];

export default function TopNavBar() {
  const location = useLocation();

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
          {NAV_ITEMS.map(item => {
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

        {/* Status badge */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-kpi-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-kpi-green"></span>
          </span>
          <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Live</span>
        </div>
      </div>
    </header>
  );
}
