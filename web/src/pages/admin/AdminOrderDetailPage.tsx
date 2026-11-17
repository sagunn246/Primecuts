import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  User,
  MapPin,
  Package,
  Phone,
  Clock,
  ShoppingBag,
  QrCode,
  Copy,
  Check,
  Bike,
  Store,
  Printer,
  Loader2,
} from "lucide-react";
import StatusUpdater from "../../components/admin/StatusUpdater";
import PaymentStatusToggle from "../../components/admin/PaymentStatusToggle";
import StaticMapView from "../../components/StaticMapView";
import { printThermalReceipt } from "../../utils/printThermalReceipt";
import { getOrderDeliverySlot, getCleanOrderNotes } from "../../utils/orderUtils";

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedTxn, setCopiedTxn] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      if (!id) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/orders/${id}`, { credentials: "include" });
        const data = await res.json();
        if (data.success && data.order) {
          setOrder(data.order);
        } else {
          setError(data.error || "Order not found");
        }
      } catch {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [id]);

  const copyTxn = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTxn(true);
    setTimeout(() => setCopiedTxn(false), 2000);
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-stone-400 text-xs font-medium bg-white rounded-xl border border-stone-200/90">
        <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto mb-2" />
        Loading order inspector...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="py-12 text-center space-y-3 bg-white rounded-xl border border-stone-200/90">
        <p className="text-red-600 text-sm font-bold">{error || "Order not found"}</p>
        <Link
          to="/admin/orders"
          className="inline-block px-4 py-2 bg-stone-900 text-white font-semibold rounded-lg text-xs"
        >
          Back to Queue
        </Link>
      </div>
    );
  }

  const orderId = order.id || order._id;
  const orderNumber = order.orderNumber || order.order_number;
  const createdAt = order.createdAt || order.created_at;
  const orderType = (order.orderType || order.order_type || "delivery").toLowerCase();
  const customerName = order.customerInfo?.name || order.customer_name || "Customer";
  const customerPhone = order.customerInfo?.phone || order.customer_phone || "";
  const customerEmail = order.customerInfo?.email || order.customer_email || "";
  const totalAmount =
    typeof order.totalAmount === "number"
      ? order.totalAmount
      : parseFloat(order.total_amount || "0");
  const paymentMethod = order.paymentMethod || order.payment_method || "cod";
  const paymentStatus = order.paymentStatus || order.payment_status || "pending";
  const transactionId = order.transactionId || order.transaction_id || "";
  const latitude =
    order.latitude !== undefined && order.latitude !== null ? parseFloat(order.latitude) : null;
  const longitude =
    order.longitude !== undefined && order.longitude !== null ? parseFloat(order.longitude) : null;
  const address = order.address || "";
  const items = order.items || [];
  const deliverySlot = getOrderDeliverySlot(order);
  const cleanNotes = getCleanOrderNotes(order);

  const riderDispatchText = `*🥩 Prime Cuts — Delivery Dispatch*
Order: #${orderNumber}
Customer: ${customerName} (${customerPhone})
${deliverySlot ? `⏰ Delivery Time: ${deliverySlot}\n` : ""}${address ? `Address: ${address}` : ""}
${latitude && longitude ? `Google Maps Navigation: https://www.google.com/maps?q=${latitude},${longitude}` : ""}

*Items to Deliver:*
${items
  .map(
    (i: any) =>
      `- ${i.productName || i.name} (${
        i.selectedWeightInGrams
          ? i.selectedWeightInGrams >= 1000
            ? i.selectedWeightInGrams / 1000 + "kg"
            : i.selectedWeightInGrams + "g"
          : i.selectedVariantName || ""
      }) x ${i.qty || 1}`
  )
  .join("\n")}

