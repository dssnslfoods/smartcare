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
        <div className="insight-box">
          <h4>1. ปัญหาหลักที่ต้องเร่งแก้ไข</h4>
          <p>สิ่งแปลกปลอม (186 รายการ, 43%) และคุณภาพสินค้า (159 รายการ, 37%) คือปัญหาสำคัญที่สุด โดยเฉพาะ "เส้นผม/เส้นขน" (60 ครั้ง) และ "ปริมาณสินค้าไม่ได้มาตรฐาน" (79 ครั้ง)</p>
        </div>
        <div className="insight-box">
          <h4>2. อัตราปิดเคสต่ำในด้านคุณภาพสินค้า</h4>
          <p>ด้านคุณภาพสินค้ามีอัตราปิดเพียง 17.6% ซึ่งต่ำกว่าค่าเฉลี่ย (55.9%) อย่างมาก สะท้อนปัญหาเชิงโครงสร้าง ขณะที่ด้านการขนส่งมีอัตราปิดสูง 98.7%</p>
        </div>
        <div className="insight-box">
          <h4>3. กลุ่ม PMA07 คือจุดวิกฤต</h4>
          <p>PMA07 มี Complaint สูงสุดถึง 195 รายการ (45%) ควรเน้นมาตรการควบคุมคุณภาพเพิ่มเติมในกลุ่มนี้เป็นลำดับแรก</p>
        </div>
      </div>
    </div>
  );
}
