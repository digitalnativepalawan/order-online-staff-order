
-- Add columns to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_via text;

-- Create payment_settings table
CREATE TABLE public.payment_settings (
  id integer PRIMARY KEY DEFAULT 1,
  show_gcash_on_invoice boolean NOT NULL DEFAULT true,
  show_phqr_on_invoice boolean NOT NULL DEFAULT true,
  show_bank_on_invoice boolean NOT NULL DEFAULT true,
  gcash_qr_url text,
  phqr_qr_url text,
  bank_name text,
  bank_account_name text,
  bank_account_number text,
  bank_branch text,
  invoice_layout text NOT NULL DEFAULT 'show_all'
);

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read payment_settings" ON public.payment_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert payment_settings" ON public.payment_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update payment_settings" ON public.payment_settings FOR UPDATE USING (true) WITH CHECK (true);

-- Seed default row
INSERT INTO public.payment_settings (id) VALUES (1);
