export type StaffRole = "server" | "cashier" | "admin";

export interface StaffSession {
  staff_id: string;
  name: string;
  role: StaffRole;
}

const KEY = "staff_session";

export function getStaffSession(): StaffSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StaffSession) : null;
  } catch {
    return null;
  }
}

export function setStaffSession(s: StaffSession) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function clearStaffSession() {
  localStorage.removeItem(KEY);
}
