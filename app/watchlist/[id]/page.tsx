import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getWatchlistRows } from "@/lib/watchlist-rows";
import { getUserTimezone } from "@/lib/user-timezone";
import { Button } from "@/components/ui/button";
import { WatchlistNameEditor } from "@/components/WatchlistNameEditor";
import { AddStockToWatchlistForm } from "@/components/AddStockToWatchlistForm";
import { WatchlistStockTable } from "@/components/WatchlistStockTable";
import { RefreshButton } from "@/components/refresh-button";
import { deleteWatchlist } from "@/app/actions/watchlists";

export default async function WatchlistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await auth.protect();

  const { id } = await params;

  const [watchlist, allWatchlistsRaw, timeZone] = await Promise.all([
    prisma.watchlist.findUnique({ where: { id } }),
    prisma.watchlist.findMany({ select: { id: true, name: true }, orderBy: { createdAt: "asc" } }),
    getUserTimezone(),
  ]);

  if (!watchlist) {
    notFound();
  }

  const rows = await getWatchlistRows({ status: "watchlist", watchlists: { some: { id } } });

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <WatchlistNameEditor id={watchlist.id} name={watchlist.name} />
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} stock{rows.length === 1 ? "" : "s"} · created{" "}
            {watchlist.createdAt.toLocaleDateString()}
          </p>
        </div>
        <form action={deleteWatchlist}>
          <input type="hidden" name="id" value={watchlist.id} />
          <Button type="submit" variant="destructive" size="sm">
            Delete Watchlist
          </Button>
        </form>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <AddStockToWatchlistForm watchlistId={watchlist.id} />
        {rows.length > 0 && <RefreshButton />}
      </div>

      {rows.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No stocks in this watchlist yet — search above to add one.
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <WatchlistStockTable
            rows={rows}
            allWatchlists={allWatchlistsRaw}
            timeZone={timeZone}
            showManagementColumns={false}
          />
        </div>
      )}
    </main>
  );
}
