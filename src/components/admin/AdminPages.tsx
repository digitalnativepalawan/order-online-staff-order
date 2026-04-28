import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminPages() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [form, setForm] = useState({ title: "", slug: "", content: "", seo_title: "", seo_description: "", is_published: true });

  const { data: pages } = useQuery({
    queryKey: ["admin-pages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("website_pages").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const togglePublished = async (id: number, val: boolean) => {
    await supabase.from("website_pages").update({ is_published: val }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-pages"] });
    qc.invalidateQueries({ queryKey: ["website-pages"] });
    toast.success("Updated");
  };

  const openNew = () => {
    setEdit(null);
    setForm({ title: "", slug: "", content: "", seo_title: "", seo_description: "", is_published: true });
    setDialogOpen(true);
  };

  const openEdit = (p: any) => {
    setEdit(p);
    const bodyText = typeof p.content === "object" && p.content?.body ? p.content.body : "";
    setForm({
      title: p.title, slug: p.slug, content: bodyText,
      seo_title: p.seo_title || "", seo_description: p.seo_description || "",
      is_published: p.is_published,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    const slug = form.slug.trim() || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const payload = {
      title: form.title, slug,
      content: { body: form.content },
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
      is_published: form.is_published,
    };
    if (edit) {
      await supabase.from("website_pages").update(payload).eq("id", edit.id);
      toast.success("Updated");
    } else {
      const maxOrder = pages?.length ? Math.max(...pages.map(p => p.display_order)) + 1 : 0;
      await supabase.from("website_pages").insert({ ...payload, display_order: maxOrder });
      toast.success("Created");
    }
    qc.invalidateQueries({ queryKey: ["admin-pages"] });
    qc.invalidateQueries({ queryKey: ["website-pages"] });
    setDialogOpen(false);
  };

  const handleDelete = async (id: number, slug: string) => {
    if (slug === "home") return toast.error("Cannot delete home page");
    if (!confirm("Delete this page?")) return;
    await supabase.from("website_pages").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-pages"] });
    qc.invalidateQueries({ queryKey: ["website-pages"] });
    toast.success("Deleted");
  };

  const reorder = async (id: number, direction: "up" | "down") => {
    if (!pages) return;
    const idx = pages.findIndex(p => p.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= pages.length) return;
    const a = pages[idx], b = pages[swapIdx];
    await supabase.from("website_pages").update({ display_order: b.display_order }).eq("id", a.id);
    await supabase.from("website_pages").update({ display_order: a.display_order }).eq("id", b.id);
    qc.invalidateQueries({ queryKey: ["admin-pages"] });
    qc.invalidateQueries({ queryKey: ["website-pages"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Website Pages</h2>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Add Page</Button>
      </div>
      {pages?.map((p, i) => (
        <Card key={p.id}>
          <CardContent className="p-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-0.5">
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => reorder(p.id, "up")} disabled={i === 0}><ArrowUp className="h-3 w-3" /></Button>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => reorder(p.id, "down")} disabled={i === (pages?.length || 0) - 1}><ArrowDown className="h-3 w-3" /></Button>
              </div>
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="text-xs text-muted-foreground">/{p.slug}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(p.id, p.slug)} disabled={p.slug === "home"}><Trash2 className="h-4 w-4" /></Button>
              <Switch checked={p.is_published} onCheckedChange={v => togglePublished(p.id, v)} disabled={p.slug === "home"} />
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{edit ? "Edit Page" : "New Page"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="auto-generated" /></div>
            <div><Label>Content</Label><Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={8} placeholder="Page content..." /></div>
            <div><Label>SEO Title</Label><Input value={form.seo_title} onChange={e => setForm(f => ({ ...f, seo_title: e.target.value }))} /></div>
            <div><Label>SEO Description</Label><Input value={form.seo_description} onChange={e => setForm(f => ({ ...f, seo_description: e.target.value }))} /></div>
            <div className="flex items-center gap-2"><Switch checked={form.is_published} onCheckedChange={v => setForm(f => ({ ...f, is_published: v }))} /><Label>Published</Label></div>
            <Button onClick={handleSave} className="w-full">{edit ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
