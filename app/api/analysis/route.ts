import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateAnalysis } from "@/lib/analysis";

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

  try {
    const stock = await prisma.stock.findUnique({ where: { ticker } });
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
      data: { needsReanalysis: false, reanalysisReason: null },
    });

    revalidatePath(`/stocks/${ticker}`);
    revalidatePath("/");
    revalidatePath("/watchlist");

    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    return new Response(message, { status: 500 });
  }
}
