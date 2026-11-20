import { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { CalendarIcon, Save, Loader2, CheckCircle2, X, Search, PhoneCall, BadgeCheck } from "lucide-react";
import TopNavBar from "@/components/TopNavBar";
import Footer from "@/components/Footer";
import NewBadge from "@/components/NewBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { parseCallCount, MAX_CALL_COUNT } from "@/lib/callCount";

interface Row {
  id: string;
  complaint_number: string | null;
  complaint_date: string | null;
  description: string | null;
  call_count: number;
  call_count_reviewed_at: string | null;
  companies: { name: string } | null;
  product_groups: { name: string } | null;
  problem_types: { name: string } | null;
}

type ReviewFilter = "UNREVIEWED" | "REVIEWED" | "ALL";

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

export default function CallCountAdjust() {
  const { user } = useAuth();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<{ total: number; reviewed: number } | null>(null);

  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [filterCompany, setFilterCompany] = useState("ALL");
  const [filterReview, setFilterReview] = useState<ReviewFilter>("UNREVIEWED");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    supabase.from("companies").select("id, name").order("name").then(({ data }) => setCompanies(data || []));
  }, []);

  const fetchProgress = useCallback(async () => {
    const [{ count: total }, { count: reviewed }] = await Promise.all([
      supabase.from("complaints").select("id", { count: "exact", head: true }),
      supabase.from("complaints").select("id", { count: "exact", head: true }).not("call_count_reviewed_at", "is", null),
    ]);
    setProgress({ total: total ?? 0, reviewed: reviewed ?? 0 });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const PAGE = 1000;
    let all: Row[] = [];
    for (let pageNum = 0; ; pageNum++) {
      let query = supabase
        .from("complaints")
        .select(`id, complaint_number, complaint_date, description, call_count, call_count_reviewed_at,
          companies:company_id(name), product_groups:product_group_id(name), problem_types:problem_type_id(name)`)
        .order("complaint_date", { ascending: false })
        .range(pageNum * PAGE, (pageNum + 1) * PAGE - 1);
      if (filterCompany !== "ALL") query = query.eq("company_id", filterCompany);
      if (filterReview === "UNREVIEWED") query = query.is("call_count_reviewed_at", null);
      if (filterReview === "REVIEWED") query = query.not("call_count_reviewed_at", "is", null);
      if (dateFrom) query = query.gte("complaint_date", format(dateFrom, "yyyy-MM-dd"));
      if (dateTo) query = query.lte("complaint_date", format(dateTo, "yyyy-MM-dd"));
      if (search.trim()) query = query.ilike("complaint_number", `%${search.trim()}%`);
      const { data: chunk, error } = await query;
      if (error) { toast.error(`โหลดข้อมูลไม่สำเร็จ: ${error.message}`); break; }
      if (!chunk || chunk.length === 0) break;
      all = all.concat(chunk as unknown as Row[]);
      if (chunk.length < PAGE) break;
    }
    setRows(all);
    setEdits(Object.fromEntries(all.map(r => [r.id, String(r.call_count ?? 1)])));
    setLoading(false);
  }, [filterCompany, filterReview, dateFrom, dateTo, search]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchProgress(); }, [fetchProgress]);

  function setValue(id: string, value: string) {
    setEdits(prev => ({ ...prev, [id]: value.replace(/[^\d]/g, "") }));
    setSaved(prev => ({ ...prev, [id]: false }));
  }

  /** Save the call count; also marks the row as reviewed even when the number is unchanged. */
  async function handleSave(row: Row, focusNext = false) {
    const value = parseCallCount(edits[row.id]);
    if (value === null) { toast.error(`จำนวน Call ต้องเป็นจำนวนเต็ม 1–${MAX_CALL_COUNT}`); return; }
    setSaving(prev => ({ ...prev, [row.id]: true }));
    const reviewedAt = new Date().toISOString();
    const { error } = await supabase.from("complaints")
      .update({ call_count: value, call_count_reviewed_at: reviewedAt, call_count_reviewed_by: user?.id ?? null })
      .eq("id", row.id);
    setSaving(prev => ({ ...prev, [row.id]: false }));
    if (error) { toast.error(`บันทึกไม่สำเร็จ: ${error.message}`); return; }

    const wasUnreviewed = !row.call_count_reviewed_at;
    setRows(prev => prev.map(r => r.id === row.id ? { ...r, call_count: value, call_count_reviewed_at: reviewedAt } : r));
    setSaved(prev => ({ ...prev, [row.id]: true }));
    setTimeout(() => setSaved(prev => ({ ...prev, [row.id]: false })), 2000);
    if (wasUnreviewed) setProgress(p => p ? { ...p, reviewed: p.reviewed + 1 } : p);

    if (focusNext) {
      const idx = rows.findIndex(r => r.id === row.id);
      const next = rows[idx + 1];
      if (next) inputRefs.current[next.id]?.focus();
    }
  }

  const hasFilter = search || filterCompany !== "ALL" || dateFrom || dateTo;
  const pct = progress && progress.total > 0 ? Math.round((progress.reviewed / progress.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNavBar />
      <div className="max-w-[1440px] mx-auto px-6 py-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <PhoneCall className="h-5 w-5 text-primary" />
              กรอกจำนวน Call ย้อนหลัง <NewBadge className="ml-1 text-[10px]" />
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              ตรวจและบันทึกจำนวนครั้งที่แจ้งปัญหา (Call) ของแต่ละเลขที่เอกสาร — กด Enter เพื่อบันทึกและไปแถวถัดไป
            </p>
          </div>
          {progress && (
            <div className="glass rounded-2xl px-4 py-3 w-[300px]">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-muted-foreground">ตรวจจำนวน Call แล้ว</span>
                <span className="font-semibold tabular-nums">
                  {progress.reviewed.toLocaleString()} / {progress.total.toLocaleString()} ({pct}%)
                </span>
              </div>
              <Progress value={pct} className="h-2" />
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="glass rounded-2xl p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="ค้นหาเลขที่..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
            </div>
            <Select value={filterReview} onValueChange={v => setFilterReview(v as ReviewFilter)}>
              <SelectTrigger className="h-9 w-[160px] text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="UNREVIEWED">ยังไม่ตรวจ</SelectItem>
                <SelectItem value="REVIEWED">ตรวจแล้ว</SelectItem>
                <SelectItem value="ALL">ทั้งหมด</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCompany} onValueChange={setFilterCompany}>
              <SelectTrigger className="h-9 w-[160px] text-sm"><SelectValue placeholder="บริษัท" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทุกบริษัท</SelectItem>
                {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground whitespace-nowrap">วันที่แจ้ง:</span>
            <DatePickerInput value={dateFrom} onChange={setDateFrom} placeholder="ตั้งแต่วันที่" />
            <span className="text-muted-foreground text-xs">–</span>
            <DatePickerInput value={dateTo} onChange={setDateTo} placeholder="ถึงวันที่" />
            {hasFilter && (
              <Button variant="ghost" size="sm" className="h-9 px-2 text-muted-foreground"
                onClick={() => { setSearch(""); setFilterCompany("ALL"); setDateFrom(undefined); setDateTo(undefined); }}>
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
            <span className="ml-auto text-xs text-muted-foreground">
              {loading ? "กำลังโหลด..." : `แสดง ${rows.length.toLocaleString()} รายการ`}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">เลขที่</TableHead>
                  <TableHead className="w-[110px]">วันที่แจ้ง</TableHead>
                  <TableHead className="w-[150px]">บริษัท / กลุ่มสินค้า</TableHead>
                  <TableHead>รายละเอียด</TableHead>
                  <TableHead className="w-[110px] text-center">จำนวน Call</TableHead>
                  <TableHead className="w-[120px] text-center">สถานะตรวจ</TableHead>
                  <TableHead className="w-[80px] text-center">บันทึก</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        กำลังโหลด...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                      {filterReview === "UNREVIEWED" ? "ตรวจจำนวน Call ครบทุกรายการตามเงื่อนไขแล้ว 🎉" : "ไม่พบข้อมูลที่ตรงกับเงื่อนไข"}
                    </TableCell>
                  </TableRow>
                ) : rows.map(row => {
                  const value = edits[row.id] ?? "";
                  const valid = parseCallCount(value) !== null;
                  const dirty = value !== String(row.call_count);
                  const reviewed = !!row.call_count_reviewed_at;
                  const isSaving = saving[row.id];
                  return (
                    <TableRow key={row.id} className="hover:bg-secondary/30 transition-colors align-top">
                      <TableCell className="font-mono text-xs text-primary/90 pt-4">{row.complaint_number || "-"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground pt-4">
                        {row.complaint_date ? format(new Date(row.complaint_date), "d MMM yyyy", { locale: th }) : "-"}
                      </TableCell>
                      <TableCell className="text-xs pt-4">
                        <div className="font-medium">{row.companies?.name || "-"}</div>
                        <div className="text-muted-foreground">{row.product_groups?.name || ""}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[420px]">
                        <div className="whitespace-pre-line line-clamp-4" title={row.description || ""}>{row.description || "-"}</div>
                        {row.problem_types?.name && <div className="mt-1 text-[11px] text-primary/70">{row.problem_types.name}</div>}
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          ref={el => { inputRefs.current[row.id] = el; }}
                          type="number" inputMode="numeric" min={1} max={MAX_CALL_COUNT} step={1}
                          value={value}
                          onChange={e => setValue(row.id, e.target.value)}
                          onKeyDown={e => {
                            if ([".", ",", "-", "+", "e", "E"].includes(e.key)) e.preventDefault();
                            if (e.key === "Enter") { e.preventDefault(); handleSave(row, true); }
                          }}
                          className={`h-9 w-20 mx-auto text-center font-semibold ${!valid ? "border-destructive" : dirty ? "border-orange-400" : ""}`}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        {reviewed ? (
                          <Badge variant="outline" className="text-[11px] bg-green-600/15 text-green-400 border-green-600/30 gap-1">
                            <BadgeCheck className="h-3 w-3" />ตรวจแล้ว
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[11px] bg-muted/30 text-muted-foreground border-border/40">ยังไม่ตรวจ</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {saved[row.id] ? (
                          <CheckCircle2 className="h-5 w-5 text-green-400 mx-auto" />
                        ) : (
                          <Button size="sm" variant={dirty || !reviewed ? "default" : "ghost"}
                            className="h-8 px-3 text-xs" disabled={!valid || isSaving || (!dirty && reviewed)}
                            title={!dirty && !reviewed ? "ยืนยันจำนวน Call นี้" : "บันทึก"}
                            onClick={() => handleSave(row)}>
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
      <Footer />
    </div>
  );
}
