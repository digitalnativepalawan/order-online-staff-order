import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Upload } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useNavVisibility } from "@/hooks/use-nav-visibility";

export default function AdminSettings() {
  const qc = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const gcashQrRef = useRef<HTMLInputElement>(null);
  const phqrQrRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { items: navItems, toggleItem } = useNavVisibility();

  const { data: settings } = useQuery({
    queryKey: ["business-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("business_settings").select("*").eq("id", 1).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: paymentSettings } = useQuery({
    queryKey: ["payment-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payment_settings").select("*").eq("id", 1).single();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState<any>({});
  const [psForm, setPsForm] = useState<any>({});
  useEffect(() => { if (settings) setForm(settings); }, [settings]);
  useEffect(() => { if (paymentSettings) setPsForm(paymentSettings); }, [paymentSettings]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("logos").upload(fileName, file, { upsert: true });
    if (error) { toast.error("Upload failed: " + error.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("logos").getPublicUrl(fileName);
    const logoUrl = urlData.publicUrl;
    await supabase.from("business_settings").update({ logo_url: logoUrl }).eq("id", 1);
    setForm((f: any) => ({ ...f, logo_url: logoUrl }));
    setUploading(false);
    toast.success("Logo uploaded and saved");
    qc.invalidateQueries({ queryKey: ["business-settings"] });
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "gcash_qr_url" | "phqr_qr_url") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${field}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("logos").upload(fileName, file, { upsert: true });
    if (error) { toast.error("Upload failed: " + error.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("logos").getPublicUrl(fileName);
    const updatePayload = field === "gcash_qr_url"
      ? { gcash_qr_url: urlData.publicUrl }
      : { phqr_qr_url: urlData.publicUrl };
    await supabase.from("payment_settings").update(updatePayload).eq("id", 1);
    setPsForm((f: any) => ({ ...f, [field]: urlData.publicUrl }));
    setUploading(false);
    toast.success("QR code uploaded");
    qc.invalidateQueries({ queryKey: ["payment-settings"] });
  };

  const handleSave = async () => {
    const { id, ...rest } = form;
    const { error } = await supabase.from("business_settings").update(rest).eq("id", 1);
    if (error) return toast.error("Failed to save");
    toast.success("Settings saved");
    qc.invalidateQueries({ queryKey: ["business-settings"] });
  };

  const handleSavePaymentSettings = async () => {
    const { id, ...rest } = psForm;
    const { error } = await supabase.from("payment_settings").update(rest).eq("id", 1);
    if (error) return toast.error("Failed to save payment settings");
    toast.success("Payment settings saved");
    qc.invalidateQueries({ queryKey: ["payment-settings"] });
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f: any) => ({ ...f, [key]: e.target.value }));

  const setPs = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setPsForm((f: any) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Business Info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Business Name</Label><Input value={form.business_name || ""} onChange={set("business_name")} /></div>
          <div><Label>Phone</Label><Input value={form.business_phone || ""} onChange={set("business_phone")} /></div>
          <div><Label>Email</Label><Input value={form.business_email || ""} onChange={set("business_email")} /></div>
          <div><Label>Address</Label><Input value={form.business_address || ""} onChange={set("business_address")} /></div>
          <div><Label>Currency Symbol</Label><Input value={form.currency_symbol || "₱"} onChange={set("currency_symbol")} /></div>
          <div><Label>Copyright Text</Label><Input value={form.copyright_text || ""} onChange={set("copyright_text")} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Logo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <input type="file" ref={logoInputRef} accept="image/jpeg,image/png,image/webp" onChange={handleLogoUpload} className="hidden" />
          <div className="flex items-center gap-4">
            {form.logo_url && <img src={form.logo_url} alt="Logo" className="w-16 h-16 rounded object-cover" />}
            <Button variant="outline" onClick={() => logoInputRef.current?.click()} disabled={uploading} className="gap-2">
              <Upload className="h-4 w-4" /> {uploading ? "Uploading..." : "Upload Logo"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Uploads to the logos bucket. Accepts JPG, PNG, WebP.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Social Links</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Facebook URL</Label><Input value={form.facebook_url || ""} onChange={set("facebook_url")} placeholder="https://facebook.com/..." /></div>
          <div><Label>Instagram URL</Label><Input value={form.instagram_url || ""} onChange={set("instagram_url")} placeholder="https://instagram.com/..." /></div>
          <div><Label>WhatsApp Business Number</Label><Input value={form.whatsapp_business_number || ""} onChange={set("whatsapp_business_number")} placeholder="+63 XXX XXX XXXX" /></div>
          <div><Label>Google Maps URL</Label><Input value={form.google_maps_url || ""} onChange={set("google_maps_url")} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>WhatsApp Message Templates</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">Available variables: {"{name}"}, {"{id}"}, {"{total}"}, {"{delivery_type}"}, {"{address}"}</p>
          <div>
            <Label>Confirmation Message</Label>
            <Textarea value={form.confirmation_whatsapp_template || ""} onChange={set("confirmation_whatsapp_template")} rows={3} />
          </div>
          <div>
            <Label>Ready Message</Label>
            <Textarea value={form.ready_whatsapp_template || ""} onChange={set("ready_whatsapp_template")} rows={3} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Email Templates</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">Available variables: {"{name}"}, {"{id}"}, {"{total}"}, {"{delivery_type}"}, {"{address}"}</p>
          <div>
            <Label>Confirmation Email</Label>
            <Textarea value={form.confirmation_email_template || ""} onChange={set("confirmation_email_template")} rows={3} />
          </div>
          <div>
            <Label>Ready Email</Label>
            <Textarea value={form.ready_email_template || ""} onChange={set("ready_email_template")} rows={3} />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} size="lg" className="w-full">Save All Settings</Button>

      {/* Navigation Visibility */}
      <Card>
        <CardHeader><CardTitle>Navigation</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">These pages exist but are hidden from the main navigation. Toggle to make them visible to customers.</p>
          {navItems.map(item => (
            <div key={item.key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.path}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{item.visible ? "Visible" : "Hidden"}</span>
                <Switch checked={item.visible} onCheckedChange={() => toggleItem(item.key)} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Invoice Payment Settings */}
      <Card>
        <CardHeader><CardTitle>Invoice Payment Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Show on Invoice</Label>
            {[
              { key: "show_gcash_on_invoice", label: "GCash QR Code" },
              { key: "show_phqr_on_invoice", label: "PHQR QR Code" },
              { key: "show_bank_on_invoice", label: "Bank Transfer Details" },
              { key: "show_cod_on_invoice", label: "Cash on Delivery Instructions" },
              { key: "show_cop_on_invoice", label: "Cash on Pickup Instructions" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <Checkbox checked={psForm[key] ?? true} onCheckedChange={(v) => setPsForm((f: any) => ({ ...f, [key]: !!v }))} />
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Invoice Layout</Label>
            <div className="flex items-center gap-2">
              <input type="radio" name="layout" checked={psForm.invoice_layout === "show_all"} onChange={() => setPsForm((f: any) => ({ ...f, invoice_layout: "show_all" }))} />
              <span className="text-sm">Show all payment options</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="radio" name="layout" checked={psForm.invoice_layout === "show_selected"} onChange={() => setPsForm((f: any) => ({ ...f, invoice_layout: "show_selected" }))} />
              <span className="text-sm">Show only order's payment method</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">GCash QR Code</Label>
            <input type="file" ref={gcashQrRef} accept="image/*" onChange={(e) => handleQrUpload(e, "gcash_qr_url")} className="hidden" />
            <div className="flex items-center gap-3">
              {psForm.gcash_qr_url && <img src={psForm.gcash_qr_url} alt="GCash QR" className="w-20 h-20 rounded border object-cover" />}
              <Button variant="outline" size="sm" onClick={() => gcashQrRef.current?.click()} disabled={uploading}>
                <Upload className="h-3 w-3 mr-1" /> Upload GCash QR
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">PHQR QR Code</Label>
            <input type="file" ref={phqrQrRef} accept="image/*" onChange={(e) => handleQrUpload(e, "phqr_qr_url")} className="hidden" />
            <div className="flex items-center gap-3">
              {psForm.phqr_qr_url && <img src={psForm.phqr_qr_url} alt="PHQR QR" className="w-20 h-20 rounded border object-cover" />}
              <Button variant="outline" size="sm" onClick={() => phqrQrRef.current?.click()} disabled={uploading}>
                <Upload className="h-3 w-3 mr-1" /> Upload PHQR QR
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Bank Transfer Details</Label>
            <div><Label>Bank Name</Label><Input value={psForm.bank_name || ""} onChange={setPs("bank_name")} /></div>
            <div><Label>Account Name</Label><Input value={psForm.bank_account_name || ""} onChange={setPs("bank_account_name")} /></div>
            <div><Label>Account Number</Label><Input value={psForm.bank_account_number || ""} onChange={setPs("bank_account_number")} /></div>
            <div><Label>Branch (optional)</Label><Input value={psForm.bank_branch || ""} onChange={setPs("bank_branch")} /></div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Cash Instructions</Label>
            <div><Label>Cash on Delivery Instructions</Label><Input value={psForm.cod_instructions || ""} onChange={setPs("cod_instructions")} /></div>
            <div><Label>Cash on Pickup Instructions</Label><Input value={psForm.cop_instructions || ""} onChange={setPs("cop_instructions")} /></div>
          </div>

          <Button onClick={handleSavePaymentSettings} className="w-full">Save Payment Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}
