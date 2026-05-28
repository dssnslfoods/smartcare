import { useState, useEffect, useMemo } from "react";
import { Loader2, Sparkles, Printer, ArrowLeft, Calendar, Building2, MapPin, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, Lightbulb, Eye, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFilterOptions } from "@/hooks/useComplaintsData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import TopNavBar from "@/components/TopNavBar";
import Footer from "@/components/Footer";

interface BriefData {
  executiveSummary: string;
  highlights: string[];
  concerns: string[];
  recommendations: string[];
  outlook: string;
}

interface Stats {
  current: {
    total: number; closedMaker: number; notClosed: number; closeRate: number; avgResponse: number;
    byCategory: { name: string; count: number; closeRate: number }[];
    byProductGroup: { name: string; count: number; closeRate: number }[];
    byProblem: { name: string; count: number; closeRate: number }[];
    bySubProblem: { name: string; count: number; closeRate: number }[];
    byStatus: { name: string; count: number }[];
    recurring: { group: string; problem: string; sub: string; count: number; closeRate: number }[];
  };
  previous: { total: number; closedMaker: number; closeRate: number; avgResponse: number };
  period: { from: string; to: string; label: string };
  prevPeriod: { from: string; to: string };
  scope: { company: string; branch: string };
}

type PeriodType = "month" | "week" | "custom";

function fmtISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const TH_MONTH_SHORT = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

function defaultPeriod(type: PeriodType): { from: string; to: string; label: string } {
  const now = new Date();
  if (type === "week") {
    // ย้อนหลัง 7 วัน
    const to = new Date(now);
    const from = new Date(now);
    from.setDate(from.getDate() - 6);
    return {
      from: fmtISO(from),
      to: fmtISO(to),
      label: `สัปดาห์ที่ผ่านมา (${from.getDate()} – ${to.getDate()} ${TH_MONTH_SHORT[to.getMonth()]} ${to.getFullYear() + 543})`,
    };
  }
  if (type === "month") {
    // เดือนก่อนหน้าทั้งเดือน
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const from = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    const to = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
    return {
      from: fmtISO(from),
      to: fmtISO(to),
      label: `เดือน ${TH_MONTH_SHORT[lastMonth.getMonth()]} ${lastMonth.getFullYear() + 543}`,
    };
  }
  return { from: "", to: "", label: "" };
}

