import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Trash2, Send, CreditCard } from "lucide-react";
import StaffTopBar from "@/components/staff/StaffTopBar";
import { hasStaffRole } from "@/lib/staff-auth";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  cost: number;
  quantity: number;
  unit: string;
}

export default function StaffOrder() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>("pending");

  const { data: order } = useQuery({
    queryKey: ["staff-order", orderId],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").eq("id", orderId!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ["staff-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, cost_of_goods, unit, category, is_available")
        .eq("is_available", true)
        .order("category")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (order) {
      setItems((order.items as any) || []);
      setTableNumber(order.table_number);
      setOrderStatus(order.order_status);
    }
  }, [order]);

  const filtered = useMemo(
    () =>
      products?.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      ) || [],
    [products, search]
  );

  const addItem = (p: any) => {
    setItems((prev) => {
      const ex = prev.find((i) => i.id === p.id);
      if (ex) return prev.map((i) => (i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i));
      return [
        ...prev,
        {
          id: p.id,
          name: p.name,
          price: Number(p.price),
          cost: Number(p.cost_of_goods),
          quantity: 1,
          unit: p.unit,
        },
      ];
    });
  };

  const updateQty = (id: string, q: number) => {
    if (q <= 0) setItems((prev) => prev.filter((i) => i.id !== id));
    else setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: q } : i)));
  };

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const profit = items.reduce((s, i) => s + (i.price - i.cost) * i.quantity, 0);

  const saveOrder = async (newStatus?: string) => {
    const { error } = await supabase
      .from("orders")
      .update({
        items: items as any,
        subtotal,
        total_price: subtotal,
        profit,
        order_status: newStatus || orderStatus,
        ordered_at: newStatus === "ordered" ? new Date().toISOString() : order?.ordered_at,
      })
      .eq("id", orderId!);
    if (error) {
      console.error("Save order failed:", error);
      toast.error(error.message || "Failed to save");
      return false;
    }
    qc.invalidateQueries({ queryKey: ["staff-order", orderId] });
    qc.invalidateQueries({ queryKey: ["staff-open-orders"] });
    return true;
  };

  const sendToKitchen = async () => {
    if (items.length === 0) return toast.error("Add items first");
    const ok = await saveOrder("ordered");
    if (ok) {
      toast.success("Sent to kitchen");
      navigate("/staff/tables");
    }
  };

  const goToPayment = async () => {
    await saveOrder();
    navigate(`/staff/pay/${orderId}`);
  };

  if (!order) {
    return (
      <>
        <StaffTopBar />
        <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">
          Loading order...
        </div>
      </>
    );
  }

  return (
    <>
      <StaffTopBar />
      <div className="container mx-auto px-4 py-4 grid lg:grid-cols-[1fr_380px] gap-4">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold">
              Table {tableNumber} <Badge variant="outline" className="ml-2 capitalize">{orderStatus}</Badge>
            </h1>
            <Button variant="outline" onClick={() => navigate("/staff/tables")}>Back</Button>
          </div>
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-3"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[70vh] overflow-y-auto pr-1">
            {filtered.map((p) => (
              <Card
                key={p.id}
                className="p-3 cursor-pointer hover:border-primary"
                onClick={() => addItem(p)}
              >
                <div className="text-sm font-medium line-clamp-2">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.category}</div>
                <div className="mt-1 font-bold text-primary">₱{Number(p.price).toFixed(2)}</div>
              </Card>
            ))}
          </div>
        </div>

        <Card className="p-4 h-fit lg:sticky lg:top-20">
          <h2 className="font-bold mb-2">Order</h2>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No items yet</p>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {items.map((i) => (
                <div key={i.id} className="flex items-center gap-2 text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{i.name}</div>
                    <div className="text-xs text-muted-foreground">₱{i.price.toFixed(2)} / {i.unit}</div>
                  </div>
                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(i.id, i.quantity - 1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center">{i.quantity}</span>
                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(i.id, i.quantity + 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => updateQty(i.id, 0)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="border-t border-border mt-3 pt-3 flex justify-between font-bold">
            <span>Total</span>
            <span>₱{subtotal.toFixed(2)}</span>
          </div>
          <div className="mt-3 space-y-2">
            <Button className="w-full gap-2" onClick={sendToKitchen} disabled={items.length === 0}>
              <Send className="h-4 w-4" /> Send to Kitchen
            </Button>
            {hasStaffRole(["cashier"]) && (
              <Button variant="outline" className="w-full gap-2" onClick={goToPayment} disabled={items.length === 0}>
                <CreditCard className="h-4 w-4" /> Take Payment
              </Button>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}