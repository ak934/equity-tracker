"use server"

import { prisma } from "@/lib/prisma";
import { getPrice } from "@/lib/prices";
import { revalidatePath } from "next/cache";

export async function refreshPrices() {
    const stocks = await prisma.stock.findMany();
    const failed: string[] = [];
    for (const stock of stocks){
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

