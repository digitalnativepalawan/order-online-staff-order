import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { staffSignIn, getStaffSession } from "@/lib/staff-auth";
import { toast } from "sonner";

export default function StaffLogin() {
  const [passkey, setPasskey] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const s = getStaffSession();
    if (s) routeForRole(s.role);
  }, []);

  const routeForRole = (role: string) => {
    if (role === "kitchen") navigate("/staff/kitchen", { replace: true });
    else navigate("/staff/tables", { replace: true });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkey.trim()) return;
    setLoading(true);
    const session = await staffSignIn(passkey);
    setLoading(false);
    if (!session) {
      toast.error("Invalid passkey");
      setPasskey("");
      return;
    }
    toast.success(`Welcome, ${session.name}`);
    routeForRole(session.role);
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Lock className="h-8 w-8 mx-auto text-primary mb-2" />
          <CardTitle>Staff Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="password"
              inputMode="numeric"
              placeholder="Enter passkey"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              className="text-center text-lg tracking-widest"
              autoFocus
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            <p className="text-[11px] text-center text-muted-foreground">
              Default: Manager 9999 · Waiter 1111 · Kitchen 2222 · Cashier 3333
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}