import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Database, Building2, GitBranch, Package, Tag, AlertTriangle, List, Users, Download } from 'lucide-react';
import TopNavBar from '@/components/TopNavBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

interface TableConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  tableName: string;
  columns: { key: string; label: string; required?: boolean }[];
  sampleRows: Record<string, string>[];
  transform: (row: Record<string, any>) => Record<string, any>;
}

const TABLE_CONFIGS: TableConfig[] = [
  {
    id: 'companies',
    label: 'บริษัท',
    icon: Building2,
    tableName: 'companies',
    columns: [
      { key: 'name', label: 'ชื่อบริษัท', required: true },
      { key: 'code', label: 'รหัส' },
    ],
    sampleRows: [
      { 'ชื่อบริษัท': 'บริษัท ABC จำกัด', 'รหัส': 'COM001' },
      { 'ชื่อบริษัท': 'บริษัท XYZ จำกัด', 'รหัส': 'COM002' },
    ],
    transform: (row) => ({
      name: row['name'] || row['ชื่อบริษัท'] || row['Name'] || 'ไม่ระบุ',
      code: row['code'] || row['รหัส'] || row['Code'] || 'ไม่ระบุ',
    }),
  },
  {
    id: 'branches',
    label: 'สาขา',
    icon: GitBranch,
    tableName: 'branches',
    columns: [
      { key: 'name', label: 'ชื่อสาขา', required: true },
      { key: 'code', label: 'รหัส' },
      { key: 'company_name', label: 'บริษัท (ชื่อ)' },
    ],
    sampleRows: [
      { 'ชื่อสาขา': 'สาขากรุงเทพ', 'รหัส': 'BR001', 'บริษัท (ชื่อ)': 'บริษัท ABC จำกัด' },
      { 'ชื่อสาขา': 'สาขาเชียงใหม่', 'รหัส': 'BR002', 'บริษัท (ชื่อ)': 'บริษัท ABC จำกัด' },
    ],
    transform: (row) => ({
      name: row['name'] || row['ชื่อสาขา'] || row['Name'] || 'ไม่ระบุ',
      code: row['code'] || row['รหัส'] || row['Code'] || 'ไม่ระบุ',
      _company_name: row['company_name'] || row['บริษัท'] || row['Company'] || '',
    }),
  },
  {
    id: 'product_groups',
    label: 'กลุ่มสินค้า',
    icon: Package,
    tableName: 'product_groups',
    columns: [
      { key: 'name', label: 'ชื่อกลุ่ม', required: true },
      { key: 'code', label: 'รหัส' },
    ],
    sampleRows: [
      { 'ชื่อกลุ่ม': 'อาหารแปรรูป', 'รหัส': 'PG001' },
      { 'ชื่อกลุ่ม': 'เครื่องดื่ม', 'รหัส': 'PG002' },
    ],
    transform: (row) => ({
      name: row['name'] || row['ชื่อกลุ่ม'] || row['Name'] || 'ไม่ระบุ',
      code: row['code'] || row['รหัส'] || row['Code'] || 'ไม่ระบุ',
    }),
  },
  {
    id: 'categories',
    label: 'หมวดหมู่',
    icon: Tag,
    tableName: 'categories',
    columns: [
      { key: 'name', label: 'ชื่อหมวดหมู่', required: true },
      { key: 'code', label: 'รหัส' },
      { key: 'product_group_name', label: 'กลุ่มสินค้า (ชื่อ)' },
    ],
    sampleRows: [
      { 'ชื่อหมวดหมู่': 'Food Safety', 'รหัส': 'CAT001', 'กลุ่มสินค้า (ชื่อ)': 'อาหารแปรรูป' },
      { 'ชื่อหมวดหมู่': 'Food Quality', 'รหัส': 'CAT002', 'กลุ่มสินค้า (ชื่อ)': 'เครื่องดื่ม' },
    ],
    transform: (row) => ({
      name: row['name'] || row['ชื่อหมวดหมู่'] || row['Name'] || 'ไม่ระบุ',
      code: row['code'] || row['รหัส'] || row['Code'] || 'ไม่ระบุ',
      _product_group_name: row['product_group_name'] || row['กลุ่มสินค้า'] || row['Product Group'] || '',
    }),
  },
  {
    id: 'problem_types',
    label: 'ประเภทปัญหา',
    icon: AlertTriangle,
    tableName: 'problem_types',
    columns: [
      { key: 'name', label: 'ชื่อประเภท', required: true },
      { key: 'code', label: 'รหัส' },
    ],
    sampleRows: [
      { 'ชื่อประเภท': 'สิ่งแปลกปลอม', 'รหัส': 'PT001' },
      { 'ชื่อประเภท': 'คุณภาพผลิตภัณฑ์', 'รหัส': 'PT002' },
    ],
    transform: (row) => ({
      name: row['name'] || row['ชื่อประเภท'] || row['Name'] || 'ไม่ระบุ',
      code: row['code'] || row['รหัส'] || row['Code'] || 'ไม่ระบุ',
    }),
  },
  {
    id: 'problem_sub_types',
    label: 'ประเภทย่อย',
    icon: List,
    tableName: 'problem_sub_types',
    columns: [
      { key: 'name', label: 'ชื่อประเภทย่อย', required: true },
      { key: 'problem_type_name', label: 'ประเภทปัญหา (ชื่อ)' },
    ],
    sampleRows: [
      { 'ชื่อประเภทย่อย': 'พบแมลง', 'ประเภทปัญหา (ชื่อ)': 'สิ่งแปลกปลอม' },
      { 'ชื่อประเภทย่อย': 'สีผิดปกติ', 'ประเภทปัญหา (ชื่อ)': 'คุณภาพผลิตภัณฑ์' },
    ],
    transform: (row) => ({
      name: row['name'] || row['ชื่อประเภทย่อย'] || row['Name'] || 'ไม่ระบุ',
      _problem_type_name: row['problem_type_name'] || row['ประเภทปัญหา'] || row['Problem Type'] || '',
    }),
  },
  {
    id: 'callers',
    label: 'ผู้แจ้ง',
    icon: Users,
    tableName: 'callers',
    columns: [
      { key: 'name', label: 'ชื่อผู้แจ้ง', required: true },
      { key: 'phone', label: 'เบอร์โทร' },
      { key: 'email', label: 'อีเมล' },
    ],
    sampleRows: [
      { 'ชื่อผู้แจ้ง': 'สมชาย ใจดี', 'เบอร์โทร': '081-234-5678', 'อีเมล': 'somchai@example.com' },
      { 'ชื่อผู้แจ้ง': 'สมหญิง รักดี', 'เบอร์โทร': '089-876-5432', 'อีเมล': 'somying@example.com' },
    ],
    transform: (row) => ({
      name: row['name'] || row['ชื่อผู้แจ้ง'] || row['Name'] || 'ไม่ระบุ',
      phone: row['phone'] || row['เบอร์โทร'] || row['Phone'] || null,
      email: row['email'] || row['อีเมล'] || row['Email'] || null,
    }),
  },
];


