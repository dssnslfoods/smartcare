import { useState, useCallback, useEffect } from 'react';
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Database,
  Building2, GitBranch, Package, Tag, AlertTriangle, List, Users,
  Download, Plus, RefreshCw, FileUp,
} from 'lucide-react';
import TopNavBar from '@/components/TopNavBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RefData {
  companies: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  problem_types: { id: string; name: string }[];
}

interface FormField {
  key: string;
  label: string;
  type: 'text' | 'select';
  required?: boolean;
  placeholder?: string;
  refKey?: keyof RefData;
}

interface TabConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  tableName: string;
  formFields: FormField[];
  displayColumns: { key: string; label: string }[];
  fetchSelect: string;
  toInsert: (form: Record<string, string>, refs: RefData) => Record<string, any>;
  toDisplayRow: (row: any) => Record<string, string>;
  toExportRow: (row: any) => Record<string, string>;
  importColumns: { key: string; label: string; required?: boolean }[];
  importSampleRows: Record<string, string>[];
  toImportRows: (rows: Record<string, any>[], refs: RefData) => Record<string, any>[];
}

// ─── Tab Configurations ───────────────────────────────────────────────────────

const TAB_CONFIGS: TabConfig[] = [
  // ── บริษัท ──────────────────────────────────────────────────────────────────
  {
    id: 'companies',
    label: 'บริษัท',
    icon: Building2,
    tableName: 'companies',
    formFields: [
      { key: 'name', label: 'ชื่อบริษัท', type: 'text', required: true, placeholder: 'กรอกชื่อบริษัท' },
      { key: 'code', label: 'รหัส', type: 'text', placeholder: 'เช่น COM001' },
    ],
    displayColumns: [
      { key: 'name', label: 'ชื่อบริษัท' },
      { key: 'code', label: 'รหัส' },
    ],
    fetchSelect: 'id, name, code',
    toInsert: (form) => ({ name: form.name, code: form.code || null }),
    toDisplayRow: (row) => ({ name: row.name, code: row.code || '-' }),
    toExportRow: (row) => ({ 'ชื่อบริษัท': row.name, 'รหัส': row.code || '' }),
    importColumns: [
      { key: 'name', label: 'ชื่อบริษัท', required: true },
      { key: 'code', label: 'รหัส' },
    ],
    importSampleRows: [
      { 'ชื่อบริษัท': 'บริษัท ABC จำกัด', 'รหัส': 'COM001' },
      { 'ชื่อบริษัท': 'บริษัท XYZ จำกัด', 'รหัส': 'COM002' },
    ],
    toImportRows: (rows) => rows.map(r => ({
      name: r['name'] || r['ชื่อบริษัท'] || 'ไม่ระบุ',
      code: r['code'] || r['รหัส'] || null,
    })),
  },

  // ── สาขา ─────────────────────────────────────────────────────────────────────
  {
    id: 'branches',
    label: 'สาขา',
    icon: GitBranch,
    tableName: 'branches',
    formFields: [
      { key: 'name', label: 'ชื่อสาขา', type: 'text', required: true, placeholder: 'กรอกชื่อสาขา' },
      { key: 'code', label: 'รหัส', type: 'text', placeholder: 'เช่น BR001' },
      { key: 'company_id', label: 'บริษัท', type: 'select', required: true, refKey: 'companies' },
    ],
    displayColumns: [
      { key: 'name', label: 'ชื่อสาขา' },
      { key: 'code', label: 'รหัส' },
      { key: 'company_name', label: 'บริษัท' },
    ],
    fetchSelect: 'id, name, code, companies:company_id(name)',
    toInsert: (form) => ({ name: form.name, code: form.code || null, company_id: form.company_id }),
    toDisplayRow: (row) => ({
      name: row.name,
      code: row.code || '-',
      company_name: (row.companies as any)?.name || '-',
    }),
    toExportRow: (row) => ({
      'ชื่อสาขา': row.name,
      'รหัส': row.code || '',
      'บริษัท': (row.companies as any)?.name || '',
    }),
    importColumns: [
      { key: 'name', label: 'ชื่อสาขา', required: true },
      { key: 'code', label: 'รหัส' },
      { key: 'company_name', label: 'บริษัท (ชื่อ)' },
    ],
    importSampleRows: [
      { 'ชื่อสาขา': 'สาขากรุงเทพ', 'รหัส': 'BR001', 'บริษัท (ชื่อ)': 'บริษัท ABC จำกัด' },
      { 'ชื่อสาขา': 'สาขาเชียงใหม่', 'รหัส': 'BR002', 'บริษัท (ชื่อ)': 'บริษัท ABC จำกัด' },
    ],
    toImportRows: (rows, refs) => {
      const map: Record<string, string> = {};
      refs.companies.forEach(c => { map[c.name] = c.id; });
      const defaultId = refs.companies[0]?.id ?? null;
      return rows.map(r => ({
        name: r['name'] || r['ชื่อสาขา'] || 'ไม่ระบุ',
        code: r['code'] || r['รหัส'] || null,
        company_id: map[r['company_name'] || r['บริษัท (ชื่อ)'] || r['บริษัท'] || ''] ?? defaultId,
      }));
    },
  },

  // ── กลุ่มสินค้า ───────────────────────────────────────────────────────────────
  {
    id: 'product_groups',
    label: 'กลุ่มสินค้า',
    icon: Package,
    tableName: 'product_groups',
    formFields: [
      { key: 'name', label: 'ชื่อกลุ่มสินค้า', type: 'text', required: true, placeholder: 'กรอกชื่อกลุ่มสินค้า' },
      { key: 'code', label: 'รหัส', type: 'text', placeholder: 'เช่น PG001' },
    ],
    displayColumns: [
      { key: 'name', label: 'ชื่อกลุ่มสินค้า' },
      { key: 'code', label: 'รหัส' },
    ],
    fetchSelect: 'id, name, code',
    toInsert: (form) => ({ name: form.name, code: form.code || null }),
    toDisplayRow: (row) => ({ name: row.name, code: row.code || '-' }),
    toExportRow: (row) => ({ 'ชื่อกลุ่มสินค้า': row.name, 'รหัส': row.code || '' }),
    importColumns: [
      { key: 'name', label: 'ชื่อกลุ่ม', required: true },
      { key: 'code', label: 'รหัส' },
    ],
    importSampleRows: [
      { 'ชื่อกลุ่ม': 'อาหารแปรรูป', 'รหัส': 'PG001' },
      { 'ชื่อกลุ่ม': 'เครื่องดื่ม', 'รหัส': 'PG002' },
    ],
    toImportRows: (rows) => rows.map(r => ({
      name: r['name'] || r['ชื่อกลุ่ม'] || r['ชื่อกลุ่มสินค้า'] || 'ไม่ระบุ',
      code: r['code'] || r['รหัส'] || null,
    })),
  },

  // ── หมวดหมู่ ──────────────────────────────────────────────────────────────────
  {
    id: 'categories',
    label: 'หมวดหมู่',
    icon: Tag,
    tableName: 'categories',
    formFields: [
      { key: 'name', label: 'ชื่อหมวดหมู่', type: 'text', required: true, placeholder: 'กรอกชื่อหมวดหมู่' },
      { key: 'code', label: 'รหัส', type: 'text', placeholder: 'เช่น CAT001' },
    ],
    displayColumns: [
      { key: 'name', label: 'ชื่อหมวดหมู่' },
      { key: 'code', label: 'รหัส' },
    ],
    fetchSelect: 'id, name, code',
    toInsert: (form) => ({
      name: form.name,
      code: form.code || null,
    }),
    toDisplayRow: (row) => ({
      name: row.name,
      code: row.code || '-',
    }),
    toExportRow: (row) => ({
      'ชื่อหมวดหมู่': row.name,
      'รหัส': row.code || '',
    }),
    importColumns: [
      { key: 'name', label: 'ชื่อหมวดหมู่', required: true },
      { key: 'code', label: 'รหัส' },
    ],
    importSampleRows: [
      { 'ชื่อหมวดหมู่': 'Food Safety', 'รหัส': 'CAT001' },
      { 'ชื่อหมวดหมู่': 'Food Quality', 'รหัส': 'CAT002' },
      { 'ชื่อหมวดหมู่': 'Food Law', 'รหัส': 'CAT003' },
    ],
    toImportRows: (rows) => rows.map(r => ({
      name: r['name'] || r['ชื่อหมวดหมู่'] || 'ไม่ระบุ',
      code: r['code'] || r['รหัส'] || null,
    })),
  },

  // ── ประเภทปัญหา ───────────────────────────────────────────────────────────────
  {
    id: 'problem_types',
    label: 'ประเภทปัญหา',
    icon: AlertTriangle,
    tableName: 'problem_types',
    formFields: [
      { key: 'name', label: 'ชื่อประเภทปัญหา', type: 'text', required: true, placeholder: 'กรอกชื่อประเภทปัญหา' },
      { key: 'code', label: 'รหัส', type: 'text', placeholder: 'เช่น PT001' },
    ],
    displayColumns: [
      { key: 'name', label: 'ชื่อประเภทปัญหา' },
      { key: 'code', label: 'รหัส' },
    ],
    fetchSelect: 'id, name, code',
    toInsert: (form) => ({
      name: form.name,
      code: form.code || null,
    }),
    toDisplayRow: (row) => ({
      name: row.name,
      code: row.code || '-',
    }),
    toExportRow: (row) => ({
      'ชื่อประเภทปัญหา': row.name,
      'รหัส': row.code || '',
    }),
    importColumns: [
      { key: 'name', label: 'ชื่อประเภท', required: true },
      { key: 'code', label: 'รหัส' },
    ],
    importSampleRows: [
      { 'ชื่อประเภท': 'สิ่งแปลกปลอม', 'รหัส': 'PT001' },
      { 'ชื่อประเภท': 'คุณภาพผลิตภัณฑ์', 'รหัส': 'PT002' },
    ],
    toImportRows: (rows) => rows.map(r => ({
      name: r['name'] || r['ชื่อประเภท'] || r['ชื่อประเภทปัญหา'] || 'ไม่ระบุ',
      code: r['code'] || r['รหัส'] || null,
    })),
  },

  // ── ประเภทย่อย ────────────────────────────────────────────────────────────────
  {
    id: 'problem_sub_types',
    label: 'ประเภทย่อย',
    icon: List,
    tableName: 'problem_sub_types',
    formFields: [
      { key: 'name', label: 'ชื่อประเภทย่อย', type: 'text', required: true, placeholder: 'กรอกชื่อประเภทย่อย' },
      { key: 'problem_type_id', label: 'ประเภทปัญหา', type: 'select', required: true, refKey: 'problem_types' },
    ],
    displayColumns: [
      { key: 'name', label: 'ชื่อประเภทย่อย' },
      { key: 'problem_type_name', label: 'ประเภทปัญหา' },
    ],
    fetchSelect: 'id, name, problem_types:problem_type_id(name)',
    toInsert: (form) => ({ name: form.name, problem_type_id: form.problem_type_id }),
    toDisplayRow: (row) => ({
      name: row.name,
      problem_type_name: (row.problem_types as any)?.name || '-',
    }),
    toExportRow: (row) => ({
      'ชื่อประเภทย่อย': row.name,
      'ประเภทปัญหา': (row.problem_types as any)?.name || '',
    }),
    importColumns: [
      { key: 'name', label: 'ชื่อประเภทย่อย', required: true },
      { key: 'problem_type_name', label: 'ประเภทปัญหา (ชื่อ)', required: true },
    ],
    importSampleRows: [
      { 'ชื่อประเภทย่อย': 'พบแมลง', 'ประเภทปัญหา (ชื่อ)': 'สิ่งแปลกปลอม' },
      { 'ชื่อประเภทย่อย': 'สีผิดปกติ', 'ประเภทปัญหา (ชื่อ)': 'คุณภาพผลิตภัณฑ์' },
    ],
    toImportRows: (rows, refs) => {
      const map: Record<string, string> = {};
      refs.problem_types.forEach(pt => { map[pt.name] = pt.id; });
      const defaultId = refs.problem_types[0]?.id ?? null;
      return rows.map(r => ({
        name: r['name'] || r['ชื่อประเภทย่อย'] || 'ไม่ระบุ',
        problem_type_id:
          map[r['problem_type_name'] || r['ประเภทปัญหา (ชื่อ)'] || r['ประเภทปัญหา'] || ''] ?? defaultId,
      }));
    },
  },

  // ── ผู้แจ้ง ────────────────────────────────────────────────────────────────────
  {
    id: 'callers',
    label: 'ผู้แจ้ง',
    icon: Users,
    tableName: 'callers',
    formFields: [
      { key: 'name', label: 'ชื่อผู้แจ้ง', type: 'text', required: true, placeholder: 'กรอกชื่อผู้แจ้ง' },
      { key: 'phone', label: 'เบอร์โทร', type: 'text', placeholder: 'เช่น 081-234-5678' },
      { key: 'email', label: 'อีเมล', type: 'text', placeholder: 'example@email.com' },
      { key: 'company_id', label: 'บริษัท', type: 'select', refKey: 'companies' },
    ],
    displayColumns: [
      { key: 'name', label: 'ชื่อผู้แจ้ง' },
      { key: 'phone', label: 'เบอร์โทร' },
      { key: 'email', label: 'อีเมล' },
      { key: 'company_name', label: 'บริษัท' },
    ],
    fetchSelect: 'id, name, phone, email, companies:company_id(name)',
    toInsert: (form) => ({
      name: form.name,
      phone: form.phone || null,
      email: form.email || null,
      company_id: form.company_id || null,
    }),
    toDisplayRow: (row) => ({
      name: row.name,
      phone: row.phone || '-',
      email: row.email || '-',
      company_name: (row.companies as any)?.name || '-',
    }),
    toExportRow: (row) => ({
      'ชื่อผู้แจ้ง': row.name,
      'เบอร์โทร': row.phone || '',
      'อีเมล': row.email || '',
      'บริษัท': (row.companies as any)?.name || '',
    }),
    importColumns: [
      { key: 'name', label: 'ชื่อผู้แจ้ง', required: true },
      { key: 'phone', label: 'เบอร์โทร' },
      { key: 'email', label: 'อีเมล' },
      { key: 'company_name', label: 'บริษัท (ชื่อ)' },
    ],
    importSampleRows: [
      { 'ชื่อผู้แจ้ง': 'สมชาย ใจดี', 'เบอร์โทร': '081-234-5678', 'อีเมล': 'somchai@example.com', 'บริษัท (ชื่อ)': 'บริษัท ABC จำกัด' },
      { 'ชื่อผู้แจ้ง': 'สมหญิง รักดี', 'เบอร์โทร': '089-876-5432', 'อีเมล': 'somying@example.com', 'บริษัท (ชื่อ)': '' },
    ],
    toImportRows: (rows, refs) => {
      const map: Record<string, string> = {};
      refs.companies.forEach(c => { map[c.name] = c.id; });
      return rows.map(r => ({
        name: r['name'] || r['ชื่อผู้แจ้ง'] || 'ไม่ระบุ',
        phone: r['phone'] || r['เบอร์โทร'] || null,
        email: r['email'] || r['อีเมล'] || null,
        company_id: map[r['company_name'] || r['บริษัท (ชื่อ)'] || r['บริษัท'] || ''] || null,
      }));
    },
  },
];

