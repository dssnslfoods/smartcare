import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  ComposedChart, Line
} from "recharts";
import { Repeat, AlertTriangle, Flame, Activity, CalendarClock, TrendingUp } from "lucide-react";
import type { CompanyData } from "@/data/mockData";
import TTSButton from "./TTSButton";
import { useTTS } from "@/hooks/useTTS";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Props { data: CompanyData }

const tooltipStyle = { background: "#1e293b", border: "1px solid #334155", borderRadius: 8 };

// ถือว่าเป็น "ปัญหาซ้ำซาก" เมื่อเกิดตั้งแต่กี่ครั้งขึ้นไป
const RECURRENCE_THRESHOLD = 2;
// ช่วงวันที่ถือว่ายัง "active" (เทียบจากวันล่าสุดในชุดข้อมูล)
const ACTIVE_WINDOW_DAYS = 90;

interface Pattern {
  key: string;
  group: string;
  problem: string;
  subProblem: string;
  count: number;
  firstDate: number;
  lastDate: number;
  spanDays: number;
  perMonth: number;
  closedByMaker: number;   // จำนวนเคสที่ "ปิดผู้ผลิต"
  closeRate: number;       // % ปิดผู้ผลิต (ความผิดผู้ผลิต)
  isActive: boolean;
  ids: string[];
}

function daysBetween(a: number, b: number) {
  return Math.abs(b - a) / (1000 * 60 * 60 * 24);
}

const TH_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

interface MonthPoint { label: string; count: number; trend: number }

// สร้าง timeline รายเดือนต่อเนื่อง (เติมเดือนที่ไม่เกิดเป็น 0) + เส้น trend (linear regression)
function buildMonthlySeries(complaints: any[]): { series: MonthPoint[]; slope: number } {
  const monthCounts: Record<string, number> = {};
  let minY = Infinity, minM = 0, maxY = -Infinity, maxM = 0;

  complaints.forEach((c) => {
    if (!c.complaint_date) return;
    const d = new Date(c.complaint_date);
    const y = d.getFullYear(), m = d.getMonth();
    const key = `${y}-${m}`;
    monthCounts[key] = (monthCounts[key] || 0) + 1;
    const ord = y * 12 + m;
    if (ord < minY * 12 + minM) { minY = y; minM = m; }
    if (ord > maxY * 12 + maxM) { maxY = y; maxM = m; }
  });

  if (!isFinite(minY)) return { series: [], slope: 0 };

  // เติมทุกเดือนต่อเนื่อง
  const counts: number[] = [];
  const labels: string[] = [];
  let y = minY, m = minM;
  const endOrd = maxY * 12 + maxM;
  while (y * 12 + m <= endOrd) {
    counts.push(monthCounts[`${y}-${m}`] || 0);
    labels.push(`${TH_MONTHS[m]} ${String((y + 543) % 100).padStart(2, "0")}`);
    m++;
    if (m > 11) { m = 0; y++; }
  }

  // Linear regression (least squares): y = slope*x + intercept
  const n = counts.length;
  const sumX = counts.reduce((s, _, i) => s + i, 0);
  const sumY = counts.reduce((s, v) => s + v, 0);
  const sumXY = counts.reduce((s, v, i) => s + i * v, 0);
  const sumXX = counts.reduce((s, _, i) => s + i * i, 0);
  const denom = n * sumXX - sumX * sumX;
  const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
  const intercept = n !== 0 ? (sumY - slope * sumX) / n : 0;

  const series: MonthPoint[] = counts.map((count, i) => ({
    label: labels[i],
    count,
    trend: Math.max(0, Math.round((intercept + slope * i) * 100) / 100),
  }));

  return { series, slope };
}

