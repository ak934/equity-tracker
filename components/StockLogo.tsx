"use client";

import { useState } from "react";

export function StockLogo({
  ticker,
  hasLogo,
  size = 24,
  className = "",
}: {
  ticker: string;
  hasLogo?: boolean;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!hasLogo || failed) {
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
      src={`/api/logo/${encodeURIComponent(ticker)}`}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 rounded-full bg-secondary object-contain ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
