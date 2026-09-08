import { after } from "next/server";
import { prisma } from "@/lib/prisma";

export type CachedLogo = { imageData: Uint8Array<ArrayBuffer>; contentType: string };

type MetaLookup =
  | { ok: true; logoUrl: string | null } // API answered — genuinely has (or lacks) a logo
  | { ok: false }; // couldn't get an answer (rate limited, network error, etc.)

type ResolveOutcome =
  | { status: "found"; logo: CachedLogo }
  | { status: "not_found" } // API answered — this ticker genuinely has no logo
  | { status: "failed" }; // rate limited / errored — tells nothing either way

// Bounds a single HTTP call so one slow/hanging request can't single-
// handedly blow past RESOLVE_BUDGET_MS below.
const FETCH_TIMEOUT_MS = 2500;

async function fetchLogoMeta(ticker: string): Promise<MetaLookup> {
  const apiKey = process.env.MASSIVE_API_KEY;
  try {
    const res = await fetch(`https://api.massive.com/v3/reference/tickers/${ticker}?apiKey=${apiKey ?? ""}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    // A non-OK response (429 rate limit, 5xx, etc.) means the API didn't
    // actually tell us whether this ticker has a logo — treating that the
    // same as "no logo" would wrongly cache the failure forever.
    if (!res.ok) return { ok: false };

    const data = await res.json();
    const branding = data?.results?.branding;
    return { ok: true, logoUrl: branding?.icon_url ?? branding?.logo_url ?? null };
  } catch {
    return { ok: false };
  }
}

async function fetchLogoImage(logoUrl: string): Promise<CachedLogo | null> {
  const apiKey = process.env.MASSIVE_API_KEY;
  const separator = logoUrl.includes("?") ? "&" : "?";
  try {
    const res = await fetch(`${logoUrl}${separator}apiKey=${apiKey ?? ""}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;

    // Uint8Array's constructor infers the more general ArrayBufferLike (to
    // allow for SharedArrayBuffer) unless pinned explicitly — a real HTTP
    // response body is always a plain ArrayBuffer, which is what Prisma's
    // Bytes field expects.
    const imageData = new Uint8Array<ArrayBuffer>(await res.arrayBuffer());
    return { imageData, contentType: res.headers.get("content-type") ?? "image/png" };
  } catch {
    return null;
  }
}

// A ticker's logo never changes day to day, so this only ever needs to
// succeed once per ticker — the image bytes themselves are cached (not
// just the upstream URL), so a page with several stocks never re-fetches
// from the price API's tightly rate-limited free tier (see lib/prices.ts)
// on every view. A "failed" outcome leaves no cache row at all, rather
// than locking in a false "no logo" — it's simply retried on the next
// view instead.
async function resolveLogo(ticker: string): Promise<ResolveOutcome> {
  const meta = await fetchLogoMeta(ticker);
  if (!meta.ok) return { status: "failed" };

  if (!meta.logoUrl) {
    await prisma.tickerLogo.upsert({
      where: { ticker },
      create: { ticker, logoUrl: null },
      update: { logoUrl: null, imageData: null, contentType: null },
    });
    return { status: "not_found" };
  }

  const image = await fetchLogoImage(meta.logoUrl);
  if (!image) return { status: "failed" };

  await prisma.tickerLogo.upsert({
    where: { ticker },
    create: { ticker, logoUrl: meta.logoUrl, imageData: image.imageData, contentType: image.contentType },
    update: { logoUrl: meta.logoUrl, imageData: image.imageData, contentType: image.contentType },
  });
  return { status: "found", logo: image };
}

export async function resolveAndCacheLogo(ticker: string): Promise<CachedLogo | null> {
  const outcome = await resolveLogo(ticker);
  return outcome.status === "found" ? outcome.logo : null;
}

// Total time this call will block waiting on never-before-seen tickers to
// resolve, so a logo shows up on the very first view instead of requiring
// a reload. Once a ticker is cached this never applies again — reads below
// are then a plain DB lookup — so this only ever costs anything on a
// ticker's first appearance anywhere in the app.
const RESOLVE_BUDGET_MS = 3000;

// Looks up which of these tickers have a cached logo. Anything already
// cached resolves instantly (a DB read). A ticker seen for the first time
// is resolved right now, within a shared time budget, so it's ready on
// this render rather than needing a reload — whatever doesn't finish in
// time (including everything after the first rate-limit failure, since
// further attempts in the same burst are doomed too) keeps resolving in
// the background (via after()) instead.
export async function getLogoAvailability(tickers: string[]): Promise<Map<string, boolean>> {
  const unique = Array.from(new Set(tickers)).filter(Boolean);
  if (unique.length === 0) return new Map();

  const cached = await prisma.tickerLogo.findMany({ where: { ticker: { in: unique } } });
  const result = new Map(cached.map((c) => [c.ticker, c.imageData != null]));

  const missing = unique.filter((t) => !result.has(t));
  if (missing.length === 0) return result;

  // One at a time, not Promise.all — this API is tightly rate limited (see
  // lib/prices.ts), and firing every missing ticker on a page at once is
  // exactly what triggers that limit.
  const deadline = Date.now() + RESOLVE_BUDGET_MS;
  let cursor = 0;
  while (cursor < missing.length && Date.now() < deadline) {
    const outcome = await resolveLogo(missing[cursor]);
    if (outcome.status === "failed") break; // rate limited — stop burning the budget on doomed calls

    result.set(missing[cursor], outcome.status === "found");
    cursor++;
  }

  const deferred = missing.slice(cursor);
  if (deferred.length > 0) {
    after(async () => {
      for (const ticker of deferred) {
        await resolveLogo(ticker);
      }
    });
  }

  return result;
}
