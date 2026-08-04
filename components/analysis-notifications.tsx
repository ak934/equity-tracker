"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useAnalysisNotifications,
  type AnalysisOutcome,
} from "@/lib/use-analysis-notifications";

const AUTO_DISMISS_MS = 8000;

type Toast = AnalysisOutcome & { id: number };

let nextId = 1;

// Mounted once in the root layout so a run finishing shows up here
// regardless of which page the user has navigated to.
export function AnalysisNotifications() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const router = useRouter();

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  useAnalysisNotifications((outcome) => {
    const toast = { ...outcome, id: nextId++ };
    setToasts((current) => [...current, toast]);
    setTimeout(() => dismiss(toast.id), AUTO_DISMISS_MS);
    // a finished run changed data on whatever page is currently open (the
    // ticker page, queue, watchlist) — refresh so it's not stuck showing
    // the pre-completion state until the user next interacts with it
    router.refresh();
  });

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${
            toast.status === "ready"
              ? "border-green-200 bg-green-50 text-green-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          <span>
            {toast.status === "ready" ? (
              <>
                New analysis ready for <strong>{toast.ticker}</strong>
              </>
            ) : (
              <>
                Analysis for <strong>{toast.ticker}</strong> failed — it&apos;s back in the queue
              </>
            )}
          </span>
          {toast.status === "ready" && (
            <Link
              href={`/stocks/${toast.ticker}`}
              onClick={() => dismiss(toast.id)}
              className="whitespace-nowrap font-medium underline"
            >
              View
            </Link>
          )}
          <button
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss"
            className="ml-1 text-neutral-400 hover:text-neutral-600"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
