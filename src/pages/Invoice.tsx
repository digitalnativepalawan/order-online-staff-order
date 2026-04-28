import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Printer, MessageCircle, CalendarDays, Users } from "lucide-react";

export default function Invoice() {
  const { orderId } = useParams<{ orderId: string }>();

  // 1. Try the unified view first (lookup by order_id OR order_number)
  const { data: viewRow, isLoading } = useQuery({
    queryKey: ["invoice-view", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("all_orders_for_invoice" as any)
        .select("*")
        .or(`order_id.eq.${orderId},order_number.eq.${orderId}`)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!orderId,
  });

  const source = viewRow?.order_source as "online" | "catering" | undefined;
  const isCatering = source === "catering";

  // 2. Fetch source-specific extras (payment status, invoice number, etc.)
  const { data: details } = useQuery({
    queryKey: ["invoice-details", source, viewRow?.order_id],
    queryFn: async () => {
      if (!viewRow) return null;
      if (isCatering) {
        const { data } = await supabase
          .from("catering_orders")
          .select("*")
          .eq("id", viewRow.order_id)
          .maybeSingle();
        return data;
      }
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("id", viewRow.order_id)
        .maybeSingle();
      return data;
    },
    enabled: !!viewRow,
  });

  const { data: settings } = useQuery({
    queryKey: ["business-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("business_settings").select("*").eq("id", 1).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: paymentSettings } = useQuery({
    queryKey: ["payment-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payment_settings").select("*").eq("id", 1).single();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-500">Loading invoice...</div>;
  if (!viewRow) return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-500">Order not found.</div>;

  const currency = settings?.currency_symbol || "₱";
  const items = (viewRow.items || []) as any[];
  const d: any = details || {};

  // Payment info — varies by source
  const isPaid = isCatering
    ? !!d.balance_paid
    : d.payment_status === "paid";
  const paymentMethod = isCatering ? (d.deposit_paid ? "deposit + balance" : "pending") : d.payment_method;
  const invoiceNumber = isCatering ? (d.order_number || viewRow.order_number) : (d.invoice_number || viewRow.order_id);

  const subtotal = Number(viewRow.subtotal || 0);
  const total = Number(viewRow.total_price || 0);

  // Payment instructions visibility (online only)
  const showAll = (paymentSettings as any)?.invoice_layout !== "show_selected";
  const pm = (paymentMethod || "").toLowerCase();
  const shouldShowGcash = !isCatering && paymentSettings?.show_gcash_on_invoice && paymentSettings?.gcash_qr_url && (showAll || pm.includes("gcash"));
  const shouldShowPhqr = !isCatering && paymentSettings?.show_phqr_on_invoice && paymentSettings?.phqr_qr_url && (showAll || pm.includes("phqr"));
  const shouldShowBank = (isCatering || (paymentSettings?.show_bank_on_invoice && (showAll || pm.includes("bank")))) && paymentSettings?.bank_name;
  const shouldShowCod = !isCatering && (paymentSettings as any)?.show_cod_on_invoice && (showAll || pm.includes("cod"));
  const shouldShowCop = !isCatering && (paymentSettings as any)?.show_cop_on_invoice && (showAll || pm.includes("pickup"));

  const handleWhatsAppShare = () => {
    const phone = (viewRow.customer_phone || "").replace(/\D/g, "");
    const url = window.location.href;
    const label = isCatering ? "catering quote" : "invoice";
    const msg = `Hi ${viewRow.customer_name}, here is your ${label} ${invoiceNumber}: ${url}`;
    const wa = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(wa, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-100 py-4 sm:py-6 px-3 sm:px-4 print:bg-white print:py-0 print:px-0">
      {/* Action buttons */}
      <div className="max-w-2xl mx-auto mb-4 print:hidden flex flex-col sm:flex-row gap-2">
        <Button variant="outline" onClick={() => window.print()} className="w-full sm:w-auto gap-2">
          <Printer className="h-4 w-4" /> Print / Save PDF
        </Button>
        <Button variant="outline" onClick={handleWhatsAppShare} className="w-full sm:w-auto gap-2">
          <MessageCircle className="h-4 w-4" /> Share via WhatsApp
        </Button>
      </div>

      {/* Invoice Paper */}
      <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none print:rounded-none" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

        {/* Header */}
        <div className="border-b border-orange-500 p-4 sm:p-6">
          <div className="flex justify-between items-start gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              {settings?.logo_url && (
                <img src={settings.logo_url} alt="Logo" className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg object-cover shrink-0" />
              )}
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-gray-900 leading-tight">{settings?.business_name || "Business"}</h1>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">{settings?.business_address}</p>
                <p className="text-[10px] sm:text-xs text-gray-500">{settings?.business_phone} · {settings?.business_email}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{isCatering ? "CATERING" : "INVOICE"}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 font-mono break-all">{invoiceNumber}</p>
              {isCatering && (
                <Badge className="mt-1 bg-purple-500/15 text-purple-700 border border-purple-300 text-[10px]">Event Order</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Bill To & Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-4 sm:p-6 border-b border-gray-200">
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Bill To</p>
            <p className="text-sm font-semibold text-gray-900">{viewRow.customer_name}</p>
            <p className="text-xs text-gray-600">{viewRow.customer_phone}</p>
            {viewRow.customer_email && <p className="text-xs text-gray-600">{viewRow.customer_email}</p>}
            {viewRow.delivery_address && <p className="text-xs text-gray-600 mt-1">{viewRow.delivery_address}</p>}
          </div>
          <div className="sm:text-right">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              {isCatering ? "Event Details" : "Invoice Details"}
            </p>
            <p className="text-xs text-gray-600">Issued: {new Date(viewRow.created_at).toLocaleDateString()}</p>
            {isCatering ? (
              <>
                {viewRow.event_date && (
                  <p className="text-xs text-gray-700 font-semibold flex sm:justify-end items-center gap-1 mt-1">
                    <CalendarDays className="h-3 w-3" /> Event: {new Date(viewRow.event_date).toLocaleDateString()}
                    {d.event_time ? ` · ${d.event_time}` : ""}
                  </p>
                )}
                {viewRow.headcount != null && (
                  <p className="text-xs text-gray-700 flex sm:justify-end items-center gap-1">
                    <Users className="h-3 w-3" /> Headcount: {viewRow.headcount}
                  </p>
                )}
                {d.event_type && <p className="text-xs text-gray-600 capitalize">Type: {d.event_type}</p>}
                {viewRow.delivery_type && <p className="text-xs text-gray-600 capitalize">Delivery: {viewRow.delivery_type}</p>}
                <p className="text-xs text-gray-600 capitalize mt-1">Status: {viewRow.status}</p>
              </>
            ) : (
              <>
                <p className="text-xs text-gray-600">Time: {new Date(viewRow.created_at).toLocaleTimeString()}</p>
                <p className="text-xs text-gray-600 capitalize">Delivery: {viewRow.delivery_type}</p>
                <p className="text-xs text-gray-600 capitalize">Payment: {paymentMethod}</p>
              </>
            )}
            <div className="mt-2">
              {isPaid ? (
                <Badge className="bg-green-500/15 text-green-700 border border-green-300 text-xs">PAID</Badge>
              ) : (
                <Badge className="bg-yellow-500/15 text-yellow-700 border border-yellow-300 text-xs">PENDING</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="p-4 sm:p-6 border-b border-gray-200 overflow-x-hidden">
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 text-xs font-semibold text-gray-400 uppercase w-8">Qty</th>
                <th className="text-left py-2 text-xs font-semibold text-gray-400 uppercase">Item</th>
                <th className="text-right py-2 text-xs font-semibold text-gray-400 uppercase w-24">Unit Price</th>
                <th className="text-right py-2 text-xs font-semibold text-gray-400 uppercase w-20">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, idx: number) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-2 text-gray-700 tabular-nums">{item.quantity}</td>
                  <td className="py-2 text-gray-900 font-medium truncate">{item.name}</td>
                  <td className="py-2 text-right text-gray-700 tabular-nums">{currency}{Number(item.price).toFixed(2)}</td>
                  <td className="py-2 text-right text-gray-900 font-medium tabular-nums">{currency}{(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col items-end space-y-1">
            <div className="flex justify-between w-full max-w-xs text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-700 tabular-nums">{currency}{subtotal.toFixed(2)}</span>
            </div>
            {isCatering && Number(d.delivery_fee || 0) > 0 && (
              <div className="flex justify-between w-full max-w-xs text-sm">
                <span className="text-gray-500">Delivery Fee</span>
                <span className="text-gray-700 tabular-nums">{currency}{Number(d.delivery_fee).toFixed(2)}</span>
              </div>
            )}
            {isCatering && Number(d.catering_discount || 0) > 0 && (
              <div className="flex justify-between w-full max-w-xs text-sm">
                <span className="text-gray-500">Catering Discount</span>
                <span className="text-red-600 tabular-nums">-{currency}{Number(d.catering_discount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between w-full max-w-xs text-sm border-t-2 border-gray-900 pt-2 mt-2">
              <span className="font-bold text-gray-900 text-base">Grand Total</span>
              <span className="font-bold text-gray-900 text-base tabular-nums">{currency}{total.toFixed(2)}</span>
            </div>

            {isCatering && (
              <div className="w-full max-w-xs mt-3 pt-3 border-t border-dashed border-gray-300 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Deposit Required</span>
                  <span className="font-semibold text-gray-900 tabular-nums">{currency}{Number(viewRow.deposit_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Deposit Status</span>
                  {viewRow.deposit_paid ? (
                    <Badge className="bg-green-500/15 text-green-700 border border-green-300 text-[10px]">PAID</Badge>
                  ) : (
                    <Badge className="bg-yellow-500/15 text-yellow-700 border border-yellow-300 text-[10px]">UNPAID</Badge>
                  )}
                </div>
                <div className="flex justify-between text-sm pt-1 border-t border-gray-200">
                  <span className="text-gray-600">Balance Due</span>
                  <span className="font-bold text-orange-600 tabular-nums">{currency}{Number(viewRow.balance || 0).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Status Section */}
        {isPaid ? (
          <div className="p-4 sm:p-6">
            <div className="border-2 border-green-400 rounded-lg p-4 sm:p-5 bg-green-50">
              <div className="flex items-center justify-center gap-2 mb-3">
                <CheckCircle className="h-7 w-7 text-green-600" />
                <span className="text-xl font-bold text-green-700">PAYMENT CONFIRMED</span>
              </div>
              <div className="text-center space-y-1 text-sm text-gray-700">
                {d.paid_via && <p>Paid via: <span className="font-semibold capitalize">{d.paid_via}</span></p>}
                <p>Amount: <span className="font-bold text-green-700 tabular-nums">{currency}{total.toFixed(2)}</span></p>
                {(d.paid_at || d.balance_paid_at) && <p className="text-xs text-gray-500">Completed: {new Date(d.paid_at || d.balance_paid_at).toLocaleString()}</p>}
                <p className="text-green-600 font-medium pt-2">Thank you for your payment!</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="text-lg font-bold text-yellow-700">
                {isCatering ? (viewRow.deposit_paid ? "BALANCE DUE" : "DEPOSIT REQUIRED") : "PENDING PAYMENT"}
              </span>
            </div>

            {(shouldShowGcash || shouldShowPhqr || shouldShowBank || shouldShowCod || shouldShowCop) && (
              <div className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50">
                <p className="text-sm text-center text-gray-500 font-medium">Payment Instructions</p>

                {shouldShowGcash && (
                  <div className="text-center space-y-2 border-b border-gray-200 pb-4">
                    <p className="text-sm font-bold text-blue-600">GCash</p>
                    <img src={paymentSettings!.gcash_qr_url!} alt="GCash QR" className="max-w-[180px] mx-auto rounded border border-gray-300" />
                  </div>
                )}

                {shouldShowPhqr && (
                  <div className="text-center space-y-2 border-b border-gray-200 pb-4">
                    <p className="text-sm font-bold text-blue-600">PHQR</p>
                    <img src={paymentSettings!.phqr_qr_url!} alt="PHQR QR" className="max-w-[180px] mx-auto rounded border border-gray-300" />
                  </div>
                )}

                {shouldShowBank && (
                  <div className="text-center space-y-1 text-sm border-b border-gray-200 pb-4">
                    <p className="font-bold text-gray-700">Bank Transfer</p>
                    <p className="text-gray-600">Bank: <span className="font-medium">{paymentSettings!.bank_name}</span></p>
                    <p className="text-gray-600">Account Name: <span className="font-medium">{paymentSettings!.bank_account_name}</span></p>
                    <p className="text-gray-600">Account Number: <span className="font-mono font-medium">{paymentSettings!.bank_account_number}</span></p>
                    {paymentSettings!.bank_branch && <p className="text-gray-600">Branch: {paymentSettings!.bank_branch}</p>}
                  </div>
                )}

                {shouldShowCod && (
                  <div className="text-center space-y-1 text-sm border-b border-gray-200 pb-4 last:border-b-0">
                    <p className="font-bold text-gray-700">Cash on Delivery</p>
                    <p className="text-gray-600">{(paymentSettings as any)?.cod_instructions}</p>
                  </div>
                )}

                {shouldShowCop && (
                  <div className="text-center space-y-1 text-sm">
                    <p className="font-bold text-gray-700">Cash on Pickup</p>
                    <p className="text-gray-600">{(paymentSettings as any)?.cop_instructions}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 p-3 sm:p-4 bg-gray-50 text-center text-xs text-gray-400 space-y-0.5">
          <p>Status: <span className="capitalize font-medium text-gray-600">{viewRow.status}</span></p>
          {viewRow.confirmed_at && <p>Confirmed: {new Date(viewRow.confirmed_at).toLocaleString()}</p>}
          {viewRow.completed_at && <p>Completed: {new Date(viewRow.completed_at).toLocaleString()}</p>}
        </div>
      </div>
    </div>
  );
}
