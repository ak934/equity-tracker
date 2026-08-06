import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge, actionBadgeVariant } from "@/components/ui/badge";
import { updateStockStatus, flagForReanalysis } from "@/app/actions/stocks";
import { RefreshButton } from "@/components/refresh-button";
import { RunAnalysisButton } from "@/components/run-analysis-button";
import { AnalyzingIndicator } from "@/components/analyzing-indicator";
import { isAnalysisRunning } from "@/lib/analysis-status";
import { formatAnalysisDate } from "@/lib/format-analysis-date";
import { getUserTimezone } from "@/lib/user-timezone";

export default async function WatchlistPage() {
  await auth.protect();

  const [stocks, timeZone] = await Promise.all([
    prisma.stock.findMany({
      where: { status: "watchlist" },
      orderBy: { ticker: "asc" },
    }),
    getUserTimezone(),
  ]);

  const analyses = await prisma.analysis.findMany({
    where: { ticker: { in: stocks.map((s) => s.ticker) } },
    orderBy: [{ ticker: "asc" }, { date: "desc" }],
  });
  const analysesByTicker = new Map<string, typeof analyses>();
  for (const a of analyses) {
    analysesByTicker.set(a.ticker, [...(analysesByTicker.get(a.ticker) ?? []), a]);
  }
  const latestAnalysisByTicker = new Map(
    [...analysesByTicker].map(([ticker, list]) => [ticker, list[0]])
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Watchlist</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stocks you&apos;re following but haven&apos;t added to your dashboard.
          </p>
        </div>
        {stocks.length > 0 && <RefreshButton />}
      </div>
      {stocks.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">No stocks in your watchlist yet.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticker</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>As of</TableHead>
              <TableHead>Last Analyzed</TableHead>
              <TableHead>Q-Score</TableHead>
              <TableHead>V-Score</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stocks.map((stock) => {
              const latestAnalysis = latestAnalysisByTicker.get(stock.ticker) ?? null;

              return (
                <TableRow key={stock.id}>
                  <TableCell className="font-medium">
                    <Link href={`/stocks/${stock.ticker}`} className="hover:text-primary">
                      {stock.ticker}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{stock.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      {latestAnalysis ? (
                        <Badge variant={actionBadgeVariant(latestAnalysis.action)}>
                          {latestAnalysis.action}
                        </Badge>
                      ) : (
                        <RunAnalysisButton
                          ticker={stock.ticker}
                          initialAnalyzing={isAnalysisRunning(stock)}
                        />
                      )}
                      {latestAnalysis &&
                        (stock.needsReanalysis ? (
                          isAnalysisRunning(stock) ? (
                            <AnalyzingIndicator ticker={stock.ticker} />
                          ) : (
                            <span className="text-xs text-warning">Flagged for reanalysis</span>
                          )
                        ) : (
                          <form action={flagForReanalysis}>
                            <input type="hidden" name="id" value={stock.id} />
                            <Button type="submit" variant="outline" size="sm">
                              Flag for Reanalysis
                            </Button>
                          </form>
                        ))}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">
                    {stock.lastPrice != null ? `$${stock.lastPrice.toFixed(2)}` : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {stock.priceAsOf ? stock.priceAsOf.toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    {latestAnalysis ? (
                      <Link
                        href={`/stocks/${stock.ticker}`}
                        className="text-sm text-muted-foreground hover:text-primary"
                      >
                        {formatAnalysisDate(
                          latestAnalysis.date,
                          (analysesByTicker.get(stock.ticker) ?? []).map((a) => a.date),
                          timeZone
                        )}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">
                    {latestAnalysis ? `${latestAnalysis.qualityScore}/100` : "—"}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">
                    {latestAnalysis ? `${latestAnalysis.valuationScore}/100` : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <form action={updateStockStatus}>
                      <input type="hidden" name="id" value={stock.id} />
                      <input type="hidden" name="status" value="portfolio" />
                      <Button type="submit" variant="secondary" size="sm">
                        Remove from Watchlist
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </div>
      )}
    </main>
  );
}
