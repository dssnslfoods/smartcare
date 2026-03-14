import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Mail, HeartHandshake } from "lucide-react";
import logoImg from "@/assets/logo.png";
import loginBg from "@/assets/login-bg.jpg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      setLoading(false);
    } else {
      navigate("/", { replace: true });
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden">
      {/* Background Image */}
      <img
        src={loginBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-background/40" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="absolute -inset-3 rounded-full bg-primary/20 blur-xl animate-pulse" />
            <img src={logoImg} alt="Smart Care" className="relative mx-auto w-28 h-28 drop-shadow-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight drop-shadow-lg">
            Smart Care <span className="text-primary">v.1.0</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2 flex items-center justify-center gap-1.5">
            <HeartHandshake className="h-4 w-4 text-accent" />
            ระบบจัดการข้อร้องเรียนอัจฉริยะ
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card relative p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">อีเมล</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">รหัสผ่าน</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} size="lg" className="w-full rounded-xl">
              {loading ? (
                <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> กำลังเข้าสู่ระบบ...</span>
              ) : (
                "เข้าสู่ระบบ"
              )}
            </Button>
          </form>

          <div className="border-t border-border/30 pt-4 mt-2">
            <p className="text-center text-sm italic text-muted-foreground/80 leading-relaxed">
              "ทุกเสียงร้องเรียน คือโอกาสในการพัฒนา<br/>ทุกความใส่ใจ คือจุดเริ่มต้นของความไว้วางใจ"
            </p>
          </div>

          <p className="text-center text-[10px] text-muted-foreground/50 pt-1 tracking-tight">
            © 2026 SmartCare | Developed by Arnon Arpaket
          </p>
        </div>
      </div>
    </div>
  );
}
