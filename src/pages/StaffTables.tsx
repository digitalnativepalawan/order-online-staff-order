import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StaffTopBar from "@/components/staff/StaffTopBar";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function playServedChime() {
  try {
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
    const ctx = new Ctx();
    [0, 0.18, 0.36].forEach((delay) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 1200;
      const start = ctx.currentTime + delay;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(0.4, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.15);
      o.start(start); o.stop(start + 0.16);
    });
  } catch {}
  if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
}

interface Table {
  id: number;
  table_number: number;
  capacity: number | null;
}

interface POSOrder {
  id: string;
  table_number: number | null;
  order_status: string;
  total_price: number;
}

const ACTIVE_STATUSES = ["seated", "ordering", "ordered", "served", "ready_to_pay"];

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  available: { label: "Available", cls: "bg-muted text-muted-foreground border-border" },
  seated: { label: "Seated", cls: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/40" },
  ordering: { label: "Ordering", cls: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/40" },
  ordered: { label: "Ordered", cls: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/40" },
  served: { label: "Served", cls: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/40" },
  ready_to_pay: { label: "Ready to Pay", cls: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/40" },
};

export default function StaffTables() {
  const navigate = useNavigate();
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<POSOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [servedAlerts, setServedAlerts] = useState<Set<number>>(new Set());
  const prevStatusRef = useRef<Map<string, string>>(new Map());

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("id, table_number, order_status, total_price")
      .eq("order_source", "pos")
      .in("order_status", ACTIVE_STATUSES);
    const next = (data ?? []) as POSOrder[];

    // Detect transitions to 'served'
    const prev = prevStatusRef.current;
    const newlyServed: number[] = [];
    next.forEach((o) => {
      const before = prev.get(o.id);
      if (before && before !== "served" && o.order_status === "served" && o.table_number != null) {
        newlyServed.push(o.table_number);
      }
    });
    if (newlyServed.length > 0 && prev.size > 0) {
      playServedChime();
      newlyServed.forEach((tn) => toast.success(`🔔 Table ${tn} order is ready to serve!`, { duration: 8000 }));
      setServedAlerts((s) => {
        const ns = new Set(s);
        newlyServed.forEach((tn) => ns.add(tn));
        return ns;
      });
    }
    const map = new Map<string, string>();
    next.forEach((o) => map.set(o.id, o.order_status));
    prevStatusRef.current = map;

    setOrders(next);
  };

  const dismissAlert = (tn: number) => {
    setServedAlerts((s) => {
      const ns = new Set(s);
      ns.delete(tn);
      return ns;
    });
  };

  useEffect(() => {
    (async () => {
      const [{ data: t }] = await Promise.all([
        supabase.from("restaurant_tables").select("id, table_number, capacity").order("table_number"),
        fetchOrders(),
      ]);
      setTables((t ?? []) as Table[]);
      setLoading(false);
    })();

    const channel = supabase
      .channel("pos-orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => fetchOrders(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleTableClick = async (table: Table) => {
    const existing = orders.find((o) => o.table_number === table.table_number);
    if (existing) {
      navigate(`/staff/order/${existing.id}`);
      return;
    }
    // Create new POS order in 'seated' state
    const id = `POS-${Date.now()}`;
    const { error } = await supabase.from("orders").insert({
      id,
      customer_name: `Table ${table.table_number}`,
      customer_phone: "",
      delivery_type: "dine_in",
      items: [],
      subtotal: 0,
      total_price: 0,
      profit: 0,
      payment_method: "cash",
      payment_status: "pending",
      order_status: "seated",
      order_source: "pos",
      table_number: table.table_number,
      seated_at: new Date().toISOString(),
    });
    if (error) {
      console.error(error);
      return;
    }
    navigate(`/staff/order/${id}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StaffTopBar />
      <main className="flex-1 px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Tables</h1>
          {loading ? (
            <div className="text-muted-foreground">Loading…</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {tables.map((t) => {
                const order = orders.find((o) => o.table_number === t.table_number);
                const status = order?.order_status ?? "available";
                const s = STATUS_STYLES[status] ?? STATUS_STYLES.available;
                const flashing = servedAlerts.has(t.table_number);
                return (
                  <Card
                    key={t.id}
                    onClick={() => {
                      if (flashing) dismissAlert(t.table_number);
                      handleTableClick(t);
                    }}
                    className={cn(
                      "cursor-pointer border-2 p-4 transition-all hover:scale-[1.02] active:scale-[0.98]",
                      s.cls,
                      flashing && "animate-pulse ring-4 ring-green-500 ring-offset-2 ring-offset-background",
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-2xl font-bold flex items-center gap-1">
                        T{t.table_number}
                        {flashing && <Bell className="h-4 w-4 text-green-600 animate-bounce" />}
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        <Users className="h-3 w-3 mr-1" />
                        {t.capacity ?? 4}
                      </Badge>
                    </div>
                    <div className="text-xs font-medium uppercase tracking-wide">{s.label}</div>
                    {order && (
                      <div className="text-xs mt-1 opacity-80">₱{Number(order.total_price).toFixed(2)}</div>
                    )}
                    {flashing && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full mt-2 h-7 text-xs"
                        onClick={(e) => { e.stopPropagation(); dismissAlert(t.table_number); }}
                      >
                        Acknowledge
                      </Button>
                    )}
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
