"use client";

import { useState, useTransition } from "react";
import { createWatchlist, setStockWatchlistMembership } from "@/app/actions/watchlists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const memberNames = allWatchlists
    .filter((w) => memberIds.includes(w.id))
    .map((w) => w.name);

  async function addToWatchlist(watchlistId: string) {
    const formData = new FormData();
    formData.set("stockId", stockId);
    formData.set("watchlistId", watchlistId);
    formData.set("member", "true");
    await setStockWatchlistMembership(formData);
  }

  function addTo(watchlistId: string) {
    startTransition(() => addToWatchlist(watchlistId));
  }

  function createAndAdd() {
    const name = newName.trim();
    if (!name) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", name);
      const watchlist = await createWatchlist(formData);
      await addToWatchlist(watchlist.id);
      setCreating(false);
      setNewName("");
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
