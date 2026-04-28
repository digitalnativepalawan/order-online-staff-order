ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_passkey text NOT NULL DEFAULT '5309',
  ADD COLUMN IF NOT EXISTS currency_code text NOT NULL DEFAULT 'PHP',
  ADD COLUMN IF NOT EXISTS primary_color text NOT NULL DEFAULT '#f97316';