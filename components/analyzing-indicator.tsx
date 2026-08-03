"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Shown when a re-analysis is running for a ticker that already has a report.
// Polls until the server-side analysisRunning flag clears, since the run
// keeps going in the background even if the user left and came back.
export function AnalyzingIndicator() {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <span className="inline-block rounded bg-amber-100 px-2.5 py-1 text-sm font-medium text-amber-800">
      Analyzing new report...
    </span>
  );
}
