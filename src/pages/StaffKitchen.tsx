import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StaffTopBar from "@/components/staff/StaffTopBar";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function StaffKitchen() {
  const qc = useQueryClient();

  const { data: orders } = useQuery({
    queryKey: ["staff-kitchen-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .in("order_status", ["ordered", "preparing"])
        .neq("payment_status", "paid")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    refetchInterval: 4000,
  });

  const markReady = async (id: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ order_status: "ready", ready_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return toast.error("Failed");
    toast.success("Marked ready");
    qc.invalidateQueries({ queryKey: ["staff-kitchen-queue"] });
  };

  return (
    <>
      <StaffTopBar />
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">Kitchen Queue</h1>
        {(!orders || orders.length === 0) && (
          <p className="text-center text-muted-foreground py-12">No orders to prepare</p>
        )}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {orders?.map((o) => {
            const items = (o.items as any[]) || [];
            const elapsed = Math.floor((Date.now() - new Date(o.created_at).getTime()) / 60000);
            return (
              <Card key={o.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-bold">
                      {o.table_number ? `Table ${o.table_number}` : o.customer_name}
                    </div>
                    <div className="text-xs text-muted-foreground">{elapsed}m ago</div>
                  </div>
                  <Badge variant={o.order_status === "ordered" ? "default" : "secondary"} className="capitalize">
                    {o.order_status}
                  </Badge>
                </div>
                <ul className="space-y-1 text-sm border-t border-border pt-2">
                  {items.map((i, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span>{i.name}</span>
                      <span className="font-bold">×{i.quantity}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-3 gap-2" onClick={() => markReady(o.id)}>
                  <CheckCircle2 className="h-4 w-4" /> Mark Ready
                </Button>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}