import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function AdminNewsletter() {
  const { data: subs } = useQuery({
    queryKey: ["admin-newsletter"],
    queryFn: async () => {
      const { data, error } = await supabase.from("newsletter_subscribers").select("*").order("subscribed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const exportCSV = () => {
    if (!subs) return;
    const csv = "Email,Subscribed At,Active\n" + subs.map(s => `${s.email},${s.subscribed_at},${s.is_active}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "subscribers.csv"; a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Newsletter ({subs?.length || 0})</h2>
        <Button variant="outline" className="gap-2" onClick={exportCSV}><Download className="h-4 w-4" /> Export CSV</Button>
      </div>
      <Card>
        <CardContent className="p-4 space-y-2">
          {subs?.map(s => (
            <div key={s.id} className="flex justify-between text-sm p-2 rounded bg-secondary/30">
              <span>{s.email}</span>
              <span className="text-xs text-muted-foreground">{new Date(s.subscribed_at).toLocaleDateString()}</span>
            </div>
          ))}
          {(!subs || subs.length === 0) && <p className="text-sm text-muted-foreground">No subscribers yet</p>}
        </CardContent>
      </Card>
    </div>
  );
}
