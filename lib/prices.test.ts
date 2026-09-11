import { describe, it, expect, afterEach, vi } from "vitest";
import { getRecentTradingDate, getMostRecentPossibleTradingDate, toDateParam, searchTickers } from "./prices";

function mockTickersResponse(results: unknown[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results }),
    })
  );
}

describe("searchTickers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps two different companies that share a ticker (different cik)", async () => {
    mockTickersResponse([
      { ticker: "DUP", name: "Old Reused Co", type: "CS", cik: "0000000001", primary_exchange: "XNAS" },
      { ticker: "DUP", name: "New Reused Co", type: "CS", cik: "0000000002", primary_exchange: "XNYS" },
    ]);

    const results = await searchTickers("DUP");

    expect(results).toEqual([
      { ticker: "DUP", name: "Old Reused Co", cik: "0000000001", exchange: "XNAS" },
      { ticker: "DUP", name: "New Reused Co", cik: "0000000002", exchange: "XNYS" },
    ]);
  });

  it("collapses duplicate listing rows for the same company (same cik)", async () => {
    mockTickersResponse([
      { ticker: "DUP", name: "Same Co", type: "CS", cik: "0000000001", primary_exchange: "XNAS" },
      { ticker: "DUP", name: "Same Co (alt row)", type: "CS", cik: "0000000001", primary_exchange: "XNAS" },
    ]);

    const results = await searchTickers("DUP");

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      ticker: "DUP",
      name: "Same Co",
      cik: "0000000001",
      exchange: "XNAS",
    });
  });
});

describe("getRecentTradingDate", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the prior weekday on a Tuesday", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-04T13:00:00-04:00")); // Tuesday, 1pm ET
    expect(toDateParam(getRecentTradingDate())).toBe("2026-08-03"); // Monday
  });

  it("skips the weekend when today is Monday", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-03T13:00:00-04:00")); // Monday, 1pm ET
    expect(toDateParam(getRecentTradingDate())).toBe("2026-07-31"); // Friday
  });

  it("skips the weekend when today is Sunday", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-02T13:00:00-04:00")); // Sunday
    expect(toDateParam(getRecentTradingDate())).toBe("2026-07-31"); // Friday
  });
});

describe("getMostRecentPossibleTradingDate", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("stays on yesterday before market close on a weekday", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-04T13:00:00-04:00")); // Tuesday, 1pm ET
    expect(toDateParam(getMostRecentPossibleTradingDate())).toBe("2026-08-03");
  });

  it("advances to today right at market close on a weekday", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-04T16:00:00-04:00")); // Tuesday, 4:00pm ET
    expect(toDateParam(getMostRecentPossibleTradingDate())).toBe("2026-08-04");
  });

  it("advances to today after market close on a weekday", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-04T20:00:00-04:00")); // Tuesday, 8pm ET
    expect(toDateParam(getMostRecentPossibleTradingDate())).toBe("2026-08-04");
  });

  it("does not advance to today on a weekend, even after 4pm ET", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-02T20:00:00-04:00")); // Sunday, 8pm ET
    expect(toDateParam(getMostRecentPossibleTradingDate())).toBe("2026-07-31");
  });

  it("stays on yesterday just before the 4pm ET boundary", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-04T15:59:00-04:00")); // Tuesday, 3:59pm ET
    expect(toDateParam(getMostRecentPossibleTradingDate())).toBe("2026-08-03");
  });
});
