"use client";

import { runAnalysis } from "@/app/actions/stocks";
import { useTransition } from "react";

export function RunAnalysisButton({ ticker }: { ticker: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => runAnalysis(ticker))}
      disabled={isPending}
      className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
    >
      {isPending ? "Analyzing..." : "Run Analysis"}
    </button>
  );
}