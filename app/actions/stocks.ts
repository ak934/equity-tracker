"use server";

import { prisma } from "@/lib/prisma";
import { getPrice } from "@/lib/prices";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

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

  await prisma.stock.create({
    data: { ticker, name, status: "watchlist", lastPrice, priceAsOf },
  });

  revalidatePath("/");
}

export async function deleteStock(formData: FormData) {
  await auth.protect();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    throw new Error("Stock id is required");
  }

  await prisma.stock.delete({ where: { id } });

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
    data: { status },
  });

  revalidatePath("/");
}

import { generateAnalysis } from "@/lib/analysis";

export async function runAnalysis(ticker: string) {
  await auth.protect();
  const stock = await prisma.stock.findUnique({ where: { ticker } });

  const result = await generateAnalysis(ticker, stock?.lastPrice ?? null);

  await prisma.analysis.create({
    data: {
      ticker,
      qualityScore: result.qualityScore,
      valuationScore: result.valuationScore,
      action: result.action,
      fullText: result.fullText,
    },
  });

  revalidatePath(`/stocks/${ticker}`);
}