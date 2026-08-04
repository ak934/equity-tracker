export interface AnalysisStockInput {
  ticker: string;
  latestAnalysisDate?: Date | null;
}

export interface DigestStaleAnalysis {
  ticker: string;
  name: string;
  latestAnalysisDate?: Date | null;
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

export function buildDigestEmailHtml(staleAnalyses: DigestStaleAnalysis[]): string {
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
      ${staleAnalysesSection}
    </div>
  `;
}
