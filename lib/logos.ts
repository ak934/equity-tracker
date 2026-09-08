import { after } from "next/server";
import { prisma } from "@/lib/prisma";

export type CachedLogo = { imageData: Uint8Array<ArrayBuffer>; contentType: string };

type MetaLookup =
  | { ok: true; logoUrl: string | null } // API answered — genuinely has (or lacks) a logo
  | { ok: false }; // couldn't get an answer (rate limited, network error, etc.)

async function fetchLogoMeta(ticker: string): Promise<MetaLookup> {
  const apiKey = process.env.MASSIVE_API_KEY;
  try {
    const res = await fetch(`https://api.massive.com/v3/reference/tickers/${ticker}?apiKey=${apiKey ?? ""}`);
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
    const res = await fetch(`${logoUrl}${separator}apiKey=${apiKey ?? ""}`);
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
// on every view. Any failure along the way (metadata lookup rate limited,
// or the image fetch itself rate limited) leaves no cache row at all,
// rather than locking in a false "no logo" — it's simply retried on the
// next view instead.
export async function resolveAndCacheLogo(ticker: string): Promise<CachedLogo | null> {
  const meta = await fetchLogoMeta(ticker);
  if (!meta.ok) return null;

  if (!meta.logoUrl) {
    await prisma.tickerLogo.upsert({
      where: { ticker },
      create: { ticker, logoUrl: null },
      update: { logoUrl: null, imageData: null, contentType: null },
    });
    return null;
  }

  const image = await fetchLogoImage(meta.logoUrl);
  if (!image) return null;

  await prisma.tickerLogo.upsert({
    where: { ticker },
    create: { ticker, logoUrl: meta.logoUrl, imageData: image.imageData, contentType: image.contentType },
    update: { logoUrl: meta.logoUrl, imageData: image.imageData, contentType: image.contentType },
  });
  return image;
}

// Looks up which of these tickers have a cached logo, without ever calling
// the external API inline — any ticker seen for the first time is resolved
// in the background (via after()) and simply shows the fallback initials
// badge until the next load, once it's cached.
export async function getLogoAvailability(tickers: string[]): Promise<Map<string, boolean>> {
  const unique = Array.from(new Set(tickers)).filter(Boolean);
  if (unique.length === 0) return new Map();

  const cached = await prisma.tickerLogo.findMany({ where: { ticker: { in: unique } } });
  const result = new Map(cached.map((c) => [c.ticker, c.imageData != null]));

  const missing = unique.filter((t) => !result.has(t));
  if (missing.length > 0) {
    after(async () => {
      // One at a time, not Promise.all — this API is tightly rate limited
      // (see lib/prices.ts), and firing every missing ticker on a page at
      // once is exactly what triggers that limit.
      for (const ticker of missing) {
        await resolveAndCacheLogo(ticker);
      }
    });
  }

  return result;
}
