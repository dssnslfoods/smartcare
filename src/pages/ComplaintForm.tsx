import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ClipboardList, Save, Plus, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LookupItem {
  id: string;
  name: string;
}

interface LookupData {
  companies: LookupItem[];
  branches: (LookupItem & { company_id: string })[];
  product_groups: LookupItem[];
  categories: (LookupItem & { product_group_id: string })[];
  problem_types: LookupItem[];
  problem_sub_types: (LookupItem & { problem_type_id: string })[];
  callers: LookupItem[];
}

const INITIAL_FORM = {
  complaint_number: "",
  complaint_date: "",
  company_id: "",
  branch_id: "",
  product_group_id: "",
  category_id: "",
  problem_type_id: "",
  problem_sub_type_id: "",
  caller_id: "",
  description: "",
  status: "ปิดผู้ผลิต",
  priority: "medium",
  resolution: "",
  resolved_at: "",
};

export default function ComplaintForm() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [lookup, setLookup] = useState<LookupData>({
    companies: [],
    branches: [],
    product_groups: [],
    categories: [],
    problem_types: [],
    problem_sub_types: [],
    callers: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);

  // Load all master data for dropdowns
  useEffect(() => {
    async function fetchLookups() {
      const [companies, branches, productGroups, categories, problemTypes, problemSubTypes, callers] =
        await Promise.all([
          supabase.from("companies").select("id, name").order("name"),
          supabase.from("branches").select("id, name, company_id").order("name"),
          supabase.from("product_groups").select("id, name").order("name"),
          supabase.from("categories").select("id, name, product_group_id").order("name"),
          supabase.from("problem_types").select("id, name").order("name"),
          supabase.from("problem_sub_types").select("id, name, problem_type_id").order("name"),
          supabase.from("callers").select("id, name").order("name"),
        ]);

      setLookup({
        companies: companies.data || [],
        branches: (branches.data || []) as (LookupItem & { company_id: string })[],
        product_groups: productGroups.data || [],
        categories: (categories.data || []) as (LookupItem & { product_group_id: string })[],
        problem_types: problemTypes.data || [],
        problem_sub_types: (problemSubTypes.data || []) as (LookupItem & { problem_type_id: string })[],
        callers: callers.data || [],
      });
      setLoading(false);
    }
    fetchLookups();
    fetchRecent();
  }, []);

  async function fetchRecent() {
    const { data } = await supabase
      .from("complaints")
      .select(`
        id, complaint_number, complaint_date, status,
        companies:company_id(name),
        problem_types:problem_type_id(name),
        problem_sub_types:problem_sub_type_id(name)
      `)
      .order("created_at", { ascending: false })
      .limit(5);
    setRecentComplaints(data || []);
  }

  function setField(key: string, value: string) {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      // Reset dependent dropdowns
      if (key === "company_id") next.branch_id = "";
      if (key === "product_group_id") next.category_id = "";
      if (key === "problem_type_id") next.problem_sub_type_id = "";
      return next;
    });
  }

  // Filtered options based on parent selection
  const filteredBranches = form.company_id
    ? lookup.branches.filter(b => b.company_id === form.company_id)
    : lookup.branches;

  const filteredCategories = form.product_group_id
    ? lookup.categories.filter(c => c.product_group_id === form.product_group_id)
    : lookup.categories;

  const filteredSubTypes = form.problem_type_id
    ? lookup.problem_sub_types.filter(s => s.problem_type_id === form.problem_type_id)
    : lookup.problem_sub_types;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.complaint_number) {
      toast.error("กรุณากรอกเลขที่เอกสาร");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        complaint_number: form.complaint_number,
        complaint_date: form.complaint_date || null,
        description: form.description || null,
        status: form.status || null,
        priority: form.priority || null,
        resolution: form.resolution || null,
        resolved_at: form.resolved_at || null,
      };

      // Only set FK fields if selected
      if (form.company_id) payload.company_id = form.company_id;
      if (form.branch_id) payload.branch_id = form.branch_id;
      if (form.product_group_id) payload.product_group_id = form.product_group_id;
      if (form.category_id) payload.category_id = form.category_id;
      if (form.problem_type_id) payload.problem_type_id = form.problem_type_id;
      if (form.problem_sub_type_id) payload.problem_sub_type_id = form.problem_sub_type_id;
      if (form.caller_id) payload.caller_id = form.caller_id;

      const { error } = await supabase.from("complaints").insert(payload as any);

      if (error) throw error;

      toast.success("บันทึกข้อร้องเรียนสำเร็จ");
      setForm(INITIAL_FORM);
      fetchRecent();
    } catch (err: any) {
      toast.error(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b border-border"
        style={{ background: "linear-gradient(135deg, hsl(217,33%,17%) 0%, hsl(222,47%,11%) 100%)" }}
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-wide flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                บันทึกข้อร้องเรียน
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                กรอกข้อมูล Complaint ใหม่เข้าระบบ
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/master-data">
              <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                Master Data
              </Badge>
            </Link>
            <Link to="/">
              <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                ← Dashboard
              </Badge>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="border-border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  ข้อมูลข้อร้องเรียน
                </CardTitle>
                <CardDescription>กรอกรายละเอียดเพื่อบันทึก Complaint ใหม่</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Row 1: Doc Number & Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="complaint_number">เลขที่เอกสาร *</Label>
                      <Input
                        id="complaint_number"
                        placeholder="เช่น QAS.2.2025.09/001"
                        value={form.complaint_number}
                        onChange={e => setField("complaint_number", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="complaint_date">วันที่</Label>
                      <Input
                        id="complaint_date"
                        type="date"
                        value={form.complaint_date}
                        onChange={e => setField("complaint_date", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Row 2: Company & Branch */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>บริษัท</Label>
                      <select
                        className="filter-select w-full"
                        value={form.company_id}
                        onChange={e => setField("company_id", e.target.value)}
                      >
                        <option value="">-- เลือกบริษัท --</option>
                        {lookup.companies.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>สาขา</Label>
                      <select
                        className="filter-select w-full"
                        value={form.branch_id}
                        onChange={e => setField("branch_id", e.target.value)}
                      >
                        <option value="">-- เลือกสาขา --</option>
                        {filteredBranches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 3: Product Group & Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>กลุ่มสินค้า</Label>
                      <select
                        className="filter-select w-full"
                        value={form.product_group_id}
                        onChange={e => setField("product_group_id", e.target.value)}
                      >
                        <option value="">-- เลือกกลุ่มสินค้า --</option>
                        {lookup.product_groups.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>หมวดหมู่</Label>
                      <select
                        className="filter-select w-full"
                        value={form.category_id}
                        onChange={e => setField("category_id", e.target.value)}
                      >
                        <option value="">-- เลือกหมวดหมู่ --</option>
                        {filteredCategories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 4: Problem Type & Sub Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>ประเภทปัญหา</Label>
                      <select
                        className="filter-select w-full"
                        value={form.problem_type_id}
                        onChange={e => setField("problem_type_id", e.target.value)}
                      >
                        <option value="">-- เลือกประเภทปัญหา --</option>
                        {lookup.problem_types.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>ประเภทปัญหาย่อย</Label>
                      <select
                        className="filter-select w-full"
                        value={form.problem_sub_type_id}
                        onChange={e => setField("problem_sub_type_id", e.target.value)}
                      >
                        <option value="">-- เลือกประเภทย่อย --</option>
                        {filteredSubTypes.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 5: Caller & Status */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>ผู้แจ้ง</Label>
                      <select
                        className="filter-select w-full"
                        value={form.caller_id}
                        onChange={e => setField("caller_id", e.target.value)}
                      >
                        <option value="">-- เลือกผู้แจ้ง --</option>
                        {lookup.callers.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>สถานะ</Label>
                      <select
                        className="filter-select w-full"
                        value={form.status}
                        onChange={e => setField("status", e.target.value)}
                      >
                        <option value="ปิดผู้ผลิต">ปิดผู้ผลิต</option>
                        <option value="ไม่ปิดผู้ผลิต">ไม่ปิดผู้ผลิต</option>
                        <option value="ปิดเป็น RD">ปิดเป็น RD</option>
                        <option value="คาดปิดผู้ผลิต">คาดปิดผู้ผลิต</option>
                        <option value="คาดไม่ปิดผู้ผลิต">คาดไม่ปิดผู้ผลิต</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>ความสำคัญ</Label>
                      <select
                        className="filter-select w-full"
                        value={form.priority}
                        onChange={e => setField("priority", e.target.value)}
                      >
                        <option value="low">ต่ำ</option>
                        <option value="medium">กลาง</option>
                        <option value="high">สูง</option>
                        <option value="critical">วิกฤต</option>
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">รายละเอียด</Label>
                    <Textarea
                      id="description"
                      placeholder="อธิบายรายละเอียดข้อร้องเรียน..."
                      value={form.description}
                      onChange={e => setField("description", e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Resolution & Resolved Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="resolution">การแก้ไข</Label>
                      <Textarea
                        id="resolution"
                        placeholder="วิธีการแก้ไข (ถ้ามี)..."
                        value={form.resolution}
                        onChange={e => setField("resolution", e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="resolved_at">วันที่แก้ไข</Label>
                      <Input
                        id="resolved_at"
                        type="date"
                        value={form.resolved_at}
                        onChange={e => setField("resolved_at", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <Button type="submit" disabled={saving} size="lg" className="w-full">
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> กำลังบันทึก...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Save className="h-4 w-4" /> บันทึกข้อร้องเรียน
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Recent complaints sidebar */}
          <div>
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">ข้อร้องเรียนล่าสุด</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentComplaints.length === 0 ? (
                  <p className="text-xs text-muted-foreground">ยังไม่มีข้อมูล</p>
                ) : (
                  recentComplaints.map((c: any) => (
                    <div key={c.id} className="p-3 rounded-lg bg-muted/30 border border-border space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{c.complaint_number}</span>
                        <Badge
                          variant={c.status === "ปิดผู้ผลิต" ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {c.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {c.complaint_date ? new Date(c.complaint_date).toLocaleDateString("th-TH") : "-"}
                        {c.problem_types?.name && ` • ${c.problem_types.name}`}
                      </div>
                      {c.problem_sub_types?.name && (
                        <div className="text-xs text-muted-foreground">{c.problem_sub_types.name}</div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
