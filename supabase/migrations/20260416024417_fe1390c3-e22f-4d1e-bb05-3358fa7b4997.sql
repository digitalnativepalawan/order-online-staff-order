
-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  cost_of_goods NUMERIC NOT NULL DEFAULT 0,
  price NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'piece',
  inventory INTEGER NOT NULL DEFAULT 0,
  inventory_min_threshold INTEGER NOT NULL DEFAULT 5,
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_special BOOLEAN NOT NULL DEFAULT false,
  special_price NUMERIC,
  special_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id TEXT NOT NULL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  delivery_type TEXT NOT NULL DEFAULT 'pickup',
  delivery_address TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  profit NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  order_status TEXT NOT NULL DEFAULT 'pending',
  whatsapp_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Create payment_methods table
CREATE TABLE public.payment_methods (
  id SERIAL PRIMARY KEY,
  method_name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  qr_code_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0
);

-- Create business_settings table (single row)
CREATE TABLE public.business_settings (
  id INTEGER NOT NULL DEFAULT 1 PRIMARY KEY CHECK (id = 1),
  business_name TEXT NOT NULL DEFAULT 'My Food Business',
  business_phone TEXT NOT NULL DEFAULT '',
  business_email TEXT NOT NULL DEFAULT '',
  business_address TEXT NOT NULL DEFAULT '',
  google_maps_url TEXT,
  copyright_text TEXT NOT NULL DEFAULT '© 2025 My Food Business',
  currency_symbol TEXT NOT NULL DEFAULT '₱',
  whatsapp_business_number TEXT,
  logo_url TEXT,
  favicon_url TEXT
);

-- Create header_settings table (single row)
CREATE TABLE public.header_settings (
  id INTEGER NOT NULL DEFAULT 1 PRIMARY KEY CHECK (id = 1),
  show_logo BOOLEAN NOT NULL DEFAULT true,
  show_cart_icon BOOLEAN NOT NULL DEFAULT true,
  show_admin_icon BOOLEAN NOT NULL DEFAULT true,
  show_theme_toggle BOOLEAN NOT NULL DEFAULT true,
  header_background_color TEXT NOT NULL DEFAULT '#0f172a',
  header_text_color TEXT NOT NULL DEFAULT '#ffffff'
);

-- Create footer_settings table (single row)
CREATE TABLE public.footer_settings (
  id INTEGER NOT NULL DEFAULT 1 PRIMARY KEY CHECK (id = 1),
  show_social_icons BOOLEAN NOT NULL DEFAULT true,
  show_contact_info BOOLEAN NOT NULL DEFAULT true,
  show_newsletter BOOLEAN NOT NULL DEFAULT true,
  footer_background_color TEXT NOT NULL DEFAULT '#1e293b',
  footer_text_color TEXT NOT NULL DEFAULT '#94a3b8',
  copyright_text TEXT NOT NULL DEFAULT '© 2025 My Food Business. All rights reserved.'
);

-- Create social_media_links table
CREATE TABLE public.social_media_links (
  id SERIAL PRIMARY KEY,
  platform_name TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0
);

-- Create website_pages table
CREATE TABLE public.website_pages (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT
);

-- Create content_sections table
CREATE TABLE public.content_sections (
  id SERIAL PRIMARY KEY,
  page_slug TEXT NOT NULL,
  section_type TEXT NOT NULL,
  title TEXT,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create testimonials table
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_image TEXT,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create newsletter_subscribers table
CREATE TABLE public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create contact_form_submissions table
CREATE TABLE public.contact_form_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false
);

-- Create specials table
CREATE TABLE public.specials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  special_type TEXT NOT NULL DEFAULT 'daily',
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ NOT NULL DEFAULT now() + interval '7 days',
  discount_percent NUMERIC,
  products_included JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT
);

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.header_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.footer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specials ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Anyone can read products" ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can read payment_methods" ON public.payment_methods FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can read business_settings" ON public.business_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can read header_settings" ON public.header_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can read footer_settings" ON public.footer_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can read social_media_links" ON public.social_media_links FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can read website_pages" ON public.website_pages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can read content_sections" ON public.content_sections FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can read testimonials" ON public.testimonials FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can read specials" ON public.specials FOR SELECT TO anon, authenticated USING (true);

