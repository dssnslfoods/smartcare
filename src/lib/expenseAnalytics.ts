// Expense analytics for the "วิเคราะห์ค่าใช้จ่าย" dashboard tab.
// Rules (SmartCare Expense Dashboard Requirement v1, section 3):
// - 1 complaint document = 1 case; case expense = sum of its items
// - cases with expense = documents whose total > 0
// - every item is counted exactly once, so each breakdown sums to the grand total

export interface ExpenseTypeRef { id: string; name: string; sort_order?: number | null }

export interface ExpenseLine {
  typeId: string | null;
  typeName: string;
  detail: string;
  amount: number;
}

export interface ExpenseCase {
  id: string;
  number: string;
  date: string | null;
  company: string;
  branch: string;
  category: string;
  lines: ExpenseLine[];
  total: number;
  raw: any;
}

export interface ExpenseSummary {
  total: number;
  caseCount: number;
  avgPerCase: number;
  cases: ExpenseCase[];               // sorted by total desc
  monthly: { key: string; year: number; month: number; total: number }[];
  byProblem: { name: string; value: number; pct: number }[];
  byType: { id: string | null; name: string; value: number }[];
}

export const PROBLEM_CATEGORIES = ["Food Safety", "Food Quality", "Service", "Food Law", "Recall"];
export const UNSPECIFIED_TYPE = "ไม่ระบุประเภท";
export const UNSPECIFIED_CATEGORY = "ไม่ระบุหมวดหมู่";

export function parseAmount(v: unknown): number {
  if (typeof v === "number") return isFinite(v) ? v : 0;
  if (typeof v !== "string") return 0;
  const n = parseFloat(v.replace(/,/g, "").trim());
  return isFinite(n) ? n : 0;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function resolveType(item: any, types: ExpenseTypeRef[]): { id: string | null; name: string } {
  const byId = item?.expense_type_id && types.find(t => t.id === item.expense_type_id);
  if (byId) return { id: byId.id, name: byId.name.trim() };
  const name = typeof item?.expense_type_name === "string" ? item.expense_type_name.trim() : "";
  const byName = name && types.find(t => t.name.trim() === name);
  if (byName) return { id: byName.id, name: byName.name.trim() };
  return { id: null, name: UNSPECIFIED_TYPE };
}

export function toExpenseCase(c: any, types: ExpenseTypeRef[]): ExpenseCase {
  const items: any[] = Array.isArray(c.cost_items) ? c.cost_items : [];
  const lines: ExpenseLine[] = items
    .map(it => {
      const t = resolveType(it, types);
      return { typeId: t.id, typeName: t.name, detail: (it?.item_name || "").trim(), amount: parseAmount(it?.amount) };
    })
    .filter(l => l.amount !== 0);
  return {
    id: c.id,
    number: c.complaint_number || "-",
    date: c.complaint_date || null,
    company: c.companies?.name || "-",
    branch: c.branches?.name || "-",
    category: c.categories?.name || UNSPECIFIED_CATEGORY,
    lines,
    total: round2(lines.reduce((s, l) => s + l.amount, 0)),
    raw: c,
  };
}

export function buildExpenseSummary(complaints: any[], types: ExpenseTypeRef[]): ExpenseSummary {
  const cases = complaints
    .map(c => toExpenseCase(c, types))
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const total = round2(cases.reduce((s, c) => s + c.total, 0));
  const caseCount = cases.length;
  const avgPerCase = caseCount ? round2(total / caseCount) : 0;

  // Monthly (by complaint date), continuous months between first and last
  const monthMap = new Map<number, number>();
  cases.forEach(c => {
    if (!c.date) return;
    const d = new Date(c.date);
    if (isNaN(d.getTime())) return;
    const ord = d.getFullYear() * 12 + d.getMonth();
    monthMap.set(ord, (monthMap.get(ord) || 0) + c.total);
  });
  const monthly: ExpenseSummary["monthly"] = [];
  if (monthMap.size) {
    const ords = [...monthMap.keys()];
    for (let o = Math.min(...ords); o <= Math.max(...ords); o++) {
      const year = Math.floor(o / 12), month = o % 12;
      monthly.push({ key: `${year}-${month + 1}`, year, month, total: round2(monthMap.get(o) || 0) });
    }
  }

  // By problem category (one category per complaint)
  const probMap = new Map<string, number>(PROBLEM_CATEGORIES.map(n => [n, 0]));
  cases.forEach(c => probMap.set(c.category, (probMap.get(c.category) || 0) + c.total));
  const byProblem = [...probMap.entries()]
    .filter(([n, v]) => PROBLEM_CATEGORIES.includes(n) || v !== 0)
    .map(([name, value]) => ({ name, value: round2(value), pct: total ? (value / total) * 100 : 0 }));

  // By expense type: all master types (0 when none), plus unspecified when present
  const typeMap = new Map<string, { id: string | null; name: string; value: number }>();
  [...types]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .forEach(t => typeMap.set(t.id, { id: t.id, name: t.name.trim(), value: 0 }));
  cases.forEach(c => c.lines.forEach(l => {
    const key = l.typeId ?? "__none__";
    if (!typeMap.has(key)) typeMap.set(key, { id: l.typeId, name: l.typeName, value: 0 });
    typeMap.get(key)!.value += l.amount;
  }));
  const byType = [...typeMap.values()]
    .map(t => ({ ...t, value: round2(t.value) }))
    .sort((a, b) => b.value - a.value);

  return { total, caseCount, avgPerCase, cases, monthly, byProblem, byType };
}
