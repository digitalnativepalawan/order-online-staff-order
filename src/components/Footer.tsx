import { useFooterSettings, useBusinessSettings, useSocialLinks, useWebsitePages } from "@/hooks/use-settings";
import { Facebook, Instagram, Twitter, Music, Mail, Phone, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const iconMap: Record<string, any> = { facebook: Facebook, instagram: Instagram, twitter: Twitter, music: Music };

export default function Footer() {
  const { data: footer } = useFooterSettings();
  const { data: business } = useBusinessSettings();
  const { data: social } = useSocialLinks();
  const { data: pages } = useWebsitePages();
  const [email, setEmail] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    const { error } = await supabase.from("newsletter_subscribers").insert({ email });
    if (error) {
      if (error.code === "23505") toast.info("Already subscribed!");
      else toast.error("Failed to subscribe");
    } else {
      toast.success("Subscribed!");
      setEmail("");
    }
  };

  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold mb-3">{business?.business_name || "FoodOrder"}</h3>
            {footer?.show_contact_info !== false && business && (
              <div className="space-y-2 text-sm text-muted-foreground">
                {business.business_phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4" />{business.business_phone}</p>}
                {business.business_email && <p className="flex items-center gap-2"><Mail className="h-4 w-4" />{business.business_email}</p>}
                {business.business_address && <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{business.business_address}</p>}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-3">Quick Links</h4>
            <div className="space-y-2 text-sm">
              <Link to="/" className="block text-muted-foreground hover:text-foreground">Order</Link>
              {pages?.filter(p => p.slug !== "home").map(p => (
                <Link key={p.slug} to={`/${p.slug}`} className="block text-muted-foreground hover:text-foreground">{p.title}</Link>
              ))}
            </div>
          </div>

          {/* Social */}
          {footer?.show_social_icons !== false && (
            <div>
              <h4 className="font-semibold mb-3">Follow Us</h4>
              <div className="flex gap-3">
                {social?.filter(s => s.is_enabled).map(s => {
                  const Icon = iconMap[s.icon_name] || Mail;
                  return (
                    <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors">
                      <Icon className="h-5 w-5" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Newsletter */}
          {footer?.show_newsletter !== false && (
            <div>
              <h4 className="font-semibold mb-3">Newsletter</h4>
              <p className="text-sm text-muted-foreground mb-3">Get updates on specials & new items</p>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <Input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="flex-1" />
                <Button type="submit" size="sm">Join</Button>
              </form>
            </div>
          )}
        </div>

        <div className="border-t border-border mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>{footer?.copyright_text || business?.copyright_text || "© 2025"}</p>
          {business?.google_maps_url && (
            <a href={business.google_maps_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground">
              <MapPin className="h-4 w-4" /> Find us on Maps
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
