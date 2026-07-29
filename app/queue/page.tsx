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

export default async function QueuePage() {
  await auth.protect();

  const stocks = await prisma.stock.findMany({
    where: { needsReanalysis: true },
    orderBy: { ticker: "asc" },
  });

  const latestAnalyses = await prisma.analysis.findMany({
    where: { ticker: { in: stocks.map((s) => s.ticker) } },
    orderBy: [{ ticker: "asc" }, { date: "desc" }],
    distinct: ["ticker"],
  });
  const latestAnalysisDateByTicker = new Map(
    latestAnalyses.map((a) => [a.ticker, a.date])
  );

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
              const latestAnalysisDate = latestAnalysisDateByTicker.get(stock.ticker) ?? null;

              return (
                <TableRow key={stock.id}>
                  <TableCell className="font-medium">
                    <Link href={`/stocks/${stock.ticker}`} className="hover:underline">
                      {stock.ticker}
                    </Link>
                  </TableCell>
                  <TableCell>{stock.name}</TableCell>
                  <TableCell>
                    {latestAnalysisDate ? latestAnalysisDate.toLocaleDateString() : "Never"}
                  </TableCell>
                  <TableCell>
                    <RunAnalysisButton ticker={stock.ticker} />
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
