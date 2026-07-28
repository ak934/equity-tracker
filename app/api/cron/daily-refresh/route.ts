import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { refreshAllPrices } from "@/lib/prices";
import {
  findNewBuyZoneEntries,
  findStaleAnalyses,
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

  const newEntries = findNewBuyZoneEntries(
    stocksBefore.map((s) => ({
      ticker: s.ticker,
      name: s.name,
      price: s.lastPrice,
      buyZoneLow: s.buyZoneLow,
      buyZoneHigh: s.buyZoneHigh,
    })),
    stocksAfter.map((s) => ({
      ticker: s.ticker,
      name: s.name,
      price: s.lastPrice,
      buyZoneLow: s.buyZoneLow,
      buyZoneHigh: s.buyZoneHigh,
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
