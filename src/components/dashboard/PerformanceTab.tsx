import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine
} from "recharts";
import { Timer, BarChart3, Target, Zap } from "lucide-react";
import type { CompanyData } from "@/data/mockData";
import TTSButton from "./TTSButton";
import { useTTS } from "@/hooks/useTTS";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function diffDays(d1: string | null, d2: string | null): number | null {
  if (!d1 || !d2) return null;
  const a = new Date(d1).getTime();
  const b = new Date(d2).getTime();
  if (isNaN(a) || isNaN(b)) return null;
  return Math.abs(b - a) / (1000 * 60 * 60 * 24);
}

function getBucket(days: number): string {
  if (days <= 1) return "0-1วัน";
  if (days <= 3) return "2-3วัน";
  if (days <= 5) return "4-5วัน";
  if (days <= 7) return "6-7วัน";
  if (days <= 14) return "8-14วัน";
  if (days <= 30) return "15-30วัน";
  return "30+วัน";
}

const DIST_COLORS = ["#22c55e", "#4ade80", "#fbbf24", "#f59e0b", "#f97316", "#ef4444", "#dc2626"];

interface Props { data: CompanyData }

const tooltipStyle = { background: "#1e293b", border: "1px solid #334155", borderRadius: 8 };
const SLA_TARGET_DAYS = 7;

