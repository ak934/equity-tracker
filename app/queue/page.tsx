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
import { RunAnalysisButton } from "@/components/run-analysis-button";
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
    <main className="max-w-2xl mx-auto mt-16 px-4">
      <h1 className="text-2xl font-bold mb-6">Reanalysis Queue</h1>
      {stocks.length === 0 ? (
        <p className="text-neutral-500">Nothing needs attention right now.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticker</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Last Analysis</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stocks.map((stock) => {
              const tickerAnalyses = analysesByTicker.get(stock.ticker) ?? [];
              const latestAnalysis = tickerAnalyses[0] ?? null;

              return (
                <TableRow key={stock.id}>
                  <TableCell className="font-medium">
                    <Link href={`/stocks/${stock.ticker}`} className="hover:underline">
                      {stock.ticker}
                    </Link>
                  </TableCell>
                  <TableCell>{stock.name}</TableCell>
                  <TableCell>
                    {latestAnalysis
                      ? formatAnalysisDate(
                          latestAnalysis.date,
                          tickerAnalyses.map((a) => a.date),
                          timeZone
                        )
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    <RunAnalysisButton
                      ticker={stock.ticker}
                      navigateAfter={`/stocks/${stock.ticker}`}
                      initialAnalyzing={isAnalysisRunning(stock)}
                    />
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
