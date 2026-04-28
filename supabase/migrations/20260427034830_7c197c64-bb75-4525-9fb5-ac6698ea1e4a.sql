-- Enable RLS and add policies for catering_orders
ALTER TABLE public.catering_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read catering_orders" ON public.catering_orders FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert catering_orders" ON public.catering_orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update catering_orders" ON public.catering_orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete catering_orders" ON public.catering_orders FOR DELETE TO anon, authenticated USING (true);

-- Enable realtime
ALTER TABLE public.catering_orders REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.catering_orders;