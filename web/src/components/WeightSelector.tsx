import React, { useState } from "react";
import { Plus, Minus, Check, Scale, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";
import { Product, Variant } from "@/types/types";

interface WeightSelectorProps {
  product: Product;
  isAvailable: boolean;
}

const DEFAULT_PRESET_WEIGHTS = [
  { value: 250, unit: "g", label: "250g" },
  { value: 500, unit: "g", label: "500g" },
  { value: 750, unit: "g", label: "750g" },
  { value: 1, unit: "kg", label: "1 kg" },
  { value: 2, unit: "kg", label: "2 kg" },
];

export default function WeightSelector({
  product,
  isAvailable,
}: WeightSelectorProps) {
  const { addWeightItem, addVariantItem } = useCart();

  const [weightInGrams, setWeightInGrams] = useState<number>(500);
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [customKgStr, setCustomKgStr] = useState<string>("1.0");

  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  );

  const [qty, setQty] = useState<number>(1);
  const [isAdded, setIsAdded] = useState(false);
  const [cutPreference, setCutPreference] = useState<string>(
    "Curry Cut (Medium)"
  );

  const CUT_OPTIONS = [
    {
      id: "Curry Cut (Medium)",
      label: "Curry Cut",
      sub: "Standard bone-in gravy pieces",
    },
    {
      id: "Small Pieces (झोल)",
      label: "Small Cuts (Jhol)",
      sub: "Bite-size for soup & gravy",
    },
    {
      id: "Biryani Cut (Large)",
      label: "Biryani Cut",
      sub: "Large traditional pieces",
    },
    {
      id: "Boneless / Trimmed",
      label: "Boneless / Lean",
      sub: "Clean trimmed meat",
    },
  ];

  const activeWeightGrams = isCustom
    ? Math.max(0, Math.round((parseFloat(customKgStr) || 0) * 1000))
    : weightInGrams;

  let finalPrice = "0.00";
  if (product.priceType === "weight" && product.pricePerKg) {
    finalPrice = Math.max(
      0,
      (activeWeightGrams / 1000) * product.pricePerKg * qty
    ).toFixed(2);
  } else if (product.priceType === "variant" && selectedVariant) {
    finalPrice = (selectedVariant.price * qty).toFixed(2);
  }

  const allowCustom = product.allowCustomWeight !== false;

  const handlePresetSelect = (val: number, unit: string) => {
    const grams = unit === "kg" ? val * 1000 : val;
    setWeightInGrams(grams);
    setIsCustom(false);
  };

  const handleCustomSelect = () => {
    if (!allowCustom) return;
    setIsCustom(true);
    if (!customKgStr) {
      setCustomKgStr("1.0");
    }
  };

  const handleCustomKgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomKgStr(e.target.value);
  };

  const increaseQty = () => setQty((prev) => prev + 1);
  const decreaseQty = () => setQty((prev) => (prev > 1 ? prev - 1 : 1));

  const handleAddToCart = () => {
    if (!isAvailable) return;
    if (product.priceType === "weight" && activeWeightGrams <= 0) return;
    if (product.priceType === "variant" && !selectedVariant) return;

    if (product.priceType === "weight") {
      addWeightItem(
        {
          id: product.id,
          slug: product.slug,
          name: product.name,
          priceType: product.priceType,
          pricePerKg: product.pricePerKg,
          image: product.image || "",
        },
        activeWeightGrams,
        qty,
        cutPreference
      );
    } else if (product.priceType === "variant" && selectedVariant) {
      addVariantItem(
        {
          id: product.id,
          slug: product.slug,
          name: product.name,
          priceType: product.priceType,
          image: product.image || "",
        },
        selectedVariant.name,
        selectedVariant.price,
        qty
      );
    }

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1800);
  };

  return (
    <div className="flex flex-col space-y-4 sm:space-y-5">
      {/* Weight or Variant Selector */}
      <div>
        <label className="block font-semibold text-zinc-900 mb-2 text-xs uppercase tracking-wider">
          {product.priceType === "weight"
            ? "Select Weight"
            : "Select Pack Variant"}
        </label>

        {product.priceType === "weight" ? (
          <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2">
            {DEFAULT_PRESET_WEIGHTS.map((preset, idx) => {
              const presetGrams =
                preset.unit === "kg" ? preset.value * 1000 : preset.value;
              const isSelected = !isCustom && weightInGrams === presetGrams;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePresetSelect(preset.value, preset.unit)}
                  className={`h-9 px-3.5 rounded-lg font-semibold text-xs sm:text-sm transition-all border cursor-pointer text-center tabular-nums ${
                    isSelected
                      ? "border-zinc-900 bg-zinc-900 text-white shadow-2xs"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}

            {allowCustom && (
              <button
                type="button"
                onClick={handleCustomSelect}
                className={`h-9 px-3.5 rounded-lg font-semibold text-xs sm:text-sm transition-all border cursor-pointer flex items-center justify-center gap-1.5 ${
                  isCustom
                    ? "border-zinc-900 bg-zinc-900 text-white shadow-2xs"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Custom kg</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            {product.variants?.map((v, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedVariant(v)}
                className={`h-9 px-3.5 rounded-lg font-semibold text-xs sm:text-sm transition-all border cursor-pointer ${
                  selectedVariant?.name === v.name
                    ? "border-zinc-900 bg-zinc-900 text-white shadow-2xs"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Custom Weight Input in KG */}
      {product.priceType === "weight" && isCustom && (
        <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-zinc-900 text-xs flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-primary" />
              <span>Enter Custom Weight (Kilograms)</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-36">
              <input
                type="number"
                min="0.1"
                step="0.1"
                placeholder="e.g. 1.5"
                value={customKgStr}
                onChange={handleCustomKgChange}
                className="w-full h-9 pl-3 pr-9 rounded-lg border border-zinc-300 bg-white focus:outline-none focus:border-zinc-900 text-zinc-900 font-semibold text-sm tabular-nums"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 font-medium text-xs">
                kg
              </span>
            </div>

            <div className="text-xs text-zinc-500 tabular-nums">
              = <strong className="font-semibold text-zinc-800">{activeWeightGrams}g</strong>
            </div>
          </div>
        </div>
      )}

      {/* Butcher Cut Preference */}
      {product.priceType === "weight" && (
        <div>
          <label className="block font-semibold text-zinc-900 mb-2 text-xs uppercase tracking-wider">
            Butcher Cut Preference{" "}
            <span className="text-zinc-400 font-normal normal-case">
              (optional)
            </span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CUT_OPTIONS.map((opt) => {
              const isSelected = cutPreference === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCutPreference(opt.id)}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-red-50/50 text-zinc-900"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                  }`}
                >
                  <div className="font-semibold text-xs sm:text-[13px] flex items-center justify-between">
                    <span>{opt.label}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-500 font-normal leading-tight mt-0.5">
                    {opt.sub}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Price, Quantity & Add to Cart Row */}
      <div className="pt-2 space-y-3">
        <div className="flex items-center justify-between gap-3 bg-zinc-50 p-3.5 rounded-xl border border-zinc-200">
          <div>
            <span className="text-[11px] font-medium text-zinc-500 block">
              Selected Total
            </span>
            <span className="font-bold text-zinc-900 text-lg sm:text-xl tabular-nums">
              Rs. {finalPrice}
            </span>
          </div>

          <div className="flex items-center border border-zinc-200 rounded-lg bg-white h-9">
            <button
              type="button"
              onClick={decreaseQty}
              className="w-9 h-full flex items-center justify-center text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 rounded-l-lg transition-colors cursor-pointer"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <div className="w-9 h-full flex items-center justify-center border-x border-zinc-200 text-zinc-900 font-semibold text-xs sm:text-sm tabular-nums">
              {qty}
            </div>
            <button
              type="button"
              onClick={increaseQty}
              className="w-9 h-full flex items-center justify-center text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 rounded-r-lg transition-colors cursor-pointer"
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={
            !isAvailable ||
            (product.priceType === "weight" && activeWeightGrams <= 0) ||
            (product.priceType === "variant" && !selectedVariant) ||
            isAdded
          }
          className={`w-full h-11 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer font-semibold text-sm ${
            !isAvailable ||
            (product.priceType === "weight" && activeWeightGrams <= 0) ||
            (product.priceType === "variant" && !selectedVariant)
              ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
              : isAdded
              ? "bg-zinc-900 text-white"
              : "bg-primary text-white hover:bg-primary-hover shadow-2xs"
          }`}
        >
          {isAdded ? (
            <>
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Added to Cart</span>
            </>
          ) : !isAvailable ? (
            "Out of Stock"
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Cart • Rs. {finalPrice}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
