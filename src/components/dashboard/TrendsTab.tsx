import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { BarChart3, GitBranch } from "lucide-react";
import type { CompanyData } from "@/data/mockData";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CAT_COLORS: Record<string, string> = {
  "Recall": "#a855f7",
  "Complaint Food Safety": "#ef4444",
  "Complaint Food Quality": "#0ea5e9",
  "Complaint Food Law": "#fbbf24",
  "Complaint Service": "#22c55e",
};

interface Props { data: CompanyData }

export default function TrendsTab({ data }: Props) {
  const monthOrder = ["01_January", "02_February", "03_March", "04_April", "05_May", "06_June",
    "07_July", "08_August", "09_September", "10_October", "11_November", "12_December"];
  const uniqueMonths = [...new Set(data.monthly_status.map(m => m.month))];
  const sortedMonths = monthOrder.filter(m => uniqueMonths.includes(m));

  const statusChart = sortedMonths.map(m => {
    const label = m.split("_")[1]?.substring(0, 3) || m;
    const closed = data.monthly_status.filter(x => x.month === m && x.status === "ปิดผู้ผลิต").reduce((s, x) => s + x.count, 0);
    const open = data.monthly_status.filter(x => x.month === m && x.status === "ไม่ปิดผู้ผลิต").reduce((s, x) => s + x.count, 0);
    const rd = data.monthly_status.filter(x => x.month === m && x.status === "ปิดเป็น RD").reduce((s, x) => s + x.count, 0);
    return { name: label, "ปิดผู้ผลิต": closed, "ไม่ปิดผู้ผลิต": open, "ปิดเป็น RD": rd };
  });

  const categoryStackData = data.monthly_category.map(d => ({
    name: d.month,
    "Recall": d.recall,
    "Complaint Food Safety": d.foodSafety,
    "Complaint Food Quality": d.foodQuality,
    "Complaint Food Law": d.foodLaw,
    "Complaint Service": d.foodService,
  }));

  // Summary stats
  const totalClosed = statusChart.reduce((s, m) => s + m["ปิดผู้ผลิต"], 0);
  const totalOpen = statusChart.reduce((s, m) => s + m["ไม่ปิดผู้ผลิต"], 0);
  const totalRd = statusChart.reduce((s, m) => s + m["ปิดเป็น RD"], 0);
  const peakMonth = categoryStackData.reduce((best, m) => {
    const total = m["Recall"] + m["Complaint Food Safety"] + m["Complaint Food Quality"] + m["Complaint Food Law"] + m["Complaint Service"];
    return total > best.total ? { name: m.name, total } : best;
  }, { name: "", total: 0 });

  const tooltipStyle = { background: "#1e293b", border: "1px solid #334155", borderRadius: 8 };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Quick summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="kpi-card text-center py-3">
          <div className="text-lg font-bold text-emerald-400">{totalClosed.toLocaleString()}</div>
          <div className="text-[11px] text-muted-foreground">ปิดผู้ผลิต</div>
        </div>
        <div className="kpi-card text-center py-3">
          <div className="text-lg font-bold text-red-400">{totalOpen.toLocaleString()}</div>
          <div className="text-[11px] text-muted-foreground">ไม่ปิดผู้ผลิต</div>
        </div>
        <div className="kpi-card text-center py-3">
          <div className="text-lg font-bold text-amber-400">{totalRd.toLocaleString()}</div>
          <div className="text-[11px] text-muted-foreground">ปิดเป็น RD</div>
        </div>
        <div className="kpi-card text-center py-3">
          <div className="text-lg font-bold text-sky-400">{peakMonth.name}</div>
          <div className="text-[11px] text-muted-foreground">เดือนที่พบมากสุด ({peakMonth.total.toLocaleString()})</div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title">
          <span className="chart-icon" style={{ background: "rgba(168,85,247,0.15)" }}>
            <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
          </span>
          แนวโน้ม Complaint รายเดือน ตามหมวดหมู่ (Stacked)
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={categoryStackData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,19%,27%)" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend iconType="circle" iconSize={8} />
            {Object.entries(CAT_COLORS).map(([key, color], i, arr) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="cat"
                fill={color}
                radius={i === arr.length - 1 ? [4, 4, 0, 0] : undefined}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <div className="chart-title">
          <span className="chart-icon" style={{ background: "rgba(34,197,94,0.15)" }}>
            <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
          </span>
          สถานะการปิดเคสรายเดือน
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={statusChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,19%,27%)" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend iconType="circle" iconSize={8} />
            <Bar dataKey="ปิดผู้ผลิต" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="ไม่ปิดผู้ผลิต" stackId="a" fill="#ef4444" />
            <Bar dataKey="ปิดเป็น RD" stackId="a" fill="#fbbf24" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
