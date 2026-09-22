"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAnalysisPolling } from "@/lib/use-analysis-polling";
import { addStock } from "@/app/actions/watchlists";

export function RunAnalysisButton({
  ticker,
  navigateAfter,
  initialAnalyzing = false,
  frameworkId,
  hasExistingAnalysis = false,
  name,
  cik,
}: {
  ticker: string;
  navigateAfter?: string;
  initialAnalyzing?: boolean;
  frameworkId?: string;
  hasExistingAnalysis?: boolean;
  // Pass these for a ticker that's only ever been searched, not tracked
  // yet (no Stock row exists): the analysisRunning flag /api/analysis sets
  // lives on Stock, so without one the "Analyzing..." state can never be
  // observed by the polling hook below. Their presence signals that this
  // button needs to upsert the stock (into Unsorted, same as AddStockForm)
  // before kicking off analysis; a tracked stock's row never passes these.
  name?: string;
  cik?: string | null;
}) {
  const [isAnalyzing, setIsAnalyzing] = useState(initialAnalyzing);
  const [prevInitialAnalyzing, setPrevInitialAnalyzing] = useState(initialAnalyzing);
  const router = useRouter();

  // the server is the source of truth for whether a run is still in flight
  // (it keeps going even if this component unmounts), so re-sync whenever a
  // fresh server read comes in
  if (initialAnalyzing !== prevInitialAnalyzing) {
    setPrevInitialAnalyzing(initialAnalyzing);
    setIsAnalyzing(initialAnalyzing);
  }

  // while a run is in flight (including one kicked off before this
  // component mounted, e.g. after navigating back to this page), poll for
  // completion so the button doesn't look stuck on "Analyzing..." forever
  useAnalysisPolling(ticker, isAnalyzing);

  return (
    <Button
      size="sm"
      onClick={async () => {
        setIsAnalyzing(true);

        if (name) {
          // Untracked ticker: create its Stock row first (Unsorted, same
          // as AddStockForm) so /api/analysis has something to set
          // analysisRunning on and the polling hook below can see it.
          try {
            const formData = new FormData();
            formData.set("ticker", ticker);
            formData.set("name", name);
            formData.set("cik", cik ?? "");
            await addStock(formData);
          } catch {
            setIsAnalyzing(false);
            return;
          }
        }

        // The route handler responds as soon as analysisRunning is durably
        // persisted (it defers the actual 60-90s analysis to run in the
        // background), so awaiting it here is fast and guarantees the
        // flag is set in the DB before we navigate; otherwise the
        // destination page's own read could race the write and render as
        // if nothing had started.
        try {
          const res = await fetch("/api/analysis", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ticker, frameworkId }),
          });
          // 409 means another instance of this button already started
          // this ticker's run: treat it the same as our own success and
          // let polling pick up completion
          if (!res.ok && res.status !== 409) {
            throw new Error(await res.text());
          }
        } catch {
          setIsAnalyzing(false);
          return;
        }

        if (navigateAfter) {
          router.push(navigateAfter);
        } else {
          router.refresh();
        }
      }}
      disabled={isAnalyzing}
    >
      {isAnalyzing ? "Analyzing..." : hasExistingAnalysis ? "Reanalyze" : "Run Analysis"}
    </Button>
  );
}