// ─── TableTab Component ───────────────────────────────────────────────────────

interface TableTabProps {
  config: TabConfig;
  refs: RefData;
  onRefsRefresh: () => void;
}

function TableTab({ config, refs, onRefsRefresh }: TableTabProps) {
  const { toast } = useToast();
  const Icon = config.icon;

  // Table data
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Import panel
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<{ headers: string[]; rows: Record<string, any>[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);

  // ── Load records ─────────────────────────────────────────────────────────────
  const loadRecords = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase
      .from(config.tableName as any)
      .select(config.fetchSelect) as any)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      toast({ title: 'เกิดข้อผิดพลาด', description: error.message, variant: 'destructive' });
    } else {
      setRecords(data || []);
    }
    setLoading(false);
  }, [config, toast]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  // ── Form submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing = config.formFields.filter(f => f.required && !form[f.key]?.trim());
    if (missing.length) {
      toast({
        title: 'กรุณากรอกข้อมูลให้ครบ',
        description: missing.map(f => f.label).join(', '),
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from(config.tableName as any)
      .insert(config.toInsert(form, refs) as any);

    if (error) {
      toast({ title: 'เกิดข้อผิดพลาด', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'บันทึกสำเร็จ', description: `เพิ่ม ${config.label} เรียบร้อย` });
      setForm({});
      await loadRecords();
      if (['companies', 'product_groups', 'problem_types'].includes(config.id)) {
        onRefsRefresh();
      }
    }
    setSaving(false);
  };

  // ── Export ────────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    const { data, error } = await (supabase
      .from(config.tableName as any)
      .select(config.fetchSelect) as any)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Export ล้มเหลว', description: error.message, variant: 'destructive' });
      return;
    }
    const exportRows = (data || []).map((row: any) => config.toExportRow(row));
    if (!exportRows.length) {
      toast({ title: 'ไม่มีข้อมูลสำหรับ Export', variant: 'destructive' });
      return;
    }
    const headers = Object.keys(exportRows[0]);
    const ws = XLSX.utils.json_to_sheet(exportRows, { header: headers });
    ws['!cols'] = headers.map(() => ({ wch: 28 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, config.label);
    XLSX.writeFile(wb, `${config.id}_export.xlsx`);
    toast({ title: 'Export สำเร็จ', description: `ส่งออก ${exportRows.length} รายการ` });
  };

  // ── Download template ─────────────────────────────────────────────────────────
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet(config.importSampleRows);
    ws['!cols'] = config.importColumns.map(() => ({ wch: 28 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, config.label);
    XLSX.writeFile(wb, `template_${config.id}.xlsx`);
  };

  // ── Import file pick ──────────────────────────────────────────────────────────
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportResult(null);
    setImportPreview(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target?.result, { type: 'binary' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
      const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
      setImportPreview({ headers, rows: rows.slice(0, 5) });
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  }, []);

  // ── Do import ─────────────────────────────────────────────────────────────────
  const handleImport = useCallback(async () => {
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);

    try {
      const data = await importFile.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const allRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
      const transformed = config.toImportRows(allRows, refs);

      let total = 0;
      const BATCH = 50;
      for (let i = 0; i < transformed.length; i += BATCH) {
        const { data: inserted, error } = await supabase
          .from(config.tableName as any)
          .insert(transformed.slice(i, i + BATCH) as any)
          .select();
        if (error) throw new Error(error.message);
        total += inserted?.length || 0;
      }

      setImportResult({ success: true, message: `Import สำเร็จ ${total} รายการ` });
      await loadRecords();
      if (['companies', 'product_groups', 'problem_types'].includes(config.id)) {
        onRefsRefresh();
      }
    } catch (err: any) {
      setImportResult({ success: false, message: `Error: ${err.message}` });
    }
    setImporting(false);
  }, [importFile, config, refs, loadRecords, onRefsRefresh]);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">{config.label}</h2>
          {!loading && (
            <Badge variant="secondary" className="text-xs">{records.length} รายการ</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
          <Button
            variant={showImport ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => { setShowImport(v => !v); setImportResult(null); }}
            className="gap-1.5 text-xs"
          >
            <FileUp className="h-3.5 w-3.5" />
            Import
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={loadRecords}
            title="รีเฟรช"
            className="h-8 w-8"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* ── Form + Table ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 items-start">

        {/* Add Form */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-primary" />
              เพิ่มรายการใหม่
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              {config.formFields.map(field => (
                <div key={field.key} className="space-y-1">
                  <Label htmlFor={`${config.id}-${field.key}`} className="text-xs font-medium">
                    {field.label}
                    {field.required && <span className="text-destructive ml-0.5">*</span>}
                  </Label>

                  {field.type === 'select' ? (
                    <Select
                      value={form[field.key] ?? ''}
                      onValueChange={val => setForm(f => ({ ...f, [field.key]: val }))}
                    >
                      <SelectTrigger id={`${config.id}-${field.key}`} className="h-8 text-sm">
                        <SelectValue placeholder={`เลือก${field.label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {!field.required && (
                          <SelectItem value="">— ไม่ระบุ —</SelectItem>
                        )}
                        {field.refKey && refs[field.refKey].map(item => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={`${config.id}-${field.key}`}
                      value={form[field.key] ?? ''}
                      onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="h-8 text-sm"
                    />
                  )}
                </div>
              ))}

              <Button type="submit" disabled={saving} className="w-full mt-2" size="sm">
                {saving ? (
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> กำลังบันทึก...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> เพิ่มรายการ
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="border-border bg-card overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" /> กำลังโหลดข้อมูล...
              </div>
            ) : records.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm gap-2">
                <Database className="h-8 w-8 opacity-30" />
                <span>ยังไม่มีข้อมูล กรุณาเพิ่มรายการหรือ Import</span>
              </div>
            ) : (
              <div className="overflow-auto max-h-[480px]">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs w-10 text-center">#</TableHead>
                      {config.displayColumns.map(col => (
                        <TableHead key={col.key} className="text-xs whitespace-nowrap">
                          {col.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((row, i) => {
                      const display = config.toDisplayRow(row);
                      return (
                        <TableRow key={row.id ?? i} className="hover:bg-muted/40">
                          <TableCell className="text-xs text-muted-foreground text-center">{i + 1}</TableCell>
                          {config.displayColumns.map(col => (
                            <TableCell key={col.key} className="text-xs">
                              {display[col.key] ?? '-'}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Import Panel ── */}
      {showImport && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                  <FileUp className="h-4 w-4 text-primary" />
                  Import {config.label} จากไฟล์ Excel
                </CardTitle>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-xs text-muted-foreground">คอลัมน์:</span>
                  {config.importColumns.map(col => (
                    <Badge key={col.key} variant={col.required ? 'default' : 'secondary'} className="text-xs">
                      {col.label}{col.required && ' *'}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="gap-1.5 text-xs"
              >
                <Download className="h-3.5 w-3.5" />
                ดาวน์โหลด Template
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Upload area */}
            <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground text-center">
                {importFile ? importFile.name : 'คลิกเพื่อเลือกไฟล์ Excel (.xlsx, .xls)'}
              </span>
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            {/* Preview */}
            {importPreview && importPreview.rows.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <FileSpreadsheet className="h-4 w-4" />
                  ตัวอย่างข้อมูล (แสดง {importPreview.rows.length} แถวแรก)
                </p>

                <div className="rounded-lg border border-border overflow-auto max-h-48">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {importPreview.headers.slice(0, 7).map(h => (
                          <TableHead key={h} className="text-xs whitespace-nowrap">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importPreview.rows.map((row, i) => (
                        <TableRow key={i}>
                          {importPreview.headers.slice(0, 7).map(h => (
                            <TableCell key={h} className="text-xs max-w-[180px] truncate">
                              {String(row[h] ?? '')}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <Button
                  onClick={handleImport}
                  disabled={importing}
                  className="w-full"
                >
                  {importing ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" /> กำลัง Import...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Database className="h-4 w-4" /> Import เข้าฐานข้อมูล
                    </span>
                  )}
                </Button>
              </div>
            )}

            {/* Result */}
            {importResult && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                importResult.success
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                  : 'bg-destructive/10 text-destructive'
              }`}>
                {importResult.success
                  ? <CheckCircle2 className="h-5 w-5 shrink-0" />
                  : <AlertCircle className="h-5 w-5 shrink-0" />
                }
                <span className="text-sm">{importResult.message}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MasterData() {
  const [refs, setRefs] = useState<RefData>({
    companies: [],
    categories: [],
    problem_types: [],
  });

  const loadRefs = useCallback(async () => {
    const [{ data: companies }, { data: categories }, { data: problem_types }] =
      await Promise.all([
        supabase.from('companies').select('id, name').order('name'),
        supabase.from('categories').select('id, name').order('name'),
        supabase.from('problem_types').select('id, name').order('name'),
      ]);
    setRefs({
      companies: (companies as any) || [],
      categories: (categories as any) || [],
      problem_types: (problem_types as any) || [],
    });
  }, []);

  useEffect(() => { loadRefs(); }, [loadRefs]);

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />

      <div className="max-w-[1440px] mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            Master Data Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            จัดการข้อมูลหลัก — กรอกข้อมูลด้วยมือ, Import จาก Excel หรือ Export เป็นไฟล์
          </p>
        </div>

        <Tabs defaultValue="companies" className="space-y-6">
          <div className="glass rounded-2xl p-1.5">
            <TabsList className="bg-transparent border-0 p-0 h-auto flex flex-wrap gap-1">
              {TAB_CONFIGS.map(config => {
                const Icon = config.icon;
                return (
                  <TabsTrigger
                    key={config.id}
                    value={config.id}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5 text-sm rounded-xl"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {config.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {TAB_CONFIGS.map(config => (
            <TabsContent key={config.id} value={config.id}>
              <TableTab config={config} refs={refs} onRefsRefresh={loadRefs} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
