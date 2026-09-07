"use client";

import { useTransition } from "react";
import { addStockToWatchlist } from "@/app/actions/watchlists";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// For a search-history entry that was never turned into a tracked Stock —
// unlike StockWatchlistStatus, there's no stockId yet, so adding upserts
// one into existence via addStockToWatchlist rather than toggling
// membership on a row that already exists.
export function AddSearchResultToWatchlist({
  ticker,
  name,
  allWatchlists,
}: {
  ticker: string;
  name: string;
  allWatchlists: { id: string; name: string }[];
}) {
  const [isPending, startTransition] = useTransition();

  function addTo(watchlistId: string) {
    const formData = new FormData();
    formData.set("watchlistId", watchlistId);
    formData.set("ticker", ticker);
    formData.set("name", name);
    startTransition(async () => {
      await addStockToWatchlist(formData);
    });
  }

  if (allWatchlists.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isPending}>
          Add to Watchlist
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {allWatchlists.map((watchlist) => (
          <DropdownMenuItem key={watchlist.id} onSelect={() => addTo(watchlist.id)}>
            {watchlist.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
