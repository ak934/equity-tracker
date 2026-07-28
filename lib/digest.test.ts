import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  findNewBuyZoneEntries,
  findStaleAnalyses,
  type BuyZoneStockInput,
  type AnalysisStockInput,
} from "./digest";

describe("findNewBuyZoneEntries", () => {
  it("excludes a stock that stays out of zone", () => {
    const before: BuyZoneStockInput[] = [
      { ticker: "AAA", price: 90, buyZoneLow: 100, buyZoneHigh: 120 },
    ];
    const after: BuyZoneStockInput[] = [
      { ticker: "AAA", price: 95, buyZoneLow: 100, buyZoneHigh: 120 },
    ];
    expect(findNewBuyZoneEntries(before, after)).toEqual([]);
  });

  it("includes a stock that enters the zone", () => {
    const before: BuyZoneStockInput[] = [
      { ticker: "BBB", price: 90, buyZoneLow: 100, buyZoneHigh: 120 },
    ];
    const after: BuyZoneStockInput[] = [
      { ticker: "BBB", price: 110, buyZoneLow: 100, buyZoneHigh: 120 },
    ];
    expect(findNewBuyZoneEntries(before, after)).toEqual(after);
  });

  it("excludes a stock that was already in zone before (not new)", () => {
    const before: BuyZoneStockInput[] = [
      { ticker: "CCC", price: 110, buyZoneLow: 100, buyZoneHigh: 120 },
    ];
    const after: BuyZoneStockInput[] = [
      { ticker: "CCC", price: 115, buyZoneLow: 100, buyZoneHigh: 120 },
    ];
    expect(findNewBuyZoneEntries(before, after)).toEqual([]);
  });

  it("handles a stock missing from the before array without crashing", () => {
    const before: BuyZoneStockInput[] = [];
    const after: BuyZoneStockInput[] = [
      { ticker: "DDD", price: 110, buyZoneLow: 100, buyZoneHigh: 120 },
    ];
    expect(() => findNewBuyZoneEntries(before, after)).not.toThrow();
    expect(findNewBuyZoneEntries(before, after)).toEqual([]);
  });

  it("handles a stock missing from the after array without crashing", () => {
    const before: BuyZoneStockInput[] = [
      { ticker: "EEE", price: 90, buyZoneLow: 100, buyZoneHigh: 120 },
    ];
    const after: BuyZoneStockInput[] = [];
    expect(() => findNewBuyZoneEntries(before, after)).not.toThrow();
    expect(findNewBuyZoneEntries(before, after)).toEqual([]);
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
});
