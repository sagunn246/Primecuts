import React, { useState, useEffect } from "react";

interface StockToggleProps {
  productId: string;
  initialAvailable: boolean;
  onToggle?: (newAvailable: boolean) => void;
}

export default function StockToggle({ productId, initialAvailable, onToggle }: StockToggleProps) {
  const [available, setAvailable] = useState<boolean>(Boolean(initialAvailable));
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setAvailable(Boolean(initialAvailable));
  }, [initialAvailable]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    const previousValue = available;
    const newValue = !previousValue;
    setAvailable(newValue);
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/products/${productId}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isAvailable: newValue, available: newValue }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to update stock status");
      }
      if (onToggle) onToggle(newValue);
    } catch (err) {
      console.error("[StockToggle] Update failed:", err);
      setAvailable(previousValue);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={available}
      onClick={handleToggle}
      disabled={loading}
      title={available ? "In Stock — Tap to mark Sold Out" : "Sold Out — Tap to mark In Stock"}
      className={`inline-flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer border active:scale-95 ${
        available
          ? "bg-emerald-50/90 text-emerald-800 border-emerald-200/90 hover:bg-emerald-100/80"
          : "bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200/70"
      } ${loading ? "opacity-60 cursor-wait" : ""}`}
    >
      <span
        className={`w-7 h-4 rounded-full p-0.5 transition-colors flex items-center ${
          available ? "bg-emerald-600 justify-end" : "bg-stone-300 justify-start"
        }`}
      >
        <span className="w-3 h-3 rounded-full bg-white shadow-2xs" />
      </span>
      <span className="whitespace-nowrap">{available ? "In Stock" : "Sold Out"}</span>
    </button>
  );
}
