import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useBusinessSettings() {
  return useQuery({
    queryKey: ["business-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("business_settings").select("*").eq("id", 1).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useHeaderSettings() {
  return useQuery({
    queryKey: ["header-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("header_settings").select("*").eq("id", 1).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useFooterSettings() {
  return useQuery({
    queryKey: ["footer-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("footer_settings").select("*").eq("id", 1).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useSocialLinks() {
  return useQuery({
    queryKey: ["social-links"],
    queryFn: async () => {
      const { data, error } = await supabase.from("social_media_links").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payment_methods").select("*").eq("is_enabled", true).order("display_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useWebsitePages() {
  return useQuery({
    queryKey: ["website-pages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("website_pages").select("*").eq("is_published", true).order("display_order");
      if (error) throw error;
      return data;
    },
  });
}

export function usePaymentSettings() {
  return useQuery({
    queryKey: ["payment-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payment_settings").select("*").eq("id", 1).single();
      if (error) throw error;
      return data;
    },
  });
}
