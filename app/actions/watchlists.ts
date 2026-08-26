"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPrice } from "@/lib/prices";

export async function createWatchlist(formData: FormData) {
  await auth.protect();
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    throw new Error("Watchlist name is required");
  }

  await prisma.watchlist.create({ data: { name } });

  revalidatePath("/watchlist");
}

export async function renameWatchlist(formData: FormData) {
  await auth.protect();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!id || !name) {
    throw new Error("Watchlist id and name are required");
  }

  await prisma.watchlist.update({ where: { id }, data: { name } });

  revalidatePath("/watchlist");
  revalidatePath("/watchlist/[id]", "page");
}

export async function deleteWatchlist(formData: FormData) {
  await auth.protect();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    throw new Error("Watchlist id is required");
  }

  // Deleting only removes this category — the join rows are cascaded, but
  // the stocks themselves stay in "watchlist" status, falling back to
  // Unsorted rather than disappearing.
  await prisma.watchlist.delete({ where: { id } });

  revalidatePath("/watchlist");
  redirect("/watchlist");
}

// Adds an existing or brand-new stock straight into a specific watchlist —
// upserts by ticker so re-adding an already-tracked ticker just connects
// it rather than erroring.
export async function addStockToWatchlist(formData: FormData) {
  await auth.protect();
  const watchlistId = String(formData.get("watchlistId") ?? "");
  const ticker = String(formData.get("ticker") ?? "").trim().toUpperCase();
  const name = String(formData.get("name") ?? "").trim();

  if (!watchlistId || !ticker || !name) {
    throw new Error("Watchlist, ticker, and name are required");
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
    create: {
      ticker,
      name,
      status: "watchlist",
      lastPrice,
      priceAsOf,
      watchlists: { connect: { id: watchlistId } },
    },
    update: {
      name,
      status: "watchlist",
      watchlists: { connect: { id: watchlistId } },
    },
  });

  revalidatePath("/watchlist");
  revalidatePath("/watchlist/[id]", "page");
}

export async function setStockWatchlistMembership(formData: FormData) {
  await auth.protect();
  const stockId = String(formData.get("stockId") ?? "");
  const watchlistId = String(formData.get("watchlistId") ?? "");
  const member = String(formData.get("member") ?? "") === "true";

  if (!stockId || !watchlistId) {
    throw new Error("Stock id and watchlist id are required");
  }

  await prisma.stock.update({
    where: { id: stockId },
    data: {
      status: "watchlist",
      watchlists: member
        ? { connect: { id: watchlistId } }
        : { disconnect: { id: watchlistId } },
    },
  });

  revalidatePath("/watchlist");
  revalidatePath("/watchlist/[id]", "page");
}
