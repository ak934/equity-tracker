"use server"

import { prisma } from "@/lib/prisma";
import { refreshAllPrices } from "@/lib/prices";
import { findNewTargetPriceHits } from "@/lib/alerts";
import { sendTargetPriceHitEmail } from "@/lib/notifications";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

export async function refreshPrices() {
    await auth.protect();

    const stocksBefore = await prisma.stock.findMany();
    const { failed } = await refreshAllPrices();
    const stocksAfter = await prisma.stock.findMany();

    const newHits = findNewTargetPriceHits(
        stocksBefore.map((s) => ({ ticker: s.ticker, name: s.name, price: s.lastPrice, targetPrice: s.targetPrice })),
        stocksAfter.map((s) => ({ ticker: s.ticker, name: s.name, price: s.lastPrice, targetPrice: s.targetPrice }))
    );
    await sendTargetPriceHitEmail(newHits);

    revalidatePath("/watchlist");
    revalidatePath("/watchlist/[id]", "page");
    revalidatePath("/alerts");
    return { failed };
}

