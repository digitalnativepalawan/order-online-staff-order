import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getStaffSession } from "@/lib/staff-auth";

export default function StaffGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [session] = useState(getStaffSession());
  useEffect(() => {}, []);
  if (!session) return <Navigate to="/staff" replace state={{ from: location }} />;
  return <>{children}</>;
}
