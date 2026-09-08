import { prisma } from "@/lib/prisma";
import { resolveAndCacheLogo } from "@/lib/logos";

// Real US tickers are 1-6 letters, optionally with a share-class suffix
// like "BRK.B" (same shape check used in lib/prices.ts) — rejecting
// anything else up front avoids wasting a price-API call on junk input.
const TICKER_SHAPE_RE = /^[A-Z]{1,6}(\.[A-Z]{1,2})?$/;

// Unauthenticated on purpose: this only ever serves a public company logo
// image (no user data), and the logged-out marketing page needs it too.
// The upstream branding image requires the price API's key to fetch, so
// this proxies it server-side rather than ever handing that key to the
// browser — see lib/logos.ts.
export async function GET(_request: Request, { params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const upper = ticker.trim().toUpperCase();
  if (!TICKER_SHAPE_RE.test(upper)) {
    return new Response(null, { status: 400 });
  }

  const cached = await prisma.tickerLogo.findUnique({ where: { ticker: upper } });
  const logoUrl = cached ? cached.logoUrl : await resolveAndCacheLogo(upper);

  if (!logoUrl) {
    return new Response(null, { status: 404 });
  }

  const apiKey = process.env.MASSIVE_API_KEY;
  const separator = logoUrl.includes("?") ? "&" : "?";
  const upstream = await fetch(`${logoUrl}${separator}apiKey=${apiKey ?? ""}`);

  if (!upstream.ok || !upstream.body) {
    return new Response(null, { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/png",
      "Cache-Control": "public, max-age=604800, immutable",
    },
  });
}
