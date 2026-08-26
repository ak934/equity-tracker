import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAnalysis } from "@/lib/analysis";
import { isAnalysisRunning } from "@/lib/analysis-status";

function revalidateAll(ticker: string) {
  revalidatePath(`/stocks/${ticker}`);
  revalidatePath("/");
  revalidatePath("/watchlist");
  revalidatePath("/watchlist/[id]", "page");
  revalidatePath("/queue");
}

// Plain Route Handler instead of a Server Action: Next.js dispatches Server
// Actions one at a time per client, so a slow one (this calls out to Claude
// with web search, which can take a minute) blocks any Link navigation the
// user tries in the meantime. A fetch() to a Route Handler isn't part of
// that queue, so the rest of the app stays interactive while this runs.
export async function POST(request: Request) {
  const { userId } = await auth.protect();

  const { ticker, frameworkId } = await request.json();
  if (typeof ticker !== "string" || !ticker) {
    return new Response("ticker is required", { status: 400 });
  }

  const stock = await prisma.stock.findUnique({ where: { ticker } });
  if (stock && isAnalysisRunning(stock)) {
    return new Response("An analysis is already running for this ticker", { status: 409 });
  }

  // Scoped to the requesting user so one user can't run another's
  // framework by guessing an id.
  const framework =
    typeof frameworkId === "string" && frameworkId
      ? await prisma.analysisFramework.findFirst({ where: { id: frameworkId, clerkUserId: userId } })
      : null;

  // marked durably in the DB, not just in the browser's component state, so
  // that leaving the page (or closing the tab) doesn't lose track of the run
  // still in flight server-side — the UI can pick this back up on any later
  // page load instead of looking like the analysis silently stopped.
  // analysisStartedAt lets isAnalysisRunning recognize a flag left behind by
  // a process that died mid-run (dev server restart, deploy, crash) as
  // stale, since nothing else could ever clear it in that case.
  await prisma.stock.updateMany({
    where: { ticker },
    data: { analysisRunning: true, analysisStartedAt: new Date() },
  });

  revalidateAll(ticker);

  // Respond as soon as analysisRunning is durably persisted, instead of
  // after the full 60-90s generateAnalysis call. The caller awaits this
  // response before navigating, so by the time any page (including the one
  // it navigates to) reads the stock row, it's guaranteed to see
  // analysisRunning: true rather than racing the DB write below.
  after(async () => {
    try {
      const result = await generateAnalysis(
        ticker,
        stock?.lastPrice ?? null,
        framework ? { name: framework.name, instructions: framework.instructions } : null
      );

      await prisma.analysis.create({
        data: {
          ticker,
          qualityScore: result.qualityScore,
          valuationScore: result.valuationScore,
          action: result.action,
          fullText: result.fullText,
          frameworkName: framework?.name ?? "Buffett",
        },
      });

      // a fresh analysis just ran, so whatever flagged this stock (manual or
      // stale) is resolved
      await prisma.stock.updateMany({
        where: { ticker },
        data: {
          needsReanalysis: false,
          reanalysisReason: null,
          analysisRunning: false,
          analysisStartedAt: null,
        },
      });

      revalidateAll(ticker);
    } catch {
      await prisma.stock.updateMany({
        where: { ticker },
        data: { analysisRunning: false, analysisStartedAt: null },
      });
      revalidateAll(ticker);
    }
  });

  return Response.json({ ok: true, started: true });
}
