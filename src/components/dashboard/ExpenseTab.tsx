import { useEffect, useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, LabelList, ComposedChart, ReferenceLine,
} from "recharts";
import {
  Wallet, FileText, Calculator, TrendingUp, PieChart as PieIcon, BarChart3,
  Trophy, Table2, Search, ArrowUpDown, Users, Package, Layers, Building2, ArrowUp, ArrowDown, Loader2,
} from "lucide-react";
import type { CompanyData } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  buildExpenseSummary, groupExpenseCases, UNSPECIFIED_TYPE,
  type ExpenseCase, type ExpenseGroup, type ExpenseTypeRef,
} from "@/lib/expenseAnalytics";

interface Props { data: CompanyData }

const tooltipStyle = { background: "#1e293b", border: "1px solid #334155", borderRadius: 8 };
const TH_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const CATEGORY_COLORS: Record<string, string> = {
  "Food Safety": "#ef4444",
  "Food Quality": "#f59e0b",
  "Service": "#0ea5e9",
  "Food Law": "#8b5cf6",
  "Recall": "#22c55e",
};
const BAR_COLOR = "#3b82f6";

const baht = (n: number) => n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const bahtShort = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1_000_000) return `${(n / 1_000_000).toFixed(a >= 10_000_000 ? 0 : 1)}M`;
  if (a >= 1_000) return `${(n / 1_000).toFixed(a >= 10_000 ? 0 : 1)}K`;
  return n.toLocaleString("th-TH");
};
const fmtDate = (d: string | null) => {
  if (!d) return "-";
  const x = new Date(d);
  if (isNaN(x.getTime())) return "-";
  return `${String(x.getDate()).padStart(2, "0")}/${String(x.getMonth() + 1).padStart(2, "0")}/${x.getFullYear()}`;
};

type SortKey = "number" | "date" | "org" | "items" | "total";