export default function ExecutiveBrief() {
  const { user } = useAuth();
  const { options, loading: optionsLoading } = useFilterOptions();

  const [periodType, setPeriodType] = useState<PeriodType>("month");
  const initial = defaultPeriod("month");
  const [dateFrom, setDateFrom] = useState(initial.from);
  const [dateTo, setDateTo] = useState(initial.to);
  const [companyId, setCompanyId] = useState("ALL");
  const [branchId, setBranchId] = useState("ALL");

  const [generating, setGenerating] = useState(false);
  const [brief, setBrief] = useState<BriefData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [aiProvider, setAiProvider] = useState<string>("");

  // เปลี่ยน period type → reset วันที่
  useEffect(() => {
    if (periodType === "custom") return;
    const p = defaultPeriod(periodType);
    setDateFrom(p.from);
    setDateTo(p.to);
  }, [periodType]);

  const branchesOfCompany = useMemo(
    () => options.branches.filter(b => companyId === "ALL" || b.company_id === companyId),
    [options.branches, companyId]
  );

  const periodLabel = useMemo(() => {
    if (periodType === "month" || periodType === "week") {
      return defaultPeriod(periodType).label;
    }
    if (dateFrom && dateTo) {
      const f = new Date(dateFrom), t = new Date(dateTo);
      return `${f.getDate()} ${TH_MONTH_SHORT[f.getMonth()]} ${f.getFullYear() + 543} – ${t.getDate()} ${TH_MONTH_SHORT[t.getMonth()]} ${t.getFullYear() + 543}`;
    }
    return "";
  }, [periodType, dateFrom, dateTo]);

  async function generate() {
    if (!dateFrom || !dateTo) {
      toast.error("กรุณาเลือกช่วงวันที่");
      return;
    }
    setGenerating(true);
    setBrief(null);
    setStats(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-executive-brief", {
        body: { dateFrom, dateTo, companyId, branchId, periodLabel },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setBrief(data.brief);
      setStats(data.stats);
      setAiProvider(data.aiProvider || "");
      toast.success(
        data.aiProvider?.startsWith("gemini")
          ? "สร้างรายงานด้วย Gemini AI สำเร็จ"
          : data.aiProvider?.startsWith("claude")
            ? "สร้างรายงานด้วย Claude AI สำเร็จ"
            : "สร้างรายงานสำเร็จ (template)"
      );
    } catch (err: any) {
      console.error(err);
      toast.error("สร้างรายงานไม่สำเร็จ: " + (err.message || err));
    } finally {
      setGenerating(false);
    }
  }

  const change = stats && stats.previous.total > 0
    ? Math.round(((stats.current.total - stats.previous.total) / stats.previous.total) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Hidden on print */}
      <div className="print:hidden">
        <TopNavBar />
      </div>

      <div className="max-w-[1100px] mx-auto px-6 py-6">
        {/* Page header - hidden when printing */}
        <div className="print:hidden mb-5 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Link to="/" className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-2">
              <ArrowLeft className="w-3 h-3" /> กลับสู่ Dashboard
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-violet-400" />
              SmartCare Intelligent Report
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Executive Summary
            </p>
          </div>
          {brief && (
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white font-medium text-sm transition-colors"
            >
              <Printer className="w-4 h-4" /> พิมพ์ / บันทึกเป็น PDF
            </button>
          )}
        </div>

        {/* Filter controls - hidden when printing */}
        <div className="print:hidden glass-card rounded-2xl p-5 mb-5 space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">ช่วงเวลาที่ต้องการวิเคราะห์</Label>
            <RadioGroup value={periodType} onValueChange={(v) => setPeriodType(v as PeriodType)} className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="month" id="p-month" />
                <Label htmlFor="p-month" className="cursor-pointer">📅 เดือนก่อนหน้า</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="week" id="p-week" />
                <Label htmlFor="p-week" className="cursor-pointer">📆 สัปดาห์ที่ผ่านมา (7 วัน)</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="custom" id="p-custom" />
                <Label htmlFor="p-custom" className="cursor-pointer">🎯 กำหนดเอง</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">ตั้งแต่วันที่</Label>
              <input
                type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPeriodType("custom"); }}
                className="w-full bg-background border border-border/40 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">ถึงวันที่</Label>
              <input
                type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPeriodType("custom"); }}
                className="w-full bg-background border border-border/40 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">บริษัท</Label>
              <Select value={companyId} onValueChange={(v) => { setCompanyId(v); setBranchId("ALL"); }} disabled={optionsLoading}>
                <SelectTrigger><SelectValue placeholder="ทุกบริษัท" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">ทุกบริษัท</SelectItem>
                  {options.companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">สาขา</Label>
              <Select value={branchId} onValueChange={setBranchId} disabled={optionsLoading || companyId === "ALL"}>
                <SelectTrigger><SelectValue placeholder="ทุกสาขา" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">ทุกสาขา</SelectItem>
                  {branchesOfCompany.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <button
            onClick={generate}
            disabled={generating}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg
              bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600
              text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังวิเคราะห์ด้วย AI...</> : <><Sparkles className="w-4 h-4" /> สร้างรายงานสรุป</>}
          </button>

          {aiProvider && brief && (
            <p className="text-[11px] text-muted-foreground">
              เครื่องมือที่ใช้: <span className="font-semibold text-violet-400">{aiProvider}</span>
              {aiProvider.startsWith("template") && (
                <span className="text-amber-400 ml-2">⚠ ใช้ template — ถ้าต้องการ AI กรุณาตั้งค่า GEMINI_API_KEY ใน Supabase secrets</span>
              )}
            </p>
          )}
        </div>

        {/* Empty state */}
        {!brief && !generating && (
          <div className="glass-card rounded-2xl py-20 text-center text-muted-foreground print:hidden">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>เลือกช่วงเวลาและขอบเขต แล้วกด "สร้างรายงานสรุป" เพื่อให้ AI วิเคราะห์</p>
          </div>
        )}

        {/* Loading state */}
        {generating && (
          <div className="glass-card rounded-2xl py-20 text-center print:hidden">
            <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin text-violet-400" />
            <p className="text-muted-foreground">AI กำลังวิเคราะห์ข้อมูล...</p>
            <p className="text-xs text-muted-foreground mt-1">โดยปกติใช้เวลา 5-15 วินาที</p>
          </div>
        )}

        {/* Report */}
        {brief && stats && (
          <article id="brief-report" className="brief-report glass-card print:!shadow-none print:!bg-white print:!text-black rounded-2xl p-8 md:p-12">
            {/* Report header */}
            <header className="text-center mb-8 pb-6 border-b border-border/30 print:border-gray-300">
              <div className="text-xs uppercase tracking-widest text-violet-400 print:text-violet-700 mb-2 font-semibold">
                Executive Brief · รายงานสรุปผู้บริหาร
              </div>
              <h1 className="text-3xl font-bold mb-3">
                สรุปข้อร้องเรียน {stats.period.label}
              </h1>
              <div className="flex items-center justify-center gap-5 text-sm text-muted-foreground print:text-gray-600 flex-wrap">
                <span className="inline-flex items-center gap-1"><Building2 className="w-4 h-4" /> {stats.scope.company}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4" /> {stats.scope.branch}</span>
                <span className="inline-flex items-center gap-1"><Calendar className="w-4 h-4" /> {stats.period.from} ถึง {stats.period.to}</span>
              </div>
            </header>

            {/* Key metrics */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              <MetricCard label="Complaint ทั้งหมด" value={stats.current.total} unit="เคส"
                change={change} prev={stats.previous.total} />
              <MetricCard label="ผิดผู้ผลิต" value={stats.current.closeRate} unit="%"
                sub={`${stats.current.closedMaker} เคส`}
                tone={stats.current.closeRate >= 60 ? "bad" : stats.current.closeRate >= 40 ? "warn" : "good"} />
              <MetricCard label="เคสค้าง" value={stats.current.notClosed} unit="เคส"
                tone={stats.current.notClosed > 10 ? "warn" : "good"} />
              <MetricCard label="เวลาตอบเฉลี่ย" value={stats.current.avgResponse} unit="วัน"
                tone={stats.current.avgResponse > 7 ? "warn" : "good"} />
            </section>

            {/* Executive Summary */}
            <Section title="บทสรุปผู้บริหาร" icon={<Eye className="w-4 h-4" />} accent="violet">
              <p className="text-base leading-relaxed">{brief.executiveSummary}</p>
            </Section>

            {/* Highlights */}
            {brief.highlights.length > 0 && (
              <Section title="จุดเด่น" icon={<CheckCircle2 className="w-4 h-4" />} accent="emerald">
                <ul className="space-y-2">
                  {brief.highlights.map((h, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed">
                      <span className="text-emerald-500 mt-0.5">✓</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Concerns */}
            {brief.concerns.length > 0 && (
              <Section title="ประเด็นที่น่ากังวล" icon={<AlertTriangle className="w-4 h-4" />} accent="red">
                <ul className="space-y-2">
                  {brief.concerns.map((c, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed">
                      <span className="text-red-500 mt-0.5">⚠</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Recommendations */}
            {brief.recommendations.length > 0 && (
              <Section title="ข้อเสนอแนะ" icon={<Lightbulb className="w-4 h-4" />} accent="amber">
                <ul className="space-y-2">
                  {brief.recommendations.map((r, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed">
                      <span className="text-amber-500 mt-0.5 font-bold">{i + 1}.</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Top problems table */}
            {stats.current.byProblem.length > 0 && (
              <Section title="ปัญหาที่พบมากที่สุด (Top 5)" icon={<TrendingUp className="w-4 h-4" />} accent="sky">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-muted-foreground print:text-gray-600">
                      <tr className="border-b border-border/30 print:border-gray-300">
                        <th className="text-left py-2 w-8">#</th>
                        <th className="text-left py-2">ประเภทปัญหา</th>
                        <th className="text-right py-2">จำนวน</th>
                        <th className="text-right py-2">% ผิดผู้ผลิต</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.current.byProblem.slice(0, 5).map((p, i) => (
                        <tr key={p.name} className="border-b border-border/10 print:border-gray-200">
                          <td className="py-2 text-muted-foreground">{i + 1}</td>
                          <td className="py-2">{p.name}</td>
                          <td className="py-2 text-right font-semibold">{p.count.toLocaleString()}</td>
                          <td className="py-2 text-right">
                            <span className={p.closeRate >= 60 ? "text-red-500" : p.closeRate >= 40 ? "text-amber-500" : "text-emerald-500"}>
                              {p.closeRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            )}

            {/* Recurring problems */}
            {stats.current.recurring.length > 0 && (
              <Section title="ปัญหาซ้ำซากในงวดนี้" icon={<AlertTriangle className="w-4 h-4" />} accent="orange">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-muted-foreground print:text-gray-600">
                      <tr className="border-b border-border/30 print:border-gray-300">
                        <th className="text-left py-2 w-8">#</th>
                        <th className="text-left py-2">รายละเอียด</th>
                        <th className="text-right py-2">ครั้ง</th>
                        <th className="text-right py-2">% ผิดผู้ผลิต</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.current.recurring.map((r, i) => (
                        <tr key={i} className="border-b border-border/10 print:border-gray-200">
                          <td className="py-2 text-muted-foreground">{i + 1}</td>
                          <td className="py-2">
                            <div className="text-xs text-muted-foreground print:text-gray-600">{r.group} › {r.problem}</div>
                            <div>{r.sub}</div>
                          </td>
                          <td className="py-2 text-right font-semibold text-orange-500">{r.count}</td>
                          <td className="py-2 text-right">
                            <span className={r.closeRate >= 60 ? "text-red-500" : r.closeRate >= 40 ? "text-amber-500" : "text-emerald-500"}>
                              {r.closeRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            )}

            {/* Outlook */}
            <Section title="ทิศทาง / สิ่งที่ควรจับตา" icon={<TrendingUp className="w-4 h-4" />} accent="indigo">
              <p className="text-sm leading-relaxed italic">{brief.outlook}</p>
            </Section>

            {/* Footer */}
            <footer className="mt-10 pt-5 border-t border-border/30 print:border-gray-300 text-center text-xs text-muted-foreground print:text-gray-500">
              <p>รายงานนี้สร้างโดย SmartCare AI · {new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}</p>
              <p className="mt-1">© NSL Foods · เพื่อการใช้งานภายในเท่านั้น</p>
            </footer>
          </article>
        )}
      </div>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}

function MetricCard({ label, value, unit, change, prev, sub, tone }: {
  label: string; value: number; unit: string;
  change?: number; prev?: number; sub?: string;
  tone?: "good" | "warn" | "bad";
}) {
  const toneColor =
    tone === "bad" ? "text-red-500" :
    tone === "warn" ? "text-amber-500" :
    tone === "good" ? "text-emerald-500" : "text-foreground";

  return (
    <div className="kpi-card py-4 text-center print:!bg-gray-50 print:!border print:!border-gray-200">
      <div className="text-xs text-muted-foreground print:text-gray-600 mb-1">{label}</div>
      <div className={`text-3xl font-bold ${toneColor}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
        <span className="text-sm ml-1 text-muted-foreground print:text-gray-600 font-normal">{unit}</span>
      </div>
      {change !== undefined && prev !== undefined && (
        <div className="text-[11px] mt-1 flex items-center justify-center gap-1">
          {change > 0 ? <TrendingUp className="w-3 h-3 text-red-500" /> :
           change < 0 ? <TrendingDown className="w-3 h-3 text-emerald-500" /> :
           <Minus className="w-3 h-3 text-muted-foreground" />}
          <span className={change > 0 ? "text-red-500" : change < 0 ? "text-emerald-500" : "text-muted-foreground"}>
            {change > 0 ? "+" : ""}{change}% เทียบงวดก่อน
          </span>
        </div>
      )}
      {sub && <div className="text-[11px] mt-1 text-muted-foreground print:text-gray-600">{sub}</div>}
    </div>
  );
}

function Section({ title, icon, accent, children }: {
  title: string; icon: React.ReactNode;
  accent: "violet" | "emerald" | "red" | "amber" | "sky" | "orange" | "indigo";
  children: React.ReactNode;
}) {
  const colorMap: Record<string, string> = {
    violet: "text-violet-500 border-violet-500/20 bg-violet-500/5",
    emerald: "text-emerald-500 border-emerald-500/20 bg-emerald-500/5",
    red: "text-red-500 border-red-500/20 bg-red-500/5",
    amber: "text-amber-500 border-amber-500/20 bg-amber-500/5",
    sky: "text-sky-500 border-sky-500/20 bg-sky-500/5",
    orange: "text-orange-500 border-orange-500/20 bg-orange-500/5",
    indigo: "text-indigo-500 border-indigo-500/20 bg-indigo-500/5",
  };

  return (
    <section className="mb-6 print:break-inside-avoid">
      <h2 className={`text-base font-bold mb-3 inline-flex items-center gap-2 px-3 py-1 rounded-full border ${colorMap[accent]}`}>
        {icon} {title}
      </h2>
      <div className="pl-1">{children}</div>
    </section>
  );
}
