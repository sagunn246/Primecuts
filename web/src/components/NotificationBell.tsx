import { useEffect, useState, useRef, useContext } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  BellOff,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  Clock,
  ChefHat,
  PackageCheck,
  XCircle,
  Send,
  Smartphone,
  ShoppingBag,
  X,
} from "lucide-react";
import { UserContext } from "../context/UserContext";
import { AnimatePresence, motion } from "framer-motion";
import {
  getPushNotificationState,
  registerDevicePushSubscription,
  unsubscribeDevicePushSubscription,
  triggerDeviceNotification,
} from "../utils/deviceNotification";

export interface NotificationBellProps {
  type: "customer" | "admin";
  theme?: "light" | "dark";
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function NotificationBell({ type, theme = "dark" }: NotificationBellProps) {
  const userContext = useContext(UserContext);
  const user = userContext ? userContext.user : null;
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [requiresIOSInstall, setRequiresIOSInstall] = useState(false);
  const [supported, setSupported] = useState(true);
  const [loading, setLoading] = useState(false);
  const [testFeedback, setTestFeedback] = useState("");
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [fetchingNotifications, setFetchingNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastUnreadCountRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = async () => {
    if (type === "customer" && !user) {
      setUnreadCount(0);
      lastUnreadCountRef.current = 0;
      return;
    }
    try {
      const url =
        type === "admin"
          ? "/api/admin/notifications/unread-count"
          : "/api/notifications/unread-count";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const nextCount = Number(data.count || 0);
          if (
            lastUnreadCountRef.current !== null &&
            nextCount > lastUnreadCountRef.current &&
            type === "customer"
          ) {
            triggerDeviceNotification("Prime Cuts — Order Update", {
              body: "You have a new update on your meat order. Tap to view details.",
              url: "/orders",
              tag: `prime-cuts-unread-${nextCount}`,
            }).catch(() => {});
          }
          lastUnreadCountRef.current = nextCount;
          setUnreadCount(nextCount);
        }
      }
    } catch (err) {
      console.error("[Bell] Failed to fetch unread count:", err);
    }
  };

