"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { setTargetPrice } from "@/app/actions/stocks";

// Shown below a finished analysis write-up — once the user has read the
// verdict, offer to alert them by email when the price drops to a level
// they'd actually buy at (see the Alerts page for everything they've set).
export function TargetPricePrompt({
  stockId,
  targetPrice,
}: {
  stockId: string;
  targetPrice: number | null;
}) {
  const [value, setValue] = useState(targetPrice != null ? String(targetPrice) : "");
  const [isEditing, setIsEditing] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", stockId);
      formData.set("targetPrice", value);
      await setTargetPrice(formData);
      setIsEditing(false);
    });
  };

  const clear = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", stockId);
      formData.set("targetPrice", "");
      await setTargetPrice(formData);
      setValue("");
      setIsEditing(false);
    });
  };

  if (targetPrice != null && !isEditing) {
    return (
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <span>
          🔔 We&apos;ll email you when this hits <strong>${targetPrice.toFixed(2)}</strong>.
        </span>
        <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(true)}>
          Edit
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={clear} disabled={isPending}>
          Clear
        </Button>
      </div>
    );
  }

  if (dismissed) return null;

  return (
    <div className="mt-6 rounded-lg border px-4 py-3">
      <p className="text-sm text-neutral-600">
        Want to set a target price to buy this stock at? We&apos;ll email you when it hits.
      </p>
      <div className="mt-2 flex items-center gap-2">
        <Input
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Target price"
          className="w-32"
          disabled={isPending}
        />
        <Button type="button" size="sm" onClick={save} disabled={isPending || !value.trim()}>
          {isPending ? "Saving…" : "Set Alert"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setDismissed(true)}>
          No thanks
        </Button>
      </div>
    </div>
  );
}
