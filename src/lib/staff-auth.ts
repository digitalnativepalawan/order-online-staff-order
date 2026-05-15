import { supabase } from "@/integrations/supabase/client";

export type StaffRole = "waiter" | "kitchen" | "cashier" | "manager";

export interface StaffSession {
  id: string;
  name: string;
  role: StaffRole;
}

const KEY = "staff_session";

export async function staffSignIn(passkey: string): Promise<StaffSession | null> {
  const { data, error } = await supabase
    .from("staff_users")
    .select("id, name, role, is_active")
    .eq("passkey", passkey.trim())
    .eq("is_active", true)
    .maybeSingle();
  if (error || !data) return null;
  const session: StaffSession = { id: data.id, name: data.name, role: data.role as StaffRole };
  sessionStorage.setItem(KEY, JSON.stringify(session));
  return session;
}

export function getStaffSession(): StaffSession | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function staffSignOut() {
  sessionStorage.removeItem(KEY);
}

export function hasStaffRole(roles: StaffRole[]): boolean {
  const s = getStaffSession();
  if (!s) return false;
  if (s.role === "manager") return true;
  return roles.includes(s.role);
}