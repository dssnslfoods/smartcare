import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AppRole, Resource } from "@/contexts/AuthContext";
import TopNavBar from "@/components/TopNavBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import Footer from "@/components/Footer";

const ROLES: { value: AppRole; label: string }[] = [
  { value: "admin", label: "ผู้ดูแลระบบ" },
  { value: "supervisor", label: "หัวหน้างาน" },
  { value: "executive", label: "ผู้บริหาร" },
  { value: "staff", label: "เจ้าหน้าที่" },
];

const RESOURCES: { value: Resource; label: string }[] = [
  { value: "dashboard", label: "แดชบอร์ด" },
  { value: "complaint_list", label: "รายการข้อร้องเรียน" },
  { value: "complaint_form", label: "บันทึกข้อร้องเรียน" },
  { value: "master_data", label: "Master Data" },
  { value: "user_management", label: "จัดการผู้ใช้" },
  { value: "role_permissions", label: "กำหนดสิทธิ์" },
];

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-destructive/10 text-destructive border-destructive/20",
  supervisor: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  executive: "bg-primary/10 text-primary border-primary/20",
  staff: "bg-muted text-muted-foreground border-border",
};

type PermissionMap = Record<string, Record<string, boolean>>;

export default function RolePermissions() {
  const { refreshPermissions } = useAuth();
  const [permMap, setPermMap] = useState<PermissionMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  async function loadPermissions() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("role_permissions")
        .select("role, resource, can_access");
      if (error) throw error;

      const map: PermissionMap = {};
      for (const row of data || []) {
        if (!map[row.role]) map[row.role] = {};
        map[row.role][row.resource] = row.can_access;
      }
      setPermMap(map);
    } catch (err: any) {
      toast.error("โหลดข้อมูลสิทธิ์ไม่สำเร็จ: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPermissions(); }, []);

  async function togglePermission(role: string, resource: string, newValue: boolean) {
    const key = `${role}:${resource}`;
    setSaving(key);
    try {
      const { error } = await supabase
        .from("role_permissions")
        .update({ can_access: newValue })
        .eq("role", role)
        .eq("resource", resource);
      if (error) throw error;

      setPermMap(prev => ({
        ...prev,
        [role]: { ...prev[role], [resource]: newValue },
      }));
      await refreshPermissions();
      toast.success("บันทึกสิทธิ์เรียบร้อย");
    } catch (err: any) {
      toast.error("บันทึกไม่สำเร็จ: " + err.message);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNavBar />

      <div className="max-w-[1440px] mx-auto px-6 py-6">
        <Card className="glass-card border-white/5">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">กำหนดสิทธิ์ตามบทบาท</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  กำหนดหน้าที่แต่ละบทบาทสามารถเข้าถึงได้
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="rounded-xl border border-white/5 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[200px]">
                        หน้า / เมนู
                      </TableHead>
                      {ROLES.map(r => (
                        <TableHead key={r.value} className="text-center w-[140px]">
                          <Badge variant="outline" className={`text-[10px] font-semibold ${ROLE_COLORS[r.value]}`}>
                            {r.label}
                          </Badge>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {RESOURCES.map(res => (
                      <TableRow key={res.value} className="border-white/5">
                        <TableCell className="text-sm font-medium">{res.label}</TableCell>
                        {ROLES.map(r => {
                          const isAdmin = r.value === "admin";
                          const checked = isAdmin ? true : (permMap[r.value]?.[res.value] ?? false);
                          const key = `${r.value}:${res.value}`;
                          return (
                            <TableCell key={r.value} className="text-center">
                              {isAdmin ? (
                                <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                                  <Lock className="h-3.5 w-3.5" />
                                  <span className="text-[10px] font-medium">เข้าถึงได้ทั้งหมด</span>
                                </div>
                              ) : (
                                <div className="flex justify-center">
                                  <Switch
                                    checked={checked}
                                    disabled={saving === key}
                                    onCheckedChange={(val) => togglePermission(r.value, res.value, val)}
                                  />
                                </div>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
