"use client";

import { useTransition } from "react";
import { setStockWatchlistMembership } from "@/app/actions/watchlists";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Unlike StockWatchlistMenu (the compact per-row control in the watchlist
// table), a stock's analysis page only needs to answer one question at a
// glance: is this already being tracked? So membership renders as plain
// text, and the add control only shows up when there's a decision to make.
export function StockWatchlistStatus({
  stockId,
  allWatchlists,
  memberIds,
}: {
  stockId: string;
  allWatchlists: { id: string; name: string }[];
  memberIds: string[];
}) {
  const [isPending, startTransition] = useTransition();
  const memberNames = allWatchlists
    .filter((w) => memberIds.includes(w.id))
    .map((w) => w.name);

  function addTo(watchlistId: string) {
    const formData = new FormData();
    formData.set("stockId", stockId);
    formData.set("watchlistId", watchlistId);
    formData.set("member", "true");
    startTransition(async () => {
      await setStockWatchlistMembership(formData);
    });
  }

  if (memberNames.length > 0) {
    return (
      <span className="text-sm text-muted-foreground">
        Currently in your{" "}
        <span className="font-medium text-foreground">{memberNames.join(", ")}</span>{" "}
        watchlist{memberNames.length > 1 ? "s" : ""}
      </span>
    );
  }

  if (allWatchlists.length === 0) {
    return null;
  }

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
