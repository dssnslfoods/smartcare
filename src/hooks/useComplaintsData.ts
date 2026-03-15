import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { CompanyData } from "@/data/mockData";

interface ComplaintRow {
  id: string;
  complaint_number: string | null;
  complaint_date: string | null;
  status: string | null;
  resolution: string | null;
  resolved_at: string | null;
  created_at: string | null;
  companies: { id: string; name: string } | null;
  branches: { id: string; name: string } | null;
  product_groups: { id: string; name: string } | null;
  categories: { id: string; name: string } | null;
  problem_types: { id: string; name: string } | null;
  problem_sub_types: { id: string; name: string } | null;
  callers: { id: string; name: string } | null;
}

interface FilterOptions {
  companies: { id: string; name: string }[];
  branches: { id: string; name: string; company_id: string }[];
  statuses: string[];
  categories: { id: string; name: string }[];
}

function diffDays(d1: string | null, d2: string | null): number | null {
  if (!d1 || !d2) return null;
  const a = new Date(d1).getTime();
  const b = new Date(d2).getTime();
  if (isNaN(a) || isNaN(b)) return null;
  return Math.abs(b - a) / (1000 * 60 * 60 * 24);
}

function median(arr: number[]): number {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function countMap<T extends string | number>(arr: T[]): Record<string, number> {
  const m: Record<string, number> = {};
  arr.forEach(v => { const k = String(v); m[k] = (m[k] || 0) + 1; });
  return m;
}

function getMonthKey(date: string): { year: number; month: string; monthNum: number } {
  const d = new Date(date);
  const year = d.getFullYear();
  const monthNum = d.getMonth();
  const monthNames = [
    "01_January", "02_February", "03_March", "04_April", "05_May", "06_June",
    "07_July", "08_August", "09_September", "10_October", "11_November", "12_December"
  ];
  return { year, month: monthNames[monthNum], monthNum };
}

function buildCompanyData(
  complaints: ComplaintRow[],
  companyName: string,
  branchLabel: string
): CompanyData {
  const total_calls = complaints.length;
  const total_records = complaints.length;

  // Status counts
  const statusArr = complaints.map(c => c.status || "ไม่ระบุ");
  const statusMap = countMap(statusArr);

  const closed = statusMap["ปิดผู้ผลิต"] || 0;
  const not_closed = statusMap["ไม่ปิดผู้ผลิต"] || 0;
  const close_rate = (closed + not_closed) > 0 ? Math.round((closed / (closed + not_closed)) * 1000) / 10 : 0;

  // Response days
  const responseDays = complaints
    .map(c => diffDays(c.complaint_date, c.resolved_at))
    .filter((d): d is number => d !== null && d >= 0);
  const avg_response_days = responseDays.length
    ? Math.round((responseDays.reduce((s, d) => s + d, 0) / responseDays.length) * 10) / 10
    : 0;
  const median_response_days = Math.round(median(responseDays) * 10) / 10;

  // Category counts
  const categoryArr = complaints.map(c => c.categories?.name || "ไม่ระบุ");
  const category = countMap(categoryArr);

  // Problem type counts
  const problemTypeArr = complaints.map(c => c.problem_types?.name || "ไม่ระบุ");
  const problem_type = countMap(problemTypeArr);

  // Sub problem counts (top 15)
  const subProblemArr = complaints.map(c => c.problem_sub_types?.name || "ไม่ระบุ");
  const subProblemAll = countMap(subProblemArr);
  const sub_problem = Object.fromEntries(
    Object.entries(subProblemAll).sort((a, b) => b[1] - a[1]).slice(0, 15)
  );

  // Group counts
  const groupArr = complaints.map(c => c.product_groups?.name || "ไม่ระบุ");
  const group = countMap(groupArr);

  // Caller counts
  const callerArr = complaints.map(c => c.callers?.name || "ไม่ระบุ");
  const caller = countMap(callerArr);

  // Monthly trend
  const monthlyMap: Record<string, { year: number; month: string; calls: number; records: number }> = {};
  complaints.forEach(c => {
    if (!c.complaint_date) return;
    const mk = getMonthKey(c.complaint_date);
    const key = `${mk.year}_${mk.month}`;
    if (!monthlyMap[key]) monthlyMap[key] = { year: mk.year, month: mk.month, calls: 0, records: 0 };
    monthlyMap[key].calls++;
    monthlyMap[key].records++;
  });
  const monthly_trend = Object.values(monthlyMap).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month.localeCompare(b.month);
  });

  // Close rate by problem type
  const close_rate_by_type: Record<string, { total: number; closed: number; rate: number }> = {};
  Object.keys(problem_type).forEach(pt => {
    const ptComplaints = complaints.filter(c => (c.problem_types?.name || "ไม่ระบุ") === pt);
    const total = ptComplaints.length;
    const cl = ptComplaints.filter(c => c.status === "ปิดผู้ผลิต").length;
    close_rate_by_type[pt] = { total, closed: cl, rate: total > 0 ? Math.round((cl / total) * 1000) / 10 : 0 };
  });

  // Response by category
  const response_by_category: Record<string, { avg: number; median: number; max: number }> = {};
  Object.keys(category).forEach(cat => {
    const catComplaints = complaints.filter(c => (c.categories?.name || "ไม่ระบุ") === cat);
    const days = catComplaints
      .map(c => diffDays(c.complaint_date, c.resolved_at))
      .filter((d): d is number => d !== null && d >= 0);
    response_by_category[cat] = {
      avg: days.length ? Math.round((days.reduce((s, d) => s + d, 0) / days.length) * 10) / 10 : 0,
      median: Math.round(median(days) * 10) / 10,
      max: days.length ? Math.round(Math.max(...days)) : 0,
    };
  });

  // Response distribution
  const response_distribution: Record<string, number> = {
    "0-1วัน": 0, "2-3วัน": 0, "4-5วัน": 0, "6-7วัน": 0,
    "8-14วัน": 0, "15-30วัน": 0, "30+วัน": 0,
  };
  responseDays.forEach(d => {
    if (d <= 1) response_distribution["0-1วัน"]++;
    else if (d <= 3) response_distribution["2-3วัน"]++;
    else if (d <= 5) response_distribution["4-5วัน"]++;
    else if (d <= 7) response_distribution["6-7วัน"]++;
    else if (d <= 14) response_distribution["8-14วัน"]++;
    else if (d <= 30) response_distribution["15-30วัน"]++;
    else response_distribution["30+วัน"]++;
  });

  // Group-problem matrix
  const matrixMap: Record<string, number> = {};
  complaints.forEach(c => {
    const g = c.product_groups?.name || "ไม่ระบุ";
    const p = c.problem_types?.name || "ไม่ระบุ";
    const key = `${g}|||${p}`;
    matrixMap[key] = (matrixMap[key] || 0) + 1;
  });
  const group_problem_matrix = Object.entries(matrixMap).map(([k, count]) => {
    const [grp, prob] = k.split("|||");
    return { group: grp, problem: prob, count };
  });

  // Monthly status
  const msMap: Record<string, { year: number; month: string; status: string; count: number }> = {};
  complaints.forEach(c => {
    if (!c.complaint_date) return;
    const mk = getMonthKey(c.complaint_date);
    const st = c.status || "ไม่ระบุ";
    const key = `${mk.year}_${mk.month}_${st}`;
    if (!msMap[key]) msMap[key] = { year: mk.year, month: mk.month, status: st, count: 0 };
    msMap[key].count++;
  });
  const monthly_status = Object.values(msMap).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    if (a.month !== b.month) return a.month.localeCompare(b.month);
    return a.status.localeCompare(b.status);
  });

  // Monthly category
  const mcMap: Record<string, { recall: number; foodSafety: number; foodQuality: number; foodLaw: number; foodService: number }> = {};
  const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  complaints.forEach(c => {
    if (!c.complaint_date) return;
    const d = new Date(c.complaint_date);
    const key = shortMonths[d.getMonth()];
    if (!mcMap[key]) mcMap[key] = { recall: 0, foodSafety: 0, foodQuality: 0, foodLaw: 0, foodService: 0 };
    const cat = c.categories?.name || "";
    if (cat.includes("Recall")) mcMap[key].recall++;
    else if (cat.includes("Safety")) mcMap[key].foodSafety++;
    else if (cat.includes("Quality")) mcMap[key].foodQuality++;
    else if (cat.includes("Law")) mcMap[key].foodLaw++;
    else if (cat.includes("Service")) mcMap[key].foodService++;
  });
  const monthly_category = shortMonths
    .filter(m => mcMap[m])
    .map(m => ({ month: m, ...mcMap[m] }));

  return {
    company: companyName,
    branch: branchLabel,
    kpi: { total_calls, total_records, closed, not_closed, close_rate, avg_response_days, median_response_days },
    monthly_trend,
    status: statusMap,
    category,
    problem_type,
    sub_problem,
    group,
    caller,
    close_rate_by_type,
    response_by_category,
    response_distribution,
    group_problem_matrix,
    monthly_status,
    monthly_category,
  };
}

