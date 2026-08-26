import Link from "next/link";
import { Trash2 } from "lucide-react";
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
import { RunAnalysisButton } from "@/components/run-analysis-button";
import { removeFromQueue } from "@/app/actions/stocks";
import { isAnalysisRunning } from "@/lib/analysis-status";
import { formatAnalysisDate } from "@/lib/format-analysis-date";
import { getUserTimezone } from "@/lib/user-timezone";

export default async function QueuePage() {
  await auth.protect();

  const [stocks, timeZone] = await Promise.all([
    prisma.stock.findMany({
      where: { needsReanalysis: true },
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

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Stocks You Want To Analyze</h1>
      {stocks.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">Nothing needs attention right now.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticker</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Last Analysis</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stocks.map((stock) => {
              const tickerAnalyses = analysesByTicker.get(stock.ticker) ?? [];
              const latestAnalysis = tickerAnalyses[0] ?? null;

              return (
                <TableRow key={stock.id}>
                  <TableCell className="font-medium">
                    <Link href={`/stocks/${stock.ticker}`} className="hover:text-primary">
                      {stock.ticker}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{stock.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {latestAnalysis
                      ? formatAnalysisDate(
                          latestAnalysis.date,
                          tickerAnalyses.map((a) => a.date),
                          timeZone
                        )
                      : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <RunAnalysisButton
                        ticker={stock.ticker}
                        navigateAfter={
                          stocks.length === 1 ? `/stocks/${stock.ticker}` : undefined
                        }
                        initialAnalyzing={isAnalysisRunning(stock)}
                      />
                      <form action={removeFromQueue}>
                        <input type="hidden" name="id" value={stock.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove ${stock.ticker} from queue`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </form>
                    </div>
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
