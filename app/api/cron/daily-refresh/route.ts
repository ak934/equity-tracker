import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { refreshAllPrices } from "@/lib/prices";
import {
  findNewTargetPriceHits,
  findStaleAnalyses,
  computeReanalysisFlagUpdates,
  buildDigestEmailHtml,
} from "@/lib/digest";

const STALE_ANALYSIS_DAYS_THRESHOLD = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const stocksBefore = await prisma.stock.findMany();

  const { updated, failed } = await refreshAllPrices();

  const stocksAfter = await prisma.stock.findMany();

  const latestAnalyses = await prisma.analysis.findMany({
    where: { ticker: { in: stocksAfter.map((s) => s.ticker) } },
    orderBy: [{ ticker: "asc" }, { date: "desc" }],
    distinct: ["ticker"],
  });
  const latestAnalysisDateByTicker = new Map(
    latestAnalyses.map((a) => [a.ticker, a.date])
  );

  const newEntries = findNewTargetPriceHits(
    stocksBefore.map((s) => ({
      ticker: s.ticker,
      name: s.name,
      price: s.lastPrice,
      targetPrice: s.targetPrice,
    })),
    stocksAfter.map((s) => ({
      ticker: s.ticker,
      name: s.name,
      price: s.lastPrice,
      targetPrice: s.targetPrice,
    }))
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

  let emailSent = false;

  if (newEntries.length > 0 || staleAnalyses.length > 0) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Equity Tracker <onboarding@resend.dev>",
      to: process.env.DIGEST_EMAIL_TO!,
      subject: "Equity Tracker Daily Digest",
      html: buildDigestEmailHtml(newEntries, staleAnalyses),
    });
    emailSent = true;
  }

  return Response.json({
    success: true,
    updated: updated.length,
    failed: failed.length,
    newEntries: newEntries.length,
    staleAnalyses: staleAnalyses.length,
    emailSent,
  });
}
