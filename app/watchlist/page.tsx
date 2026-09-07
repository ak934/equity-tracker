import Link from "next/link";
import { Trash2 } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getWatchlistRows } from "@/lib/watchlist-rows";
import { getUserTimezone } from "@/lib/user-timezone";
import { Button } from "@/components/ui/button";
import { CreateWatchlistForm } from "@/components/CreateWatchlistForm";
import { AddStockForm } from "@/components/AddStockForm";
import { WatchlistStockTable } from "@/components/WatchlistStockTable";
import { RecentlySearchedTable, type RecentSearchRow } from "@/components/RecentlySearchedTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deleteWatchlist } from "@/app/actions/watchlists";

const RECENT_SEARCH_LIMIT = 25;

export default async function WatchlistIndexPage() {
  const { userId } = await auth.protect();

  const [watchlists, timeZone, searchHistory] = await Promise.all([
    prisma.watchlist.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { stocks: true } } },
    }),
    getUserTimezone(),
    prisma.searchHistory.findMany({
      where: { clerkUserId: userId },
      orderBy: { searchedAt: "desc" },
      take: RECENT_SEARCH_LIMIT,
    }),
  ]);

  const unsorted = await getWatchlistRows({
    status: "watchlist",
    watchlists: { none: {} },
  });

  const allWatchlists = watchlists.map((w) => ({ id: w.id, name: w.name }));

  const matchingStocks = await prisma.stock.findMany({
    where: { ticker: { in: searchHistory.map((h) => h.ticker) } },
    include: { watchlists: { select: { id: true } } },
  });
  const stockByTicker = new Map(matchingStocks.map((s) => [s.ticker, s]));

  const recentRows: RecentSearchRow[] = searchHistory.map((h) => {
    const stock = stockByTicker.get(h.ticker);
    return {
      ticker: h.ticker,
      name: h.name,
      searchedAt: h.searchedAt,
      stockId: stock?.id ?? null,
      memberIds: stock?.watchlists.map((w) => w.id) ?? [],
    };
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">My Watchlists</h1>

      <Tabs defaultValue="watchlists" className="mt-6">
        <TabsList>
          <TabsTrigger value="watchlists">Watchlists</TabsTrigger>
          <TabsTrigger value="recent">Recently Searched</TabsTrigger>
        </TabsList>

        <TabsContent value="watchlists" className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1">
              <AddStockForm />
            </div>
            <CreateWatchlistForm />
          </div>

          {watchlists.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-border px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No watchlists yet — create one above to start organizing.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {watchlists.map((w) => (
                <div
                  key={w.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
                >
                  <Link href={`/watchlist/${w.id}`} className="flex-1">
                    <p className="font-medium">{w.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {w._count.stocks} stock{w._count.stocks === 1 ? "" : "s"}
                    </p>
                  </Link>
                  <form action={deleteWatchlist}>
                    <input type="hidden" name="id" value={w.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${w.name}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}

          {unsorted.length > 0 && (
            <div className="mt-10">
              <WatchlistStockTable rows={unsorted} allWatchlists={allWatchlists} timeZone={timeZone} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent" className="mt-4">
          {recentRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Tickers you look up in the search box will show up here.
              </p>
            </div>
          ) : (
            <RecentlySearchedTable rows={recentRows} allWatchlists={allWatchlists} timeZone={timeZone} />
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
