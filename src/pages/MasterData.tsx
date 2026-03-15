import { useState, useCallback, useEffect } from 'react';
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Database,
  Building2, GitBranch, Package, Tag, AlertTriangle, List, Users,
  Download, Plus, RefreshCw, FileUp, Pencil, Trash2, Save, X, Flag, Zap,
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  toUpdate: (form: Record<string, string>, refs: RefData) => Record<string, any>;
  toDisplayRow: (row: any, refs: RefData) => Record<string, string>;
  toExportRow: (row: any, refs: RefData) => Record<string, string>;
  toFormValues: (row: any) => Record<string, string>;
  importColumns: { key: string; label: string; required?: boolean }[];
  importSampleRows: Record<string, string>[];
  toImportRows: (rows: Record<string, any>[], refs: RefData) => Record<string, any>[];
  upsertKey?: string; // column name for upsert conflict detection (e.g., 'code'), undefined = insert only
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
    toUpdate: (form) => ({ name: form.name, code: form.code || null }),
    toFormValues: (row) => ({ name: row.name || '', code: row.code || '' }),
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
    fetchSelect: 'id, name, code, company_id, companies:company_id(name)',
    toInsert: (form) => ({ name: form.name, code: form.code || null, company_id: form.company_id }),
    toUpdate: (form) => ({ name: form.name, code: form.code || null, company_id: form.company_id }),
    toFormValues: (row) => ({ name: row.name || '', code: row.code || '', company_id: row.company_id || '' }),
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
    toUpdate: (form) => ({ name: form.name, code: form.code || null }),
    toFormValues: (row) => ({ name: row.name || '', code: row.code || '' }),
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
    toInsert: (form) => ({ name: form.name, code: form.code || null }),
    toUpdate: (form) => ({ name: form.name, code: form.code || null }),
    toFormValues: (row) => ({ name: row.name || '', code: row.code || '' }),
    toDisplayRow: (row) => ({ name: row.name, code: row.code || '-' }),
    toExportRow: (row) => ({ 'ชื่อหมวดหมู่': row.name, 'รหัส': row.code || '' }),
    importColumns: [
      { key: 'name', label: 'ชื่อหมวดหมู่', required: true },
      { key: 'code', label: 'รหัส' },
    ],
    importSampleRows: [
      { 'ชื่อหมวดหมู่': 'Food Safety', 'รหัส': 'CAT001' },
      { 'ชื่อหมวดหมู่': 'Food Quality', 'รหัส': 'CAT002' },
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
      { key: 'category_id', label: 'หมวดหมู่', type: 'select', refKey: 'categories' },
    ],
    displayColumns: [
      { key: 'name', label: 'ชื่อประเภทปัญหา' },
      { key: 'code', label: 'รหัส' },
      { key: 'category_name', label: 'หมวดหมู่' },
    ],
    fetchSelect: '*',
    toInsert: (form) => ({ name: form.name, code: form.code || null, category_id: form.category_id || null }),
    toUpdate: (form) => ({ name: form.name, code: form.code || null, category_id: form.category_id || null }),
    toFormValues: (row) => ({ name: row.name || '', code: row.code || '', category_id: row.category_id || '' }),
    toDisplayRow: (row, refs) => ({
      name: row.name || '-',
      code: row.code || '-',
      category_name: refs.categories.find(c => c.id === row.category_id)?.name || '-',
    }),
    toExportRow: (row, refs) => ({
      'ชื่อประเภทปัญหา': row.name || '',
      'รหัส': row.code || '',
      'หมวดหมู่': refs.categories.find(c => c.id === row.category_id)?.name || '',
    }),
    importColumns: [
      { key: 'name', label: 'ชื่อประเภท', required: true },
      { key: 'code', label: 'รหัส' },
      { key: 'category_name', label: 'หมวดหมู่ (ชื่อ)' },
    ],
    importSampleRows: [
      { 'ชื่อประเภท': 'สิ่งแปลกปลอม', 'รหัส': 'PT001', 'หมวดหมู่ (ชื่อ)': 'Food Safety' },
      { 'ชื่อประเภท': 'คุณภาพผลิตภัณฑ์', 'รหัส': 'PT002', 'หมวดหมู่ (ชื่อ)': 'Food Quality' },
    ],
    toImportRows: (rows, refs) => {
      const map: Record<string, string> = {};
      refs.categories.forEach(c => { map[c.name] = c.id; });
      return rows.map(r => ({
        name: r['name'] || r['ชื่อประเภท'] || r['ชื่อประเภทปัญหา'] || 'ไม่ระบุ',
        code: r['code'] || r['รหัส'] || null,
        category_id: map[r['category_name'] || r['หมวดหมู่ (ชื่อ)'] || r['หมวดหมู่'] || ''] || null,
      }));
    },
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
    fetchSelect: '*',
    toInsert: (form) => ({ name: form.name, problem_type_id: form.problem_type_id }),
    toUpdate: (form) => ({ name: form.name, problem_type_id: form.problem_type_id }),
    toFormValues: (row) => ({ name: row.name || '', problem_type_id: row.problem_type_id || '' }),
    toDisplayRow: (row, refs) => ({
      name: row.name || '-',
      problem_type_name: refs.problem_types.find(pt => pt.id === row.problem_type_id)?.name || '-',
    }),
    toExportRow: (row, refs) => ({
      'ชื่อประเภทย่อย': row.name || '',
      'ประเภทปัญหา': refs.problem_types.find(pt => pt.id === row.problem_type_id)?.name || '',
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

  // ── ช่องทางการแจ้งปัญหา ─────────────────────────────────────────────────────────
  {
    id: 'callers',
    label: 'ช่องทางการแจ้งปัญหา',
    icon: Users,
    tableName: 'callers',
    formFields: [
      { key: 'name', label: 'ชื่อช่องทาง', type: 'text', required: true, placeholder: 'กรอกชื่อช่องทาง' },
      { key: 'phone', label: 'เบอร์โทร', type: 'text', placeholder: 'เช่น 081-234-5678' },
      { key: 'email', label: 'อีเมล', type: 'text', placeholder: 'example@email.com' },
      { key: 'customer_company_name', label: 'บริษัทลูกค้า', type: 'text', placeholder: 'กรอกชื่อบริษัทลูกค้า' },
    ],
    displayColumns: [
      { key: 'name', label: 'ชื่อช่องทาง' },
      { key: 'phone', label: 'เบอร์โทร' },
      { key: 'email', label: 'อีเมล' },
      { key: 'customer_company_name', label: 'บริษัทลูกค้า' },
    ],
    fetchSelect: '*',
    toInsert: (form) => ({
      name: form.name,
      phone: form.phone || null,
      email: form.email || null,
      customer_company_name: form.customer_company_name || null,
    }),
    toUpdate: (form) => ({
      name: form.name,
      phone: form.phone || null,
      email: form.email || null,
      customer_company_name: form.customer_company_name || null,
    }),
    toFormValues: (row) => ({
      name: row.name || '',
      phone: row.phone || '',
      email: row.email || '',
      customer_company_name: row.customer_company_name || '',
    }),
    toDisplayRow: (row) => ({
      name: row.name || '-',
      phone: row.phone || '-',
      email: row.email || '-',
      customer_company_name: row.customer_company_name || '-',
    }),
    toExportRow: (row) => ({
      'ชื่อช่องทาง': row.name || '',
      'เบอร์โทร': row.phone || '',
      'อีเมล': row.email || '',
      'บริษัทลูกค้า': row.customer_company_name || '',
    }),
    importColumns: [
      { key: 'name', label: 'ชื่อช่องทาง', required: true },
      { key: 'phone', label: 'เบอร์โทร' },
      { key: 'email', label: 'อีเมล' },
      { key: 'customer_company_name', label: 'บริษัทลูกค้า' },
    ],
    importSampleRows: [
      { 'ชื่อช่องทาง': 'สมชาย ใจดี', 'เบอร์โทร': '081-234-5678', 'อีเมล': 'somchai@example.com', 'บริษัทลูกค้า': 'บริษัท ABC จำกัด' },
      { 'ชื่อช่องทาง': 'สมหญิง รักดี', 'เบอร์โทร': '089-876-5432', 'อีเมล': 'somying@example.com', 'บริษัทลูกค้า': '' },
    ],
    toImportRows: (rows) => rows.map(r => ({
      name: r['name'] || r['ชื่อช่องทาง'] || 'ไม่ระบุ',
      phone: r['phone'] || r['เบอร์โทร'] || null,
      email: r['email'] || r['อีเมล'] || null,
      customer_company_name: r['customer_company_name'] || r['บริษัทลูกค้า'] || null,
    })),
  },

  // ── สถานะ ──────────────────────────────────────────────────────────────────
  {
    id: 'statuses',
    label: 'สถานะ',
    icon: Flag,
    tableName: 'statuses',
    formFields: [
      { key: 'name', label: 'ชื่อสถานะ', type: 'text', required: true, placeholder: 'กรอกชื่อสถานะ' },
      { key: 'code', label: 'รหัส', type: 'text', placeholder: 'เช่น closed_mfg' },
    ],
    displayColumns: [
      { key: 'name', label: 'ชื่อสถานะ' },
      { key: 'code', label: 'รหัส' },
    ],
    fetchSelect: 'id, name, code',
    toInsert: (form) => ({ name: form.name, code: form.code || null }),
    toUpdate: (form) => ({ name: form.name, code: form.code || null }),
    toFormValues: (row) => ({ name: row.name || '', code: row.code || '' }),
    toDisplayRow: (row) => ({ name: row.name, code: row.code || '-' }),
    toExportRow: (row) => ({ 'ชื่อสถานะ': row.name, 'รหัส': row.code || '' }),
    importColumns: [
      { key: 'name', label: 'ชื่อสถานะ', required: true },
      { key: 'code', label: 'รหัส' },
    ],
    importSampleRows: [
      { 'ชื่อสถานะ': 'ปิดผู้ผลิต', 'รหัส': 'closed_mfg' },
      { 'ชื่อสถานะ': 'ไม่ปิดผู้ผลิต', 'รหัส': 'not_closed_mfg' },
    ],
    toImportRows: (rows) => rows.map(r => ({
      name: r['name'] || r['ชื่อสถานะ'] || 'ไม่ระบุ',
      code: r['code'] || r['รหัส'] || null,
    })),
  },

  // ── ความสำคัญ ────────────────────────────────────────────────────────────────
  {
    id: 'priorities',
    label: 'ความสำคัญ',
    icon: Zap,
    tableName: 'priorities',
    formFields: [
      { key: 'name', label: 'ชื่อความสำคัญ', type: 'text', required: true, placeholder: 'กรอกชื่อความสำคัญ' },
      { key: 'code', label: 'รหัส', type: 'text', required: true, placeholder: 'เช่น high' },
    ],
    displayColumns: [
      { key: 'name', label: 'ชื่อความสำคัญ' },
      { key: 'code', label: 'รหัส' },
    ],
    fetchSelect: 'id, name, code',
    toInsert: (form) => ({ name: form.name, code: form.code }),
    toUpdate: (form) => ({ name: form.name, code: form.code }),
    toFormValues: (row) => ({ name: row.name || '', code: row.code || '' }),
    toDisplayRow: (row) => ({ name: row.name, code: row.code }),
    toExportRow: (row) => ({ 'ชื่อความสำคัญ': row.name, 'รหัส': row.code }),
    importColumns: [
      { key: 'name', label: 'ชื่อความสำคัญ', required: true },
      { key: 'code', label: 'รหัส', required: true },
    ],
    importSampleRows: [
      { 'ชื่อความสำคัญ': 'ต่ำ', 'รหัส': 'low' },
      { 'ชื่อความสำคัญ': 'กลาง', 'รหัส': 'medium' },
    ],
    toImportRows: (rows) => rows.map(r => ({
      name: r['name'] || r['ชื่อความสำคัญ'] || 'ไม่ระบุ',
      code: r['code'] || r['รหัส'] || 'medium',
    })),
  },
];

// ─── Inline Edit Cell ─────────────────────────────────────────────────────────

function EditCell({
  field, value, onChange, refs,
}: {
  field: FormField;
  value: string;
  onChange: (val: string) => void;
  refs: RefData;
}) {
  if (field.type === 'select') {
    return (
      <Select
        value={value || '__none__'}
        onValueChange={v => onChange(v === '__none__' ? '' : v)}
      >
        <SelectTrigger className="h-7 text-xs min-w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {!field.required && <SelectItem value="__none__">— ไม่ระบุ —</SelectItem>}
          {field.refKey && refs[field.refKey].map(item => (
            <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  return (
    <Input
      value={value}
      onChange={e => onChange(e.target.value)}
      className="h-7 text-xs min-w-[100px]"
    />
  );
}

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

  // Add form
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Multi-select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [editSaving, setEditSaving] = useState(false);

  // Delete confirm dialog — store ids separately so onOpenChange(false) doesn't clear them before confirmDelete runs
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; ids: string[] }>({ open: false, ids: [] });

  // Import panel
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<{ headers: string[]; rows: Record<string, any>[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);

  // ── Load records ─────────────────────────────────────────────────────────────
  const loadRecords = useCallback(async () => {
    setLoading(true);
    setSelectedIds(new Set());
    setEditingId(null);
    try {
      let { data, error } = await (supabase
        .from(config.tableName as any)
        .select(config.fetchSelect) as any)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        const retry = await (supabase
          .from(config.tableName as any)
          .select('*') as any)
          .order('created_at', { ascending: false })
          .limit(200);
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        const retry = await (supabase
          .from(config.tableName as any)
          .select('*') as any)
          .limit(200);
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        toast({ title: 'เกิดข้อผิดพลาด', description: error.message, variant: 'destructive' });
      } else {
        setRecords(data || []);
      }
    } catch (e: any) {
      toast({ title: 'เกิดข้อผิดพลาด', description: e.message, variant: 'destructive' });
    }
    setLoading(false);
  }, [config, toast]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  // ── Add record ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing = config.formFields.filter(f => f.required && !form[f.key]?.trim());
    if (missing.length) {
      toast({ title: 'กรุณากรอกข้อมูลให้ครบ', description: missing.map(f => f.label).join(', '), variant: 'destructive' });
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
      if (['companies', 'product_groups', 'problem_types', 'categories'].includes(config.id)) onRefsRefresh();
    }
    setSaving(false);
  };

  // ── Inline edit ───────────────────────────────────────────────────────────────
  const startEdit = (row: any) => {
    setEditingId(row.id);
    setEditForm(config.toFormValues(row));
  };

  const cancelEdit = () => { setEditingId(null); setEditForm({}); };

  const saveEdit = async () => {
    if (!editingId) return;
    const missing = config.formFields.filter(f => f.required && !editForm[f.key]?.trim());
    if (missing.length) {
      toast({ title: 'กรุณากรอกข้อมูลให้ครบ', description: missing.map(f => f.label).join(', '), variant: 'destructive' });
      return;
    }
    setEditSaving(true);
    const { data: updated, error } = await (supabase
      .from(config.tableName as any)
      .update(config.toUpdate(editForm, refs) as any)
      .eq('id', editingId)
      .select() as any);
    if (error) {
      toast({ title: 'เกิดข้อผิดพลาด', description: error.message, variant: 'destructive' });
    } else if (!updated || (updated as any[]).length === 0) {
      toast({
        title: 'ไม่สามารถแก้ไขได้',
        description: 'ไม่พบข้อมูล หรือไม่มีสิทธิ์แก้ไข (กรุณาตรวจสอบ RLS policy ใน Supabase)',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'แก้ไขสำเร็จ' });
      cancelEdit();
      await loadRecords();
      if (['companies', 'product_groups', 'problem_types', 'categories'].includes(config.id)) onRefsRefresh();
    }
    setEditSaving(false);
  };

  // ── Delete ────────────────────────────────────────────────────────────────────
  const openDeleteDialog = (ids: string[]) => {
    setDeleteDialog({ open: true, ids });
  };

  const confirmDelete = async () => {
    const ids = deleteDialog.ids;
    setDeleteDialog({ open: false, ids: [] });
    if (!ids.length) return;

    const { error } = await supabase
      .from(config.tableName as any)
      .delete()
      .in('id', ids);

    if (error) {
      toast({ title: 'ลบไม่สำเร็จ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'ลบสำเร็จ', description: `ลบ ${ids.length} รายการ` });
      setSelectedIds(new Set());
      await loadRecords();
      if (['companies', 'product_groups', 'problem_types', 'categories'].includes(config.id)) onRefsRefresh();
    }
  };

  // ── Select helpers ────────────────────────────────────────────────────────────
  const allSelected = records.length > 0 && records.every(r => selectedIds.has(r.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(records.map(r => r.id)));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Export ────────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    let { data, error } = await (supabase
      .from(config.tableName as any)
      .select(config.fetchSelect) as any)
      .order('created_at', { ascending: false });

    if (error) {
      const retry = await (supabase.from(config.tableName as any).select('*') as any).limit(10000);
      data = retry.data; error = retry.error;
    }
    if (error) { toast({ title: 'Export ล้มเหลว', description: error.message, variant: 'destructive' }); return; }

    const exportRows = (data || []).map((row: any) => config.toExportRow(row, refs));
    if (!exportRows.length) { toast({ title: 'ไม่มีข้อมูลสำหรับ Export', variant: 'destructive' }); return; }
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

  // ── Import ────────────────────────────────────────────────────────────────────
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file); setImportResult(null); setImportPreview(null);
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

  const handleImport = useCallback(async () => {
    if (!importFile) return;
    setImporting(true); setImportResult(null);
    try {
      const data = await importFile.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const allRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
      const transformed = config.toImportRows(allRows, refs);
      let total = 0;
      const BATCH = 50;
      for (let i = 0; i < transformed.length; i += BATCH) {
        let batch = transformed.slice(i, i + BATCH) as any;

        // Deduplicate by upsertKey if defined (keep last occurrence to avoid "cannot affect row a second time" error)
        if (config.upsertKey) {
          const seen = new Map<string, any>();
          batch.forEach((row: any) => {
            const key = row[config.upsertKey!];
            if (key !== null && key !== undefined && key !== '') {
              seen.set(String(key), row);
            }
          });
          batch = Array.from(seen.values());
        }

        const query = config.upsertKey
          ? (supabase.from(config.tableName as any).upsert(batch, { onConflict: config.upsertKey }) as any)
          : (supabase.from(config.tableName as any).insert(batch) as any);
        const { data: inserted, error } = await query.select();
        if (error) throw new Error(error.message);
        total += inserted?.length || 0;
      }
      setImportResult({ success: true, message: `Import สำเร็จ ${total} รายการ` });
      await loadRecords();
      if (['companies', 'product_groups', 'problem_types', 'categories'].includes(config.id)) onRefsRefresh();
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
        <div className="flex items-center gap-2 flex-wrap">
          {someSelected && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => openDeleteDialog(Array.from(selectedIds))}
              className="gap-1.5 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              ลบที่เลือก ({selectedIds.size})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />Export
          </Button>
          <Button
            variant={showImport ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => { setShowImport(v => !v); setImportResult(null); }}
            className="gap-1.5 text-xs"
          >
            <FileUp className="h-3.5 w-3.5" />Import
          </Button>
          <Button variant="ghost" size="icon" onClick={loadRecords} title="รีเฟรช" className="h-8 w-8">
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
                      value={form[field.key] || '__none__'}
                      onValueChange={val => setForm(f => ({ ...f, [field.key]: val === '__none__' ? '' : val }))}
                    >
                      <SelectTrigger id={`${config.id}-${field.key}`} className="h-8 text-sm">
                        <SelectValue placeholder={`เลือก${field.label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {!field.required && <SelectItem value="__none__">— ไม่ระบุ —</SelectItem>}
                        {field.refKey && refs[field.refKey].map(item => (
                          <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
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
                  <span className="flex items-center gap-1.5"><RefreshCw className="h-3.5 w-3.5 animate-spin" /> กำลังบันทึก...</span>
                ) : (
                  <span className="flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" /> เพิ่มรายการ</span>
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
              <div className="overflow-auto max-h-[520px]">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      {/* Checkbox select-all */}
                      <TableHead className="w-10 text-center">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={toggleSelectAll}
                          aria-label="เลือกทั้งหมด"
                        />
                      </TableHead>
                      <TableHead className="text-xs w-10 text-center">#</TableHead>
                      {config.displayColumns.map(col => (
                        <TableHead key={col.key} className="text-xs whitespace-nowrap">{col.label}</TableHead>
                      ))}
                      {/* Actions column */}
                      <TableHead className="text-xs w-24 text-center">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((row, i) => {
                      const isEditing = editingId === row.id;
                      const isSelected = selectedIds.has(row.id);
                      const display = config.toDisplayRow(row, refs);
                      return (
                        <TableRow
                          key={row.id ?? i}
                          className={`${isSelected ? 'bg-primary/5' : 'hover:bg-muted/40'} ${isEditing ? 'bg-amber-500/5' : ''}`}
                        >
                          {/* Checkbox */}
                          <TableCell className="text-center">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelect(row.id)}
                              aria-label={`เลือกแถว ${i + 1}`}
                            />
                          </TableCell>

                          {/* Row number */}
                          <TableCell className="text-xs text-muted-foreground text-center">{i + 1}</TableCell>

                          {/* Data columns — editable when isEditing */}
                          {config.displayColumns.map(col => {
                            const field = config.formFields.find(f => f.key === col.key || (col.key.endsWith('_name') && f.key === col.key.replace('_name', '_id')));
                            if (isEditing && field) {
                              // resolve actual form key (may differ from display key)
                              const formKey = field.key;
                              return (
                                <TableCell key={col.key} className="py-1">
                                  <EditCell
                                    field={field}
                                    value={editForm[formKey] ?? ''}
                                    onChange={val => setEditForm(f => ({ ...f, [formKey]: val }))}
                                    refs={refs}
                                  />
                                </TableCell>
                              );
                            }
                            return (
                              <TableCell key={col.key} className="text-xs">{display[col.key] ?? '-'}</TableCell>
                            );
                          })}

                          {/* Actions */}
                          <TableCell className="text-center py-1">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-500/10"
                                  onClick={saveEdit}
                                  disabled={editSaving}
                                  title="บันทึก"
                                >
                                  {editSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  onClick={cancelEdit}
                                  title="ยกเลิก"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                                  onClick={() => startEdit(row)}
                                  title="แก้ไข"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => openDeleteDialog([row.id])}
                                  title="ลบ"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
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
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" />ดาวน์โหลด Template
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground text-center">
                {importFile ? importFile.name : 'คลิกเพื่อเลือกไฟล์ Excel (.xlsx, .xls)'}
              </span>
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
            </label>

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
                            <TableCell key={h} className="text-xs max-w-[180px] truncate">{String(row[h] ?? '')}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Button onClick={handleImport} disabled={importing} className="w-full">
                  {importing ? (
                    <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> กำลัง Import...</span>
                  ) : (
                    <span className="flex items-center gap-2"><Database className="h-4 w-4" /> Import เข้าฐานข้อมูล</span>
                  )}
                </Button>
              </div>
            )}

            {importResult && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${importResult.success ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-destructive/10 text-destructive'}`}>
                {importResult.success ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
                <span className="text-sm">{importResult.message}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Delete Confirmation Dialog ── */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={open => { if (!open) setDeleteDialog(d => ({ ...d, open: false })); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบ <strong>{deleteDialog.ids.length} รายการ</strong> ออกจาก <strong>{config.label}</strong> ใช่หรือไม่?
              <br />การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialog(d => ({ ...d, open: false }))}>
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ลบ {deleteDialog.ids.length} รายการ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
