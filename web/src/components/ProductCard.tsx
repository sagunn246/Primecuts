import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Plus } from "lucide-react";
import { useCart } from "../context/CartContext";
import {
  getProductImageUrl,
  handleProductImageError,
} from "@/utils/imageUtils";

interface Variant {
  name: string;
  price: number;
}

interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  priceType?: "weight" | "variant";
  pricePerKg?: number;
  variants?: Variant[];
  image?: string;
  category: string;
  isAvailable?: boolean;
}

export default function ProductCard({
  id,
  slug,
  name,
  category,
  priceType = "weight",
  pricePerKg,
  variants = [],
  image,
  isAvailable = true,
}: ProductCardProps) {
  const [selectedWeight, setSelectedWeight] = useState<number>(500);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    variants.length > 0 ? variants[0] : null,
  );
  const [isAdded, setIsAdded] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const { addWeightItem, addVariantItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAvailable) return;

    if (priceType === "weight") {
      addWeightItem(
        { id, slug, name, priceType, pricePerKg, image: image || "" },
        selectedWeight,
        1,
      );
    } else if (priceType === "variant" && selectedVariant) {
      addVariantItem(
        { id, slug, name, priceType, image: image || "" },
        selectedVariant.name,
        selectedVariant.price,
        1,
      );
    }

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1600);
  };

  const displayPrice =
    priceType === "weight" && pricePerKg
      ? Math.round((selectedWeight / 1000) * pricePerKg)
      : selectedVariant?.price ||
        (pricePerKg ? Math.round((500 / 1000) * pricePerKg) : 0);

  return (
    <article
      className={`group bg-white rounded-2xl border border-zinc-200/90 hover:border-zinc-300 transition-all duration-200 hover:shadow-md flex flex-col justify-between overflow-hidden h-full ${
        !isAvailable ? "opacity-75" : ""
      }`}
    >
      {/* Image Container */}
      <div className="relative p-2 sm:p-2.5 pb-0">
        <div className="relative aspect-[4/3] w-full rounded-xl bg-zinc-100 overflow-hidden flex items-center justify-center border border-zinc-100">
          <Link
            to={`/product/${slug}`}
            className="block w-full h-full relative overflow-hidden"
          >
            {!imgLoaded && image && (
              <div className="absolute inset-0 bg-zinc-200 animate-pulse" />
            )}
            <img
              src={getProductImageUrl(image)}
              alt={name}
              loading="lazy"
              decoding="async"
              onLoad={() => setImgLoaded(true)}
              onError={(e) => {
                setImgLoaded(true);
                handleProductImageError(e);
              }}
              className={`w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105 ${
                imgLoaded ? "opacity-100" : "opacity-0"
              } ${!isAvailable ? "grayscale" : ""}`}
            />
          </Link>

          {/* Category Tag (Desktop & Tablet) */}
          <div className="absolute top-2 left-2 pointer-events-none z-10 hidden sm:block">
            <span className="px-2 py-0.5 rounded-md bg-zinc-900/80 backdrop-blur-xs text-white text-[10px] font-semibold">
              {category}
            </span>
          </div>

          {/* Sold Out Overlay */}
          {!isAvailable && (
            <div className="absolute inset-0 bg-zinc-950/55 flex items-center justify-center pointer-events-none z-20">
              <span className="text-[10px] sm:text-xs font-bold text-white px-2.5 py-0.5 bg-zinc-900 rounded-md uppercase tracking-wide">
                Sold Out
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-2.5 sm:p-3.5 flex flex-col flex-grow justify-between text-left">
        <div>
          {/* Product Title */}
          <Link to={`/product/${slug}`} className="block group/title mb-1.5">
            <h3 className="font-bold text-zinc-900 text-xs sm:text-[15px] leading-snug line-clamp-2 group-hover/title:text-primary transition-colors min-h-[32px] sm:min-h-[42px]">
              {name}
            </h3>
          </Link>

          {/* Single-Line Price Row (Never wraps Rs. and number onto separate lines) */}
          <div className="flex items-baseline justify-between gap-1 mb-2.5">
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="text-sm sm:text-lg font-extrabold text-primary tracking-tight whitespace-nowrap tabular-nums">
                Rs. {displayPrice.toLocaleString()}
              </span>
              {priceType === "weight" ? (
                <span className="text-[10px] sm:text-xs text-zinc-500 font-semibold whitespace-nowrap">
                  /
                  {selectedWeight >= 1000
                    ? `${selectedWeight / 1000}kg`
                    : `${selectedWeight}g`}
                </span>
              ) : selectedVariant ? (
                <span className="text-[10px] sm:text-xs text-zinc-500 font-semibold truncate">
                  /{selectedVariant.name}
                </span>
              ) : null}
            </div>

            {priceType === "weight" && pricePerKg && (
              <span className="text-zinc-400 text-[10px] font-medium hidden sm:inline whitespace-nowrap tabular-nums">
                Rs. {pricePerKg}/kg
              </span>
            )}
          </div>
        </div>

        {/* Controls Area */}
        <div className="space-y-1.5 sm:space-y-2">
          {/* Segmented Weight / Variant Selector — Uses Charcoal #18181B for Active Pill to Avoid Double-Red Clutter */}
          {priceType === "weight" ? (
            <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 rounded-xl border border-zinc-200/80">
              {[500, 1000].map((w) => {
                const isSelected = selectedWeight === w;
                return (
                  <button
                    key={w}
                    type="button"
                    disabled={!isAvailable}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedWeight(w);
                    }}
                    className={`h-7 sm:h-7.5 px-1 text-[11px] sm:text-xs font-bold rounded-lg transition-all flex items-center justify-center text-center min-w-0 cursor-pointer select-none active:scale-95 ${
                      isSelected
                        ? "bg-zinc-900 text-white shadow-2xs"
                        : "text-zinc-700 hover:text-zinc-900 bg-white border border-zinc-200/60"
                    }`}
                  >
                    <span className="leading-none">
                      {w >= 1000 ? "1kg" : "500g"}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            variants.length > 0 && (
              <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 rounded-xl border border-zinc-200/80">
                {variants.slice(0, 2).map((v, idx) => {
                  const isSelected = selectedVariant?.name === v.name;
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={!isAvailable}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedVariant(v);
                      }}
                      className={`h-7 sm:h-7.5 px-1.5 text-[10px] sm:text-[11px] font-bold rounded-lg transition-all truncate cursor-pointer flex items-center justify-center active:scale-95 ${
                        isSelected
                          ? "bg-zinc-900 text-white shadow-2xs"
                          : "text-zinc-700 hover:text-zinc-900 bg-white border border-zinc-200/60"
                      }`}
                    >
                      <span className="truncate leading-none">{v.name}</span>
                    </button>
                  );
                })}
              </div>
            )
          )}

          {/* Full-Width Add to Cart CTA Button — Strictly Crimson / Charcoal */}
          <button
            type="button"
            disabled={
              !isAvailable || (priceType === "variant" && !selectedVariant)
            }
            onClick={handleAddToCart}
            className={`w-full h-8 sm:h-9 rounded-xl font-bold text-[11px] sm:text-xs tracking-wide flex items-center justify-center gap-1 transition-all cursor-pointer select-none active:scale-95 ${
              !isAvailable || (priceType === "variant" && !selectedVariant)
                ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                : isAdded
                  ? "bg-zinc-900 text-white"
                  : "bg-primary hover:bg-primary-hover text-white shadow-2xs"
            }`}
          >
            {isAdded ? (
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Added</span>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>ADD</span>
              </span>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
