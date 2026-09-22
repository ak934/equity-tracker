"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { setTargetPrice } from "@/app/actions/stocks";

// Shown below a finished analysis write-up: once the user has read the
// verdict, offer to alert them by email when the price drops to a level
// they'd actually buy at (see the Alerts page for everything they've set).
// suggestedTargetPrice, when present, is the latest analysis's own
// back-solved "price today for a 15% IRR" (see Step 2B in lib/analysis.ts);
// it's only ever a prefilled suggestion; nothing is saved until the user
// confirms it (or a number they adjusted it to) via Set Alert/Update.
export function TargetPricePrompt({
  stockId,
  targetPrice,
  suggestedTargetPrice = null,
}: {
  stockId: string;
  targetPrice: number | null;
  suggestedTargetPrice?: number | null;
}) {
  const [value, setValue] = useState(
    targetPrice != null
      ? String(targetPrice)
      : suggestedTargetPrice != null
        ? String(suggestedTargetPrice)
        : ""
  );
  const [isEditing, setIsEditing] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isPending, startTransition] = useTransition();

  const save = (nextValue: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", stockId);
      formData.set("targetPrice", nextValue);
      await setTargetPrice(formData);
      setValue(nextValue);
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

  // A cent apart still counts as "already matches" so rounding doesn't
  // nag the user forever.
  const suggestionDiffers =
    suggestedTargetPrice != null &&
    (targetPrice == null || Math.abs(targetPrice - suggestedTargetPrice) >= 0.01);

  if (targetPrice != null && !isEditing) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
        <span>
          🔔 We&apos;ll email you when this hits <strong className="font-mono">${targetPrice.toFixed(2)}</strong>.
        </span>
        {suggestionDiffers && (
          <span className="text-muted-foreground">
            Latest analysis suggests{" "}
            <strong className="font-mono text-foreground">${suggestedTargetPrice.toFixed(2)}</strong> for a
            15% IRR.
          </span>
        )}
        <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(true)}>
          Edit
        </Button>
        {suggestionDiffers && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => save(String(suggestedTargetPrice))}
            disabled={isPending}
          >
            Update to ${suggestedTargetPrice.toFixed(2)}
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={clear} disabled={isPending}>
          Clear
        </Button>
      </div>
    );
  }

  if (dismissed) return null;

  return (
    <div className="rounded-lg border border-border px-4 py-3">
      <p className="text-sm text-muted-foreground">
        {suggestedTargetPrice != null
          ? `Our analysis suggests $${suggestedTargetPrice.toFixed(2)} as a target price for a 15% annualized return. Set an alert there, or adjust it below.`
          : "Want to set a target price to buy this stock at? We'll email you when it hits."}
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
        <Button
          type="button"
          size="sm"
          onClick={() => save(value)}
          disabled={isPending || !value.trim()}
        >
          {isPending ? "Saving…" : "Set Alert"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setDismissed(true)}>
          No thanks
        </Button>
      </div>
    </div>
  );
}
