import { getBuyZoneStatus } from "./buy-zone";

export interface BuyZoneStockInput {
  ticker: string;
  price: number | null | undefined;
  buyZoneLow: number | null | undefined;
  buyZoneHigh: number | null | undefined;
}

export interface AnalysisStockInput {
  ticker: string;
  latestAnalysisDate?: Date | null;
}

export interface DigestBuyZoneEntry {
  ticker: string;
  name: string;
  price: number | null | undefined;
}

export interface DigestStaleAnalysis {
  ticker: string;
  name: string;
  latestAnalysisDate?: Date | null;
}

export function findNewBuyZoneEntries<T extends BuyZoneStockInput>(
  stocksBefore: T[],
  stocksAfter: T[]
): T[] {
  const beforeByTicker = new Map(stocksBefore.map((s) => [s.ticker, s]));

  return stocksAfter.filter((after) => {
    const before = beforeByTicker.get(after.ticker);
    // no prior snapshot to compare against, so we can't call this "new"
    if (!before) return false;

    const beforeStatus = getBuyZoneStatus({
      price: before.price,
      low: before.buyZoneLow,
      high: before.buyZoneHigh,
    });
    const afterStatus = getBuyZoneStatus({
      price: after.price,
      low: after.buyZoneLow,
      high: after.buyZoneHigh,
    });

    return beforeStatus !== "in" && afterStatus === "in";
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

export function buildDigestEmailHtml(
  newEntries: DigestBuyZoneEntry[],
  staleAnalyses: DigestStaleAnalysis[]
): string {
  const newEntriesSection = newEntries.length
    ? `
      <h2>New Buy Zone Entries</h2>
      <ul>
        ${newEntries
          .map(
            (s) =>
              `<li>${s.ticker} (${s.name}) — $${s.price ?? "?"}</li>`
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
