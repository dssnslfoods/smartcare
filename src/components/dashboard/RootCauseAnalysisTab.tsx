import { useState, useEffect, useMemo } from "react";
import { Loader2, Microscope, GitBranch, ArrowUpRight, BarChart3, Network, Layers, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, Treemap, Sankey,
} from "recharts";

interface RootCause {
  id: string;
  name: string;
  code: string | null;
}

interface ComplaintRC {
  id: string;
  complaint_number: string;
  complaint_date: string;
  root_cause_ids: string[] | null;
  root_cause_id: string | null;
  status: string | null;
  category_name: string | null;
  company_name: string | null;
  problem_type_name: string | null;
}

const COLORS = [
  "#22d3ee", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
];

const RC_COLORS: Record<string, string> = {
  "Man": "#22d3ee",
  "Machine": "#10b981",
  "Material": "#f59e0b",
  "Method": "#8b5cf6",
  "Environment": "#ef4444",
};

function getRcColor(name: string, idx: number): string {
  // Match by partial name
  for (const [key, color] of Object.entries(RC_COLORS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return COLORS[idx % COLORS.length];
}

export default function RootCauseAnalysisTab() {
  const [loading, setLoading] = useState(true);
  const [rootCauses, setRootCauses] = useState<RootCause[]>([]);
  const [complaints, setComplaints] = useState<ComplaintRC[]>([]);
  const [selectedRC, setSelectedRC] = useState<string | null>(null);
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);
  const [filterSelected, setFilterSelected] = useState<string[]>([]);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      const PAGE = 1000;

      // Fetch root causes (small table, no pagination needed)
      const rcRes = await supabase.from("root_causes").select("id, name, code").order("sort_order");
      setRootCauses(rcRes.data || []);

      // Fetch complaints with pagination to bypass Supabase 1,000-row limit
      const selectCols = `
        id, complaint_number, complaint_date, root_cause_ids, root_cause_id, status,
        categories:category_id(name),
        companies:company_id(name),
        problem_types:problem_type_id(name)
      `;
      let allRaw: any[] = [];
      let pageNum = 0;
      while (true) {
        const { data: chunk, error } = await supabase
          .from("complaints")
          .select(selectCols)
          .order("complaint_date", { ascending: false })
          .range(pageNum * PAGE, (pageNum + 1) * PAGE - 1);
        if (error || !chunk || chunk.length === 0) break;
        allRaw = allRaw.concat(chunk);
        if (chunk.length < PAGE) break;
        pageNum++;
      }

      setComplaints(
        allRaw.map((c: any) => ({
          id: c.id,
          complaint_number: c.complaint_number,
          complaint_date: c.complaint_date,
          root_cause_ids: Array.isArray(c.root_cause_ids) && c.root_cause_ids.length > 0
            ? c.root_cause_ids
            : c.root_cause_id ? [c.root_cause_id] : [],
          root_cause_id: c.root_cause_id,
          status: c.status,
          category_name: c.categories?.name || null,
          company_name: c.companies?.name || null,
          problem_type_name: c.problem_types?.name || null,
        }))
      );
      setLoading(false);
    }
    fetchAll();
  }, []);

  // Build root cause name map
  const rcMap = useMemo(() => {
    const m: Record<string, string> = {};
    rootCauses.forEach(rc => { m[rc.id] = rc.name; });
    return m;
  }, [rootCauses]);

  // Short name for display
  function shortName(name: string): string {
    const match = name.match(/^([A-Za-z]+)/);
    return match ? match[1] : name.slice(0, 8);
  }

  // ── 1. Distribution: exclusive (sole cause) vs combined (with others)
  const distribution = useMemo(() => {
    const excl: Record<string, number> = {};
    const comb: Record<string, number> = {};
    rootCauses.forEach(rc => { excl[rc.id] = 0; comb[rc.id] = 0; });
    complaints.forEach(c => {
      const ids = c.root_cause_ids || [];
      const isMulti = ids.length > 1;
      ids.forEach(rcId => {
        if (isMulti) comb[rcId] = (comb[rcId] || 0) + 1;
        else         excl[rcId] = (excl[rcId] || 0) + 1;
      });
    });
    return rootCauses.map((rc, i) => ({
      name: shortName(rc.name),
      fullName: rc.name,
      exclusive: excl[rc.id] || 0,
      combined:  comb[rc.id] || 0,
      count: (excl[rc.id] || 0) + (comb[rc.id] || 0),
      fill: getRcColor(rc.name, i),
      id: rc.id,
    })).sort((a, b) => b.count - a.count);
  }, [rootCauses, complaints]);

  // ── 2. Multi-cause stats
  const multiStats = useMemo(() => {
    const single = complaints.filter(c => (c.root_cause_ids || []).length === 1).length;
    const multi = complaints.filter(c => (c.root_cause_ids || []).length > 1).length;
    const none = complaints.filter(c => (c.root_cause_ids || []).length === 0).length;
    return { single, multi, none, total: complaints.length };
  }, [complaints]);

  // ── 3. Pair Analysis: which root causes appear together most often
  const pairAnalysis = useMemo(() => {
    const pairCounts: Record<string, number> = {};
    complaints.forEach(c => {
      const ids = (c.root_cause_ids || []).sort();
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const key = `${ids[i]}|${ids[j]}`;
          pairCounts[key] = (pairCounts[key] || 0) + 1;
        }
      }
    });
    return Object.entries(pairCounts)
      .map(([key, count]) => {
        const [id1, id2] = key.split("|");
        return {
          pair: `${shortName(rcMap[id1] || "?")} + ${shortName(rcMap[id2] || "?")}`,
          fullPair: `${rcMap[id1] || "?"} + ${rcMap[id2] || "?"}`,
          count,
          id1,
          id2,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [complaints, rcMap]);

  // ── 4. Root cause by category cross-analysis
  const rcByCategory = useMemo(() => {
    const matrix: Record<string, Record<string, number>> = {};
    const categories = new Set<string>();
    complaints.forEach(c => {
      const cat = c.category_name || "ไม่ระบุ";
      categories.add(cat);
      (c.root_cause_ids || []).forEach(rcId => {
        const rcName = shortName(rcMap[rcId] || "?");
        if (!matrix[cat]) matrix[cat] = {};
        matrix[cat][rcName] = (matrix[cat][rcName] || 0) + 1;
      });
    });
    const rcNames = rootCauses.map(rc => shortName(rc.name));
    return {
      data: Array.from(categories).map(cat => ({
        category: cat.length > 20 ? cat.slice(0, 18) + ".." : cat,
        ...Object.fromEntries(rcNames.map(n => [n, (matrix[cat] || {})[n] || 0])),
      })),
      rcNames,
    };
  }, [complaints, rcMap, rootCauses]);

  // ── 5. Drill-down: complaints filtered by selected RC
  const filteredComplaints = useMemo(() => {
    if (!selectedRC) return [];
    return complaints
      .filter(c => (c.root_cause_ids || []).includes(selectedRC))
      .slice(0, 20);
  }, [selectedRC, complaints]);

  // ── 6. Deep Dive: pattern analysis (exact combination grouping)
  const patternAnalysis = useMemo(() => {
    // Only multi-cause complaints
    const multi = complaints.filter(c => (c.root_cause_ids || []).length >= 2);

    // Group by sorted combination key
    const patternMap: Record<string, { pattern: string; ids: string[]; complaints: typeof multi; count: number }> = {};
    multi.forEach(c => {
      const sorted = [...(c.root_cause_ids || [])].sort();
      const key = sorted.join("|");
      const label = sorted.map(id => shortName(rcMap[id] || "?")).join(" + ");
      if (!patternMap[key]) patternMap[key] = { pattern: label, ids: sorted, complaints: [], count: 0 };
      patternMap[key].complaints.push(c);
      patternMap[key].count++;
    });

    return Object.values(patternMap)
      .sort((a, b) => b.count - a.count);
  }, [complaints, rcMap]);

  // Complexity breakdown: 1, 2, 3, 4+ causes
  const complexityDist = useMemo(() => {
    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    complaints.forEach(c => {
      const n = (c.root_cause_ids || []).length;
      if (n === 0) return;
      const key = n >= 4 ? 4 : n;
      dist[key] = (dist[key] || 0) + 1;
    });
    return [
      { label: "1 สาเหตุ", count: dist[1] || 0, color: "#22d3ee" },
      { label: "2 สาเหตุ", count: dist[2] || 0, color: "#10b981" },
      { label: "3 สาเหตุ", count: dist[3] || 0, color: "#f59e0b" },
      { label: "4+ สาเหตุ", count: dist[4] || 0, color: "#ef4444" },
    ];
  }, [complaints]);

  // ── 7. Custom filter result
  const customFilterResult = useMemo(() => {
    if (filterSelected.length === 0) return { matched: [], pct: 0 };
    const total = complaints.filter(c => (c.root_cause_ids || []).length > 0).length;
    // complaints that contain ALL selected causes
    const matched = complaints.filter(c =>
      filterSelected.every(id => (c.root_cause_ids || []).includes(id))
    );
    const pct = total > 0 ? (matched.length / total) * 100 : 0;

    // breakdown by exact pattern among matched
    const patternBreakdown: Record<string, { label: string; ids: string[]; count: number }> = {};
    matched.forEach(c => {
      const sorted = [...(c.root_cause_ids || [])].sort();
      const key = sorted.join("|");
      const label = sorted.map(id => shortName(rcMap[id] || "?")).join(" + ");
      if (!patternBreakdown[key]) patternBreakdown[key] = { label, ids: sorted, count: 0 };
      patternBreakdown[key].count++;
    });
    const breakdown = Object.values(patternBreakdown).sort((a, b) => b.count - a.count);

    return { matched, pct, breakdown, total };
  }, [filterSelected, complaints, rcMap]);

  // ── 8. Co-occurrence matrix (heatmap data)
  const coMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, number>> = {};
    rootCauses.forEach(rc1 => {
      matrix[rc1.id] = {};
      rootCauses.forEach(rc2 => { matrix[rc1.id][rc2.id] = 0; });
    });
    complaints.forEach(c => {
      const ids = c.root_cause_ids || [];
      ids.forEach(id1 => {
        ids.forEach(id2 => {
          if (id1 !== id2 && matrix[id1]) {
            matrix[id1][id2] = (matrix[id1][id2] || 0) + 1;
          }
        });
      });
    });
    return matrix;
  }, [complaints, rootCauses]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 glass-card rounded-2xl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">กำลังโหลดข้อมูล Root Cause...</span>
      </div>
    );
  }

  const maxPairCount = pairAnalysis.length > 0 ? pairAnalysis[0].count : 1;
  const maxCoOccurrence = Math.max(
    1,
    ...Object.values(coMatrix).flatMap(row => Object.values(row))
  );

  return (
    <div className="space-y-6">
      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="kpi-card kpi-card-gradient-cyan text-center py-5">
          <div className="kpi-value text-kpi-cyan text-3xl">{multiStats.total}</div>
          <div className="kpi-label mt-1">ข้อร้องเรียนทั้งหมด</div>
        </div>
        <div className="kpi-card kpi-card-gradient-green text-center py-5">
          <div className="kpi-value text-kpi-green text-3xl">{multiStats.single}</div>
          <div className="kpi-label mt-1">สาเหตุเดียว</div>
        </div>
        <div className="kpi-card kpi-card-gradient-yellow text-center py-5">
          <div className="kpi-value text-kpi-yellow text-3xl">{multiStats.multi}</div>
          <div className="kpi-label mt-1">หลายสาเหตุ</div>
        </div>
        <div className="kpi-card kpi-card-gradient-red text-center py-5">
          <div className="kpi-value text-kpi-red text-3xl">
            {multiStats.total > 0 ? ((multiStats.multi / multiStats.total) * 100).toFixed(1) : 0}%
          </div>
          <div className="kpi-label mt-1">อัตราหลายสาเหตุ</div>
        </div>
      </div>

      {/* ── Distribution + Pie ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart - stacked exclusive vs combined */}
        <div className="chart-card">
          <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            จำนวนข้อร้องเรียนตามสาเหตุ
          </h3>
          {/* Legend */}
          <div className="flex items-center gap-4 mb-3 ml-1">
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "#22d3ee" }} />
              สาเหตุเดียว (Exclusive)
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "#3b82f6" }} />
              ร่วมกับสาเหตุอื่น (Combined)
            </span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={distribution} layout="vertical" barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} allowDecimals={false} />
              <YAxis
                type="category" dataKey="name" width={75}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: number, name: string, props: any) => {
                  const total = (props.payload.exclusive || 0) + (props.payload.combined || 0);
                  const label = name === "exclusive" ? "สาเหตุเดียว" : "ร่วมกับสาเหตุอื่น";
                  return [`${value} รายการ (รวม ${total})`, label];
                }}
                labelFormatter={(label: string, payload: any[]) =>
                  payload?.[0]?.payload?.fullName || label
                }
              />
              <Bar dataKey="exclusive" stackId="a" name="exclusive" fill="#22d3ee" cursor="pointer"
                onClick={(data: any) => setSelectedRC(data.id === selectedRC ? null : data.id)}
              >
                {distribution.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={entry.fill}
                    opacity={selectedRC && selectedRC !== entry.id ? 0.25 : 1}
                  />
                ))}
              </Bar>
              <Bar dataKey="combined" stackId="a" name="combined" fill="#3b82f6" radius={[0, 5, 5, 0]} cursor="pointer"
                onClick={(data: any) => setSelectedRC(data.id === selectedRC ? null : data.id)}
              >
                {distribution.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill="#3b82f6"
                    opacity={selectedRC && selectedRC !== entry.id ? 0.15 : 0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-muted-foreground/60 mt-2 text-center">
            สีทึบ = สาเหตุเดียว · สีน้ำเงิน = ร่วมกับสาเหตุอื่น · คลิกแท่งเพื่อดูรายละเอียด
          </p>
        </div>

        {/* Pie chart */}
        <div className="chart-card">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Microscope className="w-4 h-4 text-emerald-400" />
            สัดส่วนสาเหตุ
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={distribution}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={100}
                paddingAngle={3}
                dataKey="count"
                nameKey="name"
                cursor="pointer"
                onClick={(data: any) => setSelectedRC(data.id === selectedRC ? null : data.id)}
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
                  if (percent < 0.05) return null;
                  const RADIAN = Math.PI / 180;
                  const radius = outerRadius + 22;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  return (
                    <text x={x} y={y} fill="hsl(var(--muted-foreground))" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={11}>
                      <tspan fontWeight="600" fill="hsl(var(--foreground))">{(percent * 100).toFixed(1)}%</tspan>
                      {" "}{name}
                    </text>
                  );
                }}
                labelLine={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
              >
                {distribution.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={entry.fill}
                    opacity={selectedRC && selectedRC !== entry.id ? 0.3 : 1}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: number, name: string, props: any) => {
                  const total = distribution.reduce((s, d) => s + d.count, 0);
                  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
                  return [`${value} รายการ (${pct}%)`, props.payload.fullName];
                }}
              />
              <Legend
                iconType="circle" iconSize={8}
                wrapperStyle={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Pair Analysis ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="chart-card">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-purple-400" />
            Pair Analysis — สาเหตุที่เกิดคู่กันบ่อย
          </h3>
          {pairAnalysis.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              ยังไม่มีข้อร้องเรียนที่มีหลายสาเหตุ
            </p>
          ) : (
            <div className="space-y-2.5">
              {pairAnalysis.map((pair, i) => (
                <div key={pair.pair} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground w-5">#{i + 1}</span>
                      <span className="text-sm font-medium text-foreground">{pair.pair}</span>
                    </div>
                    <span className="text-sm font-bold text-primary">{pair.count}</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(pair.count / maxPairCount) * 100}%`,
                        background: `linear-gradient(90deg, ${getRcColor(rcMap[pair.id1] || "", 0)}, ${getRcColor(rcMap[pair.id2] || "", 1)})`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground/50 mt-0.5">{pair.fullPair}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Co-occurrence Heatmap */}
        <div className="chart-card">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Network className="w-4 h-4 text-amber-400" />
            Co-occurrence Matrix
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="p-1.5 text-left text-muted-foreground font-medium"></th>
                  {rootCauses.map((rc, i) => (
                    <th key={rc.id} className="p-1.5 text-center text-muted-foreground font-medium" style={{ color: getRcColor(rc.name, i) }}>
                      {shortName(rc.name)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rootCauses.map((rc1, i) => (
                  <tr key={rc1.id}>
                    <td className="p-1.5 font-medium text-muted-foreground" style={{ color: getRcColor(rc1.name, i) }}>
                      {shortName(rc1.name)}
                    </td>
                    {rootCauses.map((rc2, j) => {
                      const val = rc1.id === rc2.id ? "-" : coMatrix[rc1.id]?.[rc2.id] || 0;
                      const intensity = typeof val === "number" ? val / maxCoOccurrence : 0;
                      return (
                        <td
                          key={rc2.id}
                          className="p-1.5 text-center font-mono transition-colors"
                          style={{
                            background: typeof val === "number" && val > 0
                              ? `rgba(16, 185, 129, ${Math.max(0.1, intensity * 0.7)})`
                              : "transparent",
                            color: typeof val === "number" && val > 0 ? "#fff" : "hsl(var(--muted-foreground))",
                            borderRadius: 4,
                          }}
                        >
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-muted-foreground/60 mt-3 text-center">
            แสดงจำนวนครั้งที่สาเหตุ 2 ตัวเกิดร่วมกัน — สีเข้ม = เกิดบ่อย
          </p>
        </div>
      </div>

      {/* ── Root Cause × Category Stacked Bar ── */}
      <div className="chart-card">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <ArrowUpRight className="w-4 h-4 text-cyan-400" />
          สาเหตุ × หมวดหมู่ (Stacked)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={rcByCategory.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis dataKey="category" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            {rcByCategory.rcNames.map((name, i) => (
              <Bar key={name} dataKey={name} stackId="a" fill={getRcColor(name, i)} radius={i === rcByCategory.rcNames.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Deep Dive: Multi-cause Pattern Analysis ── */}
      <div className="chart-card">
        <h3 className="text-sm font-semibold text-foreground mb-5 flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          Deep Dive — รูปแบบสาเหตุที่เกิดร่วมกัน
          <span className="text-xs font-normal text-muted-foreground ml-1">
            ({complaints.filter(c => (c.root_cause_ids || []).length >= 2).length} รายการที่มีหลายสาเหตุ)
          </span>
        </h3>

        {/* ── Custom Filter Card ── */}
        <div className="mb-6 p-4 rounded-xl border border-purple-500/20 bg-purple-500/5">
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-400 mb-3 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" /> เลือกสาเหตุเพื่อวิเคราะห์
            <span className="font-normal text-muted-foreground normal-case ml-1">(เลือกได้มากกว่า 1 ข้อ)</span>
          </p>

          {/* Cause selector */}
          <div className="flex flex-wrap gap-2 mb-4">
            {rootCauses.map((rc, i) => {
              const isOn = filterSelected.includes(rc.id);
              const color = getRcColor(rc.name, i);
              return (
                <button
                  key={rc.id}
                  onClick={() => setFilterSelected(prev =>
                    isOn ? prev.filter(id => id !== rc.id) : [...prev, rc.id]
                  )}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all"
                  style={{
                    borderColor: isOn ? color : "hsl(var(--border))",
                    background: isOn ? `${color}20` : "transparent",
                    color: isOn ? color : "hsl(var(--muted-foreground))",
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: isOn ? color : "hsl(var(--border))" }}
                  />
                  {shortName(rc.name)}
                </button>
              );
            })}
            {filterSelected.length > 0 && (
              <button
                onClick={() => setFilterSelected([])}
                className="px-3 py-1.5 rounded-full border border-border/40 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-all"
              >
                ล้างทั้งหมด
              </button>
            )}
          </div>

          {/* Result */}
          {filterSelected.length === 0 ? (
            <p className="text-sm text-muted-foreground/60 text-center py-2">
              เลือกสาเหตุด้านบนเพื่อดูผลการวิเคราะห์
            </p>
          ) : (
            <div className="space-y-4">
              {/* KPI row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-secondary/30 p-3 text-center">
                  <div className="text-2xl font-bold text-foreground">{customFilterResult.matched?.length ?? 0}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">รายการที่พบ</div>
                </div>
                <div className="rounded-xl bg-secondary/30 p-3 text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {(customFilterResult.pct ?? 0).toFixed(1)}%
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">ของข้อร้องเรียนทั้งหมด</div>
                </div>
                <div className="rounded-xl bg-secondary/30 p-3 text-center">
                  <div className="text-2xl font-bold text-foreground">{customFilterResult.breakdown?.length ?? 0}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">รูปแบบที่พบ</div>
                </div>
              </div>

              {/* Pattern breakdown */}
              {(customFilterResult.breakdown?.length ?? 0) > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] text-muted-foreground font-medium">รูปแบบสาเหตุที่พบในผลลัพธ์:</p>
                  {customFilterResult.breakdown!.map((b, i) => {
                    const maxB = customFilterResult.breakdown![0].count;
                    const bPct = customFilterResult.total! > 0
                      ? (b.count / customFilterResult.total!) * 100 : 0;
                    return (
                      <div key={b.label} className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-4">#{i + 1}</span>
                        <div className="flex flex-wrap gap-1 w-48">
                          {b.ids.map((id, idx) => (
                            <span
                              key={id}
                              className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                              style={{
                                background: `${getRcColor(rcMap[id] || "", idx)}20`,
                                color: getRcColor(rcMap[id] || "", idx),
                                border: `1px solid ${getRcColor(rcMap[id] || "", idx)}40`,
                              }}
                            >
                              {shortName(rcMap[id] || "?")}
                            </span>
                          ))}
                        </div>
                        <div className="flex-1 h-1.5 rounded-full bg-border/30 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-purple-500"
                            style={{ width: `${(b.count / maxB) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-foreground w-8 text-right">{b.count}</span>
                        <span className="text-[10px] text-muted-foreground w-12 text-right">
                          ({bPct.toFixed(1)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Complexity Distribution */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> จำนวนสาเหตุต่อรายการ
            </p>
            {complexityDist.map(d => {
              const total = complaints.filter(c => (c.root_cause_ids || []).length > 0).length;
              const pct = total > 0 ? (d.count / total) * 100 : 0;
              return (
                <div key={d.label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium" style={{ color: d.color }}>{d.label}</span>
                    <span className="text-sm font-bold text-foreground">
                      {d.count} <span className="text-xs text-muted-foreground font-normal">({pct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: d.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pattern Frequency Ranking */}
          <div className="lg:col-span-2 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5" /> รูปแบบที่พบบ่อย (จัดอันดับ)
            </p>
            {patternAnalysis.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">ยังไม่มีข้อมูลหลายสาเหตุ</p>
            ) : (
              <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                {patternAnalysis.map((p, i) => {
                  const maxCount = patternAnalysis[0].count;
                  const pct = (p.count / maxCount) * 100;
                  const isExpanded = expandedPattern === p.pattern;
                  return (
                    <div key={p.pattern} className="rounded-xl border border-border/30 overflow-hidden">
                      {/* Pattern header row */}
                      <div
                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-secondary/40 transition-colors"
                        onClick={() => setExpandedPattern(isExpanded ? null : p.pattern)}
                      >
                        <span className="text-[10px] font-mono text-muted-foreground w-5 shrink-0">#{i + 1}</span>

                        {/* Cause badges */}
                        <div className="flex flex-wrap gap-1 flex-1">
                          {p.ids.map((id, idx) => (
                            <span
                              key={id}
                              className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                              style={{
                                background: `${getRcColor(rcMap[id] || "", idx)}25`,
                                color: getRcColor(rcMap[id] || "", idx),
                                border: `1px solid ${getRcColor(rcMap[id] || "", idx)}50`,
                              }}
                            >
                              {shortName(rcMap[id] || "?")}
                            </span>
                          ))}
                        </div>

                        {/* Progress + count */}
                        <div className="flex items-center gap-2 shrink-0 w-36">
                          <div className="flex-1 h-1.5 rounded-full bg-border/30 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                background: `linear-gradient(90deg, ${getRcColor(rcMap[p.ids[0]] || "", 0)}, ${getRcColor(rcMap[p.ids[p.ids.length - 1]] || "", 1)})`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-bold text-foreground w-6 text-right">{p.count}</span>
                        </div>

                        {isExpanded
                          ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                      </div>

                      {/* Expanded: list of complaints with this pattern */}
                      {isExpanded && (
                        <div className="border-t border-border/20 bg-secondary/10 max-h-48 overflow-y-auto">
                          <table className="w-full text-[11px]">
                            <thead>
                              <tr className="border-b border-border/20">
                                <th className="px-3 py-1.5 text-left text-muted-foreground font-medium">เลขที่</th>
                                <th className="px-3 py-1.5 text-left text-muted-foreground font-medium">วันที่</th>
                                <th className="px-3 py-1.5 text-left text-muted-foreground font-medium">บริษัท</th>
                                <th className="px-3 py-1.5 text-left text-muted-foreground font-medium">สถานะ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {p.complaints.slice(0, 10).map(c => (
                                <tr key={c.id} className="border-b border-border/10 hover:bg-secondary/30 transition-colors">
                                  <td className="px-3 py-1.5 font-mono text-primary">{c.complaint_number}</td>
                                  <td className="px-3 py-1.5 text-muted-foreground">{c.complaint_date}</td>
                                  <td className="px-3 py-1.5 text-foreground">{c.company_name || "-"}</td>
                                  <td className="px-3 py-1.5">
                                    <span className={`status-badge text-[10px] ${c.status === "ปิดผู้ผลิต" ? "status-badge-success" : "status-badge-warning"}`}>
                                      {c.status || "-"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                              {p.complaints.length > 10 && (
                                <tr>
                                  <td colSpan={4} className="px-3 py-1.5 text-center text-muted-foreground">
                                    ... และอีก {p.complaints.length - 10} รายการ
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Drill-down Table ── */}
      {selectedRC && (
        <div className="chart-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Microscope className="w-4 h-4 text-emerald-400" />
              รายละเอียดข้อร้องเรียน — {rcMap[selectedRC] || "?"}
              <span className="text-xs text-muted-foreground font-normal">({filteredComplaints.length} รายการ)</span>
            </h3>
            <button
              onClick={() => setSelectedRC(null)}
              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md border border-border/40 hover:border-border transition-colors"
            >
              ปิด
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="p-2 text-left text-muted-foreground font-medium">เลขที่</th>
                  <th className="p-2 text-left text-muted-foreground font-medium">วันที่</th>
                  <th className="p-2 text-left text-muted-foreground font-medium">บริษัท</th>
                  <th className="p-2 text-left text-muted-foreground font-medium">หมวดหมู่</th>
                  <th className="p-2 text-left text-muted-foreground font-medium">ประเภทปัญหา</th>
                  <th className="p-2 text-left text-muted-foreground font-medium">สถานะ</th>
                  <th className="p-2 text-left text-muted-foreground font-medium">สาเหตุทั้งหมด</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map(c => (
                  <tr key={c.id} className="border-b border-border/15 hover:bg-secondary/30 transition-colors">
                    <td className="p-2 font-mono text-primary">{c.complaint_number}</td>
                    <td className="p-2 text-muted-foreground">{c.complaint_date}</td>
                    <td className="p-2 text-foreground">{c.company_name || "-"}</td>
                    <td className="p-2 text-foreground">{c.category_name || "-"}</td>
                    <td className="p-2 text-foreground">{c.problem_type_name || "-"}</td>
                    <td className="p-2">
                      <span className={`status-badge text-[10px] ${c.status === "ปิดผู้ผลิต" ? "status-badge-success" : "status-badge-warning"}`}>
                        {c.status || "-"}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1">
                        {(c.root_cause_ids || []).map((rcId, idx) => (
                          <span
                            key={rcId}
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                            style={{
                              background: `${getRcColor(rcMap[rcId] || "", idx)}20`,
                              color: getRcColor(rcMap[rcId] || "", idx),
                              border: `1px solid ${getRcColor(rcMap[rcId] || "", idx)}40`,
                            }}
                          >
                            {shortName(rcMap[rcId] || "?")}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
