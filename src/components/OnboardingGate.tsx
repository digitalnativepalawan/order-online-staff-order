import { useQuery } from "@tanstack/react-query";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Redirects to /onboarding the first time the template is opened.
 * After the new business owner completes the wizard, this becomes a no-op.
 */
export default function OnboardingGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const { data, isLoading } = useQuery({
    queryKey: ["onboarding-status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_settings")
        .select("onboarding_completed")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return data?.onboarding_completed ?? false;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Allow the onboarding route itself through immediately
  if (location.pathname === "/onboarding") return <>{children}</>;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (data === false) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}