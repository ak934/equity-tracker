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
import { updateStockStatus } from "@/app/actions/stocks";
import { TargetPriceInput } from "@/components/TargetPriceInput";
import { hasHitTargetPrice } from "@/lib/target-price";
import { RefreshButton } from "@/components/refresh-button";
import { RunAnalysisButton } from "@/components/run-analysis-button";

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

  const latestAnalyses = await prisma.analysis.findMany({
    where: { ticker: { in: stocks.map((s) => s.ticker) } },
    orderBy: [{ ticker: "asc" }, { date: "desc" }],
    distinct: ["ticker"],
  });
  const latestActionByTicker = new Map(
    latestAnalyses.map((a) => [a.ticker, a.action])
  );

  return (
    <main className="max-w-2xl mx-auto mt-16 px-4">
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
              <TableHead>Target Price</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>As of</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stocks.map((stock) => {
              const targetHit = hasHitTargetPrice({
                price: stock.lastPrice,
                targetPrice: stock.targetPrice,
              });
              const latestAction = latestActionByTicker.get(stock.ticker) ?? null;

              return (
                <TableRow key={stock.id} className={targetHit ? "bg-green-50" : ""}>
                  <TableCell className="font-medium">
                    <Link href={`/stocks/${stock.ticker}`} className="hover:underline">
                      {stock.ticker}
                    </Link>
                  </TableCell>
                  <TableCell>{stock.name}</TableCell>
                  <TableCell>
                    {latestAction ? (
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-medium capitalize ${
                          actionBadgeStyles[latestAction] ?? "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {latestAction}
                      </span>
                    ) : (
                      <RunAnalysisButton ticker={stock.ticker} />
                    )}
                  </TableCell>
                  <TableCell>
                    <TargetPriceInput stockId={stock.id} targetPrice={stock.targetPrice} />
                  </TableCell>
                  <TableCell>
                    {stock.lastPrice != null ? `$${stock.lastPrice.toFixed(2)}` : "—"}
                  </TableCell>
                  <TableCell>
                    {stock.priceAsOf ? stock.priceAsOf.toLocaleDateString() : "—"}
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
