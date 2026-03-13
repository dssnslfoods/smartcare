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
                      const intensity = Math.min(val / 106, 1);
                      const bg = val === 0
                        ? "hsl(217,33%,17%)"
                        : `rgba(14,165,233,${0.15 + intensity * 0.85})`;
                      return (
                        <td key={p} style={{
                          background: bg,
                          color: intensity > 0.5 ? "#fff" : "#94a3b8"
                        }}>{val}</td>
                      );
                    })}
                    <td className="font-bold text-foreground" style={{ background: "hsl(215,19%,27%)" }}>
                      {rowTotal}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
