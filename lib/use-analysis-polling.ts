"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Next.js reuses the client-side router cache on browser back/forward
// navigation by design (to avoid layout shift), even for pages that are
// otherwise never cached — so returning to a page like /queue can show a
// stale "Analyzing..." snapshot from before a run finished. This refreshes
// immediately (not just on the next interval tick) whenever a run is active,
// and again the moment the tab regains focus, so a stale view self-corrects
// in roughly one round-trip instead of waiting out the poll interval.
export function useAnalysisPolling(active: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;

    router.refresh();
    const interval = setInterval(() => router.refresh(), 2500);

    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [active, router]);
}
