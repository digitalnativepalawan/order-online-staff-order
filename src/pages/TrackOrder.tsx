import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Package, ChevronDown, ChevronUp, Star, Gift, CreditCard, LogOut, User, Phone } from "lucide-react";
import { useBusinessSettings } from "@/hooks/use-settings";
import { TIER_COLORS, REWARD_THRESHOLDS, getNextRewardThreshold } from "@/lib/loyalty-utils";

const STORAGE_KEY = "jaycee_customer_profile";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-600 border-yellow-300",
  confirmed: "bg-blue-500/15 text-blue-600 border-blue-300",
  ready: "bg-green-500/15 text-green-600 border-green-300",
  completed: "bg-secondary text-foreground border-border",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
};

function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return <Badge className={`${colors} border text-xs capitalize`}>{status}</Badge>;
}

export default function TrackOrder() {
  const { data: business } = useBusinessSettings();
  const currency = business?.currency_symbol || "₱";

  const [phone, setPhone] = useState("");
  const [loggedInPhone, setLoggedInPhone] = useState<string | null>(null);
  const [invoiceInput, setInvoiceInput] = useState("");
  const [searchInvoice, setSearchInvoice] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Load saved profile on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const profile = JSON.parse(raw);
        if (profile?.phone) setLoggedInPhone(profile.phone);
      }
    } catch {}
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = phone.trim();
    if (!trimmed) return;
    setLoggedInPhone(trimmed);
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      const profile = existing ? JSON.parse(existing) : {};
      profile.phone = trimmed;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {}
  };

  const handleLogout = () => {
    setLoggedInPhone(null);
    setPhone("");
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      if (existing) {
        const profile = JSON.parse(existing);
        delete profile.phone;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      }
    } catch {}
  };

  // Invoice lookup
  const { data: lookedUpOrder, isLoading: lookupLoading } = useQuery({
    queryKey: ["track-order", searchInvoice],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").eq("invoice_number", searchInvoice!).single();
      return data || null;
    },
    enabled: !!searchInvoice,
  });

  // Order history
  const { data: orderHistory } = useQuery({
    queryKey: ["order-history", loggedInPhone],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").eq("customer_phone", loggedInPhone!).order("created_at", { ascending: false }).limit(10);
      return data || [];
    },
    enabled: !!loggedInPhone,
  });

  // Loyalty
  const { data: loyaltyCustomer } = useQuery({
    queryKey: ["loyalty-card", loggedInPhone],
    queryFn: async () => {
      const { data } = await supabase.from("loyalty_customers").select("*").eq("phone", loggedInPhone!).maybeSingle();
      return data;
    },
    enabled: !!loggedInPhone,
  });

  const { data: loyaltyRewards } = useQuery({
    queryKey: ["loyalty-rewards", loyaltyCustomer?.id],
    queryFn: async () => {
      const { data } = await supabase.from("loyalty_rewards").select("*").eq("customer_id", loyaltyCustomer!.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!loyaltyCustomer?.id,
  });

  const { data: stampLogs } = useQuery({
    queryKey: ["loyalty-logs", loyaltyCustomer?.id],
    queryFn: async () => {
      const { data } = await supabase.from("loyalty_stamp_log").select("*").eq("customer_id", loyaltyCustomer!.id).order("created_at", { ascending: false }).limit(5);
      return data || [];
    },
    enabled: !!loyaltyCustomer?.id,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (invoiceInput.trim()) setSearchInvoice(invoiceInput.trim().toUpperCase());
  };

  // --- NOT LOGGED IN: Show login screen ---
  if (!loggedInPhone) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">My Account</h1>
          <p className="text-sm text-muted-foreground mt-2">Enter your phone number to view your orders, loyalty card, and rewards.</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+63 9XX XXX XXXX" className="pl-10" />
                </div>
              </div>
              <Button type="submit" className="w-full gap-2" disabled={!phone.trim()}>
                <User className="h-4 w-4" /> Sign In
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
            </div>

            <form onSubmit={handleSearch} className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">Track a single order by invoice number</p>
              <div className="flex gap-2">
                <Input value={invoiceInput} onChange={e => setInvoiceInput(e.target.value)} placeholder="INV-2026-XXXX" className="flex-1 font-mono" />
                <Button type="submit" variant="outline" className="shrink-0 gap-2" disabled={lookupLoading}><Search className="h-4 w-4" /> Check</Button>
              </div>
            </form>

            {searchInvoice && (
              <div className="mt-4 border-t border-border pt-4">
                {lookupLoading ? (
                  <p className="text-center text-muted-foreground text-sm">Looking up order...</p>
                ) : lookedUpOrder ? (
                  <OrderDetail order={lookedUpOrder} currency={currency} />
                ) : (
                  <p className="text-center text-muted-foreground text-sm">No order found with that invoice number.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- LOGGED IN: Show account dashboard ---
  const nextReward = loyaltyCustomer ? getNextRewardThreshold(loyaltyCustomer.stamp_count || 0) : null;
  const stampCount = loyaltyCustomer?.stamp_count || 0;
  const nextThreshold = nextReward?.stamps || REWARD_THRESHOLDS[REWARD_THRESHOLDS.length - 1].stamps;
  const remaining = Math.max(0, nextThreshold - stampCount);
  const progressPercent = nextThreshold > 0 ? Math.min(100, (stampCount / nextThreshold) * 100) : 100;
  const unclaimedRewards = loyaltyRewards?.filter(r => r.status === "unclaimed" && !r.is_claimed && (!r.expires_at || new Date(r.expires_at) > new Date())) || [];

  return (
    <div className="container mx-auto px-4 py-6 max-w-lg">
      {/* Account header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">{loyaltyCustomer?.name || "Customer"}</p>
            <p className="text-xs text-muted-foreground">{loggedInPhone}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1 text-muted-foreground">
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="loyalty">Loyalty</TabsTrigger>
          <TabsTrigger value="track">Track</TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-3 mt-4">
          {orderHistory && orderHistory.length > 0 ? (
            orderHistory.map((order: any) => {
              const isExpanded = expandedOrderId === order.id;
              return (
                <Card key={order.id} className="overflow-hidden">
                  <button
                    className="w-full text-left p-3 sm:p-4 flex items-center gap-3 hover:bg-accent/50 transition-colors"
                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs">{order.invoice_number || order.id}</span>
                        <StatusBadge status={order.order_status} />
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{new Date(order.created_at).toLocaleDateString()}</span>
                        <span>·</span>
                        <span className="font-medium tabular-nums">{currency}{Number(order.total_price).toFixed(2)}</span>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </button>
                  {isExpanded && (
                    <div className="border-t border-border p-3 sm:p-4">
                      <OrderDetail order={order} currency={currency} />
                    </div>
                  )}
                </Card>
              );
            })
          ) : (
            <Card><CardContent className="pt-6 text-center text-muted-foreground text-sm">No orders found for this phone number.</CardContent></Card>
          )}
        </TabsContent>

        {/* Loyalty Tab */}
        <TabsContent value="loyalty" className="mt-4">
          {loyaltyCustomer ? (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{loyaltyCustomer.name || "Customer"}</p>
                    <p className="text-xs text-muted-foreground">{loyaltyCustomer.phone}</p>
                  </div>
                  <Badge className={`${TIER_COLORS[loyaltyCustomer.tier || "regular"]} border text-xs capitalize`}>
                    {loyaltyCustomer.tier || "regular"}
                  </Badge>
                </div>

                {/* Stamp dots */}
                <div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {Array.from({ length: nextThreshold }, (_, i) => (
                      <div key={i} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] ${
                        i < stampCount ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"
                      }`}>
                        {i < stampCount ? "★" : ""}
                      </div>
                    ))}
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2 mb-1">
                    <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {remaining > 0 ? `${remaining} more stamp${remaining !== 1 ? "s" : ""} to next reward` : "Maximum rewards reached!"}
                    {nextReward && <span className="ml-1">({nextReward.label})</span>}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-accent/30 rounded-lg p-2">
                    <p className="text-lg font-bold">{loyaltyCustomer.lifetime_stamps || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Lifetime Stamps</p>
                  </div>
                  <div className="bg-accent/30 rounded-lg p-2">
                    <p className="text-lg font-bold">{currency}{Number(loyaltyCustomer.total_spent || 0).toFixed(0)}</p>
                    <p className="text-[10px] text-muted-foreground">Total Spent</p>
                  </div>
                </div>

                {/* Unclaimed rewards */}
                {unclaimedRewards.length > 0 && (
                  <div className="space-y-2">
                    {unclaimedRewards.map(r => (
                      <div key={r.id} className="border border-amber-300 bg-amber-500/10 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Gift className="h-4 w-4 text-amber-500" />
                          <span className="text-sm font-semibold">🎁 Reward ready!</span>
                        </div>
                        <p className="font-mono text-lg font-bold tracking-wider">{r.reward_code}</p>
                        <p className="text-xs text-muted-foreground capitalize">{r.reward_type?.replace("_", " ")}</p>
                        {r.expires_at && <p className="text-xs text-muted-foreground">Expires {new Date(r.expires_at).toLocaleDateString()}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Recent stamp history */}
                {stampLogs && stampLogs.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-1">Recent Stamps</p>
                    {stampLogs.map(l => (
                      <div key={l.id} className="flex justify-between text-xs py-1.5 border-b border-border last:border-0">
                        <span>{l.invoice_number} · {new Date(l.created_at!).toLocaleDateString()}</span>
                        <span className="font-medium text-primary">+{l.stamps_earned}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="pt-6 text-center text-muted-foreground text-sm">No loyalty card found for this phone number. Place an order to get started!</CardContent></Card>
          )}
        </TabsContent>

        {/* Track Tab */}
        <TabsContent value="track" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input value={invoiceInput} onChange={e => setInvoiceInput(e.target.value)} placeholder="INV-2026-XXXX" className="flex-1 font-mono" />
                <Button type="submit" disabled={lookupLoading} className="shrink-0 gap-2"><Search className="h-4 w-4" /> Check</Button>
              </form>
            </CardContent>
          </Card>
          {searchInvoice && (
            <Card className="mt-3">
              <CardContent className="pt-6">
                {lookupLoading ? (
                  <p className="text-center text-muted-foreground text-sm">Looking up order...</p>
                ) : lookedUpOrder ? (
                  <OrderDetail order={lookedUpOrder} currency={currency} />
                ) : (
                  <p className="text-center text-muted-foreground text-sm">No order found with that invoice number.</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OrderDetail({ order, currency }: { order: any; currency: string }) {
  const items = order.items as any[];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm font-medium">{order.invoice_number || order.id}</span>
        <StatusBadge status={order.order_status} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <span>Date: {new Date(order.created_at).toLocaleDateString()}</span>
        <span>Time: {new Date(order.created_at).toLocaleTimeString()}</span>
        <span className="capitalize">Delivery: {order.delivery_type}</span>
        <span className="capitalize">Payment: {order.payment_method}</span>
      </div>
      <div className="border-t border-border pt-2">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Bill To</p>
        <p className="text-sm font-semibold">{order.customer_name}</p>
        <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
        {order.customer_email && <p className="text-xs text-muted-foreground">{order.customer_email}</p>}
      </div>
      <div className="border-t border-border pt-2 space-y-1">
        {items.map((item: any, idx: number) => (
          <div key={idx} className="flex justify-between text-sm">
            <span className="min-w-0 truncate flex-1">{item.quantity}× {item.name}</span>
            <span className="shrink-0 tabular-nums ml-2">{currency}{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-border pt-2 flex justify-between font-bold text-sm">
        <span>Grand Total</span>
        <span className="tabular-nums">{currency}{Number(order.total_price).toFixed(2)}</span>
      </div>
    </div>
  );
}
