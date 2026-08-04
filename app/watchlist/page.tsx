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
import { updateStockStatus, flagForReanalysis } from "@/app/actions/stocks";
import { RefreshButton } from "@/components/refresh-button";
import { RunAnalysisButton } from "@/components/run-analysis-button";
import { AnalyzingIndicator } from "@/components/analyzing-indicator";
import { isAnalysisRunning } from "@/lib/analysis-status";
import { formatAnalysisDate } from "@/lib/format-analysis-date";

const actionBadgeStyles: Record<string, string> = {
  buy: "bg-green-100 text-green-800",
  hold: "bg-amber-100 text-amber-800",
  avoid: "bg-red-100 text-red-800",
};

export default async function WatchlistPage() {
  await auth.protect();

  const stocks = await prisma.stock.findMany({
    where: { status: "watchlist" },
    orderBy: { ticker: "asc" },
  });

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
    <main className="max-w-5xl mx-auto mt-16 px-4">
      <h1 className="text-2xl font-bold mb-6">Watchlist</h1>
      {stocks.length > 0 && (
        <div className="mb-4">
          <RefreshButton />
        </div>
      )}
      {stocks.length === 0 ? (
        <p className="text-neutral-500">No stocks in your watchlist yet.</p>
      ) : (
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
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stocks.map((stock) => {
              const latestAnalysis = latestAnalysisByTicker.get(stock.ticker) ?? null;

              return (
                <TableRow key={stock.id}>
                  <TableCell className="font-medium">
                    <Link href={`/stocks/${stock.ticker}`} className="hover:underline">
                      {stock.ticker}
                    </Link>
                  </TableCell>
                  <TableCell>{stock.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      {latestAnalysis ? (
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs font-medium capitalize ${
                            actionBadgeStyles[latestAnalysis.action] ?? "bg-neutral-100 text-neutral-600"
                          }`}
                        >
                          {latestAnalysis.action}
                        </span>
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
                            <span className="text-xs text-amber-600">Flagged for reanalysis</span>
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
                  <TableCell>
                    {stock.lastPrice != null ? `$${stock.lastPrice.toFixed(2)}` : "—"}
                  </TableCell>
                  <TableCell>
                    {stock.priceAsOf ? stock.priceAsOf.toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    {latestAnalysis ? (
                      <Link
                        href={`/stocks/${stock.ticker}`}
                        className="text-sm hover:underline"
                      >
                        {formatAnalysisDate(
                          latestAnalysis.date,
                          (analysesByTicker.get(stock.ticker) ?? []).map((a) => a.date)
                        )}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {latestAnalysis ? `${latestAnalysis.qualityScore}/100` : "—"}
                  </TableCell>
                  <TableCell>
                    {latestAnalysis ? `${latestAnalysis.valuationScore}/100` : "—"}
                  </TableCell>
                  <TableCell>
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
      )}
    </main>
  );
}
