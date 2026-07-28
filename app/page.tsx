import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { AddStockForm } from "@/components/AddStockForm";
import { RefreshButton } from "@/components/refresh-button";
import { StockTable } from "@/components/StockTable";

export default async function Home() {
  await auth.protect();

  const stocks = await prisma.stock.findMany({
    where: { hiddenFromDashboard: false },
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

  if (stocks.length === 0) {
    return (
      <main className="max-w-2xl mx-auto mt-16 px-4 text-center">
        <h1 className="text-2xl font-bold mb-6">
          What stocks do you want to look at today?
        </h1>
        <AddStockForm />
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto mt-16 px-4">
      <h1 className="text-2xl font-bold mb-6">All Stocks</h1>
      <AddStockForm />
      <div className="mb-4">
        <RefreshButton />
      </div>
      <StockTable stocks={stocks} latestActionByTicker={latestActionByTicker} />
    </main>
  );
}