import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminTables() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [form, setForm] = useState({ table_number: 1, capacity: 4, is_available: true });

  const { data: tables } = useQuery({
    queryKey: ["admin-tables"],
    queryFn: async () => {
      const { data, error } = await supabase.from("restaurant_tables").select("*").order("table_number");
      if (error) throw error;
      return data;
    },
  });

  const openNew = () => {
    const next = (tables?.length ? Math.max(...tables.map((t: any) => t.table_number)) : 0) + 1;
    setEdit(null);
    setForm({ table_number: next, capacity: 4, is_available: true });
    setOpen(true);
  };

  const openEdit = (t: any) => {
    setEdit(t);
    setForm({ table_number: t.table_number, capacity: t.capacity ?? 4, is_available: t.is_available ?? true });
    setOpen(true);
  };

  const save = async () => {
    if (!form.table_number || form.table_number < 1) {
      toast.error("Table number must be at least 1");
      return;
    }
    if (edit) {
      const { error } = await supabase.from("restaurant_tables").update(form).eq("id", edit.id);
      if (error) return toast.error(error.message);
      toast.success("Updated");
    } else {
      const { error } = await supabase.from("restaurant_tables").insert(form);
      if (error) return toast.error(error.message);
      toast.success("Added");
    }
    qc.invalidateQueries({ queryKey: ["admin-tables"] });
    setOpen(false);
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this table?")) return;
    const { error } = await supabase.from("restaurant_tables").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-tables"] });
  };

  const bulkAdd = async () => {
    const n = parseInt(prompt("How many tables to add?", "5") || "0", 10);
    if (!n || n < 1) return;
    const start = (tables?.length ? Math.max(...tables.map((t: any) => t.table_number)) : 0) + 1;
    const rows = Array.from({ length: n }, (_, i) => ({
      table_number: start + i,
      capacity: 4,
      is_available: true,
    }));
    const { error } = await supabase.from("restaurant_tables").insert(rows);
    if (error) return toast.error(error.message);
    toast.success(`Added ${n} tables`);
    qc.invalidateQueries({ queryKey: ["admin-tables"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-xl font-bold">Restaurant Tables ({tables?.length || 0})</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={bulkAdd}>Bulk Add</Button>
          <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" />Add Table</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {tables?.map((t: any) => (
          <Card key={t.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-2xl font-bold">#{t.table_number}</div>
                  <div className="text-xs text-muted-foreground">Seats {t.capacity}</div>
                </div>
                {!t.is_available && <Badge variant="outline">Off</Badge>}
              </div>
              <div className="flex gap-1 justify-end">
                <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(t.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!tables || tables.length === 0) && (
          <p className="col-span-full text-center text-muted-foreground py-8">No tables yet. Click "Add Table" or "Bulk Add" to start.</p>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{edit ? "Edit Table" : "Add Table"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Table Number</Label>
              <Input
                type="number"
                min={1}
                value={form.table_number}
                onChange={(e) => setForm({ ...form, table_number: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Capacity (seats)</Label>
              <Input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Available</Label>
              <Switch checked={form.is_available} onCheckedChange={(v) => setForm({ ...form, is_available: v })} />
            </div>
            <Button onClick={save} className="w-full">{edit ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}