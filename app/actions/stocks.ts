"use server";

import { prisma } from "@/lib/prisma";
import { searchTickers, TickerSearchError, type TickerSearchResult } from "@/lib/prices";
import { getLogoAvailability } from "@/lib/logos";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

export type TickerSearchResponse = {
  results: (TickerSearchResult & { hasLogo: boolean })[];
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
    // Only reads whatever's already cached — a ticker searched for the
    // first time ever shows the fallback badge here and picks up its logo
    // on a later search once lib/logos.ts has resolved it in the background.
    const availability = await getLogoAvailability(results.map((r) => r.ticker));
    return {
      results: results.map((r) => ({ ...r, hasLogo: availability.get(r.ticker) ?? false })),
      rateLimited: false,
    };
  } catch (err) {
    const rateLimited = err instanceof TickerSearchError && err.status === 429;
    if (!rateLimited) {
      console.error(`Ticker search failed for "${trimmed}":`, err);
    }
    return { results: [], rateLimited };
  }
}

export async function logTickerSearch(ticker: string, name: string) {
  const { userId } = await auth.protect();
  const trimmedTicker = ticker.trim().toUpperCase();
  const trimmedName = name.trim();

  if (!trimmedTicker) return;

  await prisma.searchHistory.upsert({
    where: { clerkUserId_ticker: { clerkUserId: userId, ticker: trimmedTicker } },
    create: { clerkUserId: userId, ticker: trimmedTicker, name: trimmedName },
    update: { name: trimmedName, searchedAt: new Date() },
  });

  // Kicks off the (cached, once-ever) logo lookup for this ticker in case
  // it wasn't already resolved from being shown in the search dropdown.
  await getLogoAvailability([trimmedTicker]);

  revalidatePath("/watchlist");
}

export async function removeFromQueue(formData: FormData) {
  const { userId } = await auth.protect();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    throw new Error("Stock id is required");
  }

  await prisma.stock.updateMany({
    where: { id, clerkUserId: userId },
    data: { needsReanalysis: false, reanalysisReason: null },
  });

  revalidatePath("/watchlist");
  revalidatePath("/queue");
}

// Removes a ticker from the user's tracking entirely — the Stock row (if
// one was ever created) and its SearchHistory row, so it doesn't reappear
// under Recently Searched.
async function purgeTicker(userId: string, ticker: string) {
  await prisma.$transaction([
    prisma.stock.deleteMany({ where: { clerkUserId: userId, ticker } }),
    prisma.searchHistory.deleteMany({ where: { clerkUserId: userId, ticker } }),
  ]);

  revalidatePath("/watchlist");
  revalidatePath("/watchlist/[id]", "page");
  revalidatePath("/analyses");
  revalidatePath("/queue");
}

// Fully removes a stock from the user's tracking — not just its watchlist
// membership.
export async function deleteStock(formData: FormData) {
  const { userId } = await auth.protect();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    throw new Error("Stock id is required");
  }

  const stock = await prisma.stock.findFirst({ where: { id, clerkUserId: userId } });
  if (!stock) {
    throw new Error("Stock not found");
  }

  await purgeTicker(userId, stock.ticker);
}

// Removes a Recently Searched row — covers both a ticker that was only ever
// looked up (no Stock row exists yet) and one that was also added to a
// watchlist/Unsorted.
export async function deleteRecentSearch(formData: FormData) {
  const { userId } = await auth.protect();
  const ticker = String(formData.get("ticker") ?? "").trim().toUpperCase();

  if (!ticker) {
    throw new Error("Ticker is required");
  }

  await purgeTicker(userId, ticker);
}

export async function setTargetPrice(formData: FormData) {
  const { userId } = await auth.protect();
  const id = String(formData.get("id") ?? "");
  const targetPriceRaw = String(formData.get("targetPrice") ?? "").trim();

  if (!id) {
    throw new Error("Stock id is required");
  }

  const targetPrice = targetPriceRaw ? Number(targetPriceRaw) : null;
  if (targetPriceRaw && Number.isNaN(targetPrice)) {
    throw new Error("Target price must be a number");
  }

  await prisma.stock.updateMany({
    where: { id, clerkUserId: userId },
    data: { targetPrice },
  });

  revalidatePath("/watchlist");
  revalidatePath("/alerts");
  revalidatePath("/stocks/[ticker]", "page");
}
