import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const ROLES = ["waiter", "kitchen", "cashier", "manager"] as const;

export default function AdminStaff() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [form, setForm] = useState({ name: "", role: "waiter", passkey: "", is_active: true });

  const { data: staff } = useQuery({
    queryKey: ["admin-staff"],
    queryFn: async () => {
      const { data, error } = await supabase.from("staff_users").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const openNew = () => {
    setEdit(null);
    setForm({ name: "", role: "waiter", passkey: "", is_active: true });
    setOpen(true);
  };

  const openEdit = (s: any) => {
    setEdit(s);
    setForm({ name: s.name, role: s.role, passkey: s.passkey, is_active: s.is_active });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.passkey.trim()) {
      toast.error("Name and passkey required");
      return;
    }
    if (edit) {
      const { error } = await supabase.from("staff_users").update(form).eq("id", edit.id);
      if (error) return toast.error(error.message);
      toast.success("Updated");
    } else {
      const { error } = await supabase.from("staff_users").insert(form);
      if (error) return toast.error(error.message);
      toast.success("Added");
    }
    qc.invalidateQueries({ queryKey: ["admin-staff"] });
    setOpen(false);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this staff user?")) return;
    const { error } = await supabase.from("staff_users").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-staff"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Staff ({staff?.length || 0})</h2>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" />Add Staff</Button>
      </div>

      <div className="space-y-2">
        {staff?.map((s) => (
          <Card key={s.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium flex items-center gap-2">
                  {s.name}
                  {!s.is_active && <Badge variant="outline">Inactive</Badge>}
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                  {s.role} · passkey {s.passkey}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(s.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!staff || staff.length === 0) && (
          <p className="text-center text-muted-foreground py-8">No staff yet.</p>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{edit ? "Edit Staff" : "Add Staff"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Passkey</Label>
              <Input value={form.passkey} onChange={(e) => setForm({ ...form, passkey: e.target.value })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            </div>
            <Button onClick={save} className="w-full">{edit ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}