export function useFilterOptions() {
  const [options, setOptions] = useState<FilterOptions>({
    companies: [],
    branches: [],
    statuses: [],
    categories: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const [companiesRes, branchesRes, complaintsRes, categoriesRes] = await Promise.all([
        supabase.from("companies").select("id, name"),
        supabase.from("branches").select("id, name, company_id"),
        supabase.from("complaints").select("status"),
        supabase.from("categories").select("id, name"),
      ]);

      const statuses = [...new Set(
        (complaintsRes.data || []).map(c => c.status).filter(Boolean) as string[]
      )];

      setOptions({
        companies: companiesRes.data || [],
        branches: branchesRes.data || [],
        statuses,
        categories: categoriesRes.data || [],
      });
      setLoading(false);
    }
    fetch();
  }, []);

  return { options, loading };
}

export function useComplaintsData(
  companyId: string,
  branchId: string,
  statusFilter: string,
  categoryFilter: string,
  dateFrom: string,
  dateTo: string
) {
  const [rawComplaints, setRawComplaints] = useState<ComplaintRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [branchLabel, setBranchLabel] = useState("ทุกสาขา");

  useEffect(() => {
    async function fetch() {
      setLoading(true);

      let query = supabase
        .from("complaints")
        .select(`
          id, complaint_number, complaint_date, status, resolution, resolved_at, created_at,
          companies:company_id(id, name),
          branches:branch_id(id, name),
          product_groups:product_group_id(id, name),
          categories:category_id(id, name),
          problem_types:problem_type_id(id, name),
          problem_sub_types:problem_sub_type_id(id, name),
          callers:caller_id(id, name)
        `);

      if (companyId && companyId !== "ALL") {
        query = query.eq("company_id", companyId);
      }
      if (branchId && branchId !== "ALL") {
        query = query.eq("branch_id", branchId);
      }
      if (statusFilter && statusFilter !== "ALL") {
        query = query.eq("status", statusFilter);
      }
      if (categoryFilter && categoryFilter !== "ALL") {
        query = query.eq("category_id", categoryFilter);
      }
      if (dateFrom) {
        query = query.gte("complaint_date", dateFrom);
      }
      if (dateTo) {
        // To include the whole end date, we can set to the end of the day or just use lte with the date string
        query = query.lte("complaint_date", `${dateTo}T23:59:59`);
      }

      // Fetch all rows by paginating (Supabase default cap = 1000)
      const PAGE = 1000;
      let allData: any[] = [];
      let page = 0;
      let fetchError = null;
      while (true) {
        const { data: chunk, error: err } = await (query as any).range(page * PAGE, (page + 1) * PAGE - 1);
        if (err) { fetchError = err; break; }
        if (!chunk || chunk.length === 0) break;
        allData = allData.concat(chunk);
        if (chunk.length < PAGE) break;
        page++;
      }
      const data = allData;
      const error = fetchError;

      if (error) {
        console.error("Error fetching complaints:", error);
        setRawComplaints([]);
      } else {
        // Supabase returns single-object joins, normalize
        const normalized = (data || []).map((row: any) => ({
          ...row,
          companies: row.companies || null,
          branches: row.branches || null,
          product_groups: row.product_groups || null,
          categories: row.categories || null,
          problem_types: row.problem_types || null,
          problem_sub_types: row.problem_sub_types || null,
          callers: row.callers || null,
        })) as ComplaintRow[];
        setRawComplaints(normalized);
      }

      // Get company/branch label
      if (companyId && companyId !== "ALL") {
        const { data: comp } = await supabase.from("companies").select("name").eq("id", companyId).single();
        setCompanyName(comp?.name || "");
      } else {
        setCompanyName("ทุกบริษัท");
      }
      if (branchId && branchId !== "ALL") {
        const { data: br } = await supabase.from("branches").select("name").eq("id", branchId).single();
        setBranchLabel(br?.name || "ทุกสาขา");
      } else {
        setBranchLabel("ทุกสาขา");
      }

      setLoading(false);
    }
    fetch();
  }, [companyId, branchId, statusFilter, categoryFilter, dateFrom, dateTo]);

  const data = useMemo(
    () => buildCompanyData(rawComplaints, companyName, branchLabel),
    [rawComplaints, companyName, branchLabel]
  );

  return { data, loading, count: rawComplaints.length };
}
