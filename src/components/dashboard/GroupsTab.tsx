import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import type { CompanyData } from "@/data/mockData";

const PALETTE = ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899", "#14b8a6", "#a855f7"];

interface Props { data: CompanyData }

export default function GroupsTab({ data }: Props) {
  const groupData = Object.entries(data.group).map(([name, value]) => ({ name, value }));
  const callerData = Object.entries(data.caller).map(([name, value]) => ({
    name: name.length > 20 ? name.substring(0, 20) + "..." : name, value
  }));

  const groups = [...new Set(data.group_problem_matrix.map(x => x.group))].sort();
  const problems = [...new Set(data.group_problem_matrix.map(x => x.problem))];

  const tooltipStyle = { background: "#1e293b", border: "1px solid #334155", borderRadius: 8 };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="chart-card">
          <div className="chart-title">
            <span className="chart-icon" style={{ background: "rgba(167,139,250,0.2)" }}>🏭</span>
            จำนวน Complaint ตามกลุ่มสินค้า
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={groupData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,19%,27%)" />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis type="category" dataKey="name" width={120} stroke="#94a3b8" />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {groupData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title">
            <span className="chart-icon" style={{ background: "rgba(249,115,22,0.2)" }}>👤</span>
            ผู้แจ้ง Complaint
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
        <div className="chart-title">
          <span className="chart-icon" style={{ background: "rgba(6,182,212,0.2)" }}>🗺️</span>
          Heatmap: กลุ่มสินค้า x ประเภทปัญหา
        </div>
        <div className="overflow-x-auto">
          {(() => {
            const maxVal = Math.max(...data.group_problem_matrix.map(x => x.count), 1);
            
            const getHeatColor = (val: number) => {
              if (val === 0) return "transparent";
              const ratio = val / maxVal;
              // Modern heatmap palette: Cyan (Low) -> Yellow (Mid) -> Crimson (High)
              if (ratio < 0.3) return `rgba(6,182,212, ${0.4 + (ratio/0.3) * 0.4})`; // Cyan scale
              if (ratio < 0.7) return `rgba(234,179,8, ${0.5 + ((ratio-0.3)/0.4) * 0.4})`; // Yellow/Gold
              return `rgba(239,68,68, ${0.6 + ((ratio-0.7)/0.3) * 0.4})`; // Red/Crimson
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
                        <td className="text-left font-medium text-foreground">{g}</td>
                        {problems.map(p => {
                          const item = data.group_problem_matrix.find(x => x.group === g && x.problem === p);
                          const val = item?.count || 0;
                          rowTotal += val;
                          const ratio = val / maxVal;
                          const bg = getHeatColor(val);
                          
                          return (
                            <td key={p} style={{
                              background: bg,
                              color: ratio > 0.4 ? "#fff" : "rgba(255,255,255,0.7)",
                              fontWeight: ratio > 0.7 ? "700" : "400",
                              transition: "all 0.3s ease",
                              boxShadow: ratio > 0.8 ? "inset 0 0 10px rgba(0,0,0,0.2)" : "none"
                            }}>{val}</td>
                          );
                        })}
                        <td className="font-bold text-white bg-slate-800/80">
                          {rowTotal}
                        </td>
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
