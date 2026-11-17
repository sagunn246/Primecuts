import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  CheckCircle2,
  Truck,
  Store,
  MapPin,
  User,
  Phone,
  MessageSquare,
  ShoppingBag,
  Printer,
  Clock,
} from "lucide-react";
import CopyOrderButton from "../components/CopyOrderButton";
import LiveOrderSection from "../components/LiveOrderSection";
import PushNotificationSetup from "../components/PushNotificationSetup";
import { printThermalReceipt } from "../utils/printThermalReceipt";
import { getOrderDeliverySlot, getCleanOrderNotes } from "../utils/orderUtils";
import SEO from "../components/SEO";

export default function OrderDetailPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrder() {
      if (!orderNumber) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/orders/${orderNumber}`);
        if (!res.ok) {
          setError("Order not found");
          return;
        }
        const data = await res.json();
        if (data.success && data.order) {
          setOrder(data.order);
        } else {
          setError(data.error || "Order not found");
        }
      } catch (err) {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4 bg-[#f8f8f9]">
        <div className="text-zinc-500 font-medium text-sm">
          Loading order details...
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 bg-[#f8f8f9] text-center">
        <h2 className="text-xl font-bold mb-2 text-zinc-900">
          Order Not Found
        </h2>
        <p className="text-zinc-500 text-sm mb-5">
          {error || "The requested order does not exist."}
        </p>
        <Link
          to="/"
          className="px-5 py-2.5 bg-primary text-white font-semibold text-sm rounded-lg hover:bg-primary-hover"
        >
          Return to Store
        </Link>
      </div>
    );
  }

  const orderDate = new Date(order.createdAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const orderSlot = getOrderDeliverySlot(order);
  const cleanNotes = getCleanOrderNotes(order);

  const whatsappPhone = "+9779714324919";
  const orderTextString = `*Prime Cuts (Butcher House - Khudi Chowk, Pokhara)*
Order #${order.orderNumber}

*Customer:*
${order.customerInfo.name}
${order.customerInfo.phone}

*Items:*
${(order.items || [])
  .map(
    (item: any) =>
      `- ${item.productName} (${
        item.selectedWeightInGrams
          ? item.selectedWeightInGrams >= 1000
            ? item.selectedWeightInGrams / 1000 + "kg"
            : item.selectedWeightInGrams + "g"
          : item.selectedVariantName || ""
      }) x ${item.qty} - Rs. ${item.calculatedPrice.toFixed(2)}`
  )
  .join("\n")}

*Total:*
Rs. ${order.totalAmount.toFixed(2)}

*Order Type:*
${order.orderType === "delivery" ? "Delivery" : "Pickup"}${
    orderSlot ? `\n\n*Preferred Delivery Time:*\n${orderSlot}` : ""
  }${order.orderType === "delivery" ? `\n\n*Address:*\n${order.address}` : ""}${
    cleanNotes ? `\n\n*Notes:*\n${cleanNotes}` : ""
  }`;

  const whatsappUrl = `https://wa.me/${whatsappPhone.replace(
    "+",
    ""
  )}?text=${encodeURIComponent(orderTextString)}`;

  return (
    <div className="min-h-screen bg-[#f8f8f9] py-8 sm:py-12">
      <SEO
        title={`Order #${order.orderNumber} Status & Receipt`}
        description={`Track order #${order.orderNumber} from Prime Cuts Butcher House Pokhara. Status: ${order.status}. Total: Rs. ${order.totalAmount}.`}
        url={`/orders/${order.orderNumber}`}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Confirmation Header */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6 sm:p-8 text-center mb-6">
          <div className="w-14 h-14 bg-zinc-900 rounded-xl flex items-center justify-center mx-auto mb-4 text-white">
            <CheckCircle2 className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-1.5">
            Order Confirmed
          </h1>
          <p className="text-zinc-600 text-sm">
            Thank you for your order, {order.customerInfo.name}.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-zinc-100 border border-zinc-200 px-3.5 py-1.5 rounded-lg text-sm">
            <span className="text-zinc-500 font-medium">Order Number:</span>
            <span className="font-mono font-bold text-zinc-900">
              #{order.orderNumber}
            </span>
          </div>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="bg-zinc-50 border-b border-zinc-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-bold text-zinc-900 text-base">
                Order Summary & Live Status
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Updates automatically as our butchers prepare your order
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-[11px] font-medium text-zinc-500">Placed On</p>
              <p className="font-semibold text-zinc-900 text-xs">{orderDate}</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <LiveOrderSection
              orderNumber={order.orderNumber}
              initialStatus={order.status}
              paymentMethod={order.paymentMethod || "cod"}
              paymentStatus={order.paymentStatus || "pending"}
            />

            {orderSlot && (
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
                    Scheduled Delivery Slot
                  </span>
                  <span className="text-sm sm:text-base font-bold text-zinc-900 mt-0.5 block">
                    {orderSlot}
                  </span>
                </div>
              </div>
            )}

            {/* Customer & Delivery Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-100">
              <div>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                  Customer Details
                </h3>
                <div className="space-y-2.5 text-sm font-medium text-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-zinc-400" />
                    <span>{order.customerInfo.name}</span>
                  </div>
                  <div className="flex items-center gap-2.5 tabular-nums">
                    <Phone className="w-4 h-4 text-zinc-400" />
                    <span>{order.customerInfo.phone}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                  Fulfillment Method
                </h3>
                <div className="space-y-2.5 text-sm font-medium text-zinc-800">
                  {order.orderType === "delivery" ? (
                    <>
                      <div className="flex items-center gap-2 text-primary font-semibold">
                        <Truck className="w-4 h-4" />
                        <span>Home Delivery</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-zinc-600">
                        <MapPin className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                        <span className="text-xs leading-relaxed">
                          {order.address}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <Store className="w-4 h-4" />
                      <span>Counter Pickup (Khudi Chowk)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="pt-6 border-t border-zinc-100">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                Ordered Cuts
              </h3>
              <div className="space-y-2.5">
                {(order.items || []).map((item: any, index: number) => {
                  const unitText = item.selectedWeightInGrams
                    ? item.selectedWeightInGrams >= 1000
                      ? `${item.selectedWeightInGrams / 1000} kg`
                      : `${item.selectedWeightInGrams}g`
                    : item.selectedVariantName || "";
                  const priceDetail = item.pricePerKgAtTimeOfOrder
                    ? `Rs. ${item.pricePerKgAtTimeOfOrder}/kg`
                    : item.unitPriceAtTimeOfOrder
                    ? `Rs. ${item.unitPriceAtTimeOfOrder} each`
                    : "";
                  return (
                    <div
                      key={index}
                      className="flex justify-between items-center bg-zinc-50 border border-zinc-100 p-3.5 rounded-lg"
                    >
                      <div>
                        <h4 className="font-semibold text-sm text-zinc-900">
                          {item.productName}
                        </h4>
                        <div className="text-xs text-zinc-500 mt-0.5 tabular-nums">
                          {unitText} × {item.qty}
                        </div>
                      </div>
                      <div className="text-right tabular-nums">
                        <div className="font-bold text-sm text-zinc-900">
                          Rs. {item.calculatedPrice.toFixed(2)}
                        </div>
                        {priceDetail && (
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            {priceDetail}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total */}
            <div className="pt-5 border-t border-zinc-200 flex justify-between items-baseline gap-3">
              <div>
                <p className="text-zinc-900 font-semibold text-sm">
                  Total Amount
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Includes applicable delivery charges
                </p>
              </div>
              <div className="text-2xl font-bold text-zinc-900 tabular-nums shrink-0 whitespace-nowrap">
                Rs. {order.totalAmount.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-semibold text-sm transition-colors cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-primary" />
            <span>Send Order Details via WhatsApp</span>
          </a>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => printThermalReceipt(order)}
              className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-zinc-200 rounded-xl font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer text-xs"
            >
              <Printer className="w-4 h-4 text-primary" />
              <span>Print Receipt</span>
            </button>

            <CopyOrderButton orderText={orderTextString} />

            <a
              href="/#shop-cuts"
              className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-zinc-200 rounded-xl font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer text-xs"
            >
              <ShoppingBag className="w-4 h-4 text-zinc-600" />
              <span>Shop Cuts</span>
            </a>

            <a
              href={`tel:${whatsappPhone}`}
              className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-zinc-200 rounded-xl font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer text-xs"
            >
              <Phone className="w-4 h-4 text-zinc-600" />
              <span>Call Outlet</span>
            </a>
          </div>
        </div>
      </div>

      {order.userId && (
        <PushNotificationSetup userId={order.userId.toString()} />
      )}
    </div>
  );
}
