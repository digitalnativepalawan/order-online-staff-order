import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star, Gift, MessageCircle } from "lucide-react";
import {
  calculateStamps, getTier, getEarnedReward, generateRewardCode, getDiscountPercent,
  REWARD_THRESHOLDS, TIER_COLORS,
} from "@/lib/loyalty-utils";

interface Props {
  order: any;
  open: boolean;
  onClose: () => void;
}

export default function StampAwardModal({ order, open, onClose }: Props) {
  const qc = useQueryClient();
  const [awarding, setAwarding] = useState(false);

  // Pre-calculate
  const orderTotal = Number(order?.total_price || 0);
  const customerPhone = order?.customer_phone || "";
  const customerName = order?.customer_name || "";

  const [existingCustomer, setExistingCustomer] = useState<any>(null);

  // Load customer on open
  useMemo(() => {
    if (open && customerPhone) {
      supabase.from("loyalty_customers").select("*").eq("phone", customerPhone).maybeSingle()
        .then(({ data }) => { setExistingCustomer(data); });
    }
  }, [open, customerPhone]);

  const currentStamps = existingCustomer?.stamp_count || 0;
  const lifetimeStamps = existingCustomer?.lifetime_stamps || 0;
  const tier = getTier(lifetimeStamps);
  const stampsToAward = calculateStamps(orderTotal, tier);
  const newStampCount = currentStamps + stampsToAward;
  const earnedReward = getEarnedReward(newStampCount);
  const newLifetime = lifetimeStamps + stampsToAward;
  const newTier = getTier(newLifetime);

  const handleAward = async () => {
    if (stampsToAward === 0) return toast.error("No stamps to award for this order");
    setAwarding(true);

    try {
      let customerId: string;
      let finalStampCount = newStampCount;

      // Upsert customer
      if (existingCustomer) {
        customerId = existingCustomer.id;
        await supabase.from("loyalty_customers").update({
          name: customerName,
          email: order.customer_email || existingCustomer.email,
          stamp_count: newStampCount,
          lifetime_stamps: newLifetime,
          total_orders: (existingCustomer.total_orders || 0) + 1,
          total_spent: Number(existingCustomer.total_spent || 0) + orderTotal,
          last_order_at: new Date().toISOString(),
          tier: newTier,
        }).eq("id", customerId);
      } else {
        customerId = crypto.randomUUID();
        await supabase.from("loyalty_customers").insert({
          id: customerId,
          phone: customerPhone,
          name: customerName,
          email: order.customer_email || null,
          stamp_count: newStampCount,
          lifetime_stamps: newLifetime,
          total_orders: 1,
          total_spent: orderTotal,
          last_order_at: new Date().toISOString(),
          tier: newTier,
        });
      }

      // Log stamps
      await supabase.from("loyalty_stamp_log").insert({
        customer_id: customerId,
        order_id: order.id,
        invoice_number: order.invoice_number || order.id,
        stamps_earned: stampsToAward,
        order_total: orderTotal,
      });

      // Check if reward threshold crossed
      let rewardCode: string | null = null;
      if (earnedReward) {
        rewardCode = generateRewardCode(earnedReward.type);
        const remainder = newStampCount - earnedReward.stamps;
        finalStampCount = remainder;

        await supabase.from("loyalty_rewards").insert({
          customer_id: customerId,
          customer_phone: customerPhone,
          reward_type: earnedReward.type,
          reward_code: rewardCode,
          status: "unclaimed",
          is_claimed: false,
          discount_amount: getDiscountPercent(earnedReward.type),
          earned_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

        // Update stamp_count to remainder
        await supabase.from("loyalty_customers").update({ stamp_count: remainder }).eq("id", customerId);
      }

      qc.invalidateQueries({ queryKey: ["loyalty-customers"] });
      qc.invalidateQueries({ queryKey: ["loyalty-stamp-logs"] });
      qc.invalidateQueries({ queryKey: ["loyalty-rewards-all"] });

      const msg = earnedReward
        ? `${stampsToAward} stamps awarded! Reward unlocked: ${earnedReward.label} 🎉`
        : `${stampsToAward} stamps awarded!`;
      toast.success(msg);

      // Open WhatsApp with stamp notification
      const nextReward = REWARD_THRESHOLDS.find(r => r.stamps > finalStampCount);
      const remaining = nextReward ? nextReward.stamps - finalStampCount : 0;
      let waMsg = `Hi ${customerName}! You earned ${stampsToAward} stamps on order ${order.invoice_number || order.id} 🎉\n\nStamp card: ${finalStampCount}/${nextReward?.stamps || "MAX"} — ${remaining} more to your next reward.`;
      if (rewardCode && earnedReward) {
        waMsg += `\n\n🎁 Reward unlocked! Code: ${rewardCode} (valid 30 days)\n${earnedReward.label}`;
      }
      waMsg += `\n\nCheck your card: jaycee.palawancollective.com/track`;
      window.open(`https://wa.me/${customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(waMsg)}`, "_blank");

      onClose();
    } catch (err) {
      toast.error("Failed to award stamps");
    } finally {
      setAwarding(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-amber-500" /> Award Stamps</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-sm space-y-1">
            <p><span className="text-muted-foreground">Customer:</span> <strong>{customerName}</strong></p>
            <p><span className="text-muted-foreground">Phone:</span> {customerPhone}</p>
            <p><span className="text-muted-foreground">Order Total:</span> <strong>₱{orderTotal.toFixed(2)}</strong></p>
          </div>

          <div className="border rounded-lg p-3 space-y-2 bg-accent/30">
            <div className="flex justify-between text-sm">
              <span>Tier</span>
              <Badge className={`${TIER_COLORS[tier]} border text-xs capitalize`}>{tier}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span>Stamps to award</span>
              <span className="font-bold text-primary">+{stampsToAward}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Current → New</span>
              <span>{currentStamps} → {newStampCount}</span>
            </div>
            {newTier !== tier && (
              <div className="flex justify-between text-sm">
                <span>Tier upgrade!</span>
                <Badge className={`${TIER_COLORS[newTier]} border text-xs capitalize`}>{newTier}</Badge>
              </div>
            )}
          </div>

          {earnedReward && (
            <div className="border border-amber-300 bg-amber-500/10 rounded-lg p-3 flex items-center gap-2">
              <Gift className="h-5 w-5 text-amber-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Reward unlocked!</p>
                <p className="text-xs text-muted-foreground">{earnedReward.label}</p>
              </div>
            </div>
          )}

          {stampsToAward === 0 && (
            <p className="text-sm text-muted-foreground text-center">Order total below ₱500 — no stamps earned.</p>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAward} disabled={awarding || stampsToAward === 0} className="gap-2">
            <Star className="h-4 w-4" /> Award {stampsToAward} stamps
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
