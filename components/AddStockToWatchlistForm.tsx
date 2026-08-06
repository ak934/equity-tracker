"use client";

import { useRef, useState } from "react";
import { addStockToWatchlist } from "@/app/actions/watchlists";
import { Button } from "@/components/ui/button";
import { TickerSearchInput, type TickerResult } from "@/components/TickerSearchInput";

export function AddStockToWatchlistForm({ watchlistId }: { watchlistId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [selected, setSelected] = useState<TickerResult | null>(null);
  const [resetKey, setResetKey] = useState(0);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await addStockToWatchlist(formData);
        formRef.current?.reset();
        setSelected(null);
        setResetKey((k) => k + 1);
      }}
      className="flex gap-2"
    >
      <input type="hidden" name="watchlistId" value={watchlistId} />
      <TickerSearchInput key={resetKey} onSelectionChange={setSelected} />
      <Button type="submit" disabled={!selected}>
        Add
      </Button>
    </form>
  );
}
