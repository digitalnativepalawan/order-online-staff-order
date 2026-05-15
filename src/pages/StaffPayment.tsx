import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StaffTopBar from "@/components/staff/StaffTopBar";
import { useState } from "react";
import { Banknote, CreditCard, QrCode, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const METHODS = [
  { id: "cash", label: "Cash", icon: Banknote },
  { id: "card", label: "Card", icon: CreditCard },
  { id: "qr", label: "QR / GCash", icon: QrCode },
];

export default function StaffPayment() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [method, setMethod] = useState("cash");
  const [processing, setProcessing] = useState(false);

  const { data: order } = useQuery({
    queryKey: ["staff-pay-order", orderId],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").eq("id", orderId!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const finalize = async () => {
    setProcessing(true);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("orders")
      .update({
        payment_method: method,
        payment_status: "paid",
        paid_at: now,
        paid_via: method,
        order_status: "completed",
        completed_at: now,
        closed_at: now,
      })
      .eq("id", orderId!);
    setProcessing(false);
    if (error) return toast.error("Failed to record payment");
    toast.success("Payment recorded");
    qc.invalidateQueries({ queryKey: ["staff-open-orders"] });
    navigate("/staff/tables");
  };

  if (!order) {
    return (
      <>
        <StaffTopBar />
        <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">
          Loading...
        </div>
      </>
    );
  }

  const items = (order.items as any[]) || [];

  return (
    <>
      <StaffTopBar />
      <div className="container mx-auto px-4 py-6 max-w-lg">
        <Button variant="outline" onClick={() => navigate("/staff/tables")} className="mb-4">
          ← Back
        </Button>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold">
              {order.table_number ? `Table ${order.table_number}` : order.customer_name}
            </h1>
            <Badge variant="outline" className="capitalize">{order.payment_status}</Badge>
          </div>

          <div className="space-y-1 text-sm border-y border-border py-3 mb-3">
            {items.map((i, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{i.name} ×{i.quantity}</span>
                <span>₱{(i.price * i.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-bold text-lg mb-4">
            <span>Total</span>
            <span>₱{Number(order.total_price).toFixed(2)}</span>
          </div>

          {order.payment_status === "paid" ? (
            <div className="text-center py-4 text-green-600 font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5" /> Already paid via {order.paid_via}
            </div>
          ) : (
            <>
              <p className="text-sm font-medium mb-2">Payment Method</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {METHODS.map((m) => {
                  const Icon = m.icon;
                  const active = method === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={`p-3 rounded-md border flex flex-col items-center gap-1 transition-colors ${
                        active ? "border-primary bg-primary/10" : "border-border"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs">{m.label}</span>
                    </button>
                  );
                })}
              </div>
              <Button className="w-full" size="lg" onClick={finalize} disabled={processing}>
                {processing ? "Processing..." : `Charge ₱${Number(order.total_price).toFixed(2)}`}
              </Button>
            </>
          )}
        </Card>
      </div>
    </>
  );
}