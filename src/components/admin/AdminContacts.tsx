import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, MailOpen, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminContacts() {
  const qc = useQueryClient();
  const { data: contacts } = useQuery({
    queryKey: ["admin-contacts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contact_form_submissions").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const toggleRead = async (id: string, val: boolean) => {
    await supabase.from("contact_form_submissions").update({ is_read: val }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-contacts"] });
  };

  const remove = async (id: string) => {
    await supabase.from("contact_form_submissions").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-contacts"] });
    toast.success("Deleted");
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Contact Submissions ({contacts?.length || 0})</h2>
      {contacts?.map(c => (
        <Card key={c.id} className={c.is_read ? "opacity-60" : ""}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{c.name}</span>
                  {!c.is_read && <Badge className="text-xs">New</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{c.email} {c.phone && `· ${c.phone}`}</p>
                <p className="text-sm mt-2">{c.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(c.created_at).toLocaleString()}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => toggleRead(c.id, !c.is_read)}>
                  {c.is_read ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
