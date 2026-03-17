import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { AlertTriangle, CheckCircle2, Search } from "lucide-react";
import type { CompanyData } from "@/data/mockData";
import TTSButton from "./TTSButton";
import { useTTS } from "@/hooks/useTTS";

const COLORS = ["#ef4444", "#f59e0b", "#0ea5e9", "#8b5cf6", "#22c55e", "#06b6d4", "#f97316", "#ec4899"];
const PALETTE = ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899", "#14b8a6", "#a855f7", "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

interface Props { data: CompanyData }

const tooltipStyle = { background: "#1e293b", border: "1px solid #334155", borderRadius: 8 };

function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.05) return null;
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export default function ProblemsTab({ data }: Props) {
  const { status: ttsStatus, supported, speak, pause, cancel } = useTTS();

  const problemData = Object.entries(data.problem_type).map(([name, value]) => ({ name, value }));
  const totalProblems = problemData.reduce((s, d) => s + d.value, 0);
  const closeRateData = Object.entries(data.close_rate_by_type).map(([name, v]) => ({
    name, rate: v.rate, total: v.total,
    fill: v.rate >= 70 ? "#22c55e" : v.rate >= 40 ? "#fbbf24" : "#ef4444"
  }));
  const subProblemData = Object.entries(data.sub_problem).map(([name, value]) => ({
    name: name.length > 30 ? name.substring(0, 30) + "..." : name, value
  }));

  const sortedClose = [...closeRateData].sort((a, b) => a.rate - b.rate);
  const worstClose = sortedClose[0];
  const bestClose  = sortedClose[sortedClose.length - 1];
  const top3Sub    = subProblemData.slice(0, 3);

  const buildScript = () => {
    const top3ProbText = problemData.slice(0, 3).map((d, i) =>
      `อันดับ ${i + 1} ${d.name} ${d.value.toLocaleString()} เคส คิดเป็น ${Math.round((d.value / totalProblems) * 100)} เปอร์เซ็นต์`
    ).join(" ");
    const closeText = worstClose
      ? `ประเภทปัญหาที่ปิดเคสได้น้อยที่สุดคือ ${worstClose.name} อัตรา ${worstClose.rate} เปอร์เซ็นต์` : "";
    const bestCloseText = bestClose && bestClose !== worstClose
      ? ` ส่วนที่ดีที่สุดคือ ${bestClose.name} อัตรา ${bestClose.rate} เปอร์เซ็นต์` : "";
    const subText = top3Sub.map((d, i) =>
      `อันดับ ${i + 1} ${d.name} ${d.value.toLocaleString()} เคส`).join(" ");
    return [
      "สรุปประเภทปัญหา Executive Summary",
      `มีประเภทปัญหาทั้งหมด ${problemData.length} ประเภท รวม ${totalProblems.toLocaleString()} เคส`,
      top3ProbText,
      `ด้านอัตราการปิดเคส: ${closeText}${bestCloseText}`,
      `ปัญหาย่อยที่พบมากสุด 3 อันดับแรก: ${subText}`,
      `ข้อแนะนำ: เร่งแก้ไขประเภทปัญหาที่มีอัตราปิดต่ำ และให้ความสำคัญกับการแก้ไขรากเหง้าของปัญหาย่อยอันดับหนึ่ง`,
    ].join(" ... ");
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Problem type summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {problemData.slice(0, 5).map((d, i) => (
          <div key={d.name} className="kpi-card py-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold text-white" style={{ background: COLORS[i] }}>
                {i + 1}
              </span>
              <span className="text-[11px] text-muted-foreground truncate">{d.name}</span>
            </div>
            <div className="text-xl font-bold text-foreground">{d.value.toLocaleString()}</div>
            <div className="text-[10px] text-muted-foreground">{Math.round((d.value / totalProblems) * 100)}% ของทั้งหมด</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="chart-card">
          <div className="chart-title">
            <span className="chart-icon" style={{ background: "rgba(239,68,68,0.15)" }}>
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            </span>
            ประเภทปัญหาหลัก
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={problemData} cx="50%" cy="50%"
                innerRadius={60} outerRadius={105}
                dataKey="value"
                label={renderCustomLabel}
                labelLine={false}
                strokeWidth={2}
                stroke="hsl(220 20% 7%)"
              >
                {problemData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title">
            <span className="chart-icon" style={{ background: "rgba(34,197,94,0.15)" }}>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </span>
            อัตราปิดเคสตามประเภทปัญหา
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={closeRateData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,19%,27%)" />
              <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" tickFormatter={(v: number) => `${v}%`} />
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
        <div className="flex items-center justify-between mb-4">
          <div className="chart-title !mb-0">
            <span className="chart-icon" style={{ background: "rgba(251,191,36,0.15)" }}>
              <Search className="w-3.5 h-3.5 text-amber-400" />
            </span>
            Top 15 ประเภทปัญหาย่อย
          </div>
          <TTSButton status={ttsStatus} supported={supported}
            onPlay={() => speak(buildScript())} onPause={pause} onCancel={cancel} />
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
