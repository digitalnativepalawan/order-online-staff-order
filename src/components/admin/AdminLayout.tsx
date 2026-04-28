import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  Menu,
  X,
  Sparkles,
  CreditCard,
  Globe,
  Star,
  Users,
  Mail,
  FileText,
  LogOut,
  UtensilsCrossed,
  ChefHat,
  PartyPopper,
} from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

const bottomNavItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { label: "Orders", icon: ShoppingCart, path: "/admin/orders" },
  { label: "Catering", icon: PartyPopper, path: "/admin/catering" },
  { label: "Products", icon: Package, path: "/admin/products" },
  { label: "Settings", icon: Settings, path: "/admin/settings" },
];

const allNavItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { label: "Orders", icon: ShoppingCart, path: "/admin/orders" },
  { label: "Products", icon: Package, path: "/admin/products" },
  { label: "Settings", icon: Settings, path: "/admin/settings" },
  { label: "Specials", icon: Sparkles, path: "/admin/specials" },
  { label: "Payments", icon: CreditCard, path: "/admin/payments" },
  { label: "Pages", icon: Globe, path: "/admin/pages" },
  { label: "Reviews", icon: Star, path: "/admin/reviews" },
  { label: "Newsletter", icon: Users, path: "/admin/newsletter" },
  { label: "Contacts", icon: Mail, path: "/admin/contacts" },
  { label: "Header/Footer", icon: FileText, path: "/admin/header-footer" },
  { label: "Categories", icon: Package, path: "/admin/categories" },
  { label: "Units", icon: UtensilsCrossed, path: "/admin/units" },
  { label: "Staff", icon: Users, path: "/admin/staff" },
  { label: "Kitchen", icon: ChefHat, path: "/staff/kitchen" },
  { label: "Catering", icon: PartyPopper, path: "/admin/catering" },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    sessionStorage.removeItem("admin_auth");
    window.location.href = "/admin";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 h-14 border-b border-border bg-card">
        <Link to="/admin/dashboard" className="flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5 text-primary" />
          <span className="font-bold">Mission Control</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
            <LogOut className="h-5 w-5" />
          </Button>

          {/* Mobile Menu Trigger */}
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <span className="font-bold">Navigation</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDrawerOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <nav className="p-2">
                {allNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setDrawerOpen(false)}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors",
                        isActive(item.path)
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-4 pb-20 md:pb-4">{children}</main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card md:hidden">
        <div className="flex h-16">
          {bottomNavItems.map((item) => (
            <Link key={item.path} to={item.path} className="flex-1">
              <div
                className={cn(
                  "flex flex-col items-center justify-center h-full gap-1 transition-colors",
                  isActive(item.path)
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
