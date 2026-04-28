import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { setStaffSession, getStaffSession, type StaffRole } from "@/lib/staff-auth";
import { toast } from "sonner";

export default function StaffLogin() {
  const navigate = useNavigate();
  const [passkey, setPasskey] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getStaffSession()) navigate("/staff/tables", { replace: true });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passkey.length !== 4) {
      toast.error("Enter a 4-digit passkey");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("staff_users")
      .select("id, name, role, is_active")
      .eq("passkey", passkey)
      .eq("is_active", true)
      .order("role", { ascending: true })
      .limit(1);
    setLoading(false);
    const user = data?.[0];
    if (error || !user) {
      toast.error("Invalid passkey");
      setPasskey("");
      return;
    }
    setStaffSession({ staff_id: user.id, name: user.name, role: user.role as StaffRole });
    toast.success(`Welcome, ${user.name}`);
    navigate("/staff/tables", { replace: true });
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Staff Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="password"
              inputMode="numeric"
              autoFocus
              maxLength={4}
              placeholder="••••"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="text-center text-2xl tracking-[0.5em]"
            />
            <Button type="submit" className="w-full" disabled={loading || passkey.length !== 4}>
              {loading ? "Signing in…" : "Sign In"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">Default passkey: 1234</p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
