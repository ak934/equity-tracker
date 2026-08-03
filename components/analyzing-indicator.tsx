"use client";

import { useAnalysisPolling } from "@/lib/use-analysis-polling";

// Shown when a re-analysis is running for a ticker that already has a report.
// Polls until the server-side analysisRunning flag clears, since the run
// keeps going in the background even if the user left and came back.
export function AnalyzingIndicator() {
  useAnalysisPolling(true);

  return (
    <span className="inline-block rounded bg-amber-100 px-2.5 py-1 text-sm font-medium text-amber-800">
      Analyzing new report...
    </span>
  );
}
