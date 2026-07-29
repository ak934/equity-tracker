"use client";

import { useEffect, useRef, useState } from "react";
import { searchStockTickers } from "@/app/actions/stocks";
import { Input } from "@/components/ui/input";

export type TickerResult = {
  ticker: string;
  name: string;
};

const MIN_QUERY_LENGTH = 2;
const RATE_LIMIT_COOLDOWN_MS = 15_000;

export function TickerSearchInput({
  onSelectionChange,
}: {
  onSelectionChange?: (selected: TickerResult | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TickerResult[]>([]);
  const [selected, setSelected] = useState<TickerResult | null>(null);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [rateLimited, setRateLimited] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const cacheRef = useRef(new Map<string, TickerResult[]>());
  const cooldownUntilRef = useRef(0);

  useEffect(() => {
    if (selected || query.trim().length < MIN_QUERY_LENGTH) {
      setResults([]);
      return;
    }

    const key = query.trim().toLowerCase();
    const cached = cacheRef.current.get(key);
    if (cached) {
      setResults(cached);
      setOpen(cached.length > 0);
      setHighlighted(0);
      return;
    }

    if (Date.now() < cooldownUntilRef.current) {
      return;
    }

    let cancelled = false;
    const handle = setTimeout(async () => {
      const { results: matches, rateLimited: limited } = await searchStockTickers(query);
      if (cancelled) return;

      if (limited) {
        cooldownUntilRef.current = Date.now() + RATE_LIMIT_COOLDOWN_MS;
        setRateLimited(true);
        setTimeout(() => setRateLimited(false), RATE_LIMIT_COOLDOWN_MS);
        return;
      }

      cacheRef.current.set(key, matches);
      setResults(matches);
      setOpen(matches.length > 0);
      setHighlighted(0);
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, selected]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function pick(result: TickerResult) {
    setSelected(result);
    setQuery(`${result.ticker} — ${result.name}`);
    setResults([]);
    setOpen(false);
    onSelectionChange?.(result);
  }

  function handleChange(value: string) {
    setQuery(value);
    if (selected) {
      setSelected(null);
      onSelectionChange?.(null);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(results[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative flex-1">
      <Input
        type="text"
        placeholder="Enter symbol or company name"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => results.length > 0 && setOpen(true)}
        required
        autoComplete="off"
      />
      <input type="hidden" name="ticker" value={selected?.ticker ?? ""} />
      <input type="hidden" name="name" value={selected?.name ?? ""} />
      {rateLimited && (
        <p className="absolute mt-1 text-xs text-muted-foreground">
          Search is rate-limited — try again in a few seconds.
        </p>
      )}
      {open && results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-lg border bg-background shadow-md">
          {results.map((r, i) => (
            <li
              key={r.ticker}
              className={`cursor-pointer px-2.5 py-1.5 text-sm ${
                i === highlighted ? "bg-neutral-100" : ""
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(r);
              }}
              onMouseEnter={() => setHighlighted(i)}
            >
              <span className="font-medium">{r.ticker}</span>{" "}
              <span className="text-neutral-500">{r.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
