import { revalidatePath } from "next/cache";
import { refreshPricesAndNotify } from "@/lib/refresh-prices";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { updated, failed, newTargetPriceHits } = await refreshPricesAndNotify();

  revalidatePath("/watchlist");
  revalidatePath("/watchlist/[id]", "page");
  revalidatePath("/alerts");

  return Response.json({
    success: true,
    updated: updated.length,
    failed: failed.length,
    newTargetPriceHits,
  });
}
