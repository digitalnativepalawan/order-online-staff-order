-- Enable RLS and add permissive policies for POS tables
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_users_all_access" ON public.staff_users;
CREATE POLICY "staff_users_all_access" ON public.staff_users
  FOR ALL USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_users TO anon, authenticated;

ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "restaurant_tables_all_access" ON public.restaurant_tables;
CREATE POLICY "restaurant_tables_all_access" ON public.restaurant_tables
  FOR ALL USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_tables TO anon, authenticated;