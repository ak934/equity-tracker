"use client";

import { useState } from "react";

// Deliberately not imported from lib/logos.ts — that module pulls in
// next/server's after(), which can't be bundled into a client component.
function faviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(domain)}`;
}

export function StockLogo({
  ticker,
  domain,
  size = 24,
  className = "",
}: {
  ticker: string;
  domain?: string | null;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!domain || failed) {
    return (
      <span
        className={`flex shrink-0 items-center justify-center rounded-full bg-secondary text-[0.55rem] font-semibold text-secondary-foreground ${className}`}
        style={{ width: size, height: size }}
      >
        {ticker.slice(0, 4)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={faviconUrl(domain)}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 rounded-full bg-secondary object-contain ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
