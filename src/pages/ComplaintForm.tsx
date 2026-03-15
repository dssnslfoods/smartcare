import { useState, useEffect, useRef } from "react";
import { Save, Plus, Loader2, CheckCircle2, CalendarIcon, Mic, MicOff } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import TopNavBar from "@/components/TopNavBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LookupItem { id: string; name: string; }
interface LookupData {
  companies: LookupItem[];
  branches: (LookupItem & { company_id: string })[];
  product_groups: LookupItem[];
  categories: LookupItem[];
  problem_types: (LookupItem & { category_id: string | null })[];
  problem_sub_types: (LookupItem & { problem_type_id: string })[];
  callers: LookupItem[];
  statuses: (LookupItem & { code: string | null })[];
  priorities: (LookupItem & { code: string })[];
}

const INITIAL_FORM = {
  complaint_number: "", complaint_date: "", company_id: "", branch_id: "",
  product_group_id: "", category_id: "", problem_type_id: "", problem_sub_type_id: "",
  caller_id: "", description: "", status: "", priority: "",
  resolution: "", resolved_at: "",
};

// Hardcoded defaults in case database fetch fails
const DEFAULT_STATUSES = [
  { value: "ปิดผู้ผลิต", label: "ปิดผู้ผลิต" },
  { value: "ไม่ปิดผู้ผลิต", label: "ไม่ปิดผู้ผลิต" },
  { value: "ปิดเป็น RD", label: "ปิดเป็น RD" },
  { value: "คาดปิดผู้ผลิต", label: "คาดปิดผู้ผลิต" },
  { value: "คาดไม่ปิดผู้ผลิต", label: "คาดไม่ปิดผู้ผลิต" },
];

const DEFAULT_PRIORITIES = [
  { value: "low", label: "ต่ำ" },
  { value: "medium", label: "กลาง" },
  { value: "high", label: "สูง" },
  { value: "critical", label: "วิกฤต" },
];

