import React from "react";
import { Check } from "lucide-react";

interface LiveOrderStatusProps {
  status: string;
}

export default function LiveOrderStatus({ status }: LiveOrderStatusProps) {
  const isTerminalSuccess = status === "completed" || status === "delivered";
  const isTerminalFail = status === "cancelled";

  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-2 h-2 rounded-full ${
          isTerminalFail
            ? "bg-primary"
            : isTerminalSuccess
              ? "bg-zinc-900"
              : "bg-primary animate-pulse"
        }`}
      />
      <span
        className={`font-bold text-xs uppercase tracking-wider inline-flex items-center gap-1 ${
          isTerminalFail ? "text-primary" : "text-zinc-900"
        }`}
      >
        <span>{status}</span>
        {isTerminalSuccess && <Check className="w-3.5 h-3.5 text-primary" />}
      </span>
    </div>
  );
}
