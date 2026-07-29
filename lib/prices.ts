import { prisma } from "@/lib/prisma";
import type { Stock } from "@/generated/prisma/client";

export type PriceResult = {
  ticker: string;
  price: number;
  asOf: Date;
};

export type RefreshAllPricesResult = {
  updated: Stock[];
  failed: string[];
};

export type TickerSearchResult = {
  ticker: string;
  name: string;
};

export class TickerSearchError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const DISPLAY_LIMIT = 8;

// fetched from the API in the API's own relevance order, which tends to bury
// the actual company under leveraged/derivative ETFs that merely reference
// it by name (e.g. searching "TSLA" surfaces "GraniteShares Autocallable
// TSLA ETF" ahead of Tesla itself) — so a bigger batch is pulled and
// re-ranked locally before trimming down to what's shown.
const FETCH_LIMIT = 25;

function rank(r: { ticker: string; type?: string }, normalizedQuery: string): number {
  const isExactTicker = r.ticker.toUpperCase() === normalizedQuery;
  const isCommonStock = r.type === "CS";
  if (isExactTicker && isCommonStock) return 0;
  if (isExactTicker) return 1;
  if (isCommonStock) return 2;
  return 3;
}

export async function searchTickers(query: string): Promise<TickerSearchResult[]> {
  const apiKey = process.env.MASSIVE_API_KEY;
  const url = `https://api.massive.com/v3/reference/tickers?search=${encodeURIComponent(query)}&active=true&limit=${FETCH_LIMIT}&apiKey=${apiKey}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new TickerSearchError(`Massive API error searching tickers: ${res.status}`, res.status);
  }

  const data = await res.json();
  const results: Array<{ ticker: string; name?: string; type?: string }> = data?.results ?? [];
  const normalizedQuery = query.trim().toUpperCase();

  return results
    .filter((r): r is { ticker: string; name: string; type?: string } => Boolean(r.name))
    .sort((a, b) => rank(a, normalizedQuery) - rank(b, normalizedQuery))
    .slice(0, DISPLAY_LIMIT)
    .map((r) => ({ ticker: r.ticker, name: r.name }));
}

export function toDateParam(d: Date): string {
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
}

function getEasternDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return { year: Number(map.year), month: Number(map.month), day: Number(map.day) };
}

export function getRecentTradingDate(): Date {
  // free tier is end-of-day data, so we start from yesterday, not today.
  // NYSE trading days are defined in US/Eastern, so anchor to that calendar
  // date (as a UTC-midnight Date) instead of the server's local timezone —
  // otherwise this drifts by a day depending on where/when the app runs.
  const { year, month, day } = getEasternDateParts(new Date());
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() - 1);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) {
    d.setUTCDate(d.getUTCDate() - 1); // skip Sat/Sun
  }
  return d;
}

async function fetchOpenClose(ticker: string, date: Date) {
  const apiKey = process.env.MASSIVE_API_KEY;
  const url = `https://api.massive.com/v1/open-close/${ticker}/${toDateParam(date)}?adjusted=true&apiKey=${apiKey}`;
  return fetch(url);
}

export async function getPrice(ticker: string): Promise<PriceResult> {
  const date = getRecentTradingDate();

  // step back further on market holidays (e.g. July 4th), which the
  // weekday check above doesn't account for
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetchOpenClose(ticker, date);

    if (res.status === 404) {
      date.setUTCDate(date.getUTCDate() - 1);
      while (date.getUTCDay() === 0 || date.getUTCDay() === 6) {
        date.setUTCDate(date.getUTCDate() - 1);
      }
      continue;
    }

    if (!res.ok) {
      throw new Error(`Massive API error for ${ticker}: ${res.status}`);
    }

    const data = await res.json();
    const price = data?.close;

    if (typeof price !== "number") {
      throw new Error(`No price available for ${ticker}`);
    }

    return {
      ticker,
      price,
      asOf: new Date(date),
    };
  }

  throw new Error(`No trading data found for ${ticker} in the last 5 attempts`);
}

export async function refreshAllPrices(): Promise<RefreshAllPricesResult> {
  const stocks = await prisma.stock.findMany();
  const targetDate = toDateParam(getRecentTradingDate());
  const updated: Stock[] = [];
  const failed: string[] = [];

  for (const stock of stocks) {
    // already priced for the latest trading day, skip the API call
    // entirely to avoid burning the API's per-minute rate limit
    if (stock.priceAsOf && toDateParam(stock.priceAsOf) === targetDate) {
      continue;
    }
    try {
      const { price, asOf } = await getPrice(stock.ticker);
      const stock_ = await prisma.stock.update({
        where: { id: stock.id },
        data: { lastPrice: price, priceAsOf: asOf },
      });
      updated.push(stock_);
    } catch (err) {
      console.error(`Failed to refresh ${stock.ticker}:`, err);
      failed.push(stock.ticker);
    }
  }

  return { updated, failed };
}
