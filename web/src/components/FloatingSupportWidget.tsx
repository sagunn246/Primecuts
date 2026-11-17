import React, { useState, useRef, useEffect } from "react";
import { Phone, MessageSquare, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";

export default function FloatingSupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const isDraggingRef = useRef(false);
  const location = useLocation();
  const { totalItems } = useCart();
  const [dragConstraints, setDragConstraints] = useState({
    top: -600,
    bottom: 20,
    left: -320,
    right: 10,
  });

  useEffect(() => {
    const updateConstraints = () => {
      if (typeof window !== "undefined") {
        setDragConstraints({
          top: -window.innerHeight + 140,
          bottom: 20,
          left: -window.innerWidth + 120,
          right: 10,
        });
      }
    };
    updateConstraints();
    window.addEventListener("resize", updateConstraints);
    return () => window.removeEventListener("resize", updateConstraints);
  }, []);

  if (
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/menu")
  ) {
    return null;
  }

  const PHONE_NUMBER = "+9779714324919";
  const WHATSAPP_URL = `https://wa.me/9779714324919?text=${encodeURIComponent(
    "Hello Prime Cuts! I would like to inquire about ordering fresh meat."
  )}`;

  const bottomPositionClass =
    totalItems > 0
      ? "bottom-[max(5rem,calc(env(safe-area-inset-bottom,0px)+4.5rem))] md:bottom-6"
      : "bottom-[max(1.25rem,env(safe-area-inset-bottom,0px))] md:bottom-6";

  const handleToggle = () => {
    if (isDraggingRef.current) return;
    setIsOpen((prev) => !prev);
  };

  return (
    <motion.aside
      drag
      dragConstraints={dragConstraints}
      dragElastic={0.06}
      dragMomentum={false}
      onDragStart={() => {
        isDraggingRef.current = true;
      }}
      onDragEnd={() => {
        setTimeout(() => {
          isDraggingRef.current = false;
        }, 120);
      }}
      aria-label="Customer Support and Direct Ordering"
      className={`fixed ${bottomPositionClass} right-3 sm:right-6 z-50 flex flex-col items-end gap-2 touch-none select-none`}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15 }}
            className="bg-white rounded-xl p-3 shadow-xl border border-zinc-200 mb-1 flex flex-col gap-2 w-60 pointer-events-auto"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2 px-1">
              <span className="text-xs font-bold text-zinc-900">
                Direct Butcher Support
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="text-zinc-400 hover:text-zinc-700 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Direct Phone Call */}
            <a
              href={`tel:${PHONE_NUMBER}`}
              className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-900 border border-zinc-200/80 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold leading-tight text-zinc-900">
                  Call Butcher Counter
                </div>
                <div className="text-[11px] text-zinc-500 font-normal tabular-nums">
                  9714324919
                </div>
              </div>
            </a>

            {/* WhatsApp Direct Chat */}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-900 border border-zinc-200/80 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold leading-tight text-zinc-900">
                  WhatsApp Order
                </div>
                <div className="text-[11px] text-zinc-500 font-normal">
                  Quick chat & custom cuts
                </div>
              </div>
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Support Button — Strictly 2-Color Palette */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-3.5 py-2.5 rounded-lg shadow-lg border border-zinc-700 cursor-grab active:cursor-grabbing select-none pointer-events-auto"
        title="Contact Butcher House"
      >
        <Phone className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold tracking-wide">
          Order Help
        </span>
      </motion.button>
    </motion.aside>
  );
}