export default function PerformanceTab({ data }: Props) {
  const { status: ttsStatus, supported, speak, pause, cancel } = useTTS();
  const [openBucket, setOpenBucket] = useState<string | null>(null);

  const distData = Object.entries(data.response_distribution).map(([name, value]) => ({ name, value }));
  const catData = Object.entries(data.response_by_category).map(([name, v]) => ({
    name, avg: v.avg, median: v.median, max: v.max
  }));

  const selectedComplaints = openBucket ? (data.raw_complaints || []).filter((c: any) => {
    const d = diffDays(c.complaint_date, c.resolved_at);
    if (d === null) return false;
    return getBucket(d) === openBucket;
  }) : [];

  // SLA compliance calculation
  const withinSLA = distData
    .filter(d => {
      const days = parseInt(d.name);
      return !isNaN(days) && days <= SLA_TARGET_DAYS;
    })
    .reduce((s, d) => s + d.value, 0);
  const totalDist = distData.reduce((s, d) => s + d.value, 0);
  const slaRate = totalDist > 0 ? Math.round((withinSLA / totalDist) * 100) : 0;

  // Best/worst category
  const sortedCat = [...catData].sort((a, b) => a.avg - b.avg);
  const bestCat = sortedCat[0];
  const worstCat = sortedCat[sortedCat.length - 1];

  const buildScript = () => {
    const slaStatus = slaRate >= 80 ? "meeting the target — well done" : slaRate >= 60 ? "below target and requires improvement" : "significantly below target and needs urgent attention";
    const gapDays = worstCat && bestCat ? (worstCat.avg - bestCat.avg).toFixed(1) : "0";
    const catSummary = catData.slice(0, 3).map(c =>
      `${c.name}: ${c.avg} days average`).join(", ");
    return [
      "Response Performance Executive Summary.",
      `Average response time: ${data.kpi.avg_response_days} days. Median: ${data.kpi.median_response_days} days.`,
      `SLA compliance within ${SLA_TARGET_DAYS} days stands at ${slaRate} percent, ${slaStatus}.`,
      bestCat ? `The fastest responding category is ${bestCat.name} averaging ${bestCat.avg} days.` : "",
      worstCat && worstCat !== bestCat ? `The slowest is ${worstCat.name} averaging ${worstCat.avg} days, a gap of ${gapDays} days.` : "",
      catSummary ? `Category averages: ${catSummary}.` : "",
      slaRate < 80 ? `Recommendation: Improve response processes, particularly for ${worstCat?.name || "underperforming categories"}, to achieve the eighty percent SLA target.` : "Recommendation: Maintain the current SLA level and replicate best practices from the top-performing category.",
    ].filter(Boolean).join(" ... ");
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Performance Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="kpi-card py-3 text-center">
          <div className="kpi-icon-badge bg-sky-500/15 mx-auto mb-2">
            <Timer className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-sky-400">{data.kpi.avg_response_days}</div>
          <div className="text-[11px] text-muted-foreground">วันเฉลี่ย</div>
        </div>
        <div className="kpi-card py-3 text-center">
          <div className="kpi-icon-badge bg-emerald-500/15 mx-auto mb-2">
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{data.kpi.median_response_days}</div>
          <div className="text-[11px] text-muted-foreground">มัธยฐาน (วัน)</div>
        </div>
        <div className="kpi-card py-3 text-center">
          <div className="kpi-icon-badge bg-amber-500/15 mx-auto mb-2">
            <Target className="w-4 h-4 text-amber-400" />
          </div>
          <div className={`text-2xl font-bold ${slaRate >= 80 ? "text-emerald-400" : slaRate >= 60 ? "text-amber-400" : "text-red-400"}`}>
            {slaRate}%
          </div>
          <div className="text-[11px] text-muted-foreground">SLA Compliance ({SLA_TARGET_DAYS} วัน)</div>
        </div>
        <div className="kpi-card py-3 text-center">
          <div className="kpi-icon-badge bg-violet-500/15 mx-auto mb-2">
            <BarChart3 className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-bold text-violet-400">{bestCat?.avg || "-"}</div>
          <div className="text-[11px] text-muted-foreground">เร็วสุด ({bestCat?.name || "-"})</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="chart-card">
          <div className="chart-title">
            <span className="chart-icon" style={{ background: "rgba(251,191,36,0.15)" }}>
              <Timer className="w-3.5 h-3.5 text-amber-400" />
            </span>
            ระยะเวลาในการตอบ Complaint
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={distData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,19%,27%)" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar 
                dataKey="value" 
                name="จำนวนเคส" 
                radius={[6, 6, 0, 0]} 
                onClick={(item) => setOpenBucket(item.name || item.payload?.name)} 
                cursor="pointer"
              >
                {distData.map((_, i) => <Cell key={i} fill={DIST_COLORS[i % DIST_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title">
            <span className="chart-icon" style={{ background: "rgba(74,222,128,0.15)" }}>
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            </span>
            เวลาตอบกลับเฉลี่ยตามหมวดหมู่
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={catData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,19%,27%)" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" iconSize={8} />
              <ReferenceLine y={SLA_TARGET_DAYS} stroke="#ef4444" strokeDasharray="5 5" label={{ value: `SLA ${SLA_TARGET_DAYS}d`, fill: "#ef4444", fontSize: 10, position: "right" }} />
              <Bar dataKey="avg" name="เฉลี่ย (วัน)" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              <Bar dataKey="median" name="มัธยฐาน (วัน)" fill="#22c55e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Insights */}
      {worstCat && bestCat && (
        <div className="chart-card">
          <div className="flex items-center justify-between mb-4">
            <div className="chart-title !mb-0">
              <span className="chart-icon" style={{ background: "rgba(139,92,246,0.15)" }}>
                <Target className="w-3.5 h-3.5 text-violet-400" />
              </span>
              Performance Insights
            </div>
            <TTSButton status={ttsStatus} supported={supported}
              onPlay={() => speak(buildScript())} onPause={pause} onCancel={cancel} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="insight-box">
              <h4>SLA Compliance</h4>
              <p>
                {slaRate >= 80
                  ? <>อัตรา SLA ({SLA_TARGET_DAYS} วัน) อยู่ที่ <span className="text-emerald-400 font-semibold">{slaRate}%</span> ซึ่งอยู่ในเกณฑ์ดี</>
                  : <>อัตรา SLA ({SLA_TARGET_DAYS} วัน) อยู่ที่ <span className="text-red-400 font-semibold">{slaRate}%</span> ซึ่งต่ำกว่าเป้าหมาย 80% ควรเร่งปรับปรุง</>
                }
              </p>
            </div>
            <div className="insight-box">
              <h4>Category Performance Gap</h4>
              <p>
                หมวด <strong className="text-emerald-400">{bestCat.name}</strong> ตอบกลับเร็วสุด ({bestCat.avg} วัน)
                {" "}ส่วน <strong className="text-red-400">{worstCat.name}</strong> ช้าสุด ({worstCat.avg} วัน)
                {" "}ห่างกัน {(worstCat.avg - bestCat.avg).toFixed(1)} วัน
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!openBucket} onOpenChange={(o) => !o && setOpenBucket(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>รายการ Complaint (ใช้เวลาแก้ {openBucket})</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลขที่</TableHead>
                  <TableHead>วันที่แจ้ง</TableHead>
                  <TableHead>หมวดหมู่</TableHead>
                  <TableHead>ปัญหา</TableHead>
                  <TableHead>บริษัท/สาขา</TableHead>
                  <TableHead>สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedComplaints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">ไม่มีข้อมูล</TableCell>
                  </TableRow>
                ) : selectedComplaints.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-xs">{c.complaint_number}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {c.complaint_date ? new Date(c.complaint_date).toLocaleDateString("th-TH") : "-"}
                    </TableCell>
                    <TableCell className="text-xs">{c.categories?.name || "-"}</TableCell>
                    <TableCell className="text-xs">{c.problem_types?.name || "-"}</TableCell>
                    <TableCell className="text-xs">
                      {c.companies?.name}<br/>
                      <span className="text-muted-foreground">{c.branches?.name}</span>
                    </TableCell>
                    <TableCell className="text-xs">{c.status || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
