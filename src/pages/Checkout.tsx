import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCartStore } from "@/lib/cart-store";
import { useBusinessSettings, usePaymentMethods } from "@/hooks/use-settings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, QrCode, Gift, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { getDiscountPercent } from "@/lib/loyalty-utils";

const COUNTRY_CODES = [
  { code: "+63", country: "PH" },
  { code: "+1", country: "US" },
  { code: "+44", country: "UK" },
  { code: "+61", country: "AU" },
  { code: "+81", country: "JP" },
  { code: "+82", country: "KR" },
  { code: "+65", country: "SG" },
  { code: "+60", country: "MY" },
  { code: "+66", country: "TH" },
  { code: "+84", country: "VN" },
  { code: "+91", country: "IN" },
  { code: "+86", country: "CN" },
  { code: "+971", country: "AE" },
  { code: "+49", country: "DE" },
  { code: "+33", country: "FR" },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCartStore();
  const { data: business } = useBusinessSettings();
  const { data: paymentMethods } = usePaymentMethods();
  const currency = business?.currency_symbol || "₱";

  const [form, setForm] = useState({
    name: "", countryCode: "+63", phone: "", email: "", deliveryType: "pickup", address: "", paymentMethod: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [savedName, setSavedName] = useState("");
  const [rewardCode, setRewardCode] = useState("");
  const [rewardValidation, setRewardValidation] = useState<{
    status: "idle" | "valid" | "invalid" | "expired" | "checking";
    reward?: any;
    discountPercent?: number;
  }>({ status: "idle" });

  // Restore saved customer profile
  useEffect(() => {
    try {
      const raw = localStorage.getItem("jaycee_customer_profile");
      if (raw) {
        const profile = JSON.parse(raw);
        setForm(f => ({
          ...f,
          name: profile.name || f.name,
          phone: profile.phoneLocal || f.phone,
          countryCode: profile.countryCode || f.countryCode,
          email: profile.email || f.email,
          address: profile.address || f.address,
        }));
        setSavedName(profile.name || "");
        setShowWelcome(true);
      }
    } catch {}
  }, []);

  // Set default payment method when data loads
  useEffect(() => {
    if (paymentMethods?.length && !form.paymentMethod) {
      setForm(f => ({ ...f, paymentMethod: paymentMethods[0].method_name }));
    }
  }, [paymentMethods]);

  const selectedPM = paymentMethods?.find(pm => pm.method_name === form.paymentMethod);
  const fullPhone = `${form.countryCode}${form.phone}`;

  const validateRewardCode = async (code: string) => {
    if (!code.trim()) { setRewardValidation({ status: "idle" }); return; }
    setRewardValidation({ status: "checking" });
    const { data } = await supabase.from("loyalty_rewards").select("*").eq("reward_code", code.trim().toUpperCase()).maybeSingle();
    if (!data) { setRewardValidation({ status: "invalid" }); return; }
    if (data.is_claimed) { setRewardValidation({ status: "invalid" }); return; }
    if (data.expires_at && new Date(data.expires_at) < new Date()) { setRewardValidation({ status: "expired" }); return; }
    const dp = getDiscountPercent(data.reward_type || "");
    setRewardValidation({ status: "valid", reward: data, discountPercent: dp });
  };

  const discountAmount = rewardValidation.status === "valid" && rewardValidation.discountPercent
    ? getTotal() * (rewardValidation.discountPercent / 100) : 0;
  const finalTotal = getTotal() - discountAmount;
  const isFreeItem = rewardValidation.status === "valid" && rewardValidation.reward?.reward_type === "free_item";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required");
    if (!form.phone.trim()) return toast.error("Phone is required");
    if (form.deliveryType === "delivery" && !form.address.trim()) return toast.error("Address required for delivery");
    if (items.length === 0) return toast.error("Cart is empty");

    setSubmitting(true);
    const subtotal = getTotal();
    const totalCost = items.reduce((s, i) => s + i.cost * i.quantity, 0);
    const orderId = `ORD-${Date.now()}`;

    // Reduce inventory
    for (const item of items) {
      const { data: prod } = await supabase.from("products").select("inventory").eq("id", item.id).single();
      if (prod) {
        await supabase.from("products").update({ inventory: Math.max(0, prod.inventory - item.quantity) }).eq("id", item.id);
      }
    }

    const orderTotal = isFreeItem ? subtotal : finalTotal;
    const { error } = await supabase.from("orders").insert({
      id: orderId,
      customer_name: form.name.trim(),
      customer_phone: fullPhone,
      customer_email: form.email.trim() || null,
      delivery_type: form.deliveryType,
      delivery_address: form.deliveryType === "delivery" ? form.address.trim() : null,
      items: items.map(i => ({ id: i.id, name: i.name, price: i.price, cost: i.cost, quantity: i.quantity, unit: i.unit })),
      subtotal,
      total_price: orderTotal,
      profit: orderTotal - totalCost,
      payment_method: form.paymentMethod,
      payment_status: "pending",
      order_status: "pending",
      reward_code_used: rewardValidation.status === "valid" ? rewardValidation.reward.reward_code : null,
    });

    if (error) {
      toast.error("Order failed");
      setSubmitting(false);
      return;
    }

    // Mark reward as claimed
    if (rewardValidation.status === "valid" && rewardValidation.reward) {
      await supabase.from("loyalty_rewards").update({
        is_claimed: true,
        status: "claimed",
        claimed_at: new Date().toISOString(),
      }).eq("id", rewardValidation.reward.id);
    }

    // Save customer profile to localStorage
    try {
      localStorage.setItem("jaycee_customer_profile", JSON.stringify({
        name: form.name.trim(),
        phone: fullPhone,
        phoneLocal: form.phone,
        countryCode: form.countryCode,
        email: form.email.trim(),
        address: form.address.trim(),
      }));
    } catch {}

    clearCart();
    toast.success(`Order ${orderId} placed!`);
    navigate(`/invoice/${orderId}`);
    setSubmitting(false);
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground mb-4">Your cart is empty</p>
        <Button onClick={() => navigate("/")}>Back to Menu</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <Button variant="ghost" className="mb-4 gap-2" onClick={() => navigate("/")}>
        <ArrowLeft className="h-4 w-4" /> Back to Menu
      </Button>

      {showWelcome && savedName && (
        <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 text-sm">
          <span>Welcome back, <strong>{savedName}</strong>! Your details have been filled in.</span>
          <button
            type="button"
            className="text-xs text-destructive hover:underline ml-3 shrink-0"
            onClick={() => {
              localStorage.removeItem("jaycee_customer_profile");
              setForm(f => ({ ...f, name: "", phone: "", email: "", address: "" }));
              setShowWelcome(false);
            }}
          >
            Not you? Clear
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {items.map(i => (
              <div key={i.id} className="flex justify-between text-sm">
                <span>{i.name} × {i.quantity}</span>
                <span>{currency}{(i.price * i.quantity).toFixed(2)}</span>
              </div>
            ))}
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Reward discount ({rewardValidation.discountPercent}%)</span>
                <span>-{currency}{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span>{currency}{(isFreeItem ? getTotal() : finalTotal).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Your Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" /></div>
            <div>
              <Label>Phone *</Label>
              <div className="flex gap-2">
                <Select value={form.countryCode} onValueChange={v => setForm(f => ({ ...f, countryCode: v }))}>
                  <SelectTrigger className="w-24 shrink-0"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COUNTRY_CODES.map(c => (
                      <SelectItem key={c.code} value={c.code}>{c.code} {c.country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="9XX XXX XXXX" className="flex-1" />
              </div>
            </div>
            <div><Label>Email (optional)</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="For order updates" /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Delivery</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Select value={form.deliveryType} onValueChange={v => setForm(f => ({ ...f, deliveryType: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pickup">Pickup</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
              </SelectContent>
            </Select>
            {form.deliveryType === "delivery" && (
              <div><Label>Address *</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Delivery address" /></div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Select value={form.paymentMethod} onValueChange={v => setForm(f => ({ ...f, paymentMethod: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {paymentMethods?.map(pm => (
                  <SelectItem key={pm.id} value={pm.method_name}>{pm.method_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPM?.qr_code_url && (
              <div className="border rounded-lg p-4 text-center space-y-2">
                <QrCode className="h-6 w-6 mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">Scan to pay with {selectedPM.method_name}</p>
                <img src={selectedPM.qr_code_url} alt="QR Code" className="mx-auto max-w-[200px] rounded" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reward Code */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Gift className="h-5 w-5" /> Have a reward code?</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={rewardCode}
              onChange={e => setRewardCode(e.target.value)}
              onBlur={() => validateRewardCode(rewardCode)}
              placeholder="JAYCEE-XXXX-XXXX"
              className="font-mono"
            />
            {rewardValidation.status === "checking" && <p className="text-xs text-muted-foreground">Checking code...</p>}
            {rewardValidation.status === "valid" && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="h-4 w-4" />
                {isFreeItem
                  ? "Free item reward applied!"
                  : `${rewardValidation.discountPercent}% discount applied — ${currency}${discountAmount.toFixed(2)} saved`}
              </div>
            )}
            {rewardValidation.status === "invalid" && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <XCircle className="h-4 w-4" /> Code not found or already used
              </div>
            )}
            {rewardValidation.status === "expired" && (
              <div className="flex items-center gap-2 text-amber-600 text-sm">
                <AlertTriangle className="h-4 w-4" /> This reward has expired
              </div>
            )}
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting ? "Placing Order..." : `Place Order — ${currency}${(isFreeItem ? getTotal() : finalTotal).toFixed(2)}`}
        </Button>
      </form>
    </div>
  );
}
