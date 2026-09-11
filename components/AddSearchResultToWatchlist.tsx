"use client";

import { useState, useTransition } from "react";
import { addStockToWatchlist, createWatchlist } from "@/app/actions/watchlists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// For a search-history entry that was never turned into a tracked Stock —
// unlike StockWatchlistStatus, there's no stockId yet, so adding upserts
// one into existence via addStockToWatchlist rather than toggling
// membership on a row that already exists.
export function AddSearchResultToWatchlist({
  ticker,
  name,
  cik = null,
  allWatchlists,
}: {
  ticker: string;
  name: string;
  cik?: string | null;
  allWatchlists: { id: string; name: string }[];
}) {
  const [isPending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  async function addToWatchlist(watchlistId: string) {
    const formData = new FormData();
    formData.set("watchlistId", watchlistId);
    formData.set("ticker", ticker);
    formData.set("name", name);
    formData.set("cik", cik ?? "");
    await addStockToWatchlist(formData);
  }

  function addTo(watchlistId: string) {
    startTransition(() => addToWatchlist(watchlistId));
  }

  function createAndAdd() {
    const listName = newName.trim();
    if (!listName) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", listName);
      const watchlist = await createWatchlist(formData);
      await addToWatchlist(watchlist.id);
      setCreating(false);
      setNewName("");
    });
  }

  if (creating) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createAndAdd();
        }}
        className="flex items-center gap-2"
      >
        <Input
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Watchlist name"
          className="h-7 w-40 text-sm"
          disabled={isPending}
        />
        <Button type="submit" size="sm" disabled={isPending || !newName.trim()}>
          Create
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setCreating(false);
            setNewName("");
          }}
          disabled={isPending}
        >
          Cancel
        </Button>
      </form>
    );
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
        {allWatchlists.length > 0 && <DropdownMenuSeparator />}
        <DropdownMenuItem onSelect={() => setCreating(true)}>
          + New watchlist
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
