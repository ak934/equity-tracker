import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateAnalysis } from "@/lib/analysis";
import { isAnalysisRunning } from "@/lib/analysis-status";

function revalidateAll(ticker: string) {
  revalidatePath(`/stocks/${ticker}`);
  revalidatePath("/");
  revalidatePath("/watchlist");
  revalidatePath("/queue");
}

// Plain Route Handler instead of a Server Action: Next.js dispatches Server
// Actions one at a time per client, so a slow one (this calls out to Claude
// with web search, which can take a minute) blocks any Link navigation the
// user tries in the meantime. A fetch() to a Route Handler isn't part of
// that queue, so the rest of the app stays interactive while this runs.
export async function POST(request: Request) {
  await auth.protect();

  const { ticker } = await request.json();
  if (typeof ticker !== "string" || !ticker) {
    return new Response("ticker is required", { status: 400 });
  }

  const stock = await prisma.stock.findUnique({ where: { ticker } });
  if (stock && isAnalysisRunning(stock)) {
    return new Response("An analysis is already running for this ticker", { status: 409 });
  }

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

  try {
    revalidateAll(ticker);

    const result = await generateAnalysis(ticker, stock?.lastPrice ?? null);

    await prisma.analysis.create({
      data: {
        ticker,
        qualityScore: result.qualityScore,
        valuationScore: result.valuationScore,
        action: result.action,
        fullText: result.fullText,
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

    return Response.json({ ok: true });
  } catch (err) {
    await prisma.stock.updateMany({
      where: { ticker },
      data: { analysisRunning: false, analysisStartedAt: null },
    });
    revalidateAll(ticker);

    const message = err instanceof Error ? err.message : "Analysis failed";
    return new Response(message, { status: 500 });
  }
}
