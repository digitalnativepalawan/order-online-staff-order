import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import AdminLayout from "@/components/admin/AdminLayout";
import Index from "./pages/Index";
import Checkout from "./pages/Checkout";
import Admin from "./pages/Admin";
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminOrders from "./components/admin/AdminOrders";
import AdminProducts from "./components/admin/AdminProducts";
import AdminSettings from "./components/admin/AdminSettings";
import AdminSpecials from "./components/admin/AdminSpecials";
import AdminPayments from "./components/admin/AdminPayments";
import AdminPages from "./components/admin/AdminPages";
import AdminTestimonials from "./components/admin/AdminTestimonials";
import AdminNewsletter from "./components/admin/AdminNewsletter";
import AdminContacts from "./components/admin/AdminContacts";
import AdminHeaderFooter from "./components/admin/AdminHeaderFooter";
import AdminLoyalty from "./components/admin/AdminLoyalty";
import AdminCategories from "./components/admin/AdminCategories";
import AdminUnits from "./components/admin/AdminUnits";
import DynamicPage from "./pages/DynamicPage";
import FAQ from "./pages/FAQ";
import Invoice from "./pages/Invoice";
import TrackOrder from "./pages/TrackOrder";
import NotFound from "./pages/NotFound";
import Catering from "./pages/Catering";
import AdminCatering from "./components/admin/AdminCatering";
import Onboarding from "./pages/Onboarding";
import OnboardingGate from "./components/OnboardingGate";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <OnboardingGate>
            <div className="min-h-screen flex flex-col">
              <Header />
              <CartDrawer />
              <main className="flex-1">
                <Routes>
                  {/* Onboarding (one-time) */}
                  <Route path="/onboarding" element={<Onboarding />} />

                {/* User Routes */}
                <Route path="/" element={<Index />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/track" element={<TrackOrder />} />
                <Route path="/invoice/:orderId" element={<Invoice />} />
                <Route path="/catering" element={<Catering />} />

                <Route path="/:slug" element={<DynamicPage />} />

                {/* Admin Routes with Layout */}
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/dashboard" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
                <Route path="/admin/orders" element={<AdminLayout><AdminOrders /></AdminLayout>} />
                <Route path="/admin/products" element={<AdminLayout><AdminProducts /></AdminLayout>} />
                <Route path="/admin/settings" element={<AdminLayout><AdminSettings /></AdminLayout>} />
                <Route path="/admin/specials" element={<AdminLayout><AdminSpecials /></AdminLayout>} />
                <Route path="/admin/payments" element={<AdminLayout><AdminPayments /></AdminLayout>} />
                <Route path="/admin/pages" element={<AdminLayout><AdminPages /></AdminLayout>} />
                <Route path="/admin/reviews" element={<AdminLayout><AdminTestimonials /></AdminLayout>} />
                <Route path="/admin/newsletter" element={<AdminLayout><AdminNewsletter /></AdminLayout>} />
                <Route path="/admin/contacts" element={<AdminLayout><AdminContacts /></AdminLayout>} />
                <Route path="/admin/header-footer" element={<AdminLayout><AdminHeaderFooter /></AdminLayout>} />
                <Route path="/admin/loyalty" element={<AdminLayout><AdminLoyalty /></AdminLayout>} />
                <Route path="/admin/categories" element={<AdminLayout><AdminCategories /></AdminLayout>} />
                <Route path="/admin/units" element={<AdminLayout><AdminUnits /></AdminLayout>} />
                <Route path="/admin/staff" element={<AdminLayout><AdminStaff /></AdminLayout>} />
                <Route path="/admin/catering" element={<AdminLayout><AdminCatering /></AdminLayout>} />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </OnboardingGate>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
