import { describe, it, expect } from "vitest"
import { getBuyZoneStatus } from "./buy-zone"

describe("getBuyZoneStatus", () => {
    it("returns 'below' when price is under the low bound", () => {
        expect(getBuyZoneStatus({price: 90, low: 100, high: 120})).toBe("below");
    });
    it("returns 'above' when price is over the high bound", () => {
        expect(getBuyZoneStatus({ price: 130, low: 100, high: 120})).toBe("above");
    });
    it("returns 'in' when price is between the bounds", () => {
        expect(getBuyZoneStatus({price: 110, low:100, high:120 })).toBe("in");
    });
    it("treats the low boundary as inside the zone", () => {
        expect(getBuyZoneStatus({price: 100, low:100, high:120 })).toBe("in");
    });
    it("treats the high boundary as inside the zone", () => {
        expect(getBuyZoneStatus({price: 120, low:100, high:120 })).toBe("in");
    });
    it("returns 'unknown' when the price is missing", () => {
        expect(getBuyZoneStatus({price: null, low:100, high:120 })).toBe("unknown");
    });
    it("returns 'unknown' when buy zone bounds are missing", () => {
        expect(getBuyZoneStatus({price: 110, low:null, high:null })).toBe("unknown");
    });
});