import { useState, useEffect, useCallback, useRef } from "react";
import {
  Tv, X, Play, Pause, ChevronLeft, ChevronRight,
  LayoutDashboard, TrendingUp, AlertTriangle, Factory,
  Timer, Microscope, MapPin, CheckCircle2, Clock, Phone,
} from "lucide-react";
import type { CompanyData } from "@/data/mockData";
import OverviewTab from "./OverviewTab";
import TrendsTab from "./TrendsTab";
import ProblemsTab from "./ProblemsTab";
import GroupsTab from "./GroupsTab";
import PerformanceTab from "./PerformanceTab";
import DeepAnalysisTab from "./DeepAnalysisTab";
import MapTab from "./MapTab";

const TABS = [
  { id: "overview",     label: "ภาพรวม",              icon: LayoutDashboard },
  { id: "trends",       label: "แนวโน้ม",              icon: TrendingUp },
  { id: "problems",     label: "ประเภทปัญหา",          icon: AlertTriangle },
  { id: "groups",       label: "กลุ่มสินค้า",          icon: Factory },
  { id: "performance",  label: "ประสิทธิภาพ",          icon: Timer },
  { id: "deep",         label: "วิเคราะห์เชิงลึก",     icon: Microscope },
  { id: "map",          label: "แผนที่ CDC",            icon: MapPin },
];

const INTERVALS = [10, 15, 30, 60];

interface Props {
  data: CompanyData;
  count: number;
  onExit: () => void;
}

