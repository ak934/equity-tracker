"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Next.js reuses the browser's back/forward cache by design — not something
// staleTimes can turn off — so a page like /queue can show a snapshot from
// before a run finished, and router.refresh() goes through that same cached
// machinery. This instead hits a tiny dedicated status endpoint with a plain
// fetch(), which isn't part of that cache, as the source of truth for
// whether a run is really still going. router.refresh() is only called once
// that check confirms the run just finished, to pull in the updated page
// (e.g. the ticker leaving the Queue list).
export function useAnalysisPolling(ticker: string, active: boolean) {
  const router = useRouter();
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    if (!active) return;

    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch(`/api/analysis/status?ticker=${encodeURIComponent(ticker)}`);
        const { running } = await res.json();
        if (!cancelled && !running && activeRef.current) {
          activeRef.current = false;
          router.refresh();
        }
      } catch {
        // network hiccup — the next tick will retry
      }
    };

    check();
    const interval = setInterval(check, 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [ticker, active, router]);
}
