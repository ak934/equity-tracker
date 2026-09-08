import { after } from "next/server";
import { prisma } from "@/lib/prisma";

async function fetchHomepageDomain(ticker: string): Promise<string | null> {
  const apiKey = process.env.MASSIVE_API_KEY;
  try {
    const res = await fetch(`https://api.massive.com/v3/reference/tickers/${ticker}?apiKey=${apiKey ?? ""}`);
    if (!res.ok) return null;

    const data = await res.json();
    const homepage: string | undefined = data?.results?.homepage_url;
    if (!homepage) return null;

    return new URL(homepage).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

// A ticker's domain never changes day to day, so this only ever runs once
// per ticker (cached in TickerDomain) — the price API's free tier is
// tightly rate limited (see lib/prices.ts), so calling this on every page
// view instead of caching would burn through it immediately.
async function resolveAndCacheDomain(ticker: string): Promise<void> {
  const domain = await fetchHomepageDomain(ticker);
  await prisma.tickerDomain.upsert({
    where: { ticker },
    create: { ticker, domain },
    update: { domain },
  });
}

// Looks up cached logo domains for a batch of tickers without ever calling
// the external API inline — any ticker seen for the first time is resolved
// in the background (via after()) and simply shows the fallback initials
// badge until the next load, once it's cached.
export async function getLogoDomains(tickers: string[]): Promise<Map<string, string | null>> {
  const unique = Array.from(new Set(tickers)).filter(Boolean);
  if (unique.length === 0) return new Map();

  const cached = await prisma.tickerDomain.findMany({ where: { ticker: { in: unique } } });
  const result = new Map(cached.map((c) => [c.ticker, c.domain]));

  const missing = unique.filter((t) => !result.has(t));
  if (missing.length > 0) {
    after(async () => {
      await Promise.all(missing.map((ticker) => resolveAndCacheDomain(ticker)));
    });
  }

  return result;
}
