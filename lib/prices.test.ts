import { describe, it, expect, afterEach, vi } from "vitest";
import { getRecentTradingDate, getMostRecentPossibleTradingDate, toDateParam } from "./prices";

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
