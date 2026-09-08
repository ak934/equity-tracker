import { after } from "next/server";
import { prisma } from "@/lib/prisma";

// The price API's branding image itself requires the API key to fetch (see
// fetchLogoBytes below) — never return this raw URL to the browser, always
// proxy it through app/api/logo/[ticker]/route.ts.
export async function fetchLogoUrl(ticker: string): Promise<string | null> {
  const apiKey = process.env.MASSIVE_API_KEY;
  try {
    const res = await fetch(`https://api.massive.com/v3/reference/tickers/${ticker}?apiKey=${apiKey ?? ""}`);
    if (!res.ok) return null;

    const data = await res.json();
    const branding = data?.results?.branding;
    return branding?.icon_url ?? branding?.logo_url ?? null;
  } catch {
    return null;
  }
}

// A ticker's logo never changes day to day, so this only ever runs once
// per ticker (cached in TickerLogo) — the price API's free tier is
// tightly rate limited (see lib/prices.ts), so calling this on every page
// view instead of caching would burn through it immediately.
export async function resolveAndCacheLogo(ticker: string): Promise<string | null> {
  const logoUrl = await fetchLogoUrl(ticker);
  await prisma.tickerLogo.upsert({
    where: { ticker },
    create: { ticker, logoUrl },
    update: { logoUrl },
  });
  return logoUrl;
}

// Looks up which of these tickers have a cached logo, without ever calling
// the external API inline — any ticker seen for the first time is resolved
// in the background (via after()) and simply shows the fallback initials
// badge until the next load, once it's cached. Callers only get a boolean:
// the actual logoUrl requires the API key and is never sent to the browser
// (see app/api/logo/[ticker]/route.ts, which serves the image itself).
export async function getLogoAvailability(tickers: string[]): Promise<Map<string, boolean>> {
  const unique = Array.from(new Set(tickers)).filter(Boolean);
  if (unique.length === 0) return new Map();

  const cached = await prisma.tickerLogo.findMany({ where: { ticker: { in: unique } } });
  const result = new Map(cached.map((c) => [c.ticker, c.logoUrl != null]));

  const missing = unique.filter((t) => !result.has(t));
  if (missing.length > 0) {
    after(async () => {
      await Promise.all(missing.map((ticker) => resolveAndCacheLogo(ticker)));
    });
  }

  return result;
}
