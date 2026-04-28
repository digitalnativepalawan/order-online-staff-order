import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, Bell, BellOff } from "lucide-react";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminProducts from "@/components/admin/AdminProducts";
import AdminOrders from "@/components/admin/AdminOrders";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminPayments from "@/components/admin/AdminPayments";
import AdminSpecials from "@/components/admin/AdminSpecials";
import AdminTestimonials from "@/components/admin/AdminTestimonials";
import AdminNewsletter from "@/components/admin/AdminNewsletter";
import AdminContacts from "@/components/admin/AdminContacts";
import AdminPages from "@/components/admin/AdminPages";
import AdminHeaderFooter from "@/components/admin/AdminHeaderFooter";
import AdminLoyalty from "@/components/admin/AdminLoyalty";
import AdminReports from "@/components/admin/AdminReports";
import AdminCatering from "@/components/admin/AdminCatering";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrderRealtime, useSoundEnabled, useUnviewedOrders } from "@/hooks/use-order-alerts";

function AdminPanel() {
  const [tab, setTab] = useState("dashboard");
  const { enabled: soundEnabled, toggle: toggleSound } = useSoundEnabled();
  useOrderRealtime(soundEnabled);

  const { data: orders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { unviewedCount, markViewed } = useUnviewedOrders(orders);

  const handleTabChange = (v: string) => {
    setTab(v);
    if (v === "orders") markViewed();
  };

  const jumpToOrders = () => {
    setTab("orders");
    markViewed();
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6 gap-2">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSound}
            title={soundEnabled ? "Sound alerts: ON" : "Sound alerts: OFF"}
            className={soundEnabled ? "" : "text-muted-foreground"}
          >
            {soundEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Logout</Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid grid-cols-3 sm:grid-cols-4 md:flex md:flex-wrap gap-1 p-1 h-auto w-full">
          <TabsTrigger value="dashboard" className="text-[12px] md:text-sm min-h-[44px] px-2">Dashboard</TabsTrigger>
          <TabsTrigger value="products" className="text-[12px] md:text-sm min-h-[44px] px-2">Products</TabsTrigger>
          <TabsTrigger value="orders" className="text-[12px] md:text-sm min-h-[44px] px-2 relative">
            Orders
            {unviewedCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[hsl(24,95%,53%)] text-white text-[10px] font-bold animate-alert-pulse">
                {unviewedCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-[12px] md:text-sm min-h-[44px] px-2">Reports</TabsTrigger>
          <TabsTrigger value="catering" className="text-[12px] md:text-sm min-h-[44px] px-2">Catering</TabsTrigger>
          <TabsTrigger value="specials" className="text-[12px] md:text-sm min-h-[44px] px-2">Specials</TabsTrigger>
          <TabsTrigger value="payments" className="text-[12px] md:text-sm min-h-[44px] px-2">Payments</TabsTrigger>
          <TabsTrigger value="pages" className="text-[12px] md:text-sm min-h-[44px] px-2">Pages</TabsTrigger>
          <TabsTrigger value="testimonials" className="text-[12px] md:text-sm min-h-[44px] px-2">Reviews</TabsTrigger>
          <TabsTrigger value="newsletter" className="text-[12px] md:text-sm min-h-[44px] px-2">News</TabsTrigger>
          <TabsTrigger value="contacts" className="text-[12px] md:text-sm min-h-[44px] px-2">Contacts</TabsTrigger>
          <TabsTrigger value="loyalty" className="text-[12px] md:text-sm min-h-[44px] px-2">Loyalty</TabsTrigger>
          <TabsTrigger value="header-footer" className="text-[12px] md:text-sm min-h-[44px] px-2">Header</TabsTrigger>
          <TabsTrigger value="settings" className="text-[12px] md:text-sm min-h-[44px] px-2">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard"><AdminDashboard onJumpToPendingOrders={jumpToOrders} /></TabsContent>
        <TabsContent value="products"><AdminProducts /></TabsContent>
        <TabsContent value="orders"><AdminOrders initialStatusFilter="pending" /></TabsContent>
        <TabsContent value="reports"><AdminReports /></TabsContent>
        <TabsContent value="catering"><AdminCatering /></TabsContent>
        <TabsContent value="specials"><AdminSpecials /></TabsContent>
        <TabsContent value="payments"><AdminPayments /></TabsContent>
        <TabsContent value="pages"><AdminPages /></TabsContent>
        <TabsContent value="testimonials"><AdminTestimonials /></TabsContent>
        <TabsContent value="newsletter"><AdminNewsletter /></TabsContent>
        <TabsContent value="contacts"><AdminContacts /></TabsContent>
        <TabsContent value="header-footer"><AdminHeaderFooter /></TabsContent>
        <TabsContent value="loyalty"><AdminLoyalty /></TabsContent>
        <TabsContent value="settings"><AdminSettings /></TabsContent>
      </Tabs>
    </div>
  );
}

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [passkey, setPasskey] = useState("");

  const { data: settings } = useQuery({
    queryKey: ["admin-passkey"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_settings")
        .select("admin_passkey")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const expected = settings?.admin_passkey || "5309";
    if (passkey === expected) setAuthenticated(true);
    else setPasskey("");
  };

  if (!authenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <Lock className="h-8 w-8 mx-auto text-primary mb-2" />
            <CardTitle>Admin Access</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input type="password" placeholder="Enter passkey" value={passkey} onChange={e => setPasskey(e.target.value)} className="text-center text-lg tracking-widest" />
              <Button type="submit" className="w-full">Unlock</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AdminPanel />;
}
