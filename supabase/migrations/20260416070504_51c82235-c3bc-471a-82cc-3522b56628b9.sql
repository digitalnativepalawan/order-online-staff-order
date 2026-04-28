
-- Orders table: add new tracking columns
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS whatsapp_ready_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_confirmation_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_ready_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS ready_at timestamp with time zone;

-- Rename whatsapp_sent to whatsapp_confirmation_sent
ALTER TABLE public.orders RENAME COLUMN whatsapp_sent TO whatsapp_confirmation_sent;

-- Business settings: add new columns
ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS facebook_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS instagram_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS confirmation_whatsapp_template text NOT NULL DEFAULT 'Hello {name}, your order #{id} has been CONFIRMED. Total: {total}. We will notify you when ready.',
  ADD COLUMN IF NOT EXISTS ready_whatsapp_template text NOT NULL DEFAULT 'Hello {name}, your order #{id} is READY for {delivery_type}. Please come to {address} or await delivery.',
  ADD COLUMN IF NOT EXISTS confirmation_email_template text NOT NULL DEFAULT 'Dear {name}, your order #{id} has been confirmed. Total: {total}. We will notify you when it is ready.',
  ADD COLUMN IF NOT EXISTS ready_email_template text NOT NULL DEFAULT 'Dear {name}, your order #{id} is now READY for {delivery_type}.';
