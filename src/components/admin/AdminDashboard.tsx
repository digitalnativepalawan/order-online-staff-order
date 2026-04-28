import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, ShoppingCart, TrendingUp, Package, BarChart3, PieChart as PieChartIcon, Users, AlertTriangle, Download, Clock } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import { fetchAllOrders, fetchAllProducts } from "@/lib/reports-queries";

const COLORS = ["hsl(var(--primary))", "#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

function exportCSV(data: Record<string, any>[], filename: string) {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const csv = [keys.join(","), ...data.map(r => keys.map(k => `"${r[k] ?? ""}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// Presentational helpers
function ChartLegend({ items }: { items: { name: string; value: number; color: string }[] }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5 text-[11px]">
          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
          <span className="text-muted-foreground">{item.name}</span>
          <span className="font-medium">{total > 0 ? `${(item.value / total * 100).toFixed(0)}%` : "0%"}</span>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message = "No data available" }: { message?: string }) {
  return <div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">{message}</div>;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  confirmed: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  ready: "bg-green-500/15 text-green-600 dark:text-green-400",
  completed: "bg-secondary text-foreground",
  cancelled: "bg-destructive/15 text-destructive",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${STATUS_STYLES[status] || "bg-secondary text-foreground"}`}>
      {status}
    </span>
  );
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = ["bg-blue-500/20 text-blue-600", "bg-green-500/20 text-green-600", "bg-yellow-500/20 text-yellow-600", "bg-destructive/20 text-destructive", "bg-purple-500/20 text-purple-600", "bg-cyan-500/20 text-cyan-600"];

interface AdminDashboardProps {
  onJumpToPendingOrders?: () => void;
}

export default function AdminDashboard({ onJumpToPendingOrders }: AdminDashboardProps = {}) {
  const [dateRange, setDateRange] = useState("all");
  const isMobile = useIsMobile();

  const { data: orders } = useQuery({
    queryKey: ["admin-orders-full"],
    queryFn: () => fetchAllOrders({ from: null, to: null }),
  });

  const { data: products } = useQuery({
    queryKey: ["admin-products-full"],
    queryFn: fetchAllProducts,
  });

  const getDateFilter = useCallback(() => {
    const now = new Date();
    switch (dateRange) {
      case "today": return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case "week": { const d = new Date(now); d.setDate(d.getDate() - 7); return d; }
      case "month": { const d = new Date(now); d.setMonth(d.getMonth() - 1); return d; }
      case "year": { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d; }
      default: return null;
    }
  }, [dateRange]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    const df = getDateFilter();
    return orders.filter(o => !df || new Date(o.created_at) >= df);
  }, [orders, getDateFilter]);

  const completed = filteredOrders.filter(o => o.order_status !== "cancelled");
  const totalSales = completed.reduce((s, o) => s + Number(o.total_price), 0);

  // Build product lookup maps for accurate cost and category lookups
  const productCostMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (products) products.forEach(p => { map[p.name] = Number(p.cost_of_goods); });
    return map;
  }, [products]);

  const productCategoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (products) products.forEach(p => { map[p.name] = p.category || "Other"; });
    return map;
  }, [products]);

  const totalCost = completed.reduce((s, o) => s + (o.items as any[]).reduce((c: number, i: any) => {
    const cost = i.cost || productCostMap[i.name] || 0;
    return c + cost * i.quantity;
  }, 0), 0);
  const totalProfit = totalSales - totalCost;
  const grossMargin = totalSales > 0 ? (totalProfit / totalSales * 100) : 0;
  const avgOrder = completed.length > 0 ? totalSales / completed.length : 0;

  // Status counts
  const statusCounts = useMemo(() => {
    const c = { pending: 0, confirmed: 0, ready: 0, completed: 0, cancelled: 0 };
    filteredOrders.forEach(o => { if (o.order_status in c) c[o.order_status as keyof typeof c]++; });
    return c;
  }, [filteredOrders]);
  const cancellationRate = filteredOrders.length > 0 ? (statusCounts.cancelled / filteredOrders.length * 100) : 0;

  // Product performance
  const productPerf = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number; cost: number }> = {};
    completed.forEach(o => {
      (o.items as any[]).forEach((i: any) => {
        if (!map[i.name]) map[i.name] = { name: i.name, qty: 0, revenue: 0, cost: 0 };
        map[i.name].qty += i.quantity;
        map[i.name].revenue += i.price * i.quantity;
        const cost = i.cost || productCostMap[i.name] || 0;
        map[i.name].cost += cost * i.quantity;
      });
    });
    return Object.values(map).map(p => ({ ...p, profit: p.revenue - p.cost, margin: p.revenue > 0 ? ((p.revenue - p.cost) / p.revenue * 100) : 0 }));
  }, [completed, productCostMap]);

  const bestSellers = [...productPerf].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  const worstSellers = [...productPerf].sort((a, b) => a.revenue - b.revenue).slice(0, 5);
  const mostProfitable = [...productPerf].sort((a, b) => b.margin - a.margin).slice(0, 5);
  const leastProfitable = [...productPerf].sort((a, b) => a.margin - b.margin).slice(0, 5);

  // Revenue by category
  const revByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    completed.forEach(o => {
      (o.items as any[]).forEach((i: any) => {
        const cat = i.category || productCategoryMap[i.name] || "Other";
        map[cat] = (map[cat] || 0) + i.price * i.quantity;
      });
    });
    return Object.entries(map).map(([name, value]) => ({ name, value: +value.toFixed(0) })).sort((a, b) => b.value - a.value);
  }, [completed, productCategoryMap]);

  // Revenue by payment
  const revByPayment = useMemo(() => {
    const map: Record<string, number> = {};
    completed.forEach(o => { map[o.payment_method] = (map[o.payment_method] || 0) + Number(o.total_price); });
    return Object.entries(map).map(([name, value]) => ({ name, value: +value.toFixed(0) }));
  }, [completed]);

  // Customer analytics
  const customerStats = useMemo(() => {
    const map: Record<string, { name: string; phone: string; total: number; orders: number }> = {};
    completed.forEach(o => {
      const k = o.customer_phone;
      if (!map[k]) map[k] = { name: o.customer_name, phone: k, total: 0, orders: 0 };
      map[k].total += Number(o.total_price);
      map[k].orders++;
    });
    const all = Object.values(map);
    const returning = all.filter(c => c.orders > 1).length;
    return { unique: all.length, returning, repeatRate: all.length > 0 ? (returning / all.length * 100) : 0, top10: [...all].sort((a, b) => b.total - a.total).slice(0, 10) };
  }, [completed]);

  // Inventory analytics
  const inventoryStats = useMemo(() => {
    if (!products) return { stockValue: 0, lowStock: [], outOfStock: [], restockSuggestions: [] };
    const stockValue = products.reduce((s, p) => s + Number(p.cost_of_goods) * p.inventory, 0);
    const lowStock = products.filter(p => p.inventory > 0 && p.inventory <= p.inventory_min_threshold);
    const outOfStock = products.filter(p => p.inventory <= 0);
    const restockSuggestions = [...lowStock, ...outOfStock].map(p => ({ name: p.name, current: p.inventory, threshold: p.inventory_min_threshold, suggested: p.inventory_min_threshold * 3 }));
    return { stockValue, lowStock, outOfStock, restockSuggestions };
  }, [products]);

  // Time analytics
  const ordersByHour = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, count: 0 }));
    completed.forEach(o => { hours[new Date(o.created_at).getHours()].count++; });
    return hours;
  }, [completed]);

  const ordersByDay = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => ({ day: d, count: 0 }));
    completed.forEach(o => { days[new Date(o.created_at).getDay()].count++; });
    return days;
  }, [completed]);

  const ordersByMonth = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(m => ({ month: m, count: 0 }));
    completed.forEach(o => { months[new Date(o.created_at).getMonth()].count++; });
    return months;
  }, [completed]);

  // Delivery split
  const deliverySplit = useMemo(() => {
    let pickup = 0, delivery = 0;
    filteredOrders.forEach(o => o.delivery_type === "delivery" ? delivery++ : pickup++);
    return [{ name: "Pickup", value: pickup }, { name: "Delivery", value: delivery }];
  }, [filteredOrders]);

  const marginBadge = (margin: number) => {
    const cls = margin > 40 ? "bg-green-500/15 text-green-600 dark:text-green-400" : margin >= 20 ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400" : "bg-destructive/15 text-destructive";
    return <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${cls}`}>{margin.toFixed(0)}%</span>;
  };

  const currencyTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-popover border border-border rounded-md px-3 py-1.5 text-xs shadow-md">
        <p className="font-medium">{label || payload[0]?.name}</p>
        <p className="text-muted-foreground">₱{Number(payload[0]?.value).toLocaleString()}</p>
      </div>
    );
  };

  const countTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-popover border border-border rounded-md px-3 py-1.5 text-xs shadow-md">
        <p className="font-medium">{label}</p>
        <p className="text-muted-foreground">{payload[0]?.value} orders</p>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Pending Orders Alert */}
      {statusCounts.pending > 0 && (
        <Card
          onClick={onJumpToPendingOrders}
          className="cursor-pointer border-[hsl(24,95%,53%)] bg-[hsl(24,95%,53%)]/10 animate-alert-pulse hover:bg-[hsl(24,95%,53%)]/20 transition-colors"
        >
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-[hsl(24,95%,53%)]" />
              <div>
                <p className="text-3xl font-bold text-[hsl(24,95%,53%)] leading-none">{statusCounts.pending}</p>
                <p className="text-xs text-muted-foreground mt-1">pending order{statusCounts.pending === 1 ? "" : "s"} need attention</p>
              </div>
            </div>
            <Button variant="default" size="sm" className="bg-[hsl(24,95%,53%)] hover:bg-[hsl(24,95%,48%)] text-white">
              View Now →
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Date Filter */}
      <Select value={dateRange} onValueChange={setDateRange}>
        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="week">This Week</SelectItem>
          <SelectItem value="month">This Month</SelectItem>
          <SelectItem value="year">This Year</SelectItem>
          <SelectItem value="all">All Time</SelectItem>
        </SelectContent>
      </Select>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Sales", value: `₱${totalSales.toLocaleString()}`, cls: "" },
          { label: "Net Profit", value: `₱${totalProfit.toLocaleString()}`, cls: "text-green-500" },
          { label: "Margin", value: `${grossMargin.toFixed(1)}%`, cls: "text-blue-500" },
          { label: "Orders", value: `${filteredOrders.length}`, cls: "" },
          { label: "Avg Order", value: `₱${avgOrder.toFixed(0)}`, cls: "" },
        ].map(m => (
          <div key={m.label} className="bg-secondary/50 rounded-md p-3 md:p-4">
            <p className="text-[11px] text-muted-foreground">{m.label}</p>
            <p className={`text-xl font-medium mt-0.5 ${m.cls}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Order Status Pills */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Order Status <span className="text-muted-foreground font-normal text-xs">({cancellationRate.toFixed(0)}% cancelled)</span></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className={`text-center p-2.5 rounded-md ${STATUS_STYLES[status] || "bg-secondary"}`}>
                <p className="text-xl font-medium">{count}</p>
                <p className="text-[10px] capitalize opacity-80">{status}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Charts — donut with custom legends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm">Revenue by Category</CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => exportCSV(revByCategory, "revenue-by-category")}><Download className="h-3 w-3" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            {revByCategory.length === 0 ? <EmptyState /> : (
              <>
                <ChartLegend items={revByCategory.map((d, i) => ({ ...d, color: COLORS[i % COLORS.length] }))} />
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={revByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} stroke="hsl(var(--card))" strokeWidth={2}>
                      {revByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={currencyTooltip} />
                  </PieChart>
                </ResponsiveContainer>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm">Revenue by Payment</CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => exportCSV(revByPayment, "revenue-by-payment")}><Download className="h-3 w-3" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            {revByPayment.length === 0 ? <EmptyState /> : (
              <>
                <ChartLegend items={revByPayment.map((d, i) => ({ ...d, color: COLORS[i % COLORS.length] }))} />
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={revByPayment} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} stroke="hsl(var(--card))" strokeWidth={2}>
                      {revByPayment.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={currencyTooltip} />
                  </PieChart>
                </ResponsiveContainer>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top 10 & Bottom 5 Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm">Top 10 Products</CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => exportCSV(bestSellers, "best-sellers")}><Download className="h-3 w-3" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            {bestSellers.length === 0 ? <EmptyState /> : (
              <div className="space-y-0">
                {bestSellers.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0 text-xs">
                    <span className="text-muted-foreground w-5 text-right shrink-0">{i + 1}</span>
                    <span className="flex-1 min-w-0 truncate">{p.name}</span>
                    <span className="font-medium shrink-0">₱{p.revenue.toLocaleString()}</span>
                    {marginBadge(p.margin)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Bottom 5 Products</CardTitle></CardHeader>
          <CardContent>
            {worstSellers.length === 0 ? <EmptyState /> : (
              <div className="space-y-0">
                {worstSellers.map(p => (
                  <div key={p.name} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0 text-xs">
                    <span className="flex-1 min-w-0 truncate">{p.name}</span>
                    <span className="text-muted-foreground shrink-0">{p.qty} sold</span>
                    <span className="font-medium text-destructive shrink-0">₱{p.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product Profitability */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm">Product Profitability</CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => exportCSV(productPerf.map(p => ({ Name: p.name, Units: p.qty, Revenue: p.revenue.toFixed(2), Cost: p.cost.toFixed(2), Profit: p.profit.toFixed(2), Margin: p.margin.toFixed(1) + "%" })), "product-profitability")}><Download className="h-3 w-3" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          {productPerf.length === 0 ? <EmptyState /> : (
            <div className="space-y-0 max-h-72 overflow-y-auto">
              {[...productPerf].sort((a, b) => b.profit - a.profit).map((p, i) => (
                isMobile ? (
                  <div key={p.name} className="p-2.5 border-b border-border last:border-0">
                    <p className="font-medium text-xs truncate">{p.name}</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-1 text-[11px]">
                      <span className="text-muted-foreground">Units Sold</span><span className="text-right">{p.qty}</span>
                      <span className="text-muted-foreground">Revenue</span><span className="text-right">₱{p.revenue.toLocaleString()}</span>
                      <span className="text-muted-foreground">Cost</span><span className="text-right text-muted-foreground">₱{p.cost.toLocaleString()}</span>
                      <span className="text-muted-foreground">Profit</span><span className="text-right text-green-500">₱{p.profit.toLocaleString()}</span>
                      <span className="text-muted-foreground">Margin</span><span className="text-right">{marginBadge(p.margin)}</span>
                    </div>
                  </div>
                ) : (
                  <div key={p.name} className={`flex items-center gap-3 py-1.5 px-2 text-xs border-b border-border last:border-0 ${i % 2 === 0 ? "bg-secondary/20" : ""}`}>
                    <span className="flex-1 min-w-0 truncate">{p.name}</span>
                    <span className="shrink-0 w-10 text-right text-muted-foreground">{p.qty}u</span>
                    <span className="shrink-0 w-16 text-right">₱{p.revenue.toLocaleString()}</span>
                    <span className="shrink-0 w-16 text-right text-muted-foreground">-₱{p.cost.toLocaleString()}</span>
                    <span className="shrink-0 w-16 text-right text-green-500">₱{p.profit.toLocaleString()}</span>
                    {marginBadge(p.margin)}
                  </div>
                )
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Analytics */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" /> Customer Analytics</CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => exportCSV(customerStats.top10.map(c => ({ Name: c.name, Phone: c.phone, Orders: c.orders, Total: c.total.toFixed(2) })), "top-customers")}><Download className="h-3 w-3" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "Unique", value: customerStats.unique, cls: "" },
              { label: "Returning", value: customerStats.returning, cls: "" },
              { label: "Repeat Rate", value: `${customerStats.repeatRate.toFixed(0)}%`, cls: "" },
            ].map(m => (
              <div key={m.label} className="bg-secondary/50 rounded-md p-2.5 text-center">
                <p className="text-[11px] text-muted-foreground">{m.label}</p>
                <p className="text-lg font-medium mt-0.5">{m.value}</p>
              </div>
            ))}
          </div>
          <p className="text-xs font-semibold mb-2">Top 10 Customers</p>
          {customerStats.top10.length === 0 ? <EmptyState message="No customers yet" /> : (
            <div className="space-y-0">
              {customerStats.top10.map((c, i) => (
                <div key={c.phone} className="flex items-center gap-2.5 py-1.5 border-b border-border last:border-0 text-xs">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                    {getInitials(c.name)}
                  </div>
                  <span className="flex-1 min-w-0 truncate">{c.name}</span>
                  <span className="text-muted-foreground shrink-0">{c.orders} orders · ₱{c.total.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inventory Analytics */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Inventory Analytics</CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => exportCSV(inventoryStats.restockSuggestions, "restock-suggestions")}><Download className="h-3 w-3" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="bg-secondary/50 rounded-md p-2.5 text-center">
              <p className="text-[11px] text-muted-foreground">Stock Value</p>
              <p className="text-lg font-medium text-primary mt-0.5">₱{inventoryStats.stockValue.toLocaleString()}</p>
            </div>
            <div className="bg-secondary/50 rounded-md p-2.5 text-center">
              <p className="text-[11px] text-muted-foreground">Low Stock</p>
              <p className={`text-lg font-medium mt-0.5 ${inventoryStats.lowStock.length > 0 ? "text-yellow-500" : "text-muted-foreground"}`}>{inventoryStats.lowStock.length}</p>
            </div>
            <div className="bg-secondary/50 rounded-md p-2.5 text-center">
              <p className="text-[11px] text-muted-foreground">Out of Stock</p>
              <p className={`text-lg font-medium mt-0.5 ${inventoryStats.outOfStock.length > 0 ? "text-destructive" : "text-muted-foreground"}`}>{inventoryStats.outOfStock.length}</p>
            </div>
          </div>
          {inventoryStats.restockSuggestions.length > 0 && (
            <>
              <p className="text-xs font-semibold mb-1">Restock Suggestions</p>
              <div className="space-y-0">
                {inventoryStats.restockSuggestions.map(r => (
                  <div key={r.name} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0 text-xs">
                    <span className="flex-1 min-w-0 truncate">{r.name}</span>
                    <span className="text-destructive shrink-0">{r.current} left</span>
                    <span className="text-muted-foreground shrink-0">→ order {r.suggested}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Time Analytics — Orders by Hour */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" /> Orders by Hour</CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => exportCSV(ordersByHour, "orders-by-hour")}><Download className="h-3 w-3" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          {completed.length === 0 ? <EmptyState /> : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={ordersByHour}><XAxis dataKey="hour" tick={{ fontSize: 8 }} interval={2} /><YAxis tick={{ fontSize: 10 }} /><Tooltip content={countTooltip} /><Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Orders by Day + Orders by Month */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm">Orders by Day</CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => exportCSV(ordersByDay, "orders-by-day")}><Download className="h-3 w-3" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            {completed.length === 0 ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={ordersByDay}><XAxis dataKey="day" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip content={countTooltip} /><Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm">Orders by Month</CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => exportCSV(ordersByMonth, "orders-by-month")}><Download className="h-3 w-3" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            {completed.length === 0 ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={ordersByMonth}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="month" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip content={countTooltip} /><Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot /></LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom 5 (already shown above) + Delivery vs Pickup + Recent Orders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Delivery vs Pickup</CardTitle></CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? <EmptyState /> : (
              <>
                <ChartLegend items={deliverySplit.map((d, i) => ({ ...d, color: COLORS[i % COLORS.length] }))} />
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={deliverySplit} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} stroke="hsl(var(--card))" strokeWidth={2}>
                      {deliverySplit.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={countTooltip} />
                  </PieChart>
                </ResponsiveContainer>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Recent Orders</CardTitle></CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? <EmptyState message="No orders yet" /> : (
              <div className="space-y-0 max-h-[220px] overflow-y-auto">
                {filteredOrders.slice(0, 8).map(o => (
                  <div key={o.id} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0 text-xs">
                    <span className="flex-1 min-w-0 truncate">{o.customer_name}</span>
                    <span className="font-medium shrink-0">₱{Number(o.total_price).toLocaleString()}</span>
                    <StatusBadge status={o.order_status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
