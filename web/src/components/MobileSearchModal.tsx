import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Search, X, ChevronRight, ShoppingBag, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";
import { getProductImageUrl, handleProductImageError } from "@/utils/imageUtils";

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  priceType: "weight" | "variant";
  pricePerKg?: number;
  variants?: Array<{ id: string; name: string; price: number }>;
  image?: string;
  available?: boolean;
}

interface MobileSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_TAGS = [
  "All",
  "Khasi (खसी)",
  "Chicken (कुखुरा)",
  "Curry Cut",
  "Boneless",
  "Sausages",
  "Momos",
  "Eggs",
];

let cachedSearchProducts: ProductItem[] | null = null;

export default function MobileSearchModal({
  isOpen,
  onClose,
}: MobileSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTag, setActiveTag] = useState("All");
  const [products, setProducts] = useState<ProductItem[]>(
    () => cachedSearchProducts || []
  );
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addWeightItem, addVariantItem } = useCart();

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const originalTop = document.body.style.top;
      const originalWidth = document.body.style.width;
      const scrollY = window.scrollY;

      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.top = originalTop;
        document.body.style.width = originalWidth;
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (cachedSearchProducts && cachedSearchProducts.length > 0) {
        setProducts(cachedSearchProducts);
      } else {
        fetchProducts();
      }

      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 280);

      return () => clearTimeout(timer);
    } else {
      setSearchTerm("");
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    if (cachedSearchProducts && cachedSearchProducts.length > 0) {
      setProducts(cachedSearchProducts);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.products)) {
          cachedSearchProducts = data.products;
          setProducts(data.products);
        }
      }
    } catch (err) {
      console.warn("Failed to load products for search:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      p.name.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term) ||
      p.slug.toLowerCase().includes(term);

    if (!matchesSearch) return false;

    if (activeTag === "All") return true;
    if (activeTag === "Khasi (खसी)")
      return (
        p.category.toLowerCase().includes("goat") ||
        p.name.includes("खसी") ||
        p.name.includes("Khasi")
      );
    if (activeTag === "Chicken (कुखुरा)")
      return (
        p.category.toLowerCase().includes("chicken") ||
        p.name.includes("कुखुरा")
      );
    if (activeTag === "Sausages")
      return p.name.toLowerCase().includes("sausage");
    if (activeTag === "Momos") return p.name.toLowerCase().includes("momo");
    if (activeTag === "Eggs")
      return (
        p.category.toLowerCase().includes("egg") ||
        p.name.toLowerCase().includes("egg")
      );
    if (activeTag === "Curry Cut")
      return (
        p.name.toLowerCase().includes("curry") ||
        p.name.toLowerCase().includes("cut")
      );
    if (activeTag === "Boneless")
      return p.name.toLowerCase().includes("boneless");

    return true;
  });

  const handleQuickAdd = (p: ProductItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (p.priceType === "weight" && p.pricePerKg) {
      addWeightItem(
        {
          id: p.id,
          name: p.name,
          slug: p.slug,
          priceType: "weight",
          pricePerKg: p.pricePerKg,
          image: p.image || "/images/meat_goat_bone.jpg",
        },
        1000,
        1
      );
    } else if (p.variants && p.variants.length > 0) {
      const firstVar = p.variants[0];
      addVariantItem(
        {
          id: p.id,
          name: p.name,
          slug: p.slug,
          priceType: "variant",
          image: p.image || "/images/meat_sausages.jpg",
        },
        firstVar.name,
        firstVar.price,
        1
      );
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="fixed inset-0 z-[100] flex flex-col justify-end md:justify-center md:items-center bg-zinc-950/60 backdrop-blur-xs"
        >
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.45 }}
            onDragEnd={(_e, info) => {
              if (info.offset.y > 60 || info.velocity.y > 200) {
                onClose();
              }
            }}
            className="relative z-10 w-full h-[100dvh] md:max-w-2xl bg-white md:rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-900 will-change-transform pt-[max(calc(env(safe-area-inset-top,0px)+16px),24px)]"
          >
            {/* Grab Bar */}
            <div
              onClick={onClose}
              className="w-full pt-2 pb-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none"
            >
              <div className="w-12 h-1 rounded-full bg-zinc-300" />
            </div>

            {/* Header & Search Input */}
            <div className="px-4 pb-3 border-b border-zinc-200 bg-white sticky top-0 z-20">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="font-bold text-base text-zinc-900">
                  Search Meat Catalog
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search goat, broiler, curry cut, sausages, eggs..."
                  className="w-full h-11 pl-10 pr-9 bg-zinc-100 focus:bg-white border border-zinc-200 focus:border-zinc-900 rounded-lg text-zinc-900 placeholder-zinc-400 font-medium text-sm focus:outline-none transition-colors"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filter Tags */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 pb-0.5 no-scrollbar smooth-scroll-x">
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setActiveTag(tag)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer select-none ${
                      activeTag === tag
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-600 hover:text-zinc-900 border border-zinc-200"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 smooth-scroll-y custom-scrollbar overscroll-contain bg-zinc-50/50">
              {loading && products.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 font-medium text-sm flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Loading fresh cuts...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-12 text-center text-zinc-500">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-zinc-400" />
                  <p className="font-semibold text-sm text-zinc-700">
                    No cuts found for "{searchTerm}"
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Try searching for goat, chicken, curry cut, or sausages
                  </p>
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const priceText =
                    p.priceType === "weight" && p.pricePerKg
                      ? `Rs. ${p.pricePerKg}/kg`
                      : p.variants && p.variants.length > 0
                      ? `Rs. ${p.variants[0].price} (${p.variants[0].name})`
                      : "View Options";

                  const isOutOfStock = p.available === false;

                  return (
                    <div
                      key={p.id}
                      className="bg-white hover:border-zinc-300 border border-zinc-200 rounded-xl p-2.5 flex items-center justify-between gap-3 transition-colors"
                    >
                      <Link
                        to={`/product/${p.slug}`}
                        onClick={onClose}
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                        <div className="w-13 h-13 rounded-lg bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200 relative">
                          <img
                            src={getProductImageUrl(p.image)}
                            alt={p.name}
                            loading="lazy"
                            onError={handleProductImageError}
                            className="w-full h-full object-cover"
                          />
                          {isOutOfStock && (
                            <div className="absolute inset-0 bg-zinc-950/60 flex items-center justify-center text-[9px] font-semibold text-white uppercase">
                              Out
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                            {p.category}
                          </span>
                          <h4 className="font-semibold text-sm text-zinc-900 truncate">
                            {p.name}
                          </h4>
                          <p className="text-xs font-bold text-primary mt-0.5 tabular-nums">
                            {priceText}
                          </p>
                        </div>
                      </Link>

                      <div className="shrink-0 flex items-center gap-1.5">
                        {!isOutOfStock && (
                          <button
                            type="button"
                            onClick={(e) => handleQuickAdd(p, e)}
                            className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        )}
                        <Link
                          to={`/product/${p.slug}`}
                          onClick={onClose}
                          className="p-1.5 text-zinc-400 hover:text-zinc-900 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
