import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";

export default function AdminPayments() {
  const qc = useQueryClient();
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  const { data: methods } = useQuery({
    queryKey: ["all-payment-methods"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payment_methods").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const toggle = async (id: number, val: boolean) => {
    await supabase.from("payment_methods").update({ is_enabled: val }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["all-payment-methods"] });
    qc.invalidateQueries({ queryKey: ["payment-methods"] });
  };

  const handleQRUpload = async (id: number, file: File) => {
    setUploadingId(id);
    const ext = file.name.split(".").pop();
    const fileName = `qr-${id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(fileName, file);
    if (error) { toast.error("Upload failed"); setUploadingId(null); return; }
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
    await supabase.from("payment_methods").update({ qr_code_url: urlData.publicUrl }).eq("id", id);
    toast.success("QR code uploaded");
    qc.invalidateQueries({ queryKey: ["all-payment-methods"] });
    qc.invalidateQueries({ queryKey: ["payment-methods"] });
    setUploadingId(null);
  };

  const removeQR = async (id: number) => {
    await supabase.from("payment_methods").update({ qr_code_url: null }).eq("id", id);
    toast.success("QR code removed");
    qc.invalidateQueries({ queryKey: ["all-payment-methods"] });
    qc.invalidateQueries({ queryKey: ["payment-methods"] });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Payment Methods</h2>
      {methods?.map(m => (
        <Card key={m.id}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">{m.method_name}</span>
              <Switch checked={m.is_enabled} onCheckedChange={v => toggle(m.id, v)} />
            </div>
            <div>
              <Label className="text-xs">QR Code</Label>
              <div className="flex items-center gap-2 mt-1">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleQRUpload(m.id, file);
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" className="gap-1 pointer-events-none" disabled={uploadingId === m.id}>
                    <Upload className="h-3 w-3" /> {uploadingId === m.id ? "Uploading..." : "Upload QR"}
                  </Button>
                </label>
                {m.qr_code_url && (
                  <>
                    <img src={m.qr_code_url} alt="QR" className="w-12 h-12 rounded object-cover" />
                    <Button variant="ghost" size="sm" className="text-destructive text-xs" onClick={() => removeQR(m.id)}>Remove</Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
