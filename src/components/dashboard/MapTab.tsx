import { useState, useEffect } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const GEO_URL = "/thailand-provinces.json";

// CDC location name (ภาษาไทย) → Highcharts province name (English)
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

// Approximate center coordinates for each CDC location [lng, lat]
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

interface CDCPoint {
  id: string;
  name: string;
  location: string;       // e.g. "มหาชัย"
  province: string;       // English province name
  coordinates: [number, number];
  count: number;
}

function getCDCLocation(groupName: string): string {
  return groupName.replace(/^CDC\s+/i, "").trim();
}

export default function MapTab() {
  const [points, setPoints] = useState<CDCPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalComplaints, setTotalComplaints] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      // 1. Fetch all CDC product groups
      const { data: groups } = await supabase
        .from("product_groups")
        .select("id, name, code")
        .eq("code", "CDC");

      if (!groups?.length) { setLoading(false); return; }

      // 2. Fetch complaint counts per product_group_id
      const { data: complaints } = await supabase
        .from("complaints")
        .select("product_group_id");

      const countMap: Record<string, number> = {};
      (complaints || []).forEach((c: any) => {
        if (c.product_group_id) countMap[c.product_group_id] = (countMap[c.product_group_id] || 0) + 1;
      });

      const total = Object.values(countMap).reduce((s, v) => s + v, 0);
      setTotalComplaints(total);

      // 3. Build CDC points
      const pts: CDCPoint[] = groups
        .map(g => {
          const location = getCDCLocation(g.name);
          const coords = CDC_COORDINATES[location];
          const province = CDC_PROVINCE_MAP[location] || location;
          if (!coords) return null;
          return {
            id: g.id,
            name: g.name,
            location,
            province,
            coordinates: coords,
            count: countMap[g.id] || 0,
          };
        })
        .filter(Boolean) as CDCPoint[];

      setPoints(pts);
      setLoading(false);
    }
    load();
  }, []);

  const maxCount = Math.max(...points.map(p => p.count), 1);

  // Highlighted province names (English)
  const highlightedProvinces = new Set(points.map(p => p.province));

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
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Map */}
        <div className="chart-card xl:col-span-2">
          <div className="chart-title">
            <span className="chart-icon" style={{ background: "rgba(14,165,233,0.2)" }}>🗺️</span>
            แผนที่ศูนย์กระจายสินค้า CDC
          </div>

          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ center: [101, 13], scale: 2200 }}
            style={{ width: "100%", height: 520 }}
          >
            <ZoomableGroup center={[101, 13]} zoom={1} minZoom={0.8} maxZoom={4}>
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map(geo => {
                    const provName = geo.properties.name;
                    const isHighlighted = highlightedProvinces.has(provName);
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        style={{
                          default: {
                            fill: isHighlighted ? "rgba(14,165,233,0.25)" : "rgba(255,255,255,0.04)",
                            stroke: "rgba(255,255,255,0.12)",
                            strokeWidth: 0.5,
                            outline: "none",
                          },
                          hover: {
                            fill: isHighlighted ? "rgba(14,165,233,0.4)" : "rgba(255,255,255,0.08)",
                            stroke: "rgba(255,255,255,0.2)",
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

              {/* Bubble markers */}
              {points.map(pt => {
                const ratio = pt.count / maxCount;
                const r = 8 + ratio * 22;
                const isHovered = hoveredId === pt.id;
                return (
                  <Marker
                    key={pt.id}
                    coordinates={pt.coordinates}
                    onMouseEnter={() => setHoveredId(pt.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <circle
                      r={r}
                      fill={isHovered ? "rgba(251,191,36,0.85)" : "rgba(14,165,233,0.7)"}
                      stroke={isHovered ? "#fbbf24" : "#0ea5e9"}
                      strokeWidth={1.5}
                      style={{ cursor: "pointer", transition: "all 0.2s" }}
                    />
                    <text
                      textAnchor="middle"
                      y={-r - 5}
                      style={{ fontSize: 9, fill: "#e2e8f0", fontWeight: 600, pointerEvents: "none" }}
                    >
                      {pt.location}
                    </text>
                    <text
                      textAnchor="middle"
                      y={3}
                      style={{ fontSize: 9, fill: "#fff", fontWeight: 700, pointerEvents: "none" }}
                    >
                      {pt.count}
                    </text>
                  </Marker>
                );
              })}
            </ZoomableGroup>
          </ComposableMap>

          <p className="text-xs text-muted-foreground text-center mt-1">
            ขนาดวงกลมแสดงสัดส่วนจำนวน Complaint · เลื่อนล้อเมาส์เพื่อ Zoom
          </p>
        </div>

        {/* Table */}
        <div className="chart-card flex flex-col">
          <div className="chart-title">
            <span className="chart-icon" style={{ background: "rgba(167,139,250,0.2)" }}>📊</span>
            รายละเอียด CDC
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 text-xs text-muted-foreground font-medium">CDC</th>
                  <th className="text-right py-2 text-xs text-muted-foreground font-medium">Complaint</th>
                  <th className="text-right py-2 text-xs text-muted-foreground font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {[...points].sort((a, b) => b.count - a.count).map(pt => {
                  const pct = totalComplaints > 0 ? ((pt.count / totalComplaints) * 100).toFixed(1) : "0.0";
                  const barW = maxCount > 0 ? (pt.count / maxCount) * 100 : 0;
                  return (
                    <tr
                      key={pt.id}
                      className="border-b border-border/20 hover:bg-white/5 transition-colors cursor-default"
                      onMouseEnter={() => setHoveredId(pt.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <td className="py-2.5 pr-2">
                        <div className="font-medium text-foreground text-xs">{pt.name}</div>
                        <div className="mt-1 h-1 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-1 rounded-full bg-primary transition-all"
                            style={{ width: `${barW}%` }}
                          />
                        </div>
                      </td>
                      <td className="text-right py-2.5 font-semibold text-foreground">{pt.count}</td>
                      <td className="text-right py-2.5 text-muted-foreground text-xs">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-border/50">
                  <td className="py-2 text-xs font-semibold text-muted-foreground">รวมทุก CDC</td>
                  <td className="text-right py-2 font-bold text-foreground">
                    {points.reduce((s, p) => s + p.count, 0).toLocaleString()}
                  </td>
                  <td className="text-right py-2 text-xs text-muted-foreground">
                    {totalComplaints > 0
                      ? ((points.reduce((s, p) => s + p.count, 0) / totalComplaints) * 100).toFixed(1)
                      : "0.0"}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
