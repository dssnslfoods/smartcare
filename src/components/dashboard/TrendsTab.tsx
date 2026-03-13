import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
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
  const yearCompare = MONTH_LABELS.map((m, i) => {
    const idx = String(i + 1).padStart(2, "0");
    const d2025 = data.monthly_trend.find(x => x.year === 2025 && x.month.startsWith(idx));
    const d2026 = data.monthly_trend.find(x => x.year === 2026 && x.month.startsWith(idx));
    return { name: m, "2025": d2025?.calls ?? null, "2026": d2026?.calls ?? null };
  });

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

  const tooltipStyle = { background: "#1e293b", border: "1px solid #334155", borderRadius: 8 };

  return (
    <div className="space-y-5">
      <div className="chart-card">
        <div className="chart-title">
          <span className="chart-icon" style={{ background: "rgba(14,165,233,0.2)" }}>📈</span>
          แนวโน้ม Complaint รายเดือน (เปรียบเทียบปี)
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={yearCompare}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,19%,27%)" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Bar dataKey="2025" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            <Bar dataKey="2026" fill="#f59e0b" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stacked Column by Category */}
      <div className="chart-card">
        <div className="chart-title">
          <span className="chart-icon" style={{ background: "rgba(168,85,247,0.2)" }}>📊</span>
          แนวโน้ม Complaint รายเดือน ตามหมวดหมู่ (Stacked)
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={categoryStackData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,19%,27%)" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
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
          <span className="chart-icon" style={{ background: "rgba(34,197,94,0.2)" }}>📊</span>
          สถานะการปิดเคสรายเดือน
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={statusChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,19%,27%)" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Bar dataKey="ปิดผู้ผลิต" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="ไม่ปิดผู้ผลิต" stackId="a" fill="#ef4444" />
            <Bar dataKey="ปิดเป็น RD" stackId="a" fill="#fbbf24" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
