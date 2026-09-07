"use client";

import { useState, useTransition } from "react";
import {
  createWatchlist,
  moveStockToWatchlist,
  setStockWatchlistMembership,
} from "@/app/actions/watchlists";
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
// text, with a one-click "Move" control alongside it rather than the
// checkbox-toggle-per-list approach the table uses.
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
  const isMember = memberNames.length > 0;

  async function addToWatchlist(watchlistId: string) {
    const formData = new FormData();
    formData.set("stockId", stockId);
    formData.set("watchlistId", watchlistId);
    formData.set("member", "true");
    await setStockWatchlistMembership(formData);
  }

  async function moveToWatchlist(watchlistId: string) {
    const formData = new FormData();
    formData.set("stockId", stockId);
    formData.set("watchlistId", watchlistId);
    await moveStockToWatchlist(formData);
  }

  function addTo(watchlistId: string) {
    startTransition(() => addToWatchlist(watchlistId));
  }

  function moveTo(watchlistId: string) {
    startTransition(() => moveToWatchlist(watchlistId));
  }

  function createAndAssign() {
    const name = newName.trim();
    if (!name) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", name);
      const watchlist = await createWatchlist(formData);
      await (isMember ? moveToWatchlist(watchlist.id) : addToWatchlist(watchlist.id));
      setCreating(false);
      setNewName("");
    });
  }

  if (creating) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createAndAssign();
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

  if (isMember) {
    const moveTargets = allWatchlists.filter((w) => !memberIds.includes(w.id));
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Currently in your{" "}
          <span className="font-medium text-foreground">{memberNames.join(", ")}</span>{" "}
          watchlist{memberNames.length > 1 ? "s" : ""}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" disabled={isPending}>
              Move
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {moveTargets.map((watchlist) => (
              <DropdownMenuItem key={watchlist.id} onSelect={() => moveTo(watchlist.id)}>
                {watchlist.name}
              </DropdownMenuItem>
            ))}
            {moveTargets.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem onSelect={() => setCreating(true)}>
              + New watchlist
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
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
