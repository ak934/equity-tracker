import { prisma } from "@/lib/prisma";
import { refreshAllPrices } from "@/lib/prices";
import { findNewTargetPriceHits } from "@/lib/alerts";
import { sendTargetPriceHitEmail } from "@/lib/notifications";
import type { Stock } from "@/generated/prisma/client";

export type RefreshPricesResult = {
  stocksAfter: Stock[];
  updated: Stock[];
  failed: string[];
  newTargetPriceHits: number;
};

// Shared by every price-refresh entry point (cron jobs) so the
// before/after target-price-hit diffing and email dispatch lives in one
// place instead of being copy-pasted at each call site.
export async function refreshPricesAndNotify(): Promise<RefreshPricesResult> {
  const stocksBefore = await prisma.stock.findMany();
  const { updated, failed } = await refreshAllPrices();
  const stocksAfter = await prisma.stock.findMany();

  const newHits = findNewTargetPriceHits(
    stocksBefore.map((s) => ({ ticker: s.ticker, name: s.name, price: s.lastPrice, targetPrice: s.targetPrice })),
    stocksAfter.map((s) => ({ ticker: s.ticker, name: s.name, price: s.lastPrice, targetPrice: s.targetPrice }))
  );
  await sendTargetPriceHitEmail(newHits);

  return { stocksAfter, updated, failed, newTargetPriceHits: newHits.length };
}
