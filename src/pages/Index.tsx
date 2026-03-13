import { useState } from "react";
import { getData } from "@/data/mockData";
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
  const [company, setCompany] = useState("nsl");
  const [branch, setBranch] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [channel, setChannel] = useState("ALL");
  const [category, setCategory] = useState("ALL");

  const data = getData(company, branch);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border" style={{ background: "linear-gradient(135deg, hsl(217,33%,17%) 0%, hsl(222,47%,11%) 100%)" }}>
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-wide">
              NSL Foods Complaint Analysis Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {data.branch} | ข้อมูลตั้งแต่ มกราคม 2025 - มีนาคม 2026
            </p>
          </div>
          <span className="px-3.5 py-1 rounded-full text-xs font-medium" style={{ background: "rgba(34,211,238,0.12)", color: "#22d3ee" }}>
            LIVE DATA
          </span>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-6">
        {/* Filter Bar */}
        <FilterBar
          company={company} branch={branch} status={status} channel={channel} category={category}
          onCompanyChange={setCompany} onBranchChange={setBranch}
          onStatusChange={setStatus} onChannelChange={setChannel} onCategoryChange={setCategory}
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

        {/* Tab Content */}
        {activeTab === "overview" && <OverviewTab data={data} />}
        {activeTab === "trends" && <TrendsTab data={data} />}
        {activeTab === "problems" && <ProblemsTab data={data} />}
        {activeTab === "groups" && <GroupsTab data={data} />}
        {activeTab === "performance" && <PerformanceTab data={data} />}
        {activeTab === "deep" && <DeepAnalysisTab data={data} />}
      </div>
    </div>
  );
}
