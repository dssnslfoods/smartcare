import { useState, useEffect, useMemo } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MapPin, TrendingUp, Clock, AlertTriangle } from "lucide-react";

const GEO_URL = "/thailand-provinces.json";

const CDC_PROVINCE_MAP: Record<string, string> = {
  "มหาชัย": "Samut Sakhon",
  "บางบัวทอง": "Nonthaburi",
  "สุวรรณภูมิ": "Samut Prakan",
  "เชียงใหม่": "Chiang Mai",
  "นครสวรรค์": "Nakhon Sawan",
  "นครราชสีมา": "Nakhon Ratchasima",
  "ขอนแก่น": "Khon Kaen",
  "ชลบุรี": "Chon Buri",
  "ภูเก็ต": "Phuket",
  "หาดใหญ่": "Songkhla",
  "สุราษฎร์ธานี": "Surat Thani",
};

const CDC_COORDINATES: Record<string, [number, number]> = {
  "มหาชัย": [100.274, 13.547],
  "บางบัวทอง": [100.431, 13.924],
  "สุวรรณภูมิ": [100.750, 13.674],
  "เชียงใหม่": [98.985, 18.788],
  "นครสวรรค์": [100.120, 15.698],
  "นครราชสีมา": [102.098, 14.980],
  "ขอนแก่น": [102.836, 16.442],
  "ชลบุรี": [100.985, 13.361],
  "ภูเก็ต": [98.392, 7.880],
  "หาดใหญ่": [100.465, 7.007],
  "สุราษฎร์ธานี": [99.321, 9.138],
};

interface CDCStats {
  id: string;
  name: string;
  location: string;
  province: string;
  coordinates: [number, number];
  count: number;
  topProblems: { name: string; count: number }[];
  avgResponseDays: number;
  closedCount: number;
  closeRate: number;
  criticalCount: number;
}

function getCDCLocation(groupName: string): string {
  return groupName.replace(/^CDC\s+/i, "").trim();
}

function diffDays(d1: string | null, d2: string | null): number | null {
  if (!d1 || !d2) return null;
  const a = new Date(d1).getTime(), b = new Date(d2).getTime();
  if (isNaN(a) || isNaN(b)) return null;
  return Math.abs(b - a) / (1000 * 60 * 60 * 24);
}

