import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight, LineChart } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AddStockForm } from "@/components/AddStockForm";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/refresh-button";
import { StockTable } from "@/components/StockTable";

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <LineChart className="size-7" />
        </span>
        <h1 className="mt-6 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          The app that tracks your finances and helps you make investment decisions.
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Follow the stocks you care about, get AI-backed buy/hold/avoid analysis, and get
          notified the moment a price hits your target.
        </p>
        <div className="mt-8">
          <SignUpButton>
            <Button size="lg" className="gap-2 px-6">
              Get Started
              <ArrowRight className="size-4" />
            </Button>
          </SignUpButton>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Already have an account?{" "}
          <SignInButton>
            <button type="button" className="font-medium text-primary hover:underline">
              Sign in
            </button>
          </SignInButton>
        </p>
      </main>
    );
  }

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