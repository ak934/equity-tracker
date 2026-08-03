"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RunAnalysisButton({
  ticker,
  navigateAfter,
}: {
  ticker: string;
  navigateAfter?: string;
}) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        setIsPending(true);
        try {
          const res = await fetch("/api/analysis", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ticker }),
          });
          if (!res.ok) {
            throw new Error(await res.text());
          }
          router.refresh();
          if (navigateAfter) {
            router.push(navigateAfter);
          }
        } finally {
          setIsPending(false);
        }
      }}
      disabled={isPending}
      className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
    >
      {isPending ? "Analyzing..." : "Run Analysis"}
    </button>
  );
}