export default function ExpenseTab({ data }: Props) {
  const [types, setTypes] = useState<ExpenseTypeRef[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "total", dir: "desc" });
  const [paretoLevel, setParetoLevel] = useState<"type" | "sub">("type");

  useEffect(() => {
    supabase.from("expense_types").select("id, name, sort_order").order("sort_order", { ascending: true })
      .then(({ data: rows, error }) => {
        if (error) console.error("Error fetching expense types:", error);
        setTypes((rows || []) as ExpenseTypeRef[]);
      });
  }, []);

  const summary = useMemo(
    () => buildExpenseSummary(data.raw_complaints || [], types || []),
    [data.raw_complaints, types],
  );

  const byCaller = useMemo(() => groupExpenseCases(summary.cases, c => c.raw?.callers?.name), [summary]);
  const byGroup = useMemo(() => groupExpenseCases(summary.cases, c => c.raw?.product_groups?.name), [summary]);
  const byOrg = useMemo(() => groupExpenseCases(summary.cases, c => `${c.company} / ${c.branch}`), [summary]);
  const pareto = useMemo(
    () => groupExpenseCases(summary.cases, c => paretoLevel === "type" ? c.raw?.problem_types?.name : c.raw?.problem_sub_types?.name),
    [summary, paretoLevel],
  );

  const top10Ids = useMemo(() => new Set(summary.cases.slice(0, 10).map(c => c.id)), [summary]);
  const selected = selectedId ? summary.cases.find(c => c.id === selectedId) || null : null;

  // Close the popup if the case drops out after a filter change
  useEffect(() => { if (selectedId && !selected) setSelectedId(null); }, [selectedId, selected]);

  const openCase = (id: string) => setSelectedId(id);

  if (!types) {
    return (
      <div className="flex items-center justify-center py-20 glass-card rounded-2xl">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">กำลังโหลดประเภทค่าใช้จ่าย...</span>
      </div>
    );
  }

  const monthlyData = summary.monthly.map(m => ({
    name: `${TH_MONTHS[m.month]} ${String((m.year + 543) % 100).padStart(2, "0")}`,
    total: m.total,
  }));
  const typesWithValue = summary.byType.filter(t => t.id !== null && t.value !== 0).length;
  const masterCount = types.length;
  const top10 = summary.cases.slice(0, 10).map(c => ({ id: c.id, name: c.number, total: c.total }));

  // Table rows
  const q = query.trim().toLowerCase();
  const rows = summary.cases
    .filter(c => !q || [c.number, c.company, c.branch, fmtDate(c.date)].some(v => v.toLowerCase().includes(q)))
    .sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      switch (sort.key) {
        case "number": return a.number.localeCompare(b.number) * dir;
        case "date": return ((a.date ? new Date(a.date).getTime() : 0) - (b.date ? new Date(b.date).getTime() : 0)) * dir;
        case "org": return `${a.company} ${a.branch}`.localeCompare(`${b.company} ${b.branch}`) * dir;
        case "items": return (a.lines.length - b.lines.length) * dir;
        default: return (a.total - b.total) * dir;
      }
    });
  const toggleSort = (key: SortKey) =>
    setSort(s => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "total" || key === "items" ? "desc" : "asc" });

  if (summary.caseCount === 0) {
    return (
      <div className="text-center py-20 glass-card rounded-2xl animate-fade-in">
        <Wallet className="w-10 h-10 mx-auto text-muted-foreground/60" />
        <p className="text-muted-foreground text-lg mt-3">ไม่พบเอกสารที่มีค่าใช้จ่าย</p>
        <p className="text-muted-foreground text-sm mt-1">ลองปรับเงื่อนไข Filter ด้านบน</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* 7. Complaint detail popup */}
      <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelectedId(null); }}>
        <DialogContent className="max-w-4xl w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl border-border/60 bg-[hsl(220_20%_9%)]">
          {selected && <CaseDetail c={selected} />}
        </DialogContent>
      </Dialog>

      {/* 1. KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Kpi icon={Wallet} color="sky" label="ค่าใช้จ่ายรวม" value={baht(summary.total)} unit="บาท" />
        <Kpi icon={FileText} color="green" label="จำนวน Case ที่มีค่าใช้จ่าย" value={summary.caseCount.toLocaleString()} unit="Case" />
        <Kpi icon={Calculator} color="yellow" label="ค่าใช้จ่ายเฉลี่ยต่อ Case" value={baht(summary.avgPerCase)} unit="บาท" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 2. Monthly trend */}
        <div className="chart-card">
          <div className="chart-title">
            <span className="chart-icon" style={{ background: "rgba(14,165,233,0.15)" }}><TrendingUp className="w-3.5 h-3.5 text-sky-400" /></span>
            Monthly Expense Trend — รายเดือน
          </div>
          <p className="text-xs text-muted-foreground -mt-3 mb-3">อ้างอิงตามวันที่เอกสาร Complaint (บาท)</p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={bahtShort} width={50} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${baht(v)} บาท`, "ค่าใช้จ่าย"]} />
              <Line type="monotone" dataKey="total" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 4, fill: "#38bdf8" }} activeDot={{ r: 6 }}>
                {monthlyData.length <= 12 && (
                  <LabelList dataKey="total" position="top" fill="#cbd5e1" fontSize={10} formatter={(v: number) => (v ? bahtShort(v) : "")} />
                )}
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 3. By problem category */}
        <div className="chart-card">
          <div className="chart-title">
            <span className="chart-icon" style={{ background: "rgba(139,92,246,0.15)" }}><PieIcon className="w-3.5 h-3.5 text-violet-400" /></span>
            Expense by Problem — ตามหมวดหมู่ Complaint
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-1/2" style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={summary.byProblem.filter(p => p.value > 0)} dataKey="value" nameKey="name"
                    innerRadius={70} outerRadius={110} strokeWidth={2} stroke="hsl(220 20% 7%)">
                    {summary.byProblem.filter(p => p.value > 0).map(p => (
                      <Cell key={p.name} fill={CATEGORY_COLORS[p.name] || "#64748b"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n: string) => [`${baht(v)} บาท`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[11px] text-muted-foreground">รวม</span>
                <span className="text-sm font-bold text-foreground">{bahtShort(summary.total)}</span>
                <span className="text-[11px] text-muted-foreground">บาท</span>
              </div>
            </div>
            <ul className="w-full sm:w-1/2 space-y-2">
              {summary.byProblem.map(p => (
                <li key={p.name} className="flex items-center gap-2 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[p.name] || "#64748b" }} />
                  <span className="flex-1 text-foreground">{p.name}</span>
                  <span className="tabular-nums text-muted-foreground text-xs">{baht(p.value)}</span>
                  <span className="tabular-nums font-semibold w-14 text-right">{p.pct.toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 4. By expense type */}
      <div className="chart-card">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <div className="chart-title !mb-0">
            <span className="chart-icon" style={{ background: "rgba(34,197,94,0.15)" }}><BarChart3 className="w-3.5 h-3.5 text-green-400" /></span>
            Expense by Category — ค่าใช้จ่ายตามประเภท
          </div>
          <span className="text-xs text-muted-foreground">
            เรียงมากไปน้อย (บาท) | มียอด {typesWithValue} จาก {masterCount} ประเภท | รวม {baht(summary.total)} บาท
          </span>
        </div>
        <ResponsiveContainer width="100%" height={Math.max(260, summary.byType.length * 34)}>
          <BarChart data={summary.byType} layout="vertical" margin={{ top: 0, right: 90, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} horizontal={false} />
            <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={bahtShort} />
            <YAxis type="category" dataKey="name" width={260} tick={{ fill: "#cbd5e1", fontSize: 12 }} interval={0} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(148,163,184,0.08)" }} formatter={(v: number) => [`${baht(v)} บาท`, "ค่าใช้จ่าย"]} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} minPointSize={2}>
              {summary.byType.map(t => <Cell key={t.name} fill={t.name === UNSPECIFIED_TYPE ? "#64748b" : BAR_COLOR} />)}
              <LabelList dataKey="value" position="right" fill="#cbd5e1" fontSize={11} formatter={(v: number) => baht(v)} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {summary.byType.some(t => t.name === UNSPECIFIED_TYPE) && (
          <p className="text-xs text-muted-foreground mt-2">
            “{UNSPECIFIED_TYPE}” คือรายการค่าใช้จ่ายเดิมที่ยังไม่ได้เลือกประเภทในฟอร์ม — แสดงไว้เพื่อให้ยอดรวมตรงกับ KPI
          </p>
        )}
      </div>

      {/* 4.1 Payer / product group */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RankCard
          icon={Users} tint="rgba(236,72,153,0.15)" iconCls="text-pink-400" color="#ec4899"
          title="Expense by Caller — ค่าใช้จ่ายตามผู้แจ้ง/ลูกค้า"
          subtitle="ผู้แจ้งรายใดทำให้เกิดค่าใช้จ่ายมากที่สุด (บาท)"
          groups={byCaller}
        />
        <RankCard
          icon={Package} tint="rgba(20,184,166,0.15)" iconCls="text-teal-400" color="#14b8a6"
          title="Expense by Product Group — ตามกลุ่มสินค้า"
          subtitle="กลุ่มสินค้าที่ก่อให้เกิดค่าใช้จ่ายสูง (บาท)"
          groups={byGroup}
        />
      </div>

      {/* 4.2 Pareto by problem type */}
      <div className="chart-card">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
          <div className="chart-title !mb-0">
            <span className="chart-icon" style={{ background: "rgba(249,115,22,0.15)" }}><Layers className="w-3.5 h-3.5 text-orange-400" /></span>
            Pareto — ค่าใช้จ่ายตามประเภทปัญหา
          </div>
          <div className="flex rounded-lg border border-border/50 p-0.5 text-xs">
            {([["type", "ประเภทปัญหา"], ["sub", "ปัญหาย่อย"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setParetoLevel(k)}
                className={`px-3 py-1 rounded-md transition-colors ${paretoLevel === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <ParetoNote groups={pareto} />
        <ParetoChart groups={pareto} />
      </div>

      {/* 4.3 Company / branch */}
      <OrgTable groups={byOrg} />

      {/* 5. Top 10 */}
      <div className="chart-card">
        <div className="chart-title">
          <span className="chart-icon" style={{ background: "rgba(245,158,11,0.15)" }}><Trophy className="w-3.5 h-3.5 text-amber-400" /></span>
          Top Expense Cases — Top {top10.length} เอกสารที่มีค่าใช้จ่ายสูงสุด
        </div>
        <p className="text-xs text-muted-foreground -mt-3 mb-3">เรียงตามยอดรวมต่อเอกสาร (บาท) | คลิกแท่งหรือเลขที่เอกสารเพื่อดูรายละเอียด</p>
        <ResponsiveContainer width="100%" height={Math.max(160, top10.length * 36)}>
          <BarChart data={top10} layout="vertical" margin={{ top: 0, right: 100, left: 10, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category" dataKey="name" width={190} interval={0}
              tick={({ x, y, payload, index }: any) => (
                <text x={x} y={y} dy={4} textAnchor="end" fontSize={12} fill="#7dd3fc"
                  style={{ cursor: "pointer", textDecoration: "underline" }}
                  onClick={() => openCase(top10[index].id)}>
                  {payload.value}
                </text>
              )}
            />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(148,163,184,0.08)" }} formatter={(v: number) => [`${baht(v)} บาท`, "ยอดรวม"]} />
            <Bar dataKey="total" fill={BAR_COLOR} radius={[0, 4, 4, 0]} style={{ cursor: "pointer" }}
              onClick={(d: any) => d?.id && openCase(d.id)}>
              <LabelList dataKey="total" position="right" fill="#cbd5e1" fontSize={11} formatter={(v: number) => baht(v)} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 6. Table */}
      <div className="chart-card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="chart-title !mb-0">
            <span className="chart-icon" style={{ background: "rgba(14,165,233,0.15)" }}><Table2 className="w-3.5 h-3.5 text-sky-400" /></span>
            Expense by Complaint — ค่าใช้จ่ายตามเลขที่เอกสาร
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-sky-500/30 border border-sky-500/50 align-middle mr-1" />แถบสีฟ้า = Top 10
            </span>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query} onChange={e => setQuery(e.target.value)}
                placeholder="ค้นหาเลขที่เอกสาร / บริษัท / สาขา"
                className="filter-select pl-8 w-64 max-w-full"
                style={{ backgroundImage: "none" }}
              />
            </div>
          </div>
        </div>
        <div className="overflow-auto max-h-[520px] rounded-xl border border-border/40">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-slate-800/95 backdrop-blur">
              <tr className="text-left text-xs text-slate-300">
                <Th label="เลขที่เอกสาร" k="number" sort={sort} onSort={toggleSort} />
                <Th label="วันที่เอกสาร" k="date" sort={sort} onSort={toggleSort} />
                <Th label="บริษัท/สาขา" k="org" sort={sort} onSort={toggleSort} />
                <Th label="จำนวนรายการ" k="items" sort={sort} onSort={toggleSort} align="center" />
                <Th label="ยอดรวม (บาท)" k="total" sort={sort} onSort={toggleSort} align="right" />
              </tr>
            </thead>
            <tbody>
              {rows.map(c => (
                <tr key={c.id} className={`border-t border-border/30 hover:bg-white/5 ${top10Ids.has(c.id) ? "bg-sky-500/10" : ""}`}>
                  <td className="px-3 py-2">
                    <button onClick={() => openCase(c.id)} className="text-sky-300 hover:text-sky-200 underline underline-offset-2 font-medium text-left">
                      {c.number}
                    </button>
                  </td>
                  <td className="px-3 py-2 tabular-nums text-muted-foreground">{fmtDate(c.date)}</td>
                  <td className="px-3 py-2">{c.company} / {c.branch}</td>
                  <td className="px-3 py-2 text-center tabular-nums">{c.lines.length}</td>
                  <td className={`px-3 py-2 text-right tabular-nums ${top10Ids.has(c.id) ? "font-semibold" : ""}`}>{baht(c.total)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">ไม่พบเอกสารที่ตรงกับคำค้นหา</td></tr>
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot className="sticky bottom-0 bg-slate-800/95">
                <tr className="border-t border-border/50 font-semibold">
                  <td className="px-3 py-2" colSpan={3}>รวม {rows.length.toLocaleString()} เอกสาร</td>
                  <td className="px-3 py-2 text-center tabular-nums">{rows.reduce((s, c) => s + c.lines.length, 0)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{baht(rows.reduce((s, c) => s + c.total, 0))}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

const MAX_RANK = 8;

/** Top N groups, the rest folded into "อื่นๆ" so the chart still sums to the total. */
function foldTail(groups: ExpenseGroup[], max = MAX_RANK): ExpenseGroup[] {
  if (groups.length <= max) return groups;
  const head = groups.slice(0, max - 1);
  const tail = groups.slice(max - 1);
  const value = tail.reduce((s, g) => s + g.value, 0);
  const count = tail.reduce((s, g) => s + g.count, 0);
  return [...head, { name: `อื่นๆ (${tail.length})`, count, value, avg: value / count, pct: tail.reduce((s, g) => s + g.pct, 0), cumPct: 100 }];
}

function RankCard({ icon: Icon, tint, iconCls, color, title, subtitle, groups }: {
  icon: any; tint: string; iconCls: string; color: string; title: string; subtitle: string; groups: ExpenseGroup[];
}) {
  const rows = foldTail(groups).map(g => ({ ...g, label: `${bahtShort(g.value)} · ${g.pct.toFixed(1)}% · ${g.count} Case` }));
  return (
    <div className="chart-card">
      <div className="chart-title">
        <span className="chart-icon" style={{ background: tint }}><Icon className={`w-3.5 h-3.5 ${iconCls}`} /></span>
        {title}
      </div>
      <p className="text-xs text-muted-foreground -mt-3 mb-3">{subtitle}</p>
      <ResponsiveContainer width="100%" height={Math.max(160, rows.length * 38)}>
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 150, left: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={130} interval={0} tick={{ fill: "#cbd5e1", fontSize: 12 }} />
          <Tooltip
            contentStyle={tooltipStyle} cursor={{ fill: "rgba(148,163,184,0.08)" }}
            formatter={(v: number, _n, p: any) => [`${baht(v)} บาท (${p.payload.pct.toFixed(1)}%) · ${p.payload.count} Case · เฉลี่ย ${baht(p.payload.avg)}`, "ค่าใช้จ่าย"]}
          />
          <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} minPointSize={2}>
            <LabelList dataKey="label" content={NoWrapRightLabel} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Recharts wraps label text to the bar's width, which breaks on short bars; draw it on one line. */
function NoWrapRightLabel({ x, y, width, height, value }: any) {
  return (
    <text x={x + width + 6} y={y + height / 2} dominantBaseline="central" fill="#cbd5e1" fontSize={11}>
      {value}
    </text>
  );
}

function ParetoNote({ groups }: { groups: ExpenseGroup[] }) {
  if (!groups.length) return null;
  const n80 = groups.findIndex(g => g.cumPct >= 80) + 1;
  return (
    <p className="text-xs text-muted-foreground mb-3">
      แท่ง = ค่าใช้จ่าย (บาท) · เส้น = สัดส่วนสะสม (%) ·{" "}
      <span className="text-orange-300 font-medium">
        {n80} จาก {groups.length} ประเภท คิดเป็น {groups[n80 - 1].cumPct.toFixed(1)}% ของค่าใช้จ่ายทั้งหมด
      </span>
    </p>
  );
}

function ParetoChart({ groups }: { groups: ExpenseGroup[] }) {
  const rows = groups.map(g => ({ ...g, short: g.name.length > 22 ? `${g.name.slice(0, 21)}…` : g.name }));
  return (
    <ResponsiveContainer width="100%" height={360}>
      <ComposedChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
        <XAxis dataKey="short" interval={0} angle={-35} textAnchor="end" height={110} tick={{ fill: "#cbd5e1", fontSize: 11 }} />
        <YAxis yAxisId="v" tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={bahtShort} width={50} />
        <YAxis yAxisId="p" orientation="right" domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={v => `${v}%`} width={40} />
        <Tooltip
          contentStyle={tooltipStyle} cursor={{ fill: "rgba(148,163,184,0.08)" }}
          labelFormatter={(_l, p: any) => p?.[0]?.payload?.name}
          formatter={(v: number, n: string, p: any) => n === "cumPct"
            ? [`${v.toFixed(1)}%`, "สัดส่วนสะสม"]
            : [`${baht(v)} บาท (${p.payload.pct.toFixed(1)}%) · ${p.payload.count} Case`, "ค่าใช้จ่าย"]}
        />
        <ReferenceLine yAxisId="p" y={80} stroke="#f97316" strokeDasharray="4 4" label={{ value: "80%", fill: "#fdba74", fontSize: 11, position: "insideTopRight" }} />
        <Bar yAxisId="v" dataKey="value" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
        <Line yAxisId="p" dataKey="cumPct" stroke="#f97316" strokeWidth={2} dot={{ r: 3, fill: "#f97316" }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function OrgTable({ groups }: { groups: ExpenseGroup[] }) {
  const maxValue = Math.max(...groups.map(g => g.value), 1);
  const maxAvg = Math.max(...groups.map(g => g.avg), 1);
  return (
    <div className="chart-card">
      <div className="chart-title">
        <span className="chart-icon" style={{ background: "rgba(99,102,241,0.15)" }}><Building2 className="w-3.5 h-3.5 text-indigo-400" /></span>
        Expense by Company / Branch — จำนวนเคส เทียบ มูลค่า
      </div>
      <p className="text-xs text-muted-foreground -mt-3 mb-3">ใช้แยกสาขาที่ “เคสน้อยแต่มูลค่าสูง” ออกจากสาขาที่ “เคสมากแต่มูลค่าต่ำ”</p>
      <div className="overflow-x-auto rounded-xl border border-border/40">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-slate-800/95 text-xs text-slate-300">
            <tr>
              <th className="px-3 py-2.5 text-left">บริษัท / สาขา</th>
              <th className="px-3 py-2.5 text-center">จำนวน Case</th>
              <th className="px-3 py-2.5 text-left w-[30%]">ยอดรวม (บาท)</th>
              <th className="px-3 py-2.5 text-left w-[30%]">เฉลี่ยต่อ Case (บาท)</th>
            </tr>
          </thead>
          <tbody>
            {groups.map(g => (
              <tr key={g.name} className="border-t border-border/30">
                <td className="px-3 py-2">{g.name}</td>
                <td className="px-3 py-2 text-center tabular-nums">{g.count}</td>
                <td className="px-3 py-2">
                  <InlineBar value={g.value} max={maxValue} color="#3b82f6" text={`${baht(g.value)} (${g.pct.toFixed(1)}%)`} />
                </td>
                <td className="px-3 py-2">
                  <InlineBar value={g.avg} max={maxAvg} color="#f59e0b" text={baht(g.avg)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InlineBar({ value, max, color, text }: { value: number; max: number; color: string; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.max(1, (value / max) * 100)}%`, background: color }} />
      </div>
      <span className="tabular-nums text-xs whitespace-nowrap w-40 text-right">{text}</span>
    </div>
  );
}

const KPI_STYLES = {
  sky: { border: "kpi-card-gradient-cyan", bg: "rgba(14,165,233,0.15)", text: "text-sky-400" },
  green: { border: "kpi-card-gradient-green", bg: "rgba(34,197,94,0.15)", text: "text-green-400" },
  yellow: { border: "kpi-card-gradient-yellow", bg: "rgba(245,158,11,0.15)", text: "text-amber-400" },
};

function Kpi({ icon: Icon, color, label, value, unit }: { icon: any; color: keyof typeof KPI_STYLES; label: string; value: string; unit: string }) {
  const s = KPI_STYLES[color];
  return (
    <div className={`chart-card !p-5 ${s.border}`}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="chart-icon" style={{ background: s.bg }}><Icon className={`w-3.5 h-3.5 ${s.text}`} /></span>
        {label}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl xl:text-3xl font-bold text-foreground tabular-nums">{value}</span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

function Th({ label, k, sort, onSort, align = "left" }: {
  label: string; k: SortKey; sort: { key: SortKey; dir: "asc" | "desc" }; onSort: (k: SortKey) => void; align?: "left" | "center" | "right";
}) {
  const active = sort.key === k;
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th className={`px-3 py-2.5 font-semibold text-${align}`}>
      <button onClick={() => onSort(k)} className={`inline-flex items-center gap-1 hover:text-white ${active ? "text-white" : ""}`}>
        {label}<Icon className="w-3 h-3 opacity-70" />
      </button>
    </th>
  );
}

function CaseDetail({ c }: { c: ExpenseCase }) {
  const r = c.raw || {};
  const field = (label: string, value?: string | null) => (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm text-foreground mt-0.5 whitespace-pre-wrap break-words">{value || "-"}</div>
    </div>
  );
  return (
    <div className="space-y-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 pr-8">
        <div className="min-w-0">
          <DialogTitle className="text-2xl md:text-3xl font-bold text-foreground break-all">{c.number}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">{fmtDate(c.date)} · {c.company} / {c.branch}</DialogDescription>
          <div className="flex gap-2 mt-3 flex-wrap">
            <span className="status-badge bg-primary/10 text-primary border border-primary/20">ความสำคัญ: {r.priority || "-"}</span>
            <span className="status-badge bg-primary/10 text-primary border border-primary/20">สถานะ: {r.status || "-"}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">ค่าใช้จ่ายรวมของเอกสาร</div>
          <div className="text-2xl md:text-3xl font-bold text-sky-300 tabular-nums">{baht(c.total)} <span className="text-sm text-muted-foreground font-normal">บาท</span></div>
          <div className="text-xs text-muted-foreground">{c.lines.length} รายการค่าใช้จ่าย</div>
        </div>
      </div>

      <div className="chart-card !p-5">
        <div className="chart-title">ข้อมูล Complaint</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {field("กลุ่มสินค้า", r.product_groups?.name)}
          {field("หมวดหมู่", r.categories?.name)}
          {field("ประเภทปัญหา", r.problem_types?.name)}
          {field("ประเภทปัญหาย่อย", r.problem_sub_types?.name)}
          {field("ผู้แจ้ง", r.callers?.name)}
          {field("สถานะ", r.status)}
          <div className="md:col-span-2">{field("รายละเอียดปัญหา", r.description)}</div>
        </div>
      </div>

      <div className="chart-card !p-5">
        <div className="chart-title !mb-1">รายการค่าใช้จ่าย</div>
        <p className="text-xs text-muted-foreground mb-3">{c.lines.length} รายการค่าใช้จ่าย</p>
        <div className="overflow-x-auto rounded-xl border border-border/40">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/95 text-xs text-slate-300">
              <tr>
                <th className="px-3 py-2.5 text-center w-14">ลำดับ</th>
                <th className="px-3 py-2.5 text-left">ประเภทค่าใช้จ่าย</th>
                <th className="px-3 py-2.5 text-left">รายละเอียด</th>
                <th className="px-3 py-2.5 text-right">จำนวนเงิน (บาท)</th>
              </tr>
            </thead>
            <tbody>
              {c.lines.map((l, i) => (
                <tr key={i} className="border-t border-border/30">
                  <td className="px-3 py-2 text-center tabular-nums">{i + 1}</td>
                  <td className={`px-3 py-2 ${l.typeId ? "" : "text-muted-foreground italic"}`}>{l.typeName}</td>
                  <td className="px-3 py-2 text-muted-foreground">{l.detail || "-"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{baht(l.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border/50 bg-white/5 font-semibold">
                <td />
                <td className="px-3 py-2" colSpan={2}>รวมค่าใช้จ่าย</td>
                <td className="px-3 py-2 text-right tabular-nums text-sky-300">{baht(c.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

