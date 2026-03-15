import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart, XAxis, YAxis, CartesianGrid
} from "recharts";
import { AlertCircle, TrendingUp, Target, Lightbulb } from "lucide-react";
import type { CompanyData } from "@/data/mockData";
import KpiCards from "./KpiCards";

const STATUS_COLORS: Record<string, string> = {
  "ปิดผู้ผลิต": "#22c55e",
  "ไม่ปิดผู้ผลิต": "#ef4444",
  "ปิดเป็น RD": "#fbbf24",
  "คาดปิดผู้ผลิต": "#0ea5e9",
  "อยู่ระหว่างดำเนินการ": "#8b5cf6",
};
const STATUS_FALLBACK = ["#22c55e", "#ef4444", "#fbbf24", "#0ea5e9", "#8b5cf6"];
const PALETTE = ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"];

const tooltipStyle = { background: "#1e293b", border: "1px solid #334155", borderRadius: 8 };

interface Props { data: CompanyData }

function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.05) return null;
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export default function OverviewTab({ data }: Props) {
  const statusData = Object.entries(data.status).map(([name, value]) => ({ name, value }));
  const categoryData = Object.entries(data.category).map(([name, value]) => ({ name, value }));
  const trendData = data.monthly_trend.map(m => ({
    name: m.month.split("_")[1]?.substring(0, 3) + " " + m.year,
    calls: m.calls,
  }));

  const categoryGroups: Record<string, number> = {
    "Recall": 0,
    "Complaint Food Safety": data.category["Food Safety"] || 0,
    "Complaint Food Quality": data.category["Food Quality"] || 0,
    "Complaint Food Law": data.category["Food Law"] || 0,
    "Complaint Service": data.category["Food Service"] || 0,
  };

  // Dynamic insights
  const totalRecords = data.kpi.total_records || 1;
  const sortedProblems = Object.entries(data.problem_type).sort((a, b) => b[1] - a[1]);
  const sortedSubProblems = Object.entries(data.sub_problem).sort((a, b) => b[1] - a[1]);
  const sortedCloseRates = Object.entries(data.close_rate_by_type)
    .filter(([_, info]) => info.total > 5)
    .sort((a, b) => a[1].rate - b[1].rate);
  const sortedGroups = Object.entries(data.group).sort((a, b) => b[1] - a[1]);

  const top1Prob = sortedProblems[0];
  const top2Prob = sortedProblems[1];
  const top1Sub = sortedSubProblems[0];
  const worstCloseType = sortedCloseRates[0];
  const bestCloseType = sortedCloseRates[sortedCloseRates.length - 1];
  const topGroup = sortedGroups[0];

  return (
    <div className="space-y-5 animate-fade-in">
      <KpiCards data={data} categoryGroups={categoryGroups} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Status Donut */}
        <div className="chart-card">
          <div className="chart-title">
            <span className="chart-icon" style={{ background: "rgba(14,165,233,0.15)" }}>
              <Target className="w-3.5 h-3.5 text-sky-400" />
            </span>
            สถานะ Complaint
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={statusData} cx="50%" cy="50%"
                innerRadius={65} outerRadius={105}
                dataKey="value"
                label={renderCustomLabel}
                labelLine={false}
                strokeWidth={2}
                stroke="hsl(220 20% 7%)"
              >
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.name] || STATUS_FALLBACK[i % STATUS_FALLBACK.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category Donut */}
        <div className="chart-card">
          <div className="chart-title">
            <span className="chart-icon" style={{ background: "rgba(245,158,11,0.15)" }}>
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            </span>
            หมวดหมู่ปัญหา
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={categoryData} cx="50%" cy="50%"
                innerRadius={65} outerRadius={105}
                dataKey="value"
                label={renderCustomLabel}
                labelLine={false}
                strokeWidth={2}
                stroke="hsl(220 20% 7%)"
              >
                {categoryData.map((_, i) => <Cell key={i} fill={PALETTE[i]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trend Area Chart */}
      <div className="chart-card">
        <div className="chart-title">
          <span className="chart-icon" style={{ background: "rgba(139,92,246,0.15)" }}>
            <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
          </span>
          แนวโน้มจำนวน Complaint รายเดือน
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,19%,27%)" />
            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="calls" stroke="#0ea5e9" fill="url(#trendGradient)" strokeWidth={2.5} dot={{ r: 3, fill: "#0ea5e9" }} activeDot={{ r: 5, stroke: "#0ea5e9", strokeWidth: 2, fill: "#fff" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Executive Summary */}
      <div className="chart-card">
        <div className="chart-title">
          <span className="chart-icon" style={{ background: "rgba(239,68,68,0.15)" }}>
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          </span>
          สรุปข้อค้นพบสำคัญ (Executive Summary)
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Insight 1: Top Problems */}
          <div className="insight-box">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-lg bg-red-500/15 flex items-center justify-center text-[10px] font-bold text-red-400">1</span>
              <h4 className="!mb-0">ปัญหาหลักที่ต้องเร่งแก้ไข</h4>
            </div>
            <p>
              {top1Prob
                ? <>
                    <strong className="text-foreground">{top1Prob[0]}</strong> ({top1Prob[1]} รายการ, {Math.round((top1Prob[1] / totalRecords) * 100)}%)
                    {top2Prob && <> และ <strong className="text-foreground">{top2Prob[0]}</strong> ({top2Prob[1]} รายการ)</>}
                    {top1Sub && <> โดยเฉพาะ &quot;{top1Sub[0]}&quot; ({top1Sub[1]} ครั้ง)</>}
                  </>
                : "ยังไม่มีข้อมูลเพียงพอ"
              }
            </p>
          </div>

          {/* Insight 2: Performance */}
          <div className="insight-box">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/15 flex items-center justify-center text-[10px] font-bold text-amber-400">2</span>
              <h4 className="!mb-0">การจัดการเคสและประสิทธิภาพ</h4>
            </div>
            <p>
              {worstCloseType
                ? <>
                    กลุ่ม &quot;{worstCloseType[0]}&quot; ปิดเคสได้เพียง <span className="text-red-400 font-semibold">{worstCloseType[1].rate}%</span>
                    {" "}ต่ำกว่าเฉลี่ย ({data.kpi.close_rate}%)
                    {bestCloseType && bestCloseType !== worstCloseType && (
                      <> ส่วน &quot;{bestCloseType[0]}&quot; สูงสุด <span className="text-emerald-400 font-semibold">{bestCloseType[1].rate}%</span></>
                    )}
                  </>
                : <>อัตราปิดเคสรวม {data.kpi.close_rate}% ใช้เวลาเฉลี่ย {data.kpi.avg_response_days} วัน</>
              }
            </p>
          </div>

          {/* Insight 3: Product Groups */}
          <div className="insight-box">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-lg bg-sky-500/15 flex items-center justify-center text-[10px] font-bold text-sky-400">3</span>
              <h4 className="!mb-0">จุดเสี่ยงตามกลุ่มผลิตภัณฑ์</h4>
            </div>
            <p>
              {topGroup
                ? <>
                    <strong className="text-foreground">{topGroup[0]}</strong> พบ {topGroup[1]} รายการ ({Math.round((topGroup[1] / totalRecords) * 100)}%) ควรปรับปรุงมาตรฐานคุณภาพ
                  </>
                : "ไม่พบความผิดปกติที่กระจุกตัว"
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
