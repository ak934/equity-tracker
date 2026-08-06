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

  if (stocks.length === 0) {
    return (
      <main className="mx-auto mt-20 max-w-lg px-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          What stocks do you want to look at today?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Search a ticker or company name to start tracking it.
        </p>
        <div className="mt-6">
          <AddStockForm />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">All Stocks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {stocks.length} stock{stocks.length === 1 ? "" : "s"} on your dashboard
          </p>
        </div>
        <RefreshButton />
      </div>
      <div className="mt-6">
        <AddStockForm />
      </div>
      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <StockTable stocks={stocks} />
      </div>
    </main>
  );
}