export default function ComplaintForm() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [lookup, setLookup] = useState<LookupData>({
    companies: [], branches: [], product_groups: [], categories: [],
    problem_types: [], problem_sub_types: [], callers: [], statuses: [], priorities: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [listeningField, setListeningField] = useState<"description" | "resolution" | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    async function fetchLookups() {
      const [companies, branches, productGroups, categories, problemTypes, problemSubTypes, callers, statuses, priorities] =
        await Promise.all([
          supabase.from("companies").select("id, name").order("name"),
          supabase.from("branches").select("id, name, company_id").order("name"),
          supabase.from("product_groups").select("id, name").order("name"),
          supabase.from("categories").select("id, name").order("name"),
          supabase.from("problem_types").select("id, name, category_id").order("name"),
          supabase.from("problem_sub_types").select("id, name, problem_type_id").order("name"),
          supabase.from("callers").select("id, name").order("name"),
          supabase.from("statuses").select("id, name, code").order("name"),
          supabase.from("priorities").select("id, name, code").order("name"),
        ]);
      setLookup({
        companies: companies.data || [],
        branches: (branches.data || []) as any,
        product_groups: productGroups.data || [],
        categories: (categories.data || []) as any,
        problem_types: problemTypes.data || [],
        problem_sub_types: (problemSubTypes.data || []) as any,
        callers: callers.data || [],
        statuses: (statuses.data || []) as any,
        priorities: (priorities.data || []) as any,
      });
      setLoading(false);
    }

    // Initialize speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = "th-TH";
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            setForm(prev => {
              if (listeningField === "resolution") {
                return { ...prev, resolution: (prev.resolution + " " + transcript).trim() };
              }
              return { ...prev, description: (prev.description + " " + transcript).trim() };
            });
          } else {
            interimTranscript += transcript;
          }
        }
      };

      recognition.onerror = (event: any) => {
        toast.error(`ข้อผิดพลาด: ${event.error}`);
      };

      recognitionRef.current = recognition;
    }

    fetchLookups();
    fetchRecent();
  }, []);

  async function fetchRecent() {
    const { data } = await supabase.from("complaints").select(`
      id, complaint_number, complaint_date, status,
      companies:company_id(name), problem_types:problem_type_id(name),
      problem_sub_types:problem_sub_type_id(name)
    `).order("created_at", { ascending: false }).limit(5);
    setRecentComplaints(data || []);
  }

  function setField(key: string, value: string) {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === "company_id") next.branch_id = "";
      if (key === "category_id") { next.problem_type_id = ""; next.problem_sub_type_id = ""; }
      if (key === "problem_type_id") next.problem_sub_type_id = "";
      return next;
    });
  }

  function toggleMic(field: "description" | "resolution") {
    if (!recognitionRef.current) {
      toast.error("ไม่รองรับเสียงในเบราว์เซอร์นี้");
      return;
    }
    if (isListening && listeningField === field) {
      recognitionRef.current.stop();
      setListeningField(null);
    } else {
      setListeningField(field);
      recognitionRef.current.start();
    }
  }

  const filteredBranches = form.company_id
    ? lookup.branches.filter(b => b.company_id === form.company_id) : lookup.branches;
  const filteredProblemTypes = form.category_id
    ? lookup.problem_types.filter(p => p.category_id === form.category_id) : lookup.problem_types;
  const filteredSubTypes = form.problem_type_id
    ? lookup.problem_sub_types.filter(s => s.problem_type_id === form.problem_type_id) : lookup.problem_sub_types;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.complaint_number) { toast.error("กรุณากรอกเลขที่เอกสาร"); return; }
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
    } finally { setSaving(false); }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />

      <div className="max-w-[1440px] mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">บันทึกข้อร้องเรียน</h1>
          <p className="text-sm text-muted-foreground mt-1">กรอกข้อมูล Complaint ใหม่เข้าระบบ</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="glass-card relative p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(210 100% 60%), hsl(270 80% 65%))" }}>
                  <Plus className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">ข้อมูลข้อร้องเรียน</h2>
                  <p className="text-xs text-muted-foreground">กรอกรายละเอียดเพื่อบันทึก Complaint ใหม่</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Row 1: Doc Number & Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="complaint_number" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">เลขที่เอกสาร *</Label>
                    <Input id="complaint_number" placeholder="เช่น QAS.2.2025.09/001" value={form.complaint_number} onChange={e => setField("complaint_number", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">วันที่</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.complaint_date && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.complaint_date ? format(new Date(form.complaint_date), "d MMMM yyyy", { locale: th }) : <span>เลือกวันที่</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={form.complaint_date ? new Date(form.complaint_date) : undefined}
                          onSelect={(date) => setField("complaint_date", date ? format(date, "yyyy-MM-dd") : "")}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Row 2: Company & Branch */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">บริษัท</Label>
                    <Select value={form.company_id || "_none"} onValueChange={v => setField("company_id", v === "_none" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="เลือกบริษัท" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">-- เลือกบริษัท --</SelectItem>
                        {lookup.companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">สาขา</Label>
                    <Select value={form.branch_id || "_none"} onValueChange={v => setField("branch_id", v === "_none" ? "" : v)} disabled={form.company_id && filteredBranches.length === 0}>
                      <SelectTrigger><SelectValue placeholder={form.company_id && filteredBranches.length === 0 ? "ไม่มีสาขาสำหรับบริษัทนี้" : "เลือกสาขา"} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">-- เลือกสาขา --</SelectItem>
                        {filteredBranches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 3: Product Group & Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">กลุ่มสินค้า</Label>
                    <Select value={form.product_group_id || "_none"} onValueChange={v => setField("product_group_id", v === "_none" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="เลือกกลุ่มสินค้า" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">-- เลือกกลุ่มสินค้า --</SelectItem>
                        {lookup.product_groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">หมวดหมู่</Label>
                    <Select value={form.category_id || "_none"} onValueChange={v => setField("category_id", v === "_none" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="เลือกหมวดหมู่" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">-- เลือกหมวดหมู่ --</SelectItem>
                        {filteredCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 4: Problem Type & Sub Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ประเภทปัญหา</Label>
                    <Select value={form.problem_type_id || "_none"} onValueChange={v => setField("problem_type_id", v === "_none" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="เลือกประเภทปัญหา" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">-- เลือกประเภทปัญหา --</SelectItem>
                        {filteredProblemTypes.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ประเภทปัญหาย่อย</Label>
                    <Select value={form.problem_sub_type_id || "_none"} onValueChange={v => setField("problem_sub_type_id", v === "_none" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="เลือกประเภทย่อย" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">-- เลือกประเภทย่อย --</SelectItem>
                        {filteredSubTypes.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 5: Caller, Status, Priority */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ช่องทางการแจ้งปัญหา</Label>
                    <Select value={form.caller_id || "_none"} onValueChange={v => setField("caller_id", v === "_none" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="เลือกช่องทางการแจ้งปัญหา" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">-- เลือกช่องทางการแจ้งปัญหา --</SelectItem>
                        {lookup.callers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">สถานะ</Label>
                    <Select value={form.status} onValueChange={v => setField("status", v)}>
                      <SelectTrigger><SelectValue placeholder="เลือกสถานะ" /></SelectTrigger>
                      <SelectContent>
                        {(lookup.statuses.length > 0 ? lookup.statuses : DEFAULT_STATUSES).map(s => <SelectItem key={s.id || s.value} value={s.name || s.value}>{s.name || s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ความสำคัญ</Label>
                    <Select value={form.priority} onValueChange={v => setField("priority", v)}>
                      <SelectTrigger><SelectValue placeholder="เลือกความสำคัญ" /></SelectTrigger>
                      <SelectContent>
                        {(lookup.priorities.length > 0 ? lookup.priorities : DEFAULT_PRIORITIES).map(p => <SelectItem key={p.id || p.value} value={p.code || p.value}>{p.name || p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">รายละเอียด</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant={listeningField === "description" ? "default" : "outline"}
                      onClick={() => toggleMic("description")}
                      className="gap-2"
                    >
                      {listeningField === "description" ? (
                        <>
                          <Mic className="h-4 w-4 animate-pulse" />
                          กำลังฟัง...
                        </>
                      ) : (
                        <>
                          <MicOff className="h-4 w-4" />
                          พูด
                        </>
                      )}
                    </Button>
                  </div>
                  <Textarea id="description" placeholder="อธิบายรายละเอียดข้อร้องเรียน..." value={form.description} onChange={e => setField("description", e.target.value)} rows={3} />
                </div>

                {/* Resolution & Resolved Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="resolution" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">การแก้ไข</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant={listeningField === "resolution" ? "default" : "outline"}
                        onClick={() => toggleMic("resolution")}
                        className="gap-2"
                      >
                        {listeningField === "resolution" ? (
                          <>
                            <Mic className="h-4 w-4 animate-pulse" />
                            กำลังฟัง...
                          </>
                        ) : (
                          <>
                            <MicOff className="h-4 w-4" />
                            พูด
                          </>
                        )}
                      </Button>
                    </div>
                    <Textarea id="resolution" placeholder="วิธีการแก้ไข (ถ้ามี)..." value={form.resolution} onChange={e => setField("resolution", e.target.value)} rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">วันที่แก้ไข</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.resolved_at && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.resolved_at ? format(new Date(form.resolved_at), "d MMMM yyyy", { locale: th }) : <span>เลือกวันที่แก้ไข</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={form.resolved_at ? new Date(form.resolved_at) : undefined}
                          onSelect={(date) => setField("resolved_at", date ? format(date, "yyyy-MM-dd") : "")}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Submit */}
                <Button type="submit" disabled={saving} size="lg" className="w-full rounded-xl">
                  {saving ? (
                    <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> กำลังบันทึก...</span>
                  ) : (
                    <span className="flex items-center gap-2"><Save className="h-4 w-4" /> บันทึกข้อร้องเรียน</span>
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Recent complaints sidebar */}
          <div>
            <div className="glass-card relative p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                ข้อร้องเรียนล่าสุด
              </h3>
              <div className="space-y-3">
                {recentComplaints.length === 0 ? (
                  <p className="text-xs text-muted-foreground">ยังไม่มีข้อมูล</p>
                ) : (
                  recentComplaints.map((c: any) => (
                    <div key={c.id} className="p-3 rounded-xl bg-secondary/30 border border-border/50 space-y-1.5 transition-colors hover:bg-secondary/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{c.complaint_number}</span>
                        <Badge variant={c.status === "ปิดผู้ผลิต" ? "default" : "secondary"} className="text-[10px]">
                          {c.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {c.complaint_date ? new Date(c.complaint_date).toLocaleDateString("th-TH") : "-"}
                        {c.problem_types?.name && ` · ${c.problem_types.name}`}
                      </div>
                      {c.problem_sub_types?.name && (
                        <div className="text-xs text-muted-foreground">{c.problem_sub_types.name}</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
