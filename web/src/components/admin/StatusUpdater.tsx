import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function StatusUpdater({
  orderId,
  currentStatus,
  onStatusChange,
}: {
  orderId: string;
  currentStatus: string;
  onStatusChange?: (newStatus: string) => void;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setStatus(currentStatus);
  }, [currentStatus]);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update status");
      }
      setStatus(newStatus);
      if (onStatusChange) onStatusChange(newStatus);
    } catch (err: any) {
      alert(err.message || "Failed to update status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <select
        value={status}
        onChange={handleStatusChange}
        disabled={loading}
        className="h-8.5 px-3 bg-stone-50 hover:bg-stone-100 border border-stone-200/90 rounded-lg text-xs font-semibold text-stone-900 focus:outline-none focus:border-stone-400 disabled:opacity-50 cursor-pointer"
      >
        <option value="pending">Status: Pending</option>
        <option value="confirmed">Status: Confirmed</option>
        <option value="preparing">Status: Preparing</option>
        <option value="ready">Status: Ready</option>
        <option value="delivered">Status: Delivered</option>
        <option value="cancelled">Status: Cancelled</option>
      </select>
      {loading && <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />}
    </div>
  );
}
