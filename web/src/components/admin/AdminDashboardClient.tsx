import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Package,
  ShoppingCart,
  Clock,
  ArrowRight,
  Banknote,
  QrCode,
  Scale,
  Settings,
  Save,
  Loader2,
  RotateCcw,
  X,
  Plus,
  ChevronRight,
  Truck,
  Store,
  Check,
  Tags,
} from "lucide-react";
import { useAdminLive } from "../../context/AdminLiveContext";

interface AdminDashboardClientProps {
  initialTotalProducts?: number;
  initialAvailableProducts?: number;
  initialTotalOrders?: number;
  initialPendingOrders?: number;
  initialRecentOrders?: any[];
}

interface DailySummaryData {
  totalOrders: number;
  totalRevenue: number;
  totalCashRevenue: number;
  totalQrRevenue: number;
  totalKgSold: number;
  totalPiecesSold: number;
  categoryBreakdown: Record<string, { count: number; grams: number; revenue: number }>;
}

export default function AdminDashboardClient({
  initialTotalProducts = 0,
  initialAvailableProducts = 0,
  initialTotalOrders = 0,
  initialPendingOrders = 0,
  initialRecentOrders = [],
}: AdminDashboardClientProps) {
  const { stats, recentOrders } = useAdminLive();
  const navigate = useNavigate();

  const [dailySummary, setDailySummary] = useState<DailySummaryData | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [storeStatus, setStoreStatus] = useState<{
    isOpen: boolean;
    mode: "auto" | "force_open" | "force_closed";
    openTime: string;
    closeTime: string;
    freeDeliveryThreshold: number;
    deliveryCharge: number;
    closedMessage: string;
    riderPhone: string;
  }>({
    isOpen: true,
    mode: "auto",
    openTime: "07:00",
    closeTime: "20:00",
    freeDeliveryThreshold: 899,
    deliveryCharge: 50,
    closedMessage: "Our butcher shop is currently closed. Accepting pre-orders for morning delivery!",
    riderPhone: "+9779714324919",
  });

  const [savingStore, setSavingStore] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);

  const fetchDailySummary = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/reports/daily-summary");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.summary) {
          setDailySummary(json.summary);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch daily summary:", err);
    } finally {
      setLoadingSummary(false);
      setRefreshing(false);
    }
  };

  const fetchStoreSettings = async () => {
    try {
      const res = await fetch("/api/store/status");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setStoreStatus({
            isOpen: Boolean(json.isOpen),
            mode: json.mode || "auto",
            openTime: json.openTime || "07:00",
            closeTime: json.closeTime || "20:00",
            freeDeliveryThreshold: Number(json.freeDeliveryThreshold || 899),
            deliveryCharge: Number(json.deliveryCharge || 50),
            closedMessage: json.closedMessage || "Shop is closed.",
            riderPhone: json.riderPhone || "+9779714324919",
          });
        }
      }
    } catch (err) {
      console.warn("Failed to load store settings:", err);
    }
  };

  useEffect(() => {
    fetchDailySummary();
    fetchStoreSettings();
  }, []);

  const handleUpdateStoreMode = async (newMode: "auto" | "force_open" | "force_closed") => {
    setSavingStore(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/admin/store/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: newMode,
          openTime: storeStatus.openTime,
          closeTime: storeStatus.closeTime,
          closedMessage: storeStatus.closedMessage,
          riderPhone: storeStatus.riderPhone,
          freeDeliveryThreshold: storeStatus.freeDeliveryThreshold,
          deliveryCharge: storeStatus.deliveryCharge,
        }),
      });
      if (res.ok) {
        setStoreStatus((prev) => ({ ...prev, mode: newMode }));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        await fetchStoreSettings();
      }
    } catch (err) {
      console.error("Failed to update store mode:", err);
    } finally {
      setSavingStore(false);
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStore(true);
    try {
      const res = await fetch("/api/admin/store/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storeStatus),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setIsEditingSchedule(false);
        setTimeout(() => setSaveSuccess(false), 2000);
        await fetchStoreSettings();
      }
    } catch (err) {
      console.error("Failed to save schedule:", err);
    } finally {
      setSavingStore(false);
    }
  };

  const totalProducts = stats ? stats.totalProducts : initialTotalProducts;
  const availableProducts = stats ? stats.availableProducts : initialAvailableProducts;
  const totalOrders = stats ? stats.totalOrders : initialTotalOrders;
  const pendingOrders = stats ? stats.pendingOrders : initialPendingOrders;
  const displayOrders = recentOrders.length > 0 ? recentOrders : initialRecentOrders;

  const todayRevenue = dailySummary?.totalRevenue || 0;
  const todayOrders = dailySummary?.totalOrders || 0;
  const todayQr = dailySummary?.totalQrRevenue || 0;
  const todayCash = dailySummary?.totalCashRevenue || 0;
  const qrPercent = todayRevenue > 0 ? Math.round((todayQr / todayRevenue) * 100) : 0;

  const getStatusStyle = (status: string) => {
    const s = (status || "pending").toLowerCase();
    if (s === "delivered" || s === "completed") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
    }
    if (s === "cancelled") {
      return "bg-red-50 text-red-700 border-red-200/80";
    }
    if (s === "confirmed" || s === "preparing" || s === "ready" || s === "processing") {
      return "bg-blue-50 text-blue-700 border-blue-200/80";
    }
    return "bg-amber-50 text-amber-800 border-amber-200/80";
  };

  const categoryEntries = dailySummary?.categoryBreakdown
    ? Object.entries(dailySummary.categoryBreakdown).filter(([, v]) => v.revenue > 0 || v.count > 0)
    : [];

  return (
    <div className="space-y-3.5 sm:space-y-5 w-full">
      {/* ================================================================= */}
      {/* 1. STORE STATUS & QUICK ACTIONS TOOLBAR                           */}
      {/* ================================================================= */}
      <div className="bg-white rounded-xl border border-stone-200/90 p-3 sm:p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Live Store Status & Operating Hours */}
          <div className="flex items-center justify-between lg:justify-start gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  storeStatus.isOpen ? "bg-emerald-500" : "bg-red-500"
                }`}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-stone-900">
                    {storeStatus.isOpen ? "Store Accepting Orders" : "Store Closed (Pre-Order Mode)"}
                  </span>
                  {saveSuccess && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      <Check className="w-2.5 h-2.5" /> Saved
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-500 tabular-nums">
                  Hours: {storeStatus.openTime}–{storeStatus.closeTime} • Free delivery &gt; Rs. {storeStatus.freeDeliveryThreshold}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditingSchedule(!isEditingSchedule)}
              className={`lg:hidden h-8 px-2.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                isEditingSchedule
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Config</span>
            </button>
          </div>

          {/* Right: Segmented Store Mode Control + Config Button */}
          <div className="flex items-center gap-2">
            <div className="grid grid-cols-3 bg-stone-100 p-0.5 rounded-lg border border-stone-200/80 flex-1 sm:flex-initial">
              {(
                [
                  { id: "auto", label: "Auto Schedule" },
                  { id: "force_open", label: "Force Open" },
                  { id: "force_closed", label: "Force Closed" },
                ] as const
              ).map((item) => {
                const active = storeStatus.mode === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={savingStore}
                    onClick={() => handleUpdateStoreMode(item.id)}
                    className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer truncate ${
                      active
                        ? item.id === "force_open"
                          ? "bg-emerald-600 text-white shadow-2xs"
                          : item.id === "force_closed"
                          ? "bg-red-600 text-white shadow-2xs"
                          : "bg-white text-stone-900 shadow-2xs"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setIsEditingSchedule(!isEditingSchedule)}
              className={`hidden lg:inline-flex h-8 px-3 rounded-lg border text-xs font-semibold items-center gap-1.5 transition-colors cursor-pointer ${
                isEditingSchedule
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Store Config</span>
            </button>
          </div>
        </div>

        {/* Collapsible Store Config Drawer */}
        {isEditingSchedule && (
          <form
            onSubmit={handleSaveSchedule}
            className="mt-3.5 pt-3.5 border-t border-stone-200/80 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                Operating Hours & Delivery Parameters
              </span>
              <button
                type="button"
                onClick={() => setIsEditingSchedule(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
              <div>
                <label className="block font-semibold text-stone-600 mb-1">Open Time</label>
                <input
                  type="time"
                  value={storeStatus.openTime}
                  onChange={(e) => setStoreStatus({ ...storeStatus, openTime: e.target.value })}
                  className="w-full h-9 px-2.5 rounded-lg border border-stone-300 font-semibold bg-white text-stone-900 tabular-nums"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-600 mb-1">Close Time</label>
                <input
                  type="time"
                  value={storeStatus.closeTime}
                  onChange={(e) => setStoreStatus({ ...storeStatus, closeTime: e.target.value })}
                  className="w-full h-9 px-2.5 rounded-lg border border-stone-300 font-semibold bg-white text-stone-900 tabular-nums"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-600 mb-1">Free Delivery (Rs.)</label>
                <input
                  type="number"
                  value={storeStatus.freeDeliveryThreshold}
                  onChange={(e) =>
                    setStoreStatus({ ...storeStatus, freeDeliveryThreshold: Number(e.target.value) })
                  }
                  className="w-full h-9 px-2.5 rounded-lg border border-stone-300 font-semibold bg-white text-stone-900 tabular-nums"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-600 mb-1">Delivery Fee (Rs.)</label>
                <input
                  type="number"
                  value={storeStatus.deliveryCharge}
                  onChange={(e) =>
                    setStoreStatus({ ...storeStatus, deliveryCharge: Number(e.target.value) })
                  }
                  className="w-full h-9 px-2.5 rounded-lg border border-stone-300 font-semibold bg-white text-stone-900 tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className="block font-semibold text-stone-600 mb-1">Rider Dispatch Phone</label>
                <input
                  type="text"
                  value={storeStatus.riderPhone}
                  onChange={(e) => setStoreStatus({ ...storeStatus, riderPhone: e.target.value })}
                  className="w-full h-9 px-2.5 rounded-lg border border-stone-300 font-semibold bg-white text-stone-900 tabular-nums"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-600 mb-1">Closed Banner Message</label>
                <input
                  type="text"
                  value={storeStatus.closedMessage}
                  onChange={(e) => setStoreStatus({ ...storeStatus, closedMessage: e.target.value })}
                  className="w-full h-9 px-2.5 rounded-lg border border-stone-300 font-medium bg-white text-stone-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditingSchedule(false)}
                className="h-8 px-3 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingStore}
                className="h-8 px-3.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                {savingStore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ================================================================= */}
      {/* 2. MOBILE QUICK ACTION SHORTCUTS                                  */}
      {/* ================================================================= */}
      <div className="grid grid-cols-3 gap-2 md:hidden">
        <Link
          to="/admin/products/new"
          className="h-10 bg-stone-900 text-white rounded-xl px-3 flex items-center justify-center gap-1.5 text-xs font-semibold active:scale-97 transition-transform shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 text-primary stroke-[2.5]" />
          <span>Add Cut</span>
        </Link>
        <Link
          to="/admin/orders"
          className="h-10 bg-white border border-stone-200/90 text-stone-800 rounded-xl px-3 flex items-center justify-center gap-1.5 text-xs font-semibold active:scale-97 transition-transform"
        >
          <ShoppingCart className="w-3.5 h-3.5 text-stone-500" />
          <span>Orders</span>
          {pendingOrders > 0 && (
            <span className="px-1.5 py-0.2 bg-primary text-white rounded text-[10px] font-bold tabular-nums">
              {pendingOrders}
            </span>
          )}
        </Link>
        <Link
          to="/admin/products"
          className="h-10 bg-white border border-stone-200/90 text-stone-800 rounded-xl px-3 flex items-center justify-center gap-1.5 text-xs font-semibold active:scale-97 transition-transform"
        >
          <Package className="w-3.5 h-3.5 text-stone-500" />
          <span>Stock ({availableProducts})</span>
        </Link>
      </div>

      {/* ================================================================= */}
      {/* 3. TODAY'S TELEMETRY & KPI STRIP                                  */}
      {/* ================================================================= */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Today's Telemetry & Inventory
          </span>
          <button
            type="button"
            onClick={() => fetchDailySummary(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
          >
            <RotateCcw className={`w-3 h-3 ${refreshing ? "animate-spin text-primary" : "text-stone-400"}`} />
            <span>Sync</span>
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          {/* Metric 1: Today's Gross Revenue */}
          <div className="bg-white rounded-xl border border-stone-200/90 p-3.5 sm:p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-stone-500 mb-1.5">
              <span className="text-[11px] font-semibold">Today's Revenue</span>
              <Banknote className="w-4 h-4 text-stone-400" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-stone-900 tracking-tight tabular-nums">
                {loadingSummary ? "—" : `Rs. ${todayRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </p>
              <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-stone-100 text-[11px] text-stone-500 tabular-nums">
                <span>{todayOrders} {todayOrders === 1 ? "order" : "orders"} today</span>
                <span className="font-semibold text-stone-700">{totalOrders} total</span>
              </div>
            </div>
          </div>

          {/* Metric 2: Payment Collection Split (QR vs Cash) */}
          <div className="bg-white rounded-xl border border-stone-200/90 p-3.5 sm:p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-stone-500 mb-1.5">
              <span className="text-[11px] font-semibold">Cash vs QR Split</span>
              <QrCode className="w-4 h-4 text-stone-400" />
            </div>
            <div>
              <div className="flex items-baseline justify-between gap-1 tabular-nums">
                <div>
                  <span className="text-[10px] font-semibold text-stone-400 uppercase block">COD Cash</span>
                  <span className="text-sm sm:text-base font-bold text-stone-900">
                    Rs. {todayCash.toFixed(0)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-stone-400 uppercase block">QR Online</span>
                  <span className="text-sm sm:text-base font-bold text-stone-900">
                    Rs. {todayQr.toFixed(0)}
                  </span>
                </div>
              </div>
              <div className="mt-2 pt-1.5 border-t border-stone-100">
                <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden flex">
                  <div
                    className="bg-stone-800 h-full transition-all"
                    style={{ width: `${todayRevenue > 0 ? 100 - qrPercent : 50}%` }}
                  />
                  <div
                    className="bg-primary h-full transition-all"
                    style={{ width: `${todayRevenue > 0 ? qrPercent : 50}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Metric 3: Meat Volume Dispatched */}
          <div className="bg-white rounded-xl border border-stone-200/90 p-3.5 sm:p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-stone-500 mb-1.5">
              <span className="text-[11px] font-semibold">Meat Dispatched</span>
              <Scale className="w-4 h-4 text-stone-400" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-stone-900 tracking-tight tabular-nums">
                {loadingSummary ? "—" : `${dailySummary?.totalKgSold || 0} kg`}
              </p>
              <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-stone-100 text-[11px] text-stone-500 tabular-nums">
                <span>Unit / Pack items</span>
                <span className="font-semibold text-stone-700">+{dailySummary?.totalPiecesSold || 0} pcs</span>
              </div>
            </div>
          </div>

          {/* Metric 4: Active Queue & Stock Health */}
          <div className="bg-white rounded-xl border border-stone-200/90 p-3.5 sm:p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-stone-500 mb-1.5">
              <span className="text-[11px] font-semibold">Queue & Catalog</span>
              <Clock className="w-4 h-4 text-stone-400" />
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <p className="text-lg sm:text-2xl font-bold text-stone-900 tracking-tight tabular-nums flex items-center gap-1.5">
                  <span>{pendingOrders}</span>
                  <span className="text-xs font-medium text-stone-500">pending</span>
                  {pendingOrders > 0 && (
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  )}
                </p>
              </div>
              <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-stone-100 text-[11px] text-stone-500 tabular-nums">
                <span>Active stock</span>
                <span className="font-semibold text-stone-700">
                  {availableProducts}/{totalProducts} cuts
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Volume Breakdown (shown when sales exist today) */}
      {categoryEntries.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200/90 p-3.5 sm:p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <Tags className="w-3.5 h-3.5 text-stone-400" />
              Today's Category Breakdown
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {categoryEntries.map(([catName, info]) => (
              <div
                key={catName}
                className="px-3 py-2 rounded-lg bg-stone-50 border border-stone-200/70 flex items-center justify-between text-xs tabular-nums"
              >
                <div className="min-w-0 pr-2">
                  <p className="font-semibold text-stone-800 truncate">{catName}</p>
                  <p className="text-[10px] text-stone-500">
                    {info.grams > 0 ? `${(info.grams / 1000).toFixed(2)} kg` : `${info.count} items`}
                  </p>
                </div>
                <span className="font-bold text-stone-900 shrink-0">Rs. {info.revenue.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 4. RECENT ORDERS QUEUE (Mobile Native List + Desktop Table)       */}
      {/* ================================================================= */}
      <div className="bg-white rounded-xl border border-stone-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-stone-900">Recent Orders</h2>
            <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded tabular-nums">
              {displayOrders.length}
            </span>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>Open Full Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {displayOrders.length === 0 ? (
          <div className="p-8 text-center text-stone-400 text-xs font-medium">
            No recent orders yet.
          </div>
        ) : (
          <>
            {/* Mobile Native Order List (< md) */}
            <div className="divide-y divide-stone-100 md:hidden">
              {displayOrders.map((order: any) => {
                const orderId = order.id || order._id;
                const orderNumber = order.orderNumber || order.order_number;
                const customerName = order.customerInfo?.name || order.customer_name || "Customer";
                const total =
                  typeof order.totalAmount === "number"
                    ? order.totalAmount
                    : parseFloat(order.total_amount || "0");
                const orderType = (order.orderType || order.order_type || "delivery").toLowerCase();
                const status = order.status || "pending";

                return (
                  <div
                    key={orderId}
                    onClick={() => navigate(`/admin/orders/${orderId}`)}
                    className="px-3.5 py-3 flex items-center justify-between gap-3 active:bg-stone-50 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-900 tabular-nums">
                          #{orderNumber}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize border ${getStatusStyle(
                            status
                          )}`}
                        >
                          {status}
                        </span>
                        <span className="text-[10px] font-medium text-stone-400 capitalize flex items-center gap-0.5">
                          {orderType === "delivery" ? (
                            <Truck className="w-3 h-3" />
                          ) : (
                            <Store className="w-3 h-3" />
                          )}
                          {orderType}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-stone-600 truncate mt-0.5">
                        {customerName}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-stone-900 tabular-nums">
                        Rs. {total.toFixed(2)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-stone-400" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Software Data Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-stone-50/80 border-b border-stone-200/80 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Order ID</th>
                    <th className="py-2.5 px-4">Customer</th>
                    <th className="py-2.5 px-4">Fulfillment</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                    <th className="py-2.5 px-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs">
                  {displayOrders.map((order: any) => {
                    const orderId = order.id || order._id;
                    const orderNumber = order.orderNumber || order.order_number;
                    const customerName = order.customerInfo?.name || order.customer_name || "Customer";
                    const total =
                      typeof order.totalAmount === "number"
                        ? order.totalAmount
                        : parseFloat(order.total_amount || "0");
                    const orderType = (order.orderType || order.order_type || "delivery").toLowerCase();
                    const status = order.status || "pending";

                    return (
                      <tr
                        key={orderId}
                        onClick={() => navigate(`/admin/orders/${orderId}`)}
                        className="hover:bg-stone-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4 font-bold text-stone-900 tabular-nums">
                          #{orderNumber}
                        </td>
                        <td className="py-3 px-4 font-semibold text-stone-700">{customerName}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-stone-600 font-medium capitalize">
                            {orderType === "delivery" ? (
                              <Truck className="w-3.5 h-3.5 text-stone-400" />
                            ) : (
                              <Store className="w-3.5 h-3.5 text-stone-400" />
                            )}
                            {orderType}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold capitalize border ${getStatusStyle(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-stone-900 tabular-nums">
                          Rs. {total.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900 inline" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
