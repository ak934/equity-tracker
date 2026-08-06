"use client";

import { Loader2 } from "lucide-react";
import { useAnalysisPolling } from "@/lib/use-analysis-polling";

// Shown when a re-analysis is running for a ticker that already has a report.
// Polls until the server-side analysisRunning flag clears, since the run
// keeps going in the background even if the user left and came back.
export function AnalyzingIndicator({ ticker }: { ticker: string }) {
  useAnalysisPolling(ticker, true);

  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-warning/10 px-2.5 py-1 text-sm font-medium text-warning">
      <Loader2 className="size-3.5 animate-spin" />
      Analyzing new report...
    </span>
  );
}
