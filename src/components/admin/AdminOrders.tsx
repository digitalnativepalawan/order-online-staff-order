import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MessageCircle, CheckCircle, XCircle, Clock, Mail, Search, Phone, ChevronDown, ChevronUp, DollarSign, ExternalLink, Star, Store, Truck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo, useEffect } from "react";
import { useBusinessSettings } from "@/hooks/use-settings";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import StampAwardModal from "./StampAwardModal";

const PICKUP_ADDRESS = "JayCee Trading & Services\nZone 2 Abanico Rd, Puerto Princesa City, Palawan";
const PICKUP_MAPS = "https://maps.app.goo.gl/64qx6xVXejQdEJfx6";
const WHATSAPP_CONTACT = "+639771167555";

function buildConfirmEmail(order: any) {
  const invoiceNum = order.invoice_number || order.id;
  const items = (order.items as any[]) || [];
  const itemLines = items.map(i => `${i.name} x${i.quantity} @ ₱${Number(i.price).toFixed(2)} = ₱${(Number(i.price) * i.quantity).toFixed(2)}`).join("\n");
  const isPickup = order.delivery_type !== "delivery";
  const fulfillmentBlock = isPickup
    ? `Ready for pickup at:\n${PICKUP_ADDRESS}\nDirections: ${PICKUP_MAPS}\n\nPlease bring valid ID. Open until 6:00 PM.`
    : `Delivering to:\n${order.delivery_address || "(address on file)"}\nRider ETA: 30-45 minutes`;
  const subject = `JayCee Order #${invoiceNum} - Confirmed & Preparing! ✅`;
  const body = `Hi ${order.customer_name},\n\nYour order has been confirmed and we're preparing it now!\n\nORDER DETAILS:\nInvoice: #${invoiceNum}\n${itemLines}\nSubtotal: ₱${Number(order.subtotal ?? order.total_price).toFixed(2)}\nGrand Total: ₱${Number(order.total_price).toFixed(2)}\nPayment: ${order.payment_method}\n\n${fulfillmentBlock}\n\nView full invoice: ${window.location.origin}/invoice/${invoiceNum}\n\nQuestions? Reply here or WhatsApp ${WHATSAPP_CONTACT}.\n\nBest,\nJayCee Trading & Services`;
  return { subject, body };
}

function buildReadyEmail(order: any) {
  const invoiceNum = order.invoice_number || order.id;
  const items = (order.items as any[]) || [];
  const itemSummary = items.map(i => `${i.name} x${i.quantity}`).join(", ");
  const isPickup = order.delivery_type !== "delivery";
  const fulfillmentBlock = isPickup
    ? `Your order is ready for pickup at:\n${PICKUP_ADDRESS}\nGoogle Maps: ${PICKUP_MAPS}\n\nPlease collect at your earliest convenience. Open until 6:00 PM.\nBring valid ID and order number: #${invoiceNum}`
    : `Your order is out for delivery!\n\nAddress: ${order.delivery_address || "(address on file)"}\nRider contact: [Add rider number if available]\nEstimated arrival: 30-45 minutes`;
  const subject = `JayCee Order #${invoiceNum} - Ready for ${isPickup ? "pickup" : "delivery"}! 🎉`;
  const body = `Hi ${order.customer_name},\n\nGreat news! Your order is ready!\n\n${fulfillmentBlock}\n\nORDER SUMMARY:\n${itemSummary}\nTotal: ₱${Number(order.total_price).toFixed(2)}\nPayment: ${order.payment_method}\n\nView invoice: ${window.location.origin}/invoice/${invoiceNum}\n\nThanks for choosing JayCee!`;
  return { subject, body };
}

function relativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

interface AdminOrdersProps {
  initialStatusFilter?: string;
}

