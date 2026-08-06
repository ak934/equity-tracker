"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAnalysisPolling } from "@/lib/use-analysis-polling";

export function RunAnalysisButton({
  ticker,
  navigateAfter,
  initialAnalyzing = false,
}: {
  ticker: string;
  navigateAfter?: string;
  initialAnalyzing?: boolean;
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

  // while a run is in flight — including one kicked off before this
  // component mounted, e.g. after navigating back to this page — poll for
  // completion so the button doesn't look stuck on "Analyzing..." forever
  useAnalysisPolling(ticker, isAnalyzing);

  return (
    <Button
      size="sm"
      onClick={async () => {
        setIsAnalyzing(true);
        // The route handler responds as soon as analysisRunning is durably
        // persisted (it defers the actual 60-90s analysis to run in the
        // background), so awaiting it here is fast and guarantees the
        // flag is set in the DB before we navigate — otherwise the
        // destination page's own read could race the write and render as
        // if nothing had started.
        try {
          const res = await fetch("/api/analysis", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ticker }),
          });
          // 409 means another instance of this button already started
          // this ticker's run — treat it the same as our own success and
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
      {isAnalyzing ? "Analyzing..." : "Run Analysis"}
    </Button>
  );
}
