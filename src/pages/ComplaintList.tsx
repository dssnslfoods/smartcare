import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Search, ChevronLeft, ChevronRight, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface ComplaintRow {
  id: string;
  complaint_number: string | null;
  complaint_date: string | null;
  status: string | null;
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

const PAGE_SIZE_OPTIONS = [20, 50, 100];

const STATUS_COLORS: Record<string, string> = {
  "ปิดผู้ผลิต": "bg-green-600/20 text-green-400 border-green-600/30",
  "ไม่ปิดผู้ผลิต": "bg-red-600/20 text-red-400 border-red-600/30",
  "รอดำเนินการ": "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
};

export default function ComplaintList() {
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
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    async function fetchOptions() {
      const [compRes, catRes] = await Promise.all([
        supabase.from("companies").select("id, name"),
        supabase.from("categories").select("name"),
      ]);
      setCompanies(compRes.data || []);
      setCategories([...new Set((catRes.data || []).map(c => c.name).filter(Boolean))]);

      const { data: statusData } = await supabase.from("complaints").select("status");
      setStatuses([...new Set((statusData || []).map(c => c.status).filter(Boolean) as string[])]);
    }
    fetchOptions();
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      let countQuery = supabase.from("complaints").select("*", { count: "exact", head: true });
      let dataQuery = supabase.from("complaints").select(`
        id, complaint_number, complaint_date, status, resolution, resolved_at,
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
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <List className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">รายการข้อร้องเรียนทั้งหมด</h1>
            <Badge variant="secondary" className="ml-2">{totalCount} รายการ</Badge>
          </div>
          <Link to="/complaints/new">
            <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />บันทึกใหม่</Button>
          </Link>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-4">
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
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
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
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
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">เลขที่</TableHead>
                    <TableHead className="w-[100px]">วันที่</TableHead>
                    <TableHead>บริษัท</TableHead>
                    <TableHead>สาขา</TableHead>
                    <TableHead>กลุ่มสินค้า</TableHead>
                    <TableHead>ประเภทปัญหา</TableHead>
                    <TableHead>ผู้แจ้ง</TableHead>
                    <TableHead className="w-[120px]">สถานะ</TableHead>
                    <TableHead className="w-[100px]">วันที่แก้ไข</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                        กำลังโหลด...
                      </TableCell>
                    </TableRow>
                  ) : complaints.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                        ไม่พบข้อมูล
                      </TableCell>
                    </TableRow>
                  ) : (
                    complaints.map(c => (
                      <TableRow key={c.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-xs">{c.complaint_number || "-"}</TableCell>
                        <TableCell className="text-xs">{c.complaint_date || "-"}</TableCell>
                        <TableCell className="text-sm">{c.companies?.name || "-"}</TableCell>
                        <TableCell className="text-sm">{c.branches?.name || "-"}</TableCell>
                        <TableCell className="text-sm">{c.product_groups?.name || "-"}</TableCell>
                        <TableCell className="text-sm">{c.problem_types?.name || "-"}</TableCell>
                        <TableCell className="text-sm">{c.callers?.name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${STATUS_COLORS[c.status || ""] || "bg-muted text-muted-foreground"}`}>
                            {c.status || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{c.resolved_at || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

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
  );
}
