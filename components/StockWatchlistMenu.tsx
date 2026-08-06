"use client";

import { ListPlus } from "lucide-react";
import { useTransition } from "react";
import { setStockWatchlistMembership } from "@/app/actions/watchlists";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function StockWatchlistMenu({
  stockId,
  allWatchlists,
  memberIds,
}: {
  stockId: string;
  allWatchlists: { id: string; name: string }[];
  memberIds: string[];
}) {
  const [isPending, startTransition] = useTransition();

  function toggle(watchlistId: string, member: boolean) {
    const formData = new FormData();
    formData.set("stockId", stockId);
    formData.set("watchlistId", watchlistId);
    formData.set("member", String(member));
    startTransition(async () => {
      await setStockWatchlistMembership(formData);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isPending} className="gap-1.5">
          <ListPlus className="size-3.5" />
          Lists{memberIds.length > 0 ? ` (${memberIds.length})` : ""}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Add to watchlist</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {allWatchlists.length === 0 ? (
          <p className="px-2 py-1.5 text-sm text-muted-foreground">
            No watchlists yet — create one first.
          </p>
        ) : (
          allWatchlists.map((watchlist) => (
            <DropdownMenuCheckboxItem
              key={watchlist.id}
              checked={memberIds.includes(watchlist.id)}
              onCheckedChange={(checked) => toggle(watchlist.id, checked === true)}
              onSelect={(e) => e.preventDefault()}
            >
              {watchlist.name}
            </DropdownMenuCheckboxItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
