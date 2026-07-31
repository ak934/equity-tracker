"use client";

import { runAnalysis } from "@/app/actions/stocks";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function RunAnalysisButton({
  ticker,
  navigateAfter,
}: {
  ticker: string;
  navigateAfter?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await runAnalysis(ticker);
          if (navigateAfter) {
            router.push(navigateAfter);
          }
        })
      }
      disabled={isPending}
      className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
    >
      {isPending ? "Analyzing..." : "Run Analysis"}
    </button>
  );
}