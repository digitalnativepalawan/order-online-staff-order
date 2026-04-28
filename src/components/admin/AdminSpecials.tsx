import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Upload, Image } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function AdminSpecials() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: specials } = useQuery({
    queryKey: ["admin-specials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("specials").select("*").order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, name");
      if (error) throw error;
      return data;
    },
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const defaultForm = {
    title: "", description: "", special_type: "daily", discount_percent: 0,
    is_active: true, image_url: "", start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    products_included: [] as string[],
  };
  const [form, setForm] = useState(defaultForm);

  const openNew = () => { setEdit(null); setForm(defaultForm); setDialogOpen(true); };
  const openEdit = (s: any) => {
    setEdit(s);
    setForm({
      title: s.title, description: s.description || "", special_type: s.special_type,
      discount_percent: s.discount_percent || 0, is_active: s.is_active,
      image_url: s.image_url || "",
      start_date: s.start_date ? new Date(s.start_date).toISOString().slice(0, 10) : "",
      end_date: s.end_date ? new Date(s.end_date).toISOString().slice(0, 10) : "",
      products_included: (s.products_included as string[]) || [],
    });
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
    const { error } = await supabase.storage.from("specials").upload(fileName, file);
    if (error) { toast.error("Upload failed"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("specials").getPublicUrl(fileName);
    setForm(f => ({ ...f, image_url: urlData.publicUrl }));
    setUploading(false);
    toast.success("Image uploaded");
  };

  const toggleProduct = (productId: string) => {
    setForm(f => ({
      ...f,
      products_included: f.products_included.includes(productId)
        ? f.products_included.filter(id => id !== productId)
        : [...f.products_included, productId],
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    const payload = {
      title: form.title, description: form.description, special_type: form.special_type,
      discount_percent: form.discount_percent || null,
      is_active: form.is_active, image_url: form.image_url || null,
      start_date: form.start_date ? new Date(form.start_date).toISOString() : new Date().toISOString(),
      end_date: form.end_date ? new Date(form.end_date).toISOString() : new Date(Date.now() + 7 * 86400000).toISOString(),
      products_included: form.products_included,
    };
    if (edit) {
      await supabase.from("specials").update(payload).eq("id", edit.id);
      toast.success("Updated");
    } else {
      await supabase.from("specials").insert(payload);
      toast.success("Created");
    }
    qc.invalidateQueries({ queryKey: ["admin-specials"] });
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this special?")) return;
    await supabase.from("specials").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-specials"] });
    toast.success("Deleted");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Specials</h2>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Add Special</Button>
      </div>
      {specials?.map(s => (
        <Card key={s.id}>
          <CardContent className="p-4 flex flex-wrap items-center gap-3">
            {s.image_url && <img src={s.image_url} alt={s.title} className="w-12 h-12 rounded object-cover shrink-0" />}
            <div className="flex-1 min-w-[150px]">
              <p className="font-medium">{s.title}</p>
              <p className="text-xs text-muted-foreground">
                {s.special_type} · {s.discount_percent}% off · {s.is_active ? "Active" : "Inactive"}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(s.start_date).toLocaleDateString()} – {new Date(s.end_date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{edit ? "Edit Special" : "New Special"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div><Label>Type</Label>
              <Select value={form.special_type} onValueChange={v => setForm(f => ({ ...f, special_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="holiday">Holiday</SelectItem>
                  <SelectItem value="flash">Flash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Discount %</Label><Input type="number" value={form.discount_percent} onChange={e => setForm(f => ({ ...f, discount_percent: +e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
              <div><Label>End Date</Label><Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} /></div>
            </div>

            <div>
              <Label>Image</Label>
              <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
              <div className="flex items-center gap-2 mt-1">
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-2">
                  <Upload className="h-4 w-4" /> {uploading ? "Uploading..." : "Upload Image"}
                </Button>
                {form.image_url && <img src={form.image_url} alt="Preview" className="w-12 h-12 rounded object-cover" />}
              </div>
            </div>

            <div>
              <Label>Products Included</Label>
              <div className="max-h-40 overflow-y-auto border rounded-md p-2 mt-1 space-y-1">
                {products?.map(p => (
                  <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-secondary/50 p-1 rounded">
                    <input type="checkbox" checked={form.products_included.includes(p.id)} onChange={() => toggleProduct(p.id)} className="rounded" />
                    {p.name}
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{form.products_included.length} selected</p>
            </div>

            <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} /><Label>Active</Label></div>

            <Button onClick={handleSave} className="w-full">{edit ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
