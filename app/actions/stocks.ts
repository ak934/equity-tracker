"use server";

import { prisma } from "@/lib/prisma";
import { getPrice, searchTickers, TickerSearchError, type TickerSearchResult } from "@/lib/prices";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

export type TickerSearchResponse = {
  results: TickerSearchResult[];
  rateLimited: boolean;
};

export async function searchStockTickers(query: string): Promise<TickerSearchResponse> {
  await auth.protect();
  const trimmed = query.trim();

  if (!trimmed) {
    return { results: [], rateLimited: false };
  }

  try {
    const results = await searchTickers(trimmed);
    return { results, rateLimited: false };
  } catch (err) {
    const rateLimited = err instanceof TickerSearchError && err.status === 429;
    if (!rateLimited) {
      console.error(`Ticker search failed for "${trimmed}":`, err);
    }
    return { results: [], rateLimited };
  }
}

export async function addStock(formData: FormData) {
  await auth.protect();
  const ticker = String(formData.get("ticker") ?? "").trim().toUpperCase();
  const name = String(formData.get("name") ?? "").trim();

  if (!ticker || !name) {
    throw new Error("Ticker and name are required");
  }

  let lastPrice: number | null = null;
  let priceAsOf: Date | null = null;
  try {
    const price = await getPrice(ticker);
    lastPrice = price.price;
    priceAsOf = price.asOf;
  } catch (err) {
    console.error(`Failed to fetch initial price for ${ticker}:`, err);
  }

  await prisma.stock.upsert({
    where: { ticker },
    create: { ticker, name, status: "portfolio", lastPrice, priceAsOf },
    update: { name, status: "portfolio", hiddenFromDashboard: false, lastPrice, priceAsOf },
  });

  revalidatePath("/");
}

export async function deleteStock(formData: FormData) {
  await auth.protect();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    throw new Error("Stock id is required");
  }

  const stock = await prisma.stock.findUnique({ where: { id } });

  // stocks on the watchlist stay visible there even after being
  // "deleted" from the dashboard, so hide instead of hard-deleting
  if (stock?.status === "watchlist") {
    await prisma.stock.update({
      where: { id },
      data: { hiddenFromDashboard: true },
    });
  } else {
    await prisma.stock.delete({ where: { id } });
  }

  revalidatePath("/");
}

export async function updateStockStatus(formData: FormData) {
  await auth.protect();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "").trim();

  if (!id || !status) {
    throw new Error("Stock id and status are required");
  }

  await prisma.stock.update({
    where: { id },
    // leaving the watchlist restores dashboard visibility, since a stock
    // hidden from the dashboard would otherwise become unreachable
    data: { status, hiddenFromDashboard: status === "watchlist" ? undefined : false },
  });

  revalidatePath("/");
  revalidatePath("/watchlist");
}

export async function flagForReanalysis(formData: FormData) {
  await auth.protect();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    throw new Error("Stock id is required");
  }

  await prisma.stock.update({
    where: { id },
    data: { needsReanalysis: true, reanalysisReason: "manual" },
  });

  revalidatePath("/");
  revalidatePath("/watchlist");
}

export async function setTargetPrice(formData: FormData) {
  await auth.protect();
  const id = String(formData.get("id") ?? "");
  const targetPriceRaw = String(formData.get("targetPrice") ?? "").trim();

  if (!id) {
    throw new Error("Stock id is required");
  }

  const targetPrice = targetPriceRaw ? Number(targetPriceRaw) : null;
  if (targetPriceRaw && Number.isNaN(targetPrice)) {
    throw new Error("Target price must be a number");
  }

  await prisma.stock.update({
    where: { id },
    data: { targetPrice },
  });

  revalidatePath("/");
  revalidatePath("/watchlist");
  revalidatePath("/alerts");
  revalidatePath("/stocks/[ticker]", "page");
}
