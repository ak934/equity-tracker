import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  findStaleAnalyses,
  computeReanalysisFlagUpdates,
  computeEarningsWatchReason,
  type AnalysisStockInput,
  type ReanalysisFlagStockInput,
  type EarningsWatchStockInput,
} from "./digest";

describe("findStaleAnalyses", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-28T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("includes a stock with no analysis at all", () => {
    const stocks: AnalysisStockInput[] = [
      { ticker: "AAA", latestAnalysisDate: null },
    ];
    expect(findStaleAnalyses(stocks)).toEqual(stocks);
  });

  it("treats a stock exactly at the 60-day boundary as stale", () => {
    // documented behavior: age >= daysThreshold counts as stale
    const boundaryDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const stocks: AnalysisStockInput[] = [
      { ticker: "BBB", latestAnalysisDate: boundaryDate },
    ];
    expect(findStaleAnalyses(stocks, 60)).toEqual(stocks);
  });

  it("excludes a stock with a recent analysis", () => {
    const recentDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const stocks: AnalysisStockInput[] = [
      { ticker: "CCC", latestAnalysisDate: recentDate },
    ];
    expect(findStaleAnalyses(stocks, 60)).toEqual([]);
  });

  it("excludes a stock analyzed 59 days ago (just under the threshold)", () => {
    const justUnder = new Date(Date.now() - 59 * 24 * 60 * 60 * 1000);
    const stocks: AnalysisStockInput[] = [
      { ticker: "DDD", latestAnalysisDate: justUnder },
    ];
    expect(findStaleAnalyses(stocks, 60)).toEqual([]);
  });

  it("includes a stock analyzed 61 days ago (just over the threshold)", () => {
    const justOver = new Date(Date.now() - 61 * 24 * 60 * 60 * 1000);
    const stocks: AnalysisStockInput[] = [
      { ticker: "EEE", latestAnalysisDate: justOver },
    ];
    expect(findStaleAnalyses(stocks, 60)).toEqual(stocks);
  });
});

describe("computeReanalysisFlagUpdates", () => {
  it("flags a stale stock that isn't already flagged", () => {
    const stocks: ReanalysisFlagStockInput[] = [
      { ticker: "AAA", needsReanalysis: false, reanalysisReason: null },
    ];
    expect(computeReanalysisFlagUpdates(stocks, ["AAA"])).toEqual({
      newlyStale: ["AAA"],
      toClear: [],
    });
  });

  it("clears a stock that is no longer stale and wasn't manually flagged", () => {
    const stocks: ReanalysisFlagStockInput[] = [
      { ticker: "BBB", needsReanalysis: true, reanalysisReason: "stale" },
    ];
    expect(computeReanalysisFlagUpdates(stocks, [])).toEqual({
      newlyStale: [],
      toClear: ["BBB"],
    });
  });

  it("leaves a manually-flagged stock alone when it is not stale", () => {
    const stocks: ReanalysisFlagStockInput[] = [
      { ticker: "CCC", needsReanalysis: true, reanalysisReason: "manual" },
    ];
    expect(computeReanalysisFlagUpdates(stocks, [])).toEqual({
      newlyStale: [],
      toClear: [],
    });
  });

  it("does not overwrite reanalysisReason from 'manual' to 'stale' when a manually-flagged stock also becomes stale", () => {
    // regression test: a stock that is already flagged (for any reason) must
    // be skipped entirely by the stale branch, so an existing "manual"
    // reason is never clobbered just because the analysis also aged out
    const stocks: ReanalysisFlagStockInput[] = [
      { ticker: "AMZN", needsReanalysis: true, reanalysisReason: "manual" },
    ];
    expect(computeReanalysisFlagUpdates(stocks, ["AMZN"])).toEqual({
      newlyStale: [],
      toClear: [],
    });
  });
});

describe("computeEarningsWatchReason", () => {
  const now = new Date("2026-07-28T00:00:00.000Z");

  it("flags 'earnings' when the next earnings date is today", () => {
    const stock: EarningsWatchStockInput = {
      ticker: "AAA",
      needsReanalysis: false,
      nextEarningsDate: now,
      hasMaterialNews: false,
    };
    expect(computeEarningsWatchReason(stock, now)).toBe("earnings");
  });

  it("flags 'earnings' when the next earnings date is within the 5-day window", () => {
    const stock: EarningsWatchStockInput = {
      ticker: "BBB",
      needsReanalysis: false,
      nextEarningsDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      hasMaterialNews: false,
    };
    expect(computeEarningsWatchReason(stock, now)).toBe("earnings");
  });

  it("does not flag when the next earnings date is beyond the window", () => {
    const stock: EarningsWatchStockInput = {
      ticker: "CCC",
      needsReanalysis: false,
      nextEarningsDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
      hasMaterialNews: false,
    };
    expect(computeEarningsWatchReason(stock, now)).toBeNull();
  });

  it("does not flag when the next earnings date is in the past", () => {
    const stock: EarningsWatchStockInput = {
      ticker: "DDD",
      needsReanalysis: false,
      nextEarningsDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      hasMaterialNews: false,
    };
    expect(computeEarningsWatchReason(stock, now)).toBeNull();
  });

  it("flags 'news' when there's material news and no near-term earnings date", () => {
    const stock: EarningsWatchStockInput = {
      ticker: "EEE",
      needsReanalysis: false,
      nextEarningsDate: null,
      hasMaterialNews: true,
    };
    expect(computeEarningsWatchReason(stock, now)).toBe("news");
  });

  it("prefers 'earnings' over 'news' when both apply", () => {
    const stock: EarningsWatchStockInput = {
      ticker: "FFF",
      needsReanalysis: false,
      nextEarningsDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      hasMaterialNews: true,
    };
    expect(computeEarningsWatchReason(stock, now)).toBe("earnings");
  });

  it("returns null when neither an upcoming earnings date nor material news exist", () => {
    const stock: EarningsWatchStockInput = {
      ticker: "GGG",
      needsReanalysis: false,
      nextEarningsDate: null,
      hasMaterialNews: false,
    };
    expect(computeEarningsWatchReason(stock, now)).toBeNull();
  });

  it("leaves an already-flagged stock alone even if it's within the earnings window", () => {
    const stock: EarningsWatchStockInput = {
      ticker: "HHH",
      needsReanalysis: true,
      nextEarningsDate: now,
      hasMaterialNews: true,
    };
    expect(computeEarningsWatchReason(stock, now)).toBeNull();
  });
});
