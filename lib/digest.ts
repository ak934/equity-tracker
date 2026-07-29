import { hasHitTargetPrice } from "./target-price";

export interface TargetPriceStockInput {
  ticker: string;
  price: number | null | undefined;
  targetPrice: number | null | undefined;
}

export interface AnalysisStockInput {
  ticker: string;
  latestAnalysisDate?: Date | null;
}

export interface DigestTargetPriceHit {
  ticker: string;
  name: string;
  price: number | null | undefined;
  targetPrice: number | null | undefined;
}

export interface DigestStaleAnalysis {
  ticker: string;
  name: string;
  latestAnalysisDate?: Date | null;
}

export function findNewTargetPriceHits<T extends TargetPriceStockInput>(
  stocksBefore: T[],
  stocksAfter: T[]
): T[] {
  const beforeByTicker = new Map(stocksBefore.map((s) => [s.ticker, s]));

  return stocksAfter.filter((after) => {
    const before = beforeByTicker.get(after.ticker);
    // no prior snapshot to compare against, so we can't call this "new"
    if (!before) return false;

    const beforeHit = hasHitTargetPrice({
      price: before.price,
      targetPrice: before.targetPrice,
    });
    const afterHit = hasHitTargetPrice({
      price: after.price,
      targetPrice: after.targetPrice,
    });

    return !beforeHit && afterHit;
  });
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// A stock exactly `daysThreshold` days old is treated as stale (>=, not >),
// so the digest surfaces analyses the moment they cross the threshold
// rather than waiting an extra day.
export function findStaleAnalyses<T extends AnalysisStockInput>(
  stocks: T[],
  daysThreshold = 60
): T[] {
  const now = Date.now();

  return stocks.filter((stock) => {
    if (!stock.latestAnalysisDate) return true;
    const ageInDays = (now - stock.latestAnalysisDate.getTime()) / MS_PER_DAY;
    return ageInDays >= daysThreshold;
  });
}

export interface ReanalysisFlagStockInput {
  ticker: string;
  needsReanalysis: boolean;
  reanalysisReason?: string | null;
}

export interface ReanalysisFlagUpdates {
  newlyStale: string[];
  toClear: string[];
}

// Decides which tickers the daily stale-check should flag/clear.
// A stock already flagged for ANY reason (manual or stale) is left alone
// entirely by the stale branch, so an existing "manual" reason is never
// overwritten with "stale" just because the analysis also aged out.
export function computeReanalysisFlagUpdates(
  stocks: ReanalysisFlagStockInput[],
  staleTickers: string[]
): ReanalysisFlagUpdates {
  const staleSet = new Set(staleTickers);
  const newlyStale: string[] = [];
  const toClear: string[] = [];

  for (const stock of stocks) {
    if (staleSet.has(stock.ticker)) {
      if (!stock.needsReanalysis) {
        newlyStale.push(stock.ticker);
      }
    } else if (stock.reanalysisReason !== "manual") {
      // a manual flag isn't date-based, so not being stale doesn't resolve
      // it — only a fresh analysis run should clear that one
      toClear.push(stock.ticker);
    }
  }

  return { newlyStale, toClear };
}

export function buildDigestEmailHtml(
  newEntries: DigestTargetPriceHit[],
  staleAnalyses: DigestStaleAnalysis[]
): string {
  const newEntriesSection = newEntries.length
    ? `
      <h2>Target Price Hit</h2>
      <ul>
        ${newEntries
          .map(
            (s) =>
              `<li>${s.ticker} (${s.name}) — $${s.price ?? "?"} (target $${s.targetPrice ?? "?"})</li>`
          )
          .join("\n")}
      </ul>
    `
    : "";

  const staleAnalysesSection = staleAnalyses.length
    ? `
      <h2>Stale Analyses</h2>
      <ul>
        ${staleAnalyses
          .map(
            (s) =>
              `<li>${s.ticker} (${s.name}) — last analyzed ${
                s.latestAnalysisDate
                  ? s.latestAnalysisDate.toISOString().split("T")[0]
                  : "never"
              }</li>`
          )
          .join("\n")}
      </ul>
    `
    : "";

  return `
    <div>
      ${newEntriesSection}
      ${staleAnalysesSection}
    </div>
  `;
}
