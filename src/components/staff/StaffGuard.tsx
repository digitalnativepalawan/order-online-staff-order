import { Navigate } from "react-router-dom";
import { getStaffSession, hasStaffRole, type StaffRole } from "@/lib/staff-auth";

interface Props {
  children: React.ReactNode;
  roles?: StaffRole[];
}

export default function StaffGuard({ children, roles }: Props) {
  const session = getStaffSession();
  if (!session) return <Navigate to="/staff" replace />;
  if (roles && roles.length > 0 && !hasStaffRole(roles)) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">
          Your role ({session.role}) cannot access this screen.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}