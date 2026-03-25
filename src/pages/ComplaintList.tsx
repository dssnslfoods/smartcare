import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Plus, Search, ChevronLeft, ChevronRight, Pencil, FileDown, Loader2, ChevronUp, ChevronDown, CalendarIcon, X } from "lucide-react";
import TopNavBar from "@/components/TopNavBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Footer from "@/components/Footer";

function DatePickerInput({ value, onChange, placeholder }: { value: Date | undefined; onChange: (d: Date | undefined) => void; placeholder: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 w-[155px] justify-start text-sm font-normal gap-2">
          <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          {value ? (
            <span>{format(value, "d MMM yyyy", { locale: th })}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={d => { onChange(d); setOpen(false); }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

interface ComplaintRow {
  id: string;
  closed_case_month: number | null;
  closed_case_year: number | null;
  complaint_number: string | null;
  complaint_date: string | null;
  status: string | null;
  priority: string | null;
  resolution: string | null;
  resolved_at: string | null;
  description: string | null;
  action_items: any[] | null;
  cost_items: any[] | null;
  companies: { name: string } | null;
  branches: { name: string } | null;
  product_groups: { name: string } | null;
  categories: { name: string } | null;
  problem_types: { name: string } | null;
  problem_sub_types: { name: string } | null;
  callers: { name: string } | null;
  root_causes: { name: string } | null;
}

const PRIORITY_STYLES: Record<string, string> = {
  critical:  "priority-badge priority-badge-critical",
  high:      "priority-badge priority-badge-high",
  medium:    "priority-badge priority-badge-medium",
  low:       "priority-badge priority-badge-low",
};

const PRIORITY_LABELS: Record<string, string> = {
  critical: "วิกฤต",
  high:     "สูง",
  medium:   "กลาง",
  low:      "ต่ำ",
};

function getDaysOpen(complaintDate: string | null, resolvedAt: string | null): number | null {
  if (resolvedAt) return null;
  if (!complaintDate) return null;
  const diff = Math.floor((Date.now() - new Date(complaintDate).getTime()) / 86_400_000);
  return diff;
}

function SlaChip({ days }: { days: number }) {
  const cls = days > 14 ? "sla-chip sla-over" : days > 7 ? "sla-chip sla-warn" : "sla-chip sla-ok";
  return <span className={cls}>{days}d</span>;
}

const PAGE_SIZE_OPTIONS = [20, 50, 100];

const STATUS_COLORS: Record<string, string> = {
  "ปิดผู้ผลิต": "bg-green-600/20 text-green-400 border-green-600/30",
  "ไม่ปิดผู้ผลิต": "bg-red-600/20 text-red-400 border-red-600/30",
  "รอดำเนินการ": "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
};

export default function ComplaintList() {
  const { role, userProfile, user } = useAuth();
  const isStaff = role === "staff";

  const [complaints, setComplaints] = useState<ComplaintRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  // Sorting
  const [sortBy, setSortBy] = useState<string>("complaint_date");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Pagination
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const [exporting, setExporting] = useState(false);

  // Filter options
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    async function fetchOptions() {
      const [compRes, catRes] = await Promise.all([
        supabase.from("companies").select("id, name"),
        supabase.from("categories").select("id, name").order("name"),
      ]);
      setCompanies(compRes.data || []);
      setCategories((catRes.data || []).filter(c => c.name));

      const { data: statusData } = await supabase.from("statuses").select("name").order("sort_order", { ascending: true });
      setStatuses((statusData || []).map(s => s.name).filter(Boolean) as string[]);
    }
    fetchOptions();
  }, []);

  // Auto-filter for staff
  useEffect(() => {
    if (isStaff && userProfile?.company_id) {
      setCompanyFilter(userProfile.company_id);
    }
  }, [isStaff, userProfile]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      let countQuery = supabase.from("complaints").select("*", { count: "exact", head: true });
      let dataQuery = supabase.from("complaints").select(`
        id, closed_case_month, closed_case_year, complaint_number, complaint_date, status, priority, resolution, resolved_at,
        description, action_items, cost_items,
        companies:company_id(name),
        branches:branch_id(name),
        product_groups:product_group_id(name),
        categories:category_id(name),
        problem_types:problem_type_id(name),
        problem_sub_types:problem_sub_type_id(name),
        callers:caller_id(name),
        root_causes:root_cause_id(name)
      `).order(sortBy, { ascending: sortOrder === "asc" }).range(page * pageSize, (page + 1) * pageSize - 1);

      if (companyFilter !== "ALL") {
        countQuery = countQuery.eq("company_id", companyFilter);
        dataQuery = dataQuery.eq("company_id", companyFilter);
      }
      if (statusFilter !== "ALL") {
        countQuery = countQuery.eq("status", statusFilter);
        dataQuery = dataQuery.eq("status", statusFilter);
      }
      if (categoryFilter !== "ALL") {
        countQuery = countQuery.eq("category_id", categoryFilter);
        dataQuery = dataQuery.eq("category_id", categoryFilter);
      }
      if (search.trim()) {
        const s = `%${search.trim()}%`;
        countQuery = countQuery.ilike("complaint_number", s);
        dataQuery = dataQuery.ilike("complaint_number", s);
      }
      if (dateFrom) {
        const from = format(dateFrom, "yyyy-MM-dd");
        countQuery = countQuery.gte("complaint_date", from);
        dataQuery = dataQuery.gte("complaint_date", from);
      }
      if (dateTo) {
        const to = format(dateTo, "yyyy-MM-dd");
        countQuery = countQuery.lte("complaint_date", to);
        dataQuery = dataQuery.lte("complaint_date", to);
      }
      if (isStaff && user?.id) {
        countQuery = countQuery.eq("created_by", user.id);
        dataQuery = dataQuery.eq("created_by", user.id);
      }

      const [{ count }, { data }] = await Promise.all([countQuery, dataQuery]);
      setTotalCount(count || 0);
      setComplaints((data as any as ComplaintRow[]) || []);
      setLoading(false);
    }
    fetchData();
  }, [page, pageSize, companyFilter, statusFilter, categoryFilter, search, sortBy, sortOrder, dateFrom, dateTo, isStaff, user?.id]);

  // Reset page on filter change
  useEffect(() => { setPage(0); }, [companyFilter, statusFilter, categoryFilter, search, pageSize, sortBy, sortOrder, dateFrom, dateTo]);

  const totalPages = Math.ceil(totalCount / pageSize);

  async function handleExport() {
    setExporting(true);
    try {
      // Fetch ALL matching records using pagination to bypass Supabase 1000-row default limit
      const EXPORT_SELECT = `
        id, closed_case_month, closed_case_year, complaint_number, complaint_date, status, priority,
        description, resolution, resolved_at, action_items, cost_items,
        companies:company_id(name),
        branches:branch_id(name),
        product_groups:product_group_id(name),
        categories:category_id(name),
        problem_types:problem_type_id(name),
        problem_sub_types:problem_sub_type_id(name),
        callers:caller_id(name),
        root_causes:root_cause_id(name)
      `;
      const BATCH = 1000;
      let allRows: ComplaintRow[] = [];
      let from = 0;
      while (true) {
        let query = supabase.from("complaints").select(EXPORT_SELECT)
          .order("complaint_date", { ascending: false })
          .range(from, from + BATCH - 1);
        if (companyFilter !== "ALL") query = query.eq("company_id", companyFilter);
        if (statusFilter !== "ALL") query = query.eq("status", statusFilter);
        if (categoryFilter !== "ALL") query = query.eq("category_id", categoryFilter);
        if (search.trim()) query = query.ilike("complaint_number", `%${search.trim()}%`);
        if (isStaff && user?.id) query = query.eq("created_by", user.id);
        const { data } = await query;
        const batch = (data as any as ComplaintRow[]) || [];
        allRows = [...allRows, ...batch];
        if (batch.length < BATCH) break;
        from += BATCH;
      }
      const rows = allRows;

      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();
      wb.creator = "SmartCare";
      wb.created = new Date();

      const ws = wb.addWorksheet("รายงานข้อร้องเรียน", {
        pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1 },
        views: [{ state: "frozen", ySplit: 4 }],
      });

      // ── colour palette ──
      const BLUE_DARK  = "1E3A5F";
      const BLUE_MID   = "2563EB";
      const BLUE_LIGHT = "DBEAFE";
      const GOLD       = "F59E0B";
      const GRAY_ROW   = "F8FAFC";
      const WHITE      = "FFFFFF";

      const borderThin: ExcelJS.Border = { style: "thin", color: { argb: "CBD5E1" } };
      const borders = { top: borderThin, left: borderThin, bottom: borderThin, right: borderThin };

      // ── column definitions ──
      const cols = [
        { header: "ลำดับ",           key: "no",          width: 6  },
        { header: "เดือนที่ปิด",      key: "closed_month", width: 12 },
        { header: "ปีที่ปิด",         key: "closed_year",  width: 12 },
        { header: "เลขที่เอกสาร",     key: "number",      width: 22 },
        { header: "วันที่แจ้ง",        key: "date",        width: 13 },
        { header: "บริษัท",           key: "company",     width: 22 },
        { header: "สาขา",             key: "branch",      width: 18 },
        { header: "กลุ่มสินค้า",       key: "product",     width: 18 },
        { header: "หมวดหมู่",          key: "category",    width: 18 },
        { header: "ประเภทปัญหา",      key: "ptype",       width: 22 },
        { header: "ประเภทปัญหาย่อย",  key: "psubtype",    width: 22 },
        { header: "ช่องทางแจ้ง",       key: "caller",      width: 16 },
        { header: "ความสำคัญ",        key: "priority",    width: 12 },
        { header: "สถานะ",            key: "status",      width: 18 },
        { header: "Root Cause",       key: "rootcause",   width: 20 },
        { header: "รายละเอียด",        key: "desc",        width: 35 },
        { header: "มาตรการ",          key: "measure",     width: 30 },
        { header: "ผู้รับผิดชอบ",      key: "responsible", width: 18 },
        { header: "กำหนดแล้วเสร็จ",   key: "duedate",     width: 15 },
        { header: "รายการค่าใช้จ่าย",  key: "costs",       width: 35 },
        { header: "รวมค่าใช้จ่าย (บาท)", key: "totalcost", width: 16 },
      ];
      ws.columns = cols;

      const lastCol = String.fromCharCode(64 + cols.length); // e.g. "S"

      // ── Row 1: Title ──
      ws.mergeCells(`A1:${lastCol}1`);
      const titleCell = ws.getCell("A1");
      titleCell.value = "รายงานข้อร้องเรียน — SmartCare";
      titleCell.font = { name: "TH Sarabun New", bold: true, size: 20, color: { argb: WHITE } };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };
      titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BLUE_DARK } };
      ws.getRow(1).height = 36;

      // ── Row 2: Export info ──
      ws.mergeCells(`A2:${lastCol}2`);
      const infoCell = ws.getCell("A2");
      const now = new Date();
      const exportedAt = now.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })
        + "  เวลา " + now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
      infoCell.value = `ส่งออกข้อมูล ณ วันที่ ${exportedAt}  |  จำนวนทั้งหมด ${rows.length} รายการ`;
      infoCell.font = { name: "TH Sarabun New", size: 12, color: { argb: WHITE }, italic: true };
      infoCell.alignment = { horizontal: "center", vertical: "middle" };
      infoCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BLUE_MID } };
      ws.getRow(2).height = 22;

      // ── Row 3: Filter summary ──
      ws.mergeCells(`A3:${lastCol}3`);
      const filterParts: string[] = [];
      if (companyFilter !== "ALL") filterParts.push(`บริษัท: ${companies.find(c => c.id === companyFilter)?.name}`);
      if (statusFilter !== "ALL") filterParts.push(`สถานะ: ${statusFilter}`);
      if (categoryFilter !== "ALL") filterParts.push(`หมวดหมู่: ${categories.find(c => c.id === categoryFilter)?.name}`);
      if (search.trim()) filterParts.push(`ค้นหา: "${search.trim()}"`);
      const filterCell = ws.getCell("A3");
      filterCell.value = filterParts.length > 0 ? `ตัวกรอง: ${filterParts.join("  |  ")}` : "ตัวกรอง: ทั้งหมด";
      filterCell.font = { name: "TH Sarabun New", size: 11, color: { argb: BLUE_DARK } };
      filterCell.alignment = { horizontal: "left", vertical: "middle" };
      filterCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BLUE_LIGHT } };
      ws.getRow(3).height = 20;

      // ── Row 4: Header ──
      const headerRow = ws.getRow(4);
      headerRow.height = 28;
      cols.forEach((col, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = col.header;
        cell.font = { name: "TH Sarabun New", bold: true, size: 13, color: { argb: WHITE } };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GOLD } };
        cell.border = borders;
      });

      const PRIORITY_TH: Record<string, string> = { critical: "วิกฤต", high: "สูง", medium: "กลาง", low: "ต่ำ" };

      // ── Data rows ──
      rows.forEach((c, idx) => {
        const isEven = idx % 2 === 0;
        const rowBg = isEven ? WHITE : GRAY_ROW;

        const actionItems: any[] = Array.isArray(c.action_items) ? c.action_items : [];
        // One row per action item; if none, one row for the complaint
        const itemCount = Math.max(actionItems.length, 1);

        for (let ai = 0; ai < itemCount; ai++) {
          const action = actionItems[ai] || null;
          const costItems: any[] = Array.isArray(c.cost_items) ? c.cost_items : [];
          const totalCost = costItems.reduce((s, ci) => s + (parseFloat(ci.amount) || 0), 0);
          const costsText = costItems.map(ci => `${ci.item_name || ""}${ci.amount ? ` (${parseFloat(ci.amount).toLocaleString("th-TH")} บ.)` : ""}`).filter(Boolean).join("\n");

          const rowData: Record<string, any> = {
            no:          ai === 0 ? idx + 1 : "",
            closed_month: ai === 0 ? (c.closed_case_month || "-") : "",
            closed_year:  ai === 0 ? (c.closed_case_year || "-") : "",
            number:      ai === 0 ? (c.complaint_number || "-") : "",
            date:        ai === 0 ? (c.complaint_date ? new Date(c.complaint_date).toLocaleDateString("th-TH") : "-") : "",
            company:     ai === 0 ? (c.companies?.name || "-") : "",
            branch:      ai === 0 ? (c.branches?.name || "-") : "",
            product:     ai === 0 ? (c.product_groups?.name || "-") : "",
            category:    ai === 0 ? (c.categories?.name || "-") : "",
            ptype:       ai === 0 ? (c.problem_types?.name || "-") : "",
            psubtype:    ai === 0 ? (c.problem_sub_types?.name || "-") : "",
            caller:      ai === 0 ? (c.callers?.name || "-") : "",
            priority:    ai === 0 ? (PRIORITY_TH[(c.priority || "").toLowerCase()] || c.priority || "-") : "",
            status:      ai === 0 ? (c.status || "-") : "",
            rootcause:   ai === 0 ? (c.root_causes?.name || "-") : "",
            desc:        ai === 0 ? (c.description || "-") : "",
            measure:     action?.measure || "-",
            responsible: action?.responsible || "-",
            duedate:     action?.due_date ? new Date(action.due_date).toLocaleDateString("th-TH") : "-",
            costs:       ai === 0 ? (costsText || "-") : "",
            totalcost:   ai === 0 ? (totalCost > 0 ? totalCost : "") : "",
          };

          const exRow = ws.addRow(rowData);
          exRow.height = 20;

          exRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
            cell.font = { name: "TH Sarabun New", size: 12 };
            cell.alignment = { vertical: "middle", wrapText: true,
              horizontal: colNum === 1 ? "center" : colNum === 21 ? "right" : "left" };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
            cell.border = borders;
          });

          // Highlight total cost cell
          if (ai === 0 && totalCost > 0) {
            const costCell = exRow.getCell(21);
            costCell.numFmt = '#,##0.00';
            costCell.font = { name: "TH Sarabun New", size: 12, bold: true, color: { argb: "065F46" } };
            costCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "D1FAE5" } };
          }

          // Colour status cell
          if (ai === 0) {
            const statusCell = exRow.getCell(14);
            const statusBg: Record<string, string> = {
              "ปิดผู้ผลิต": "D1FAE5", "ไม่ปิดผู้ผลิต": "FEE2E2",
            };
            const statusFg: Record<string, string> = {
              "ปิดผู้ผลิต": "065F46", "ไม่ปิดผู้ผลิต": "991B1B",
            };
            const s = c.status || "";
            if (statusBg[s]) {
              statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: statusBg[s] } };
              statusCell.font = { name: "TH Sarabun New", size: 12, bold: true, color: { argb: statusFg[s] } };
            }
          }

          // Colour priority cell
          if (ai === 0) {
            const priCell = exRow.getCell(13);
            const priBg: Record<string, string> = {
              critical: "FEE2E2", high: "FEF3C7", medium: "DBEAFE", low: "F0FDF4",
            };
            const priFg: Record<string, string> = {
              critical: "991B1B", high: "92400E", medium: "1E40AF", low: "14532D",
            };
            const pk = (c.priority || "").toLowerCase();
            if (priBg[pk]) {
              priCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: priBg[pk] } };
              priCell.font = { name: "TH Sarabun New", size: 12, bold: true, color: { argb: priFg[pk] } };
            }
          }
        }
      });

      // ── Download ──
      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
      a.download = `SmartCare_Complaints_${dateStr}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNavBar />

      <div className="max-w-[1440px] mx-auto px-6 py-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">รายการข้อร้องเรียน</h1>
            <p className="text-sm text-muted-foreground mt-1">
              ทั้งหมด <span className="text-primary font-semibold">{totalCount}</span> รายการ
            </p>
          </div>
          <div className="flex items-center gap-2">
            {role === "admin" && (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={handleExport} disabled={exporting || totalCount === 0}>
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                {exporting ? "กำลัง Export..." : "Export Excel"}
              </Button>
            )}
            <Link to="/complaints/new">
              <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />บันทึกใหม่</Button>
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          {/* Filters */}
          <div className="glass rounded-2xl p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาเลขที่ Complaint..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={companyFilter} onValueChange={setCompanyFilter} disabled={isStaff}>
                <SelectTrigger><SelectValue placeholder="บริษัท" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">ทุกบริษัท</SelectItem>
                  {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="สถานะ" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">ทุกสถานะ</SelectItem>
                  {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger><SelectValue placeholder="หมวดหมู่" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">ทุกหมวดหมู่</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-muted-foreground whitespace-nowrap">วันที่แจ้ง:</span>
              <div className="flex items-center gap-2">
                <DatePickerInput value={dateFrom} onChange={setDateFrom} placeholder="ตั้งแต่วันที่" />
                <span className="text-muted-foreground text-xs">–</span>
                <DatePickerInput value={dateTo} onChange={setDateTo} placeholder="ถึงวันที่" />
                {(dateFrom || dateTo) && (
                  <Button variant="ghost" size="sm" className="h-9 px-2 text-muted-foreground" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">
                      <button className="flex items-center gap-1 hover:text-primary transition-colors" onClick={() => { setSortBy("closed_case_month"); setSortOrder(o => o === "desc" ? "asc" : "desc"); }}>
                        เดือนที่ปิด {sortBy === "closed_case_month" && (sortOrder === "desc" ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />)}
                      </button>
                    </TableHead>
                    <TableHead className="w-[100px]">
                      <button className="flex items-center gap-1 hover:text-primary transition-colors" onClick={() => { setSortBy("closed_case_year"); setSortOrder(o => o === "desc" ? "asc" : "desc"); }}>
                        ปีที่ปิด {sortBy === "closed_case_year" && (sortOrder === "desc" ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />)}
                      </button>
                    </TableHead>
                    <TableHead className="w-[140px]">
                      <button className="flex items-center gap-1 hover:text-primary transition-colors" onClick={() => { setSortBy("complaint_number"); setSortOrder(o => o === "desc" ? "asc" : "desc"); }}>
                        เลขที่ {sortBy === "complaint_number" && (sortOrder === "desc" ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />)}
                      </button>
                    </TableHead>
                    <TableHead className="w-[105px]">
                      <button className="flex items-center gap-1 hover:text-primary transition-colors" onClick={() => { setSortBy("complaint_date"); setSortOrder(o => o === "desc" ? "asc" : "desc"); }}>
                        วันที่ {sortBy === "complaint_date" && (sortOrder === "desc" ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />)}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button className="flex items-center gap-1 hover:text-primary transition-colors" onClick={() => { setSortBy("companies(name)"); setSortOrder(o => o === "desc" ? "asc" : "desc"); }}>
                        บริษัท {sortBy === "companies(name)" && (sortOrder === "desc" ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />)}
                      </button>
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      <button className="flex items-center gap-1 hover:text-primary transition-colors" onClick={() => { setSortBy("branches(name)"); setSortOrder(o => o === "desc" ? "asc" : "desc"); }}>
                        สาขา {sortBy === "branches(name)" && (sortOrder === "desc" ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />)}
                      </button>
                    </TableHead>
                    <TableHead className="hidden xl:table-cell">
                      <button className="flex items-center gap-1 hover:text-primary transition-colors" onClick={() => { setSortBy("product_groups(name)"); setSortOrder(o => o === "desc" ? "asc" : "desc"); }}>
                        กลุ่มสินค้า {sortBy === "product_groups(name)" && (sortOrder === "desc" ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />)}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button className="flex items-center gap-1 hover:text-primary transition-colors" onClick={() => { setSortBy("problem_types(name)"); setSortOrder(o => o === "desc" ? "asc" : "desc"); }}>
                        ประเภทปัญหา {sortBy === "problem_types(name)" && (sortOrder === "desc" ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />)}
                      </button>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      <button className="flex items-center gap-1 hover:text-primary transition-colors" onClick={() => { setSortBy("callers(name)"); setSortOrder(o => o === "desc" ? "asc" : "desc"); }}>
                        ผู้แจ้ง {sortBy === "callers(name)" && (sortOrder === "desc" ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />)}
                      </button>
                    </TableHead>
                    <TableHead className="w-[80px]">
                      <button className="flex items-center gap-1 hover:text-primary transition-colors" onClick={() => { setSortBy("priority"); setSortOrder(o => o === "desc" ? "asc" : "desc"); }}>
                        ความสำคัญ {sortBy === "priority" && (sortOrder === "desc" ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />)}
                      </button>
                    </TableHead>
                    <TableHead className="w-[120px]">
                      <button className="flex items-center gap-1 hover:text-primary transition-colors" onClick={() => { setSortBy("status"); setSortOrder(o => o === "desc" ? "asc" : "desc"); }}>
                        สถานะ {sortBy === "status" && (sortOrder === "desc" ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />)}
                      </button>
                    </TableHead>
                    <TableHead className="w-[70px] text-center">SLA</TableHead>
                    <TableHead className="w-[56px] text-center">แก้ไข</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={13} className="text-center py-16 text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                          กำลังโหลด...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : complaints.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={13} className="text-center py-16 text-muted-foreground">
                        ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา
                      </TableCell>
                    </TableRow>
                  ) : (
                    complaints.map(c => {
                      const daysOpen = getDaysOpen(c.complaint_date, c.resolved_at);
                      const pKey = (c.priority || "").toLowerCase();
                      return (
                        <TableRow key={c.id} className="group hover:bg-secondary/30 transition-colors">
                          <TableCell className="text-xs text-muted-foreground">{c.closed_case_month || "-"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{c.closed_case_year || "-"}</TableCell>
                          <TableCell className="font-mono text-xs text-primary/90">{c.complaint_number || "-"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{c.complaint_date || "-"}</TableCell>
                          <TableCell className="text-sm font-medium">{c.companies?.name || "-"}</TableCell>
                          <TableCell className="text-sm hidden lg:table-cell text-muted-foreground">{c.branches?.name || "-"}</TableCell>
                          <TableCell className="text-sm hidden xl:table-cell text-muted-foreground">{c.product_groups?.name || "-"}</TableCell>
                          <TableCell className="text-sm max-w-[180px]">
                            <div className="truncate">{c.problem_types?.name || "-"}</div>
                            {c.problem_sub_types?.name && (
                              <div className="text-[11px] text-muted-foreground truncate">{c.problem_sub_types.name}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs hidden md:table-cell text-muted-foreground">{c.callers?.name || "-"}</TableCell>
                          <TableCell>
                            {pKey && PRIORITY_STYLES[pKey] ? (
                              <span className={PRIORITY_STYLES[pKey]}>{PRIORITY_LABELS[pKey] || c.priority}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground/40">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs ${STATUS_COLORS[c.status || ""] || "bg-muted/30 text-muted-foreground border-border/40"}`}>
                              {c.status || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {daysOpen !== null ? (
                              <SlaChip days={daysOpen} />
                            ) : (
                              <span className="text-[10px] text-muted-foreground/40">–</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Link to={`/complaints/new?edit=${c.id}`}>
                              <button className="row-action-btn" title="แก้ไข">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>แสดง</span>
              <Select value={String(pageSize)} onValueChange={v => setPageSize(Number(v))}>
                <SelectTrigger className="w-[70px] h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
              <span>รายการ / หน้า</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                หน้า {totalPages > 0 ? page + 1 : 0} / {totalPages}
              </span>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
