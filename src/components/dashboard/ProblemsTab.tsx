import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import type { CompanyData } from "@/data/mockData";

const COLORS = ["#ef4444", "#f59e0b", "#0ea5e9", "#8b5cf6", "#22c55e"];
const PALETTE = ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899", "#14b8a6", "#a855f7", "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

interface Props { data: CompanyData }

export default function ProblemsTab({ data }: Props) {
  const problemData = Object.entries(data.problem_type).map(([name, value]) => ({ name, value }));
  const closeRateData = Object.entries(data.close_rate_by_type).map(([name, v]) => ({
    name, rate: v.rate,
    fill: v.rate > 50 ? "#22c55e" : v.rate > 30 ? "#fbbf24" : "#ef4444"
  }));
  const subProblemData = Object.entries(data.sub_problem).map(([name, value]) => ({
    name: name.length > 30 ? name.substring(0, 30) + "..." : name, value
  }));

  const tooltipStyle = { background: "#1e293b", border: "1px solid #334155", borderRadius: 8 };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="chart-card">
          <div className="chart-title">
            <span className="chart-icon" style={{ background: "rgba(239,68,68,0.2)" }}>⚠️</span>
            ประเภทปัญหาหลัก
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={problemData} cx="50%" cy="50%" outerRadius={100}
                dataKey="value" label={({ percent }) => `${(percent * 100).toFixed(1)}%`}>
                {problemData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title">
            <span className="chart-icon" style={{ background: "rgba(34,197,94,0.2)" }}>✅</span>
            อัตราปิดเคสตามประเภทปัญหา
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={closeRateData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,19%,27%)" />
              <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" />
              <YAxis type="category" dataKey="name" width={140} stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
              <Bar dataKey="rate" radius={[0, 6, 6, 0]}>
                {closeRateData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title">
          <span className="chart-icon" style={{ background: "rgba(251,191,36,0.2)" }}>🔍</span>
          Top 15 ประเภทปัญหาย่อย
        </div>
        <ResponsiveContainer width="100%" height={500}>
          <BarChart data={subProblemData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,19%,27%)" />
            <XAxis type="number" stroke="#94a3b8" />
            <YAxis type="category" dataKey="name" width={200} stroke="#94a3b8" tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {subProblemData.map((_, i) => <Cell key={i} fill={PALETTE[i]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
