import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { isAnalysisRunning } from "@/lib/analysis-status";

// Ground truth for "which tickers are currently being analyzed," queried by
// the global notifier so it can watch runs regardless of which page (if
// any) the user is on. Small, infrequent read — the table only ever holds
// as many in-flight rows as there are concurrent analysis runs.
export async function GET() {
  await auth.protect();

  const running = await prisma.stock.findMany({
    where: { analysisRunning: true },
    select: { ticker: true, analysisRunning: true, analysisStartedAt: true },
  });

  return Response.json({
    tickers: running.filter(isAnalysisRunning).map((s) => s.ticker),
  });
}
