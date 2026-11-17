import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useUser } from "../context/UserContext";
import { useStoreStatus } from "../context/StoreStatusContext";
import { CartItem } from "@/types/types";
import {
  X,
  Plus,
  Minus,
  ShoppingBag,
  Trash2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Truck,
  AlertCircle,
  CheckCircle2,
  Utensils,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getProductImageUrl, handleProductImageError } from "@/utils/imageUtils";

export default function CartDrawer() {
  const {
    items,
    isCartOpen,
    closeCart,
    cartTotal,
    removeFromCart,
    updateItemQty,
  } = useCart();
  const { user } = useUser();
  const { isOpen, freeDeliveryThreshold } = useStoreStatus();
  const navigate = useNavigate();

  const threshold = freeDeliveryThreshold || 899;
  const progressPercent = Math.min(
    100,
    Math.round((cartTotal / threshold) * 100)
  );
  const remainingForFree = Math.max(0, threshold - cartTotal);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 bg-zinc-950/60 z-[60] backdrop-blur-xs"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{
              x: "100%",
              transition: { duration: 0.22, ease: [0.32, 0.72, 0, 1] },
            }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 340,
              mass: 0.8,
            }}
            drag="x"
            dragConstraints={{ left: 0 }}
            dragElastic={{ left: 0, right: 0.5 }}
            onDragEnd={(_e, info) => {
              if (info.offset.x > 80 || info.velocity.x > 350) {
                closeCart();
              }
            }}
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-[70] shadow-2xl flex flex-col will-change-transform pt-[max(calc(env(safe-area-inset-top,0px)+20px),28px)] sm:pt-0 border-l border-zinc-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-200 bg-white sticky top-0 z-20">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={closeCart}
                  className="w-9 h-9 rounded-lg bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-700 transition-colors cursor-pointer shrink-0 sm:hidden"
                  title="Close Cart"
                  aria-label="Close Cart"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-zinc-900 flex items-center justify-center text-white shrink-0">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-zinc-900 leading-tight">
                      Shopping Cart
                    </h2>
                    <p className="text-xs text-zinc-500 font-medium tabular-nums">
                      {items.length} {items.length === 1 ? "item" : "items"}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={closeCart}
                className="w-9 h-9 rounded-lg bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
                title="Close Cart"
                aria-label="Close Cart"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Free Delivery Progress Bar */}
            {items.length > 0 && (
              <div className="bg-zinc-900 text-white px-4 py-3 border-b border-zinc-800">
                <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                  <span className="flex items-center gap-1.5">
                    {remainingForFree === 0 ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="text-white font-semibold">
                          Free Delivery Unlocked
                        </span>
                      </>
                    ) : (
                      <>
                        <Truck className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>
                          Add{" "}
                          <strong className="text-white font-semibold tabular-nums">
                            Rs. {remainingForFree.toFixed(0)}
                          </strong>{" "}
                          more for Free Delivery
                        </span>
                      </>
                    )}
                  </span>
                  <span className="text-zinc-400 tabular-nums">
                    {progressPercent}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 smooth-scroll-y custom-scrollbar overscroll-contain bg-zinc-50/50">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-center px-4">
                  <div className="w-14 h-14 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400 mb-3">
                    <ShoppingBag className="w-6 h-6 text-zinc-500" />
                  </div>
                  <p className="font-bold text-base text-zinc-900">
                    Your cart is empty
                  </p>
                  <p className="text-xs text-zinc-500 mt-1 max-w-xs leading-relaxed">
                    Browse our fresh goat, chicken, sausages, and farm eggs to start your order.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      closeCart();
                      navigate("/#shop-cuts");
                    }}
                    className="mt-5 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer inline-flex items-center gap-2"
                  >
                    <span>Browse Fresh Cuts</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <CartItemCard
                      key={item.cartItemId}
                      item={item}
                      onRemove={() => removeFromCart(item.cartItemId)}
                      onUpdateQty={(qty) => updateItemQty(item.cartItemId, qty)}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-zinc-200 p-4 bg-white">
                {!isOpen && (
                  <div className="mb-3 p-2.5 bg-zinc-100 rounded-lg border border-zinc-200 text-zinc-700 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-primary shrink-0" />
                    <span>
                      Counter currently closed. Pre-orders are prepared fresh at 7:00 AM.
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-baseline mb-4">
                  <span className="text-zinc-500 font-medium text-sm">
                    Subtotal
                  </span>
                  <span className="text-xl font-bold text-zinc-900 tabular-nums">
                    Rs. {cartTotal.toFixed(2)}
                  </span>
                </div>
                {user ? (
                  <Link
                    to="/checkout"
                    onClick={closeCart}
                    className="w-full h-11 flex items-center justify-center gap-2 bg-primary text-white font-semibold text-sm rounded-lg hover:bg-primary-hover transition-colors cursor-pointer"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    to="/login?from=/checkout"
                    onClick={closeCart}
                    className="w-full h-11 flex items-center justify-center gap-2 bg-primary text-white font-semibold text-sm rounded-lg hover:bg-primary-hover transition-colors cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Sign In to Checkout</span>
                  </Link>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CartItemCard({
  item,
  onRemove,
  onUpdateQty,
}: {
  item: CartItem;
  onRemove: () => void;
  onUpdateQty: (qty: number) => void;
}) {
  let itemPrice = 0;
  let unitDisplay = "";
  let basePriceDisplay = "";

  if (
    item.product.priceType === "weight" &&
    item.weightInGrams &&
    item.product.pricePerKg
  ) {
    itemPrice =
      (item.weightInGrams / 1000) * item.product.pricePerKg * item.qty;
    unitDisplay =
      item.weightInGrams >= 1000
        ? `${item.weightInGrams / 1000} kg`
        : `${item.weightInGrams}g`;
    basePriceDisplay = `Rs. ${item.product.pricePerKg} / kg`;
  } else if (
    item.product.priceType === "variant" &&
    item.variantName &&
    item.variantPrice
  ) {
    itemPrice = item.variantPrice * item.qty;
    unitDisplay = item.variantName;
    basePriceDisplay = `Rs. ${item.variantPrice} each`;
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{
        opacity: 0,
        scale: 0.95,
        height: 0,
        marginBottom: 0,
        padding: 0,
        overflow: "hidden",
        transition: { duration: 0.18 },
      }}
      transition={{ duration: 0.18 }}
      className="flex gap-3.5 p-3 bg-white border border-zinc-200 rounded-xl relative"
    >
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2.5 right-2.5 p-1 text-zinc-400 hover:text-primary hover:bg-red-50 rounded-md transition-colors cursor-pointer"
        title="Remove item"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Product Image */}
      <div className="relative w-18 h-18 bg-zinc-100 rounded-lg overflow-hidden shrink-0 border border-zinc-200/80">
        <img
          src={getProductImageUrl(item.product.image)}
          alt={item.product.name}
          onError={handleProductImageError}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Details */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div className="pr-6">
          <h3 className="font-semibold text-sm text-zinc-900 leading-snug truncate">
            {item.product.name}
          </h3>
          <p className="text-xs text-zinc-500 tabular-nums mt-0.5">
            {basePriceDisplay}
          </p>
          {item.cutPreference && (
            <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[11px] font-medium border border-zinc-200">
              <Utensils className="w-3 h-3 text-primary shrink-0" />
              <span>{item.cutPreference}</span>
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-zinc-100">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center border border-zinc-200 rounded-lg bg-white overflow-hidden h-7">
              <button
                type="button"
                onClick={() => onUpdateQty(item.qty - 1)}
                className="w-7 h-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                <Minus className="w-3 h-3" />
              </button>
              <div className="w-6 h-full flex items-center justify-center border-x border-zinc-200 text-zinc-900 font-semibold text-xs tabular-nums">
                {item.qty}
              </div>
              <button
                type="button"
                onClick={() => onUpdateQty(item.qty + 1)}
                className="w-7 h-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <span className="text-zinc-400 text-xs">×</span>

            <span className="h-7 border border-zinc-200 bg-zinc-50 rounded-lg px-2.5 flex items-center justify-center text-xs font-medium text-zinc-700 tabular-nums">
              {unitDisplay}
            </span>
          </div>

          <span className="font-bold text-zinc-900 text-sm tabular-nums">
            Rs. {itemPrice.toFixed(0)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
