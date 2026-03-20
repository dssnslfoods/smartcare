import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Save, Plus, Loader2, CheckCircle2, CalendarIcon, Mic, MicOff, Pencil, Trash2, X, Building2, Tag, UserCircle2, FileText } from "lucide-react";
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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
  const { role, userProfile } = useAuth();
  const isStaff = role === "staff";
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState(INITIAL_FORM);
  const [lookup, setLookup] = useState<LookupData>({
    companies: [], branches: [], product_groups: [], categories: [],
    problem_types: [], problem_sub_types: [], callers: [], statuses: [], priorities: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [listeningField, setListeningField] = useState<"description" | "resolution" | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    async function fetchLookups() {
      try {
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
        let companyList = companies.data || [];
        let branchList = (branches.data || []) as (LookupItem & { company_id: string })[];

        // Staff can only see their own company/branch
        if (isStaff && userProfile?.company_id) {
          companyList = companyList.filter(c => c.id === userProfile.company_id);
          branchList = branchList.filter(b => b.company_id === userProfile.company_id);
          if (userProfile.branch_id) {
            branchList = branchList.filter(b => b.id === userProfile.branch_id);
          }
        }

        setLookup({
          companies: companyList,
          branches: branchList,
          product_groups: productGroups.data || [],
          categories: (categories.data || []) as any,
          problem_types: problemTypes.data || [],
          problem_sub_types: (problemSubTypes.data || []) as any,
          callers: callers.data || [],
          statuses: (statuses.data || []) as any,
          priorities: (priorities.data || []) as any,
        });

        // Auto-set company/branch for staff
        if (isStaff && userProfile?.company_id) {
          setForm(prev => ({
            ...prev,
            company_id: prev.company_id || userProfile.company_id!,
            branch_id: prev.branch_id || userProfile.branch_id || "",
          }));
        }
      } catch (err) {
        console.error("fetchLookups error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLookups();
    fetchRecent();
  }, []);

  // Auto-load complaint for editing when ?edit=<id> is in the URL
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId && !loading) {
      handleEditRecent(editId);
    }
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("ไม่รองรับเสียงในเบราว์เซอร์นี้");
      return;
    }

    // กดซ้ำช่องเดิม → หยุดฟัง
    if (isListening && listeningField === field) {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null; // ถอด handler ก่อน stop เพื่อป้องกัน reset ซ้อน
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsListening(false);
      setListeningField(null);
      return;
    }

    // หยุด recognition เก่า (ถ้ามี) โดยไม่ให้ onend ไปรีเซ็ต state ใหม่
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    // สร้าง instance ใหม่ทุกครั้ง — `field` ถูก capture ใน closure ของ onresult โดยตรง
    const recognition = new SpeechRecognition();
    recognition.lang = "th-TH";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);

    recognition.onend = () => {
      setIsListening(false);
      setListeningField(null);
      if (recognitionRef.current === recognition) recognitionRef.current = null;
    };

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0].transcript;
          // field ถูก capture ตอน toggleMic ถูกเรียก — ถูกเสมอ 100%
          setForm(prev => {
            if (field === "resolution") {
              return { ...prev, resolution: (prev.resolution + " " + transcript).trim() };
            }
            return { ...prev, description: (prev.description + " " + transcript).trim() };
          });
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "aborted") {
        toast.error(`ข้อผิดพลาด: ${event.error}`);
      }
    };

    recognitionRef.current = recognition;
    setListeningField(field);

    try {
      recognition.start();
    } catch (e) {
      console.error("Recognition start error:", e);
      toast.error("ไม่สามารถเริ่มฟังได้ กรุณาลองใหม่");
      recognitionRef.current = null;
      setListeningField(null);
    }
  }

  async function handleEditRecent(id: string) {
    const { data, error } = await supabase.from("complaints").select("*").eq("id", id).single();
    if (error || !data) { toast.error("โหลดข้อมูลไม่สำเร็จ"); return; }
    setForm({
      complaint_number: data.complaint_number ?? "",
      complaint_date: data.complaint_date ?? "",
      company_id: data.company_id ?? "",
      branch_id: data.branch_id ?? "",
      product_group_id: data.product_group_id ?? "",
      category_id: data.category_id ?? "",
      problem_type_id: data.problem_type_id ?? "",
      problem_sub_type_id: data.problem_sub_type_id ?? "",
      caller_id: data.caller_id ?? "",
      description: data.description ?? "",
      status: data.status ?? "",
      priority: data.priority ?? "",
      resolution: data.resolution ?? "",
      resolved_at: data.resolved_at ?? "",
    });
    setEditingId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function confirmDelete() {
    if (!deleteConfirmId) return;
    const { error } = await supabase.from("complaints").delete().eq("id", deleteConfirmId);
    setDeleteConfirmId(null);
    if (error) { toast.error(`ลบไม่สำเร็จ: ${error.message}`); return; }
    toast.success("ลบข้อร้องเรียนสำเร็จ");
    if (editingId === deleteConfirmId) { setForm(INITIAL_FORM); setEditingId(null); }
    fetchRecent();
  }

  const filteredBranches = form.company_id
    ? lookup.branches.filter(b => b.company_id === form.company_id) : lookup.branches;
  const filteredCategories = lookup.categories;
  const filteredProblemTypes = form.category_id
    ? lookup.problem_types.filter(p => p.category_id === form.category_id) : lookup.problem_types;
  const filteredSubTypes = form.problem_type_id
    ? lookup.problem_sub_types.filter(s => s.problem_type_id === form.problem_type_id) : lookup.problem_sub_types;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const required: [string, string][] = [
      [form.complaint_number, "เลขที่เอกสาร"],
      [form.complaint_date, "วันที่"],
      [form.company_id, "บริษัท"],
      [form.product_group_id, "กลุ่มสินค้า"],
      [form.category_id, "หมวดหมู่"],
      [form.problem_type_id, "ประเภทปัญหา"],
      [form.problem_sub_type_id, "ประเภทปัญหาย่อย"],
      [form.caller_id, "ช่องทางการแจ้งปัญหา"],
      [form.status, "สถานะ"],
      [form.priority, "ความสำคัญ"],
      [form.description, "รายละเอียด"],
      [form.resolution, "การแก้ไข"],
      [form.resolved_at, "วันที่แก้ไข"],
    ];
    const missing = required.filter(([v]) => !v).map(([, label]) => label);
    if (missing.length > 0) { toast.error(`กรุณากรอกข้อมูลให้ครบ: ${missing.join(", ")}`); return; }
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

      let error;
      if (editingId) {
        ({ error } = await supabase.from("complaints").update(payload as any).eq("id", editingId));
        if (!error) { toast.success("แก้ไขข้อร้องเรียนสำเร็จ"); setEditingId(null); }
      } else {
        ({ error } = await supabase.from("complaints").insert(payload as any));
        if (!error) toast.success("บันทึกข้อร้องเรียนสำเร็จ");
      }
      if (error) throw error;
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
              <div className="flex items-center justify-between gap-2 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: editingId ? "linear-gradient(135deg, hsl(38 92% 50%), hsl(25 95% 55%))" : "linear-gradient(135deg, hsl(210 100% 60%), hsl(270 80% 65%))" }}>
                    {editingId ? <Pencil className="h-4 w-4 text-white" /> : <Plus className="h-4 w-4 text-white" />}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">{editingId ? "แก้ไขข้อร้องเรียน" : "ข้อมูลข้อร้องเรียน"}</h2>
                    <p className="text-xs text-muted-foreground">{editingId ? "แก้ไขรายละเอียด Complaint" : "กรอกรายละเอียดเพื่อบันทึก Complaint ใหม่"}</p>
                  </div>
                </div>
                {editingId && (
                  <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5" onClick={() => { setForm(INITIAL_FORM); setEditingId(null); }}>
                    <X className="h-4 w-4" /> ยกเลิกแก้ไข
                  </Button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-0">

                {/* ─── Section 1: ข้อมูลพื้นฐาน ─── */}
                <div className="form-section">
                  <p className="form-section-title"><Building2 className="w-3.5 h-3.5" />ข้อมูลพื้นฐาน</p>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="complaint_number" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">เลขที่เอกสาร <span className="text-destructive">*</span></Label>
                        <Input id="complaint_number" placeholder="เช่น QAS.2.2025.09/001" value={form.complaint_number} onChange={e => setField("complaint_number", e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">วันที่ <span className="text-destructive">*</span></Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.complaint_date && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {form.complaint_date ? format(new Date(form.complaint_date), "d MMMM yyyy", { locale: th }) : <span>เลือกวันที่</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={form.complaint_date ? new Date(form.complaint_date) : undefined} onSelect={(date) => setField("complaint_date", date ? format(date, "yyyy-MM-dd") : "")} initialFocus className="p-3 pointer-events-auto" />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">บริษัท <span className="text-destructive">*</span></Label>
                        <Select value={form.company_id || "_none"} onValueChange={v => setField("company_id", v === "_none" ? "" : v)} disabled={isStaff}>
                          <SelectTrigger><SelectValue placeholder="เลือกบริษัท" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_none">-- เลือกบริษัท --</SelectItem>
                            {lookup.companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">สาขา</Label>
                        <Select value={form.branch_id || "_none"} onValueChange={v => setField("branch_id", v === "_none" ? "" : v)} disabled={isStaff || (!!form.company_id && filteredBranches.length === 0)}>
                          <SelectTrigger><SelectValue placeholder={form.company_id && filteredBranches.length === 0 ? "ไม่มีสาขาสำหรับบริษัทนี้" : "เลือกสาขา"} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_none">-- เลือกสาขา --</SelectItem>
                            {filteredBranches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ─── Section 2: การจำแนกประเภท ─── */}
                <div className="form-section">
                  <p className="form-section-title"><Tag className="w-3.5 h-3.5" />การจำแนกประเภท</p>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">กลุ่มสินค้า <span className="text-destructive">*</span></Label>
                        <Select value={form.product_group_id || "_none"} onValueChange={v => setField("product_group_id", v === "_none" ? "" : v)}>
                          <SelectTrigger><SelectValue placeholder="เลือกกลุ่มสินค้า" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_none">-- เลือกกลุ่มสินค้า --</SelectItem>
                            {lookup.product_groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">หมวดหมู่ <span className="text-destructive">*</span></Label>
                        <Select value={form.category_id || "_none"} onValueChange={v => setField("category_id", v === "_none" ? "" : v)}>
                          <SelectTrigger><SelectValue placeholder="เลือกหมวดหมู่" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_none">-- เลือกหมวดหมู่ --</SelectItem>
                            {filteredCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          ประเภทปัญหา <span className="text-destructive">*</span>
                          {!form.category_id && <span className="ml-1 text-muted-foreground/50 font-normal normal-case">(เลือกหมวดหมู่ก่อน)</span>}
                        </Label>
                        <Select value={form.problem_type_id || "_none"} onValueChange={v => setField("problem_type_id", v === "_none" ? "" : v)} disabled={!form.category_id}>
                          <SelectTrigger className={!form.category_id ? "opacity-50 cursor-not-allowed" : ""}><SelectValue placeholder="เลือกประเภทปัญหา" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_none">-- เลือกประเภทปัญหา --</SelectItem>
                            {filteredProblemTypes.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          ประเภทปัญหาย่อย <span className="text-destructive">*</span>
                          {!form.problem_type_id && <span className="ml-1 text-muted-foreground/50 font-normal normal-case">(เลือกประเภทก่อน)</span>}
                        </Label>
                        <Select value={form.problem_sub_type_id || "_none"} onValueChange={v => setField("problem_sub_type_id", v === "_none" ? "" : v)} disabled={!form.problem_type_id}>
                          <SelectTrigger className={!form.problem_type_id ? "opacity-50 cursor-not-allowed" : ""}><SelectValue placeholder="เลือกประเภทย่อย" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_none">-- เลือกประเภทย่อย --</SelectItem>
                            {filteredSubTypes.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ─── Section 3: ผู้แจ้งและสถานะ ─── */}
                <div className="form-section">
                  <p className="form-section-title"><UserCircle2 className="w-3.5 h-3.5" />ผู้แจ้งและสถานะ</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ช่องทางการแจ้งปัญหา <span className="text-destructive">*</span></Label>
                      <Select value={form.caller_id || "_none"} onValueChange={v => setField("caller_id", v === "_none" ? "" : v)}>
                        <SelectTrigger><SelectValue placeholder="เลือกช่องทาง" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">-- เลือกช่องทาง --</SelectItem>
                          {lookup.callers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">สถานะ <span className="text-destructive">*</span></Label>
                      <Select value={form.status} onValueChange={v => setField("status", v)}>
                        <SelectTrigger><SelectValue placeholder="เลือกสถานะ" /></SelectTrigger>
                        <SelectContent>
                          {(lookup.statuses.length > 0 ? lookup.statuses : DEFAULT_STATUSES).map(s => <SelectItem key={s.id || s.value} value={s.name || s.value}>{s.name || s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ความสำคัญ <span className="text-destructive">*</span></Label>
                      <Select value={form.priority} onValueChange={v => setField("priority", v)}>
                        <SelectTrigger><SelectValue placeholder="เลือกความสำคัญ" /></SelectTrigger>
                        <SelectContent>
                          {(lookup.priorities.length > 0 ? lookup.priorities : DEFAULT_PRIORITIES).map(p => <SelectItem key={p.id || p.value} value={p.code || p.value}>{p.name || p.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* ─── Section 4: รายละเอียดและการแก้ไข ─── */}
                <div className="form-section">
                  <p className="form-section-title"><FileText className="w-3.5 h-3.5" />รายละเอียดและการแก้ไข</p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">รายละเอียด <span className="text-destructive">*</span></Label>
                        <Button type="button" size="sm" variant={listeningField === "description" ? "default" : "outline"} onClick={() => toggleMic("description")} className="gap-2 h-7 text-xs px-2.5">
                          {listeningField === "description" ? <><Mic className="h-3.5 w-3.5 animate-pulse" />กำลังฟัง...</> : <><MicOff className="h-3.5 w-3.5" />พูด</>}
                        </Button>
                      </div>
                      <Textarea id="description" placeholder="อธิบายรายละเอียดข้อร้องเรียน..." value={form.description} onChange={e => setField("description", e.target.value)} rows={3} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="resolution" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">การแก้ไข <span className="text-destructive">*</span></Label>
                          <Button type="button" size="sm" variant={listeningField === "resolution" ? "default" : "outline"} onClick={() => toggleMic("resolution")} className="gap-2 h-7 text-xs px-2.5">
                            {listeningField === "resolution" ? <><Mic className="h-3.5 w-3.5 animate-pulse" />กำลังฟัง...</> : <><MicOff className="h-3.5 w-3.5" />พูด</>}
                          </Button>
                        </div>
                        <Textarea id="resolution" placeholder="วิธีการแก้ไข (ถ้ามี)..." value={form.resolution} onChange={e => setField("resolution", e.target.value)} rows={3} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">วันที่แก้ไข <span className="text-destructive">*</span></Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.resolved_at && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {form.resolved_at ? format(new Date(form.resolved_at), "d MMMM yyyy", { locale: th }) : <span>เลือกวันที่แก้ไข</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={form.resolved_at ? new Date(form.resolved_at) : undefined} onSelect={(date) => setField("resolved_at", date ? format(date, "yyyy-MM-dd") : "")} initialFocus className="p-3 pointer-events-auto" />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ─── Submit ─── */}
                <div className="pt-5 mt-1 border-t border-border/30">
                  <Button type="submit" disabled={saving} size="lg" className="w-full rounded-xl">
                    {saving ? (
                      <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />กำลังบันทึก...</span>
                    ) : editingId ? (
                      <span className="flex items-center gap-2"><Save className="h-4 w-4" />บันทึกการแก้ไข</span>
                    ) : (
                      <span className="flex items-center gap-2"><Save className="h-4 w-4" />บันทึกข้อร้องเรียน</span>
                    )}
                  </Button>
                </div>

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
                    <div key={c.id} className={`p-3 rounded-xl border border-border/50 space-y-1.5 transition-colors ${editingId === c.id ? 'bg-amber-500/10 border-amber-500/40' : 'bg-secondary/30 hover:bg-secondary/50'}`}>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm font-medium text-foreground truncate">{c.complaint_number}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge variant={c.status === "ปิดผู้ผลิต" ? "default" : "secondary"} className="text-[10px]">
                            {c.status || '-'}
                          </Badge>
                          <Button
                            variant="ghost" size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            onClick={() => handleEditRecent(c.id)}
                            title="แก้ไข"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteConfirmId(c.id)}
                            title="ลบ"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
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

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={open => { if (!open) setDeleteConfirmId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบข้อร้องเรียนนี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
