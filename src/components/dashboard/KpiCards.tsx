import type { CompanyData } from "@/data/mockData";

interface Props {
  data: CompanyData;
  categoryGroups: Record<string, number>;
}

export default function KpiCards({ data, categoryGroups }: Props) {
  const { kpi } = data;

  return (
    <div className="space-y-4 mb-7">
      {/* Category cards row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(categoryGroups).map(([name, count]) => (
          <div key={name} className="kpi-card text-center">
            <div className="kpi-value text-2xl text-foreground">{count}</div>
            <div className="kpi-label text-xs">{name}<br />(Case)</div>
          </div>
        ))}
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="kpi-value text-kpi-cyan">{kpi.total_calls}</div>
          <div className="kpi-label">จำนวน Complaint ทั้งหมด (Calls)</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value text-kpi-green">{kpi.close_rate}%</div>
          <div className="kpi-label">อัตราปิดเคสผู้ผลิต</div>
          <div className="progress-track mt-2">
            <div className="h-full rounded-full bg-kpi-green" style={{ width: `${kpi.close_rate}%` }} />
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value text-kpi-yellow">{kpi.avg_response_days}</div>
          <div className="kpi-label">วันเฉลี่ยในการตอบกลับ</div>
          <div className="text-xs text-kpi-yellow mt-1">Median: {kpi.median_response_days} วัน</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value text-kpi-red">{kpi.not_closed}</div>
          <div className="kpi-label">เคสที่ยังไม่ปิดผู้ผลิต</div>
          <div className="text-xs text-kpi-red mt-1">
            {((kpi.not_closed / (kpi.closed + kpi.not_closed)) * 100).toFixed(1)}% ของทั้งหมด
          </div>
        </div>
      </div>
    </div>
  );
}
