"use client";

import { useEffect, useRef } from "react";

const POLL_MS = 4000;

export type AnalysisOutcome = {
  ticker: string;
  status: "ready" | "failed";
};

// Global, page-independent watch for analysis runs finishing. Mounted once
// in the root layout so it keeps tracking tickers across client-side
// navigation — the run itself already survives navigation server-side
// (see the after() call in app/api/analysis/route.ts), this just makes sure
// something is watching for its completion no matter where the user ends
// up in the app.
export function useAnalysisNotifications(onOutcome: (outcome: AnalysisOutcome) => void) {
  const onOutcomeRef = useRef(onOutcome);

  useEffect(() => {
    onOutcomeRef.current = onOutcome;
  }, [onOutcome]);

  useEffect(() => {
    let cancelled = false;
    const watching = new Set<string>();

    const check = async () => {
      let tickers: string[];
      try {
        const res = await fetch("/api/analysis/running");
        if (!res.ok) return;
        ({ tickers } = await res.json());
      } catch {
        return; // network hiccup — the next tick will retry
      }
      if (cancelled) return;

      const stillRunning = new Set(tickers);
      const justFinished = [...watching].filter((t) => !stillRunning.has(t));

      watching.clear();
      tickers.forEach((t) => watching.add(t));

      for (const ticker of justFinished) {
        try {
          const res = await fetch(`/api/analysis/status?ticker=${encodeURIComponent(ticker)}`);
          const { needsReanalysis } = await res.json();
          if (!cancelled) {
            onOutcomeRef.current({ ticker, status: needsReanalysis ? "failed" : "ready" });
          }
        } catch {
          // couldn't confirm the outcome — skip notifying rather than guess
        }
      }
    };

    check();
    const interval = setInterval(check, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);
}
