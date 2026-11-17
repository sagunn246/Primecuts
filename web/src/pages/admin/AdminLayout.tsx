import React from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  LogOut,
  X,
  ExternalLink,
  Plus,
  ChevronLeft,
  BookOpen,
  Store,
  Bell,
} from "lucide-react";
import { AdminLiveProvider, useAdminLive } from "../../context/AdminLiveContext";
import AdminPushSetup from "../../components/AdminPushSetup";
import NotificationBell from "../../components/NotificationBell";

function AdminLayoutContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const { newOrderNotification, dismissNotification, stats } = useAdminLive();

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // Ignore
    } finally {
      localStorage.removeItem("admin_token");
      navigate("/admin/login", { replace: true });
    }
  };

  const navItems = [
    { name: "Overview", mobileName: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Orders", mobileName: "Orders", href: "/admin/orders", icon: ShoppingCart, badge: stats?.pendingOrders || 0 },
    { name: "Products", mobileName: "Inventory", href: "/admin/products", icon: Package },
    { name: "Categories", mobileName: "Categories", href: "/admin/categories", icon: Tags },
    { name: "Staff Guide", mobileName: "Guide", href: "/admin/guide", icon: BookOpen, desktopOnly: true },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Contextual screen title & back button for mobile native header
  const getPageMeta = () => {
    if (pathname === "/admin") {
      return { title: "Overview", subtitle: "Operations & Daily Sales", backTo: null };
    }
    if (pathname === "/admin/orders") {
      return { title: "Orders", subtitle: "Live Fulfillment Queue", backTo: null };
    }
    if (pathname.startsWith("/admin/orders/")) {
      return { title: "Order Inspector", subtitle: "Fulfillment & Receipt", backTo: "/admin/orders" };
    }
    if (pathname === "/admin/products") {
      return { title: "Inventory", subtitle: "Cuts, Pricing & Stock", backTo: null };
    }
    if (pathname === "/admin/products/new") {
      return { title: "New Cut", subtitle: "Add Product to Catalog", backTo: "/admin/products" };
    }
    if (pathname.endsWith("/edit") && pathname.startsWith("/admin/products/")) {
      return { title: "Edit Cut", subtitle: "Update Product & Pricing", backTo: "/admin/products" };
    }
    if (pathname === "/admin/categories") {
      return { title: "Categories", subtitle: "Catalog Structure", backTo: null };
    }
    if (pathname === "/admin/guide") {
      return { title: "Staff Guide", subtitle: "POS & Dispatch Manual", backTo: "/admin" };
    }
    return { title: "Prime Admin", subtitle: "Workspace", backTo: "/admin" };
  };

  const pageMeta = getPageMeta();
  const pendingOrders = stats?.pendingOrders || 0;

  return (
    <div className="flex h-dvh w-full bg-[#f4f4f6] text-stone-900 overflow-hidden select-none">
      {/* ================================================================= */}
      {/* DESKTOP SIDEBAR (Professional Dark Software Dock)                 */}
      {/* ================================================================= */}
      <aside className="hidden md:flex flex-col w-60 bg-[#0d0d0f] text-stone-300 border-r border-white/[0.08] shrink-0 z-40">
        {/* Brand Header */}
        <div className="h-14 px-4 border-b border-white/[0.08] flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#18181b] border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
              <img src="/favicon-circle.png" alt="Prime Cuts" className="w-5 h-5 object-contain" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white tracking-tight">Prime Cuts</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-stone-300">
                  POS
                </span>
              </div>
            </div>
          </Link>
          <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>

        {/* Quick Primary Action */}
        <div className="p-3 border-b border-white/[0.06]">
          <Link
            to="/admin/products/new"
            className="w-full h-9 px-3 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Product Cut</span>
          </Link>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-5">
          <div>
            <div className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
              Workspace
            </div>
            <nav className="space-y-0.5">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors ${active
                        ? "bg-white/[0.1] text-white font-semibold"
                        : "text-stone-400 hover:text-stone-100 hover:bg-white/[0.04]"
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className={`w-4 h-4 ${active ? "text-primary" : "text-stone-400"}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="px-1.5 py-0.5 min-w-[20px] text-center bg-primary text-white rounded text-[10px] font-bold tabular-nums">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-2.5 border-t border-white/[0.08] space-y-0.5">
          <Link
            to="/"
            className="flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-stone-400 hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <Store className="w-4 h-4 text-stone-500" />
              <span>View Storefront</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-xs font-medium text-stone-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-stone-500" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ================================================================= */}
      {/* MAIN CONTENT SHELL                                                */}
      {/* ================================================================= */}
      <div className="flex-1 flex flex-col h-dvh min-w-0 overflow-hidden">
        {/* Desktop Top Bar */}
        <header className="hidden md:flex h-14 bg-white border-b border-stone-200/90 px-6 items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            {pageMeta.backTo && (
              <Link
                to={pageMeta.backTo}
                className="p-1.5 -ml-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                title="Back"
              >
                <ChevronLeft className="w-4 h-4" />
              </Link>
            )}
            <div className="flex items-baseline gap-2.5 truncate">
              <h1 className="text-sm font-bold text-stone-900 tracking-tight">{pageMeta.title}</h1>
              <span className="text-stone-300">•</span>
              <span className="text-xs text-stone-500 truncate">{pageMeta.subtitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {pendingOrders > 0 && (
              <Link
                to="/admin/orders"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-semibold hover:bg-amber-100/70 transition-colors tabular-nums"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                <span>{pendingOrders} Pending {pendingOrders === 1 ? "Order" : "Orders"}</span>
              </Link>
            )}
            <div className="h-4 w-px bg-stone-200" />
            <div className="text-stone-700">
              <NotificationBell type="admin" />
            </div>
          </div>
        </header>

        {/* Mobile Native App Top Bar */}
        <header className="md:hidden bg-[#0d0d0f] text-white border-b border-white/[0.08] px-3.5 pt-[max(calc(env(safe-area-inset-top,0px)+10px),14px)] pb-2.5 shrink-0 z-40">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {pageMeta.backTo ? (
                <button
                  type="button"
                  onClick={() => navigate(pageMeta.backTo!)}
                  className="w-8 h-8 -ml-1 rounded-lg bg-white/[0.07] active:bg-white/[0.15] flex items-center justify-center text-white shrink-0"
                  aria-label="Go Back"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-white/[0.08] border border-white/10 flex items-center justify-center shrink-0">
                  <img src="/favicon-circle.png" alt="Prime Cuts" className="w-4 h-4 object-contain" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-[15px] font-bold text-white tracking-tight truncate leading-tight">
                    {pageMeta.title}
                  </h1>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Live Connected" />
                </div>
                <p className="text-[11px] text-stone-400 truncate leading-tight">{pageMeta.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {pendingOrders > 0 && pathname !== "/admin/orders" && (
                <Link
                  to="/admin/orders"
                  className="px-2 py-1 bg-primary text-white text-[11px] rounded-md font-bold tabular-nums flex items-center gap-1 active:scale-95 transition-transform"
                >
                  <span>{pendingOrders}</span>
                  <span className="text-[10px] font-medium opacity-90">new</span>
                </Link>
              )}
              <NotificationBell type="admin" />
              <button
                type="button"
                onClick={handleLogout}
                title="Sign Out"
                className="w-8 h-8 rounded-lg text-stone-400 hover:text-white active:bg-white/10 flex items-center justify-center cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Workspace Viewport */}
        <main className="flex-1 overflow-y-auto overscroll-y-contain p-3 sm:p-5 md:p-6 pb-24 md:pb-8 smooth-scroll-y">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

        {/* Mobile Native Bottom Tab Bar */}
        <nav
          aria-label="Admin Navigation"
          className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0d0d0f]/95 backdrop-blur-xl border-t border-white/[0.08] z-40"
        >
          <div className="grid grid-cols-5 items-center px-1 pt-1.5 pb-[max(0.65rem,env(safe-area-inset-bottom,0px))]">
            {navItems
              .filter((item) => !item.desktopOnly)
              .map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="relative flex flex-col items-center justify-center py-1 gap-0.5 active:scale-95 transition-transform"
                  >
                    {active && (
                      <span className="absolute -top-1.5 w-6 h-0.5 rounded-full bg-primary" />
                    )}
                    <div className="relative">
                      <item.icon
                        className={`w-[19px] h-[19px] transition-colors ${active ? "text-white stroke-[2.2]" : "text-stone-500"
                          }`}
                      />
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center tabular-nums border border-[#0d0d0f]">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] tracking-tight transition-colors ${active ? "text-white font-semibold" : "text-stone-500 font-medium"
                        }`}
                    >
                      {item.mobileName}
                    </span>
                  </Link>
                );
              })}

            <Link
              to="/"
              className="flex flex-col items-center justify-center py-1 gap-0.5 active:scale-95 transition-transform"
            >
              <Store className="w-[19px] h-[19px] text-stone-500" />
              <span className="text-[10px] font-medium text-stone-500 tracking-tight">Store</span>
            </Link>
          </div>
        </nav>
      </div>

      {/* Real-Time New Order Dispatch Alert */}
      {newOrderNotification && newOrderNotification.show && (
        <div className="fixed bottom-20 md:bottom-5 left-3 right-3 md:left-auto md:right-5 md:w-88 z-[9999] bg-[#111113] border border-white/15 text-white p-4 rounded-xl shadow-2xl flex flex-col gap-3 animate-in slide-in-from-bottom-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <span className="font-bold uppercase tracking-wider text-[11px] text-stone-200">
                Incoming Order
              </span>
            </div>
            <button
              onClick={dismissNotification}
              className="p-1 text-stone-400 hover:text-white rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-baseline justify-between border-y border-white/10 py-2.5">
            <div>
              <p className="text-sm font-bold text-white">#{newOrderNotification.orderNumber}</p>
              <p className="text-xs text-stone-400 mt-0.5">{newOrderNotification.customerName}</p>
            </div>
            <p className="text-base font-bold text-emerald-400 tabular-nums">
              Rs. {newOrderNotification.amount.toFixed(2)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={dismissNotification}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-stone-300 cursor-pointer"
            >
              Dismiss
            </button>
            <Link
              to="/admin/orders"
              onClick={dismissNotification}
              className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-lg text-center transition-colors"
            >
              View in Queue
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminLayout() {
  return (
    <AdminLiveProvider>
      <AdminLayoutContent />
      <AdminPushSetup />
    </AdminLiveProvider>
  );
}
