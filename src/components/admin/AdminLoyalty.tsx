import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Users, Star, Gift, ChevronDown, ChevronUp, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { TIER_COLORS } from "@/lib/loyalty-utils";

export default function AdminLoyalty() {
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adjustModal, setAdjustModal] = useState<any>(null);
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [adjustNote, setAdjustNote] = useState("");

  const { data: customers } = useQuery({
    queryKey: ["loyalty-customers"],
    queryFn: async () => {
      const { data } = await supabase.from("loyalty_customers").select("*").order("lifetime_stamps", { ascending: false });
      return data || [];
    },
  });

  const { data: allRewards } = useQuery({
    queryKey: ["loyalty-rewards-all"],
    queryFn: async () => {
      const { data } = await supabase.from("loyalty_rewards").select("*").order("earned_at", { ascending: false });
      return data || [];
    },
  });

  const { data: allStampLogs } = useQuery({
    queryKey: ["loyalty-stamp-logs"],
    queryFn: async () => {
      const { data } = await supabase.from("loyalty_stamp_log").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const stampsThisMonth = useMemo(() => {
    if (!allStampLogs) return 0;
    return allStampLogs.filter(l => l.created_at && l.created_at >= monthStart).reduce((s, l) => s + (l.stamps_earned || 0), 0);
  }, [allStampLogs, monthStart]);

  const rewardsClaimedThisMonth = useMemo(() => {
    if (!allRewards) return 0;
    return allRewards.filter(r => r.claimed_at && r.claimed_at >= monthStart).length;
  }, [allRewards, monthStart]);

  const handleAdjust = async () => {
    if (!adjustModal || adjustAmount === 0) return;
    const cust = adjustModal;
    const newStamps = Math.max(0, (cust.stamp_count || 0) + adjustAmount);
    const newLifetime = Math.max(0, (cust.lifetime_stamps || 0) + (adjustAmount > 0 ? adjustAmount : 0));

    await supabase.from("loyalty_customers").update({
      stamp_count: newStamps,
      lifetime_stamps: newLifetime,
    }).eq("id", cust.id);

    if (adjustAmount > 0) {
      await supabase.from("loyalty_stamp_log").insert({
        customer_id: cust.id,
        stamps_earned: adjustAmount,
        invoice_number: `MANUAL: ${adjustNote || "Admin adjustment"}`,
        order_total: 0,
      });
    }

    qc.invalidateQueries({ queryKey: ["loyalty-customers"] });
    qc.invalidateQueries({ queryKey: ["loyalty-stamp-logs"] });
    toast.success(`Stamps adjusted by ${adjustAmount > 0 ? "+" : ""}${adjustAmount}`);
    setAdjustModal(null);
    setAdjustAmount(0);
    setAdjustNote("");
  };

  const customerRewards = (custId: string) => allRewards?.filter(r => r.customer_id === custId) || [];
  const customerLogs = (custId: string) => allStampLogs?.filter(l => l.customer_id === custId) || [];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Loyalty Program</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card><CardContent className="pt-4 flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div><p className="text-2xl font-bold">{customers?.length || 0}</p><p className="text-xs text-muted-foreground">Enrolled Customers</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3">
          <Star className="h-8 w-8 text-amber-500" />
          <div><p className="text-2xl font-bold">{stampsThisMonth}</p><p className="text-xs text-muted-foreground">Stamps This Month</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3">
          <Gift className="h-8 w-8 text-green-500" />
          <div><p className="text-2xl font-bold">{rewardsClaimedThisMonth}</p><p className="text-xs text-muted-foreground">Rewards Claimed</p></div>
        </CardContent></Card>
      </div>

      {customers?.map(c => {
        const isExpanded = expandedId === c.id;
        const rewards = customerRewards(c.id);
        const logs = customerLogs(c.id);
        return (
          <Card key={c.id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : c.id)}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{c.name || "Unknown"}</span>
                    <Badge className={`${TIER_COLORS[c.tier || "regular"]} border text-xs capitalize`}>{c.tier || "regular"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.phone} · {c.stamp_count || 0} stamps · {c.lifetime_stamps || 0} lifetime</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="text-xs" onClick={(e) => { e.stopPropagation(); setAdjustModal(c); }}>
                    <Plus className="h-3 w-3 mr-1" />Adjust
                  </Button>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-border pt-3 space-y-3">
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>Total orders: {c.total_orders || 0} · Total spent: ₱{Number(c.total_spent || 0).toFixed(2)}</p>
                    {c.last_order_at && <p>Last order: {new Date(c.last_order_at).toLocaleDateString()}</p>}
                  </div>

                  {rewards.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-1">Rewards</p>
                      {rewards.map(r => (
                        <div key={r.id} className="flex justify-between text-xs py-1 border-b border-border last:border-0">
                          <span className="capitalize">{r.reward_type?.replace("_", " ")} — <span className="font-mono">{r.reward_code}</span></span>
                          <Badge className={r.status === "claimed" ? "bg-green-500/15 text-green-600" : r.status === "unclaimed" ? "bg-amber-500/15 text-amber-600" : "bg-secondary text-foreground"} variant="outline">
                            {r.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {logs.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-1">Stamp History</p>
                      {logs.slice(0, 10).map(l => (
                        <div key={l.id} className="flex justify-between text-xs py-1 border-b border-border last:border-0">
                          <span>{l.invoice_number} · ₱{Number(l.order_total || 0).toFixed(2)}</span>
                          <span className="font-medium text-primary">+{l.stamps_earned}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {(!customers || customers.length === 0) && <p className="text-center text-muted-foreground py-8">No loyalty customers yet</p>}

      {/* Adjust Modal */}
      <Dialog open={!!adjustModal} onOpenChange={() => setAdjustModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adjust Stamps — {adjustModal?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Current stamps: {adjustModal?.stamp_count || 0}</p>
            <div className="flex items-center gap-3">
              <Button size="sm" variant="outline" onClick={() => setAdjustAmount(a => a - 1)}><Minus className="h-4 w-4" /></Button>
              <Input type="number" value={adjustAmount} onChange={e => setAdjustAmount(parseInt(e.target.value) || 0)} className="w-24 text-center" />
              <Button size="sm" variant="outline" onClick={() => setAdjustAmount(a => a + 1)}><Plus className="h-4 w-4" /></Button>
            </div>
            <div><Label>Note</Label><Input value={adjustNote} onChange={e => setAdjustNote(e.target.value)} placeholder="Reason for adjustment" /></div>
          </div>
          <DialogFooter>
            <Button onClick={handleAdjust} disabled={adjustAmount === 0}>Apply {adjustAmount > 0 ? `+${adjustAmount}` : adjustAmount}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
