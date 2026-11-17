import React from "react";
import { useLocation } from "react-router-dom";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";

export default function FloatingCartBar() {
  const { items, cartTotal, totalItems, openCart } = useCart();
  const location = useLocation();

  const isHiddenRoute =
    location.pathname.startsWith("/checkout") ||
    location.pathname.startsWith("/order") ||
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/menu") ||
    location.pathname.startsWith("/admin");

  const isVisible = items.length > 0 && !isHiddenRoute;

  const handleCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openCart();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.aside
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{
            y: 80,
            opacity: 0,
            transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] },
          }}
          transition={{
            type: "spring",
            damping: 26,
            stiffness: 350,
          }}
          aria-label="Current Cart Summary"
          className="md:hidden fixed bottom-[max(1rem,env(safe-area-inset-bottom,0px))] left-0 right-0 z-40 px-3 pointer-events-none will-change-transform"
        >
          <div
            onClick={openCart}
            className="max-w-md mx-auto bg-zinc-900 text-white rounded-xl py-2.5 px-3.5 shadow-xl border border-zinc-800 flex items-center justify-between gap-3 pointer-events-auto cursor-pointer"
          >
            {/* Left: Bag & Count & Price */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white relative shrink-0">
                <ShoppingBag className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 bg-white text-zinc-900 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center tabular-nums">
                  {totalItems}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 tabular-nums">
                <span className="text-sm font-bold text-white">
                  Rs. {cartTotal.toFixed(0)}
                </span>
                <span className="text-xs text-zinc-400">
                  • {totalItems} {totalItems === 1 ? "item" : "items"}
                </span>
              </div>
            </div>

            {/* Right: View Cart Button */}
            <button
              type="button"
              onClick={handleCartClick}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-lg shrink-0 cursor-pointer transition-colors"
            >
              <span>View Cart</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
