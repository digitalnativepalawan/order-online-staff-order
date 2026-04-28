
-- Add missing columns to loyalty_rewards
ALTER TABLE public.loyalty_rewards ADD COLUMN IF NOT EXISTS customer_id uuid;
ALTER TABLE public.loyalty_rewards ADD COLUMN IF NOT EXISTS reward_type text;
ALTER TABLE public.loyalty_rewards ADD COLUMN IF NOT EXISTS status text DEFAULT 'unclaimed';
ALTER TABLE public.loyalty_rewards ADD COLUMN IF NOT EXISTS earned_at timestamptz DEFAULT now();

-- Add INSERT and UPDATE policies
CREATE POLICY "Public insert loyalty_rewards" ON public.loyalty_rewards FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public update loyalty_rewards" ON public.loyalty_rewards FOR UPDATE TO public USING (true);
