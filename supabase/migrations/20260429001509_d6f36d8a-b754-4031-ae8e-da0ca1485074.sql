ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS background_color text NOT NULL DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS text_color text NOT NULL DEFAULT '#0f172a',
  ADD COLUMN IF NOT EXISTS accent_color text NOT NULL DEFAULT '#eab308',
  ADD COLUMN IF NOT EXISTS heading_font text NOT NULL DEFAULT 'Plus Jakarta Sans',
  ADD COLUMN IF NOT EXISTS body_font text NOT NULL DEFAULT 'Plus Jakarta Sans',
  ADD COLUMN IF NOT EXISTS color_scheme_name text NOT NULL DEFAULT 'Tropical Sunset';