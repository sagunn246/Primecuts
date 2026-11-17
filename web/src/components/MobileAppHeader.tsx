import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Search,
  Clock,
  Truck,
  Menu,
  ShoppingBag,
} from "lucide-react";
import { useStoreStatus } from "../context/StoreStatusContext";
import { useCart } from "../context/CartContext";
import MobileSearchModal from "./MobileSearchModal";

export default function MobileAppHeader() {
  const { isOpen, openTime, closeTime, freeDeliveryThreshold } = useStoreStatus();
  const { totalItems, openCart } = useCart();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="md:hidden relative z-30 bg-[#141416] border-b border-zinc-800 pt-[max(calc(env(safe-area-inset-top,0px)+26px),36px)] pb-3.5 text-white">
      {/* 1. App Top Bar: Logo, Location, Status & Menu Hub Action */}
      <div className="px-3.5 pt-1 pb-2.5 flex items-center justify-between gap-2">
        {/* Left: Brand & Location */}
        <Link to="/" className="flex items-center gap-2.5 flex-1 min-w-0 group">
          <div className="w-11 h-11 relative shrink-0 flex items-center justify-center">
            <img
              src="/images/logo.png"
              alt="Prime Cuts"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[16px] text-white tracking-tight leading-tight">
                Prime <span className="text-primary">Cuts</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-zinc-200 border border-white/15">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isOpen ? "bg-primary" : "bg-zinc-400"
                  }`}
                />
                <span>{isOpen ? "Open" : "Pre-Order"}</span>
              </span>
            </div>

            <div className="flex items-center gap-1 text-[12px] text-zinc-300 font-medium mt-0.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">Khudi Chowk, Pokhara-30</span>
            </div>
          </div>
        </Link>

        {/* Right: Cart & Menu Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={openCart}
            className="relative h-9 w-9 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 active:scale-95 border border-zinc-700/80 flex items-center justify-center text-white transition-all cursor-pointer"
            aria-label="Open Cart"
          >
            <ShoppingBag className="w-4 h-4" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {totalItems}
              </span>
            )}
          </button>

          <Link
            to="/menu"
            className="h-9 px-3 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 active:scale-95 border border-zinc-700/80 flex items-center gap-1.5 text-white transition-all cursor-pointer shrink-0"
            title="Open Menu & Account"
            aria-label="Menu"
          >
            <Menu className="w-4 h-4 text-white" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Menu
            </span>
          </Link>
        </div>
      </div>

      {/* 2. Search Bar & Timing Info */}
      <div className="px-3.5 space-y-2.5">
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="w-full h-11 bg-white hover:bg-zinc-50 active:scale-[0.99] rounded-xl px-3.5 flex items-center text-left transition-all cursor-pointer gap-2.5 shadow-xs select-none"
        >
          <Search className="w-4 h-4 text-zinc-900 shrink-0" />
          <span className="font-semibold text-[13px] text-zinc-600 truncate">
            Search chicken, mutton, sausages, momos...
          </span>
        </button>

        {/* Operating Hours & Free Delivery Strip — Strictly 2-Color */}
        <div className="flex items-center justify-between px-0.5 text-[11px] text-zinc-300 font-medium">
          <span className="flex items-center gap-1.5 truncate tabular-nums">
            <Clock className="w-3 h-3 text-zinc-400 shrink-0" />
            <span className="truncate">
              {openTime} – {closeTime}
            </span>
          </span>

          <span className="flex items-center gap-1.5 text-zinc-200 font-medium shrink-0 tabular-nums">
            <Truck className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>
              Free Delivery &gt; <strong className="text-white font-bold">Rs. {freeDeliveryThreshold}</strong>
            </span>
          </span>
        </div>
      </div>

      {/* Instant Search Sheet */}
      <MobileSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </header>
  );
}
