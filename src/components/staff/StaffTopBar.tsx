import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutGrid, ChefHat, CreditCard, UtensilsCrossed } from "lucide-react";
import { getStaffSession, staffSignOut, hasStaffRole } from "@/lib/staff-auth";

export default function StaffTopBar() {
  const session = getStaffSession();
  const navigate = useNavigate();

  const logout = () => {
    staffSignOut();
    navigate("/staff", { replace: true });
  };

  if (!session) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 gap-2">
        <Link to="/staff/tables" className="flex items-center gap-2 font-bold">
          <UtensilsCrossed className="h-5 w-5 text-primary" />
          <span>Staff POS</span>
        </Link>
        <nav className="hidden sm:flex items-center gap-1">
          {hasStaffRole(["waiter"]) && (
            <Link to="/staff/tables">
              <Button variant="ghost" size="sm" className="gap-1"><LayoutGrid className="h-4 w-4" />Tables</Button>
            </Link>
          )}
          {hasStaffRole(["kitchen"]) && (
            <Link to="/staff/kitchen">
              <Button variant="ghost" size="sm" className="gap-1"><ChefHat className="h-4 w-4" />Kitchen</Button>
            </Link>
          )}
          {hasStaffRole(["cashier"]) && (
            <Link to="/staff/tables">
              <Button variant="ghost" size="sm" className="gap-1"><CreditCard className="h-4 w-4" />Pay</Button>
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium leading-none">{session.name}</p>
            <p className="text-[11px] text-muted-foreground capitalize">{session.role}</p>
          </div>
          <Button variant="outline" size="icon" onClick={logout} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}