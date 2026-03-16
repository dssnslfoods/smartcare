import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from "recharts";
import { Microscope, BarChart3, AlertTriangle, ShieldAlert, Lightbulb } from "lucide-react";
import type { CompanyData } from "@/data/mockData";

interface Props { data: CompanyData }

const tooltipStyle = { background: "#1e293b", border: "1px solid #334155", borderRadius: 8 };

export default function DeepAnalysisTab({ data }: Props) {
  const spEntries = Object.entries(data.sub_problem);
  const total = spEntries.reduce((s, [, v]) => s + v, 0);
  let cumul = 0;
  const paretoData = spEntries.map(([name, value]) => {
    cumul += value;
    return {
      name: name.length > 25 ? name.substring(0, 25) + "..." : name,
      count: value,
      cumPct: Math.round((cumul / total) * 100),
    };
  });

  // Dynamic Pareto insight
  const top3 = spEntries.slice(0, 3);
  const top3Total = top3.reduce((s, [, v]) => s + v, 0);
  const top3Pct = total > 0 ? Math.round((top3Total / total) * 100) : 0;

  // Find 80% line
  let count80 = 0;
  let items80 = 0;
  for (const [, v] of spEntries) {
    count80 += v;
    items80++;
    if (count80 / total >= 0.8) break;
  }

  // Dynamic close rate insights
  const closeRates = Object.entries(data.close_rate_by_type)
    .filter(([_, info]) => info.total > 5)
    .sort((a, b) => a[1].rate - b[1].rate);
  const worstClose = closeRates[0];
  const bestClose = closeRates[closeRates.length - 1];

  // Problem type ranking
  const sortedProblems = Object.entries(data.problem_type).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Dynamic Analysis Summary */}
      <div className="chart-card">
        <div className="chart-title">
          <span className="chart-icon" style={{ background: "rgba(244,63,94,0.15)" }}>
            <Microscope className="w-3.5 h-3.5 text-rose-400" />
          </span>
          การวิเคราะห์เชิงลึก
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="insight-box">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <h4 className="!mb-0">Pareto Analysis (80/20)</h4>
            </div>
            <p>
              เพียง <strong className="text-foreground">{items80}</strong> จาก {spEntries.length} ประเภทย่อย ครอบคลุม 80% ของ Complaint ทั้งหมด
              {top3.length >= 3 && (
                <> Top 3: <strong className="text-foreground">{top3[0][0]}</strong> ({top3[0][1].toLocaleString()}), <strong className="text-foreground">{top3[1][0]}</strong> ({top3[1][1].toLocaleString()}), <strong className="text-foreground">{top3[2][0]}</strong> ({top3[2][1].toLocaleString()}) รวม {top3Pct}%</>
              )}
            </p>
          </div>

          <div className="insight-box">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <h4 className="!mb-0">Risk Assessment</h4>
            </div>
            <p>
              {sortedProblems.slice(0, 3).map((p, i) => {
                const closeInfo = data.close_rate_by_type[p[0]];
                const rate = closeInfo?.rate || 0;
                const color = rate < 30 ? "text-red-400" : rate < 60 ? "text-amber-400" : "text-emerald-400";
                const risk = rate < 30 ? "สูง" : rate < 60 ? "กลาง" : "ต่ำ";
                return (
                  <span key={p[0]}>
                    <span className={`${color} font-semibold`}>ความเสี่ยง{risk}:</span> {p[0]} ({p[1].toLocaleString()} เคส, ปิด {rate}%)
                    {i < 2 && <br />}
                  </span>
                );
              })}
            </p>
          </div>

          <div className="insight-box">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h4 className="!mb-0">Performance Gaps</h4>
            </div>
            <p>
              {worstClose && (
                <>หมวด <strong className="text-red-400">{worstClose[0]}</strong> ปิดเคสได้ต่ำสุดเพียง {worstClose[1].rate}% ({worstClose[1].closed.toLocaleString()}/{worstClose[1].total.toLocaleString()} เคส)</>
              )}
              {bestClose && worstClose && bestClose !== worstClose && (
                <><br />ส่วน <strong className="text-emerald-400">{bestClose[0]}</strong> มีประสิทธิภาพสูงสุด {bestClose[1].rate}%</>
              )}
              <br />ระยะเวลาเฉลี่ย {data.kpi.avg_response_days} วัน (Median: {data.kpi.median_response_days})
            </p>
          </div>

          <div className="insight-box">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <h4 className="!mb-0">ข้อเสนอแนะ</h4>
            </div>
            <p>
              1. <strong>เร่งด่วน:</strong> เพิ่มประสิทธิภาพปิดเคสในหมวดที่มีอัตราต่ำ<br />
              2. <strong>ระยะสั้น:</strong> แก้ไข Top 3 ปัญหาย่อยเพื่อลด Complaint {top3Pct}%<br />
              3. <strong>ระยะกลาง:</strong> ปรับปรุง QC ในกลุ่มที่มี Complaint สูง<br />
              4. <strong>ระยะยาว:</strong> สร้างระบบ Early Warning ติดตาม real-time
            </p>
          </div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title">
          <span className="chart-icon" style={{ background: "rgba(139,92,246,0.15)" }}>
            <BarChart3 className="w-3.5 h-3.5 text-violet-400" />
          </span>
          Pareto Chart - สาเหตุหลักของ Complaint
        </div>
        <ResponsiveContainer width="100%" height={450}>
          <ComposedChart data={paretoData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,19%,27%)" />
            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={80} />
            <YAxis yAxisId="left" stroke="#94a3b8" />
            <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend iconType="circle" iconSize={8} />
            <ReferenceLine yAxisId="right" y={80} stroke="#ef4444" strokeDasharray="5 5" label={{ value: "80%", fill: "#ef4444", fontSize: 10, position: "right" }} />
            <Bar yAxisId="left" dataKey="count" name="จำนวน" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            <Line yAxisId="right" dataKey="cumPct" name="สะสม %" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: "#f59e0b" }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
