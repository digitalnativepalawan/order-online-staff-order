import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import StaffTopBar from "@/components/staff/StaffTopBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Banknote, QrCode, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: string;
  table_number: number | null;
  total_price: number;
  items: any;
  order_status: string;
}

export default function StaffPayment() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [gcashQr, setGcashQr] = useState<string | null>(null);
  const [tendered, setTendered] = useState("");
  const [processing, setProcessing] = useState(false);
  const [method, setMethod] = useState<"cash" | "gcash">("cash");

  useEffect(() => {
    (async () => {
      const [{ data: o }, { data: ps }] = await Promise.all([
        supabase.from("orders").select("id, table_number, total_price, items, order_status").eq("id", orderId!).maybeSingle(),
        supabase.from("payment_settings").select("gcash_qr_url").eq("id", 1).maybeSingle(),
      ]);
      if (o) setOrder(o as unknown as Order);
      setGcashQr(ps?.gcash_qr_url ?? null);
    })();
  }, [orderId]);

  const total = Number(order?.total_price ?? 0);
  const change = useMemo(() => {
    const t = parseFloat(tendered);
    if (isNaN(t)) return 0;
    return Math.max(0, t - total);
  }, [tendered, total]);

  const finalize = async (via: "cash" | "gcash") => {
    if (!order) return;
    if (via === "cash") {
      const t = parseFloat(tendered);
      if (isNaN(t) || t < total) {
        toast.error("Tendered amount is less than total");
        return;
      }
    }
    setProcessing(true);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("orders")
      .update({
        payment_method: via,
        payment_status: "paid",
        order_status: "closed",
        paid_via: via,
        paid_at: now,
        closed_at: now,
        completed_at: now,
      })
      .eq("id", order.id);
    setProcessing(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Paid · Table ${order.table_number} released`);
    navigate("/staff/tables");
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <StaffTopBar />
        <div className="p-6 text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StaffTopBar />
      <main className="flex-1 px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/staff/order/${order.id}`)}>
            <ArrowLeft className="h-4 w-4" /> Back to order
          </Button>

          <Card className="p-5">
            <div className="flex justify-between items-baseline mb-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Table {order.table_number}</div>
                <div className="text-sm text-muted-foreground">{order.id}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">TOTAL</div>
                <div className="text-3xl font-bold">₱{total.toFixed(2)}</div>
              </div>
            </div>

            <Tabs value={method} onValueChange={(v) => setMethod(v as "cash" | "gcash")}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="cash"><Banknote className="h-4 w-4" /> Cash</TabsTrigger>
                <TabsTrigger value="gcash"><QrCode className="h-4 w-4" /> GCash</TabsTrigger>
              </TabsList>

              <TabsContent value="cash" className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="tendered">Amount Tendered</Label>
                  <Input
                    id="tendered"
                    type="number"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={tendered}
                    onChange={(e) => setTendered(e.target.value)}
                    className="text-2xl h-14 mt-1"
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[total, 100, 500, 1000].map((v, i) => (
                    <Button
                      key={i}
                      type="button"
                      variant="outline"
                      onClick={() => setTendered(String(v))}
                    >
                      ₱{Number(v).toFixed(0)}
                    </Button>
                  ))}
                </div>
                <div className="bg-muted rounded-lg p-4 flex justify-between items-baseline">
                  <span className="text-sm font-medium">Change</span>
                  <span className="text-2xl font-bold">₱{change.toFixed(2)}</span>
                </div>
                <Button
                  className="w-full h-12"
                  onClick={() => finalize("cash")}
                  disabled={processing || parseFloat(tendered) < total}
                >
                  <Check className="h-4 w-4" /> Confirm Cash Payment
                </Button>
              </TabsContent>

              <TabsContent value="gcash" className="space-y-4 pt-4">
                <div className="flex flex-col items-center bg-muted rounded-lg p-4">
                  {gcashQr ? (
                    <img src={gcashQr} alt="GCash QR" className="max-w-[260px] w-full rounded" />
                  ) : (
                    <div className="text-sm text-muted-foreground py-12 text-center">
                      No GCash QR configured.<br />Add one in Admin › Payments.
                    </div>
                  )}
                  <div className="mt-3 text-sm text-muted-foreground">
                    Customer scans and pays ₱{total.toFixed(2)}
                  </div>
                </div>
                <Button
                  className="w-full h-12"
                  onClick={() => finalize("gcash")}
                  disabled={processing}
                >
                  <Check className="h-4 w-4" /> Mark as Paid
                </Button>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </main>
    </div>
  );
}
