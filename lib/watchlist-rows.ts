import { prisma } from "@/lib/prisma";
import type { Prisma, Stock, Analysis } from "@/generated/prisma/client";

export type WatchlistRow = {
  stock: Stock;
  latestAnalysis: Analysis | null;
  analysisDates: Date[];
  watchlistIds: string[];
};

// Shared by the Unsorted section and each watchlist detail page — both
// need the same stock + latest-analysis + list-membership shape, just
// filtered differently.
export async function getWatchlistRows(
  where: Prisma.StockWhereInput
): Promise<WatchlistRow[]> {
  const stocks = await prisma.stock.findMany({
    where,
    orderBy: { ticker: "asc" },
    include: { watchlists: { select: { id: true } } },
  });

  const analyses = await prisma.analysis.findMany({
    where: { ticker: { in: stocks.map((s) => s.ticker) } },
    orderBy: [{ ticker: "asc" }, { date: "desc" }],
  });
  const analysesByTicker = new Map<string, Analysis[]>();
  for (const a of analyses) {
    analysesByTicker.set(a.ticker, [...(analysesByTicker.get(a.ticker) ?? []), a]);
  }

  return stocks.map((stock) => {
    const tickerAnalyses = analysesByTicker.get(stock.ticker) ?? [];
    return {
      stock,
      latestAnalysis: tickerAnalyses[0] ?? null,
      analysisDates: tickerAnalyses.map((a) => a.date),
      watchlistIds: stock.watchlists.map((w) => w.id),
    };
  });
}
