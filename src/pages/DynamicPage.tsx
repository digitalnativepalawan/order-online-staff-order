import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, ChevronDown, ChevronUp, Sparkles, Clock, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function DynamicPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: page } = useQuery({
    queryKey: ["page", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("website_pages").select("*").eq("slug", slug!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: sections } = useQuery({
    queryKey: ["sections", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("content_sections").select("*").eq("page_slug", slug!).eq("is_active", true).order("display_order");
      if (error) throw error;
      return data;
    },
  });

  if (!page) return <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">Loading...</div>;

  // Render special page types
  if (slug === "testimonials") return <TestimonialsPage />;
  if (slug === "faq") return <FAQPage />;
  if (slug === "contact") return <ContactPage />;
  if (slug === "specials") return <SpecialsPage />;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
      <h1 className="text-3xl font-bold">{page.title}</h1>
      {sections?.map(section => (
        <ContentSection key={section.id} section={section} />
      ))}
      {(!sections || sections.length === 0) && (
        <p className="text-muted-foreground">Content coming soon...</p>
      )}
    </div>
  );
}

function ContentSection({ section }: { section: any }) {
  const content = section.content as any;
  switch (section.section_type) {
    case "hero":
      return (
        <div className="rounded-xl bg-gradient-to-r from-primary/20 to-primary/5 p-8 md:p-12 text-center space-y-4">
          <h2 className="text-3xl font-bold">{section.title || content?.title}</h2>
          {content?.subtitle && <p className="text-lg text-muted-foreground">{content.subtitle}</p>}
        </div>
      );
    case "text_block":
      return (
        <div className="prose dark:prose-invert max-w-none">
          <h3 className="text-xl font-semibold">{section.title}</h3>
          <p className="text-muted-foreground whitespace-pre-wrap">{content?.text || ""}</p>
        </div>
      );
    default:
      return section.title ? <Card><CardHeader><CardTitle>{section.title}</CardTitle></CardHeader></Card> : null;
  }
}

function TestimonialsPage() {
  const { data: reviews } = useQuery({
    queryKey: ["testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("testimonials").select("*").eq("is_approved", true).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const [form, setForm] = useState({ name: "", text: "", rating: 5 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.text) return toast.error("Please fill in all fields");
    const { error } = await supabase.from("testimonials").insert({ customer_name: form.name, review_text: form.text, rating: form.rating });
    if (error) toast.error("Failed to submit");
    else { toast.success("Review submitted for approval!"); setForm({ name: "", text: "", rating: 5 }); }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
      <h1 className="text-3xl font-bold">Testimonials</h1>
      <div className="grid gap-4">
        {reviews?.map(r => (
          <Card key={r.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => <Star key={i} className={`h-4 w-4 ${i < r.rating ? "text-primary fill-primary" : "text-muted"}`} />)}
              </div>
              <p className="text-sm mb-2">{r.review_text}</p>
              <p className="text-xs text-muted-foreground font-medium">— {r.customer_name}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>Leave a Review</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div>
              <Label>Rating</Label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button" onClick={() => setForm(f => ({ ...f, rating: n }))}>
                    <Star className={`h-6 w-6 ${n <= form.rating ? "text-primary fill-primary" : "text-muted"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div><Label>Review</Label><Textarea value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} rows={3} /></div>
            <Button type="submit">Submit Review</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function FAQPage() {
  const { data: sections } = useQuery({
    queryKey: ["sections", "faq"],
    queryFn: async () => {
      const { data, error } = await supabase.from("content_sections").select("*").eq("page_slug", "faq").eq("is_active", true).order("display_order");
      if (error) throw error;
      return data;
    },
  });
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-4">
      <h1 className="text-3xl font-bold mb-6">FAQ</h1>
      {sections?.map(s => {
        const content = s.content as any;
        return (
          <Card key={s.id} className="cursor-pointer" onClick={() => setOpenId(openId === s.id ? null : s.id)}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <p className="font-medium">{s.title || content?.question}</p>
                {openId === s.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
              {openId === s.id && <p className="mt-3 text-sm text-muted-foreground">{content?.answer || ""}</p>}
            </CardContent>
          </Card>
        );
      })}
      {(!sections || sections.length === 0) && <p className="text-muted-foreground">No FAQs yet.</p>}
    </div>
  );
}

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return toast.error("Fill in required fields");
    const { error } = await supabase.from("contact_form_submissions").insert(form);
    if (error) toast.error("Failed to submit");
    else { toast.success("Message sent!"); setForm({ name: "", email: "", phone: "", message: "" }); }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Contact Us</h1>
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div><Label>Message *</Label><Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={4} /></div>
            <Button type="submit" className="gap-2"><Send className="h-4 w-4" /> Send Message</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function SpecialsPage() {
  const { data: specials } = useQuery({
    queryKey: ["active-specials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("specials").select("*").eq("is_active", true).order("start_date");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2"><Sparkles className="h-7 w-7 text-primary" /> Specials</h1>
      {specials?.map(s => (
        <Card key={s.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold">{s.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(s.start_date).toLocaleDateString()} — {new Date(s.end_date).toLocaleDateString()}</span>
                </div>
              </div>
              {s.discount_percent && <span className="text-2xl font-bold text-primary">{s.discount_percent}% OFF</span>}
            </div>
          </CardContent>
        </Card>
      ))}
      {(!specials || specials.length === 0) && <p className="text-muted-foreground">No active specials right now. Check back soon!</p>}
    </div>
  );
}
