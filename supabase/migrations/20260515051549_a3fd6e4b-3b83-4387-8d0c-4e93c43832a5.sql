
ALTER TABLE public.staff_users DROP CONSTRAINT IF EXISTS staff_users_role_check;
ALTER TABLE public.staff_users ADD CONSTRAINT staff_users_role_check
  CHECK (role = ANY (ARRAY['waiter'::text, 'kitchen'::text, 'cashier'::text, 'manager'::text]));
