import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import StaffTopBar from "@/components/staff/StaffTopBar";
import { getStaffSession, hasStaffRole } from "@/lib/staff-auth";
import { Users } from "lucide-react";
import { toast } from "sonner";

export default function StaffTables() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const session = getStaffSession()!;

  const { data: tables } = useQuery({
    queryKey: ["staff-tables"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurant_tables")
        .select("*")
        .order("table_number");
      if (error) throw error;
      return data;
    },
  });

  const { data: openOrders } = useQuery({
    queryKey: ["staff-open-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, table_number, payment_status, order_status, total_price")
        .eq("order_source", "staff")
        .neq("payment_status", "paid")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });

  const orderForTable = (n: number) =>
    openOrders?.find((o) => o.table_number === n);

  const handleTap = async (tableNumber: number) => {
    const existing = orderForTable(tableNumber);
    if (existing) {
      if (existing.payment_status === "pending" && hasStaffRole(["cashier"])) {
        // Show choice
      }
      navigate(`/staff/order/${existing.id}`);
      return;
    }
    if (!hasStaffRole(["waiter"])) {
      toast.error("Only waiters can open new tables");
      return;
    }
    const id = `ORD-${Date.now()}`;
    const { error } = await supabase.from("orders").insert({
      id,
      customer_name: `Table ${tableNumber}`,
      customer_phone: "",
      delivery_type: "dine-in",
      items: [],
      subtotal: 0,
      total_price: 0,
      profit: 0,
      payment_method: "cash",
      payment_status: "pending",
      order_status: "pending",
      order_source: "staff",
      staff_id: session.id,
      table_number: tableNumber,
      seated_at: new Date().toISOString(),
    });
    if (error) {
      toast.error("Could not open table");
      return;
    }
    qc.invalidateQueries({ queryKey: ["staff-open-orders"] });
    navigate(`/staff/order/${id}`);
  };

  return (
    <>
      <StaffTopBar />
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">Tables</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {tables?.map((t) => {
            const ord = orderForTable(t.table_number);
            const occupied = !!ord;
            return (
              <Card
                key={t.id}
                className={`p-4 cursor-pointer hover:border-primary transition-colors ${
                  occupied ? "border-primary bg-primary/5" : ""
                }`}
                onClick={() => handleTap(t.table_number)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold">T{t.table_number}</span>
                  <Badge variant={occupied ? "default" : "secondary"}>
                    {occupied ? "Occupied" : "Free"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" /> {t.capacity}
                </div>
                {ord && (
                  <div className="mt-2 text-sm">
                    <div className="font-medium">₱{Number(ord.total_price).toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {ord.order_status}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
        {(!tables || tables.length === 0) && (
          <p className="text-center text-muted-foreground py-12">
            No tables yet. Add tables in Admin → Settings.
          </p>
        )}

        {hasStaffRole(["cashier"]) && (openOrders?.length ?? 0) > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-3">Awaiting Payment</h2>
            <div className="space-y-2">
              {openOrders!
                .filter((o) => o.order_status === "ready" || o.order_status === "completed")
                .map((o) => (
                  <Card key={o.id} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">Table {o.table_number}</div>
                      <div className="text-sm text-muted-foreground">
                        ₱{Number(o.total_price).toFixed(2)}
                      </div>
                    </div>
                    <Button onClick={() => navigate(`/staff/pay/${o.id}`)}>
                      Take Payment
                    </Button>
                  </Card>
                ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}