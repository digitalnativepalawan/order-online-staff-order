import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutGrid, ChefHat } from "lucide-react";
import { clearStaffSession, getStaffSession } from "@/lib/staff-auth";

export default function StaffTopBar() {
  const navigate = useNavigate();
  const session = getStaffSession();
  const handleLogout = () => {
    clearStaffSession();
    navigate("/staff", { replace: true });
  };
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b border-border bg-card">
      <Link to="/staff/tables" className="flex items-center gap-2 font-bold">
        <LayoutGrid className="h-5 w-5 text-primary" />
        <span>POS</span>
      </Link>
      <div className="flex items-center gap-2">
        <Link to="/staff/tables">
          <Button variant="ghost" size="sm" className="gap-1">
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Tables</span>
          </Button>
        </Link>
        <Link to="/staff/kitchen">
          <Button variant="ghost" size="sm" className="gap-1">
            <ChefHat className="h-4 w-4" />
            <span className="hidden sm:inline">Kitchen</span>
          </Button>
        </Link>
        <span className="text-sm text-muted-foreground hidden md:inline ml-2">
          {session?.name} · {session?.role}
        </span>
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
