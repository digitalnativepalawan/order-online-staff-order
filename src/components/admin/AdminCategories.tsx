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

export default function AdminCategories() {
  const qc = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;

      // Get product counts per category
      const { data: products } = await supabase.from("products").select("category");
      const counts: Record<string, number> = {};
      products?.forEach((p) => {
        counts[p.category] = (counts[p.category] || 0) + 1;
      });

      return data.map((cat) => ({ ...cat, productCount: counts[cat.name] || 0 }));
    },
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<any>(null);
  const [form, setForm] = useState({ name: "" });

  const openNew = () => {
    setEditCategory(null);
    setForm({ name: "" });
    setDialogOpen(true);
  };

  const openEdit = (cat: any) => {
    setEditCategory(cat);
    setForm({ name: cat.name });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    if (editCategory) {
      const { error } = await supabase
        .from("categories")
        .update({ name: form.name.trim() })
        .eq("id", editCategory.id);
      if (error) return toast.error("Failed to update");
      toast.success("Category updated");
    } else {
      const { error } = await supabase
        .from("categories")
        .insert({ name: form.name.trim() });
      if (error) return toast.error("Failed to create");
      toast.success("Category created");
    }

    qc.invalidateQueries({ queryKey: ["admin-categories"] });
    setDialogOpen(false);
  };

  const handleDelete = async (id: number, productCount: number) => {
    if (productCount > 0) {
      toast.error(`Cannot delete. ${productCount} products still use this category.`);
      return;
    }

    if (!confirm("Delete this category?")) return;

    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error("Failed to delete");
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Categories ({categories?.length || 0})</h2>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="space-y-2">
        {categories?.map((cat) => (
          <Card key={cat.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{cat.name}</p>
                <p className="text-xs text-muted-foreground">
                  {cat.productCount} products
                </p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => handleDelete(cat.id, cat.productCount)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!categories || categories.length === 0) && (
          <p className="text-center py-8 text-muted-foreground">
            No categories yet. Add your first category.
          </p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editCategory ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Category Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ name: e.target.value })}
                placeholder="e.g., Sausages"
              />
            </div>
            <Button onClick={handleSave} className="w-full">
              {editCategory ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
