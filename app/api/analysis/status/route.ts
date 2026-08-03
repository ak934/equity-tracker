import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { isAnalysisRunning } from "@/lib/analysis-status";

// A plain fetch() to this is immune to Next's RSC/router-level caching
// (unlike router.refresh(), which goes through the same client cache that's
// documented to reuse stale snapshots on browser back/forward navigation) —
// so this is the ground truth check the polling hook uses to decide whether
// it's safe to stop showing "Analyzing...".
export async function GET(request: Request) {
  await auth.protect();

  const ticker = new URL(request.url).searchParams.get("ticker");
  if (!ticker) {
    return new Response("ticker is required", { status: 400 });
  }

  const stock = await prisma.stock.findUnique({ where: { ticker } });
  return Response.json({ running: stock ? isAnalysisRunning(stock) : false });
}
