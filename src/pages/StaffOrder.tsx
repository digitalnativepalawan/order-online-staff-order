import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import StaffTopBar from "@/components/staff/StaffTopBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Send, X, CreditCard, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getStaffSession } from "@/lib/staff-auth";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost_of_goods: number;
  unit: string;
  is_available: boolean;
  image_url: string | null;
}

interface CartLine {
  product_id: string;
  name: string;
  price: number;
  cost: number;
  quantity: number;
  unit: string;
}

interface Order {
  id: string;
  table_number: number | null;
  order_status: string;
  items: any;
  notes?: string | null;
  staff_id: string | null;
}

export default function StaffOrder() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [notes, setNotes] = useState("");
  const [activeCat, setActiveCat] = useState<string>("All");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: prods }, { data: ord }] = await Promise.all([
        supabase.from("products").select("*").eq("is_available", true).order("category").order("name"),
        supabase.from("orders").select("*").eq("id", orderId!).maybeSingle(),
      ]);
      setProducts((prods ?? []) as Product[]);
      if (ord) {
        setOrder(ord as unknown as Order);
        const items = Array.isArray(ord.items) ? (ord.items as any[]) : [];
        setCart(
          items.map((i) => ({
            product_id: i.product_id ?? i.id,
            name: i.name,
            price: Number(i.price),
            cost: Number(i.cost ?? 0),
            quantity: Number(i.quantity ?? 1),
            unit: i.unit ?? "pcs",
          })),
        );
      }
    })();
  }, [orderId]);

  const categories = useMemo(() => {
    const set = new Set<string>(products.map((p) => p.category));
    return ["All", ...Array.from(set).sort()];
  }, [products]);

  const filtered = useMemo(
    () => (activeCat === "All" ? products : products.filter((p) => p.category === activeCat)),
    [products, activeCat],
  );

  const addToCart = (p: Product) => {
    setCart((prev) => {
      const i = prev.findIndex((c) => c.product_id === p.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], quantity: next[i].quantity + 1 };
        return next;
      }
      return [
        ...prev,
        { product_id: p.id, name: p.name, price: Number(p.price), cost: Number(p.cost_of_goods), quantity: 1, unit: p.unit },
      ];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.product_id === id ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0),
    );
  };

  const removeLine = (id: string) => setCart((prev) => prev.filter((c) => c.product_id !== id));

  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const profit = cart.reduce((s, c) => s + (c.price - c.cost) * c.quantity, 0);

  const persist = async (extra: Record<string, any> = {}) => {
    if (!order) return;
    const session = getStaffSession();
    const items = cart.map((c) => ({
      product_id: c.product_id,
      name: c.name,
      price: c.price,
      cost: c.cost,
      quantity: c.quantity,
      unit: c.unit,
    }));
    const { error } = await supabase
      .from("orders")
      .update({
        items,
        subtotal,
        total_price: subtotal,
        profit,
        staff_id: session?.staff_id ?? order.staff_id ?? null,
        ...extra,
      })
      .eq("id", order.id);
    if (error) throw error;
  };

  const handleSendToKitchen = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setSaving(true);
    try {
      await persist({
        order_status: "ordered",
        ordered_at: new Date().toISOString(),
      });
      toast.success("Sent to kitchen");
      navigate("/staff/tables");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to send");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Cancel this order and release the table?")) return;
    setSaving(true);
    const { error } = await supabase
      .from("orders")
      .update({ order_status: "cancelled", closed_at: new Date().toISOString() })
      .eq("id", order!.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Order cancelled");
    navigate("/staff/tables");
  };

  const handleGoToPay = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setSaving(true);
    try {
      await persist({
        order_status: "ready_to_pay",
        ready_to_pay_at: new Date().toISOString(),
      });
      navigate(`/staff/pay/${order!.id}`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setSaving(false);
    }
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <StaffTopBar />
        <div className="p-6 text-muted-foreground">Loading order…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StaffTopBar />
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 p-3 lg:p-4">
        {/* Cart — top on mobile/tablet, right on desktop */}
        <aside className="order-1 lg:order-2 lg:sticky lg:top-[4.5rem] self-start w-full lg:w-[380px] flex flex-col gap-2 bg-card border border-border rounded-lg p-3 lg:max-h-[calc(100vh-6rem)]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold leading-tight">Table {order.table_number}</h1>
              <Badge variant="outline" className="mt-0.5 text-[10px]">{order.order_status}</Badge>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase text-muted-foreground">Total</div>
              <div className="text-xl font-extrabold">₱{subtotal.toFixed(2)}</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 min-h-[80px] max-h-[40vh] lg:max-h-none border-t border-border pt-2">
            {cart.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-4">
                Tap products to add them.
              </div>
            )}
            {cart.map((c) => (
              <div key={c.product_id} className="flex items-center gap-1.5 text-sm">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate text-sm">{c.name}</div>
                  <div className="text-[11px] text-muted-foreground">₱{c.price.toFixed(2)}</div>
                </div>
                <Button size="icon" variant="outline" className="h-7 w-7 shrink-0" onClick={() => updateQty(c.product_id, -1)}>
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-6 text-center font-semibold text-sm">{c.quantity}</span>
                <Button size="icon" variant="outline" className="h-7 w-7 shrink-0" onClick={() => updateQty(c.product_id, 1)}>
                  <Plus className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-destructive" onClick={() => removeLine(c.product_id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          <Textarea
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={1}
            className="text-sm resize-none"
          />

          <div className="grid grid-cols-3 gap-1.5">
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
              <X className="h-4 w-4" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSendToKitchen} disabled={saving || cart.length === 0}>
              <Send className="h-4 w-4" /> Send
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleGoToPay}
              disabled={saving || cart.length === 0}
            >
              <CreditCard className="h-4 w-4" /> Pay
            </Button>
          </div>
        </aside>

        {/* Product grid */}
        <section className="order-2 lg:order-1 flex flex-col min-w-0">
          {/* Categories — wrapped grid, uniform pill size, no horizontal scroll */}
          <div className="mb-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
            {categories.map((c) => {
              const active = c === activeCat;
              return (
                <button
                  key={c}
                  onClick={() => setActiveCat(c)}
                  className={
                    "h-9 px-2 rounded-md text-[11px] font-semibold uppercase tracking-tight border transition-colors flex items-center justify-center text-center leading-tight " +
                    (active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:bg-accent")
                  }
                >
                  <span className="line-clamp-2">{c}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pb-4">
            {filtered.map((p) => (
              <Card
                key={p.id}
                onClick={() => addToCart(p)}
                className="cursor-pointer p-3 hover:bg-accent active:scale-[0.97] transition-all"
              >
                <div className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">{p.name}</div>
                <div className="text-xs text-muted-foreground mt-1">₱{Number(p.price).toFixed(2)}</div>
              </Card>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-sm text-muted-foreground py-8 text-center">
                No products in this category.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
