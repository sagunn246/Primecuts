import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyOrderButtonProps {
  orderText: string;
}

export default function CopyOrderButton({ orderText }: CopyOrderButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(orderText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-zinc-200 rounded-xl font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer text-xs"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-primary" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4 text-zinc-600" />
          <span>Copy Details</span>
        </>
      )}
    </button>
  );
}
