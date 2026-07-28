import { refreshAllPrices } from "@/lib/prices";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { updated, failed } = await refreshAllPrices();

  return Response.json({
    success: true,
    updated: updated.length,
    failed: failed.length,
  });
}
