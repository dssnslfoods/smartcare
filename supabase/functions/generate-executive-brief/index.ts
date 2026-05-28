// Supabase Edge Function: generate-executive-brief
// Aggregates complaint data for a given period + scope, then asks Claude to write
// a Thai executive brief. Falls back to a templated brief if ANTHROPIC_API_KEY is missing.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TH_MONTH_LONG = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];

interface ReqBody {
  dateFrom: string;          // ISO date "YYYY-MM-DD"
  dateTo: string;            // ISO date "YYYY-MM-DD"
  companyId?: string | null; // null/ALL = all
  branchId?: string | null;
  periodLabel?: string;      // human label for the period e.g. "เดือน พ.ค. 2569"
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function thDateLabel(d: Date): string {
  return `${d.getDate()} ${TH_MONTH_LONG[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function pct(n: number, d: number): number {
  return d > 0 ? Math.round((n / d) * 1000) / 10 : 0;
}

function topN<T extends { name: string; count: number }>(arr: T[], n = 5): T[] {
  return [...arr].sort((a, b) => b.count - a.count).slice(0, n);
}

interface AggregatedStats {
  current: any;
  previous: any;
  period: { from: string; to: string; label: string };
  prevPeriod: { from: string; to: string };
  scope: { company: string; branch: string };
}

async function fetchComplaints(
  supabase: ReturnType<typeof createClient>,
  dateFrom: string,
  dateTo: string,
  companyId?: string | null,
  branchId?: string | null
) {
  let q = supabase
    .from("complaints")
    .select(`
      id, complaint_date, status, resolution, resolved_at,
      companies:company_id(name),
      branches:branch_id(name),
      product_groups:product_group_id(name, code),
      categories:category_id(name),
      problem_types:problem_type_id(name),
      problem_sub_types:problem_sub_type_id(name)
    `)
    .gte("complaint_date", dateFrom)
    .lte("complaint_date", `${dateTo}T23:59:59`);

  if (companyId && companyId !== "ALL") q = q.eq("company_id", companyId);
  if (branchId && branchId !== "ALL") q = q.eq("branch_id", branchId);

  const { data, error } = await q;
  if (error) throw error;
  return (data as any[]) || [];
}

function aggregate(complaints: any[]) {
  const total = complaints.length;
  const closedMaker = complaints.filter(c => c.status === "ปิดผู้ผลิต").length;
  const notClosed = complaints.filter(c => !c.resolved_at).length;
  const closeRate = pct(closedMaker, total);

  const respDays = complaints
    .filter(c => c.complaint_date && c.resolved_at)
    .map(c => Math.abs(new Date(c.resolved_at).getTime() - new Date(c.complaint_date).getTime()) / 86400000);
  const avgResponse = respDays.length
    ? Math.round((respDays.reduce((s, d) => s + d, 0) / respDays.length) * 10) / 10
    : 0;

  function countMap(getter: (c: any) => string | undefined) {
    const m: Record<string, { count: number; closed: number }> = {};
    complaints.forEach(c => {
      const key = getter(c) || "ไม่ระบุ";
      if (!m[key]) m[key] = { count: 0, closed: 0 };
      m[key].count++;
      if (c.status === "ปิดผู้ผลิต") m[key].closed++;
    });
    return Object.entries(m).map(([name, v]) => ({
      name,
      count: v.count,
      closeRate: pct(v.closed, v.count),
    }));
  }

  const byCategory   = topN(countMap(c => c.categories?.name), 8);
  const byProductGroup = topN(countMap(c => c.product_groups?.name), 8);
  const byProblem    = topN(countMap(c => c.problem_types?.name), 8);
  const bySubProblem = topN(countMap(c => c.problem_sub_types?.name), 8);
  const byStatus     = countMap(c => c.status || "ไม่ระบุ").sort((a, b) => b.count - a.count);

  // Recurring within this period: same (group + problem + sub_problem) >= 2
  const comboMap: Record<string, { group: string; problem: string; sub: string; count: number; closed: number }> = {};
  complaints.forEach(c => {
    const group = c.product_groups?.name || "ไม่ระบุ";
    const problem = c.problem_types?.name || "ไม่ระบุ";
    const sub = c.problem_sub_types?.name || "-";
    const k = `${group}|||${problem}|||${sub}`;
    if (!comboMap[k]) comboMap[k] = { group, problem, sub, count: 0, closed: 0 };
    comboMap[k].count++;
    if (c.status === "ปิดผู้ผลิต") comboMap[k].closed++;
  });
  const recurring = Object.values(comboMap)
    .filter(p => p.count >= 2)
    .map(p => ({ ...p, closeRate: pct(p.closed, p.count) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    total, closedMaker, notClosed, closeRate, avgResponse,
    byCategory, byProductGroup, byProblem, bySubProblem, byStatus, recurring,
  };
}

function buildPrompt(stats: AggregatedStats): string {
  const { current, previous, period, scope } = stats;
  const change = previous.total > 0
    ? Math.round(((current.total - previous.total) / previous.total) * 100)
    : 0;
  const changeText = change > 0 ? `เพิ่มขึ้น ${change}%` : change < 0 ? `ลดลง ${Math.abs(change)}%` : "ไม่เปลี่ยนแปลง";

  return `คุณคือผู้ช่วยเขียนรายงานสรุปประจำงวดสำหรับผู้บริหารระดับสูงของบริษัทอาหาร NSL Foods
หน้าที่: เขียนรายงานสรุปข้อร้องเรียน (complaint) จากข้อมูลที่ให้มา เป็นภาษาไทย กระชับ มืออาชีพ
สำคัญ:
- เขียนสำหรับผู้บริหาร อ่านได้ใน 3 นาที
- "ปิดผู้ผลิต" หมายถึง ตัดสินแล้วว่าความผิดเป็นของผู้ผลิต (ยิ่งสัดส่วนสูง = ผู้ผลิตยิ่งบกพร่อง = แย่)
- ตอบกลับเป็น JSON เท่านั้น ไม่มี markdown code fence

ข้อมูลงวดปัจจุบัน (${period.label}):
- ขอบเขต: ${scope.company} · ${scope.branch}
- ช่วงวันที่: ${period.from} ถึง ${period.to}
- จำนวน complaint ทั้งหมด: ${current.total} เคส (${changeText} จากงวดก่อน ${previous.total} เคส)
- ปิดผู้ผลิต: ${current.closedMaker} เคส (${current.closeRate}% ของทั้งหมด)
- เคสที่ยังไม่ปิด: ${current.notClosed} เคส
- ระยะเวลาตอบเฉลี่ย: ${current.avgResponse} วัน

หมวดหมู่ (Top 5):
${current.byCategory.slice(0, 5).map((c: any, i: number) => `${i + 1}. ${c.name}: ${c.count} เคส (ผิดผู้ผลิต ${c.closeRate}%)`).join("\n")}

กลุ่มสินค้า (Top 5):
${current.byProductGroup.slice(0, 5).map((c: any, i: number) => `${i + 1}. ${c.name}: ${c.count} เคส (ผิดผู้ผลิต ${c.closeRate}%)`).join("\n")}

ประเภทปัญหา (Top 5):
${current.byProblem.slice(0, 5).map((c: any, i: number) => `${i + 1}. ${c.name}: ${c.count} เคส (ผิดผู้ผลิต ${c.closeRate}%)`).join("\n")}

ปัญหาย่อยที่พบมาก (Top 5):
${current.bySubProblem.slice(0, 5).map((c: any, i: number) => `${i + 1}. ${c.name}: ${c.count} เคส (ผิดผู้ผลิต ${c.closeRate}%)`).join("\n")}

ปัญหาซ้ำซากในงวดนี้ (Top 5):
${current.recurring.length === 0 ? "ไม่พบปัญหาซ้ำซากในงวดนี้" :
current.recurring.map((p: any, i: number) => `${i + 1}. ${p.group} › ${p.problem} › ${p.sub}: ${p.count} ครั้ง (ผิดผู้ผลิต ${p.closeRate}%)`).join("\n")}

จงตอบกลับเป็น JSON ตามโครงสร้างนี้เท่านั้น:
{
  "executiveSummary": "ย่อหน้าเดียว 3-5 บรรทัด สรุปภาพรวมงวดนี้ด้วยภาษาที่ผู้บริหารเข้าใจง่าย รวมเทรนด์เทียบงวดก่อน",
  "highlights": ["จุดเด่น/พัฒนาดี 2-3 ข้อ", "..."],
  "concerns": ["ประเด็นที่น่ากังวล 2-4 ข้อ ระบุชื่อปัญหา/กลุ่มสินค้า/ตัวเลขชัดเจน", "..."],
  "recommendations": ["ข้อเสนอแนะที่ทำได้จริง 3-4 ข้อ", "..."],
  "outlook": "1-2 ประโยค ทิศทางคาดการณ์/สิ่งที่ควรจับตางวดถัดไป"
}`;
}

function buildTemplateBrief(stats: AggregatedStats) {
  const { current, previous, period, scope } = stats;
  const change = previous.total > 0
    ? Math.round(((current.total - previous.total) / previous.total) * 100)
    : 0;
  const changeText = change > 0 ? `เพิ่มขึ้น ${change}%` : change < 0 ? `ลดลง ${Math.abs(change)}%` : "ไม่เปลี่ยนแปลง";

  const top = current.byProblem[0];
  const topSub = current.bySubProblem[0];
  const topRecurring = current.recurring[0];

  return {
    executiveSummary:
      `ใน${period.label} ขอบเขต ${scope.company} · ${scope.branch} มี complaint รวม ${current.total} เคส ` +
      `(${changeText}จากงวดก่อน ${previous.total} เคส) โดยมีอัตราการปิดเคสที่ความผิดผู้ผลิต ${current.closeRate}% ` +
      `เวลาตอบกลับเฉลี่ย ${current.avgResponse} วัน เคสที่ยังคงเปิดอยู่ ${current.notClosed} เคส`,
    highlights: [
      current.closeRate < 50
        ? `อัตราความผิดผู้ผลิตต่ำกว่า 50% (${current.closeRate}%) แสดงว่าผู้ผลิตยังอยู่ในเกณฑ์ยอมรับได้`
        : `การปิดเคสภายในระบบทำได้ ${current.closedMaker} เคส`,
      `เวลาตอบเฉลี่ย ${current.avgResponse} วัน`,
    ],
    concerns: [
      top ? `ประเภทปัญหา "${top.name}" พบมากสุด ${top.count} เคส (ผิดผู้ผลิต ${top.closeRate}%)` : "",
      topSub ? `ปัญหาย่อย "${topSub.name}" เกิดบ่อย ${topSub.count} เคส` : "",
      topRecurring ? `ปัญหาซ้ำซาก: ${topRecurring.group} › ${topRecurring.sub} เกิด ${topRecurring.count} ครั้ง` : "",
      current.notClosed > 10 ? `มีเคสค้าง ${current.notClosed} เคส ควรเร่งปิด` : "",
    ].filter(Boolean),
    recommendations: [
      topRecurring ? `เร่งทำ CAPA แก้ที่ต้นเหตุของปัญหา "${topRecurring.sub}" ในกลุ่ม ${topRecurring.group}` : "ติดตามเทรนด์ปัญหาซ้ำซากในงวดถัดไป",
      "สื่อสารกับผู้ผลิตที่มีอัตราปิดเคสสูง เพื่อพัฒนาคุณภาพ",
      current.avgResponse > 7 ? "เร่งปรับกระบวนการตอบกลับให้อยู่ภายใน SLA 7 วัน" : "รักษามาตรฐานการตอบกลับให้ต่อเนื่อง",
    ],
    outlook: change > 10
      ? `แนวโน้มงวดถัดไปคาดว่าจะมี complaint เพิ่มขึ้น ควรเตรียมทีมให้พร้อม`
      : change < -10
        ? `แนวโน้มดีขึ้น ควรรักษามาตรฐานและขยายแนวทางสู่หน่วยอื่น`
        : `แนวโน้มทรงตัว ควรโฟกัสปัญหาซ้ำซากเป็นหลัก`,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const body = (await req.json()) as ReqBody;
    const { dateFrom, dateTo, companyId, branchId } = body;
    let periodLabel = body.periodLabel;
    if (!dateFrom || !dateTo) throw new Error("ต้องระบุ dateFrom และ dateTo");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Resolve scope names
    let company = "ทุกบริษัท", branch = "ทุกสาขา";
    if (companyId && companyId !== "ALL") {
      const { data } = await supabase.from("companies").select("name").eq("id", companyId).single();
      if (data) company = (data as any).name;
    }
    if (branchId && branchId !== "ALL") {
      const { data } = await supabase.from("branches").select("name").eq("id", branchId).single();
      if (data) branch = (data as any).name;
    }

    // Current period
    const current = aggregate(await fetchComplaints(supabase, dateFrom, dateTo, companyId, branchId));

    // Previous period (same length, ending day before dateFrom)
    const startMs = new Date(dateFrom).getTime();
    const endMs = new Date(dateTo).getTime();
    const span = endMs - startMs;
    const prevTo = fmtDate(new Date(startMs - 86400000));
    const prevFrom = fmtDate(new Date(startMs - 86400000 - span));
    const previous = aggregate(await fetchComplaints(supabase, prevFrom, prevTo, companyId, branchId));

    if (!periodLabel) {
      periodLabel = `${thDateLabel(new Date(dateFrom))} – ${thDateLabel(new Date(dateTo))}`;
    }

    const stats: AggregatedStats = {
      current, previous,
      period: { from: dateFrom, to: dateTo, label: periodLabel },
      prevPeriod: { from: prevFrom, to: prevTo },
      scope: { company, branch },
    };

    // Try Gemini first, then Claude, then template
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    let brief: any;
    let aiProvider = "template";

    const prompt = buildPrompt(stats);

    async function tryGemini() {
      const model = "gemini-2.5-flash";
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "x-goog-api-key": geminiKey!,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.4,
              maxOutputTokens: 2048,
            },
          }),
        }
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error("Gemini error: " + JSON.stringify(data));
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
      return JSON.parse(cleaned);
    }

    async function tryClaude() {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey!,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5",
          max_tokens: 2000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error("Claude error: " + JSON.stringify(data));
      const text = data.content?.[0]?.text || "";
      const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
      return JSON.parse(cleaned);
    }

    if (geminiKey) {
      try {
        brief = await tryGemini();
        aiProvider = "gemini-2.5-flash";
      } catch (err) {
        console.error("Gemini failed:", err);
        if (anthropicKey) {
          try {
            brief = await tryClaude();
            aiProvider = "claude-haiku-4-5 (gemini fallback)";
          } catch (e2) {
            console.error("Claude also failed:", e2);
            brief = buildTemplateBrief(stats);
            aiProvider = "template (all AI failed)";
          }
        } else {
          brief = buildTemplateBrief(stats);
          aiProvider = "template (gemini failed)";
        }
      }
    } else if (anthropicKey) {
      try {
        brief = await tryClaude();
        aiProvider = "claude-haiku-4-5";
      } catch (err) {
        console.error("Claude failed:", err);
        brief = buildTemplateBrief(stats);
        aiProvider = "template (claude failed)";
      }
    } else {
      brief = buildTemplateBrief(stats);
    }

    return new Response(
      JSON.stringify({ brief, stats, aiProvider }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err?.message || err) }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
