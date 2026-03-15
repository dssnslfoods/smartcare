import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
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
import Footer from "@/components/Footer";

const TABS = [
  { id: "overview", label: "ภาพรวม" },
  { id: "trends", label: "แนวโน้มรายเดือน" },
  { id: "problems", label: "ประเภทปัญหา" },
  { id: "groups", label: "กลุ่มสินค้า" },
  { id: "performance", label: "ประสิทธิภาพ" },
  { id: "deep", label: "เชิงลึก" },
  { id: "map", label: "แผนที่ CDC" },
];

export default function Index() {
  const [activeTab, setActiveTab] = useState("overview");
  const [companyId, setCompanyId] = useState("ALL");
  const [branchId, setBranchId] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { options, loading: optionsLoading } = useFilterOptions();
  const { data, loading, count } = useComplaintsData(companyId, branchId, status, category, dateFrom, dateTo);

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />

      <div className="max-w-[1440px] mx-auto px-6 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Complaint Analysis
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data.company} · {data.branch} · <span className="text-primary font-semibold">{count}</span> รายการ
          </p>
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
        />

        {/* Navigation Tabs */}
        <div className="flex gap-1 mb-6 glass rounded-2xl p-1.5 overflow-x-auto">
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
