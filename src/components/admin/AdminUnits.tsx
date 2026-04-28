import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminUnits() {
  const qc = useQueryClient();

  const { data: units } = useQuery({
    queryKey: ["admin-units"],
    queryFn: async () => {
      const { data, error } = await supabase.from("units").select("*").order("label");
      if (error) throw error;
      return data;
    },
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUnit, setEditUnit] = useState<any>(null);
  const defaultForm = { value: "", label: "", example: "" };
  const [form, setForm] = useState(defaultForm);

  const openNew = () => { setEditUnit(null); setForm(defaultForm); setDialogOpen(true); };
  const openEdit = (u: any) => { setEditUnit(u); setForm({ value: u.value, label: u.label, example: u.example || "" }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.value.trim() || !form.label.trim()) {
      toast.error("Value and label are required");
      return;
    }

    const payload = { value: form.value.trim(), label: form.label.trim(), example: form.example.trim() || null };

    if (editUnit) {
      const { error } = await supabase.from("units").update(payload).eq("id", editUnit.id);
      if (error) return toast.error("Failed to update");
      toast.success("Unit updated");
    } else {
      const { error } = await supabase.from("units").insert(payload);
      if (error) return toast.error("Failed to create");
      toast.success("Unit created");
    }

    qc.invalidateQueries({ queryKey: ["admin-units"] });
    setDialogOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this unit?")) return;
    const { error } = await supabase.from("units").delete().eq("id", id);
    if (error) return toast.error("Failed to delete");
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-units"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Units ({units?.length || 0})</h2>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Add Unit
        </Button>
      </div>

      <div className="space-y-2">
        {units?.map((u) => (
          <Card key={u.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{u.label} <span className="text-muted-foreground text-sm">({u.value})</span></p>
                {u.example && <p className="text-xs text-muted-foreground">{u.example}</p>}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(u)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(u.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!units || units.length === 0) && (
          <p className="text-center py-8 text-muted-foreground">No units yet.</p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editUnit ? "Edit Unit" : "Add Unit"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Value (short code)</Label><Input value={form.value} onChange={(e) => setForm(f => ({ ...f, value: e.target.value }))} placeholder="e.g., kg" /></div>
            <div><Label>Label</Label><Input value={form.label} onChange={(e) => setForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g., Kilogram" /></div>
            <div><Label>Example usage</Label><Input value={form.example} onChange={(e) => setForm(f => ({ ...f, example: e.target.value }))} placeholder="e.g., Meats, Seafood" /></div>
            <Button onClick={handleSave} className="w-full">{editUnit ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