export default function MapTab() {
  const [cdcStats, setCdcStats] = useState<CDCStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalComplaints, setTotalComplaints] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: groups } = await supabase
        .from("product_groups")
        .select("id, name, code")
        .eq("code", "CDC");

      if (!groups?.length) { setLoading(false); return; }

      const cdcIds = groups.map(g => g.id);

      // Fetch complaints with details for CDC groups
      const PAGE = 1000;
      let allComplaints: any[] = [];
      let page = 0;
      while (true) {
        const { data: chunk } = await supabase
          .from("complaints")
          .select("product_group_id, complaint_date, resolved_at, status, priority, problem_types:problem_type_id(name)")
          .in("product_group_id", cdcIds)
          .range(page * PAGE, (page + 1) * PAGE - 1);
        if (!chunk?.length) break;
        allComplaints = allComplaints.concat(chunk);
        if (chunk.length < PAGE) break;
        page++;
      }

      // Also get total complaints count
      const { count } = await supabase.from("complaints").select("id", { count: "exact", head: true });
      setTotalComplaints(count || 0);

      // Build per-CDC stats
      const statsMap: Record<string, any[]> = {};
      cdcIds.forEach(id => { statsMap[id] = []; });
      allComplaints.forEach(c => {
        if (c.product_group_id && statsMap[c.product_group_id]) {
          statsMap[c.product_group_id].push(c);
        }
      });

      const stats: CDCStats[] = groups
        .map(g => {
          const location = getCDCLocation(g.name);
          const coords = CDC_COORDINATES[location];
          const province = CDC_PROVINCE_MAP[location] || location;
          if (!coords) return null;

          const complaints = statsMap[g.id] || [];

          // Top problems
          const problemCount: Record<string, number> = {};
          complaints.forEach((c: any) => {
            const pName = c.problem_types?.name || "ไม่ระบุ";
            problemCount[pName] = (problemCount[pName] || 0) + 1;
          });
          const topProblems = Object.entries(problemCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name, count]) => ({ name, count }));

          // Avg response days
          const days = complaints
            .map((c: any) => diffDays(c.complaint_date, c.resolved_at))
            .filter((d): d is number => d !== null && d >= 0);
          const avgResponseDays = days.length
            ? Math.round((days.reduce((s, d) => s + d, 0) / days.length) * 10) / 10
            : 0;

          // Close rate
          const closedCount = complaints.filter((c: any) =>
            c.status === "ปิดผู้ผลิต" || c.status === "ปิดเป็น RD"
          ).length;
          const closeRate = complaints.length > 0
            ? Math.round((closedCount / complaints.length) * 1000) / 10
            : 0;

          // Critical count
          const criticalCount = complaints.filter((c: any) =>
            c.priority === "critical" || c.priority === "high"
          ).length;

          return {
            id: g.id, name: g.name, location, province, coordinates: coords,
            count: complaints.length, topProblems, avgResponseDays,
            closedCount, closeRate, criticalCount,
          };
        })
        .filter(Boolean) as CDCStats[];

      setCdcStats(stats);
      setLoading(false);
    }
    load();
  }, []);

  const maxCount = useMemo(() => Math.max(...cdcStats.map(p => p.count), 1), [cdcStats]);
  const highlightedProvinces = useMemo(() => new Set(cdcStats.map(p => p.province)), [cdcStats]);
  const hoveredPoint = cdcStats.find(p => p.id === hoveredId);
  const totalCDC = cdcStats.reduce((s, p) => s + p.count, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 glass-card rounded-2xl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">กำลังโหลดข้อมูลแผนที่...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <MapPin className="h-3.5 w-3.5" /> ศูนย์ CDC
          </div>
          <div className="text-2xl font-bold text-foreground">{cdcStats.length}</div>
          <div className="text-[10px] text-muted-foreground">สาขา</div>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <TrendingUp className="h-3.5 w-3.5" /> Complaint CDC
          </div>
          <div className="text-2xl font-bold text-primary">{totalCDC.toLocaleString()}</div>
          <div className="text-[10px] text-muted-foreground">
            {totalComplaints > 0 ? `${((totalCDC / totalComplaints) * 100).toFixed(1)}% ของทั้งหมด` : ""}
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Clock className="h-3.5 w-3.5" /> เวลาตอบกลับเฉลี่ย
          </div>
          <div className="text-2xl font-bold text-foreground">
            {cdcStats.length > 0
              ? (cdcStats.reduce((s, p) => s + p.avgResponseDays, 0) / cdcStats.length).toFixed(1)
              : 0}
          </div>
          <div className="text-[10px] text-muted-foreground">วัน</div>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <AlertTriangle className="h-3.5 w-3.5" /> เคสสำคัญ/วิกฤต
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {cdcStats.reduce((s, p) => s + p.criticalCount, 0)}
          </div>
          <div className="text-[10px] text-muted-foreground">รายการ</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Map */}
        <div className="chart-card xl:col-span-2 relative">
          <div className="chart-title">
            <span className="chart-icon" style={{ background: "rgba(14,165,233,0.2)" }}>🗺️</span>
            แผนที่ศูนย์กระจายสินค้า CDC
          </div>

          <div className="relative">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ center: [101, 13], scale: 2400 }}
              style={{ width: "100%", height: 560, background: "transparent" }}
            >
              <defs>
                <radialGradient id="mapGlow">
                  <stop offset="0%" stopColor="rgba(14,165,233,0.15)" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <ZoomableGroup center={[101, 13]} zoom={1} minZoom={0.7} maxZoom={5}>
                <Geographies geography={GEO_URL}>
                  {({ geographies }) =>
                    geographies.map(geo => {
                      const provName = geo.properties.name;
                      const isHL = highlightedProvinces.has(provName);
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          style={{
                            default: {
                              fill: isHL ? "rgba(14,165,233,0.18)" : "rgba(148,163,184,0.06)",
                              stroke: "rgba(148,163,184,0.2)",
                              strokeWidth: 0.4,
                              outline: "none",
                            },
                            hover: {
                              fill: isHL ? "rgba(14,165,233,0.3)" : "rgba(148,163,184,0.1)",
                              stroke: "rgba(148,163,184,0.35)",
                              strokeWidth: 0.5,
                              outline: "none",
                            },
                            pressed: { outline: "none" },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>

                {/* Connection lines between CDC points */}
                {cdcStats.length > 1 && (() => {
                  const sorted = [...cdcStats].sort((a, b) => b.count - a.count);
                  const hub = sorted[0];
                  return sorted.slice(1).map(pt => (
                    <line
                      key={`line-${pt.id}`}
                      x1={0} y1={0} x2={0} y2={0}
                      style={{ display: "none" }}
                    />
                  ));
                })()}

                {/* Outer glow ring for CDC markers */}
                {cdcStats.map(pt => {
                  const ratio = pt.count / maxCount;
                  const r = 10 + ratio * 18;
                  const isHov = hoveredId === pt.id;
                  return (
                    <Marker key={`glow-${pt.id}`} coordinates={pt.coordinates}>
                      <circle
                        r={r + 4}
                        fill="none"
                        stroke={isHov ? "rgba(251,191,36,0.4)" : "rgba(14,165,233,0.25)"}
                        strokeWidth={2}
                        style={{ transition: "all 0.3s", pointerEvents: "none" }}
                      />
                    </Marker>
                  );
                })}

                {/* Main bubble markers */}
                {cdcStats.map(pt => {
                  const ratio = pt.count / maxCount;
                  const r = 10 + ratio * 18;
                  const isHov = hoveredId === pt.id;
                  return (
                    <Marker
                      key={pt.id}
                      coordinates={pt.coordinates}
                      onMouseEnter={() => setHoveredId(pt.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <circle
                        r={r}
                        fill={isHov
                          ? "rgba(251,191,36,0.9)"
                          : `rgba(14,165,233,${0.5 + ratio * 0.4})`
                        }
                        stroke={isHov ? "#fbbf24" : "rgba(14,165,233,0.9)"}
                        strokeWidth={isHov ? 2 : 1.5}
                        filter={isHov ? "url(#glow)" : ""}
                        style={{ cursor: "pointer", transition: "all 0.25s" }}
                      />
                      <text
                        textAnchor="middle"
                        y={-r - 6}
                        style={{
                          fontSize: isHov ? 11 : 9,
                          fill: isHov ? "#fbbf24" : "#cbd5e1",
                          fontWeight: 600,
                          pointerEvents: "none",
                          transition: "all 0.2s",
                        }}
                      >
                        {pt.location}
                      </text>
                      <text
                        textAnchor="middle"
                        y={4}
                        style={{
                          fontSize: isHov ? 11 : 9,
                          fill: "#fff",
                          fontWeight: 700,
                          pointerEvents: "none",
                        }}
                      >
                        {pt.count}
                      </text>
                    </Marker>
                  );
                })}
              </ZoomableGroup>
            </ComposableMap>

            {/* Hover tooltip overlay */}
            {hoveredPoint && (
              <div className="absolute top-4 right-4 w-64 glass-card rounded-xl p-4 shadow-2xl border border-primary/20 pointer-events-none z-10 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-bold text-foreground">{hoveredPoint.name}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-primary">{hoveredPoint.count}</div>
                    <div className="text-[10px] text-muted-foreground">Complaint</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-foreground">{hoveredPoint.closeRate}%</div>
                    <div className="text-[10px] text-muted-foreground">อัตราปิดเคส</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">เวลาตอบกลับ:</span>
                    <span className="font-semibold text-foreground ml-auto">{hoveredPoint.avgResponseDays} วัน</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <AlertTriangle className="h-3 w-3 text-amber-400" />
                    <span className="text-muted-foreground">เคสสำคัญ/วิกฤต:</span>
                    <span className="font-semibold text-amber-400 ml-auto">{hoveredPoint.criticalCount}</span>
                  </div>
                </div>

                {hoveredPoint.topProblems.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/30">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">ปัญหาหลัก</div>
                    {hoveredPoint.topProblems.map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-xs mb-1">
                        <span className="text-foreground/80 truncate mr-2">{i + 1}. {p.name}</span>
                        <span className="font-semibold text-foreground shrink-0">{p.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground text-center mt-2 opacity-60">
            เลื่อนล้อเมาส์เพื่อ Zoom · ชี้ที่วงกลมเพื่อดูรายละเอียด
          </p>
        </div>

        {/* Side panel — CDC list */}
        <div className="chart-card flex flex-col">
          <div className="chart-title">
            <span className="chart-icon" style={{ background: "rgba(167,139,250,0.2)" }}>📊</span>
            รายละเอียด CDC
          </div>

          <div className="flex-1 overflow-auto space-y-2 mt-1">
            {[...cdcStats].sort((a, b) => b.count - a.count).map((pt, idx) => {
              const pct = totalComplaints > 0 ? ((pt.count / totalComplaints) * 100).toFixed(1) : "0.0";
              const barW = maxCount > 0 ? (pt.count / maxCount) * 100 : 0;
              const isHov = hoveredId === pt.id;
              return (
                <div
                  key={pt.id}
                  className={`p-3 rounded-xl border transition-all cursor-default ${
                    isHov
                      ? "bg-primary/10 border-primary/30 shadow-lg shadow-primary/5"
                      : "bg-white/[0.02] border-border/20 hover:bg-white/[0.04]"
                  }`}
                  onMouseEnter={() => setHoveredId(pt.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary/60 w-4">{idx + 1}</span>
                      <span className="text-sm font-semibold text-foreground">{pt.name}</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">{pt.count}</span>
                  </div>

                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${barW}%`,
                        background: `linear-gradient(90deg, rgba(14,165,233,0.6), rgba(14,165,233,0.9))`,
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-[10px]">
                    <div className="text-center">
                      <span className="text-muted-foreground">สัดส่วน</span>
                      <div className="font-semibold text-foreground">{pct}%</div>
                    </div>
                    <div className="text-center">
                      <span className="text-muted-foreground">ปิดเคส</span>
                      <div className="font-semibold text-foreground">{pt.closeRate}%</div>
                    </div>
                    <div className="text-center">
                      <span className="text-muted-foreground">ตอบกลับ</span>
                      <div className="font-semibold text-foreground">{pt.avgResponseDays}วัน</div>
                    </div>
                  </div>

                  {/* Expanded details on hover */}
                  {isHov && pt.topProblems.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border/20 space-y-1">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">ปัญหาหลัก</div>
                      {pt.topProblems.map((p, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-foreground/70 truncate mr-2">{p.name}</span>
                          <span className="font-medium text-foreground shrink-0">{p.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Total footer */}
            <div className="p-3 rounded-xl border border-border/30 bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">รวมทุก CDC</span>
                <span className="text-sm font-bold text-foreground">{totalCDC.toLocaleString()} รายการ</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
