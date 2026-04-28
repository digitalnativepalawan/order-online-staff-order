
-- Add invoice_number to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS invoice_number text;

-- Add COD and COP toggles and instructions to payment_settings
ALTER TABLE public.payment_settings 
  ADD COLUMN IF NOT EXISTS show_cod_on_invoice boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_cop_on_invoice boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS cod_instructions text DEFAULT 'Please prepare the exact amount for Cash on Delivery.',
  ADD COLUMN IF NOT EXISTS cop_instructions text DEFAULT 'Please pay at the counter upon pickup.';

-- Update existing row
UPDATE public.payment_settings SET 
  show_cod_on_invoice = true, 
  show_cop_on_invoice = true,
  cod_instructions = 'Please prepare the exact amount for Cash on Delivery.',
  cop_instructions = 'Please pay at the counter upon pickup.'
WHERE id = 1;

-- Create function to auto-generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  year_str TEXT;
  seq_num INT;
BEGIN
  year_str := to_char(now(), 'YYYY');
  SELECT COUNT(*) + 1 INTO seq_num FROM public.orders WHERE invoice_number IS NOT NULL AND invoice_number LIKE 'INV-' || year_str || '-%';
  NEW.invoice_number := 'INV-' || year_str || '-' || lpad(seq_num::text, 4, '0');
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER set_invoice_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL)
  EXECUTE FUNCTION public.generate_invoice_number();

-- Backfill existing orders with invoice numbers
DO $$
DECLARE
  r RECORD;
  counter INT := 0;
  year_str TEXT;
BEGIN
  year_str := to_char(now(), 'YYYY');
  FOR r IN SELECT id FROM public.orders WHERE invoice_number IS NULL ORDER BY created_at ASC
  LOOP
    counter := counter + 1;
    UPDATE public.orders SET invoice_number = 'INV-' || year_str || '-' || lpad(counter::text, 4, '0') WHERE id = r.id;
  END LOOP;
END $$;
