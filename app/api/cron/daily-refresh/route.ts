import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { refreshPricesAndNotify } from "@/lib/refresh-prices";
import { checkEarningsAndNews } from "@/lib/analysis";
import {
  findStaleAnalyses,
  computeReanalysisFlagUpdates,
  computeEarningsWatchReason,
  buildDigestEmailHtml,
} from "@/lib/digest";

const STALE_ANALYSIS_DAYS_THRESHOLD = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { stocksAfter, updated, failed, newTargetPriceHits } = await refreshPricesAndNotify();

  const latestAnalyses = await prisma.analysis.findMany({
    where: { ticker: { in: stocksAfter.map((s) => s.ticker) } },
    orderBy: [{ ticker: "asc" }, { date: "desc" }],
    distinct: ["ticker"],
  });
  const latestAnalysisDateByTicker = new Map(
    latestAnalyses.map((a) => [a.ticker, a.date])
  );

  const staleAnalyses = findStaleAnalyses(
    stocksAfter.map((s) => ({
      ticker: s.ticker,
      name: s.name,
      latestAnalysisDate: latestAnalysisDateByTicker.get(s.ticker) ?? null,
    })),
    STALE_ANALYSIS_DAYS_THRESHOLD
  );

  // sync needsReanalysis on every stock to match today's staleness check,
  // so it self-corrects once a fresh analysis is run (not just a one-way flip)
  const { newlyStale, toClear } = computeReanalysisFlagUpdates(
    stocksAfter.map((s) => ({
      ticker: s.ticker,
      needsReanalysis: s.needsReanalysis,
      reanalysisReason: s.reanalysisReason,
    })),
    staleAnalyses.map((s) => s.ticker)
  );

  if (newlyStale.length > 0) {
    await prisma.stock.updateMany({
      where: { ticker: { in: newlyStale } },
      data: { needsReanalysis: true, reanalysisReason: "stale" },
    });
  }

  if (toClear.length > 0) {
    await prisma.stock.updateMany({
      where: { ticker: { in: toClear } },
      data: { needsReanalysis: false, reanalysisReason: null },
    });
  }

  // Opt-in only (Stock.watchForEarnings), so this list stays small — each
  // entry is a real Claude + web-search call, run one at a time rather than
  // in parallel.
  const watchedStocks = await prisma.stock.findMany({ where: { watchForEarnings: true } });
  const toFlagByReason: Record<"earnings" | "news", string[]> = { earnings: [], news: [] };

  for (const stock of watchedStocks) {
    try {
      const latestForTicker = await prisma.analysis.findFirst({
        where: { clerkUserId: stock.clerkUserId, ticker: stock.ticker },
        orderBy: { date: "desc" },
      });

      const result = await checkEarningsAndNews(stock.ticker, latestForTicker?.date ?? null);
      const nextEarningsDate = result.nextEarningsDate ? new Date(result.nextEarningsDate) : null;

      await prisma.stock.update({
        where: { id: stock.id },
        data: { nextEarningsDate, earningsCheckedAt: new Date() },
      });

      const reason = computeEarningsWatchReason({
        ticker: stock.ticker,
        needsReanalysis: stock.needsReanalysis,
        nextEarningsDate,
        hasMaterialNews: result.hasMaterialNews,
      });
      if (reason) toFlagByReason[reason].push(stock.id);
    } catch (err) {
      // one ticker's lookup failing (bad search, transient API error)
      // shouldn't abort the rest of the watched list or the digest below
      console.error(`Earnings/news check failed for ${stock.ticker}:`, err);
    }
  }

  for (const reason of ["earnings", "news"] as const) {
    if (toFlagByReason[reason].length > 0) {
      await prisma.stock.updateMany({
        where: { id: { in: toFlagByReason[reason] } },
        data: { needsReanalysis: true, reanalysisReason: reason },
      });
    }
  }

  let digestSent = false;

  if (staleAnalyses.length > 0) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Equity Tracker <onboarding@resend.dev>",
      to: process.env.DIGEST_EMAIL_TO!,
      subject: "Equity Tracker Daily Digest",
      html: buildDigestEmailHtml(staleAnalyses),
    });
    digestSent = true;
  }

  return Response.json({
    success: true,
    updated: updated.length,
    failed: failed.length,
    newTargetPriceHits,
    staleAnalyses: staleAnalyses.length,
    digestSent,
  });
}
