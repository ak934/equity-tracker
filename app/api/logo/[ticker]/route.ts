import { prisma } from "@/lib/prisma";
import { resolveAndCacheLogo } from "@/lib/logos";

// Real US tickers are 1-6 letters, optionally with a share-class suffix
// like "BRK.B" (same shape check used in lib/prices.ts) — rejecting
// anything else up front avoids wasting a price-API call on junk input.
const TICKER_SHAPE_RE = /^[A-Z]{1,6}(\.[A-Z]{1,2})?$/;

// Unauthenticated on purpose: this only ever serves a public company logo
// image (no user data), and the logged-out marketing page needs it too.
// Always serves cached bytes (see lib/logos.ts) — never re-fetches the
// upstream image on every view, since that alone was enough to trip the
// price API's tight rate limit whenever a page showed several logos.
export async function GET(_request: Request, { params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const upper = ticker.trim().toUpperCase();
  if (!TICKER_SHAPE_RE.test(upper)) {
    return new Response(null, { status: 400 });
  }

  const cached = await prisma.tickerLogo.findUnique({ where: { ticker: upper } });
  const logo = cached?.imageData
    ? { imageData: cached.imageData, contentType: cached.contentType ?? "image/png" }
    : cached
      ? null // already resolved once — genuinely has no logo, don't refetch
      : await resolveAndCacheLogo(upper);

  if (!logo) {
    return new Response(null, { status: 404 });
  }

  return new Response(new Uint8Array(logo.imageData), {
    headers: {
      "Content-Type": logo.contentType,
      "Cache-Control": "public, max-age=604800, immutable",
    },
  });
}
