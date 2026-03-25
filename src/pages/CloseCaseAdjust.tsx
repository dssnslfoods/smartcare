import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { CalendarIcon, Save, Loader2, CheckCircle2, X, Search, Eye } from "lucide-react";
import TopNavBar from "@/components/TopNavBar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
  "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
  "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 3 + i);

const STATUS_COLORS: Record<string, string> = {
  "ปิดผู้ผลิต": "bg-green-600/20 text-green-400 border-green-600/30",
  "ไม่ปิดผู้ผลิต": "bg-red-600/20 text-red-400 border-red-600/30",
  "รอดำเนินการ": "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
};

const PRIORITY_LABELS: Record<string, string> = {
  critical: "วิกฤต", high: "สูง", medium: "กลาง", low: "ต่ำ",
};
const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-600/20 text-red-400 border-red-600/30",
  high: "bg-orange-600/20 text-orange-400 border-orange-600/30",
  medium: "bg-blue-600/20 text-blue-400 border-blue-600/30",
  low: "bg-green-600/20 text-green-400 border-green-600/30",
};

interface Row {
  id: string;
  complaint_number: string | null;
  complaint_date: string | null;
  status: string | null;
  description: string | null;
  closed_case_month: number | null;
  closed_case_year: number | null;
  companies: { name: string } | null;
}

interface DetailRow extends Row {
  priority: string | null;
  description: string | null;
  resolution: string | null;
  resolved_at: string | null;
  action_items: any[] | null;
  cost_items: any[] | null;
  branches: { name: string } | null;
  product_groups: { name: string } | null;
  categories: { name: string } | null;
  problem_types: { name: string } | null;
  problem_sub_types: { name: string } | null;
  callers: { name: string } | null;
  root_causes: { name: string } | null;
}

interface EditState { month: number; year: number; }

