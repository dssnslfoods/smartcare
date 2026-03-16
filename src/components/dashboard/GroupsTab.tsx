import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { Factory, Users, Grid3X3 } from "lucide-react";
import type { CompanyData } from "@/data/mockData";

const PALETTE = ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899", "#14b8a6", "#a855f7"];

interface Props { data: CompanyData }

const CDC_CODE = "CDC";

function applyGrouping(
  entries: [string, number][],
  codeMap: Record<string, string>,
  groupCDC: boolean
): { name: string; value: number }[] {
  if (!groupCDC) return entries.map(([name, value]) => ({ name, value }));

  let cdcTotal = 0;
  const rest: { name: string; value: number }[] = [];
  for (const [name, value] of entries) {
    if ((codeMap[name] || "").toUpperCase() === CDC_CODE) {
      cdcTotal += value;
    } else {
      rest.push({ name, value });
    }
  }
  const result = [...rest];
  if (cdcTotal > 0) result.unshift({ name: "CDC", value: cdcTotal });
  return result;
}

function applyMatrixGrouping(
  matrix: { group: string; problem: string; count: number }[],
  codeMap: Record<string, string>,
  groupCDC: boolean
): { group: string; problem: string; count: number }[] {
  if (!groupCDC) return matrix;

  const merged: Record<string, number> = {};
  for (const item of matrix) {
    const label = (codeMap[item.group] || "").toUpperCase() === CDC_CODE ? "CDC" : item.group;
    const key = `${label}|||${item.problem}`;
    merged[key] = (merged[key] || 0) + item.count;
  }
  return Object.entries(merged).map(([k, count]) => {
    const [group, problem] = k.split("|||");
    return { group, problem, count };
  });
}

export default function GroupsTab({ data }: Props) {
  const [groupCDC, setGroupCDC] = useState(false);
  const codeMap: Record<string, string> = (data as any).group_code_map || {};

  const hasCDC = Object.values(codeMap).some(c => c.toUpperCase() === CDC_CODE);

  const groupEntries = Object.entries(data.group).sort((a, b) => b[1] - a[1]);
  const groupData = applyGrouping(groupEntries, codeMap, groupCDC);

  const callerData = Object.entries(data.caller).map(([name, value]) => ({
    name: name.length > 20 ? name.substring(0, 20) + "..." : name, value
  }));

  const matrix = applyMatrixGrouping(data.group_problem_matrix, codeMap, groupCDC);
  const groups = [...new Set(matrix.map(x => x.group))].sort();
  const problems = [...new Set(matrix.map(x => x.problem))];

  const tooltipStyle = { background: "#1e293b", border: "1px solid #334155", borderRadius: 8 };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="chart-card">
          <div className="chart-title flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="chart-icon" style={{ background: "rgba(167,139,250,0.15)" }}><Factory className="w-3.5 h-3.5 text-violet-400" /></span>
              จำนวน Complaint ตามกลุ่มสินค้า
            </div>
            {hasCDC && (
              <button
                onClick={() => setGroupCDC(v => !v)}
                className={`text-xs px-3 py-1 rounded-full border transition-all font-semibold ${
                  groupCDC
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground border-border hover:border-primary hover:text-primary"
                }`}
              >
                {groupCDC ? "✓ รวม CDC" : "รวม CDC"}
              </button>
            )}
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={groupData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,19%,27%)" />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis type="category" dataKey="name" width={120} stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {groupData.map((entry, i) => (
                  <Cell key={i} fill={entry.name === "CDC" ? "#f59e0b" : PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title">
            <span className="chart-icon" style={{ background: "rgba(249,115,22,0.15)" }}><Users className="w-3.5 h-3.5 text-orange-400" /></span>
            ช่องทางการแจ้งปัญหา
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={callerData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,19%,27%)" />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis type="category" dataKey="name" width={150} stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {callerData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="chart-icon" style={{ background: "rgba(6,182,212,0.15)" }}><Grid3X3 className="w-3.5 h-3.5 text-cyan-400" /></span>
            Heatmap: กลุ่มสินค้า x ประเภทปัญหา
          </div>
          {hasCDC && (
            <button
              onClick={() => setGroupCDC(v => !v)}
              className={`text-xs px-3 py-1 rounded-full border transition-all font-semibold ${
                groupCDC
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-border hover:border-primary hover:text-primary"
              }`}
            >
              {groupCDC ? "✓ รวม CDC" : "รวม CDC"}
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          {(() => {
            const maxVal = Math.max(...matrix.map(x => x.count), 1);

            const getHeatColor = (val: number) => {
              if (val === 0) return "transparent";
              const ratio = val / maxVal;
              if (ratio < 0.3) return `rgba(6,182,212, ${0.4 + (ratio/0.3) * 0.4})`;
              if (ratio < 0.7) return `rgba(234,179,8, ${0.5 + ((ratio-0.3)/0.4) * 0.4})`;
              return `rgba(239,68,68, ${0.6 + ((ratio-0.7)/0.3) * 0.4})`;
            };

            return (
              <table className="heatmap-table">
                <thead>
                  <tr>
                    <th className="text-left p-2">กลุ่ม</th>
                    {problems.map(p => <th key={p}>{p}</th>)}
                    <th>รวม</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map(g => {
                    let rowTotal = 0;
                    return (
                      <tr key={g}>
                        <td className={`text-left font-medium ${g === "CDC" ? "text-amber-400" : "text-foreground"}`}>{g}</td>
                        {problems.map(p => {
                          const item = matrix.find(x => x.group === g && x.problem === p);
                          const val = item?.count || 0;
                          rowTotal += val;
                          const ratio = val / maxVal;
                          return (
                            <td key={p} style={{
                              background: getHeatColor(val),
                              color: ratio > 0.4 ? "#fff" : "rgba(255,255,255,0.7)",
                              fontWeight: ratio > 0.7 ? "700" : "400",
                              transition: "all 0.3s ease",
                              boxShadow: ratio > 0.8 ? "inset 0 0 10px rgba(0,0,0,0.2)" : "none"
                            }}>{val.toLocaleString()}</td>
                          );
                        })}
                        <td className="font-bold text-white bg-slate-800/80">{rowTotal.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