  const fetchNotifications = async () => {
    if (type === "customer" && !user) {
      setNotifications([]);
      return;
    }
    setFetchingNotifications(true);
    try {
      const url = type === "admin" ? "/api/admin/notifications" : "/api/notifications";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications || []);
        }
      }
    } catch (err) {
      console.error("[Bell] Failed to fetch notifications:", err);
    } finally {
      setFetchingNotifications(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const url =
        type === "admin"
          ? `/api/admin/notifications/${id}/read`
          : `/api/notifications/${id}/read`;
      const res = await fetch(url, { method: "PATCH" });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        fetchUnreadCount();
      }
    } catch (err) {
      console.error("[Bell] Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const url =
        type === "admin"
          ? "/api/admin/notifications/read-all"
          : "/api/notifications/read-all";
      const res = await fetch(url, { method: "PATCH" });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("[Bell] Failed to mark all as read:", err);
    }
  };

  const checkStatus = async () => {
    const state = await getPushNotificationState();
    setSupported(state.supported);
    setRequiresIOSInstall(state.requiresIOSInstall);
    setPermission(state.permission);
    setSubscribed(state.subscribed);
    fetchUnreadCount();
  };

  useEffect(() => {
    if (isOpen) {
      checkStatus();
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    checkStatus();

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handlePushReceived = () => {
      fetchUnreadCount();
      if (isOpen) fetchNotifications();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    window.addEventListener("focus", fetchUnreadCount);
    window.addEventListener("primecuts:push-received", handlePushReceived);

    const interval = setInterval(fetchUnreadCount, 20000);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("focus", fetchUnreadCount);
      window.removeEventListener("primecuts:push-received", handlePushReceived);
      clearInterval(interval);
    };
  }, [user, type]);

  const handleSubscribe = async () => {
    setLoading(true);
    setError("");
    setTestFeedback("");
    try {
      const sub = await registerDevicePushSubscription(
        type,
        type === "customer" ? user?.id : undefined
      );
      setSubscribed(true);
      setPermission("granted");
      fetchUnreadCount();

      await triggerDeviceNotification("Prime Cuts Alerts Enabled", {
        body:
          type === "admin"
            ? "You will now receive instant order alerts in your device notification center."
            : "You will now receive live meat order updates in your phone notification center.",
        url: type === "admin" ? "/admin/orders" : "/orders",
        tag: "prime-cuts-welcome",
      });

      if (sub?.endpoint) {
        await fetch("/api/push/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            userId: type === "customer" ? user?.id : undefined,
            endpoint: sub.endpoint,
            title: "Prime Cuts Alerts Active",
            body: "Mobile push notifications are connected to your device notification center.",
          }),
        }).catch(() => { });
      }
    } catch (err: any) {
      console.error("[Bell] Registration failed:", err);
      setError(err.message || "Failed to enable notifications.");
    } finally {
      setLoading(false);
    }
  };

  const handleTestPush = async () => {
    setLoading(true);
    setError("");
    setTestFeedback("");
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg ? await reg.pushManager.getSubscription() : null;

      await triggerDeviceNotification(
        type === "admin" ? "Prime Cuts — Admin Alert" : "Prime Cuts — Order Update",
        {
          body:
            type === "admin"
              ? "Test alert: Real-time notifications are working on your device."
              : "Test alert: Live order updates will appear in your mobile notification center.",
          url: type === "admin" ? "/admin/orders" : "/orders",
        }
      );

      const res = await fetch("/api/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          userId: type === "customer" ? user?.id : undefined,
          endpoint: sub?.endpoint,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestFeedback("Test alert sent to your notification center.");
      } else {
        setError(data.message || data.error || "Push test could not reach server.");
      }
    } catch (err: any) {
      setError(err.message || "Test push failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    setError("");
    setTestFeedback("");
    try {
      await unsubscribeDevicePushSubscription();
      setSubscribed(false);
    } catch (err: any) {
      console.error("[Bell] Unsubscribe failed:", err);
      setError(err.message || "Failed to disable notifications.");
    } finally {
      setLoading(false);
    }
  };

  let badgeColor = "bg-stone-400";
  let statusMessage = "Off";

  if (requiresIOSInstall) {
    badgeColor = "bg-amber-500";
    statusMessage = "Add to Home";
  } else if (permission === "denied") {
    badgeColor = "bg-red-500";
    statusMessage = "Blocked";
  } else if (subscribed && permission === "granted") {
    badgeColor = "bg-emerald-500";
    statusMessage = "Active";
  } else {
    badgeColor = "bg-stone-400";
    statusMessage = "Enable";
  }

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={`relative h-9 w-9 rounded-xl flex items-center justify-center transition-all active:scale-95 focus:outline-none cursor-pointer ${theme === "light"
            ? "bg-stone-100 hover:bg-stone-200/80 border border-stone-200/90 text-stone-800"
            : "bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700/80 text-white"
          }`}
        title="Notifications & Push Alerts"
        aria-label="Notifications"
      >
        {permission === "denied" ? (
          <BellOff className="w-4 h-4 text-red-500 stroke-[2.2]" />
        ) : (
          <Bell
            className={`w-4 h-4 stroke-[2.2] ${subscribed
                ? "text-primary"
                : theme === "light"
                  ? "text-stone-800"
                  : "text-white"
              }`}
          />
        )}

        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] font-black min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center border border-white/20 tabular-nums shadow-xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : (
          <span
            className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full border ${theme === "light" ? "border-white" : "border-[#111]"
              } ${badgeColor}`}
          />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            className="fixed top-15 left-3 right-3 w-auto md:absolute md:top-full md:right-0 md:left-auto md:mt-2 md:w-92 bg-stone-950/98 backdrop-blur-xl border border-stone-800 rounded-2xl p-4 shadow-2xl z-[9999] text-white"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary shrink-0" />
                <span className="font-extrabold text-sm tracking-wide">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className="text-[10px] text-stone-400 hover:text-white underline transition-colors cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${subscribed
                      ? "bg-emerald-500/15 text-emerald-400"
                      : permission === "denied"
                        ? "bg-red-500/15 text-red-400"
                        : "bg-white/10 text-stone-300"
                    }`}
                >
                  {statusMessage}
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Close notifications"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Push Control Banner */}
            <div className="pt-3 pb-2 space-y-2">
              {requiresIOSInstall ? (
                <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-3 flex gap-2 text-amber-300">
                  <Smartphone className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-medium leading-relaxed">
                    On iPhone/iPad: tap <strong>Share</strong> and select{" "}
                    <strong>Add to Home Screen</strong>, then open Prime Cuts from
                    your Home Screen to enable mobile push notifications.
                  </p>
                </div>
              ) : permission === "denied" ? (
                <div className="bg-red-950/25 border border-red-900/40 rounded-xl p-3 flex gap-2 text-red-400">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-semibold leading-normal">
                    Notifications are blocked. Allow notifications in your browser or
                    device app settings.
                  </p>
                </div>
              ) : !supported ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-[11px] text-stone-300">
                  Push notifications are not supported on this browser.
                </div>
              ) : !subscribed ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2.5">
                  <p className="text-[11px] text-stone-300 leading-normal">
                    Turn on push notifications to get instant alerts in your mobile
                    notification center.
                  </p>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleSubscribe}
                    className="w-full py-2.5 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-wider hover:bg-primary/90 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Bell className="w-3.5 h-3.5" />
                        <span>Enable Notifications</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleTestPush}
                    className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 text-primary" />
                        <span>Test Alert</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleUnsubscribe}
                    className="py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-[11px] cursor-pointer transition-colors"
                  >
                    Turn Off
                  </button>
                </div>
              )}

              {testFeedback && (
                <div className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/30 p-2 rounded-xl border border-emerald-800/40 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{testFeedback}</span>
                </div>
              )}

              {error && (
                <div className="text-[10px] text-red-400 font-semibold bg-red-950/25 p-2 rounded-xl border border-red-900/30 flex items-start gap-1.5 leading-normal">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Notification Inbox */}
            <div className="pt-2 border-t border-white/10">
              {type === "customer" && !user ? (
                <div className="text-center py-4 space-y-2">
                  <p className="text-xs text-stone-400">
                    Sign in to view your order notifications and history.
                  </p>
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="inline-block px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-bold text-white"
                  >
                    Sign In
                  </Link>
                </div>
              ) : fetchingNotifications ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-5 text-stone-500">
                  <CheckCircle2 className="w-7 h-7 mx-auto mb-1.5 text-stone-600" />
                  <p className="text-xs font-semibold">
                    {type === "admin"
                      ? "No new order notifications."
                      : "No order notifications yet."}
                  </p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {notifications.map((notif) => {
                    if (type === "admin") {
                      const isCancelNotif =
                        notif.type === "ORDER_CANCELLED_BY_USER" ||
                        notif.type === "ORDER_CANCELLED";

                      const statusColor = isCancelNotif
                        ? "border-l-4 border-red-500 bg-red-500/5 hover:bg-red-500/10"
                        : "border-l-4 border-amber-500 bg-amber-500/5 hover:bg-amber-500/10";
                      const StatusIcon = isCancelNotif ? XCircle : ShoppingBag;

                      const targetUrl = notif.order
                        ? `/admin/orders/${notif.order.id}`
                        : "/admin/orders";

                      return (
                        <Link
                          key={notif.id}
                          to={targetUrl}
                          onClick={() => {
                            setIsOpen(false);
                            handleMarkAsRead(notif.id);
                          }}
                          className={`block rounded-xl p-3 border transition-all text-left ${statusColor} ${notif.read
                              ? "opacity-60 border-white/5"
                              : "border-white/20 shadow-md shadow-white/5"
                            }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-[11px] font-black text-white flex items-center gap-1.5 leading-tight">
                              <StatusIcon className="w-3.5 h-3.5 shrink-0 text-primary" />
                              <span>{notif.title}</span>
                              {!notif.read && (
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 self-center" />
                              )}
                            </span>
                            <span className="text-[9px] text-stone-400 shrink-0 font-medium">
                              {formatTimeAgo(notif.createdAt)}
                            </span>
                          </div>

                          <p className="text-[10px] text-stone-200 font-bold mt-1.5">
                            {notif.order?.customerName || "Customer"}
                          </p>
                          <p className="text-[10px] text-stone-400 mt-0.5 leading-normal whitespace-pre-line">
                            {notif.message}
                          </p>

                          {notif.order && (
                            <div className="flex gap-1.5 mt-2">
                              <span className="text-[8px] uppercase font-black px-1.5 py-0.5 rounded bg-white/10 text-stone-300">
                                Rs. {Number(notif.order.total || 0).toFixed(2)}
                              </span>
                              {notif.order.status && (
                                <span className="text-[8px] uppercase font-black px-1.5 py-0.5 rounded bg-white/10 text-stone-300">
                                  {notif.order.status}
                                </span>
                              )}
                            </div>
                          )}
                        </Link>
                      );
                    }

                    let statusColor =
                      "border-l-4 border-stone-600 bg-stone-900/40 hover:bg-stone-900/60";
                    let StatusIcon = ShoppingBag;

                    if (notif.type === "ORDER_PREPARING") {
                      statusColor =
                        "border-l-4 border-amber-500 bg-amber-500/5 hover:bg-amber-500/10";
                      StatusIcon = ChefHat;
                    } else if (notif.type === "ORDER_READY") {
                      statusColor =
                        "border-l-4 border-purple-500 bg-purple-500/5 hover:bg-purple-500/10";
                      StatusIcon = PackageCheck;
                    } else if (notif.type === "ORDER_COMPLETED") {
                      statusColor =
                        "border-l-4 border-green-500 bg-green-500/5 hover:bg-green-500/10";
                      StatusIcon = CheckCircle2;
                    } else if (notif.type === "ORDER_CANCELLED") {
                      statusColor =
                        "border-l-4 border-red-500 bg-red-500/5 hover:bg-red-500/10";
                      StatusIcon = XCircle;
                    } else if (notif.type === "ORDER_CONFIRMED") {
                      statusColor =
                        "border-l-4 border-blue-500 bg-blue-500/5 hover:bg-blue-500/10";
                      StatusIcon = CheckCircle2;
                    }

                    const targetUrl = notif.order
                      ? `/orders/${notif.order.orderNumber}`
                      : "/orders";

                    return (
                      <Link
                        key={notif.id}
                        to={targetUrl}
                        onClick={() => {
                          setIsOpen(false);
                          handleMarkAsRead(notif.id);
                        }}
                        className={`block rounded-xl p-3 border transition-all text-left ${statusColor} ${notif.read
                            ? "opacity-60 border-white/5"
                            : "border-white/20 shadow-md shadow-white/5"
                          }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[11px] font-black text-white flex items-center gap-1.5 leading-tight">
                            <StatusIcon className="w-3.5 h-3.5 shrink-0 text-primary" />
                            <span>{notif.title}</span>
                            {!notif.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 self-center" />
                            )}
                          </span>
                          <span className="text-[9px] text-stone-400 shrink-0 font-medium">
                            {formatTimeAgo(notif.createdAt)}
                          </span>
                        </div>

                        <p className="text-[10px] text-stone-300 mt-1.5 font-semibold leading-normal">
                          {notif.message}
                        </p>

                        {notif.order && (
                          <div className="flex gap-1.5 mt-2">
                            <span className="text-[8px] uppercase font-black px-1.5 py-0.5 rounded bg-white/10 text-stone-300">
                              Status: {notif.order.status}
                            </span>
                            <span className="text-[8px] uppercase font-black px-1.5 py-0.5 rounded bg-white/10 text-stone-300">
                              Payment: {notif.order.paymentStatus}
                            </span>
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NotificationBell;
