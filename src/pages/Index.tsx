import { useState } from "react";
import { Link } from "react-router-dom";
import { Database, Loader2, ClipboardList } from "lucide-react";
import { useComplaintsData, useFilterOptions } from "@/hooks/useComplaintsData";
import FilterBar from "@/components/dashboard/FilterBar";
import OverviewTab from "@/components/dashboard/OverviewTab";
import TrendsTab from "@/components/dashboard/TrendsTab";
import ProblemsTab from "@/components/dashboard/ProblemsTab";
import GroupsTab from "@/components/dashboard/GroupsTab";
import PerformanceTab from "@/components/dashboard/PerformanceTab";
import DeepAnalysisTab from "@/components/dashboard/DeepAnalysisTab";

const TABS = [
  { id: "overview", label: "ภาพรวม" },
  { id: "trends", label: "แนวโน้มรายเดือน" },
  { id: "problems", label: "วิเคราะห์ประเภทปัญหา" },
  { id: "groups", label: "วิเคราะห์กลุ่มสินค้า" },
  { id: "performance", label: "ประสิทธิภาพการตอบกลับ" },
  { id: "deep", label: "วิเคราะห์เชิงลึก" },
];

export default function Index() {
  const [activeTab, setActiveTab] = useState("overview");
  const [companyId, setCompanyId] = useState("ALL");
  const [branchId, setBranchId] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [category, setCategory] = useState("ALL");

  const { options, loading: optionsLoading } = useFilterOptions();
  const { data, loading, count } = useComplaintsData(companyId, branchId, status, category);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border" style={{ background: "linear-gradient(135deg, hsl(217,33%,17%) 0%, hsl(222,47%,11%) 100%)" }}>
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-wide">
              Complaint Analysis Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {data.company} - {data.branch} | {count} รายการ
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/complaints/new" className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary transition-colors">
              <ClipboardList className="h-3.5 w-3.5" />
              บันทึก Complaint
            </Link>
            <Link to="/master-data" className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground transition-colors">
              <Database className="h-3.5 w-3.5" />
              Master Data
            </Link>
            <span className="px-3.5 py-1 rounded-full text-xs font-medium" style={{ background: "rgba(34,211,238,0.12)", color: "#22d3ee" }}>
              LIVE DATA
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-6">
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
          onCompanyChange={(v) => { setCompanyId(v); setBranchId("ALL"); }}
          onBranchChange={setBranchId}
          onStatusChange={setStatus}
          onCategoryChange={setCategory}
        />

        {/* Navigation Tabs */}
        <div className="flex gap-1.5 mb-7 bg-card p-1.5 rounded-xl overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`nav-pill ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">กำลังโหลดข้อมูล...</span>
          </div>
        ) : count === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">ไม่พบข้อมูล Complaint</p>
            <p className="text-muted-foreground text-sm mt-2">
              กรุณา Import ข้อมูลผ่านหน้า{" "}
              <Link to="/master-data" className="text-primary underline">Master Data</Link>
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
          </>
        )}
      </div>
    </div>
  );
}