export default function AdminOrders({ initialStatusFilter }: AdminOrdersProps = {}) {
  const qc = useQueryClient();
  const { data: settings } = useBusinessSettings();
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "online" | "pos">("all");
  const [search, setSearch] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [stampOrder, setStampOrder] = useState<any>(null);
  const [, setTick] = useState(0);
  const [emailLoading, setEmailLoading] = useState<{ id: string; type: "confirm" | "ready" } | null>(null);

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (initialStatusFilter && statusFilter === "all") setStatusFilter(initialStatusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStatusFilter]);

  const { data: orders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    if (!orders) return [];
    return orders.filter(o => {
      const matchStatus = statusFilter === "all" || o.order_status === statusFilter;
      const matchSource = sourceFilter === "all" || (o.order_source ?? "online") === sourceFilter;
      const q = search.toLowerCase();
      const matchSearch = !q || o.customer_name.toLowerCase().includes(q) || o.customer_phone.includes(q) || o.id.toLowerCase().includes(q);
      return matchStatus && matchSource && matchSearch;
    });
  }, [orders, statusFilter, sourceFilter, search]);

  const updateStatus = async (id: string, status: string) => {
    const update: any = { order_status: status };
    if (status === "confirmed") update.confirmed_at = new Date().toISOString();
    if (status === "ready") update.ready_at = new Date().toISOString();
    if (status === "completed") update.completed_at = new Date().toISOString();
    if (status === "cancelled") {
      const order = orders?.find(o => o.id === id);
      if (order) {
        const items = order.items as any[];
        for (const item of items) {
          const { data: prod } = await supabase.from("products").select("inventory").eq("id", item.id).single();
          if (prod) await supabase.from("products").update({ inventory: prod.inventory + item.quantity }).eq("id", item.id);
        }
      }
    }
    await supabase.from("orders").update(update).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
    toast.success(`Order ${status}`);
  };

  const markPaid = async (order: any) => {
    await supabase.from("orders").update({
      payment_status: "paid",
      paid_at: new Date().toISOString(),
      paid_via: order.payment_method,
    }).eq("id", order.id);
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
    toast.success("Order marked as paid");
  };

  const markUnpaid = async (id: string) => {
    await supabase.from("orders").update({
      payment_status: "pending",
      paid_at: null,
      paid_via: null,
    }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
    toast.success("Order marked as unpaid");
  };

  const fillTemplate = (template: string, order: any) => {
    return template
      .replace("{name}", order.customer_name)
      .replace("{id}", order.id)
      .replace("{total}", `₱${order.total_price}`)
      .replace("{delivery_type}", order.delivery_type)
      .replace("{address}", order.delivery_address || settings?.business_address || "our store");
  };

  const sendWhatsApp = (order: any, type: "confirm" | "ready") => {
    const template = type === "confirm"
      ? (settings?.confirmation_whatsapp_template || "Hello {name}, your order #{id} has been CONFIRMED. Total: {total}.")
      : (settings?.ready_whatsapp_template || "Hello {name}, your order #{id} is READY for {delivery_type}.");
    let msg = fillTemplate(template, order);
    // Prepend invoice number and track link
    const invoiceNum = order.invoice_number || order.id;
    const trackUrl = `${window.location.origin}/track`;
    msg = `[${invoiceNum}] ${msg}\n\nTrack your order: ${trackUrl}`;
    window.open(`https://wa.me/${order.customer_phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
    const updateData = type === "confirm" ? { whatsapp_confirmation_sent: true } : { whatsapp_ready_sent: true };
    supabase.from("orders").update(updateData).eq("id", order.id).then(() => qc.invalidateQueries({ queryKey: ["admin-orders"] }));
  };

  const sendPaidInvoice = (order: any) => {
    const invoiceUrl = `${window.location.origin}/invoice/${order.id}`;
    const msg = encodeURIComponent(`Hello ${order.customer_name}, your payment of ₱${order.total_price} for order #${order.id} has been received. View your paid invoice here: ${invoiceUrl}`);
    window.open(`https://wa.me/${order.customer_phone.replace(/\D/g, "")}?text=${msg}`, "_blank");
  };

  const sendEmail = (order: any, type: "confirm" | "ready") => {
    if (!order.customer_email) return;
    setEmailLoading({ id: order.id, type });
    const { subject, body } = type === "confirm" ? buildConfirmEmail(order) : buildReadyEmail(order);
    window.open(`mailto:${order.customer_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
    const emailUpdate = type === "confirm" ? { email_confirmation_sent: true } : { email_ready_sent: true };
    supabase.from("orders").update(emailUpdate).eq("id", order.id).then(() => qc.invalidateQueries({ queryKey: ["admin-orders"] }));
    toast.success("Gmail compose opened—click Send!");
    setTimeout(() => setEmailLoading(null), 2000);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "completed": return "bg-[hsl(220,9%,46%)]/20 text-[hsl(220,9%,46%)] dark:text-[hsl(220,9%,75%)]";
      case "cancelled": return "bg-[hsl(0,72%,51%)]/20 text-[hsl(0,72%,51%)]";
      case "ready": return "bg-[hsl(160,84%,39%)]/20 text-[hsl(160,84%,39%)]";
      case "confirmed": return "bg-[hsl(217,91%,60%)]/20 text-[hsl(217,91%,60%)]";
      default: return "bg-[hsl(24,95%,53%)]/20 text-[hsl(24,95%,53%)]";
    }
  };

  const paymentStatusColor = (s: string) => s === "paid" ? "bg-green-500/20 text-green-500" : "bg-yellow-500/20 text-yellow-500";

  const statusCounts = useMemo(() => {
    if (!orders) return {};
    const counts: Record<string, number> = {};
    orders.forEach(o => { counts[o.order_status] = (counts[o.order_status] || 0) + 1; });
    return counts;
  }, [orders]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Orders ({filtered.length})</h2>
      <div className="flex flex-wrap gap-2">
        {["all", "pending", "confirmed", "ready", "completed", "cancelled"].map(s => (
          <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)} className="text-xs capitalize">
            {s} {s !== "all" && statusCounts[s] ? `(${statusCounts[s]})` : s === "all" ? `(${orders?.length || 0})` : ""}
          </Button>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as any)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">All sources</option>
          <option value="online">Online</option>
          <option value="pos">POS</option>
        </select>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name, phone, or order ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {filtered.map(o => {
        const ageMs = Date.now() - new Date(o.created_at).getTime();
        const isNew = ageMs < 10 * 60 * 1000;
        const isPickup = o.delivery_type !== "delivery";
        const ageMins = Math.floor(ageMs / 60000);
        const isDelayed = o.order_status === "pending" && ageMins > 15;
        return (
        <Card
          key={o.id}
          className={isNew ? "border-l-4 border-l-[hsl(24,95%,53%)] bg-[hsl(45,93%,88%)]/30 dark:bg-[hsl(24,95%,53%)]/5" : ""}
        >
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2 cursor-pointer" onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)}>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-mono text-xs truncate max-w-full">{o.id}</p>
                  {isNew && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[hsl(24,95%,53%)] text-white animate-alert-pulse">NEW</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium break-words">{o.customer_name}</p>
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${isPickup ? "bg-[hsl(217,91%,60%)]/20 text-[hsl(217,91%,60%)]" : "bg-[hsl(270,91%,65%)]/20 text-[hsl(270,91%,65%)]"}`}>
                    {isPickup ? <Store className="h-2.5 w-2.5" /> : <Truck className="h-2.5 w-2.5" />}
                    {isPickup ? "PICKUP" : "DELIVERY"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap break-all">
                  <Phone className="h-3 w-3 shrink-0" /> {o.customer_phone}
                </p>
                {o.customer_email && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap break-all max-w-full">
                    <Mail className="h-3 w-3 shrink-0" /> <span className="break-all">{o.customer_email}</span>
                  </p>
                )}
                <p className="text-xs text-muted-foreground break-words">{o.payment_method} · {new Date(o.created_at).toLocaleString()}</p>
                <p className={`text-xs ${isDelayed ? "text-[hsl(0,72%,51%)] font-semibold" : "text-muted-foreground"}`}>
                  {isDelayed ? <><AlertTriangle className="inline h-3 w-3 mr-0.5" />Waiting {ageMins} min</> : relativeTime(o.created_at)}
                </p>
                {/* Mobile-only: status badges on their own row */}
                <div className="flex flex-wrap gap-1 sm:hidden pt-1">
                  <Badge className={statusColor(o.order_status)}>{o.order_status}</Badge>
                  <Badge className={paymentStatusColor(o.payment_status)}>{o.payment_status}</Badge>
                </div>
              </div>
              <div className="text-right flex items-center gap-2 shrink-0">
                <div>
                  <p className="font-bold">₱{Number(o.total_price).toFixed(2)}</p>
                  <p className="text-xs text-[hsl(160,84%,39%)]">+₱{Number(o.profit).toFixed(2)}</p>
                  {/* Desktop-only: badges next to price */}
                  <div className="hidden sm:flex flex-wrap gap-1 justify-end mt-1">
                    <Badge className={statusColor(o.order_status)}>{o.order_status}</Badge>
                    <Badge className={paymentStatusColor(o.payment_status)}>{o.payment_status}</Badge>
                  </div>
                </div>
                {expandedOrder === o.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>

            {expandedOrder === o.id && (
              <div className="space-y-3 border-t border-border pt-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Items:</p>
                  {(o.items as any[]).map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.name} × {item.quantity}</span>
                      <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-bold border-t border-border pt-1">
                    <span>Total</span><span>₱{Number(o.total_price).toFixed(2)}</span>
                  </div>
                </div>
                {o.delivery_address && <p className="text-sm"><span className="font-semibold">Address:</span> {o.delivery_address}</p>}

                {/* Payment Actions */}
                <div className="flex flex-wrap gap-2">
                  {o.payment_status !== "paid" && (
                    <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => markPaid(o)}>
                      <DollarSign className="h-3 w-3" /> Mark Paid
                    </Button>
                  )}
                  {o.payment_status === "paid" && (
                    <>
                      <Button size="sm" variant="outline" className="gap-1 text-xs text-destructive" onClick={() => markUnpaid(o.id)}>
                        <DollarSign className="h-3 w-3" /> Mark Unpaid
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => sendPaidInvoice(o)}>
                        <MessageCircle className="h-3 w-3" /> Send Paid Invoice
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => window.open(`/invoice/${o.id}`, "_blank")}>
                    <ExternalLink className="h-3 w-3" /> View Invoice
                  </Button>
                </div>

                {/* Communication Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => sendWhatsApp(o, "confirm")} disabled={o.whatsapp_confirmation_sent}>
                    <MessageCircle className="h-3 w-3" /> WA Confirm {o.whatsapp_confirmation_sent && "✓"}
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => sendWhatsApp(o, "ready")} disabled={o.whatsapp_ready_sent}>
                    <MessageCircle className="h-3 w-3" /> WA Ready {o.whatsapp_ready_sent && "✓"}
                  </Button>
                  {(["confirm", "ready"] as const).map(type => {
                    const sent = type === "confirm" ? o.email_confirmation_sent : o.email_ready_sent;
                    const loading = emailLoading?.id === o.id && emailLoading?.type === type;
                    const noEmail = !o.customer_email;
                    const label = loading ? "Opening Gmail..." : `Email ${type === "confirm" ? "Confirm" : "Ready"}`;
                    const btn = (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs"
                        onClick={() => sendEmail(o, type)}
                        disabled={sent || noEmail || loading}
                      >
                        <Mail className="h-3 w-3" /> {label} {sent && "✓"}
                      </Button>
                    );
                    if (noEmail) {
                      return (
                        <Tooltip key={type}>
                          <TooltipTrigger asChild><span tabIndex={0}>{btn}</span></TooltipTrigger>
                          <TooltipContent>No email on file</TooltipContent>
                        </Tooltip>
                      );
                    }
                    return <span key={type}>{btn}</span>;
                  })}
                </div>

                {/* Status Actions */}
                <div className="flex flex-wrap gap-2">
                  {o.order_status === "completed" && (
                    <Button size="sm" variant="outline" className="gap-1 text-xs text-amber-600" onClick={() => setStampOrder(o)}>
                      <Star className="h-3 w-3" /> Award Stamps
                    </Button>
                  )}
                  {o.order_status === "pending" && (
                    <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => updateStatus(o.id, "confirmed")}><CheckCircle className="h-3 w-3" /> Confirm</Button>
                  )}
                  {(o.order_status === "confirmed" || o.order_status === "pending") && (
                    <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => updateStatus(o.id, "ready")}><Clock className="h-3 w-3" /> Ready</Button>
                  )}
                  {o.order_status !== "completed" && o.order_status !== "cancelled" && (
                    <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => updateStatus(o.id, "completed")}><CheckCircle className="h-3 w-3" /> Complete</Button>
                  )}
                  {o.order_status !== "cancelled" && o.order_status !== "completed" && (
                    <Button size="sm" variant="outline" className="gap-1 text-xs text-destructive" onClick={() => updateStatus(o.id, "cancelled")}><XCircle className="h-3 w-3" /> Cancel</Button>
                  )}
                </div>

                <div className="text-xs text-muted-foreground space-y-0.5">
                  {o.confirmed_at && <p>Confirmed: {new Date(o.confirmed_at).toLocaleString()}</p>}
                  {o.ready_at && <p>Ready: {new Date(o.ready_at).toLocaleString()}</p>}
                  {o.completed_at && <p>Completed: {new Date(o.completed_at).toLocaleString()}</p>}
                  {o.paid_at && <p>Paid: {new Date(o.paid_at).toLocaleString()} via {o.paid_via}</p>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        );
      })}
      {filtered.length === 0 && <p className="text-muted-foreground text-center py-8">No orders found</p>}

      <StampAwardModal order={stampOrder} open={!!stampOrder} onClose={() => setStampOrder(null)} />
    </div>
  );
}