function DatePickerInput({ value, onChange, placeholder }: { value: Date | undefined; onChange: (d: Date | undefined) => void; placeholder: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 w-[155px] justify-start text-sm font-normal gap-2">
          <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          {value ? <span>{format(value, "d MMM yyyy", { locale: th })}</span>
                 : <span className="text-muted-foreground">{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={d => { onChange(d); setOpen(false); }} initialFocus />
      </PopoverContent>
    </Popover>
  );
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm text-foreground">{value || "-"}</p>
    </div>
  );
}

function ComplaintDetailDialog({ id, open, onClose }: { id: string | null; open: boolean; onClose: () => void }) {
  const [detail, setDetail] = useState<DetailRow | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id || !open) return;
    setLoading(true);
    supabase.from("complaints").select(`
      id, complaint_number, complaint_date, status, priority, description,
      resolution, resolved_at, action_items, cost_items,
      closed_case_month, closed_case_year,
      companies:company_id(name), branches:branch_id(name),
      product_groups:product_group_id(name), categories:category_id(name),
      problem_types:problem_type_id(name), problem_sub_types:problem_sub_type_id(name),
      callers:caller_id(name), root_causes:root_cause_id(name)
    `).eq("id", id).single().then(({ data }) => {
      setDetail(data as any);
      setLoading(false);
    });
  }, [id, open]);

  const actionItems: any[] = Array.isArray(detail?.action_items) ? detail!.action_items : [];
  const costItems: any[] = Array.isArray(detail?.cost_items) ? detail!.cost_items : [];
  const totalCost = costItems.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono text-primary">
            {detail?.complaint_number || "รายละเอียดข้อร้องเรียน"}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : detail ? (
          <div className="space-y-5">
            {/* Status + Priority */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={`text-xs ${STATUS_COLORS[detail.status || ""] || "bg-muted/30 text-muted-foreground"}`}>
                {detail.status || "-"}
              </Badge>
              {detail.priority && (
                <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[(detail.priority || "").toLowerCase()] || ""}`}>
                  {PRIORITY_LABELS[(detail.priority || "").toLowerCase()] || detail.priority}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground ml-auto">
                วันที่แจ้ง: {detail.complaint_date ? format(new Date(detail.complaint_date), "d MMM yyyy", { locale: th }) : "-"}
              </span>
            </div>

            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-secondary/20">
              <DetailField label="บริษัท" value={detail.companies?.name} />
              <DetailField label="สาขา" value={detail.branches?.name} />
              <DetailField label="กลุ่มสินค้า" value={detail.product_groups?.name} />
              <DetailField label="หมวดหมู่" value={detail.categories?.name} />
              <DetailField label="ประเภทปัญหา" value={detail.problem_types?.name} />
              <DetailField label="ประเภทปัญหาย่อย" value={detail.problem_sub_types?.name} />
              <DetailField label="ผู้แจ้ง" value={detail.callers?.name} />
              <DetailField label="Root Cause" value={detail.root_causes?.name} />
            </div>

            {/* Description */}
            <div className="p-4 rounded-xl bg-secondary/20">
              <p className="text-[11px] text-muted-foreground mb-1">รายละเอียดปัญหา</p>
              <p className="text-sm text-foreground leading-relaxed">{detail.description || "-"}</p>
            </div>

            {/* Action items */}
            {actionItems.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">มาตรการแก้ไข ({actionItems.length} รายการ)</p>
                <div className="space-y-2">
                  {actionItems.map((a, i) => (
                    <div key={i} className="p-3 rounded-lg bg-secondary/20 text-sm">
                      <p className="font-medium text-foreground">{a.measure || "-"}</p>
                      <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                        {a.responsible && <span>ผู้รับผิดชอบ: {a.responsible}</span>}
                        {a.due_date && <span>กำหนด: {format(new Date(a.due_date), "d MMM yyyy", { locale: th })}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cost items */}
            {costItems.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">รายการค่าใช้จ่าย</p>
                <div className="rounded-lg overflow-hidden border border-border/30">
                  {costItems.map((c, i) => (
                    <div key={i} className="flex justify-between px-3 py-2 text-sm odd:bg-secondary/10">
                      <span>{c.item_name || "-"}</span>
                      <span className="font-medium tabular-nums">
                        {parseFloat(c.amount || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })} บ.
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between px-3 py-2 text-sm font-bold bg-secondary/30 border-t border-border/30">
                    <span>รวมทั้งสิ้น</span>
                    <span className="text-green-400">{totalCost.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บ.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Close case info */}
            <div className="flex items-center gap-4 p-3 rounded-xl bg-primary/10 text-sm">
              <span className="text-muted-foreground text-xs">ข้อมูลปิดเคส:</span>
              <span className="font-semibold text-primary">
                {detail.closed_case_month ? `${detail.closed_case_month} - ${MONTHS[detail.closed_case_month - 1]}` : "-"}
              </span>
              <span className="font-semibold text-primary">{detail.closed_case_year || "-"}</span>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export default function CloseCaseAdjust() {
  const { toast } = useToast();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter options
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [filterCompany, setFilterCompany] = useState("ALL");
  const [filterBranch, setFilterBranch] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [filterMonth, setFilterMonth] = useState("ALL");
  const [filterYear, setFilterYear] = useState("ALL");

  // Per-row edit state
  const [edits, setEdits] = useState<Record<string, EditState>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  // Detail dialog
  const [detailId, setDetailId] = useState<string | null>(null);

  // Load companies + statuses once
  useEffect(() => {
    supabase.from("companies").select("id, name").then(({ data }) => setCompanies(data || []));
    supabase.from("statuses").select("name").order("sort_order", { ascending: true }).then(({ data }) => {
      setStatuses((data || []).map(s => s.name).filter(Boolean) as string[]);
    });
  }, []);

  // Load branches when company changes
  useEffect(() => {
    if (filterCompany === "ALL") { setBranches([]); setFilterBranch("ALL"); return; }
    supabase.from("branches").select("id, name").eq("company_id", filterCompany).order("name")
      .then(({ data }) => { setBranches(data || []); setFilterBranch("ALL"); });
  }, [filterCompany]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const PAGE = 1000;
    let allFetched: Row[] = [];
    let pageNum = 0;

    while (true) {
      let query = supabase
        .from("complaints")
        .select("id, complaint_number, complaint_date, status, description, closed_case_month, closed_case_year, companies:company_id(name)")
        .order("complaint_date", { ascending: false })
        .range(pageNum * PAGE, (pageNum + 1) * PAGE - 1);

      if (filterCompany !== "ALL") query = query.eq("company_id", filterCompany);
      if (filterBranch  !== "ALL") query = query.eq("branch_id", filterBranch);
      if (filterStatus  !== "ALL") query = query.eq("status", filterStatus);
      if (dateFrom) query = query.gte("complaint_date", format(dateFrom, "yyyy-MM-dd"));
      if (dateTo)   query = query.lte("complaint_date", format(dateTo,   "yyyy-MM-dd"));
      if (filterMonth !== "ALL") query = query.eq("closed_case_month", Number(filterMonth));
      if (filterYear  !== "ALL") query = query.eq("closed_case_year",  Number(filterYear));
      if (search.trim()) query = query.ilike("complaint_number", `%${search.trim()}%`);

      const { data: chunk } = await query;
      if (!chunk || chunk.length === 0) break;
      allFetched = allFetched.concat(chunk as any as Row[]);
      if (chunk.length < PAGE) break;
      pageNum++;
    }

    const fetched = allFetched;
    setRows(fetched);

    const init: Record<string, EditState> = {};
    fetched.forEach(r => {
      const d = r.complaint_date ? new Date(r.complaint_date) : new Date();
      init[r.id] = {
        month: r.closed_case_month ?? (d.getMonth() + 1),
        year:  r.closed_case_year  ?? d.getFullYear(),
      };
    });
    setEdits(init);
    setLoading(false);
  }, [filterCompany, filterBranch, filterStatus, dateFrom, dateTo, filterMonth, filterYear, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function setField(id: string, field: keyof EditState, value: number) {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
    setSaved(prev => ({ ...prev, [id]: false }));
  }

  async function handleSave(id: string) {
    const edit = edits[id];
    if (!edit) return;
    setSaving(prev => ({ ...prev, [id]: true }));
    const { error } = await supabase.from("complaints")
      .update({ closed_case_month: edit.month, closed_case_year: edit.year })
      .eq("id", id);
    setSaving(prev => ({ ...prev, [id]: false }));
    if (error) {
      toast({ title: "บันทึกไม่สำเร็จ", description: error.message, variant: "destructive" });
    } else {
      setSaved(prev => ({ ...prev, [id]: true }));
      setTimeout(() => setSaved(prev => ({ ...prev, [id]: false })), 2000);
      setRows(prev => prev.map(r => r.id === id
        ? { ...r, closed_case_month: edit.month, closed_case_year: edit.year } : r));
    }
  }

  const isDirty = (row: Row) => {
    const e = edits[row.id];
    if (!e) return false;
    return e.month !== row.closed_case_month || e.year !== row.closed_case_year;
  };

  const hasFilter1 = search || filterCompany !== "ALL" || filterBranch !== "ALL" || filterStatus !== "ALL" || filterMonth !== "ALL" || filterYear !== "ALL";
  const hasFilter2 = dateFrom || dateTo;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNavBar />
      <div className="max-w-[1440px] mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">ปรับปรุงข้อมูลปิดเคส</h1>
          <p className="text-sm text-muted-foreground mt-1">แก้ไขเดือนและปีที่ปิดเคสของรายการข้อร้องเรียน</p>
        </div>

        {/* Filters */}
        <div className="glass rounded-2xl p-4 mb-4 space-y-3">
          {/* Row 1 */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="ค้นหาเลขที่..." value={search}
                onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
            </div>
            {/* Company */}
            <Select value={filterCompany} onValueChange={setFilterCompany}>
              <SelectTrigger className="h-9 w-[160px] text-sm"><SelectValue placeholder="บริษัท" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทุกบริษัท</SelectItem>
                {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {/* Branch — only when company selected and has branches */}
            {filterCompany !== "ALL" && branches.length > 0 && (
              <Select value={filterBranch} onValueChange={setFilterBranch}>
                <SelectTrigger className="h-9 w-[155px] text-sm"><SelectValue placeholder="สาขา" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">ทุกสาขา</SelectItem>
                  {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {/* Status */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9 w-[155px] text-sm"><SelectValue placeholder="สถานะ" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทุกสถานะ</SelectItem>
                {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            {/* Close month */}
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="h-9 w-[165px] text-sm"><SelectValue placeholder="เดือนปิดเคส" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทุกเดือนปิดเคส</SelectItem>
                {MONTHS.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{`${i + 1} - ${m}`}</SelectItem>)}
              </SelectContent>
            </Select>
            {/* Close year */}
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="h-9 w-[115px] text-sm"><SelectValue placeholder="ปีปิดเคส" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทุกปีปิดเคส</SelectItem>
                {YEAR_OPTIONS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            {hasFilter1 && (
              <Button variant="ghost" size="sm" className="h-9 px-2 text-muted-foreground"
                onClick={() => { setSearch(""); setFilterCompany("ALL"); setFilterBranch("ALL"); setFilterStatus("ALL"); setFilterMonth("ALL"); setFilterYear("ALL"); }}>
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {/* Row 2: date range + count */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-muted-foreground whitespace-nowrap">วันที่แจ้ง:</span>
            <DatePickerInput value={dateFrom} onChange={setDateFrom} placeholder="ตั้งแต่วันที่" />
            <span className="text-muted-foreground text-xs">–</span>
            <DatePickerInput value={dateTo} onChange={setDateTo} placeholder="ถึงวันที่" />
            {hasFilter2 && (
              <Button variant="ghost" size="sm" className="h-9 px-2 text-muted-foreground"
                onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}>
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
            <span className="ml-auto text-xs text-muted-foreground">
              {loading ? "กำลังโหลด..." : `แสดง ${rows.length} รายการ`}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead className="w-[160px]">เลขที่</TableHead>
                  <TableHead className="w-[110px]">วันที่แจ้ง</TableHead>
                  <TableHead>รายละเอียด</TableHead>
                  <TableHead className="w-[130px]">สถานะ</TableHead>
                  <TableHead className="w-[175px]">เดือนปิดเคส</TableHead>
                  <TableHead className="w-[130px]">ปีปิดเคส</TableHead>
                  <TableHead className="w-[80px] text-center">บันทึก</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        กำลังโหลด...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                      ไม่พบข้อมูลที่ตรงกับเงื่อนไข
                    </TableCell>
                  </TableRow>
                ) : rows.map(row => {
                  const edit = edits[row.id];
                  const dirty = isDirty(row);
                  const isSaving = saving[row.id];
                  const isSaved = saved[row.id];
                  return (
                    <TableRow key={row.id} className="group hover:bg-secondary/30 transition-colors">
                      {/* Detail button */}
                      <TableCell className="text-center">
                        <button
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                          title="ดูรายละเอียด"
                          onClick={() => setDetailId(row.id)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </TableCell>
                      <TableCell
                        className="font-mono text-xs text-primary/90 cursor-pointer hover:text-primary hover:underline"
                        onClick={() => setDetailId(row.id)}
                      >
                        {row.complaint_number || "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {row.complaint_date ? format(new Date(row.complaint_date), "d MMM yyyy", { locale: th }) : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[280px]">
                        <div className="truncate" title={row.description || ""}>{row.description || "-"}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${STATUS_COLORS[row.status || ""] || "bg-muted/30 text-muted-foreground border-border/40"}`}>
                          {row.status || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select value={String(edit?.month ?? "")} onValueChange={v => setField(row.id, "month", Number(v))}>
                          <SelectTrigger className="h-8 text-xs w-[160px]"><SelectValue placeholder="เลือกเดือน" /></SelectTrigger>
                          <SelectContent>
                            {MONTHS.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{`${i + 1} - ${m}`}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={String(edit?.year ?? "")} onValueChange={v => setField(row.id, "year", Number(v))}>
                          <SelectTrigger className="h-8 text-xs w-[110px]"><SelectValue placeholder="เลือกปี" /></SelectTrigger>
                          <SelectContent>
                            {YEAR_OPTIONS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-center">
                        {isSaved ? (
                          <CheckCircle2 className="h-5 w-5 text-green-400 mx-auto" />
                        ) : (
                          <Button size="sm" variant={dirty ? "default" : "ghost"}
                            className="h-8 px-3 text-xs" disabled={!dirty || isSaving}
                            onClick={() => handleSave(row.id)}>
                            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <ComplaintDetailDialog id={detailId} open={!!detailId} onClose={() => setDetailId(null)} />
      <Footer />
    </div>
  );
}
