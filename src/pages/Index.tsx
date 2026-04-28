import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Sparkles } from "lucide-react";
import { useState, useMemo } from "react";

export default function Index() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("is_available", true).order("category").order("name");
      if (error) throw error;
      return data;
    },
  });

  const categories = useMemo(() => {
    if (!products) return ["All"];
    const cats = [...new Set(products.map(p => p.category))];
    return ["All", ...cats];
  }, [products]);

  const filtered = useMemo(() => {
    if (!products) return [];
    return products.filter(p => {
      const matchCat = activeCategory === "All" || p.category === activeCategory;
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, activeCategory, search]);

  const specials = filtered.filter(p => p.is_special);
  const regular = filtered.filter(p => !p.is_special);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Search & Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search menu..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-2 pb-2">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className="w-full md:w-auto md:shrink-0 justify-center text-center text-xs px-2 truncate"
              title={cat}
            >
              <span className="truncate">{cat}</span>
            </Button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 rounded-lg bg-secondary/50 animate-pulse" />
          ))}
        </div>
      )}

      {/* Specials */}
      {specials.length > 0 && (
        <section>
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" /> Today's Specials
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {specials.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Regular products */}
      {regular.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4">Menu</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {regular.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No products found</div>
      )}
    </div>
  );
}
