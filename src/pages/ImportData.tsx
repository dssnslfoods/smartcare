import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { importLookupData, importComplaints } from '@/utils/importData';

const ImportPage = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  const handleImport = async () => {
    setImporting(true);
    setLogs([]);
    try {
      addLog('🚀 เริ่มต้น import ข้อมูล...');
      const maps = await importLookupData(addLog);
      await importComplaints(maps, addLog);
      addLog('🎉 Import ข้อมูลทั้งหมดสำเร็จ!');
    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`);
    }
    setImporting(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Import ข้อมูลจาก Excel เข้า Supabase</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            กดปุ่มด้านล่างเพื่อ import ข้อมูล Complaint ทั้งหมดเข้าฐานข้อมูล Supabase
            (Companies, Branches, Product Groups, Categories, Problem Types, Sub-Types, Callers, Complaints)
          </p>
          <Button onClick={handleImport} disabled={importing} size="lg">
            {importing ? '⏳ กำลัง Import...' : '📥 เริ่ม Import ข้อมูล'}
          </Button>
          {logs.length > 0 && (
            <div className="bg-muted rounded-md p-4 max-h-96 overflow-y-auto space-y-1">
              {logs.map((log, i) => (
                <p key={i} className="text-sm font-mono">{log}</p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportPage;
