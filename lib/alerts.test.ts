import { describe, it, expect } from "vitest";
import {
  findNewTargetPriceHits,
  buildTargetPriceHitEmailHtml,
  type TargetPriceStockInput,
} from "./alerts";

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

describe("buildTargetPriceHitEmailHtml", () => {
  it("renders the buy-now line for each hit", () => {
    const html = buildTargetPriceHitEmailHtml([
      { ticker: "AAPL", name: "Apple", price: 150, targetPrice: 150 },
    ]);
    expect(html).toContain("AAPL Stock has hit the $150. Buy now!");
  });
});
