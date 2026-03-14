import { useState, useEffect } from "react";
import { supabase, createEphemeralSupabaseClient } from "@/integrations/supabase/client";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import TopNavBar from "@/components/TopNavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Users, Loader2, Shield, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface UserRecord {
  id: string;
  user_id: string;
  email: string;
  created_at: string;
  role: AppRole;
  is_active: boolean;
}

const ROLES: { value: AppRole; label: string }[] = [
  { value: "admin", label: "ผู้ดูแลระบบ" },
  { value: "supervisor", label: "หัวหน้างาน" },
  { value: "executive", label: "ผู้บริหาร" },
  { value: "staff", label: "เจ้าหน้าที่" },
];

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-destructive/10 text-destructive border-destructive/20",
  supervisor: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  executive: "bg-primary/10 text-primary border-primary/20",
  staff: "bg-muted text-muted-foreground border-border",
};

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserRecord | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<AppRole>("staff");

  async function loadUsers() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setUsers((data as UserRecord[]) || []);
    } catch (err: any) {
      toast.error("โหลดข้อมูลผู้ใช้ไม่สำเร็จ: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, []);

  function openCreate() {
    setEditingUser(null);
    setFormEmail("");
    setFormPassword("");
    setFormRole("staff");
    setDialogOpen(true);
  }

  function openEdit(u: UserRecord) {
    setEditingUser(u);
    setFormEmail(u.email);
    setFormPassword("");
    setFormRole(u.role || "staff");
    setDialogOpen(true);
  }

  function openDelete(u: UserRecord) {
    setDeletingUser(u);
    setDeleteDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editingUser) {
        // Update role
        const { error: roleError } = await supabase
          .from("user_roles")
          .update({ role: formRole })
          .eq("id", editingUser.id);

        if (roleError) throw roleError;

        // Update password if provided
        if (formPassword) {
          const { error: pwError } = await supabase.auth.updateUser({
            password: formPassword,
          });
          if (pwError) {
            toast.warning("อัปเดต role สำเร็จ แต่เปลี่ยนรหัสผ่านได้เฉพาะของตัวเอง");
          }
        }

        toast.success("อัปเดตผู้ใช้สำเร็จ");
      } else {
        // Create new user via signUp
        if (!formEmail || !formPassword) {
          toast.error("กรุณากรอกอีเมลและรหัสผ่าน");
          setSaving(false);
          return;
        }
        if (formPassword.length < 6) {
          toast.error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
          setSaving(false);
          return;
        }

        const ephemeralClient = createEphemeralSupabaseClient();
        const { data: signUpData, error: signUpError } = await ephemeralClient.auth.signUp({
          email: formEmail,
          password: formPassword,
          options: { emailRedirectTo: undefined },
        });

        if (signUpError) {
          const msg = signUpError.message;
          if (msg.includes("invalid")) {
            throw new Error("อีเมลไม่ถูกต้อง กรุณาใช้อีเมลจริง (ไม่รองรับ test.com, example.com)");
          }
          if (msg.includes("already")) {
            throw new Error("อีเมลนี้มีอยู่ในระบบแล้ว");
          }
          throw signUpError;
        }

        // signUp may return a fake user if email already exists (Supabase security)
        if (!signUpData.user || signUpData.user.identities?.length === 0) {
          throw new Error("อีเมลนี้มีอยู่ในระบบแล้ว");
        }

        // Insert role record with email using current admin session client
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: signUpData.user.id,
            role: formRole,
            email: formEmail,
          });

        if (roleError) {
          if (roleError.message.includes("row-level security")) {
            throw new Error("ไม่มีสิทธิ์เพิ่ม role (RLS) กรุณาตรวจสอบ policy 'Admin can manage user_roles'");
          }
          throw roleError;
        }

        toast.success("เพิ่มผู้ใช้สำเร็จ");
      }
      setDialogOpen(false);
      loadUsers();
    } catch (err: any) {
      toast.error("บันทึกไม่สำเร็จ: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingUser) return;
    setSaving(true);
    try {
      // Remove role (soft delete - user can no longer access the app)
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", deletingUser.id);

      if (error) throw error;

      toast.success("ลบผู้ใช้ออกจากระบบสำเร็จ");
      setDeleteDialogOpen(false);
      setDeletingUser(null);
      loadUsers();
    } catch (err: any) {
      toast.error("ลบไม่สำเร็จ: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar />
      <main className="max-w-[1200px] mx-auto px-6 py-8">
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">จัดการผู้ใช้งาน</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">เพิ่ม แก้ไข ลบผู้ใช้ และกำหนดบทบาท</p>
              </div>
            </div>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              เพิ่มผู้ใช้
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-semibold">อีเมล</TableHead>
                      <TableHead className="font-semibold">บทบาท</TableHead>
                      <TableHead className="font-semibold">วันที่สร้าง</TableHead>
                      <TableHead className="font-semibold text-right">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                          ยังไม่มีผู้ใช้ในระบบ
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((u) => (
                        <TableRow key={u.id} className="group">
                          <TableCell className="font-medium">{u.email}</TableCell>
                          <TableCell>
                            {u.role ? (
                              <Badge variant="outline" className={ROLE_COLORS[u.role] || ""}>
                                <Shield className="h-3 w-3 mr-1" />
                                {ROLES.find(r => r.value === u.role)?.label || u.role}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">ไม่มี role</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString("th-TH", {
                              year: "numeric", month: "short", day: "numeric"
                            }) : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="sm" onClick={() => openEdit(u)} className="h-8 w-8 p-0">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDelete(u)}
                                disabled={u.user_id === currentUser?.id}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? "แก้ไขผู้ใช้" : "เพิ่มผู้ใช้ใหม่"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>อีเมล</Label>
              <Input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                disabled={!!editingUser}
                placeholder="user@example.com"
              />
            </div>
            {!editingUser && (
              <div className="space-y-2">
                <Label>รหัสผ่าน</Label>
                <Input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่าน (อย่างน้อย 6 ตัว)"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>บทบาท</Label>
              <Select value={formRole} onValueChange={(v) => setFormRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingUser ? "บันทึก" : "เพิ่มผู้ใช้"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              ยืนยันการลบ
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            คุณต้องการลบผู้ใช้ <strong className="text-foreground">{deletingUser?.email}</strong> ออกจากระบบใช่หรือไม่?
            ผู้ใช้จะไม่สามารถเข้าใช้งานระบบได้อีก
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>ยกเลิก</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              ลบผู้ใช้
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
