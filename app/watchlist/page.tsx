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
import { deleteWatchlist } from "@/app/actions/watchlists";

export default async function WatchlistIndexPage() {
  await auth.protect();

  const [watchlists, timeZone] = await Promise.all([
    prisma.watchlist.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { stocks: true } } },
    }),
    getUserTimezone(),
  ]);

  const unsorted = await getWatchlistRows({
    status: "watchlist",
    watchlists: { none: {} },
  });

  const allWatchlists = watchlists.map((w) => ({ id: w.id, name: w.name }));

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Watchlists</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize the companies you&apos;re considering by theme — sector, strategy,
            whatever groups them for you.
          </p>
        </div>
        <CreateWatchlistForm />
      </div>

      <div className="mt-4">
        <AddStockForm />
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
    </main>
  );
}
