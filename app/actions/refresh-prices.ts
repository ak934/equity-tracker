"use server"

import { prisma } from "@/lib/prisma";
import { getPrice, getRecentTradingDate, toDateParam } from "@/lib/prices";
import { revalidatePath } from "next/cache";

export async function refreshPrices() {
    const stocks = await prisma.stock.findMany();
    const targetDate = toDateParam(getRecentTradingDate());
    const failed: string[] = [];
    for (const stock of stocks){
        // already priced for the latest trading day, skip the API call
        // entirely to avoid burning the API's per-minute rate limit
        if (stock.priceAsOf && toDateParam(stock.priceAsOf) === targetDate) {
            continue;
        }
        try {
            const { price, asOf } = await getPrice(stock.ticker);
            await prisma.stock.update({
                where: { id: stock.id },
                data: { lastPrice: price, priceAsOf: asOf }
            });
        } catch (err) {
            console.error(`Failed to refresh ${stock.ticker}:`, err);
            failed.push(stock.ticker);
        }
    }
    revalidatePath("/");
    return { failed };
}

