import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

type Role = "server" | "cashier" | "admin";
interface Staff {
  id: string;
  name: string;
  passkey: string;
  role: Role;
  is_active: boolean;
}

const emptyForm: Omit<Staff, "id"> = { name: "", passkey: "", role: "server", is_active: true };

export default function AdminStaff() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Staff | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<Staff, "id">>(emptyForm);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const { data: staff } = useQuery({
    queryKey: ["admin-staff"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_users")
        .select("id, name, passkey, role, is_active")
        .order("name");
      if (error) throw error;
      return data as Staff[];
    },
  });

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (s: Staff) => {
    setEditing(s);
    setForm({ name: s.name, passkey: s.passkey, role: s.role, is_active: s.is_active });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    if (!/^\d{4}$/.test(form.passkey)) return toast.error("Passkey must be 4 digits");

    if (editing) {
      const { error } = await supabase.from("staff_users").update(form).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Staff updated");
    } else {
      const { error } = await supabase.from("staff_users").insert(form);
      if (error) return toast.error(error.message);
      toast.success("Staff added");
    }
    qc.invalidateQueries({ queryKey: ["admin-staff"] });
    qc.invalidateQueries({ queryKey: ["staff-users-list"] });
    setOpen(false);
  };

  const toggleActive = async (s: Staff) => {
    const { error } = await supabase
      .from("staff_users")
      .update({ is_active: !s.is_active })
      .eq("id", s.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-staff"] });
  };

  const remove = async (s: Staff) => {
    if (!confirm(`Delete staff member "${s.name}"?`)) return;
    const { error } = await supabase.from("staff_users").delete().eq("id", s.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-staff"] });
    qc.invalidateQueries({ queryKey: ["staff-users-list"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Staff Management ({staff?.length ?? 0})</h2>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4" /> Add Staff
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(staff ?? []).map((s) => (
          <Card key={s.id} className="p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold">{s.name}</div>
                <Badge variant="outline" className="text-xs capitalize mt-1">{s.role}</Badge>
              </div>
              <Switch checked={s.is_active} onCheckedChange={() => toggleActive(s)} />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Passkey:</span>
              <code className="font-mono">{revealed[s.id] ? s.passkey : "••••"}</code>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => setRevealed((r) => ({ ...r, [s.id]: !r[s.id] }))}
              >
                {revealed[s.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(s)}>
                <Pencil className="h-3 w-3" /> Edit
              </Button>
              <Button size="sm" variant="outline" className="text-destructive" onClick={() => remove(s)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Staff" : "Add Staff"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>4-digit Passkey</Label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={form.passkey}
                onChange={(e) => setForm({ ...form, passkey: e.target.value.replace(/\D/g, "").slice(0, 4) })}
              />
            </div>
            <div>
              <Label>Role</Label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="server">Server</option>
                <option value="cashier">Cashier</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
              <Label className="cursor-pointer">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
