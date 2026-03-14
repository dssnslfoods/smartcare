import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from "recharts";
import type { CompanyData } from "@/data/mockData";

const DIST_COLORS = ["#22c55e", "#4ade80", "#fbbf24", "#f59e0b", "#f97316", "#ef4444", "#dc2626"];

interface Props { data: CompanyData }

export default function PerformanceTab({ data }: Props) {
  const distData = Object.entries(data.response_distribution).map(([name, value]) => ({ name, value }));
  const catData = Object.entries(data.response_by_category).map(([name, v]) => ({
    name, avg: v.avg, median: v.median
  }));

  const tooltipStyle = { background: "#1e293b", border: "1px solid #334155", borderRadius: 8 };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="chart-card">
        <div className="chart-title">
          <span className="chart-icon" style={{ background: "rgba(251,191,36,0.2)" }}>⏱️</span>
          ระยะเวลาในการตอบ Complaint
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={distData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,19%,27%)" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {distData.map((_, i) => <Cell key={i} fill={DIST_COLORS[i]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <div className="chart-title">
          <span className="chart-icon" style={{ background: "rgba(74,222,128,0.2)" }}>📊</span>
          เวลาตอบกลับเฉลี่ยตามหมวดหมู่
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={catData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,19%,27%)" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Bar dataKey="avg" name="เฉลี่ย (วัน)" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            <Bar dataKey="median" name="มัธยฐาน (วัน)" fill="#22c55e" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
