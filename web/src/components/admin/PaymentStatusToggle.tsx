import React, { useState, useEffect } from "react";
import { Loader2, CheckCircle2, Clock } from "lucide-react";

export default function PaymentStatusToggle({
  orderId,
  currentPaymentStatus,
  onStatusChange,
}: {
  orderId: string;
  currentPaymentStatus: "pending" | "paid";
  onStatusChange?: (newStatus: "pending" | "paid") => void;
}) {
  const [status, setStatus] = useState(currentPaymentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setStatus(currentPaymentStatus);
  }, [currentPaymentStatus]);

  const toggle = async () => {
    const newStatus = status === "paid" ? "pending" : "paid";
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ paymentStatus: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update payment status.");
      }
      setStatus(newStatus);
      if (onStatusChange) onStatusChange(newStatus);
    } catch (err: any) {
      setError(err.message || "Failed to update payment status.");
    } finally {
      setLoading(false);
    }
  };

  const isPaid = status === "paid";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase border ${
            isPaid
              ? "bg-emerald-50 text-emerald-700 border-emerald-200/90"
              : "bg-amber-50 text-amber-800 border-amber-200/90"
          }`}
        >
          {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
          {status}
        </span>

        <button
          type="button"
          onClick={toggle}
          disabled={loading}
          className={`h-7 px-2.5 rounded-md text-[11px] font-semibold border transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1 ${
            isPaid
              ? "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
              : "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700"
          }`}
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : isPaid ? (
            "Mark Unpaid"
          ) : (
            "Mark Paid"
          )}
        </button>
      </div>
      {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}
    </div>
  );
}
