import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Check, X, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminTestimonials() {
  const qc = useQueryClient();
  const { data: reviews } = useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("testimonials").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const approve = async (id: string, val: boolean) => {
    await supabase.from("testimonials").update({ is_approved: val }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-testimonials"] });
    toast.success(val ? "Approved" : "Rejected");
  };

  const remove = async (id: string) => {
    await supabase.from("testimonials").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-testimonials"] });
    toast.success("Deleted");
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Testimonials ({reviews?.length || 0})</h2>
      {reviews?.map(r => (
        <Card key={r.id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex gap-1 mb-1">{[...Array(5)].map((_, i) => <Star key={i} className={`h-3 w-3 ${i < r.rating ? "text-primary fill-primary" : "text-muted"}`} />)}</div>
                <p className="text-sm">{r.review_text}</p>
                <p className="text-xs text-muted-foreground mt-1">— {r.customer_name} · {r.is_approved ? "✓ Approved" : "Pending"}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => approve(r.id, !r.is_approved)}>{r.is_approved ? <X className="h-4 w-4" /> : <Check className="h-4 w-4 text-green-500" />}</Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
