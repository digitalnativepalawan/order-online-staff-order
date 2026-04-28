import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StaffTopBar from "@/components/staff/StaffTopBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChefHat } from "lucide-react";
import { toast } from "sonner";

interface KitchenOrder {
  id: string;
  table_number: number | null;
  items: any;
  ordered_at: string | null;
  order_status: string;
}

function elapsedMinutes(iso: string | null) {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

export default function StaffKitchen() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [, setTick] = useState(0);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("id, table_number, items, ordered_at, order_status")
      .eq("order_source", "pos")
      .eq("order_status", "ordered")
      .order("ordered_at", { ascending: true });
    setOrders((data ?? []) as KitchenOrder[]);
  };

  useEffect(() => {
    fetchOrders();
    const ch = supabase
      .channel("kitchen-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchOrders())
      .subscribe();
    const t = setInterval(() => setTick((x) => x + 1), 30000);
    return () => {
      supabase.removeChannel(ch);
      clearInterval(t);
    };
  }, []);

  const markServed = async (id: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ order_status: "served", served_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Marked as served");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StaffTopBar />
      <main className="flex-1 px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <ChefHat className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Kitchen ({orders.length})</h1>
          </div>

          {orders.length === 0 ? (
            <div className="text-muted-foreground text-center py-16">No active tickets.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {orders.map((o) => {
                const mins = elapsedMinutes(o.ordered_at);
                const urgent = mins >= 15;
                const items = Array.isArray(o.items) ? (o.items as any[]) : [];
                return (
                  <Card
                    key={o.id}
                    className={`p-4 border-2 ${urgent ? "border-destructive" : "border-border"}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xl font-bold">Table {o.table_number}</div>
                      <Badge variant={urgent ? "destructive" : "secondary"}>
                        {mins}m
                      </Badge>
                    </div>
                    <ul className="space-y-1 text-sm mb-4">
                      {items.map((i, idx) => (
                        <li key={idx} className="flex justify-between">
                          <span className="truncate pr-2">{i.name}</span>
                          <span className="font-semibold shrink-0">×{i.quantity}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full" onClick={() => markServed(o.id)}>
                      <Check className="h-4 w-4" /> Mark Served
                    </Button>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
