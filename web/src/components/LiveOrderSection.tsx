import React, { useEffect, useState, useTransition, useRef } from "react";
import { Ban, Loader2, CreditCard, Banknote, Check } from "lucide-react";
import { triggerDeviceNotification } from "../utils/deviceNotification";

interface LiveOrderSectionProps {
  orderNumber: string;
  initialStatus: string;
  paymentMethod: "cod" | "qr";
  paymentStatus: "pending" | "paid";
}

export default function LiveOrderSection({
  orderNumber,
  initialStatus,
  paymentMethod,
  paymentStatus,
}: LiveOrderSectionProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();
  const [cancelError, setCancelError] = useState("");
  const previousStatus = useRef(initialStatus);

  useEffect(() => {
    let active = true;

    const terminalStatuses = ["delivered", "cancelled", "completed"];
    if (terminalStatuses.includes(status)) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderNumber}/status`);
        if (res.ok) {
          const data = await res.json();
          if (active && data.success && data.status) {
            if (data.status !== previousStatus.current) {
              const oldSt = previousStatus.current;
              previousStatus.current = data.status;
              setStatus(data.status);

              triggerDeviceNotification(`Prime Cuts — Order #${orderNumber}`, {
                body: `Your order status has changed from ${oldSt.toUpperCase()} to ${data.status.toUpperCase()}.`,
                url: `/orders/${orderNumber}`,
              });
            }
          }
        }
      } catch (err) {
        console.error("Failed to check live order status:", err);
      }
    }, 4000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [orderNumber, status]);

  const handleCancel = () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    setCancelError("");
    startTransition(async () => {
      try {
        const res = await fetch(`/api/orders/${orderNumber}/cancel`, {
          method: "POST",
        });
        const data = await res.json();
        if (data.success && data.status) {
          setStatus(data.status);
        } else {
          setCancelError(data.error || "Failed to cancel order.");
        }
      } catch {
        setCancelError("An error occurred during order cancellation.");
      }
    });
  };

  const isTerminalSuccess = status === "completed" || status === "delivered";
  const isTerminalFail = status === "cancelled";

  return (
    <div className="space-y-4">
      {/* Live status bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50 border border-zinc-200 p-4 sm:p-5 rounded-xl">
        <div>
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
            Order Status
          </p>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isTerminalFail
                  ? "bg-primary"
                  : isTerminalSuccess
                  ? "bg-zinc-900"
                  : "bg-primary animate-pulse"
              }`}
            />
            <span
              className={`font-bold text-lg uppercase tracking-wider inline-flex items-center gap-1.5 ${
                isTerminalFail ? "text-primary" : "text-zinc-900"
              }`}
            >
              <span>{status}</span>
              {isTerminalSuccess && (
                <Check className="w-4 h-4 text-primary stroke-[2.5]" />
              )}
            </span>
          </div>
        </div>

        {status === "pending" && (
          <div className="flex flex-col items-end gap-1 shrink-0">
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-primary border border-red-200 font-semibold text-xs rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cancelling...
                </>
              ) : (
                <>
                  <Ban className="w-3.5 h-3.5" /> Cancel Order
                </>
              )}
            </button>
            {cancelError && (
              <p className="text-[11px] text-primary font-medium">
                {cancelError}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Payment details card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50 border border-zinc-200 p-4 sm:p-5 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center border border-zinc-200 shrink-0">
            {paymentMethod === "qr" ? (
              <CreditCard className="w-4 h-4 text-zinc-700" />
            ) : (
              <Banknote className="w-4 h-4 text-zinc-700" />
            )}
          </div>
          <div>
            <p className="text-[11px] font-medium text-zinc-500">
              Payment Method
            </p>
            <p className="font-semibold text-sm text-zinc-900 mt-0.5">
              {paymentMethod === "qr"
                ? "QR Scan & Pay"
                : "Cash on Delivery / Pickup"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center border border-zinc-200 shrink-0">
            <span
              className={`w-2 h-2 rounded-full ${
                paymentStatus === "paid" ? "bg-zinc-900" : "bg-primary"
              }`}
            />
          </div>
          <div>
            <p className="text-[11px] font-medium text-zinc-500">
              Payment Status
            </p>
            <span
              className={`inline-block text-xs font-semibold uppercase mt-0.5 px-2 py-0.5 rounded border ${
                paymentStatus === "paid"
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-700 border-zinc-300"
              }`}
            >
              {paymentStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
