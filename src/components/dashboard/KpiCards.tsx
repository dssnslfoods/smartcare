import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Phone, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import type { CompanyData } from "@/data/mockData";

interface Props {
  data: CompanyData;
  categoryGroups: Record<string, number>;
}

function AnimatedNumber({ value, suffix = "", decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = ref.current;
    const diff = value - start;
    const duration = 800;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * eased;
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(animate);
      else ref.current = value;
    }
    requestAnimationFrame(animate);
  }, [value]);

  return <>{decimals > 0 ? display.toFixed(decimals) : Math.round(display)}{suffix}</>;
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 28;
  const w = 60;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={w} height={h} className="opacity-60">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
    </svg>
  );
}

const CATEGORY_ICONS: Record<string, string> = {
  "Recall": "bg-purple-500/20 text-purple-400",
  "Complaint Food Safety": "bg-red-500/20 text-red-400",
  "Complaint Food Quality": "bg-sky-500/20 text-sky-400",
  "Complaint Food Law": "bg-amber-500/20 text-amber-400",
  "Complaint Service": "bg-emerald-500/20 text-emerald-400",
};

export default function KpiCards({ data, categoryGroups }: Props) {
  const { kpi } = data;
  const sparkData = data.monthly_trend.map(m => m.calls);
  const notClosedPct = ((kpi.not_closed / (kpi.closed + kpi.not_closed)) * 100);

  return (
    <div className="space-y-5 mb-7">
      {/* Category Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(categoryGroups).map(([name, count]) => (
          <div key={name} className="kpi-card group text-center py-4">
            <div className={`w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center text-xs font-bold ${CATEGORY_ICONS[name] || "bg-slate-500/20 text-slate-400"}`}>
              {count}
            </div>
            <div className="kpi-value text-xl">{count}</div>
            <div className="kpi-label text-[11px] leading-tight">{name}</div>
          </div>
        ))}
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Complaints */}
        <div className="kpi-card kpi-card-gradient-cyan">
          <div className="flex items-start justify-between mb-3">
            <div className="kpi-icon-badge bg-cyan-500/15">
              <Phone className="w-4 h-4 text-cyan-400" />
            </div>
            <MiniSparkline data={sparkData} color="#22d3ee" />
          </div>
          <div className="kpi-value text-kpi-cyan text-3xl">
            <AnimatedNumber value={kpi.total_calls} />
          </div>
          <div className="kpi-label">จำนวน Complaint ทั้งหมด</div>
          <div className="text-[11px] text-cyan-400/70 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> {kpi.total_records} records
          </div>
        </div>

        {/* Close Rate */}
        <div className="kpi-card kpi-card-gradient-green">
          <div className="flex items-start justify-between mb-3">
            <div className="kpi-icon-badge bg-emerald-500/15">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-right">
              <div className="text-[10px] text-emerald-400/60 font-medium">TARGET 85%</div>
            </div>
          </div>
          <div className="kpi-value text-kpi-green text-3xl">
            <AnimatedNumber value={kpi.close_rate} suffix="%" decimals={1} />
          </div>
          <div className="kpi-label">อัตราปิดเคสผู้ผลิต</div>
          <div className="progress-track mt-3">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${kpi.close_rate}%`,
                background: kpi.close_rate >= 85
                  ? "linear-gradient(90deg, #22c55e, #4ade80)"
                  : kpi.close_rate >= 60
                    ? "linear-gradient(90deg, #eab308, #fbbf24)"
                    : "linear-gradient(90deg, #ef4444, #f87171)"
              }}
            />
          </div>
        </div>

        {/* Avg Response */}
        <div className="kpi-card kpi-card-gradient-yellow">
          <div className="flex items-start justify-between mb-3">
            <div className="kpi-icon-badge bg-amber-500/15">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="kpi-value text-kpi-yellow text-3xl">
            <AnimatedNumber value={kpi.avg_response_days} decimals={1} />
          </div>
          <div className="kpi-label">วันเฉลี่ยในการตอบกลับ</div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[11px] text-amber-400/70 px-2 py-0.5 rounded-full bg-amber-500/10">
              Median: {kpi.median_response_days} วัน
            </span>
          </div>
        </div>

        {/* Not Closed */}
        <div className="kpi-card kpi-card-gradient-red">
          <div className="flex items-start justify-between mb-3">
            <div className="kpi-icon-badge bg-red-500/15">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            {notClosedPct > 30 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-semibold animate-pulse">
                ALERT
              </span>
            )}
          </div>
          <div className="kpi-value text-kpi-red text-3xl">
            <AnimatedNumber value={kpi.not_closed} />
          </div>
          <div className="kpi-label">เคสที่ยังไม่ปิดผู้ผลิต</div>
          <div className="text-[11px] text-red-400/70 mt-1 flex items-center gap-1">
            <TrendingDown className="w-3 h-3" /> {notClosedPct.toFixed(1)}% ของทั้งหมด
          </div>
        </div>
      </div>
    </div>
  );
}
