import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  ShoppingBag,
  MapPin,
  Phone,
  Search,
  Clock,
  Truck,
  User,
  Package,
  ChevronRight,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useUser } from "../context/UserContext";
import { useStoreStatus } from "../context/StoreStatusContext";
import NotificationBell from "./NotificationBell";
import { getProductImageUrl, handleProductImageError } from "@/utils/imageUtils";

interface QuickProduct {
  id: string;
  name: string;
  slug: string;
  category: string;
  priceType?: "weight" | "variant";
  pricePerKg?: number;
  variants?: { name: string; price: number }[];
  image?: string;
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<QuickProduct[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const { totalItems, cartTotal, openCart } = useCart();
  const { user } = useUser();
  const { isOpen: storeOpen, openTime, closeTime, freeDeliveryThreshold } = useStoreStatus();
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/#")) return false;
    return pathname.startsWith(href);
  };

  useEffect(() => {
    let active = true;
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        if (active && data?.success && Array.isArray(data.products)) {
          setProducts(data.products);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredSuggestions = searchQuery.trim()
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 6)
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);
    const trimmed = searchQuery.trim();
    if (trimmed) {
      navigate(`/?q=${encodeURIComponent(trimmed)}#shop-cuts`);
    } else {
      navigate("/#shop-cuts");
    }
  };

  const handleNavClick = () => {
    setIsOpen(false);
  };

  const navLinks = [
    { name: "Shop Cuts", href: "/" },
    { name: "Our Butcher Shop", href: "/#butcher-store" },
    { name: "My Orders", href: user ? "/orders" : "/login?from=/orders" },
  ];

  return (
    <>
      {/* Desktop Top Utility Bar */}
      <div className="hidden md:block bg-zinc-900 text-zinc-300 text-xs border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between gap-4">
          {/* Left: Store Status & Location */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-1.5 font-medium text-white shrink-0">
              <span
                className={`w-2 h-2 rounded-full ${
                  storeOpen ? "bg-primary" : "bg-zinc-500"
                }`}
              />
              <span>{storeOpen ? "Open Today" : "Pre-Orders Open"}</span>
              <span className="text-zinc-500 font-normal">
                ({openTime} – {closeTime})
              </span>
            </div>

            <span className="text-zinc-700">|</span>

            <a
              href="https://maps.app.goo.gl/cEEEaU5Gj6EjC4Uo9"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors truncate"
              title="View Khudi Chowk Outlet on Google Maps"
            >
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">Khudi Chowk, Pokhara-30, Lekhnath</span>
            </a>
          </div>

          {/* Right: Free Delivery Notice & Phone Numbers */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Truck className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>
                Free delivery on orders above{" "}
                <strong className="text-white font-semibold">
                  Rs. {freeDeliveryThreshold}
                </strong>
              </span>
            </div>

            <span className="text-zinc-700">|</span>

            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
              <a
                href="tel:9714324919"
                className="text-white hover:text-zinc-200 font-medium transition-colors tabular-nums"
              >
                9714324919
              </a>
              <span className="text-zinc-600">/</span>
              <a
                href="tel:9747470470"
                className="text-zinc-400 hover:text-white transition-colors tabular-nums"
              >
                9747470470
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="hidden md:block sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-6">
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-8 shrink-0">
            <Link
              to="/"
              onClick={handleNavClick}
              className="flex items-center gap-3 group focus:outline-none"
            >
              <div className="h-12 w-12 sm:h-13 sm:w-13 relative flex items-center justify-center shrink-0">
                <img
                  src="/images/logo.png"
                  alt="Prime Cuts Butcher House"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight text-zinc-900 leading-none">
                  Prime <span className="text-primary">Cuts</span>
                </span>
                <span className="text-[10px] tracking-[0.16em] font-semibold text-zinc-500 uppercase mt-1">
                  Butcher House
                </span>
              </div>
            </Link>

            {/* Primary Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={handleNavClick}
                    className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                      active
                        ? "text-primary bg-red-50/70 font-semibold"
                        : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Center: Integrated Storefront Search Bar */}
          <div className="flex-1 max-w-md relative" ref={searchContainerRef}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search goat (khasi), chicken, sausages, eggs..."
                className="w-full h-10 pl-10 pr-8 bg-zinc-100/80 hover:bg-zinc-100 focus:bg-white text-sm text-zinc-900 placeholder-zinc-400 rounded-lg border border-zinc-200/90 focus:border-zinc-900 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setShowDropdown(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-0.5 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Instant Search Results Dropdown */}
            {showDropdown && searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 overflow-hidden">
                {filteredSuggestions.length === 0 ? (
                  <div className="p-4 text-center text-xs text-zinc-500">
                    No matching cuts found for "{searchQuery}"
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100">
                    {filteredSuggestions.map((item) => {
                      const rate =
                        item.priceType === "weight" && item.pricePerKg
                          ? `Rs. ${item.pricePerKg}/kg`
                          : item.variants?.[0]
                          ? `Rs. ${item.variants[0].price}`
                          : "";
                      return (
                        <Link
                          key={item.id}
                          to={`/product/${item.slug}`}
                          onClick={() => {
                            setShowDropdown(false);
                            setSearchQuery("");
                          }}
                          className="flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-zinc-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={getProductImageUrl(item.image)}
                              alt={item.name}
                              onError={handleProductImageError}
                              className="w-9 h-9 rounded-lg object-cover bg-zinc-100 border border-zinc-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-zinc-900 truncate">
                                {item.name}
                              </p>
                              <p className="text-[11px] text-zinc-500">
                                {item.category}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-xs font-semibold text-primary tabular-nums">
                              {rate}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Account, Notifications & Cart CTA */}
          <div className="flex items-center gap-2.5 shrink-0">
            <NotificationBell type="customer" theme="light" />

            <Link
              to={user ? "/account" : "/login"}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
            >
              <User className="w-4 h-4 text-zinc-600" />
              <span className="max-w-[110px] truncate">
                {user ? user.name?.split(" ")[0] || "Account" : "Sign In"}
              </span>
            </Link>

            <button
              type="button"
              onClick={openCart}
              className="h-10 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold text-sm flex items-center gap-2.5 transition-colors cursor-pointer shadow-2xs"
              aria-label="Open shopping cart"
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              {totalItems > 0 ? (
                <div className="flex items-center gap-2 tabular-nums">
                  <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs font-bold leading-none">
                    {totalItems}
                  </span>
                  <span className="text-xs font-semibold">
                    Rs. {cartTotal.toFixed(0)}
                  </span>
                </div>
              ) : (
                <span>Cart</span>
              )}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
