import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import TopNavBar from "@/components/TopNavBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Footer from "@/components/Footer";

interface ComplaintRow {
  id: string;
  complaint_number: string | null;
  complaint_date: string | null;
  status: string | null;
  priority: string | null;
  resolution: string | null;
  resolved_at: string | null;
  companies: { name: string } | null;
  branches: { name: string } | null;
  product_groups: { name: string } | null;
  categories: { name: string } | null;
  problem_types: { name: string } | null;
  problem_sub_types: { name: string } | null;
  callers: { name: string } | null;
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
  const { role, userProfile } = useAuth();
  const isStaff = role === "staff";

  const [complaints, setComplaints] = useState<ComplaintRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Pagination
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

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

      const { data: statusData } = await supabase.from("complaints").select("status");
      setStatuses([...new Set((statusData || []).map(c => c.status).filter(Boolean) as string[])]);
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
        id, complaint_number, complaint_date, status, priority, resolution, resolved_at,
        companies:company_id(name),
        branches:branch_id(name),
        product_groups:product_group_id(name),
        categories:category_id(name),
        problem_types:problem_type_id(name),
        problem_sub_types:problem_sub_type_id(name),
        callers:caller_id(name)
      `).order("complaint_date", { ascending: false }).range(page * pageSize, (page + 1) * pageSize - 1);

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

      const [{ count }, { data }] = await Promise.all([countQuery, dataQuery]);
      setTotalCount(count || 0);
      setComplaints((data as any as ComplaintRow[]) || []);
      setLoading(false);
    }
    fetchData();
  }, [page, pageSize, companyFilter, statusFilter, categoryFilter, search]);

  // Reset page on filter change
  useEffect(() => { setPage(0); }, [companyFilter, statusFilter, categoryFilter, search, pageSize]);

  const totalPages = Math.ceil(totalCount / pageSize);

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
          <Link to="/complaints/new">
            <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />บันทึกใหม่</Button>
          </Link>
        </div>

        <div className="space-y-4">
          {/* Filters */}
          <div className="glass rounded-2xl p-4">
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
          </div>

          {/* Table */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">เลขที่</TableHead>
                    <TableHead className="w-[95px]">วันที่</TableHead>
                    <TableHead>บริษัท</TableHead>
                    <TableHead className="hidden lg:table-cell">สาขา</TableHead>
                    <TableHead className="hidden xl:table-cell">กลุ่มสินค้า</TableHead>
                    <TableHead>ประเภทปัญหา</TableHead>
                    <TableHead className="hidden md:table-cell">ผู้แจ้ง</TableHead>
                    <TableHead className="w-[80px]">ความสำคัญ</TableHead>
                    <TableHead className="w-[120px]">สถานะ</TableHead>
                    <TableHead className="w-[70px] text-center">SLA</TableHead>
                    <TableHead className="w-[56px] text-center">แก้ไข</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-16 text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                          กำลังโหลด...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : complaints.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-16 text-muted-foreground">
                        ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา
                      </TableCell>
                    </TableRow>
                  ) : (
                    complaints.map(c => {
                      const daysOpen = getDaysOpen(c.complaint_date, c.resolved_at);
                      const pKey = (c.priority || "").toLowerCase();
                      return (
                        <TableRow key={c.id} className="group hover:bg-secondary/30 transition-colors">
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
