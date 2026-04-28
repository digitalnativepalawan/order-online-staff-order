import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useBusinessSettings } from "@/hooks/use-settings";
import { toast } from "sonner";
import { Trash2, Plus, Minus, ChefHat, Calendar, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

type TraySize = "small" | "medium" | "large";

interface CartItem {
  product_id: string;
  name: string;
  size: TraySize;
  pax: number;
  price: number;
  quantity: number;
}

const EVENT_TYPES = ["Birthday", "Wedding", "Corporate", "Anniversary", "Family Gathering", "Other"];

export default function Catering() {
  const navigate = useNavigate();
  const { data: business } = useBusinessSettings();
  const currency = business?.currency_symbol || "₱";

  const [cart, setCart] = useState<CartItem[]>([]);
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    event_date: "",
    event_time: "",
    event_type: "",
    headcount: 10,
    delivery_type: "pickup",
    delivery_address: "",
    customer_notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const { data: products } = useQuery({
    queryKey: ["catering-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("has_tray_pricing", true)
        .eq("is_available", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const deposit = useMemo(() => Math.round(subtotal * 0.5 * 100) / 100, [subtotal]);
  const balance = subtotal - deposit;

  const addToCart = (p: any, size: TraySize) => {
    const price = p[`tray_${size}_price`];
    const pax = p[`tray_${size}_pax`];
    if (!price) return;
    setCart(prev => {
      const existing = prev.find(i => i.product_id === p.id && i.size === size);
      if (existing) {
        return prev.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product_id: p.id, name: p.name, size, pax: pax || 0, price: Number(price), quantity: 1 }];
    });
    toast.success(`Added ${p.name} (${size})`);
  };

  const updateQty = (idx: number, delta: number) => {
    setCart(prev => prev.map((i, k) => k === idx ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };

  const removeItem = (idx: number) => setCart(prev => prev.filter((_, k) => k !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return toast.error("Please add at least one tray");
    if (!form.customer_name || !form.customer_phone || !form.event_date || !form.headcount) {
      return toast.error("Please fill in all required fields");
    }
    if (form.delivery_type === "delivery" && !form.delivery_address) {
      return toast.error("Delivery address is required");
    }

    setSubmitting(true);
    try {
      const orderNumber = `CAT-${Date.now().toString().slice(-8)}`;
      const payload: any = {
        order_number: orderNumber,
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        customer_email: form.customer_email || null,
        event_date: form.event_date,
        event_time: form.event_time || null,
        event_type: form.event_type || null,
        headcount: Number(form.headcount),
        delivery_type: form.delivery_type,
        delivery_address: form.delivery_type === "delivery" ? form.delivery_address : null,
        items: cart,
        subtotal,
        total_amount: subtotal,
        deposit_amount: deposit,
        balance,
        customer_notes: form.customer_notes || null,
        status: "inquiry",
      };
      const { error } = await supabase.from("catering_orders").insert(payload);
      if (error) throw error;
      toast.success("Catering inquiry submitted! We'll contact you shortly.");
      setCart([]);
      setForm({ ...form, customer_notes: "" });
      setTimeout(() => navigate("/"), 1500);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit inquiry");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-6 text-center">
        <ChefHat className="h-10 w-10 mx-auto text-primary mb-2" />
        <h1 className="text-3xl font-bold">Catering Inquiry</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Plan your event with our trays — we'll contact you with a quote.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Catalog + Form */}
        <div className="space-y-6 order-2 lg:order-1">
          {/* Trays */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Available Trays</CardTitle>
            </CardHeader>
            <CardContent>
              {!products?.length ? (
                <p className="text-sm text-muted-foreground">No catering trays available right now.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {products.map(p => (
                    <div key={p.id} className="border border-border rounded-lg p-3 space-y-2">
                      <div className="flex gap-3">
                        {p.image_url && (
                          <img src={p.image_url} alt={p.name} className="h-16 w-16 rounded object-cover shrink-0" />
                        )}
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm truncate">{p.name}</h4>
                          {p.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(["small", "medium", "large"] as TraySize[]).map(size => {
                          const price = p[`tray_${size}_price`];
                          const pax = p[`tray_${size}_pax`];
                          if (!price) return <div key={size} />;
                          return (
                            <button
                              key={size}
                              type="button"
                              onClick={() => addToCart(p, size)}
                              className="flex flex-col items-center justify-center p-2 rounded border border-border bg-card hover:bg-accent active:scale-95 transition"
                            >
                              <span className="text-[10px] uppercase font-bold text-muted-foreground">{size}</span>
                              <span className="text-sm font-bold">{currency}{Number(price).toLocaleString()}</span>
                              {pax > 0 && <span className="text-[10px] text-muted-foreground">{pax} pax</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form id="catering-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Full Name *</Label>
                    <Input value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} required maxLength={100} />
                  </div>
                  <div>
                    <Label>Phone *</Label>
                    <Input type="tel" value={form.customer_phone} onChange={e => setForm({ ...form, customer_phone: e.target.value })} required maxLength={20} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Email</Label>
                    <Input type="email" value={form.customer_email} onChange={e => setForm({ ...form, customer_email: e.target.value })} maxLength={255} />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1"><Calendar className="h-3 w-3" />Event Date *</Label>
                    <Input type="date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} required min={new Date().toISOString().split("T")[0]} />
                  </div>
                  <div>
                    <Label>Event Time</Label>
                    <Input type="time" value={form.event_time} onChange={e => setForm({ ...form, event_time: e.target.value })} />
                  </div>
                  <div>
                    <Label>Event Type</Label>
                    <Select value={form.event_type} onValueChange={v => setForm({ ...form, event_type: v })}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        {EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="flex items-center gap-1"><Users className="h-3 w-3" />Headcount *</Label>
                    <Input type="number" min="1" value={form.headcount} onChange={e => setForm({ ...form, headcount: Number(e.target.value) })} required />
                  </div>
                </div>

                <div>
                  <Label>Fulfillment *</Label>
                  <RadioGroup value={form.delivery_type} onValueChange={v => setForm({ ...form, delivery_type: v })} className="grid grid-cols-2 gap-2 mt-1">
                    <label className="flex items-center gap-2 border border-border rounded-md p-3 cursor-pointer hover:bg-accent has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                      <RadioGroupItem value="pickup" />
                      <span className="text-sm">Pickup at Restaurant</span>
                    </label>
                    <label className="flex items-center gap-2 border border-border rounded-md p-3 cursor-pointer hover:bg-accent has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                      <RadioGroupItem value="delivery" />
                      <span className="text-sm">Delivery</span>
                    </label>
                  </RadioGroup>
                </div>

                {form.delivery_type === "delivery" && (
                  <div>
                    <Label>Delivery Address *</Label>
                    <Textarea value={form.delivery_address} onChange={e => setForm({ ...form, delivery_address: e.target.value })} required maxLength={500} rows={2} />
                  </div>
                )}

                <div>
                  <Label>Notes / Special Requests</Label>
                  <Textarea value={form.customer_notes} onChange={e => setForm({ ...form, customer_notes: e.target.value })} maxLength={1000} rows={3} placeholder="Allergies, presentation preferences, etc." />
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Cart Sidebar - top on mobile */}
        <aside className="order-1 lg:order-2">
          <Card className="lg:sticky lg:top-20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Your Cart</span>
                <Badge variant="secondary">{cart.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cart.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No trays selected yet.</p>
              ) : (
                <div className="space-y-2 max-h-[40vh] lg:max-h-[50vh] overflow-y-auto">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 border-b border-border pb-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{item.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {item.size} {item.pax > 0 && `· ${item.pax} pax`}
                        </div>
                        <div className="text-xs font-medium">{currency}{(item.price * item.quantity).toLocaleString()}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(idx, -1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm w-5 text-center">{item.quantity}</span>
                        <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(idx, 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeItem(idx)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-1 text-sm border-t border-border pt-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">{currency}{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deposit (50%)</span>
                  <span>{currency}{deposit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Balance</span>
                  <span>{currency}{balance.toLocaleString()}</span>
                </div>
              </div>

              <Button
                type="submit"
                form="catering-form"
                className="w-full"
                size="lg"
                disabled={submitting || cart.length === 0}
              >
                {submitting ? "Submitting..." : "Submit Inquiry"}
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">
                We'll review and send a confirmation quote.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
