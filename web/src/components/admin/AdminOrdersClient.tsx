import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Phone,
  ShoppingBag,
  Truck,
  Bike,
  Store,
  RefreshCw,
  Clock,
  CheckCircle2,
  ChevronRight,
  Check,
  Loader2,
  X,
} from "lucide-react";
import { getOrderDeliverySlot } from "../../utils/orderUtils";

interface AdminOrdersClientProps {
  initialOrders?: any[];
}

export default function AdminOrdersClient({ initialOrders = [] }: AdminOrdersClientProps) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>(initialOrders);
  const [loading, setLoading] = useState(initialOrders.length === 0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const fetchOrders = async (showLoading = false) => {
    if (showLoading) setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/orders", { credentials: "include" });
      if (!res.ok) return;

      const data = await res.json();
      if (data.success && data.orders) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error("Failed to fetch live admin orders list:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;

    fetchOrders();
    const interval = setInterval(() => {
      if (active) fetchOrders(false);
    }, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const handleQuickStatusUpdate = async (
    e: React.MouseEvent,
    orderId: string,
    newStatus: string
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders((prev) =>
          prev.map((o) => ((o.id || o._id) === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err) {
      console.error("Quick status update failed:", err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "pending").toLowerCase();
    switch (s) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/90">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pending
          </span>
        );
      case "confirmed":
      case "preparing":
      case "processing":
      case "ready":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/90 capitalize">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            {s}
          </span>
        );
      case "completed":
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/90 capitalize">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            {s}
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200/90">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-stone-100 text-stone-700 capitalize">
            {status}
          </span>
        );
    }
  };

  const filteredOrders = orders.filter((order) => {
    const status = (order.status || "pending").toLowerCase();
    const matchesStatus =
      selectedStatus === "all" ||
      status === selectedStatus ||
      (selectedStatus === "active" &&
        status !== "delivered" &&
        status !== "completed" &&
        status !== "cancelled");

    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesStatus;

    const orderNumber = (order.orderNumber || order.order_number || "").toLowerCase();
    const customerName = (order.customerInfo?.name || order.customer_name || "").toLowerCase();
    const customerPhone = (order.customerInfo?.phone || order.customer_phone || "").toLowerCase();
    const transactionId = (order.transactionId || order.transaction_id || "").toLowerCase();

    return (
      matchesStatus &&
      (orderNumber.includes(q) ||
        customerName.includes(q) ||
        customerPhone.includes(q) ||
        transactionId.includes(q))
    );
  });

  const pendingCount = orders.filter((o) => (o.status || "").toLowerCase() === "pending").length;
  const activeCount = orders.filter((o) => {
    const s = (o.status || "").toLowerCase();
    return s === "pending" || s === "confirmed" || s === "preparing" || s === "ready" || s === "processing";
  }).length;
  const deliveredCount = orders.filter((o) => {
    const s = (o.status || "").toLowerCase();
    return s === "delivered" || s === "completed";
  }).length;
  const cancelledCount = orders.filter((o) => (o.status || "").toLowerCase() === "cancelled").length;

  const formatItemSummary = (items: any[]) => {
    if (!Array.isArray(items) || items.length === 0) return "No items listed";
    return items
      .map((i) => {
        const name = i.productName || i.name || "Item";
        const weight = i.selectedWeightInGrams
          ? i.selectedWeightInGrams >= 1000
            ? `${i.selectedWeightInGrams / 1000}kg`
            : `${i.selectedWeightInGrams}g`
          : i.selectedVariantName || "";
        return `${name}${weight ? ` (${weight})` : ""} ×${i.qty || 1}`;
      })
      .join(", ");
  };

  return (
    <div className="space-y-3.5 pb-6">
      {/* ================================================================= */}
      {/* UNIFIED FILTER & SEARCH BAR                                       */}
      {/* ================================================================= */}
      <div className="bg-white rounded-xl border border-stone-200/90 p-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order #, customer name, phone, ref ID..."
              className="w-full h-9 pl-9 pr-8 bg-stone-50 focus:bg-white rounded-lg border border-stone-200/90 focus:border-stone-400 text-xs text-stone-900 font-medium placeholder:text-stone-400 outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => fetchOrders(true)}
            disabled={isRefreshing}
            className="h-9 px-3 bg-stone-50 border border-stone-200/90 hover:bg-stone-100 active:scale-95 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shrink-0"
            title="Refresh Queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Segmented Queue Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: "all", label: "All", count: orders.length },
            { id: "pending", label: "Pending", count: pendingCount, alert: pendingCount > 0 },
            { id: "active", label: "Active Queue", count: activeCount },
            { id: "delivered", label: "Completed", count: deliveredCount },
            { id: "cancelled", label: "Cancelled", count: cancelledCount },
          ].map((tab) => {
            const isSelected = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`h-8 px-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer select-none active:scale-95 ${
                  isSelected
                    ? "bg-stone-900 text-white"
                    : "bg-stone-100/80 text-stone-600 hover:bg-stone-200/70 hover:text-stone-900"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold tabular-nums ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : tab.alert
                      ? "bg-primary text-white"
                      : "bg-stone-200/80 text-stone-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="p-12 text-center text-stone-400 text-xs font-medium bg-white rounded-xl border border-stone-200/90">
          <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto mb-2" />
          Loading order queue...
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredOrders.length === 0 && (
        <div className="p-10 text-center text-stone-500 bg-white rounded-xl border border-stone-200/90 space-y-2">
          <ShoppingBag className="w-8 h-8 text-stone-300 mx-auto" />
          <p className="text-sm font-bold text-stone-800">No matching orders</p>
          <p className="text-xs text-stone-400 max-w-xs mx-auto">
            {searchQuery
              ? `No orders found for "${searchQuery}".`
              : selectedStatus !== "all"
              ? `No orders currently in "${selectedStatus}" state.`
              : "Incoming customer orders will appear here automatically."}
          </p>
        </div>
      )}

      {/* ================================================================= */}
      {/* MOBILE NATIVE ORDER QUEUE CARDS (< md)                            */}
      {/* ================================================================= */}
      {!loading && filteredOrders.length > 0 && (
        <div className="space-y-2.5 md:hidden">
          {filteredOrders.map((order: any) => {
            const orderId = (order.id || order._id)?.toString();
            const customerName = order.customerInfo?.name || order.customer_name || "Customer";
            const customerPhone = order.customerInfo?.phone || order.customer_phone || "";
            const total =
              typeof order.totalAmount === "number"
                ? order.totalAmount
                : parseFloat(order.total_amount || "0");
            const orderNumber = order.orderNumber || order.order_number;
            const createdAt = order.createdAt || order.created_at;
            const paymentStatus = (order.paymentStatus || order.payment_status || "pending").toLowerCase();
            const paymentMethod = order.paymentMethod || order.payment_method || "cod";
            const orderType = (order.orderType || order.order_type || "delivery").toLowerCase();
            const status = (order.status || "pending").toLowerCase();
            const orderSlot = getOrderDeliverySlot(order);
            const isUpdating = updatingOrderId === orderId;

            return (
              <div
                key={orderId}
                onClick={() => navigate(`/admin/orders/${orderId}`)}
                className="bg-white rounded-xl border border-stone-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.03)] p-3.5 space-y-2.5 active:bg-stone-50/70 transition-colors cursor-pointer"
              >
                {/* Header Row: Order #, Fulfillment, Timestamp & Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-stone-900 text-sm tabular-nums">
                        #{orderNumber}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 capitalize">
                        {orderType === "delivery" ? (
                          <Truck className="w-3 h-3 text-stone-500" />
                        ) : (
                          <Store className="w-3 h-3 text-stone-500" />
                        )}
                        {orderType}
                      </span>
                      {orderSlot && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200/80 px-1.5 py-0.5 rounded">
                          <Clock className="w-2.5 h-2.5 text-amber-600" />
                          {orderSlot}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-400 tabular-nums mt-0.5">
                      {new Date(createdAt).toLocaleDateString()} •{" "}
                      {new Date(createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="shrink-0">{getStatusBadge(order.status)}</div>
                </div>

                {/* Items Preview Strip */}
                <div className="px-2.5 py-2 rounded-lg bg-stone-50 border border-stone-200/60 text-xs text-stone-700 font-medium line-clamp-2 leading-snug">
                  {formatItemSummary(order.items)}
                </div>

                {/* Customer & Payment Row */}
                <div className="flex items-center justify-between gap-2 text-xs pt-0.5">
                  <div className="min-w-0 flex items-center gap-2">
                    <span className="font-semibold text-stone-900 truncate">{customerName}</span>
                    {customerPhone && (
                      <a
                        href={`tel:${customerPhone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-semibold tabular-nums shrink-0"
                      >
                        <Phone className="w-2.5 h-2.5" />
                        {customerPhone}
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-semibold text-stone-500 uppercase">
                      {paymentMethod === "qr" ? "QR" : "COD"}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        paymentStatus === "paid"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                          : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {paymentStatus === "paid" ? "Paid" : "Unpaid"}
                    </span>
                  </div>
                </div>

                {/* Action Footer: Total + One-Tap Operations */}
                <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-stone-900 tabular-nums">
                    Rs. {total.toFixed(2)}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {status === "pending" && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={(e) => handleQuickStatusUpdate(e, orderId, "confirmed")}
                        className="h-8 px-3 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold text-xs inline-flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
                      >
                        {isUpdating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>Accept</span>
                      </button>
                    )}

                    {(status === "confirmed" || status === "preparing" || status === "ready") && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={(e) => handleQuickStatusUpdate(e, orderId, "delivered")}
                        className="h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs inline-flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
                      >
                        {isUpdating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>Complete</span>
                      </button>
                    )}

                    {orderType === "delivery" && status !== "cancelled" && (
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          `*🥩 Prime Cuts — Delivery Dispatch*\nOrder: #${orderNumber}\nCustomer: ${customerName} (${customerPhone})\n${
                            orderSlot ? `⏰ Delivery Time: ${orderSlot}\n` : ""
                          }${order.address ? `Address: ${order.address}\n` : ""}${
                            order.latitude && order.longitude
                              ? `Google Maps: https://www.google.com/maps?q=${order.latitude},${order.longitude}\n`
                              : ""
                          }*Collect: Rs. ${total.toFixed(2)} (${
                            paymentStatus === "paid" ? "PAID ONLINE" : "COLLECT CASH"
                          })*`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="h-8 px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs rounded-lg inline-flex items-center gap-1 transition-colors"
                        title="Send Rider Dispatch via WhatsApp"
                      >
                        <Bike className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Rider</span>
                      </a>
                    )}

                    <Link
                      to={`/admin/orders/${orderId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="h-8 px-2.5 bg-stone-900 text-white font-semibold text-xs rounded-lg inline-flex items-center gap-0.5 active:scale-95 transition-transform"
                    >
                      <span>Inspect</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================================================================= */}
      {/* DESKTOP SOFTWARE DATA TABLE (>= md)                               */}
      {/* ================================================================= */}
      {!loading && filteredOrders.length > 0 && (
        <div className="hidden md:block bg-white rounded-xl border border-stone-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-stone-50/90 border-b border-stone-200/80 text-stone-500 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4">Fulfillment</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filteredOrders.map((order: any) => {
                const orderId = (order.id || order._id)?.toString();
                const customerName = order.customerInfo?.name || order.customer_name || "Customer";
                const customerPhone = order.customerInfo?.phone || order.customer_phone || "";
                const total =
                  typeof order.totalAmount === "number"
                    ? order.totalAmount
                    : parseFloat(order.total_amount || "0");
                const orderNumber = order.orderNumber || order.order_number;
                const createdAt = order.createdAt || order.created_at;
                const paymentStatus = (order.paymentStatus || order.payment_status || "pending").toLowerCase();
                const paymentMethod = order.paymentMethod || order.payment_method;
                const transactionId = order.transactionId || order.transaction_id || "";
                const orderType = (order.orderType || order.order_type || "delivery").toLowerCase();
                const status = (order.status || "pending").toLowerCase();
                const orderSlot = getOrderDeliverySlot(order);
                const isUpdating = updatingOrderId === orderId;

                return (
                  <tr
                    key={orderId}
                    onClick={() => navigate(`/admin/orders/${orderId}`)}
                    className="hover:bg-stone-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-stone-900 tabular-nums">#{orderNumber}</div>
                      <div className="text-[11px] text-stone-400 tabular-nums mt-0.5">
                        {new Date(createdAt).toLocaleDateString()}{" "}
                        {new Date(createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-stone-900">{customerName}</p>
                      {customerPhone && (
                        <p className="text-[11px] text-stone-500 tabular-nums mt-0.5">{customerPhone}</p>
                      )}
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-stone-600 font-medium line-clamp-1">
                        {formatItemSummary(order.items)}
                      </p>
                      {orderSlot && (
                        <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200/80 px-1.5 py-0.5 rounded">
                          <Clock className="w-2.5 h-2.5 text-amber-600" />
                          {orderSlot}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-medium text-stone-700 capitalize">
                        {orderType === "delivery" ? (
                          <Truck className="w-3.5 h-3.5 text-stone-400" />
                        ) : (
                          <Store className="w-3.5 h-3.5 text-stone-400" />
                        )}
                        {orderType}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-stone-700 uppercase text-[11px]">
                          {paymentMethod === "qr" ? "QR" : "COD"}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            paymentStatus === "paid"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                              : "bg-stone-100 text-stone-600"
                          }`}
                        >
                          {paymentStatus === "paid" ? "Paid" : "Unpaid"}
                        </span>
                      </div>
                      {transactionId && (
                        <div className="text-[10px] font-mono text-stone-400 truncate max-w-[110px] mt-0.5">
                          #{transactionId}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">{getStatusBadge(order.status)}</td>

                    <td className="py-3 px-4 text-right font-bold text-stone-900 tabular-nums whitespace-nowrap">
                      Rs. {total.toFixed(2)}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {status === "pending" && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={(e) => handleQuickStatusUpdate(e, orderId, "confirmed")}
                            className="h-7 px-2.5 rounded-md bg-primary hover:bg-primary-hover text-white font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            {isUpdating ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            <span>Accept</span>
                          </button>
                        )}
                        {(status === "confirmed" || status === "preparing" || status === "ready") && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={(e) => handleQuickStatusUpdate(e, orderId, "delivered")}
                            className="h-7 px-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            {isUpdating ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3" />
                            )}
                            <span>Complete</span>
                          </button>
                        )}
                        <Link
                          to={`/admin/orders/${orderId}`}
                          className="h-7 px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 font-semibold text-[11px] rounded-md inline-flex items-center gap-1 transition-colors"
                        >
                          <span>Open</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
