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

// NYSE trading days are defined in US/Eastern, so anchor to that calendar
// date (as a UTC-midnight Date) instead of the server's local timezone —
// otherwise this drifts by a day depending on where/when the app runs.
function getEasternToday(): Date {
  const { year, month, day } = getEasternDateParts(new Date());
  return new Date(Date.UTC(year, month - 1, day));
}

function isTradingWeekday(d: Date): boolean {
  return d.getUTCDay() !== 0 && d.getUTCDay() !== 6;
}

// NYSE regular-session close (ignoring rare early-close days, same
// granularity the holiday handling elsewhere in this file already accepts).
// Before this, Massive/Polygon reliably 403s any request for today's date
// ("before end of day") — so gating on it avoids burning a whole extra API
// call, per stock, on every refresh throughout the trading day for a
// request we already know will fail.
const MARKET_CLOSE_HOUR_ET = 16;

function isAfterMarketCloseToday(): boolean {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(new Date()).find((p) => p.type === "hour")?.value;
  return Number(hour) >= MARKET_CLOSE_HOUR_ET;
}

export function getRecentTradingDate(): Date {
  // free tier can't get today's close until end of day (see getPrice), so
  // this is the latest date we're guaranteed to already be able to fetch.
  const d = getEasternToday();
  d.setUTCDate(d.getUTCDate() - 1);
  while (!isTradingWeekday(d)) {
    d.setUTCDate(d.getUTCDate() - 1); // skip Sat/Sun
  }
  return d;
}

function canTodayHaveData(today: Date): boolean {
  return isTradingWeekday(today) && isAfterMarketCloseToday();
}

// The newest date that could possibly have data available right now: today,
// once the market's closed, or otherwise the last confirmed trading day.
// Used to decide whether a refresh is even worth attempting — it doesn't
// guarantee today's close is ready yet, just that it's not impossible.
export function getMostRecentPossibleTradingDate(): Date {
  const today = getEasternToday();
  return canTodayHaveData(today) ? today : getRecentTradingDate();
}

async function fetchOpenClose(ticker: string, date: Date) {
  const apiKey = process.env.MASSIVE_API_KEY;
  const url = `https://api.massive.com/v1/open-close/${ticker}/${toDateParam(date)}?adjusted=true&apiKey=${apiKey}`;
  return fetch(url);
}

export async function getPrice(ticker: string): Promise<PriceResult> {
  // Try today first, but only once the market's plausibly closed — before
  // that, Massive/Polygon always 403s ("before end of day"), so attempting
  // it would just be a wasted API call on every refresh throughout the
  // trading day. Once it's worth trying, this saves the app from waiting a
  // full extra day for data that's already available.
  const today = getEasternToday();
  if (canTodayHaveData(today)) {
    try {
      const res = await fetchOpenClose(ticker, today);
      if (res.ok) {
        const data = await res.json();
        if (typeof data?.close === "number") {
          return { ticker, price: data.close, asOf: today };
        }
      }
    } catch {
      // network hiccup — fall through to the fallback below
    }
  }

  const date = getRecentTradingDate();

  // step back further on market holidays (e.g. July 4th), which the
  // weekday check above doesn't account for
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetchOpenClose(ticker, date);

    if (res.status === 404) {
      date.setUTCDate(date.getUTCDate() - 1);
      while (!isTradingWeekday(date)) {
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
  const targetDate = toDateParam(getMostRecentPossibleTradingDate());
  const updated: Stock[] = [];
  const failed: string[] = [];

  for (const stock of stocks) {
    // already priced for the newest date that could possibly have data,
    // skip the API call entirely to avoid burning the API's per-minute
    // rate limit — this only skips once we actually have today's close,
    // not merely because we tried and it wasn't ready yet
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