export default function TVMode({ data, count, onExit }: Props) {
  const [activeTab, setActiveTab] = useState("overview");
  const [autoPlay, setAutoPlay] = useState(true);
  const [intervalSec, setIntervalSec] = useState(15);
  const [progress, setProgress] = useState(0);
  const [now, setNow] = useState(new Date());
  const [fade, setFade] = useState(true);

  const tabIds = TABS.map(t => t.id);

  /* ── live clock ── */
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ── transition helper ── */
  const switchTab = useCallback((id: string) => {
    setFade(false);
    setTimeout(() => { setActiveTab(id); setProgress(0); setFade(true); }, 180);
  }, []);

  const nextTab = useCallback(() => {
    setActiveTab(cur => {
      const idx = tabIds.indexOf(cur);
      const next = tabIds[(idx + 1) % tabIds.length];
      switchTab(next);
      return cur; // actual update happens in switchTab
    });
  }, [tabIds, switchTab]);

  const prevTab = useCallback(() => {
    setActiveTab(cur => {
      const idx = tabIds.indexOf(cur);
      const prev = tabIds[(idx - 1 + tabIds.length) % tabIds.length];
      switchTab(prev);
      return cur;
    });
  }, [tabIds, switchTab]);

  /* ── keyboard shortcuts ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExit();
      if (e.key === "ArrowRight") nextTab();
      if (e.key === "ArrowLeft")  prevTab();
      if (e.key === " ") { e.preventDefault(); setAutoPlay(v => !v); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onExit, nextTab, prevTab]);

  /* ── auto-rotate timer ── */
  useEffect(() => {
    if (!autoPlay) { setProgress(0); return; }
    setProgress(0);
    const TICK = 80; // ms
    const totalSteps = (intervalSec * 1000) / TICK;
    let step = 0;
    const timerId = window.setInterval(() => {
      step++;
      setProgress(Math.min((step / totalSteps) * 100, 100));
      if (step >= totalSteps) {
        step = 0;
        setProgress(0);
        setActiveTab(cur => {
          const idx = tabIds.indexOf(cur);
          const next = tabIds[(idx + 1) % tabIds.length];
          setFade(false);
          setTimeout(() => { setActiveTab(next); setFade(true); }, 180);
          return cur;
        });
      }
    }, TICK);
    return () => clearInterval(timerId);
  }, [autoPlay, intervalSec, activeTab, tabIds]);

  const activeTabMeta = TABS.find(t => t.id === activeTab);
  const ActiveIcon = activeTabMeta?.icon ?? LayoutDashboard;

  const closeRateColor =
    data.kpi.close_rate >= 70 ? "text-emerald-400" :
    data.kpi.close_rate >= 40 ? "text-amber-400" : "text-red-400";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">

      {/* ═══════════════ HEADER ═══════════════ */}
      <header className="shrink-0 flex items-center justify-between px-8 py-3
        border-b border-border/30 bg-background/95 backdrop-blur-sm">

        {/* Left: brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
            <Tv className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground leading-tight">SmartCare · TV Mode</div>
            <div className="text-[11px] text-muted-foreground">{data.company} · {data.branch}</div>
          </div>
        </div>

        {/* Center: current tab label */}
        <div className="flex items-center gap-2">
          <ActiveIcon className="w-4 h-4 text-primary" />
          <span className="text-base font-bold text-foreground">{activeTabMeta?.label}</span>
        </div>

        {/* Right: KPIs + clock + exit */}
        <div className="flex items-center gap-3">
          {/* KPI badges */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20">
              <Phone className="w-3 h-3 text-primary" />
              <span className="text-xs font-semibold text-primary">{count.toLocaleString()}</span>
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-border/30`}>
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span className={`text-xs font-semibold ${closeRateColor}`}>{data.kpi.close_rate}%</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-border/30">
              <Clock className="w-3 h-3 text-amber-400" />
              <span className="text-xs font-semibold text-amber-400">{data.kpi.avg_response_days} วัน</span>
            </div>
            {data.kpi.not_closed > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/25">
                <AlertTriangle className="w-3 h-3 text-red-400" />
                <span className="text-xs font-semibold text-red-400">
                  ค้าง {data.kpi.not_closed.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Clock */}
          <div className="text-right border-l border-border/30 pl-3">
            <div className="text-lg font-bold text-foreground font-mono tracking-wide leading-tight">
              {now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {now.toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            </div>
          </div>

          {/* Exit */}
          <button
            onClick={onExit}
            title="ออก TV Mode (ESC)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/40
              text-xs text-muted-foreground hover:text-foreground hover:border-red-500/50
              hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <X className="w-3.5 h-3.5" /> ออก
          </button>
        </div>
      </header>

      {/* ═══════════════ CONTENT ═══════════════ */}
      <div
        className="flex-1 min-h-0 overflow-y-auto px-6 py-4"
        style={{
          opacity: fade ? 1 : 0,
          transition: "opacity 0.18s ease",
        }}
      >
        {activeTab === "overview"    && <OverviewTab    data={data} />}
        {activeTab === "trends"      && <TrendsTab      data={data} />}
        {activeTab === "problems"    && <ProblemsTab    data={data} />}
        {activeTab === "groups"      && <GroupsTab      data={data} />}
        {activeTab === "performance" && <PerformanceTab data={data} />}
        {activeTab === "deep"        && <DeepAnalysisTab data={data} />}
        {activeTab === "map"         && <MapTab />}
      </div>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="shrink-0 border-t border-border/30 bg-background/95 backdrop-blur-sm px-6 pb-4 pt-3">

        {/* Progress bar */}
        <div className="h-0.5 rounded-full bg-white/5 mb-3 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${autoPlay ? progress : 0}%`,
              background: "linear-gradient(90deg, hsl(var(--primary)/0.4), hsl(var(--primary)/0.9))",
              transition: "width 0.08s linear",
            }}
          />
        </div>

        <div className="flex items-center justify-between gap-4">

          {/* Tab pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => switchTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground border border-transparent hover:border-border/30"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={prevTab}
              title="Tab ก่อนหน้า (←)"
              className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextTab}
              title="Tab ถัดไป (→)"
              className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Auto-play toggle */}
            <button
              onClick={() => setAutoPlay(v => !v)}
              title="เล่น/หยุด auto rotate (Space)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                autoPlay
                  ? "bg-primary/15 text-primary border-primary/35 hover:bg-primary/25"
                  : "bg-white/5 text-muted-foreground border-border/30 hover:bg-white/10 hover:text-foreground"
              }`}
            >
              {autoPlay
                ? <><Pause className="w-3.5 h-3.5" /> Auto</>
                : <><Play  className="w-3.5 h-3.5" /> Auto</>
              }
            </button>

            {/* Interval selector */}
            <select
              value={intervalSec}
              onChange={e => setIntervalSec(Number(e.target.value))}
              className="px-2.5 py-1.5 rounded-lg text-xs bg-white/5 border border-border/30
                text-muted-foreground cursor-pointer hover:bg-white/10 transition-colors"
            >
              {INTERVALS.map(s => (
                <option key={s} value={s} className="bg-slate-900">{s}s</option>
              ))}
            </select>

            {/* Hint */}
            <span className="hidden lg:block text-[10px] text-muted-foreground/50 ml-1">
              ESC ออก · ← → เปลี่ยน Tab · Space Auto
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
