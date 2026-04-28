import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function AdminHeaderFooter() {
  const qc = useQueryClient();
  const { data: header } = useQuery({
    queryKey: ["header-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("header_settings").select("*").eq("id", 1).single();
      if (error) throw error;
      return data;
    },
  });
  const { data: footer } = useQuery({
    queryKey: ["footer-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("footer_settings").select("*").eq("id", 1).single();
      if (error) throw error;
      return data;
    },
  });

  const [hForm, setHForm] = useState<any>({});
  const [fForm, setFForm] = useState<any>({});
  useEffect(() => { if (header) setHForm(header); }, [header]);
  useEffect(() => { if (footer) setFForm(footer); }, [footer]);

  const saveHeader = async () => {
    const { id, ...rest } = hForm;
    await supabase.from("header_settings").update(rest).eq("id", 1);
    qc.invalidateQueries({ queryKey: ["header-settings"] });
    toast.success("Header saved");
  };

  const saveFooter = async () => {
    const { id, ...rest } = fForm;
    await supabase.from("footer_settings").update(rest).eq("id", 1);
    qc.invalidateQueries({ queryKey: ["footer-settings"] });
    toast.success("Footer saved");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Header Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3"><Switch checked={hForm.show_logo ?? true} onCheckedChange={v => setHForm((f: any) => ({ ...f, show_logo: v }))} /><Label>Show Logo</Label></div>
          <div className="flex items-center gap-3"><Switch checked={hForm.show_cart_icon ?? true} onCheckedChange={v => setHForm((f: any) => ({ ...f, show_cart_icon: v }))} /><Label>Show Cart Icon</Label></div>
          <div className="flex items-center gap-3"><Switch checked={hForm.show_admin_icon ?? true} onCheckedChange={v => setHForm((f: any) => ({ ...f, show_admin_icon: v }))} /><Label>Show Admin Icon</Label></div>
          <div className="flex items-center gap-3"><Switch checked={hForm.show_theme_toggle ?? true} onCheckedChange={v => setHForm((f: any) => ({ ...f, show_theme_toggle: v }))} /><Label>Show Theme Toggle</Label></div>
          <Button onClick={saveHeader}>Save Header</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Footer Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3"><Switch checked={fForm.show_social_icons ?? true} onCheckedChange={v => setFForm((f: any) => ({ ...f, show_social_icons: v }))} /><Label>Show Social Icons</Label></div>
          <div className="flex items-center gap-3"><Switch checked={fForm.show_contact_info ?? true} onCheckedChange={v => setFForm((f: any) => ({ ...f, show_contact_info: v }))} /><Label>Show Contact Info</Label></div>
          <div className="flex items-center gap-3"><Switch checked={fForm.show_newsletter ?? true} onCheckedChange={v => setFForm((f: any) => ({ ...f, show_newsletter: v }))} /><Label>Show Newsletter</Label></div>
          <div><Label>Copyright Text</Label><Input value={fForm.copyright_text || ""} onChange={e => setFForm((f: any) => ({ ...f, copyright_text: e.target.value }))} /></div>
          <Button onClick={saveFooter}>Save Footer</Button>
        </CardContent>
      </Card>
    </div>
  );
}
