import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Area, AreaChart
} from "recharts";
import type { CompanyData } from "@/data/mockData";
import KpiCards from "./KpiCards";

const STATUS_COLORS = ["#22c55e", "#ef4444", "#fbbf24"];
const PALETTE = ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"];

interface Props { data: CompanyData }

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

  return (
    <div>
      <KpiCards data={data} categoryGroups={categoryGroups} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <div className="chart-card">
          <div className="chart-title">
            <span className="chart-icon" style={{ background: "rgba(14,165,233,0.2)" }}>📊</span>
            สถานะ Complaint
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                dataKey="value" label={({ percent }) => `${(percent * 100).toFixed(1)}%`}>
                {statusData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title">
            <span className="chart-icon" style={{ background: "rgba(245,158,11,0.2)" }}>📋</span>
            หมวดหมู่ปัญหา
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                dataKey="value" label={({ percent }) => `${(percent * 100).toFixed(1)}%`}>
                {categoryData.map((_, i) => <Cell key={i} fill={PALETTE[i]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-card mb-5">
        <div className="chart-title">
          <span className="chart-icon" style={{ background: "rgba(139,92,246,0.2)" }}>📈</span>
          แนวโน้มจำนวน Complaint รายเดือน
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,19%,27%)" />
            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }} />
            <Area type="monotone" dataKey="calls" stroke="#0ea5e9" fill="rgba(14,165,233,0.15)" strokeWidth={2.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <div className="chart-title">
          <span className="chart-icon" style={{ background: "rgba(239,68,68,0.2)" }}>💡</span>
          สรุปข้อค้นพบสำคัญ (Executive Summary)
        </div>
        
        {(() => {
          // Sort problem types by count
          const sortedProblems = Object.entries(data.problem_type)
            .sort((a, b) => b[1] - a[1]);
          const totalRecords = data.kpi.total_records || 1;
          
          const top1Prob = sortedProblems[0];
          const top2Prob = sortedProblems[1];
          
          // Sort sub-problems by count
          const sortedSubProblems = Object.entries(data.sub_problem)
            .sort((a, b) => b[1] - a[1]);
          const top1Sub = sortedSubProblems[0];
          const top2Sub = sortedSubProblems[1];

          // Insight 1 Text
          let insight1Title = "ปัญหาหลักที่ต้องเร่งแก้ไข";
          let insight1Body = "";
          if (top1Prob) {
            const p1 = Math.round((top1Prob[1] / totalRecords) * 100);
            insight1Body = `${top1Prob[0]} (${top1Prob[1]} รายการ, ${p1}%)`;
            if (top2Prob) {
              const p2 = Math.round((top2Prob[1] / totalRecords) * 100);
              insight1Body += ` และ ${top2Prob[0]} (${top2Prob[1]} รายการ, ${p2}%)`;
            }
            insight1Body += " คือปัญหาลำดับแรกที่ควรให้ความสำคัญ";
            if (top1Sub) {
              insight1Body += ` โดยเฉพาะหัวข้อ "${top1Sub[0]}" (${top1Sub[1]} ครั้ง)`;
              if (top2Sub) insight1Body += ` และ "${top2Sub[0]}" (${top2Sub[1]} ครั้ง)`;
            }
          } else {
            insight1Body = "ยังไม่มีข้อมูลปัญหาเพียงพอสำหรับการวิเคราะห์";
          }

          // Insight 2: Close Rate Analysis
          const sortedCloseRates = Object.entries(data.close_rate_by_type)
            .filter(([_, info]) => info.total > 5) // Only consider significant samples
            .sort((a, b) => a[1].rate - b[1].rate);
          
          const worstCloseType = sortedCloseRates[0];
          const bestCloseType = sortedCloseRates[sortedCloseRates.length - 1];
          
          let insight2Title = "การจัดการเคสและประสิทธิภาพ";
          let insight2Body = "";
          if (worstCloseType) {
            insight2Body = `พบความล่าช้าในการปิดเคสกลุ่ม "${worstCloseType[0]}" โดยมีอัตราการปิดเพียง ${worstCloseType[1].rate}% `;
            insight2Body += `ซึ่งต่ำกว่าค่าเฉลี่ยรวม (${data.kpi.close_rate}%) อย่างมีนัยสำคัญ `;
            if (bestCloseType && bestCloseType !== worstCloseType) {
              insight2Body += `ในขณะที่กลุ่ม "${bestCloseType[0]}" มีประสิทธิภาพสูงสุดอยู่ที่ ${bestCloseType[1].rate}%`;
            }
          } else {
            insight2Body = `ปัจจุบันมีอัตราการปิดเคสรวมอยู่ที่ ${data.kpi.close_rate}% และใช้ระยะเวลาเฉลี่ย ${data.kpi.avg_response_days} วันในการดำเนินการ`;
          }

          // Insight 3: Critical Product Groups
          const sortedGroups = Object.entries(data.group)
            .sort((a, b) => b[1] - a[1]);
          const topGroup = sortedGroups[0];
          
          let insight3Title = "จุดเสี่ยงตามกลุ่มผลิตภัณฑ์";
          let insight3Body = "";
          if (topGroup) {
            const pG = Math.round((topGroup[1] / totalRecords) * 100);
            insight3Title = `กลุ่ม ${topGroup[0]} คือจุดที่พบ Complaint สูงสุด`;
            insight3Body = `กลุ่มผลิตภัณฑ์ ${topGroup[0]} พบรายการร้องเรียนสะสมถึง ${topGroup[1]} รายการ (${pG}%) ของทั้งหมด `;
            insight3Body += "ควรพิจารณาปรับปรุงมาตรฐานคุณภาพหรือขั้นตอนกำกับดูแลสำหรับกลุ่มสินค้านี้เพิ่มเติม";
          } else {
            insight3Body = "ไม่พบความผิดปกติที่กระจุกตัวในกลุ่มผลิตภัณฑ์ใดเป็นพิเศษ";
          }

          return (
            <>
              <div className="insight-box">
                <h4>1. {insight1Title}</h4>
                <p>{insight1Body}</p>
              </div>
              <div className="insight-box">
                <h4>2. {insight2Title}</h4>
                <p>{insight2Body}</p>
              </div>
              <div className="insight-box">
                <h4>3. {insight3Title}</h4>
                <p>{insight3Body}</p>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
