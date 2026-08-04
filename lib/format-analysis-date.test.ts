import { describe, it, expect } from "vitest";
import { formatAnalysisDate } from "./format-analysis-date";

describe("formatAnalysisDate", () => {
  it("shows just the date when there's only one analysis that day, in the viewer's timezone", () => {
    // 2026-01-15 01:00 UTC is still 2026-01-14 evening in US/Pacific
    const date = new Date("2026-01-15T01:00:00.000Z");
    const result = formatAnalysisDate(date, [date], "America/Los_Angeles");
    expect(result).toBe(date.toLocaleDateString(undefined, { timeZone: "America/Los_Angeles" }));
    expect(result).not.toContain(":");
  });

  it("includes the time when two analyses land on the same calendar day in the viewer's timezone", () => {
    const morning = new Date("2026-01-15T14:00:00.000Z");
    const afternoon = new Date("2026-01-15T20:00:00.000Z");
    const result = formatAnalysisDate(morning, [morning, afternoon], "America/New_York");
    expect(result).toContain(":");
  });

  it("a date that is the same UTC day but a different calendar day in the viewer's timezone is not grouped together", () => {
    // 2026-01-15 02:00 UTC is 2026-01-14 18:00 in Los Angeles (UTC-8 in January)
    const lateUtcPrevDayLocal = new Date("2026-01-15T02:00:00.000Z");
    // 2026-01-15 14:00 UTC is 2026-01-15 06:00 in Los Angeles — a different LA calendar day
    const sameUtcDayDifferentLocalDay = new Date("2026-01-15T14:00:00.000Z");

    const result = formatAnalysisDate(
      lateUtcPrevDayLocal,
      [lateUtcPrevDayLocal, sameUtcDayDifferentLocalDay],
      "America/Los_Angeles"
    );
    // these two dates are NOT the same LA calendar day, so no time should be appended
    expect(result).not.toContain(":");
  });

  it("two dates that are different UTC days but the SAME calendar day in the viewer's timezone are grouped together", () => {
    // 2026-01-15 03:00 UTC is 2026-01-14 19:00 in Los Angeles
    const a = new Date("2026-01-15T03:00:00.000Z");
    // 2026-01-14 23:00 UTC is also 2026-01-14 15:00 in Los Angeles — same LA calendar day as `a`
    const b = new Date("2026-01-14T23:00:00.000Z");

    const result = formatAnalysisDate(a, [a, b], "America/Los_Angeles");
    expect(result).toContain(":");
  });
});
