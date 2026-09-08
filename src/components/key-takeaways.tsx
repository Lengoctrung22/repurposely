"use client";

import { Lightbulb, Check, Copy } from "lucide-react";
import { useState } from "react";

interface KeyTakeawaysProps {
  takeaways: string[];
}

export function KeyTakeaways({ takeaways }: KeyTakeawaysProps) {
  const [copied, setCopied] = useState(false);

  if (!takeaways || takeaways.length === 0) return null;

  const handleCopy = async () => {
    const text = takeaways.map((item, idx) => `${idx + 1}. ${item}`).join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 to-orange-50/40 p-5 shadow-sm dark:border-amber-900/50 dark:from-amber-950/20 dark:to-orange-950/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm">
            <Lightbulb className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-amber-950 dark:text-amber-300">
            Key Takeaways (Ý tưởng cốt lõi chắt lọc bởi AI)
          </h3>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs font-medium text-amber-800 hover:text-amber-950 dark:text-amber-300 dark:hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span>Đã sao chép</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Sao chép tóm tắt</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-2">
        {takeaways.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2.5 text-sm text-amber-900/90 dark:text-amber-200/90">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200/70 text-[11px] font-bold text-amber-900 dark:bg-amber-900/60 dark:text-amber-300 mt-0.5">
              {idx + 1}
            </span>
            <p className="leading-relaxed">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
