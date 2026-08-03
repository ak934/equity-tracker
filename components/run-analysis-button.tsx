"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  const router = useRouter();

  // the server is the source of truth for whether a run is still in flight
  // (it keeps going even if this component unmounts), so re-sync whenever a
  // fresh server read comes in
  useEffect(() => {
    setIsAnalyzing(initialAnalyzing);
  }, [initialAnalyzing]);

  // while a run is in flight — including one kicked off before this
  // component mounted, e.g. after navigating back to this page — poll for
  // completion so the button doesn't look stuck on "Analyzing..." forever
  useAnalysisPolling(ticker, isAnalyzing);

  return (
    <button
      onClick={async () => {
        setIsAnalyzing(true);
        // don't await this before navigating away — the request keeps the
        // analysis running server-side regardless of what page is open, so
        // navigateAfter should happen immediately, not once the (60-90s)
        // analysis finishes. Whichever page the user ends up on reads the
        // durable analysisRunning flag on its own next load/poll.
        const done = fetch("/api/analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticker }),
        })
          .then(async (res) => {
            // 409 means another instance of this button already started
            // this ticker's run — treat it the same as our own success and
            // let polling pick up completion
            if (!res.ok && res.status !== 409) {
              throw new Error(await res.text());
            }
            router.refresh();
          })
          .catch(() => setIsAnalyzing(false));

        if (navigateAfter) {
          router.push(navigateAfter);
        } else {
          await done;
        }
      }}
      disabled={isAnalyzing}
      className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
    >
      {isAnalyzing ? "Analyzing..." : "Run Analysis"}
    </button>
  );
}