interface ImportState {
  previewData: Record<string, any>[] | null;
  rawHeaders: string[];
  importing: boolean;
  result: { success: boolean; count: number; message: string } | null;
  fileName: string;
}

function downloadTemplate(config: TableConfig) {
  const headers = config.columns.map(c => c.label);
  const ws = XLSX.utils.json_to_sheet(config.sampleRows, { header: headers });
  // Set column widths
  ws['!cols'] = headers.map(() => ({ wch: 25 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, config.label);
  XLSX.writeFile(wb, `template_${config.id}.xlsx`);
}

function TableImporter({ config }: { config: TableConfig }) {
  const [state, setState] = useState<ImportState>({
    previewData: null,
    rawHeaders: [],
    importing: false,
    result: null,
    fileName: '',
  });

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });

      const rawHeaders = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];

      setState({
        previewData: jsonData.slice(0, 10),
        rawHeaders,
        importing: false,
        result: null,
        fileName: file.name,
      });
    };
    reader.readAsBinaryString(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  }, []);

  const handleImport = async () => {
    if (!state.previewData) return;

    setState(s => ({ ...s, importing: true, result: null }));

    try {
      // Re-read full data from stored file concept - we need to re-parse
      // For now, we import from preview concept but let's re-read properly
      // Actually we should store full data. Let's adjust:
      // We'll use a ref or state for full data
    } catch {
      // handled below
    }

    setState(s => ({ ...s, importing: false }));
  };

  const handleFullImport = useCallback(async (file: File) => {
    setState(s => ({ ...s, importing: true, result: null }));

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });

      // Transform data
      const transformed = jsonData.map(row => {
        const t = config.transform(row);
        // Remove internal fields (starting with _)
        const clean: Record<string, any> = {};
        for (const [k, v] of Object.entries(t)) {
          if (!k.startsWith('_')) {
            clean[k] = v === '' ? 'ไม่ระบุ' : v;
          }
        }
        return clean;
      });

      // Batch insert
      let totalInserted = 0;
      const batchSize = 50;
      for (let i = 0; i < transformed.length; i += batchSize) {
        const batch = transformed.slice(i, i + batchSize);
        const { data: inserted, error } = await supabase
          .from(config.tableName as any)
          .insert(batch as any)
          .select();

        if (error) throw new Error(error.message);
        totalInserted += inserted?.length || 0;
      }

      setState(s => ({
        ...s,
        importing: false,
        result: { success: true, count: totalInserted, message: `Import สำเร็จ ${totalInserted} รายการ` },
      }));
    } catch (err: any) {
      setState(s => ({
        ...s,
        importing: false,
        result: { success: false, count: 0, message: `Error: ${err.message}` },
      }));
    }
  }, [config]);

  // Store file ref for full import
  const [file, setFile] = useState<File | null>(null);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    handleFileUpload(e);
  }, [handleFileUpload]);

  const Icon = config.icon;

  return (
    <div className="space-y-4">
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Import {config.label}</CardTitle>
              <CardDescription>
                อัปโหลดไฟล์ Excel (.xlsx, .xls) สำหรับตาราง {config.label}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Required columns + Download Template */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground">คอลัมน์:</span>
              {config.columns.map(col => (
                <Badge key={col.key} variant={col.required ? 'default' : 'secondary'} className="text-xs">
                  {col.label} {col.required && '*'}
                </Badge>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => downloadTemplate(config)}
            >
              <Download className="h-3.5 w-3.5" />
              ดาวน์โหลด Template
            </Button>
          </div>

          {/* Upload Area */}
          <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {state.fileName ? state.fileName : 'คลิกเพื่อเลือกไฟล์ Excel'}
            </span>
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={onFileChange}
            />
          </label>

          {/* Preview Table */}
          {state.previewData && state.previewData.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <FileSpreadsheet className="h-4 w-4" />
                  ตัวอย่างข้อมูล (แสดง {state.previewData.length} แถวแรก)
                </p>
                <Badge variant="outline" className="text-xs">
                  {state.rawHeaders.length} คอลัมน์
                </Badge>
              </div>

              <div className="rounded-lg border border-border overflow-auto max-h-64">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {state.rawHeaders.slice(0, 6).map(h => (
                        <TableHead key={h} className="text-xs whitespace-nowrap">{h}</TableHead>
                      ))}
                      {state.rawHeaders.length > 6 && (
                        <TableHead className="text-xs">+{state.rawHeaders.length - 6} more</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {state.previewData.map((row, i) => (
                      <TableRow key={i}>
                        {state.rawHeaders.slice(0, 6).map(h => (
                          <TableCell key={h} className="text-xs whitespace-nowrap max-w-[200px] truncate">
                            {String(row[h] ?? '')}
                          </TableCell>
                        ))}
                        {state.rawHeaders.length > 6 && (
                          <TableCell className="text-xs text-muted-foreground">...</TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Button
                onClick={() => file && handleFullImport(file)}
                disabled={state.importing || !file}
                className="w-full"
                size="lg"
              >
                {state.importing ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span> กำลัง Import...
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
          {state.result && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              state.result.success
                ? 'bg-kpi-green/10 text-kpi-green'
                : 'bg-destructive/10 text-destructive'
            }`}>
              {state.result.success ? (
                <CheckCircle2 className="h-5 w-5 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0" />
              )}
              <span className="text-sm">{state.result.message}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function MasterData() {
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
            Import ข้อมูลจากไฟล์ Excel เข้าฐานข้อมูล
          </p>
        </div>

        <Tabs defaultValue="companies" className="space-y-6">
          <div className="glass rounded-2xl p-1.5">
            <TabsList className="bg-transparent border-0 p-0 h-auto flex flex-wrap gap-1">
              {TABLE_CONFIGS.map(config => {
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

          {TABLE_CONFIGS.map(config => (
            <TabsContent key={config.id} value={config.id}>
              <TableImporter config={config} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
