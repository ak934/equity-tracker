"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  useAnalysisNotifications,
  type AnalysisOutcome,
} from "@/lib/use-analysis-notifications";

type Toast = AnalysisOutcome & { id: number };

let nextId = 1;

// Mounted once in the root layout so a run finishing shows up here
// regardless of which page the user has navigated to. Deliberately does
// NOT auto-dismiss — a run started from the Queue can take a minute or
// more, so by the time it finishes the user is usually looking at a
// different tab entirely; a toast that vanishes in a few seconds would
// almost always be missed. It stays until the user views or dismisses it.
export function AnalysisNotifications() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const router = useRouter();

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  useAnalysisNotifications((outcome) => {
    setToasts((current) => [...current, { ...outcome, id: nextId++ }]);
    // a finished run changed data on whatever page is currently open (the
    // ticker page, queue, watchlist) — refresh so it's not stuck showing
    // the pre-completion state until the user next interacts with it
    router.refresh();
  });

  if (toasts.length === 0) return null;

  return (
    <div className="fixed inset-x-0 top-16 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex w-full max-w-md items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${
            toast.status === "ready"
              ? "border-green-200 bg-green-50 text-green-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          <span className="flex-1">
            {toast.status === "ready" ? (
              <>
                🎉 New analysis ready for <strong>{toast.ticker}</strong>
              </>
            ) : (
              <>
                Analysis for <strong>{toast.ticker}</strong> failed — it&apos;s back in the queue
              </>
            )}
          </span>
          {toast.status === "ready" && (
            <Button asChild size="sm" onClick={() => dismiss(toast.id)}>
              <Link href={`/stocks/${toast.ticker}`}>Read it</Link>
            </Button>
          )}
          <button
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss"
            className="text-neutral-400 hover:text-neutral-600"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