*Total to Collect: Rs. ${totalAmount.toFixed(2)} (${
    paymentMethod === "qr" || paymentStatus === "paid"
      ? "PAID ONLINE (Do NOT collect cash)"
      : "COLLECT CASH"
  })*`;

  const riderWhatsAppUrl = `https://wa.me/?text=${encodeURIComponent(riderDispatchText)}`;

  return (
    <div className="space-y-3.5 pb-6">
      {/* ================================================================= */}
      {/* TOP INSPECTOR BAR                                                 */}
      {/* ================================================================= */}
      <div className="bg-white rounded-xl border border-stone-200/90 p-3.5 sm:p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 tabular-nums">
              Order #{orderNumber}
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700 capitalize">
              {orderType}
            </span>
          </div>
          <p className="text-[11px] text-stone-400 font-medium tabular-nums mt-0.5">
            Placed {new Date(createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <StatusUpdater
            orderId={orderId.toString()}
            currentStatus={order.status}
            onStatusChange={(newStatus) => setOrder((prev: any) => ({ ...prev, status: newStatus }))}
          />

          <button
            type="button"
            onClick={() => printThermalReceipt(order)}
            className="h-8.5 px-3 bg-white hover:bg-stone-50 border border-stone-200/90 text-stone-800 font-semibold text-xs rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-stone-500" />
            <span>Print Slip</span>
          </button>

          {orderType === "delivery" && (
            <a
              href={riderWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-8.5 px-3 bg-[#25D366] hover:bg-[#1ebd5a] text-white font-semibold text-xs rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Dispatch Rider</span>
            </a>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* 3-PANEL ORDER INSPECTOR GRID                                      */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Panel 1: Customer */}
        <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-stone-400" />
              Customer Info
            </span>
            {customerPhone && (
              <a
                href={`tel:${customerPhone}`}
                className="px-2 py-0.5 bg-stone-900 text-white font-semibold rounded text-[11px] inline-flex items-center gap-1"
              >
                <Phone className="w-2.5 h-2.5" />
                <span>Call</span>
              </a>
            )}
          </div>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-[10px] font-semibold text-stone-400 uppercase block">Name</span>
              <p className="font-bold text-stone-900 mt-0.5">{customerName}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-stone-400 uppercase block">Phone</span>
              <p className="font-semibold text-stone-800 tabular-nums mt-0.5 select-text">
                {customerPhone || "Not provided"}
              </p>
            </div>
            {customerEmail && (
              <div>
                <span className="text-[10px] font-semibold text-stone-400 uppercase block">Email</span>
                <p className="font-medium text-stone-600 truncate mt-0.5 select-text">
                  {customerEmail}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Panel 2: Payment & Verification */}
        <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-stone-400" />
              Payment & Settlement
            </span>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Method</span>
              <span className="font-semibold text-stone-900 inline-flex items-center gap-1">
                {paymentMethod === "qr" ? (
                  <>
                    <QrCode className="w-3.5 h-3.5 text-primary" />
                    <span>QR Scan & Pay</span>
                  </>
                ) : (
                  <span>Cash on Delivery</span>
                )}
              </span>
            </div>

            {transactionId && (
              <div className="p-2 bg-stone-50 rounded-lg border border-stone-200/80 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold text-stone-400 uppercase block">
                    Ref / Txn ID
                  </span>
                  <span className="font-mono font-bold text-xs text-stone-900 truncate block select-text">
                    {transactionId}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyTxn(transactionId)}
                  className="p-1.5 hover:bg-stone-200/70 rounded text-stone-600 cursor-pointer shrink-0"
                  title="Copy Transaction ID"
                >
                  {copiedTxn ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )}

            <div className="pt-1 border-t border-stone-100">
              <PaymentStatusToggle
                orderId={orderId.toString()}
                currentPaymentStatus={paymentStatus as "pending" | "paid"}
                onStatusChange={(newStatus) =>
                  setOrder((prev: any) => ({ ...prev, paymentStatus: newStatus }))
                }
              />
            </div>
          </div>
        </div>

        {/* Panel 3: Fulfillment & Location */}
        <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-stone-400" />
              Fulfillment Details
            </span>
          </div>
          <div className="space-y-2.5 text-xs">
            {deliverySlot && (
              <div className="p-2.5 bg-amber-50/90 rounded-lg border border-amber-200/80 flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                <div>
                  <span className="text-[10px] font-semibold text-amber-800 uppercase block">
                    Requested Slot
                  </span>
                  <span className="text-xs font-bold text-amber-950">{deliverySlot}</span>
                </div>
              </div>
            )}

            {orderType === "delivery" ? (
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] font-semibold text-stone-400 uppercase block">
                    Delivery Address
                  </span>
                  <p className="font-semibold text-stone-800 mt-0.5 leading-snug select-text">
                    {address || "Standard delivery"}
                  </p>
                </div>
                {address && (
                  <StaticMapView address={address} latitude={latitude} longitude={longitude} />
                )}
              </div>
            ) : (
              <div className="p-2.5 bg-stone-50 text-stone-700 rounded-lg font-semibold text-xs border border-stone-200/80 flex items-center gap-2">
                <Store className="w-4 h-4 text-stone-500" />
                <span>Customer Pickup at Counter</span>
              </div>
            )}

            {cleanNotes && (
              <div className="pt-2 border-t border-stone-100">
                <span className="text-[10px] font-semibold text-stone-400 uppercase block">
                  Butcher / Order Notes
                </span>
                <p className="text-xs text-stone-700 bg-stone-50 p-2 rounded-lg mt-1 border border-stone-200/60 select-text">
                  "{cleanNotes}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* LINE ITEMS & TOTALS                                               */}
      {/* ================================================================= */}
      <div className="bg-white rounded-xl border border-stone-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-stone-400" />
            <h2 className="text-sm font-bold text-stone-900">Line Items ({items.length})</h2>
          </div>
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
            Preparation Sheet
          </span>
        </div>

        {/* Mobile Line Items (< md) */}
        <div className="divide-y divide-stone-100 md:hidden">
          {items.map((item: any, i: number) => {
            const productName = item.productName || item.name || "Item";
            const calculatedPrice =
              typeof item.calculatedPrice === "number"
                ? item.calculatedPrice
                : (item.price || 0) * (item.qty || 1);
            const variantText = item.selectedWeightInGrams
              ? item.selectedWeightInGrams >= 1000
                ? `${item.selectedWeightInGrams / 1000}kg`
                : `${item.selectedWeightInGrams}g`
              : item.selectedVariantName || "Standard";

            return (
              <div key={i} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <p className="font-bold text-stone-900">{productName}</p>
                  <div className="flex items-center gap-1.5 mt-1 text-stone-500">
                    <span className="bg-stone-100 px-1.5 py-0.5 rounded font-semibold text-[11px] text-stone-700">
                      {variantText}
                    </span>
                    <span className="font-bold text-stone-900">×{item.qty}</span>
                    {(item.pricePerKgAtTimeOfOrder || item.unitPriceAtTimeOfOrder) && (
                      <span className="text-[11px] text-stone-400 tabular-nums">
                        • Rs.{" "}
                        {item.pricePerKgAtTimeOfOrder
                          ? `${item.pricePerKgAtTimeOfOrder}/kg`
                          : item.unitPriceAtTimeOfOrder}
                      </span>
                    )}
                  </div>
                </div>
                <span className="font-bold text-stone-900 tabular-nums shrink-0">
                  Rs. {calculatedPrice.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Desktop Line Items Table (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-stone-50/80 border-b border-stone-200/80 text-stone-500 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-4">Cut / Item</th>
                <th className="py-2.5 px-4">Weight / Pack</th>
                <th className="py-2.5 px-4">Qty</th>
                <th className="py-2.5 px-4">Rate</th>
                <th className="py-2.5 px-4 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {items.map((item: any, i: number) => {
                const productName = item.productName || item.name || "Item";
                const calculatedPrice =
                  typeof item.calculatedPrice === "number"
                    ? item.calculatedPrice
                    : (item.price || 0) * (item.qty || 1);
                const variantText = item.selectedWeightInGrams
                  ? item.selectedWeightInGrams >= 1000
                    ? `${item.selectedWeightInGrams / 1000}kg`
                    : `${item.selectedWeightInGrams}g`
                  : item.selectedVariantName || "Standard";

                return (
                  <tr key={i} className="hover:bg-stone-50/60">
                    <td className="py-3 px-4 font-bold text-stone-900">{productName}</td>
                    <td className="py-3 px-4">
                      <span className="bg-stone-100 px-2 py-0.5 rounded text-[11px] font-semibold text-stone-700">
                        {variantText}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-stone-900 tabular-nums">×{item.qty}</td>
                    <td className="py-3 px-4 text-stone-500 tabular-nums">
                      {item.pricePerKgAtTimeOfOrder
                        ? `Rs. ${item.pricePerKgAtTimeOfOrder}/kg`
                        : item.unitPriceAtTimeOfOrder
                        ? `Rs. ${item.unitPriceAtTimeOfOrder}`
                        : "—"}
                    </td>
                    <td className="py-3 px-4 font-bold text-stone-900 text-right tabular-nums">
                      Rs. {calculatedPrice.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Grand Total Footer */}
        <div className="px-4 py-3.5 bg-stone-50 border-t border-stone-200/80 flex items-center justify-between">
          <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">
            Total Payable
          </span>
          <span className="text-lg sm:text-xl font-bold text-stone-900 tabular-nums">
            Rs. {totalAmount.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
