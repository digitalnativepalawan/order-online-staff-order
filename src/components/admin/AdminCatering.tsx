import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBusinessSettings } from "@/hooks/use-settings";
import { toast } from "sonner";
import { Edit, Trash2, MessageCircle, CheckCircle2, Plus, ChefHat } from "lucide-react";

const STATUSES = ["inquiry", "quoted", "confirmed", "deposit_paid", "completed", "cancelled"];

export default function AdminCatering() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ChefHat className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Catering Management</h2>
      </div>
      <Tabs defaultValue="orders">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="trays">Tray Pricing</TabsTrigger>
        </TabsList>
        <TabsContent value="orders"><CateringOrders /></TabsContent>
        <TabsContent value="trays"><TrayPricing /></TabsContent>
      </Tabs>
    </div>
  );
}

/* =========================== ORDERS =========================== */
function CateringOrders() {
  const qc = useQueryClient();
  const { data: business } = useBusinessSettings();
  const currency = business?.currency_symbol || "₱";
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [editing, setEditing] = useState<any | null>(null);

  const { data: orders } = useQuery({
    queryKey: ["catering-orders", statusFilter, dateFrom, dateTo],
    queryFn: async () => {
      let q = supabase.from("catering_orders").select("*").order("event_date", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      if (dateFrom) q = q.gte("event_date", dateFrom);
      if (dateTo) q = q.lte("event_date", dateTo);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("catering-orders-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "catering_orders" }, () => {
        qc.invalidateQueries({ queryKey: ["catering-orders"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const sendQuote = (order: any) => {
    const phone = order.customer_phone.replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Hi ${order.customer_name}! Your catering quote for ${order.event_date} (${order.headcount} pax):\n\n` +
      `Subtotal: ${currency}${Number(order.subtotal).toLocaleString()}\n` +
      `Total: ${currency}${Number(order.total_amount).toLocaleString()}\n` +
      `Deposit (50%): ${currency}${Number(order.deposit_amount).toLocaleString()}\n` +
      `Balance: ${currency}${Number(order.balance).toLocaleString()}\n\n` +
      `Reply to confirm. Thank you!`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
    supabase.from("catering_orders").update({ quote_sent_at: new Date().toISOString(), status: "quoted" }).eq("id", order.id).then(() => {
      qc.invalidateQueries({ queryKey: ["catering-orders"] });
    });
  };

  const markDepositPaid = async (order: any) => {
    const { error } = await supabase.from("catering_orders").update({
      deposit_paid: true,
      deposit_paid_at: new Date().toISOString(),
      status: "deposit_paid",
    }).eq("id", order.id);
    if (error) toast.error(error.message);
    else toast.success("Deposit marked as paid");
  };

  const deleteOrder = async (id: string) => {
    const { error } = await supabase.from("catering_orders").delete().eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Order deleted");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Catering Orders</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="From" />
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} placeholder="To" />
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-2">
          {orders?.map(o => (
            <div key={o.id} className="border border-border rounded-lg p-3 space-y-2">
              <div className="flex justify-between gap-2">
                <div>
                  <div className="font-semibold text-sm">{o.customer_name}</div>
                  <div className="text-xs text-muted-foreground">{o.order_number}</div>
                </div>
                <Badge variant="secondary" className="text-[10px] capitalize">{o.status?.replace("_", " ")}</Badge>
              </div>
              <div className="text-xs space-y-0.5">
                <div>📅 {o.event_date} {o.event_time && `· ${o.event_time}`}</div>
                <div>👥 {o.headcount} pax · {o.delivery_type}</div>
                <div>💰 {currency}{Number(o.total_amount).toLocaleString()} (Bal: {currency}{Number(o.balance).toLocaleString()})</div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" variant="outline" onClick={() => setEditing(o)}><Edit className="h-3 w-3" /></Button>
                <Button size="sm" variant="outline" onClick={() => sendQuote(o)}><MessageCircle className="h-3 w-3 mr-1" />Quote</Button>
                {!o.deposit_paid && (
                  <Button size="sm" variant="outline" onClick={() => markDepositPaid(o)}><CheckCircle2 className="h-3 w-3 mr-1" />Deposit</Button>
                )}
                <DeleteBtn onConfirm={() => deleteOrder(o.id)} />
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Event Date</TableHead>
                <TableHead>Pax</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.map(o => (
                <TableRow key={o.id}>
                  <TableCell>
                    <div className="font-medium">{o.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{o.customer_phone}</div>
                  </TableCell>
                  <TableCell>{o.event_date}</TableCell>
                  <TableCell>{o.headcount}</TableCell>
                  <TableCell>{currency}{Number(o.total_amount).toLocaleString()}</TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize">{o.status?.replace("_", " ")}</Badge></TableCell>
                  <TableCell className="flex gap-1">
                    <Button size="icon" variant="outline" onClick={() => setEditing(o)}><Edit className="h-3 w-3" /></Button>
                    <Button size="icon" variant="outline" onClick={() => sendQuote(o)} title="Send quote via WhatsApp"><MessageCircle className="h-3 w-3" /></Button>
                    {!o.deposit_paid && (
                      <Button size="icon" variant="outline" onClick={() => markDepositPaid(o)} title="Mark deposit paid"><CheckCircle2 className="h-3 w-3" /></Button>
                    )}
                    <DeleteBtn onConfirm={() => deleteOrder(o.id)} />
                  </TableCell>
                </TableRow>
              ))}
              {!orders?.length && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No orders</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {editing && <EditOrderDialog order={editing} onClose={() => setEditing(null)} />}
      </CardContent>
    </Card>
  );
}

function DeleteBtn({ onConfirm }: { onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="icon" variant="outline" className="text-destructive"><Trash2 className="h-3 w-3" /></Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this order?</AlertDialogTitle>
          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function EditOrderDialog({ order, onClose }: { order: any; onClose: () => void }) {
  const [form, setForm] = useState({ ...order });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("catering_orders").update({
      customer_name: form.customer_name,
      customer_phone: form.customer_phone,
      customer_email: form.customer_email,
      event_date: form.event_date,
      event_time: form.event_time,
      event_type: form.event_type,
      headcount: Number(form.headcount),
      delivery_type: form.delivery_type,
      delivery_address: form.delivery_address,
      subtotal: Number(form.subtotal),
      total_amount: Number(form.total_amount),
      deposit_amount: Number(form.deposit_amount),
      balance: Number(form.balance),
      deposit_paid: form.deposit_paid,
      balance_paid: form.balance_paid,
      status: form.status,
      admin_notes: form.admin_notes,
    }).eq("id", order.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Updated"); onClose(); }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Order — {order.order_number}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><Label>Customer</Label><Input value={form.customer_name || ""} onChange={e => setForm({ ...form, customer_name: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={form.customer_phone || ""} onChange={e => setForm({ ...form, customer_phone: e.target.value })} /></div>
          <div><Label>Email</Label><Input value={form.customer_email || ""} onChange={e => setForm({ ...form, customer_email: e.target.value })} /></div>
          <div><Label>Event Date</Label><Input type="date" value={form.event_date || ""} onChange={e => setForm({ ...form, event_date: e.target.value })} /></div>
          <div><Label>Event Time</Label><Input type="time" value={form.event_time || ""} onChange={e => setForm({ ...form, event_time: e.target.value })} /></div>
          <div><Label>Event Type</Label><Input value={form.event_type || ""} onChange={e => setForm({ ...form, event_type: e.target.value })} /></div>
          <div><Label>Headcount</Label><Input type="number" value={form.headcount || 0} onChange={e => setForm({ ...form, headcount: e.target.value })} /></div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Delivery Type</Label>
            <Select value={form.delivery_type || "pickup"} onValueChange={v => setForm({ ...form, delivery_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pickup">Pickup</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2"><Label>Delivery Address</Label><Textarea rows={2} value={form.delivery_address || ""} onChange={e => setForm({ ...form, delivery_address: e.target.value })} /></div>
          <div><Label>Subtotal</Label><Input type="number" value={form.subtotal || 0} onChange={e => setForm({ ...form, subtotal: e.target.value })} /></div>
          <div><Label>Total</Label><Input type="number" value={form.total_amount || 0} onChange={e => setForm({ ...form, total_amount: e.target.value })} /></div>
          <div><Label>Deposit</Label><Input type="number" value={form.deposit_amount || 0} onChange={e => setForm({ ...form, deposit_amount: e.target.value })} /></div>
          <div><Label>Balance</Label><Input type="number" value={form.balance || 0} onChange={e => setForm({ ...form, balance: e.target.value })} /></div>
          <div className="flex items-center gap-2"><Switch checked={form.deposit_paid} onCheckedChange={v => setForm({ ...form, deposit_paid: v })} /><Label>Deposit Paid</Label></div>
          <div className="flex items-center gap-2"><Switch checked={form.balance_paid} onCheckedChange={v => setForm({ ...form, balance_paid: v })} /><Label>Balance Paid</Label></div>
          <div className="sm:col-span-2"><Label>Admin Notes</Label><Textarea rows={2} value={form.admin_notes || ""} onChange={e => setForm({ ...form, admin_notes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* =========================== TRAY PRICING =========================== */
function TrayPricing() {
  const qc = useQueryClient();
  const { data: business } = useBusinessSettings();
  const currency = business?.currency_symbol || "₱";
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: products } = useQuery({
    queryKey: ["all-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const cateringProducts = products?.filter(p => p.has_tray_pricing) || [];
  const nonCateringProducts = products?.filter(p => !p.has_tray_pricing) || [];

  const updateField = async (id: string, field: string, value: any) => {
    const { error } = await supabase.from("products").update({ [field]: value } as any).eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["all-products"] });
  };

  const addProductToCatering = async (productId: string) => {
    const { error } = await supabase.from("products").update({
      has_tray_pricing: true,
      tray_small_price: 500, tray_small_pax: 10,
      tray_medium_price: 900, tray_medium_pax: 20,
      tray_large_price: 1300, tray_large_pax: 30,
    }).eq("id", productId);
    if (error) toast.error(error.message);
    else { toast.success("Added to catering"); setShowAddDialog(false); qc.invalidateQueries({ queryKey: ["all-products"] }); }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Catering Trays ({cateringProducts.length})</CardTitle>
        <Button size="sm" onClick={() => setShowAddDialog(true)}><Plus className="h-4 w-4 mr-1" />Add Product</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {cateringProducts.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No catering trays yet. Click "Add Product" above.</p>
        )}
        {cateringProducts.map(p => (
          <div key={p.id} className="border border-border rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold">{p.name}</div>
              <div className="flex items-center gap-2">
                <Label className="text-xs">Active</Label>
                <Switch checked={p.has_tray_pricing} onCheckedChange={v => updateField(p.id, "has_tray_pricing", v)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["small", "medium", "large"] as const).map(size => (
                <div key={size} className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold">{size} ({currency})</Label>
                  <Input
                    type="number"
                    value={p[`tray_${size}_price`] ?? ""}
                    onChange={e => updateField(p.id, `tray_${size}_price`, e.target.value ? Number(e.target.value) : null)}
                    className="h-8 text-sm"
                  />
                  <Label className="text-[10px] text-muted-foreground">Pax</Label>
                  <Input
                    type="number"
                    value={p[`tray_${size}_pax`] ?? ""}
                    onChange={e => updateField(p.id, `tray_${size}_pax`, e.target.value ? Number(e.target.value) : null)}
                    className="h-8 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add Product to Catering</DialogTitle></DialogHeader>
            <div className="space-y-1">
              {nonCateringProducts.length === 0 && <p className="text-sm text-muted-foreground">All products are already in catering.</p>}
              {nonCateringProducts.map(p => (
                <button key={p.id} onClick={() => addProductToCatering(p.id)} className="w-full text-left p-2 rounded hover:bg-accent flex justify-between items-center">
                  <span className="text-sm">{p.name}</span>
                  <Plus className="h-4 w-4 text-primary" />
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
