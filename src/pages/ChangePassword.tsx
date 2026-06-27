import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Must be at module level — defining inside the parent causes remount on every render (focus loss)
function PasswordInput({
  id, label, value, onChange, show, onToggle, placeholder,
}: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; show: boolean;
  onToggle: () => void; placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
          autoComplete="off"
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          onClick={onToggle}
          tabIndex={-1}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default function ChangePassword() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!currentPassword) { toast.error("กรุณากรอกรหัสผ่านปัจจุบัน"); return; }
    if (newPassword.length < 8) { toast.error("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร"); return; }
    if (newPassword !== confirmPassword) { toast.error("รหัสผ่านใหม่ไม่ตรงกัน"); return; }
    if (newPassword === currentPassword) { toast.error("รหัสผ่านใหม่ต้องแตกต่างจากรหัสผ่านปัจจุบัน"); return; }

    setSaving(true);
    try {
      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user!.email!,
        password: currentPassword,
      });
      if (signInError) {
        toast.error("รหัสผ่านปัจจุบันไม่ถูกต้อง");
        setSaving(false);
        return;
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      // Clear the flag
      const { error: flagError } = await supabase
        .from("user_roles")
        .update({ must_change_password: false })
        .eq("user_id", user!.id);
      if (flagError) throw flagError;

      await refreshProfile();
      toast.success("เปลี่ยนรหัสผ่านสำเร็จ");
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
            <KeyRound className="h-8 w-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">ตั้งรหัสผ่านใหม่</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
            เพื่อความปลอดภัย กรุณาเปลี่ยนรหัสผ่านก่อนเข้าใช้งานระบบ
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <PasswordInput
              id="currentPassword"
              label="รหัสผ่านปัจจุบัน (ที่ได้รับจากผู้ดูแลระบบ)"
              value={currentPassword}
              onChange={setCurrentPassword}
              show={showCurrent}
              onToggle={() => setShowCurrent(v => !v)}
              placeholder="กรอกรหัสผ่านที่ได้รับ"
            />

            <div className="border-t border-border/30 pt-4 space-y-4">
              <PasswordInput
                id="newPassword"
                label="รหัสผ่านใหม่"
                value={newPassword}
                onChange={setNewPassword}
                show={showNew}
                onToggle={() => setShowNew(v => !v)}
                placeholder="อย่างน้อย 8 ตัวอักษร"
              />
              <PasswordInput
                id="confirmPassword"
                label="ยืนยันรหัสผ่านใหม่"
                value={confirmPassword}
                onChange={setConfirmPassword}
                show={showConfirm}
                onToggle={() => setShowConfirm(v => !v)}
                placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
              />
            </div>

            {/* Password rules */}
            <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground/70">เงื่อนไขรหัสผ่าน:</p>
              <p className={newPassword.length >= 8 ? "text-emerald-400" : ""}>
                • ความยาวอย่างน้อย 8 ตัวอักษร
              </p>
              <p className={newPassword && newPassword !== currentPassword ? "text-emerald-400" : ""}>
                • ต้องแตกต่างจากรหัสผ่านที่ได้รับ
              </p>
              <p className={newPassword && newPassword === confirmPassword ? "text-emerald-400" : ""}>
                • รหัสผ่านทั้งสองช่องตรงกัน
              </p>
            </div>

            <Button type="submit" className="w-full gap-2" disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {saving ? "กำลังบันทึก..." : "ยืนยันและเข้าใช้งาน"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          {user?.email}
        </p>
      </div>
    </div>
  );
}
