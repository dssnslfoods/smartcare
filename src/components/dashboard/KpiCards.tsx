import { useEffect, useRef, useState } from "react";
import {
  TrendingUp, TrendingDown, Phone, CheckCircle2, AlertTriangle,
  Award, Shield, Headphones, Scale, RotateCcw, Tag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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

  return <>{decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString()}{suffix}</>;
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

type CategoryStyle = { icon: LucideIcon; cls: string };

const CATEGORY_ICONS: Record<string, CategoryStyle> = {
  "Recall": { icon: RotateCcw, cls: "bg-purple-500/20 text-purple-400" },
  "Food Safety": { icon: Shield, cls: "bg-red-500/20 text-red-400" },
  "Food Quality": { icon: Award, cls: "bg-sky-500/20 text-sky-400" },
  "Food Law": { icon: Scale, cls: "bg-amber-500/20 text-amber-400" },
  "Service": { icon: Headphones, cls: "bg-emerald-500/20 text-emerald-400" },
  "Complaint Food Safety": { icon: Shield, cls: "bg-red-500/20 text-red-400" },
  "Complaint Food Quality": { icon: Award, cls: "bg-sky-500/20 text-sky-400" },
  "Complaint Food Law": { icon: Scale, cls: "bg-amber-500/20 text-amber-400" },
  "Complaint Service": { icon: Headphones, cls: "bg-emerald-500/20 text-emerald-400" },
};

const FALLBACK_CLASSES = [
  "bg-sky-500/20 text-sky-400",
  "bg-emerald-500/20 text-emerald-400",
  "bg-amber-500/20 text-amber-400",
  "bg-purple-500/20 text-purple-400",
  "bg-red-500/20 text-red-400",
];

export default function KpiCards({ data, categoryGroups }: Props) {
  const { kpi } = data;
  const sparkData = data.monthly_trend.map(m => m.calls);
  const notClosedPct = ((kpi.not_closed / (kpi.closed + kpi.not_closed)) * 100);

  return (
    <div className="space-y-5 mb-7">
      {/* Category Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(categoryGroups).map(([name, count], idx) => {
          const style = CATEGORY_ICONS[name];
          const Icon = style?.icon ?? Tag;
          const cls = style?.cls ?? FALLBACK_CLASSES[idx % FALLBACK_CLASSES.length];
          return (
            <div key={name} className="kpi-card group text-center py-4">
              <div className={`w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center ${cls}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="kpi-value text-xl">{count.toLocaleString()}</div>
              <div className="kpi-label text-[11px] leading-tight">{name}</div>
            </div>
          );
        })}
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <TrendingUp className="w-3 h-3" /> {kpi.total_records.toLocaleString()} records
          </div>
        </div>

        {/* Closed Count */}
        <div className="kpi-card kpi-card-gradient-green">
          <div className="flex items-start justify-between mb-3">
            <div className="kpi-icon-badge bg-emerald-500/15">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="kpi-value text-kpi-green text-3xl">
            <AnimatedNumber value={kpi.closed} />
          </div>
          <div className="kpi-label">จำนวนปิดเคสผู้ผลิต</div>
          <div className="text-[11px] text-emerald-400/70 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {kpi.close_rate.toFixed(1)}% ของทั้งหมด
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
