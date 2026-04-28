import { supabase } from "@/integrations/supabase/client";
import type { DateRange } from "./date-presets";

const PAGE_SIZE = 1000;

// Paginated full fetch of orders within an optional date range
export async function fetchAllOrders(range: DateRange) {
  const all: any[] = [];
  let from = 0;
  while (true) {
    let q = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (range.from) q = q.gte("created_at", range.from.toISOString());
    if (range.to) q = q.lte("created_at", range.to.toISOString());
    const { data, error } = await q;
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

export async function fetchAllProducts() {
  const all: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

export async function fetchAllLoyaltyCustomers() {
  const all: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("loyalty_customers")
      .select("*")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

export async function fetchLoyaltyStampLog(range: DateRange) {
  const all: any[] = [];
  let from = 0;
  while (true) {
    let q = supabase
      .from("loyalty_stamp_log")
      .select("*")
      .range(from, from + PAGE_SIZE - 1);
    if (range.from) q = q.gte("created_at", range.from.toISOString());
    if (range.to) q = q.lte("created_at", range.to.toISOString());
    const { data, error } = await q;
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

export async function fetchLoyaltyRewards(range: DateRange) {
  const all: any[] = [];
  let from = 0;
  while (true) {
    let q = supabase
      .from("loyalty_rewards")
      .select("*")
      .range(from, from + PAGE_SIZE - 1);
    if (range.from) q = q.gte("created_at", range.from.toISOString());
    if (range.to) q = q.lte("created_at", range.to.toISOString());
    const { data, error } = await q;
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}
