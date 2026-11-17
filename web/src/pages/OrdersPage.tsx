import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  Package,
  Calendar,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  Printer,
  ShoppingBag,
} from "lucide-react";
import { useUser } from "../context/UserContext";
import { useCart } from "../context/CartContext";
import { printThermalReceipt } from "../utils/printThermalReceipt";
import { getOrderDeliverySlot } from "../utils/orderUtils";
import SEO from "../components/SEO";

export default function OrdersPage() {
  const { user, isLoading } = useUser();
  const { addWeightItem, addVariantItem, openCart } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState("");
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login?from=/orders");
      return;
    }

    async function loadOrders() {
      if (!user) return;
      setLoadingOrders(true);
      try {
        const res = await fetch("/api/orders");
        const data = await res.json();
        if (data.success && data.orders) {
          setOrders(data.orders);
        } else {
          setError(data.error || "Failed to load orders");
        }
      } catch (err) {
        setError("Network error loading orders");
      } finally {
        setLoadingOrders(false);
      }
    }

    if (user) {
      loadOrders();
    }
  }, [user, isLoading, navigate]);

  const handleReorder = (order: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setReorderingId(order.id || order._id);

    const items = order.items || [];
    for (const item of items) {
      if (item.selectedWeightInGrams) {
        addWeightItem(
          {
            id: item.productId || item.id || `reorder-${item.productName}`,
            name: item.productName || item.name,
            slug: item.slug || "meat-cut",
            priceType: "weight",
            pricePerKg:
              item.pricePerKgAtTimeOfOrder ||
              item.unitPriceAtTimeOfOrder ||
              item.price,
            image: item.image || "/images/meat_goat_bone.jpg",
          },
          item.selectedWeightInGrams,
          item.qty || 1
        );
      } else {
        addVariantItem(
          {
            id: item.productId || item.id || `reorder-${item.productName}`,
            name: item.productName || item.name,
            slug: item.slug || "meat-cut",
            priceType: "variant",
            image: item.image || "/images/meat_sausages.jpg",
          },
          item.selectedVariantName || item.variantName || "Standard",
          item.unitPriceAtTimeOfOrder || item.price || 0,
          item.qty || 1
        );
      }
    }

    setTimeout(() => {
      setReorderingId(null);
      openCart();
    }, 400);
  };

  const handlePrintSlip = (order: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    printThermalReceipt(order);
  };

  if (isLoading || loadingOrders) {
    return (
      <div className="min-h-[70vh] bg-[#f8f8f9] flex items-center justify-center p-4">
        <div className="text-zinc-500 font-medium text-sm flex items-center gap-2">
          <Clock className="w-4 h-4 animate-spin text-primary" /> Loading your orders...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] bg-[#f8f8f9] flex flex-col items-center justify-center p-4 text-center">
        <p className="text-primary font-semibold mb-4">{error}</p>
        <Link
          to="/"
          className="px-5 py-2.5 bg-primary text-white font-semibold rounded-lg text-sm"
        >
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f9] text-zinc-900 pt-[max(calc(env(safe-area-inset-top,0px)+16px),24px)] pb-16 md:py-10">
      <SEO
        title="My Meat Orders & Live Tracking"
        description="Track your live fresh meat orders and view receipts from Prime Cuts Butcher House Pokhara."
        url="/orders"
      />
      <div className="max-w-4xl mx-auto px-3.5 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-50 flex items-center justify-center text-zinc-700 shrink-0 cursor-pointer"
              title="Go back"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                Order History & Tracking
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                View receipts, live preparation status, and reorder past cuts
              </p>
            </div>
          </div>
          <a
            href="/#shop-cuts"
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Shop Fresh Cuts</span>
          </a>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-8 sm:p-12 text-center">
            <div className="w-12 h-12 bg-zinc-100 text-zinc-600 rounded-xl flex items-center justify-center mx-auto mb-3 border border-zinc-200">
              <Package className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 mb-1.5">
              No Past Orders Yet
            </h2>
            <p className="text-zinc-500 text-xs sm:text-sm max-w-sm mx-auto mb-5 leading-relaxed">
              When you order fresh goat, chicken, sausages, or farm eggs, your live tracking and receipts will appear here.
            </p>
            <a
              href="/#shop-cuts"
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold text-xs px-5 py-2.5 rounded-lg hover:bg-primary-hover transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Browse Fresh Cuts</span>
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => {
              const orderId = order.id || order._id;
              const orderNumber = order.orderNumber || order.order_number;
              const totalAmount = Number(
                order.totalAmount || order.total_amount || 0
              );
              const createdAt = order.createdAt || order.created_at;
              const items = order.items || [];
              const orderSlot = getOrderDeliverySlot(order);
              const isReordering = reorderingId === orderId;

              let statusBadge = "bg-zinc-100 text-zinc-800 border-zinc-200";
              let StatusIcon = Clock;

              if (order.status === "delivered" || order.status === "completed") {
                statusBadge = "bg-zinc-900 text-white border-zinc-900";
                StatusIcon = CheckCircle2;
              } else if (order.status === "cancelled") {
                statusBadge = "bg-red-50 text-primary border-red-200";
                StatusIcon = XCircle;
              } else if (order.status === "ready") {
                statusBadge = "bg-zinc-900 text-white border-zinc-900";
                StatusIcon = Package;
              }

              return (
                <div
                  key={orderId}
                  className="bg-white border border-zinc-200 hover:border-zinc-300 rounded-xl p-4 sm:p-5 transition-all"
                >
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-3.5 border-b border-zinc-100">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-xs sm:text-sm text-zinc-900 bg-zinc-100 px-2.5 py-1 rounded-md border border-zinc-200">
                          #{orderNumber}
                        </span>
                        <span className="text-xs text-zinc-500 font-medium flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                          {new Date(createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {orderSlot && (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded-md mt-2 w-fit">
                          <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>Delivery Slot: {orderSlot}</span>
                        </div>
                      )}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-md border ${statusBadge}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{order.status}</span>
                    </span>
                  </div>

                  {/* Items List */}
                  <div className="py-2.5 space-y-1.5 bg-zinc-50 rounded-lg px-3 my-2.5 border border-zinc-100">
                    {items.map((item: any, idx: number) => {
                      const weightUnit = item.selectedWeightInGrams
                        ? item.selectedWeightInGrams >= 1000
                          ? `${item.selectedWeightInGrams / 1000} kg`
                          : `${item.selectedWeightInGrams}g`
                        : item.selectedVariantName || "";

                      return (
                        <div
                          key={idx}
                          className="flex justify-between items-center text-xs gap-2"
                        >
                          <div className="flex items-center gap-2 text-zinc-800 min-w-0 flex-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
                            <span className="font-semibold truncate">
                              {item.productName || item.name}
                            </span>
                            <span className="text-zinc-500 text-[11px] shrink-0 whitespace-nowrap tabular-nums">
                              ({weightUnit} × {item.qty})
                            </span>
                          </div>
                          <span className="font-semibold text-zinc-900 text-xs shrink-0 whitespace-nowrap tabular-nums">
                            Rs.{" "}
                            {Number(
                              item.calculatedPrice || item.price || 0
                            ).toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Total & Action Buttons */}
                  <div className="pt-3 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center justify-between sm:justify-start gap-2.5 min-w-0">
                      <div className="flex items-baseline gap-1.5 truncate tabular-nums">
                        <span className="text-xs text-zinc-500 font-medium">
                          Total:
                        </span>
                        <span className="text-base font-bold text-zinc-900">
                          Rs. {totalAmount.toFixed(2)}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 shrink-0">
                        {order.orderType === "delivery" ? "Delivery" : "Pickup"} •{" "}
                        {order.paymentMethod?.toUpperCase() || "COD"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-2">
                      <button
                        onClick={(e) => handleReorder(order, e)}
                        disabled={isReordering}
                        className="py-1.5 px-3 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <RotateCcw
                          className={`w-3.5 h-3.5 ${
                            isReordering ? "animate-spin" : ""
                          }`}
                        />
                        <span>{isReordering ? "Adding..." : "Reorder"}</span>
                      </button>

                      <button
                        onClick={(e) => handlePrintSlip(order, e)}
                        className="py-1.5 px-3 bg-white hover:bg-zinc-50 text-zinc-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-zinc-200 whitespace-nowrap"
                        title="Print Receipt"
                      >
                        <Printer className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Receipt</span>
                      </button>

                      <Link
                        to={`/orders/${orderNumber}`}
                        className="py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
