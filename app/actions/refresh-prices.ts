"use server"

import { refreshAllPrices } from "@/lib/prices";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

export async function refreshPrices() {
    await auth.protect();
    const { failed } = await refreshAllPrices();
    revalidatePath("/");
    revalidatePath("/watchlist");
    return { failed };
}

