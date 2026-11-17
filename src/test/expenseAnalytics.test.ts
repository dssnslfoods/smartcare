import { describe, it, expect } from "vitest";
import { buildExpenseSummary, parseAmount, UNSPECIFIED_TYPE } from "@/lib/expenseAnalytics";

const types = [
  { id: "fq", name: "ค่าปรับสินค้าไม่ได้คุณภาพ (Food Quality)", sort_order: 1 },
  { id: "fs", name: " ค่าปรับจากสินค้าไม่ได้คุณภาพ (Food Safety)", sort_order: 2 },
  { id: "sms", name: "ค่า SMS", sort_order: 3 },
];

const complaints = [
  {
    id: "a", complaint_number: "QAS1.2026.10.010", complaint_date: "2026-10-07T00:00:00+07:00",
    categories: { name: "Recall" }, companies: { name: "NSL" }, branches: { name: "สาขา 2" },
    cost_items: [
      { expense_type_id: "fq", item_name: "ปรับ", amount: "280363.66" },
      { expense_type_id: "sms", item_name: "ค่า SMS", amount: "30,696.00" },
    ],
  },
  {
    id: "b", complaint_number: "B", complaint_date: "2026-08-15T00:00:00+07:00",
    categories: { name: "Service" },
    cost_items: [{ item_name: "กระเช้า", amount: "577" }, { item_name: "", amount: "" }],
  },
  { id: "c", complaint_number: "C", complaint_date: "2026-09-01", categories: { name: "Service" }, cost_items: [{ item_name: "", amount: "" }] },
  { id: "d", complaint_number: "D", complaint_date: "2026-09-01", categories: null, cost_items: null },
];

describe("expense analytics", () => {
  const s = buildExpenseSummary(complaints, types);

  it("follows the worked example: two items form one case", () => {
    const a = s.cases.find(c => c.id === "a")!;
    expect(a.total).toBe(311059.66);
    expect(a.lines).toHaveLength(2);
  });

  it("counts only documents with expense > 0", () => {
    expect(s.caseCount).toBe(2);
    expect(s.total).toBe(311636.66);
    expect(s.avgPerCase).toBe(155818.33);
  });

  it("every breakdown sums to the grand total", () => {
    const sum = (xs: { value: number }[]) => Math.round(xs.reduce((t, x) => t + x.value, 0) * 100) / 100;
    expect(sum(s.byProblem)).toBe(s.total);
    expect(sum(s.byType)).toBe(s.total);
    expect(Math.round(s.monthly.reduce((t, m) => t + m.total, 0) * 100) / 100).toBe(s.total);
  });

  it("lists every master type (zero included) and an unspecified bucket for legacy items", () => {
    expect(s.byType.map(t => t.name)).toContain("ค่าปรับจากสินค้าไม่ได้คุณภาพ (Food Safety)");
    expect(s.byType.find(t => t.id === "fs")!.value).toBe(0);
    expect(s.byType.find(t => t.name === UNSPECIFIED_TYPE)!.value).toBe(577);
  });

  it("fills empty months and keeps all 5 problem categories", () => {
    expect(s.monthly.map(m => m.total)).toEqual([577, 0, 311059.66]);
    expect(s.byProblem.map(p => p.name)).toEqual(["Food Safety", "Food Quality", "Service", "Food Law", "Recall"]);
  });

  it("parses amounts with commas and blanks", () => {
    expect(parseAmount("1,234.50")).toBe(1234.5);
    expect(parseAmount("")).toBe(0);
    expect(parseAmount(undefined)).toBe(0);
  });
});
