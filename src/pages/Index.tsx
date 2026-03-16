import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2, LayoutDashboard, TrendingUp, AlertTriangle, Factory, Timer, Microscope, MapPin, RefreshCw, Tv } from "lucide-react";
import { useComplaintsData, useFilterOptions } from "@/hooks/useComplaintsData";
import TopNavBar from "@/components/TopNavBar";
import FilterBar from "@/components/dashboard/FilterBar";
import OverviewTab from "@/components/dashboard/OverviewTab";
import TrendsTab from "@/components/dashboard/TrendsTab";
import ProblemsTab from "@/components/dashboard/ProblemsTab";
import GroupsTab from "@/components/dashboard/GroupsTab";
import PerformanceTab from "@/components/dashboard/PerformanceTab";
import DeepAnalysisTab from "@/components/dashboard/DeepAnalysisTab";
import MapTab from "@/components/dashboard/MapTab";
import TVMode from "@/components/dashboard/TVMode";
import { useAuth } from "@/contexts/AuthContext";
import Footer from "@/components/Footer";

const TABS = [
  { id: "overview", label: "ภาพรวม", icon: LayoutDashboard },
  { id: "trends", label: "แนวโน้ม", icon: TrendingUp },
  { id: "problems", label: "ประเภทปัญหา", icon: AlertTriangle },
  { id: "groups", label: "กลุ่มสินค้า", icon: Factory },
  { id: "performance", label: "ประสิทธิภาพ", icon: Timer },
  { id: "deep", label: "เชิงลึก", icon: Microscope },
  { id: "map", label: "วิเคราะห์ CDC เชิงพื้นที่", icon: MapPin },
];

export default function Index() {
  const { role, userProfile } = useAuth();
  const isStaff = role === "staff";

  const [activeTab, setActiveTab] = useState("overview");
  const [tvMode, setTvMode] = useState(false);
  const [companyId, setCompanyId] = useState("ALL");
  const [branchId, setBranchId] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { options, loading: optionsLoading } = useFilterOptions();

  // Auto-filter for staff
  useEffect(() => {
    if (isStaff && userProfile?.company_id) {
      setCompanyId(userProfile.company_id);
      if (userProfile.branch_id) setBranchId(userProfile.branch_id);
    }
  }, [isStaff, userProfile]);
  const { data, loading, count } = useComplaintsData(companyId, branchId, status, category, dateFrom, dateTo);

  return (
    <div className="min-h-screen bg-background">
      {/* TV Mode overlay */}
      {tvMode && !loading && count > 0 && (
        <TVMode data={data} count={count} onExit={() => setTvMode(false)} />
      )}

      <TopNavBar />

      <div className="max-w-[1440px] mx-auto px-6 py-6">
        {/* Page Header */}
        <div className="mb-5 flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Complaint Analysis
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {data.company} · {data.branch}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!loading && count > 0 && (
              <button
                onClick={() => setTvMode(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/40
                  text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary/50
                  hover:bg-primary/10 transition-all"
                title="เปิด TV Mode"
              >
                <Tv className="w-3.5 h-3.5" /> TV Mode
              </button>
            )}
            {!loading && count > 0 && (
              <>
                <span className="status-badge bg-primary/10 text-primary border border-primary/20">
                  {count.toLocaleString()} รายการ
                </span>
                <span className={`status-badge ${data.kpi.close_rate >= 70 ? "status-badge-success" : data.kpi.close_rate >= 40 ? "status-badge-warning" : "status-badge-danger"}`}>
                  ปิด {data.kpi.close_rate}%
                </span>
                <span className="status-badge status-badge-warning">
                  เฉลี่ย {data.kpi.avg_response_days} วัน
                </span>
                {data.kpi.not_closed > 0 && (
                  <span className="status-badge status-badge-danger">
                    ค้าง {data.kpi.not_closed.toLocaleString()} เคส
                  </span>
                )}
              </>
            )}
            {loading && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> กำลังโหลด
              </span>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <FilterBar
          companies={options.companies}
          branches={options.branches.filter(b => companyId === "ALL" || b.company_id === companyId)}
          statuses={options.statuses}
          categories={options.categories}
          companyId={companyId}
          branchId={branchId}
          status={status}
          category={category}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onCompanyChange={(v) => { setCompanyId(v); setBranchId("ALL"); }}
          onBranchChange={setBranchId}
          onStatusChange={setStatus}
          onCategoryChange={setCategory}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          companyDisabled={isStaff}
          branchDisabled={isStaff}
          onReset={() => {
            if (!isStaff) { setCompanyId("ALL"); setBranchId("ALL"); }
            setStatus("ALL");
            setCategory("ALL");
            setDateFrom("");
            setDateTo("");
          }}
        />

        {/* Navigation Tabs */}
        <div className="flex gap-1 mb-6 glass rounded-2xl p-1.5 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`nav-pill flex items-center gap-1.5 ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20 glass-card rounded-2xl">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">กำลังโหลดข้อมูล...</span>
          </div>
        ) : count === 0 ? (
          <div className="text-center py-20 glass-card rounded-2xl">
            <p className="text-muted-foreground text-lg">ไม่พบข้อมูล Complaint</p>
            <p className="text-muted-foreground text-sm mt-2">
              กรุณา Import ข้อมูลผ่านหน้า{" "}
              <Link to="/master-data" className="text-primary underline hover:no-underline">Master Data</Link>
            </p>
          </div>
        ) : (
          <>
            {activeTab === "overview" && <OverviewTab data={data} />}
            {activeTab === "trends" && <TrendsTab data={data} />}
            {activeTab === "problems" && <ProblemsTab data={data} />}
            {activeTab === "groups" && <GroupsTab data={data} />}
            {activeTab === "performance" && <PerformanceTab data={data} />}
            {activeTab === "deep" && <DeepAnalysisTab data={data} />}
            {activeTab === "map" && <MapTab />}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
