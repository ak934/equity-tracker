import { auth } from "@clerk/nextjs/server";
import { getWatchlistRows } from "@/lib/watchlist-rows";
import { getUserTimezone } from "@/lib/user-timezone";
import { WatchlistStockTable } from "@/components/WatchlistStockTable";

export default async function AnalysesPage() {
  await auth.protect();

  const [rows, timeZone] = await Promise.all([getWatchlistRows({}), getUserTimezone()]);

  const analyzed = rows.filter((row) => row.latestAnalysis !== null);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analyses</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every stock you&apos;ve run an analysis on, with its latest take.
        </p>
      </div>

      {analyzed.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No analyses yet — run one from a stock&apos;s page to see it here.
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <WatchlistStockTable
            rows={analyzed}
            allWatchlists={[]}
            timeZone={timeZone}
            showManagementColumns={false}
          />
        </div>
      )}
    </main>
  );
}