// ความรุนแรง: ยิ่งซ้ำบ่อย + ความผิดผู้ผลิตสูง = ยิ่งแย่ (แดง)
function severityColor(count: number, maxCount: number): string {
  const ratio = maxCount > 0 ? count / maxCount : 0;
  if (ratio >= 0.8) return "#ef4444"; // แดง
  if (ratio >= 0.6) return "#f97316"; // ส้ม
  if (ratio >= 0.4) return "#eab308"; // เหลือง
  if (ratio >= 0.2) return "#84cc16"; // เขียวมะนาว
  return "#22c55e";                    // เขียว
}

export default function RecurringProblemsTab({ data }: Props) {
  const { status: ttsStatus, supported, speak, pause, cancel } = useTTS();
  const [openPattern, setOpenPattern] = useState<Pattern | null>(null);

  const complaints = data.raw_complaints || [];

  const { patterns, refDate, totalCases, recurringCases } = useMemo(() => {
    const map: Record<string, Pattern> = {};
    let maxDate = 0;

    complaints.forEach((c: any) => {
      const t = c.complaint_date ? new Date(c.complaint_date).getTime() : NaN;
      if (!isNaN(t) && t > maxDate) maxDate = t;
    });

    complaints.forEach((c: any) => {
      const group = c.product_groups?.name || "ไม่ระบุ";
      const problem = c.problem_types?.name || "ไม่ระบุ";
      const subProblem = c.problem_sub_types?.name || "-";
      const key = `${group}|||${problem}|||${subProblem}`;
      const t = c.complaint_date ? new Date(c.complaint_date).getTime() : NaN;
      const isMakerFault = c.status === "ปิดผู้ผลิต";

      if (!map[key]) {
        map[key] = {
          key, group, problem, subProblem,
          count: 0, firstDate: Infinity, lastDate: 0, spanDays: 0, perMonth: 0,
          closedByMaker: 0, closeRate: 0, isActive: false, ids: [],
        };
      }
      const p = map[key];
      p.count++;
      p.ids.push(c.id);
      if (isMakerFault) p.closedByMaker++;
      if (!isNaN(t)) {
        if (t < p.firstDate) p.firstDate = t;
        if (t > p.lastDate) p.lastDate = t;
      }
    });

    const list = Object.values(map)
      .filter(p => p.count >= RECURRENCE_THRESHOLD)
      .map(p => {
        const span = daysBetween(p.firstDate, p.lastDate);
        p.spanDays = Math.round(span);
        const months = Math.max(span / 30, 1);
        p.perMonth = Math.round((p.count / months) * 10) / 10;
        p.closeRate = p.count > 0 ? Math.round((p.closedByMaker / p.count) * 100) : 0;
        p.isActive = maxDate > 0 && daysBetween(p.lastDate, maxDate) <= ACTIVE_WINDOW_DAYS;
        return p;
      })
      .sort((a, b) => b.count - a.count);

    const recurring = list.reduce((s, p) => s + p.count, 0);

    return { patterns: list, refDate: maxDate, totalCases: complaints.length, recurringCases: recurring };
  }, [complaints]);

  const maxCount = patterns[0]?.count || 0;
  const activeCount = patterns.filter(p => p.isActive).length;
  const recurringPct = totalCases > 0 ? Math.round((recurringCases / totalCases) * 100) : 0;
  const topPattern = patterns[0];

  const chartData = patterns.slice(0, 10).map(p => ({
    key: p.key,
    name: p.subProblem !== "-" ? p.subProblem : p.problem,
    fullName: `${p.group} › ${p.problem}${p.subProblem !== "-" ? " › " + p.subProblem : ""}`,
    count: p.count,
    fill: severityColor(p.count, maxCount),
  }));

  const openPatternByKey = (key?: string) => {
    const p = patterns.find(x => x.key === key);
    if (p) setOpenPattern(p);
  };

  const selectedComplaints = openPattern
    ? complaints.filter((c: any) => openPattern.ids.includes(c.id))
    : [];

  const { series: monthlySeries, slope: trendSlope } = useMemo(
    () => (openPattern ? buildMonthlySeries(selectedComplaints) : { series: [], slope: 0 }),
    [openPattern, selectedComplaints]
  );
  const peakMonth = monthlySeries.reduce(
    (best, m) => (m.count > best.count ? m : best),
    { label: "-", count: 0, trend: 0 }
  );
  // ทิศทางแนวโน้ม: slope = การเปลี่ยนแปลงเฉลี่ยต่อเดือน
  const trendPerMonth = Math.round(trendSlope * 100) / 100;
  const trendDir =
    trendSlope > 0.05 ? { label: "แนวโน้มเพิ่มขึ้น", color: "#ef4444", icon: "▲" }   // ขึ้น = แดง (แย่ลง)
    : trendSlope < -0.05 ? { label: "แนวโน้มลดลง", color: "#22c55e", icon: "▼" }      // ลง = เขียว (ดีขึ้น)
    : { label: "แนวโน้มคงที่", color: "#ffffff", icon: "▬" };                          // คงที่ = ขาว

  const buildScript = () => {
    const top3 = patterns.slice(0, 3).map((p, i) =>
      `Number ${i + 1}: ${p.problem}${p.subProblem !== "-" ? ", " + p.subProblem : ""}, recurring ${p.count} times, manufacturer fault ${p.closeRate} percent`
    ).join(". ");
    return [
      "Recurring Problem Analysis.",
      `Found ${patterns.length} recurring problem patterns covering ${recurringCases} cases, which is ${recurringPct} percent of all complaints.`,
      `${activeCount} patterns are still active within the last ${ACTIVE_WINDOW_DAYS} days.`,
      `Top recurring patterns: ${top3}.`,
      `Recommendation: Prioritise root cause elimination for the most frequent and still-active patterns, especially those with high manufacturer fault rates.`,
    ].join(" ... ");
  };

  if (patterns.length === 0) {
    return (
      <div className="glass-card rounded-2xl py-20 text-center animate-fade-in">
        <Repeat className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-muted-foreground text-lg">ไม่พบปัญหาที่เกิดซ้ำ</p>
        <p className="text-muted-foreground text-sm mt-2">
          (ปัญหาซ้ำซาก = กลุ่มสินค้า + ประเภทปัญหา + ปัญหาย่อย ที่เกิดตั้งแต่ {RECURRENCE_THRESHOLD} ครั้งขึ้นไป)
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="kpi-card py-4 text-center">
          <div className="kpi-icon-badge bg-sky-500/15 mx-auto mb-2">
            <Repeat className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-sky-400">{patterns.length.toLocaleString()}</div>
          <div className="text-[11px] text-muted-foreground">รูปแบบปัญหาซ้ำซาก</div>
        </div>
        <div className="kpi-card py-4 text-center">
          <div className="kpi-icon-badge bg-amber-500/15 mx-auto mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{recurringPct}%</div>
          <div className="text-[11px] text-muted-foreground">
            ของเคสทั้งหมด ({recurringCases.toLocaleString()} เคส)
          </div>
        </div>
        <div className="kpi-card py-4 text-center">
          <div className="kpi-icon-badge bg-red-500/15 mx-auto mb-2">
            <Activity className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">{activeCount.toLocaleString()}</div>
          <div className="text-[11px] text-muted-foreground">ยังเกิดอยู่ (≤{ACTIVE_WINDOW_DAYS} วัน)</div>
        </div>
        <div className="kpi-card py-4 text-center">
          <div className="kpi-icon-badge bg-orange-500/15 mx-auto mb-2">
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-orange-400">{maxCount.toLocaleString()}</div>
          <div className="text-[11px] text-muted-foreground">เกิดบ่อยสุด (ครั้ง)</div>
        </div>
      </div>

      {/* Top recurring chart */}
      <div className="chart-card">
        <div className="flex items-center justify-between mb-4">
          <div className="chart-title !mb-0">
            <span className="chart-icon" style={{ background: "rgba(239,68,68,0.15)" }}>
              <Flame className="w-3.5 h-3.5 text-red-400" />
            </span>
            10 อันดับปัญหาที่เกิดซ้ำบ่อยที่สุด
            <span className="text-[11px] font-normal text-muted-foreground ml-1">(คลิกแท่งเพื่อดูแนวโน้ม)</span>
          </div>
          <TTSButton status={ttsStatus} supported={supported}
            onPlay={() => speak(buildScript())} onPause={pause} onCancel={cancel} />
        </div>
        <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 42)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,19%,27%)" horizontal={false} />
            <XAxis type="number" stroke="#94a3b8" allowDecimals={false} />
            <YAxis type="category" dataKey="name" stroke="#94a3b8" width={150} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: any) => [`${v} ครั้ง`, "จำนวน"]}
              labelFormatter={(_, p: any) => p?.[0]?.payload?.fullName || ""}
            />
            <Bar
              dataKey="count" name="จำนวนครั้ง" radius={[0, 6, 6, 0]}
              cursor="pointer"
              onClick={(item: any) => openPatternByKey(item?.key || item?.payload?.key)}
            >
              {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detail table */}
      <div className="chart-card">
        <div className="chart-title">
          <span className="chart-icon" style={{ background: "rgba(14,165,233,0.15)" }}>
            <CalendarClock className="w-3.5 h-3.5 text-sky-400" />
          </span>
          รายละเอียดปัญหาซ้ำซาก (คลิกเพื่อดูรายการเคส)
          <span className="text-[11px] font-normal text-muted-foreground ml-1">— แถบสีฟ้า = Top 10</span>
        </div>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>กลุ่มสินค้า</TableHead>
                <TableHead>ประเภทปัญหา</TableHead>
                <TableHead>ปัญหาย่อย</TableHead>
                <TableHead className="text-center">ครั้ง</TableHead>
                <TableHead className="text-center">ความถี่/เดือน</TableHead>
                <TableHead className="text-center">% ผิดผู้ผลิต</TableHead>
                <TableHead className="text-center">เกิดล่าสุด</TableHead>
                <TableHead className="text-center">สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patterns.map((p, i) => {
                const isTop10 = i < 10;
                return (
                <TableRow
                  key={p.key}
                  className={`cursor-pointer transition-colors ${
                    isTop10
                      ? "bg-sky-500/10 hover:bg-sky-500/20 border-l-2 border-l-sky-400"
                      : "hover:bg-primary/5"
                  }`}
                  onClick={() => setOpenPattern(p)}
                >
                  <TableCell className="text-xs">
                    {isTop10 ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 font-bold text-[10px]">
                        {i + 1}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">{i + 1}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">{p.group}</TableCell>
                  <TableCell className="text-xs">{p.problem}</TableCell>
                  <TableCell className="text-xs">{p.subProblem}</TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold" style={{ color: severityColor(p.count, maxCount) }}>
                      {p.count}
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-xs">{p.perMonth}</TableCell>
                  <TableCell className="text-center text-xs">
                    <span className={p.closeRate >= 60 ? "text-red-400" : p.closeRate >= 40 ? "text-amber-400" : "text-emerald-400"}>
                      {p.closeRate}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-xs whitespace-nowrap">
                    {p.lastDate ? new Date(p.lastDate).toLocaleDateString("th-TH") : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {p.isActive ? (
                      <span className="status-badge status-badge-danger text-[10px]">ยังเกิดอยู่</span>
                    ) : (
                      <span className="status-badge status-badge-success text-[10px]">สงบแล้ว</span>
                    )}
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Insight */}
      {topPattern && (
        <div className="chart-card">
          <div className="chart-title">
            <span className="chart-icon" style={{ background: "rgba(249,115,22,0.15)" }}>
              <Flame className="w-3.5 h-3.5 text-orange-400" />
            </span>
            ข้อสังเกต
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="insight-box">
              <h4>ปัญหาที่ต้องเร่งแก้ที่ต้นเหตุ</h4>
              <p>
                <strong className="text-red-400">{topPattern.problem}</strong>
                {topPattern.subProblem !== "-" && <> ({topPattern.subProblem})</>}
                {" "}ในกลุ่ม <strong>{topPattern.group}</strong> เกิดซ้ำถึง{" "}
                <span className="text-orange-400 font-semibold">{topPattern.count} ครั้ง</span>
                {" "}โดยเป็นความผิดผู้ผลิต <span className="text-red-400 font-semibold">{topPattern.closeRate}%</span>
                {topPattern.isActive && <> และ<span className="text-red-400">ยังเกิดอยู่</span></>}
              </p>
            </div>
            <div className="insight-box">
              <h4>ภาพรวมการเกิดซ้ำ</h4>
              <p>
                มีปัญหาซ้ำซาก <strong className="text-sky-400">{patterns.length} รูปแบบ</strong>
                {" "}ครอบคลุม <strong>{recurringPct}%</strong> ของเคสทั้งหมด
                {" "}และยังเกิดอยู่ <strong className="text-red-400">{activeCount} รูปแบบ</strong>
                {" "}— ควรทำ CAPA แก้ที่ต้นเหตุเพื่อลดการเกิดซ้ำ
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!openPattern} onOpenChange={(o) => !o && setOpenPattern(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {openPattern && (
                <>รายการเคส: {openPattern.problem}
                {openPattern.subProblem !== "-" && ` › ${openPattern.subProblem}`}
                {" "}({openPattern.count} ครั้ง)</>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto mt-4 space-y-5">
            {/* กราฟความถี่ย้อนหลังรายเดือน */}
            {monthlySeries.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <TrendingUp className="w-4 h-4 text-sky-400" />
                    ความถี่การเกิดย้อนหลัง (รายเดือน)
                  </div>
                  <div className="flex items-center gap-3 text-[11px] flex-wrap">
                    <span
                      className="font-semibold px-2 py-0.5 rounded-full"
                      style={{ color: trendDir.color, background: `${trendDir.color}1a` }}
                    >
                      {trendDir.icon} {trendDir.label}
                      {Math.abs(trendPerMonth) >= 0.05 && (
                        <> ({trendPerMonth > 0 ? "+" : ""}{trendPerMonth} ครั้ง/เดือน)</>
                      )}
                    </span>
                    <span className="text-muted-foreground">
                      เกิดมากสุด: <span className="text-orange-400 font-semibold">{peakMonth.label} ({peakMonth.count})</span>
                    </span>
                    <span className="text-muted-foreground">
                      ช่วง: <span className="text-sky-400 font-semibold">{monthlySeries.length} เดือน</span>
                    </span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <ComposedChart data={monthlySeries} margin={{ left: 0, right: 10, top: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,19%,27%)" />
                    <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis stroke="#94a3b8" allowDecimals={false} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: any, name: any) => [
                        name === "count" ? `${v} ครั้ง` : `${v}`,
                        name === "count" ? "เกิดในเดือนนั้น" : "แนวโน้ม",
                      ]}
                    />
                    <Bar dataKey="count" name="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Line
                      type="monotone" dataKey="trend" name="trend"
                      stroke={trendDir.color} strokeWidth={2.5} strokeDasharray="6 4" dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 justify-center mt-1 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-sky-500 inline-block" /> เกิดในเดือนนั้น</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block" style={{ background: trendDir.color }} /> เส้นแนวโน้ม (trend)</span>
                </div>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลขที่</TableHead>
                  <TableHead>วันที่แจ้ง</TableHead>
                  <TableHead>บริษัท/สาขา</TableHead>
                  <TableHead>สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedComplaints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">ไม่มีข้อมูล</TableCell>
                  </TableRow>
                ) : selectedComplaints
                  .sort((a: any, b: any) => new Date(b.complaint_date).getTime() - new Date(a.complaint_date).getTime())
                  .map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-xs">{c.complaint_number || "-"}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {c.complaint_date ? new Date(c.complaint_date).toLocaleDateString("th-TH") : "-"}
                      </TableCell>
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
