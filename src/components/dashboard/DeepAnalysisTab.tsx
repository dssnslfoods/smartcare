import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import type { CompanyData } from "@/data/mockData";

interface Props { data: CompanyData }

export default function DeepAnalysisTab({ data }: Props) {
  const spEntries = Object.entries(data.sub_problem);
  const total = spEntries.reduce((s, [, v]) => s + v, 0);
  let cumul = 0;
  const paretoData = spEntries.map(([name, value]) => {
    cumul += value;
    return {
      name: name.length > 25 ? name.substring(0, 25) + "..." : name,
      count: value,
      cumPct: Math.round((cumul / total) * 100),
    };
  });

  const tooltipStyle = { background: "#1e293b", border: "1px solid #334155", borderRadius: 8 };

  return (
    <div className="space-y-5">
      <div className="chart-card">
        <div className="chart-title">
          <span className="chart-icon" style={{ background: "rgba(244,63,94,0.2)" }}>🔬</span>
          การวิเคราะห์เชิงลึก
        </div>

        <div className="insight-box">
          <h4>Pareto Analysis (80/20)</h4>
          <p>เพียง 3 ประเภทปัญหาย่อย ได้แก่ ปริมาณสินค้าไม่ได้มาตรฐาน (79), เส้นผม/เส้นขน (60), และส่งขาด (47) คิดเป็น 43% ของ Complaint ทั้งหมด</p>
        </div>

        <div className="insight-box">
          <h4>Root Cause Patterns</h4>
          <p>
            <strong>ด้านสิ่งแปลกปลอม (เส้นผม 60 ครั้ง):</strong> บ่งชี้ปัญหาด้าน GMP - ต้องตรวจสอบมาตรการสวมหมวกคลุมผม, ชุดปฏิบัติงาน<br />
            <strong>ด้านคุณภาพ (ปริมาณ 79 ครั้ง):</strong> สินค้าไม่ได้มาตรฐานด้านน้ำหนัก/ปริมาณ บ่งชี้ปัญหาจากกระบวนการบรรจุ<br />
            <strong>ด้านการขนส่ง (ส่งขาด 47 ครั้ง):</strong> ส่วนใหญ่มาจาก CDC ต้องตรวจสอบกระบวนการจัดส่ง
          </p>
        </div>

        <div className="insight-box">
          <h4>Risk Assessment Matrix</h4>
          <p>
            <span className="text-kpi-red font-semibold">ความเสี่ยงสูง:</span> Food Safety (76 เคส) + อัตราปิดต่ำในด้านคุณภาพ (17.6%)<br />
            <span className="text-kpi-yellow font-semibold">ความเสี่ยงกลาง:</span> สิ่งแปลกปลอมมีปริมาณมาก (186 เคส) แต่อัตราปิด 63.4%<br />
            <span className="text-kpi-green font-semibold">ความเสี่ยงต่ำ:</span> การขนส่งมีอัตราปิดสูง 98.7%
          </p>
        </div>

        <div className="insight-box">
          <h4>ข้อเสนอแนะเชิงกลยุทธ์</h4>
          <p>
            1. <strong>เร่งด่วน:</strong> ปรับปรุง GMP ใน PMA07 เพื่อลดสิ่งแปลกปลอม - คาดว่าจะลด Complaint ได้ 14%<br />
            2. <strong>ระยะสั้น:</strong> Calibrate เครื่องบรรจุทุกกลุ่มที่มีปัญหาปริมาณสินค้า - ลดได้ 18%<br />
            3. <strong>ระยะกลาง:</strong> ปรับปรุงกระบวนการ QC ด้านคุณภาพสินค้าเพื่อเพิ่มอัตราปิดเคสจาก 17.6% เป็นเป้าหมาย 50%<br />
            4. <strong>ระยะยาว:</strong> สร้างระบบ Early Warning ที่ติดตาม Complaint real-time
          </p>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title">
          <span className="chart-icon" style={{ background: "rgba(139,92,246,0.2)" }}>📊</span>
          Pareto Chart - สาเหตุหลักของ Complaint
        </div>
        <ResponsiveContainer width="100%" height={450}>
          <ComposedChart data={paretoData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,19%,27%)" />
            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={80} />
            <YAxis yAxisId="left" stroke="#94a3b8" />
            <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Bar yAxisId="left" dataKey="count" name="จำนวน" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            <Line yAxisId="right" dataKey="cumPct" name="สะสม %" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
