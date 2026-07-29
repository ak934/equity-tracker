import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  findNewTargetPriceHits,
  findStaleAnalyses,
  computeReanalysisFlagUpdates,
  type TargetPriceStockInput,
  type AnalysisStockInput,
  type ReanalysisFlagStockInput,
} from "./digest";

describe("findNewTargetPriceHits", () => {
  it("excludes a stock that stays above its target", () => {
    const before: TargetPriceStockInput[] = [
      { ticker: "AAA", price: 130, targetPrice: 120 },
    ];
    const after: TargetPriceStockInput[] = [
      { ticker: "AAA", price: 125, targetPrice: 120 },
    ];
    expect(findNewTargetPriceHits(before, after)).toEqual([]);
  });

  it("includes a stock that drops to its target", () => {
    const before: TargetPriceStockInput[] = [
      { ticker: "BBB", price: 130, targetPrice: 120 },
    ];
    const after: TargetPriceStockInput[] = [
      { ticker: "BBB", price: 115, targetPrice: 120 },
    ];
    expect(findNewTargetPriceHits(before, after)).toEqual(after);
  });

  it("excludes a stock that was already at/below its target before (not new)", () => {
    const before: TargetPriceStockInput[] = [
      { ticker: "CCC", price: 110, targetPrice: 120 },
    ];
    const after: TargetPriceStockInput[] = [
      { ticker: "CCC", price: 105, targetPrice: 120 },
    ];
    expect(findNewTargetPriceHits(before, after)).toEqual([]);
  });

  it("handles a stock missing from the before array without crashing", () => {
    const before: TargetPriceStockInput[] = [];
    const after: TargetPriceStockInput[] = [
      { ticker: "DDD", price: 110, targetPrice: 120 },
    ];
    expect(() => findNewTargetPriceHits(before, after)).not.toThrow();
    expect(findNewTargetPriceHits(before, after)).toEqual([]);
  });

  it("handles a stock missing from the after array without crashing", () => {
    const before: TargetPriceStockInput[] = [
      { ticker: "EEE", price: 130, targetPrice: 120 },
    ];
    const after: TargetPriceStockInput[] = [];
    expect(() => findNewTargetPriceHits(before, after)).not.toThrow();
    expect(findNewTargetPriceHits(before, after)).toEqual([]);
  });
});

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
