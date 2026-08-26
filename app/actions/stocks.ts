"use server";

import { prisma } from "@/lib/prisma";
import { searchTickers, TickerSearchError, type TickerSearchResult } from "@/lib/prices";
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

  revalidatePath("/watchlist");
  revalidatePath("/alerts");
  revalidatePath("/stocks/[ticker]", "page");
}