-- Public write policies (admin uses app-level passkey, no auth)
CREATE POLICY "Anyone can insert orders" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update orders" ON public.orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can read orders" ON public.orders FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can delete orders" ON public.orders FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "Anyone can insert products" ON public.products FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update products" ON public.products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete products" ON public.products FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "Anyone can insert payment_methods" ON public.payment_methods FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update payment_methods" ON public.payment_methods FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete payment_methods" ON public.payment_methods FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "Anyone can update business_settings" ON public.business_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can insert business_settings" ON public.business_settings FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can update header_settings" ON public.header_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can insert header_settings" ON public.header_settings FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can update footer_settings" ON public.footer_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can insert footer_settings" ON public.footer_settings FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can insert social_media_links" ON public.social_media_links FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update social_media_links" ON public.social_media_links FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete social_media_links" ON public.social_media_links FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "Anyone can update website_pages" ON public.website_pages FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can insert website_pages" ON public.website_pages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can delete website_pages" ON public.website_pages FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "Anyone can insert content_sections" ON public.content_sections FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update content_sections" ON public.content_sections FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete content_sections" ON public.content_sections FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "Anyone can insert testimonials" ON public.testimonials FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update testimonials" ON public.testimonials FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete testimonials" ON public.testimonials FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "Anyone can insert newsletter" ON public.newsletter_subscribers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can read newsletter" ON public.newsletter_subscribers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can update newsletter" ON public.newsletter_subscribers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete newsletter" ON public.newsletter_subscribers FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "Anyone can insert contact" ON public.contact_form_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can read contact" ON public.contact_form_submissions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can update contact" ON public.contact_form_submissions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete contact" ON public.contact_form_submissions FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "Anyone can insert specials" ON public.specials FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update specials" ON public.specials FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete specials" ON public.specials FOR DELETE TO anon, authenticated USING (true);

-- Seed default data
INSERT INTO public.business_settings (id) VALUES (1);
INSERT INTO public.header_settings (id) VALUES (1);
INSERT INTO public.footer_settings (id) VALUES (1);

INSERT INTO public.payment_methods (method_name, is_enabled, display_order) VALUES
  ('Cash', true, 1),
  ('GCash', true, 2),
  ('PHQR', true, 3);

INSERT INTO public.social_media_links (platform_name, icon_name, url, display_order) VALUES
  ('Facebook', 'facebook', 'https://facebook.com', 1),
  ('Instagram', 'instagram', 'https://instagram.com', 2),
  ('Twitter', 'twitter', 'https://twitter.com', 3),
  ('TikTok', 'music', 'https://tiktok.com', 4);

INSERT INTO public.website_pages (slug, title, is_published, display_order) VALUES
  ('home', 'Home', true, 1),
  ('about', 'About Us', true, 2),
  ('services', 'Services', true, 3),
  ('specials', 'Specials', true, 4),
  ('blog', 'Blog', false, 5),
  ('faq', 'FAQ', true, 6),
  ('catering', 'Catering', true, 7),
  ('contact', 'Contact', true, 8),
  ('testimonials', 'Testimonials', true, 9),
  ('privacy-policy', 'Privacy Policy', true, 10);

INSERT INTO public.products (name, category, cost_of_goods, price, unit, inventory, image_url) VALUES
  ('Chicken Adobo', 'Main Dishes', 65, 120, 'plate', 50, null),
  ('Pork Sinigang', 'Main Dishes', 70, 130, 'bowl', 40, null),
  ('Pancit Canton', 'Noodles', 40, 85, 'plate', 60, null),
  ('Lumpia Shanghai', 'Appetizers', 30, 65, '10pcs', 80, null),
  ('Halo-Halo', 'Desserts', 35, 75, 'cup', 30, null),
  ('Mango Shake', 'Beverages', 20, 55, 'glass', 45, null),
  ('Iced Coffee', 'Beverages', 15, 45, 'glass', 100, null),
  ('Lechon Kawali', 'Main Dishes', 90, 160, 'plate', 25, null);
